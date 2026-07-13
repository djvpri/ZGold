-- 007_fix_no_transaksi_unique.sql
-- Nomor transaksi harus unik PER TENANT, bukan global.
--
-- Masalah: 001 mendefinisikan `no_transaksi text unique` (unik GLOBAL), lalu
-- 003 menambah tenant_id. Numbering per-tenant (COUNT+1) membuat dua tenant
-- sama-sama menghasilkan "TRX0001" -> bentrok constraint global
-- (transaksi_no_transaksi_key). Juga rawan reuse setelah hapus.

-- 1) Hapus unique global lama (nama default dari kolom `no_transaksi text unique`)
ALTER TABLE transaksi DROP CONSTRAINT IF EXISTS transaksi_no_transaksi_key;

-- 2) Unik per tenant: dua tenant boleh punya TRX0001 masing-masing.
--    Aman dibuat karena data lama tidak mungkin punya duplikat (tenant, no).
CREATE UNIQUE INDEX IF NOT EXISTS transaksi_tenant_no_uidx
  ON transaksi (tenant_id, no_transaksi);
