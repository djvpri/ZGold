"use client";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import PosPerhiasan from "@/components/PosPerhiasan";

export default function Home() {
  const { user, tenant, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/landing");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <div className="text-center">
          <div className="mb-2 text-4xl">💎</div>
          <p className="text-xs text-neutral-400">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user || !tenant) return null;

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm">💎</span>
          <span className="text-xs text-neutral-300">{tenant.nama_toko}</span>
          <span className="rounded-full bg-neutral-800 px-1.5 py-0.5 text-[9px] text-neutral-400">
            {tenant.plan}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {(user.role === "owner" || user.role === "admin") && (
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded px-2 py-1 text-[10px] text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
            >
              Dashboard
            </button>
          )}
          <span className="text-[10px] text-neutral-500">{user.nama} · {user.role}</span>
          <button
            onClick={logout}
            className="rounded px-2 py-1 text-[10px] text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
          >
            Keluar
          </button>
        </div>
      </div>

      {/* Main POS */}
      <PosPerhiasan />
    </div>
  );
}