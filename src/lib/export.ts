import type { SerializedRecord } from "@/lib/serialize";
import { ATTACHMENT_TYPE_LABELS } from "@/lib/constants";

/** 등록 시점 환율 기준 원화 환산값 (정수 원 단위 반올림). */
const krwAt = (v: number, rate: number | null) => Math.round(v * (rate ?? 1));
/** 외화 원본 추적 표기 (예: "12.43 USD @1513.37"), KRW면 "KRW". */
const origCell = (v: number, cur: string, rate: number | null) =>
  cur && cur !== "KRW" ? `${v} ${cur} @${rate ?? 1}` : "KRW";

/** 내보내기 컬럼 정의 (목록 화면과 동일 순서, 한글 헤더) — 모든 금액 원화 기준 */
const COLUMNS: { header: string; value: (r: SerializedRecord) => string | number }[] = [
  { header: "등록일", value: (r) => r.createdAt.slice(0, 10) },
  { header: "프로젝트명", value: (r) => r.projectName },
  { header: "제품명", value: (r) => r.productName },
  { header: "품목", value: (r) => r.category },
  { header: "고객사", value: (r) => r.clientName ?? "" },
  { header: "제작 수량", value: (r) => r.quantity },
  { header: "공장명", value: (r) => r.factoryName },
  // 외화 입력값은 각 필드 통화·환율로 원화 환산 (원본은 별도 컬럼에 추적)
  { header: "공장 단가(원)", value: (r) => krwAt(r.factoryUnitPrice, r.factoryUnitPriceRate) },
  { header: "공장 단가(원본)", value: (r) => origCell(r.factoryUnitPrice, r.factoryUnitPriceCurrency, r.factoryUnitPriceRate) },
  { header: "공장 총액(원)", value: (r) => Math.round(r.factoryTotalPrice) },
  { header: "샘플비(원)", value: (r) => krwAt(r.sampleFee, r.sampleFeeRate) },
  { header: "샘플비(원본)", value: (r) => origCell(r.sampleFee, r.sampleFeeCurrency, r.sampleFeeRate) },
  { header: "기타 비용(원)", value: (r) => krwAt(r.extraCost, r.extraCostRate) },
  { header: "기타 비용(원본)", value: (r) => origCell(r.extraCost, r.extraCostCurrency, r.extraCostRate) },
  { header: "최종 원가(원)", value: (r) => Math.round(r.finalCost) },
  { header: "공급 단가(원)", value: (r) => Math.round(r.supplyUnitPrice) },
  { header: "공급 총액(원)", value: (r) => Math.round(r.supplyTotalPrice) },
  { header: "마진 금액(원)", value: (r) => Math.round(r.marginAmount) },
  { header: "마진율(%)", value: (r) => (r.marginRate === null ? "" : r.marginRate) },
  { header: "제작 사양", value: (r) => r.specText },
  { header: "태그", value: (r) => r.tags.join(", ") },
  { header: "메모", value: (r) => r.memo ?? "" },
  {
    header: "첨부파일",
    value: (r) =>
      (r.attachments ?? [])
        .map(
          (a) =>
            `${ATTACHMENT_TYPE_LABELS[a.fileType as keyof typeof ATTACHMENT_TYPE_LABELS] ?? a.fileType}:${a.fileName}`,
        )
        .join(" | "),
  },
];

export function buildHeaderRow(): string[] {
  return COLUMNS.map((c) => c.header);
}

export function buildRows(records: SerializedRecord[]): (string | number)[][] {
  return records.map((r) => COLUMNS.map((c) => c.value(r)));
}

/** 객체 배열 (xlsx 의 json_to_sheet 용) */
export function buildObjectRows(records: SerializedRecord[]): Record<string, string | number>[] {
  return records.map((r) => {
    const obj: Record<string, string | number> = {};
    for (const c of COLUMNS) obj[c.header] = c.value(r);
    return obj;
  });
}

/** CSV 직렬화 (RFC 4180 따옴표 이스케이프) */
export function toCsv(records: SerializedRecord[]): string {
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    buildHeaderRow().map(escape).join(","),
    ...buildRows(records).map((row) => row.map(escape).join(",")),
  ];
  return lines.join("\r\n");
}
