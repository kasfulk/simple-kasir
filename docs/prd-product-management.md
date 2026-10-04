# PRD: Manajemen Produk & Kategori — Litensweet POS

## Intent Summary
Dokumen ini merinci kebutuhan fungsional untuk fitur manajemen produk dan kategori di dalam aplikasi kasir Litensweet. Fitur memungkinkan kasir/admin untuk mengelola daftar produk, kategori, harga, dan stok secara lengkap.

---

## 1. Users & Roles

| Role | Deskripsi | Akses |
|------|-----------|-------|
| **Admin** | Pemilik toko / manajer | CRUD penuh produk & kategori |
| **Kasir** | Staf kasir | View produk & kategori; tambah ke keranjang |
| **Super Admin** | (opsional) | Akses semua modul, termasuk laporan |

---

## 2. User Stories

### 2.1 Manajemen Kategori

| ID | Story | Priority |
|----|-------|----------|
| US-CAT-01 | Sebagai admin, saya bisa menambahkan kategori baru dengan nama dan deskripsi | P0 |
| US-CAT-02 | Sebagai admin, saya bisa mengedit nama/deskripsi kategori | P0 |
| US-CAT-03 | Sebagai admin, saya bisa menghapus kategori (jika tidak ada produk yang terikat) | P0 |
| US-CAT-04 | Sebagai kasir, saya bisa melihat daftar kategori di filter produk | P0 |
| US-CAT-05 | Sebagai admin, saya bisa mengatur urutan/display order kategori | P1 |

### 2.2 Manajemen Produk

| ID | Story | Priority |
|----|-------|----------|
| US-PROD-01 | Sebagai admin, saya bisa menambahkan produk baru (nama, kategori, harga, stok, SKU) | P0 |
| US-PROD-02 | Sebagai admin, saya bisa mengedit detail produk | P0 |
| US-PROD-03 | Sebagai admin, saya bisa menghapus produk | P0 |
| US-PROD-04 | Sebagai admin, saya bisa melihat daftar produk dengan pagination | P0 |
| US-PROD-05 | Sebagai kasir, saya bisa mencari produk berdasarkan nama/SKU | P0 |
| US-PROD-06 | Sebagai admin, saya bisa menginput/update stok produk | P1 |
| US-PROD-07 | Sebagai admin, saya bisa melihat produk dengan stok rendah (alert) | P1 |
| US-PROD-08 | Sebagai admin, saya bisa mengaktifkan/nonaktifkan produk tanpa menghapus | P2 |
| US-PROD-09 | Sebagai admin, saya bisa mengimpor produk via CSV | P2 |

---

## 3. Data Model

### 3.1 Kategori

```typescript
interface Category {
  id: string;           // UUID auto-generated
  name: string;         // Max 100 chars, unique
  description?: string; // Optional, max 500 chars
  displayOrder: number; // Default 0
  isActive: boolean;    // Default true
  createdAt: Date;
  updatedAt: Date;
  productCount?: number; // Computed
}
```

### 3.2 Produk

```typescript
interface Product {
  id: string;           // UUID auto-generated
  sku: string;          // Unique, required
  name: string;         // Max 200 chars
  categoryId: string;   // FK to Category
  description?: string; // Optional, max 1000 chars
  price: number;        // Integer (rupiah), min 0
  costPrice?: number;   // Optional, untuk margin calculation
  stock: number;        // Default 0
  minStock?: number;    // Threshold alert, default 5
  isActive: boolean;    // Default true
  image?: string;       // Base64 atau URL
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 4. Interface Specifications

### 4.1 Halaman Daftar Kategori

**Layout**: Tabel/list dengan actions

| Kolom | Deskripsi |
|-------|-----------|
| Nama | Teks kategori |
| Deskripsi | Teks opsional (truncate) |
| Jumlah Produk | Count produk |
| Status | Badge aktif/nonaktif |
| Aksi | Edit, Hapus |

**Header Actions**:
- Tombol `+ Tambah Kategori` (primary)
- Search box (opsional)

**Empty State**: Illustrasi + teks "Belum ada kategori. Tambahkan kategori pertama Anda."

---

### 4.2 Modal Tambah/Edit Kategori

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Nama Kategori | text input | Ya | Max 100, unique |
| Deskripsi | textarea | Tidak | Max 500 |
| Display Order | number input | Tidak | Min 0 |

**Actions**: Simpan, Batal

---

### 4.3 Halaman Daftar Produk

**Layout**: Tabel dengan filter & actions

| Filter Bar |
|------------|
| Search by Nama/SKU |
| Filter Kategori (dropdown/chips) |
| Filter Status (Semua/Aktif/Nonaktif) |
| Sort by (Nama/Harga/Stock) |

| Kolom Tabel | Deskripsi |
|-------------|-----------|
| SKU | Kode produk |
| Nama | Nama produk |
| Kategori | Nama kategori (badge) |
| Harga | Format Rupiah |
| Stok | Number, merah jika < minStock |
| Status | Badge aktif/nonaktif |
| Aksi | Edit, Hapus, Lihat |

**Header Actions**:
- Tombol `+ Tambah Produk` (primary)
- Export CSV (P2)

**Pagination**: 10-20 items per page

---

### 4.4 Modal Tambah/Edit Produk

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| SKU | text input | Ya | Unique, alphanumeric+dash |
| Nama Produk | text input | Ya | Max 200 |
| Kategori | select dropdown | Ya | Must exist & active |
| Harga | number input | Ya | Integer >= 0 |
| Harga Pokok | number input | Tidak | Integer >= 0, <= price |
| Stok Awal | number input | Ya | Integer >= 0 |
| Minimum Stok | number input | Tidak | Default 5 |
| Deskripsi | textarea | Tidak | Max 1000 |
| Gambar | file upload | Tidak | JPG/PNG, max 2MB |
| Status | toggle switch | Ya | Aktif/Nonaktif |

**Actions**: Simpan, Batal

---

### 4.5 Detail Produk (Slide-over/Modal)

Tampilan read-only dari data produk lengkap + riwayat stok (opsional).

---

## 5. Interaction Rules

### 5.1 Validasi

- SKU tidak boleh duplikat
- Nama produk tidak boleh kosong
- Harga harus integer positif
- Kategori harus dipilih sebelum menyimpan
- Tidak bisa menghapus kategori jika masih ada produk yang terikat

### 5.2 Konfirmasi Hapus

- Hapus kategori → konfirmasi modal "Yakin hapus kategori?"
- Hapus produk → konfirmasi modal "Yakin hapus produk?"

### 5.3 Notifikasi

- Toast sukses: "Produk berhasil ditambahkan"
- Toast error: "SKU sudah digunakan" / "Gagal menyimpan"

### 5.4 Stok Alert

- Produk dengan stok < minStock → highlight merah di tabel
- Badge "Stok Rendah" di kartu produk (jika menggunakan view kartu)

---

## 6. Visual & UX Guidelines

| Aspek | Spesifikasi |
|-------|-------------|
| Design System | Human / Approachable (sesuai wireframe kasir) |
| Warna Aksen | Emerald `#10b981` (aksi positif) |
| Warna Danger | Red `#ef4444` (hapus, stok rendah) |
| Typography | System sans-serif (ui-sans-serif) |
| Spacing | 8px base unit |
| Touch Target | Minimum 44px |
| Cards | Radius 8px, shadow subtle |

---

## 7. Screen Flow

```
[Kasir Main / POS]
    │  ← wireframe: kasir-wireframe.html (card grid + cart)
    │
    ├─> [Kelola Produk] ──> [Tabel Daftar Produk] (P0 - TBD)
    │                           │
    │                           ├─> [Modal Tambah/Edit Produk]
    │                           │
    │                           └─> [Detail Produk]
    │
    └─> [Kelola Kategori] ──> [Tabel Daftar Kategori] (P0 - TBD)
                                │
                                ├─> [Modal Tambah/Edit Kategori]
                                │
                                └─> [Detail Kategori]
```

---

## 8. Acceptance Criteria

### 8.1 Kategori

- [ ] Admin dapat menambahkan kategori dengan nama unik
- [ ] Admin dapat mengedit nama dan deskripsi kategori
- [ ] Admin dapat menghapus kategori kosong
- [ ] Sistem menolak hapus kategori yang masih memiliki produk
- [ ] Kasir dapat melihat kategori di filter produk

### 8.2 Produk

- [ ] Admin dapat menambahkan produk dengan validasi lengkap
- [ ] Admin dapat mengedit semua field produk
- [ ] Admin dapat menghapus produk dengan konfirmasi
- [ ] SKU unik dan tidak dapat diduplikasi
- [ ] Stok rendah ditandai dengan warna merah
- [ ] Produk nonaktif tidak muncul di keranjang kasir
- [ ] Pagination bekerja dengan benar

### 8.3 UI/UX

- [ ] Semua form memiliki validasi real-time
- [ ] Toast notifikasi muncul setelah aksi berhasil/gagal
- [ ] Konfirmasi modal sebelum hapus
- [ ] Layout responsif di desktop & tablet

---

## 9. Open Questions / TODO

- [ ] Apakah perlu fitur barcode scanning?
- [ ] Apakah perlu fitur duplikasi produk?
- [ ] Apakah perlu riwayat perubahan stok (stock log)?
- [ ] Apakah perlu batch edit/update stok?
- [ ] Apakah perlu integrasi dengan supplier?
- [ ] Apakah perlu variant produk (ukuran/warna)?

---

## 10. Current State & Next Steps

### Completed
- **POS Main Screen** (`kasir-wireframe.html`): Category filter chips, product card grid, cart panel, payment modal — matches PRD §2.1/2.2 filtering & display needs.
- `+` buttons for category & product (show toast until modals built).

### To Build (P0)
1. **Halaman Daftar Kategori** — tabel dengan kolom Nama/Deskripsi/Jumlah Produk/Status/Aksi
2. **Halaman Daftar Produk** — tabel dengan kolom SKU/Nama/Kategori/Harga/Stok/Status/Aksi + filter bar
3. **Modal Tambah/Edit Kategori** — form sesuai §4.2
4. **Modal Tambah/Edit Produk** — form sesuai §4.4

### Open Questions
(see §9)
