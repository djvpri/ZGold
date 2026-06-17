// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anonKey);

// ---------- Tipe baris transaksi ----------
export interface TransaksiRow {
  id?: number;
  no_transaksi: string;
  tipe: "jual" | "buyback";
  logam_id: string;
  kadar_label: string | null;
  jenis_produk: string | null;
  nama_pihak: string | null;
  kontak: string | null;
  berat_gram: number;
  jumlah: number;
  harga_per_gram: number;
  ongkos_cetak: number;
  kondisi: number;
  diskon: number;
  total: number;
  bayar: number;
  kembalian: number;
  created_at?: string;
}

export async function simpanTransaksi(row: TransaksiRow) {
  const { data, error } = await supabase.from("transaksi").insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function ambilRiwayatHariIni() {
  const awal = new Date();
  awal.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from("transaksi")
    .select("*")
    .gte("created_at", awal.toISOString())
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as TransaksiRow[];
}

export async function nomorTransaksiBerikutnya(tipe: "jual" | "buyback") {
  const prefix = tipe === "jual" ? "TRX" : "BB";
  const { count } = await supabase
    .from("transaksi")
    .select("*", { count: "exact", head: true })
    .eq("tipe", tipe);
  return prefix + String((count ?? 0) + 1).padStart(4, "0");
}
