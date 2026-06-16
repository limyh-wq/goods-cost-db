-- 필드별 통화/환율 컬럼 추가 (공장단가·샘플비·기타비용 각각 독립 통화)
ALTER TABLE "production_records"
  ADD COLUMN "factoryUnitPriceCurrency" TEXT NOT NULL DEFAULT 'KRW',
  ADD COLUMN "factoryUnitPriceRate" DECIMAL(10,4) DEFAULT 1,
  ADD COLUMN "sampleFeeCurrency" TEXT NOT NULL DEFAULT 'KRW',
  ADD COLUMN "sampleFeeRate" DECIMAL(10,4) DEFAULT 1,
  ADD COLUMN "extraCostCurrency" TEXT NOT NULL DEFAULT 'KRW',
  ADD COLUMN "extraCostRate" DECIMAL(10,4) DEFAULT 1;

-- 기존 레코드: 단일 currency/exchangeRate 값을 세 필드에 그대로 복사 (표시 호환)
UPDATE "production_records" SET
  "factoryUnitPriceCurrency" = "currency",
  "factoryUnitPriceRate"     = COALESCE("exchangeRate", 1),
  "sampleFeeCurrency"        = "currency",
  "sampleFeeRate"            = COALESCE("exchangeRate", 1),
  "extraCostCurrency"        = "currency",
  "extraCostRate"            = COALESCE("exchangeRate", 1);
