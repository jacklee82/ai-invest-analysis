import { z } from "zod";
import { router, publicProcedure } from "../index";
import { project, cashflowMonthly } from "@my-better-t-app/db";
import { sql, desc } from "drizzle-orm";

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

