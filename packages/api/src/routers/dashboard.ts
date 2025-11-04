import { z } from "zod";
import { router, publicProcedure } from "../index";
import { project, cashflowMonthly } from "@my-better-t-app/db";
import { sql } from "drizzle-orm";

/**
 * 대시보드 라우터
 * Module 1: 통합 대시보드 (P1 - 경영진)
 */
export const dashboardRouter = router({
	/**
	 * 핵심 지표 요약 조회
	 * @returns 총계 3지표 + YoY 증감률
	 */
	getSummary: publicProcedure.query(async ({ ctx }) => {
		const { db } = ctx;

		// 총 투자금 계산
		const totalInvestmentResult = await db
			.select({
				total: sql<number>`sum(${project.initialInvestment} + ${project.additionalInvestment})`,
			})
			.from(project);

		const totalInvestment =
			Number(totalInvestmentResult[0]?.total) || 0;

		// 총 회수금 계산
		const totalRecoupedResult = await db
			.select({
				total: sql<number>`sum(${project.totalRecouped})`,
			})
			.from(project);

		const totalRecouped = Number(totalRecoupedResult[0]?.total) || 0;

		// 회수율 계산
		const recoupRate =
			totalInvestment > 0 ? (totalRecouped / totalInvestment) * 100 : 0;

		// 리스크 건수 계산 (경고 상태)
		// TODO: risk_flag 테이블에서 실제 경고 건수 조회
		const riskCount = 0;

		// YoY 계산 (전년 동월 대비)
		// TODO: 전년 데이터와 비교하여 증감률 계산
		const yoy = {
			totalInvestment: 0,
			recoupRate: 0,
			riskCount: 0,
		};

		return {
			totalInvestment,
			recoupRate: Math.round(recoupRate * 100) / 100,
			riskCount,
			yoy,
		};
	}),

	/**
	 * 사업별 성과 비교
	 * @returns 4대 사업(선급투자, 일반투자, OST, 음반)별 매출/이익/이익률
	 */
	getBusinessComparison: publicProcedure.query(async ({ ctx }) => {
		const { db } = ctx;

		// 사업별로 그룹화하여 집계
		const businessStats = await db
			.select({
				businessType: project.businessType,
				totalInvestment: sql<number>`sum(${project.initialInvestment} + ${project.additionalInvestment})`,
				totalRecouped: sql<number>`sum(${project.totalRecouped})`,
			})
			.from(project)
			.groupBy(project.businessType);

		// 월별 현금흐름 집계 (매출 = revenue, 원가 = cost)
		const monthlyRevenue = await db
			.select({
				projectId: cashflowMonthly.projectId,
				revenue: sql<number>`sum(${cashflowMonthly.revenueAmount})`,
				cost: sql<number>`sum(${cashflowMonthly.costAmount})`,
			})
			.from(cashflowMonthly)
			.groupBy(cashflowMonthly.projectId);

		// 프로젝트별 매출/원가 매핑
		const revenueMap = new Map(
			monthlyRevenue.map((r) => [r.projectId, r]),
		);

		// 프로젝트별 매출/원가 정보 조회
		const projects = await db.select().from(project);

		// 사업별 매출/원가 집계
		const businessRevenueMap = new Map<string, { revenue: number; cost: number }>();

		projects.forEach((proj) => {
			const monthly = revenueMap.get(proj.projectId);
			if (!monthly) return;

			const existing = businessRevenueMap.get(proj.businessType) || {
				revenue: 0,
				cost: 0,
			};
			businessRevenueMap.set(proj.businessType, {
				revenue: existing.revenue + Number(monthly.revenue),
				cost: existing.cost + Number(monthly.cost),
			});
		});

		// 결과 생성
		return businessStats.map((stat) => {
			const businessType = stat.businessType;
			const revenue = businessRevenueMap.get(businessType)?.revenue || 0;
			const cost = businessRevenueMap.get(businessType)?.cost || 0;

			// 이익 계산 (사업별 로직)
			let profit = 0;
			if (businessType === "선급투자") {
				const totalInvestment =
					Number(stat.totalInvestment) || 0;
				const totalRecouped = Number(stat.totalRecouped) || 0;
				profit = totalRecouped - totalInvestment;
			} else if (businessType === "일반투자") {
				profit = revenue - cost;
			} else if (businessType === "음반") {
				// TODO: 음반 매입원가 활용
				profit = revenue - cost;
			} else if (businessType === "OST") {
				profit = revenue - cost;
			}

			const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

			return {
				businessType,
				revenue,
				profit,
				margin: Math.round(margin * 100) / 100,
			};
		});
	}),

	/**
	 * 월별 추세 데이터 조회
	 * @returns 월별 매출/이익/이익률 추세
	 */
	getTrends: publicProcedure.query(async ({ ctx }) => {
		const { db } = ctx;

		// 월별 매출/원가 집계
		const monthlyStats = await db
			.select({
				yyyymm: cashflowMonthly.yyyymm,
				revenue: sql<number>`sum(${cashflowMonthly.revenueAmount})`,
				cost: sql<number>`sum(${cashflowMonthly.costAmount})`,
			})
			.from(cashflowMonthly)
			.groupBy(cashflowMonthly.yyyymm)
			.orderBy(cashflowMonthly.yyyymm);

		return monthlyStats.map((stat) => {
			const revenue = Number(stat.revenue) || 0;
			const cost = Number(stat.cost) || 0;
			const profit = revenue - cost;
			const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

			return {
				yyyymm: stat.yyyymm,
				revenue,
				profit,
				margin: Math.round(margin * 100) / 100,
			};
		});
	}),
});

