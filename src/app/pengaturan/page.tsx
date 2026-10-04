"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/toast";
import type { AppSettings } from "@/lib/types";
import { getJSON } from "@/lib/fetch";

export default function PengaturanPage() {
  const toast = useToast();
  const [form, setForm] = useState<AppSettings | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const s = await getJSON<AppSettings>("/api/settings");
    if (s) {
      setForm(s);
      setLoadFailed(false);
    } else {
      setLoadFailed(true);
      toast("Gagal memuat pengaturan", "error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!form) return;
    if (!form.outletName.trim()) {
      toast("Nama outlet wajib diisi", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        toast(data?.message ?? "Gagal menyimpan", "error");
        return;
      }
      toast("Pengaturan berhasil disimpan");
      setForm(data);
    } finally {
      setSaving(false);
    }
  };
  const pickLogo = (file: File | null) => {
    if (!file || !form) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      toast("Logo harus berkas PNG/JPG/WebP", "error");
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, 512 / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        toast("Canvas tidak tersedia", "error");
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      let data = canvas.toDataURL("image/png");
      if (data.length > 300_000) data = canvas.toDataURL("image/jpeg", 0.85);
      if (data.length > 300_000) {
        toast("Logo terlalu besar setelah diperkecil", "error");
        return;
      }
      setForm({ ...form, logo: data });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      toast("Gagal membaca gambar", "error");
    };
    img.src = url;
  };

  if (!form) {
    return (
      <div className="mgmt-page">
        <div className="empty-state">
          {loadFailed ? (
            <>
              Gagal memuat pengaturan.
              <br />
              <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={() => load()}>
                Coba Lagi
              </button>
            </>
          ) : (
            "Memuat…"
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mgmt-page" style={{ maxWidth: 640 }}>
      <div className="panel-header">
        <h2>Pengaturan Toko</h2>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          Simpan
        </button>
      </div>

      <div className="table-container" style={{ padding: 20 }}>
        <div className="form-group">
          <label htmlFor="s-name">Nama Outlet *</label>
          <input
            id="s-name"
            value={form.outletName}
            onChange={(e) => setForm({ ...form, outletName: e.target.value })}
            placeholder="Nama outlet"
          />
          <div className="form-hint">Tampil di header struk</div>
        </div>
        <div className="form-group">
          <label htmlFor="s-logo">Logo Struk</label>
          {form.logo && (
            <img src={form.logo} alt="Pratinjau logo" style={{ maxHeight: 64, display: "block", marginBottom: 8 }} />
          )}
          <input
            id="s-logo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              pickLogo(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          {form.logo && (
            <button type="button" className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => setForm({ ...form, logo: null })}>
              Hapus Logo
            </button>
          )}
          <div className="form-hint">Tampil di header struk, otomatis diperkecil ke 512px. Klik Simpan untuk menerapkan.</div>
        </div>
        <div className="form-group">
          <label htmlFor="s-addr">Alamat</label>
          <input
            id="s-addr"
            value={form.outletAddress ?? ""}
            onChange={(e) => setForm({ ...form, outletAddress: e.target.value })}
            placeholder="Alamat outlet (opsional)"
          />
        </div>
        <div className="form-group">
          <label htmlFor="s-phone">Telepon</label>
          <input
            id="s-phone"
            value={form.outletPhone ?? ""}
            onChange={(e) => setForm({ ...form, outletPhone: e.target.value })}
            placeholder="Nomor telepon (opsional)"
          />
        </div>
        <div className="form-group">
          <label htmlFor="s-tax">PPN (%)</label>
          <input
            id="s-tax"
            type="number"
            min={0}
            max={100}
            value={form.taxRate}
            onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })}
          />
          <div className="form-hint">0–100. Dihitung dari (subtotal − diskon). Transaksi lama tetap memakai PPN saat transaksi itu.</div>
        </div>
        <div className="form-group">
          <label htmlFor="s-footer">Catatan Bawah Struk</label>
          <textarea
            id="s-footer"
            rows={2}
            value={form.receiptFooter}
            onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })}
            placeholder="Teks di bagian bawah struk"
          />
        </div>
      </div>
    </div>
  );
}