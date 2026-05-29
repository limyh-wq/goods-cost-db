"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { calcRecord, toNumber } from "@/lib/calc";
import { recordInputSchema } from "@/lib/validation";
import { CURRENCY_OPTIONS } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import type { SerializedRecord } from "@/lib/serialize";
import { Button, Input, Label, MarginBadge, Select, Textarea } from "@/components/ui";
import { TagInput } from "@/components/records/tag-input";

type Mode = "create" | "edit";

interface FormShape {
  projectName: string;
  productName: string;
  category: string;
  code: string;
  clientName: string;
  workSheetUrl: string;
  quantity: string;
  factoryName: string;
  currency: string;
  factoryUnitPrice: string;
  exchangeRate: string;
  sampleFee: string;
  extraCost: string;
  supplyUnitPrice: string;
  sampleSupplyUnitPrice: string;
  specText: string;
  memo: string;
}

function toFormShape(r?: SerializedRecord): FormShape {
  return {
    projectName: r?.projectName ?? "",
    productName: r?.productName ?? "",
    category: r?.category ?? "",
    code: r?.code ?? "",
    clientName: r?.clientName ?? "",
    workSheetUrl: r?.workSheetUrl ?? "",
    quantity: r ? String(r.quantity) : "",
    factoryName: r?.factoryName ?? "",
    currency: r?.currency ?? "KRW",
    factoryUnitPrice: r ? String(r.factoryUnitPrice) : "",
    exchangeRate: r?.exchangeRate ? String(r.exchangeRate) : "1",
    sampleFee: r ? String(r.sampleFee) : "0",
    extraCost: r ? String(r.extraCost) : "0",
    supplyUnitPrice: r ? String(r.supplyUnitPrice) : "",
    sampleSupplyUnitPrice: r ? String(r.sampleSupplyUnitPrice) : "0",
    specText: r?.specText ?? "",
    memo: r?.memo ?? "",
  };
}

export function RecordForm({
  mode,
  initial,
}: {
  mode: Mode;
  initial?: SerializedRecord;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormShape>(() => toFormShape(initial));
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function set<K extends keyof FormShape>(key: K, value: string) {
    setForm((f) => {
      const updated = { ...f, [key]: value };
      // 통화 변경 시 exchangeRate 초기화
      if (key === "currency" && value === "KRW") {
        updated.exchangeRate = "1";
      }
      return updated;
    });
  }

  // 실시간 자동 계산
  const calc = useMemo(
    () =>
      calcRecord({
        quantity: form.quantity,
        factoryUnitPrice: form.factoryUnitPrice,
        exchangeRate: form.exchangeRate,
        sampleFee: form.sampleFee,
        extraCost: form.extraCost,
        supplyUnitPrice: form.supplyUnitPrice,
        sampleSupplyUnitPrice: form.sampleSupplyUnitPrice,
      }),
    [form.quantity, form.factoryUnitPrice, form.exchangeRate, form.sampleFee, form.extraCost, form.supplyUnitPrice, form.sampleSupplyUnitPrice],
  );

  // 환율 API 새로고침
  const [loadingRate, setLoadingRate] = useState(false);
  async function refreshExchangeRate() {
    const curr = form.currency;
    if (curr === "KRW") {
      set("exchangeRate", "1");
      return;
    }
    setLoadingRate(true);
    try {
      const res = await fetch(`/api/exchange-rates?from=${curr}&to=KRW`);
      if (res.ok) {
        const data = await res.json() as { rate: number };
        set("exchangeRate", String(data.rate));
      }
    } catch {
      // API 호출 실패 시 무시 (수동 입력 사용)
    } finally {
      setLoadingRate(false);
    }
  }

  // 공장 비용들의 KRW 환산값 (표시용)
  const exchangeRateNum = toNumber(form.exchangeRate) || 1;
  const factoryUnitPriceKRW = (toNumber(form.factoryUnitPrice) || 0) * exchangeRateNum;
  const sampleFeeKRW = (toNumber(form.sampleFee) || 0) * exchangeRateNum;
  const extraCostKRW = (toNumber(form.extraCost) || 0) * exchangeRateNum;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const payload = {
      ...form,
      clientName: form.clientName || undefined,
      workSheetUrl: form.workSheetUrl || undefined,
      memo: form.memo || undefined,
      tags,
    };

    const parsed = recordInputSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      // 첫 오류 필드로 스크롤
      const first = parsed.error.issues[0]?.path[0];
      if (typeof first === "string") {
        document.getElementById(`field-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const url = mode === "create" ? "/api/records" : `/api/records/${initial!.id}`;
      const method = mode === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setServerError(data.error ?? "저장에 실패했습니다.");
        setSubmitting(false);
        return;
      }
      const data = await res.json();
      router.push(`/records/${data.record.id}`);
      router.refresh();
    } catch {
      setServerError("네트워크 오류로 저장에 실패했습니다.");
      setSubmitting(false);
    }
  }

  const field = (
    key: keyof FormShape,
    label: string,
    opts: {
      required?: boolean;
      type?: string;
      placeholder?: string;
      step?: string;
    } = {},
  ) => (
    <div id={`field-${key}`} className="space-y-1">
      <Label htmlFor={key} required={opts.required}>
        {label}
      </Label>
      <Input
        id={key}
        type={opts.type ?? "text"}
        inputMode={opts.type === "number" ? "decimal" : undefined}
        step={opts.step}
        placeholder={opts.placeholder}
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
      />
      {errors[key] && <p className="text-xs text-red-600">{errors[key]}</p>}
    </div>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* 1. 기본 정보 */}
      <Section title="1. 기본 정보">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {field("projectName", "프로젝트명", { required: true })}
          {field("productName", "제품명", { required: true })}
          {field("category", "품목", { required: true, placeholder: "예: 아크릴 키링" })}
          {field("code", "제작건 코드", { placeholder: "예: SK-LEE-DR01" })}
          {field("clientName", "고객사")}
          {field("workSheetUrl", "업무관리 시트 링크", { placeholder: "https://…" })}
        </div>
      </Section>

      {/* 2. 원가/공급가 + 3. 자동 계산 결과 (입력 근처에 즉시 표시) */}
      <Section title="2. 원가 / 공급가 정보">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {field("quantity", "제작 수량", { required: true, type: "number", placeholder: "0" })}
          {field("factoryName", "공장명", { required: true })}
          <div className="space-y-1">
            <Label htmlFor="currency" required>
              통화
            </Label>
            <Select
              id="currency"
              className="w-full"
              value={form.currency}
              onChange={(e) => set("currency", e.target.value)}
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {form.currency !== "KRW" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="exchangeRate">
                {form.currency} → KRW 환율
              </Label>
              <div className="flex gap-2">
                <Input
                  id="exchangeRate"
                  type="number"
                  step="any"
                  placeholder="1"
                  value={form.exchangeRate}
                  onChange={(e) => set("exchangeRate", e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={refreshExchangeRate}
                  disabled={loadingRate}
                  className="whitespace-nowrap"
                >
                  {loadingRate ? "로딩…" : "새로고침"}
                </Button>
              </div>
              {errors.exchangeRate && <p className="text-xs text-red-600">{errors.exchangeRate}</p>}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <Label>공장 단가</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                placeholder="0"
                value={form.factoryUnitPrice}
                onChange={(e) => set("factoryUnitPrice", e.target.value)}
              />
              <span className="flex items-center px-3 bg-gray-50 rounded border border-gray-300 text-sm text-gray-600 font-medium">
                {form.currency}
              </span>
            </div>
            {errors.factoryUnitPrice && <p className="text-xs text-red-600">{errors.factoryUnitPrice}</p>}
            <CalcHint label="공장 단가 (KRW 환산)" value={factoryUnitPriceKRW} currency="KRW" />
          </div>
          <div className="space-y-1">
            <Label>샘플비</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                placeholder="0"
                value={form.sampleFee}
                onChange={(e) => set("sampleFee", e.target.value)}
              />
              <span className="flex items-center px-3 bg-gray-50 rounded border border-gray-300 text-sm text-gray-600 font-medium">
                {form.currency}
              </span>
            </div>
            {errors.sampleFee && <p className="text-xs text-red-600">{errors.sampleFee}</p>}
            {form.currency !== "KRW" && (
              <CalcHint label="샘플비 (KRW 환산)" value={sampleFeeKRW} currency="KRW" />
            )}
          </div>
          <div className="space-y-1">
            <Label>기타 비용</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                placeholder="0"
                value={form.extraCost}
                onChange={(e) => set("extraCost", e.target.value)}
              />
              <span className="flex items-center px-3 bg-gray-50 rounded border border-gray-300 text-sm text-gray-600 font-medium">
                {form.currency}
              </span>
            </div>
            {errors.extraCost && <p className="text-xs text-red-600">{errors.extraCost}</p>}
            {form.currency !== "KRW" && (
              <CalcHint label="기타 비용 (KRW 환산)" value={extraCostKRW} currency="KRW" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <Label>고객사 공급 단가</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                placeholder="0"
                value={form.supplyUnitPrice}
                onChange={(e) => set("supplyUnitPrice", e.target.value)}
              />
              <span className="flex items-center px-3 bg-gray-50 rounded border border-gray-300 text-sm text-gray-600 font-medium">
                KRW
              </span>
            </div>
            {errors.supplyUnitPrice && <p className="text-xs text-red-600">{errors.supplyUnitPrice}</p>}
            <CalcHint label="공급 총액" value={calc.supplyTotalPrice} currency="KRW" />
          </div>
          <div className="space-y-1">
            <Label>고객사 샘플 공급 단가</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                placeholder="0"
                value={form.sampleSupplyUnitPrice}
                onChange={(e) => set("sampleSupplyUnitPrice", e.target.value)}
              />
              <span className="flex items-center px-3 bg-gray-50 rounded border border-gray-300 text-sm text-gray-600 font-medium">
                KRW
              </span>
            </div>
            {errors.sampleSupplyUnitPrice && <p className="text-xs text-red-600">{errors.sampleSupplyUnitPrice}</p>}
          </div>
        </div>
      </Section>

      {/* 3. 자동 계산 결과 (요약 패널) */}
      <Section title="3. 자동 계산 결과 (단위: KRW)">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <ResultBox label="공장 총액" value={formatNumber(calc.factoryTotalPrice)} unit="KRW" />
          <ResultBox label="최종 원가" value={formatNumber(calc.finalCost)} unit="KRW" strong />
          <ResultBox label="공급 총액" value={formatNumber(calc.supplyTotalPrice)} unit="KRW" />
          <ResultBox label="마진 금액" value={formatNumber(calc.marginAmount)} unit="KRW" />
          <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
            <div className="text-xs text-gray-500">마진율</div>
            <div className="mt-1 text-lg">
              <MarginBadge rate={calc.marginRate} />
            </div>
          </div>
        </div>
        {calc.marginRate === null && (
          <p className="text-xs text-gray-500">※ 공급 총액이 0이면 마진율은 계산되지 않습니다.</p>
        )}
      </Section>

      {/* 4. 제작 사양 */}
      <Section title="4. 제작 사양">
        <div id="field-specText" className="space-y-1">
          <Label htmlFor="specText" required>
            제작 사양
          </Label>
          <Textarea
            id="specText"
            rows={4}
            placeholder="예) 3T 아크릴 / 양면 인쇄 / 에폭시 / OPP 개별포장 / 볼체인 포함"
            value={form.specText}
            onChange={(e) => set("specText", e.target.value)}
          />
          {errors.specText && <p className="text-xs text-red-600">{errors.specText}</p>}
        </div>
        <div className="space-y-1">
          <Label>태그</Label>
          <TagInput value={tags} onChange={setTags} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="memo">메모</Label>
          <Textarea
            id="memo"
            rows={3}
            value={form.memo}
            onChange={(e) => set("memo", e.target.value)}
          />
        </div>
      </Section>

      {/* 5. 첨부파일 안내 */}
      <Section title="5. 첨부파일">
        <p className="text-sm text-gray-500">
          {mode === "create"
            ? "첨부파일은 저장 후 상세 페이지에서 추가할 수 있습니다."
            : "첨부파일은 상세 페이지에서 관리합니다."}
        </p>
      </Section>

      {serverError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "저장 중…" : mode === "create" ? "등록" : "수정 저장"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          취소
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      {children}
    </section>
  );
}

function CalcHint({
  label,
  value,
  currency,
}: {
  label: string;
  value: number;
  currency: string;
}) {
  return (
    <p className="text-xs text-gray-500">
      {label}: <span className="font-medium text-gray-700">{formatNumber(value)} {currency}</span>
    </p>
  );
}

function ResultBox({
  label,
  value,
  unit,
  strong,
}: {
  label: string;
  value: string;
  unit?: string;
  strong?: boolean;
}) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={"mt-1 tabular-nums " + (strong ? "text-lg font-bold text-gray-900" : "text-base text-gray-800")}>
        {value} <span className="text-xs font-normal text-gray-500">{unit}</span>
      </div>
    </div>
  );
}
