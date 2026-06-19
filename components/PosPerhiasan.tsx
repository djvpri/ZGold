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

type Mode = "jual" | "buyback" | "riwayat" | "stok";

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

  async function proses() {
    try {
      const res = await fetch("/api/transaksi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipe: "jual",
          logam_id: logamId,
          kadar_label: kadar.label,
          jenis_produk: jenis,
          nama_pihak: namaPembeli || "Umum",
          berat_gram: berat,
          jumlah,
          harga_per_gram: spot[logamId] * kadar.nilai,
          ongkos_cetak: isLM ? 0 : ongkos,
          kondisi: 1.0,
          diskon,
          total,
          bayar,
          kembalian,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setRiwayat((r) => [
        {
          no: d.data.no_transaksi,
          waktu: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          nama: namaPembeli || "Umum",
          produk: `${jenis} ${kadar.label}`,
          logam: logamId,
          total,
          tipe: "jual" as const,
        },
        ...r,
      ]);
      setBayar(0);
    } catch (e: any) {
      alert("Gagal menyimpan: " + e.message);
    }
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

  async function prosesBuyback() {
    try {
      const res = await fetch("/api/transaksi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipe: "buyback",
          logam_id: bbLogamId,
          kadar_label: bbKadar.label,
          nama_pihak: bbNama || "Penjual",
          berat_gram: bbBerat,
          jumlah: 1,
          harga_per_gram: spot[bbLogamId] * bbLogam.buybackRatio * bbKadar.nilai,
          ongkos_cetak: 0,
          kondisi: bbKondisi,
          diskon: 0,
          total: bbTotal,
          bayar: 0,
          kembalian: 0,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setRiwayat((r) => [
        {
          no: d.data.no_transaksi,
          waktu: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          nama: bbNama || "Penjual",
          produk: bbKadar.label,
          logam: bbLogamId,
          total: bbTotal,
          tipe: "buyback" as const,
        },
        ...r,
      ]);
    } catch (e: any) {
      alert("Gagal menyimpan: " + e.message);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-3 sm:p-4 text-neutral-100">
      {/* Header */}
      <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-base font-medium sm:text-lg">
            <i className="ti ti-diamond mr-2" />POS Toko Perhiasan
          </h1>
          <p className="text-[10px] text-neutral-400 sm:text-xs">Zomet · Multi-Logam</p>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {(["jual", "buyback", "riwayat", "stok"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] capitalize transition sm:py-1 sm:text-xs"
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
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
        {Object.values(LOGAM).map((l) => (
          <div
            key={l.id}
            className="min-w-[110px] flex-shrink-0 rounded-lg p-2 sm:min-w-[120px]"
            style={{ background: l.bg, color: l.textColor }}
          >
            <div className="text-[9px] uppercase tracking-wide opacity-70 sm:text-[10px]" style={{ color: l.accent }}>
              {l.nama.split(" ")[0]}/gram
            </div>
            <input
              type="number"
              value={spot[l.id]}
              onChange={(e) => setSpot((s) => ({ ...s, [l.id]: +e.target.value }))}
              className="w-full bg-transparent text-xs font-medium outline-none sm:text-sm"
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
      {mode === "stok" && <PanelStok />}
    </div>
  );
}

// ============ Sub-komponen di file terpisah untuk kerapian ============
import PanelJual from "@/components/PanelJual";
import PanelBuyback from "@/components/PanelBuyback";
import PanelRiwayat from "@/components/PanelRiwayat";
import PanelStok from "@/components/PanelStok";
