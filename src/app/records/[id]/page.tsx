import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecord } from "@/lib/records";
import { serializeRecord } from "@/lib/serialize";
import { formatDate, formatInt, formatKRW, formatNumber } from "@/lib/format";
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

  // 모든 금액을 등록 시점 환율 기준 원화(KRW)로 환산해 표시한다.
  // 공장단가/샘플비/기타비용은 각각 자기 통화·환율로 환산한다.
  const fRate = r.factoryUnitPriceRate ?? 1;
  const sRate = r.sampleFeeRate ?? 1;
  const eRate = r.extraCostRate ?? 1;
  const factoryUnitKRW = r.factoryUnitPrice * fRate;
  const sampleFeeKRW = r.sampleFee * sRate;
  const extraCostKRW = r.extraCost * eRate;
  const anyForeign = [r.factoryUnitPriceCurrency, r.sampleFeeCurrency, r.extraCostCurrency].some(
    (c) => c && c !== "KRW",
  );
  // 외화 원본값+환율 참고 표기 (예: "6.96 USD @1,513.37")
  const orig = (v: number, cur: string, rate: number) =>
    cur && cur !== "KRW" ? `${formatNumber(v)} ${cur} @${formatNumber(rate)}` : undefined;

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

      {/* 원가/공급가 계산표 — 모든 금액 원화(₩) 기준 */}
      <Card title="원가 / 공급가 계산표">
        {anyForeign && (
          <p className="text-xs text-gray-500">
            모든 금액은 등록 시점 환율 기준 원화로 표시됩니다. (외화 항목은 원본값 @환율 병기)
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              <Row label="제작 수량" value={formatInt(r.quantity)} />
              <Row label="공장 단가" value={formatKRW(factoryUnitKRW)} sub={orig(r.factoryUnitPrice, r.factoryUnitPriceCurrency, fRate)} />
              <Row label="공장 총액 (수량 × 공장 단가)" value={formatKRW(r.factoryTotalPrice)} />
              <Row label="샘플비" value={formatKRW(sampleFeeKRW)} sub={orig(r.sampleFee, r.sampleFeeCurrency, sRate)} />
              <Row label="기타 비용" value={formatKRW(extraCostKRW)} sub={orig(r.extraCost, r.extraCostCurrency, eRate)} />
              <Row label="최종 원가 (공장총액 + 샘플비 + 기타비용)" value={formatKRW(r.finalCost)} strong />
              <Row label="고객사 공급 단가" value={formatKRW(r.supplyUnitPrice)} />
              <Row label="공급 총액 (수량 × 공급 단가)" value={formatKRW(r.supplyTotalPrice)} />
              <Row label="마진 금액 (공급총액 − 최종원가)" value={formatKRW(r.marginAmount)} strong />
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
  sub,
}: {
  label: string;
  value: string;
  strong?: boolean;
  sub?: string;
}) {
  return (
    <tr>
      <td className="py-2 pr-4 text-gray-600">{label}</td>
      <td className={"py-2 text-right tabular-nums " + (strong ? "font-bold text-gray-900" : "text-gray-800")}>
        {value}
        {sub && <span className="ml-1 text-xs font-normal text-gray-400">({sub})</span>}
      </td>
    </tr>
  );
}
