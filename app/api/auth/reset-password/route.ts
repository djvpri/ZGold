// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getTenantFromRequest } from "@/lib/api-helpers";
import { dbOne } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/auth/reset-password — admin resets user password
export async function POST(req: NextRequest) {
  try {
    const auth = await getTenantFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (auth.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

    const { userId, newPassword } = await req.json();
    if (!userId || !newPassword) {
      return NextResponse.json({ error: "userId and newPassword required" }, { status: 400 });
    }
    if (newPassword.length < 4) {
      return NextResponse.json({ error: "Password minimal 4 karakter" }, { status: 400 });
    }

    const hashed = hashPassword(newPassword);
    const result = await dbOne(
      `UPDATE users SET password = $1, updated_at = now() WHERE id = $2 AND tenant_id = $3 RETURNING id, nama, email`,
      [hashed, userId, auth.tenantId]
    );

    if (!result) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ ok: true, data: result });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
