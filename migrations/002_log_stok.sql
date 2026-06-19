-- =============================================================
-- MIGRATION: Tambah tabel log_stok untuk audit trail perubahan stok
-- Jalankan setelah 001_schema.sql
-- =============================================================

-- ---------- LOG PERUBAHAN STOK ----------
create table if not exists log_stok (
  id          bigserial primary key,
  produk_id   bigint not null references produk(id) on delete cascade,
  tipe        text not null check (tipe in ('masuk', 'keluar', 'penyesuaian')),
  jumlah      int not null,
  stok_sebelum int not null,
  stok_sesudah int not null,
  keterangan  text,
  created_at  timestamptz not null default now()
);

-- Index untuk query riwayat stok
create index if not exists idx_log_stok_produk on log_stok (produk_id);
create index if not exists idx_log_stok_tanggal on log_stok (created_at);

-- ---------- FUNCTION: Update stok dengan logging ----------
create or replace function update_stok_dengan_log(
  p_produk_id int,
  p_jumlah int,
  p_tipe text,
  p_keterangan text default null
) returns void as $$
declare
  v_stok_sebelum int;
  v_stok_sesudah int;
begin
  -- Ambil stok saat ini
  select stok into v_stok_sebelum
  from produk
  where id = p_produk_id
  for update;

  if not found then
    raise exception 'Produk dengan ID % tidak ditemukan', p_produk_id;
  end if;

  -- Hitung stok baru berdasarkan tipe
  case p_tipe
    when 'masuk' then
      v_stok_sesudah := v_stok_sebelum + p_jumlah;
    when 'keluar' then
      v_stok_sesudah := v_stok_sebelum - p_jumlah;
    when 'penyesuaian' then
      v_stok_sesudah := p_jumlah; -- langsung set ke jumlah baru
    else
      raise exception 'Tipe stok tidak valid: %', p_tipe;
  end case;

  -- Pastikan stok tidak negatif
  if v_stok_sesudah < 0 then
    raise exception 'Stok tidak mencukupi. Stok saat ini: %, diminta: %', v_stok_sebelum, p_jumlah;
  end if;

  -- Update stok produk
  update produk
  set stok = v_stok_sesudah
  where id = p_produk_id;

  -- Catat di log_stok
  insert into log_stok (produk_id, tipe, jumlah, stok_sebelum, stok_sesudah, keterangan)
  values (p_produk_id, p_tipe, p_jumlah, v_stok_sebelum, v_stok_sesudah, p_keterangan);
end;
$$ language plpgsql;

-- ---------- VIEW: Ringkasan stok per logam ----------
create or replace view ringkasan_stok as
select
  l.id as logam_id,
  l.nama as logam_nama,
  l.accent_color,
  count(p.id) as jumlah_produk,
  coalesce(sum(p.stok), 0) as total_stok,
  coalesce(sum(p.stok * p.berat_gram), 0) as total_berat,
  coalesce(sum(p.stok * p.berat_gram * l.spot_price), 0) as total_nilai
from logam l
left join produk p on l.id = p.logam_id
group by l.id, l.nama, l.accent_color, l.spot_price;