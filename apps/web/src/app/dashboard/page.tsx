"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { KPICard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import ReactECharts from "echarts-for-react";

/**
 * 대시보드 페이지
 * Module 1: 통합 대시보드 (P1 - 경영진)
 * 경영진의 빠른 현황 파악을 위한 모듈
 */
export default function DashboardPage() {
	const router = useRouter();
	const summary = useQuery(trpc.dashboard.getSummary.queryOptions());
	const businessComparison = useQuery(
		trpc.dashboard.getBusinessComparison.queryOptions(),
	);
	const trends = useQuery(trpc.dashboard.getTrends.queryOptions());
	const waterfall = useQuery(trpc.dashboard.getWaterfall.queryOptions());
	const topCompanies = useQuery(trpc.dashboard.getTopCompanies.queryOptions());

	// 디버깅: React Query 상태 확인
	useEffect(() => {
		console.log("[Dashboard Page] ===== React Query 상태 =====");
		console.log("summary.isLoading:", summary.isLoading);
		console.log("summary.isError:", summary.isError);
		console.log("summary.isSuccess:", summary.isSuccess);
		console.log("summary.data:", summary.data);
		console.log("summary.error:", summary.error);
		
		if (summary.data) {
			console.log("[Dashboard Page] ===== summary.data 상세 =====");
			console.log("totalInvestment:", summary.data.totalInvestment, "타입:", typeof summary.data.totalInvestment);
			console.log("recoupRate:", summary.data.recoupRate, "타입:", typeof summary.data.recoupRate);
			console.log("riskCount:", summary.data.riskCount, "타입:", typeof summary.data.riskCount);
			console.log("yoy:", summary.data.yoy);
			console.log("전체 데이터 (JSON):", JSON.stringify(summary.data, null, 2));
		}
		
		console.log("businessComparison.isLoading:", businessComparison.isLoading);
		console.log("businessComparison.data 길이:", businessComparison.data?.length);
		console.log("businessComparison.data:", businessComparison.data);
		
		console.log("trends.isLoading:", trends.isLoading);
		console.log("trends.data 길이:", trends.data?.length);
		console.log("trends.data:", trends.data);
	}, [summary.data, summary.isLoading, summary.isError, businessComparison.data, trends.data]);

	return (
		<div className="container mx-auto max-w-7xl px-4 py-6">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">대시보드</h1>
				<p className="text-muted-foreground mt-2">
					경영 현황 및 핵심 리스크 파악
				</p>
			</div>

			{/* KPI 카드 섹션 */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
				{summary.isLoading ? (
					<>
						<Skeleton className="h-32" />
						<Skeleton className="h-32" />
						<Skeleton className="h-32" />
					</>
				) : summary.error ? (
					<div className="col-span-3 text-center text-red-600">
						에러: {summary.error.message || "데이터를 불러올 수 없습니다."}
					</div>
				) : summary.data ? (
					<>
						<KPICard
							title="누적 투자금"
							value={summary.data.totalInvestment ?? 0}
							unit="원"
							yoy={summary.data.yoy?.totalInvestment}
						/>
						<KPICard
							title="누적 회수율"
							value={summary.data.recoupRate ?? 0}
							unit="%"
							yoy={summary.data.yoy?.recoupRate}
						/>
						<KPICard
							title="현재 리스크 건수"
							value={summary.data.riskCount ?? 0}
							onClick={() => router.push("/risk")}
						/>
					</>
				) : (
					<div className="col-span-3 text-center text-muted-foreground">
						데이터를 불러올 수 없습니다.
					</div>
				)}
			</div>

			{/* 사업별 성과 비교 */}
			<div className="mb-8">
				<h2 className="text-2xl font-semibold mb-4">사업별 성과 비교</h2>
				{businessComparison.isLoading ? (
					<Skeleton className="h-64" />
				) : businessComparison.data && businessComparison.data.length > 0 ? (
					<Card className="p-6">
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b">
										<th className="text-left p-2">사업 타입</th>
										<th className="text-right p-2">매출액</th>
										<th className="text-right p-2">이익액</th>
										<th className="text-right p-2">이익률</th>
									</tr>
								</thead>
								<tbody>
									{businessComparison.data.map((business) => (
										<tr key={business.businessType} className="border-b">
											<td className="p-2">{business.businessType}</td>
											<td className="text-right p-2">
												{(business.revenue / 100000000).toFixed(1)}억원
											</td>
											<td
												className={`text-right p-2 ${
													business.profit >= 0
														? "text-green-600"
														: "text-red-600"
												}`}
											>
												{(business.profit / 100000000).toFixed(1)}억원
											</td>
											<td
												className={`text-right p-2 ${
													business.margin >= 0
														? "text-green-600"
														: "text-red-600"
												}`}
											>
												{business.margin.toFixed(2)}%
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</Card>
				) : (
					<Card className="p-8 text-center text-muted-foreground">
						데이터가 없습니다.
					</Card>
				)}
			</div>

			{/* 월별 추세 */}
			<div className="mb-8">
				<h2 className="text-2xl font-semibold mb-4">월별 추세</h2>
				{trends.isLoading ? (
					<Skeleton className="h-64" />
				) : trends.data && trends.data.length > 0 ? (
					<Card>
						<CardContent className="p-6">
							<ReactECharts
								option={{
									tooltip: {
										trigger: "axis",
										axisPointer: { type: "cross" },
										formatter: (params: any) => {
											let result = `${params[0].name}<br/>`;
											params.forEach((param: any) => {
												result += `${param.seriesName}: ${formatCurrency(param.value)}<br/>`;
											});
											return result;
										},
									},
									legend: {
										data: ["매출액", "이익액", "이익률"],
										top: 10,
									},
									xAxis: {
										type: "category",
										data: trends.data.map((t) => t.yyyymm),
									},
									yAxis: [
										{
											type: "value",
											name: "금액 (원)",
											position: "left",
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
										{
											type: "value",
											name: "이익률 (%)",
											position: "right",
											axisLabel: {
												formatter: "{value}%",
											},
										},
									],
									series: [
										{
											name: "매출액",
											type: "bar",
											data: trends.data.map((t) => t.revenue),
											itemStyle: { color: "#3b82f6" },
										},
										{
											name: "이익액",
											type: "bar",
											data: trends.data.map((t) => t.profit),
											itemStyle: { color: "#10b981" },
										},
										{
											name: "이익률",
											type: "line",
											yAxisIndex: 1,
											data: trends.data.map((t) => t.margin),
											itemStyle: { color: "#f59e0b" },
											smooth: true,
										},
									],
									grid: {
										left: "3%",
										right: "4%",
										bottom: "3%",
										containLabel: true,
									},
								}}
								style={{ height: "400px" }}
							/>
						</CardContent>
					</Card>
				) : (
					<Card className="p-8 text-center text-muted-foreground">
						데이터가 없습니다.
					</Card>
				)}
			</div>

			{/* 워터폴 및 Top 기획사 */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
				{/* 워터폴 차트 */}
				<div>
					<h2 className="text-2xl font-semibold mb-4">투자→회수 흐름</h2>
					{waterfall.isLoading ? (
						<Skeleton className="h-64" />
					) : waterfall.data ? (
						<Card>
							<CardContent className="p-6">
								<ReactECharts
									option={{
										tooltip: {
											trigger: "axis",
											formatter: (params: any) => {
												const param = params[0];
												return `${param.name}<br/>${param.seriesName}: ${formatCurrency(param.value)}`;
											},
										},
										xAxis: {
											type: "category",
											data: ["총 투자금", "총 회수금", "이익"],
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
												type: "bar",
												data: [
													{
														value: waterfall.data.totalInvestment,
														itemStyle: { color: "#ef4444" },
													},
													{
														value: waterfall.data.totalRecouped,
														itemStyle: { color: "#10b981" },
													},
													{
														value: waterfall.data.profit,
														itemStyle: {
															color:
																waterfall.data.profit >= 0
																	? "#10b981"
																	: "#ef4444",
														},
													},
												],
												label: {
													show: true,
													position: "top",
													formatter: (params: any) => {
														return formatCurrency(params.value);
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
							</CardContent>
						</Card>
					) : (
						<Card className="p-8 text-center text-muted-foreground">
							데이터가 없습니다.
						</Card>
					)}
				</div>

				{/* Top 기획사 스캐터 차트 */}
				<div>
					<h2 className="text-2xl font-semibold mb-4">Top 기획사 성과</h2>
					{topCompanies.isLoading ? (
						<Skeleton className="h-64" />
					) : topCompanies.data && topCompanies.data.length > 0 ? (
						<Card>
							<CardContent className="p-6">
								<ReactECharts
									option={{
										tooltip: {
											trigger: "item",
											formatter: (params: any) => {
												const data = params.data;
												return `${data.name}<br/>투자금: ${formatCurrency(data.totalInvestment)}<br/>회수율: ${data.recoupRate.toFixed(1)}%<br/>매출: ${formatCurrency(data.totalRevenue)}<br/>사업타입: ${data.businessType}`;
											},
										},
										legend: {
											data: ["선급투자", "일반투자", "OST", "음반"],
											top: 10,
										},
										xAxis: {
											type: "value",
											name: "투자금",
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
										yAxis: {
											type: "value",
											name: "회수율 (%)",
											axisLabel: {
												formatter: "{value}%",
											},
										},
										series: [
											{
												type: "scatter",
												data: topCompanies.data.map((c, index) => ({
													value: [c.totalInvestment, c.recoupRate],
													name: c.companyName,
													symbolSize: (() => {
														const maxRevenue = Math.max(
															...topCompanies.data!.map((c) => c.totalRevenue),
														);
														return Math.max(20, (c.totalRevenue / maxRevenue) * 100);
													})(),
													itemStyle: {
														color: (() => {
															const colors: Record<string, string> = {
																선급투자: "#3b82f6",
																일반투자: "#10b981",
																OST: "#f59e0b",
																음반: "#ef4444",
															};
															return colors[c.businessType] || "#6b7280";
														})(),
													},
													companyName: c.companyName,
													totalInvestment: c.totalInvestment,
													recoupRate: c.recoupRate,
													totalRevenue: c.totalRevenue,
													businessType: c.businessType,
												})),
												label: {
													show: true,
													position: "right",
													formatter: (params: any) => {
														// Top 5만 라벨 표시
														return params.dataIndex < 5 ? params.name : "";
													},
													fontSize: 10,
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
							</CardContent>
						</Card>
					) : (
						<Card className="p-8 text-center text-muted-foreground">
							데이터가 없습니다.
						</Card>
					)}
				</div>
			</div>
		</div>
	);
}

// 금액 포맷팅 헬퍼 함수
function formatCurrency(amount: number): string {
	if (amount >= 100000000) {
		return `${(amount / 100000000).toFixed(1)}억원`;
	}
	if (amount >= 10000000) {
		return `${(amount / 10000000).toFixed(1)}천만원`;
	}
	if (amount >= 10000) {
		return `${(amount / 10000).toFixed(0)}만원`;
	}
	return `${amount.toLocaleString()}원`;
}

