# Simple POS — Aplikasi Kasir

Aplikasi kasir sederhana: penjualan, produk, kategori, riwayat transaksi, dan manajemen pengguna. Dibangun dengan Next.js 15 (App Router), Prisma + SQLite, dan Tailwind tidak dipakai — styling CSS murni.

## Fitur Login & Role

- **Owner**: akses penuh — kelola produk, kategori, riwayat, pengaturan outlet/PPN, dan manajemen pengguna.
- **Kasir**: buka kasir dan riwayat transaksi; tidak dapat mengubah produk/kategori/pengaturan.
- Sesi memakai cookie HttpOnly bertanda tangan HMAC-SHA256 (7 hari). Password di-hash PBKDF2-SHA256.

### Akun bawaan

Dibuat oleh `npm run db:seed -- users-only` (atau seed penuh):

| Username | Password  | Role  |
| -------- | --------- | ----- |
| `owner`  | `owner` | Owner |
| `kasir`  | `kasir` | Kasir |

Kelola akun lain dari halaman **Pengguna** (khusus Owner). Minimal harus tetap ada satu Owner aktif.

## Menjalankan

```bash
npm install
npm run db:push   # sinkronkan skema Prisma
npm run db:seed   # data contoh + akun owner/kasir
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

## Catatan

- `DATABASE_URL` di `.env` menunjuk ke `prisma/dev.db`.
- `SESSION_SECRET` di `.env` dipakai untuk menandatangani cookie sesi (min. 32 karakter).
- Rencana jangka panjang: migrasi ke PostgreSQL saat siap produksi.