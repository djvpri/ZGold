"use client";
import { useState, useEffect } from "react";

interface Hutang {
  id: number;
  transaksi_id: number | null;
  no_transaksi: string | null;
  tipe: "jual" | "buyback";
  nama_pihak: string;
  kontak: string | null;
  total: number;
  dibayar: number;
  sisa: number;
  status: "aktif" | "lunas" | "dihapus";
  jatuh_tempo: string | null;
  keterangan: string | null;
  created_at: string;
}

function formatIDR(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export default function PanelHutang() {
  const [data, setData] = useState<Hutang[]>([]);
  const [status, setStatus] = useState<"aktif" | "lunas" | "semua">("aktif");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [bayarId, setBayarId] = useState<number | null>(null);
  const [bayarAmount, setBayarAmount] = useState("");
  const [form, setForm] = useState({
    nama_pihak: "",
    kontak: "",
    tipe: "jual" as "jual" | "buyback",
    total: 0,
    dibayar: 0,
    keterangan: "",
    jatuh_tempo: "",
  });

  useEffect(() => {
    fetchData();
  }, [status]);

  async function fetchData() {
    try {
      const params = new URLSearchParams();
      if (status !== "semua") params.set("status", status);
      if (search) params.set("q", search);
      const res = await fetch(`/api/hutang?${params}`);
      const d = await res.json();
      setData(d.data || []);
    } catch {}
  }

  async function handleBayar() {
    if (!bayarId || !bayarAmount) return;
    const amount = parseInt(bayarAmount);
    if (amount <= 0) return;
    await fetch("/api/hutang", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: bayarId, bayar: amount }),
    });
    setBayarId(null);
    setBayarAmount("");
    fetchData();
  }

  async function handleCreate() {
    if (!form.nama_pihak || form.total <= 0) return alert("Nama dan total harus diisi");
    await fetch("/api/hutang", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ nama_pihak: "", kontak: "", tipe: "jual", total: 0, dibayar: 0, keterangan: "", jatuh_tempo: "" });
    setShowForm(false);
    fetchData();
  }

  async function handleLunas(id: number) {
    await fetch("/api/hutang", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "lunas" }),
    });
    fetchData();
  }

  async function handleHapus(id: number) {
    if (!confirm("Hapus catatan hutang ini?")) return;
    await fetch(`/api/hutang?id=${id}`, { method: "DELETE" });
    fetchData();
  }

  const totalSisa = data.reduce((sum, h) => sum + (h.status === "aktif" ? h.sisa : 0), 0);

  return (
    <div>
      {/* Header + summary */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xs font-medium">
            <i className="ti ti-coin mr-1" />
            Hutang / Piutang
          </h2>
          {status === "aktif" && (
            <p className="text-[10px] t-text-4">
              Total outstanding: <span className="font-semibold text-amber-400">{formatIDR(totalSisa)}</span>
            </p>
          )}
        </div>
        <button onClick={() => setShowForm(true)}
          className="rounded bg-amber-600/20 px-3 py-1.5 text-[10px] text-amber-400 hover:bg-amber-600/30">
          <i className="ti ti-plus mr-1" />Tambah
        </button>
      </div>

      {/* Filter + Search */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg t-bg-card p-0.5">
          {(["aktif", "lunas", "semua"] as const).map((s) => (
            <button key={s}
              onClick={() => setStatus(s)}
              className="rounded-md px-2.5 py-1 text-[10px]"
              style={{ background: status === s ? "#B8860B" : "transparent", color: status === s ? "#fff" : "#9ca3af" }}>
              {s === "aktif" ? "Aktif" : s === "lunas" ? "Lunas" : "Semua"}
            </button>
          ))}
        </div>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama..."
          className="flex-1 rounded-md border t-border-md t-bg-card px-2 py-1.5 text-[10px] min-w-[120px]"
          onKeyDown={(e) => e.key === "Enter" && fetchData()}
        />
        <button onClick={fetchData} className="rounded t-bg-card px-2 py-1.5 text-[10px] t-text-3">
          <i className="ti ti-search" />
        </button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {data.length === 0 && (
          <div className="py-8 text-center text-[10px] t-text-4">Belum ada data</div>
        )}
        {data.map((h) => (
          <div key={h.id} className="rounded-lg border t-border p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium truncate">{h.nama_pihak}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-medium ${
                    h.tipe === "jual" ? "bg-amber-600/20 text-amber-400" : "bg-blue-600/20 text-blue-400"
                  }`}>
                    {h.tipe === "jual" ? "PIUTANG" : "HUTANG"}
                  </span>
                  {h.status === "lunas" && (
                    <span className="rounded-full bg-green-600/20 px-1.5 py-0.5 text-[8px] text-green-400">LUNAS</span>
                  )}
                </div>
                {h.kontak && <div className="text-[9px] t-text-4 mt-0.5">{h.kontak}</div>}
                {h.no_transaksi && <div className="text-[9px] t-text-4">#{h.no_transaksi}</div>}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs font-semibold">{formatIDR(h.sisa)}</div>
                {h.dibayar > 0 && (
                  <div className="text-[8px] t-text-4">dibayar {formatIDR(h.dibayar)}</div>
                )}
              </div>
            </div>

            {/* Progress bar */}
            {h.status === "aktif" && h.total > 0 && (
              <div className="mt-2 h-1.5 w-full rounded-full t-bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-amber-500 transition-all"
                  style={{ width: `${Math.min(100, (h.dibayar / h.total) * 100)}%` }}
                />
              </div>
            )}

            {h.keterangan && <div className="mt-1 text-[9px] t-text-4 italic">{h.keterangan}</div>}

            {/* Actions */}
            {h.status === "aktif" && (
              <div className="mt-2 flex gap-1.5">
                <button onClick={() => setBayarId(h.id)}
                  className="flex-1 rounded bg-amber-600/20 py-1.5 text-[9px] text-amber-400 font-medium hover:bg-amber-600/30">
                  <i className="ti ti-cash mr-1" />Bayar
                </button>
                <button onClick={() => handleLunas(h.id)}
                  className="flex-1 rounded bg-green-600/20 py-1.5 text-[9px] text-green-400 font-medium hover:bg-green-600/30">
                  <i className="ti ti-check mr-1" />Lunas
                </button>
                <button onClick={() => handleHapus(h.id)}
                  className="rounded bg-red-600/20 px-3 py-1.5 text-[9px] text-red-400 hover:bg-red-600/30">
                  <i className="ti ti-trash" />
                </button>
              </div>
            )}

            {/* Bayar input */}
            {bayarId === h.id && (
              <div className="mt-2 flex gap-1.5">
                <input type="number" value={bayarAmount}
                  onChange={(e) => setBayarAmount(e.target.value)}
                  placeholder="Jumlah bayar..."
                  className="flex-1 rounded-md border t-border-md t-bg-card px-2 py-1.5 text-[10px]"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleBayar()}
                />
                <button onClick={handleBayar}
                  className="rounded bg-amber-600 px-3 py-1.5 text-[10px] text-white font-medium">Bayar</button>
                <button onClick={() => setBayarId(null)}
                  className="rounded t-bg-card px-2 py-1.5 text-[10px] t-text-3">Batal</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Form Tambah Manual */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-t-lg t-bg-card p-4 sm:rounded-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 text-sm font-medium">Tambah Hutang/Piutang</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                {(["jual", "buyback"] as const).map((t) => (
                  <button key={t}
                    onClick={() => setForm({ ...form, tipe: t })}
                    className="flex-1 rounded-md py-2 text-xs font-medium"
                    style={{
                      background: form.tipe === t ? (t === "jual" ? "#B8860B" : "#3b82f6") : "transparent",
                      color: form.tipe === t ? "#fff" : "#9ca3af",
                      border: form.tipe === t ? "none" : "0.5px solid #404040",
                    }}>
                    {t === "jual" ? "Piutang" : "Hutang"}
                  </button>
                ))}
              </div>
              <input value={form.nama_pihak} onChange={(e) => setForm({ ...form, nama_pihak: e.target.value })}
                placeholder="Nama pihak"
                className="w-full rounded-md border t-border-md t-bg-card px-3 py-2 text-xs" />
              <input value={form.kontak} onChange={(e) => setForm({ ...form, kontak: e.target.value })}
                placeholder="Kontak (opsional)"
                className="w-full rounded-md border t-border-md t-bg-card px-3 py-2 text-xs" />
              <input type="number" value={form.total || ""} onChange={(e) => setForm({ ...form, total: parseInt(e.target.value) || 0 })}
                placeholder="Total"
                className="w-full rounded-md border t-border-md t-bg-card px-3 py-2 text-xs" />
              <input type="number" value={form.dibayar || ""} onChange={(e) => setForm({ ...form, dibayar: parseInt(e.target.value) || 0 })}
                placeholder="Sudah dibayar (opsional)"
                className="w-full rounded-md border t-border-md t-bg-card px-3 py-2 text-xs" />
              <input type="date" value={form.jatuh_tempo} onChange={(e) => setForm({ ...form, jatuh_tempo: e.target.value })}
                className="w-full rounded-md border t-border-md t-bg-card px-3 py-2 text-xs" />
              <textarea value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                placeholder="Keterangan (opsional)"
                className="w-full rounded-md border t-border-md t-bg-card px-3 py-2 text-xs" rows={2} />
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 rounded-md t-bg-card py-2 text-xs t-text-3 border t-border">Batal</button>
                <button onClick={handleCreate}
                  className="flex-1 rounded-md bg-amber-600 py-2 text-xs font-medium text-white">Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
