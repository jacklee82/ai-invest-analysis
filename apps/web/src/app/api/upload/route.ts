import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createHash } from "crypto";
import {
	db,
	project,
	cashflowMonthly,
	uploadJob,
	UploadSource,
	UploadStatus,
	BusinessType,
	eq,
} from "@my-better-t-app/db";
import { v4 as uuidv4 } from "uuid";

/**
 * Excel 파일 업로드 및 처리
 * POST /api/upload
 */
export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get("file") as File;
		const source = formData.get("source") as "A" | "B";

		if (!file) {
			return NextResponse.json(
				{ error: "파일이 제공되지 않았습니다." },
				{ status: 400 },
			);
		}

		if (!source || !["A", "B"].includes(source)) {
			return NextResponse.json(
				{ error: "소스 타입이 올바르지 않습니다. 'A' 또는 'B'를 지정하세요." },
				{ status: 400 },
			);
		}

		// 파일 해시 계산
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const fileHash = createHash("sha256").update(buffer).digest("hex");

		// 작업 ID 생성
		const jobId = uuidv4();

		// 업로드 작업 시작
		await db.insert(uploadJob).values({
			jobId,
			fileName: file.name,
			fileHash,
			source: source as UploadSource,
			status: UploadStatus.processing,
			rowsParsed: 0,
			rowsLoaded: 0,
		});

		// Excel 파일 파싱
		const workbook = XLSX.read(buffer, { type: "buffer" });
		const sheetName = workbook.SheetNames[0];
		const worksheet = workbook.Sheets[sheetName];
		const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });

		let rowsParsed = data.length;
		let rowsLoaded = 0;
		let errorMessage: string | null = null;

		try {
			if (source === "A") {
				// A파일: 프로젝트 마스터 데이터
				rowsLoaded = await processAFile(data);
			} else {
				// B파일: 월별 현금흐름 데이터
				rowsLoaded = await processBFile(data);
			}

			// 작업 완료
			await db
				.update(uploadJob)
				.set({
					status: UploadStatus.success,
					rowsParsed,
					rowsLoaded,
					endedAt: new Date(),
				})
				.where(eq(uploadJob.jobId, jobId));

			return NextResponse.json({
				jobId,
				status: "success",
				rowsParsed,
				rowsLoaded,
			});
		} catch (error) {
			errorMessage =
				error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";

			// 작업 실패
			await db
				.update(uploadJob)
				.set({
					status: UploadStatus.failed,
					rowsParsed,
					rowsLoaded,
					errorMessage,
					endedAt: new Date(),
				})
				.where(eq(uploadJob.jobId, jobId));

			return NextResponse.json(
				{
					jobId,
					status: "failed",
					error: errorMessage,
				},
				{ status: 500 },
			);
		}
	} catch (error) {
		console.error("업로드 처리 오류:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "업로드 처리 중 오류가 발생했습니다.",
			},
			{ status: 500 },
		);
	}
}

/**
 * A파일 처리: 프로젝트 마스터 데이터
 */
async function processAFile(data: any[]): Promise<number> {
	if (!db) {
		throw new Error("데이터베이스 연결이 없습니다.");
	}

	// 검증: 필수 컬럼 확인
	const requiredColumns = [
		"프로젝트명",
		"기획사명",
		"계약시작일",
		"기본계약기간",
		"최초투자금",
		"BM구분",
	];
	const firstRow = data[0];
	if (!firstRow) {
		throw new Error("데이터가 비어있습니다.");
	}

	for (const col of requiredColumns) {
		if (!(col in firstRow)) {
			throw new Error(`필수 컬럼이 없습니다: ${col}`);
		}
	}

	// 기존 데이터 전체 삭제 (TRUNCATE)
	await db.delete(project);

	// 새 데이터 삽입
	const projects = data.map((row) => {
		const projectId = uuidv4();
		const contractStart = String(row["계약시작일"] || "").trim();
		const baseMonths = parseInt(String(row["기본계약기간"] || "0"), 10);
		const extendedMonths = parseInt(String(row["연장기간"] || "0"), 10);
		const initialInvestment = parseInt(String(row["최초투자금"] || "0"), 10);
		const additionalInvestment = parseInt(
			String(row["추가투자금"] || "0"),
			10,
		);
		const totalRecouped = parseInt(String(row["총회수금"] || "0"), 10);
		const mdPurchaseCost = row["음반매입원가"]
			? parseInt(String(row["음반매입원가"]), 10)
			: null;
		const ostInvestment = row["OST투자금"]
			? parseInt(String(row["OST투자금"]), 10)
			: null;

		const businessTypeRaw = String(row["BM구분"] || "").trim();
		const businessType: BusinessType = (Object.values(BusinessType) as string[]).includes(
			businessTypeRaw,
		)
			? (businessTypeRaw as BusinessType)
			: BusinessType.일반투자;

		return {
			projectId,
			projectName: String(row["프로젝트명"] || "").trim(),
			companyName: String(row["기획사명"] || "").trim(),
			contractStartDate: contractStart,
			baseContractMonths: baseMonths,
			extendedMonths: extendedMonths,
			initialInvestment: initialInvestment,
			additionalInvestment: additionalInvestment,
			totalRecouped: totalRecouped,
			mdPurchaseCost: mdPurchaseCost,
			ostInvestment: ostInvestment,
			businessType,
		} satisfies typeof project.$inferInsert;
	});

	// 배치 삽입
	if (projects.length > 0) {
		await db.insert(project).values(projects);
	}

	return projects.length;
}

/**
 * B파일 처리: 월별 현금흐름 데이터
 */
async function processBFile(data: any[]): Promise<number> {
	if (!db) {
		throw new Error("데이터베이스 연결이 없습니다.");
	}

	// 검증: 필수 컬럼 확인
	const requiredColumns = ["프로젝트명", "년월", "매출액", "원가", "회수금"];
	const firstRow = data[0];
	if (!firstRow) {
		throw new Error("데이터가 비어있습니다.");
	}

	for (const col of requiredColumns) {
		if (!(col in firstRow)) {
			throw new Error(`필수 컬럼이 없습니다: ${col}`);
		}
	}

	// 프로젝트 매핑 (프로젝트명 → projectId)
	const allProjects = await db.select().from(project);
	const projectMap = new Map<string, string>();
	for (const p of allProjects) {
		projectMap.set(p.projectName, p.projectId);
	}

	// 기존 cashflow 데이터 전체 삭제
	await db.delete(cashflowMonthly);

	// 새 데이터 삽입
	const cashflows: Array<{
		id: string;
		projectId: string;
		yyyymm: string;
		revenueAmount: number;
		costAmount: number;
		recoupAmount: number;
	}> = [];

	for (const row of data) {
		const projectName = String(row["프로젝트명"] || "").trim();
		const projectId = projectMap.get(projectName);

		if (!projectId) {
			console.warn(`프로젝트를 찾을 수 없습니다: ${projectName}`);
			continue;
		}

		const yyyymm = String(row["년월"] || "").trim();
		const revenueAmount = parseInt(String(row["매출액"] || "0"), 10);
		const costAmount = parseInt(String(row["원가"] || "0"), 10);
		const recoupAmount = parseInt(String(row["회수금"] || "0"), 10);

		cashflows.push({
			id: uuidv4(),
			projectId,
			yyyymm,
			revenueAmount,
			costAmount,
			recoupAmount,
		});
	}

	// 배치 삽입
	if (cashflows.length > 0) {
		await db.insert(cashflowMonthly).values(cashflows);
	}

	return cashflows.length;
}

