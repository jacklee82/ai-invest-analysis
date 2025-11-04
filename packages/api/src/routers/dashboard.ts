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

		if (!db) {
			throw new Error("데이터베이스 연결이 없습니다.");
		}

		// 프로젝트 개수 확인
		const projectCount = await db.select().from(project);
		console.log("[Dashboard] 프로젝트 개수:", projectCount.length);

		// 총 투자금 계산
		const totalInvestmentResult = await db
			.select({
				total: sql<number>`COALESCE(sum(${project.initialInvestment} + ${project.additionalInvestment}), 0)`,
			})
			.from(project);

		// PostgreSQL의 sum은 문자열로 반환할 수 있으므로 명시적으로 변환
		const totalInvestment = totalInvestmentResult[0]?.total 
			? Number(totalInvestmentResult[0].total) 
			: 0;
		
		console.log("[Dashboard] 총 투자금 쿼리 결과:", totalInvestmentResult);
		console.log("[Dashboard] 총 투자금 (변환 후):", totalInvestment, typeof totalInvestment);

		// 총 회수금 계산
		const totalRecoupedResult = await db
			.select({
				total: sql<number>`COALESCE(sum(${project.totalRecouped}), 0)`,
			})
			.from(project);

		// PostgreSQL의 sum은 문자열로 반환할 수 있으므로 명시적으로 변환
		const totalRecouped = totalRecoupedResult[0]?.total 
			? Number(totalRecoupedResult[0].total) 
			: 0;
		console.log("[Dashboard] 총 회수금 쿼리 결과:", totalRecoupedResult);
		console.log("[Dashboard] 총 회수금 (변환 후):", totalRecouped, typeof totalRecouped);

		// 회수율 계산
		const recoupRate =
			totalInvestment > 0 ? (totalRecouped / totalInvestment) * 100 : 0;
		console.log("[Dashboard] 회수율:", recoupRate);

		// 리스크 건수 계산 (경고 상태)
		// 경고 조건: (경과 기간 > 총 계약 기간 / 2) && (회수율 < 0.5)
		const allProjects = await db.select().from(project);
		const now = new Date();
		const riskCount = allProjects.filter((p) => {
			const totalContractMonths = p.baseContractMonths + p.extendedMonths;
			const contractStart = new Date(p.contractStartDate);
			const elapsedMonths = 
				(now.getFullYear() - contractStart.getFullYear()) * 12 +
				(now.getMonth() - contractStart.getMonth());
			const totalInvestment = p.initialInvestment + p.additionalInvestment;
			const recoupRate = totalInvestment > 0 
				? p.totalRecouped / totalInvestment 
				: 0;
			const elapsedRatio = totalContractMonths > 0 
				? elapsedMonths / totalContractMonths 
				: 0;
			return elapsedRatio > 0.5 && recoupRate < 0.5;
		}).length;

		// YoY 계산 (전년 동월 대비)
		// TODO: 전년 데이터와 비교하여 증감률 계산
		const yoy = {
			totalInvestment: 0,
			recoupRate: 0,
			riskCount: 0,
		};

		const result = {
			totalInvestment: Number(totalInvestment),
			recoupRate: Math.round(recoupRate * 100) / 100,
			riskCount: Number(riskCount),
			yoy,
		};
		
		console.log("[Dashboard] getSummary 반환값:", result);
		return result;
	}),

	/**
	 * 사업별 성과 비교
	 * @returns 4대 사업(선급투자, 일반투자, OST, 음반)별 매출/이익/이익률
	 */
	getBusinessComparison: publicProcedure.query(async ({ ctx }) => {
		const { db } = ctx;

		if (!db) {
			throw new Error("데이터베이스 연결이 없습니다.");
		}

		// 사업별로 그룹화하여 집계
		const businessStats = await db
			.select({
				businessType: project.businessType,
				totalInvestment: sql<number>`COALESCE(sum(${project.initialInvestment} + ${project.additionalInvestment}), 0)`,
				totalRecouped: sql<number>`COALESCE(sum(${project.totalRecouped}), 0)`,
			})
			.from(project)
			.groupBy(project.businessType);
		
		console.log("[Dashboard] 사업별 통계 개수:", businessStats.length);

		// 월별 현금흐름 집계 (매출 = revenue, 원가 = cost)
		const monthlyRevenue = await db
			.select({
				projectId: cashflowMonthly.projectId,
				revenue: sql<number>`COALESCE(sum(${cashflowMonthly.revenueAmount}), 0)`,
				cost: sql<number>`COALESCE(sum(${cashflowMonthly.costAmount}), 0)`,
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
		const result = businessStats.map((stat) => {
			const businessType = stat.businessType;
			const revenue = Number(businessRevenueMap.get(businessType)?.revenue || 0);
			const cost = Number(businessRevenueMap.get(businessType)?.cost || 0);

			// 이익 계산 (사업별 로직)
			let profit = 0;
			if (businessType === "선급투자") {
				// PostgreSQL sum은 문자열로 반환할 수 있으므로 명시적 변환
				const totalInvestment = Number(stat.totalInvestment) || 0;
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
				revenue: Number(revenue),
				profit: Number(profit),
				margin: Math.round(margin * 100) / 100,
			};
		});
		
		console.log("[Dashboard] getBusinessComparison 반환값:", result);
		return result;
	}),

	/**
	 * 월별 추세 데이터 조회
	 * @returns 월별 매출/이익/이익률 추세
	 */
	getTrends: publicProcedure.query(async ({ ctx }) => {
		const { db } = ctx;

		if (!db) {
			throw new Error("데이터베이스 연결이 없습니다.");
		}

		// 월별 매출/원가 집계
		const monthlyStats = await db
			.select({
				yyyymm: cashflowMonthly.yyyymm,
				revenue: sql<number>`COALESCE(sum(${cashflowMonthly.revenueAmount}), 0)`,
				cost: sql<number>`COALESCE(sum(${cashflowMonthly.costAmount}), 0)`,
			})
			.from(cashflowMonthly)
			.groupBy(cashflowMonthly.yyyymm)
			.orderBy(cashflowMonthly.yyyymm);
		
		console.log("[Dashboard] 월별 추세 데이터 개수:", monthlyStats.length);

		const result = monthlyStats.map((stat) => {
			const revenue = Number(stat.revenue) || 0;
			const cost = Number(stat.cost) || 0;
			const profit = revenue - cost;
			const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

			return {
				yyyymm: stat.yyyymm,
				revenue: Number(revenue),
				profit: Number(profit),
				margin: Math.round(margin * 100) / 100,
			};
		});
		
		console.log("[Dashboard] getTrends 반환값 개수:", result.length);
		return result;
	}),
});

