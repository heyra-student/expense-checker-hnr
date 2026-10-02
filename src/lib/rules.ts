import { POLICY_RULES } from "@/constants/policyRules";
import { ExpenseItem, Violation, AuditedExpenseItem } from "./types";

/**
 * 제5조 (식대) 검증
 * 1인당 1회 12,000원 한도 초과 여부 확인
 */
export function checkArticle5Meal(item: ExpenseItem): Violation | null {
  const isMeal = item.item.trim() === "식대";
  if (!isMeal) return null;

  const people = Math.max(1, item.peopleCount || 1);
  const amountPerPerson = Math.round(item.amount / people);

  if (amountPerPerson > POLICY_RULES.ARTICLE_5.maxAmountPerPerson) {
    return {
      article: POLICY_RULES.ARTICLE_5.title,
      articleNo: POLICY_RULES.ARTICLE_5.articleNo,
      reason: `1인당 ${POLICY_RULES.ARTICLE_5.maxAmountPerPerson.toLocaleString()}원 한도 초과 (1인당 ${amountPerPerson.toLocaleString()}원)`,
    };
  }

  return null;
}

/**
 * 제6조 (교통비) 검증
 * 택시비는 22시 이후 퇴근 또는 업무상 외부 이동(메모 기재) 시에만 인정
 */
export function checkArticle6Transport(item: ExpenseItem): Violation | null {
  const isTaxi = item.item.trim() === "택시" || item.item.includes("택시");
  if (!isTaxi) return null;

  const useTime = item.useTime.trim();
  const memo = (item.memo || "").trim();

  const isNight = useTime >= POLICY_RULES.ARTICLE_6.nightCutoffTime;
  const isCommute = memo.includes(POLICY_RULES.ARTICLE_6.commuteKeyword);
  const isBusinessTrip =
    POLICY_RULES.ARTICLE_6.businessKeywords.some((keyword) => memo.includes(keyword)) &&
    !isCommute;

  // 1. 퇴근 택시인데 22:00 이전인 경우
  if (isCommute && !isNight) {
    return {
      article: POLICY_RULES.ARTICLE_6.title,
      articleNo: POLICY_RULES.ARTICLE_6.articleNo,
      reason: `오후 10시(${POLICY_RULES.ARTICLE_6.nightCutoffTime}) 이전 퇴근 택시비 불인정 (${useTime || "시간 미기재"} 사용)`,
    };
  }

  // 2. 퇴근도 아니고, 야근(22시 이후)도 아니고, 업무상 이동 목적도 메모에 없는 경우
  if (!isCommute && !isNight && !isBusinessTrip) {
    return {
      article: POLICY_RULES.ARTICLE_6.title,
      articleNo: POLICY_RULES.ARTICLE_6.articleNo,
      reason: "업무상 이동 목적 또는 심야(22시 이후) 퇴근 미확인",
    };
  }

  return null;
}

/**
 * 제7조 (증빙) 검증
 * 간이영수증은 30,000원 미만 지출에만 인정
 */
export function checkArticle7Proof(item: ExpenseItem): Violation | null {
  const isSimpleReceipt = item.proof.trim() === POLICY_RULES.ARTICLE_7.simpleReceiptName;
  if (!isSimpleReceipt) return null;

  if (item.amount >= POLICY_RULES.ARTICLE_7.maxSimpleReceiptAmount) {
    return {
      article: POLICY_RULES.ARTICLE_7.title,
      articleNo: POLICY_RULES.ARTICLE_7.articleNo,
      reason: `간이영수증 한도(${POLICY_RULES.ARTICLE_7.maxSimpleReceiptAmount.toLocaleString()}원 미만) 초과 (${item.amount.toLocaleString()}원 지출)`,
    };
  }

  return null;
}

/**
 * 제8조 (접대비) 검증
 * 거래처 접대비 300,000원 초과 시 사전 품의번호 필수
 */
export function checkArticle8Entertainment(item: ExpenseItem): Violation | null {
  const isEntertainment = item.item.trim() === POLICY_RULES.ARTICLE_8.categoryName;
  if (!isEntertainment) return null;

  const hasApprovalNo = Boolean(item.approvalNo && item.approvalNo.trim().length > 0);

  if (item.amount > POLICY_RULES.ARTICLE_8.approvalRequiredAmount && !hasApprovalNo) {
    return {
      article: POLICY_RULES.ARTICLE_8.title,
      articleNo: POLICY_RULES.ARTICLE_8.articleNo,
      reason: "30만원 초과 접대비 사전 품의번호 누락",
    };
  }

  return null;
}

/**
 * 제9조 (제출 - 30일 기한) 검증
 * 사용일로부터 30일 이내 제출 여부 확인
 */
export function checkArticle9SubmissionPeriod(item: ExpenseItem): Violation | null {
  if (!item.useDate || !item.submissionDate) return null;

  const useDate = new Date(item.useDate);
  const submissionDate = new Date(item.submissionDate);

  if (isNaN(useDate.getTime()) || isNaN(submissionDate.getTime())) return null;

  const diffMs = submissionDate.getTime() - useDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > POLICY_RULES.ARTICLE_9.submissionLimitDays) {
    return {
      article: POLICY_RULES.ARTICLE_9.title,
      articleNo: POLICY_RULES.ARTICLE_9.articleNo,
      reason: `사용일로부터 30일 초과 제출 (사용 후 ${diffDays}일 경과)`,
    };
  }

  return null;
}

/**
 * 제9조 (제출 - 중복 제출) 검증
 * 동일 지출(사용일, 가맹점, 금액 일치) 중복 제출 검출
 * 1차 원본 제출건을 제외하고 후속 제출건을 위반으로 처리
 */
export function buildDuplicateMap(items: ExpenseItem[]): Map<number, Violation> {
  const groupMap = new Map<string, { id: string; index: number }[]>();
  const duplicateViolations = new Map<number, Violation>();

  items.forEach((item, index) => {
    const key = `${item.useDate.trim()}_${item.merchant.trim()}_${item.amount}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key)!.push({ id: item.id, index });
  });

  groupMap.forEach((group) => {
    if (group.length > 1) {
      const original = group[0];
      // 2번째 제출건부터 중복 위반 등록
      for (let i = 1; i < group.length; i++) {
        duplicateViolations.set(group[i].index, {
          article: POLICY_RULES.ARTICLE_9.title,
          articleNo: POLICY_RULES.ARTICLE_9.articleNo,
          reason: `동일 지출 중복 제출 (${original.id}번과 사용일·가맹점·금액 일치)`,
        });
      }
    }
  });

  return duplicateViolations;
}

/**
 * 전체 경비 내역 룰 엔진 일괄 검증 실행
 */
export function auditExpenses(items: ExpenseItem[]): AuditedExpenseItem[] {
  const duplicateMap = buildDuplicateMap(items);

  return items.map((item, index) => {
    const violations: Violation[] = [];

    // 제5조 식대 검증
    const v5 = checkArticle5Meal(item);
    if (v5) violations.push(v5);

    // 제6조 교통비 검증
    const v6 = checkArticle6Transport(item);
    if (v6) violations.push(v6);

    // 제7조 증빙 검증
    const v7 = checkArticle7Proof(item);
    if (v7) violations.push(v7);

    // 제8조 접대비 검증
    const v8 = checkArticle8Entertainment(item);
    if (v8) violations.push(v8);

    // 제9조 30일 기한 검증
    const v9Period = checkArticle9SubmissionPeriod(item);
    if (v9Period) violations.push(v9Period);

    // 제9조 중복 제출 검증
    const v9Dup = duplicateMap.get(index);
    if (v9Dup) violations.push(v9Dup);

    const people = Math.max(1, item.peopleCount || 1);
    const amountPerPerson = Math.round(item.amount / people);

    return {
      ...item,
      amountPerPerson,
      violations,
      isViolated: violations.length > 0,
    };
  });
}
