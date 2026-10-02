"use client";

import React, { useRef, useState, DragEvent, ChangeEvent } from "react";
import { UploadCloud, FileSpreadsheet, AlertCircle, RefreshCw, X } from "lucide-react";
import { parseExpenseCsv } from "@/lib/parser";
import { ExpenseItem } from "@/lib/types";
import { SAMPLE_CSV_CONTENT } from "@/constants/sampleData";

interface FileUploaderProps {
  onDataLoaded: (items: ExpenseItem[], fileName: string) => void;
  onClear: () => void;
  currentFileName?: string;
  itemCount?: number;
}

export default function FileUploader({
  onDataLoaded,
  onClear,
  currentFileName,
  itemCount = 0,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setErrorMessage("CSV 파일(.csv)만 업로드 가능합니다.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await parseExpenseCsv(file);
      if (result.errors.length > 0 && result.data.length === 0) {
        setErrorMessage(`CSV 파싱 실패: ${result.errors.join(", ")}`);
      } else if (result.data.length === 0) {
        setErrorMessage("CSV 파일 내에 데이터가 존재하지 않습니다.");
      } else {
        onDataLoaded(result.data, file.name);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "파일을 읽는 중 오류가 발생했습니다.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50/50"
            : "border-slate-300 bg-slate-50/70 hover:bg-slate-100/60"
        }`}
      >
        <div className="w-14 h-14 rounded-full bg-blue-100/70 flex items-center justify-center mb-3 text-blue-600">
          <UploadCloud className="w-7 h-7" />
        </div>

        <p className="text-base font-semibold text-slate-800 mb-1">
          경비 내역 CSV 파일을 드래그하여 놓거나 선택하세요
        </p>
        <p className="text-xs text-slate-500 mb-5">
          표준 경비 내역 컬럼(번호, 제출자, 부서, 사용일, 항목, 가맹점, 금액 등)을 자동 파싱합니다.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleInputChange}
          className="hidden"
          id="csv-file-input"
        />

        <div className="flex flex-wrap items-center justify-center gap-3">
          <label
            htmlFor="csv-file-input"
            className={`cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm ${
              isLoading
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>파싱 중...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4" />
                <span>CSV 파일 선택</span>
              </>
            )}
          </label>

          <button
            type="button"
            onClick={async () => {
              setIsLoading(true);
              setErrorMessage(null);
              try {
                const result = await parseExpenseCsv(SAMPLE_CSV_CONTENT, "9월_경비내역.csv");
                onDataLoaded(result.data, "9월_경비내역.csv");
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : "샘플 로드 중 오류가 발생했습니다.";
                setErrorMessage(msg);
              } finally {
                setIsLoading(false);
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <span>✨ 9월 경비 샘플 불러오기</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {currentFileName && (
        <div className="mt-4 flex items-center justify-between bg-slate-100/80 border border-slate-200/80 px-4 py-3 rounded-lg">
          <div className="flex items-center gap-2.5 text-sm">
            <span className="font-semibold text-slate-800">
              📂 현재 파일: {currentFileName}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              총 {itemCount.toLocaleString()}건 로드됨
            </span>
          </div>

          <button
            onClick={onClear}
            className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1 font-medium transition-colors"
            title="목록 비우기"
          >
            <X className="w-3.5 h-3.5" />
            초기화
          </button>
        </div>
      )}
    </div>
  );
}
