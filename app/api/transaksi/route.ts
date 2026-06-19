// app/api/transaksi/route.ts
// API endpoint untuk transaksi jual & buyback
import { NextRequest, NextResponse } from "next/server";
import { simpanTransaksi, ambilRiwayatHariIni, nomorTransaksiBerikutnya } from "@/lib/transaksi";

/** GET /api/transaksi — ambil riwayat hari ini */
export async function GET() {
  try {
    const data = await ambilRiwayatHariIni();
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** POST /api/transaksi — simpan transaksi baru */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tipe, logam_id, kadar_label, jenis_produk, nama_pihak, kontak,
            berat_gram, jumlah, harga_per_gram, ongkos_cetak, kondisi, diskon,
            total, bayar, kembalian } = body;

    if (!tipe || !logam_id || !total) {
      return NextResponse.json({ error: "Field wajib belum diisi" }, { status: 400 });
    }

    const no_transaksi = await nomorTransaksiBerikutnya(tipe);

    const result = await simpanTransaksi({
      no_transaksi,
      tipe,
      logam_id,
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
    });

    return NextResponse.json({ data: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
