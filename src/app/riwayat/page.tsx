"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ConfirmDialog, Modal } from "@/components/ui";
import { useToast } from "@/components/toast";
import { methodLabel, rupiah, tanggalWaktu } from "@/lib/format";
import type { TransactionRow } from "@/lib/types";
import { getJSON } from "@/lib/fetch";

type Detail = {
  id: string;
  invoiceNo: string;
  subtotal: number;
  discount: number;
  tax: number;
  taxRate: number;
  total: number;
  method: string;
  paid: number;
  change: number;
  createdAt: string;
  items: { id: string; name: string; price: number; quantity: number }[];
};

export default function RiwayatPage() {
  const [date, setDate] = useState("");
  const [method, setMethod] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [voiding, setVoiding] = useState(false);
  const [voidTarget, setVoidTarget] = useState<TransactionRow | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (date) params.set("date", date);
    if (method) params.set("method", method);
    const data = await getJSON<{ items: TransactionRow[]; total: number }>(`/api/transactions?${params}`);
    setRows(data?.items ?? []);
    setTotal(data?.total ?? 0);
  }, [date, method, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    getJSON<{ role: string }>("/api/auth/me").then((u) => setIsOwner(u?.role === "OWNER"));
  }, []);

  const perPage = 20;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const openDetail = async (id: string) => {
    const d = await getJSON<Detail>(`/api/transactions/${id}`);
    if (!d) return;
    setDetail(d);
  };

  const voidTx = async () => {
    if (!voidTarget) return;
    setVoiding(true);
    try {
      const res = await fetch(`/api/transactions/${voidTarget.id}/void`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast(data?.message ?? "Gagal membatalkan transaksi", "error");
        return;
      }
      toast("Transaksi dibatalkan, stok dikembalikan");
      setVoidTarget(null);
      await load();
    } finally {
      setVoiding(false);
    }
  };

  return (
    <div className="mgmt-page">
      <div className="panel-header">
        <h2>Riwayat Transaksi</h2>
      </div>

      <div className="filter-bar">
        <input
          type="date"
          className="filter-select"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setPage(1);
          }}
          aria-label="Filter tanggal"
        />
        <select
          className="filter-select"
          value={method}
          onChange={(e) => {
            setMethod(e.target.value);
            setPage(1);
          }}
          aria-label="Filter metode"
        >
          <option value="">Semua Metode</option>
          <option value="TUNAI">Tunai</option>
          <option value="DEBIT">Kartu Debit</option>
          <option value="QRIS">QRIS</option>
        </select>
        <a
          className="btn btn-secondary"
          href={`/api/export/transactions?${new URLSearchParams({ ...(date ? { date } : {}), ...(method ? { method } : {}) })}`}
        >
          Ekspor CSV
        </a>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID Transaksi</th>
              <th>Tanggal</th>
              <th>Jumlah Item</th>
              <th>Total</th>
              <th>Metode</th>
              <th>Kasir</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">Belum ada transaksi.</div>
                </td>
              </tr>
            ) : (
              rows.map((t) => (
                <tr key={t.id}>
                  <td>
                    <span className="sku">{t.invoiceNo}</span>
                    {t.status === "VOID" && <span className="badge-status badge-inactive">VOID</span>}
                  </td>
                  <td>{tanggalWaktu(t.createdAt)}</td>
                  <td>
                    <span className="stock">{t.totalQty}</span>
                  </td>
                  <td>
                    <span className="price">{rupiah(t.total)}</span>
                  </td>
                  <td>{methodLabel(t.method)}</td>
                  <td style={{ color: "var(--muted)" }}>{t.cashierName ?? "-"}</td>
                  <td>
                    <div className="actions">
                      <button className="action-btn" title="Lihat Detail" aria-label={`Detail ${t.invoiceNo}`} onClick={() => openDetail(t.id)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <Link className="action-btn" title="Cetak Struk" aria-label={`Struk ${t.invoiceNo}`} href={`/struk/${t.id}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                      </Link>
                      {isOwner && t.status !== "VOID" && (
                        <button className="action-btn" title="Void Transaksi" aria-label={`Void ${t.invoiceNo}`} onClick={() => setVoidTarget(t)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="table-footer">
          <span>Menampilkan {rows.length} dari {total} transaksi</span>
          {totalPages > 1 && (
            <div className="pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button key={n} className={`page-btn ${n === page ? "active" : ""}`} onClick={() => setPage(n)}>
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {detail && (
        <Modal title={`Detail ${detail.invoiceNo}`} onClose={() => setDetail(null)} width={480}>
          <div className="detail-items">
            {detail.items.map((it) => (
              <div key={it.id} className="detail-item">
                <div>
                  <strong>{it.name}</strong>
                  <div className="qty">
                    {it.quantity} × {rupiah(it.price)}
                  </div>
                </div>
                <span className="price">{rupiah(it.price * it.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{rupiah(detail.subtotal)}</span>
          </div>
          {detail.discount > 0 && (
            <div className="summary-row">
              <span>Diskon</span>
              <span>-{rupiah(detail.discount)}</span>
            </div>
          )}
          {detail.taxRate > 0 && (
            <div className="summary-row">
              <span>PPN ({detail.taxRate}%)</span>
              <span>{rupiah(detail.tax)}</span>
            </div>
          )}
          <div className="summary-row total">
            <span>Total</span>
            <span className="amount">{rupiah(detail.total)}</span>
          </div>
          <div className="summary-row">
            <span>Bayar ({methodLabel(detail.method)})</span>
            <span>{rupiah(detail.paid)}</span>
          </div>
          <div className="summary-row">
            <span>Kembali</span>
            <span>{rupiah(detail.change)}</span>
          </div>
          <div style={{ marginTop: 16 }}>
            <Link className="btn btn-secondary" href={`/struk/${detail.id}`}>
              Lihat / Cetak Struk
            </Link>
          </div>
        </Modal>
      )}
      {voidTarget && (
        <ConfirmDialog
          title="Void Transaksi"
          message={`Batalkan ${voidTarget.invoiceNo}? Stok akan dikembalikan dan transaksi dikeluarkan dari omzet.`}
          confirmLabel="Void"
          onCancel={() => setVoidTarget(null)}
          onConfirm={voidTx}
        />
      )}
    </div>
  );
}