import { z } from "zod";
import { router, publicProcedure } from "../index";

/**
 * 시뮬레이션 라우터
 * Module 2: 선급투자 시뮬레이터 (P3 - 투자심사)
 */
export const simulationRouter = router({
	/**
	 * 구보 투자 시뮬레이션 예측
	 * @param input 최근 12개월 수익 데이터, 계약 기간, 모델 선택
	 * @returns 예상 현금흐름 및 DCF/BEP 계산 결과
	 */
	forecast: publicProcedure
		.input(
			z.object({
				series: z.array(z.number()).length(12),
				months: z.number().min(1).max(36),
				model: z.enum(["auto", "arima", "prophet"]).default("auto"),
			}),
		)
		.mutation(async ({ input }) => {
			// TODO: FastAPI 예측 서비스 연동
			// TODO: Moderate CF 받아서 Worst/Best 계산
			// TODO: WACC 적용하여 DCF 계산
			// TODO: BEP 계산

			return {
				moderate: [] as number[],
				worst: [] as number[],
				best: [] as number[],
				dcf: {
					worst: 0,
					moderate: 0,
					best: 0,
				},
				bep: null as number | null,
				meta: {
					model: input.model,
					rmse: 0,
					mape: 0,
				},
			};
		}),
});

