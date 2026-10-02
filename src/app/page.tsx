"use client";

import React, { useState } from "react";
import FileUploader from "@/components/FileUploader";
import SummaryCards from "@/components/SummaryCards";
import RejectCopyModal from "@/components/RejectCopyModal";
import ExpenseTable from "@/components/ExpenseTable";
import { ExpenseItem, AuditedExpenseItem } from "@/lib/types";
import { auditExpenses } from "@/lib/rules";
import { ShieldCheck, Receipt } from "lucide-react";

export default function Home() {
  const [items, setItems] = useState<AuditedExpenseItem[]>([]);
  const [currentFileName, setCurrentFileName] = useState<string>("");
  const [selectedArticle, setSelectedArticle] = useState<string>("ALL");

  const handleDataLoaded = (loadedItems: ExpenseItem[], fileName: string) => {
    // 3.2 룰 엔진 적용 (제5조~제9조 검증)
    const audited = auditExpenses(loadedItems);
    setItems(audited);
    setCurrentFileName(fileName);
    setSelectedArticle("ALL");
  };

  const handleClear = () => {
    setItems([]);
    setCurrentFileName("");
    setSelectedArticle("ALL");
  };

  const hasViolations = items.some((item) => item.isViolated);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  경비 정산 검사기
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    v1.0 (전체 핵심 기능 탑재)
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  경비 내역 CSV 파일을 올리면 회사 경비 규정(제5조~제9조) 위반 여부를 자동으로 검사합니다.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Zero Persistence (서버 저장 없음)
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* CSV File Uploader */}
        <section>
          <FileUploader
            onDataLoaded={handleDataLoaded}
            onClear={handleClear}
            currentFileName={currentFileName}
            itemCount={items.length}
          />
        </section>

        {/* 3.3 대시보드 요약 (Summary Cards) */}
        {items.length > 0 && (
          <section>
            <SummaryCards
              items={items}
              selectedArticle={selectedArticle}
              onSelectArticle={setSelectedArticle}
            />
          </section>
        )}

        {/* 3.4 제출자별 반려 사유 클립보드 복사 (RejectCopyModal) */}
        {items.length > 0 && hasViolations && (
          <section>
            <RejectCopyModal items={items} />
          </section>
        )}

        {/* 3.1 & 3.4 반응형 테이블 뷰 및 필터링 (ExpenseTable) */}
        <section>
          <ExpenseTable
            items={items}
            selectedArticle={selectedArticle}
            onSelectArticle={setSelectedArticle}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 mt-12 bg-white text-center text-xs text-slate-500">
        <p>© 한결인테리어 경영지원팀 • Next.js 기반 경비 정산 검사기 (Expense Policy Auditor)</p>
      </footer>
    </div>
  );
}
