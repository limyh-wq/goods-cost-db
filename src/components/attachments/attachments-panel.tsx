"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SerializedAttachment } from "@/lib/serialize";
import {
  ATTACHMENT_TYPES,
  ATTACHMENT_TYPE_LABELS,
  type AttachmentTypeValue,
} from "@/lib/constants";
import { formatBytes, formatDate } from "@/lib/format";
import { Button, Input, Label, Select } from "@/components/ui";

export function AttachmentsPanel({
  recordId,
  initial,
}: {
  recordId: string;
  initial: SerializedAttachment[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<SerializedAttachment[]>(initial);
  const [fileType, setFileType] = useState<AttachmentTypeValue>("FACTORY_QUOTE");
  const [fileMemo, setFileMemo] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("파일을 선택하세요.");
      return;
    }
    const fd = new FormData();
    fd.append("recordId", recordId);
    fd.append("file", file);
    fd.append("fileType", fileType);
    if (fileMemo) fd.append("fileMemo", fileMemo);

    setUploading(true);
    try {
      const res = await fetch("/api/attachments", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "업로드에 실패했습니다.");
        return;
      }
      setItems((prev) => [data.attachment, ...prev]);
      setFileMemo("");
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch {
      setError("네트워크 오류로 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("이 첨부파일을 삭제할까요?")) return;
    const res = await fetch(`/api/attachments/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((a) => a.id !== id));
      router.refresh();
    } else {
      alert("삭제에 실패했습니다.");
    }
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleUpload}
        className="flex flex-wrap items-end gap-3 rounded-md border border-gray-200 bg-gray-50 p-4"
      >
        <div className="space-y-1">
          <Label>파일</Label>
          <input
            ref={fileRef}
            type="file"
            className="block text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:text-white hover:file:bg-blue-700"
          />
        </div>
        <div className="space-y-1">
          <Label>파일 유형</Label>
          <Select
            value={fileType}
            onChange={(e) => setFileType(e.target.value as AttachmentTypeValue)}
          >
            {ATTACHMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {ATTACHMENT_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-[200px] flex-1 space-y-1">
          <Label>파일 메모</Label>
          <Input
            value={fileMemo}
            onChange={(e) => setFileMemo(e.target.value)}
            placeholder="선택"
          />
        </div>
        <Button type="submit" disabled={uploading}>
          {uploading ? "업로드 중…" : "첨부 추가"}
        </Button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">첨부된 파일이 없습니다.</p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-md border border-gray-200 bg-white">
          {items.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                {ATTACHMENT_TYPE_LABELS[a.fileType as AttachmentTypeValue] ?? a.fileType}
              </span>
              <div className="min-w-0 flex-1">
                <a
                  href={a.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate font-medium text-blue-600 hover:underline"
                >
                  {a.fileName}
                </a>
                {a.fileMemo && (
                  <p className="truncate text-xs text-gray-500">{a.fileMemo}</p>
                )}
              </div>
              <span className="whitespace-nowrap text-xs text-gray-400">
                {formatBytes(a.sizeBytes)} · {formatDate(a.uploadedAt)}
              </span>
              <a
                href={`${a.fileUrl}?download=1`}
                className="text-xs text-gray-600 hover:text-gray-900"
              >
                다운로드
              </a>
              <button
                onClick={() => handleDelete(a.id)}
                className="text-xs text-red-600 hover:text-red-800"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
