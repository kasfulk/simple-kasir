"use client";

import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog, Modal } from "@/components/ui";
import { useToast } from "@/components/toast";
import { tanggalWaktu } from "@/lib/format";
import { getJSON } from "@/lib/fetch";

type UserRow = {
  id: string;
  username: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

type Form = { id: string; username: string; name: string; role: string; password: string; isActive: boolean };

const empty: Form = { id: "", username: "", name: "", role: "KASIR", password: "", isActive: true };

export default function PenggunaPage() {
  const toast = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [meId, setMeId] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);

  const load = useCallback(async () => {
    const [list, me] = await Promise.all([
      getJSON<UserRow[]>("/api/users"),
      getJSON<{ id: string }>("/api/auth/me"),
    ]);
    setUsers(list ?? []);
    setMeId(me?.id ?? "");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!form) return;
    if (!form.name.trim()) {
      toast("Nama wajib diisi", "error");
      return;
    }
    if (!form.id && !form.username.trim()) {
      toast("Username wajib diisi", "error");
      return;
    }
    if (!form.id && form.password.length < 6) {
      toast("Password minimal 6 karakter", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(form.id ? `/api/users/${form.id}` : "/api/users", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          form.id
            ? { name: form.name, role: form.role, isActive: form.isActive, password: form.password }
            : form
        ),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast(data?.message ?? "Gagal menyimpan pengguna", "error");
        return;
      }
      toast(form.id ? "Pengguna diperbarui" : "Pengguna ditambahkan");
      setForm(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/users/${deleteTarget.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    setDeleteTarget(null);
    if (!res.ok) {
      toast(data?.message ?? "Gagal menghapus pengguna", "error");
      return;
    }
    toast("Pengguna dihapus");
    load();
  };

  return (
    <div className="mgmt-page">
      <div className="panel-header">
        <h2>Manajemen Pengguna</h2>
        <button className="btn btn-primary" onClick={() => setForm({ ...empty })}>
          + Tambah Pengguna
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Username</th>
              <th>Peran</th>
              <th>Status</th>
              <th>Dibuat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">Belum ada pengguna.</div>
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.name}</strong>
                  </td>
                  <td>
                    <span className="sku">{u.username}</span>
                  </td>
                  <td>
                    <span className={`role-chip ${u.role === "OWNER" ? "role-owner" : "role-kasir"}`}>
                      {u.role === "OWNER" ? "Owner" : "Kasir"}
                    </span>
                  </td>
                  <td>
                    <span className={`badge-status ${u.isActive ? "badge-active" : "badge-inactive"}`}>
                      {u.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td>{tanggalWaktu(u.createdAt)}</td>
                  <td>
                    <div className="actions">
                      <button
                        className="action-btn edit"
                        title="Edit"
                        aria-label={`Edit ${u.name}`}
                        onClick={() =>
                          setForm({
                            id: u.id,
                            username: u.username,
                            name: u.name,
                            role: u.role,
                            password: "",
                            isActive: u.isActive,
                          })
                        }
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      {u.id !== meId && (
                        <button
                          className="action-btn delete"
                          title="Hapus"
                          aria-label={`Hapus ${u.name}`}
                          onClick={() => setDeleteTarget(u)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
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
          <span>Menampilkan {users.length} pengguna</span>
        </div>
      </div>

      {form && (
        <Modal
          title={form.id ? "Edit Pengguna" : "Tambah Pengguna"}
          onClose={() => setForm(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setForm(null)} disabled={saving}>
                Batal
              </button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                Simpan Pengguna
              </button>
            </>
          }
        >
          <div className="form-group">
            <label htmlFor="u-username">Username *</label>
            <input
              id="u-username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="username"
              disabled={!!form.id}
              autoComplete="off"
            />
            {form.id && <div className="form-hint">Username tidak dapat diubah</div>}
          </div>
          <div className="form-group">
            <label htmlFor="u-name">Nama *</label>
            <input
              id="u-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nama lengkap"
            />
          </div>
          <div className="form-group">
            <label htmlFor="u-password">Password {form.id ? "" : "*"}</label>
            <input
              id="u-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={form.id ? "Kosongkan jika tidak diubah" : "Minimal 6 karakter"}
              autoComplete="new-password"
            />
          </div>
          <div className="form-group">
            <label>Peran *</label>
            <div className="toggle-group">
              <button
                type="button"
                className={`toggle-option ${form.role === "OWNER" ? "selected" : ""}`}
                onClick={() => setForm({ ...form, role: "OWNER" })}
              >
                Owner
              </button>
              <button
                type="button"
                className={`toggle-option ${form.role === "KASIR" ? "selected" : ""}`}
                onClick={() => setForm({ ...form, role: "KASIR" })}
              >
                Kasir
              </button>
            </div>
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
          title="Hapus Pengguna?"
          message={`Yakin hapus pengguna "${deleteTarget.name}"? Tindakan ini tidak dapat dibatalkan.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}