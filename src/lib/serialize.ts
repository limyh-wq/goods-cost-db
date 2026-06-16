import type { Attachment, ProductionRecord } from "@prisma/client";

/**
 * Prisma 의 Decimal/Date 는 클라이언트 컴포넌트로 그대로 넘길 수 없으므로
 * number/string(ISO) 로 변환한다. (직렬화 단일 출처)
 */

export interface SerializedRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  projectName: string;
  productName: string;
  category: string;
  code: string | null;
  clientName: string | null;
  workSheetUrl: string | null;
  quantity: number;
  factoryName: string;
  currency: string;
  factoryUnitPrice: number;
  exchangeRate: number | null;
  factoryTotalPrice: number;
  sampleFee: number;
  extraCost: number;
  factoryUnitPriceCurrency: string;
  factoryUnitPriceRate: number | null;
  sampleFeeCurrency: string;
  sampleFeeRate: number | null;
  extraCostCurrency: string;
  extraCostRate: number | null;
  finalCost: number;
  supplyUnitPrice: number;
  sampleSupplyUnitPrice: number;
  supplyTotalPrice: number;
  marginAmount: number;
  marginRate: number | null;
  specText: string;
  tags: string[];
  memo: string | null;
  attachmentCount?: number;
  attachments?: SerializedAttachment[];
}

export interface SerializedAttachment {
  id: string;
  productionRecordId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileMemo: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  uploadedAt: string;
}

type RecordWith = ProductionRecord & {
  attachments?: Attachment[];
  _count?: { attachments: number };
};

export function serializeRecord(record: RecordWith): SerializedRecord {
  return {
    id: record.id,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    projectName: record.projectName,
    productName: record.productName,
    category: record.category,
    code: record.code,
    clientName: record.clientName,
    workSheetUrl: record.workSheetUrl,
    quantity: record.quantity,
    factoryName: record.factoryName,
    currency: record.currency,
    factoryUnitPrice: Number(record.factoryUnitPrice),
    exchangeRate: record.exchangeRate === null ? null : Number(record.exchangeRate),
    factoryTotalPrice: Number(record.factoryTotalPrice),
    sampleFee: Number(record.sampleFee),
    extraCost: Number(record.extraCost),
    factoryUnitPriceCurrency: record.factoryUnitPriceCurrency,
    factoryUnitPriceRate: record.factoryUnitPriceRate === null ? null : Number(record.factoryUnitPriceRate),
    sampleFeeCurrency: record.sampleFeeCurrency,
    sampleFeeRate: record.sampleFeeRate === null ? null : Number(record.sampleFeeRate),
    extraCostCurrency: record.extraCostCurrency,
    extraCostRate: record.extraCostRate === null ? null : Number(record.extraCostRate),
    finalCost: Number(record.finalCost),
    supplyUnitPrice: Number(record.supplyUnitPrice),
    sampleSupplyUnitPrice: Number(record.sampleSupplyUnitPrice),
    supplyTotalPrice: Number(record.supplyTotalPrice),
    marginAmount: Number(record.marginAmount),
    marginRate: record.marginRate === null ? null : Number(record.marginRate),
    specText: record.specText,
    tags: record.tags,
    memo: record.memo,
    attachmentCount: record._count?.attachments,
    attachments: record.attachments?.map(serializeAttachment),
  };
}

export function serializeAttachment(a: Attachment): SerializedAttachment {
  return {
    id: a.id,
    productionRecordId: a.productionRecordId,
    fileName: a.fileName,
    fileUrl: a.fileUrl,
    fileType: a.fileType,
    fileMemo: a.fileMemo,
    mimeType: a.mimeType,
    sizeBytes: a.sizeBytes,
    uploadedAt: a.uploadedAt.toISOString(),
  };
}
