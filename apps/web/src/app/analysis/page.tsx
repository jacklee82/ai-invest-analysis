"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableHeader,
	TableRow,
	TableHead,
	TableBody,
	TableCell,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactECharts from "echarts-for-react";

/**
 * 심층 분석 페이지
 * Module 4: 심층 분석 (P2 - 사업관리)
 * 전략적 인사이트 도출
 */
export default function AnalysisPage() {
	const [sortBy, setSortBy] = useState<"investment" | "expiry">("investment");

	const companyROIQuery = useQuery(
		trpc.analysis.getCompanyROI.queryOptions({ sortBy }),
	);

	const formatCurrency = (amount: number): string => {
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
	};

	const formatROIColor = (roi: number) => {
		if (roi >= 100) return "text-green-500";
		if (roi >= 50) return "text-blue-500";
		if (roi >= 30) return "text-yellow-500";
		return "text-red-500";
	};

	// ROI 분포 데이터 준비 (상자그림용)
	const roiDistribution = companyROIQuery.data
		? companyROIQuery.data.map((c) => c.roi)
		: [];

	// 파레토 차트 데이터 (Top 10 기획사)
	const paretoData = companyROIQuery.data
		? companyROIQuery.data.slice(0, 10).map((c, index) => ({
				name: c.companyName,
				value: c.totalInvestment,
				cumulative:
					companyROIQuery.data!.slice(0, index + 1).reduce(
						(sum, item) => sum + item.totalInvestment,
						0,
					) / companyROIQuery.data!.reduce((sum, item) => sum + item.totalInvestment, 0),
			}))
		: [];

	return (
		<div className="container mx-auto max-w-7xl px-4 py-6">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">심층 분석</h1>
				<p className="text-muted-foreground mt-2">
					차트인 가치 및 기획사 ROI 분석
				</p>
			</div>

			<Tabs defaultValue="roi" className="space-y-6">
				<TabsList>
					<TabsTrigger value="roi">기획사 ROI</TabsTrigger>
					<TabsTrigger value="chart">차트인 가치</TabsTrigger>
					<TabsTrigger value="cohort" disabled>
						코호트 분석 (준비중)
					</TabsTrigger>
				</TabsList>

				{/* 기획사 ROI 분석 */}
				<TabsContent value="roi" className="space-y-6">
					{/* 필터 및 정렬 */}
					<Card>
						<CardHeader>
							<CardTitle>기획사 ROI 비교</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-4 mb-4">
								<label className="text-sm font-medium">정렬 기준:</label>
								<Select
									value={sortBy}
									onValueChange={(value: "investment" | "expiry") =>
										setSortBy(value)
									}
								>
									<SelectTrigger className="w-48">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="investment">
											투자금액 큰 순
										</SelectItem>
										<SelectItem value="expiry">계약 만료일 임박 순</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{companyROIQuery.isLoading ? (
								<Skeleton className="h-64 w-full" />
							) : companyROIQuery.isError ? (
								<div className="text-center text-red-600">
									에러: {companyROIQuery.error.message}
								</div>
							) : (
								<>
									{/* ROI 분포 상자그림 */}
									{roiDistribution.length > 0 && (
										<div className="mb-6">
											<h3 className="text-lg font-semibold mb-4">
												ROI 분포 (상자그림)
											</h3>
											<ReactECharts
												option={{
													tooltip: {
														trigger: "item",
														formatter: (params: any) => {
															return `ROI: ${params.value}%`;
														},
													},
													xAxis: {
														type: "value",
														name: "ROI (%)",
													},
													yAxis: {
														type: "category",
														data: [""],
													},
													series: [
														{
															type: "boxplot",
															data: [
																[
																	Math.min(...roiDistribution),
																	roiDistribution.sort((a, b) => a - b)[
																		Math.floor(roiDistribution.length * 0.25)
																	],
																	roiDistribution.sort((a, b) => a - b)[
																		Math.floor(roiDistribution.length * 0.5)
																	],
																	roiDistribution.sort((a, b) => a - b)[
																		Math.floor(roiDistribution.length * 0.75)
																	],
																	Math.max(...roiDistribution),
																],
															],
															itemStyle: {
																color: "#3b82f6",
																borderColor: "#1e40af",
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
												style={{ height: "200px" }}
											/>
										</div>
									)}

									{/* 파레토 차트 */}
									{paretoData.length > 0 && (
										<div className="mb-6">
											<h3 className="text-lg font-semibold mb-4">
												Top 10 기획사 투자금 파레토
											</h3>
											<ReactECharts
												option={{
													tooltip: {
														trigger: "axis",
														formatter: (params: any) => {
															let result = `${params[0].name}<br/>`;
															params.forEach((param: any) => {
																if (param.seriesName === "투자금") {
																	result += `${param.seriesName}: ${formatCurrency(param.value)}<br/>`;
																} else {
																	result += `${param.seriesName}: ${(param.value * 100).toFixed(1)}%<br/>`;
																}
															});
															return result;
														},
													},
													legend: {
														data: ["투자금", "누적 비율"],
														top: 10,
													},
													xAxis: {
														type: "category",
														data: paretoData.map((d) => d.name),
														axisLabel: {
															rotate: 45,
															interval: 0,
														},
													},
													yAxis: [
														{
															type: "value",
															name: "투자금 (원)",
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
															name: "누적 비율 (%)",
															position: "right",
															max: 100,
															axisLabel: {
																formatter: "{value}%",
															},
														},
													],
													series: [
														{
															name: "투자금",
															type: "bar",
															data: paretoData.map((d) => d.value),
															itemStyle: { color: "#3b82f6" },
														},
														{
															name: "누적 비율",
															type: "line",
															yAxisIndex: 1,
															data: paretoData.map((d) => d.cumulative * 100),
															itemStyle: { color: "#ef4444" },
															smooth: true,
														},
													],
													grid: {
														left: "3%",
														right: "4%",
														bottom: "15%",
														containLabel: true,
													},
												}}
												style={{ height: "400px" }}
											/>
										</div>
									)}

									{/* 기획사 ROI 테이블 */}
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>기획사명</TableHead>
												<TableHead>총 투자금</TableHead>
												<TableHead>총 회수금</TableHead>
												<TableHead>ROI</TableHead>
												<TableHead>만료일</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{companyROIQuery.data?.length === 0 ? (
												<TableRow>
													<TableCell colSpan={5} className="h-24 text-center">
														데이터가 없습니다.
													</TableCell>
												</TableRow>
											) : (
												companyROIQuery.data?.map((company) => (
													<TableRow key={company.companyName}>
														<TableCell className="font-medium">
															{company.companyName}
														</TableCell>
														<TableCell>
															{formatCurrency(company.totalInvestment)}
														</TableCell>
														<TableCell>
															{formatCurrency(company.totalRecouped)}
														</TableCell>
														<TableCell
															className={formatROIColor(company.roi)}
														>
															{company.roi.toFixed(2)}%
														</TableCell>
														<TableCell>
															{company.expiryDate || "-"}
														</TableCell>
													</TableRow>
												))
											)}
										</TableBody>
									</Table>
								</>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* 차트인 가치 분석 */}
				<TabsContent value="chart" className="space-y-6">
					<ChartValueAnalysis />
				</TabsContent>
			</Tabs>
		</div>
	);
}

/**
 * 차트인 가치 분석 컴포넌트
 */
function ChartValueAnalysis() {
	const chartValueQuery = useQuery(trpc.analysis.getChartValue.queryOptions());
	const topTracksQuery = useQuery(
		trpc.analysis.getTopChartTracks.queryOptions({ limit: 10 }),
	);

	const formatCurrency = (amount: number): string => {
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
	};

	// 회귀 분석 데이터 준비 (스캐터 차트용)
	const regressionData =
		chartValueQuery.data && topTracksQuery.data
			? topTracksQuery.data.map((track) => ({
					x: track.chartedWeeks,
					y: track.chartRevenue / 10_000_000, // 천만원 단위
					name: track.title,
				}))
			: [];

	const regressionModel = chartValueQuery.data?.regressionModel;

	return (
		<>
			{/* 요약 카드 */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							평균 1주당 가치
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{chartValueQuery.isLoading ? (
								<Skeleton className="h-8 w-24" />
							) : (
								`${(chartValueQuery.data?.averageValue ?? 0).toFixed(2)}천만원`
							)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							회귀 모델 R²
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{chartValueQuery.isLoading ? (
								<Skeleton className="h-8 w-24" />
							) : (
								(regressionModel?.r2 ?? 0).toFixed(3)
							)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							RMSE
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{chartValueQuery.isLoading ? (
								<Skeleton className="h-8 w-24" />
							) : (
								`${(regressionModel?.rmse ?? 0).toFixed(2)}천만원`
							)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							분석 대상 프로젝트
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{chartValueQuery.isLoading ? (
								<Skeleton className="h-8 w-24" />
							) : (
								chartValueQuery.data?.totalProjects ?? 0
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* 회귀 분석 스캐터 차트 */}
			<Card className="mb-6">
				<CardHeader>
					<CardTitle>차트인 주 수 vs 차트인 수익 (회귀 분석)</CardTitle>
				</CardHeader>
				<CardContent>
					{chartValueQuery.isLoading || topTracksQuery.isLoading ? (
						<Skeleton className="h-96 w-full" />
					) : regressionData.length > 0 && regressionModel ? (
						<ReactECharts
							option={{
								tooltip: {
									trigger: "item",
									formatter: (params: any) => {
										return `${params.data.name}<br/>차트인 주 수: ${params.data[0]}주<br/>차트인 수익: ${params.data[1].toFixed(2)}천만원`;
									},
								},
								xAxis: {
									type: "value",
									name: "차트인 주 수",
									nameLocation: "middle",
									nameGap: 30,
								},
								yAxis: {
									type: "value",
									name: "차트인 수익 (천만원)",
									nameLocation: "middle",
									nameGap: 50,
								},
								series: [
									{
										name: "프로젝트",
										type: "scatter",
										data: regressionData.map((d) => [d.x, d.y]),
										symbolSize: 10,
										itemStyle: {
											color: "#3b82f6",
											opacity: 0.6,
										},
									},
									{
										name: "회귀선",
										type: "line",
										data: regressionData.length > 0
											? (() => {
													const minX = Math.min(...regressionData.map((d) => d.x));
													const maxX = Math.max(...regressionData.map((d) => d.x));
													const x1 = minX;
													const y1 =
														regressionModel.coefficients.slope * x1 +
														regressionModel.coefficients.intercept;
													const x2 = maxX;
													const y2 =
														regressionModel.coefficients.slope * x2 +
														regressionModel.coefficients.intercept;
													return [
														[x1, y1],
														[x2, y2],
													];
												})()
											: [],
										symbol: "none",
										lineStyle: {
											color: "#ef4444",
											width: 2,
										},
									},
								],
								grid: {
									left: "10%",
									right: "10%",
									top: "10%",
									bottom: "15%",
									containLabel: true,
								},
								legend: {
									data: ["프로젝트", "회귀선"],
									top: 10,
								},
							}}
							style={{ height: "400px" }}
						/>
					) : (
						<div className="text-center text-muted-foreground py-8">
							데이터가 없습니다.
						</div>
					)}
					{regressionModel && (
						<div className="mt-4 text-sm text-muted-foreground">
							회귀식: y ={" "}
							{regressionModel.coefficients.slope.toFixed(2)}x +{" "}
							{regressionModel.coefficients.intercept.toFixed(2)}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Top 10 차트인 수익 차트 */}
			<Card>
				<CardHeader>
					<CardTitle>Top 10 차트인 수익</CardTitle>
				</CardHeader>
				<CardContent>
					{topTracksQuery.isLoading ? (
						<Skeleton className="h-96 w-full" />
					) : topTracksQuery.data && topTracksQuery.data.length > 0 ? (
						<>
							<ReactECharts
								option={{
									tooltip: {
										trigger: "axis",
										formatter: (params: any) => {
											let result = `${params[0].name}<br/>`;
											params.forEach((param: any) => {
												if (param.seriesName === "차트인 수익") {
													result += `${param.seriesName}: ${formatCurrency(param.value)}<br/>`;
												} else {
													result += `${param.seriesName}: ${(param.value * 100).toFixed(1)}%<br/>`;
												}
											});
											return result;
										},
									},
									legend: {
										data: ["차트인 수익", "누적 비율"],
										top: 10,
									},
									xAxis: {
										type: "category",
										data: topTracksQuery.data.map((t) => t.title),
										axisLabel: {
											rotate: 45,
											interval: 0,
										},
									},
									yAxis: [
										{
											type: "value",
											name: "차트인 수익 (원)",
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
											name: "누적 비율 (%)",
											position: "right",
											max: 100,
											axisLabel: {
												formatter: "{value}%",
											},
										},
									],
									series: [
										{
											name: "차트인 수익",
											type: "bar",
											data: topTracksQuery.data.map((t) => t.chartRevenue),
											itemStyle: { color: "#3b82f6" },
										},
										{
											name: "누적 비율",
											type: "line",
											yAxisIndex: 1,
											data: (() => {
												const total = topTracksQuery.data.reduce(
													(sum, t) => sum + t.chartRevenue,
													0,
												);
												let cumulative = 0;
												return topTracksQuery.data.map((t) => {
													cumulative += t.chartRevenue;
													return (cumulative / total) * 100;
												});
											})(),
											itemStyle: { color: "#ef4444" },
											smooth: true,
										},
									],
									grid: {
										left: "3%",
										right: "4%",
										bottom: "15%",
										containLabel: true,
									},
								}}
								style={{ height: "400px" }}
							/>

							{/* 테이블 */}
							<div className="mt-6">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>순위</TableHead>
											<TableHead>곡명</TableHead>
											<TableHead>기획사</TableHead>
											<TableHead>차트인 수익</TableHead>
											<TableHead>차트인 주 수</TableHead>
											<TableHead>주당 평균</TableHead>
											<TableHead>최고 순위</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{topTracksQuery.data.map((track, index) => (
											<TableRow key={track.trackId}>
												<TableCell>{index + 1}</TableCell>
												<TableCell className="font-medium">
													{track.title}
												</TableCell>
												<TableCell>{track.artist}</TableCell>
												<TableCell>
													{formatCurrency(track.chartRevenue)}
												</TableCell>
												<TableCell>{track.chartedWeeks}주</TableCell>
												<TableCell>
													{formatCurrency(track.averageRevenuePerWeek)}
												</TableCell>
												<TableCell>{track.bestRank}위</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</>
					) : (
						<div className="text-center text-muted-foreground py-8">
							데이터가 없습니다.
						</div>
					)}
				</CardContent>
			</Card>
		</>
	);
}
