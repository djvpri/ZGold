// app/api/health/route.ts
// Health check endpoint
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query("SELECT NOW() AS time");
    return NextResponse.json({ ok: true, time: result.rows[0].time });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
