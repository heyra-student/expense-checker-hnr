/**
 * 사내 경비 규정 (제5조 ~ 제9조) 상수 정의
 * 출처: 한결인테리어 경비 처리 규정 (제정 2024-01-01 / 개정 2026-03-01)
 */

export const POLICY_RULES = {
  ARTICLE_5: {
    id: "ARTICLE_5",
    articleNo: "제5조",
    title: "제5조 (식대)",
    maxAmountPerPerson: 12000,
    description: "업무상 식대(야근 식대 포함)는 1인당 1회 12,000원 한도",
  },
  ARTICLE_6: {
    id: "ARTICLE_6",
    articleNo: "제6조",
    title: "제6조 (교통비)",
    nightCutoffTime: "22:00",
    businessKeywords: ["방문", "점검", "이동", "출장", "고객사", "현장"],
    commuteKeyword: "퇴근",
    description: "오후 10시(22:00) 이후 퇴근 또는 업무상 외부 이동(메모 기재) 시에만 인정",
  },
  ARTICLE_7: {
    id: "ARTICLE_7",
    articleNo: "제7조",
    title: "제7조 (증빙)",
    maxSimpleReceiptAmount: 30000,
    simpleReceiptName: "간이영수증",
    description: "30,000원 이상 지출은 적격증빙 필수, 간이영수증은 30,000원 미만 지출에만 인정",
  },
  ARTICLE_8: {
    id: "ARTICLE_8",
    articleNo: "제8조",
    title: "제8조 (접대비)",
    approvalRequiredAmount: 300000,
    categoryName: "접대비",
    description: "거래처 접대비 1건 300,000원 초과 시 사전 품의 필수 (품의번호 기재)",
  },
  ARTICLE_9: {
    id: "ARTICLE_9",
    articleNo: "제9조",
    title: "제9조 (제출)",
    submissionLimitDays: 30,
    description: "사용일로부터 30일 이내 제출 / 동일 지출 중복 제출 불가",
  },
} as const;

export const ARTICLE_LABELS: Record<string, string> = {
  제5조: "제5조 (식대)",
  제6조: "제6조 (교통비)",
  제7조: "제7조 (증빙)",
  제8조: "제8조 (접대비)",
  제9조: "제9조 (제출)",
};
