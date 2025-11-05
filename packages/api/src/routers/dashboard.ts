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

		// 프로토타입: DB 연결 실패 시 하드코딩된 더미 데이터 반환
		if (!db) {
			console.log("[Dashboard] DB 연결 없음 - 하드코딩된 더미 데이터 반환");
			return {
				totalInvestment: 5000000000, // 50억
				totalRecouped: 3200000000, // 32억
				recoupRate: 64.0,
				totalRevenue: 8500000000, // 85억
				totalProfit: 2800000000, // 28억
				riskCount: 3,
				yoy: {
					totalInvestment: 12.5,
					totalRecouped: 8.3,
					recoupRate: -2.1,
					totalRevenue: 15.2,
					totalProfit: 18.7,
					riskCount: -1,
				},
			};
		}

		try {
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

		// 누적 매출 계산 (cashflowMonthly의 revenueAmount 합계)
		const totalRevenueResult = await db
			.select({
				total: sql<number>`COALESCE(sum(${cashflowMonthly.revenueAmount}), 0)`,
			})
			.from(cashflowMonthly);
		const totalRevenue = totalRevenueResult[0]?.total
			? Number(totalRevenueResult[0].total)
			: 0;
		console.log("[Dashboard] 누적 매출:", totalRevenue);

		// 누적 원가 계산 (cashflowMonthly의 costAmount 합계)
		const totalCostResult = await db
			.select({
				total: sql<number>`COALESCE(sum(${cashflowMonthly.costAmount}), 0)`,
			})
			.from(cashflowMonthly);
		const totalCost = totalCostResult[0]?.total
			? Number(totalCostResult[0].total)
			: 0;
		console.log("[Dashboard] 누적 원가:", totalCost);

		// 누적 이익 계산 (매출 - 원가)
		const totalProfit = totalRevenue - totalCost;
		console.log("[Dashboard] 누적 이익:", totalProfit);

		// 리스크 건수 계산 (경고 상태)
		// 경고 조건: (경과 기간 > 총 계약 기간 / 2) && (회수율 < 0.5)
		const allProjects = await db.select().from(project);
		const now = new Date();
		const riskCount = allProjects.filter((p: { baseContractMonths: number; extendedMonths: number; contractStartDate: string; initialInvestment: number; additionalInvestment: number; totalRecouped: number }) => {
			const totalContractMonths = p.baseContractMonths + p.extendedMonths;
			const contractStart = new Date(p.contractStartDate);
			const elapsedMonths = 
				(now.getFullYear() - contractStart.getFullYear()) * 12 +
				(now.getMonth() - contractStart.getMonth());
			const projectTotalInvestment = p.initialInvestment + p.additionalInvestment;
			const projectRecoupRate = projectTotalInvestment > 0 
				? p.totalRecouped / projectTotalInvestment 
				: 0;
			const elapsedRatio = totalContractMonths > 0 
				? elapsedMonths / totalContractMonths 
				: 0;
			return elapsedRatio > 0.5 && projectRecoupRate < 0.5;
		}).length;

		// YoY 계산 (전년 동월 대비)
		// TODO: 전년 데이터와 비교하여 증감률 계산
		const yoy = {
			totalInvestment: 0,
			totalRecouped: 0,
			recoupRate: 0,
			totalRevenue: 0,
			totalProfit: 0,
			riskCount: 0,
		};

		const result = {
			totalInvestment: Number(totalInvestment),
			totalRecouped: Number(totalRecouped),
			recoupRate: Math.round(recoupRate * 100) / 100,
			totalRevenue: Number(totalRevenue),
			totalProfit: Number(totalProfit),
			riskCount: Number(riskCount),
			yoy,
		};
		
		console.log("[Dashboard] getSummary 반환값:", result);
		return result;
		} catch (error) {
			console.error("[Dashboard] getSummary 에러:", error);
			console.log("[Dashboard] 에러 발생 - 하드코딩된 더미 데이터 반환 (프로토타입)");
			
			// 프로토타입: 에러 발생 시에도 더미 데이터 반환
			return {
				totalInvestment: 5000000000, // 50억
				totalRecouped: 3200000000, // 32억
				recoupRate: 64.0,
				totalRevenue: 8500000000, // 85억
				totalProfit: 2800000000, // 28억
				riskCount: 3,
				yoy: {
					totalInvestment: 12.5,
					totalRecouped: 8.3,
					recoupRate: -2.1,
					totalRevenue: 15.2,
					totalProfit: 18.7,
					riskCount: -1,
				},
			};
		}
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
			monthlyRevenue.map((r: { projectId: string; revenue: number; cost: number }) => [r.projectId, r]),
		);

		// 프로젝트별 매출/원가 정보 조회
		const projects = await db.select().from(project);

		// 사업별 매출/원가 집계
		const businessRevenueMap = new Map<string, { revenue: number; cost: number }>();

		projects.forEach((proj: { projectId: string; businessType: string }) => {
			const monthly = revenueMap.get(proj.projectId);
			if (!monthly) return;

			const existing = businessRevenueMap.get(proj.businessType) || {
				revenue: 0,
				cost: 0,
			};
			businessRevenueMap.set(proj.businessType, {
				revenue: existing.revenue + Number((monthly as { revenue: number; cost: number }).revenue),
				cost: existing.cost + Number((monthly as { revenue: number; cost: number }).cost),
			});
		});

		// 결과 생성
		const result = businessStats.map((stat: { businessType: string; totalInvestment: number; totalRecouped: number }) => {
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

		// 프로토타입: DB 연결 실패 시 더미 데이터 반환
		if (!db) {
			return [
				{ yyyymm: "2024-01", revenue: 1200000000, profit: 350000000, margin: 29.17 },
				{ yyyymm: "2024-02", revenue: 1350000000, profit: 420000000, margin: 31.11 },
				{ yyyymm: "2024-03", revenue: 1500000000, profit: 480000000, margin: 32.0 },
				{ yyyymm: "2024-04", revenue: 1450000000, profit: 450000000, margin: 31.03 },
				{ yyyymm: "2024-05", revenue: 1600000000, profit: 520000000, margin: 32.5 },
				{ yyyymm: "2024-06", revenue: 1700000000, profit: 580000000, margin: 34.12 },
			];
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

		const result = monthlyStats.map((stat: { yyyymm: string; revenue: number; cost: number }) => {
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

	/**
	 * 투자→회수 워터폴 데이터 조회
	 * @returns 투자금 → 회수금 → 이익 단계별 데이터
	 */
	getWaterfall: publicProcedure.query(async ({ ctx }) => {
		const { db } = ctx;

		if (!db) {
			throw new Error("데이터베이스 연결이 없습니다.");
		}

		// 총 투자금 계산
		const totalInvestmentResult = await db
			.select({
				total: sql<number>`COALESCE(sum(${project.initialInvestment} + ${project.additionalInvestment}), 0)`,
			})
			.from(project);
		const totalInvestment = Number(totalInvestmentResult[0]?.total || 0);

		// 총 회수금 계산
		const totalRecoupedResult = await db
			.select({
				total: sql<number>`COALESCE(sum(${project.totalRecouped}), 0)`,
			})
			.from(project);
		const totalRecouped = Number(totalRecoupedResult[0]?.total || 0);

		// 이익 계산
		const profit = totalRecouped - totalInvestment;

		return {
			totalInvestment: Number(totalInvestment),
			totalRecouped: Number(totalRecouped),
			profit: Number(profit),
		};
	}),

	/**
	 * Top 기획사 스캐터 데이터 조회
	 * @returns 기획사별 투자금, 회수율, 매출, 사업타입
	 */
	getTopCompanies: publicProcedure.query(async ({ ctx }) => {
		const { db } = ctx;

		if (!db) {
			throw new Error("데이터베이스 연결이 없습니다.");
		}

		// 기획사별 집계
		const allProjects = await db.select().from(project);

		// 기획사별로 그룹화
		const companyMap = new Map<
			string,
			{
				companyName: string;
				totalInvestment: number;
				totalRecouped: number;
				totalRevenue: number;
				businessTypes: Set<string>;
			}
		>();

		for (const p of allProjects) {
			const existing = companyMap.get(p.companyName);
			const investment = p.initialInvestment + p.additionalInvestment;

			if (existing) {
				existing.totalInvestment += investment;
				existing.totalRecouped += p.totalRecouped;
				existing.businessTypes.add(p.businessType);
			} else {
				companyMap.set(p.companyName, {
					companyName: p.companyName,
					totalInvestment: investment,
					totalRecouped: p.totalRecouped,
					totalRevenue: 0,
					businessTypes: new Set([p.businessType]),
				});
			}
		}

		// 기획사별 매출 계산
		const allCashflows = await db.select().from(cashflowMonthly);
		for (const cf of allCashflows) {
			const project = allProjects.find((p: { projectId: string; companyName: string }) => p.projectId === cf.projectId);
			if (project) {
				const company = companyMap.get(project.companyName);
				if (company) {
					company.totalRevenue += Number(cf.revenueAmount);
				}
			}
		}

		// 회수율 계산 및 정렬
		const companies = Array.from(companyMap.values())
			.map((c: { companyName: string; totalInvestment: number; totalRecouped: number; totalRevenue: number; businessTypes: Set<string> }) => ({
				companyName: c.companyName,
				totalInvestment: c.totalInvestment,
				totalRecouped: c.totalRecouped,
				recoupRate: c.totalInvestment > 0 ? (c.totalRecouped / c.totalInvestment) * 100 : 0,
				totalRevenue: c.totalRevenue,
				businessType: Array.from(c.businessTypes)[0], // 첫 번째 사업타입 사용
			}))
			.sort((a: { totalInvestment: number }, b: { totalInvestment: number }) => b.totalInvestment - a.totalInvestment) // 투자금 큰 순
			.slice(0, 20); // Top 20

		return companies;
	}),

	/**
	 * 투자유형별 매출 (파이차트용)
	 * @returns 사업 타입별 매출 비중
	 */
	getBusinessTypeRevenue: publicProcedure.query(async ({ ctx }) => {
		const { db } = ctx;

		// 프로토타입: DB 연결 실패 시 더미 데이터 반환
		if (!db) {
			return [
				{ businessType: "선급투자", revenue: 3500000000, profit: 1800000000, margin: 51.43 },
				{ businessType: "일반투자", revenue: 2800000000, profit: 650000000, margin: 23.21 },
				{ businessType: "OST", revenue: 1500000000, profit: 250000000, margin: 16.67 },
				{ businessType: "음반", revenue: 700000000, profit: 100000000, margin: 14.29 },
			];
		}

		// 사업별 매출 집계 (getBusinessComparison과 유사하지만 매출만)
		const allProjects = await db.select().from(project);
		const allCashflows = await db.select().from(cashflowMonthly);

		const businessRevenueMap = new Map<string, number>();

		allCashflows.forEach((cf: { projectId: string; revenueAmount: number | null }) => {
			const proj = allProjects.find((p: { projectId: string; businessType: string }) => p.projectId === cf.projectId);
			if (proj) {
				const existing = businessRevenueMap.get(proj.businessType) || 0;
				businessRevenueMap.set(proj.businessType, existing + Number(cf.revenueAmount));
			}
		});

		const result = Array.from(businessRevenueMap.entries()).map(([businessType, revenue]: [string, number]) => ({
			businessType,
			revenue: Number(revenue),
		}));

		return result;
	}),

	/**
	 * 월별 투자금
	 * @returns 월별 투자금 집계 (계약 시작일 기준)
	 */
	getMonthlyInvestment: publicProcedure.query(async ({ ctx }) => {
		const { db } = ctx;

		// 프로토타입: DB 연결 실패 시 더미 데이터 반환
		if (!db) {
			return [
				{ yyyymm: "2024-01", investment: 500000000 },
				{ yyyymm: "2024-02", investment: 450000000 },
				{ yyyymm: "2024-03", investment: 600000000 },
				{ yyyymm: "2024-04", investment: 400000000 },
				{ yyyymm: "2024-05", investment: 550000000 },
				{ yyyymm: "2024-06", investment: 500000000 },
			];
		}

		const allProjects = await db.select().from(project);

		// 월별 투자금 집계
		const monthlyInvestmentMap = new Map<string, number>();

		allProjects.forEach((proj: { contractStartDate: string; initialInvestment: number; additionalInvestment: number }) => {
			const contractStart = proj.contractStartDate;
			const yyyymm = contractStart.substring(0, 7); // YYYY-MM 형식 추출
			const investment = proj.initialInvestment + proj.additionalInvestment;

			const existing = monthlyInvestmentMap.get(yyyymm) || 0;
			monthlyInvestmentMap.set(yyyymm, existing + investment);
		});

		const result = Array.from(monthlyInvestmentMap.entries())
			.map(([yyyymm, investment]: [string, number]) => ({
				yyyymm,
				investment: Number(investment),
			}))
			.sort((a: { yyyymm: string }, b: { yyyymm: string }) => a.yyyymm.localeCompare(b.yyyymm));

		return result;
	}),

	/**
	 * 음반 매출 순위
	 * @returns 음반 사업 프로젝트별 매출 순위
	 */
	getAlbumRevenueRanking: publicProcedure.query(async ({ ctx }) => {
		const { db } = ctx;

		// 프로토타입: DB 연결 실패 시 더미 데이터 반환
		if (!db) {
			return [
				{ albumName: "앨범 A", revenue: 850000000, rank: 1 },
				{ albumName: "앨범 B", revenue: 720000000, rank: 2 },
				{ albumName: "앨범 C", revenue: 680000000, rank: 3 },
				{ albumName: "앨범 D", revenue: 550000000, rank: 4 },
				{ albumName: "앨범 E", revenue: 480000000, rank: 5 },
			];
		}

		// 음반 사업 프로젝트만 필터링
		const albumProjects = await db
			.select()
			.from(project)
			.where(sql`${project.businessType} = '음반'`);

		// 프로젝트별 매출 집계
		const allCashflows = await db.select().from(cashflowMonthly);
		const projectRevenueMap = new Map<string, number>();

		allCashflows.forEach((cf: { projectId: string; revenueAmount: number | null }) => {
			const proj = albumProjects.find((p: { projectId: string }) => p.projectId === cf.projectId);
			if (proj) {
				const existing = projectRevenueMap.get(cf.projectId) || 0;
				projectRevenueMap.set(cf.projectId, existing + Number(cf.revenueAmount));
			}
		});

		// 프로젝트명과 매출 매핑
		const result = albumProjects
			.map((proj: { projectId: string; projectName: string }) => ({
				projectName: proj.projectName,
				revenue: Number(projectRevenueMap.get(proj.projectId) || 0),
			}))
			.sort((a: { revenue: number }, b: { revenue: number }) => b.revenue - a.revenue)
			.slice(0, 10); // Top 10

		return result;
	}),

	/**
	 * 기획사 매출 비중
	 * @returns 기획사별 매출 및 비중 (트리맵/박스 플롯용)
	 */
	getCompanyRevenueShare: publicProcedure.query(async ({ ctx }) => {
		const { db } = ctx;

		// 프로토타입: DB 연결 실패 시 더미 데이터 반환
		if (!db) {
			return [
				{ companyName: "기획사 A", share: 35.5 },
				{ companyName: "기획사 B", share: 28.3 },
				{ companyName: "기획사 C", share: 18.7 },
				{ companyName: "기획사 D", share: 12.2 },
				{ companyName: "기타", share: 5.3 },
			];
		}

		const allProjects = await db.select().from(project);
		const allCashflows = await db.select().from(cashflowMonthly);

		// 기획사별 매출 집계
		const companyRevenueMap = new Map<string, number>();

		allCashflows.forEach((cf: { projectId: string; revenueAmount: number | null }) => {
			const proj = allProjects.find((p: { projectId: string; companyName: string }) => p.projectId === cf.projectId);
			if (proj) {
				const existing = companyRevenueMap.get(proj.companyName) || 0;
				companyRevenueMap.set(proj.companyName, existing + Number(cf.revenueAmount));
			}
		});

		const totalRevenue = Array.from(companyRevenueMap.values()).reduce(
			(sum: number, revenue: number) => sum + revenue,
			0,
		);

		const result = Array.from(companyRevenueMap.entries())
			.map(([companyName, revenue]: [string, number]) => ({
				companyName,
				revenue: Number(revenue),
				share: totalRevenue > 0 ? (Number(revenue) / totalRevenue) * 100 : 0,
			}))
			.sort((a: { revenue: number }, b: { revenue: number }) => b.revenue - a.revenue)
			.slice(0, 15); // Top 15

		return result;
	}),

	/**
	 * 리스크 순위
	 * @returns 투자금액과 회수율을 고려한 리스크 점수 순위
	 */
	getRiskRanking: publicProcedure.query(async ({ ctx }) => {
		const { db } = ctx;

		// 프로토타입: DB 연결 실패 시 더미 데이터 반환
		if (!db) {
			return [
				{ projectName: "프로젝트 A", riskScore: 85, elapsedRatio: 0.65, recoupRate: 0.35 },
				{ projectName: "프로젝트 B", riskScore: 72, elapsedRatio: 0.58, recoupRate: 0.42 },
				{ projectName: "프로젝트 C", riskScore: 68, elapsedRatio: 0.62, recoupRate: 0.38 },
			];
		}

		const allProjects = await db.select().from(project);
		const now = new Date();

		// 리스크 점수 계산
		const riskProjects = allProjects.map((proj: { baseContractMonths: number; extendedMonths: number; contractStartDate: string; initialInvestment: number; additionalInvestment: number; totalRecouped: number; projectId: string; projectName: string; companyName: string }) => {
			const totalContractMonths = proj.baseContractMonths + proj.extendedMonths;
			const contractStart = new Date(proj.contractStartDate);
			const elapsedMonths =
				(now.getFullYear() - contractStart.getFullYear()) * 12 +
				(now.getMonth() - contractStart.getMonth());
			const totalInvestment = proj.initialInvestment + proj.additionalInvestment;
			const recoupRate = totalInvestment > 0 ? proj.totalRecouped / totalInvestment : 0;
			const elapsedRatio = totalContractMonths > 0 ? elapsedMonths / totalContractMonths : 0;

			// 리스크 점수: 경과율이 높고 회수율이 낮을수록, 투자금이 클수록 높은 점수
			// 공식: (경과율 * (1 - 회수율) * 투자금) / 100000000
			const riskScore =
				(elapsedRatio * (1 - recoupRate) * totalInvestment) / 100000000;

			return {
				projectId: proj.projectId,
				projectName: proj.projectName,
				companyName: proj.companyName,
				totalInvestment,
				recoupRate: recoupRate * 100,
				elapsedRatio: elapsedRatio * 100,
				riskScore: Number(riskScore.toFixed(2)),
			};
		});

		// 리스크 점수 순으로 정렬 (높은 순)
		const result = riskProjects
			.filter((p: { riskScore: number }) => p.riskScore > 0) // 리스크가 있는 것만
			.sort((a: { riskScore: number }, b: { riskScore: number }) => b.riskScore - a.riskScore)
			.slice(0, 10); // Top 10

		return result;
	}),
});

