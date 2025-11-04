"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import ReactECharts from "echarts-for-react";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";

/**
 * 시뮬레이션 페이지
 * Module 2: 선급투자 시뮬레이터 (P3 - 투자심사)
 * AI 기반 투자 의사결정 지원
 */
export default function SimulationPage() {
	const [series, setSeries] = useState<number[]>(Array(12).fill(0));
	const [months, setMonths] = useState<number>(12);
	const [model, setModel] = useState<"auto" | "arima" | "prophet">("auto");
	const [investmentAmount, setInvestmentAmount] = useState<number>(0);
	const [wacc, setWacc] = useState<number>(0.1); // 기본 10%

	const forecastMutation = useMutation({
		mutationFn: async (data: {
			series: number[];
			months: number;
			model: "auto" | "arima" | "prophet";
		}) => {
			// tRPC mutation 호출
			const result = await trpcClient.simulation.forecast.mutate(data);
			return result;
		},
		onSuccess: () => {
			toast.success("시뮬레이션 완료");
		},
		onError: (error) => {
			toast.error(`시뮬레이션 실패: ${error.message}`);
		},
	});

	const handleSeriesChange = (index: number, value: string) => {
		const newSeries = [...series];
		newSeries[index] = parseFloat(value) || 0;
		setSeries(newSeries);
	};

	const handleRunSimulation = () => {
		// 입력 검증
		if (series.some((v) => v <= 0)) {
			toast.error("모든 월별 수익 값은 0보다 커야 합니다.");
			return;
		}
		if (investmentAmount <= 0) {
			toast.error("투자금을 입력해주세요.");
			return;
		}

		forecastMutation.mutate({ series, months, model });
	};

	// DCF 계산 (간단한 예시)
	const calculateDCF = (
		cashflows: number[],
		wacc: number,
		investment: number,
	): number => {
		let npv = -investment;
		for (let i = 0; i < cashflows.length; i++) {
			npv += cashflows[i] / Math.pow(1 + wacc, i + 1);
		}
		return npv;
	};

	// BEP 계산
	const calculateBEP = (
		cashflows: number[],
		investment: number,
	): number | null => {
		let cumulative = -investment;
		for (let i = 0; i < cashflows.length; i++) {
			cumulative += cashflows[i];
			if (cumulative >= 0) {
				return i + 1;
			}
		}
		return null;
	};

	const result = forecastMutation.data;
	const hasResult = result && result.moderate.length > 0;

	// DCF 및 BEP 계산
	const dcfWorst = result
		? calculateDCF(result.worst, wacc, investmentAmount)
		: 0;
	const dcfModerate = result
		? calculateDCF(result.moderate, wacc, investmentAmount)
		: 0;
	const dcfBest = result
		? calculateDCF(result.best, wacc, investmentAmount)
		: 0;
	const bepWorst = result
		? calculateBEP(result.worst, investmentAmount)
		: null;
	const bepModerate = result
		? calculateBEP(result.moderate, investmentAmount)
		: null;
	const bepBest = result ? calculateBEP(result.best, investmentAmount) : null;

	// 차트 데이터 준비
	const chartData = hasResult
		? {
				months: Array.from({ length: months }, (_, i) => `${i + 1}개월`),
				worst: result.worst,
				moderate: result.moderate,
				best: result.best,
			}
		: null;

	return (
		<div className="container mx-auto max-w-7xl px-4 py-6">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">투자 시뮬레이터</h1>
				<p className="text-muted-foreground mt-2">
					구보 투자 시뮬레이션 및 예측
				</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* 입력 폼 */}
				<Card>
					<CardHeader>
						<CardTitle>시뮬레이션 입력</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* 최근 12개월 수익 */}
						<div>
							<Label>최근 12개월 월별 수익 (원)</Label>
							<div className="grid grid-cols-3 gap-2 mt-2">
								{series.map((value, index) => (
									<div key={index}>
										<Label className="text-xs text-muted-foreground">
											{index + 1}월
										</Label>
										<Input
											type="number"
											value={value || ""}
											onChange={(e) =>
												handleSeriesChange(index, e.target.value)
											}
											placeholder="0"
											min="0"
										/>
									</div>
								))}
							</div>
						</div>

						{/* 계약 기간 */}
						<div>
							<Label>예측 기간 (개월)</Label>
							<Input
								type="number"
								value={months}
								onChange={(e) => setMonths(parseInt(e.target.value) || 12)}
								min="1"
								max="36"
								className="mt-2"
							/>
							<p className="text-sm text-muted-foreground mt-1">
								1~36개월 사이의 값을 입력하세요.
							</p>
						</div>

						{/* 투자금 */}
						<div>
							<Label>투자금 (원)</Label>
							<Input
								type="number"
								value={investmentAmount || ""}
								onChange={(e) =>
									setInvestmentAmount(parseFloat(e.target.value) || 0)
								}
								placeholder="0"
								min="0"
								className="mt-2"
							/>
						</div>

						{/* WACC */}
						<div>
							<Label>WACC (할인률, 예: 0.1 = 10%)</Label>
							<Input
								type="number"
								step="0.01"
								value={wacc}
								onChange={(e) => setWacc(parseFloat(e.target.value) || 0.1)}
								min="0"
								max="1"
								className="mt-2"
							/>
						</div>

						{/* 모델 선택 */}
						<div>
							<Label>예측 모델</Label>
							<Select
								value={model}
								onValueChange={(value: "auto" | "arima" | "prophet") =>
									setModel(value)
								}
							>
								<SelectTrigger className="mt-2">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="auto">자동 선택</SelectItem>
									<SelectItem value="arima">ARIMA</SelectItem>
									<SelectItem value="prophet">Prophet</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* 실행 버튼 */}
						<Button
							onClick={handleRunSimulation}
							disabled={forecastMutation.isPending}
							className="w-full"
							size="lg"
						>
							{forecastMutation.isPending
								? "시뮬레이션 실행 중..."
								: "시뮬레이션 실행"}
						</Button>
					</CardContent>
				</Card>

				{/* 결과 카드 */}
				<div className="space-y-6">
					{/* DCF 결과 */}
					{hasResult && (
						<Card>
							<CardHeader>
								<CardTitle>예상 DCF (현가)</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-3 gap-4">
									<div className="text-center p-4 border rounded-lg">
										<div className="flex items-center justify-center mb-2">
											<TrendingDown className="w-5 h-5 text-red-500 mr-2" />
											<span className="text-sm font-medium">Worst</span>
										</div>
										<p className="text-2xl font-bold">
											{dcfWorst.toLocaleString()}원
										</p>
									</div>
									<div className="text-center p-4 border rounded-lg">
										<div className="flex items-center justify-center mb-2">
											<DollarSign className="w-5 h-5 text-blue-500 mr-2" />
											<span className="text-sm font-medium">Moderate</span>
										</div>
										<p className="text-2xl font-bold">
											{dcfModerate.toLocaleString()}원
										</p>
									</div>
									<div className="text-center p-4 border rounded-lg">
										<div className="flex items-center justify-center mb-2">
											<TrendingUp className="w-5 h-5 text-green-500 mr-2" />
											<span className="text-sm font-medium">Best</span>
										</div>
										<p className="text-2xl font-bold">
											{dcfBest.toLocaleString()}원
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{/* BEP 결과 */}
					{hasResult && (
						<Card>
							<CardHeader>
								<CardTitle>예상 BEP (손익분기점)</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-3 gap-4">
									<div className="text-center p-4 border rounded-lg">
										<div className="flex items-center justify-center mb-2">
											<Calendar className="w-5 h-5 text-red-500 mr-2" />
											<span className="text-sm font-medium">Worst</span>
										</div>
										<p className="text-2xl font-bold">
											{bepWorst ? `${bepWorst}개월` : "N/A"}
										</p>
									</div>
									<div className="text-center p-4 border rounded-lg">
										<div className="flex items-center justify-center mb-2">
											<Calendar className="w-5 h-5 text-blue-500 mr-2" />
											<span className="text-sm font-medium">Moderate</span>
										</div>
										<p className="text-2xl font-bold">
											{bepModerate ? `${bepModerate}개월` : "N/A"}
										</p>
									</div>
									<div className="text-center p-4 border rounded-lg">
										<div className="flex items-center justify-center mb-2">
											<Calendar className="w-5 h-5 text-green-500 mr-2" />
											<span className="text-sm font-medium">Best</span>
										</div>
										<p className="text-2xl font-bold">
											{bepBest ? `${bepBest}개월` : "N/A"}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{/* 모델 메타 정보 */}
					{hasResult && result.meta && (
						<Card>
							<CardHeader>
								<CardTitle>모델 정보</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2 text-sm">
									<p>
										<span className="font-medium">모델:</span> {result.meta.model}
									</p>
									<p>
										<span className="font-medium">RMSE:</span>{" "}
										{result.meta.rmse.toFixed(2)}
									</p>
									<p>
										<span className="font-medium">MAPE:</span>{" "}
										{result.meta.mape.toFixed(2)}%
									</p>
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			</div>

			{/* 차트 */}
			{chartData && (
				<Card className="mt-6">
					<CardHeader>
						<CardTitle>예상 현금흐름 추이</CardTitle>
					</CardHeader>
					<CardContent>
						<ReactECharts
							option={{
								tooltip: {
									trigger: "axis",
									formatter: (params: any) => {
										let result = `${params[0].name}<br/>`;
										params.forEach((param: any) => {
											result += `${param.seriesName}: ${param.value.toLocaleString()}원<br/>`;
										});
										return result;
									},
								},
								legend: {
									data: ["Worst", "Moderate", "Best"],
									top: 10,
								},
								xAxis: {
									type: "category",
									data: chartData.months,
								},
								yAxis: {
									type: "value",
									name: "현금흐름 (원)",
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
										name: "Worst",
										type: "line",
										data: chartData.worst,
										itemStyle: { color: "#ef4444" },
										smooth: true,
									},
									{
										name: "Moderate",
										type: "line",
										data: chartData.moderate,
										itemStyle: { color: "#3b82f6" },
										smooth: true,
									},
									{
										name: "Best",
										type: "line",
										data: chartData.best,
										itemStyle: { color: "#10b981" },
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
			)}

			{forecastMutation.isPending && (
				<Card className="mt-6">
					<CardContent className="p-8">
						<Skeleton className="h-64 w-full" />
					</CardContent>
				</Card>
			)}
		</div>
	);
}
