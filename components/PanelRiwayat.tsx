"use client";
import { LOGAM, formatIDR } from "@/lib/logam";

export default function PanelRiwayat({ riwayat, onRefresh }: { riwayat: any[]; onRefresh: () => void }) {
  const totalJual = riwayat.filter(r => r.tipe === "jual").reduce((a, b) => a + (b.total || 0), 0);
  const totalBuyback = riwayat.filter(r => r.tipe === "buyback").reduce((a, b) => a + (b.total || 0), 0);

  function exportCSV() {
    const rows = [["No Transaksi", "Tipe", "Nama", "Produk", "Berat", "Total", "Bayar", "Tanggal"]];
    riwayat.forEach((r) => {
      rows.push([r.no_transaksi || "", r.tipe, r.nama_pihak || "", r.jenis_produk || "", String(r.berat_gram), String(r.total || 0), String(r.bayar || 0), r.created_at?.slice(0, 10) || ""]);
    });
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transaksi_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (riwayat.length === 0) {
    return (
      <div className="py-12 text-center">
        <i className="ti ti-receipt mb-2 block text-3xl text-gray-300" />
        <p className="text-xs t-text-4">Belum ada transaksi hari ini</p>
        <button onClick={onRefresh} className="mt-3 text-xs text-amber-500 underline">Refresh</button>
      </div>
    );
  }

  return (
    <div>
      {/* Rekap */}
      <div className="mb-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg border t-border t-bg-card p-2.5 text-center">
          <div className="text-[10px] t-text-3">Transaksi</div>
          <div className="text-lg font-bold t-text-1">{riwayat.length}</div>
        </div>
        <div className="rounded-lg border border-green-100 bg-green-50 p-2.5 text-center">
          <div className="text-[10px] text-green-600">Total Jual</div>
          <div className="text-xs font-bold text-green-700">{formatIDR(totalJual)}</div>
        </div>
        <div className="rounded-lg border border-orange-100 bg-orange-50 p-2.5 text-center">
          <div className="text-[10px] text-orange-600">Total Buyback</div>
          <div className="text-xs font-bold text-orange-700">{formatIDR(totalBuyback)}</div>
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider t-text-3">
          {riwayat.length} transaksi hari ini
        </span>
        <div className="flex gap-1">
          <button onClick={exportCSV} className="rounded-md border t-border px-2 py-1 text-[10px] t-text-3 t-bg-hover">
            <i className="ti ti-table-export mr-1" />CSV
          </button>
          <button onClick={onRefresh} className="rounded-md border t-border px-2 py-1 text-[10px] t-text-3 t-bg-hover">
            <i className="ti ti-refresh mr-1" />Refresh
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        {riwayat.map((r, i) => {
          const lg = LOGAM[r.logam_id] || LOGAM.emas;
          return (
            <div key={r.id || i} className="flex items-center justify-between rounded-lg border t-border t-bg-card p-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full"
                  style={{ background: r.tipe === "jual" ? "#dcfce7" : "#fef3c7" }}>
                  <i className={`ti ${r.tipe === "jual" ? "ti-arrow-up text-green-600" : "ti-arrow-down text-amber-600"} text-xs`} />
                </div>
                <div>
                  <div className="text-xs font-medium t-text-2">
                    {r.jenis_produk || r.kadar_label} · {r.berat_gram}g
                  </div>
                  <div className="text-[10px] t-text-4">
                    {r.nama_pihak} · {r.no_transaksi} ·{" "}
                    {new Date(r.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold" style={{ color: lg.accent }}>{formatIDR(r.total)}</div>
                <div className="rounded-full px-1.5 py-0.5 text-[9px] font-medium"
                  style={{
                    background: r.tipe === "jual" ? "#dcfce7" : "#fef3c7",
                    color: r.tipe === "jual" ? "#16a34a" : "#d97706",
                  }}>
                  {r.tipe}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
