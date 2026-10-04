"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog, Modal } from "@/components/ui";
import { useToast } from "@/components/toast";
import type { CategoryWithCount } from "@/lib/types";
import { getJSON } from "@/lib/fetch";

type Form = { id: string; name: string; description: string; displayOrder: string; isActive: boolean };

const empty: Form = { id: "", name: "", description: "", displayOrder: "0", isActive: true };

export default function KategoriPage() {
  const toast = useToast();
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CategoryWithCount | null>(null);

  const load = useCallback(async () => {
    const c = await getJSON<CategoryWithCount[]>("/api/categories");
    setCategories(c ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => categories.filter((c) => c.name.toLowerCase().includes(q)), [categories, q]);

  const save = async () => {
    if (!form) return;
    if (!form.name.trim()) {
      toast("Nama kategori wajib diisi", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(form.id ? `/api/categories/${form.id}` : "/api/categories", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          displayOrder: Number(form.displayOrder) || 0,
          isActive: form.isActive,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        toast(data?.message ?? "Gagal menyimpan", "error");
        return;
      }
      toast(form.id ? "Kategori berhasil diperbarui" : "Kategori berhasil ditambahkan");
      setForm(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/categories/${deleteTarget.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (res.ok && data) toast("Kategori berhasil dihapus");
    else toast(data?.message ?? "Gagal menghapus kategori", "error");
    setDeleteTarget(null);
    await load();
  };

  return (
    <div className="mgmt-page">
      <div className="panel-header">
        <h2>Daftar Kategori</h2>
        <button className="btn btn-primary" onClick={() => setForm({ ...empty })}>
          + Tambah Kategori
        </button>
      </div>

      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="Cari kategori..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Cari kategori"
        />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nama Kategori</th>
              <th>Deskripsi</th>
              <th>Jumlah Produk</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">Belum ada kategori. Tambahkan kategori pertama Anda.</div>
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.name}</strong>
                  </td>
                  <td style={{ color: "var(--muted)", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.description ?? "-"}
                  </td>
                  <td>
                    <span className="stock">{c.productCount}</span>
                  </td>
                  <td>
                    <span className={`badge-status ${c.isActive ? "badge-active" : "badge-inactive"}`}>{c.isActive ? "Aktif" : "Nonaktif"}</span>
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        className="action-btn edit"
                        title="Edit"
                        aria-label={`Edit ${c.name}`}
                        onClick={() =>
                          setForm({
                            id: c.id,
                            name: c.name,
                            description: c.description ?? "",
                            displayOrder: String(c.displayOrder),
                            isActive: c.isActive,
                          })
                        }
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button className="action-btn delete" title="Hapus" aria-label={`Hapus ${c.name}`} onClick={() => setDeleteTarget(c)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="table-footer">
          <span>Menampilkan {filtered.length} dari {categories.length} kategori</span>
        </div>
      </div>

      {form && (
        <Modal
          title={form.id ? "Edit Kategori" : "Tambah Kategori"}
          onClose={() => setForm(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setForm(null)} disabled={saving}>
                Batal
              </button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                Simpan Kategori
              </button>
            </>
          }
        >
          <div className="form-group">
            <label htmlFor="c-name">Nama Kategori *</label>
            <input id="c-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama kategori" />
          </div>
          <div className="form-group">
            <label htmlFor="c-desc">Deskripsi</label>
            <textarea id="c-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi kategori (opsional)" />
          </div>
          <div className="form-group">
            <label htmlFor="c-order">Urutan Tampilan</label>
            <input id="c-order" type="number" min={0} value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: e.target.value })} />
            <div className="form-hint">Angka lebih kecil muncul lebih dulu</div>
          </div>
          <div className="form-group">
            <label>Status *</label>
            <div className="toggle-group">
              <button type="button" className={`toggle-option ${form.isActive ? "selected" : ""}`} onClick={() => setForm({ ...form, isActive: true })}>
                Aktif
              </button>
              <button type="button" className={`toggle-option inactive ${!form.isActive ? "selected" : ""}`} onClick={() => setForm({ ...form, isActive: false })}>
                Nonaktif
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Hapus Kategori?"
          message={`Yakin hapus kategori "${deleteTarget.name}"? Tindakan ini tidak dapat dibatalkan.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}