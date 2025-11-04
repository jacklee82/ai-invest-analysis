"use client";

import { Card } from "@/components/ui/card";

/**
 * KPI 카드 컴포넌트 Props
 */
interface KPICardProps {
	/** KPI 제목 */
	title: string;
	/** KPI 값 */
	value: string | number;
	/** YoY 증감률 (선택) */
	yoy?: number;
	/** 단위 (선택) */
	unit?: string;
	/** 클릭 핸들러 (선택) */
	onClick?: () => void;
}

/**
 * KPI 카드 컴포넌트
 * 대시보드 핵심 지표 표시용
 */
export function KPICard({ title, value, yoy, unit, onClick }: KPICardProps) {
	const formatValue = (val: string | number): string => {
		if (typeof val === "number") {
			if (unit === "원") {
				// 원 단위 포맷팅 (억/천만원 단위로 표시)
				if (val >= 100000000) {
					return `${(val / 100000000).toFixed(1)}억원`;
				}
				if (val >= 10000000) {
					return `${(val / 10000000).toFixed(1)}천만원`;
				}
				return `${val.toLocaleString()}원`;
			}
			if (unit === "%") {
				return `${val.toFixed(2)}%`;
			}
			return val.toLocaleString();
		}
		return val;
	};

	const getYoyColor = (yoyValue?: number): string => {
		if (!yoyValue) return "text-muted-foreground";
		if (yoyValue > 0) return "text-green-600 dark:text-green-400";
		if (yoyValue < 0) return "text-red-600 dark:text-red-400";
		return "text-muted-foreground";
	};

	const getYoyIcon = (yoyValue?: number): string => {
		if (!yoyValue) return "";
		if (yoyValue > 0) return "↑";
		if (yoyValue < 0) return "↓";
		return "→";
	};

	return (
		<Card
			className={`p-6 ${onClick ? "cursor-pointer hover:bg-accent transition-colors" : ""}`}
			onClick={onClick}
		>
			<div className="space-y-2">
				<p className="text-sm font-medium text-muted-foreground">{title}</p>
				<div className="flex items-baseline gap-2">
					<p className="text-3xl font-bold">{formatValue(value)}</p>
					{unit && unit !== "원" && (
						<span className="text-sm text-muted-foreground">{unit}</span>
					)}
				</div>
				{yoy !== undefined && (
					<p className={`text-sm ${getYoyColor(yoy)}`}>
						{getYoyIcon(yoy)} {Math.abs(yoy).toFixed(1)}% YoY
					</p>
				)}
			</div>
		</Card>
	);
}

