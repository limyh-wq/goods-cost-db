import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecord } from "@/lib/records";
import { serializeRecord } from "@/lib/serialize";
import { RecordForm } from "@/components/records/record-form";

export const dynamic = "force-dynamic";

export default async function EditRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await getRecord(id);
  if (!record) notFound();

  const serialized = serializeRecord(record);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/records" className="hover:text-gray-900">
          제작건 목록
        </Link>
        <span>/</span>
        <Link href={`/records/${id}`} className="hover:text-gray-900">
          {serialized.projectName}
        </Link>
        <span>/</span>
        <span className="text-gray-900">수정</span>
      </div>
      <h1 className="text-lg font-semibold">제작건 수정</h1>
      <RecordForm mode="edit" initial={serialized} />
    </div>
  );
}
