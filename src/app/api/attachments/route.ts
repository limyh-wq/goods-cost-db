import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/storage";
import { attachmentMetaSchema } from "@/lib/validation";
import { serializeAttachment } from "@/lib/serialize";

export const dynamic = "force-dynamic";

const MAX_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 26214400);

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const recordId = formData.get("recordId");
  const file = formData.get("file");

  if (typeof recordId !== "string" || !recordId) {
    return NextResponse.json({ error: "recordId 가 필요합니다." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "파일이 필요합니다." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "빈 파일은 업로드할 수 없습니다." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `파일이 너무 큽니다. (최대 ${Math.floor(MAX_BYTES / 1024 / 1024)}MB)` },
      { status: 413 },
    );
  }

  // 제작건 존재 확인 (첨부는 반드시 제작건과 연결)
  const record = await prisma.productionRecord.findUnique({
    where: { id: recordId },
    select: { id: true },
  });
  if (!record) {
    return NextResponse.json({ error: "제작건을 찾을 수 없습니다." }, { status: 404 });
  }

  const meta = attachmentMetaSchema.safeParse({
    fileType: formData.get("fileType") ?? undefined,
    fileMemo: formData.get("fileMemo") ?? undefined,
  });
  if (!meta.success) {
    return NextResponse.json(
      { error: "첨부 메타데이터 검증 실패", issues: meta.error.flatten() },
      { status: 422 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const saved = await saveUploadedFile(recordId, file.name, buffer);

  const attachment = await prisma.attachment.create({
    data: {
      productionRecordId: recordId,
      fileName: file.name,
      fileUrl: saved.fileUrl,
      storageKey: saved.storageKey,
      fileType: meta.data.fileType,
      fileMemo: meta.data.fileMemo,
      mimeType: file.type || null,
      sizeBytes: saved.sizeBytes,
    },
  });

  return NextResponse.json(
    { attachment: serializeAttachment(attachment) },
    { status: 201 },
  );
}
