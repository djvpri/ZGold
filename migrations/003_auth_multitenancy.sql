-- =============================================================
-- MIGRATION 003: Auth, Multi-Tenancy & Membership
-- =============================================================

-- ---------- TENANTS (Toko / Member) ----------
create table if not exists tenants (
  id            bigserial primary key,
  nama_toko     text not null,
  slug          text unique not null,
  owner_name    text,
  owner_email   text unique not null,
  owner_phone   text,
  alamat        text,
  logo_url      text,
  plan          text not null default 'free' check (plan in ('free','basic','pro','enterprise')),
  plan_expires  timestamptz,
  is_active     boolean not null default true,
  settings      jsonb default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------- USERS ----------
create table if not exists users (
  id            bigserial primary key,
  tenant_id     bigint references tenants(id) on delete cascade,
  email         text unique not null,
  password_hash text not null,
  nama          text not null,
  role          text not null default 'kasir' check (role in ('admin','kasir')),
  is_active     boolean not null default true,
  last_login    timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists idx_users_email on users (email);
create index if not exists idx_users_tenant on users (tenant_id);

-- ---------- SESSIONS (untuk auth) ----------
create table if not exists sessions (
  id            text primary key,
  user_id       bigint not null references users(id) on delete cascade,
  tenant_id     bigint not null references tenants(id) on delete cascade,
  expires_at    timestamptz not null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_sessions_user on sessions (user_id);
create index if not exists idx_sessions_expires on sessions (expires_at);

-- ---------- MEMBERSHIP PLANS ----------
create table if not exists plans (
  id            text primary key,
  nama          text not null,
  harga_bulan   bigint not null default 0,
  harga_tahun   bigint not null default 0,
  max_produk    int not null default 100,
  max_transaksi int not null default 500, -- per bulan
  fitur         jsonb default '[]',
  is_active     boolean not null default true,
  urutan        int not null default 0
);

-- Seed plans
insert into plans (id, nama, harga_bulan, harga_tahun, max_produk, max_transaksi, fitur, urutan) values
  ('free', 'Gratis', 0, 0, 50, 100, '["POS Jual","POS Buyback","Riwayat","Stok Dasar"]', 1),
  ('basic', 'Basic', 99000, 990000, 500, 2000, '["POS Jual","POS Buyback","Riwayat","Stok","Laporan","Cetak Struk"]', 2),
  ('pro', 'Pro', 249000, 2490000, 5000, 10000, '["Semua Fitur Basic","Multi Kasir","Auto Harga Emas","Export Excel","SMS Notifikasi"]', 3),
  ('enterprise', 'Enterprise', 499000, 4990000, -1, -1, '["Semua Fitur Pro","Custom Domain","API Access","Priority Support","White Label"]', 4)
on conflict (id) do nothing;

-- ---------- TENANT COUNTERS (untuk batas plan) ----------
create table if not exists tenant_counters (
  tenant_id     bigint not null references tenants(id) on delete cascade,
  bulan         text not null, -- format: YYYY-MM
  jumlah_transaksi int not null default 0,
  jumlah_produk int not null default 0,
  primary key (tenant_id, bulan)
);

-- ---------- ALTER EXISTING TABLES: tambah tenant_id ----------
--produk
alter table produk add column if not exists tenant_id bigint references tenants(id) on delete cascade;
create index if not exists idx_produk_tenant on produk (tenant_id);

--transaksi
alter table transaksi add column if not exists tenant_id bigint references tenants(id) on delete cascade;
create index if not exists idx_transaksi_tenant on transaksi (tenant_id);

--log_stok
alter table log_stok add column if not exists tenant_id bigint references tenants(id) on delete cascade;

--logam (spot price per tenant)
alter table logam add column if not exists tenant_id bigint references tenants(id) on delete cascade;
create index if not exists idx_logam_tenant on logam (tenant_id);