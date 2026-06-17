# POS Toko Perhiasan — Zomet

Point of Sale multi-logam untuk toko perhiasan: **Emas, Perak, Platinum, Emas Putih, Palladium**.
Stack: Next.js 14 (App Router) + Supabase + Tailwind CSS.

## Fitur

- **Jual** — pilih logam, kadar, jenis produk, berat, ongkos cetak, jumlah, diskon. Total & kembalian otomatis.
- **Buyback** — kalkulasi harga beli toko (rasio per logam × kadar × berat × faktor kondisi), pencatatan identitas penjual.
- **Riwayat** — rekap transaksi harian (total jual & buyback).
- **Harga spot** per logam bisa di-update harian langsung di header.
- **Logam Mulia** (khusus emas) dengan pilihan berat batangan & tanpa ongkos cetak.

## Setup

```bash
npm install
cp .env.local.example .env.local   # isi kredensial Supabase
npm run dev
```

## Database (Supabase)

1. Buat project di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, jalankan isi `supabase/schema.sql`.
3. Salin `Project URL` dan `anon key` ke `.env.local`.

Schema mencakup: master `logam`, `kadar`, stok `produk`, `transaksi`, view `rekap_harian`, plus Row Level Security.

## Struktur

```
app/
  layout.tsx          # root + Tabler Icons CDN
  page.tsx
  globals.css
components/
  PosPerhiasan.tsx    # state utama + spot bar + navigasi mode
  PanelJual.tsx
  PanelBuyback.tsx
  PanelRiwayat.tsx
lib/
  logam.ts            # konfigurasi logam + fungsi kalkulasi
  supabase.ts         # client + helper transaksi
supabase/
  schema.sql
```

## Logika Harga

**Jual:** `(spot × kadar × berat + ongkos_cetak) × jumlah − diskon`

**Buyback:** `spot × buyback_ratio × kadar × berat × faktor_kondisi`

Rasio buyback per logam (default): Emas 95%, Platinum 92%, Palladium 91%, Emas Putih 90%, Perak 88%.

## Langkah Lanjutan (TODO)

- Sambungkan `onProses()` & `prosesBuyback()` ke `simpanTransaksi()` di `lib/supabase.ts`.
- Auth kasir via Supabase Auth (NextAuth opsional).
- Cetak struk thermal (ESC/POS) atau PDF.
- Auto-fetch harga emas harian (mis. scraping logammulia.com / API Antam).
- Manajemen stok produk dari tabel `produk`.
- Laporan bulanan + grafik (Recharts).
