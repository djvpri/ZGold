"use client";
import { LOGAM, KONDISI_OPSI, formatIDR } from "@/lib/logam";

export default function PanelBuyback(props: any) {
  const {
    logamId, kadarIdx, onGantiLogam, onGantiKadar,
    nama, setNama, berat, setBerat, kondisi, setKondisi,
    total, hargaBeli, onProses,
  } = props;

  const l = LOGAM[logamId];
  const k = l.kadar[kadarIdx] ?? l.kadar[0];

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
              className="rounded-lg border-2 bg-gray-100/40 p-2.5 text-left transition"
              style={{ borderColor: logamId === lg.id ? lg.accent : "transparent" }}
            >
              <div className="flex items-center gap-2">
                <i className={`ti ${lg.icon} text-base`} style={{ color: lg.accent }} />
                <div>
                  <div className="text-xs font-medium sm:text-[13px]">{lg.nama}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <SectionTitle className="mt-2">Kadar</SectionTitle>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {l.kadar.map((kd, i) => (
            <button
              key={kd.label}
              onClick={() => onGantiKadar(i)}
              className="rounded-full px-2.5 py-1.5 text-[11px] transition sm:px-3 sm:text-xs"
              style={{
                background: kadarIdx === i ? l.accent : "transparent",
                color: kadarIdx === i ? "#fff" : "#9ca3af",
                border: kadarIdx === i ? "none" : "0.5px solid #d1d5db",
              }}
            >
              {kd.label}
            </button>
          ))}
        </div>
      </div>

      {/* Kanan */}
      <div>
        <SectionTitle>Detail Buyback</SectionTitle>
        <div className="mb-2.5 rounded-lg border border-gray-200 bg-white p-3">
          <Field label="Nama Penjual">
            <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Opsional" className={inputCls} />
          </Field>
          <Field label="Berat (gram)">
            <input type="number" value={berat} step={0.1} onChange={(e) => setBerat(+e.target.value)} className={inputCls} inputMode="decimal" />
          </Field>
          <Field label="Kondisi">
            <select
              value={kondisi}
              onChange={(e) => setKondisi(+e.target.value)}
              className={inputCls}
            >
              {KONDISI_OPSI.map((o) => (
                <option key={o.nilai} value={o.nilai}>{o.label}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mb-2.5 rounded-lg p-3 sm:p-3.5" style={{ background: l.bg, color: l.textColor }}>
          <div className="text-[9px] uppercase tracking-wide opacity-70 sm:text-[10px]">Harga Beli</div>
          <div className="text-xl font-medium tracking-tight sm:text-2xl">{formatIDR(total)}</div>
          <div className="mt-1 text-[9px] opacity-70 sm:text-[10px]">
            {formatIDR(hargaBeli)}/g × {berat}g{kondisi < 1 ? ` × ${kondisi * 100}% kondisi` : ""}
          </div>
        </div>

        <button
          onClick={onProses}
          className="w-full rounded-md py-2.5 text-xs font-medium text-white transition hover:opacity-90 sm:py-2 sm:text-[13px]"
          style={{ background: l.accent }}
        >
          <i className="ti ti-receipt mr-1.5" />Proses Buyback
        </button>
      </div>
    </div>
  );
}

const inputCls = "flex-1 rounded-md border border-gray-300 bg-white px-2 py-2.5 text-xs outline-none sm:py-1.5";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1.5 flex items-center gap-2">
      <label className="min-w-[90px] text-[11px] text-gray-500 sm:min-w-[105px] sm:text-xs">{label}</label>
      {children}
    </div>
  );
}

function SectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mb-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-500 ${className}`}>{children}</div>;
}