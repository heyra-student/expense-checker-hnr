import Papa from "papaparse";
import { ExpenseItem, ParseResult } from "./types";

/**
 * Clean numeric string and parse as number
 */
export function parseAmount(val: unknown): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, "");
  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Clean and parse people count (default 1)
 */
export function parsePeopleCount(val: unknown): number {
  if (typeof val === "number") return Math.max(1, Math.floor(val));
  if (!val) return 1;
  const num = parseInt(String(val).replace(/[^0-9]/g, ""), 10);
  return isNaN(num) || num < 1 ? 1 : num;
}

/**
 * Normalize a single raw row object into ExpenseItem
 */
export function normalizeRow(
  rawRow: Record<string, string>,
  index: number
): ExpenseItem {
  // Trimming all keys and values
  const trimmed: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawRow)) {
    trimmed[k.trim()] = typeof v === "string" ? v.trim() : String(v ?? "");
  }

  const id = trimmed["번호"] || String(index + 1);
  const submitter = trimmed["제출자"] || "미지정";
  const department = trimmed["부서"] || "";
  const useDate = trimmed["사용일"] || "";
  const useTime = trimmed["사용시각"] || "";
  const item = trimmed["항목"] || "";
  const merchant = trimmed["가맹점"] || "";
  const rawAmount = trimmed["금액"] || "0";
  const amount = parseAmount(rawAmount);
  const peopleCount = parsePeopleCount(trimmed["인원"]);
  const proof = trimmed["증빙"] || "";
  const approvalNo = trimmed["품의번호"] || "";
  const submissionDate = trimmed["제출일"] || "";
  const memo = trimmed["메모"] || "";

  return {
    id,
    submitter,
    department,
    useDate,
    useTime,
    item,
    merchant,
    amount,
    rawAmount,
    peopleCount,
    proof,
    approvalNo,
    submissionDate,
    memo,
    raw: trimmed,
  };
}

/**
 * Parse CSV text or File directly in browser using PapaParse
 */
export function parseExpenseCsv(
  fileOrText: File | string,
  fileName?: string
): Promise<ParseResult> {
  return new Promise((resolve) => {
    if (typeof fileOrText === "string") {
      Papa.parse<Record<string, string>>(fileOrText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.replace(/^\uFEFF/, "").trim(),
        complete: (results) => {
          const errors: string[] = [];
          if (results.errors && results.errors.length > 0) {
            results.errors.forEach((err) => {
              errors.push(`행 ${err.row ?? "?"}: ${err.message}`);
            });
          }

          const items = results.data
            .filter((row) => Object.values(row).some((val) => val && val.trim() !== ""))
            .map((row, idx) => normalizeRow(row, idx));

          resolve({
            data: items,
            errors,
            fileName: fileName || "text.csv",
          });
        },
        error: (error: Error) => {
          resolve({
            data: [],
            errors: [error.message],
            fileName: fileName || "text.csv",
          });
        },
      });
    } else {
      Papa.parse<Record<string, string>>(fileOrText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.replace(/^\uFEFF/, "").trim(),
        complete: (results) => {
          const errors: string[] = [];
          if (results.errors && results.errors.length > 0) {
            results.errors.forEach((err) => {
              errors.push(`행 ${err.row ?? "?"}: ${err.message}`);
            });
          }

          const items = results.data
            .filter((row) => Object.values(row).some((val) => val && val.trim() !== ""))
            .map((row, idx) => normalizeRow(row, idx));

          resolve({
            data: items,
            errors,
            fileName: fileOrText.name,
          });
        },
        error: (error: Error) => {
          resolve({
            data: [],
            errors: [error.message],
            fileName: fileOrText.name,
          });
        },
      });
    }
  });
}
