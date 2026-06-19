// lib/plan-enforcement.ts
// Plan limit enforcement — checks tenant_counters for performance
import { dbOne, dbAll } from "./db";

export interface PlanLimit {
  max_produk: number;
  max_transaksi: number;
  max_users: number;
}

export interface CheckResult {
  allowed: boolean;
  current: number;
  max: number;
  plan_name: string;
}

const PLAN_DEFAULTS: Record<string, PlanLimit> = {
  free: { max_produk: 50, max_transaksi: 100, max_users: 1 },
  basic: { max_produk: 500, max_transaksi: 2000, max_users: 3 },
  pro: { max_produk: 5000, max_transaksi: 10000, max_users: 10 },
  enterprise: { max_produk: -1, max_transaksi: -1, max_users: -1 },
};

/** Get plan limits */
export function getPlanLimits(plan: string): PlanLimit {
  return PLAN_DEFAULTS[plan] ?? PLAN_DEFAULTS.free;
}

/**
 * Check if tenant has reached their plan limit.
 * Uses tenant_counters table for performance.
 * Falls back to direct COUNT if counter not available.
 */
export async function checkPlanLimit(
  tenantId: number,
  type: "produk" | "transaksi"
): Promise<CheckResult> {
  // Get tenant + plan info
  const tenant = await dbOne<{ plan: string; nama_toko: string }>(
    `SELECT plan, nama_toko FROM tenants WHERE id = $1`,
    [tenantId]
  );

  if (!tenant) {
    return { allowed: false, current: 0, max: 0, plan_name: "unknown" };
  }

  const limits = getPlanLimits(tenant.plan);
  const max = type === "produk" ? limits.max_produk : limits.max_transaksi;

  // Unlimited
  if (max === -1) {
    return { allowed: true, current: 0, max: -1, plan_name: tenant.plan };
  }

  // Try to use tenant_counters first (fast path)
  const prefix = type === "produk" ? "produk_" : "transaksi_";
  const now = new Date();
  const bulanKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const counterKey = type === "produk" ? `${prefix}total` : `${prefix}${bulanKey}`;

  const counter = await dbOne<{ value: number }>(
    `SELECT value FROM tenant_counters WHERE tenant_id = $1 AND key = $2`,
    [tenantId, counterKey]
  );

  let current: number;
  if (counter) {
    current = counter.value;
  } else {
    // Fallback: count directly from table
    if (type === "produk") {
      const c = await dbOne<{ jumlah: number }>(
        `SELECT COUNT(*)::int as jumlah FROM produk WHERE tenant_id = $1`,
        [tenantId]
      );
      current = c?.jumlah ?? 0;
    } else {
      const c = await dbOne<{ jumlah: number }>(
        `SELECT COUNT(*)::int as jumlah FROM transaksi WHERE tenant_id = $1 AND created_at >= $2`,
        [tenantId, `${bulanKey}-01`]
      );
      current = c?.jumlah ?? 0;
    }
  }

  return {
    allowed: current < max,
    current,
    max,
    plan_name: tenant.plan,
  };
}

/** Get current usage summary for a tenant */
export async function getTenantUsage(tenantId: number) {
  const [produk, transaksi, users] = await Promise.all([
    dbOne<{ jumlah: number }>(
      `SELECT COUNT(*)::int as jumlah FROM produk WHERE tenant_id = $1`,
      [tenantId]
    ),
    dbOne<{ jumlah: number }>(
      `SELECT COUNT(*)::int as jumlah FROM transaksi WHERE tenant_id = $1`,
      [tenantId]
    ),
    dbAll(
      `SELECT id, nama, email, role, is_active FROM users WHERE tenant_id = $1`,
      [tenantId]
    ),
  ]);

  return {
    produk_count: produk?.jumlah ?? 0,
    transaksi_count: transaksi?.jumlah ?? 0,
    users: users ?? [],
  };
}
