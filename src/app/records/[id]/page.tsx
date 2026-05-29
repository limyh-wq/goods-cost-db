import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecord } from "@/lib/records";
import { serializeRecord } from "@/lib/serialize";
import { formatDate, formatMoney, formatInt } from "@/lib/format";
import { LinkButton, MarginBadge, Tag } from "@/components/ui";
import { DeleteRecordButton } from "@/components/records/delete-record-button";
import { AttachmentsPanel } from "@/components/attachments/attachments-panel";

export const dynamic = "force-dynamic";

export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await getRecord(id);
  if (!record) notFound();

  const r = serializeRecord(record);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* 헤더 */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/records" className="hover:text-gray-900">
              제작건 목록
            </Link>
            <span>/</span>
            <span className="text-gray-900">{r.projectName}</span>
          </div>
          <h1 className="mt-1 text-xl font-semibold">{r.productName}</h1>
          <p className="text-sm text-gray-500">
            {r.category} · {r.factoryName}
            {r.clientName ? ` · ${r.clientName}` : ""} · 등록 {formatDate(r.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LinkButton href={`/records/${r.id}/edit`} variant="outline">
            수정
          </LinkButton>
          <DeleteRecordButton id={r.id} />
        </div>
      </div>

      {/* 기본 정보 */}
      <Card title="기본 정보">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-3">
          <Field label="프로젝트명" value={r.projectName} />
          <Field label="제품명" value={r.productName} />
          <Field label="품목" value={r.category} />
          <Field label="고객사" value={r.clientName ?? "-"} />
          <Field label="공장명" value={r.factoryName} />
          <Field label="통화" value={r.currency} />
          <Field
            label="업무관리 시트"
            value={
              r.workSheetUrl ? (
                <a
                  href={r.workSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  링크 열기 ↗
                </a>
              ) : (
                "-"
              )
            }
          />
        </dl>
      </Card>

      {/* 원가/공급가 계산표 */}
      <Card title="원가 / 공급가 계산표">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              <Row label="제작 수량" value={formatInt(r.quantity)} />
              <Row label="공장 단가" value={formatMoney(r.factoryUnitPrice, r.currency)} />
              <Row label="공장 총액 (수량 × 공장 단가)" value={formatMoney(r.factoryTotalPrice, r.currency)} />
              <Row label="샘플비" value={formatMoney(r.sampleFee, r.currency)} />
              <Row label="기타 비용" value={formatMoney(r.extraCost, r.currency)} />
              <Row label="최종 원가 (공장총액 + 샘플비 + 기타비용)" value={formatMoney(r.finalCost, r.currency)} strong />
              <Row label="고객사 공급 단가" value={formatMoney(r.supplyUnitPrice, r.currency)} />
              <Row label="공급 총액 (수량 × 공급 단가)" value={formatMoney(r.supplyTotalPrice, r.currency)} />
              <Row label="마진 금액 (공급총액 − 최종원가)" value={formatMoney(r.marginAmount, r.currency)} strong />
              <tr>
                <td className="py-2 pr-4 text-gray-600">마진율</td>
                <td className="py-2 text-right">
                  <MarginBadge rate={r.marginRate} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* 제작 사양 */}
      <Card title="제작 사양">
        <p className="whitespace-pre-wrap text-sm text-gray-800">{r.specText}</p>
        {r.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {r.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        )}
      </Card>

      {/* 메모 */}
      {r.memo && (
        <Card title="메모">
          <p className="whitespace-pre-wrap text-sm text-gray-800">{r.memo}</p>
        </Card>
      )}

      {/* 첨부파일 */}
      <Card title={`첨부파일 (${r.attachments?.length ?? 0})`}>
        <AttachmentsPanel recordId={r.id} initial={r.attachments ?? []} />
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value}</dd>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <tr>
      <td className="py-2 pr-4 text-gray-600">{label}</td>
      <td className={"py-2 text-right tabular-nums " + (strong ? "font-bold text-gray-900" : "text-gray-800")}>
        {value}
      </td>
    </tr>
  );
}
