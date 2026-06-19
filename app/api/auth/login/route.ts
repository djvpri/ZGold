// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email & password wajib" }, { status: 400 });
    }

    const result = await login(email, password);
    if (!result) {
      return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
    }

    const response = NextResponse.json({
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          nama: result.user.nama,
          role: result.user.role,
        },
        tenant: {
          id: result.tenant.id,
          nama_toko: result.tenant.nama_toko,
          slug: result.tenant.slug,
          plan: result.tenant.plan,
        },
      },
    });

    // Set session cookie
    response.cookies.set("session_id", result.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}