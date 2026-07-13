"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import BrandMark from "@/components/BrandMark";

function formatIDR(n: number | string | null | undefined) {
  const num = typeof n === "string" ? parseFloat(n) : Number(n ?? 0);
  if (isNaN(num)) return "Rp 0";
  return "Rp " + Math.round(num).toLocaleString("id-ID");
}

interface LaporanData {
  summary: {
    total_jual: number;
    total_buyback: number;
    jumlah_transaksi: number;
    avg_transaksi: number;
  };
  byLogam: {
    logam_id: string;
    logam_nama: string;
    total_jual: number;
    total_buyback: number;
    jumlah: number;
  }[];
  daily: {
    tanggal: string;
    total_jual: number;
    total_buyback: number;
    jumlah: number;
  }[];
  range: { from: string; to: string };
}

type Preset = "today" | "7days" | "30days" | "custom";

const LOGAM_COLORS: Record<string, string> = {
  emas: "#B8860B",
  perak: "#708090",
  platinum: "#5B6675",
  emasputih: "#A9A9A9",
  palladium: "#7B68EE",
};

export default function LaporanPage() {
  const { user, tenant, loading, logout } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<LaporanData | null>(null);
  const [preset, setPreset] = useState<Preset>("30days");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/landing");
  }, [user, loading, router]);

  useEffect(() => {
    fetchLaporan();
  }, [preset, customFrom, customTo]);

  function getDateRange(): { from: string; to: string } {
    const today = new Date();
    const to = today.toISOString().slice(0, 10);
    const d = new Date(today);

    switch (preset) {
      case "today":
        return { from: to, to };
      case "7days":
        d.setDate(d.getDate() - 7);
        return { from: d.toISOString().slice(0, 10), to };
      case "30days":
        d.setDate(d.getDate() - 30);
        return { from: d.toISOString().slice(0, 10), to };
      case "custom":
        return { from: customFrom, to: customTo };
      default:
        return { from: to, to };
    }
  }

  async function fetchLaporan() {
    try {
      const { from, to } = getDateRange();
      if (preset === "custom" && (!from || !to)) return;
      const res = await fetch(`/api/laporan?from=${from}&to=${to}`);
      const d = await res.json();
      setData(d);
    } catch {}
  }

  function exportCSV() {
    if (!data) return;
    const { from, to } = getDateRange();
    const rows = [["Tanggal", "Penjualan", "Buyback", "Jumlah Transaksi"]];
    data.daily.forEach((d) => {
      rows.push([d.tanggal, d.total_jual.toString(), d.total_buyback.toString(), d.jumlah.toString()]);
    });
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan_${from}_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function cetakPDF() {
    if (!data || !tenant) return;
    const { from, to } = getDateRange();
    const { jsPDF } = require("jspdf");
    require("jspdf-autotable");
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    // Title
    doc.setFontSize(14);
    doc.text("Laporan Penjualan", 14, 20);
    doc.setFontSize(9);
    doc.text(tenant.nama_toko, 14, 26);
    doc.text(`Periode: ${from} s/d ${to}`, 14, 31);

    // Summary
    doc.setFontSize(10);
    doc.text(`Total Penjualan: ${formatIDR(data.summary.total_jual)}`, 14, 39);
    doc.text(`Total Buyback: ${formatIDR(data.summary.total_buyback)}`, 14, 45);
    doc.text(`Jumlah Transaksi: ${data.summary.jumlah_transaksi}`, 14, 51);
    doc.text(`Rata-rata: ${formatIDR(data.summary.avg_transaksi)}`, 14, 57);

    // Daily table
    const headers = [["Tanggal", "Penjualan", "Buyback", "Trx"]];
    const body = data.daily.map((d) => [
      new Date(d.tanggal).toLocaleDateString("id-ID"),
      formatIDR(d.total_jual),
      formatIDR(d.total_buyback),
      String(d.jumlah),
    ]);
    (doc as any).autoTable({
      startY: 62,
      head: headers,
      body,
      theme: "striped",
      headStyles: { fillColor: [184, 134, 11] },
    });

    // By logam
    if (data.byLogam.length > 0) {
      const finalY = (doc as any).lastAutoTable?.finalY || 62;
      doc.text("Breakdown per Logam", 14, finalY + 12);
      const logamHeaders = [["Logam", "Penjualan", "Buyback", "Trx"]];
      const logamBody = data.byLogam.map((l) => [
        l.logam_nama,
        formatIDR(l.total_jual),
        formatIDR(l.total_buyback),
        String(l.jumlah),
      ]);
      (doc as any).autoTable({
        startY: finalY + 16,
        head: logamHeaders,
        body: logamBody,
        theme: "striped",
        headStyles: { fillColor: [100, 100, 100] },
      });
    }

    doc.save(`laporan_${from}_${to}.pdf`);
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center t-bg-base">
        <div className="text-center">
          <BrandMark className="mx-auto mb-3 h-12 w-12 text-2xl animate-pulse" />
          <p className="text-[10px] tracking-widest uppercase t-text-3">Memuat</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: "dashboard", icon: "ti-dashboard", label: "Dashboard", href: "/dashboard" },
    { id: "pos", icon: "ti-point-of-sale", label: "POS", href: "/" },
    { id: "laporan", icon: "ti-chart-bar", label: "Laporan" },
  ];

  return (
    <div className="min-h-screen t-bg-base t-text-1">
      {/* Mobile header */}
      <div className="flex items-center justify-between border-b t-border px-3 py-2 sm:hidden">
        <button onClick={() => setShowSidebar(!showSidebar)} className="rounded p-1 t-text-3 t-bg-hover">
          <i className="ti ti-menu-2 text-lg" />
        </button>
        <span className="text-xs font-medium">Laporan Penjualan</span>
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
        <div className="mb-6 hidden items-center gap-2.5 sm:flex">
          <BrandMark className="h-8 w-8 text-base" />
          <span className="font-display truncate text-base font-semibold">{tenant?.nama_toko ?? "Zomet POS"}</span>
        </div>
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
                onClick={() => setShowSidebar(false)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 t-gold-soft text-xs font-medium t-gold"
              >
                <i className={`ti ${item.icon} text-sm`} />
                {item.label}
              </button>
            )
          )}
        </nav>
        <div className="absolute bottom-3 left-3 right-3">
          <button
            onClick={logout}
            className="flex w-full items-center rounded-lg px-2.5 py-2 text-left text-[10px] t-text-3 t-bg-hover transition"
          >
            <i className="ti ti-logout mr-1" /> Keluar
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3 sm:ml-56 sm:p-6">
        <h1 className="font-display mb-1 flex items-center gap-2 text-2xl font-semibold sm:text-3xl">
          <i className="ti ti-chart-bar t-gold text-xl" />
          Laporan Penjualan
        </h1>
        <p className="mb-4 text-[10px] uppercase tracking-[0.15em] t-text-4 sm:text-[11px]">Rekap jual &amp; buyback</p>

        {/* Date Filter */}
        <div className="mb-4 flex flex-wrap gap-1.5 sm:gap-2">
          {(["today", "7days", "30days", "custom"] as Preset[]).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className="rounded-full px-3.5 py-1.5 text-[11px] font-medium transition sm:text-xs"
              style={{
                background: preset === p ? "var(--gold)" : "transparent",
                color: preset === p ? "var(--on-gold)" : "var(--text-3)",
                border: preset === p ? "1px solid transparent" : "1px solid var(--border-md)",
              }}
            >
              {p === "today" && "Hari Ini"}
              {p === "7days" && "7 Hari"}
              {p === "30days" && "30 Hari"}
              {p === "custom" && "Custom"}
            </button>
          ))}
          {preset === "custom" && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-md border t-border-md t-bg-card px-2 py-1 text-[11px] t-text-2 sm:text-xs"
              />
              <span className="text-[10px] t-text-4">s/d</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-md border t-border-md t-bg-card px-2 py-1 text-[11px] t-text-2 sm:text-xs"
              />
            </div>
          )}
        </div>

        {/* Date range display */}
        {data && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <p className="text-[10px] t-text-4 sm:text-xs">{data.range.from} s/d {data.range.to}</p>
            <div className="ml-auto flex gap-1.5">
              <button onClick={cetakPDF} className="t-gold-soft t-gold flex items-center gap-1 rounded-lg border t-gold-border px-3 py-1.5 text-[10px] font-medium transition hover:brightness-105">
                <i className="ti ti-file-text" />PDF
              </button>
              <button onClick={exportCSV} className="flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-medium text-emerald-500 transition hover:bg-emerald-500/20">
                <i className="ti ti-table-export" />CSV
              </button>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {data && (
          <div className="mb-6 grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4">
            <SummaryCard icon="ti-trending-up" label="Total Penjualan" value={formatIDR(data.summary.total_jual)} color="#16a34a" />
            <SummaryCard icon="ti-recharging" label="Total Buyback" value={formatIDR(data.summary.total_buyback)} color="var(--gold)" />
            <SummaryCard icon="ti-receipt-2" label="Transaksi" value={String(data.summary.jumlah_transaksi)} color="var(--text-1)" />
            <SummaryCard icon="ti-scale" label="Rata-rata" value={formatIDR(data.summary.avg_transaksi)} color="var(--gold)" />
          </div>
        )}

        {/* Breakdown by Logam */}
        {data && data.byLogam.length > 0 && (
          <div className="t-card mb-6 rounded-xl border t-border p-3 sm:p-4">
            <h3 className="font-display mb-3 text-base font-semibold sm:text-lg">Breakdown per Logam</h3>
            <div className="space-y-2">
              {data.byLogam.map((item) => (
                <div key={item.logam_id} className="flex items-center justify-between border-b t-border pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: LOGAM_COLORS[item.logam_id] ?? "#666" }}
                    />
                    <span className="text-xs sm:text-sm">{item.logam_nama}</span>
                    <span className="text-[10px] t-text-4">({item.jumlah} trx)</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-green-400 sm:text-xs">{formatIDR(item.total_jual)}</div>
                    {item.total_buyback > 0 && (
                      <div className="text-[9px] t-gold">BB: {formatIDR(item.total_buyback)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily Totals Table */}
        {data && data.daily.length > 0 && (
          <div className="t-card rounded-xl border t-border p-3 sm:p-4">
            <h3 className="font-display mb-3 text-base font-semibold sm:text-lg">Total Harian</h3>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b t-border text-left t-text-4">
                    <th className="pb-2 pr-4">Tanggal</th>
                    <th className="pb-2 pr-4 text-right">Penjualan</th>
                    <th className="pb-2 pr-4 text-right">Buyback</th>
                    <th className="pb-2 text-right">Jumlah Trx</th>
                  </tr>
                </thead>
                <tbody>
                  {data.daily.map((d) => (
                    <tr key={d.tanggal} className="border-b t-border last:border-0">
                      <td className="py-2 pr-4 t-text-2">
                        {new Date(d.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="py-2 pr-4 text-right text-green-400">{formatIDR(d.total_jual)}</td>
                      <td className="py-2 pr-4 text-right t-gold">{formatIDR(d.total_buyback)}</td>
                      <td className="py-2 text-right t-text-3">{d.jumlah}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="space-y-2 sm:hidden">
              {data.daily.map((d) => (
                <div key={d.tanggal} className="rounded-lg t-bg-card p-2.5">
                  <div className="mb-1 text-[10px] t-text-4">
                    {new Date(d.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-green-400">Jual: {formatIDR(d.total_jual)}</span>
                    <span className="t-gold">BB: {formatIDR(d.total_buyback)}</span>
                  </div>
                  <div className="text-[10px] t-text-4">{d.jumlah} transaksi</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {data && data.daily.length === 0 && (
          <div className="t-card rounded-xl border t-border py-10 text-center">
            <i className="ti ti-chart-bar-off mb-2 block text-3xl t-text-4" />
            <p className="text-[10px] t-text-4 sm:text-xs">Belum ada transaksi di periode ini</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  const isInk = color === "var(--text-1)";
  return (
    <div className="t-card relative overflow-hidden rounded-xl border t-border p-3 transition hover:t-elev sm:p-4">
      <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: isInk ? "var(--border-md)" : color, opacity: 0.75 }} />
      <div className="flex items-start justify-between">
        <span className="pr-2 text-[9px] font-medium uppercase tracking-wide t-text-4 sm:text-[10px]">{label}</span>
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg t-bg-muted text-[13px]" style={{ color }}>
          <i className={`ti ${icon}`} />
        </span>
      </div>
      <div className="font-display mt-1.5 text-lg font-semibold leading-tight sm:text-2xl" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
