"use client";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PosPerhiasan from "@/components/PosPerhiasan";

export default function Home() {
  const { user, tenant, loading, logout } = useAuth();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/landing");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-2 text-3xl sm:text-4xl">💎</div>
          <p className="text-[10px] text-gray-500 sm:text-xs">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user || !tenant) return null;

  return (
    <div className="min-h-screen bg-gray-50 safe-top safe-bottom">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 sm:px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">💎</span>
          <span className="max-w-[100px] truncate text-xs text-gray-700 sm:max-w-none">{tenant.nama_toko}</span>
          <span className="hidden rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] text-gray-500 sm:inline-block">
            {tenant.plan}
          </span>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-gray-500 hover:bg-gray-100"
          >
            <span className="max-w-[60px] truncate sm:max-w-none">{user.nama}</span>
            <i className="ti ti-chevron-down text-[8px]" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-md border border-gray-300 bg-white shadow-lg">
              <div className="border-b border-gray-200 px-3 py-2">
                <div className="text-xs font-medium">{user.nama}</div>
                <div className="text-[9px] text-gray-400">{user.email}</div>
                <div className="mt-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] text-gray-500 inline-block">
                  {tenant.plan}
                </div>
              </div>
              {(user.role === "admin") && (
                <button
                  onClick={() => { setShowMenu(false); router.push("/dashboard"); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                >
                  <i className="ti ti-dashboard text-[10px]" /> Dashboard
                </button>
              )}
              <button
                onClick={() => { setShowMenu(false); logout(); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-gray-100"
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