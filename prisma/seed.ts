import { PrismaClient, Prisma } from "@prisma/client";
import { calcRecord } from "../src/lib/calc";

const prisma = new PrismaClient();

const samples = [
  {
    projectName: "2024 봄 팬미팅 굿즈",
    productName: "아크릴 키링",
    category: "아크릴 키링",
    clientName: "A엔터테인먼트",
    quantity: 500,
    factoryName: "심천 A공장",
    currency: "RMB",
    factoryUnitPrice: 1.2,
    sampleFee: 200,
    extraCost: 50,
    supplyUnitPrice: 2.4,
    specText: "3T 아크릴 / 양면 인쇄 / 에폭시 / OPP 개별포장 / 볼체인 포함",
    tags: ["아크릴", "에폭시", "OPP", "볼체인"],
    memo: "재주문 가능성 높음",
  },
  {
    projectName: "여름 페스티벌 MD",
    productName: "홀로그램 스티커 세트",
    category: "스티커",
    clientName: "B기획",
    quantity: 1000,
    factoryName: "이우 B공장",
    currency: "RMB",
    factoryUnitPrice: 0.8,
    sampleFee: 100,
    extraCost: 0,
    supplyUnitPrice: 1.5,
    specText: "홀로그램 PET / 도무송 / 5종 1세트",
    tags: ["스티커", "홀로그램", "도무송"],
    memo: null,
  },
];

async function main() {
  for (const s of samples) {
    const calc = calcRecord(s);
    await prisma.productionRecord.create({
      data: {
        ...s,
        factoryUnitPrice: new Prisma.Decimal(s.factoryUnitPrice),
        factoryTotalPrice: new Prisma.Decimal(calc.factoryTotalPrice),
        sampleFee: new Prisma.Decimal(s.sampleFee),
        extraCost: new Prisma.Decimal(s.extraCost),
        finalCost: new Prisma.Decimal(calc.finalCost),
        supplyUnitPrice: new Prisma.Decimal(s.supplyUnitPrice),
        supplyTotalPrice: new Prisma.Decimal(calc.supplyTotalPrice),
        marginAmount: new Prisma.Decimal(calc.marginAmount),
        marginRate: calc.marginRate === null ? null : new Prisma.Decimal(calc.marginRate),
      },
    });
  }
  console.log(`Seeded ${samples.length} records.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
