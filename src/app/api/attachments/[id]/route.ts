import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteStoredFile } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) {
    return NextResponse.json({ error: "첨부파일을 찾을 수 없습니다." }, { status: 404 });
  }

  await deleteStoredFile(attachment.storageKey);
  await prisma.attachment.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
