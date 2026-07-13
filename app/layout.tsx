import type { Metadata, Viewport } from "next";
import { Cormorant, Montserrat } from "next/font/google";
import "./globals.css"
import "bootstrap-icons/font/bootstrap-icons.css";

const serif = Cormorant({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});
const sans = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import PWARegister from "@/components/PWARegister";
import InstallPrompt from "@/components/InstallPrompt";

export const metadata: Metadata = {
  title: "Zomet POS — Kasir Toko Perhiasan",
  description: "Sistem kasir modern untuk toko perhiasan emas, perak, dan platinum",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Zomet POS",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#f59e0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${serif.variable} ${sans.variable}`}>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3/dist/tabler-icons.min.css" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />
      </head>
      <body className="antialiased">
        <PWARegister />
        <InstallPrompt />
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}