"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const PLANS = [
  {
    id: "free",
    nama: "Gratis",
    harga: "Rp 0",
    periode: "selamanya",
    fitur: ["POS Jual & Buyback", "Riwayat transaksi", "Stok dasar (50 produk)", "100 transaksi/bulan"],
    accent: "#71717a",
  },
  {
    id: "basic",
    nama: "Basic",
    harga: "Rp 99.000",
    periode: "/bulan",
    fitur: ["Semua fitur Gratis", "Laporan harian", "Cetak struk", "500 produk", "2.000 transaksi/bulan"],
    accent: "#2563eb",
    badge: "Populer",
  },
  {
    id: "pro",
    nama: "Pro",
    harga: "Rp 249.000",
    periode: "/bulan",
    fitur: ["Semua fitur Basic", "Multi kasir (unlimited)", "Auto harga emas harian", "Export Excel/CSV", "5.000 produk", "10.000 transaksi/bulan"],
    accent: "#d97706",
  },
  {
    id: "enterprise",
    nama: "Enterprise",
    harga: "Rp 499.000",
    periode: "/bulan",
    fitur: ["Semua fitur Pro", "Custom domain", "API access", "Priority support", "White label", "Produk & transaksi unlimited"],
    accent: "#7c3aed",
  },
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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 safe-top safe-bottom">
      {/* Header */}
      <header className="border-b border-neutral-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">💎</span>
            <span className="text-sm font-medium">Zomet POS</span>
          </div>
          <div className="flex gap-2">
            <Link
              href="/login"
              className="rounded-md px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200"
            >
              Masuk
            </Link>
            <Link
              href="/login"
              className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
            >
              Daftar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 py-12 text-center sm:py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-3 text-2xl font-medium leading-tight sm:text-3xl">
            POS Toko Perhiasan
            <br />
            <span className="text-amber-500">Multi-Logam</span>
          </h1>
          <p className="mb-6 text-xs text-neutral-400 sm:text-sm">
            Sistem point of sale lengkap untuk toko perhiasan. 
            Kelola emas, perak, platinum, emas putih, dan palladium dalam satu aplikasi.
          </p>
          <div className="flex justify-center gap-2">
            <Link
              href="/login"
              className="rounded-md bg-amber-600 px-4 py-2 text-xs font-medium text-white hover:bg-amber-700 sm:px-5 sm:py-2.5 sm:text-sm"
            >
              Mulai Gratis →
            </Link>
            <a
              href="#pricing"
              className="rounded-md border border-neutral-700 px-4 py-2 text-xs text-neutral-300 hover:border-neutral-500 sm:px-5 sm:py-2.5 sm:text-sm"
            >
              Lihat Harga
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-neutral-800 px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-center text-xs font-medium uppercase tracking-wider text-neutral-500 sm:mb-6">
            Fitur Utama
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {[
              { icon: "ti-diamond", label: "Multi-Logam", desc: "Emas, Perak, Platinum, dll" },
              { icon: "ti-calculator", label: "Kalkulasi Otomatis", desc: "Harga × Kadar × Berat" },
              { icon: "ti-report-analytics", label: "Laporan Harian", desc: "Rekap jual & buyback" },
              { icon: "ti-device-desktop", label: "Web-Based", desc: "Akses dari mana saja" },
            ].map((f) => (
              <div key={f.label} className="rounded-lg border border-neutral-800 p-3 text-center">
                <i className={`ti ${f.icon} mb-2 text-xl sm:text-2xl text-amber-500`} />
                <div className="text-[11px] font-medium sm:text-xs">{f.label}</div>
                <div className="text-[9px] text-neutral-500 sm:text-[10px]">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-neutral-800 px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-center text-xs font-medium uppercase tracking-wider text-neutral-500 sm:mb-6">
            Pilih Paket
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-4">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className="relative rounded-lg border border-neutral-800 p-4 transition hover:border-neutral-600"
              >
                {plan.badge && (
                  <div
                    className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[9px] font-medium text-white"
                    style={{ background: plan.accent }}
                  >
                    {plan.badge}
                  </div>
                )}
                <div className="mb-3 text-center">
                  <div className="text-xs font-medium" style={{ color: plan.accent }}>
                    {plan.nama}
                  </div>
                  <div className="mt-1 text-lg font-medium">{plan.harga}</div>
                  <div className="text-[10px] text-neutral-500">{plan.periode}</div>
                </div>
                <ul className="mb-4 space-y-1.5">
                  {plan.fitur.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-[10px] text-neutral-400 sm:text-[11px]">
                      <i className="ti ti-check text-[10px] text-green-500 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className="block w-full rounded-md py-2 text-center text-xs font-medium text-white transition hover:opacity-90"
                  style={{ background: plan.accent }}
                >
                  Pilih {plan.nama}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800 px-4 py-6">
        <div className="mx-auto max-w-5xl text-center text-[10px] text-neutral-600">
          © 2026 Zomet POS · Sistem Point of Sale Toko Perhiasan
        </div>
      </footer>
    </div>
  );
}