"use client";

/**
 * 시뮬레이션 페이지
 * Module 2: 선급투자 시뮬레이터 (P3 - 투자심사)
 * AI 기반 투자 의사결정 지원
 */
export default function SimulationPage() {
	return (
		<div className="container mx-auto max-w-7xl px-4 py-6">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">투자 시뮬레이터</h1>
				<p className="text-muted-foreground mt-2">
					구보 투자 시뮬레이션 및 예측
				</p>
			</div>
			{/* TODO: 입력 폼, 예측 결과, DCF/BEP 계산 등 구현 */}
			<div className="rounded-lg border p-8 text-center text-muted-foreground">
				시뮬레이션 입력 폼 구현 예정
			</div>
		</div>
	);
}

