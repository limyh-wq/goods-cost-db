/**
 * 환율 API 클라이언트 (exchangerate-api.com)
 * 공장 단가 통화 → KRW 환율을 가져옴
 *
 * 참고: RMB = CNY (중국 위안, 통화 코드 표준)
 */

// 메모리 캐시 (하루 단위)
const cache = new Map<string, { rate: number; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24시간

// 일부 통화는 API에서 다른 코드로 사용됨
const CURRENCY_MAPPING: Record<string, string> = {
  RMB: "CNY", // 중국 위안 (RMB는 구 코드)
};

export async function getExchangeRate(fromCurrency: string): Promise<number | null> {
  const normalized = fromCurrency.toUpperCase();

  if (normalized === "KRW") return 1; // KRW는 항상 1

  const API_KEY = process.env.EXCHANGE_RATE_API_KEY;
  const API_URL = process.env.EXCHANGE_RATE_API_URL || "https://api.exchangerate-api.com/v4/latest";

  if (!API_KEY) {
    console.warn("[exchange-rate] EXCHANGE_RATE_API_KEY not configured");
    return null;
  }

  const cacheKey = `${normalized}-KRW`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.rate;
  }

  // API에 전달할 통화 코드 (매핑 적용)
  const apiCurrency = CURRENCY_MAPPING[normalized] || normalized;

  try {
    const url = `${API_URL}/${apiCurrency}?apikey=${API_KEY}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.error(`[exchange-rate] API returned ${res.status} for ${apiCurrency} (requested: ${normalized})`);
      return null;
    }

    const data = await res.json() as { rates?: Record<string, number> };
    const rate = data.rates?.KRW;
    if (!rate) {
      console.error(`[exchange-rate] No KRW rate found in response for ${apiCurrency}`);
      return null;
    }

    cache.set(cacheKey, { rate, timestamp: Date.now() });
    return rate;
  } catch (error) {
    console.error(`[exchange-rate] Fetch error for ${apiCurrency}:`, error);
    return null;
  }
}
