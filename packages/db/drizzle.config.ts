import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config({
	path: "../../apps/web/.env",
});

/**
 * Drizzle Kit 설정
 * PostgreSQL 사용
 */
export default defineConfig({
	schema: "./src/schema/index.ts",
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/ai_invest",
	},
});
