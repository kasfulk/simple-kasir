# Plan — Simple POS: Tenancy + 5 Fitur

Classification: **LARGE** — worktree isolation, parallel subagents per fase independen, satu integration owner.

## Fase 0 — Foundation multi-tenant
Objektif: semua data terisolasi per tenant sebelum fitur lain dibangun.
- `prisma/schema.prisma`: model `Tenant {id, name, createdAt}`; `tenantId` + relasi di Category, Product, Transaction, Setting (tenantId unik), User; User.tenantId required.
- Backfill: `prisma/tenant-backfill.mjs` (npm run db:tenants) — buat tenant "Toko Utama", isi tenantId semua row existing; backup `dev.db` dulu.
- Seed: data demo di "Toko Utama" (owner/kasir) + tenant kedua "Cabang B" (owner2/kasir2, produk minimal) sebagai kendaraan uji isolasi.
- `src/lib/auth.ts`: `SessionUser.tenantId`; login menyimpan. Semua API route (auth/me, categories, products, transactions, users, settings) difilter `tenantId`.
- Uji: `npx tsc --noEmit`; smoke curl: owner Cabang B GET /api/products tidak melihat produk Toko Utama.
- Risiko: db push destruktif → backup wajib; middleware Edge tidak disentuh.

## Fase 1 — Dashboard / Laporan (OWNER)
- Schema: `TransactionItem.costPrice Int?`; checkout POST menulis snapshot `costPrice`.
- `src/app/api/reports/summary/route.ts`: revenue, txCount, profit (Σ (price−costPrice)·qty, item null dikecualikan), lowStockCount, dailySeries 7 hari WIB, topProducts; VOID dikecualikan.
- `src/app/dashboard/page.tsx`: kartu ringkas + bar chart CSS murni + top produk; link navbar OWNER-only.
- Uji: smoke curl angka cocok dengan seed; `tsc`.

## Fase 2 — Pelanggan + Loyalty
- Schema: `Customer {id, tenantId, name, phone?, points Int @default(0), isActive, createdAt}`; `Transaction.customerId?` SetNull.
- `src/app/api/customers/route.ts` + `[id]` (OWNER CRUD); checkout POST terima `customerId` opsional (validasi tenant sama) → poin `floor(net/1000)` dalam `$transaction` sama; GET riwayat ikutkan nama pelanggan; struk tampil pelanggan+poin; halaman `/pelanggan`; kasir bisa pilih pelanggan di kasir.
- Uji: smoke curl poin bertambah persis sekali; pelanggan tenant salah ditolak.

## Fase 3 — Stok Masuk
- Schema: `StockIn {id, tenantId, productId, quantity>0, unitCost?, note?, createdAt, userId}`.
- `src/app/api/stock-ins/route.ts`: POST increment `product.stock` + set `costPrice` bila unitCost, satu `$transaction`; GET list; halaman `/stok-masuk` (OWNER) dengan daftar stok < minStock di atas.
- Uji: smoke curl stok naik persis `quantity`; costPrice ikut bila diisi.

## Fase 4 — Refund / Void
- Schema: `Transaction.status String @default("SELESAI")`.
- `src/app/api/transactions/[id]/void/route.ts` (OWNER-only): idempoten satu arah; restore stok per item ber-productId dalam `$transaction`; 409 bila sudah VOID.
- Riwayat badge VOID + tetap tampil; dashboard mengabaikan VOID; struk cap VOID.
- Uji: smoke curl stok kembali persis; kasir 403; void dua kali 409.

## Fase 5 — Ekspor CSV
- `src/app/api/export/transactions/route.ts` (owner+kasir, hormati filter date/method) dan `src/app/api/export/products/route.ts` (OWNER); header `Content-Disposition`, BOM + escape RFC4180 di `src/lib/csv.ts`.
- `src/lib/csv.test.mjs` (node --test): escape koma/kutip/newline.
- Tombol di riwayat + produk.
- Uji: `node --test src/lib/`; unduhan terbuka di Excel.

## Urutan & paralelisasi
0 → (1, 2) paralel → (3, 4) paralel → 5. Fase 0 adalah integrasi owner; tiap fase selesai = branch worktree digabung berurutan.

## RISIKO & REGRESI
- Semua endpoint lama wajib tetap jalan untuk tenant utama (regresi: jalankan smoke existing login→kasir→transaksi→struk).
- Setelah semua fase: grep `findMany|findFirst|update|delete` di src/app/api untuk memastikan tak ada query tanpa scope tenant.

## Verifikasi akhir
`npx tsc --noEmit` + `npm run build` + `node --test` + smoke curl dua tenant untuk tiap fitur; bukti dicatat di `.agile/verification.md`.
