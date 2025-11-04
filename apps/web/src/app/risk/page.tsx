"use client";

/**
 * 리스크 관리 페이지
 * Module 3: 리스크 관리 시스템 (P2 - 사업관리)
 * 선급투자의 사후 관리를 위한 모듈
 */
export default function RiskPage() {
	return (
		<div className="container mx-auto max-w-7xl px-4 py-6">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">리스크 관리</h1>
				<p className="text-muted-foreground mt-2">
					투자 리스크 모니터링 및 성과 분석
				</p>
			</div>
			{/* TODO: 경고 목록 테이블, 필터, 상세 팝업 등 구현 */}
			<div className="rounded-lg border p-8 text-center text-muted-foreground">
				리스크 목록 구현 예정
			</div>
		</div>
	);
}

