"use client";
import { useState, useEffect } from "react";
import { LOGAM, formatIDR, type LogamConfig } from "@/lib/logam";
import CetakNota, { type NotaData } from "./CetakNota";

export default function PanelJual(props: any) {
  const {
    logam, logamId, kadarIdx, spot, onGantiLogam, onGantiKadar,
    namaPembeli, setNamaPembeli, berat, setBerat, ongkos, setOngkos,
    jumlah, setJumlah, diskon, setDiskon, jenis, setJenis, bayar, setBayar,
    isLM, total, kembalian, hargaPerGram, onProses,
  } = props;
  const l: LogamConfig = logam;

  const [notaData, setNotaData] = useState<NotaData | null>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [konfirmasi, setKonfirmasi] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setTenant(d.data?.tenant)).catch(() => {});
  }, []);

  async function handleProses() {
    if (berat <= 0) { alert("Berat harus lebih dari 0 gram"); return; }
    if (jumlah <= 0) { alert("Jumlah harus minimal 1"); return; }
    if (bayar > 0 && bayar < total) { alert("Pembayaran kurang dari total"); return; }
    setKonfirmasi(true);
  }

  async function konfirmasiProses() {
    setKonfirmasi(false);
    setLoading(true);
    try {
      const data = await onProses();
      if (data) {
        const now = new Date();
        setNotaData({
          no_transaksi: data.no_transaksi,
          tanggal: now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
            + " " + now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          nama_kasir: "Admin",
          nama_toko: tenant?.nama_toko ?? "Zomet POS",
          alamat_toko: tenant?.alamat,
          telepon: tenant?.owner_phone,
          items: [{ nama: `${jenis} ${logam.kadar[kadarIdx]?.label ?? ""} ${berat}g`, jumlah, harga: total + diskon }],
          subtotal: total + diskon, diskon, total, bayar, kembalian,
        });
      }
    } catch (e: any) {
      alert("Gagal menyimpan: " + e.message);
    }
    setLoading(false);
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Kiri — pilih logam, kadar, jenis */}
        <div>
          <SectionTitle>Pilih Logam</SectionTitle>
          <div className="grid grid-cols-2 gap-1.5 md:grid-cols-1">
            {Object.values(LOGAM).map((lg) => (
              <button key={lg.id} onClick={() => onGantiLogam(lg.id)}
                className="rounded-lg border-2 bg-gray-100/40 p-2.5 text-left transition"
                style={{ borderColor: logamId === lg.id ? lg.accent : "transparent" }}>
                <div className="flex items-center gap-2">
                  <i className={`ti ${lg.icon} text-base`} style={{ color: lg.accent }} />
                  <div>
                    <div className="text-xs font-medium">{lg.nama}</div>
                    <div className="text-[10px] text-gray-500">
                      {formatIDR(spot[lg.id])}/g
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <SectionTitle className="mt-3">Kadar</SectionTitle>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {l.kadar.map((k, i) => (
              <button key={k.label} onClick={() => onGantiKadar(i)}
                className="rounded-full px-2.5 py-1.5 text-[11px] transition sm:text-xs"
                style={{
                  background: kadarIdx === i ? l.accent : "transparent",
                  color: kadarIdx === i ? "#fff" : "#9ca3af",
                  border: kadarIdx === i ? "none" : "0.5px solid #d1d5db",
                }}>
                {k.label}
              </button>
            ))}
          </div>

          <SectionTitle>Jenis Produk</SectionTitle>
          <select value={jenis} onChange={(e) => setJenis(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-xs">
            {l.jenis.map((j) => <option key={j}>{j}</option>)}
          </select>
        </div>

        {/* Kanan — detail & total */}
        <div>
          <SectionTitle>Detail Transaksi</SectionTitle>
          <div className="mb-2.5 rounded-lg border border-gray-200 bg-white p-3 space-y-1.5">
            <Field label="Nama Pembeli">
              <input value={namaPembeli} onChange={(e) => setNamaPembeli(e.target.value)}
                placeholder="Opsional" className={inputCls} />
            </Field>
            <Field label="Berat (gram)">
              <input type="number" value={berat} step={0.1} min={0.1}
                onChange={(e) => setBerat(Math.max(0.01, +e.target.value))}
                className={inputCls} inputMode="decimal" />
            </Field>
            {!isLM && (
              <Field label="Ongkos Cetak">
                <input type="number" value={ongkos} step={1000} min={0}
                  onChange={(e) => setOngkos(+e.target.value)} className={inputCls} inputMode="numeric" />
              </Field>
            )}
            <Field label="Jumlah (pcs)">
              <input type="number" value={jumlah} min={1}
                onChange={(e) => setJumlah(Math.max(1, +e.target.value))} className={inputCls} inputMode="numeric" />
            </Field>
            <Field label="Diskon (Rp)">
              <input type="number" value={diskon} step={10000} min={0}
                onChange={(e) => setDiskon(+e.target.value)} className={inputCls} inputMode="numeric" />
            </Field>
          </div>

          {/* Total card */}
          <div className="mb-2.5 rounded-lg p-3" style={{ background: l.bg, color: l.textColor }}>
            <div className="text-[9px] uppercase tracking-wide opacity-70">Total Pembayaran</div>
            <div className="text-xl font-medium tracking-tight">{formatIDR(total)}</div>
            <div className="mt-1 text-[9px] opacity-70">
              {formatIDR(hargaPerGram)}/g × {berat}g
              {!isLM && ongkos ? ` + cetak ${formatIDR(ongkos)}` : ""}
              {jumlah > 1 ? ` × ${jumlah}` : ""}
              {diskon ? ` − ${formatIDR(diskon)}` : ""}
            </div>
          </div>

          <Field label="Bayar (Rp)">
            <input type="number" value={bayar || ""} onChange={(e) => setBayar(+e.target.value)}
              placeholder="0 = tanpa bayar" className={inputCls} inputMode="numeric" />
          </Field>
          {bayar > 0 && (
            <p className="mb-2 text-[11px]">
              Kembalian: <span className="font-medium" style={{ color: kembalian >= 0 ? "#16a34a" : "#dc2626" }}>
                {kembalian >= 0 ? formatIDR(kembalian) : "KURANG " + formatIDR(-kembalian)}
              </span>
            </p>
          )}

          <button onClick={handleProses} disabled={loading}
            className="w-full rounded-md py-2.5 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-50 sm:text-[13px]"
            style={{ background: l.accent }}>
            {loading ? "Memproses..." : <><i className="ti ti-receipt mr-1.5" />Proses & Cetak Nota</>}
          </button>
        </div>
      </div>

      {/* Modal Konfirmasi */}
      {konfirmasi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Konfirmasi Transaksi</h3>
            <div className="mb-4 space-y-1 text-xs text-gray-600">
              <div className="flex justify-between"><span>Produk</span><span className="font-medium">{jenis} {l.kadar[kadarIdx]?.label}</span></div>
              <div className="flex justify-between"><span>Berat</span><span className="font-medium">{berat} gram × {jumlah} pcs</span></div>
              <div className="flex justify-between"><span>Pembeli</span><span className="font-medium">{namaPembeli || "Umum"}</span></div>
              {diskon > 0 && <div className="flex justify-between text-green-600"><span>Diskon</span><span>− {formatIDR(diskon)}</span></div>}
              <div className="flex justify-between border-t pt-1 text-sm font-bold">
                <span>Total</span><span style={{ color: l.accent }}>{formatIDR(total)}</span>
              </div>
              {bayar > 0 && <div className="flex justify-between text-gray-500"><span>Bayar</span><span>{formatIDR(bayar)}</span></div>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setKonfirmasi(false)} className="flex-1 rounded-lg border border-gray-300 py-2 text-xs text-gray-600">Batal</button>
              <button onClick={konfirmasiProses} className="flex-1 rounded-lg py-2 text-xs font-medium text-white" style={{ background: l.accent }}>
                ✓ Konfirmasi
              </button>
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
