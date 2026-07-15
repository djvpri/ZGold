"use client";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

interface DashboardStats {
  transaksiHariIni: number;
  totalPenjualan: number;
  totalBuyback: number;
  produkCount: number;
}

function DashboardContent() {
  const { user, tenant } = useAuth();
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "settings">(
    tabParam === "settings" ? "settings" : "overview"
  );
  const [notaFormat, setNotaFormat] = useState<"thermal" | "plq35">("thermal");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("zgold_nota_format");
      if (saved === "plq35" || saved === "thermal") setNotaFormat(saved);
    }
  }, []);

  useEffect(() => {
    if (tabParam === "settings") setActiveTab("settings");
    else if (tabParam === "overview" || !tabParam) setActiveTab("overview");
  }, [tabParam]);

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
      });
    } catch {}
  }

  function gantiNotaFormat(fmt: "thermal" | "plq35") {
    setNotaFormat(fmt);
    localStorage.setItem("zgold_nota_format", fmt);
  }

  function formatIDR(n: number | string | null | undefined) {
    const num = typeof n === "string" ? parseFloat(n) : Number(n ?? 0);
    if (isNaN(num)) return "Rp 0";
    return "Rp " + Math.round(num).toLocaleString("id-ID");
  }

  if (!user || !tenant) return null;

  return (
    <div className="p-4 sm:p-6">
      <h1 className="font-display mb-4 text-2xl font-semibold sm:text-3xl">
        {activeTab === "overview" && "Dashboard"}
        {activeTab === "settings" && "Pengaturan Toko"}
      </h1>

      {/* Tab navigation */}
      <div className="mb-4 flex gap-1 border-b t-border">
        <button
          onClick={() => { setActiveTab("overview"); router.replace("/dashboard"); }}
          className={`px-3 py-2 text-xs font-medium transition border-b-2 -mb-px ${activeTab === "overview" ? "t-gold border-current" : "t-text-3 border-transparent t-bg-hover"}`}
        >
          Overview
        </button>
        <button
          onClick={() => { setActiveTab("settings"); router.replace("/dashboard?tab=settings"); }}
          className={`px-3 py-2 text-xs font-medium transition border-b-2 -mb-px ${activeTab === "settings" ? "t-gold border-current" : "t-text-3 border-transparent t-bg-hover"}`}
        >
          Pengaturan
        </button>
      </div>

      {/* User info bar */}
      <div className="t-card mb-4 flex items-center gap-3 rounded-xl border t-border px-4 py-3">
        <div className="brand-mark flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white">
          {user.nama?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div className="flex-1 text-xs">
          <div className="font-medium">{user.nama}</div>
          <div className="text-[10px] t-text-4">{user.email}</div>
        </div>
        <span
          className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white"
          style={{ background: user.role === "admin" ? "#059669" : "var(--gold)" }}
        >
          {user.role}
        </span>
        <button
          onClick={toggle}
          className="rounded p-1.5 t-text-3 t-bg-hover"
          title="Ganti tema"
        >
          <i className={`ti ${theme === "dark" ? "ti-sun" : "ti-moon"} text-sm`} />
        </button>
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
                <span className="rounded-full t-bg-muted px-2 py-0.5 text-[10px]">
                  {tenant.plan}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border t-border p-3 sm:p-4">
            <div className="mb-3 text-xs font-medium">Paket &amp; Langganan</div>
            <p className="text-[10px] t-text-4">
              Upgrade ke paket Pro atau Enterprise untuk fitur lebih lengkap.
            </p>
            <button className="btn-gold mt-2 rounded-lg px-3 py-1.5 text-[10px] font-medium">
              Upgrade Paket
            </button>
          </div>

          {/* Model Nota */}
          <div className="rounded-lg border t-border p-3 sm:p-4">
            <div className="mb-3 text-xs font-medium">Model Nota</div>
            <div className="flex gap-2">
              <button
                onClick={() => gantiNotaFormat("thermal")}
                className={`flex-1 rounded-xl border-2 p-3 text-left transition ${
                  notaFormat === "thermal" ? "t-gold-border t-gold-soft" : "t-border"
                }`}
              >
                <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                  <i className={`ti ti-receipt ${notaFormat === "thermal" ? "t-gold" : "t-text-3"}`} />
                  Thermal
                </div>
                <div className="mt-1 text-[9px] t-text-4">58mm · Portrait</div>
                <div className="mt-0.5 text-[9px] t-text-4">Printer Bluetooth</div>
              </button>
              <button
                onClick={() => gantiNotaFormat("plq35")}
                className={`flex-1 rounded-xl border-2 p-3 text-left transition ${
                  notaFormat === "plq35" ? "t-gold-border t-gold-soft" : "t-border"
                }`}
              >
                <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                  <i className={`ti ti-file-invoice ${notaFormat === "plq35" ? "t-gold" : "t-text-3"}`} />
                  PLQ-35
                </div>
                <div className="mt-1 text-[9px] t-text-4">21×11.5cm · Landscape</div>
                <div className="mt-0.5 text-[9px] t-text-4">Dot Matrix Passbook</div>
              </button>
            </div>
            <p className="mt-2 text-[9px] t-text-4">
              {notaFormat === "thermal"
                ? "Nota kecil untuk printer thermal Bluetooth (58mm)."
                : "Nota lebar untuk printer Epson PLQ-35 (21×11.5cm)."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: string;
  label: string;
  value: string;
  tone: "ink" | "green" | "gold";
}) {
  const color =
    tone === "green" ? "#16a34a" : tone === "gold" ? "var(--gold)" : "var(--text-1)";
  const accent =
    tone === "green" ? "#16a34a" : tone === "gold" ? "var(--gold)" : "var(--border-md)";
  return (
    <div className="t-card relative overflow-hidden rounded-xl border t-border p-4 transition hover:t-elev">
      <span
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: accent, opacity: 0.75 }}
      />
      <div className="flex items-start justify-between">
        <span className="pr-2 text-[10px] font-medium uppercase tracking-wide t-text-4">
          {label}
        </span>
        <span
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg t-bg-muted text-sm"
          style={{ color }}
        >
          <i className={`ti ${icon}`} />
        </span>
      </div>
      <div
        className="font-display mt-2 text-2xl font-semibold leading-tight sm:text-3xl"
        style={tone === "ink" ? undefined : { color }}
      >
        {value}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}
