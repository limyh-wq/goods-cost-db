// 표시용 포맷 유틸

const nf = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 4 });
const nf0 = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });

/** 금액/숫자 포맷 (천단위 콤마) */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return nf.format(value);
}

export function formatInt(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return nf0.format(value);
}

/** 통화 포함 금액 (예: "1,200 RMB") */
export function formatMoney(
  value: number | null | undefined,
  currency?: string,
): string {
  if (value === null || value === undefined) return "-";
  return currency ? `${nf.format(value)} ${currency}` : nf.format(value);
}

/** 마진율: null 이면 "-", 아니면 "15.0%" */
export function formatRate(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return `${nf.format(value)}%`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
