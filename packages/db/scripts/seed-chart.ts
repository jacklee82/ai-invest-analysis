import { db } from "../src/index";
import { project, chartEntry } from "@my-better-t-app/db";
import { sql, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import { resolve } from "path";

// 환경변수 로드
dotenv.config({ path: resolve(__dirname, "../../../apps/web/.env") });
dotenv.config({ path: resolve(__dirname, "../../../apps/web/.env.local") });

/**
 * 차트인 샘플 데이터 생성 스크립트
 * 
 * 기존 프로젝트 중 일부를 선택하여 차트 진입 정보를 생성합니다.
 * 차트 진입 기간은 프로젝트의 계약 시작일 이후로 설정합니다.
 */
async function seedChartEntries() {
	console.log("📊 차트인 샘플 데이터 생성 시작...");

	try {
		// 1. 기존 프로젝트 조회 (음반 및 선급투자 타입 우선)
		const projects = await db
			.select()
			.from(project)
			.where(
				sql`${project.businessType} IN ('음반', '선급투자', '일반투자')`,
			)
			.limit(20); // 상위 20개 프로젝트 선택

		console.log(`📁 ${projects.length}개 프로젝트 발견`);

		if (projects.length === 0) {
			console.log("⚠️  프로젝트가 없습니다. 먼저 프로젝트 데이터를 생성하세요.");
			return;
		}

		// 2. 각 프로젝트에 차트 진입 정보 생성
		const chartEntries: Array<{
			chartEntryId: string;
			projectId: string;
			chartRank: number;
			weekDate: string;
			chartType: string;
		}> = [];

		for (const proj of projects) {
			// 프로젝트의 계약 시작일 파싱
			const [startYear, startMonth] = proj.contractStartDate
				.split("-")
				.map(Number);

			// 차트 진입 여부 결정 (70% 확률)
			if (Math.random() > 0.3) {
				// 차트인 기간 설정 (1~16주 사이 랜덤)
				const chartedWeeks = Math.floor(Math.random() * 16) + 1;

				// 차트 진입 시작 주 계산 (계약 시작일 이후 1~4주 사이)
				const startWeekOffset = Math.floor(Math.random() * 4) + 1;
				const startDate = new Date(startYear, startMonth - 1, 1);
				startDate.setDate(startDate.getDate() + startWeekOffset * 7);

				// 최고 순위 설정 (1~100위)
				const bestRank = Math.floor(Math.random() * 100) + 1;

				// 차트인 기간 동안 주 단위로 데이터 생성
				for (let week = 0; week < chartedWeeks; week++) {
					const weekDate = new Date(startDate);
					weekDate.setDate(weekDate.getDate() + week * 7);

					// 순위는 시간이 지날수록 점점 낮아지는 경향 (최고 순위에서 시작)
					// 단, 일부는 유지되거나 상승하는 경우도 있음
					let currentRank = bestRank;
					if (week > 0) {
						// 주가 지날수록 순위가 낮아지지만, 가끔 상승
						const rankChange = Math.random() > 0.7 
							? Math.floor(Math.random() * 5) - 10 // 70% 확률로 하락
							: Math.floor(Math.random() * 10) - 5; // 30% 확률로 변동
						currentRank = Math.min(100, Math.max(1, bestRank + rankChange * week));
					}

					// 100위권 내인지 확인
					if (currentRank <= 100) {
						// 월요일 날짜로 변환 (주 시작일)
						const monday = new Date(weekDate);
						const dayOfWeek = monday.getDay();
						const diff = monday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
						monday.setDate(diff);
						monday.setHours(0, 0, 0, 0);

						const weekDateStr = monday.toISOString().split("T")[0];

						// 차트 타입 결정 (음반은 음반, 나머지는 가요)
						const chartType =
							proj.businessType === "음반" ? "음반" : "가요";

						chartEntries.push({
							chartEntryId: uuidv4(),
							projectId: proj.projectId,
							chartRank: currentRank,
							weekDate: weekDateStr,
							chartType,
						});
					}
				}

				console.log(
					`✅ ${proj.projectName}: ${chartedWeeks}주간 차트인 (최고 ${bestRank}위)`,
				);
			}
		}

		// 3. 기존 차트 데이터 삭제 (선택사항)
		// await db.delete(chartEntry);

		// 4. 차트 진입 정보 삽입
		if (chartEntries.length > 0) {
			console.log(`\n📝 ${chartEntries.length}개의 차트 진입 정보 삽입 중...`);

			// 배치로 삽입 (한 번에 너무 많은 데이터를 삽입하지 않도록)
			const batchSize = 100;
			for (let i = 0; i < chartEntries.length; i += batchSize) {
				const batch = chartEntries.slice(i, i + batchSize);
				await db.insert(chartEntry).values(batch);
			}

			console.log(`✅ 차트 진입 정보 ${chartEntries.length}개 삽입 완료`);

			// 통계 출력
			const totalWeeks = chartEntries.length;
			const uniqueProjects = new Set(chartEntries.map((e) => e.projectId)).size;
			const avgRank =
				chartEntries.reduce((sum, e) => sum + e.chartRank, 0) /
				chartEntries.length;

			console.log("\n📊 차트인 데이터 통계:");
			console.log(`   - 총 차트 진입 주 수: ${totalWeeks}주`);
			console.log(`   - 차트인 프로젝트 수: ${uniqueProjects}개`);
			console.log(`   - 평균 차트 순위: ${avgRank.toFixed(1)}위`);
		} else {
			console.log("⚠️  생성된 차트 진입 정보가 없습니다.");
		}

		console.log("\n✨ 차트인 샘플 데이터 생성 완료!");
	} catch (error) {
		console.error("❌ 오류 발생:", error);
		throw error;
	}
}

// 스크립트 실행
seedChartEntries()
	.then(() => {
		process.exit(0);
	})
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

