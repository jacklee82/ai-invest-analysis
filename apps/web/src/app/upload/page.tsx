"use client";

/**
 * 업로드 페이지
 * A/B 파일 업로드 및 ETL 처리
 */
export default function UploadPage() {
	return (
		<div className="container mx-auto max-w-7xl px-4 py-6">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">데이터 업로드</h1>
				<p className="text-muted-foreground mt-2">
					A/B 파일 업로드 및 검증
				</p>
			</div>
			{/* TODO: 파일 업로드 UI, A2A 검증, 이력 조회 등 구현 */}
			<div className="rounded-lg border p-8 text-center text-muted-foreground">
				업로드 UI 구현 예정
			</div>
		</div>
	);
}

