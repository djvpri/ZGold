// lib/auth.ts
// Auth helpers — session-based authentication
import { dbAll, dbOne, dbRun } from "./db";
import crypto from "crypto";

// ---------- Types ----------
export interface UserRow {
  id: number;
  tenant_id: string | number;
  email: string;
  password_hash: string;
  nama: string;
  role: "admin" | "kasir";
  is_active: boolean;
  last_login?: string;
  created_at?: string;
}

export interface TenantRow {
  id: number;
  nama_toko: string;
  slug: string;
  owner_name?: string;
  owner_email: string;
  owner_phone?: string;
  alamat?: string;
  logo_url?: string;
  plan: string;
  plan_expires?: string;
  is_active: boolean;
  settings?: any;
  created_at?: string;
}

export interface SessionRow {
  id: string;
  user_id: number;
  tenant_id: string | number;
  expires_at: string;
}

// ---------- Password Hashing ----------
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const verify = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return hash === verify;
}

// ---------- Session Management ----------
export async function createSession(userId: number, tenantId: number): Promise<string> {
  const sessionId = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await dbRun(
    `INSERT INTO sessions (id, user_id, tenant_id, expires_at) VALUES ($1, $2, $3, $4)`,
    [sessionId, userId, tenantId, expiresAt.toISOString()]
  );

  return sessionId;
}

export async function getSession(sessionId: string): Promise<(SessionRow & UserRow & TenantRow) | null> {
  const row = await dbOne<any>(
    `SELECT 
      s.id as session_id, s.expires_at,
      u.id as user_id, u.email, u.nama, u.role, u.tenant_id, u.is_active as user_active,
      t.id as tenant_id, t.nama_toko, t.slug, t.plan, t.is_active as tenant_active, t.settings
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    JOIN tenants t ON s.tenant_id = t.id
    WHERE s.id = $1 AND s.expires_at > now() AND u.is_active = true AND t.is_active = true`,
    [sessionId]
  );

  if (!row) return null;
  return row;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await dbRun(`DELETE FROM sessions WHERE id = $1`, [sessionId]);
}

export async function cleanupSessions(): Promise<void> {
  await dbRun(`DELETE FROM sessions WHERE expires_at < now()`);
}

// ---------- Tenant Management ----------
export async function createTenant(data: {
  nama_toko: string;
  slug: string;
  owner_name: string;
  owner_email: string;
  owner_phone?: string;
  password: string;
}): Promise<{ tenant: TenantRow; user: UserRow }> {
  // Mulai transaksi
  await dbRun("BEGIN");

  try {
    // Buat tenant
    const tenant = await dbOne<TenantRow>(
      `INSERT INTO tenants (nama_toko, slug, owner_name, owner_email, owner_phone)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.nama_toko, data.slug, data.owner_name, data.owner_email, data.owner_phone || null]
    );

    // Buat user admin
    const passwordHash = hashPassword(data.password);
    const user = await dbOne<UserRow>(
      `INSERT INTO users (tenant_id, email, password_hash, nama, role)
       VALUES ($1, $2, $3, $4, 'admin') RETURNING *`,
      [tenant!.id, data.owner_email, passwordHash, data.owner_name]
    );

    // Clone default logam + kadar untuk tenant
    await dbRun(
      `INSERT INTO logam (id, nama, spot_price, buyback_ratio, ongkos_default, accent_color, icon, tenant_id)
       SELECT id, nama, spot_price, buyback_ratio, ongkos_default, accent_color, icon, $1
       FROM logam WHERE tenant_id IS NULL`,
      [tenant!.id]
    );

    await dbRun(
      `INSERT INTO kadar (logam_id, label, nilai, is_lm, urutan)
       SELECT k.logam_id, k.label, k.nilai, k.is_lm, k.urutan
       FROM kadar k
       JOIN logam l ON k.logam_id = l.id
       WHERE l.tenant_id = $1`,
      [tenant!.id]
    );

    await dbRun(
      `INSERT INTO kadar (logam_id, label, nilai, is_lm, urutan)
       SELECT k.logam_id, k.label, k.nilai, k.is_lm, k.urutan
       FROM kadar k
       JOIN logam l ON k.logam_id = l.id
       WHERE l.tenant_id = $1`,
      [tenant!.id]
    );

    // Seed contoh produk untuk tenant baru
    const seedProduk = [
      { logam: 'emas', jenis: 'Kalung', nama: 'Kalung Emas 24K', berat: 10, ongkos: 50000, kadar: '24K' },
      { logam: 'emas', jenis: 'Kalung', nama: 'Kalung Emas 22K', berat: 8, ongkos: 45000, kadar: '22K' },
      { logam: 'emas', jenis: 'Gelang', nama: 'Gelang Emas 24K', berat: 5, ongkos: 35000, kadar: '24K' },
      { logam: 'emas', jenis: 'Cincin', nama: 'Cincin Emas 22K', berat: 3, ongkos: 25000, kadar: '22K' },
      { logam: 'emas', jenis: 'Anting', nama: 'Anting Emas 22K', berat: 2, ongkos: 20000, kadar: '22K' },
      { logam: 'perak', jenis: 'Gelang', nama: 'Gelang Perak Murni', berat: 15, ongkos: 15000, kadar: 'Murni' },
      { logam: 'perak', jenis: 'Cincin', nama: 'Cincin Perak Murni', berat: 5, ongkos: 10000, kadar: 'Murni' },
      { logam: 'perak', jenis: 'Kalung', nama: 'Kalung Perak Murni', berat: 12, ongkos: 20000, kadar: 'Murni' },
    ];

    for (const p of seedProduk) {
      await dbRun(
        `INSERT INTO produk (kode, logam_id, jenis, nama, berat_gram, ongkos_cetak, stok, kadar_label, tenant_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [`${p.logam.slice(0, 2).toUpperCase()}${String(Math.floor(Math.random() * 900) + 100)}`,
         p.logam, p.jenis, p.nama, p.berat, p.ongkos, 10, p.kadar, tenant!.id]
      );
    }

    await dbRun("COMMIT");
    return { tenant: tenant!, user: user! };
  } catch (error) {
    await dbRun("ROLLBACK");
    throw error;
  }
}

// ---------- User Management ----------
export async function createUser(data: {
  tenant_id: string | number;
  email: string;
  password: string;
  nama: string;
  role?: "admin" | "kasir";
}): Promise<UserRow> {
  const passwordHash = hashPassword(data.password);
  return dbOne<UserRow>(
    `INSERT INTO users (tenant_id, email, password_hash, nama, role)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.tenant_id, data.email, passwordHash, data.nama, data.role || "kasir"]
  ) as Promise<UserRow>;
}

export async function getUsersByTenant(tenantId: string | number): Promise<Omit<UserRow, "password_hash">[]> {
  return dbAll(
    `SELECT id, tenant_id, email, nama, role, is_active, last_login, created_at
     FROM users WHERE tenant_id = $1 ORDER BY created_at`,
    [tenantId]
  );
}

// ---------- Auth Actions ----------
export async function login(email: string, password: string): Promise<{ sessionId: string; user: UserRow; tenant: TenantRow } | null> {
  const user = await dbOne<UserRow>(
    `SELECT * FROM users WHERE email = $1 AND is_active = true`,
    [email]
  );

  if (!user || !verifyPassword(password, user.password_hash)) {
    return null;
  }

  // Update last login
  await dbRun(`UPDATE users SET last_login = now() WHERE id = $1`, [user.id]);

  const tenant = await dbOne<TenantRow>(
    `SELECT * FROM tenants WHERE id = $1 AND is_active = true`,
    [user.tenant_id]
  );

  if (!tenant) return null;

  const sessionId = await createSession(user.id, tenant.id);
  return { sessionId, user, tenant };
}

export async function register(data: {
  nama_toko: string;
  slug: string;
  owner_name: string;
  owner_email: string;
  owner_phone?: string;
  password: string;
}): Promise<{ sessionId: string; user: UserRow; tenant: TenantRow }> {
  const { tenant, user } = await createTenant(data);
  const sessionId = await createSession(user.id, tenant.id);
  return { sessionId, user, tenant };
}

// ---------- Plan Checks (uses tenant_counters for performance) ----------
export async function checkPlanLimit(tenantId: string | number, type: "produk" | "transaksi"): Promise<{ allowed: boolean; current: number; max: number }> {
  const tenant = await dbOne<TenantRow>(
    `SELECT * FROM tenants WHERE id = $1`,
    [tenantId]
  );

  if (!tenant) return { allowed: false, current: 0, max: 0 };

  const PLAN_DEFAULTS: Record<string, { max_produk: number; max_transaksi: number }> = {
    free: { max_produk: 50, max_transaksi: 100 },
    basic: { max_produk: 500, max_transaksi: 2000 },
    pro: { max_produk: 5000, max_transaksi: 10000 },
    enterprise: { max_produk: -1, max_transaksi: -1 },
  };

  const limits = PLAN_DEFAULTS[tenant.plan] ?? PLAN_DEFAULTS.free;
  const now = new Date();
  const bulan = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  if (type === "produk") {
    const max = limits.max_produk;
    if (max === -1) return { allowed: true, current: 0, max: -1 };

    const counter = await dbOne<{ value: number }>(
      `SELECT value FROM tenant_counters WHERE tenant_id = $1 AND key = 'produk_total'`,
      [tenantId]
    );
    let current = counter?.value ?? 0;
    // Fallback: count directly if no counter
    if (!counter) {
      const c = await dbOne<{ jumlah: number }>(
        `SELECT COUNT(*)::int as jumlah FROM produk WHERE tenant_id = $1`,
        [tenantId]
      );
      current = c?.jumlah ?? 0;
    }
    return { allowed: current < max, current, max };
  }

  if (type === "transaksi") {
    const max = limits.max_transaksi;
    if (max === -1) return { allowed: true, current: 0, max: -1 };

    const counterKey = `transaksi_${bulan}`;
    const counter = await dbOne<{ value: number }>(
      `SELECT value FROM tenant_counters WHERE tenant_id = $1 AND key = $2`,
      [tenantId, counterKey]
    );
    let current = counter?.value ?? 0;
    if (!counter) {
      const c = await dbOne<{ jumlah: number }>(
        `SELECT COUNT(*)::int as jumlah FROM transaksi WHERE tenant_id = $1 AND created_at >= $2`,
        [tenantId, `${bulan}-01`]
      );
      current = c?.jumlah ?? 0;
    }
    return { allowed: current < max, current, max };
  }

  return { allowed: false, current: 0, max: 0 };
}