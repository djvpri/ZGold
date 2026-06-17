-- =============================================================
-- ZOMET POS PERHIASAN — Skema Database Supabase (PostgreSQL)
-- Jalankan di Supabase SQL Editor
-- =============================================================

-- ---------- ENUM ----------
create type tipe_transaksi as enum ('jual', 'buyback');

-- ---------- MASTER LOGAM ----------
-- Harga spot per gram disimpan & bisa di-update harian.
create table if not exists logam (
  id            text primary key,            -- emas, perak, platinum, emasputih, palladium
  nama          text not null,
  spot_price    bigint not null,             -- harga per gram (IDR)
  buyback_ratio numeric(4,3) not null default 0.95, -- rasio harga beli toko thd spot
  ongkos_default bigint not null default 0,
  accent_color  text,
  icon          text,
  updated_at    timestamptz not null default now()
);

-- ---------- KADAR per LOGAM ----------
create table if not exists kadar (
  id        bigserial primary key,
  logam_id  text not null references logam(id) on delete cascade,
  label     text not null,                   -- 24K, Sterling 925, Pt950, dst.
  nilai     numeric(4,3) not null,           -- 0.999, 0.925, dst.
  is_lm     boolean not null default false,
  urutan    int not null default 0
);

-- ---------- STOK PRODUK (opsional, untuk manajemen inventori) ----------
create table if not exists produk (
  id          bigserial primary key,
  kode        text unique,
  logam_id    text not null references logam(id),
  kadar_id    bigint references kadar(id),
  jenis       text not null,                 -- Kalung, Gelang, Cincin, dst.
  nama        text not null,
  berat_gram  numeric(8,2) not null,
  ongkos_cetak bigint not null default 0,
  stok        int not null default 1,
  foto_url    text,
  created_at  timestamptz not null default now()
);

-- ---------- TRANSAKSI ----------
create table if not exists transaksi (
  id            bigserial primary key,
  no_transaksi  text unique not null,        -- TRX0001, BB0001, dst.
  tipe          tipe_transaksi not null,
  logam_id      text not null references logam(id),
  kadar_label   text,
  jenis_produk  text,
  nama_pihak    text,                         -- pembeli / penjual
  kontak        text,                         -- HP/KTP utk buyback
  berat_gram    numeric(8,2) not null,
  jumlah        int not null default 1,
  harga_per_gram bigint not null,
  ongkos_cetak  bigint not null default 0,
  kondisi       numeric(4,3) default 1.0,     -- faktor kondisi (buyback)
  diskon        bigint not null default 0,
  total         bigint not null,
  bayar         bigint default 0,
  kembalian     bigint default 0,
  kasir_id      uuid references auth.users(id),
  created_at    timestamptz not null default now()
);

create index if not exists idx_transaksi_tanggal on transaksi (created_at);
create index if not exists idx_transaksi_tipe on transaksi (tipe);

-- ---------- VIEW: Rekap Harian ----------
create or replace view rekap_harian as
select
  date_trunc('day', created_at)::date as tanggal,
  tipe,
  count(*)         as jumlah_transaksi,
  sum(berat_gram)  as total_gram,
  sum(total)       as total_nilai
from transaksi
group by 1, 2
order by 1 desc, 2;

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
alter table transaksi enable row level security;
alter table produk    enable row level security;

create policy "auth read transaksi"  on transaksi for select using (auth.role() = 'authenticated');
create policy "auth write transaksi" on transaksi for insert with check (auth.role() = 'authenticated');
create policy "auth manage produk"   on produk    for all    using (auth.role() = 'authenticated');

-- Master data boleh dibaca semua user terautentikasi
alter table logam enable row level security;
alter table kadar enable row level security;
create policy "read logam" on logam for select using (true);
create policy "read kadar" on kadar for select using (true);

-- =============================================================
-- SEED DATA
-- =============================================================
insert into logam (id, nama, spot_price, buyback_ratio, ongkos_default, accent_color, icon) values
  ('emas',      'Emas (Gold)',      1095000, 0.95, 50000, '#B8860B', 'ti-diamond'),
  ('perak',     'Perak (Silver)',     13500, 0.88, 15000, '#708090', 'ti-coin'),
  ('platinum',  'Platinum',         1850000, 0.92, 75000, '#5B6675', 'ti-medal'),
  ('emasputih', 'Emas Putih',       1095000, 0.90, 80000, '#A9A9A9', 'ti-circle'),
  ('palladium', 'Palladium',        1250000, 0.91, 70000, '#7B68EE', 'ti-atom')
on conflict (id) do nothing;

insert into kadar (logam_id, label, nilai, is_lm, urutan) values
  ('emas','24K',0.999,false,1),('emas','22K',0.916,false,2),('emas','18K',0.75,false,3),
  ('emas','14K',0.585,false,4),('emas','LM',0.999,true,5),
  ('perak','999',0.999,false,1),('perak','Sterling 925',0.925,false,2),('perak','800',0.8,false,3),('perak','700',0.7,false,4),
  ('platinum','Pt950',0.95,false,1),('platinum','Pt900',0.9,false,2),('platinum','Pt850',0.85,false,3),
  ('emasputih','18K',0.75,false,1),('emasputih','14K',0.585,false,2),('emasputih','10K',0.417,false,3),
  ('palladium','Pd999',0.999,false,1),('palladium','Pd950',0.95,false,2),('palladium','Pd500',0.5,false,3)
on conflict do nothing;
