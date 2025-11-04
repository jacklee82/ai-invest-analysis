import { z } from "zod";
import { router, publicProcedure } from "../index";
import { project, cashflowMonthly } from "@my-better-t-app/db";
import { sql, and, gte, desc, eq } from "drizzle-orm";

/**
 * 리스크 관리 라우터
 * Module 3: 리스크 관리 시스템 (P2 - 사업관리)
 */
export const riskRouter = router({
	/**
	 * 경고 상태 투자 건 목록 조회
	 * 경고 조건: (경과 기간 > 총 계약 기간 / 2) && (회수율 < 0.5)
	 * @param input 페이지네이션 정보
	 * @returns 경고 상태인 투자 건 목록
	 */
	listWarnings: publicProcedure
		.input(
			z.object({
				page: z.number().min(1).default(1),
				pageSize: z.number().min(1).max(100).default(20),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { db } = ctx;

			if (!db) {
				throw new Error("데이터베이스 연결이 없습니다.");
			}

			// 모든 프로젝트 조회
			const allProjects = await db.select().from(project);
			const now = new Date();

			// 경고 상태 계산 및 필터링
			const warningProjects = allProjects
				.map((p) => {
					// 총 계약 기간 계산
					const totalContractMonths = p.baseContractMonths + p.extendedMonths;
					
					// 경과 기간 계산 (개월 단위)
					const contractStart = new Date(p.contractStartDate);
					const elapsedMonths = 
						(now.getFullYear() - contractStart.getFullYear()) * 12 +
						(now.getMonth() - contractStart.getMonth());
					
					// 총 투자금 계산
					const totalInvestment = p.initialInvestment + p.additionalInvestment;
					
					// 회수율 계산
					const recoupRate = totalInvestment > 0 
						? p.totalRecouped / totalInvestment 
						: 0;
					
					// 경과 비율 계산
					const elapsedRatio = totalContractMonths > 0 
						? elapsedMonths / totalContractMonths 
						: 0;
					
					// 경고 조건: (경과 기간 > 총 계약 기간 / 2) && (회수율 < 0.5)
					const isWarning = elapsedRatio > 0.5 && recoupRate < 0.5;

					return {
						projectId: p.projectId,
						projectName: p.projectName,
						companyName: p.companyName,
						totalInvestment,
						recoupRate: recoupRate * 100, // 퍼센트로 변환
						contractPeriod: totalContractMonths,
						elapsedPeriod: elapsedMonths,
						contractStartDate: p.contractStartDate,
						isWarning,
					};
				})
				.filter((p) => p.isWarning)
				.sort((a, b) => {
					// 우선순위: 경과 비율 높은 순, 회수율 낮은 순
					const aElapsedRatio = a.elapsedPeriod / a.contractPeriod;
					const bElapsedRatio = b.elapsedPeriod / b.contractPeriod;
					if (Math.abs(aElapsedRatio - bElapsedRatio) > 0.01) {
						return bElapsedRatio - aElapsedRatio;
					}
					return a.recoupRate - b.recoupRate;
				});

			// 페이지네이션 적용
			const startIndex = (input.page - 1) * input.pageSize;
			const endIndex = startIndex + input.pageSize;
			const paginatedItems = warningProjects.slice(startIndex, endIndex);

			return {
				items: paginatedItems,
				total: warningProjects.length,
				page: input.page,
				pageSize: input.pageSize,
				totalPages: Math.ceil(warningProjects.length / input.pageSize),
			};
		}),

	/**
	 * 특정 프로젝트의 리스크 상세 정보 조회
	 * @param input 프로젝트 ID
	 * @returns 리스크 상세 정보 및 최근 3개월 회수액 추이
	 */
	getRiskDetail: publicProcedure
		.input(z.object({ projectId: z.string() }))
		.query(async ({ ctx, input }) => {
			const { db } = ctx;

			if (!db) {
				throw new Error("데이터베이스 연결이 없습니다.");
			}

			// 프로젝트 정보 조회
			const projectData = await db
				.select()
				.from(project)
				.where(eq(project.projectId, input.projectId))
				.limit(1);

			if (projectData.length === 0) {
				throw new Error("프로젝트를 찾을 수 없습니다.");
			}

			const p = projectData[0];
			const totalInvestment = p.initialInvestment + p.additionalInvestment;
			const recoupRate = totalInvestment > 0 
				? (p.totalRecouped / totalInvestment) * 100 
				: 0;

			// 최근 3개월 회수액 추이 조회
			const now = new Date();
			const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
			const yyyymmStart = `${threeMonthsAgo.getFullYear()}-${String(threeMonthsAgo.getMonth() + 1).padStart(2, "0")}`;

			const recentCashflows = await db
				.select({
					yyyymm: cashflowMonthly.yyyymm,
					recoupAmount: cashflowMonthly.recoupAmount,
				})
				.from(cashflowMonthly)
				.where(
					and(
						eq(cashflowMonthly.projectId, input.projectId),
						sql`${cashflowMonthly.yyyymm} >= ${yyyymmStart}`,
					),
				)
				.orderBy(cashflowMonthly.yyyymm);

			return {
				projectId: p.projectId,
				projectName: p.projectName,
				companyName: p.companyName,
				totalInvestment,
				currentRecoupRate: recoupRate,
				contractPeriod: p.baseContractMonths,
				extendedPeriod: p.extendedMonths,
				totalContractPeriod: p.baseContractMonths + p.extendedMonths,
				contractStartDate: p.contractStartDate,
				recentMonths: recentCashflows.map((cf) => ({
					yyyymm: cf.yyyymm,
					recoupAmount: Number(cf.recoupAmount),
				})),
			};
		}),
});

