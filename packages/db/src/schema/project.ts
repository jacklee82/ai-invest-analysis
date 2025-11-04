import { pgTable, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * 사업 타입 열거형
 */
export const BusinessType = {
	선급투자: "선급투자",
	일반투자: "일반투자",
	OST: "OST",
	음반: "음반",
} as const;

export type BusinessType = (typeof BusinessType)[keyof typeof BusinessType];

/**
 * 프로젝트/투자 마스터 테이블
 * A파일의 주요 데이터를 저장
 */
export const project = pgTable(
	"project",
	{
		/** 프로젝트 ID (UUID) */
		projectId: varchar("project_id", { length: 255 }).primaryKey(),
		/** 프로젝트명 (고유, 데이터 키) */
		projectName: varchar("project_name", { length: 255 }).notNull().unique(),
		/** 기획사명 */
		companyName: varchar("company_name", { length: 255 }).notNull(),
		/** 계약 시작일 (YYYY-MM-DD) */
		contractStartDate: varchar("contract_start_date", { length: 10 }).notNull(),
		/** 기본 계약 기간 (개월) */
		baseContractMonths: integer("base_contract_months").notNull(),
		/** 연장 기간 (개월) */
		extendedMonths: integer("extended_months").notNull().default(0),
		/** 최초 투자금 (원 단위) */
		initialInvestment: integer("initial_investment").notNull(),
		/** 추가 투자금 (원 단위) */
		additionalInvestment: integer("additional_investment").notNull().default(0),
		/** 총 회수금 (원 단위) */
		totalRecouped: integer("total_recouped").notNull().default(0),
		/** 음반 매입원가 (원 단위, 음반 사업만) */
		mdPurchaseCost: integer("md_purchase_cost"),
		/** OST 투자금 (원 단위, OST 사업만) */
		ostInvestment: integer("ost_investment"),
		/** BM 구분 */
		businessType: varchar("business_type", { length: 50 })
			.notNull()
			.$type<BusinessType>(),
		/** 최종 업데이트 일시 */
		updatedAt: timestamp("updated_at")
			.notNull()
			.defaultNow(),
	});

