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
import ReactECharts from "echarts-for-react";

/**
 * 코호트 분석 컴포넌트
 */
export function CohortAnalysis() {
	const [businessType, setBusinessType] = useState<
		"선급투자" | "일반투자" | "OST" | "음반" | "전체"
	>("전체");
	const [selectedCohorts, setSelectedCohorts] = useState<string[]>([]);

	const heatmapQuery = useQuery(
		trpc.analysis.getCohortHeatmap.queryOptions({
			businessType: businessType !== "전체" ? businessType : undefined,
		}),
	);

	const comparisonQuery = useQuery(
		trpc.analysis.getCohortComparison.queryOptions({
			cohorts: selectedCohorts.length > 0 ? selectedCohorts : undefined,
			businessType: businessType !== "전체" ? businessType : undefined,
		}),
	);

	const summaryQuery = useQuery(
		trpc.analysis.getCohortSummary.queryOptions({
			businessType: businessType !== "전체" ? businessType : undefined,
		}),
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

	// 코호트 선택 핸들러
	const toggleCohort = (cohort: string) => {
		setSelectedCohorts((prev) =>
			prev.includes(cohort)
				? prev.filter((c) => c !== cohort)
				: [...prev, cohort],
		);
	};

	// 히트맵 데이터 변환
	const heatmapChartData =
		heatmapQuery.data && heatmapQuery.data.data.length > 0
			? {
					xAxis: {
						type: "category",
						data: heatmapQuery.data.months.map((m) => `t+${m}`),
					},
					yAxis: {
						type: "category",
						data: heatmapQuery.data.cohorts,
					},
					data: heatmapQuery.data.data.map((d) => [
						heatmapQuery.data.months.indexOf(d.month),
						heatmapQuery.data.cohorts.indexOf(d.cohort),
						d.value,
					]),
				}
			: null;

	// 요약 통계 계산
	const totalCohorts = summaryQuery.data?.length ?? 0;
	const totalProjects = summaryQuery.data?.reduce(
		(sum, c) => sum + c.projectCount,
		0,
	) ?? 0;
	const avgRecoupRate =
		summaryQuery.data && summaryQuery.data.length > 0
			? summaryQuery.data.reduce(
					(sum, c) => sum + c.averageRecoupRate,
					0,
				) / summaryQuery.data.length
			: 0;
	const avgRecoupMonths =
		summaryQuery.data &&
		summaryQuery.data.filter((c) => c.averageRecoupMonths !== null).length > 0
			? summaryQuery.data
					.filter((c) => c.averageRecoupMonths !== null)
					.reduce(
						(sum, c) => sum + (c.averageRecoupMonths ?? 0),
						0,
					) /
				summaryQuery.data.filter((c) => c.averageRecoupMonths !== null).length
			: null;

	return (
		<>
			{/* 필터 섹션 */}
			<Card>
				<CardHeader>
					<CardTitle>필터</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col gap-4">
						<div className="flex items-center gap-4">
							<label className="text-sm font-medium">사업 타입:</label>
							<Select
								value={businessType}
								onValueChange={(
									value: "선급투자" | "일반투자" | "OST" | "음반" | "전체",
								) => setBusinessType(value)}
							>
								<SelectTrigger className="w-48">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="전체">전체</SelectItem>
									<SelectItem value="선급투자">선급투자</SelectItem>
									<SelectItem value="일반투자">일반투자</SelectItem>
									<SelectItem value="OST">OST</SelectItem>
									<SelectItem value="음반">음반</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* 코호트 선택 */}
						{heatmapQuery.data && heatmapQuery.data.cohorts.length > 0 && (
							<div>
								<label className="text-sm font-medium mb-2 block">
									코호트 선택 (비교 차트용):
								</label>
								<div className="flex flex-wrap gap-2">
									{heatmapQuery.data.cohorts.map((cohort) => (
										<Button
											key={cohort}
											variant={
												selectedCohorts.includes(cohort)
													? "default"
													: "outline"
											}
											size="sm"
											onClick={() => toggleCohort(cohort)}
										>
											{cohort}
										</Button>
									))}
								</div>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* 요약 통계 카드 */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							총 코호트 수
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{summaryQuery.isLoading ? (
								<Skeleton className="h-8 w-24" />
							) : (
								totalCohorts
							)}
							개
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							총 프로젝트 수
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{summaryQuery.isLoading ? (
								<Skeleton className="h-8 w-24" />
							) : (
								totalProjects
							)}
							개
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							평균 회수율
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{summaryQuery.isLoading ? (
								<Skeleton className="h-8 w-24" />
							) : (
								`${avgRecoupRate.toFixed(1)}%`
							)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							평균 회수 기간
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{summaryQuery.isLoading ? (
								<Skeleton className="h-8 w-24" />
							) : avgRecoupMonths !== null ? (
								`${avgRecoupMonths.toFixed(1)}개월`
							) : (
								"-"
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* 코호트 히트맵 */}
			<Card>
				<CardHeader>
					<CardTitle>코호트별 회수율 히트맵</CardTitle>
				</CardHeader>
				<CardContent>
					{heatmapQuery.isLoading ? (
						<Skeleton className="h-96 w-full" />
					) : heatmapChartData ? (
						<ReactECharts
							option={{
								tooltip: {
									position: "top",
									formatter: (params: any) => {
										const data = params.data;
										const cohort = heatmapQuery.data!.cohorts[data[1]];
										const month = heatmapQuery.data!.months[data[0]];
										const value = data[2];
										const heatmapItem = heatmapQuery.data!.data.find(
											(d) => d.cohort === cohort && d.month === month,
										);
										return `${cohort}<br/>t+${month}개월: ${value.toFixed(1)}%<br/>프로젝트 수: ${heatmapItem?.projectCount ?? 0}개`;
									},
								},
								grid: {
									height: "50%",
									top: "10%",
								},
								xAxis: heatmapChartData.xAxis,
								yAxis: heatmapChartData.yAxis,
								visualMap: {
									min: 0,
									max: 100,
									calculable: true,
									orient: "horizontal",
									left: "center",
									bottom: "5%",
									inRange: {
										color: [
											"#ef4444", // 0% - 빨강
											"#f59e0b", // 25% - 주황
											"#eab308", // 50% - 노랑
											"#84cc16", // 75% - 연두
											"#10b981", // 100% - 초록
										],
									},
								},
								series: [
									{
										name: "회수율",
										type: "heatmap",
										data: heatmapChartData.data,
										label: {
											show: true,
											formatter: (params: any) => {
												const value = params.data[2];
												return value > 0 ? `${value.toFixed(0)}%` : "";
											},
										},
										emphasis: {
											itemStyle: {
												shadowBlur: 10,
												shadowColor: "rgba(0, 0, 0, 0.5)",
											},
										},
									},
								],
							}}
							style={{ height: "500px" }}
						/>
					) : (
						<div className="text-center text-muted-foreground py-8">
							데이터가 없습니다.
						</div>
					)}
				</CardContent>
			</Card>

			{/* 코호트 비교 차트 */}
			<Card>
				<CardHeader>
					<CardTitle>코호트별 회수율 추이 비교</CardTitle>
				</CardHeader>
				<CardContent>
					{comparisonQuery.isLoading ? (
						<Skeleton className="h-96 w-full" />
					) : comparisonQuery.data &&
					  comparisonQuery.data.series.length > 0 ? (
						<ReactECharts
							option={{
								tooltip: {
									trigger: "axis",
									formatter: (params: any) => {
										let result = `t+${params[0].axisValue}개월<br/>`;
										params.forEach((param: any) => {
											result += `${param.seriesName}: ${param.value.toFixed(1)}%<br/>`;
										});
										return result;
									},
								},
								legend: {
									data: comparisonQuery.data.series.map((s) => s.name),
									top: 10,
								},
								xAxis: {
									type: "category",
									data: comparisonQuery.data.months.map((m) => `t+${m}`),
									name: "계약 후 개월",
								},
								yAxis: {
									type: "value",
									name: "회수율 (%)",
									max: 100,
									axisLabel: {
										formatter: "{value}%",
									},
								},
								series: comparisonQuery.data.series.map((s) => ({
									name: s.name,
									type: "line",
									data: s.data,
									smooth: true,
									symbol: "circle",
									symbolSize: 6,
								})),
								grid: {
									left: "3%",
									right: "4%",
									bottom: "3%",
									containLabel: true,
								},
							}}
							style={{ height: "400px" }}
						/>
					) : (
						<div className="text-center text-muted-foreground py-8">
							{selectedCohorts.length === 0
								? "비교할 코호트를 선택하세요."
								: "데이터가 없습니다."}
						</div>
					)}
				</CardContent>
			</Card>

			{/* 코호트 상세 테이블 */}
			<Card>
				<CardHeader>
					<CardTitle>코호트 상세 정보</CardTitle>
				</CardHeader>
				<CardContent>
					{summaryQuery.isLoading ? (
						<Skeleton className="h-64 w-full" />
					) : summaryQuery.data && summaryQuery.data.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>코호트</TableHead>
									<TableHead>프로젝트 수</TableHead>
									<TableHead>총 투자금</TableHead>
									<TableHead>총 회수금</TableHead>
									<TableHead>평균 회수율</TableHead>
									<TableHead>평균 회수 기간</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{summaryQuery.data.map((cohort) => (
									<TableRow key={cohort.cohort}>
										<TableCell className="font-medium">
											{cohort.cohort}
										</TableCell>
										<TableCell>{cohort.projectCount}개</TableCell>
										<TableCell>
											{formatCurrency(cohort.totalInvestment)}
										</TableCell>
										<TableCell>
											{formatCurrency(cohort.totalRecouped)}
										</TableCell>
										<TableCell>
											{cohort.averageRecoupRate.toFixed(1)}%
										</TableCell>
										<TableCell>
											{cohort.averageRecoupMonths !== null
												? `${cohort.averageRecoupMonths.toFixed(1)}개월`
												: "-"}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
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

