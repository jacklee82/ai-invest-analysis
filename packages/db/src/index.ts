import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
import * as schema from "./schema";

// 환경변수 로드 (시드 스크립트 등에서 사용하기 위해)
dotenv.config({
	path: "../../apps/web/.env",
});

/**
 * PostgreSQL 연결 문자열 가져오기
 */
function getDatabaseUrl(): string {
	if (process.env.DATABASE_URL) {
		return process.env.DATABASE_URL;
	}
	// 기본값: 로컬 개발용 PostgreSQL
	return "postgresql://postgres:postgres@localhost:5432/ai_invest";
}

/**
 * PostgreSQL 클라이언트 생성
 * @returns Drizzle ORM 인스턴스
 */
const client = postgres(getDatabaseUrl(), {
	max: 1, // 연결 풀 크기
});

export const db = drizzle(client, { schema });

// 스키마 export (다른 패키지에서 사용 가능하도록)
export * from "./schema";
