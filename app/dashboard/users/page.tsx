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
  admin: "Admin",
  kasir: "Kasir",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "#60a5fa",
  kasir: "#a3a3a3",
};

export default function UsersPage() {
  const { user, tenant, loading, logout } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [form, setForm] = useState({ email: "", password: "", nama: "", role: "kasir" });
  const [error, setError] = useState("");
  const [loading2, setLoading2] = useState(false);

  const isAdmin = user?.role === "admin";

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

  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState("");

  async function handleResetPassword() {
    if (!resetUserId || !resetPassword) return;
    setResetError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: resetUserId, newPassword: resetPassword }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      alert("Password berhasil direset");
      setResetUserId(null);
      setResetPassword("");
    } catch (e: any) {
      setResetError(e.message);
    }
  }

  if (!user) return null;

  return (
    <div className="p-3 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-display flex items-center gap-2 text-2xl font-semibold sm:text-3xl">
            <i className="ti ti-users t-gold text-xl" />
            Kelola Kasir
          </h1>
          {isAdmin && (
            <button
              onClick={openAdd}
              className="btn-gold rounded-lg px-3 py-1.5 text-[10px] font-medium sm:text-xs"
            >
              + Tambah User
            </button>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto rounded-lg border t-border sm:block">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b t-border text-left t-text-4">
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
                <tr key={u.id} className="border-b t-border last:border-0">
                  <td className="px-3 py-2.5 font-medium t-text-2">{u.nama}</td>
                  <td className="px-3 py-2.5 t-text-3">{u.email}</td>
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
                  <td className="px-3 py-2.5 text-[10px] t-text-4">
                    {u.last_login ? new Date(u.last_login).toLocaleString("id-ID") : "—"}
                  </td>
                  {isAdmin && (
                    <td className="px-3 py-2.5 text-right">
                      {u.role !== "admin" && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(u)}
                            className="rounded px-1.5 py-1 t-text-3 t-bg-hover hover:t-text-2"
                            title="Edit"
                          >
                            <i className="ti ti-pencil text-sm" />
                          </button>
                          <button
                            onClick={() => toggleActive(u)}
                            className={`rounded px-1.5 py-1 t-bg-hover ${u.is_active ? "t-gold" : "text-green-400"}`}
                            title={u.is_active ? "Nonaktifkan" : "Aktifkan"}
                          >
                            <i className={`ti ${u.is_active ? "ti-toggle-left" : "ti-toggle-right"} text-sm`} />
                          </button>
                          <button
                            onClick={() => { setResetUserId(u.id); setResetPassword(""); }}
                            className="rounded px-1.5 py-1 t-gold t-bg-hover"
                            title="Reset Password"
                          >
                            <i className="ti ti-key text-sm" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => deleteUser(u)}
                              className="rounded px-1.5 py-1 text-red-400 t-bg-hover"
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
            <div className="py-8 text-center text-[10px] t-text-4">Belum ada user</div>
          )}
        </div>

        {/* Mobile Cards */}
        <div className="space-y-2 sm:hidden">
          {users.map((u) => (
            <div key={u.id} className="rounded-lg border t-border p-3">
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
              <div className="mb-2 text-[10px] t-text-4">{u.email}</div>
              <div className="text-[9px] t-text-3">
                Login: {u.last_login ? new Date(u.last_login).toLocaleString("id-ID") : "—"}
              </div>
              {isAdmin && u.role !== "admin" && (
                <div className="mt-2 flex gap-1.5">
                  <button
                    onClick={() => openEdit(u)}
                    className="rounded t-bg-muted px-2 py-1 text-[9px] t-text-2"
                  >
                    <i className="ti ti-pencil mr-1" />Edit
                  </button>
                  <button
                    onClick={() => toggleActive(u)}
                    className={`rounded px-2 py-1 text-[9px] ${u.is_active ? "t-gold-soft t-gold" : "bg-green-900/30 text-green-400"}`}
                  >
                    {u.is_active ? "Nonaktif" : "Aktif"}
                  </button>
                  <button
                    onClick={() => { setResetUserId(u.id); setResetPassword(""); }}
                    className="rounded t-gold-soft px-2 py-1 text-[9px] t-gold"
                  >
                    <i className="ti ti-key mr-1" />Reset PW
                  </button>
                  {isAdmin && (
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
            <div className="rounded-lg border t-border py-6 text-center text-[10px] t-text-4">
              Belum ada user
            </div>
          )}
        </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3" onClick={() => setShowModal(false)}>
          <div
            className="w-full max-w-sm rounded-xl border t-border-md t-bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b t-border px-4 py-3">
              <h3 className="text-sm font-medium">{editingUser ? "Edit User" : "Tambah User"}</h3>
              <button onClick={() => setShowModal(false)} className="rounded p-1 t-text-3 t-bg-hover">
                <i className="ti ti-x text-lg" />
              </button>
            </div>
            <div className="p-4">
              {error && (
                <div className="mb-3 rounded-lg bg-red-900/30 px-3 py-2 text-[11px] text-red-400">{error}</div>
              )}
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[10px] t-text-4">Nama</label>
                  <input
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    className="w-full rounded-lg border t-border-md t-bg-card px-3 py-2 text-xs outline-none"
                    placeholder="Nama lengkap"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] t-text-4">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-lg border t-border-md t-bg-card px-3 py-2 text-xs outline-none"
                    placeholder="email@contoh.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] t-text-4">
                    Password {editingUser && "(kosongkan jika tidak diubah)"}
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full rounded-lg border t-border-md t-bg-card px-3 py-2 text-xs outline-none"
                    placeholder="Minimal 6 karakter"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] t-text-4">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full rounded-lg border t-border-md t-bg-card px-3 py-2 text-xs outline-none"
                  >
                    <option value="kasir">Kasir</option>
                    {isAdmin && <option value="admin">Admin</option>}
                  </select>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border t-border-md py-2.5 text-xs t-text-3 t-bg-hover"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading2}
                  className="btn-gold flex-1 rounded-lg py-2.5 text-xs font-medium disabled:opacity-50"
                >
                  {loading2 ? "Menyimpan..." : editingUser ? "Update" : "Tambah"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setResetUserId(null)}>
          <div className="w-full max-w-sm rounded-xl t-bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-1 text-sm font-semibold t-text-2">Reset Password</h3>
            <p className="mb-3 text-[10px] t-text-4">Masukkan password baru untuk user ini</p>
            {resetError && <p className="mb-2 text-[10px] text-red-500">{resetError}</p>}
            <input
              type="text"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              placeholder="Password baru (min 4 karakter)"
              className="w-full rounded-lg border t-border-md px-3 py-2 text-xs outline-none"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
            />
            <div className="mt-3 flex gap-2">
              <button onClick={() => setResetUserId(null)}
                className="flex-1 rounded-lg border t-border-md py-2 text-xs t-text-3 t-bg-hover">
                Batal
              </button>
              <button onClick={handleResetPassword}
                className="btn-gold flex-1 rounded-lg py-2 text-xs font-medium">
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
