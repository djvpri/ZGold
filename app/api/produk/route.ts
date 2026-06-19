// app/api/produk/route.ts
// API endpoint untuk manajemen produk/stok
import { NextRequest, NextResponse } from "next/server";
import {
  ambilSemuaProduk,
  tambahProduk,
  updateProduk,
  hapusProduk,
  updateStok,
  cariProduk,
  ambilProdukByLogam,
  ambilRingkasanStok,
  ambilProdukByKode
} from "@/lib/produk";

/** GET /api/produk — ambil semua produk atau filter */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const logamId = searchParams.get("logam");
    const ringkasan = searchParams.get("ringkasan");

    let data;
    if (ringkasan === "true") {
      data = await ambilRingkasanStok();
    } else if (query) {
      data = await cariProduk(query);
    } else if (logamId) {
      data = await ambilProdukByLogam(logamId);
    } else {
      data = await ambilSemuaProduk();
    }

    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** POST /api/produk — tambah produk baru */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      kode, logam_id, kadar_id, jenis, nama,
      berat_gram, ongkos_cetak, stok, foto_url
    } = body;

    // Validasi field wajib
    if (!kode || !logam_id || !jenis || !nama || berat_gram === undefined) {
      return NextResponse.json(
        { error: "Field wajib: kode, logam_id, jenis, nama, berat_gram" },
        { status: 400 }
      );
    }

    // Cek duplikat kode
    const existing = await ambilProdukByKode(kode);
    if (existing) {
      return NextResponse.json(
        { error: "Kode produk sudah ada" },
        { status: 400 }
      );
    }

    const result = await tambahProduk({
      kode,
      logam_id,
      kadar_id: kadar_id ?? null,
      jenis,
      nama,
      berat_gram,
      ongkos_cetak: ongkos_cetak ?? 0,
      stok: stok ?? 0,
      foto_url: foto_url ?? null
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** PATCH /api/produk — update produk atau stok */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, stok_delta, stok_tipe, keterangan, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "ID wajib" }, { status: 400 });
    }

    // Jika ada stok_delta, update stok
    if (stok_delta !== undefined && stok_tipe) {
      const result = await updateStok(id, stok_delta, stok_tipe, keterangan);
      return NextResponse.json({ data: result });
    }

    // Update data produk lainnya
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Tidak ada data untuk diupdate" }, { status: 400 });
    }

    const result = await updateProduk(id, updateData);
    if (!result) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ data: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** DELETE /api/produk — hapus produk */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "");

    if (!id) {
      return NextResponse.json({ error: "ID wajib" }, { status: 400 });
    }

    const success = await hapusProduk(id);
    if (!success) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}