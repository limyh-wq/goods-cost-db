import type { SerializedRecord } from "@/lib/serialize";
import { ATTACHMENT_TYPE_LABELS } from "@/lib/constants";

/** 내보내기 컬럼 정의 (목록 화면과 동일 순서, 한글 헤더) */
const COLUMNS: { header: string; value: (r: SerializedRecord) => string | number }[] = [
  { header: "등록일", value: (r) => r.createdAt.slice(0, 10) },
  { header: "프로젝트명", value: (r) => r.projectName },
  { header: "제품명", value: (r) => r.productName },
  { header: "품목", value: (r) => r.category },
  { header: "고객사", value: (r) => r.clientName ?? "" },
  { header: "제작 수량", value: (r) => r.quantity },
  { header: "공장명", value: (r) => r.factoryName },
  { header: "통화", value: (r) => r.currency },
  { header: "공장 단가", value: (r) => r.factoryUnitPrice },
  { header: "공장 총액", value: (r) => r.factoryTotalPrice },
  { header: "샘플비", value: (r) => r.sampleFee },
  { header: "기타 비용", value: (r) => r.extraCost },
  { header: "최종 원가", value: (r) => r.finalCost },
  { header: "공급 단가", value: (r) => r.supplyUnitPrice },
  { header: "공급 총액", value: (r) => r.supplyTotalPrice },
  { header: "마진 금액", value: (r) => r.marginAmount },
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
