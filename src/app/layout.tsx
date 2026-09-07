import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { ToastProvider } from "@/components/toast";

export const metadata: Metadata = {
  title: "Simple POS — Aplikasi Kasir",
  description: "Aplikasi kasir sederhana: penjualan, produk, kategori, dan riwayat transaksi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <ToastProvider>
          <Navbar />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}