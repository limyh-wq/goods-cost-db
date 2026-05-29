import { NextRequest, NextResponse } from "next/server";
import { createRecord, listRecords, type RecordQuery } from "@/lib/records";
import { recordInputSchema } from "@/lib/validation";
import { serializeRecord } from "@/lib/serialize";

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
  const records = await listRecords(queryFromRequest(req));
  return NextResponse.json({ records: records.map(serializeRecord) });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 JSON 형식입니다." }, { status: 400 });
  }

  const parsed = recordInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "입력값 검증 실패", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const record = await createRecord(parsed.data);
  return NextResponse.json({ record: serializeRecord(record) }, { status: 201 });
}
