"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

interface UserData {
  id: number;
  tenant_id: number;
  email: string;
  nama: string;
  role: string;
  is_active: boolean;
  last_login?: string;
  created_at?: string;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  kasir: "Kasir",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "#B8860B",
  admin: "#60a5fa",
  kasir: "#a3a3a3",
};

export default function UsersPage() {
  const { user, tenant, loading, logout } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [form, setForm] = useState({ email: "", password: "", nama: "", role: "kasir" });
  const [error, setError] = useState("");
  const [loading2, setLoading2] = useState(false);

  const isOwner = user?.role === "admin";
  const isAdmin = user?.role === "admin" || isOwner;

  useEffect(() => {
    if (!loading && !user) router.push("/landing");
  }, [user, loading, router]);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/users");
      const d = await res.json();
      setUsers(d.data || []);
    } catch {}
  }

  function openAdd() {
    setEditingUser(null);
    setForm({ email: "", password: "", nama: "", role: "kasir" });
    setError("");
    setShowModal(true);
  }

  function openEdit(u: UserData) {
    setEditingUser(u);
    setForm({ email: u.email, password: "", nama: u.nama, role: u.role });
    setError("");
    setShowModal(true);
  }

  async function handleSubmit() {
    setError("");
    setLoading2(true);
    try {
      if (editingUser) {
        const body: any = { id: editingUser.id };
        if (form.nama) body.nama = form.nama;
        if (form.email) body.email = form.email;
        if (form.password) body.password = form.password;
        if (form.role) body.role = form.role;

        const res = await fetch("/api/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error);
      } else {
        if (!form.email || !form.password || !form.nama) {
          throw new Error("Semua field wajib diisi");
        }
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error);
      }
      setShowModal(false);
      fetchUsers();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading2(false);
    }
  }

  async function toggleActive(u: UserData) {
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: u.id, is_active: !u.is_active }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      fetchUsers();
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function deleteUser(u: UserData) {
    if (!confirm(`Nonaktifkan user ${u.nama}?`)) return;
    try {
      const res = await fetch(`/api/users?id=${u.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      fetchUsers();
    } catch (e: any) {
      alert(e.message);
    }
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <div className="text-center">
          <div className="mb-2 text-3xl">💎</div>
          <p className="text-[10px] text-neutral-400">Memuat...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: "dashboard", icon: "ti-dashboard", label: "Dashboard", href: "/dashboard" },
    { id: "pos", icon: "ti-point-of-sale", label: "POS", href: "/" },
    { id: "laporan", icon: "ti-chart-bar", label: "Laporan", href: "/laporan" },
    { id: "users", icon: "ti-users", label: "Kelola Kasir" },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Mobile header */}
      <div className="flex items-center justify-between border-b border-neutral-800 px-3 py-2 sm:hidden">
        <button onClick={() => setShowSidebar(!showSidebar)} className="rounded p-1 text-neutral-400 hover:bg-neutral-800">
          <i className="ti ti-menu-2 text-lg" />
        </button>
        <span className="text-xs font-medium">Kelola Kasir</span>
        <button onClick={() => router.push("/")} className="rounded p-1 text-neutral-400 hover:bg-neutral-800">
          <i className="ti ti-point-of-sale text-lg" />
        </button>
      </div>

      {/* Sidebar overlay (mobile) */}
      {showSidebar && (
        <div className="fixed inset-0 z-40 bg-black/50 sm:hidden" onClick={() => setShowSidebar(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 z-50 h-full w-56 border-r border-neutral-800 bg-neutral-950 p-3 transition-transform sm:translate-x-0 ${showSidebar ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-6 hidden items-center gap-2 sm:flex">
          <span className="text-lg">💎</span>
          <span className="text-xs font-medium">{tenant?.nama_toko ?? "Zomet POS"}</span>
        </div>
        <div className="mb-4 flex items-center justify-between sm:hidden">
          <div className="flex items-center gap-2">
            <span className="text-lg">💎</span>
            <span className="text-xs font-medium">Menu</span>
          </div>
          <button onClick={() => setShowSidebar(false)} className="rounded p-1 text-neutral-400">
            <i className="ti ti-x text-lg" />
          </button>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) =>
            item.href ? (
              <button
                key={item.id}
                onClick={() => { setShowSidebar(false); router.push(item.href!); }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
              >
                <i className={`ti ${item.icon} text-sm`} />
                {item.label}
              </button>
            ) : (
              <button
                key={item.id}
                onClick={() => setShowSidebar(false)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 bg-neutral-800 text-xs text-neutral-200"
              >
                <i className={`ti ${item.icon} text-sm`} />
                {item.label}
              </button>
            )
          )}
        </nav>
        <div className="absolute bottom-3 left-3 right-3">
          <button
            onClick={logout}
            className="w-full rounded-md px-2 py-1.5 text-left text-[10px] text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
          >
            <i className="ti ti-logout mr-1" /> Keluar
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3 sm:ml-56 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-sm font-medium sm:text-lg">
            <i className="ti ti-users mr-2" />
            Kelola Kasir
          </h1>
          {isAdmin && (
            <button
              onClick={openAdd}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-[10px] font-medium text-white hover:bg-amber-700 sm:text-xs"
            >
              + Tambah User
            </button>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto rounded-lg border border-neutral-800 sm:block">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-neutral-800 text-left text-neutral-500">
                <th className="px-3 py-2.5">Nama</th>
                <th className="px-3 py-2.5">Email</th>
                <th className="px-3 py-2.5">Role</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Login Terakhir</th>
                {isAdmin && <th className="px-3 py-2.5 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-neutral-800/50 last:border-0">
                  <td className="px-3 py-2.5 font-medium text-neutral-300">{u.nama}</td>
                  <td className="px-3 py-2.5 text-neutral-400">{u.email}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px]"
                      style={{ background: ROLE_COLORS[u.role] + "20", color: ROLE_COLORS[u.role] }}
                    >
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[10px] ${u.is_active ? "text-green-400" : "text-red-400"}`}>
                      {u.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[10px] text-neutral-500">
                    {u.last_login ? new Date(u.last_login).toLocaleString("id-ID") : "—"}
                  </td>
                  {isAdmin && (
                    <td className="px-3 py-2.5 text-right">
                      {u.role !== "admin" && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(u)}
                            className="rounded px-1.5 py-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
                            title="Edit"
                          >
                            <i className="ti ti-pencil text-sm" />
                          </button>
                          <button
                            onClick={() => toggleActive(u)}
                            className={`rounded px-1.5 py-1 hover:bg-neutral-800 ${u.is_active ? "text-amber-400" : "text-green-400"}`}
                            title={u.is_active ? "Nonaktifkan" : "Aktifkan"}
                          >
                            <i className={`ti ${u.is_active ? "ti-toggle-left" : "ti-toggle-right"} text-sm`} />
                          </button>
                          {isOwner && (
                            <button
                              onClick={() => deleteUser(u)}
                              className="rounded px-1.5 py-1 text-red-400 hover:bg-neutral-800"
                              title="Hapus"
                            >
                              <i className="ti ti-trash text-sm" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="py-8 text-center text-[10px] text-neutral-500">Belum ada user</div>
          )}
        </div>

        {/* Mobile Cards */}
        <div className="space-y-2 sm:hidden">
          {users.map((u) => (
            <div key={u.id} className="rounded-lg border border-neutral-800 p-3">
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{u.nama}</span>
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[9px]"
                    style={{ background: ROLE_COLORS[u.role] + "20", color: ROLE_COLORS[u.role] }}
                  >
                    {ROLE_LABELS[u.role]}
                  </span>
                </div>
                <span className={`text-[9px] ${u.is_active ? "text-green-400" : "text-red-400"}`}>
                  {u.is_active ? "Aktif" : "Nonaktif"}
                </span>
              </div>
              <div className="mb-2 text-[10px] text-neutral-500">{u.email}</div>
              <div className="text-[9px] text-neutral-600">
                Login: {u.last_login ? new Date(u.last_login).toLocaleString("id-ID") : "—"}
              </div>
              {isAdmin && u.role !== "admin" && (
                <div className="mt-2 flex gap-1.5">
                  <button
                    onClick={() => openEdit(u)}
                    className="rounded bg-neutral-800 px-2 py-1 text-[9px] text-neutral-300"
                  >
                    <i className="ti ti-pencil mr-1" />Edit
                  </button>
                  <button
                    onClick={() => toggleActive(u)}
                    className={`rounded px-2 py-1 text-[9px] ${u.is_active ? "bg-amber-900/30 text-amber-400" : "bg-green-900/30 text-green-400"}`}
                  >
                    {u.is_active ? "Nonaktif" : "Aktif"}
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => deleteUser(u)}
                      className="rounded bg-red-900/30 px-2 py-1 text-[9px] text-red-400"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
          {users.length === 0 && (
            <div className="rounded-lg border border-neutral-800 py-6 text-center text-[10px] text-neutral-500">
              Belum ada user
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3" onClick={() => setShowModal(false)}>
          <div
            className="w-full max-w-sm rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
              <h3 className="text-sm font-medium">{editingUser ? "Edit User" : "Tambah User"}</h3>
              <button onClick={() => setShowModal(false)} className="rounded p-1 text-neutral-400 hover:bg-neutral-800">
                <i className="ti ti-x text-lg" />
              </button>
            </div>
            <div className="p-4">
              {error && (
                <div className="mb-3 rounded-lg bg-red-900/30 px-3 py-2 text-[11px] text-red-400">{error}</div>
              )}
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[10px] text-neutral-500">Nama</label>
                  <input
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs outline-none"
                    placeholder="Nama lengkap"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-neutral-500">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs outline-none"
                    placeholder="email@contoh.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-neutral-500">
                    Password {editingUser && "(kosongkan jika tidak diubah)"}
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs outline-none"
                    placeholder="Minimal 6 karakter"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-neutral-500">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs outline-none"
                  >
                    <option value="kasir">Kasir</option>
                    {isOwner && <option value="admin">Admin</option>}
                  </select>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-neutral-700 py-2.5 text-xs text-neutral-400 hover:bg-neutral-800"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading2}
                  className="flex-1 rounded-lg bg-amber-600 py-2.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {loading2 ? "Menyimpan..." : editingUser ? "Update" : "Tambah"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
