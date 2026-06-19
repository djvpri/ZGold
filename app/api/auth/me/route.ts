// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const sessionId = req.headers.get("x-session-id");

  if (!sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  return NextResponse.json({
    data: {
      user: {
        id: session.user_id,
        email: session.email,
        nama: session.nama,
        role: session.role,
      },
      tenant: {
        id: session.tenant_id,
        nama_toko: session.nama_toko,
        slug: session.slug,
        plan: session.plan,
        settings: session.settings,
      },
    },
  });
}