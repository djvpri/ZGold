"use client";
import { LOGAM, KONDISI_OPSI, formatIDR, type LogamConfig } from "@/lib/logam";

export default function PanelBuyback(props: any) {
  const {
    logamId, kadarIdx, onGantiLogam, onGantiKadar,
    nama, setNama, berat, setBerat, kondisi, setKondisi,
    total, hargaBeli, onProses,
  } = props;
  const l: LogamConfig = LOGAM[logamId];
  const kadar = l.kadar[kadarIdx] ?? l.kadar[0];

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div>
        <SectionTitle>Pilih Logam</SectionTitle>
        {Object.values(LOGAM).map((lg) => (
          <button
            key={lg.id}
            onClick={() => onGantiLogam(lg.id)}
            className="mb-1.5 w-full rounded-lg border-2 bg-neutral-800/40 p-2.5 text-left transition"
            style={{ borderColor: logamId === lg.id ? lg.accent : "transparent" }}
          >
            <div className="flex items-center gap-2">
              <i className={`ti ${lg.icon} text-base`} style={{ color: lg.accent }} />
              <div className="text-[13px] font-medium">{lg.nama}</div>
            </div>
          </button>
        ))}
        <SectionTitle className="mt-2">Kadar</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          {l.kadar.map((k, i) => (
            <button
              key={k.label}
              onClick={() => onGantiKadar(i)}
              className="rounded-full px-3 py-1 text-xs transition"
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
      </div>

      <div>
        <SectionTitle>Detail Barang</SectionTitle>
        <div className="mb-2.5 rounded-lg border border-neutral-800 bg-neutral-900 p-3">
          <Field label="Nama Penjual">
            <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Wajib diisi" className={inputCls} />
          </Field>
          <Field label="Berat (gram)">
            <input type="number" value={berat} step={0.1} onChange={(e) => setBerat(+e.target.value)} className={inputCls} />
          </Field>
          <Field label="Kondisi">
            <select value={kondisi} onChange={(e) => setKondisi(+e.target.value)} className={inputCls}>
              {KONDISI_OPSI.map((k) => (
                <option key={k.label} value={k.nilai}>{k.label}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mb-2.5 rounded-lg border border-neutral-800 bg-neutral-900 p-3 text-xs">
          <Row label="Harga beli toko/gram" val={formatIDR(hargaBeli)} />
          <Row label="× Kadar" val={`${(kadar.nilai * 100).toFixed(1)}%`} />
          <Row label="× Berat" val={`${berat}g`} />
          <Row label="× Kondisi" val={`${(kondisi * 100).toFixed(0)}%`} />
        </div>

        <div className="mb-2.5 rounded-lg p-3.5" style={{ background: l.bg, color: l.textColor }}>
          <div className="text-[10px] uppercase tracking-wide opacity-70">Toko Bayar ke Pelanggan</div>
          <div className="text-2xl font-medium tracking-tight">{formatIDR(total)}</div>
        </div>

        <button
          onClick={onProses}
          className="w-full rounded-md py-2 text-[13px] font-medium text-white transition hover:opacity-90"
          style={{ background: l.accent }}
        >
          <i className="ti ti-currency-dollar mr-1.5" />Proses Buyback
        </button>
      </div>
    </div>
  );
}

const inputCls = "flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-xs outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1.5 flex items-center gap-2">
      <label className="min-w-[105px] text-xs text-neutral-400">{label}</label>
      {children}
    </div>
  );
}
function Row({ label, val }: { label: string; val: string }) {
  return (
    <div className="flex justify-between border-b border-neutral-800 py-1.5 last:border-0">
      <span className="text-neutral-400">{label}</span>
      <span>{val}</span>
    </div>
  );
}
function SectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mb-1.5 text-[10px] font-medium uppercase tracking-wider text-neutral-400 ${className}`}>{children}</div>;
}
