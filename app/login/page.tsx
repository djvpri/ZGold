"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form
  const [regNamaToko, setRegNamaToko] = useState("");
  const [regSlug, setRegSlug] = useState("");
  const [regOwnerName, setRegOwnerName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Full redirect supaya cookie terbaca middleware
      window.location.href = "/";
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_toko: regNamaToko,
          slug: regSlug || regNamaToko.toLowerCase().replace(/[^a-z0-9]/g, "-"),
          owner_name: regOwnerName,
          owner_email: regEmail,
          owner_phone: regPhone,
          password: regPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = "/";
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-6 text-center">
          <div className="mb-2 text-4xl">💎</div>
          <h1 className="text-xl font-medium text-neutral-100">Zomet POS</h1>
          <p className="text-xs text-neutral-500">Sistem Point of Sale Toko Perhiasan</p>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-1 rounded-lg bg-neutral-900 p-1">
          <button
            onClick={() => { setIsLogin(true); setError(""); }}
            className={`flex-1 rounded-md py-2 text-xs font-medium transition ${
              isLogin ? "bg-neutral-800 text-white" : "text-neutral-400"
            }`}
          >
            Masuk
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(""); }}
            className={`flex-1 rounded-md py-2 text-xs font-medium transition ${
              !isLogin ? "bg-neutral-800 text-white" : "text-neutral-400"
            }`}
          >
            Daftar Toko
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-3 rounded-md bg-red-900/30 p-2 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Login Form */}
        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="mb-1 block text-[10px] text-neutral-400">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-neutral-100 outline-none focus:border-neutral-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-neutral-400">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-neutral-100 outline-none focus:border-neutral-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-amber-600 py-2.5 text-xs font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
            >
              {loading ? "Masuk..." : "Masuk"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="mb-1 block text-[10px] text-neutral-400">Nama Toko</label>
              <input
                type="text"
                value={regNamaToko}
                onChange={(e) => {
                  setRegNamaToko(e.target.value);
                  setRegSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-"));
                }}
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-neutral-100 outline-none focus:border-neutral-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-neutral-400">Slug (URL toko)</label>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-neutral-600">zomet.id/</span>
                <input
                  type="text"
                  value={regSlug}
                  onChange={(e) => setRegSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-neutral-100 outline-none focus:border-neutral-500"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[10px] text-neutral-400">Nama Pemilik</label>
                <input
                  type="text"
                  value={regOwnerName}
                  onChange={(e) => setRegOwnerName(e.target.value)}
                  className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-neutral-100 outline-none focus:border-neutral-500"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-neutral-400">No. HP</label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-neutral-100 outline-none focus:border-neutral-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-neutral-400">Email</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-neutral-100 outline-none focus:border-neutral-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-neutral-400">Password</label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-neutral-100 outline-none focus:border-neutral-500"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-amber-600 py-2.5 text-xs font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
            >
              {loading ? "Mendaftar..." : "Daftarkan Toko"}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-[10px] text-neutral-600">
          v0.1.0 · Zomet POS Perhiasan
        </p>
      </div>
    </div>
  );
}