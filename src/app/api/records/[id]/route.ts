import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getRecord, updateRecord, deleteRecord } from "@/lib/records";
import { recordInputSchema } from "@/lib/validation";
import { serializeRecord } from "@/lib/serialize";
import { deleteStoredFile } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const record = await getRecord(id);
  if (!record) {
    return NextResponse.json({ error: "제작건을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ record: serializeRecord(record) });
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
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

  try {
    const record = await updateRecord(id, parsed.data);
    return NextResponse.json({ record: serializeRecord(record) });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "제작건을 찾을 수 없습니다." }, { status: 404 });
    }
    throw e;
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;

  // 첨부 파일 실물도 정리 (DB 레코드는 Cascade 로 삭제됨)
  const record = await getRecord(id);
  if (!record) {
    return NextResponse.json({ error: "제작건을 찾을 수 없습니다." }, { status: 404 });
  }

  await Promise.allSettled(
    record.attachments.map((a) => deleteStoredFile(a.storageKey)),
  );

  await deleteRecord(id);
  return NextResponse.json({ ok: true });
}
