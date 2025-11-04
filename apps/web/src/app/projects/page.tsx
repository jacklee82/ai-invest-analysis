"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
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
import {
	Table,
	TableHeader,
	TableRow,
	TableHead,
	TableBody,
	TableCell,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, DollarSign } from "lucide-react";
import { toast } from "sonner";

/**
 * 프로젝트 관리 페이지
 * 프로젝트 추가/수정/삭제 및 월별 현금흐름 관리
 */
export default function ProjectsPage() {
	const [page, setPage] = useState(1);
	const [pageSize] = useState(20);
	const [businessTypeFilter, setBusinessTypeFilter] = useState<
		"선급투자" | "일반투자" | "OST" | "음반" | undefined
	>(undefined);
	const [companyFilter, setCompanyFilter] = useState("");
	const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isCashflowDialogOpen, setIsCashflowDialogOpen] = useState(false);

	const projectsQuery = useQuery(
		trpc.project.list.queryOptions({
			page,
			pageSize,
			businessType: businessTypeFilter,
			companyName: companyFilter || undefined,
		}),
	);

	const selectedProjectQuery = useQuery({
		...trpc.project.getById.queryOptions({ projectId: selectedProjectId || "" }),
		enabled: !!selectedProjectId,
	});

	const cashflowsQuery = useQuery({
		...trpc.project.getCashflows.queryOptions({ projectId: selectedProjectId || "" }),
		enabled: !!selectedProjectId && isCashflowDialogOpen,
	});

	const deleteMutation = useMutation({
		mutationFn: async (projectId: string) => {
			const result = await trpc.project.delete.mutate({ projectId });
			return result;
		},
		onSuccess: () => {
			toast.success("프로젝트가 삭제되었습니다.");
			projectsQuery.refetch();
		},
		onError: (error) => {
			toast.error(`삭제 실패: ${error.message}`);
		},
	});

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

	const getBusinessTypeBadge = (type: string) => {
		const colors: Record<string, string> = {
			선급투자: "bg-blue-500",
			일반투자: "bg-green-500",
			OST: "bg-purple-500",
			음반: "bg-orange-500",
		};
		return (
			<Badge className={colors[type] || "bg-gray-500"}>
				{type}
			</Badge>
		);
	};

	return (
		<div className="container mx-auto max-w-7xl px-4 py-6">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">프로젝트 관리</h1>
					<p className="text-muted-foreground mt-2">
						프로젝트 추가/수정/삭제 및 월별 현금흐름 관리
					</p>
				</div>
				<Button onClick={() => setIsAddDialogOpen(true)}>
					<Plus className="w-4 h-4 mr-2" />
					프로젝트 추가
				</Button>
			</div>

			{/* 필터 */}
			<Card className="mb-6">
				<CardContent className="p-4">
					<div className="flex gap-4 items-end">
						<div className="flex-1">
							<Label>사업 타입</Label>
							<Select
								value={businessTypeFilter || "all"}
								onValueChange={(value) =>
									setBusinessTypeFilter(
										value === "all"
											? undefined
											: (value as typeof businessTypeFilter),
									)
								}
							>
								<SelectTrigger className="mt-2">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">전체</SelectItem>
									<SelectItem value="선급투자">선급투자</SelectItem>
									<SelectItem value="일반투자">일반투자</SelectItem>
									<SelectItem value="OST">OST</SelectItem>
									<SelectItem value="음반">음반</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="flex-1">
							<Label>기획사명</Label>
							<Input
								placeholder="기획사명 검색..."
								value={companyFilter}
								onChange={(e) => setCompanyFilter(e.target.value)}
								className="mt-2"
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* 프로젝트 목록 */}
			<Card>
				<CardHeader>
					<CardTitle>
						프로젝트 목록 ({projectsQuery.data?.total || 0}개)
					</CardTitle>
				</CardHeader>
				<CardContent>
					{projectsQuery.isLoading ? (
						<Skeleton className="h-64 w-full" />
					) : projectsQuery.isError ? (
						<div className="text-center text-red-600">
							에러: {projectsQuery.error.message}
						</div>
					) : (
						<>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>프로젝트명</TableHead>
										<TableHead>기획사</TableHead>
										<TableHead>사업타입</TableHead>
										<TableHead>투자금</TableHead>
										<TableHead>회수금</TableHead>
										<TableHead>회수율</TableHead>
										<TableHead>계약기간</TableHead>
										<TableHead>작업</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{projectsQuery.data?.items.length === 0 ? (
										<TableRow>
											<TableCell colSpan={8} className="h-24 text-center">
												프로젝트가 없습니다.
											</TableCell>
										</TableRow>
									) : (
										projectsQuery.data?.items.map((proj) => {
											const totalInvestment =
												proj.initialInvestment +
												proj.additionalInvestment +
												(proj.ostInvestment || 0) +
												(proj.mdPurchaseCost || 0);
											const recoupRate =
												totalInvestment > 0
													? (proj.totalRecouped / totalInvestment) * 100
													: 0;

											return (
												<TableRow key={proj.projectId}>
													<TableCell className="font-medium">
														{proj.projectName}
													</TableCell>
													<TableCell>{proj.companyName}</TableCell>
													<TableCell>
														{getBusinessTypeBadge(proj.businessType)}
													</TableCell>
													<TableCell>
														{formatCurrency(totalInvestment)}
													</TableCell>
													<TableCell>
														{formatCurrency(proj.totalRecouped)}
													</TableCell>
													<TableCell
														className={
															recoupRate >= 70
																? "text-green-500"
																: recoupRate >= 40
																	? "text-blue-500"
																	: "text-red-500"
														}
													>
														{recoupRate.toFixed(1)}%
													</TableCell>
													<TableCell>
														{proj.baseContractMonths}개월
														{proj.extendedMonths > 0 &&
															` (+${proj.extendedMonths}개월)`}
													</TableCell>
													<TableCell>
														<div className="flex gap-2">
															<Button
																variant="outline"
																size="sm"
																onClick={() => {
																	setSelectedProjectId(proj.projectId);
																	setIsEditDialogOpen(true);
																}}
															>
																<Pencil className="w-4 h-4" />
															</Button>
															<Button
																variant="outline"
																size="sm"
																onClick={() => {
																	setSelectedProjectId(proj.projectId);
																	setIsCashflowDialogOpen(true);
																}}
															>
																<DollarSign className="w-4 h-4" />
															</Button>
															<Button
																variant="destructive"
																size="sm"
																onClick={() => {
																	if (
																		confirm(
																			`"${proj.projectName}" 프로젝트를 삭제하시겠습니까?`,
																		)
																	) {
																		deleteMutation.mutate(proj.projectId);
																	}
																}}
															>
																<Trash2 className="w-4 h-4" />
															</Button>
														</div>
													</TableCell>
												</TableRow>
											);
										})
									)}
								</TableBody>
							</Table>
							{projectsQuery.data && projectsQuery.data.totalPages > 1 && (
								<div className="flex justify-center gap-2 mt-4">
									<Button
										variant="outline"
										onClick={() => setPage((p) => Math.max(1, p - 1))}
										disabled={page === 1}
									>
										이전
									</Button>
									<span className="flex items-center px-4">
										{page} / {projectsQuery.data.totalPages}
									</span>
									<Button
										variant="outline"
										onClick={() =>
											setPage((p) =>
												Math.min(projectsQuery.data.totalPages, p + 1),
											)
										}
										disabled={page === projectsQuery.data.totalPages}
									>
										다음
									</Button>
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>

			{/* 프로젝트 추가 다이얼로그 */}
			<AddProjectDialog
				open={isAddDialogOpen}
				onOpenChange={setIsAddDialogOpen}
				onSuccess={() => {
					projectsQuery.refetch();
					setIsAddDialogOpen(false);
				}}
			/>

			{/* 프로젝트 수정 다이얼로그 */}
			{selectedProjectId && (
				<EditProjectDialog
					open={isEditDialogOpen}
					onOpenChange={setIsEditDialogOpen}
					projectId={selectedProjectId}
					onSuccess={() => {
						projectsQuery.refetch();
						selectedProjectQuery.refetch();
						setIsEditDialogOpen(false);
					}}
				/>
			)}

			{/* 월별 현금흐름 관리 다이얼로그 */}
			{selectedProjectId && (
				<CashflowDialog
					open={isCashflowDialogOpen}
					onOpenChange={setIsCashflowDialogOpen}
					projectId={selectedProjectId}
					onSuccess={() => {
						cashflowsQuery.refetch();
					}}
				/>
			)}
		</div>
	);
}

/**
 * 프로젝트 추가 다이얼로그
 */
function AddProjectDialog({
	open,
	onOpenChange,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}) {
	const [formData, setFormData] = useState({
		projectName: "",
		companyName: "",
		contractStartDate: "",
		baseContractMonths: 12,
		extendedMonths: 0,
		initialInvestment: 0,
		additionalInvestment: 0,
		totalRecouped: 0,
		mdPurchaseCost: null as number | null,
		ostInvestment: null as number | null,
		businessType: "선급투자" as "선급투자" | "일반투자" | "OST" | "음반",
	});

	const createMutation = useMutation({
		mutationFn: async (data: typeof formData) => {
			const result = await trpc.project.create.mutate(data);
			return result;
		},
		onSuccess: () => {
			toast.success("프로젝트가 추가되었습니다.");
			onSuccess();
			setFormData({
				projectName: "",
				companyName: "",
				contractStartDate: "",
				baseContractMonths: 12,
				extendedMonths: 0,
				initialInvestment: 0,
				additionalInvestment: 0,
				totalRecouped: 0,
				mdPurchaseCost: null,
				ostInvestment: null,
				businessType: "선급투자",
			});
		},
		onError: (error) => {
			toast.error(`추가 실패: ${error.message}`);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		createMutation.mutate(formData);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>프로젝트 추가</DialogTitle>
					<DialogDescription>
						새로운 프로젝트 정보를 입력하세요.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div>
							<Label>프로젝트명 *</Label>
							<Input
								value={formData.projectName}
								onChange={(e) =>
									setFormData({ ...formData, projectName: e.target.value })
								}
								required
								className="mt-2"
							/>
						</div>
						<div>
							<Label>기획사명 *</Label>
							<Input
								value={formData.companyName}
								onChange={(e) =>
									setFormData({ ...formData, companyName: e.target.value })
								}
								required
								className="mt-2"
							/>
						</div>
						<div>
							<Label>사업 타입 *</Label>
							<Select
								value={formData.businessType}
								onValueChange={(value: typeof formData.businessType) =>
									setFormData({ ...formData, businessType: value })
								}
							>
								<SelectTrigger className="mt-2">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="선급투자">선급투자</SelectItem>
									<SelectItem value="일반투자">일반투자</SelectItem>
									<SelectItem value="OST">OST</SelectItem>
									<SelectItem value="음반">음반</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>계약 시작일 *</Label>
							<Input
								type="date"
								value={formData.contractStartDate}
								onChange={(e) =>
									setFormData({ ...formData, contractStartDate: e.target.value })
								}
								required
								className="mt-2"
							/>
						</div>
						<div>
							<Label>기본 계약 기간 (개월) *</Label>
							<Input
								type="number"
								value={formData.baseContractMonths}
								onChange={(e) =>
									setFormData({
										...formData,
										baseContractMonths: parseInt(e.target.value) || 0,
									})
								}
								min="1"
								required
								className="mt-2"
							/>
						</div>
						<div>
							<Label>연장 기간 (개월)</Label>
							<Input
								type="number"
								value={formData.extendedMonths}
								onChange={(e) =>
									setFormData({
										...formData,
										extendedMonths: parseInt(e.target.value) || 0,
									})
								}
								min="0"
								className="mt-2"
							/>
						</div>
						<div>
							<Label>최초 투자금 (원) *</Label>
							<Input
								type="number"
								value={formData.initialInvestment}
								onChange={(e) =>
									setFormData({
										...formData,
										initialInvestment: parseInt(e.target.value) || 0,
									})
								}
								min="0"
								required
								className="mt-2"
							/>
						</div>
						<div>
							<Label>추가 투자금 (원)</Label>
							<Input
								type="number"
								value={formData.additionalInvestment}
								onChange={(e) =>
									setFormData({
										...formData,
										additionalInvestment: parseInt(e.target.value) || 0,
									})
								}
								min="0"
								className="mt-2"
							/>
						</div>
						{formData.businessType === "음반" && (
							<div>
								<Label>음반 매입원가 (원)</Label>
								<Input
									type="number"
									value={formData.mdPurchaseCost || ""}
									onChange={(e) =>
										setFormData({
											...formData,
											mdPurchaseCost: e.target.value
												? parseInt(e.target.value)
												: null,
										})
									}
									min="0"
									className="mt-2"
								/>
							</div>
						)}
						{formData.businessType === "OST" && (
							<div>
								<Label>OST 투자금 (원)</Label>
								<Input
									type="number"
									value={formData.ostInvestment || ""}
									onChange={(e) =>
										setFormData({
											...formData,
											ostInvestment: e.target.value
												? parseInt(e.target.value)
												: null,
										})
									}
									min="0"
									className="mt-2"
								/>
							</div>
						)}
						<div>
							<Label>총 회수금 (원)</Label>
							<Input
								type="number"
								value={formData.totalRecouped}
								onChange={(e) =>
									setFormData({
										...formData,
										totalRecouped: parseInt(e.target.value) || 0,
									})
								}
								min="0"
								className="mt-2"
							/>
						</div>
					</div>
					<div className="flex justify-end gap-2 mt-6">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							취소
						</Button>
						<Button type="submit" disabled={createMutation.isPending}>
							{createMutation.isPending ? "추가 중..." : "추가"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

/**
 * 프로젝트 수정 다이얼로그
 */
function EditProjectDialog({
	open,
	onOpenChange,
	projectId,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	projectId: string;
	onSuccess: () => void;
}) {
	const projectQuery = useQuery({
		...trpc.project.getById.queryOptions({ projectId }),
		enabled: open,
	});

	const [formData, setFormData] = useState<{
		projectName: string;
		companyName: string;
		contractStartDate: string;
		baseContractMonths: number;
		extendedMonths: number;
		initialInvestment: number;
		additionalInvestment: number;
		totalRecouped: number;
		mdPurchaseCost: number | null;
		ostInvestment: number | null;
		businessType: "선급투자" | "일반투자" | "OST" | "음반";
	} | null>(null);

	// 프로젝트 데이터 로드 시 폼 데이터 초기화
	useEffect(() => {
		if (projectQuery.data && !formData) {
			setFormData({
				projectName: projectQuery.data.projectName,
				companyName: projectQuery.data.companyName,
				contractStartDate: projectQuery.data.contractStartDate,
				baseContractMonths: projectQuery.data.baseContractMonths,
				extendedMonths: projectQuery.data.extendedMonths,
				initialInvestment: projectQuery.data.initialInvestment,
				additionalInvestment: projectQuery.data.additionalInvestment,
				totalRecouped: projectQuery.data.totalRecouped,
				mdPurchaseCost: projectQuery.data.mdPurchaseCost,
				ostInvestment: projectQuery.data.ostInvestment,
				businessType: projectQuery.data.businessType as "선급투자" | "일반투자" | "OST" | "음반",
			});
		}
	}, [projectQuery.data, formData]);

	const updateMutation = useMutation({
		mutationFn: async (data: typeof formData) => {
			if (!data) return;
			const result = await trpc.project.update.mutate({
				projectId,
				...data,
			});
			return result;
		},
		onSuccess: () => {
			toast.success("프로젝트가 수정되었습니다.");
			onSuccess();
		},
		onError: (error) => {
			toast.error(`수정 실패: ${error.message}`);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (formData) {
			updateMutation.mutate(formData);
		}
	};

	if (!formData) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent>
					<Skeleton className="h-64 w-full" />
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>프로젝트 수정</DialogTitle>
					<DialogDescription>
						프로젝트 정보를 수정하세요.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div>
							<Label>프로젝트명 *</Label>
							<Input
								value={formData.projectName}
								onChange={(e) =>
									setFormData({ ...formData, projectName: e.target.value })
								}
								required
								className="mt-2"
							/>
						</div>
						<div>
							<Label>기획사명 *</Label>
							<Input
								value={formData.companyName}
								onChange={(e) =>
									setFormData({ ...formData, companyName: e.target.value })
								}
								required
								className="mt-2"
							/>
						</div>
						<div>
							<Label>사업 타입 *</Label>
							<Select
								value={formData.businessType}
								onValueChange={(value: typeof formData.businessType) =>
									setFormData({ ...formData, businessType: value })
								}
							>
								<SelectTrigger className="mt-2">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="선급투자">선급투자</SelectItem>
									<SelectItem value="일반투자">일반투자</SelectItem>
									<SelectItem value="OST">OST</SelectItem>
									<SelectItem value="음반">음반</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>계약 시작일 *</Label>
							<Input
								type="date"
								value={formData.contractStartDate}
								onChange={(e) =>
									setFormData({ ...formData, contractStartDate: e.target.value })
								}
								required
								className="mt-2"
							/>
						</div>
						<div>
							<Label>기본 계약 기간 (개월) *</Label>
							<Input
								type="number"
								value={formData.baseContractMonths}
								onChange={(e) =>
									setFormData({
										...formData,
										baseContractMonths: parseInt(e.target.value) || 0,
									})
								}
								min="1"
								required
								className="mt-2"
							/>
						</div>
						<div>
							<Label>연장 기간 (개월)</Label>
							<Input
								type="number"
								value={formData.extendedMonths}
								onChange={(e) =>
									setFormData({
										...formData,
										extendedMonths: parseInt(e.target.value) || 0,
									})
								}
								min="0"
								className="mt-2"
							/>
						</div>
						<div>
							<Label>최초 투자금 (원) *</Label>
							<Input
								type="number"
								value={formData.initialInvestment}
								onChange={(e) =>
									setFormData({
										...formData,
										initialInvestment: parseInt(e.target.value) || 0,
									})
								}
								min="0"
								required
								className="mt-2"
							/>
						</div>
						<div>
							<Label>추가 투자금 (원)</Label>
							<Input
								type="number"
								value={formData.additionalInvestment}
								onChange={(e) =>
									setFormData({
										...formData,
										additionalInvestment: parseInt(e.target.value) || 0,
									})
								}
								min="0"
								className="mt-2"
							/>
						</div>
						{formData.businessType === "음반" && (
							<div>
								<Label>음반 매입원가 (원)</Label>
								<Input
									type="number"
									value={formData.mdPurchaseCost || ""}
									onChange={(e) =>
										setFormData({
											...formData,
											mdPurchaseCost: e.target.value
												? parseInt(e.target.value)
												: null,
										})
									}
									min="0"
									className="mt-2"
								/>
							</div>
						)}
						{formData.businessType === "OST" && (
							<div>
								<Label>OST 투자금 (원)</Label>
								<Input
									type="number"
									value={formData.ostInvestment || ""}
									onChange={(e) =>
										setFormData({
											...formData,
											ostInvestment: e.target.value
												? parseInt(e.target.value)
												: null,
										})
									}
									min="0"
									className="mt-2"
								/>
							</div>
						)}
						<div>
							<Label>총 회수금 (원)</Label>
							<Input
								type="number"
								value={formData.totalRecouped}
								onChange={(e) =>
									setFormData({
										...formData,
										totalRecouped: parseInt(e.target.value) || 0,
									})
								}
								min="0"
								className="mt-2"
							/>
						</div>
					</div>
					<div className="flex justify-end gap-2 mt-6">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							취소
						</Button>
						<Button type="submit" disabled={updateMutation.isPending}>
							{updateMutation.isPending ? "수정 중..." : "수정"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

/**
 * 월별 현금흐름 관리 다이얼로그
 */
function CashflowDialog({
	open,
	onOpenChange,
	projectId,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	projectId: string;
	onSuccess: () => void;
}) {
	const cashflowsQuery = useQuery({
		...trpc.project.getCashflows.queryOptions({ projectId }),
		enabled: open,
	});

	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [editingCashflowId, setEditingCashflowId] = useState<string | null>(null);

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			const result = await trpc.project.deleteCashflow.mutate({ id });
			return result;
		},
		onSuccess: () => {
			toast.success("현금흐름 데이터가 삭제되었습니다.");
			cashflowsQuery.refetch();
			onSuccess();
		},
		onError: (error) => {
			toast.error(`삭제 실패: ${error.message}`);
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>월별 현금흐름 관리</DialogTitle>
					<DialogDescription>
						프로젝트의 월별 현금흐름 데이터를 관리하세요.
					</DialogDescription>
				</DialogHeader>
				<div className="mb-4 flex justify-end">
					<Button onClick={() => setIsAddDialogOpen(true)}>
						<Plus className="w-4 h-4 mr-2" />
						추가
					</Button>
				</div>
				{cashflowsQuery.isLoading ? (
					<Skeleton className="h-64 w-full" />
				) : cashflowsQuery.isError ? (
					<div className="text-center text-red-600">
						에러: {cashflowsQuery.error.message}
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>년월</TableHead>
								<TableHead>매출액</TableHead>
								<TableHead>원가</TableHead>
								<TableHead>회수금</TableHead>
								<TableHead>작업</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{cashflowsQuery.data?.length === 0 ? (
								<TableRow>
									<TableCell colSpan={5} className="h-24 text-center">
										현금흐름 데이터가 없습니다.
									</TableCell>
								</TableRow>
							) : (
								cashflowsQuery.data?.map((cf) => (
									<TableRow key={cf.id}>
										<TableCell>{cf.yyyymm}</TableCell>
										<TableCell>
											{cf.revenueAmount.toLocaleString()}원
										</TableCell>
										<TableCell>{cf.costAmount.toLocaleString()}원</TableCell>
										<TableCell>{cf.recoupAmount.toLocaleString()}원</TableCell>
										<TableCell>
											<div className="flex gap-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() => setEditingCashflowId(cf.id)}
												>
													<Pencil className="w-4 h-4" />
												</Button>
												<Button
													variant="destructive"
													size="sm"
													onClick={() => {
														if (
															confirm(
																`${cf.yyyymm} 데이터를 삭제하시겠습니까?`,
															)
														) {
															deleteMutation.mutate(cf.id);
														}
													}}
												>
													<Trash2 className="w-4 h-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				)}
				<AddCashflowDialog
					open={isAddDialogOpen}
					onOpenChange={setIsAddDialogOpen}
					projectId={projectId}
					onSuccess={() => {
						cashflowsQuery.refetch();
						onSuccess();
						setIsAddDialogOpen(false);
					}}
				/>
				{editingCashflowId && cashflowsQuery.data && (
					<EditCashflowDialog
						open={!!editingCashflowId}
						onOpenChange={(open) => {
							if (!open) setEditingCashflowId(null);
						}}
						cashflowId={editingCashflowId}
						cashflow={cashflowsQuery.data.find((cf) => cf.id === editingCashflowId) || null}
						onSuccess={() => {
							cashflowsQuery.refetch();
							onSuccess();
							setEditingCashflowId(null);
						}}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}

/**
 * 현금흐름 추가 다이얼로그
 */
function AddCashflowDialog({
	open,
	onOpenChange,
	projectId,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	projectId: string;
	onSuccess: () => void;
}) {
	const [formData, setFormData] = useState({
		yyyymm: "",
		revenueAmount: 0,
		costAmount: 0,
		recoupAmount: 0,
	});

	const addMutation = useMutation({
		mutationFn: async (data: typeof formData) => {
			const result = await trpc.project.addCashflow.mutate({
				projectId,
				...data,
			});
			return result;
		},
		onSuccess: () => {
			toast.success("현금흐름 데이터가 추가되었습니다.");
			onSuccess();
			setFormData({
				yyyymm: "",
				revenueAmount: 0,
				costAmount: 0,
				recoupAmount: 0,
			});
		},
		onError: (error) => {
			toast.error(`추가 실패: ${error.message}`);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		addMutation.mutate(formData);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>현금흐름 추가</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<Label>년월 (YYYY-MM) *</Label>
						<Input
							type="text"
							placeholder="2024-01"
							value={formData.yyyymm}
							onChange={(e) =>
								setFormData({ ...formData, yyyymm: e.target.value })
							}
							required
							pattern="^\d{4}-\d{2}$"
							className="mt-2"
						/>
					</div>
					<div>
						<Label>매출액 (원) *</Label>
						<Input
							type="number"
							value={formData.revenueAmount}
							onChange={(e) =>
								setFormData({
									...formData,
									revenueAmount: parseInt(e.target.value) || 0,
								})
							}
							min="0"
							required
							className="mt-2"
						/>
					</div>
					<div>
						<Label>원가 (원) *</Label>
						<Input
							type="number"
							value={formData.costAmount}
							onChange={(e) =>
								setFormData({
									...formData,
									costAmount: parseInt(e.target.value) || 0,
								})
							}
							min="0"
							required
							className="mt-2"
						/>
					</div>
					<div>
						<Label>회수금 (원) *</Label>
						<Input
							type="number"
							value={formData.recoupAmount}
							onChange={(e) =>
								setFormData({
									...formData,
									recoupAmount: parseInt(e.target.value) || 0,
								})
							}
							min="0"
							required
							className="mt-2"
						/>
					</div>
					<div className="flex justify-end gap-2 mt-6">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							취소
						</Button>
						<Button type="submit" disabled={addMutation.isPending}>
							{addMutation.isPending ? "추가 중..." : "추가"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

/**
 * 현금흐름 수정 다이얼로그
 */
function EditCashflowDialog({
	open,
	onOpenChange,
	cashflowId,
	cashflow,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	cashflowId: string;
	cashflow: {
		id: string;
		yyyymm: string;
		revenueAmount: number;
		costAmount: number;
		recoupAmount: number;
	} | null;
	onSuccess: () => void;
}) {
	const [formData, setFormData] = useState({
		revenueAmount: cashflow?.revenueAmount || 0,
		costAmount: cashflow?.costAmount || 0,
		recoupAmount: cashflow?.recoupAmount || 0,
	});

	// cashflow 데이터가 변경되면 폼 업데이트
	if (cashflow && formData.revenueAmount !== cashflow.revenueAmount) {
		setFormData({
			revenueAmount: cashflow.revenueAmount,
			costAmount: cashflow.costAmount,
			recoupAmount: cashflow.recoupAmount,
		});
	}

	const updateMutation = useMutation({
		mutationFn: async (data: typeof formData) => {
			const result = await trpc.project.updateCashflow.mutate({
				id: cashflowId,
				...data,
			});
			return result;
		},
		onSuccess: () => {
			toast.success("현금흐름 데이터가 수정되었습니다.");
			onSuccess();
		},
		onError: (error) => {
			toast.error(`수정 실패: ${error.message}`);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		updateMutation.mutate(formData);
	};

	if (!cashflow) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent>
					<Skeleton className="h-64 w-full" />
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>현금흐름 수정</DialogTitle>
					<DialogDescription>{cashflow.yyyymm}</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<Label>매출액 (원) *</Label>
						<Input
							type="number"
							value={formData.revenueAmount}
							onChange={(e) =>
								setFormData({
									...formData,
									revenueAmount: parseInt(e.target.value) || 0,
								})
							}
							min="0"
							required
							className="mt-2"
						/>
					</div>
					<div>
						<Label>원가 (원) *</Label>
						<Input
							type="number"
							value={formData.costAmount}
							onChange={(e) =>
								setFormData({
									...formData,
									costAmount: parseInt(e.target.value) || 0,
								})
							}
							min="0"
							required
							className="mt-2"
						/>
					</div>
					<div>
						<Label>회수금 (원) *</Label>
						<Input
							type="number"
							value={formData.recoupAmount}
							onChange={(e) =>
								setFormData({
									...formData,
									recoupAmount: parseInt(e.target.value) || 0,
								})
							}
							min="0"
							required
							className="mt-2"
						/>
					</div>
					<div className="flex justify-end gap-2 mt-6">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							취소
						</Button>
						<Button type="submit" disabled={updateMutation.isPending}>
							{updateMutation.isPending ? "수정 중..." : "수정"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

