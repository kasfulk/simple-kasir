# Simple POS — Aplikasi Kasir

Aplikasi kasir multi-tenant: penjualan, produk, kategori, riwayat transaksi, manajemen pengguna, dashboard laba, pelanggan + poin loyalty, stok masuk, void transaksi, dan ekspor CSV. Dibangun dengan Next.js 15 (App Router), Prisma + SQLite, dan Tailwind tidak dipakai — styling CSS murni.

## Fitur Login & Role

- **Owner**: akses penuh — dashboard, produk, kategori, pelanggan, stok masuk, void transaksi, pengaturan outlet/PPN, dan manajemen pengguna.
- **Kasir**: buka kasir, riwayat transaksi, dan ekspor CSV riwayat.
- Sesi memakai cookie HttpOnly bertanda tangan HMAC-SHA256 (7 hari). Password di-hash PBKDF2-SHA256.

### Akun bawaan

Dibuat oleh `npm run db:seed -- users-only` (atau seed penuh) — dua tenant sebagai kendaraan uji isolasi:

| Username | Password  | Role  | Tenant      |
| -------- | --------- | ----- | ----------- |
| `owner`  | `owner` | Owner | Toko Utama  |
| `kasir`  | `kasir` | Kasir | Toko Utama  |
| `owner2` | `owner2` | Owner | Cabang B    |
| `kasir2` | `kasir2` | Kasir | Cabang B    |

Kelola akun lain dari halaman **Pengguna** (khusus Owner). Minimal harus tetap ada satu Owner aktif.

## Menjalankan

```bash
npm install
npm run db:push   # sinkronkan skema Prisma
npm run db:seed   # data contoh 2 tenant + akun owner/kasir/owner2/kasir2
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) dan login.

## Script

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm run start` | Build & jalankan produksi |
| `npm run db:push` | Terapkan `prisma/schema.prisma` ke SQLite |
| `npm run db:seed` | Reset data contoh |
| `npm run db:seed -- users-only` | (Re)set akun saja tanpa menyentuh data lain |
| `npm run db:tenants` | Backfill DB lama: semua data existing jadi milik tenant "Toko Utama" |
| `npm test` | Uji unit logika murni (CSV, poin, laporan) via `node --test` |


## Fitur

- **Multi-tenant**: semua data (kategori, produk, transaksi, pelanggan, stok masuk, pengaturan) terisolasi per tenant; sesi login membawa `tenantId`.
- **Dashboard** (Owner): omzet & estimasi laba 7 hari (dari snapshot harga pokok saat transaksi), produk terlaris, peringatan stok menipis.
- **Pelanggan + Loyalty**: poin otomatis 1 poin per Rp 1.000 dari nilai bersih (setelah diskon & tukar poin, sebelum pajak), diproses atomik bersama transaksi. Poin bisa ditukar saat checkout: 1 poin = Rp 100 (dibatasi saldo & nilai belanja), dan dipulihkan otomatis saat void.
- **Stok Masuk**: penerimaan barang menaikkan stok; opsi mengisi ulang harga pokok. Stok otomatis terpotong saat penjualan (race-safe).
- **Void Transaksi** (Owner): pembatalan sekali arah — stok dikembalikan, poin yang ditukar dipulihkan (poin yang didapat dicabut), transaksi dikeluarkan dari omzet, riwayat tetap utuh.
- **Ekspor CSV**: riwayat transaksi (mengikuti filter tanggal/metode) & daftar produk; BOM UTF-8 agar aman dibuka Excel.
- **Metode Pembayaran**: Tunai, Debit, QRIS, dan Invoice (non-tunai dicatat lunas — kembalian Rp 0).
- **Logo Struk**: upload gambar di Pengaturan (otomatis diperkecil ≤512px; PNG/JPG/WebP, maks ±220KB) — tampil di header struk layar & cetak.
- **Unduh Struk PNG**: tombol "Unduh Gambar" menyimpan struk aktif sebagai PNG resolusi 2× (zero-dependency).

## Catatan

- `DATABASE_URL` di `.env` menunjuk ke `prisma/dev.db`.
- `SESSION_SECRET` di `.env` dipakai untuk menandatangani cookie sesi (min. 32 karakter).
- Rencana jangka panjang: migrasi ke PostgreSQL saat siap produksi.