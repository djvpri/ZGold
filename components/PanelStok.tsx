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
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [formFotoBase64, setFormFotoBase64] = useState<string | null>(null);

  const [form, setForm] = useState({
    kode: "", logam_id: "emas", jenis: "Kalung",
    nama: "", berat_gram: 0, ongkos_cetak: 0, stok: 0,
  });

  const [stokAdjust, setStokAdjust] = useState({
    produkId: 0, jumlah: 0,
    tipe: "masuk" as "masuk" | "keluar" | "penyesuaian", keterangan: "",
  });

  function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = (reader.result as string).split(",")[1];
      setFormFotoBase64(b64);
    };
    reader.readAsDataURL(file);
  }

  const fetchProduk = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterLogam !== "all") params.set("logam", filterLogam);
      if (searchQuery) params.set("q", searchQuery);
      const url = `/api/produk${params.toString() ? "?" + params.toString() : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProduk(data.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProduk(); }, [filterLogam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editId ? "PATCH" : "POST";
      const body = editId
        ? { id: editId, ...form, ...(formFotoBase64 ? { foto_base64: formFotoBase64 } : {}) }
        : { ...form, ...(formFotoBase64 ? { foto_base64: formFotoBase64 } : {}) };
      const res = await fetch("/api/produk", {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowForm(false); setEditId(null); setFormFotoBase64(null);
      resetForm(); fetchProduk();
    } catch (e: any) { alert("Gagal menyimpan: " + e.message); }
  };

  const handleStokAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/produk", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: stokAdjust.produkId, stok_delta: stokAdjust.jumlah, stok_tipe: stokAdjust.tipe, keterangan: stokAdjust.keterangan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStokAdjust({ produkId: 0, jumlah: 0, tipe: "masuk", keterangan: "" });
      fetchProduk();
    } catch (e: any) { alert("Gagal update stok: " + e.message); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin hapus produk ini?")) return;
    try {
      const res = await fetch(`/api/produk?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal hapus");
      fetchProduk();
    } catch (e: any) { alert(e.message); }
  };

  const handleEdit = (item: ProdukItem) => {
    setFormFotoBase64(null);
    setForm({ kode: item.kode, logam_id: item.logam_id, jenis: item.jenis, nama: item.nama, berat_gram: item.berat_gram, ongkos_cetak: item.ongkos_cetak, stok: item.stok });
    setEditId(item.id);
    setShowForm(true);
  };

  const openStokAdjust = (produkId: number) => setStokAdjust({ ...stokAdjust, produkId });

  const resetForm = () => {
    setForm({ kode: "", logam_id: "emas", jenis: "Kalung", nama: "", berat_gram: 0, ongkos_cetak: 0, stok: 0 });
    setFormFotoBase64(null);
  };

  const getAccent = (logamId: string) => LOGAM[logamId]?.accent || "#6b7280";

  if (loading) return (
    <div className="py-8 text-center text-sm t-text-3">
      <i className="ti ti-loader-2 mb-2 block animate-spin text-3xl" />Memuat data stok...
    </div>
  );

  if (error) return (
    <div className="py-8 text-center text-sm text-red-400">
      <i className="ti ti-alert-circle mb-2 block text-3xl" />Error: {error}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider t-text-3">Manajemen Stok</span>
        <div className="flex flex-wrap gap-2">
          <input
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchProduk()}
            placeholder="Cari produk..." className="rounded-md border t-border-md t-bg-card px-3 py-2 text-xs sm:py-1"
          />
          <select value={filterLogam} onChange={(e) => setFilterLogam(e.target.value)}
            className="rounded-md border t-border-md t-bg-card px-2 py-2 text-xs sm:py-1">
            <option value="all">Semua Logam</option>
            {Object.values(LOGAM).map((l) => <option key={l.id} value={l.id}>{l.nama}</option>)}
          </select>
          <button onClick={() => { resetForm(); setEditId(null); setShowForm(true); }}
            className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600">
            <i className="ti ti-plus mr-1" />Tambah
          </button>
        </div>
      </div>

      {/* Ringkasan */}
      <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {Object.values(LOGAM).map((l) => {
          const lp = produk.filter((p) => p.logam_id === l.id);
          return (
            <div key={l.id} className="rounded-lg p-2" style={{ background: l.bg, color: l.textColor }}>
              <div className="text-[8px] uppercase tracking-wide opacity-70 sm:text-[10px]" style={{ color: l.accent }}>
                {l.nama.split(" ")[0]}
              </div>
              <div className="text-sm font-medium">{lp.reduce((a, b) => a + b.stok, 0)}</div>
            </div>
          );
        })}
      </div>

      {/* Mobile: card layout */}
      <div className="space-y-2 sm:hidden">
        {produk.length === 0 ? (
          <div className="py-8 text-center t-text-4">Belum ada produk</div>
        ) : produk.map((item) => (
          <div key={item.id} className="rounded-lg border t-border p-2.5">
            <div className="flex gap-2.5">
              {/* Foto */}
              <div
                onClick={() => item.foto_url && setFotoPreview(item.foto_url)}
                className="h-14 w-14 flex-shrink-0 rounded-lg overflow-hidden border t-border flex items-center justify-center"
                style={{ background: `${getAccent(item.logam_id)}15`, cursor: item.foto_url ? "pointer" : "default" }}
              >
                {item.foto_url
                  ? <img src={item.foto_url} alt={item.nama} className="h-full w-full object-cover" />
                  : <i className="ti ti-diamond text-xl" style={{ color: getAccent(item.logam_id) }} />
                }
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium t-text-2">{item.kode}</span>
                    <span className="rounded-full px-1.5 py-0.5 text-[8px]"
                      style={{ background: `${getAccent(item.logam_id)}20`, color: getAccent(item.logam_id) }}>
                      {LOGAM[item.logam_id]?.nama.split(" ")[0] || item.logam_id}
                    </span>
                  </div>
                  <span className={`text-sm font-medium ${item.stok <= 0 ? "text-red-400" : ""}`}>{item.stok}</span>
                </div>
                <div className="text-[11px] t-text-2 truncate">{item.nama}</div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[9px] t-text-4">{item.jenis} · {item.berat_gram}g</span>
                  <div className="flex gap-1">
                    <button onClick={() => openStokAdjust(item.id)} className="rounded bg-green-600/20 px-2 py-0.5 text-[9px] text-green-400">Stok</button>
                    <button onClick={() => handleEdit(item)} className="rounded bg-blue-600/20 px-2 py-0.5 text-[9px] text-blue-400">Edit</button>
                    <button onClick={() => handleDelete(item.id)} className="rounded bg-red-600/20 px-2 py-0.5 text-[9px] text-red-400">Hapus</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table layout */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b t-border text-left t-text-3">
              <th className="pb-2 w-10"></th>
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
              <tr><td colSpan={8} className="py-8 text-center t-text-4">Belum ada produk</td></tr>
            ) : produk.map((item) => (
              <tr key={item.id} className="border-b t-border">
                <td className="py-1.5">
                  <div
                    onClick={() => item.foto_url && setFotoPreview(item.foto_url)}
                    className="h-9 w-9 rounded-md overflow-hidden border t-border flex items-center justify-center"
                    style={{ background: `${getAccent(item.logam_id)}15`, cursor: item.foto_url ? "pointer" : "default" }}
                  >
                    {item.foto_url
                      ? <img src={item.foto_url} alt="" className="h-full w-full object-cover" />
                      : <i className="ti ti-diamond text-sm" style={{ color: getAccent(item.logam_id) }} />
                    }
                  </div>
                </td>
                <td className="py-2 font-medium">{item.kode}</td>
                <td className="py-2">{item.nama}</td>
                <td className="py-2">
                  <span className="rounded-full px-2 py-0.5 text-[10px]"
                    style={{ background: `${getAccent(item.logam_id)}20`, color: getAccent(item.logam_id) }}>
                    {LOGAM[item.logam_id]?.nama.split(" ")[0] || item.logam_id}
                  </span>
                </td>
                <td className="py-2">{item.jenis}</td>
                <td className="py-2 text-right">{item.berat_gram}g</td>
                <td className={`py-2 text-right font-medium ${item.stok <= 0 ? "text-red-400" : ""}`}>{item.stok}</td>
                <td className="py-2 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openStokAdjust(item.id)} className="rounded bg-green-600/20 px-2 py-1 text-[10px] text-green-400">Stok</button>
                    <button onClick={() => handleEdit(item)} className="rounded bg-blue-600/20 px-2 py-1 text-[10px] text-blue-400">Edit</button>
                    <button onClick={() => handleDelete(item.id)} className="rounded bg-red-600/20 px-2 py-1 text-[10px] text-red-400">Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form Tambah/Edit */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="w-full max-w-md rounded-t-lg t-bg-card p-4 sm:rounded-lg">
            <h3 className="mb-3 text-sm font-medium t-text-1">{editId ? "Edit Produk" : "Tambah Produk Baru"}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] t-text-3">Kode</label>
                  <input value={form.kode} onChange={(e) => setForm({ ...form, kode: e.target.value })}
                    className="w-full rounded-md border t-border-md t-bg-card px-2 py-2 text-xs" required />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] t-text-3">Nama</label>
                  <input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    className="w-full rounded-md border t-border-md t-bg-card px-2 py-2 text-xs" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] t-text-3">Logam</label>
                  <select value={form.logam_id} onChange={(e) => setForm({ ...form, logam_id: e.target.value })}
                    className="w-full rounded-md border t-border-md t-bg-card px-2 py-2 text-xs">
                    {Object.values(LOGAM).map((l) => <option key={l.id} value={l.id}>{l.nama}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] t-text-3">Jenis</label>
                  <select value={form.jenis} onChange={(e) => setForm({ ...form, jenis: e.target.value })}
                    className="w-full rounded-md border t-border-md t-bg-card px-2 py-2 text-xs">
                    {LOGAM[form.logam_id]?.jenis.map((j) => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] t-text-3">Berat (g)</label>
                  <input type="number" step="0.1" value={form.berat_gram}
                    onChange={(e) => setForm({ ...form, berat_gram: +e.target.value })}
                    className="w-full rounded-md border t-border-md t-bg-card px-2 py-2 text-xs" required />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] t-text-3">Ongkos Cetak</label>
                  <input type="number" value={form.ongkos_cetak}
                    onChange={(e) => setForm({ ...form, ongkos_cetak: +e.target.value })}
                    className="w-full rounded-md border t-border-md t-bg-card px-2 py-2 text-xs" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] t-text-3">Stok Awal</label>
                  <input type="number" value={form.stok}
                    onChange={(e) => setForm({ ...form, stok: +e.target.value })}
                    className="w-full rounded-md border t-border-md t-bg-card px-2 py-2 text-xs" />
                </div>
              </div>

              {/* Upload Foto */}
              <div>
                <label className="mb-1 block text-[10px] t-text-3">Foto Produk</label>
                <div className="flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border t-border-md px-3 py-2 text-xs t-text-3 hover:t-bg-muted">
                    <i className="ti ti-camera text-sm" />
                    {formFotoBase64 ? "Ganti Foto" : "Upload Foto"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleFotoUpload} />
                  </label>
                  {formFotoBase64 && (
                    <div className="relative">
                      <img src={`data:image/jpeg;base64,${formFotoBase64}`} alt="preview"
                        className="h-12 w-12 rounded-md object-cover border t-border" />
                      <button type="button" onClick={() => setFormFotoBase64(null)}
                        className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white">
                        <i className="ti ti-x text-[8px]" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setShowForm(false); setEditId(null); setFormFotoBase64(null); }}
                  className="flex-1 rounded-md border t-border py-2 text-xs t-text-3">Batal</button>
                <button type="submit" className="flex-1 rounded-md bg-amber-500 py-2 text-xs font-medium text-white hover:bg-amber-600">
                  {editId ? "Simpan" : "Tambah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Stok Adjust */}
      {stokAdjust.produkId > 0 && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="w-full max-w-sm rounded-t-lg t-bg-card p-4 sm:rounded-lg">
            <h3 className="mb-3 text-sm font-medium t-text-1">Update Stok</h3>
            <form onSubmit={handleStokAdjust} className="space-y-3">
              <div>
                <label className="mb-1 block text-[10px] t-text-3">Tipe</label>
                <select value={stokAdjust.tipe}
                  onChange={(e) => setStokAdjust({ ...stokAdjust, tipe: e.target.value as any })}
                  className="w-full rounded-md border t-border-md t-bg-card px-2 py-2 text-xs">
                  <option value="masuk">Masuk</option>
                  <option value="keluar">Keluar</option>
                  <option value="penyesuaian">Penyesuaian</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] t-text-3">Jumlah</label>
                <input type="number" value={stokAdjust.jumlah} min={1}
                  onChange={(e) => setStokAdjust({ ...stokAdjust, jumlah: +e.target.value })}
                  className="w-full rounded-md border t-border-md t-bg-card px-2 py-2 text-xs" required />
              </div>
              <div>
                <label className="mb-1 block text-[10px] t-text-3">Keterangan</label>
                <input value={stokAdjust.keterangan}
                  onChange={(e) => setStokAdjust({ ...stokAdjust, keterangan: e.target.value })}
                  placeholder="Opsional" className="w-full rounded-md border t-border-md t-bg-card px-2 py-2 text-xs" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setStokAdjust({ produkId: 0, jumlah: 0, tipe: "masuk", keterangan: "" })}
                  className="flex-1 rounded-md border t-border py-2 text-xs t-text-3">Batal</button>
                <button type="submit" className="flex-1 rounded-md bg-green-600 py-2 text-xs font-medium text-white">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview Foto */}
      {fotoPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setFotoPreview(null)}>
          <div className="relative max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <img src={fotoPreview} alt="Foto Produk" className="w-full rounded-xl object-contain max-h-[70vh]" />
            <button onClick={() => setFotoPreview(null)}
              className="absolute -top-3 -right-3 rounded-full bg-white p-1.5 text-gray-800 shadow-lg">
              <i className="ti ti-x text-sm" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
