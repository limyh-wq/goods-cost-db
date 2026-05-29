-- AlterTable
ALTER TABLE "production_records" ADD COLUMN     "code" TEXT;

-- CreateIndex
CREATE INDEX "production_records_code_idx" ON "production_records"("code");
