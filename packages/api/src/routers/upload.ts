import { z } from "zod";
import { router, publicProcedure } from "../index";

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
		.query(async ({ input }) => {
			// TODO: DB에서 실제 데이터 조회
			return {
				items: [] as Array<{
					jobId: string;
					fileName: string;
					source: "A" | "B";
					status: "success" | "failed" | "pending" | "processing";
					rowsParsed: number;
					rowsLoaded: number;
					startedAt: string;
					endedAt: string | null;
				}>,
				total: 0,
				page: input.page,
				pageSize: input.pageSize,
			};
		}),
});

