// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { register } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { nama_toko, slug, owner_name, owner_email, owner_phone, password } = await req.json();

    if (!nama_toko || !slug || !owner_name || !owner_email || !password) {
      return NextResponse.json(
        { error: "Field wajib: nama_toko, slug, owner_name, owner_email, password" },
        { status: 400 }
      );
    }

    // Validasi slug
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: "Slug hanya boleh huruf kecil, angka, dan strip" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    const result = await register({
      nama_toko,
      slug,
      owner_name,
      owner_email,
      owner_phone,
      password,
    });

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
    }, { status: 201 });

    response.cookies.set("session_id", result.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (e: any) {
    if (e.message?.includes("duplicate key")) {
      return NextResponse.json({ error: "Email atau slug sudah terdaftar" }, { status: 400 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}