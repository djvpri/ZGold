"use client";
import { useEffect, useState } from "react";

let deferredPrompt: any = null;

export default function InstallPrompt() {
  const [showBtn, setShowBtn] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      setShowBtn(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Hide if already installed
    if ((window.navigator as any).standalone) setShowBtn(false);
    if (matchMedia("(display-mode: standalone)").matches) setShowBtn(false);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") setShowBtn(false);
    deferredPrompt = null;
  }

  if (!showBtn) return null;

  return (
    <>
      {/* Floating bottom banner */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-amber-500/30 bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-2.5 shadow-2xl">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">💎</span>
            <div>
              <div className="text-xs font-semibold text-white">Install Zomet POS</div>
              <div className="text-[9px] text-amber-100">Akses cepat dari layar utama</div>
            </div>
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => setShowBtn(false)}
              className="rounded-md px-2.5 py-1.5 text-[10px] font-medium text-amber-100 hover:text-white">
              Nanti
            </button>
            <button onClick={handleInstall}
              className="flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-[10px] font-semibold text-amber-700 shadow-lg hover:bg-amber-50">
              <i className="ti ti-download text-xs" />
              Install
            </button>
          </div>
        </div>
      </div>
      {/* Spacer for bottom banner */}
      <div className="h-14" />
    </>
  );
}
