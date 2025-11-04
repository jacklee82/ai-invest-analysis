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
					<TabsTrigger value="chart" disabled>
						차트인 가치 (준비중)
					</TabsTrigger>
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
			</Tabs>
		</div>
	);
}
