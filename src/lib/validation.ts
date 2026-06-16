import { z } from "zod";

/** 빈 문자열을 null 로 변환하는 optional 문자열 */
const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null))
  .nullable();

/** 폼/JSON 입력 → 제작건 생성·수정 페이로드 검증 (필수값 기획서 기준) */
export const recordInputSchema = z.object({
  // 기본 정보
  projectName: z.string().trim().min(1, "프로젝트명은 필수입니다."),
  productName: z.string().trim().min(1, "제품명은 필수입니다."),
  category: z.string().trim().min(1, "품목은 필수입니다."),
  code: z
    .string()
    .trim()
    .max(50, "제작건 코드는 50자 이내여야 합니다.")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null))
    .nullable(),
  clientName: optionalString,
  workSheetUrl: optionalString,

  // 원가/공급가
  quantity: z.coerce
    .number({ invalid_type_error: "제작 수량은 숫자여야 합니다." })
    .int("제작 수량은 정수여야 합니다.")
    .nonnegative("제작 수량은 0 이상이어야 합니다."),
  factoryName: z.string().trim().min(1, "공장명은 필수입니다."),
  // currency: (레거시/대표) 미지정 시 공장단가 통화로 채움
  currency: z.string().trim().min(1).default("KRW"),
  factoryUnitPrice: z.coerce
    .number({ invalid_type_error: "공장 단가는 숫자여야 합니다." })
    .nonnegative("공장 단가는 0 이상이어야 합니다."),
  exchangeRate: z.coerce
    .number({ invalid_type_error: "환율은 숫자여야 합니다." })
    .positive("환율은 0보다 커야 합니다.")
    .default(1)
    .optional(),
  sampleFee: z.coerce.number().nonnegative().default(0),
  extraCost: z.coerce.number().nonnegative().default(0),

  // 필드별 통화/환율 (공장단가·샘플비·기타비용 각각)
  factoryUnitPriceCurrency: z.string().trim().min(1).default("KRW"),
  factoryUnitPriceRate: z.coerce.number().positive("환율은 0보다 커야 합니다.").default(1).optional(),
  sampleFeeCurrency: z.string().trim().min(1).default("KRW"),
  sampleFeeRate: z.coerce.number().positive("환율은 0보다 커야 합니다.").default(1).optional(),
  extraCostCurrency: z.string().trim().min(1).default("KRW"),
  extraCostRate: z.coerce.number().positive("환율은 0보다 커야 합니다.").default(1).optional(),
  supplyUnitPrice: z.coerce
    .number({ invalid_type_error: "공급 단가는 숫자여야 합니다." })
    .nonnegative("공급 단가는 0 이상이어야 합니다."),
  sampleSupplyUnitPrice: z.coerce.number().nonnegative().default(0),

  // 제작 사양
  specText: z.string().trim().min(1, "제작 사양은 필수입니다."),
  tags: z
    .array(z.string().trim().min(1))
    .default([])
    .transform((arr) => Array.from(new Set(arr))), // 중복 제거

  memo: optionalString,
});

export type RecordInput = z.infer<typeof recordInputSchema>;

/** 첨부파일 메타데이터 검증 (파일 업로드 시 form-data 필드) */
export const attachmentMetaSchema = z.object({
  fileType: z
    .enum([
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
    ])
    .default("OTHER"),
  fileMemo: optionalString,
});

/** 콤마 구분 문자열 → 태그 배열 (폼 보조 유틸) */
export function parseTags(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
    ),
  );
}
