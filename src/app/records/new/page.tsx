import Link from "next/link";
import { RecordForm } from "@/components/records/record-form";

export default function NewRecordPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/records" className="hover:text-gray-900">
          제작건 목록
        </Link>
        <span>/</span>
        <span className="text-gray-900">새 제작건</span>
      </div>
      <h1 className="text-lg font-semibold">새 제작건 등록</h1>
      <RecordForm mode="create" />
    </div>
  );
}
