import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "../index.css";
import Providers from "@/components/providers";
import Header from "@/components/header";

const notoSansKR = Noto_Sans_KR({
	variable: "--font-noto-sans-kr",
	subsets: ["latin"],
	weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
	display: "swap",
	preload: true,
});

export const metadata: Metadata = {
	title: "AI 기반 콘텐츠 투자 분석 시스템",
	description: "콘텐츠 투자 분석 및 리스크 관리 시스템",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ko" suppressHydrationWarning>
			<body
				className={`${notoSansKR.variable} antialiased`}
			>
				<Providers>
					<div className="grid grid-rows-[auto_1fr] h-svh">
						<Header />
						{children}
					</div>
				</Providers>
			</body>
		</html>
	);
}
