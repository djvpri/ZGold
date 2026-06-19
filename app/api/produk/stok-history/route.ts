// app/api/produk/stok-history/route.ts
// API endpoint untuk riwayat perubahan stok
import { NextRequest, NextResponse } from "next/server";
import { ambilRiwayatStok } from "@/lib/produk";

/** GET /api/produk/stok-history?produk_id=123 — ambil riwayat stok produk */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const produkId = parseInt(searchParams.get("produk_id") || "");

    if (!produkId) {
      return NextResponse.json(
        { error: "produk_id wajib" },
        { status: 400 }
      );
    }

    const data = await ambilRiwayatStok(produkId);
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}