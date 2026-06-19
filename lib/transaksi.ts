// lib/transaksi.ts
// Query transaksi — menggantikan Supabase client.
import { dbAll, dbOne, dbRun } from "./db";

// ---------- Tipe baris transaksi ----------
export interface TransaksiRow {
  id?: number;
  no_transaksi: string;
  tipe: "jual" | "buyback";
  logam_id: string;
  kadar_label: string | null;
  jenis_produk: string | null;
  nama_pihak: string | null;
  kontak: string | null;
  berat_gram: number;
  jumlah: number;
  harga_per_gram: number;
  ongkos_cetak: number;
  kondisi: number;
  diskon: number;
  total: number;
  bayar: number;
  kembalian: number;
  created_at?: string;
}

/** Simpan transaksi baru */
export async function simpanTransaksi(row: TransaksiRow) {
  const result = await dbRun<TransaksiRow>(
    `INSERT INTO transaksi
      (no_transaksi, tipe, logam_id, kadar_label, jenis_produk, nama_pihak, kontak,
       berat_gram, jumlah, harga_per_gram, ongkos_cetak, kondisi, diskon, total, bayar, kembalian)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING *`,
    [
      row.no_transaksi, row.tipe, row.logam_id, row.kadar_label, row.jenis_produk,
      row.nama_pihak, row.kontak, row.berat_gram, row.jumlah, row.harga_per_gram,
      row.ongkos_cetak, row.kondisi, row.diskon, row.total, row.bayar, row.kembalian,
    ]
  );
  return result;
}

/** Ambil riwayat transaksi hari ini */
export async function ambilRiwayatHariIni(): Promise<TransaksiRow[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dbAll<TransaksiRow>(
    `SELECT * FROM transaksi
     WHERE created_at >= $1
     ORDER BY created_at DESC`,
    [today.toISOString()]
  );
}

/** Generate nomor transaksi berikutnya */
export async function nomorTransaksiBerikutnya(tipe: "jual" | "buyback"): Promise<string> {
  const prefix = tipe === "jual" ? "TRX" : "BB";
  const row = await dbOne<{ cnt: number }>(
    `SELECT COUNT(*)::int AS cnt FROM transaksi WHERE tipe = $1`,
    [tipe]
  );
  return prefix + String((row?.cnt ?? 0) + 1).padStart(4, "0");
}

/** Ambil rekap harian */
export async function ambilRekapHarian() {
  return dbAll(
    `SELECT * FROM rekap_harian ORDER BY tanggal DESC, tipe`
  );
}

/** Update spot price logam */
export async function updateSpotPrice(logamId: string, spotPrice: number) {
  return dbRun(
    `UPDATE logam SET spot_price = $1, updated_at = now() WHERE id = $2 RETURNING *`,
    [spotPrice, logamId]
  );
}

/** Ambil semua logam + kadar */
export async function ambilLogam() {
  const logam = await dbAll(`SELECT * FROM logam ORDER BY id`);
  const kadar = await dbAll(`SELECT * FROM kadar ORDER BY logam_id, urutan`);
  return { logam, kadar };
}
