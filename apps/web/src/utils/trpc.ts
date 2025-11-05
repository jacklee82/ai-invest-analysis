import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import superjson from "superjson";
import type { AppRouter } from "@my-better-t-app/api/routers/index";
import { toast } from "sonner";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// 캐시된 데이터를 fresh로 간주하는 시간 (5분)
			staleTime: 1000 * 60 * 5,
			// 캐시에서 데이터를 유지하는 시간 (10분)
			gcTime: 1000 * 60 * 10, // cacheTime이 v5에서 gcTime으로 변경됨
			// 윈도우 포커스 시 자동 refetch 비활성화 (깜빡임 방지)
			refetchOnWindowFocus: false,
			// 컴포넌트 마운트 시: stale 데이터가 있으면 refetch, 없으면 캐시 사용
			refetchOnMount: "always",
			// 네트워크 재연결 시 refetch 비활성화
			refetchOnReconnect: false,
			// 재시도 횟수 (504 타임아웃은 재시도하지 않음)
			retry: (failureCount, error) => {
				// 타임아웃 오류는 재시도하지 않음
				if (error?.message?.includes("시간이 초과") || error?.message?.includes("504")) {
					return false;
				}
				return failureCount < 1; // 최대 1회 재시도
			},
			// 재시도 지연시간 (지수 백오프)
			retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
		},
	},
	queryCache: new QueryCache({
		onError: (error) => {
			toast.error(error.message, {
				action: {
					label: "retry",
					onClick: () => {
						queryClient.invalidateQueries();
					},
				},
			});
		},
	}),
});

/**
 * tRPC 클라이언트 생성
 * superjson transformer를 사용하여 Date, Map, Set 등 직렬화 지원
 */
export const trpcClient = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: "/api/trpc",
			transformer: superjson,
			// HTTP 요청 타임아웃 (8초)
			fetch: async (url, options) => {
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 8000);
				
				try {
					const response = await fetch(url, {
						...options,
						signal: controller.signal,
					});
					clearTimeout(timeoutId);
					return response;
				} catch (error) {
					clearTimeout(timeoutId);
					if (error instanceof Error && error.name === "AbortError") {
						throw new Error("요청 시간이 초과되었습니다. 데이터베이스 연결을 확인해주세요.");
					}
					throw error;
				}
			},
		}),
	],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
	client: trpcClient,
	queryClient,
});
