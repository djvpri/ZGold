// lib/produk.ts
// Query produk/manajemen stok (tenant-isolated)
import { dbAll, dbOne, dbRun } from "./db";

// ---------- Tipe baris produk ----------
export interface ProdukRow {
  id?: number;
  kode: string;
  logam_id: string;
  tenant_id?: string | number;
  kadar_id: number | null;
  jenis: string;
  nama: string;
  berat_gram: number;
  ongkos_cetak: number;
  stok: number;
  foto_url: string | null;
  created_at?: string;
}

// ---------- Tipe untuk riwayat stok ----------
export interface StokLogRow {
  id?: number;
  produk_id: number;
  tipe: "masuk" | "keluar" | "penyesuaian";
  jumlah: number;
  keterangan: string | null;
  created_at?: string;
}

// ---------- CRUD Produk (tenant-isolated) ----------

/** Ambil semua produk */
export async function ambilSemuaProduk(tenantId?: string | number): Promise<ProdukRow[]> {
  if (tenantId) {
    return dbAll<ProdukRow>(
      `SELECT * FROM produk WHERE tenant_id = $1 ORDER BY logam_id, nama`,
      [tenantId]
    );
  }
  return dbAll<ProdukRow>(
    `SELECT * FROM produk ORDER BY logam_id, nama`
  );
}

/** Ambil produk berdasarkan ID */
export async function ambilProdukById(id: number): Promise<ProdukRow | null> {
  return dbOne<ProdukRow>(
    `SELECT * FROM produk WHERE id = $1`,
    [id]
  );
}

/** Ambil produk berdasarkan kode */
export async function ambilProdukByKode(kode: string, tenantId?: string | number): Promise<ProdukRow | null> {
  if (tenantId) {
    return dbOne<ProdukRow>(
      `SELECT * FROM produk WHERE kode = $1 AND tenant_id = $2`,
      [kode, tenantId]
    );
  }
  return dbOne<ProdukRow>(
    `SELECT * FROM produk WHERE kode = $1`,
    [kode]
  );
}

/** Tambah produk baru */
export async function tambahProduk(row: Omit<ProdukRow, "id" | "created_at">): Promise<ProdukRow> {
  const result = await dbRun<ProdukRow>(
    `INSERT INTO produk (kode, logam_id, tenant_id, kadar_id, jenis, nama, berat_gram, ongkos_cetak, stok, foto_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      row.kode, row.logam_id, row.tenant_id ?? null, row.kadar_id, row.jenis, row.nama,
      row.berat_gram, row.ongkos_cetak, row.stok, row.foto_url
    ]
  );
  return result!;
}

/** Update produk */
export async function updateProduk(id: number, row: Partial<Omit<ProdukRow, "id" | "created_at">>): Promise<ProdukRow | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(row)) {
    if (value !== undefined) {
      fields.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }
  }

  if (fields.length === 0) return null;

  values.push(id);
  return dbOne<ProdukRow>(
    `UPDATE produk SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
    values
  );
}

/** Hapus produk */
export async function hapusProduk(id: number): Promise<boolean> {
  const result = await dbRun(
    `DELETE FROM produk WHERE id = $1`,
    [id]
  );
  return result !== null;
}

// ---------- Manajemen Stok ----------

/** Update stok produk (tambah/kurang) dengan logging */
export async function updateStok(
  produkId: number,
  jumlah: number,
  tipe: "masuk" | "keluar" | "penyesuaian",
  keterangan?: string
): Promise<ProdukRow | null> {
  try {
    // Gunakan function database untuk update stok dengan logging
    await dbRun(
      `SELECT update_stok_dengan_log($1, $2, $3, $4)`,
      [produkId, jumlah, tipe, keterangan || null]
    );

    // Ambil produk yang sudah diupdate
    return await ambilProdukById(produkId);
  } catch (error: any) {
    throw new Error(`Gagal update stok: ${error.message}`);
  }
}

/** Ambil riwayat stok */
export async function ambilRiwayatStok(produkId: number): Promise<StokLogRow[]> {
  return dbAll<StokLogRow>(
    `SELECT * FROM log_stok 
     WHERE produk_id = $1 
     ORDER BY created_at DESC`,
    [produkId]
  );
}

/** Cari produk */
export async function cariProduk(query: string, tenantId?: string | number): Promise<ProdukRow[]> {
  if (tenantId) {
    return dbAll<ProdukRow>(
      `SELECT * FROM produk 
       WHERE (kode ILIKE $1 OR nama ILIKE $1 OR jenis ILIKE $1) AND tenant_id = $2
       ORDER BY logam_id, nama`,
      [`%${query}%`, tenantId]
    );
  }
  return dbAll<ProdukRow>(
    `SELECT * FROM produk 
     WHERE kode ILIKE $1 OR nama ILIKE $1 OR jenis ILIKE $1
     ORDER BY logam_id, nama`,
    [`%${query}%`]
  );
}

/** Ambil produk berdasarkan logam */
export async function ambilProdukByLogam(logamId: string, tenantId?: string | number): Promise<ProdukRow[]> {
  if (tenantId) {
    return dbAll<ProdukRow>(
      `SELECT * FROM produk 
       WHERE logam_id = $1 AND tenant_id = $2
       ORDER BY nama`,
      [logamId, tenantId]
    );
  }
  return dbAll<ProdukRow>(
    `SELECT * FROM produk 
     WHERE logam_id = $1 
     ORDER BY nama`,
    [logamId]
  );
}

/** Ambil ringkasan stok per logam */
export async function ambilRingkasanStok(tenantId?: string | number): Promise<any[]> {
  if (tenantId) {
    return dbAll(
      `SELECT 
         l.nama as logam_nama,
         l.id as logam_id,
         COUNT(p.id) as jumlah_produk,
         COALESCE(SUM(p.stok), 0) as total_stok,
         COALESCE(SUM(p.stok * p.berat_gram), 0) as total_berat
       FROM logam l
       LEFT JOIN produk p ON l.id = p.logam_id AND p.tenant_id = l.tenant_id
       WHERE l.tenant_id = $1
       GROUP BY l.id, l.nama
       ORDER BY l.nama`,
      [tenantId]
    );
  }
  return dbAll(
    `SELECT 
       l.nama as logam_nama,
       l.id as logam_id,
       COUNT(p.id) as jumlah_produk,
       COALESCE(SUM(p.stok), 0) as total_stok,
       COALESCE(SUM(p.stok * p.berat_gram), 0) as total_berat
     FROM logam l
     LEFT JOIN produk p ON l.id = p.logam_id
     WHERE l.tenant_id IS NULL
     GROUP BY l.id, l.nama
     ORDER BY l.nama`
  );
}