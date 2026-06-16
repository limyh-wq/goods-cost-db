import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * 제작건 코드로 진입하는 단축 경로 (진행현황 시스템 링크용).
 * - 일치 제작건이 정확히 1개면 → 해당 상세로 바로 이동
 * - 0개 또는 2개 이상이면 → 코드로 필터된 목록으로 이동
 */
export default async function RecordByCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const decoded = decodeURIComponent(code);

  const matches = await prisma.productionRecord.findMany({
    where: { code: { equals: decoded, mode: "insensitive" } },
    select: { id: true },
    orderBy: { createdAt: "desc" },
    take: 2,
  });

  if (matches.length === 1) {
    redirect(`/records/${matches[0].id}`);
  }
  redirect(`/records?code=${encodeURIComponent(decoded)}`);
}
