"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/toast";
import { rupiah, tanggalWaktu } from "@/lib/format";
import type { ProductWithCategory } from "@/lib/types";
import { getJSON } from "@/lib/fetch";

type StockInRow = {
  id: string;
  quantity: number;
  unitCost: number | null;
  note: string | null;
  createdAt: string;
  product: { name: string; sku: string };
};

export default function StokMasukPage() {
  const toast = useToast();
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [rows, setRows] = useState<StockInRow[]>([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [p, r] = await Promise.all([
      getJSON<{ items: ProductWithCategory[] }>("/api/products?pageSize=500"),
      getJSON<StockInRow[]>("/api/stock-ins"),
    ]);
    setProducts(p?.items ?? []);
    setRows(r ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const lows = products.filter((p) => p.stock < p.minStock);

  const submit = async () => {
    if (!productId) {
      toast("Pilih produk", "error");
      return;
    }
    if (!/^\d+$/.test(quantity) || Number(quantity) < 1) {
      toast("Jumlah harus angka bulat >= 1", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/stock-ins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          quantity: Number(quantity),
          unitCost: unitCost === "" ? null : Number(unitCost),
          note,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast(data?.message ?? "Gagal menyimpan stok masuk", "error");
        return;
      }
      toast(`Stok masuk tersimpan (+${quantity})`);
      setProductId("");
      setQuantity("");
      setUnitCost("");
      setNote("");
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mgmt-page">
      <div className="panel-header">
        <h2>Stok Masuk</h2>
      </div>

      <div className="dash-grid">
        <div className="dash-panel">
          <h3>Terima Barang</h3>
          <div className="form-group">
            <label htmlFor="si-product">Produk *</label>
            <select id="si-product" value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">— Pilih produk —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — stok {p.stock}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="si-qty">Jumlah *</label>
              <input id="si-qty" type="number" inputMode="numeric" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" />
            </div>
            <div className="form-group">
              <label htmlFor="si-cost">Harga Beli / unit</label>
              <input id="si-cost" type="number" inputMode="numeric" min={0} value={unitCost} onChange={(e) => setUnitCost(e.target.value)} placeholder=" opsional" />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="si-note">Catatan</label>
            <input id="si-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder=" mis. invoice supplier" />
          </div>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? "Menyimpan…" : "Simpan Stok Masuk"}
          </button>
        </div>

        <div className="dash-panel">
          <h3>Stok Menipis</h3>
          {lows.length === 0 ? (
            <div className="empty-state">Semua stok aman.</div>
          ) : (
            <ul className="dash-top">
              {lows.map((p) => (
                <li key={p.id}>
                  <span>{p.name}</span>
                  <span className="stock stock-low">{p.stock} / min {p.minStock}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="table-container" style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Produk</th>
              <th>Jumlah</th>
              <th>Harga Beli</th>
              <th>Catatan</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">Belum ada penerimaan barang.</div>
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>{tanggalWaktu(r.createdAt)}</td>
                  <td>
                    <strong>{r.product.name}</strong> <span className="sku">{r.product.sku}</span>
                  </td>
                  <td>
                    <span className="stock">+{r.quantity}</span>
                  </td>
                  <td>{r.unitCost != null ? rupiah(r.unitCost) : "-"}</td>
                  <td style={{ color: "var(--muted)" }}>{r.note ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
