import { z } from "zod";
import { router, publicProcedure } from "../index";
import { uploadJob, UploadStatus, eq, desc } from "@my-better-t-app/db";

/**
 * 업로드 라우터
 * A/B 파일 업로드 및 ETL 처리
 */
export const uploadRouter = router({
	/**
	 * 업로드 작업 시작
	 * @param input 파일 메타데이터
	 * @returns 작업 ID
	 */
	startJob: publicProcedure
		.input(
			z.object({
				fileName: z.string(),
				fileHash: z.string(),
				source: z.enum(["A", "B"]),
			}),
		)
		.mutation(async ({ input }) => {
			// TODO: upload_job 테이블에 레코드 생성
			// TODO: 파일 검증 시작
			return {
				jobId: "",
			};
		}),

	/**
	 * 업로드 작업 완료 처리
	 * @param input 작업 ID 및 결과 정보
	 * @returns 작업 완료 여부
	 */
	finishJob: publicProcedure
		.input(
			z.object({
				jobId: z.string(),
				status: z.enum(["success", "failed"]),
				rowsParsed: z.number(),
				rowsLoaded: z.number(),
				errorMessage: z.string().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			// TODO: upload_job 테이블 업데이트
			// TODO: 성공 시 DB 적재, 실패 시 롤백
			return {
				success: true,
			};
		}),

	/**
	 * 업로드 이력 조회
	 * @param input 페이지네이션 정보
	 * @returns 업로드 작업 이력 목록
	 */
	getUploadHistory: publicProcedure
		.input(
			z.object({
				page: z.number().min(1).default(1),
				pageSize: z.number().min(1).max(100).default(20),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { db } = ctx;

			if (!db) {
				throw new Error("데이터베이스 연결이 없습니다.");
			}

			// 전체 개수 조회
			const allJobs = await db.select().from(uploadJob).orderBy(desc(uploadJob.startedAt));
			const total = allJobs.length;

			// 페이지네이션
			const startIndex = (input.page - 1) * input.pageSize;
			const endIndex = startIndex + input.pageSize;
			const paginatedJobs = allJobs.slice(startIndex, endIndex);

			return {
				items: paginatedJobs.map((job: { jobId: string; fileName: string; source: string; status: string; rowsParsed: number; rowsLoaded: number; startedAt: Date; endedAt: Date | null; errorMessage: string | null }) => ({
					jobId: job.jobId,
					fileName: job.fileName,
					source: job.source as "A" | "B",
					status: job.status as
						| "success"
						| "failed"
						| "pending"
						| "processing",
					rowsParsed: job.rowsParsed,
					rowsLoaded: job.rowsLoaded,
					startedAt: job.startedAt.toISOString(),
					endedAt: job.endedAt?.toISOString() || null,
					errorMessage: job.errorMessage || null,
				})),
				total,
				page: input.page,
				pageSize: input.pageSize,
				totalPages: Math.ceil(total / input.pageSize),
			};
		}),
});

