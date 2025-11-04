"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModeToggle } from "./mode-toggle";

/**
 * 네비게이션 링크 정의
 */
const navLinks = [
	{ to: "/dashboard", label: "대시보드" },
	{ to: "/risk", label: "리스크" },
	{ to: "/simulation", label: "시뮬레이션" },
	{ to: "/analysis", label: "분석" },
	{ to: "/upload", label: "업로드" },
] as const;

/**
 * 헤더 컴포넌트
 * 상단 네비게이션 및 테마 토글 포함
 */
export default function Header() {
	const pathname = usePathname();

	return (
		<div>
			<div className="flex flex-row items-center justify-between px-4 py-2">
				<nav className="flex gap-4 text-sm font-medium">
					{navLinks.map(({ to, label }) => {
						const isActive = pathname === to;
						return (
							<Link
								key={to}
								href={to}
								className={`transition-colors hover:text-foreground ${
									isActive
										? "text-foreground font-semibold"
										: "text-muted-foreground"
								}`}
							>
								{label}
							</Link>
						);
					})}
				</nav>
				<div className="flex items-center gap-2">
					<ModeToggle />
				</div>
			</div>
			<hr />
		</div>
	);
}
