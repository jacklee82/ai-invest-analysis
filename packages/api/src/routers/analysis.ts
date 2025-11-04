import { z } from "zod";
import { router, publicProcedure } from "../index";
import { project, cashflowMonthly, chartEntry } from "@my-better-t-app/db";
import { sql, desc, eq, and, gte, lte } from "drizzle-orm";

/**
 * 심층 분석 라우터
 * Module 4: 심층 분석 (P2 - 사업관리)
 */
export const analysisRouter = router({
	/**
	 * 차트인 가치 추정
	 * @returns 차트 100위권 1주 평균 가치 추정
	 */
	getChartValue: publicProcedure.query(async ({ ctx }) => {
		const { db } = ctx;

		if (!db) {
			throw new Error("데이터베이스 연결이 없습니다.");
		}

		// 1. 차트인 정보가 있는 프로젝트 조회
		const chartedProjects = await db
			.select({
				projectId: chartEntry.projectId,
			})
			.from(chartEntry)
			.groupBy(chartEntry.projectId);

		if (chartedProjects.length === 0) {
			return {
				averageValue: 0,
				totalProjects: 0,
				totalChartedWeeks: 0,
				totalChartRevenue: 0,
				regressionModel: {
					r2: 0,
					rmse: 0,
					coefficients: {
						intercept: 0,
						slope: 0,
					},
					confidenceInterval: {
						lower: 0,
						upper: 0,
					},
				},
			};
		}

		// 2. 각 프로젝트의 차트인 수익 및 주 수 계산
		const chartData = await Promise.all(
			chartedProjects.map(async ({ projectId }) => {
				// 차트인 주 수 계산
				const chartWeeks = await db
					.select({
						count: sql<number>`COUNT(*)::int`,
					})
					.from(chartEntry)
					.where(eq(chartEntry.projectId, projectId));

				const chartedWeeks = chartWeeks[0]?.count ?? 0;

				// 차트인 기간 조회 (첫 진입일 ~ 마지막 진입일)
				const chartPeriod = await db
					.select({
						minDate: sql<string>`MIN(${chartEntry.weekDate})::text`,
						maxDate: sql<string>`MAX(${chartEntry.weekDate})::text`,
					})
					.from(chartEntry)
					.where(eq(chartEntry.projectId, projectId));

				const startDate = chartPeriod[0]?.minDate;
				const endDate = chartPeriod[0]?.maxDate;

				// 차트인 기간 동안의 수익 계산
				let chartRevenue = 0;
				if (startDate && endDate) {
					// 주의 시작일(월요일)을 월의 첫 날로 변환하여 매칭
					// 예: 2024-01-01 (월) -> 2024-01
					const startMonth = startDate.substring(0, 7); // YYYY-MM
					const endMonth = endDate.substring(0, 7);

					const cashflows = await db
						.select({
							revenue: cashflowMonthly.revenueAmount,
						})
						.from(cashflowMonthly)
						.where(
							and(
								eq(cashflowMonthly.projectId, projectId),
								gte(cashflowMonthly.yyyymm, startMonth),
								lte(cashflowMonthly.yyyymm, endMonth),
							),
						);

					chartRevenue = cashflows.reduce(
						(sum, cf) => sum + (cf.revenue ?? 0),
						0,
					);
				}

				return {
					projectId,
					chartedWeeks,
					chartRevenue,
				};
			}),
		);

		// 3. 단순 평균 계산
		const totalChartedWeeks = chartData.reduce(
			(sum, d) => sum + d.chartedWeeks,
			0,
		);
		const totalChartRevenue = chartData.reduce(
			(sum, d) => sum + d.chartRevenue,
			0,
		);
		const averageValuePerWeek =
			totalChartedWeeks > 0
				? totalChartRevenue / totalChartedWeeks / 10_000_000 // 천만원 단위
				: 0;

		// 4. 회귀 분석 데이터 준비 (FastAPI 호출용)
		const regressionData = chartData
			.filter((d) => d.chartedWeeks > 0 && d.chartRevenue > 0)
			.map((d) => ({
				x: d.chartedWeeks,
				y: d.chartRevenue / 10_000_000, // 천만원 단위
			}));

		// 5. FastAPI 회귀 분석 호출 (나중에 구현)
		// 현재는 단순 선형 회귀로 근사값 계산
		let regressionModel = {
			r2: 0,
			rmse: 0,
			coefficients: {
				intercept: 0,
				slope: 0,
			},
			confidenceInterval: {
				lower: 0,
				upper: 0,
			},
		};

		if (regressionData.length > 1) {
			// 단순 선형 회귀 (y = ax + b)
			const n = regressionData.length;
			const sumX = regressionData.reduce((sum, d) => sum + d.x, 0);
			const sumY = regressionData.reduce((sum, d) => sum + d.y, 0);
			const sumXY = regressionData.reduce(
				(sum, d) => sum + d.x * d.y,
				0,
			);
			const sumX2 = regressionData.reduce((sum, d) => sum + d.x * d.x, 0);

			const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
			const intercept = (sumY - slope * sumX) / n;

			// R² 계산
			const yMean = sumY / n;
			const ssRes = regressionData.reduce(
				(sum, d) => sum + Math.pow(d.y - (slope * d.x + intercept), 2),
				0,
			);
			const ssTot = regressionData.reduce(
				(sum, d) => sum + Math.pow(d.y - yMean, 2),
				0,
			);
			const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;

			// RMSE 계산
			const rmse = Math.sqrt(ssRes / n);

			regressionModel = {
				r2,
				rmse,
				coefficients: {
					intercept,
					slope,
				},
				confidenceInterval: {
					lower: averageValuePerWeek * 0.8, // 임시 값
					upper: averageValuePerWeek * 1.2, // 임시 값
				},
			};
		}

		return {
			averageValue: averageValuePerWeek,
			totalProjects: chartData.length,
			totalChartedWeeks,
			totalChartRevenue,
			regressionModel,
		};
	}),

	/**
	 * 차트인으로 가장 많은 수익을 낸 곡 Top 10
	 * @returns Top 10 곡 리스트
	 */
	getTopChartTracks: publicProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(100).default(10),
			}).optional(),
		)
		.query(async ({ ctx, input }) => {
			const { db } = ctx;
			const limit = input?.limit ?? 10;

			if (!db) {
				throw new Error("데이터베이스 연결이 없습니다.");
			}

			// 1. 차트인 정보가 있는 프로젝트 조회
			const chartedProjects = await db
				.select({
					projectId: chartEntry.projectId,
				})
				.from(chartEntry)
				.groupBy(chartEntry.projectId);

			if (chartedProjects.length === 0) {
				return [];
			}

			// 2. 각 프로젝트의 차트인 수익 및 주 수 계산
			const trackData = await Promise.all(
				chartedProjects.map(async ({ projectId }) => {
					// 프로젝트 정보 조회
					const projectInfo = await db
						.select({
							projectId: project.projectId,
							projectName: project.projectName,
							companyName: project.companyName,
						})
						.from(project)
						.where(eq(project.projectId, projectId))
						.limit(1);

					if (projectInfo.length === 0) {
						return null;
					}

					const proj = projectInfo[0];

					// 차트인 주 수 계산
					const chartWeeks = await db
						.select({
							count: sql<number>`COUNT(*)::int`,
							bestRank: sql<number>`MIN(${chartEntry.chartRank})::int`,
						})
						.from(chartEntry)
						.where(eq(chartEntry.projectId, projectId));

					const chartedWeeks = chartWeeks[0]?.count ?? 0;
					const bestRank = chartWeeks[0]?.bestRank ?? 100;

					// 차트인 기간 조회
					const chartPeriod = await db
						.select({
							minDate: sql<string>`MIN(${chartEntry.weekDate})::text`,
							maxDate: sql<string>`MAX(${chartEntry.weekDate})::text`,
						})
						.from(chartEntry)
						.where(eq(chartEntry.projectId, projectId));

					const startDate = chartPeriod[0]?.minDate;
					const endDate = chartPeriod[0]?.maxDate;

					// 차트인 기간 동안의 수익 계산
					let chartRevenue = 0;
					if (startDate && endDate) {
						const startMonth = startDate.substring(0, 7);
						const endMonth = endDate.substring(0, 7);

						const cashflows = await db
							.select({
								revenue: cashflowMonthly.revenueAmount,
							})
							.from(cashflowMonthly)
							.where(
								and(
									eq(cashflowMonthly.projectId, projectId),
									gte(cashflowMonthly.yyyymm, startMonth),
									lte(cashflowMonthly.yyyymm, endMonth),
								),
							);

						chartRevenue = cashflows.reduce(
							(sum, cf) => sum + (cf.revenue ?? 0),
							0,
						);
					}

					return {
						trackId: proj.projectId,
						title: proj.projectName,
						artist: proj.companyName,
						chartRevenue,
						chartedWeeks,
						bestRank,
						averageRevenuePerWeek:
							chartedWeeks > 0
								? chartRevenue / chartedWeeks
								: 0,
					};
				}),
			);

			// 3. null 제거 및 정렬 (차트인 수익 기준)
			const validTracks = trackData
				.filter((t): t is NonNullable<typeof t> => t !== null)
				.sort((a, b) => b.chartRevenue - a.chartRevenue)
				.slice(0, limit);

			return validTracks;
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
		.query(async ({ ctx, input }) => {
			const { db } = ctx;

			if (!db) {
				throw new Error("데이터베이스 연결이 없습니다.");
			}

			// 선급투자만 필터링
			const allProjects = await db
				.select()
				.from(project)
				.where(sql`${project.businessType} = '선급투자'`);

			// 기획사별 집계
			const companyMap = new Map<
				string,
				{
					companyName: string;
					totalInvestment: number;
					totalRecouped: number;
					latestExpiryDate: string | null;
				}
			>();

			for (const p of allProjects) {
				const existing = companyMap.get(p.companyName);
				const investment = p.initialInvestment + p.additionalInvestment;
				const contractEndDate = calculateContractEndDate(
					p.contractStartDate,
					p.baseContractMonths + p.extendedMonths,
				);

				if (existing) {
					existing.totalInvestment += investment;
					existing.totalRecouped += p.totalRecouped;
					if (
						!existing.latestExpiryDate ||
						contractEndDate > existing.latestExpiryDate
					) {
						existing.latestExpiryDate = contractEndDate;
					}
				} else {
					companyMap.set(p.companyName, {
						companyName: p.companyName,
						totalInvestment: investment,
						totalRecouped: p.totalRecouped,
						latestExpiryDate: contractEndDate,
					});
				}
			}

			// ROI 계산 및 정렬
			let companies = Array.from(companyMap.values())
				.map((c) => ({
					companyName: c.companyName,
					totalInvestment: c.totalInvestment,
					totalRecouped: c.totalRecouped,
					roi: c.totalInvestment > 0 ? (c.totalRecouped / c.totalInvestment) * 100 : 0,
					expiryDate: c.latestExpiryDate,
				}))
				.filter((c) => c.totalInvestment > 0); // 투자금이 있는 기획사만

			// 정렬
			if (input.sortBy === "investment") {
				companies.sort((a, b) => b.totalInvestment - a.totalInvestment);
			} else {
				companies.sort((a, b) => {
					if (!a.expiryDate) return 1;
					if (!b.expiryDate) return -1;
					return a.expiryDate.localeCompare(b.expiryDate);
				});
			}

			return companies;
		}),
});

/**
 * 계약 종료일 계산 헬퍼 함수
 */
function calculateContractEndDate(
	startDate: string,
	totalMonths: number,
): string {
	const [year, month] = startDate.split("-").map(Number);
	const endDate = new Date(year, month - 1 + totalMonths, 1);
	return `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-01`;
}

