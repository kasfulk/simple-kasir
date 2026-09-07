"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Kasir" },
  { href: "/produk", label: "Produk" },
  { href: "/kategori", label: "Kategori" },
  { href: "/riwayat", label: "Riwayat" },
  { href: "/pengaturan", label: "Pengaturan" },
];

export function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="navbar">
      <Link href="/" className="navbar-brand">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
        <h2>Simple POS</h2>
      </Link>
      <div className="navbar-tabs">
        {tabs.map((t) => (
          <Link key={t.href} href={t.href} className={`nav-tab ${pathname === t.href ? "active" : ""}`}>
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}