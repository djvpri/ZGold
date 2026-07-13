"use client";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PosPerhiasan from "@/components/PosPerhiasan";
import BrandMark from "@/components/BrandMark";
import LandingPage from "./landing/page";

export default function Home() {
  const { user, tenant, loading, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center t-bg-base">
        <div className="text-center">
          <BrandMark className="mx-auto mb-3 h-12 w-12 text-2xl animate-pulse" />
          <p className="text-[10px] tracking-widest uppercase t-text-3 sm:text-xs">Memuat</p>
        </div>
      </div>
    );
  }

  // Belum login — tampilkan landing page LANGSUNG di sini (bukan client-side
  // redirect ke /landing) supaya tidak ada jeda loading/flash sebelum
  // konten muncul.
  if (!user || !tenant) return <LandingPage />;

  return (
    <div className="min-h-screen t-bg-base safe-top safe-bottom">
      {/* Top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b t-border px-3 py-2.5 backdrop-blur-md sm:px-4"
        style={{ background: "color-mix(in srgb, var(--bg-card) 82%, transparent)" }}>
        <div className="flex items-center gap-2.5">
          <BrandMark className="h-8 w-8 text-base" />
          <span className="font-display max-w-[130px] truncate text-base font-semibold leading-none t-text-1 sm:max-w-none sm:text-lg">{tenant.nama_toko}</span>
          <span className="hidden rounded-full t-gold-soft px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide t-gold sm:inline-block">
            {tenant.plan}
          </span>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-1.5 rounded-lg border t-border px-2.5 py-1.5 text-[11px] t-text-2 t-bg-hover transition"
          >
            <span className="max-w-[60px] truncate sm:max-w-none">{user.nama}</span>
            <i className="ti ti-chevron-down text-[8px]" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-md border t-border-md t-bg-card shadow-lg">
              <div className="border-b t-border px-3 py-2">
                <div className="text-xs font-medium">{user.nama}</div>
                <div className="text-[9px] t-text-4">{user.email}</div>
                <div className="mt-1 rounded-full t-gold-soft px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide t-gold inline-block">
                  {tenant.plan}
                </div>
              </div>
              <button
                onClick={() => { setShowMenu(false); router.push("/dashboard"); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs t-text-2 t-bg-hover"
              >
                <i className="ti ti-dashboard text-[10px]" /> Dashboard
              </button>
              <button
                onClick={() => { toggle(); setShowMenu(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs t-text-3 t-bg-hover"
              >
                <i className={`ti ${theme === 'dark' ? 'ti-sun' : 'ti-moon'} text-[10px]`} />
                {theme === 'dark' ? 'Tema Putih' : 'Tema Hitam'}
              </button>
              <button
                onClick={() => { setShowMenu(false); logout(); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400 t-bg-hover"
              >
                <i className="ti ti-logout text-[10px]" /> Keluar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
      )}

      {/* Main POS */}
      <PosPerhiasan />

      {/* Bottom Nav — mobile only */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t t-border backdrop-blur-md sm:hidden safe-bottom"
        style={{ background: "color-mix(in srgb, var(--bg-card) 88%, transparent)" }}>
        <div className="flex">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium t-gold">
            <span className="absolute top-0 h-0.5 w-8 rounded-full" style={{ background: "var(--gold)" }} />
            <i className="ti ti-point-of-sale text-base" />
            <span>POS</span>
          </button>
          <button onClick={() => router.push("/dashboard")}
            className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] t-text-3 transition hover:t-text-1">
            <i className="ti ti-dashboard text-base" />
            <span>Dashboard</span>
          </button>
          <button onClick={() => router.push("/laporan")}
            className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] t-text-3 transition hover:t-text-1">
            <i className="ti ti-chart-bar text-base" />
            <span>Laporan</span>
          </button>
        </div>
      </div>
    </div>
  );
}