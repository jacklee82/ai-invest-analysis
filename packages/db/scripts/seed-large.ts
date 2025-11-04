import dotenv from "dotenv";
import { db } from "../src/index";
import { project, cashflowMonthly, BusinessType } from "../src/schema";
import { v4 as uuidv4 } from "uuid";

// 환경변수 로드
dotenv.config({
	path: "../../apps/web/.env",
});

/**
 * 대량 시드 데이터 생성 스크립트
 * 다양한 시나리오의 프로젝트 및 현금흐름 데이터 생성
 */
async function seedLarge() {
	console.log("🌱 대량 시드 데이터 생성 시작...");

	try {
		// 기존 데이터 삭제 (순서 중요: 외래키 참조 제거)
		console.log("🗑️  기존 데이터 삭제 중...");
		await db.delete(cashflowMonthly);
		await db.delete(project);

		const projects: Array<{
			projectId: string;
			projectName: string;
			companyName: string;
			contractStartDate: string;
			baseContractMonths: number;
			extendedMonths: number;
			initialInvestment: number;
			additionalInvestment: number;
			totalRecouped: number;
			mdPurchaseCost: number | null;
			ostInvestment: number | null;
			businessType: typeof BusinessType[keyof typeof BusinessType];
		}> = [];

		const companies = [
			"스타엔터테인먼트",
			"드림뮤직",
			"하이브",
			"SM엔터테인먼트",
			"YG엔터테인먼트",
			"JYP엔터테인먼트",
			"큐브엔터테인먼트",
			"판타지오뮤직",
			"위에화엔터테인먼트",
			"에스토리엔터테인먼트",
			"무브엔터테인먼트",
			"울림엔터테인먼트",
			"RBW",
			"플레이엠엔터테인먼트",
			"에이치엔터테인먼트",
		];

		// 날짜 생성 헬퍼
		const getRandomDate = (startYear: number, endYear: number): string => {
			const year = Math.floor(Math.random() * (endYear - startYear + 1)) + startYear;
			const month = Math.floor(Math.random() * 12) + 1;
			const day = Math.floor(Math.random() * 28) + 1;
			return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
		};

		// 1. 선급투자 프로젝트들 (20개)
		console.log("📝 선급투자 프로젝트 생성 중...");
		for (let i = 1; i <= 20; i++) {
			const company = companies[Math.floor(Math.random() * companies.length)];
			const contractStart = getRandomDate(2022, 2024);
			const baseMonths = [12, 18, 24, 30, 36][Math.floor(Math.random() * 5)];
			const extendedMonths = Math.random() < 0.3 ? Math.floor(Math.random() * 12) : 0;
			const initialInvestment = [300000000, 500000000, 700000000, 1000000000, 1500000000][
				Math.floor(Math.random() * 5)
			];
			const additionalInvestment = Math.random() < 0.4 ? Math.floor(Math.random() * 500000000) : 0;
			const totalInvestment = initialInvestment + additionalInvestment;
			
			// 회수율 시나리오: 성공(70-100%), 보통(40-70%), 경고(20-40%)
			const scenario = Math.random();
			let recoupRate: number;
			if (scenario < 0.3) {
				// 성공: 70-100%
				recoupRate = 0.7 + Math.random() * 0.3;
			} else if (scenario < 0.7) {
				// 보통: 40-70%
				recoupRate = 0.4 + Math.random() * 0.3;
			} else {
				// 경고: 20-40%
				recoupRate = 0.2 + Math.random() * 0.2;
			}
			
			const totalRecouped = Math.floor(totalInvestment * recoupRate);

			projects.push({
				projectId: uuidv4(),
				projectName: `선급투자_${company}_프로젝트${i}`,
				companyName: company,
				contractStartDate: contractStart,
				baseContractMonths: baseMonths,
				extendedMonths: extendedMonths,
				initialInvestment,
				additionalInvestment,
				totalRecouped,
				mdPurchaseCost: null,
				ostInvestment: null,
				businessType: BusinessType.선급투자,
			});
		}

		// 2. 일반투자 프로젝트들 (15개)
		console.log("📝 일반투자 프로젝트 생성 중...");
		for (let i = 1; i <= 15; i++) {
			const company = companies[Math.floor(Math.random() * companies.length)];
			const contractStart = getRandomDate(2022, 2024);
			const baseMonths = [12, 18, 24][Math.floor(Math.random() * 3)];
			const initialInvestment = [100000000, 200000000, 300000000, 500000000][
				Math.floor(Math.random() * 4)
			];
			const recoupRate = 0.5 + Math.random() * 0.5; // 50-100%
			const totalRecouped = Math.floor(initialInvestment * recoupRate);

			projects.push({
				projectId: uuidv4(),
				projectName: `일반투자_${company}_프로젝트${i}`,
				companyName: company,
				contractStartDate: contractStart,
				baseContractMonths: baseMonths,
				extendedMonths: 0,
				initialInvestment,
				additionalInvestment: 0,
				totalRecouped,
				mdPurchaseCost: null,
				ostInvestment: null,
				businessType: BusinessType.일반투자,
			});
		}

		// 3. OST 프로젝트들 (10개)
		console.log("📝 OST 프로젝트 생성 중...");
		for (let i = 1; i <= 10; i++) {
			const company = companies[Math.floor(Math.random() * companies.length)];
			const contractStart = getRandomDate(2022, 2024);
			const baseMonths = [12, 18, 24][Math.floor(Math.random() * 3)];
			const ostInvestment = [150000000, 200000000, 300000000][Math.floor(Math.random() * 3)];
			const recoupRate = 0.4 + Math.random() * 0.6; // 40-100%
			const totalRecouped = Math.floor(ostInvestment * recoupRate);

			projects.push({
				projectId: uuidv4(),
				projectName: `OST_${company}_드라마${i}`,
				companyName: company,
				contractStartDate: contractStart,
				baseContractMonths: baseMonths,
				extendedMonths: 0,
				initialInvestment: 0,
				additionalInvestment: 0,
				totalRecouped,
				mdPurchaseCost: null,
				ostInvestment,
				businessType: BusinessType.OST,
			});
		}

		// 4. 음반 프로젝트들 (10개)
		console.log("📝 음반 프로젝트 생성 중...");
		for (let i = 1; i <= 10; i++) {
			const company = companies[Math.floor(Math.random() * companies.length)];
			const contractStart = getRandomDate(2022, 2024);
			const baseMonths = [24, 36, 48][Math.floor(Math.random() * 3)];
			const mdPurchaseCost = [50000000, 80000000, 120000000, 200000000][
				Math.floor(Math.random() * 4)
			];
			const recoupRate = 0.3 + Math.random() * 0.7; // 30-100%
			const totalRecouped = Math.floor(mdPurchaseCost * recoupRate);

			projects.push({
				projectId: uuidv4(),
				projectName: `음반_${company}_앨범${i}`,
				companyName: company,
				contractStartDate: contractStart,
				baseContractMonths: baseMonths,
				extendedMonths: 0,
				initialInvestment: 0,
				additionalInvestment: 0,
				totalRecouped,
				mdPurchaseCost,
				ostInvestment: null,
				businessType: BusinessType.음반,
			});
		}

		console.log(`📝 총 ${projects.length}개 프로젝트 데이터 삽입 중...`);
		await db.insert(project).values(projects);

		// 월별 현금흐름 데이터 생성
		console.log("💰 월별 현금흐름 데이터 생성 중...");
		const cashflows: Array<{
			id: string;
			projectId: string;
			yyyymm: string;
			revenueAmount: number;
			costAmount: number;
			recoupAmount: number;
		}> = [];

		// 최근 24개월 생성
		const now = new Date();
		const months: string[] = [];
		for (let i = 23; i >= 0; i--) {
			const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
			const yyyymm = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
			months.push(yyyymm);
		}

		projects.forEach((proj) => {
			const contractStart = new Date(proj.contractStartDate);
			const totalMonths = proj.baseContractMonths + proj.extendedMonths;
			const contractEnd = new Date(
				contractStart.getFullYear(),
				contractStart.getMonth() + totalMonths,
				1,
			);

			// 프로젝트별 총 투자금 계산
			const totalInvestment =
				proj.initialInvestment +
				proj.additionalInvestment +
				(proj.ostInvestment || 0) +
				(proj.mdPurchaseCost || 0);

			// 회수율 계산
			const recoupRate = totalInvestment > 0 ? proj.totalRecouped / totalInvestment : 0;

			// 프로젝트별 월평균 회수금 계산
			const avgMonthlyRecoup = proj.totalRecouped / Math.max(1, totalMonths);

			months.forEach((yyyymm) => {
				const [year, month] = yyyymm.split("-").map(Number);
				const monthDate = new Date(year, month - 1, 1);

				// 계약 기간 내에만 데이터 생성
				if (monthDate >= contractStart && monthDate < contractEnd) {
					// 시간에 따른 감소 패턴 (초기 높음, 후기 낮음)
					const elapsedMonths =
						(monthDate.getFullYear() - contractStart.getFullYear()) * 12 +
						(monthDate.getMonth() - contractStart.getMonth());
					const progress = elapsedMonths / totalMonths;
					const timeMultiplier = 1 - progress * 0.5; // 50% 감소

					// 랜덤 변동 (80-120%)
					const randomFactor = 0.8 + Math.random() * 0.4;

					// 월별 회수금 계산
					const recoupAmount = Math.floor(
						avgMonthlyRecoup * timeMultiplier * randomFactor,
					);

					// 매출액 계산 (회수금의 1.2-1.5배)
					const revenueMultiplier = 1.2 + Math.random() * 0.3;
					const revenueAmount = Math.floor(recoupAmount * revenueMultiplier);

					// 원가 계산 (매출의 20-40%)
					const costRatio = 0.2 + Math.random() * 0.2;
					const costAmount = Math.floor(revenueAmount * costRatio);

					cashflows.push({
						id: uuidv4(),
						projectId: proj.projectId,
						yyyymm,
						revenueAmount,
						costAmount,
						recoupAmount: Math.max(0, recoupAmount),
					});
				}
			});
		});

		console.log(`💰 총 ${cashflows.length}개 월별 현금흐름 데이터 삽입 중...`);
		
		// 배치 삽입 (1000개씩)
		const batchSize = 1000;
		for (let i = 0; i < cashflows.length; i += batchSize) {
			const batch = cashflows.slice(i, i + batchSize);
			await db.insert(cashflowMonthly).values(batch);
			console.log(`   진행률: ${Math.min(i + batchSize, cashflows.length)}/${cashflows.length}`);
		}

		console.log("✅ 대량 시드 데이터 생성 완료!");
		console.log(`   - 프로젝트: ${projects.length}개`);
		console.log(`   - 월별 현금흐름: ${cashflows.length}개`);
		console.log(`   - 기획사: ${new Set(projects.map((p) => p.companyName)).size}개`);
	} catch (error) {
		console.error("❌ 시드 데이터 생성 실패:", error);
		throw error;
	}
}

// 스크립트 실행
seedLarge()
	.then(() => {
		console.log("🎉 완료!");
		process.exit(0);
	})
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

