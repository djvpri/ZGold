// lib/transaksi.ts
// Query transaksi — menggantikan Supabase client.
import { dbAll, dbOne, dbRun } from "./db";

// ---------- Tipe baris transaksi ----------
export interface TransaksiRow {
  id?: number;
  no_transaksi: string;
  tipe: "jual" | "buyback";
  logam_id: string;
  tenant_id?: string | number;
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

/** Cek stok cukup sebelum transaksi */
export async function cekStok(
  jenisProduk: string,
  jumlah: number,
  tenantId?: string | number
): Promise<{ cukup: boolean; stokSekarang: number; produk: string }> {
  if (!jenisProduk) return { cukup: true, stokSekarang: 0, produk: '' };
  const tid = tenantId ? String(tenantId) : null;
  const tenantClause = tid ? 'AND tenant_id = $2' : '';
  const params = tid ? [jenisProduk, tid] : [jenisProduk];
  const row = await dbOne<{ stok: number; nama: string }>(
    `SELECT stok, nama FROM produk WHERE nama ILIKE $1 ${tenantClause}`,
    params
  );
  if (!row) return { cukup: true, stokSekarang: 0, produk: jenisProduk };
  return { cukup: row.stok >= jumlah, stokSekarang: row.stok, produk: row.nama };
}

/** Simpan transaksi baru + update stok otomatis */
export async function simpanTransaksi(row: TransaksiRow) {
  // Cek stok dulu kalau jual
  if (row.tipe === 'jual' && row.jenis_produk) {
    const { cukup, stokSekarang, produk } = await cekStok(
      row.jenis_produk, row.jumlah || 1, row.tenant_id
    );
    if (!cukup) {
      throw new Error(`Stok ${produk} tidak cukup. Tersedia: ${stokSekarang}, diminta: ${row.jumlah || 1}`);
    }
  }

  const result = await dbRun<TransaksiRow>(
    `INSERT INTO transaksi
      (no_transaksi, tipe, logam_id, tenant_id, kadar_label, jenis_produk, nama_pihak, kontak,
       berat_gram, jumlah, harga_per_gram, ongkos_cetak, kondisi, diskon, total, bayar, kembalian)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
     RETURNING *`,
    [
      row.no_transaksi, row.tipe, row.logam_id, row.tenant_id ?? null, row.kadar_label, row.jenis_produk,
      row.nama_pihak, row.kontak, row.berat_gram, row.jumlah, row.harga_per_gram,
      row.ongkos_cetak, row.kondisi, row.diskon, row.total, row.bayar, row.kembalian,
    ]
  );

  // Update stok produk otomatis
  if (row.jenis_produk) {
    const delta = row.tipe === 'jual' ? -(row.jumlah || 1) : (row.jumlah || 1);
    const tid = row.tenant_id ? String(row.tenant_id) : null;
    const tenantClause = tid ? 'AND tenant_id = $3' : '';
    const params = tid
      ? [delta, row.jenis_produk, tid]
      : [delta, row.jenis_produk];
    const updateResult = await dbRun(
      `UPDATE produk SET stok = stok + $1
       WHERE nama ILIKE $2 ${tenantClause}
       RETURNING stok, nama`,
      params
    );
    // Log warning kalau produk tidak ditemukan (bukan error fatal)
    if (!updateResult) {
      console.warn(`[STOK] Produk "${row.jenis_produk}" tidak ditemukan saat update stok`);
    }
  }

  return result;
}

/** Ambil riwayat transaksi hari ini (filtered by tenant) */
export async function ambilRiwayatHariIni(tenantId?: string | number): Promise<TransaksiRow[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (tenantId) {
    return dbAll<TransaksiRow>(
      `SELECT * FROM transaksi
       WHERE created_at >= $1 AND tenant_id = $2
       ORDER BY created_at DESC`,
      [today.toISOString(), tenantId]
    );
  }
  return dbAll<TransaksiRow>(
    `SELECT * FROM transaksi
     WHERE created_at >= $1
     ORDER BY created_at DESC`,
    [today.toISOString()]
  );
}

/** Generate nomor transaksi berikutnya (tenant-aware) */
export async function nomorTransaksiBerikutnya(tipe: "jual" | "buyback", tenantId?: string | number): Promise<string> {
  const prefix = tipe === "jual" ? "TRX" : "BB";
  const row = await dbOne<{ cnt: number }>(
    `SELECT COUNT(*)::int AS cnt FROM transaksi WHERE tipe = $1 ${tenantId ? "AND tenant_id = $2" : ""}`,
    tenantId ? [tipe, tenantId] : [tipe]
  );
  return prefix + String((row?.cnt ?? 0) + 1).padStart(4, "0");
}

/** Ambil rekap harian */
export async function ambilRekapHarian() {
  return dbAll(
    `SELECT * FROM rekap_harian ORDER BY tanggal DESC, tipe`
  );
}

/** Update spot price logam (tenant-aware) */
export async function updateSpotPrice(logamId: string, spotPrice: number, tenantId?: string | number) {
  if (tenantId) {
    return dbRun(
      `UPDATE logam SET spot_price = $1, updated_at = now() WHERE id = $2 AND tenant_id = $3 RETURNING *`,
      [spotPrice, logamId, tenantId]
    );
  }
  return dbRun(
    `UPDATE logam SET spot_price = $1, updated_at = now() WHERE id = $2 AND tenant_id IS NULL RETURNING *`,
    [spotPrice, logamId]
  );
}

/** Ambil semua logam + kadar (tenant-aware) */
export async function ambilLogam(tenantId?: string | number) {
  if (tenantId) {
    const logam = await dbAll(`SELECT * FROM logam WHERE tenant_id = $1 ORDER BY id`, [tenantId]);
    const kadar = await dbAll(
      `SELECT k.* FROM kadar k 
       JOIN logam l ON k.logam_id = l.id 
       WHERE l.tenant_id = $1 
       ORDER BY k.logam_id, k.urutan`,
      [tenantId]
    );
    return { logam, kadar };
  }
  const logam = await dbAll(`SELECT * FROM logam WHERE tenant_id IS NULL ORDER BY id`);
  const kadar = await dbAll(`SELECT * FROM kadar ORDER BY logam_id, urutan`);
  return { logam, kadar };
}
