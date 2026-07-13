"use client";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BrandMark from "@/components/BrandMark";

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
  const [notaFormat, setNotaFormat] = useState<"thermal" | "plq35">("thermal");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zgold_nota_format');
      if (saved === 'plq35' || saved === 'thermal') setNotaFormat(saved);
    }
  }, []);

  function gantiNotaFormat(fmt: "thermal" | "plq35") {
    setNotaFormat(fmt);
    localStorage.setItem('zgold_nota_format', fmt);
  }

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
      const [trxRes, produkRes, laporanRes] = await Promise.all([
        fetch("/api/transaksi"),
        fetch("/api/produk"),
        fetch("/api/laporan?from=2020-01-01&to=" + new Date().toISOString().slice(0, 10)),
      ]);
      const trxData = await trxRes.json();
      const produkData = await produkRes.json();
      const laporanData = await laporanRes.json();
      const riwayat = trxData.data || [];
      const summary = laporanData.summary || {};
      setStats({
        transaksiHariIni: riwayat.length,
        totalPenjualan: summary.total_jual || 0,
        totalBuyback: summary.total_buyback || 0,
        produkCount: (produkData.data || []).length,
        userCount: 1,
      });
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center t-bg-base">
        <div className="text-center">
          <BrandMark className="mx-auto mb-3 h-12 w-12 text-2xl animate-pulse" />
          <p className="text-[10px] tracking-widest uppercase t-text-3">Memuat</p>
        </div>
      </div>
    );
  }

  if (!user || !tenant) return null;

  function formatIDR(n: number | string | null | undefined) {
    const num = typeof n === "string" ? parseFloat(n) : Number(n ?? 0);
    if (isNaN(num)) return "Rp 0";
    return "Rp " + Math.round(num).toLocaleString("id-ID");
  }

  const navItems = [
    { id: "overview", icon: "ti-dashboard", label: "Overview" },
    { id: "pos", icon: "ti-point-of-sale", label: "POS", href: "/" },
    { id: "laporan", icon: "ti-chart-bar", label: "Laporan", href: "/laporan" },
    { id: "users", icon: "ti-users", label: "Kelola Kasir", href: "/dashboard/users" },
    { id: "settings", icon: "ti-settings", label: "Pengaturan" },
  ];

  return (
    <div className="min-h-screen t-bg-base t-text-1 safe-top safe-bottom">
      {/* Mobile header */}
      <div className="flex items-center justify-between border-b t-border px-3 py-2 sm:hidden">
        <button onClick={() => setShowSidebar(!showSidebar)} className="rounded p-1 t-text-3 t-bg-hover">
          <i className="ti ti-menu-2 text-lg" />
        </button>
        <span className="text-xs font-medium">{tenant.nama_toko}</span>
        <button onClick={() => router.push("/")} className="rounded p-1 t-text-3 t-bg-hover">
          <i className="ti ti-point-of-sale text-lg" />
        </button>
      </div>

      {/* Sidebar overlay (mobile) */}
      {showSidebar && (
        <div className="fixed inset-0 z-40 bg-black/50 sm:hidden" onClick={() => setShowSidebar(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 z-50 h-full w-56 border-r t-border t-bg-base p-3 transition-transform sm:translate-x-0 ${showSidebar ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Logo - desktop */}
        <div className="mb-6 hidden items-center gap-2.5 sm:flex">
          <BrandMark className="h-8 w-8 text-base" />
          <span className="font-display truncate text-base font-semibold">{tenant.nama_toko}</span>
        </div>
        {/* Logo - mobile close button */}
        <div className="mb-4 flex items-center justify-between sm:hidden">
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-8 w-8 text-base" />
            <span className="font-display text-base font-semibold">Menu</span>
          </div>
          <button onClick={() => setShowSidebar(false)} className="rounded p-1 t-text-3">
            <i className="ti ti-x text-lg" />
          </button>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) =>
            item.href ? (
              <button
                key={item.id}
                onClick={() => { setShowSidebar(false); router.push(item.href!); }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs t-text-3 t-bg-hover transition"
              >
                <i className={`ti ${item.icon} text-sm`} />
                {item.label}
              </button>
            ) : (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id as any); setShowSidebar(false); }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition sm:py-2 ${
                  activeTab === item.id ? "t-gold-soft t-gold" : "t-text-3 t-bg-hover"
                }`}
              >
                <i className={`ti ${item.icon} text-sm`} />
                {item.label}
              </button>
            )
          )}
        </nav>

        <div className="absolute bottom-3 left-3 right-3">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] text-neutral-600">
            <span>{user.nama}</span>
            <span className="rounded px-1.5 py-0.5 text-[9px] font-medium text-white"
              style={{ background: user.role === "admin" ? "#059669" : "var(--gold)" }}>
              {user.role}
            </span>
          </div>
          <div className="mb-2">
            <span className="rounded-full t-bg-muted px-1.5 py-0.5 text-[9px] t-text-3">
              {tenant.plan}
            </span>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center rounded-lg px-2.5 py-2 text-left text-[10px] t-text-3 t-bg-hover transition"
          >
            <i className="ti ti-logout mr-1" /> Keluar
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:ml-56 sm:p-6">
        <h1 className="font-display mb-4 text-2xl font-semibold sm:text-3xl">
          {activeTab === "overview" && "Dashboard"}
          {activeTab === "users" && "Manajemen Pengguna"}
          {activeTab === "settings" && "Pengaturan Toko"}
        </h1>

        {/* User info bar — role visible */}
        <div className="t-card mb-4 flex items-center gap-3 rounded-xl border t-border px-4 py-3">
          <div className="brand-mark flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white">
            {user.nama?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 text-xs">
            <div className="font-medium">{user.nama}</div>
            <div className="text-[10px] t-text-4">{user.email}</div>
          </div>
          <span className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white"
            style={{ background: user.role === "admin" ? "#059669" : "var(--gold)" }}>
            {user.role}
          </span>
        </div>

        {activeTab === "overview" && stats && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard icon="ti-receipt-2" label="Transaksi Hari Ini" value={String(stats.transaksiHariIni)} tone="ink" />
            <StatCard icon="ti-trending-up" label="Total Penjualan" value={formatIDR(stats.totalPenjualan)} tone="green" />
            <StatCard icon="ti-recharging" label="Total Buyback" value={formatIDR(stats.totalBuyback)} tone="gold" />
            <StatCard icon="ti-diamond" label="Total Produk" value={String(stats.produkCount)} tone="ink" />
          </div>
        )}

        {activeTab === "overview" && !stats && (
          <div className="py-8 text-center text-[10px] t-text-4 sm:text-xs">Memuat data...</div>
        )}

        {activeTab === "users" && (
          <div className="rounded-lg border t-border p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium">Daftar Pengguna</span>
              <button className="btn-gold rounded-lg px-3 py-1.5 text-[10px] font-medium">
                + Tambah
              </button>
            </div>
            <div className="text-xs t-text-4">
              <div className="flex items-center justify-between border-b t-border py-2">
                <div>
                  <div className="font-medium t-text-2">{user.nama}</div>
                  <div className="text-[10px]">{user.email}</div>
                </div>
                <span className="rounded-full t-bg-muted px-2 py-0.5 text-[10px]">{user.role}</span>
              </div>
            </div>
            <p className="mt-3 text-[10px] text-neutral-600">
              Fitur multi-user tersedia di paket Pro dan Enterprise.
            </p>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-3 sm:space-y-4">
            <div className="rounded-lg border t-border p-3 sm:p-4">
              <div className="mb-3 text-xs font-medium">Informasi Toko</div>
              <div className="space-y-2">
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                  <label className="text-[10px] t-text-4 sm:min-w-[100px]">Nama Toko</label>
                  <span className="text-xs">{tenant.nama_toko}</span>
                </div>
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                  <label className="text-[10px] t-text-4 sm:min-w-[100px]">URL</label>
                  <span className="text-xs">zomet.id/{tenant.slug}</span>
                </div>
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                  <label className="text-[10px] t-text-4 sm:min-w-[100px]">Paket</label>
                  <span className="rounded-full t-bg-muted px-2 py-0.5 text-[10px]">{tenant.plan}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border t-border p-3 sm:p-4">
              <div className="mb-3 text-xs font-medium">Paket & Langganan</div>
              <p className="text-[10px] t-text-4">
                Upgrade ke paket Pro atau Enterprise untuk fitur lebih lengkap.
              </p>
              <button className="btn-gold mt-2 rounded-lg px-3 py-1.5 text-[10px] font-medium">
                Upgrade Paket
              </button>
            </div>

            {/* ⚙️ Model Nota */}
            <div className="rounded-lg border t-border p-3 sm:p-4">
              <div className="mb-3 text-xs font-medium">Model Nota</div>
              <div className="flex gap-2">
                <button onClick={() => gantiNotaFormat("thermal")}
                  className={`flex-1 rounded-xl border-2 p-3 text-left transition ${notaFormat === "thermal" ? "t-gold-border t-gold-soft" : "t-border"}`}>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold"><i className={`ti ti-receipt ${notaFormat === "thermal" ? "t-gold" : "t-text-3"}`} /> Thermal</div>
                  <div className="mt-1 text-[9px] t-text-4">58mm · Portrait</div>
                  <div className="mt-0.5 text-[9px] t-text-4">Printer Bluetooth</div>
                </button>
                <button onClick={() => gantiNotaFormat("plq35")}
                  className={`flex-1 rounded-xl border-2 p-3 text-left transition ${notaFormat === "plq35" ? "t-gold-border t-gold-soft" : "t-border"}`}>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold"><i className={`ti ti-file-invoice ${notaFormat === "plq35" ? "t-gold" : "t-text-3"}`} /> PLQ-35</div>
                  <div className="mt-1 text-[9px] t-text-4">21×11.5cm · Landscape</div>
                  <div className="mt-0.5 text-[9px] t-text-4">Dot Matrix Passbook</div>
                </button>
              </div>
              <p className="mt-2 text-[9px] t-text-4">
                {notaFormat === "thermal" ? "Nota kecil untuk printer thermal Bluetooth (58mm)." : "Nota lebar untuk printer Epson PLQ-35 (21×11.5cm)."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, tone }: {
  icon: string;
  label: string;
  value: string;
  tone: "ink" | "green" | "gold";
}) {
  const color = tone === "green" ? "#16a34a" : tone === "gold" ? "var(--gold)" : "var(--text-1)";
  const accent = tone === "green" ? "#16a34a" : tone === "gold" ? "var(--gold)" : "var(--border-md)";
  return (
    <div className="t-card relative overflow-hidden rounded-xl border t-border p-4 transition hover:t-elev">
      <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: accent, opacity: 0.75 }} />
      <div className="flex items-start justify-between">
        <span className="pr-2 text-[10px] font-medium uppercase tracking-wide t-text-4">{label}</span>
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg t-bg-muted text-sm" style={{ color }}>
          <i className={`ti ${icon}`} />
        </span>
      </div>
      <div className="font-display mt-2 text-2xl font-semibold leading-tight sm:text-3xl"
        style={tone === "ink" ? undefined : { color }}>
        {value}
      </div>
    </div>
  );
}