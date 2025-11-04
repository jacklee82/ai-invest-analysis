"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import ReactECharts from "echarts-for-react";

/**
 * 리스크 관리 페이지
 * Module 3: 리스크 관리 시스템 (P2 - 사업관리)
 * 선급투자의 사후 관리를 위한 모듈
 */
export default function RiskPage() {
	const [page, setPage] = useState(1);
	const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
	const pageSize = 20;

	const warningsQuery = useQuery(
		trpc.risk.listWarnings.queryOptions({ page, pageSize }),
	);

	const detailQuery = useQuery(
		trpc.risk.getRiskDetail.queryOptions(
			{ projectId: selectedProjectId || "" },
			{
				enabled: !!selectedProjectId,
			},
		),
	);

	const formatCurrency = (amount: number) => {
		if (amount >= 100000000) {
			return `${(amount / 100000000).toFixed(1)}억원`;
		}
		if (amount >= 10000) {
			return `${(amount / 10000).toFixed(0)}만원`;
		}
		return `${amount.toLocaleString()}원`;
	};

	const formatPercentage = (value: number) => {
		return `${value.toFixed(1)}%`;
	};

	return (
		<div className="container mx-auto max-w-7xl px-4 py-6">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">리스크 관리</h1>
				<p className="text-muted-foreground mt-2">
					투자 리스크 모니터링 및 성과 분석
				</p>
			</div>

			{/* 경고 목록 테이블 */}
			<Card>
				<CardHeader>
					<CardTitle>경고 상태 투자 건 목록</CardTitle>
				</CardHeader>
				<CardContent>
					{warningsQuery.isLoading ? (
						<div className="space-y-2">
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
						</div>
					) : warningsQuery.isError ? (
						<div className="text-center py-8 text-destructive">
							데이터를 불러오는 중 오류가 발생했습니다.
						</div>
					) : warningsQuery.data?.items.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							경고 상태인 투자 건이 없습니다.
						</div>
					) : (
						<>
							<div className="overflow-x-auto">
								<table className="w-full border-collapse">
									<thead>
										<tr className="border-b">
											<th className="text-left p-3 font-semibold">프로젝트명</th>
											<th className="text-left p-3 font-semibold">기획사</th>
											<th className="text-right p-3 font-semibold">총 투자금</th>
											<th className="text-right p-3 font-semibold">회수율</th>
											<th className="text-right p-3 font-semibold">계약 기간</th>
											<th className="text-right p-3 font-semibold">경과 기간</th>
											<th className="text-center p-3 font-semibold">상세</th>
										</tr>
									</thead>
									<tbody>
										{warningsQuery.data?.items.map((item) => (
											<tr
												key={item.projectId}
												className="border-b hover:bg-accent/50 cursor-pointer"
												onClick={() => setSelectedProjectId(item.projectId)}
											>
												<td className="p-3">{item.projectName}</td>
												<td className="p-3">{item.companyName}</td>
												<td className="p-3 text-right">
													{formatCurrency(item.totalInvestment)}
												</td>
												<td className="p-3 text-right">
													<span
														className={
															item.recoupRate < 30
																? "text-destructive font-semibold"
																: item.recoupRate < 40
																	? "text-orange-500 font-semibold"
																	: "text-muted-foreground"
														}
													>
														{formatPercentage(item.recoupRate)}
													</span>
												</td>
												<td className="p-3 text-right">{item.contractPeriod}개월</td>
												<td className="p-3 text-right">{item.elapsedPeriod}개월</td>
												<td className="p-3 text-center">
													<Button
														variant="outline"
														size="sm"
														onClick={(e) => {
															e.stopPropagation();
															setSelectedProjectId(item.projectId);
														}}
													>
														보기
													</Button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							{/* 페이지네이션 */}
							{warningsQuery.data && warningsQuery.data.totalPages > 1 && (
								<div className="flex items-center justify-between mt-4">
									<div className="text-sm text-muted-foreground">
										총 {warningsQuery.data.total}건 중{" "}
										{(page - 1) * pageSize + 1}-
										{Math.min(page * pageSize, warningsQuery.data.total)}건 표시
									</div>
									<div className="flex gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setPage((p) => Math.max(1, p - 1))}
											disabled={page === 1}
										>
											이전
										</Button>
										<span className="flex items-center px-3 text-sm">
											{page} / {warningsQuery.data.totalPages}
										</span>
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												setPage((p) =>
													Math.min(warningsQuery.data!.totalPages, p + 1),
												)
											}
											disabled={page >= warningsQuery.data.totalPages}
										>
											다음
										</Button>
									</div>
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>

			{/* 상세 팝업 모달 */}
			{selectedProjectId && (
				<div
					className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
					onClick={() => setSelectedProjectId(null)}
				>
					<Card
						className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
						onClick={(e) => e.stopPropagation()}
					>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle>리스크 상세 정보</CardTitle>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setSelectedProjectId(null)}
								>
									✕
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							{detailQuery.isLoading ? (
								<div className="space-y-4">
									<Skeleton className="h-6 w-full" />
									<Skeleton className="h-6 w-full" />
									<Skeleton className="h-64 w-full" />
								</div>
							) : detailQuery.isError ? (
								<div className="text-center py-8 text-destructive">
									상세 정보를 불러오는 중 오류가 발생했습니다.
								</div>
							) : detailQuery.data ? (
								<div className="space-y-6">
									{/* 기본 정보 */}
									<div className="grid grid-cols-2 gap-4">
										<div>
											<div className="text-sm text-muted-foreground">프로젝트명</div>
											<div className="font-semibold">{detailQuery.data.projectName}</div>
										</div>
										<div>
											<div className="text-sm text-muted-foreground">기획사</div>
											<div className="font-semibold">{detailQuery.data.companyName}</div>
										</div>
										<div>
											<div className="text-sm text-muted-foreground">총 투자금</div>
											<div className="font-semibold">
												{formatCurrency(detailQuery.data.totalInvestment)}
											</div>
										</div>
										<div>
											<div className="text-sm text-muted-foreground">현재 회수율</div>
											<div className="font-semibold">
												{formatPercentage(detailQuery.data.currentRecoupRate)}
											</div>
										</div>
										<div>
											<div className="text-sm text-muted-foreground">계약 시작일</div>
											<div className="font-semibold">
												{detailQuery.data.contractStartDate}
											</div>
										</div>
										<div>
											<div className="text-sm text-muted-foreground">계약 기간</div>
											<div className="font-semibold">
												{detailQuery.data.contractPeriod}개월
												{detailQuery.data.extendedPeriod > 0 &&
													` (+${detailQuery.data.extendedPeriod}개월 연장)`}
											</div>
										</div>
									</div>

									{/* 최근 3개월 추이 차트 */}
									{detailQuery.data.recentMonths.length > 0 && (
										<div>
											<div className="text-sm font-semibold mb-2">
												최근 3개월 회수액 추이
											</div>
											<ReactECharts
												option={{
													tooltip: {
														trigger: "axis",
														formatter: (params: any) => {
															const param = params[0];
															return `${param.name}<br/>회수액: ${formatCurrency(param.value)}`;
														},
													},
													xAxis: {
														type: "category",
														data: detailQuery.data.recentMonths.map((m) => m.yyyymm),
													},
													yAxis: {
														type: "value",
														axisLabel: {
															formatter: (value: number) => {
																if (value >= 100000000) {
																	return `${(value / 100000000).toFixed(1)}억`;
																}
																if (value >= 10000) {
																	return `${(value / 10000).toFixed(0)}만`;
																}
																return value.toLocaleString();
															},
														},
													},
													series: [
														{
															type: "line",
															data: detailQuery.data.recentMonths.map(
																(m) => m.recoupAmount,
															),
															smooth: true,
															itemStyle: { color: "#ef4444" },
															areaStyle: {
																color: {
																	type: "linear",
																	x: 0,
																	y: 0,
																	x2: 0,
																	y2: 1,
																	colorStops: [
																		{ offset: 0, color: "rgba(239, 68, 68, 0.3)" },
																		{ offset: 1, color: "rgba(239, 68, 68, 0.05)" },
																	],
																},
															},
														},
													],
													grid: {
														left: "3%",
														right: "4%",
														bottom: "3%",
														containLabel: true,
													},
												}}
												style={{ height: "300px" }}
											/>
										</div>
									)}
								</div>
							) : null}
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
}
