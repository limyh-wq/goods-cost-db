"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { SerializedRecord } from "@/lib/serialize";
import { formatDate, formatInt, formatKRW } from "@/lib/format";
import { MarginBadge, Tag } from "@/components/ui";

const col = createColumnHelper<SerializedRecord>();

// 서버 정렬을 지원하는 컬럼 (URL sort 파라미터 키)
const SORTABLE_KEYS = new Set([
  "createdAt",
  "quantity",
  "factoryUnitPrice",
  "supplyUnitPrice",
  "marginRate",
]);

export function RecordsTable({ records }: { records: SerializedRecord[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const sort = sp.get("sort") ?? "createdAt";
  const dir = sp.get("dir") ?? "desc";

  function toggleSort(key: string) {
    const params = new URLSearchParams(sp.toString());
    if (sort === key) {
      params.set("dir", dir === "asc" ? "desc" : "asc");
    } else {
      params.set("sort", key);
      params.set("dir", "desc");
    }
    router.push(`/records?${params.toString()}`);
  }

  const columns = useMemo(
    () => [
      col.accessor("createdAt", {
        header: "등록일",
        cell: (c) => formatDate(c.getValue()),
      }),
      col.accessor("projectName", { header: "프로젝트명" }),
      col.accessor("productName", { header: "제품명" }),
      col.accessor("category", { header: "품목" }),
      col.accessor("clientName", {
        header: "고객사",
        cell: (c) => c.getValue() ?? "-",
      }),
      col.accessor("quantity", {
        header: "수량",
        cell: (c) => formatInt(c.getValue()),
        meta: { align: "right" },
      }),
      col.accessor("factoryName", { header: "공장명" }),
      col.accessor("currency", { header: "통화", meta: { align: "center" } }),
      col.accessor("factoryUnitPrice", {
        header: "공장 단가",
        // 외화 원본 × 등록시점 환율 → 원화 표시
        cell: (c) => formatKRW(c.getValue() * (c.row.original.exchangeRate ?? 1)),
        meta: { align: "right" },
      }),
      col.accessor("factoryTotalPrice", {
        header: "공장 총액",
        cell: (c) => formatKRW(c.getValue()),
        meta: { align: "right" },
      }),
      col.accessor("sampleFee", {
        header: "샘플비",
        cell: (c) => formatKRW(c.getValue() * (c.row.original.exchangeRate ?? 1)),
        meta: { align: "right" },
      }),
      col.accessor("extraCost", {
        header: "기타 비용",
        cell: (c) => formatKRW(c.getValue() * (c.row.original.exchangeRate ?? 1)),
        meta: { align: "right" },
      }),
      col.accessor("finalCost", {
        header: "최종 원가",
        cell: (c) => formatKRW(c.getValue()),
        meta: { align: "right", strong: true },
      }),
      col.accessor("supplyUnitPrice", {
        header: "공급 단가",
        cell: (c) => formatKRW(c.getValue()),
        meta: { align: "right" },
      }),
      col.accessor("supplyTotalPrice", {
        header: "공급 총액",
        cell: (c) => formatKRW(c.getValue()),
        meta: { align: "right" },
      }),
      col.accessor("marginAmount", {
        header: "마진 금액",
        cell: (c) => formatKRW(c.getValue()),
        meta: { align: "right" },
      }),
      col.accessor("marginRate", {
        header: "마진율",
        cell: (c) => <MarginBadge rate={c.getValue()} />,
        meta: { align: "center" },
      }),
      col.accessor("tags", {
        header: "태그",
        cell: (c) => (
          <div className="flex max-w-[180px] flex-wrap gap-1">
            {c.getValue().map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        ),
      }),
      col.accessor("attachmentCount", {
        header: "첨부",
        cell: (c) => {
          const n = c.getValue() ?? 0;
          return n > 0 ? (
            <span className="text-blue-600">📎 {n}</span>
          ) : (
            <span className="text-gray-300">-</span>
          );
        },
        meta: { align: "center" },
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: records,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (records.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-gray-300 bg-white py-16 text-center text-sm text-gray-500">
        조건에 맞는 제작건이 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
      <table className="min-w-full border-collapse">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => {
                const key = h.column.id;
                const sortable = SORTABLE_KEYS.has(key);
                const active = sort === key;
                return (
                  <th
                    key={h.id}
                    onClick={sortable ? () => toggleSort(key) : undefined}
                    className={
                      "whitespace-nowrap border-b border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-600 " +
                      (sortable ? "cursor-pointer select-none hover:bg-gray-100" : "")
                    }
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {sortable && (
                      <span className="ml-1 text-gray-400">
                        {active ? (dir === "asc" ? "▲" : "▼") : "↕"}
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => router.push(`/records/${row.original.id}`)}
              className="cursor-pointer hover:bg-blue-50/50"
            >
              {row.getVisibleCells().map((cell) => {
                const meta = cell.column.columnDef.meta as
                  | { align?: string; strong?: boolean }
                  | undefined;
                return (
                  <td
                    key={cell.id}
                    className={
                      "sheet-cell tabular-nums " +
                      (meta?.align === "right"
                        ? "text-right "
                        : meta?.align === "center"
                          ? "text-center "
                          : "text-left ") +
                      (meta?.strong ? "font-semibold" : "")
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
