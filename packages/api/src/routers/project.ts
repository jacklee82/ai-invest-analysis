import { z } from "zod";
import { router, publicProcedure } from "../index";
import { project, cashflowMonthly, BusinessType, eq } from "@my-better-t-app/db";
import { desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

/**
 * 프로젝트 관리 라우터
 * 프로젝트 추가/수정/삭제 및 월별 현금흐름 관리
 */
export const projectRouter = router({
	/**
	 * 프로젝트 목록 조회
	 * @param input 페이지네이션 및 필터 정보
	 * @returns 프로젝트 목록
	 */
	list: publicProcedure
		.input(
			z.object({
				page: z.number().min(1).default(1),
				pageSize: z.number().min(1).max(100).default(20),
				businessType: z.enum(["선급투자", "일반투자", "OST", "음반"]).optional(),
				companyName: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { db } = ctx;

			if (!db) {
				throw new Error("데이터베이스 연결이 없습니다.");
			}

			// 모든 프로젝트 조회
			let allProjects = await db.select().from(project);

			// 필터 적용
			if (input.businessType) {
				allProjects = allProjects.filter(
					(p: { businessType: string }) => p.businessType === input.businessType,
				);
			}
			if (input.companyName) {
				allProjects = allProjects.filter(
					(p: { companyName: string }) => p.companyName.includes(input.companyName!),
				);
			}

			// 정렬 (최신순)
			allProjects.sort((a: { contractStartDate: string }, b: { contractStartDate: string }) => {
				const dateA = new Date(a.contractStartDate);
				const dateB = new Date(b.contractStartDate);
				return dateB.getTime() - dateA.getTime();
			});

			const total = allProjects.length;

			// 페이지네이션
			const startIndex = (input.page - 1) * input.pageSize;
			const endIndex = startIndex + input.pageSize;
			const paginatedProjects = allProjects.slice(startIndex, endIndex);

			return {
				items: paginatedProjects,
				total,
				page: input.page,
				pageSize: input.pageSize,
				totalPages: Math.ceil(total / input.pageSize),
			};
		}),

	/**
	 * 프로젝트 상세 조회
	 * @param input 프로젝트 ID
	 * @returns 프로젝트 상세 정보
	 */
	getById: publicProcedure
		.input(z.object({ projectId: z.string() }))
		.query(async ({ ctx, input }) => {
			const { db } = ctx;

			if (!db) {
				throw new Error("데이터베이스 연결이 없습니다.");
			}

			const projects = await db
				.select()
				.from(project)
				.where(eq(project.projectId, input.projectId))
				.limit(1);

			if (projects.length === 0) {
				throw new Error("프로젝트를 찾을 수 없습니다.");
			}

			return projects[0];
		}),

	/**
	 * 프로젝트 추가
	 * @param input 프로젝트 정보
	 * @returns 생성된 프로젝트
	 */
	create: publicProcedure
		.input(
			z.object({
				projectName: z.string().min(1),
				companyName: z.string().min(1),
				contractStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
				baseContractMonths: z.number().min(1),
				extendedMonths: z.number().min(0).default(0),
				initialInvestment: z.number().min(0),
				additionalInvestment: z.number().min(0).default(0),
				totalRecouped: z.number().min(0).default(0),
				mdPurchaseCost: z.number().min(0).nullable().optional(),
				ostInvestment: z.number().min(0).nullable().optional(),
				businessType: z.enum(["선급투자", "일반투자", "OST", "음반"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { db } = ctx;

			if (!db) {
				throw new Error("데이터베이스 연결이 없습니다.");
			}

			// 프로젝트명 중복 확인
			const existing = await db
				.select()
				.from(project)
				.where(eq(project.projectName, input.projectName))
				.limit(1);

			if (existing.length > 0) {
				throw new Error("이미 존재하는 프로젝트명입니다.");
			}

			const projectId = uuidv4();
			const newProject = {
				projectId,
				projectName: input.projectName,
				companyName: input.companyName,
				contractStartDate: input.contractStartDate,
				baseContractMonths: input.baseContractMonths,
				extendedMonths: input.extendedMonths,
				initialInvestment: input.initialInvestment,
				additionalInvestment: input.additionalInvestment,
				totalRecouped: input.totalRecouped,
				mdPurchaseCost: input.mdPurchaseCost ?? null,
				ostInvestment: input.ostInvestment ?? null,
				businessType: input.businessType as typeof BusinessType[keyof typeof BusinessType],
			};

			await db.insert(project).values(newProject);

			return newProject;
		}),

	/**
	 * 프로젝트 수정
	 * @param input 프로젝트 ID 및 수정 정보
	 * @returns 수정된 프로젝트
	 */
	update: publicProcedure
		.input(
			z.object({
				projectId: z.string(),
				projectName: z.string().min(1).optional(),
				companyName: z.string().min(1).optional(),
				contractStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
				baseContractMonths: z.number().min(1).optional(),
				extendedMonths: z.number().min(0).optional(),
				initialInvestment: z.number().min(0).optional(),
				additionalInvestment: z.number().min(0).optional(),
				totalRecouped: z.number().min(0).optional(),
				mdPurchaseCost: z.number().min(0).nullable().optional(),
				ostInvestment: z.number().min(0).nullable().optional(),
				businessType: z.enum(["선급투자", "일반투자", "OST", "음반"]).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { db } = ctx;

			if (!db) {
				throw new Error("데이터베이스 연결이 없습니다.");
			}

			const { projectId, ...updateData } = input;

			// 프로젝트 존재 확인
			const existing = await db
				.select()
				.from(project)
				.where(eq(project.projectId, projectId))
				.limit(1);

			if (existing.length === 0) {
				throw new Error("프로젝트를 찾을 수 없습니다.");
			}

			// 프로젝트명 중복 확인 (변경 시)
			if (updateData.projectName && updateData.projectName !== existing[0].projectName) {
				const duplicate = await db
					.select()
					.from(project)
					.where(eq(project.projectName, updateData.projectName))
					.limit(1);

				if (duplicate.length > 0) {
					throw new Error("이미 존재하는 프로젝트명입니다.");
				}
			}

			// 업데이트
			const updateFields: any = {};
			if (updateData.projectName !== undefined) updateFields.projectName = updateData.projectName;
			if (updateData.companyName !== undefined) updateFields.companyName = updateData.companyName;
			if (updateData.contractStartDate !== undefined) updateFields.contractStartDate = updateData.contractStartDate;
			if (updateData.baseContractMonths !== undefined) updateFields.baseContractMonths = updateData.baseContractMonths;
			if (updateData.extendedMonths !== undefined) updateFields.extendedMonths = updateData.extendedMonths;
			if (updateData.initialInvestment !== undefined) updateFields.initialInvestment = updateData.initialInvestment;
			if (updateData.additionalInvestment !== undefined) updateFields.additionalInvestment = updateData.additionalInvestment;
			if (updateData.totalRecouped !== undefined) updateFields.totalRecouped = updateData.totalRecouped;
			if (updateData.mdPurchaseCost !== undefined) updateFields.mdPurchaseCost = updateData.mdPurchaseCost;
			if (updateData.ostInvestment !== undefined) updateFields.ostInvestment = updateData.ostInvestment;
			if (updateData.businessType !== undefined) updateFields.businessType = updateData.businessType;

			await db.update(project).set(updateFields).where(eq(project.projectId, projectId));

			// 업데이트된 프로젝트 반환
			const updated = await db
				.select()
				.from(project)
				.where(eq(project.projectId, projectId))
				.limit(1);

			return updated[0];
		}),

	/**
	 * 프로젝트 삭제
	 * @param input 프로젝트 ID
	 * @returns 삭제 성공 여부
	 */
	delete: publicProcedure
		.input(z.object({ projectId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const { db } = ctx;

			if (!db) {
				throw new Error("데이터베이스 연결이 없습니다.");
			}

			// 프로젝트 존재 확인
			const existing = await db
				.select()
				.from(project)
				.where(eq(project.projectId, input.projectId))
				.limit(1);

			if (existing.length === 0) {
				throw new Error("프로젝트를 찾을 수 없습니다.");
			}

			// 삭제 (CASCADE로 현금흐름 데이터도 함께 삭제됨)
			await db.delete(project).where(eq(project.projectId, input.projectId));

			return { success: true };
		}),

	/**
	 * 프로젝트의 월별 현금흐름 조회
	 * @param input 프로젝트 ID
	 * @returns 월별 현금흐름 목록
	 */
	getCashflows: publicProcedure
		.input(z.object({ projectId: z.string() }))
		.query(async ({ ctx, input }) => {
			const { db } = ctx;

			if (!db) {
				throw new Error("데이터베이스 연결이 없습니다.");
			}

			const cashflows = await db
				.select()
				.from(cashflowMonthly)
				.where(eq(cashflowMonthly.projectId, input.projectId))
				.orderBy(cashflowMonthly.yyyymm);

			return cashflows;
		}),

	/**
	 * 월별 현금흐름 추가
	 * @param input 현금흐름 정보
	 * @returns 생성된 현금흐름
	 */
	addCashflow: publicProcedure
		.input(
			z.object({
				projectId: z.string(),
				yyyymm: z.string().regex(/^\d{4}-\d{2}$/),
				revenueAmount: z.number().min(0),
				costAmount: z.number().min(0),
				recoupAmount: z.number().min(0),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { db } = ctx;

			if (!db) {
				throw new Error("데이터베이스 연결이 없습니다.");
			}

			// 프로젝트 존재 확인
			const existing = await db
				.select()
				.from(project)
				.where(eq(project.projectId, input.projectId))
				.limit(1);

			if (existing.length === 0) {
				throw new Error("프로젝트를 찾을 수 없습니다.");
			}

			// 중복 확인
			const duplicate = await db
				.select()
				.from(cashflowMonthly)
				.where(eq(cashflowMonthly.projectId, input.projectId))
				.where(eq(cashflowMonthly.yyyymm, input.yyyymm))
				.limit(1);

			if (duplicate.length > 0) {
				throw new Error("이미 존재하는 년월의 데이터입니다.");
			}

			const cashflow = {
				id: uuidv4(),
				projectId: input.projectId,
				yyyymm: input.yyyymm,
				revenueAmount: input.revenueAmount,
				costAmount: input.costAmount,
				recoupAmount: input.recoupAmount,
			};

			await db.insert(cashflowMonthly).values(cashflow);

			return cashflow;
		}),

	/**
	 * 월별 현금흐름 수정
	 * @param input 현금흐름 ID 및 수정 정보
	 * @returns 수정된 현금흐름
	 */
	updateCashflow: publicProcedure
		.input(
			z.object({
				id: z.string(),
				revenueAmount: z.number().min(0).optional(),
				costAmount: z.number().min(0).optional(),
				recoupAmount: z.number().min(0).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { db } = ctx;

			if (!db) {
				throw new Error("데이터베이스 연결이 없습니다.");
			}

			const { id, ...updateData } = input;

			// 현금흐름 존재 확인
			const existing = await db
				.select()
				.from(cashflowMonthly)
				.where(eq(cashflowMonthly.id, id))
				.limit(1);

			if (existing.length === 0) {
				throw new Error("현금흐름 데이터를 찾을 수 없습니다.");
			}

			// 업데이트
			const updateFields: any = {};
			if (updateData.revenueAmount !== undefined) updateFields.revenueAmount = updateData.revenueAmount;
			if (updateData.costAmount !== undefined) updateFields.costAmount = updateData.costAmount;
			if (updateData.recoupAmount !== undefined) updateFields.recoupAmount = updateData.recoupAmount;

			await db.update(cashflowMonthly).set(updateFields).where(eq(cashflowMonthly.id, id));

			// 업데이트된 현금흐름 반환
			const updated = await db
				.select()
				.from(cashflowMonthly)
				.where(eq(cashflowMonthly.id, id))
				.limit(1);

			return updated[0];
		}),

	/**
	 * 월별 현금흐름 삭제
	 * @param input 현금흐름 ID
	 * @returns 삭제 성공 여부
	 */
	deleteCashflow: publicProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const { db } = ctx;

			if (!db) {
				throw new Error("데이터베이스 연결이 없습니다.");
			}

			await db.delete(cashflowMonthly).where(eq(cashflowMonthly.id, input.id));

			return { success: true };
		}),
});



