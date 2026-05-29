import { describe, expect, it } from "vitest";
import { calcRecord, roundTo, toNumber } from "./calc";

describe("toNumber", () => {
  it("빈 값/undefined/null 은 0", () => {
    expect(toNumber(undefined)).toBe(0);
    expect(toNumber(null)).toBe(0);
    expect(toNumber("")).toBe(0);
    expect(toNumber("   ")).toBe(0);
  });

  it("숫자 문자열을 파싱하고 콤마를 허용", () => {
    expect(toNumber("1200")).toBe(1200);
    expect(toNumber("1,200.5")).toBe(1200.5);
  });

  it("NaN/Infinity 는 0", () => {
    expect(toNumber(NaN)).toBe(0);
    expect(toNumber(Infinity)).toBe(0);
    expect(toNumber("abc")).toBe(0);
  });
});

describe("roundTo", () => {
  it("부동소수점 노이즈 제거", () => {
    expect(roundTo(0.1 + 0.2, 4)).toBe(0.3);
    expect(roundTo(1.005, 2)).toBe(1.01);
  });
});

describe("calcRecord", () => {
  it("기본 계산식 (환율 없음 = 1)", () => {
    const r = calcRecord({
      quantity: 500,
      factoryUnitPrice: 1.2,
      sampleFee: 200,
      extraCost: 50,
      supplyUnitPrice: 2,
    });
    expect(r.factoryTotalPrice).toBe(600); // 500 * 1.2 * 1
    expect(r.finalCost).toBe(850); // 600 + 200 + 50
    expect(r.supplyTotalPrice).toBe(1000); // 500 * 2
    expect(r.marginAmount).toBe(150); // 1000 - 850
    expect(r.marginRate).toBe(15); // 150 / 1000 * 100
  });

  it("환율 적용 (RMB → KRW, 샘플비/기타비용도 환율 적용, 샘플 공급가 포함)", () => {
    const r = calcRecord({
      quantity: 500,
      factoryUnitPrice: 1.2, // RMB
      exchangeRate: 180, // RMB → KRW 환율
      sampleFee: 0.5, // RMB
      extraCost: 0.3, // RMB
      supplyUnitPrice: 216, // KRW (1.2 * 180)
      sampleSupplyUnitPrice: 10000, // 고객사 샘플 공급가 (KRW)
    });
    // 공장 단가: 500 * 1.2 * 180 = 108,000 KRW
    // 샘플비: 0.5 * 180 = 90 KRW
    // 기타비용: 0.3 * 180 = 54 KRW
    // 최종 원가: 108,000 + 90 + 54 = 108,144 KRW
    // 공급 총액: (500 * 216) + 10,000 = 108,000 + 10,000 = 118,000 KRW
    // 마진: 118,000 - 108,144 = 9,856 KRW
    expect(r.factoryTotalPrice).toBe(108000);
    expect(r.finalCost).toBe(108144); // 108000 + 90 + 54
    expect(r.supplyTotalPrice).toBe(118000); // 108000 + 10000
    expect(r.marginAmount).toBe(9856); // 118000 - 108144
    expect(r.marginRate).toBeCloseTo(8.35, 1); // 9856 / 118000 * 100 ≈ 8.35
  });

  it("sampleFee/extraCost 가 비어 있으면 0으로 처리", () => {
    const r = calcRecord({
      quantity: 100,
      factoryUnitPrice: 10,
      supplyUnitPrice: 15,
    });
    expect(r.finalCost).toBe(1000); // 1000 + 0 + 0
    expect(r.marginAmount).toBe(500); // 1500 - 1000
    expect(r.marginRate).toBe(33.33); // 500/1500*100 = 33.333.. → 33.33
  });

  it("공급 총액이 0이면 marginRate 는 null (0 나눗셈 방지)", () => {
    const r = calcRecord({
      quantity: 100,
      factoryUnitPrice: 10,
      supplyUnitPrice: 0,
    });
    expect(r.supplyTotalPrice).toBe(0);
    expect(r.marginAmount).toBe(-1000);
    expect(r.marginRate).toBeNull();
  });

  it("수량이 0이어도 안전 (공급총액 0 → marginRate null)", () => {
    const r = calcRecord({
      quantity: 0,
      factoryUnitPrice: 10,
      supplyUnitPrice: 20,
    });
    expect(r.factoryTotalPrice).toBe(0);
    expect(r.supplyTotalPrice).toBe(0);
    expect(r.marginRate).toBeNull();
  });

  it("음수 마진(역마진)도 계산", () => {
    const r = calcRecord({
      quantity: 10,
      factoryUnitPrice: 100,
      supplyUnitPrice: 80,
    });
    expect(r.marginAmount).toBe(-200); // 800 - 1000
    expect(r.marginRate).toBe(-25); // -200/800*100
  });

  it("문자열 입력(폼 값)도 처리", () => {
    const r = calcRecord({
      quantity: "1,000",
      factoryUnitPrice: "1.5",
      sampleFee: "",
      extraCost: null,
      supplyUnitPrice: "2.5",
    });
    expect(r.factoryTotalPrice).toBe(1500);
    expect(r.supplyTotalPrice).toBe(2500);
    expect(r.marginAmount).toBe(1000);
    expect(r.marginRate).toBe(40);
  });
});
