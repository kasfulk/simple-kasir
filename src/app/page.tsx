"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui";
import { useToast } from "@/components/toast";
import { rupiah } from "@/lib/format";
import type { CategoryWithCount, ProductWithCategory, AppSettings, CustomerRow } from "@/lib/types";
import { pointsToRp, usablePoints } from "@/lib/loyalty";
import { getJSON } from "@/lib/fetch";

type CartLine = { productId: string; name: string; price: number; quantity: number; stock: number };


export default function KasirPage() {
  const toast = useToast();
  const router = useRouter();
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [payOpen, setPayOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [method, setMethod] = useState("TUNAI");
  const [paidInput, setPaidInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [discountInput, setDiscountInput] = useState("");
  const [pointsInput, setPointsInput] = useState("");
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [customerId, setCustomerId] = useState("");

  useEffect(() => {
    Promise.all([
      getJSON<{ items: ProductWithCategory[] }>("/api/products?status=active&pageSize=500"),
      getJSON<CategoryWithCount[]>("/api/categories"),
      getJSON<AppSettings>("/api/settings"),
      getJSON<CustomerRow[]>("/api/customers"),
    ]).then(([p, c, s, cu]) => {
      setProducts(p?.items ?? []);
      setCategories(c ?? []);
      setSettings(s);
      setCustomers((cu ?? []).filter((x) => x.isActive));
    });
  }, []);

  const q = search.trim().toLowerCase();
  const visible = useMemo(
    () =>
      products.filter(
        (p) =>
          (categoryId === "all" || p.categoryId === categoryId) &&
          (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      ),
    [products, categoryId, q]
  );

  const addToCart = (p: ProductWithCategory) => {
    setCart((c) => {
      const line = c.find((l) => l.productId === p.id);
      if (line) {
        if (line.quantity >= p.stock) {
          toast(`Stok ${p.name} hanya ${p.stock}`, "error");
          return c;
        }
        return c.map((l) => (l.productId === p.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      if (p.stock < 1) {
        toast(`Stok ${p.name} habis`, "error");
        return c;
      }
      return [...c, { productId: p.id, name: p.name, price: p.price, quantity: 1, stock: p.stock }];
    });
  };

  const changeQty = (productId: string, delta: number) => {
    setCart((c) =>
      c
        .map((l) => {
          if (l.productId !== productId) return l;
          const next = l.quantity + delta;
          if (next > l.stock) {
            toast(`Stok ${l.name} hanya ${l.stock}`, "error");
            return l;
          }
          return { ...l, quantity: next };
        })
        .filter((l) => l.quantity > 0)
    );
  };

  const removeLine = (productId: string) => setCart((c) => c.filter((l) => l.productId !== productId));

  const subtotal = cart.reduce((s, l) => s + l.price * l.quantity, 0);
  const taxRate = settings?.taxRate ?? 10;
  const tax = Math.round(subtotal * (taxRate / 100));
  const total = subtotal + tax;
  const totalQty = cart.reduce((s, l) => s + l.quantity, 0);
  const discountValue = Number(discountInput) || 0;
  const discountValid = discountInput === "" || (/^\d+$/.test(discountInput) && discountValue <= subtotal);
  const safeDiscount = discountValid ? discountValue : 0;
  const netSubtotal = subtotal - safeDiscount;
  const customer = customers.find((c) => c.id === customerId) ?? null;
  const pointsRequested = customer ? Math.max(0, Number(pointsInput) || 0) : 0;
  const pointsUsed = customer ? usablePoints(pointsRequested, customer.points, netSubtotal) : 0;
  const redeemRp = pointsToRp(pointsUsed);
  const finalNet = netSubtotal - redeemRp;
  const discountedTax = Math.round((finalNet * taxRate) / 100);
  const discountedTotal = finalNet + discountedTax;

  const openPayment = () => {
    setCartOpen(false);
    setMethod("TUNAI");
    setPaidInput("");
    setDiscountInput("");
    setCustomerId("");
    setPointsInput("");
    setPayOpen(true);
  };

  const paid = method === "TUNAI" ? Number(paidInput) || 0 : discountedTotal;
  const diff = paid - discountedTotal;

  const finish = async () => {
    if (cart.length === 0) return;
    if (!discountValid) {
      toast("Diskon tidak valid", "error");
      return;
    }
    if (method === "TUNAI" && paid < discountedTotal) {
      toast("Uang bayar kurang dari total", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          discount: safeDiscount,
          paid,
          points: pointsUsed,
          customerId: customerId || undefined,
          items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        toast(data?.message ?? "Gagal memproses transaksi", "error");
        return;
      }
      toast("Pembayaran berhasil!");
      setCart([]);
      setPayOpen(false);
      router.push(`/struk/${data.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  const cashChips = [discountedTotal, ...[20000, 50000, 100000, 200000].filter((n) => n > discountedTotal)];

  return (
    <div className={`app ${cartOpen ? "cart-open" : ""}`}>
      <div className="cart-backdrop" onClick={() => setCartOpen(false)} />
      <aside className="cart-panel">
        <div className="cart-header">
          <h1>Keranjang</h1>
          <div className="cart-header-actions">
            <span className="badge">{totalQty} item</span>
            <button className="btn btn-ghost btn-icon cart-close" onClick={() => setCartOpen(false)} aria-label="Tutup keranjang">
              ✕
            </button>
          </div>
        </div>
        <div className="cart-body">
          {cart.length === 0 ? (
            <div className="empty-state">Belum ada item. Ketuk produk untuk menambahkan.</div>
          ) : (
            cart.map((l) => (
              <div key={l.productId} className="cart-item">
                <div className="cart-item-name">{l.name}</div>
                <div className="cart-item-qty">
                  <button className="qty-btn" onClick={() => changeQty(l.productId, -1)} aria-label="Kurangi">
                    −
                  </button>
                  <span className="qty-value">{l.quantity}</span>
                  <button className="qty-btn" onClick={() => changeQty(l.productId, 1)} aria-label="Tambah">
                    +
                  </button>
                  <button className="qty-btn remove" onClick={() => removeLine(l.productId)} aria-label="Hapus">
                    ×
                  </button>
                </div>
                <div className="cart-item-price">{rupiah(l.price * l.quantity)}</div>
              </div>
            ))
          )}
        </div>
        <div className="cart-footer">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{rupiah(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>PPN ({taxRate}%)</span>
            <span>{rupiah(tax)}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span className="amount">{rupiah(total)}</span>
          </div>
          <button className="btn-primary" disabled={cart.length === 0} onClick={openPayment}>
            Bayar
          </button>
        </div>
      </aside>

      <main className="product-panel">
        <div className="product-header">
          <input
            className="search-input"
            placeholder="Cari produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Cari produk"
          />
          <div className="category-chips">
            <button className={`chip ${categoryId === "all" ? "active" : ""}`} onClick={() => setCategoryId("all")}>
              Semua
            </button>
            {categories
              .filter((c) => c.isActive)
              .map((c) => (
                <button key={c.id} className={`chip ${categoryId === c.id ? "active" : ""}`} onClick={() => setCategoryId(c.id)}>
                  {c.name}
                </button>
              ))}
          </div>
        </div>
        <div className="product-grid">
          {visible.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
              Produk tidak ditemukan.
            </div>
          ) : (
            visible.map((p) => (
              <button key={p.id} className="product-card" onClick={() => addToCart(p)} disabled={p.stock < 1}>
                <div className="product-img">
                  <span>{p.category.name.toUpperCase()}</span>
                  <span className="ph-label">img</span>
                </div>
                <div className="product-info">
                  <p className="product-name">{p.name}</p>
                  <p className="product-price">{rupiah(p.price)}</p>
                  {p.stock < p.minStock && <span className="stock-flag">Stok {p.stock}</span>}
                </div>
              </button>
            ))
          )}
        </div>
      </main>
      <div className="mobile-cart-bar">
        <button className="btn btn-secondary" onClick={() => setCartOpen(true)} disabled={cart.length === 0}>
          Keranjang ({totalQty})
        </button>
        <button className="btn btn-primary" onClick={openPayment} disabled={cart.length === 0}>
          Bayar · {rupiah(total)}
        </button>
      </div>

      {payOpen && (
        <Modal
          title="Pembayaran"
          onClose={() => setPayOpen(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setPayOpen(false)} disabled={submitting}>
                Batal
              </button>
              <button className="btn btn-primary" onClick={finish} disabled={submitting || !discountValid || (method === "TUNAI" && paid < discountedTotal)}>
                {submitting ? "Memproses…" : "Selesai"}
              </button>
            </>
          }
        >
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{rupiah(subtotal)}</span>
          </div>
          <div className="form-group" style={{ margin: "10px 0 8px" }}>
            <label htmlFor="pay-discount">Diskon (Rp)</label>
            <input
              id="pay-discount"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="0"
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
            />
          </div>
          <div className="summary-row">
            <span>PPN ({taxRate}%)</span>
            <span>{rupiah(discountedTax)}</span>
          </div>
          <div className="summary-row total" style={{ borderBottom: "none", padding: 0, margin: "0 0 14px" }}>
            <span>Total Bayar</span>
            <span className="amount">{rupiah(discountedTotal)}</span>
          </div>
          <div className="form-group">
            <label htmlFor="pay-customer">Pelanggan (opsional)</label>
            <select id="pay-customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">— Tanpa pelanggan —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.points} poin
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="pay-points">Tukar Poin{customer ? ` (tersedia ${customer.points})` : " (pilih pelanggan dulu)"}</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                id="pay-points"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="0"
                value={pointsInput}
                disabled={!customer}
                onChange={(e) => setPointsInput(e.target.value)}
              />
              {customer && (
                <button type="button" className="btn btn-ghost" onClick={() => setPointsInput(String(customer.points))}>
                  Pakai Semua
                </button>
              )}
            </div>
            {pointsUsed > 0 && (
              <p style={{ margin: "4px 0 0" }}>{pointsUsed} poin = -{rupiah(redeemRp)}</p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="pay-method">Metode Pembayaran</label>
            <select id="pay-method" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="TUNAI">Tunai</option>
              <option value="DEBIT">Kartu Debit</option>
              <option value="QRIS">QRIS</option>
              <option value="INVOICE">Invoice</option>
            </select>
          </div>
          {method === "TUNAI" ? (
            <>
              <div className="form-group">
                <label htmlFor="pay-amount">Jumlah Uang Diterima</label>
                <input
                  id="pay-amount"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="0"
                  value={paidInput}
                  onChange={(e) => setPaidInput(e.target.value)}
                />
                <div className="quick-cash">
                  {cashChips.map((n, i) => (
                    <button key={n} type="button" className={`chip ${i === 0 ? "active" : ""}`} onClick={() => setPaidInput(String(n))}>
                      {i === 0 ? "Uang Pas" : `${n / 1000}rb`}
                    </button>
                  ))}
                </div>
              </div>
              <div className={`change-display ${paid > 0 && diff < 0 ? "less" : ""}`}>
                {paid <= 0 ? "Kembalian: Rp 0" : diff < 0 ? `Kurang: ${rupiah(-diff)}` : `Kembalian: ${rupiah(diff)}`}
              </div>
            </>
          ) : (
            <div className="change-display">
              {method === "QRIS" ? "Scan QRIS untuk menyelesaikan pembayaran" : method === "INVOICE" ? "Pembayaran dicatat sebagai tagihan invoice" : "Silakan gesek/tap kartu"}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}