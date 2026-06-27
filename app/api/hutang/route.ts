// app/api/hutang/route.ts
// Hutang/Piutang CRUD
import { NextRequest, NextResponse } from "next/server";
import { getTenantFromRequest } from "@/lib/api-helpers";
import { dbAll, dbOne } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/hutang?status=aktif&q=search
export async function GET(req: NextRequest) {
  try {
    const auth = await getTenantFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const q = searchParams.get("q") || "";

    let sql = `SELECT h.*, t.no_transaksi
               FROM hutang h
               LEFT JOIN transaksi t ON h.transaksi_id = t.id
               WHERE h.tenant_id = $1`;
    const params: any[] = [auth.tenantId];
    let idx = 2;

    if (status === "aktif" || status === "lunas") {
      sql += ` AND h.status = $${idx}`;
      params.push(status);
      idx++;
    }

    if (q) {
      sql += ` AND h.nama_pihak ILIKE $${idx}`;
      params.push(`%${q}%`);
      idx++;
    }

    sql += " ORDER BY h.created_at DESC LIMIT 100";

    const data = await dbAll(sql, params);
    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET /api/hutang error:", err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}

// POST /api/hutang — create new hutang/piutang entry
export async function POST(req: NextRequest) {
  try {
    const auth = await getTenantFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    // If linked to a transaction, validate
    if (body.transaksi_id) {
      const trx = await dbOne(
        "SELECT * FROM transaksi WHERE id = $1 AND tenant_id = $2",
        [body.transaksi_id, auth.tenantId]
      );
      if (!trx) return NextResponse.json({ error: "Transaksi not found" }, { status: 404 });
    }

    const result = await dbOne(
      `INSERT INTO hutang (tenant_id, transaksi_id, tipe, nama_pihak, kontak, total, dibayar, sisa, status, jatuh_tempo, keterangan)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        auth.tenantId,
        body.transaksi_id || null,
        body.tipe || "jual",
        body.nama_pihak,
        body.kontak || null,
        body.total,
        body.dibayar || 0,
        body.sisa || body.total,
        body.status || "aktif",
        body.jatuh_tempo || null,
        body.keterangan || null,
      ]
    );

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err) {
    console.error("POST /api/hutang error:", err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}

// PUT /api/hutang — bayar / update
export async function PUT(req: NextRequest) {
  try {
    const auth = await getTenantFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, bayar, status, keterangan } = body;

    const existing = await dbOne(
      "SELECT * FROM hutang WHERE id = $1 AND tenant_id = $2",
      [id, auth.tenantId]
    );
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let newBayar = existing.dibayar;
    let newStatus = existing.status;

    if (bayar) {
      newBayar = existing.dibayar + bayar;
      if (newBayar >= existing.total) {
        newBayar = existing.total;
        newStatus = "lunas";
      }
    }

    if (status) newStatus = status;

    const result = await dbOne(
      `UPDATE hutang SET dibayar = $1, sisa = total - $1, status = $2, keterangan = COALESCE($3, keterangan), updated_at = now()
       WHERE id = $4 AND tenant_id = $5 RETURNING *`,
      [newBayar, newStatus, keterangan || null, id, auth.tenantId]
    );

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("PUT /api/hutang error:", err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}

// DELETE /api/hutang?id=xxx (soft delete: set status = 'dihapus')
export async function DELETE(req: NextRequest) {
  try {
    const auth = await getTenantFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    await dbOne(
      "UPDATE hutang SET status = 'dihapus', updated_at = now() WHERE id = $1 AND tenant_id = $2 RETURNING id",
      [parseInt(id || "0"), auth.tenantId]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/hutang error:", err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
