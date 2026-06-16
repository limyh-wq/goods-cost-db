/**
 * 원가/공급가 자동 계산 — 시스템 전체에서 이 함수만 사용한다 (단일 출처).
 *
 * 계산식:
 *   factoryUnitPriceKRW = factoryUnitPrice × (exchangeRate ?? 1)
 *   factoryTotalPrice   = quantity × factoryUnitPriceKRW
 *   sampleFeeKRW        = sampleFee × (exchangeRate ?? 1)
 *   extraCostKRW        = extraCost × (exchangeRate ?? 1)
 *   finalCost           = factoryTotalPrice + sampleFeeKRW + extraCostKRW
 *   supplyTotalPrice    = (quantity × supplyUnitPrice) + sampleSupplyUnitPrice
 *   marginAmount        = supplyTotalPrice − finalCost
 *   marginRate          = marginAmount ÷ supplyTotalPrice × 100   (공급총액 0/빈값이면 null)
 *
 * 규칙:
 *   - 빈 값(null/undefined/NaN)은 모두 0으로 처리한다.
 *   - exchangeRate이 없으면 1로 취급 (같은 통화). 공장단가, 샘플비, 기타비용 모두 동일 통화.
 *   - 공급 총액 = 제품 공급가(제품단가×수량) + 샘플 공급가(고정).
 *   - 공급 총액이 0이거나 비어 있으면 marginRate 는 계산하지 않는다(null).
 *   - 부동소수점 노이즈 제거를 위해 금액은 소수 4자리, 마진율은 소수 2자리로 반올림한다.
 *
 * 순수 함수이며 Prisma/DOM 의존성이 없다 → 서버(저장 시 재계산)와 클라이언트(입력 미리보기)
 * 양쪽에서 동일하게 import 한다.
 */

export interface CalcInput {
  quantity?: number | string | null;
  factoryUnitPrice?: number | string | null;
  exchangeRate?: number | string | null; // (레거시/대표) 환율 — 필드별 환율 미지정 시 fallback
  sampleFee?: number | string | null;
  extraCost?: number | string | null;
  supplyUnitPrice?: number | string | null;
  sampleSupplyUnitPrice?: number | string | null; // 고객사 샘플 공급 단가 (KRW)
  // 필드별 환율 (지정 시 exchangeRate 대신 사용). 미지정/빈값이면 exchangeRate fallback.
  factoryRate?: number | string | null;
  sampleRate?: number | string | null;
  extraRate?: number | string | null;
}

export interface CalcResult {
  factoryTotalPrice: number;
  finalCost: number;
  supplyTotalPrice: number;
  marginAmount: number;
  /** 공급 총액이 0이거나 비어 있으면 null */
  marginRate: number | null;
}

/** 빈 값/문자열/NaN 을 안전하게 숫자로 변환. 변환 불가하면 0. */
export function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const trimmed = value.trim();
  if (trimmed === "") return 0;
  // 천단위 콤마 허용
  const parsed = Number(trimmed.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

/** 필드별 환율 선택: 빈값/미지정/0 이면 fallback 사용. */
function pickRate(
  perField: number | string | null | undefined,
  fallback: number,
): number {
  if (
    perField === undefined ||
    perField === null ||
    (typeof perField === "string" && perField.trim() === "")
  ) {
    return fallback;
  }
  const n = toNumber(perField);
  return n > 0 ? n : fallback;
}

/** 지정 소수 자리로 반올림 (부동소수점 노이즈 제거). */
export function roundTo(value: number, decimals: number): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  // EPSILON 보정으로 0.5 경계 반올림 안정화
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

const MONEY_DECIMALS = 4;
const RATE_DECIMALS = 2;

export function calcRecord(input: CalcInput): CalcResult {
  const quantity = toNumber(input.quantity);
  const factoryUnitPrice = toNumber(input.factoryUnitPrice);
  const fallbackRate = toNumber(input.exchangeRate) || 1; // 필드별 환율 미지정 시 fallback
  const sampleFee = toNumber(input.sampleFee);
  const extraCost = toNumber(input.extraCost);
  const supplyUnitPrice = toNumber(input.supplyUnitPrice);
  const sampleSupplyUnitPrice = toNumber(input.sampleSupplyUnitPrice);

  // 필드별 환율: 값이 지정되면 그것을, 아니면 fallbackRate 사용
  const factoryRate = pickRate(input.factoryRate, fallbackRate);
  const sampleRate = pickRate(input.sampleRate, fallbackRate);
  const extraRate = pickRate(input.extraRate, fallbackRate);

  // 각 공장 비용을 자기 통화 환율로 KRW 환산
  const factoryUnitPriceKRW = roundTo(factoryUnitPrice * factoryRate, MONEY_DECIMALS);
  const factoryTotalPrice = roundTo(quantity * factoryUnitPriceKRW, MONEY_DECIMALS);
  const sampleFeeKRW = roundTo(sampleFee * sampleRate, MONEY_DECIMALS);
  const extraCostKRW = roundTo(extraCost * extraRate, MONEY_DECIMALS);
  const finalCost = roundTo(
    factoryTotalPrice + sampleFeeKRW + extraCostKRW,
    MONEY_DECIMALS,
  );
  // 공급 총액: 제품 공급가 + 샘플 공급가
  const supplyTotalPrice = roundTo(
    quantity * supplyUnitPrice + sampleSupplyUnitPrice,
    MONEY_DECIMALS,
  );
  const marginAmount = roundTo(supplyTotalPrice - finalCost, MONEY_DECIMALS);

  const marginRate =
    supplyTotalPrice === 0
      ? null
      : roundTo((marginAmount / supplyTotalPrice) * 100, RATE_DECIMALS);

  return {
    factoryTotalPrice,
    finalCost,
    supplyTotalPrice,
    marginAmount,
    marginRate,
  };
}
