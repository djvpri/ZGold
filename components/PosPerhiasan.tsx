"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { LOGAM, KONDISI_OPSI, hitungHargaJual, hitungBuyback, formatIDR } from "@/lib/logam";
import PanelJual from "./PanelJual";
import PanelBuyback from "./PanelBuyback";
import PanelRiwayat from "./PanelRiwayat";
import PanelStok from "./PanelStok";
import PanelHutang from "./PanelHutang";

type Mode = "jual" | "buyback" | "riwayat" | "stok" | "hutang";

export default function PosPerhiasan() {
  const [mode, setMode] = useState<Mode>("jual");
  const [spot, setSpot] = useState<Record<string, number>>(
    Object.fromEntries(Object.values(LOGAM).map((l) => [l.id, l.spotDefault]))
  );
  const [userRole, setUserRole] = useState<string>("kasir");
  const [userName, setUserName] = useState<string>("Kasir");
  const [riwayat, setRiwayat] = useState<any[]>([]);

  // Fetch user role & spot price
  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      setUserRole(d.data?.user?.role || "kasir");
      setUserName(d.data?.user?.name || d.data?.user?.email || "Kasir");
    }).catch(() => {});

    fetch("/api/harga-emas").then(r => r.json()).then(d => {
      if (d.data) {
        const parsed: Record<string, number> = {}
        for (const [k, v] of Object.entries(d.data)) parsed[k] = Number(v)
        setSpot(s => ({ ...s, ...parsed }))
      }
    }).catch(() => {});
  }, []);

  // Fetch riwayat dari API
  const fetchRiwayat = useCallback(async () => {
    try {
      const r = await fetch("/api/transaksi");
      const d = await r.json();
      setRiwayat(d.data || []);
    } catch {}
  }, []);

  useEffect(() => { fetchRiwayat(); }, [fetchRiwayat]);

  // Simpan spot price ke server (admin only)
  async function simpanSpot(logamId: string, nilai: number) {
    if (userRole !== "admin") return;
    setSpot(s => ({ ...s, [logamId]: nilai }));
    await fetch("/api/harga-emas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logam_id: logamId, spot_price: nilai }),
    }).catch(() => {});
  }

  // ── State JUAL ──
  const [logamId, setLogamId] = useState("emas");
  const [kadarIdx, setKadarIdx] = useState(0);
  const [namaPembeli, setNamaPembeli] = useState("");
  const [berat, setBerat] = useState(5);
  const [ongkos, setOngkos] = useState(LOGAM.emas.ongkosDefault);
  const [jumlah, setJumlah] = useState(1);
  const [diskon, setDiskon] = useState(0);
  const [jenis, setJenis] = useState("");
  const [bayar, setBayar] = useState(0);

  const logam = LOGAM[logamId];
  const kadar = logam.kadar[kadarIdx] ?? logam.kadar[0];
  const isLM = !!kadar.isLM;

  const total = useMemo(() =>
    hitungHargaJual({ spot: spot[logamId], kadar: kadar.nilai, berat, ongkos: isLM ? 0 : ongkos, jumlah, diskon }),
    [spot, logamId, kadar, berat, ongkos, jumlah, diskon, isLM]
  );
  const kembalian = bayar - total;

  function gantiLogam(id: string) {
    setLogamId(id);
    setKadarIdx(0);
    setOngkos(LOGAM[id].ongkosDefault);
    setJenis("");
  }

  async function prosesJual() {
    // Validasi
    if (berat <= 0) { alert("Berat harus lebih dari 0"); return; }
    if (jumlah <= 0) { alert("Jumlah harus lebih dari 0"); return; }
    if (!jenis) { alert("Pilih produk dari stok terlebih dahulu"); return; }

    const res = await fetch("/api/transaksi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipe: "jual", logam_id: logamId, kadar_label: kadar.label,
        jenis_produk: jenis, nama_pihak: namaPembeli || "Umum",
        kontak: "",
        berat_gram: berat, jumlah, harga_per_gram: spot[logamId] * kadar.nilai,
        ongkos_cetak: isLM ? 0 : ongkos, kondisi: 1.0,
        diskon, total, bayar, kembalian,
      }),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error);

    // Auto-create hutang if outstanding balance
    if (bayar > 0 && bayar < total && d.data?.id) {
      await fetch("/api/hutang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaksi_id: d.data.id,
          tipe: "jual",
          nama_pihak: namaPembeli || "Umum",
          total,
          dibayar: bayar,
          sisa: total - bayar,
        }),
      });
    }

    setBayar(0);
    fetchRiwayat();
    return d.data;
  }

  // ── State BUYBACK ──
  const [bbLogamId, setBbLogamId] = useState("emas");
  const [bbKadarIdx, setBbKadarIdx] = useState(0);
  const [bbNama, setBbNama] = useState("");
  const [bbBerat, setBbBerat] = useState(10);
  const [bbKondisi, setBbKondisi] = useState(1.0);

  const bbLogam = LOGAM[bbLogamId];
  const bbKadar = bbLogam.kadar[bbKadarIdx] ?? bbLogam.kadar[0];
  const bbTotal = hitungBuyback({
    spot: spot[bbLogamId], buybackRatio: bbLogam.buybackRatio,
    kadar: bbKadar.nilai, berat: bbBerat, kondisi: bbKondisi,
  });

  async function prosesBuyback() {
    if (bbBerat <= 0) { alert("Berat harus lebih dari 0"); return; }
    const res = await fetch("/api/transaksi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipe: "buyback", logam_id: bbLogamId, kadar_label: bbKadar.label,
        nama_pihak: bbNama || "Penjual",
        kontak: "",
        berat_gram: bbBerat, jumlah: 1,
        harga_per_gram: spot[bbLogamId] * bbLogam.buybackRatio * bbKadar.nilai,
        ongkos_cetak: 0, kondisi: bbKondisi, diskon: 0,
        total: bbTotal, bayar: bbTotal, kembalian: 0,
      }),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error);

    // Auto-create hutang if not fully paid (bayar < total)
    if (bbTotal > 0 && d.data?.id && 0 < bbTotal) {
      await fetch("/api/hutang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaksi_id: d.data.id,
          tipe: "buyback",
          nama_pihak: bbNama || "Penjual",
          total: bbTotal,
          dibayar: 0,
          sisa: bbTotal,
        }),
      });
    }

    fetchRiwayat();
    return d.data;
  }

  return (
    <div className="mx-auto max-w-4xl p-3 sm:p-4">
      {/* Header */}
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-base font-medium sm:text-lg t-text-1">
            <i className="ti ti-diamond mr-2" />POS Toko Perhiasan
          </h1>
          <p className="text-[10px] t-text-3 sm:text-xs">Zomet · Multi-Logam</p>
        </div>
        <div className="flex flex-wrap gap-1 pb-1">
          {(["jual", "buyback", ...(userRole === "admin" ? ["riwayat", "stok", "hutang"] : ["hutang"])] as Mode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className="flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] capitalize transition sm:px-3 sm:py-1.5 sm:text-xs"
              style={{
                background: mode === m ? logam.accent : "transparent",
                color: mode === m ? "#fff" : "#9ca3af",
                border: mode === m ? "none" : "0.5px solid #d1d5db",
              }}>
              {m === "riwayat" ? `${m} (${riwayat.length})` : m}
            </button>
          ))}
        </div>
      </div>

      {/* Spot price bar — editable hanya admin */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
        {Object.values(LOGAM).map((l) => (
          <div key={l.id} className="min-w-[120px] flex-shrink-0 rounded-lg p-2"
            style={{ background: l.bg, color: l.textColor }}>
            <div className="text-[9px] uppercase tracking-wide opacity-70" style={{ color: l.accent }}>
              {l.nama.split(" ")[0]}/gram
            </div>
            {userRole === "admin" ? (
              <input type="number" value={spot[l.id]}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  if (val > 0 && val < 100_000_000) simpanSpot(l.id, val)
                }}
                className="w-full bg-transparent text-xs font-medium outline-none"
                style={{ color: l.textColor }} />
            ) : (
              <div className="text-xs font-medium" style={{ color: l.textColor }}>
                {formatIDR(spot[l.id])}
              </div>
            )}
            {userRole !== "admin" && (
              <div className="text-[8px] opacity-50 mt-0.5">hanya admin</div>
            )}
          </div>
        ))}
      </div>

      {mode === "jual" && (
        <PanelJual
          logam={logam} logamId={logamId} kadarIdx={kadarIdx}
          spot={spot} onGantiLogam={gantiLogam} onGantiKadar={setKadarIdx}
          namaPembeli={namaPembeli} setNamaPembeli={setNamaPembeli}
          berat={berat} setBerat={setBerat} ongkos={ongkos} setOngkos={setOngkos}
          jumlah={jumlah} setJumlah={setJumlah} diskon={diskon} setDiskon={setDiskon}
          jenis={jenis} setJenis={setJenis} bayar={bayar} setBayar={setBayar}
          isLM={isLM} total={total} kembalian={kembalian}
          hargaPerGram={spot[logamId] * kadar.nilai} userName={userName} onProses={prosesJual}
        />
      )}

      {mode === "buyback" && (
        <PanelBuyback
          logamId={bbLogamId} kadarIdx={bbKadarIdx}
          onGantiLogam={(id: string) => { setBbLogamId(id); setBbKadarIdx(0); }}
          onGantiKadar={setBbKadarIdx} nama={bbNama} setNama={setBbNama}
          berat={bbBerat} setBerat={setBbBerat} kondisi={bbKondisi} setKondisi={setBbKondisi}
          total={bbTotal} hargaBeli={spot[bbLogamId] * bbLogam.buybackRatio * bbKadar.nilai}
          logam={bbLogam} kadar={bbKadar} userName={userName} onProses={prosesBuyback}
        />
      )}

      {mode === "riwayat" && <PanelRiwayat riwayat={riwayat} onRefresh={fetchRiwayat} />}
      {mode === "stok" && <PanelStok />}
      {mode === "hutang" && <PanelHutang />}
    </div>
  );
}
