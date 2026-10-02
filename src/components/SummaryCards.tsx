"use client";

import React, { useMemo } from "react";
import { AuditedExpenseItem } from "@/lib/types";
import { ARTICLE_LABELS } from "@/constants/policyRules";
import { FileSpreadsheet, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

interface SummaryCardsProps {
  items: AuditedExpenseItem[];
  selectedArticle?: string;
  onSelectArticle?: (article: string) => void;
}

export default function SummaryCards({
  items,
  selectedArticle = "ALL",
  onSelectArticle,
}: SummaryCardsProps) {
  const totalCount = items.length;

  const violatedItems = useMemo(() => items.filter((i) => i.isViolated), [items]);
  const violationCount = violatedItems.length;
  const normalCount = totalCount - violationCount;

  // 조항별 위반 건수 집계
  const articleStats = useMemo(() => {
    const stats: Record<string, { label: string; count: number; code: string }> = {
      제5조: { label: ARTICLE_LABELS["제5조"], count: 0, code: "제5조" },
      제6조: { label: ARTICLE_LABELS["제6조"], count: 0, code: "제6조" },
      제7조: { label: ARTICLE_LABELS["제7조"], count: 0, code: "제7조" },
      제8조: { label: ARTICLE_LABELS["제8조"], count: 0, code: "제8조" },
      제9조: { label: ARTICLE_LABELS["제9조"], count: 0, code: "제9조" },
    };

    violatedItems.forEach((item) => {
      const addedArticles = new Set<string>();
      item.violations.forEach((v) => {
        const matchedKey = Object.keys(stats).find((key) => v.article.includes(key));
        if (matchedKey) {
          addedArticles.add(matchedKey);
        }
      });

      addedArticles.forEach((key) => {
        if (stats[key]) {
          stats[key].count += 1;
        }
      });
    });

    return stats;
  }, [violatedItems]);

  if (totalCount === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* 3.3 핵심 지표 카드 (3개 지표) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. 전체 검사 건수 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              전체 검사 건수
            </p>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {totalCount.toLocaleString()}
            </span>
            <span className="text-sm font-medium text-slate-500">건</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">업로드된 전체 경비 내역 항목</p>
        </div>

        {/* 2. 규정 위반 건수 */}
        <div className="bg-white p-5 rounded-xl border border-red-200 shadow-sm bg-gradient-to-br from-white to-red-50/30 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">
              규정 위반 건수
            </p>
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-red-600">
              {violationCount.toLocaleString()}
            </span>
            <span className="text-sm font-semibold text-red-500">건</span>
            {totalCount > 0 && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-700">
                {Math.round((violationCount / totalCount) * 100)}% 위반
              </span>
            )}
          </div>
          <p className="text-xs text-red-500/80 mt-1">사내 규정 미준수 또는 재검토 필요</p>
        </div>

        {/* 3. 정상 처리 건수 */}
        <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-sm bg-gradient-to-br from-white to-emerald-50/30 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              정상 처리 건수
            </p>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-700">
              {normalCount.toLocaleString()}
            </span>
            <span className="text-sm font-semibold text-emerald-600">건</span>
            {totalCount > 0 && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                {Math.round((normalCount / totalCount) * 100)}% 적격
              </span>
            )}
          </div>
          <p className="text-xs text-emerald-600/80 mt-1">지출 규정 요건 준수 확인</p>
        </div>
      </div>

      {/* 3.3 조항별 위반 통계 칩 */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-800">조항별 규정 위반 현황</h3>
          </div>
          <span className="text-xs text-slate-400">
            * 칩을 클릭하면 해당 조항 위반 건을 필터링할 수 있습니다.
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Object.values(articleStats).map((stat) => {
            const hasViolation = stat.count > 0;
            const isSelected = selectedArticle === stat.code;

            return (
              <button
                key={stat.code}
                type="button"
                onClick={() => {
                  if (onSelectArticle) {
                    onSelectArticle(isSelected ? "ALL" : stat.code);
                  }
                }}
                className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer text-left flex flex-col justify-between ${
                  isSelected
                    ? "ring-2 ring-blue-600 border-blue-500 bg-blue-50/60"
                    : hasViolation
                    ? "bg-red-50/60 border-red-200 hover:bg-red-100/50"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100/60"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold text-slate-700">
                    {stat.label}
                  </span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  )}
                </div>
                <div className="mt-2 flex items-baseline justify-between w-full">
                  <span
                    className={`text-xl font-extrabold ${
                      hasViolation ? "text-red-600" : "text-slate-400"
                    }`}
                  >
                    {stat.count}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      hasViolation ? "text-red-500" : "text-slate-400"
                    }`}
                  >
                    건 위반
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
