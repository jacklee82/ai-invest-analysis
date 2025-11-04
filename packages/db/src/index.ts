import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
import * as schema from "./schema";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// ESM에서 __dirname 계산
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 환경변수 로드 (시드 스크립트 등에서 사용하기 위해)
// Next.js 런타임에서는 이미 환경변수가 로드되어 있으므로, 없을 때만 로드
if (!process.env.DATABASE_URL) {
	// 프로젝트 루트 기준으로 절대 경로 계산
	const projectRoot = resolve(__dirname, "../../../");
	const envPath = resolve(projectRoot, "apps/web/.env");
	const envLocalPath = resolve(projectRoot, "apps/web/.env.local");
	
	console.log("[DB] 환경변수 로드 시도:", { envPath, envLocalPath });
	
	// .env.local 우선 시도 (Next.js 우선순위와 동일)
	try {
		dotenv.config({ path: envLocalPath });
		if (process.env.DATABASE_URL) {
			console.log("[DB] .env.local에서 로드 성공");
		}
	} catch (err) {
		console.log("[DB] .env.local 로드 실패:", err);
	}
	
	// .env 시도
	if (!process.env.DATABASE_URL) {
		try {
			dotenv.config({ path: envPath });
			if (process.env.DATABASE_URL) {
				console.log("[DB] .env에서 로드 성공");
			}
		} catch (err) {
			console.log("[DB] .env 로드 실패:", err);
		}
	}
	
	// 여전히 없으면 상대 경로로 시도 (fallback)
	if (!process.env.DATABASE_URL) {
		try {
			dotenv.config({ path: "../../apps/web/.env" });
			if (process.env.DATABASE_URL) {
				console.log("[DB] 상대 경로 .env에서 로드 성공");
			}
		} catch (err) {
			console.log("[DB] 상대 경로 .env 로드 실패:", err);
		}
	}
}

/**
 * PostgreSQL 연결 문자열 가져오기
 */
function getDatabaseUrl(): string {
	if (process.env.DATABASE_URL) {
		// 보안을 위해 비밀번호는 마스킹하여 로그 출력
		const maskedUrl = process.env.DATABASE_URL.replace(
			/(:\/\/[^:]+:)([^@]+)(@)/,
			"$1****$3",
		);
		console.log("[DB] DATABASE_URL 사용:", maskedUrl);
		return process.env.DATABASE_URL;
	}
	// 기본값: 로컬 개발용 PostgreSQL (my_db 사용)
	const defaultUrl = "postgresql://postgres:postgres@localhost:5432/my_db";
	console.log("[DB] DATABASE_URL이 없어 기본값 사용:", defaultUrl);
	return defaultUrl;
}

/**
 * PostgreSQL 클라이언트 생성
 * @returns Drizzle ORM 인스턴스
 */
const client = postgres(getDatabaseUrl(), {
	max: 1, // 연결 풀 크기 (Supabase 무료 티어 제한: 2개 동시 연결)
	// Supabase Connection Pooler를 사용하는 경우 자동으로 풀링 처리됨
});

export const db = drizzle(client, { schema });

// 스키마 export (다른 패키지에서 사용 가능하도록)
export * from "./schema";
