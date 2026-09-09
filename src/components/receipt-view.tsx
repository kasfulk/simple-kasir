"use client";

import Link from "next/link";
import { useState } from "react";
import { methodLabel, rupiah, tanggalWaktu } from "@/lib/format";

export type ReceiptData = {
  invoiceNo: string;
  subtotal: number;
  discount: number;
  taxRate: number;
  tax: number;
  total: number;
  method: string;
  cashierName: string | null;
  paid: number;
  change: number;
  createdAt: string;
  outletName: string;
  outletAddress: string | null;
  outletPhone: string | null;
  receiptFooter: string;
  items: { id: string; name: string; price: number; quantity: number }[];
};

export function ReceiptView({ t }: { t: ReceiptData }) {
  const [paper, setPaper] = useState<"53" | "80">("80");
  const width = paper === "53" ? "50mm" : "76mm";

  return (
    <>
      {/* ponytail: @page dinamis via style tag inline; pindah ke CSS print terpisah bila butuh preset kertas lain */}
      <style>{`@media print { @page { size: ${paper === "53" ? "53mm" : "80mm"} auto; margin: 3mm; } }`}</style>
      <div className="struk-page">
        <div className={`receipt ${paper === "53" ? "receipt-53" : ""}`} style={{ width }}>
          <div className="receipt-header">
            <h1 className="receipt-brand">{t.outletName}</h1>
            {t.outletAddress ? <p className="receipt-branch">{t.outletAddress}</p> : null}
            <div className="receipt-meta">
              <div className="meta-row">
                <span className="meta-label">Tanggal</span>
                <span>{tanggalWaktu(t.createdAt)}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">No. Inv</span>
                <span>#{t.invoiceNo}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Metode</span>
                <span>{methodLabel(t.method)}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Kasir</span>
                <span>{t.cashierName ?? "-"}</span>
              </div>
            {t.outletPhone && (
              <div className="meta-row">
                <span className="meta-label">Telp</span>
                <span>{t.outletPhone}</span>
              </div>
            )}
            </div>
          </div>

          <div className="receipt-body">
            <div className="item-list">
              {t.items.map((it) => (
                <div key={it.id} className="item-row">
                  <div className="item-name">{it.name}</div>
                  <div className="item-line">
                    <span className="item-qty">
                      {it.quantity} × {rupiah(it.price)}
                    </span>
                    <span className="item-price">{rupiah(it.price * it.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="receipt-summary">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{rupiah(t.subtotal)}</span>
            </div>
            {t.discount > 0 && (
              <div className="summary-row">
                <span>Diskon</span>
                <span>-{rupiah(t.discount)}</span>
              </div>
            )}
            {t.taxRate > 0 && (
              <div className="summary-row">
                <span>PPN ({t.taxRate}%)</span>
                <span>{rupiah(t.tax)}</span>
              </div>
            )}
            <div className="summary-row">
              <span>Total Produk</span>
              <span>{t.items.reduce((s, i) => s + i.quantity, 0)} pcs</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span className="amount">{rupiah(t.total)}</span>
            </div>
          </div>

          <div className="payment-section">
            <div className="summary-row">
              <span>Bayar</span>
              <span>{rupiah(t.paid)}</span>
            </div>
            <div className="summary-row">
              <span>Kembali</span>
              <span>{rupiah(t.change)}</span>
            </div>
          </div>

          <div className="receipt-footer">
            <p>{t.receiptFooter}</p>
          </div>
        </div>

        <div className="struk-actions" style={{ width }}>
          <div className="paper-toggle" role="group" aria-label="Lebar kertas struk">
            <button type="button" className={`chip ${paper === "53" ? "active" : ""}`} onClick={() => setPaper("53")}>
              Kertas 53mm
            </button>
            <button type="button" className={`chip ${paper === "80" ? "active" : ""}`} onClick={() => setPaper("80")}>
              Kertas 80mm
            </button>
          </div>
          <div className="paper-actions">
            <button className="btn-print" onClick={() => window.print()}>
              Cetak Struk
            </button>
            <Link className="btn-close" href="/riwayat">
              Tutup
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}