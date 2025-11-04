import dotenv from "dotenv";
import { db } from "../src/index";
import { project, cashflowMonthly, BusinessType } from "../src/schema";

// 환경변수 로드
dotenv.config({
	path: "../../apps/web/.env",
});

/**
 * 시드 데이터 생성 스크립트
 * 소형 A/B 예제 적재 (3~5개 프로젝트, 12개월 집계)
 */
async function seed() {
	console.log("🌱 시드 데이터 생성 시작...");

	try {
		// 기존 데이터 삭제 (순서 중요: 외래키 참조 제거)
		console.log("🗑️  기존 데이터 삭제 중...");
		await db.delete(cashflowMonthly);
		await db.delete(project);

		// 프로젝트 데이터 생성
		const projects = [
			{
				projectId: "proj-001",
				projectName: "아이돌그룹A_1집",
				companyName: "기획사A",
				contractStartDate: "2023-01-01",
				baseContractMonths: 24,
				extendedMonths: 6,
				initialInvestment: 500000000,
				additionalInvestment: 100000000,
				totalRecouped: 450000000,
				mdPurchaseCost: null,
				ostInvestment: null,
				businessType: BusinessType.선급투자,
			},
			{
				projectId: "proj-002",
				projectName: "솔로아티스트B_앨범",
				companyName: "기획사B",
				contractStartDate: "2023-03-15",
				baseContractMonths: 18,
				extendedMonths: 0,
				initialInvestment: 300000000,
				additionalInvestment: 0,
				totalRecouped: 280000000,
				mdPurchaseCost: null,
				ostInvestment: null,
				businessType: BusinessType.선급투자,
			},
			{
				projectId: "proj-003",
				projectName: "드라마OST_시리즈",
				companyName: "기획사C",
				contractStartDate: "2023-06-01",
				baseContractMonths: 12,
				extendedMonths: 0,
				initialInvestment: 200000000,
				additionalInvestment: 0,
				totalRecouped: 150000000,
				mdPurchaseCost: null,
				ostInvestment: 200000000,
				businessType: BusinessType.OST,
			},
			{
				projectId: "proj-004",
				projectName: "음반앨범_베스트",
				companyName: "기획사D",
				contractStartDate: "2023-09-01",
				baseContractMonths: 36,
				extendedMonths: 0,
				initialInvestment: 0,
				additionalInvestment: 0,
				totalRecouped: 0,
				mdPurchaseCost: 80000000,
				ostInvestment: null,
				businessType: BusinessType.음반,
			},
			{
				projectId: "proj-005",
				projectName: "일반투자_콘텐츠",
				companyName: "기획사E",
				contractStartDate: "2023-12-01",
				baseContractMonths: 12,
				extendedMonths: 0,
				initialInvestment: 100000000,
				additionalInvestment: 0,
				totalRecouped: 0,
				mdPurchaseCost: null,
				ostInvestment: null,
				businessType: BusinessType.일반투자,
			},
		];

		console.log("📝 프로젝트 데이터 삽입 중...");
		await db.insert(project).values(projects);

		// 월별 현금흐름 데이터 생성 (각 프로젝트당 최근 12개월)
		const cashflows: Array<{
			id: string;
			projectId: string;
			yyyymm: string;
			revenueAmount: number;
			costAmount: number;
			recoupAmount: number;
		}> = [];

		const months = [
			"2024-11",
			"2024-10",
			"2024-09",
			"2024-08",
			"2024-07",
			"2024-06",
			"2024-05",
			"2024-04",
			"2024-03",
			"2024-02",
			"2024-01",
			"2023-12",
		];

		projects.forEach((proj) => {
			months.forEach((yyyymm, index) => {
				// 프로젝트별로 다른 패턴의 수익 생성
				const baseRevenue = proj.initialInvestment / 100;
				const monthMultiplier = 1 - index * 0.05; // 시간이 지날수록 감소
				const randomFactor = 0.8 + Math.random() * 0.4; // 80-120% 변동

				const revenue = Math.floor(
					baseRevenue * monthMultiplier * randomFactor,
				);
				const cost = Math.floor(revenue * 0.3);
				const recoup = Math.floor(revenue * 0.7);

				cashflows.push({
					id: `cf-${proj.projectId}-${yyyymm}`,
					projectId: proj.projectId,
					yyyymm,
					revenueAmount: revenue,
					costAmount: cost,
					recoupAmount: recoup,
				});
			});
		});

		console.log("💰 월별 현금흐름 데이터 삽입 중...");
		await db.insert(cashflowMonthly).values(cashflows);

		console.log("✅ 시드 데이터 생성 완료!");
		console.log(`   - 프로젝트: ${projects.length}개`);
		console.log(`   - 월별 현금흐름: ${cashflows.length}개`);
	} catch (error) {
		console.error("❌ 시드 데이터 생성 실패:", error);
		throw error;
	}
}

// 스크립트 실행
seed()
	.then(() => {
		process.exit(0);
	})
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

