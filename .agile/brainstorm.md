# Brainstorm — Pengembangan Simple POS

## Problem
Kasir dasar sudah jalan (auth+role, kasir, produk, kategori, riwayat, struk, pengaturan). User ingin aplikasi lebih powerful; memilih 5 track fitur + 2 input tambahan.

## Requirements (disetujui user via ask, 2026-10-03)
1. Dashboard / Laporan
2. Pelanggan + Loyalty
3. Stok Masuk (pembelian)
4. Refund / Void
5. Ekspor CSV
6. Custom "Smart Deduction" — interpretasi: potong stok otomatis saat jual. **Sudah ada & race-safe** (`src/app/api/transactions/route.ts:100-108`: `$transaction` + `updateMany stock:{gte}` + cek count). Gap nyata: stok masuk menambah & void mengembalikan. Alternatif (resep/BOM) dikonfirmasi saat approval.
7. Custom "Tenants / User with other tenant" — multi-tenant: tiap `User` milik satu `Tenant`; kategori, produk, transaksi, pelanggan, stok masuk, setting terisolasi per tenant; tanpa akses lintas tenant.

## Constraints
- Tanpa dependensi baru (Next 15, React 19, Prisma+SQLite, CSS murni).
- Tidak ada test framework → `tsc --noEmit`, `npm run build`, smoke curl, `node --test` untuk logika murni.
- SQLite `db push` → backup `dev.db` sebelum migrasi besar.

## Keputusan desain
- **Tenancy dulu (Fase 0)** — menambah `tenantId` setelah 5 fitur = menyentuh semua file dua kali.
- `TransactionItem.costPrice Int?` snapshot harga pokok saat jual → laba akurat; row legacy (null) dikecualikan dari laba.
- Void: `Transaction.status` "SELESAI"|"VOID", OWNER-only, sekali, restore stok hanya item ber-`productId`; VOID dikeluarkan dari omzet.
- Poin = `floor(net/1000)` sebelum pajak, ditulis dalam `$transaction` penjualan. ponytail: parameter via Setting bila perlu.
- Tanggal laporan offset WIB +07:00 (konsisten ponytail existing di transactions GET).

## Edge cases
- Produk terhapus lalu void → item tanpa productId: skip restore stok.
- Pelanggan terhapus → SetNull; riwayat utuh.
- Semua endpoint wajib `where tenantId` — digrep setelah implementasi.
- CSV: BOM + escape RFC4180 agar aman di Excel.

## Acceptance criteria (ringkas; detail per fase di plan.md)
Isolasi tenant terbukti dengan 2 tenant; laba pakai snapshot; VOID tak dihitung omzet; stok masuk/void mengubah stok persis sekali; CSV lolos `node --test`.
