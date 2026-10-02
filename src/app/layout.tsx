import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "경비 정산 검사기 | 한결인테리어",
  description: "Next.js 기반 경비 정산 규정 검사기 (Expense Policy Auditor)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
