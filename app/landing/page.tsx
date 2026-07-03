"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const PLANS = [
  {
    id: "bulanan",
    nama: "Bulanan",
    harga: "Rp 100.000",
    periode: "/bulan",
    catatan: "Ditagih tiap bulan, berhenti kapan saja",
    accent: "#d97706",
  },
  {
    id: "tahunan",
    nama: "Tahunan",
    harga: "Rp 1.000.000",
    periode: "/tahun",
    catatan: "Setara Rp 83.333/bulan — hemat 2 bulan",
    accent: "#b45309",
    badge: "Paling Hemat",
  },
];

const FITUR_LENGKAP = [
  { icon: "💎", label: "Multi-Logam", desc: "Emas, perak, platinum, emas putih, palladium — kelola semua dalam satu POS" },
  { icon: "📸", label: "Face Login", desc: "Login pakai wajah, ga perlu repot email & password" },
  { icon: "🖨️", label: "Cetak Nota", desc: "Struk thermal 58mm atau nota PLQ-35 landscape — tinggal pilih" },
  { icon: "📊", label: "Laporan Lengkap", desc: "Rekap harian, per logam, export PDF & CSV" },
  { icon: "💰", label: "Hutang Piutang", desc: "Catat otomatis kalau bayar kurang, lunasi bertahap" },
  { icon: "📱", label: "PWA & Mobile", desc: "Install ke layar utama, jalan offline, responsive di HP" },
  { icon: "👥", label: "Multi User", desc: "Admin & kasir, batasi akses sesuai peran" },
  { icon: "🏷️", label: "Manajemen Stok", desc: "Atur stok produk, scan barcode, riwayat mutasi" },
];

const STEP = [
  { icon: "📋", title: "Daftar Akun", desc: "Buat akun, dapatkan tenant toko sendiri, pilih paket bulanan/tahunan." },
  { icon: "💎", title: "Input Produk", desc: "Tambah produk emas/perak dengan kode, kadar, berat, dan harga." },
  { icon: "🛒", title: "Mulai Jual", desc: "Scan kode atau pilih produk — hitung otomatis, cetak nota." },
  { icon: "📈", title: "Pantau Bisnis", desc: "Lihat laporan harian, kelola hutang, pantau stok dari dashboard." },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading || user) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 safe-top safe-bottom">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">💎</span>
            <span className="text-sm font-medium">Zomet POS</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-md px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800">
              Masuk
            </Link>
            <Link href="/login"
              className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 shadow-sm">
              Daftar Sekarang
            </Link>
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden px-4 py-12 text-center sm:py-20">
        {/* Background accent */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-80 w-80 sm:h-[500px] sm:w-[500px] rounded-full bg-amber-100/60 blur-3xl" />
        <div className="relative mx-auto max-w-3xl">
          <div className="mb-4 inline-block rounded-full bg-amber-100 px-3 py-1 text-[10px] font-medium text-amber-700 sm:text-xs">
            🚀 Baru rilis di Zomet
          </div>
          <h1 className="mb-4 text-2xl font-bold leading-tight sm:text-4xl">
            Point of Sale Toko Perhiasan
            <br />
            <span className="bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">
              Multi-Logam
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-xs text-gray-500 sm:text-sm">
            Satu aplikasi untuk jual & beli emas, perak, platinum, dan logam mulia lainnya.
            Hitung otomatis, cetak nota, laporan lengkap — tanpa ribet.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-6 py-3 text-xs font-medium text-white hover:bg-amber-700 shadow-lg shadow-amber-200 sm:text-sm">
              Mulai Sekarang
              <i className="ti ti-arrow-right text-sm" />
            </Link>
            <a href="#demo"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-3 text-xs text-gray-700 hover:border-gray-500 sm:text-sm">
              <i className="ti ti-player-play text-sm" />
              Lihat Demo
            </a>
          </div>
          {/* Stats */}
          <div className="mt-8 flex justify-center gap-6 sm:gap-10">
            {[
              { n: "10+", l: "Logam" },
              { n: "15+", l: "Pengguna" },
              { n: "99.9%", l: "Uptime" },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <div className="text-lg font-bold sm:text-2xl">{s.n}</div>
                <div className="text-[9px] text-gray-400 sm:text-[10px]">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SCREENSHOT / DEMO ===== */}
      <section id="demo" className="border-t border-gray-200 px-4 py-10 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-lg font-medium sm:text-xl">
            Begini Tampilannya
          </h2>
          <p className="mb-6 text-center text-[10px] text-gray-400 sm:text-xs">
            Dashboard, POS jual-beli, stok, dan laporan dalam satu layar
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Card 1 — POS */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-amber-100 px-2 py-0.5 text-[9px] font-medium text-amber-700">POS</span>
                <span className="text-[10px] text-gray-400">Transaksi jual & buyback</span>
              </div>
              <div className="rounded-lg bg-gray-900 p-3 text-[9px] font-mono text-gray-300 sm:text-[10px]">
                <div className="mb-1 flex items-center gap-2 text-white">
                  <span>💎 Zomet POS</span>
                  <span className="ml-auto text-amber-400">💰 Rp 1.250.000</span>
                </div>
                <div className="border-t border-gray-700 pt-1">
                  <div className="flex justify-between"><span>Kalung Emas 24K 10g</span><span className="text-amber-300">Rp 1.350.000</span></div>
                  <div className="flex justify-between"><span>Ongkos</span><span className="text-gray-400">Rp 50.000</span></div>
                  <div className="flex justify-between"><span>Diskon</span><span className="text-green-400">-Rp 50.000</span></div>
                  <div className="flex justify-between border-t border-gray-700 pt-1 font-bold text-white">
                    <span>Total</span><span>Rp 1.250.000</span>
                  </div>
                </div>
                <div className="mt-1.5 flex gap-1">
                  <span className="flex-1 rounded bg-gray-700 px-2 py-1 text-center">🔍 Cari Produk</span>
                  <span className="rounded bg-amber-600 px-4 py-1 text-center font-medium text-white">Bayar</span>
                </div>
              </div>
            </div>
            {/* Card 2 — Dashboard */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-blue-100 px-2 py-0.5 text-[9px] font-medium text-blue-700">DASHBOARD</span>
                <span className="text-[10px] text-gray-400">Ringkasan bisnis</span>
              </div>
              <div className="rounded-lg bg-gray-900 p-3 text-[9px] font-mono text-gray-300 sm:text-[10px]">
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="rounded bg-gray-800 p-2"><div className="text-gray-500">Penjualan</div><div className="text-green-400 font-medium">Rp 2,5 Jt</div></div>
                  <div className="rounded bg-gray-800 p-2"><div className="text-gray-500">Buyback</div><div className="text-amber-400 font-medium">Rp 850 rb</div></div>
                  <div className="rounded bg-gray-800 p-2"><div className="text-gray-500">Transaksi</div><div className="text-blue-400 font-medium">12 hari ini</div></div>
                  <div className="rounded bg-gray-800 p-2"><div className="text-gray-500">Stok</div><div className="text-purple-400 font-medium">43 produk</div></div>
                </div>
              </div>
            </div>
            {/* Card 3 — Stok */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-green-100 px-2 py-0.5 text-[9px] font-medium text-green-700">STOK</span>
                <span className="text-[10px] text-gray-400">Manajemen produk</span>
              </div>
              <div className="rounded-lg bg-gray-900 p-3 text-[9px] font-mono text-gray-300 sm:text-[10px]">
                <div className="flex gap-1 border-b border-gray-700 pb-1 mb-1">
                  <span className="rounded bg-amber-700/30 px-1.5 py-0.5 text-amber-400">Emas</span>
                  <span className="rounded bg-gray-700 px-1.5 py-0.5">Perak</span>
                  <span className="rounded bg-gray-700 px-1.5 py-0.5">Platinum</span>
                </div>
                {["Kalung 24K | 10g | Stok 5", "Gelang 22K | 8g | Stok 3", "Cincin 22K | 3g | Stok 8"].map((r, i) => (
                  <div key={i} className="flex justify-between py-0.5">
                    <span>{r}</span>
                    <span className="text-gray-500">✏️ 🗑️</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Card 4 — Laporan */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-purple-100 px-2 py-0.5 text-[9px] font-medium text-purple-700">LAPORAN</span>
                <span className="text-[10px] text-gray-400">Rekap & export</span>
              </div>
              <div className="rounded-lg bg-gray-900 p-3 text-[9px] font-mono text-gray-300 sm:text-[10px]">
                <div className="mb-1.5 flex gap-1">
                  {["Hari Ini", "7 Hari", "30 Hari"].map((p) => (
                    <span key={p} className={`rounded-full px-2 py-0.5 text-[8px] ${p === "Hari Ini" ? "bg-amber-600 text-white" : "bg-gray-700"}`}>{p}</span>
                  ))}
                </div>
                {[
                  ["12 Apr", "Rp 1.2Jt", "Rp 0"],
                  ["13 Apr", "Rp 2.1Jt", "Rp 350rb"],
                  ["14 Apr", "Rp 950rb", "Rp 0"],
                ].map((r, i) => (
                  <div key={i} className="flex justify-between border-b border-gray-800 py-0.5 text-[8px]">
                    <span>{r[0]}</span><span className="text-green-400">{r[1]}</span><span className="text-amber-400">{r[2]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CARA KERJA ===== */}
      <section className="border-t border-gray-200 bg-white px-4 py-10 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-lg font-medium sm:text-xl">Cara Kerja</h2>
          <p className="mb-8 text-center text-[10px] text-gray-400 sm:text-xs">Dari daftar sampai jualan — cuma 4 langkah</p>
          <div className="grid gap-4 sm:grid-cols-4">
            {STEP.map((s, i) => (
              <div key={i} className="relative text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-xl">
                  {s.icon}
                </div>
                <div className="text-xs font-medium sm:text-sm">{s.title}</div>
                <div className="mt-1 text-[9px] text-gray-400 sm:text-[10px]">{s.desc}</div>
                {i < 3 && <div className="absolute -right-2 top-5 hidden text-gray-300 sm:block">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FITUR LENGKAP ===== */}
      <section className="border-t border-gray-200 px-4 py-10 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-lg font-medium sm:text-xl">Fitur Lengkap</h2>
          <p className="mb-8 text-center text-[10px] text-gray-400 sm:text-xs">Semua yang kamu butuh buat jualan logam mulia</p>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {FITUR_LENGKAP.map((f) => (
              <div key={f.label} className="rounded-lg border border-gray-200 bg-white p-3 hover:border-amber-300 transition">
                <div className="text-lg mb-1">{f.icon}</div>
                <div className="text-[11px] font-medium sm:text-xs">{f.label}</div>
                <div className="mt-0.5 text-[9px] text-gray-400 sm:text-[10px]">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HARGA ===== */}
      <section id="harga" className="border-t border-gray-200 bg-white px-4 py-10 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-2 text-center text-lg font-medium sm:text-xl">Harga Sederhana</h2>
          <p className="mb-8 text-center text-[10px] text-gray-400 sm:text-xs">Satu paket, semua fitur — pilih bulanan atau tahunan</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {PLANS.map((p) => (
              <div key={p.id}
                className={`relative rounded-xl border-2 p-6 ${p.badge ? "border-amber-500 shadow-lg" : "border-gray-200"}`}>
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-600 px-3 py-1 text-[10px] font-medium text-white">
                    {p.badge}
                  </div>
                )}
                <div className="text-xs font-medium text-gray-500">{p.nama}</div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-bold sm:text-3xl" style={{ color: p.accent }}>{p.harga}</span>
                  <span className="text-xs text-gray-400">{p.periode}</span>
                </div>
                <div className="mt-2 text-[10px] text-gray-400 sm:text-xs">{p.catatan}</div>
                <ul className="mt-4 space-y-2 text-[11px] text-gray-600 sm:text-xs">
                  {["Semua fitur POS multi-logam", "Produk & transaksi unlimited", "Multi kasir & face login", "Laporan lengkap + export", "Support prioritas"].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <i className="ti ti-check text-green-500" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login"
                  className="mt-6 block rounded-lg py-2.5 text-center text-xs font-medium text-white hover:opacity-90"
                  style={{ backgroundColor: p.accent }}>
                  Pilih {p.nama}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="border-t border-gray-200 bg-white px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-center text-lg font-medium">FAQ</h2>
          <div className="space-y-3">
            {[
              { q: "Berapa biayanya?", a: "Rp 100.000/bulan atau Rp 1.000.000/tahun (hemat 2 bulan) — satu paket, semua fitur, tanpa batasan produk/transaksi." },
              { q: "Bisa cetak struk thermal kecil?", a: "Bisa. Kami dukung printer thermal 58mm (Bluetooth/USB) dan printer PLQ-35 21cm." },
              { q: "Data aman ga?", a: "100%. Hosting di Railway (AWS), database PostgreSQL, enkripsi password pakai PBKDF2." },
              { q: "Bisa dipake di HP?", a: "Bisa. PWA — install ke layar utama, responsive, bisa offline." },
              { q: "Ada biaya tersembunyi?", a: "Tidak. Semua transparan. Upgrade kapan saja tanpa penalti." },
            ].map((faq) => (
              <details key={faq.q} className="group rounded-lg border border-gray-200">
                <summary className="flex cursor-pointer items-center justify-between px-4 py-2.5 text-xs font-medium hover:text-amber-600">
                  {faq.q}
                  <i className="ti ti-chevron-down text-xs text-gray-400 transition group-open:rotate-180" />
                </summary>
                <div className="border-t border-gray-100 px-4 py-2.5 text-[10px] text-gray-500 sm:text-[11px]">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="border-t border-gray-200 px-4 py-12 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="mb-3 text-lg font-medium sm:text-xl">Siap Mulai?</h2>
          <p className="mb-6 text-xs text-gray-400">
            Rp 100.000/bulan atau Rp 1.000.000/tahun. Batal kapan saja.
          </p>
          <Link href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-6 py-3 text-sm font-medium text-white hover:bg-amber-700 shadow-lg shadow-amber-200">
            Mulai Sekarang
            <i className="ti ti-arrow-right" />
          </Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-gray-200 px-4 py-6">
        <div className="mx-auto max-w-5xl text-center text-[10px] text-neutral-500">
          <div className="mb-1">💎 Zomet POS © 2026</div>
          <div>Sistem Point of Sale Toko Perhiasan Multi-Logam</div>
        </div>
      </footer>
    </div>
  );
}
