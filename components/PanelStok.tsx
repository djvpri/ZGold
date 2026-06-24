"use client";
import { useState, useEffect } from "react";
import { LOGAM, formatIDR } from "@/lib/logam";

interface ProdukItem {
  id: number;
  kode: string;
  logam_id: string;
  jenis: string;
  nama: string;
  berat_gram: number;
  ongkos_cetak: number;
  stok: number;
  foto_url: string | null;
}

export default function PanelStok() {
  const [produk, setProduk] = useState<ProdukItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [filterLogam, setFilterLogam] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [form, setForm] = useState({
    kode: "",
    logam_id: "emas",
    jenis: "Kalung",
    nama: "",
    berat_gram: 0,
    ongkos_cetak: 0,
    stok: 0,
  });

  // Stok adjustment state
  const [stokAdjust, setStokAdjust] = useState({
    produkId: 0,
    jumlah: 0,
    tipe: "masuk" as "masuk" | "keluar" | "penyesuaian",
    keterangan: "",
  });

  // Fetch produk
  const fetchProduk = async () => {
    try {
      setLoading(true);
      let url = "/api/produk";
      const params = new URLSearchParams();
      if (filterLogam !== "all") params.set("logam", filterLogam);
      if (searchQuery) params.set("q", searchQuery);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProduk(data.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduk();
  }, [filterLogam, searchQuery]);

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editId ? "PATCH" : "POST";
      const body = editId ? { id: editId, ...form } : form;
      
      const res = await fetch("/api/produk", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setShowForm(false);
      setEditId(null);
      resetForm();
      fetchProduk();
    } catch (e: any) {
      alert("Gagal menyimpan: " + e.message);
    }
  };

  // Handle stok adjustment
  const handleStokAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/produk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: stokAdjust.produkId,
          stok_delta: stokAdjust.jumlah,
          stok_tipe: stokAdjust.tipe,
          keterangan: stokAdjust.keterangan,
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setStokAdjust({ produkId: 0, jumlah: 0, tipe: "masuk", keterangan: "" });
      fetchProduk();
    } catch (e: any) {
      alert("Gagal update stok: " + e.message);
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm("Yakin hapus produk ini?")) return;
    
    try {
      const res = await fetch(`/api/produk?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchProduk();
    } catch (e: any) {
      alert("Gagal hapus: " + e.message);
    }
  };

  // Edit produk
  const handleEdit = (item: ProdukItem) => {
    setForm({
      kode: item.kode,
      logam_id: item.logam_id,
      jenis: item.jenis,
      nama: item.nama,
      berat_gram: item.berat_gram,
      ongkos_cetak: item.ongkos_cetak,
      stok: item.stok,
    });
    setEditId(item.id);
    setShowForm(true);
  };

  // Open stok adjust modal
  const openStokAdjust = (produkId: number) => {
    setStokAdjust({ ...stokAdjust, produkId });
  };

  // Reset form
  const resetForm = () => {
    setForm({
      kode: "",
      logam_id: "emas",
      jenis: "Kalung",
      nama: "",
      berat_gram: 0,
      ongkos_cetak: 0,
      stok: 0,
    });
  };

  // Get logam accent color
  const getLogamAccent = (logamId: string) => {
    return LOGAM[logamId]?.accent || "#6b7280";
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">
        <i className="ti ti-loader-2 mb-2 block animate-spin text-3xl" />
        Memuat data stok...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-sm text-red-400">
        <i className="ti ti-alert-circle mb-2 block text-3xl" />
        Error: {error}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
          Manajemen Stok
        </span>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Cari..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs sm:py-1"
          />
          <select
            value={filterLogam}
            onChange={(e) => setFilterLogam(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-2 py-2 text-xs sm:py-1"
          >
            <option value="all">Semua Logam</option>
            {Object.values(LOGAM).map((l) => (
              <option key={l.id} value={l.id}>{l.nama}</option>
            ))}
          </select>
          <button
            onClick={() => { resetForm(); setEditId(null); setShowForm(true); }}
            className="rounded-md bg-blue-600 px-3 py-2 text-xs text-white hover:bg-blue-700 sm:py-1"
          >
            + Tambah
          </button>
        </div>
      </div>

      {/* Ringkasan Stok */}
      <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {Object.values(LOGAM).map((l) => {
          const logamProduk = produk.filter(p => p.logam_id === l.id);
          const totalStok = logamProduk.reduce((a, b) => a + b.stok, 0);
          return (
            <div
              key={l.id}
              className="rounded-lg p-2"
              style={{ background: l.bg, color: l.textColor }}
            >
              <div className="text-[8px] uppercase tracking-wide opacity-70 sm:text-[10px]" style={{ color: l.accent }}>
                {l.nama.split(" ")[0]}
              </div>
              <div className="text-sm font-medium">{totalStok}</div>
            </div>
          );
        })}
      </div>

      {/* Mobile: card layout */}
      <div className="space-y-2 sm:hidden">
        {produk.length === 0 ? (
          <div className="py-8 text-center text-gray-400">
            Belum ada produk
          </div>
        ) : (
          produk.map((item) => (
            <div key={item.id} className="rounded-lg border border-gray-200 p-2.5">
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-medium text-gray-700">{item.kode}</span>
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[8px]"
                    style={{ 
                      background: `${getLogamAccent(item.logam_id)}20`,
                      color: getLogamAccent(item.logam_id)
                    }}
                  >
                    {LOGAM[item.logam_id]?.nama.split(" ")[0] || item.logam_id}
                  </span>
                </div>
                <span className={`text-sm font-medium ${item.stok <= 0 ? "text-red-400" : ""}`}>
                  {item.stok}
                </span>
              </div>
              <div className="text-[11px] text-gray-700">{item.nama}</div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[9px] text-gray-400">{item.jenis} · {item.berat_gram}g</span>
                <div className="flex gap-1">
                  <button onClick={() => openStokAdjust(item.id)} className="rounded bg-green-600/20 px-2 py-0.5 text-[9px] text-green-400">Stok</button>
                  <button onClick={() => handleEdit(item)} className="rounded bg-blue-600/20 px-2 py-0.5 text-[9px] text-blue-400">Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="rounded bg-red-600/20 px-2 py-0.5 text-[9px] text-red-400">Hapus</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop: table layout */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="pb-2">Kode</th>
              <th className="pb-2">Nama</th>
              <th className="pb-2">Logam</th>
              <th className="pb-2">Jenis</th>
              <th className="pb-2 text-right">Berat</th>
              <th className="pb-2 text-right">Stok</th>
              <th className="pb-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {produk.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-400">
                  Belum ada produk
                </td>
              </tr>
            ) : (
              produk.map((item) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-2 font-medium">{item.kode}</td>
                  <td className="py-2">{item.nama}</td>
                  <td className="py-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px]"
                      style={{ 
                        background: `${getLogamAccent(item.logam_id)}20`,
                        color: getLogamAccent(item.logam_id)
                      }}
                    >
                      {LOGAM[item.logam_id]?.nama.split(" ")[0] || item.logam_id}
                    </span>
                  </td>
                  <td className="py-2">{item.jenis}</td>
                  <td className="py-2 text-right">{item.berat_gram}g</td>
                  <td className="py-2 text-right">
                    <span className={item.stok <= 0 ? "text-red-400" : ""}>
                      {item.stok}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openStokAdjust(item.id)}
                        className="rounded bg-green-600/20 px-2 py-0.5 text-[10px] text-green-400 hover:bg-green-600/30"
                      >
                        Stok
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="rounded bg-blue-600/20 px-2 py-0.5 text-[10px] text-blue-400 hover:bg-blue-600/30"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="rounded bg-red-600/20 px-2 py-0.5 text-[10px] text-red-400 hover:bg-red-600/30"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form Produk */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="w-full max-w-md rounded-t-lg bg-white p-4 sm:rounded-lg">
            <h3 className="mb-3 text-sm font-medium">
              {editId ? "Edit Produk" : "Tambah Produk Baru"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] text-gray-500">Kode</label>
                  <input
                    type="text"
                    value={form.kode}
                    onChange={(e) => setForm({ ...form, kode: e.target.value })}
                    className="w-full rounded-md border border-gray-300 bg-white px-2 py-2.5 text-xs sm:py-1.5"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-gray-500">Nama</label>
                  <input
                    type="text"
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    className="w-full rounded-md border border-gray-300 bg-white px-2 py-2.5 text-xs sm:py-1.5"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] text-gray-500">Logam</label>
                  <select
                    value={form.logam_id}
                    onChange={(e) => setForm({ ...form, logam_id: e.target.value })}
                    className="w-full rounded-md border border-gray-300 bg-white px-2 py-2.5 text-xs sm:py-1.5"
                  >
                    {Object.values(LOGAM).map((l) => (
                      <option key={l.id} value={l.id}>{l.nama}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-gray-500">Jenis</label>
                  <select
                    value={form.jenis}
                    onChange={(e) => setForm({ ...form, jenis: e.target.value })}
                    className="w-full rounded-md border border-gray-300 bg-white px-2 py-2.5 text-xs sm:py-1.5"
                  >
                    {LOGAM[form.logam_id]?.jenis.map((j) => (
                      <option key={j} value={j}>{j}</option>
                    )) || <option value="Kalung">Kalung</option>}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] text-gray-500">Berat (gram)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.berat_gram}
                    onChange={(e) => setForm({ ...form, berat_gram: +e.target.value })}
                    className="w-full rounded-md border border-gray-300 bg-white px-2 py-2.5 text-xs sm:py-1.5"
                    inputMode="decimal"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-gray-500">Ongkos Cetak</label>
                  <input
                    type="number"
                    value={form.ongkos_cetak}
                    onChange={(e) => setForm({ ...form, ongkos_cetak: +e.target.value })}
                    className="w-full rounded-md border border-gray-300 bg-white px-2 py-2.5 text-xs sm:py-1.5"
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] text-gray-500">Stok Awal</label>
                <input
                  type="number"
                  value={form.stok}
                  onChange={(e) => setForm({ ...form, stok: +e.target.value })}
                  className="w-full rounded-md border border-gray-300 bg-white px-2 py-2.5 text-xs sm:py-1.5"
                  inputMode="numeric"
                  disabled={!!editId}
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditId(null); }}
                  className="rounded-md px-3 py-2.5 text-xs text-gray-500 hover:text-gray-800 sm:py-1.5"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-3 py-2.5 text-xs text-white hover:bg-blue-700 sm:py-1.5"
                >
                  {editId ? "Update" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Stok Adjustment */}
      {stokAdjust.produkId > 0 && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="w-full max-w-sm rounded-t-lg bg-white p-4 sm:rounded-lg">
            <h3 className="mb-3 text-sm font-medium">Adjust Stok</h3>
            <form onSubmit={handleStokAdjust} className="space-y-3">
              <div>
                <label className="mb-1 block text-[10px] text-gray-500">Tipe</label>
                <select
                  value={stokAdjust.tipe}
                  onChange={(e) => setStokAdjust({ ...stokAdjust, tipe: e.target.value as any })}
                  className="w-full rounded-md border border-gray-300 bg-white px-2 py-2.5 text-xs sm:py-1.5"
                >
                  <option value="masuk">Stok Masuk</option>
                  <option value="keluar">Stok Keluar</option>
                  <option value="penyesuaian">Penyesuaian</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-gray-500">Jumlah</label>
                <input
                  type="number"
                  value={stokAdjust.jumlah}
                  onChange={(e) => setStokAdjust({ ...stokAdjust, jumlah: +e.target.value })}
                  className="w-full rounded-md border border-gray-300 bg-white px-2 py-2.5 text-xs sm:py-1.5"
                  inputMode="numeric"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-gray-500">Keterangan</label>
                <input
                  type="text"
                  value={stokAdjust.keterangan}
                  onChange={(e) => setStokAdjust({ ...stokAdjust, keterangan: e.target.value })}
                  className="w-full rounded-md border border-gray-300 bg-white px-2 py-2.5 text-xs sm:py-1.5"
                  placeholder="Opsional"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStokAdjust({ produkId: 0, jumlah: 0, tipe: "masuk", keterangan: "" })}
                  className="rounded-md px-3 py-2.5 text-xs text-gray-500 hover:text-gray-800 sm:py-1.5"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-green-600 px-3 py-2.5 text-xs text-white hover:bg-green-700 sm:py-1.5"
                >
                  Update Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}