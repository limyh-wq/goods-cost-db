"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function DeleteRecordButton({ id }: { id: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("이 제작건을 삭제할까요? 첨부파일도 함께 삭제됩니다.")) return;
    setDeleting(true);
    const res = await fetch(`/api/records/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/records");
      router.refresh();
    } else {
      alert("삭제에 실패했습니다.");
      setDeleting(false);
    }
  }

  return (
    <Button variant="danger" onClick={handleDelete} disabled={deleting}>
      {deleting ? "삭제 중…" : "삭제"}
    </Button>
  );
}
