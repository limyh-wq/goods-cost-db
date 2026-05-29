"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Input, LinkButton, Select } from "@/components/ui";

export interface FilterOptions {
  categories: string[];
  factories: string[];
  clients: string[];
  currencies: string[];
  tags: string[];
}

export function RecordsToolbar({
  options,
  total,
}: {
  options: FilterOptions;
  total: number;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(sp.get("q") ?? "");

  function update(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v && v.length > 0) params.set(k, v);
      else params.delete(k);
    }
    startTransition(() => {
      router.push(`/records?${params.toString()}`);
    });
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    update({ q });
  }

  const exportHref = (fmt: "csv" | "xlsx") => {
    const params = new URLSearchParams(sp.toString());
    params.set("format", fmt);
    return `/api/records/export?${params.toString()}`;
  };

  const filterSelect = (
    key: string,
    label: string,
    values: string[],
  ) => (
    <Select
      aria-label={label}
      value={sp.get(key) ?? ""}
      onChange={(e) => update({ [key]: e.target.value })}
    >
      <option value="">{label}: 전체</option>
      {values.map((v) => (
        <option key={v} value={v}>
          {v}
        </option>
      ))}
    </Select>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">제작건 목록</h1>
          <span className="text-sm text-gray-500">총 {total}건</span>
          {isPending && <span className="text-xs text-gray-400">불러오는 중…</span>}
        </div>
        <div className="flex items-center gap-2">
          <LinkButton href={exportHref("csv")} variant="outline" prefetch={false}>
            CSV 다운로드
          </LinkButton>
          <LinkButton href={exportHref("xlsx")} variant="outline" prefetch={false}>
            엑셀 다운로드
          </LinkButton>
          <LinkButton href="/records/new">+ 새 제작건</LinkButton>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={submitSearch} className="flex items-center gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="제품명·프로젝트명·사양·메모 검색"
            className="w-72"
          />
          <Button type="submit" variant="outline">
            검색
          </Button>
        </form>

        {filterSelect("category", "품목", options.categories)}
        {filterSelect("factoryName", "공장", options.factories)}
        {filterSelect("clientName", "고객사", options.clients)}
        {filterSelect("currency", "통화", options.currencies)}
        {filterSelect("tag", "태그", options.tags)}

        {sp.toString() && (
          <Button
            variant="ghost"
            onClick={() => startTransition(() => router.push("/records"))}
          >
            필터 초기화
          </Button>
        )}
      </div>
    </div>
  );
}
