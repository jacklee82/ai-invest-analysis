"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableHeader,
	TableRow,
	TableHead,
	TableBody,
	TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, File, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import type { RouterOutputs } from "@my-better-t-app/api";

/**
 * 업로드 페이지
 * Module 4: 업로드 + A2A 검증 (P2 - 사업관리)
 * A/B 파일 업로드 및 검증
 */
export default function UploadPage() {
	const [file, setFile] = useState<File | null>(null);
	const [source, setSource] = useState<"A" | "B">("A");
	const [isUploading, setIsUploading] = useState(false);
	const [page, setPage] = useState(1);
	const pageSize = 20;

	const historyQuery = useQuery(
		trpc.upload.getUploadHistory.queryOptions({ page, pageSize }),
	);

	const handleFileSelect = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const selectedFile = e.target.files?.[0];
			if (selectedFile) {
				// Excel 파일만 허용
				const validExtensions = [".xlsx", ".xls"];
				const fileExtension = selectedFile.name
					.toLowerCase()
					.substring(selectedFile.name.lastIndexOf("."));
				if (!validExtensions.includes(fileExtension)) {
					toast.error("Excel 파일(.xlsx, .xls)만 업로드 가능합니다.");
					return;
				}
				setFile(selectedFile);
			}
		},
		[],
	);

	const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		const droppedFile = e.dataTransfer.files[0];
		if (droppedFile) {
			const validExtensions = [".xlsx", ".xls"];
			const fileExtension = droppedFile.name
				.toLowerCase()
				.substring(droppedFile.name.lastIndexOf("."));
			if (!validExtensions.includes(fileExtension)) {
				toast.error("Excel 파일(.xlsx, .xls)만 업로드 가능합니다.");
				return;
			}
			setFile(droppedFile);
		}
	}, []);

	const handleUpload = useCallback(async () => {
		if (!file) {
			toast.error("파일을 선택해주세요.");
			return;
		}

		setIsUploading(true);
		const formData = new FormData();
		formData.append("file", file);
		formData.append("source", source);

		try {
			const response = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});

			const result = await response.json();

			if (response.ok) {
				toast.success(
					`업로드 완료: ${result.rowsLoaded}개 행이 적재되었습니다.`,
				);
				setFile(null);
				// 이력 새로고침
				historyQuery.refetch();
			} else {
				toast.error(`업로드 실패: ${result.error || "알 수 없는 오류"}`);
			}
		} catch (error) {
			console.error("업로드 오류:", error);
			toast.error("업로드 중 오류가 발생했습니다.");
		} finally {
			setIsUploading(false);
		}
	}, [file, source, historyQuery]);

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "success":
				return (
					<Badge variant="default" className="bg-green-500">
						<CheckCircle2 className="w-3 h-3 mr-1" />
						성공
					</Badge>
				);
			case "failed":
				return (
					<Badge variant="destructive">
						<XCircle className="w-3 h-3 mr-1" />
						실패
					</Badge>
				);
			case "processing":
				return (
					<Badge variant="secondary">
						<Clock className="w-3 h-3 mr-1" />
						처리중
					</Badge>
				);
			default:
				return (
					<Badge variant="outline">
						<Clock className="w-3 h-3 mr-1" />
						대기중
					</Badge>
				);
		}
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleString("ko-KR", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<div className="container mx-auto max-w-7xl px-4 py-6">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">데이터 업로드</h1>
				<p className="text-muted-foreground mt-2">
					A/B 파일 업로드 및 검증
				</p>
			</div>

			{/* 업로드 섹션 */}
			<Card className="mb-8">
				<CardHeader>
					<CardTitle>파일 업로드</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{/* 소스 선택 */}
						<div>
							<label className="text-sm font-medium mb-2 block">
								파일 타입
							</label>
							<div className="flex gap-4">
								<Button
									variant={source === "A" ? "default" : "outline"}
									onClick={() => setSource("A")}
									disabled={isUploading}
								>
									A파일 (요약/마스터)
								</Button>
								<Button
									variant={source === "B" ? "default" : "outline"}
									onClick={() => setSource("B")}
									disabled={isUploading}
								>
									B파일 (원본/정산)
								</Button>
							</div>
							<p className="text-sm text-muted-foreground mt-2">
								{source === "A"
									? "프로젝트 마스터 데이터 (프로젝트명, 투자금, 회수금 등)"
									: "월별 현금흐름 데이터 (년월, 매출액, 원가, 회수금 등)"}
							</p>
						</div>

						{/* 파일 드롭존 */}
						<div
							onDrop={handleDrop}
							onDragOver={(e) => e.preventDefault()}
							className={`border-2 border-dashed rounded-lg p-8 text-center ${
								file
									? "border-primary bg-primary/5"
									: "border-muted-foreground/25 hover:border-primary/50"
							} transition-colors`}
						>
							<input
								type="file"
								id="file-upload"
								accept=".xlsx,.xls"
								onChange={handleFileSelect}
								disabled={isUploading}
								className="hidden"
							/>
							<label
								htmlFor="file-upload"
								className="cursor-pointer flex flex-col items-center gap-2"
							>
								<Upload className="w-12 h-12 text-muted-foreground" />
								{file ? (
									<>
										<File className="w-8 h-8 text-primary" />
										<p className="font-medium">{file.name}</p>
										<p className="text-sm text-muted-foreground">
											{(file.size / 1024).toFixed(2)} KB
										</p>
									</>
								) : (
									<>
										<p className="font-medium">
											파일을 드래그하거나 클릭하여 선택
										</p>
										<p className="text-sm text-muted-foreground">
											Excel 파일 (.xlsx, .xls)만 지원
										</p>
									</>
								)}
							</label>
						</div>

						{/* 업로드 버튼 */}
						<Button
							onClick={handleUpload}
							disabled={!file || isUploading}
							className="w-full"
							size="lg"
						>
							{isUploading ? "업로드 중..." : "업로드 시작"}
						</Button>

						{/* 주의사항 */}
						<div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
							<p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
								⚠️ 주의사항
							</p>
							<ul className="text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside space-y-1">
								<li>
									업로드 시 기존 데이터가 <strong>모두 삭제</strong>되고 새
									데이터로 <strong>전체 덮어쓰기</strong>됩니다.
								</li>
								<li>
									A파일은 누적 마스터 파일 형태로 업로드해야 합니다.
								</li>
								<li>
									B파일은 프로젝트명이 A파일과 일치해야 매핑됩니다.
								</li>
							</ul>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* 업로드 이력 */}
			<Card>
				<CardHeader>
					<CardTitle>업로드 이력</CardTitle>
				</CardHeader>
				<CardContent>
					{historyQuery.isLoading ? (
						<Skeleton className="h-64 w-full" />
					) : historyQuery.isError ? (
						<div className="text-center text-red-600">
							에러: {historyQuery.error.message}
						</div>
					) : (
						<>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>파일명</TableHead>
										<TableHead>타입</TableHead>
										<TableHead>상태</TableHead>
										<TableHead>파싱 행수</TableHead>
										<TableHead>적재 행수</TableHead>
										<TableHead>시작 시간</TableHead>
										<TableHead>종료 시간</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{historyQuery.data?.items.length === 0 ? (
										<TableRow>
											<TableCell colSpan={7} className="h-24 text-center">
												업로드 이력이 없습니다.
											</TableCell>
										</TableRow>
									) : (
										historyQuery.data?.items.map((item: RouterOutputs["upload"]["getUploadHistory"]["items"][number]) => (
											<TableRow key={item.jobId}>
												<TableCell className="font-medium">
													{item.fileName}
												</TableCell>
												<TableCell>
													<Badge variant="outline">
														{item.source}파일
													</Badge>
												</TableCell>
												<TableCell>{getStatusBadge(item.status)}</TableCell>
												<TableCell>{item.rowsParsed.toLocaleString()}</TableCell>
												<TableCell>{item.rowsLoaded.toLocaleString()}</TableCell>
												<TableCell>
													{formatDate(item.startedAt)}
												</TableCell>
												<TableCell>
													{item.endedAt ? formatDate(item.endedAt) : "-"}
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
							{historyQuery.data && historyQuery.data.totalPages > 1 && (
								<div className="flex justify-center gap-2 mt-4">
									<Button
										variant="outline"
										onClick={() => setPage((p) => Math.max(1, p - 1))}
										disabled={page === 1}
									>
										이전
									</Button>
									<span className="flex items-center px-4">
										{page} / {historyQuery.data.totalPages}
									</span>
									<Button
										variant="outline"
										onClick={() =>
											setPage((p) =>
												Math.min(historyQuery.data.totalPages, p + 1),
											)
										}
										disabled={page === historyQuery.data.totalPages}
									>
										다음
									</Button>
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
