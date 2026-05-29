-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('FACTORY_QUOTE', 'CLIENT_SUPPLY_PRICE', 'INVOICE', 'STATEMENT', 'SPEC_FILE', 'WORK_REQUEST', 'SAMPLE_PHOTO', 'REVISION_GUIDE', 'DELIVERY_FILE', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('FACTORY_QUOTE', 'CLIENT_SUPPLY_PRICE', 'INVOICE', 'OTHER');

-- CreateTable
CREATE TABLE "production_records" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectName" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "clientName" TEXT,
    "workSheetUrl" TEXT,
    "quantity" INTEGER NOT NULL,
    "factoryName" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "factoryUnitPrice" DECIMAL(18,4) NOT NULL,
    "factoryTotalPrice" DECIMAL(18,4) NOT NULL,
    "sampleFee" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "extraCost" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "finalCost" DECIMAL(18,4) NOT NULL,
    "supplyUnitPrice" DECIMAL(18,4) NOT NULL,
    "supplyTotalPrice" DECIMAL(18,4) NOT NULL,
    "marginAmount" DECIMAL(18,4) NOT NULL,
    "marginRate" DECIMAL(9,4),
    "specText" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "memo" TEXT,

    CONSTRAINT "production_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "productionRecordId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileType" "AttachmentType" NOT NULL DEFAULT 'OTHER',
    "fileMemo" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "excel_mappings" (
    "id" TEXT NOT NULL,
    "factoryName" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "mappingName" TEXT NOT NULL,
    "columnMappings" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "excel_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "production_records_category_idx" ON "production_records"("category");

-- CreateIndex
CREATE INDEX "production_records_factoryName_idx" ON "production_records"("factoryName");

-- CreateIndex
CREATE INDEX "production_records_clientName_idx" ON "production_records"("clientName");

-- CreateIndex
CREATE INDEX "production_records_currency_idx" ON "production_records"("currency");

-- CreateIndex
CREATE INDEX "production_records_createdAt_idx" ON "production_records"("createdAt");

-- CreateIndex
CREATE INDEX "production_records_marginRate_idx" ON "production_records"("marginRate");

-- CreateIndex
CREATE INDEX "production_records_tags_idx" ON "production_records" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "attachments_productionRecordId_idx" ON "attachments"("productionRecordId");

-- CreateIndex
CREATE INDEX "excel_mappings_factoryName_documentType_idx" ON "excel_mappings"("factoryName", "documentType");

-- CreateIndex
CREATE UNIQUE INDEX "excel_mappings_factoryName_documentType_mappingName_key" ON "excel_mappings"("factoryName", "documentType", "mappingName");

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_productionRecordId_fkey" FOREIGN KEY ("productionRecordId") REFERENCES "production_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
