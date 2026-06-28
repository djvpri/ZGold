"use client";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PosPerhiasan from "@/components/PosPerhiasan";

export default function Home() {
  const { user, tenant, loading, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/landing");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center t-bg-base">
        <div className="text-center">
          <div className="mb-2 text-3xl sm:text-4xl">💎</div>
          <p className="text-[10px] t-text-3 sm:text-xs">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user || !tenant) return null;

  return (
    <div className="min-h-screen t-bg-base safe-top safe-bottom">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b t-border px-3 py-2 sm:px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">💎</span>
          <span className="max-w-[100px] truncate text-xs t-text-2 sm:max-w-none">{tenant.nama_toko}</span>
          <span className="hidden rounded-full t-bg-muted px-1.5 py-0.5 text-[9px] t-text-3 sm:inline-block">
            {tenant.plan}
          </span>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-1 rounded px-2 py-1 text-[10px] t-text-3 t-bg-hover"
          >
            <span className="max-w-[60px] truncate sm:max-w-none">{user.nama}</span>
            <i className="ti ti-chevron-down text-[8px]" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-md border t-border-md t-bg-card shadow-lg">
              <div className="border-b t-border px-3 py-2">
                <div className="text-xs font-medium">{user.nama}</div>
                <div className="text-[9px] t-text-4">{user.email}</div>
                <div className="mt-1 rounded-full t-bg-muted px-1.5 py-0.5 text-[9px] t-text-3 inline-block">
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
    </div>
  );
}