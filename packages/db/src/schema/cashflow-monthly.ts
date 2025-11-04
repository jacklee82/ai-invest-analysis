import { pgTable, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { project } from "./project";

/**
 * 월별 현금흐름/정산 집계 테이블
 * B파일의 일별 데이터를 월별로 집계하여 저장
 */
export const cashflowMonthly = pgTable(
	"cashflow_monthly",
	{
		/** 레코드 ID (UUID) */
		id: varchar("id", { length: 255 }).primaryKey(),
		/** 프로젝트 ID (외래키) */
		projectId: varchar("project_id", { length: 255 })
			.notNull()
			.references(() => project.projectId, { onDelete: "cascade" }),
		/** 년월 (YYYY-MM) */
		yyyymm: varchar("yyyymm", { length: 7 }).notNull(),
		/** 매출액 (원 단위) */
		revenueAmount: integer("revenue_amount").notNull().default(0),
		/** 원가(지급금) (원 단위) */
		costAmount: integer("cost_amount").notNull().default(0),
		/** 회수금 (원 단위) */
		recoupAmount: integer("recoup_amount").notNull().default(0),
		/** 생성 일시 */
		createdAt: timestamp("created_at")
			.notNull()
			.defaultNow(),
	});

