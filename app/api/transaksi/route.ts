// app/api/transaksi/route.ts
// API endpoint untuk transaksi jual & buyback (tenant-isolated)
import { NextRequest, NextResponse } from "next/server";
import { simpanTransaksi, ambilRiwayatHariIni, nomorTransaksiBerikutnya } from "@/lib/transaksi";
import { getTenantFromRequest } from "@/lib/api-helpers";

/** GET /api/transaksi — ambil riwayat hari ini */
export async function GET(req: NextRequest) {
  try {
    const auth = await getTenantFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await ambilRiwayatHariIni(auth.tenantId);
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** POST /api/transaksi — simpan transaksi baru */
export async function POST(req: NextRequest) {
  try {
    const auth = await getTenantFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Plan limit check
    const { checkPlanLimit } = await import("@/lib/plan-enforcement");
    const limit = await checkPlanLimit(auth.tenantId, "transaksi");
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Plan ${limit.plan_name} limit reached (${limit.current}/${limit.max} transaksi/bulan). Upgrade needed.`, upgrade: true },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { tipe, logam_id, kadar_label, jenis_produk, nama_pihak, kontak,
            berat_gram, jumlah, harga_per_gram, ongkos_cetak, kondisi, diskon,
            total, bayar, kembalian } = body;

    if (!tipe || !logam_id || !total) {
      return NextResponse.json({ error: "Field wajib belum diisi" }, { status: 400 });
    }

    const base = {
      tipe,
      logam_id,
      tenant_id: auth.tenantId,
      kadar_label: kadar_label ?? null,
      jenis_produk: jenis_produk ?? null,
      nama_pihak: nama_pihak ?? null,
      kontak: kontak ?? null,
      berat_gram: berat_gram ?? 0,
      jumlah: jumlah ?? 1,
      harga_per_gram: harga_per_gram ?? 0,
      ongkos_cetak: ongkos_cetak ?? 0,
      kondisi: kondisi ?? 1.0,
      diskon: diskon ?? 0,
      total,
      bayar: bayar ?? 0,
      kembalian: kembalian ?? 0,
    };

    // Generate nomor + simpan dengan retry: kalau nomor bentrok (23505, mis. dua
    // kasir menyimpan bersamaan), regenerate nomor & coba lagi.
    let result = null;
    for (let attempt = 0; attempt < 6; attempt++) {
      const no_transaksi = await nomorTransaksiBerikutnya(tipe, auth.tenantId);
      try {
        result = await simpanTransaksi({ no_transaksi, ...base });
        break;
      } catch (e: any) {
        if (e?.code === "23505" && attempt < 5) continue; // unique_violation → retry
        throw e;
      }
    }

    return NextResponse.json({ data: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}