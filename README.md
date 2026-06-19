# POS Toko Perhiasan — Zomet

Point of Sale multi-logam untuk toko perhiasan: **Emas, Perak, Platinum, Emas Putih, Palladium**.
Stack: Next.js 14 (App Router) + PostgreSQL + Tailwind CSS.

## Fitur

- **Jual** — pilih logam, kadar, jenis produk, berat, ongkos cetak, jumlah, diskon. Total & kembalian otomatis.
- **Buyback** — kalkulasi harga beli toko (rasio per logam × kadar × berat × faktor kondisi), pencatatan identitas penjual.
- **Riwayat** — rekap transaksi harian (total jual & buyback).
- **Harga spot** per logam bisa di-update harian langsung di header.
- **Logam Mulia** (khusus emas) dengan pilihan berat batangan & tanpa ongkos cetak.
- **Transaksi tersimpan ke database** PostgreSQL.

## Setup

```bash
npm install
cp .env.local.example .env.local   # isi DATABASE_URL
npm run dev
```

## Database (PostgreSQL)

1. Buat database PostgreSQL (lokal, Railway, Neon, dst).
2. Jalankan `migrations/001_schema.sql` di SQL editor.
3. Isi `DATABASE_URL` di `.env.local`.

Schema mencakup: master `logam`, `kadar`, stok `produk`, `transaksi`, view `rekap_harian`.

## Struktur

```
app/
  layout.tsx          # root + Tabler Icons CDN
  page.tsx
  globals.css
  api/
    transaksi/route.ts   # CRUD transaksi
    logam/route.ts       # data logam + spot price
    health/route.ts      # health check
components/
  PosPerhiasan.tsx    # state utama + spot bar + navigasi mode
  PanelJual.tsx
  PanelBuyback.tsx
  PanelRiwayat.tsx
lib/
  logam.ts            # konfigurasi logam + fungsi kalkulasi
  db.ts               # PostgreSQL connection pool
  transaksi.ts        # query transaksi
migrations/
  001_schema.sql      # database schema
```

## Logika Harga

**Jual:** `(spot × kadar × berat + ongkos_cetak) × jumlah − diskon`

**Buyback:** `spot × buyback_ratio × kadar × berat × faktor_kondisi`

Rasio buyback per logam (default): Emas 95%, Platinum 92%, Palladium 91%, Emas Putih 90%, Perak 88%.

## TODO

- Auth kasir.
- Cetak struk thermal (ESC/POS) atau PDF.
- Auto-fetch harga emas harian (mis. API Antam).
- Manajemen stok produk dari tabel `produk`.
- Laporan bulanan + grafik (Recharts).
