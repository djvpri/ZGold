"use client";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface DashboardStats {
  transaksiHariIni: number;
  totalPenjualan: number;
  totalBuyback: number;
  produkCount: number;
  userCount: number;
}

export default function DashboardPage() {
  const { user, tenant, loading, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "settings">("overview");
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/landing");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (tenant) fetchStats();
  }, [tenant]);

  async function fetchStats() {
    try {
      const [trxRes, produkRes] = await Promise.all([
        fetch("/api/transaksi"),
        fetch("/api/produk"),
      ]);
      const trxData = await trxRes.json();
      const produkData = await produkRes.json();
      const riwayat = trxData.data || [];
      setStats({
        transaksiHariIni: riwayat.length,
        totalPenjualan: riwayat.filter((r: any) => r.tipe === "jual").reduce((a: number, b: any) => a + b.total, 0),
        totalBuyback: riwayat.filter((r: any) => r.tipe === "buyback").reduce((a: number, b: any) => a + b.total, 0),
        produkCount: (produkData.data || []).length,
        userCount: 1,
      });
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-2 text-3xl">💎</div>
          <p className="text-[10px] text-gray-500">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user || !tenant) return null;

  function formatIDR(n: number) {
    return "Rp " + n.toLocaleString("id-ID");
  }

  const navItems = [
    { id: "overview", icon: "ti-dashboard", label: "Overview" },
    { id: "pos", icon: "ti-point-of-sale", label: "POS", href: "/" },
    { id: "laporan", icon: "ti-chart-bar", label: "Laporan", href: "/laporan" },
    { id: "users", icon: "ti-users", label: "Kelola Kasir", href: "/dashboard/users" },
    { id: "settings", icon: "ti-settings", label: "Pengaturan" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 safe-top safe-bottom">
      {/* Mobile header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 sm:hidden">
        <button onClick={() => setShowSidebar(!showSidebar)} className="rounded p-1 text-gray-500 hover:bg-gray-100">
          <i className="ti ti-menu-2 text-lg" />
        </button>
        <span className="text-xs font-medium">{tenant.nama_toko}</span>
        <button onClick={() => router.push("/")} className="rounded p-1 text-gray-500 hover:bg-gray-100">
          <i className="ti ti-point-of-sale text-lg" />
        </button>
      </div>

      {/* Sidebar overlay (mobile) */}
      {showSidebar && (
        <div className="fixed inset-0 z-40 bg-black/50 sm:hidden" onClick={() => setShowSidebar(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 z-50 h-full w-56 border-r border-gray-200 bg-gray-50 p-3 transition-transform sm:translate-x-0 ${showSidebar ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Logo - desktop */}
        <div className="mb-6 hidden items-center gap-2 sm:flex">
          <span className="text-lg">💎</span>
          <span className="text-xs font-medium">{tenant.nama_toko}</span>
        </div>
        {/* Logo - mobile close button */}
        <div className="mb-4 flex items-center justify-between sm:hidden">
          <div className="flex items-center gap-2">
            <span className="text-lg">💎</span>
            <span className="text-xs font-medium">Menu</span>
          </div>
          <button onClick={() => setShowSidebar(false)} className="rounded p-1 text-gray-500">
            <i className="ti ti-x text-lg" />
          </button>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) =>
            item.href ? (
              <button
                key={item.id}
                onClick={() => { setShowSidebar(false); router.push(item.href!); }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                <i className={`ti ${item.icon} text-sm`} />
                {item.label}
              </button>
            ) : (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id as any); setShowSidebar(false); }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs transition sm:py-1.5"
                style={{
                  background: activeTab === item.id ? "rgb(38 38 38)" : "transparent",
                  color: activeTab === item.id ? "#e5e5e5" : "#a3a3a3",
                }}
              >
                <i className={`ti ${item.icon} text-sm`} />
                {item.label}
              </button>
            )
          )}
        </nav>

        <div className="absolute bottom-3 left-3 right-3">
          <div className="mb-1 text-[10px] text-neutral-600">
            {user.nama} · {user.role}
          </div>
          <div className="mb-2">
            <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] text-gray-500">
              {tenant.plan}
            </span>
          </div>
          <button
            onClick={logout}
            className="w-full rounded-md px-2 py-1.5 text-left text-[10px] text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <i className="ti ti-logout mr-1" /> Keluar
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:ml-56 sm:p-6">
        <h1 className="mb-4 text-sm font-medium">
          {activeTab === "overview" && "Dashboard Overview"}
          {activeTab === "users" && "Manajemen Pengguna"}
          {activeTab === "settings" && "Pengaturan Toko"}
        </h1>

        {activeTab === "overview" && stats && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="text-[9px] text-gray-400 sm:text-[10px]">Transaksi Hari Ini</div>
              <div className="mt-1 text-base font-medium sm:text-lg">{stats.transaksiHariIni}</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="text-[9px] text-gray-400 sm:text-[10px]">Total Penjualan</div>
              <div className="mt-1 text-sm font-medium text-green-400 sm:text-lg">{formatIDR(stats.totalPenjualan)}</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="text-[9px] text-gray-400 sm:text-[10px]">Total Buyback</div>
              <div className="mt-1 text-sm font-medium text-amber-400 sm:text-lg">{formatIDR(stats.totalBuyback)}</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="text-[9px] text-gray-400 sm:text-[10px]">Total Produk</div>
              <div className="mt-1 text-base font-medium sm:text-lg">{stats.produkCount}</div>
            </div>
          </div>
        )}

        {activeTab === "overview" && !stats && (
          <div className="py-8 text-center text-[10px] text-gray-400 sm:text-xs">Memuat data...</div>
        )}

        {activeTab === "users" && (
          <div className="rounded-lg border border-gray-200 p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium">Daftar Pengguna</span>
              <button className="rounded-md bg-amber-600 px-2 py-1 text-[10px] text-white hover:bg-amber-700 sm:px-3">
                + Tambah
              </button>
            </div>
            <div className="text-xs text-gray-400">
              <div className="flex items-center justify-between border-b border-gray-200 py-2">
                <div>
                  <div className="font-medium text-gray-700">{user.nama}</div>
                  <div className="text-[10px]">{user.email}</div>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px]">{user.role}</span>
              </div>
            </div>
            <p className="mt-3 text-[10px] text-neutral-600">
              Fitur multi-user tersedia di paket Pro dan Enterprise.
            </p>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-3 sm:space-y-4">
            <div className="rounded-lg border border-gray-200 p-3 sm:p-4">
              <div className="mb-3 text-xs font-medium">Informasi Toko</div>
              <div className="space-y-2">
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                  <label className="text-[10px] text-gray-400 sm:min-w-[100px]">Nama Toko</label>
                  <span className="text-xs">{tenant.nama_toko}</span>
                </div>
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                  <label className="text-[10px] text-gray-400 sm:min-w-[100px]">URL</label>
                  <span className="text-xs">zomet.id/{tenant.slug}</span>
                </div>
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                  <label className="text-[10px] text-gray-400 sm:min-w-[100px]">Paket</label>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px]">{tenant.plan}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-3 sm:p-4">
              <div className="mb-3 text-xs font-medium">Paket & Langganan</div>
              <p className="text-[10px] text-gray-400">
                Upgrade ke paket Pro atau Enterprise untuk fitur lebih lengkap.
              </p>
              <button className="mt-2 rounded-md bg-amber-600 px-3 py-1.5 text-[10px] text-white hover:bg-amber-700">
                Upgrade Paket
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}