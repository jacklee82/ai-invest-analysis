import { pgTable, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * 업로드 소스 타입
 */
export const UploadSource = {
	A: "A", // A파일 (요약/마스터)
	B: "B", // B파일 (원본/정산)
} as const;

export type UploadSource = (typeof UploadSource)[keyof typeof UploadSource];

/**
 * 업로드 작업 상태
 */
export const UploadStatus = {
	success: "success",
	failed: "failed",
	pending: "pending",
	processing: "processing",
} as const;

export type UploadStatus =
	(typeof UploadStatus)[keyof typeof UploadStatus];

/**
 * 업로드/ETL 이력 테이블
 * 파일 업로드 및 처리 과정을 추적
 */
export const uploadJob = pgTable(
	"upload_job",
	{
		/** 작업 ID (UUID) */
		jobId: varchar("job_id", { length: 255 }).primaryKey(),
		/** 업로드 소스 (A/B) */
		source: varchar("source", { length: 1 })
			.notNull()
			.$type<UploadSource>(),
		/** 파일명 */
		fileName: varchar("file_name", { length: 255 }).notNull(),
		/** 파일 해시 (SHA-256) */
		fileHash: varchar("file_hash", { length: 64 }).notNull(),
		/** 파싱된 행 수 */
		rowsParsed: integer("rows_parsed").notNull().default(0),
		/** 적재된 행 수 */
		rowsLoaded: integer("rows_loaded").notNull().default(0),
		/** 작업 상태 */
		status: varchar("status", { length: 20 })
			.notNull()
			.$type<UploadStatus>()
			.default(UploadStatus.pending),
		/** 시작 일시 */
		startedAt: timestamp("started_at")
			.notNull()
			.defaultNow(),
		/** 종료 일시 */
		endedAt: timestamp("ended_at"),
		/** 에러 메시지 */
		errorMessage: varchar("error_message", { length: 1000 }),
	});

