import { Suspense } from "react";
import { getFilterOptions, listRecords, type RecordQuery } from "@/lib/records";
import { serializeRecord } from "@/lib/serialize";
import { RecordsToolbar } from "@/components/records/records-toolbar";
import { RecordsTable } from "@/components/records/records-table";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

function toQuery(sp: SP): RecordQuery {
  const one = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;
  return {
    q: one(sp.q),
    category: one(sp.category),
    factoryName: one(sp.factoryName),
    clientName: one(sp.clientName),
    currency: one(sp.currency),
    tag: one(sp.tag),
    marginMin: one(sp.marginMin),
    marginMax: one(sp.marginMax),
    qtyMin: one(sp.qtyMin),
    qtyMax: one(sp.qtyMax),
    sort: one(sp.sort),
    dir: one(sp.dir),
  };
}

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const query = toQuery(sp);

  const [records, options] = await Promise.all([
    listRecords(query),
    getFilterOptions(),
  ]);

  const serialized = records.map(serializeRecord);

  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <RecordsToolbar options={options} total={serialized.length} />
      </Suspense>
      <Suspense fallback={null}>
        <RecordsTable records={serialized} />
      </Suspense>
    </div>
  );
}
