"use client";
import { useState, useEffect, useRef } from "react";
import { LOGAM, formatIDR, type LogamConfig } from "@/lib/logam";
import CetakNota, { type NotaData } from "./CetakNota";
import dynamic from "next/dynamic";

const BarcodeScanner = dynamic(() => import("./BarcodeScanner"), { ssr: false });

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

  // ── Fitur cari kode produk ──
  const [kodeInput, setKodeInput] = useState("");
  const [kodeStatus, setKodeStatus] = useState<"idle"|"loading"|"found"|"notfound">("idle");
  const [produkDitemukan, setProdukDitemukan] = useState<any>(null);
  const [showScanner, setShowScanner] = useState(false);
  const kodeRef = useRef<HTMLInputElement>(null);

  function handleScanResult(kode: string) {
    setShowScanner(false);
    setKodeInput(kode);
    cariProduk(kode);
  }

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setTenant(d.data?.tenant)).catch(() => {});
  }, []);

  async function cariProduk(kode: string) {
    if (!kode.trim()) return;
    setKodeStatus("loading");
    try {
      const res = await fetch(`/api/produk?q=${encodeURIComponent(kode.trim())}`);
      const d = await res.json();
      const produk = (d.data || []).find((p: any) =>
        p.kode?.toLowerCase() === kode.trim().toLowerCase()
      );
      if (produk) {
        setProdukDitemukan(produk);
        setKodeStatus("found");
        // Auto-fill form
        if (produk.logam_id && LOGAM[produk.logam_id]) {
          onGantiLogam(produk.logam_id);
          // Set kadar sesuai produk
          const logamData = LOGAM[produk.logam_id];
          const kadarI = logamData.kadar.findIndex((k: any) =>
            k.label === produk.kadar_label || k.id === produk.kadar_id
          );
          if (kadarI >= 0) onGantiKadar(kadarI);
        }
        if (produk.berat_gram) setBerat(produk.berat_gram);
        if (produk.jenis) setJenis(produk.jenis);
        if (produk.ongkos_cetak) setOngkos(produk.ongkos_cetak);
        setJumlah(1);
      } else {
        setProdukDitemukan(null);
        setKodeStatus("notfound");
      }
    } catch {
      setKodeStatus("notfound");
    }
  }

  function handleKodeKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") cariProduk(kodeInput);
  }

  function resetKode() {
    setKodeInput("");
    setKodeStatus("idle");
    setProdukDitemukan(null);
    kodeRef.current?.focus();
  }

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
      {/* ── Cari Kode Produk / Scan Barcode ── */}
      <div className="mb-3 rounded-lg border t-border t-bg-card p-3">
        <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wider t-text-3">
          <i className="ti ti-barcode mr-1" />Cari Kode / Scan Barcode
        </div>
        <div className="flex gap-2">
          <input
            ref={kodeRef}
            value={kodeInput}
            onChange={(e) => setKodeInput(e.target.value)}
            onKeyDown={handleKodeKeyDown}
            placeholder="Ketik kode (mis: EMA0006) lalu Enter..."
            className="flex-1 rounded-md border t-border-md t-bg-base px-3 py-2 text-xs outline-none t-text-1"
            autoFocus
          />
          <button onClick={() => setShowScanner(true)}
            className="flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium text-white transition hover:opacity-90"
            style={{ background: '#d97706' }} title="Scan barcode via kamera">
            <i className="ti ti-camera text-sm" />
            <span className="hidden sm:inline">Scan</span>
          </button>
          <button onClick={() => cariProduk(kodeInput)} disabled={kodeStatus === "loading"}
            className="rounded-md px-3 py-2 text-xs font-medium text-white transition"
            style={{ background: l.accent }}>
            {kodeStatus === "loading" ? <i className="ti ti-loader animate-spin" /> : <i className="ti ti-search" />}
          </button>
          {kodeStatus !== "idle" && (
            <button onClick={resetKode} className="rounded-md border t-border px-3 py-2 text-xs t-text-3">
              <i className="ti ti-x" />
            </button>
          )}
        </div>

        {/* Hasil pencarian */}
        {kodeStatus === "found" && produkDitemukan && (
          <div className="mt-2 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2">
            <i className="ti ti-check text-green-600" />
            <div className="flex-1 text-xs">
              <span className="font-semibold text-green-800">{produkDitemukan.kode}</span>
              {" · "}{produkDitemukan.nama}
              {" · "}{produkDitemukan.berat_gram}g
              {" · Stok: "}<span className={produkDitemukan.stok <= 0 ? "text-red-600 font-bold" : "text-green-700 font-medium"}>
                {produkDitemukan.stok} pcs
              </span>
            </div>
          </div>
        )}
        {kodeStatus === "notfound" && (
          <div className="mt-2 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <i className="ti ti-alert-circle" /> Kode produk tidak ditemukan
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Kiri — pilih logam, kadar, jenis */}
        <div>
          <SectionTitle>Pilih Logam</SectionTitle>
          <div className="grid grid-cols-2 gap-1.5 md:grid-cols-1">
            {Object.values(LOGAM).map((lg) => (
              <button key={lg.id} onClick={() => onGantiLogam(lg.id)}
                className="rounded-lg border-2 t-bg-muted/40 p-2.5 text-left transition"
                style={{ borderColor: logamId === lg.id ? lg.accent : "transparent" }}>
                <div className="flex items-center gap-2">
                  <i className={`ti ${lg.icon} text-base`} style={{ color: lg.accent }} />
                  <div>
                    <div className="text-xs font-medium">{lg.nama}</div>
                    <div className="text-[10px] t-text-3">
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
            className="w-full rounded-md border t-border-md t-bg-card px-2 py-2 text-xs">
            {l.jenis.map((j) => <option key={j}>{j}</option>)}
          </select>
        </div>

        {/* Kanan — detail & total */}
        <div>
          <SectionTitle>Detail Transaksi</SectionTitle>
          <div className="mb-2.5 rounded-lg border t-border t-bg-card p-3 space-y-1.5">
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
          <div className="w-full max-w-sm rounded-xl t-bg-card p-5 shadow-xl">
            <h3 className="mb-3 text-sm font-semibold t-text-1">Konfirmasi Transaksi</h3>
            <div className="mb-4 space-y-1 text-xs t-text-2">
              <div className="flex justify-between"><span>Produk</span><span className="font-medium">{jenis} {l.kadar[kadarIdx]?.label}</span></div>
              <div className="flex justify-between"><span>Berat</span><span className="font-medium">{berat} gram × {jumlah} pcs</span></div>
              <div className="flex justify-between"><span>Pembeli</span><span className="font-medium">{namaPembeli || "Umum"}</span></div>
              {diskon > 0 && <div className="flex justify-between text-green-600"><span>Diskon</span><span>− {formatIDR(diskon)}</span></div>}
              <div className="flex justify-between border-t pt-1 text-sm font-bold">
                <span>Total</span><span style={{ color: l.accent }}>{formatIDR(total)}</span>
              </div>
              {bayar > 0 && <div className="flex justify-between t-text-3"><span>Bayar</span><span>{formatIDR(bayar)}</span></div>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setKonfirmasi(false)} className="flex-1 rounded-lg border t-border-md py-2 text-xs t-text-2">Batal</button>
              <button onClick={konfirmasiProses} className="flex-1 rounded-lg py-2 text-xs font-medium text-white" style={{ background: l.accent }}>
                ✓ Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}

      {notaData && <CetakNota data={notaData} onClose={() => setNotaData(null)} />}
      {showScanner && <BarcodeScanner onResult={handleScanResult} onClose={() => setShowScanner(false)} />}
    </>
  );
}

const inputCls = "flex-1 rounded-md border t-border-md t-bg-card px-2 py-2 text-xs outline-none";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <label className="min-w-[90px] text-[11px] t-text-3">{label}</label>
      {children}
    </div>
  );
}
function SectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mb-1.5 text-[10px] font-medium uppercase tracking-wider t-text-3 ${className}`}>{children}</div>;
}
