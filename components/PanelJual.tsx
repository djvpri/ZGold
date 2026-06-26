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
    isLM, total, kembalian, hargaPerGram, onProses, userName,
  } = props;
  const l: LogamConfig = logam;

  const [notaData, setNotaData] = useState<NotaData | null>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [konfirmasi, setKonfirmasi] = useState(false);

  // ── Cari / Scan Produk ──
  const [kodeInput, setKodeInput] = useState("");
  const [kodeStatus, setKodeStatus] = useState<"idle"|"loading"|"found"|"notfound">("idle");
  const [produkDipilih, setProdukDipilih] = useState<any>(null);
  const [hasilCari, setHasilCari] = useState<any[]>([]);
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

  async function cariProduk(q: string) {
    if (!q.trim()) return;
    setKodeStatus("loading");
    try {
      const res = await fetch(`/api/produk?q=${encodeURIComponent(q.trim())}`);
      const d = await res.json();
      const list: any[] = d.data || [];
      // Cari exact match by kode
      const exact = list.find((p: any) =>
        p.kode?.toLowerCase() === q.trim().toLowerCase()
      );
      if (exact) {
        pilihProduk(exact);
        setKodeStatus("found");
        setHasilCari([]);
      } else if (list.length > 0) {
        // Tampilkan hasil pencarian
        setHasilCari(list);
        setProdukDipilih(null);
        setKodeStatus("idle");
      } else {
        setProdukDipilih(null);
        setHasilCari([]);
        setKodeStatus("notfound");
      }
    } catch {
      setKodeStatus("notfound");
    }
  }

  function pilihProduk(p: any) {
    setProdukDipilih(p);
    setKodeStatus("found");
    setHasilCari([]);
    setKodeInput(p.kode);

    // Auto-fill form dari produk
    if (p.logam_id && LOGAM[p.logam_id]) {
      onGantiLogam(p.logam_id);
      const logamData = LOGAM[p.logam_id];
      const kadarI = logamData.kadar.findIndex((k: any) =>
        k.label === p.kadar_label || k.id === p.kadar_id
      );
      if (kadarI >= 0) onGantiKadar(kadarI);
    }
    if (p.jenis) setJenis(p.jenis);
    if (p.berat_gram) setBerat(p.berat_gram);
    if (p.ongkos_cetak) setOngkos(p.ongkos_cetak);
    setJumlah(1);
  }

  function handleKodeKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") cariProduk(kodeInput);
  }

  function resetProduk() {
    setKodeInput("");
    setKodeStatus("idle");
    setProdukDipilih(null);
    setHasilCari([]);
    kodeRef.current?.focus();
  }

  async function handleProses() {
    if (!produkDipilih) { alert("Cari dan pilih produk dulu"); return; }
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
          nama_kasir: userName || "Kasir",
          nama_toko: tenant?.nama_toko ?? "Zomet POS",
          alamat_toko: tenant?.alamat,
          telepon: tenant?.owner_phone,
          items: [{
            nama: `${logam.nama} ${jenis} ${logam.kadar[kadarIdx]?.label ?? ""} ${berat}g`,
            jumlah,
            harga: hargaPerGram * berat + (isLM ? 0 : ongkos),
          }],
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
      {/* ── Cari / Scan Produk ── */}
      <div className="mb-3 rounded-lg border t-border t-bg-card p-3">
        <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wider t-text-3">
          <i className="ti ti-barcode mr-1" />Cari Produk
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
          {produkDipilih && (
            <button onClick={resetProduk} className="rounded-md border t-border px-3 py-2 text-xs t-text-3">
              <i className="ti ti-x" /> Ganti
            </button>
          )}
        </div>

        {/* Produk terpilih — kartu besar */}
        {produkDipilih && (
          <div className="mt-2 rounded-lg border-2 p-3" style={{ borderColor: l.accent, background: l.bg + "20" }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-green-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{produkDipilih.kode}</span>
                  <span className="text-sm font-bold t-text-1">{produkDipilih.nama}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] t-text-3">
                  <span>{produkDipilih.jenis}</span>
                  <span>{produkDipilih.berat_gram}g</span>
                  {produkDipilih.ongkos_cetak > 0 && <span>Ongkos: {formatIDR(produkDipilih.ongkos_cetak)}</span>}
                  <span className={produkDipilih.stok <= 0 ? "text-red-500 font-bold" : "text-green-600"}>
                    Stok: {produkDipilih.stok}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hasil pencarian (multiple) */}
        {hasilCari.length > 0 && !produkDipilih && (
          <div className="mt-2 space-y-1">
            <p className="text-[10px] t-text-3">Pilih produk:</p>
            {hasilCari.map((p: any) => (
              <button key={p.id} onClick={() => pilihProduk(p)}
                className="flex w-full items-center gap-3 rounded-lg border t-border-md t-bg-card p-2.5 text-left transition hover:opacity-80">
                <i className="ti ti-box text-base" style={{ color: l.accent }} />
                <div className="flex-1 text-xs">
                  <span className="font-semibold">{p.kode}</span> — {p.nama}
                  <div className="text-[10px] t-text-3">{p.berat_gram}g · Stok: {p.stok}</div>
                </div>
                <i className="ti ti-chevron-right t-text-3" />
              </button>
            ))}
          </div>
        )}

        {kodeStatus === "notfound" && (
          <div className="mt-2 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <i className="ti ti-alert-circle" /> Produk tidak ditemukan
          </div>
        )}

        {kodeStatus === "idle" && !produkDipilih && !hasilCari.length && (
          <div className="mt-2 flex items-center gap-2 rounded-md t-bg-muted/30 px-3 py-2 text-[11px] t-text-3">
            <i className="ti ti-info-circle" /> Scan barcode atau ketik kode produk
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Kiri — ringkasan produk */}
        <div>
          <SectionTitle>Info Produk</SectionTitle>
          {produkDipilih ? (
            <div className="rounded-lg border t-border t-bg-card p-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="t-text-3">Logam</span>
                <span className="font-medium">{l.nama}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="t-text-3">Kadar</span>
                <span className="font-medium">{l.kadar[kadarIdx]?.label}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="t-text-3">Jenis</span>
                <span className="font-medium">{jenis}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="t-text-3">Stok</span>
                <span className={produkDipilih.stok <= 0 ? "text-red-500 font-bold" : "text-green-600 font-medium"}>
                  {produkDipilih.stok} pcs
                </span>
              </div>
            </div>
          ) : (
            <p className="text-[11px] t-text-3">Belum ada produk dipilih</p>
          )}
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
            <div className="flex gap-2">
              <input type="number" value={bayar || ""} onChange={(e) => setBayar(+e.target.value)}
                placeholder="0 = tanpa bayar" className={inputCls} inputMode="numeric" style={{flex:1}} />
              <button type="button" onClick={() => setBayar(total)}
                className="px-3 rounded-lg text-xs font-semibold border transition"
                style={{background:'var(--t-accent)',color:'#fff',borderColor:'var(--t-accent)',whiteSpace:'nowrap'}}>
                Pas
              </button>
            </div>
          </Field>
          {bayar > 0 && (
            <p className="mb-3 text-[11px]">
              Kembalian: <span className="font-medium" style={{ color: kembalian >= 0 ? "#16a34a" : "#dc2626" }}>
                {kembalian >= 0 ? formatIDR(kembalian) : "KURANG " + formatIDR(-kembalian)}
              </span>
            </p>
          )}

          <button onClick={handleProses} disabled={loading || !produkDipilih}
            className="w-full rounded-md py-3 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-50 sm:text-[13px] mt-2"
            style={{ background: produkDipilih ? l.accent : '#6b7280' }}>
            {!produkDipilih ? "Pilih produk dulu" :
             loading ? "Memproses..." : <><i className="ti ti-receipt mr-1.5" />Proses & Cetak Nota</>}
          </button>
        </div>
      </div>

      {/* Modal Konfirmasi */}
      {konfirmasi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl t-bg-card p-5 shadow-xl">
            <h3 className="mb-3 text-sm font-semibold t-text-1">Konfirmasi Transaksi</h3>
            <div className="mb-4 space-y-1 text-xs t-text-2">
              <div className="flex justify-between"><span>Produk</span><span className="font-medium">{produkDipilih?.kode} — {jenis} {l.kadar[kadarIdx]?.label}</span></div>
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
