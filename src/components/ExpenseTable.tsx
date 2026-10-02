"use client";

import React, { useState, useMemo } from "react";
import { AuditedExpenseItem } from "@/lib/types";
import { Search, FileSpreadsheet, AlertTriangle, CheckCircle2, Filter } from "lucide-react";

interface ExpenseTableProps {
  items: AuditedExpenseItem[];
  selectedArticle?: string;
  onSelectArticle?: (article: string) => void;
}

export default function ExpenseTable({
  items,
  selectedArticle,
  onSelectArticle,
}: ExpenseTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("ALL");
  const [onlyViolations, setOnlyViolations] = useState<boolean>(false);
  const [internalArticle, setInternalArticle] = useState<string>("ALL");

  const activeArticle = selectedArticle !== undefined ? selectedArticle : internalArticle;
  const handleArticleChange = (art: string) => {
    if (onSelectArticle) onSelectArticle(art);
    else setInternalArticle(art);
  };

  const totalCount = items.length;
  const violationCount = useMemo(() => items.filter((i) => i.isViolated).length, [items]);
  const normalCount = totalCount - violationCount;

  // Departments list for quick filtering
  const departments = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.department) set.add(item.department);
    });
    return Array.from(set);
  }, [items]);

  // Filtered items based on search, department, onlyViolations, and article
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (onlyViolations && !item.isViolated) return false;

      const matchesDept =
        selectedDepartment === "ALL" || item.department === selectedDepartment;
      if (!matchesDept) return false;

      if (activeArticle !== "ALL") {
        const hasArticle = item.violations.some((v) => v.article.includes(activeArticle));
        if (!hasArticle) return false;
      }

      if (!searchTerm) return true;
      const lower = searchTerm.toLowerCase();
      return (
        item.submitter.toLowerCase().includes(lower) ||
        item.merchant.toLowerCase().includes(lower) ||
        item.item.toLowerCase().includes(lower) ||
        (item.memo && item.memo.toLowerCase().includes(lower)) ||
        (item.approvalNo && item.approvalNo.toLowerCase().includes(lower)) ||
        item.violations.some((v) => v.reason.toLowerCase().includes(lower) || v.article.toLowerCase().includes(lower))
      );
    });
  }, [items, searchTerm, selectedDepartment, onlyViolations, activeArticle]);

  // Total amount of filtered rows
  const filteredTotalAmount = useMemo(() => {
    return filteredItems.reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredItems]);

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm">
        <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <h3 className="text-base font-medium text-slate-700">등록된 경비 내역이 없습니다</h3>
        <p className="text-xs text-slate-400 mt-1">상단의 파일 업로더를 통해 CSV 파일을 업로드해 주세요.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/60 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800">경비 정산 내역 및 규정 검사 결과</h2>
            {violationCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                <AlertTriangle className="w-3 h-3" />
                위반 {violationCount}건
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
            <span>
              전체 <strong>{totalCount}</strong>건 (정상 {normalCount}건, 위반 {violationCount}건)
            </span>
            <span>•</span>
            <span>
              현재 표시: <strong className="text-blue-600">{filteredItems.length}</strong>건
            </span>
            <span>•</span>
            <span>
              표시 금액 합계: <strong className="text-slate-800">{filteredTotalAmount.toLocaleString()}원</strong>
            </span>
          </div>
        </div>

        {/* Filter & View Mode Toggle Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 전체 vs 위반건만 토글 */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100">
            <button
              onClick={() => setOnlyViolations(false)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                !onlyViolations
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              전체 보기 ({totalCount})
            </button>
            <button
              onClick={() => setOnlyViolations(true)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                onlyViolations
                  ? "bg-red-600 text-white shadow-xs"
                  : "text-red-700 hover:text-red-900"
              }`}
            >
              위반 건만 보기 ({violationCount})
            </button>
          </div>

          {/* 조항별 필터 */}
          <select
            value={activeArticle}
            onChange={(e) => handleArticleChange(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">전체 조항</option>
            <option value="제5조">제5조 (식대)</option>
            <option value="제6조">제6조 (교통비)</option>
            <option value="제7조">제7조 (증빙)</option>
            <option value="제8조">제8조 (접대비)</option>
            <option value="제9조">제9조 (제출)</option>
          </select>

          {/* 부서 필터 */}
          {departments.length > 0 && (
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">전체 부서</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          )}

          {/* 검색창 */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="제출자, 가맹점, 사유 검색..."
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44 sm:w-48"
            />
          </div>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100/90 text-slate-700 text-xs font-semibold border-b border-slate-200">
              <th className="py-3 px-3 text-center w-12">번호</th>
              <th className="py-3 px-4 min-w-[240px]">검사 결과 (규정 준수 여부)</th>
              <th className="py-3 px-3 min-w-[80px]">제출자</th>
              <th className="py-3 px-3 min-w-[90px]">부서</th>
              <th className="py-3 px-3 min-w-[140px]">사용일시</th>
              <th className="py-3 px-3 min-w-[70px]">항목</th>
              <th className="py-3 px-3 min-w-[140px]">가맹점</th>
              <th className="py-3 px-3 min-w-[110px] text-right">금액</th>
              <th className="py-3 px-3 min-w-[60px] text-center">인원</th>
              <th className="py-3 px-3 min-w-[90px]">증빙</th>
              <th className="py-3 px-3 min-w-[120px]">품의번호</th>
              <th className="py-3 px-3 min-w-[95px]">제출일</th>
              <th className="py-3 px-3 min-w-[170px]">메모</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-12 text-center text-slate-400">
                  조건에 해당하는 경비 내역이 없습니다.
                </td>
              </tr>
            ) : (
              filteredItems.map((item, index) => {
                const isViolated = item.isViolated;
                return (
                  <tr
                    key={`${item.id}-${index}`}
                    className={`transition-colors ${
                      isViolated
                        ? "bg-red-50/75 hover:bg-red-100/70 border-l-4 border-l-red-500"
                        : "hover:bg-slate-50/80"
                    }`}
                  >
                    <td className="py-3 px-3 text-center text-slate-600 font-medium">
                      {item.id}
                    </td>

                    {/* 검사 결과 (규정 위반 여부) */}
                    <td className="py-3 px-4">
                      {isViolated ? (
                        <div className="space-y-1.5">
                          {item.violations.map((v, vIdx) => (
                            <div key={vIdx} className="flex flex-col items-start gap-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-300">
                                <AlertTriangle className="w-3 h-3 text-red-600" />
                                {v.article} 위반
                              </span>
                              <span className="text-[11px] font-medium text-red-700 leading-snug">
                                {v.reason}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          정상
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {item.submitter}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {item.department || "-"}
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      <span>{item.useDate}</span>{" "}
                      <span className="text-slate-400 font-mono">{item.useTime}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {item.item}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-800 font-medium">
                      {item.merchant}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="font-semibold text-slate-900">
                        {item.amount.toLocaleString()}원
                      </div>
                      {item.peopleCount > 1 && (
                        <div className="text-[10px] text-slate-400">
                          (1인당 {item.amountPerPerson.toLocaleString()}원)
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600">
                      {item.peopleCount}명
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${
                          item.proof === "간이영수증"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {item.proof || "-"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                      {item.approvalNo || "-"}
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {item.submissionDate || "-"}
                    </td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={item.memo}>
                      {item.memo || "-"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
