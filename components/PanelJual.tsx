"use client";
import { LOGAM, formatIDR, type LogamConfig } from "@/lib/logam";

export default function PanelJual(props: any) {
  const {
    logam, logamId, kadarIdx, onGantiLogam, onGantiKadar,
    namaPembeli, setNamaPembeli, berat, setBerat, ongkos, setOngkos,
    jumlah, setJumlah, diskon, setDiskon, jenis, setJenis, bayar, setBayar,
    isLM, total, kembalian, hargaPerGram, onProses,
  } = props;
  const l: LogamConfig = logam;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {/* Kiri */}
      <div>
        <SectionTitle>Pilih Logam</SectionTitle>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 md:grid-cols-1">
          {Object.values(LOGAM).map((lg) => (
            <button
              key={lg.id}
              onClick={() => onGantiLogam(lg.id)}
              className="rounded-lg border-2 bg-neutral-800/40 p-2.5 text-left transition"
              style={{ borderColor: logamId === lg.id ? lg.accent : "transparent" }}
            >
              <div className="flex items-center gap-2">
                <i className={`ti ${lg.icon} text-base`} style={{ color: lg.accent }} />
                <div>
                  <div className="text-xs font-medium sm:text-[13px]">{lg.nama}</div>
                  <div className="text-[10px] text-neutral-400 sm:text-[11px]">{formatIDR(0)}/gram</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <SectionTitle className="mt-2">Kadar</SectionTitle>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {l.kadar.map((k, i) => (
            <button
              key={k.label}
              onClick={() => onGantiKadar(i)}
              className="rounded-full px-2.5 py-1.5 text-[11px] transition sm:px-3 sm:text-xs"
              style={{
                background: kadarIdx === i ? l.accent : "transparent",
                color: kadarIdx === i ? "#fff" : "#9ca3af",
                border: kadarIdx === i ? "none" : "0.5px solid #3f3f46",
              }}
            >
              {k.label}
            </button>
          ))}
        </div>

        <SectionTitle>Jenis Produk</SectionTitle>
        <select
          value={jenis}
          onChange={(e) => setJenis(e.target.value)}
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-2 text-xs sm:py-1.5"
        >
          {l.jenis.map((j) => (
            <option key={j}>{j}</option>
          ))}
        </select>
      </div>

      {/* Kanan */}
      <div>
        <SectionTitle>Detail Transaksi</SectionTitle>
        <div className="mb-2.5 rounded-lg border border-neutral-800 bg-neutral-900 p-3">
          <Field label="Nama Pembeli">
            <input value={namaPembeli} onChange={(e) => setNamaPembeli(e.target.value)} placeholder="Opsional" className={inputCls} />
          </Field>
          <Field label="Berat (gram)">
            <input type="number" value={berat} step={0.1} onChange={(e) => setBerat(+e.target.value)} className={inputCls} inputMode="decimal" />
          </Field>
          {!isLM && (
            <Field label="Ongkos Cetak">
              <input type="number" value={ongkos} step={1000} onChange={(e) => setOngkos(+e.target.value)} className={inputCls} inputMode="numeric" />
            </Field>
          )}
          <Field label="Jumlah (pcs)">
            <input type="number" value={jumlah} min={1} onChange={(e) => setJumlah(+e.target.value)} className={inputCls} inputMode="numeric" />
          </Field>
          <Field label="Diskon (Rp)">
            <input type="number" value={diskon} step={10000} onChange={(e) => setDiskon(+e.target.value)} className={inputCls} inputMode="numeric" />
          </Field>
        </div>

        <div className="mb-2.5 rounded-lg p-3 sm:p-3.5" style={{ background: l.bg, color: l.textColor }}>
          <div className="text-[9px] uppercase tracking-wide opacity-70 sm:text-[10px]">Total Pembayaran</div>
          <div className="text-xl font-medium tracking-tight sm:text-2xl">{formatIDR(total)}</div>
          <div className="mt-1 text-[9px] opacity-70 sm:text-[10px]">
            {formatIDR(hargaPerGram)}/g × {berat}g{!isLM && ongkos ? ` + cetak ${formatIDR(ongkos)}` : ""}
            {jumlah > 1 ? ` × ${jumlah}` : ""}{diskon ? ` − ${formatIDR(diskon)}` : ""}
          </div>
        </div>

        <Field label="Bayar (Rp)">
          <input type="number" value={bayar || ""} onChange={(e) => setBayar(+e.target.value)} placeholder="0" className={inputCls} inputMode="numeric" />
        </Field>
        <p className="mb-2 text-[11px] text-neutral-400 sm:text-xs">
          Kembalian:{" "}
          <span className="font-medium" style={{ color: kembalian >= 0 ? "#4ade80" : "#f87171" }}>
            {kembalian >= 0 ? formatIDR(kembalian) : "—"}
          </span>
        </p>

        <button
          onClick={onProses}
          className="w-full rounded-md py-2.5 text-xs font-medium text-white transition hover:opacity-90 sm:py-2 sm:text-[13px]"
          style={{ background: l.accent }}
        >
          <i className="ti ti-receipt mr-1.5" />Proses &amp; Cetak Nota
        </button>
      </div>
    </div>
  );
}

const inputCls = "flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-2.5 text-xs outline-none sm:py-1.5";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1.5 flex items-center gap-2">
      <label className="min-w-[90px] text-[11px] text-neutral-400 sm:min-w-[105px] sm:text-xs">{label}</label>
      {children}
    </div>
  );
}

function SectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mb-1.5 text-[10px] font-medium uppercase tracking-wider text-neutral-400 ${className}`}>{children}</div>;
}