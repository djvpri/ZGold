// app/api/laporan/route.ts
// Sales report API — aggregated by date and logam
import { NextRequest, NextResponse } from "next/server";
import { getTenantFromRequest } from "@/lib/api-helpers";
import { dbAll, dbOne } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const auth = await getTenantFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";

    const today = new Date();
    let fromDate: string;
    let toDate: string;

    if (from && to) {
      fromDate = from;
      toDate = to;
    } else {
      // Default: last 30 days
      const d = new Date(today);
      d.setDate(d.getDate() - 30);
      fromDate = d.toISOString().slice(0, 10);
      toDate = today.toISOString().slice(0, 10);
    }

    // Summary totals
    const summary = await dbOne<{
      total_jual: number;
      total_buyback: number;
      jumlah_transaksi: number;
      avg_transaksi: number;
    }>(
      `SELECT
         COALESCE(SUM(CASE WHEN tipe = 'jual' THEN total ELSE 0 END), 0) as total_jual,
         COALESCE(SUM(CASE WHEN tipe = 'buyback' THEN total ELSE 0 END), 0) as total_buyback,
         COUNT(*) as jumlah_transaksi,
         COALESCE(ROUND(AVG(total)), 0) as avg_transaksi
       FROM transaksi
       WHERE tenant_id = $1 AND created_at::date BETWEEN $2 AND $3`,
      [auth.tenantId, fromDate, toDate]
    );

    // Breakdown by logam
    const byLogam = await dbAll<{
      logam_id: string;
      logam_nama: string;
      total_jual: number;
      total_buyback: number;
      jumlah: number;
    }>(
      `SELECT
         t.logam_id,
         COALESCE(l.nama, t.logam_id) as logam_nama,
         COALESCE(SUM(CASE WHEN t.tipe = 'jual' THEN t.total ELSE 0 END), 0) as total_jual,
         COALESCE(SUM(CASE WHEN t.tipe = 'buyback' THEN t.total ELSE 0 END), 0) as total_buyback,
         COUNT(*) as jumlah
       FROM transaksi t
       LEFT JOIN logam l ON t.logam_id = l.id AND l.tenant_id = t.tenant_id
       WHERE t.tenant_id = $1 AND t.created_at::date BETWEEN $2 AND $3
       GROUP BY t.logam_id, l.nama
       ORDER BY total_jual DESC`,
      [auth.tenantId, fromDate, toDate]
    );

    // Daily breakdown
    const daily = await dbAll<{
      tanggal: string;
      total_jual: number;
      total_buyback: number;
      jumlah: number;
    }>(
      `SELECT
         created_at::date as tanggal,
         COALESCE(SUM(CASE WHEN tipe = 'jual' THEN total ELSE 0 END), 0) as total_jual,
         COALESCE(SUM(CASE WHEN tipe = 'buyback' THEN total ELSE 0 END), 0) as total_buyback,
         COUNT(*) as jumlah
       FROM transaksi
       WHERE tenant_id = $1 AND created_at::date BETWEEN $2 AND $3
       GROUP BY created_at::date
       ORDER BY created_at::date DESC`,
      [auth.tenantId, fromDate, toDate]
    );

    return NextResponse.json({
      summary: summary ?? {
        total_jual: 0,
        total_buyback: 0,
        jumlah_transaksi: 0,
        avg_transaksi: 0,
      },
      byLogam,
      daily,
      range: { from: fromDate, to: toDate },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
