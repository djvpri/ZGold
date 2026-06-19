import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "POS Toko Perhiasan — Zomet",
  description: "Point of Sale multi-logam: emas, perak, platinum, emas putih, palladium",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        {/* Tabler Icons via CDN */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3/dist/tabler-icons.min.css"
        />
      </head>
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
