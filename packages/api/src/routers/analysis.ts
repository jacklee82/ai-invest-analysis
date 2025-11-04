import { z } from "zod";
import { router, publicProcedure } from "../index";

/**
 * 심층 분석 라우터
 * Module 4: 심층 분석 (P2 - 사업관리)
 */
export const analysisRouter = router({
	/**
	 * 차트인 가치 추정
	 * @returns 차트 100위권 1주 평균 가치 추정
	 */
	getChartValue: publicProcedure.query(async () => {
		// TODO: DB에서 실제 데이터 조회 및 회귀 분석
		return {
			averageValue: 0,
			regressionModel: {
				r2: 0,
				rmse: 0,
			},
		};
	}),

	/**
	 * 차트인으로 가장 많은 수익을 낸 곡 Top 10
	 * @returns Top 10 곡 리스트
	 */
	getTopChartTracks: publicProcedure.query(async () => {
		// TODO: DB에서 실제 데이터 조회
		return [] as Array<{
			trackId: string;
			title: string;
			artist: string;
			chartRevenue: number;
			chartedWeeks: number;
		}>;
	}),

	/**
	 * 기획사 ROI 비교
	 * @param input 정렬 기준 (투자금액 큰 순 / 계약 만료일 임박 순)
	 * @returns 선급투자를 받은 기획사들의 ROI 비교
	 */
	getCompanyROI: publicProcedure
		.input(
			z.object({
				sortBy: z.enum(["investment", "expiry"]).default("investment"),
			}),
		)
		.query(async ({ input }) => {
			// TODO: DB에서 실제 데이터 조회
			return [] as Array<{
				companyId: string;
				companyName: string;
				totalInvestment: number;
				totalRecouped: number;
				roi: number;
				expiryDate: string | null;
			}>;
		}),
});

