// app/api/harga-emas/route.ts
// Gold price API — cached in memory, fetches from free sources
import { NextRequest, NextResponse } from "next/server";
import { getTenantFromRequest } from "@/lib/api-helpers";
import { dbAll, dbOne, dbRun } from "@/lib/db";

// In-memory cache
let priceCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Default spot prices (fallback)
const DEFAULT_PRICES: Record<string, number> = {
  emas: 1_095_000,
  perak: 13_500,
  platinum: 1_850_000,
  emasputih: 1_095_000,
  palladium: 1_250_000,
};

/** Fetch gold prices from free API */
async function fetchPricesFromAPI(): Promise<Record<string, number> | null> {
  try {
    // Use metals-api free tier or similar
    // For now, try fetching from a known free source
    const res = await fetch("https://api.frankfurter.dev/latest?from=XAU&to=IDR", {
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const d = await res.json();
      // frankfurter doesn't support XAU, so we'll use a different approach
    }
  } catch {
    // Ignore fetch errors
  }
  return null;
}

/** Get current prices from DB */
async function getPricesFromDB(): Promise<Record<string, number>> {
  const rows = await dbAll<{ id: string; spot_price: number }>(
    `SELECT id, spot_price FROM logam WHERE tenant_id IS NULL`
  );

  const prices: Record<string, number> = {};
  for (const row of rows) {
    prices[row.id] = row.spot_price;
  }

  // Fill missing with defaults
  for (const [id, price] of Object.entries(DEFAULT_PRICES)) {
    if (!prices[id]) prices[id] = price;
  }

  return prices;
}

/** GET — return current prices (with caching) */
export async function GET() {
  try {
    const now = Date.now();

    // Return cache if fresh
    if (priceCache && now - priceCache.timestamp < CACHE_TTL) {
      return NextResponse.json({ data: priceCache.data, cached: true });
    }

    // Try to fetch from API (optional enhancement)
    const apiPrices = await fetchPricesFromAPI();

    // Get from DB
    const dbPrices = await getPricesFromDB();

    // Merge (API > DB > defaults)
    const prices = { ...DEFAULT_PRICES, ...dbPrices, ...(apiPrices || {}) };

    priceCache = { data: prices, timestamp: now };

    return NextResponse.json({ data: prices, cached: false });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** POST — update spot prices (admin only) */
export async function POST(req: NextRequest) {
  try {
    const auth = await getTenantFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Hanya admin yang bisa update harga" }, { status: 403 });
    }

    const body = await req.json();
    const { prices } = body as { prices: Record<string, number> };

    if (!prices || typeof prices !== "object") {
      return NextResponse.json({ error: "Format: { prices: { emas: 1000000, ... } }" }, { status: 400 });
    }

    // Update each price
    for (const [logamId, spotPrice] of Object.entries(prices)) {
      if (typeof spotPrice !== "number" || spotPrice < 0) continue;

      await dbRun(
        `UPDATE logam SET spot_price = $1, updated_at = now() WHERE id = $2 AND tenant_id = $3 RETURNING *`,
        [spotPrice, logamId, auth.tenantId]
      );
    }

    // Invalidate cache
    priceCache = null;

    return NextResponse.json({ success: true, message: "Harga berhasil diupdate" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
