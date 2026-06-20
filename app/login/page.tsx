"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

type LoginMode = "password" | "face";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loginMode, setLoginMode] = useState<LoginMode>("password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [faceStatus, setFaceStatus] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

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

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

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
      window.location.href = "/";
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFaceLogin() {
    setLoading(true);
    setError("");
    setFaceStatus("Mengaktifkan kamera...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }

      await new Promise((r) => setTimeout(r, 1500));
      setFaceStatus("Mendeteksi wajah...");
      await new Promise((r) => setTimeout(r, 1500));

      const video = videoRef.current!;
      const canvas = canvasRef.current!;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")!.drawImage(video, 0, 0);

      const blob = await new Promise<Blob>((r) => {
        canvas.toBlob((b) => r(b!), "image/jpeg", 0.8);
      });

      stopCamera();
      setFaceStatus("Memverifikasi wajah...");

      // Proxy to ZFace
      const formData = new FormData();
      formData.append("file", blob, "face.jpg");

      let zfaceData: any = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 30000);
          const res = await fetch("/api/auth/face-login", {
            method: "POST",
            body: formData,
            signal: controller.signal,
          });
          clearTimeout(timeout);
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || errData.error || "Wajah tidak terdaftar");
          }
          zfaceData = await res.json();
          break;
        } catch (err: any) {
          if (attempt < 3) {
            setFaceStatus(`Mencoba ulang... (${attempt}/3)`);
            await new Promise((r) => setTimeout(r, 1000));
            continue;
          }
          throw err;
        }
      }

      if (!zfaceData) throw new Error("Gagal menghubungi ZFace");

      setFaceStatus(`✓ ${zfaceData.person.name} — Login...`);

      // Verify + create session
      const verifyRes = await fetch("/api/auth/face-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faceToken: zfaceData.access_token }),
      });

      if (!verifyRes.ok) {
        const errData = await verifyRes.json().catch(() => ({}));
        throw new Error(errData.error || "Verifikasi gagal");
      }

      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || "Face login gagal");
      setFaceStatus("");
      stopCamera();
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
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-4 safe-top safe-bottom">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-6 text-center">
          <div className="mb-2 text-3xl sm:text-4xl">💎</div>
          <h1 className="text-lg font-medium text-neutral-100">Zomet POS</h1>
          <p className="text-[10px] text-neutral-500 sm:text-xs">Sistem Point of Sale Toko Perhiasan</p>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-1 rounded-lg bg-neutral-900 p-1">
          <button
            onClick={() => { setIsLogin(true); setError(""); stopCamera(); setFaceStatus(""); }}
            className={`flex-1 rounded-md py-2.5 text-xs font-medium transition ${isLogin ? "bg-neutral-800 text-white" : "text-neutral-400"}`}
          >
            Masuk
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(""); stopCamera(); setFaceStatus(""); }}
            className={`flex-1 rounded-md py-2.5 text-xs font-medium transition ${!isLogin ? "bg-neutral-800 text-white" : "text-neutral-400"}`}
          >
            Daftar Toko
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-3 rounded-md bg-red-900/30 p-2.5 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Login */}
        {isLogin ? (
          <>
            {/* Login mode toggle */}
            <div className="mb-3 flex gap-1 rounded-md bg-neutral-900 p-1">
              <button
                onClick={() => { setLoginMode("password"); setError(""); stopCamera(); setFaceStatus(""); }}
                className={`flex-1 rounded-md py-2 text-[10px] font-medium transition ${loginMode === "password" ? "bg-neutral-800 text-white" : "text-neutral-400"}`}
              >
                🔑 Password
              </button>
              <button
                onClick={() => { setLoginMode("face"); setError(""); setFaceStatus(""); }}
                className={`flex-1 rounded-md py-2 text-[10px] font-medium transition ${loginMode === "face" ? "bg-neutral-800 text-white" : "text-neutral-400"}`}
              >
                📷 Wajah
              </button>
            </div>

            {loginMode === "password" ? (
              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <label className="mb-1 block text-[10px] text-neutral-400">Email</label>
                  <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-3 text-sm text-neutral-100 outline-none focus:border-neutral-500"
                    autoComplete="email" inputMode="email" required />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-neutral-400">Password</label>
                  <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-3 text-sm text-neutral-100 outline-none focus:border-neutral-500"
                    autoComplete="current-password" required />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full rounded-md bg-amber-600 py-3 text-xs font-medium text-white transition hover:bg-amber-700 disabled:opacity-50">
                  {loading ? "Masuk..." : "Masuk"}
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="relative aspect-video bg-neutral-900 rounded-md overflow-hidden border border-neutral-700">
                  <video ref={videoRef} autoPlay playsInline muted
                    className={`w-full h-full object-cover ${cameraActive ? "" : "hidden"}`} />
                  <canvas ref={canvasRef} className="hidden" />
                  {!cameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <span className="mb-2 block text-3xl">📷</span>
                        <p className="text-[10px] text-neutral-500">Klik tombol di bawah</p>
                      </div>
                    </div>
                  )}
                  {faceStatus && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-2 text-center">
                      {faceStatus}
                    </div>
                  )}
                </div>
                <button onClick={handleFaceLogin} disabled={loading}
                  className="w-full rounded-md bg-amber-600 py-3 text-xs font-medium text-white transition hover:bg-amber-700 disabled:opacity-50">
                  {loading ? "Memproses..." : "📷 Login dengan Wajah"}
                </button>
              </div>
            )}
          </>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="mb-1 block text-[10px] text-neutral-400">Nama Toko</label>
              <input type="text" value={regNamaToko} required
                onChange={(e) => {
                  setRegNamaToko(e.target.value);
                  setRegSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-"));
                }}
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-3 text-sm text-neutral-100 outline-none focus:border-neutral-500" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-neutral-400">URL Toko</label>
              <div className="flex items-center rounded-md border border-neutral-700 bg-neutral-900">
                <span className="pl-3 text-[10px] text-neutral-600">zomet.id/</span>
                <input type="text" value={regSlug} required
                  onChange={(e) => setRegSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  className="w-full bg-transparent px-1 py-3 text-sm text-neutral-100 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[10px] text-neutral-400">Nama Pemilik</label>
                <input type="text" value={regOwnerName} required
                  onChange={(e) => setRegOwnerName(e.target.value)}
                  className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-3 text-sm text-neutral-100 outline-none focus:border-neutral-500" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-neutral-400">No. HP</label>
                <input type="tel" value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-3 text-sm text-neutral-100 outline-none focus:border-neutral-500"
                  inputMode="tel" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-neutral-400">Email</label>
              <input type="email" value={regEmail} required
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-3 text-sm text-neutral-100 outline-none focus:border-neutral-500"
                autoComplete="email" inputMode="email" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-neutral-400">Password</label>
              <input type="password" value={regPassword} required minLength={6}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-3 text-sm text-neutral-100 outline-none focus:border-neutral-500"
                autoComplete="new-password" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-md bg-amber-600 py-3 text-xs font-medium text-white transition hover:bg-amber-700 disabled:opacity-50">
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
