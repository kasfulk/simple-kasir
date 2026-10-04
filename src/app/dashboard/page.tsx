"use client";

import { useEffect, useState } from "react";
import { rupiah } from "@/lib/format";
import { getJSON } from "@/lib/fetch";

type Summary = {
  revenue: number;
  txCount: number;
  profit: number;
  lowStockCount: number;
  dailySeries: { date: string; revenue: number }[];
  topProducts: { name: string; qty: number; revenue: number }[];
};

const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function DashboardPage() {
  const [s, setS] = useState<Summary | null>(null);

  useEffect(() => {
    getJSON<Summary>("/api/reports/summary").then(setS);
  }, []);

  if (!s) {
    return (
      <div className="mgmt-page">
        <div className="empty-state">Memuat…</div>
      </div>
    );
  }

  const max = Math.max(1, ...s.dailySeries.map((d) => d.revenue));

  return (
    <div className="mgmt-page">
      <div className="panel-header">
        <h2>Dashboard</h2>
      </div>

      <div className="dash-stats">
        <div className="dash-card">
          <span className="dash-card-label">Omzet 7 Hari</span>
          <span className="dash-card-value">{rupiah(s.revenue)}</span>
        </div>
        <div className="dash-card">
          <span className="dash-card-label">Transaksi</span>
          <span className="dash-card-value">{s.txCount}</span>
        </div>
        <div className="dash-card">
          <span className="dash-card-label">Estimasi Laba</span>
          <span className="dash-card-value">{rupiah(s.profit)}</span>
        </div>
        <div className="dash-card">
          <span className="dash-card-label">Stok Menipis</span>
          <span className="dash-card-value">{s.lowStockCount}</span>
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-panel">
          <h3>Omzet Harian (7 hari terakhir)</h3>
          <div className="dash-bars">
            {s.dailySeries.map((d) => (
              <div key={d.date} className="dash-bar-col" title={`${d.date}: ${rupiah(d.revenue)}`}>
                <div className="dash-bar" style={{ height: `${Math.max(2, Math.round((d.revenue / max) * 120))}px` }} />
                <span className="dash-bar-label">{HARI[new Date(`${d.date}T00:00:00+07:00`).getDay()]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-panel">
          <h3>Produk Terlaris</h3>
          {s.topProducts.length === 0 ? (
            <div className="empty-state">Belum ada penjualan.</div>
          ) : (
            <ul className="dash-top">
              {s.topProducts.map((t) => (
                <li key={t.name}>
                  <span>{t.name}</span>
                  <span className="stock">{t.qty}x · {rupiah(t.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
