"use client";

import { useState, useMemo, useEffect } from "react";
import {
  LOGAM,
  KONDISI_OPSI,
  hitungHargaJual,
  hitungBuyback,
  formatIDR,
  type LogamConfig,
} from "@/lib/logam";

type Mode = "jual" | "buyback" | "riwayat";

interface RiwayatItem {
  no: string;
  waktu: string;
  nama: string;
  produk: string;
  logam: string;
  total: number;
  tipe: "jual" | "buyback";
}

export default function PosPerhiasan() {
  const [mode, setMode] = useState<Mode>("jual");
  const [spot, setSpot] = useState<Record<string, number>>(
    Object.fromEntries(Object.values(LOGAM).map((l) => [l.id, l.spotDefault]))
  );
  const [riwayat, setRiwayat] = useState<RiwayatItem[]>([]);
  const [noTrx, setNoTrx] = useState(1);

  // ---------- State JUAL ----------
  const [logamId, setLogamId] = useState("emas");
  const [kadarIdx, setKadarIdx] = useState(0);
  const [namaPembeli, setNamaPembeli] = useState("");
  const [berat, setBerat] = useState(5);
  const [ongkos, setOngkos] = useState(LOGAM.emas.ongkosDefault);
  const [jumlah, setJumlah] = useState(1);
  const [diskon, setDiskon] = useState(0);
  const [jenis, setJenis] = useState(LOGAM.emas.jenis[0]);
  const [bayar, setBayar] = useState(0);

  const logam = LOGAM[logamId];
  const kadar = logam.kadar[kadarIdx] ?? logam.kadar[0];
  const isLM = !!kadar.isLM;

  const total = useMemo(
    () =>
      hitungHargaJual({
        spot: spot[logamId],
        kadar: kadar.nilai,
        berat,
        ongkos: isLM ? 0 : ongkos,
        jumlah,
        diskon,
      }),
    [spot, logamId, kadar, berat, ongkos, jumlah, diskon, isLM]
  );

  const kembalian = bayar - total;

  function gantiLogam(id: string) {
    setLogamId(id);
    setKadarIdx(0);
    setOngkos(LOGAM[id].ongkosDefault);
    setJenis(LOGAM[id].jenis[0]);
  }

  function proses() {
    const no =
      (logamId === "emas" ? "TRX" : "TXO") + String(noTrx).padStart(4, "0");
    setNoTrx((n) => n + 1);
    setRiwayat((r) => [
      {
        no,
        waktu: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        nama: namaPembeli || "Umum",
        produk: `${jenis} ${kadar.label}`,
        logam: logamId,
        total,
        tipe: "jual",
      },
      ...r,
    ]);
    // TODO: panggil simpanTransaksi() ke Supabase di sini.
    setBayar(0);
  }

  // ---------- State BUYBACK ----------
  const [bbLogamId, setBbLogamId] = useState("emas");
  const [bbKadarIdx, setBbKadarIdx] = useState(0);
  const [bbNama, setBbNama] = useState("");
  const [bbBerat, setBbBerat] = useState(10);
  const [bbKondisi, setBbKondisi] = useState(1.0);

  const bbLogam = LOGAM[bbLogamId];
  const bbKadar = bbLogam.kadar[bbKadarIdx] ?? bbLogam.kadar[0];
  const bbTotal = hitungBuyback({
    spot: spot[bbLogamId],
    buybackRatio: bbLogam.buybackRatio,
    kadar: bbKadar.nilai,
    berat: bbBerat,
    kondisi: bbKondisi,
  });

  function prosesBuyback() {
    const no = "BB" + String(noTrx).padStart(4, "0");
    setNoTrx((n) => n + 1);
    setRiwayat((r) => [
      {
        no,
        waktu: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        nama: bbNama || "Penjual",
        produk: bbKadar.label,
        logam: bbLogamId,
        total: bbTotal,
        tipe: "buyback",
      },
      ...r,
    ]);
  }

  return (
    <div className="mx-auto max-w-4xl p-4 text-neutral-100">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium">
            <i className="ti ti-diamond mr-2" />POS Toko Perhiasan
          </h1>
          <p className="text-xs text-neutral-400">Zomet · Multi-Logam</p>
        </div>
        <div className="flex gap-1">
          {(["jual", "buyback", "riwayat"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="rounded-full px-3 py-1 text-xs capitalize transition"
              style={{
                background: mode === m ? logam.accent : "transparent",
                color: mode === m ? "#fff" : "#9ca3af",
                border: mode === m ? "none" : "0.5px solid #3f3f46",
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Spot price bar */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {Object.values(LOGAM).map((l) => (
          <div
            key={l.id}
            className="min-w-[120px] flex-shrink-0 rounded-lg p-2"
            style={{ background: l.bg, color: l.textColor }}
          >
            <div className="text-[10px] uppercase tracking-wide opacity-70" style={{ color: l.accent }}>
              {l.nama.split(" ")[0]}/gram
            </div>
            <input
              type="number"
              value={spot[l.id]}
              onChange={(e) => setSpot((s) => ({ ...s, [l.id]: +e.target.value }))}
              className="w-full bg-transparent text-sm font-medium outline-none"
              style={{ color: l.textColor }}
            />
          </div>
        ))}
      </div>

      {mode === "jual" && (
        <PanelJual
          logam={logam}
          logamId={logamId}
          kadarIdx={kadarIdx}
          onGantiLogam={gantiLogam}
          onGantiKadar={setKadarIdx}
          namaPembeli={namaPembeli}
          setNamaPembeli={setNamaPembeli}
          berat={berat}
          setBerat={setBerat}
          ongkos={ongkos}
          setOngkos={setOngkos}
          jumlah={jumlah}
          setJumlah={setJumlah}
          diskon={diskon}
          setDiskon={setDiskon}
          jenis={jenis}
          setJenis={setJenis}
          bayar={bayar}
          setBayar={setBayar}
          isLM={isLM}
          total={total}
          kembalian={kembalian}
          hargaPerGram={spot[logamId] * kadar.nilai}
          onProses={proses}
        />
      )}

      {mode === "buyback" && (
        <PanelBuyback
          logamId={bbLogamId}
          kadarIdx={bbKadarIdx}
          onGantiLogam={(id: string) => { setBbLogamId(id); setBbKadarIdx(0); }}
          onGantiKadar={setBbKadarIdx}
          nama={bbNama}
          setNama={setBbNama}
          berat={bbBerat}
          setBerat={setBbBerat}
          kondisi={bbKondisi}
          setKondisi={setBbKondisi}
          total={bbTotal}
          hargaBeli={spot[bbLogamId] * bbLogam.buybackRatio}
          onProses={prosesBuyback}
        />
      )}

      {mode === "riwayat" && <PanelRiwayat riwayat={riwayat} />}
    </div>
  );
}

// ============ Sub-komponen di file terpisah untuk kerapian ============
import PanelJual from "@/components/PanelJual";
import PanelBuyback from "@/components/PanelBuyback";
import PanelRiwayat from "@/components/PanelRiwayat";
