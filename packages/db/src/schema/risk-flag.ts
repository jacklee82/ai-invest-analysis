import { pgTable, varchar, integer, doublePrecision, boolean, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { project } from "./project";

/**
 * 리스크 평가 스냅샷 테이블
 * 프로젝트별 리스크 상태를 시점별로 기록
 */
export const riskFlag = pgTable(
	"risk_flag",
	{
		/** 평가 ID (UUID) */
		evaluatedId: varchar("evaluated_id", { length: 255 }).primaryKey(),
		/** 프로젝트 ID (외래키) */
		projectId: varchar("project_id", { length: 255 })
			.notNull()
			.references(() => project.projectId, { onDelete: "cascade" }),
		/** 평가 일시 */
		evaluatedAt: timestamp("evaluated_at")
			.notNull()
			.defaultNow(),
		/** 경고 상태 여부 */
		isWarning: boolean("is_warning").notNull().default(false),
		/** 경고 사유 */
		reason: varchar("reason", { length: 500 }),
		/** 회수율 (총회수금 / 총투자금) */
		recoupRatio: doublePrecision("recoup_ratio").notNull().default(0),
		/** 경과 비율 (경과 기간 / 총 계약 기간) */
		elapsedRatio: doublePrecision("elapsed_ratio").notNull().default(0),
	});

