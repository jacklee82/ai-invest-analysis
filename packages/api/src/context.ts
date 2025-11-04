import type { NextRequest } from "next/server";

/**
 * tRPC 컨텍스트 생성
 * @param req Next.js 요청 객체
 * @returns tRPC 컨텍스트
 */
export async function createContext(req: NextRequest) {
	try {
		// DB는 lazy import로 처리하여 타입 에러 방지
		const { db } = await import("@my-better-t-app/db");
		
		// TODO: 인증 구현 시 세션 정보 추가
		return {
			session: null,
			db,
		};
	} catch (error) {
		console.error("DB 초기화 실패:", error);
		console.error("에러 상세:", error instanceof Error ? error.stack : error);
		// 에러 발생 시에도 기본 컨텍스트 반환
		return {
			session: null,
			db: null as any, // 타입 체크를 위해 임시 처리
		};
	}
}

export type Context = Awaited<ReturnType<typeof createContext>>;
