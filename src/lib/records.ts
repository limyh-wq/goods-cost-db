import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calcRecord } from "@/lib/calc";
import type { RecordInput } from "@/lib/validation";

/** 목록 쿼리 파라미터 (URL searchParams 에서 파싱) */
export interface RecordQuery {
  q?: string; // 통합 검색어
  code?: string; // 제작건 코드
  category?: string;
  factoryName?: string;
  clientName?: string;
  currency?: string;
  tag?: string;
  marginMin?: string;
  marginMax?: string;
  qtyMin?: string;
  qtyMax?: string;
  sort?: string;
  dir?: string;
}

const SORTABLE: Record<string, keyof Prisma.ProductionRecordOrderByWithRelationInput> = {
  createdAt: "createdAt",
  quantity: "quantity",
  factoryUnitPrice: "factoryUnitPrice",
  supplyUnitPrice: "supplyUnitPrice",
  marginRate: "marginRate",
};

function parseNum(v?: string): number | undefined {
  if (v === undefined || v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function buildWhere(query: RecordQuery): Prisma.ProductionRecordWhereInput {
  const and: Prisma.ProductionRecordWhereInput[] = [];

  if (query.q && query.q.trim()) {
    const q = query.q.trim();
    const contains: Prisma.ProductionRecordWhereInput = {
      OR: [
        { projectName: { contains: q, mode: "insensitive" } },
        { productName: { contains: q, mode: "insensitive" } },
        { specText: { contains: q, mode: "insensitive" } },
        { memo: { contains: q, mode: "insensitive" } },
        { clientName: { contains: q, mode: "insensitive" } },
        { factoryName: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
        { tags: { has: q } },
      ],
    };
    and.push(contains);
  }

  if (query.code) and.push({ code: { equals: query.code, mode: "insensitive" } });
  if (query.category) and.push({ category: query.category });
  if (query.factoryName) and.push({ factoryName: query.factoryName });
  if (query.clientName) and.push({ clientName: query.clientName });
  if (query.currency) and.push({ currency: query.currency });
  if (query.tag) and.push({ tags: { has: query.tag } });

  const marginMin = parseNum(query.marginMin);
  const marginMax = parseNum(query.marginMax);
  if (marginMin !== undefined || marginMax !== undefined) {
    and.push({
      marginRate: {
        ...(marginMin !== undefined ? { gte: marginMin } : {}),
        ...(marginMax !== undefined ? { lte: marginMax } : {}),
      },
    });
  }

  const qtyMin = parseNum(query.qtyMin);
  const qtyMax = parseNum(query.qtyMax);
  if (qtyMin !== undefined || qtyMax !== undefined) {
    and.push({
      quantity: {
        ...(qtyMin !== undefined ? { gte: qtyMin } : {}),
        ...(qtyMax !== undefined ? { lte: qtyMax } : {}),
      },
    });
  }

  return and.length ? { AND: and } : {};
}

export function buildOrderBy(
  query: RecordQuery,
): Prisma.ProductionRecordOrderByWithRelationInput {
  const field = (query.sort && SORTABLE[query.sort]) || "createdAt";
  const dir: Prisma.SortOrder = query.dir === "asc" ? "asc" : "desc";
  return { [field]: dir };
}

/** 입력값 → DB 저장용 data (자동 계산값 병합). 생성·수정 공용. */
export function buildRecordData(input: RecordInput) {
  const factoryRate = input.factoryUnitPriceRate ?? input.exchangeRate ?? 1;
  const sampleRate = input.sampleFeeRate ?? 1;
  const extraRate = input.extraCostRate ?? 1;

  const calc = calcRecord({
    quantity: input.quantity,
    factoryUnitPrice: input.factoryUnitPrice,
    factoryRate,
    sampleFee: input.sampleFee,
    sampleRate,
    extraCost: input.extraCost,
    extraRate,
    supplyUnitPrice: input.supplyUnitPrice,
    sampleSupplyUnitPrice: input.sampleSupplyUnitPrice,
  });

  return {
    projectName: input.projectName,
    productName: input.productName,
    category: input.category,
    code: input.code,
    clientName: input.clientName,
    workSheetUrl: input.workSheetUrl,
    quantity: input.quantity,
    factoryName: input.factoryName,
    // 레거시/대표 통화·환율은 공장단가 기준으로 채움 (필터/정렬 호환)
    currency: input.factoryUnitPriceCurrency ?? input.currency,
    factoryUnitPrice: new Prisma.Decimal(input.factoryUnitPrice),
    exchangeRate: new Prisma.Decimal(factoryRate),
    factoryTotalPrice: new Prisma.Decimal(calc.factoryTotalPrice),
    sampleFee: new Prisma.Decimal(input.sampleFee),
    extraCost: new Prisma.Decimal(input.extraCost),
    // 필드별 통화/환율
    factoryUnitPriceCurrency: input.factoryUnitPriceCurrency,
    factoryUnitPriceRate: new Prisma.Decimal(factoryRate),
    sampleFeeCurrency: input.sampleFeeCurrency,
    sampleFeeRate: new Prisma.Decimal(sampleRate),
    extraCostCurrency: input.extraCostCurrency,
    extraCostRate: new Prisma.Decimal(extraRate),
    finalCost: new Prisma.Decimal(calc.finalCost),
    supplyUnitPrice: new Prisma.Decimal(input.supplyUnitPrice),
    sampleSupplyUnitPrice: new Prisma.Decimal(input.sampleSupplyUnitPrice),
    supplyTotalPrice: new Prisma.Decimal(calc.supplyTotalPrice),
    marginAmount: new Prisma.Decimal(calc.marginAmount),
    marginRate:
      calc.marginRate === null ? null : new Prisma.Decimal(calc.marginRate),
    specText: input.specText,
    tags: input.tags,
    memo: input.memo,
  } satisfies Prisma.ProductionRecordUncheckedCreateInput;
}

export async function listRecords(query: RecordQuery) {
  return prisma.productionRecord.findMany({
    where: buildWhere(query),
    orderBy: buildOrderBy(query),
    include: { _count: { select: { attachments: true } } },
  });
}

export async function getRecord(id: string) {
  return prisma.productionRecord.findUnique({
    where: { id },
    include: { attachments: { orderBy: { uploadedAt: "desc" } } },
  });
}

export async function createRecord(input: RecordInput) {
  return prisma.productionRecord.create({ data: buildRecordData(input) });
}

export async function updateRecord(id: string, input: RecordInput) {
  return prisma.productionRecord.update({
    where: { id },
    data: buildRecordData(input),
  });
}

export async function deleteRecord(id: string) {
  // 첨부는 onDelete: Cascade 로 함께 삭제됨 (파일 정리는 호출부에서 별도 처리)
  return prisma.productionRecord.delete({ where: { id } });
}

/** 필터 UI 용 distinct 옵션 목록 */
export async function getFilterOptions() {
  const records = await prisma.productionRecord.findMany({
    select: { category: true, factoryName: true, clientName: true, currency: true, tags: true },
  });
  const categories = new Set<string>();
  const factories = new Set<string>();
  const clients = new Set<string>();
  const currencies = new Set<string>();
  const tags = new Set<string>();
  for (const r of records) {
    if (r.category) categories.add(r.category);
    if (r.factoryName) factories.add(r.factoryName);
    if (r.clientName) clients.add(r.clientName);
    if (r.currency) currencies.add(r.currency);
    r.tags.forEach((t) => tags.add(t));
  }
  const sort = (s: Set<string>) => Array.from(s).sort((a, b) => a.localeCompare(b, "ko"));
  return {
    categories: sort(categories),
    factories: sort(factories),
    clients: sort(clients),
    currencies: sort(currencies),
    tags: sort(tags),
  };
}
