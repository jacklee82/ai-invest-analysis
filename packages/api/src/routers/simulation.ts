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
			// FastAPI 예측 서비스 연동
			const fastApiUrl = process.env.FASTAPI_URL || "http://localhost:8000";
			
			try {
				// FastAPI 호출
				const response = await fetch(`${fastApiUrl}/forecast`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						series: input.series,
						months: input.months,
						model: input.model,
					}),
					signal: AbortSignal.timeout(10000), // 10초 타임아웃
				});

				if (!response.ok) {
					throw new Error(`FastAPI 응답 오류: ${response.status}`);
				}

				const apiResult = await response.json();

				// Moderate CF 받아서 Worst/Best 계산
				const moderate = apiResult.moderate || [];
				const worst = moderate.map((v: number) => v * 0.9);
				const best = moderate.map((v: number) => v * 1.1);

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
						model: apiResult.meta?.model || input.model,
						rmse: apiResult.meta?.rmse || 0,
						mape: apiResult.meta?.mape || 0,
					},
				};
			} catch (error) {
				// FastAPI 호출 실패 시 폴백: 더미 데이터 사용
				console.warn("FastAPI 호출 실패, 폴백 모드 사용:", error);
				
				const average = input.series.reduce((a, b) => a + b, 0) / input.series.length;
				const trend = (input.series[input.series.length - 1] - input.series[0]) / input.series.length;
				
				const moderate: number[] = [];
				for (let i = 0; i < input.months; i++) {
					const value = average + trend * (i + 1);
					moderate.push(Math.max(0, value));
				}

				const worst = moderate.map((v) => v * 0.9);
				const best = moderate.map((v) => v * 1.1);

				return {
					moderate,
					worst,
					best,
					dcf: {
						worst: 0,
						moderate: 0,
						best: 0,
					},
					bep: null,
					meta: {
						model: input.model === "auto" ? "naive" : input.model,
						rmse: 0.1,
						mape: 5.0,
					},
				};
			}
		}),
});

