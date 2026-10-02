export interface ExpenseItem {
  id: string; // 번호
  submitter: string; // 제출자
  department: string; // 부서
  useDate: string; // 사용일 (YYYY-MM-DD)
  useTime: string; // 사용시각 (HH:mm)
  item: string; // 항목
  merchant: string; // 가맹점
  amount: number; // 금액(숫자)
  rawAmount: string; // 원본 금액 문자열
  peopleCount: number; // 인원
  proof: string; // 증빙 (법인카드, 간이영수증 등)
  approvalNo?: string; // 품의번호
  submissionDate: string; // 제출일 (YYYY-MM-DD)
  memo?: string; // 메모
  raw: Record<string, string>; // 원본 필드
}

export interface Violation {
  article: string; // 예: "제5조 (식대)"
  articleNo: string; // 예: "제5조"
  reason: string; // 구체적 위반 사유
}

export interface AuditedExpenseItem extends ExpenseItem {
  violations: Violation[];
  isViolated: boolean;
  amountPerPerson: number;
}

export interface ParseResult {
  data: ExpenseItem[];
  errors: string[];
  fileName?: string;
}
