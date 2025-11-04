import { z } from "zod";
import { router, publicProcedure } from "../index";

/**
 * 리스크 관리 라우터
 * Module 3: 리스크 관리 시스템 (P2 - 사업관리)
 */
export const riskRouter = router({
	/**
	 * 경고 상태 투자 건 목록 조회
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
		.query(async ({ input }) => {
			// TODO: DB에서 실제 데이터 조회
			return {
				items: [] as Array<{
					projectId: string;
					projectName: string;
					companyName: string;
					totalInvestment: number;
					recoupRate: number;
					contractPeriod: number;
					elapsedPeriod: number;
					isWarning: boolean;
				}>,
				total: 0,
				page: input.page,
				pageSize: input.pageSize,
			};
		}),

	/**
	 * 특정 프로젝트의 리스크 상세 정보 조회
	 * @param input 프로젝트 ID
	 * @returns 리스크 상세 정보 및 최근 3개월 회수액 추이
	 */
	getRiskDetail: publicProcedure
		.input(z.object({ projectId: z.string() }))
		.query(async ({ input }) => {
			// TODO: DB에서 실제 데이터 조회
			return {
				projectId: input.projectId,
				totalInvestment: 0,
				currentRecoupRate: 0,
				contractPeriod: 0,
				extendedPeriod: 0,
				companyName: "",
				recentMonths: [] as Array<{
					yyyymm: string;
					recoupAmount: number;
				}>,
			};
		}),
});

