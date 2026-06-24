"use client";
import { useState, useEffect } from "react";
import { LOGAM, KONDISI_OPSI, formatIDR } from "@/lib/logam";
import CetakNota, { type NotaData } from "./CetakNota";

export default function PanelBuyback(props: any) {
  const { logamId, kadarIdx, onGantiLogam, onGantiKadar, logam, kadar,
    nama, setNama, berat, setBerat, kondisi, setKondisi,
    total, hargaBeli, onProses } = props;
  const l = logam || LOGAM[logamId];

  const [notaData, setNotaData] = useState<NotaData | null>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [konfirmasi, setKonfirmasi] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setTenant(d.data?.tenant)).catch(() => {});
  }, []);

  async function handleProses() {
    if (berat <= 0) { alert("Berat harus lebih dari 0 gram"); return; }
    setKonfirmasi(true);
  }

  async function konfirmasiProses() {
    setKonfirmasi(false);
    setLoading(true);
    try {
      const data = await onProses();
      if (data) {
        const now = new Date();
        const kondisiLabel = KONDISI_OPSI.find(o => o.nilai === kondisi)?.label || "Baik";
        setNotaData({
          no_transaksi: data.no_transaksi,
          tanggal: now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
            + " " + now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          nama_kasir: "Admin",
          nama_toko: tenant?.nama_toko ?? "Zomet POS",
          alamat_toko: tenant?.alamat,
          telepon: tenant?.owner_phone,
          tipe: "buyback",
          items: [{ nama: `Buyback ${kadar?.label ?? ""} ${berat}g (${kondisiLabel})`, jumlah: 1, harga: total }],
          subtotal: total, diskon: 0, total, bayar: total, kembalian: 0,
        });
        setBerat(10); setNama("");
      }
    } catch (e: any) {
      alert("Gagal menyimpan: " + e.message);
    }
    setLoading(false);
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <SectionTitle>Pilih Logam</SectionTitle>
          <div className="grid grid-cols-2 gap-1.5 md:grid-cols-1">
            {Object.values(LOGAM).map((lg) => (
              <button key={lg.id} onClick={() => onGantiLogam(lg.id)}
                className="rounded-lg border-2 bg-gray-100/40 p-2.5 text-left transition"
                style={{ borderColor: logamId === lg.id ? lg.accent : "transparent" }}>
                <div className="flex items-center gap-2">
                  <i className={`ti ${lg.icon} text-base`} style={{ color: lg.accent }} />
                  <div className="text-xs font-medium">{lg.nama}</div>
                </div>
              </button>
            ))}
          </div>

          <SectionTitle className="mt-3">Kadar</SectionTitle>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {l.kadar.map((kd: any, i: number) => (
              <button key={kd.label} onClick={() => onGantiKadar(i)}
                className="rounded-full px-2.5 py-1.5 text-[11px] transition sm:text-xs"
                style={{
                  background: kadarIdx === i ? l.accent : "transparent",
                  color: kadarIdx === i ? "#fff" : "#9ca3af",
                  border: kadarIdx === i ? "none" : "0.5px solid #d1d5db",
                }}>
                {kd.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>Detail Buyback</SectionTitle>
          <div className="mb-2.5 rounded-lg border border-gray-200 bg-white p-3 space-y-1.5">
            <Field label="Nama Penjual">
              <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Opsional" className={inputCls} />
            </Field>
            <Field label="Berat (gram)">
              <input type="number" value={berat} step={0.1} min={0.1}
                onChange={(e) => setBerat(Math.max(0.01, +e.target.value))}
                className={inputCls} inputMode="decimal" />
            </Field>
            <Field label="Kondisi">
              <select value={kondisi} onChange={(e) => setKondisi(+e.target.value)} className={inputCls}>
                {KONDISI_OPSI.map((o) => <option key={o.nilai} value={o.nilai}>{o.label}</option>)}
              </select>
            </Field>
          </div>

          <div className="mb-2.5 rounded-lg p-3" style={{ background: l.bg, color: l.textColor }}>
            <div className="text-[9px] uppercase tracking-wide opacity-70">Harga Buyback</div>
            <div className="text-xl font-medium tracking-tight">{formatIDR(total)}</div>
            <div className="mt-1 text-[9px] opacity-70">
              {formatIDR(hargaBeli)}/g × {berat}g
              {kondisi < 1 ? ` × ${(kondisi * 100).toFixed(0)}% kondisi` : ""}
            </div>
          </div>

          <button onClick={handleProses} disabled={loading}
            className="w-full rounded-md py-2.5 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ background: l.accent }}>
            {loading ? "Memproses..." : <><i className="ti ti-receipt mr-1.5" />Proses & Cetak Nota Buyback</>}
          </button>
        </div>
      </div>

      {/* Modal Konfirmasi */}
      {konfirmasi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Konfirmasi Buyback</h3>
            <div className="mb-4 space-y-1 text-xs text-gray-600">
              <div className="flex justify-between"><span>Logam</span><span className="font-medium">{l.nama} {kadar?.label}</span></div>
              <div className="flex justify-between"><span>Berat</span><span className="font-medium">{berat} gram</span></div>
              <div className="flex justify-between"><span>Kondisi</span><span className="font-medium">{KONDISI_OPSI.find(o => o.nilai === kondisi)?.label}</span></div>
              <div className="flex justify-between"><span>Penjual</span><span className="font-medium">{nama || "Umum"}</span></div>
              <div className="flex justify-between border-t pt-1 text-sm font-bold">
                <span>Dibayar ke penjual</span><span style={{ color: l.accent }}>{formatIDR(total)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setKonfirmasi(false)} className="flex-1 rounded-lg border border-gray-300 py-2 text-xs text-gray-600">Batal</button>
              <button onClick={konfirmasiProses} className="flex-1 rounded-lg py-2 text-xs font-medium text-white" style={{ background: l.accent }}>✓ Konfirmasi</button>
            </div>
          </div>
        </div>
      )}

      {notaData && <CetakNota data={notaData} onClose={() => setNotaData(null)} />}
    </>
  );
}

const inputCls = "flex-1 rounded-md border border-gray-300 bg-white px-2 py-2 text-xs outline-none";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <label className="min-w-[90px] text-[11px] text-gray-500">{label}</label>
      {children}
    </div>
  );
}
function SectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mb-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-500 ${className}`}>{children}</div>;
}
