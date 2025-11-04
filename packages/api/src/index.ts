import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";

/**
 * tRPC 초기화
 * superjson을 사용하여 Date, Map, Set 등의 타입 직렬화 지원
 */
export const t = initTRPC.context<Context>().create({
	transformer: superjson,
	errorFormatter({ shape, error }) {
		return {
			...shape,
			data: {
				...shape.data,
				code: error.code,
				httpStatus: error.cause instanceof Error ? error.cause.message : undefined,
			},
		};
	},
});

export const router = t.router;

export const publicProcedure = t.procedure;
