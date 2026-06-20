// app/api/users/route.ts
// User management API — tenant-isolated
import { NextRequest, NextResponse } from "next/server";
import { getTenantFromRequest } from "@/lib/api-helpers";
import { dbAll, dbOne, dbRun } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

/** GET — list users for tenant */
export async function GET(req: NextRequest) {
  try {
    const auth = await getTenantFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const users = await dbAll(
      `SELECT id, tenant_id, email, nama, role, is_active, last_login, created_at
       FROM users WHERE tenant_id = $1 ORDER BY
         CASE role WHEN 'admin' THEN 0 WHEN 'kasir' THEN 1 END,
         created_at`,
      [auth.tenantId]
    );

    return NextResponse.json({ data: users });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** POST — create new user (admin only) */
export async function POST(req: NextRequest) {
  try {
    const auth = await getTenantFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Hanya admin yang bisa menambah user" }, { status: 403 });
    }

    const body = await req.json();
    const { email, password, nama, role } = body;

    if (!email || !password || !nama) {
      return NextResponse.json({ error: "Field wajib: email, password, nama" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
    }

    // Check if email already exists
    const existing = await dbOne(`SELECT id FROM users WHERE email = $1`, [email]);
    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
    }

    const validRole = ["admin", "kasir"].includes(role) ? role : "kasir";
    const passwordHash = hashPassword(password);

    const user = await dbOne(
      `INSERT INTO users (tenant_id, email, password_hash, nama, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, tenant_id, email, nama, role, is_active, created_at`,
      [auth.tenantId, email, passwordHash, nama, validRole]
    );

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** PATCH — update user (role, is_active) */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await getTenantFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Hanya admin yang bisa update user" }, { status: 403 });
    }

    const body = await req.json();
    const { id, role, is_active, nama, email, password } = body;

    if (!id) {
      return NextResponse.json({ error: "ID wajib" }, { status: 400 });
    }

    // Cannot modify the admin who is the tenant creator
    const target = await dbOne<{ role: string }>(
      `SELECT role FROM users WHERE id = $1 AND tenant_id = $2`,
      [id, auth.tenantId]
    );
    if (!target) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (role !== undefined) {
      if (["admin", "kasir"].includes(role)) {
        updates.push(`role = $${idx}`);
        values.push(role);
        idx++;
      }
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${idx}`);
      values.push(is_active);
      idx++;
    }
    if (nama) {
      updates.push(`nama = $${idx}`);
      values.push(nama);
      idx++;
    }
    if (email) {
      updates.push(`email = $${idx}`);
      values.push(email);
      idx++;
    }
    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
      }
      updates.push(`password_hash = $${idx}`);
      values.push(hashPassword(password));
      idx++;
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "Tidak ada data untuk diupdate" }, { status: 400 });
    }

    values.push(id, auth.tenantId);
    const user = await dbOne(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${idx} AND tenant_id = $${idx + 1}
       RETURNING id, tenant_id, email, nama, role, is_active, created_at`,
      values
    );

    return NextResponse.json({ data: user });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** DELETE — soft delete user (admin only) */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await getTenantFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Hanya admin yang bisa menghapus user" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "");

    if (!id) {
      return NextResponse.json({ error: "ID wajib" }, { status: 400 });
    }

    // Soft delete — set is_active = false
    await dbRun(
      `UPDATE users SET is_active = false WHERE id = $1 AND tenant_id = $2`,
      [id, auth.tenantId]
    );

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
