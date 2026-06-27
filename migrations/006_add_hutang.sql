-- 006: Hutang / Piutang tracking
-- Tracks outstanding balances from transactions
-- where bayar < total (customer owes money)

create type status_hutang as enum ('aktif', 'lunas', 'dihapus');

create table if not exists hutang (
  id              bigserial primary key,
  tenant_id       bigint not null references tenants(id) on delete cascade,
  transaksi_id    bigint references transaksi(id) on delete set null,
  tipe            tipe_transaksi not null,  -- 'jual' = piutang (customer owes us), 'buyback' = hutang (we owe customer)
  nama_pihak      text not null,            -- customer/supplier name
  kontak          text,                      -- phone/email
  total           bigint not null,           -- original total
  dibayar         bigint not null default 0, -- amount already paid
  sisa            bigint not null,           -- outstanding balance
  status          status_hutang not null default 'aktif',
  jatuh_tempo     date,                      -- due date (optional)
  keterangan      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_hutang_tenant on hutang (tenant_id);
create index if not exists idx_hutang_status on hutang (tenant_id, status);
create index if not exists idx_hutang_pihak on hutang (tenant_id, nama_pihak);
