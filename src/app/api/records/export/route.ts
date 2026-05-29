import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { buildOrderBy, buildWhere, type RecordQuery } from "@/lib/records";
import { serializeRecord } from "@/lib/serialize";
import { buildObjectRows, toCsv } from "@/lib/export";

export const dynamic = "force-dynamic";

function queryFromRequest(req: NextRequest): RecordQuery {
  const sp = req.nextUrl.searchParams;
  const get = (k: string) => sp.get(k) ?? undefined;
  return {
    q: get("q"),
    category: get("category"),
    factoryName: get("factoryName"),
    clientName: get("clientName"),
    currency: get("currency"),
    tag: get("tag"),
    marginMin: get("marginMin"),
    marginMax: get("marginMax"),
    qtyMin: get("qtyMin"),
    qtyMax: get("qtyMax"),
    sort: get("sort"),
    dir: get("dir"),
  };
}

export async function GET(req: NextRequest) {
  const query = queryFromRequest(req);
  const format = req.nextUrl.searchParams.get("format") === "xlsx" ? "xlsx" : "csv";

  const records = await prisma.productionRecord.findMany({
    where: buildWhere(query),
    orderBy: buildOrderBy(query),
    include: { attachments: true },
  });
  const serialized = records.map(serializeRecord);

  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "xlsx") {
    const ws = XLSX.utils.json_to_sheet(buildObjectRows(serialized));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "제작건");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
    return new NextResponse(buf as unknown as BodyInit, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`제작건_${stamp}.xlsx`)}`,
      },
    });
  }

  // CSV (Excel 한글 깨짐 방지를 위해 UTF-8 BOM 추가)
  const csv = "﻿" + toCsv(serialized);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`제작건_${stamp}.csv`)}`,
    },
  });
}
