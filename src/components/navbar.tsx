"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/auth";

const tabs = [
  { href: "/", label: "Kasir", ownerOnly: false },
  { href: "/produk", label: "Produk", ownerOnly: true },
  { href: "/kategori", label: "Kategori", ownerOnly: true },
  { href: "/riwayat", label: "Riwayat", ownerOnly: false },
  { href: "/pengaturan", label: "Pengaturan", ownerOnly: true },
  { href: "/pengguna", label: "Pengguna", ownerOnly: true },
];

export function Navbar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const isOwner = user.role === "OWNER";

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

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
        {tabs
          .filter((t) => !t.ownerOnly || isOwner)
          .map((t) => (
            <Link key={t.href} href={t.href} className={`nav-tab ${pathname === t.href ? "active" : ""}`}>
              {t.label}
            </Link>
          ))}
      </div>
      <div className="navbar-user">
        <div className="navbar-id">
          <span className="navbar-name">{user.name}</span>
          <span className={`role-chip ${isOwner ? "role-owner" : "role-kasir"}`}>
            {isOwner ? "Owner" : "Kasir"}
          </span>
        </div>
        <button className="btn btn-ghost" onClick={logout}>
          Keluar
        </button>
      </div>
    </nav>
  );
}