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
			// FastAPI 예측 서비스 연동 (현재는 더미 데이터로 동작)
			// TODO: 실제 FastAPI 서비스 연동
			// const fastApiUrl = process.env.FASTAPI_URL || "http://localhost:8000";
			// const response = await fetch(`${fastApiUrl}/forecast`, {
			// 	method: "POST",
			// 	headers: { "Content-Type": "application/json" },
			// 	body: JSON.stringify({
			// 		series: input.series,
			// 		months: input.months,
			// 		model: input.model,
			// 	}),
			// });
			// const apiResult = await response.json();

			// 더미 데이터: 간단한 선형 감소 추세로 예측
			const average = input.series.reduce((a, b) => a + b, 0) / input.series.length;
			const trend = (input.series[input.series.length - 1] - input.series[0]) / input.series.length;
			
			const moderate: number[] = [];
			for (let i = 0; i < input.months; i++) {
				// 선형 감소 추세 적용
				const value = average + trend * (i + 1);
				moderate.push(Math.max(0, value));
			}

			// Worst CF = Moderate CF * 0.9
			const worst = moderate.map((v) => v * 0.9);
			
			// Best CF = Moderate CF * 1.1
			const best = moderate.map((v) => v * 1.1);

			return {
				moderate,
				worst,
				best,
				dcf: {
					worst: 0, // 클라이언트에서 계산
					moderate: 0,
					best: 0,
				},
				bep: null, // 클라이언트에서 계산
				meta: {
					model: input.model === "auto" ? "linear" : input.model,
					rmse: 0.1,
					mape: 5.0,
				},
			};
		}),
});

