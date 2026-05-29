import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readStoredFile } from "@/lib/storage";

type Ctx = { params: Promise<{ key: string[] }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { key: keyParts } = await params;
  const storageKey = keyParts.map((p) => decodeURIComponent(p)).join("/");

  const attachment = await prisma.attachment.findFirst({
    where: { storageKey },
    select: { fileName: true, mimeType: true },
  });

  let buffer: Buffer;
  try {
    buffer = await readStoredFile(storageKey);
  } catch {
    return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });
  }

  const download = req.nextUrl.searchParams.get("download") === "1";
  const fileName = attachment?.fileName ?? storageKey.split("/").pop() ?? "file";
  const disposition = download ? "attachment" : "inline";

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": attachment?.mimeType || "application/octet-stream",
      "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Content-Length": String(buffer.byteLength),
    },
  });
}
