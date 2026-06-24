"use client";
import { LOGAM, formatIDR } from "@/lib/logam";

interface RiwayatItem {
  no: string;
  waktu: string;
  nama: string;
  produk: string;
  logam: string;
  total: number;
  tipe: "jual" | "buyback";
}

export default function PanelRiwayat({ riwayat }: { riwayat: RiwayatItem[] }) {
  if (riwayat.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-gray-400">
        <i className="ti ti-receipt mb-2 block text-3xl" />
        Belum ada transaksi hari ini
      </div>
    );
  }

  const totalJual = riwayat.filter((r) => r.tipe === "jual").reduce((a, b) => a + b.total, 0);
  const totalBuyback = riwayat.filter((r) => r.tipe === "buyback").reduce((a, b) => a + b.total, 0);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
          Riwayat Hari Ini ({riwayat.length})
        </span>
        <div className="flex gap-3 text-[10px] text-gray-400 sm:text-xs">
          <span>Jual: <span className="text-green-400">{formatIDR(totalJual)}</span></span>
          <span>BB: <span className="text-amber-400">{formatIDR(totalBuyback)}</span></span>
        </div>
      </div>

      {/* Mobile: card layout */}
      <div className="space-y-2 sm:hidden">
        {riwayat.map((r, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 p-2.5"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] font-medium text-gray-700">{r.no}</span>
              <span
                className="rounded-full px-1.5 py-0.5 text-[8px] font-medium"
                style={{
                  background: r.tipe === "jual" ? "#166534" : "#92400e",
                  color: r.tipe === "jual" ? "#86efac" : "#fcd34d",
                }}
              >
                {r.tipe}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <i className={`ti ${LOGAM[r.logam]?.icon || "ti-diamond"} text-xs`} style={{ color: LOGAM[r.logam]?.accent }} />
                <span className="text-[11px] text-gray-700">{r.produk}</span>
              </div>
              <span className="text-xs font-medium">{formatIDR(r.total)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[9px] text-gray-400">
              <span>{r.nama}</span>
              <span>{r.waktu}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table layout */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="pb-2">No</th>
              <th className="pb-2">Waktu</th>
              <th className="pb-2">Nama</th>
              <th className="pb-2">Produk</th>
              <th className="pb-2">Tipe</th>
              <th className="pb-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {riwayat.map((r, i) => (
              <tr key={i} className="border-b border-gray-200">
                <td className="py-2 font-medium text-gray-700">{r.no}</td>
                <td className="py-2 text-gray-400">{r.waktu}</td>
                <td className="py-2">{r.nama}</td>
                <td className="py-2">
                  <div className="flex items-center gap-1">
                    <i className={`ti ${LOGAM[r.logam]?.icon || "ti-diamond"} text-xs`} style={{ color: LOGAM[r.logam]?.accent }} />
                    {r.produk}
                  </div>
                </td>
                <td className="py-2">
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                    style={{
                      background: r.tipe === "jual" ? "#166534" : "#92400e",
                      color: r.tipe === "jual" ? "#86efac" : "#fcd34d",
                    }}
                  >
                    {r.tipe}
                  </span>
                </td>
                <td className="py-2 text-right font-medium">{formatIDR(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}