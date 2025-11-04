import { pgTable, varchar, integer, date, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { project } from "./project";

/**
 * 차트 진입 정보 테이블
 * 차트 100위권 내 진입 기록을 주 단위로 저장
 */
export const chartEntry = pgTable(
	"chart_entry",
	{
		/** 차트 진입 ID (UUID) */
		chartEntryId: varchar("chart_entry_id", { length: 255 }).primaryKey(),
		/** 프로젝트 ID (외래키) */
		projectId: varchar("project_id", { length: 255 })
			.notNull()
			.references(() => project.projectId, { onDelete: "cascade" }),
		/** 차트 순위 (1~100) */
		chartRank: integer("chart_rank").notNull(),
		/** 해당 주의 시작일 (월요일, YYYY-MM-DD) */
		weekDate: date("week_date").notNull(),
		/** 차트 타입 (가요, OST, 인디 등) */
		chartType: varchar("chart_type", { length: 50 }).notNull().default("가요"),
		/** 생성 일시 */
		createdAt: timestamp("created_at")
			.notNull()
			.defaultNow(),
	},
);

