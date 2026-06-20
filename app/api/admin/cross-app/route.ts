import { NextRequest, NextResponse } from "next/server";
import { dbAll, dbOne, dbRun } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

const ADMIN_SECRET = process.env.CROSS_APP_SECRET || "z-ecosystem-admin-2026";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${ADMIN_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await dbAll<any>(
      `SELECT id, tenant_id, email, nama as name, role, is_active, face_id as "faceId", created_at
       FROM users ORDER BY created_at DESC`
    );

    // Get tenant plan info
    const tenants = await dbAll<any>(
      `SELECT id as "tenantId", nama_toko as "tenantName", slug, plan, plan_expires as "planExpires", is_active as "active"
       FROM tenants ORDER BY id`
    );

    return NextResponse.json({ users, tenants });
  } catch (error) {
    console.error("Cross-app list users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${ADMIN_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, email, data } = await req.json();

    switch (action) {
      case "create": {
        if (!data?.name || !data?.email || !data?.password) {
          return NextResponse.json({ error: "name, email, password wajib" }, { status: 400 });
        }

        // Check duplicate
        const existing = await dbOne(`SELECT id FROM users WHERE email = $1`, [data.email]);
        if (existing) {
          return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
        }

        // Default to first tenant if no tenant_id specified
        const tenantId = data.tenantId || 1;
        const hashed = hashPassword(data.password);
        const role = data.role || "kasir";

        const user = await dbOne<any>(
          `INSERT INTO users (tenant_id, email, password_hash, nama, role)
           VALUES ($1, $2, $3, $4, $5) RETURNING id, tenant_id, email, nama as name, role`,
          [tenantId, data.email, hashed, data.name, role]
        );

        return NextResponse.json({ success: true, user }, { status: 201 });
      }

      // For actions that need an existing user
      default: {
        const user = await dbOne<any>(
          `SELECT * FROM users WHERE email = $1`,
          [email]
        );
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        switch (action) {
          case "updateRole":
            await dbRun(`UPDATE users SET role = $1 WHERE email = $2`, [data.role, email]);
            return NextResponse.json({ success: true });

          case "updatePlan":
            await dbRun(`UPDATE tenants SET plan = $1, plan_expires = $2 WHERE id = $3`, [data.plan, data.planExpires || null, data.tenantId]);
            return NextResponse.json({ success: true });

          // --- Tenant Management ---
          case "createTenant": {
            if (!data?.namaToko || !data?.slug) {
              return NextResponse.json({ error: "namaToko & slug wajib" }, { status: 400 });
            }
            const existing = await dbOne(`SELECT id FROM tenants WHERE slug = $1`, [data.slug]);
            if (existing) return NextResponse.json({ error: "Slug sudah dipakai" }, { status: 409 });
            const tenant = await dbOne<any>(
              `INSERT INTO tenants (nama_toko, slug, plan, is_active) VALUES ($1, $2, $3, true) RETURNING id, nama_toko as "namaToko", slug, plan`,
              [data.namaToko, data.slug, data.plan || 'free']
            );
            return NextResponse.json({ success: true, tenant }, { status: 201 });
          }
          case "updateTenant": {
            if (!data?.tenantId) return NextResponse.json({ error: "tenantId wajib" }, { status: 400 });
            await dbRun(
              `UPDATE tenants SET nama_toko = COALESCE($1, nama_toko), slug = COALESCE($2, slug), is_active = COALESCE($3, is_active) WHERE id = $4`,
              [data.namaToko || null, data.slug || null, data.isActive ?? null, data.tenantId]
            );
            return NextResponse.json({ success: true });
          }
          case "deleteTenant": {
            if (!data?.tenantId) return NextResponse.json({ error: "tenantId wajib" }, { status: 400 });
            // Delete all related data first (foreign key constraints)
            const tables = ['log_stok', 'logam', 'produk', 'sessions', 'tenant_counters', 'transaksi', 'users'];
            for (const t of tables) {
              await dbRun(`DELETE FROM ${t} WHERE tenant_id = $1`, [data.tenantId]);
            }
            // Finally delete the tenant
            await dbRun(`DELETE FROM tenants WHERE id = $1`, [data.tenantId]);
            return NextResponse.json({ success: true });
          }

          case "toggleActive":
            await dbRun(`UPDATE users SET is_active = $1 WHERE email = $2`, [data.is_active, email]);
            return NextResponse.json({ success: true });

          case "resetPassword":
            if (!data.password || data.password.length < 6) {
              return NextResponse.json({ error: "Password min 6 karakter" }, { status: 400 });
            }
            const hashed = hashPassword(data.password);
            await dbRun(`UPDATE users SET password_hash = $1 WHERE email = $2`, [hashed, email]);
            return NextResponse.json({ success: true });

          case "delete":
            await dbRun(`DELETE FROM users WHERE email = $1`, [email]);
            return NextResponse.json({ success: true });

          default:
            return NextResponse.json({ error: "Unknown action" }, { status: 400 });
        }
      }
    }
  } catch (error) {
    console.error("Cross-app user action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
