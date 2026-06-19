// app/api/logam/route.ts
// API endpoint untuk data logam + kadar
import { NextRequest, NextResponse } from "next/server";
import { ambilLogam, updateSpotPrice } from "@/lib/transaksi";

/** GET /api/logam — ambil semua logam + kadar */
export async function GET() {
  try {
    const data = await ambilLogam();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** PATCH /api/logam — update spot price */
export async function PATCH(req: NextRequest) {
  try {
    const { logam_id, spot_price } = await req.json();
    if (!logam_id || spot_price === undefined) {
      return NextResponse.json({ error: "logam_id & spot_price wajib" }, { status: 400 });
    }
    const result = await updateSpotPrice(logam_id, spot_price);
    return NextResponse.json({ data: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
