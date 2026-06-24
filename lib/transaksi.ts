// lib/transaksi.ts
// Query transaksi — menggantikan Supabase client.
import { dbAll, dbOne, dbRun } from "./db";

// ---------- Tipe baris transaksi ----------
export interface TransaksiRow {
  id?: number;
  no_transaksi: string;
  tipe: "jual" | "buyback";
  logam_id: string;
  tenant_id?: number;
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

/** Simpan transaksi baru + update stok otomatis */
export async function simpanTransaksi(row: TransaksiRow) {
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
    const delta = row.tipe === 'jual' ? -(row.jumlah || 1) : (row.jumlah || 1)
    const tid = row.tenant_id ? String(row.tenant_id) : null
    const tenantClause = tid ? 'AND tenant_id = $3' : ''
    const params = tid
      ? [delta, row.jenis_produk, tid]
      : [delta, row.jenis_produk]
    await dbRun(
      `UPDATE produk SET stok = GREATEST(0, stok + $1), updated_at = now()
       WHERE nama ILIKE $2 ${tenantClause}`,
      params
    ).catch(() => {}) // tidak crash kalau produk tidak ditemukan
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
