import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { ToastProvider } from "@/components/toast";
import { getSessionUser } from "@/lib/auth-server";

export const metadata: Metadata = {
  title: "Simple POS — Aplikasi Kasir",
  description: "Aplikasi kasir sederhana: penjualan, produk, kategori, dan riwayat transaksi",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();
  return (
    <html lang="id">
      <body>
        <ToastProvider>
          {user && <Navbar user={user} />}
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}