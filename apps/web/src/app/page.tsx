"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * 홈 페이지
 * 대시보드로 자동 리다이렉트
 */
export default function Home() {
	const router = useRouter();

	useEffect(() => {
		router.replace("/dashboard");
	}, [router]);

	return (
		<div className="container mx-auto max-w-3xl px-4 py-2">
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center">
					<p className="text-muted-foreground">대시보드로 이동 중...</p>
				</div>
			</div>
		</div>
	);
}
