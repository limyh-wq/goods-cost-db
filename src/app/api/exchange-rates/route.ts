import { getExchangeRate } from "@/lib/exchange-rate";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const fromCurrency = request.nextUrl.searchParams.get("from")?.toUpperCase();
  const toCurrency = request.nextUrl.searchParams.get("to")?.toUpperCase() || "KRW";

  if (!fromCurrency) {
    return NextResponse.json({ error: "from currency required" }, { status: 400 });
  }

  if (toCurrency !== "KRW") {
    return NextResponse.json(
      { error: "only KRW target is supported" },
      { status: 400 },
    );
  }

  try {
    const rate = await getExchangeRate(fromCurrency);
    if (rate === null) {
      console.error(`[exchange-rate] Failed to fetch rate for ${fromCurrency}`);
      return NextResponse.json({ error: "exchange rate fetch failed" }, { status: 500 });
    }

    return NextResponse.json({
      from: fromCurrency,
      to: toCurrency,
      rate,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[exchange-rate] Error:", error);
    return NextResponse.json({ error: "exchange rate fetch failed" }, { status: 500 });
  }
}
