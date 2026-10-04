"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog, Modal } from "@/components/ui";
import { useToast } from "@/components/toast";
import type { CustomerRow } from "@/lib/types";
import { getJSON } from "@/lib/fetch";

type Form = { id: string; name: string; phone: string; isActive: boolean };

const empty: Form = { id: "", name: "", phone: "", isActive: true };

export default function PelangganPage() {
  const toast = useToast();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomerRow | null>(null);

  const load = useCallback(async () => {
    setCustomers((await getJSON<CustomerRow[]>("/api/customers")) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const q = search.trim().toLowerCase();
  const filtered = useMemo(
    () => customers.filter((c) => c.name.toLowerCase().includes(q) || (c.phone ?? "").includes(q)),
    [customers, q]
  );

  const save = async () => {
    if (!form) return;
    if (!form.name.trim()) {
      toast("Nama pelanggan wajib diisi", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(form.id ? `/api/customers/${form.id}` : "/api/customers", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, phone: form.phone, isActive: form.isActive }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast(data?.message ?? "Gagal menyimpan pelanggan", "error");
        return;
      }
      toast(form.id ? "Pelanggan diperbarui" : "Pelanggan ditambahkan");
      setForm(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/customers/${deleteTarget.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast(data?.message ?? "Gagal menghapus pelanggan", "error");
      return;
    }
    toast("Pelanggan dihapus");
    setDeleteTarget(null);
    await load();
  };

  return (
    <div className="mgmt-page">
      <div className="panel-header">
        <h2>Pelanggan</h2>
        <button className="btn btn-primary" onClick={() => setForm({ ...empty })}>
          + Tambah Pelanggan
        </button>
      </div>

      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="Cari nama / telepon…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Cari pelanggan"
        />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Telepon</th>
              <th>Poin</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">Belum ada pelanggan.</div>
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.name}</strong>
                  </td>
                  <td>{c.phone ?? "-"}</td>
                  <td>
                    <span className="stock">{c.points}</span>
                  </td>
                  <td>
                    <span className={`badge-status ${c.isActive ? "badge-active" : "badge-inactive"}`}>
                      {c.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        className="action-btn"
                        title="Edit"
                        aria-label={`Edit ${c.name}`}
                        onClick={() => setForm({ id: c.id, name: c.name, phone: c.phone ?? "", isActive: c.isActive })}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                        </svg>
                      </button>
                      <button className="action-btn" title="Hapus" aria-label={`Hapus ${c.name}`} onClick={() => setDeleteTarget(c)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <Modal
          title={form.id ? "Edit Pelanggan" : "Tambah Pelanggan"}
          onClose={() => setForm(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setForm(null)} disabled={saving}>
                Batal
              </button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? "Menyimpan…" : "Simpan"}
              </button>
            </>
          }
        >
          <div className="form-group">
            <label htmlFor="c-name">Nama *</label>
            <input id="c-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama pelanggan" />
          </div>
          <div className="form-group">
            <label htmlFor="c-phone">Telepon</label>
            <input id="c-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08…" />
          </div>
          <div className="form-group">
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Aktif
            </label>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Hapus Pelanggan"
          message={`Hapus ${deleteTarget.name}? Riwayat transaksinya tetap tersimpan.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
