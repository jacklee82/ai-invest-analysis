import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";
import { resolve } from "path";

// .env.local 우선 로드 (Next.js와 동일한 우선순위)
const envLocalPath = resolve(__dirname, "../../apps/web/.env.local");
const envPath = resolve(__dirname, "../../apps/web/.env");

// .env.local 우선 시도
try {
	dotenv.config({ path: envLocalPath });
} catch (err) {
	// .env.local이 없으면 .env 시도
}

// .env.local에 DATABASE_URL이 없으면 .env 시도
if (!process.env.DATABASE_URL) {
	try {
		dotenv.config({ path: envPath });
	} catch (err) {
		// .env도 없으면 기본값 사용
	}
}

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
