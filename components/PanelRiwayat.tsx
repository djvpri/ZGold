"use client";
import { LOGAM, formatIDR } from "@/lib/logam";

export default function PanelRiwayat({ riwayat }: { riwayat: any[] }) {
  if (!riwayat.length) {
    return (
      <div className="py-8 text-center text-sm text-neutral-400">
        <i className="ti ti-receipt-off mb-2 block text-3xl" />
        Belum ada transaksi hari ini
      </div>
    );
  }
  const totJual = riwayat.filter((r) => r.tipe === "jual").reduce((a, b) => a + b.total, 0);
  const totBB = riwayat.filter((r) => r.tipe === "buyback").reduce((a, b) => a + b.total, 0);

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Transaksi Hari Ini</span>
        <span className="text-[11px] text-neutral-400">
          Jual: {formatIDR(totJual)} · Buyback: {formatIDR(totBB)}
        </span>
      </div>
      {riwayat.map((r) => {
        const lv = LOGAM[r.logam];
        return (
          <div key={r.no} className="flex items-center justify-between border-b border-neutral-800 py-2 text-xs last:border-0">
            <div className="flex items-center gap-1.5">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={
                  r.tipe === "jual"
                    ? { background: "#14532d", color: "#86efac" }
                    : { background: "#713f12", color: "#fde68a" }
                }
              >
                {r.tipe === "jual" ? "Jual" : "Buyback"}
              </span>
              <i className={`ti ${lv.icon} text-xs`} style={{ color: lv.accent }} />
              <span className="font-medium">{r.no}</span>
              <span className="text-neutral-500">{r.waktu}</span>
            </div>
            <div className="text-right">
              <div className="font-medium">{formatIDR(r.total)}</div>
              <div className="text-[10px] text-neutral-500">{r.nama} · {r.produk}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
