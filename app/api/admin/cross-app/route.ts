import { NextRequest, NextResponse } from "next/server";
import { dbAll, dbOne, dbRun } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import crypto from "crypto";

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

    return NextResponse.json({ users });
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

    const user = await dbOne<any>(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    switch (action) {
      case "updateRole":
        await dbRun(
          `UPDATE users SET role = $1 WHERE email = $2`,
          [data.role, email]
        );
        return NextResponse.json({ success: true });

      case "toggleActive":
        await dbRun(
          `UPDATE users SET is_active = $1 WHERE email = $2`,
          [data.is_active, email]
        );
        return NextResponse.json({ success: true });

      case "resetPassword":
        if (!data.password || data.password.length < 6) {
          return NextResponse.json({ error: "Password min 6 karakter" }, { status: 400 });
        }
        const hashed = hashPassword(data.password);
        await dbRun(
          `UPDATE users SET password_hash = $1 WHERE email = $2`,
          [hashed, email]
        );
        return NextResponse.json({ success: true });

      case "delete":
        await dbRun(`DELETE FROM users WHERE email = $1`, [email]);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Cross-app user action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
