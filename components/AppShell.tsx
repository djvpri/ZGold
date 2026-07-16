"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import BrandMark from "./BrandMark";

const NAV_ITEMS = [
  { id: "dashboard", icon: "ti-dashboard", label: "Dashboard", href: "/dashboard" },
  { id: "pos", icon: "ti-point-of-sale", label: "POS", href: "/" },
  { id: "laporan", icon: "ti-chart-bar", label: "Laporan", href: "/laporan" },
  { id: "users", icon: "ti-users", label: "Kelola Kasir", href: "/dashboard/users" },
  { id: "settings", icon: "ti-settings", label: "Pengaturan", href: "/dashboard?tab=settings" },
];

const PAGE_TITLES: Record<string, string> = {
  "/": "Kasir",
  "/dashboard": "Dashboard",
  "/dashboard/users": "Kelola Kasir",
  "/laporan": "Laporan Penjualan",
};

export default function AppShell({
  children,
  hideMobileHeader,
}: {
  children: React.ReactNode;
  hideMobileHeader?: boolean;
}) {
  const { user, tenant, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/landing");
  }, [user, loading, router]);

  // Close sidebar on route change
  useEffect(() => {
    setShowSidebar(false);
  }, [pathname]);

  if (loading || !user || !tenant) {
    return (
      <div className="flex min-h-screen items-center justify-center t-bg-base">
        <div className="text-center">
          <BrandMark className="mx-auto mb-3 h-12 w-12 text-2xl animate-pulse" />
          <p className="text-[10px] tracking-widest uppercase t-text-3">Memuat</p>
        </div>
      </div>
    );
  }

  const pageTitle = PAGE_TITLES[pathname] ?? "Dashboard";

  function isActive(item: (typeof NAV_ITEMS)[0]) {
    if (item.href.startsWith("/dashboard?")) return false;
    if (item.href === "/dashboard") return pathname === "/dashboard";
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  return (
    <div className="min-h-screen t-bg-base t-text-1 safe-top safe-bottom">
      {/* Mobile header */}
      {!hideMobileHeader && <div className="flex items-center justify-between border-b t-border px-3 py-2 sm:hidden">
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="rounded p-1 t-text-3 t-bg-hover"
        >
          <i className="ti ti-menu-2 text-lg" />
        </button>
        <span className="text-xs font-medium">{pageTitle}</span>
        <button onClick={() => router.push("/")} className="rounded p-1 t-text-3 t-bg-hover">
          <i className="ti ti-point-of-sale text-lg" />
        </button>
      </div>}

      {/* Sidebar overlay (mobile) */}
      {showSidebar && (
        <div
          className="fixed inset-0 z-40 bg-black/50 sm:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 z-50 h-full w-56 border-r t-border t-bg-base p-3 transition-transform sm:translate-x-0 ${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo - desktop */}
        <div className="mb-6 hidden items-center gap-2.5 sm:flex">
          <BrandMark className="h-8 w-8 text-base" />
          <span className="font-display truncate text-base font-semibold">
            {tenant.nama_toko}
          </span>
        </div>
        {/* Logo - mobile close button */}
        <div className="mb-4 flex items-center justify-between sm:hidden">
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-8 w-8 text-base" />
            <span className="font-display text-base font-semibold">Menu</span>
          </div>
          <button onClick={() => setShowSidebar(false)} className="rounded p-1 t-text-3">
            <i className="ti ti-x text-lg" />
          </button>
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.href)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                  active ? "t-gold-soft t-gold" : "t-text-3 t-bg-hover"
                }`}
              >
                <i className={`ti ${item.icon} text-sm`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-3 left-3 right-3">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] text-neutral-600">
            <span>{user.nama}</span>
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-medium text-white"
              style={{ background: user.role === "admin" ? "#059669" : "var(--gold)" }}
            >
              {user.role}
            </span>
          </div>
          <div className="mb-2">
            <span className="rounded-full t-bg-muted px-1.5 py-0.5 text-[9px] t-text-3">
              {tenant.plan}
            </span>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center rounded-lg px-2.5 py-2 text-left text-[10px] t-text-3 t-bg-hover transition"
          >
            <i className="ti ti-logout mr-1" /> Keluar
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="sm:ml-56">{children}</div>
    </div>
  );
}
