import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@my-better-t-app/api/routers/index";
import { createContext } from "@my-better-t-app/api/context";
import { NextRequest } from "next/server";

/**
 * tRPC API 라우트 핸들러
 * GET 및 POST 요청 처리
 */
export async function GET(req: NextRequest) {
	return fetchRequestHandler({
		endpoint: "/api/trpc",
		req,
		router: appRouter,
		createContext: () => createContext(req),
		onError({ error, path }) {
			console.error(`tRPC 에러 [${path}]:`, error);
		},
	});
}

export async function POST(req: NextRequest) {
	return fetchRequestHandler({
		endpoint: "/api/trpc",
		req,
		router: appRouter,
		createContext: () => createContext(req),
		onError({ error, path }) {
			console.error(`tRPC 에러 [${path}]:`, error);
		},
	});
}
