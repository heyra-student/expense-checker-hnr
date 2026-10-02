"use client";

import React, { useState, useMemo } from "react";
import { AuditedExpenseItem } from "@/lib/types";
import {
  Copy,
  Check,
  Send,
  Users,
  FileText,
  X,
  ExternalLink,
  MessageSquare,
} from "lucide-react";

interface RejectCopyModalProps {
  items: AuditedExpenseItem[];
}

interface SubmitterGroup {
  submitter: string;
  department: string;
  items: AuditedExpenseItem[];
}

export default function RejectCopyModal({ items }: RejectCopyModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{
    title: string;
    text: string;
  } | null>(null);

  // Group violated items by submitter
  const groups = useMemo<SubmitterGroup[]>(() => {
    const map = new Map<string, { department: string; items: AuditedExpenseItem[] }>();

    items
      .filter((i) => i.isViolated)
      .forEach((item) => {
        const name = item.submitter || "이름 없음";
        if (!map.has(name)) {
          map.set(name, {
            department: item.department || "미지정",
            items: [],
          });
        }
        map.get(name)!.items.push(item);
      });

    return Array.from(map.entries()).map(([submitter, data]) => ({
      submitter,
      department: data.department,
      items: data.items,
    }));
  }, [items]);

  // Generate rejection text for a single submitter
  const generateSingleText = (group: SubmitterGroup): string => {
    let text = `[경비 정산 반려 안내 - ${group.submitter} 님]\n`;
    group.items.forEach((item) => {
      const violationsText = item.violations
        .map((v) => `[${v.article}] ${v.reason}`)
        .join(" / ");
      const amountStr = `${item.amount.toLocaleString()}원`;
      text += `- ${item.id}번 (${item.item} / ${item.merchant} / ${amountStr}): ${violationsText}\n`;
    });
    text += `\n* 사내 경비 규정 확인 후 수정하여 재제출 부탁드립니다.`;
    return text;
  };

  // Generate all rejection summary text
  const generateAllText = (): string => {
    let text = `[경비 정산 전체 규정 위반 내역 요약]\n\n`;
    groups.forEach((group) => {
      text += `■ ${group.submitter} 님 (${group.department}) - 위반 ${group.items.length}건\n`;
      group.items.forEach((item) => {
        const violationsText = item.violations
          .map((v) => `[${v.article}] ${v.reason}`)
          .join(" / ");
        const amountStr = `${item.amount.toLocaleString()}원`;
        text += `  - ${item.id}번 (${item.item} / ${item.merchant} / ${amountStr}): ${violationsText}\n`;
      });
      text += `\n`;
    });
    return text;
  };

  // Robust clipboard copy with fallback
  const handleCopy = (text: string, key: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          setCopiedKey(key);
          setTimeout(() => setCopiedKey(null), 2000);
        })
        .catch(() => {
          fallbackCopy(text, key);
        });
    } else {
      fallbackCopy(text, key);
    }
  };

  const fallbackCopy = (text: string, key: string) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand("copy");
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      alert("클립보드 복사에 실패했습니다. 브라우저 권한을 확인해 주세요.");
    } finally {
      document.body.removeChild(textarea);
    }
  };

  if (groups.length === 0) {
    return null;
  }

  const allViolationsCount = groups.reduce((acc, g) => acc + g.items.length, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
      {/* Header & Batch Copy Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-700" />
            <h3 className="text-base font-bold text-slate-800">
              제출자별 반려 사유 클립보드 복사
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-red-100 text-red-700">
              위반자 {groups.length}명 ({allViolationsCount}건)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            직원에게 반려할 때 카카오톡, Slack, 또는 사내 메일에 바로 붙여넣을 수 있는 정형화된 안내 문구입니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* 전체 일괄 복사 버튼 */}
          <button
            type="button"
            onClick={() => handleCopy(generateAllText(), "ALL")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all shadow-xs ${
              copiedKey === "ALL"
                ? "bg-emerald-600 text-white"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            {copiedKey === "ALL" ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>전체 복사 완료!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>전체 위반자 일괄 복사</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Submitter Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {groups.map((group) => {
          const singleText = generateSingleText(group);
          const isCopied = copiedKey === group.submitter;

          return (
            <div
              key={group.submitter}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 flex flex-col justify-between transition-colors shadow-2xs space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-slate-900">
                      {group.submitter}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      ({group.department})
                    </span>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                    위반 {group.items.length}건
                  </span>
                </div>

                {/* Violation Items List */}
                <div className="mt-2.5 space-y-1.5">
                  {group.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200/80"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-800">
                          {item.id}번 {item.item}
                        </span>
                        <span className="text-slate-500 font-medium">
                          {item.amount.toLocaleString()}원
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-red-700 line-clamp-1">
                        {item.violations.map((v) => v.reason).join(" / ")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPreviewData({
                      title: `${group.submitter} 님 (${group.department}) 반려 안내 문구`,
                      text: singleText,
                    })
                  }
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  미리보기
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(singleText, group.submitter)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-xs ${
                    isCopied
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>복사 완료!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>안내 문구 복사</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Preview Popup */}
      {previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h4 className="text-base font-bold text-slate-900">
                {previewData.title}
              </h4>
              <button
                type="button"
                onClick={() => setPreviewData(null)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4">
              <p className="text-xs text-slate-500 mb-2">
                사내 메신저나 이메일에 붙여넣을 메시지 내용입니다:
              </p>
              <textarea
                readOnly
                rows={7}
                value={previewData.text}
                className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-800 focus:outline-none select-all"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPreviewData(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={() => {
                  handleCopy(previewData.text, "PREVIEW");
                }}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all shadow-xs ${
                  copiedKey === "PREVIEW"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                {copiedKey === "PREVIEW" ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>클립보드 복사됨!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>내용 복사하기</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
