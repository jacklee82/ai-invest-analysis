"use client";

import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { KPICard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import ReactECharts from "echarts-for-react";

/**
 * 차트 래퍼 컴포넌트
 * 그래프가 박스 안에 꽉 차도록 최적화된 레이아웃
 */
function ChartWrapper({
	title,
	children,
	isLoading,
	hasData,
}: {
	title: string;
	children: React.ReactNode;
	isLoading: boolean;
	hasData: boolean;
}) {
	return (
		<Card className="flex flex-col h-full p-0 overflow-hidden">
			<CardHeader className="px-6 pt-6 pb-4 flex-shrink-0">
				<CardTitle className="text-lg">{title}</CardTitle>
			</CardHeader>
			<CardContent className="flex-1 p-0 min-h-0">
				{isLoading ? (
					<Skeleton className="h-full w-full" />
				) : !hasData ? (
					<div className="flex items-center justify-center h-full text-center text-muted-foreground py-8">
						데이터가 없습니다.
					</div>
				) : (
					<div className="h-full w-full">{children}</div>
				)}
			</CardContent>
		</Card>
	);
}

/**
 * 대시보드 페이지
 * Module 1: 통합 대시보드 (P1 - 경영진)
 * 경영진의 빠른 현황 파악을 위한 모듈
 */
export default function DashboardPage() {
	const router = useRouter();
	const summary = useQuery(trpc.dashboard.getSummary.queryOptions());
	const businessTypeRevenue = useQuery(
		trpc.dashboard.getBusinessTypeRevenue.queryOptions(),
	);
	const monthlyInvestment = useQuery(
		trpc.dashboard.getMonthlyInvestment.queryOptions(),
	);
	const trends = useQuery(trpc.dashboard.getTrends.queryOptions());
	const albumRevenueRanking = useQuery(
		trpc.dashboard.getAlbumRevenueRanking.queryOptions(),
	);
	const companyRevenueShare = useQuery(
		trpc.dashboard.getCompanyRevenueShare.queryOptions(),
	);
	const riskRanking = useQuery(trpc.dashboard.getRiskRanking.queryOptions());


	return (
		<div className="container mx-auto max-w-7xl px-4 py-6">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">대시보드</h1>
				<p className="text-muted-foreground mt-2">
					경영 현황 및 핵심 리스크 파악
				</p>
			</div>

			{/* KPI 카드 섹션 */}
			<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
				{summary.isLoading ? (
					<>
						<Skeleton className="h-32" />
						<Skeleton className="h-32" />
						<Skeleton className="h-32" />
						<Skeleton className="h-32" />
						<Skeleton className="h-32" />
						<Skeleton className="h-32" />
					</>
				) : summary.error ? (
					<div className="col-span-6 text-center text-red-600">
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
							title="누적 회수액"
							value={summary.data.totalRecouped ?? 0}
							unit="원"
							yoy={summary.data.yoy?.totalRecouped}
						/>
						<KPICard
							title="회수율"
							value={summary.data.recoupRate ?? 0}
							unit="%"
							yoy={summary.data.yoy?.recoupRate}
						/>
						<KPICard
							title="누적 매출"
							value={summary.data.totalRevenue ?? 0}
							unit="원"
							yoy={summary.data.yoy?.totalRevenue}
						/>
						<KPICard
							title="누적 이익"
							value={summary.data.totalProfit ?? 0}
							unit="원"
							yoy={summary.data.yoy?.totalProfit}
						/>
						<KPICard
							title="현재 리스크 건수"
							value={summary.data.riskCount ?? 0}
							onClick={() => router.push("/risk")}
						/>
					</>
				) : (
					<div className="col-span-6 text-center text-muted-foreground">
						데이터를 불러올 수 없습니다.
					</div>
				)}
			</div>

			{/* 차트 섹션 (3x2 그리드) */}
			<div
				className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
				style={{ gridAutoRows: "minmax(350px, auto)" }}
			>
				{/* 1. 투자유형별 매출 (파이차트) */}
				<ChartWrapper
					title="투자유형별 매출"
					isLoading={businessTypeRevenue.isLoading}
					hasData={!!(businessTypeRevenue.data && businessTypeRevenue.data.length > 0)}
				>
					<ReactECharts
						option={{
							tooltip: {
								trigger: "item",
								formatter: (params: any) => {
									return `${params.name}<br/>${formatCurrency(params.value)} (${params.percent}%)`;
								},
							},
							legend: {
								orient: "vertical",
								left: "8%",
								top: "middle",
							},
							series: [
								{
									name: "매출",
									type: "pie",
									radius: ["40%", "70%"],
									center: ["60%", "50%"],
									avoidLabelOverlap: false,
									itemStyle: {
										borderRadius: 10,
										borderColor: "#fff",
										borderWidth: 2,
									},
									label: {
										show: true,
										formatter: "{b}: {d}%",
									},
									emphasis: {
										label: {
											show: true,
											fontSize: 14,
											fontWeight: "bold",
										},
									},
									data: businessTypeRevenue.data!.map((item) => ({
										value: item.revenue,
										name: item.businessType,
									})),
								},
							],
						}}
						style={{ height: "100%", width: "100%" }}
						opts={{ renderer: "svg" }}
					/>
				</ChartWrapper>

				{/* 2. 월별 투자금 */}
				<ChartWrapper
					title="월별 투자금"
					isLoading={monthlyInvestment.isLoading}
					hasData={!!(monthlyInvestment.data && monthlyInvestment.data.length > 0)}
				>
					<ReactECharts
						option={{
							tooltip: {
								trigger: "axis",
								formatter: (params: any) => {
									const param = params[0];
									return `${param.name}<br/>${formatCurrency(param.value)}`;
								},
							},
							xAxis: {
								type: "category",
								data: monthlyInvestment.data!.map((item) => item.yyyymm),
								axisLabel: {
									rotate: 45,
								},
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
									name: "투자금",
									type: "line",
									data: monthlyInvestment.data!.map((item) => item.investment),
									itemStyle: { color: "#3b82f6" },
									smooth: true,
									areaStyle: {
										color: {
											type: "linear",
											x: 0,
											y: 0,
											x2: 0,
											y2: 1,
											colorStops: [
												{ offset: 0, color: "rgba(59, 130, 246, 0.3)" },
												{ offset: 1, color: "rgba(59, 130, 246, 0.1)" },
											],
										},
									},
								},
							],
							grid: {
								left: "8%",
								right: "8%",
								top: "10%",
								bottom: "20%",
								containLabel: true,
							},
						}}
						style={{ height: "100%", width: "100%" }}
						opts={{ renderer: "svg" }}
					/>
				</ChartWrapper>

				{/* 3. 월별 매출 (막대) */}
				<ChartWrapper
					title="월별 매출"
					isLoading={trends.isLoading}
					hasData={!!(trends.data && trends.data.length > 0)}
				>
					<ReactECharts
						option={{
							tooltip: {
								trigger: "axis",
								formatter: (params: any) => {
									const param = params[0];
									return `${param.name}<br/>${formatCurrency(param.value)}`;
								},
							},
							xAxis: {
								type: "category",
								data: trends.data!.map((t) => t.yyyymm),
								axisLabel: {
									rotate: 45,
								},
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
									name: "매출액",
									type: "bar",
									data: trends.data!.map((t) => t.revenue),
									itemStyle: { color: "#10b981" },
								},
							],
							grid: {
								left: "8%",
								right: "8%",
								top: "10%",
								bottom: "20%",
								containLabel: true,
							},
						}}
						style={{ height: "100%", width: "100%" }}
						opts={{ renderer: "svg" }}
					/>
				</ChartWrapper>

				{/* 4. 음반 매출 순위 (가로막대) */}
				<ChartWrapper
					title="음반 매출 순위"
					isLoading={albumRevenueRanking.isLoading}
					hasData={!!(albumRevenueRanking.data && albumRevenueRanking.data.length > 0)}
				>
					<ReactECharts
						option={{
							tooltip: {
								trigger: "axis",
								axisPointer: { type: "shadow" },
								formatter: (params: any) => {
									const param = params[0];
									return `${param.name}<br/>${formatCurrency(param.value)}`;
								},
							},
							grid: {
								left: "25%",
								right: "8%",
								top: "10%",
								bottom: "10%",
								containLabel: true,
							},
							xAxis: {
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
							yAxis: {
								type: "category",
								data: albumRevenueRanking.data!.map((item) => item.projectName),
								axisLabel: {
									formatter: (value: string) => {
										return value.length > 12 ? value.substring(0, 12) + "..." : value;
									},
								},
							},
							series: [
								{
									name: "매출",
									type: "bar",
									data: albumRevenueRanking.data!.map((item) => item.revenue),
									itemStyle: { color: "#f59e0b" },
									label: {
										show: true,
										position: "right",
										formatter: (params: any) => {
											return formatCurrency(params.value);
										},
									},
								},
							],
						}}
						style={{ height: "100%", width: "100%" }}
						opts={{ renderer: "svg" }}
					/>
				</ChartWrapper>

				{/* 5. 기획사 매출 비중 (박스 비중 형태) */}
				<ChartWrapper
					title="기획사 매출 비중"
					isLoading={companyRevenueShare.isLoading}
					hasData={!!(companyRevenueShare.data && companyRevenueShare.data.length > 0)}
				>
					<ReactECharts
						option={{
							tooltip: {
								trigger: "item",
								formatter: (params: any) => {
									return `${params.name}<br/>매출: ${formatCurrency(params.value)}<br/>비중: ${params.percent}%`;
								},
							},
							series: [
								{
									name: "기획사 매출",
									type: "treemap",
									data: companyRevenueShare.data!.map((item) => ({
										value: item.revenue,
										name: item.companyName,
									})),
									label: {
										show: true,
										formatter: (params: any) => {
											return `${params.name}\n${params.value ? formatCurrency(params.value) : ""}`;
										},
									},
									upperLabel: {
										show: true,
										height: 30,
									},
									itemStyle: {
										borderColor: "#fff",
										borderWidth: 2,
									},
									emphasis: {
										itemStyle: {
											borderColor: "#333",
											borderWidth: 3,
										},
									},
								},
							],
						}}
						style={{ height: "100%", width: "100%" }}
						opts={{ renderer: "svg" }}
					/>
				</ChartWrapper>

				{/* 6. 리스크 순위 */}
				<ChartWrapper
					title="리스크 순위"
					isLoading={riskRanking.isLoading}
					hasData={!!(riskRanking.data && riskRanking.data.length > 0)}
				>
					<ReactECharts
						option={{
							tooltip: {
								trigger: "axis",
								formatter: (params: any) => {
									const data = params[0].data;
									return `${data.name}<br/>리스크 점수: ${data.riskScore}<br/>투자금: ${formatCurrency(data.totalInvestment)}<br/>회수율: ${data.recoupRate.toFixed(1)}%`;
								},
							},
							grid: {
								left: "25%",
								right: "8%",
								top: "10%",
								bottom: "10%",
								containLabel: true,
							},
							xAxis: {
								type: "value",
								name: "리스크 점수",
							},
							yAxis: {
								type: "category",
								data: riskRanking.data!.map((item) => item.projectName),
								axisLabel: {
									formatter: (value: string) => {
										return value.length > 12 ? value.substring(0, 12) + "..." : value;
									},
								},
							},
							series: [
								{
									name: "리스크 점수",
									type: "bar",
									data: riskRanking.data!.map((item) => ({
										value: item.riskScore,
										name: item.projectName,
										totalInvestment: item.totalInvestment,
										recoupRate: item.recoupRate,
										riskScore: item.riskScore,
									})),
									itemStyle: {
										color: (params: any) => {
											// 점수가 높을수록 빨간색
											const maxScore = Math.max(
												...riskRanking.data!.map((r) => r.riskScore),
											);
											const ratio = params.value / maxScore;
											if (ratio > 0.7) return "#ef4444";
											if (ratio > 0.4) return "#f59e0b";
											return "#10b981";
										},
									},
									label: {
										show: true,
										position: "right",
										formatter: (params: any) => {
											return params.value.toFixed(2);
										},
									},
								},
							],
						}}
						style={{ height: "100%", width: "100%" }}
						opts={{ renderer: "svg" }}
					/>
				</ChartWrapper>
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

