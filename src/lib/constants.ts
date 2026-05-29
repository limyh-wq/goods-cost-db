// 도메인 상수 및 한글 라벨 (UI 표시용 단일 출처)

export const ATTACHMENT_TYPES = [
  "FACTORY_QUOTE",
  "CLIENT_SUPPLY_PRICE",
  "INVOICE",
  "STATEMENT",
  "SPEC_FILE",
  "WORK_REQUEST",
  "SAMPLE_PHOTO",
  "REVISION_GUIDE",
  "DELIVERY_FILE",
  "OTHER",
] as const;

export type AttachmentTypeValue = (typeof ATTACHMENT_TYPES)[number];

export const ATTACHMENT_TYPE_LABELS: Record<AttachmentTypeValue, string> = {
  FACTORY_QUOTE: "공장 견적서",
  CLIENT_SUPPLY_PRICE: "고객사 공급가",
  INVOICE: "인보이스",
  STATEMENT: "거래명세서",
  SPEC_FILE: "제작 사양서",
  WORK_REQUEST: "작업요청서",
  SAMPLE_PHOTO: "샘플 사진",
  REVISION_GUIDE: "수정 가이드",
  DELIVERY_FILE: "납품 자료",
  OTHER: "기타",
};

export const DOCUMENT_TYPES = [
  "FACTORY_QUOTE",
  "CLIENT_SUPPLY_PRICE",
  "INVOICE",
  "OTHER",
] as const;

export type DocumentTypeValue = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABELS: Record<DocumentTypeValue, string> = {
  FACTORY_QUOTE: "공장 견적서",
  CLIENT_SUPPLY_PRICE: "고객사 공급가",
  INVOICE: "인보이스",
  OTHER: "기타",
};

// 통화: 기본 후보 (자유 입력도 허용)
export const CURRENCY_OPTIONS = ["KRW", "RMB", "USD", "JPY", "EUR"] as const;
