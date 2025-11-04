"use client";

import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { KPICard } from "@/components/dashboard/kpi-card";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

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
				) : summary.data ? (
					<>
						<KPICard
							title="누적 투자금"
							value={summary.data.totalInvestment}
							unit="원"
							yoy={summary.data.yoy.totalInvestment}
						/>
						<KPICard
							title="누적 회수율"
							value={summary.data.recoupRate}
							unit="%"
							yoy={summary.data.yoy.recoupRate}
						/>
						<KPICard
							title="현재 리스크 건수"
							value={summary.data.riskCount}
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
			<div>
				<h2 className="text-2xl font-semibold mb-4">월별 추세</h2>
				{trends.isLoading ? (
					<Skeleton className="h-64" />
				) : trends.data && trends.data.length > 0 ? (
					<Card className="p-6">
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b">
										<th className="text-left p-2">년월</th>
										<th className="text-right p-2">매출액</th>
										<th className="text-right p-2">이익액</th>
										<th className="text-right p-2">이익률</th>
									</tr>
								</thead>
								<tbody>
									{trends.data.map((trend) => (
										<tr key={trend.yyyymm} className="border-b">
											<td className="p-2">{trend.yyyymm}</td>
											<td className="text-right p-2">
												{(trend.revenue / 100000000).toFixed(1)}억원
											</td>
											<td
												className={`text-right p-2 ${
													trend.profit >= 0 ? "text-green-600" : "text-red-600"
												}`}
											>
												{(trend.profit / 100000000).toFixed(1)}억원
											</td>
											<td
												className={`text-right p-2 ${
													trend.margin >= 0 ? "text-green-600" : "text-red-600"
												}`}
											>
												{trend.margin.toFixed(2)}%
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
		</div>
	);
}

