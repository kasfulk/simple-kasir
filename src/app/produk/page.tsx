"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog, Modal } from "@/components/ui";
import { useToast } from "@/components/toast";
import { rupiah } from "@/lib/format";
import type { CategoryWithCount, ProductWithCategory } from "@/lib/types";
import { getJSON } from "@/lib/fetch";

type Form = {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  price: string;
  costPrice: string;
  stock: string;
  minStock: string;
  description: string;
  isActive: boolean;
};

const empty: Form = {
  id: "",
  sku: "",
  name: "",
  categoryId: "",
  price: "",
  costPrice: "",
  stock: "",
  minStock: "5",
  description: "",
  isActive: true,
};

export default function ProdukPage() {
  const toast = useToast();
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductWithCategory | null>(null);

  const load = useCallback(async () => {
    const [p, c] = await Promise.all([
      getJSON<{ items: ProductWithCategory[] }>("/api/products?pageSize=1000"),
      getJSON<CategoryWithCount[]>("/api/categories"),
    ]);
    setProducts(p?.items ?? []);
    setCategories(c ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    let list = products.filter(
      (p) =>
        (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) &&
        (!filterCat || p.categoryId === filterCat) &&
        (!filterStatus ||
          (filterStatus === "active" ? p.isActive : !p.isActive))
    );
    const cmp: Record<string, (a: ProductWithCategory, b: ProductWithCategory) => number> = {
      name: (a, b) => a.name.localeCompare(b.name),
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
      "stock-asc": (a, b) => a.stock - b.stock,
      "stock-desc": (a, b) => b.stock - a.stock,
    };
    list = [...list].sort(cmp[sort] ?? cmp.name);
    return list;
  }, [products, q, filterCat, filterStatus, sort]);

  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  const lowCount = products.filter((p) => p.stock < p.minStock).length;
  const activeCount = products.filter((p) => p.isActive).length;

  const openCreate = () => setForm({ ...empty });
  const openEdit = (p: ProductWithCategory) =>
    setForm({
      id: p.id,
      sku: p.sku,
      name: p.name,
      categoryId: p.categoryId,
      price: String(p.price),
      costPrice: p.costPrice == null ? "" : String(p.costPrice),
      stock: String(p.stock),
      minStock: String(p.minStock),
      description: p.description ?? "",
      isActive: p.isActive,
    });

  const save = async () => {
    if (!form) return;
    if (!form.sku.trim() || !form.name.trim() || !form.categoryId || form.price === "" || form.stock === "") {
      toast("Lengkapi SKU, nama, kategori, harga, dan stok", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(form.id ? `/api/products/${form.id}` : "/api/products", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: form.sku,
          name: form.name,
          categoryId: form.categoryId,
          price: Number(form.price),
          stock: Number(form.stock),
          minStock: Number(form.minStock) || 0,
          costPrice: form.costPrice === "" ? null : Number(form.costPrice),
          description: form.description,
          isActive: form.isActive,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        toast(data?.message ?? "Gagal menyimpan", "error");
        return;
      }
      toast(form.id ? "Produk berhasil diperbarui" : "Produk berhasil ditambahkan");
      setForm(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/products/${deleteTarget.id}`, { method: "DELETE" });
    if (res.ok) toast("Produk berhasil dihapus");
    else toast("Gagal menghapus produk", "error");
    setDeleteTarget(null);
    await load();
  };

  return (
    <div className="mgmt-page">
      <div className="panel-header">
        <h2>Daftar Produk</h2>
        <button className="btn btn-primary" onClick={openCreate}>
          + Tambah Produk
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Produk</div>
          <div className="stat-value">{products.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Stok Rendah</div>
          <div className="stat-value danger">{lowCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Produk Aktif</div>
          <div className="stat-value">{activeCount}</div>
        </div>
      </div>

      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="Cari produk berdasarkan nama atau SKU..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          aria-label="Cari produk"
        />
        <select className="filter-select" value={filterCat} onChange={(e) => setFilterCat(e.target.value)} aria-label="Filter kategori">
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} aria-label="Filter status">
          <option value="">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>
        <select className="filter-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Urutkan">
          <option value="name">Urutkan: Nama</option>
          <option value="price-asc">Harga: Rendah → Tinggi</option>
          <option value="price-desc">Harga: Tinggi → Rendah</option>
          <option value="stock-asc">Stok: Rendah → Tinggi</option>
          <option value="stock-desc">Stok: Tinggi → Rendah</option>
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Nama Produk</th>
              <th>Kategori</th>
              <th>Harga</th>
              <th>Stok</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">Belum ada produk yang sesuai filter.</div>
                </td>
              </tr>
            ) : (
              rows.map((p) => {
                const low = p.stock < p.minStock;
                return (
                  <tr key={p.id}>
                    <td>
                      <span className="sku">{p.sku}</span>
                    </td>
                    <td>
                      <strong>{p.name}</strong>
                    </td>
                    <td>
                      <span className="badge-status badge-category">{p.category.name}</span>
                    </td>
                    <td>
                      <span className="price">{rupiah(p.price)}</span>
                    </td>
                    <td>
                      <span className={`stock ${low ? "stock-low" : ""}`}>{p.stock}</span>
                    </td>
                    <td>
                      <span className={`badge-status ${p.isActive ? "badge-active" : "badge-inactive"}`}>
                        {p.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <button className="action-btn edit" onClick={() => openEdit(p)} title="Edit" aria-label={`Edit ${p.name}`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button className="action-btn delete" onClick={() => setDeleteTarget(p)} title="Hapus" aria-label={`Hapus ${p.name}`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div className="table-footer">
          <span>Menampilkan {rows.length} dari {filtered.length} produk</span>
          {totalPages > 1 && (
            <div className="pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button key={n} className={`page-btn ${n === safePage ? "active" : ""}`} onClick={() => setPage(n)}>
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {form && (
        <Modal
          title={form.id ? "Edit Produk" : "Tambah Produk"}
          onClose={() => setForm(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setForm(null)} disabled={saving}>
                Batal
              </button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                Simpan Produk
              </button>
            </>
          }
        >
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="p-sku">SKU *</label>
              <input id="p-sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Contoh: ESP-BEANS-001" />
              <div className="form-hint">Kode unik (huruf, angka, dan dash)</div>
            </div>
            <div className="form-group">
              <label htmlFor="p-cat">Kategori *</label>
              <select id="p-cat" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Pilih kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="p-name">Nama Produk *</label>
            <input id="p-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama lengkap produk" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="p-price">Harga Jual (Rp) *</label>
              <input id="p-price" type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" />
            </div>
            <div className="form-group">
              <label htmlFor="p-cost">Harga Pokok (Rp)</label>
              <input id="p-cost" type="number" min={0} value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} placeholder="0" />
              <div className="form-hint">Opsional, untuk perhitungan margin</div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="p-stock">Stok *</label>
              <input id="p-stock" type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="0" />
            </div>
            <div className="form-group">
              <label htmlFor="p-min">Minimum Stok</label>
              <input id="p-min" type="number" min={0} value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
              <div className="form-hint">Alert jika stok di bawah nilai ini</div>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="p-desc">Deskripsi</label>
            <textarea id="p-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi produk (opsional)" />
          </div>
          <div className="form-group">
            <label>Status *</label>
            <div className="toggle-group">
              <button
                type="button"
                className={`toggle-option ${form.isActive ? "selected" : ""}`}
                onClick={() => setForm({ ...form, isActive: true })}
              >
                Aktif
              </button>
              <button
                type="button"
                className={`toggle-option inactive ${!form.isActive ? "selected" : ""}`}
                onClick={() => setForm({ ...form, isActive: false })}
              >
                Nonaktif
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Hapus Produk?"
          message={`Yakin hapus "${deleteTarget.name}"? Tindakan ini tidak dapat dibatalkan.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}