# Code Plan — Simple POS: Tenancy + 5 Fitur

Grounded pada baca aktual: schema.prisma, seed.mjs, auth.ts, auth-server.ts, login/settings/users/transactions routes, api.ts, types.ts, validation.ts.

## Fase 0 — Multi-tenant foundation (integration owner; blokir semua fase)
| File | Perubahan |
|---|---|
| `prisma/schema.prisma` | Model `Tenant {id, name, createdAt}`. `tenantId` + relasi di Category, Product, Transaction, Customer(F2), StockIn(F3), Setting (`tenantId @unique`, `id` acak bukan "default"), User (required). `TransactionItem.costPrice Int?` (F1) dan `Transaction.status String @default("SELESAI")` (F4) sekalian agar db push sekali. |
| `prisma/tenant-backfill.mjs` (baru, `npm run db:tenants`) | Backup `dev.db` → buat tenant "Toko Utama" → backfill semua row lama. |
| `prisma/seed.mjs` | Per-tenant: "Toko Utama" (owner/kasir + demo penuh) dan "Cabang B" (owner2/kasir2 + 2 produk) untuk uji isolasi. |
| `src/lib/auth.ts` | `SessionUser.tenantId`; token & verify ikut membawa. Edge-safe (tetap tanpa next/headers). |
| `src/app/api/auth/login/route.ts` | Token + response + `tenantId`. Username tetap unik global. |
| `src/app/api/auth/me/route.ts` | Response + tenantId. |
| `src/app/api/categories/route.ts`, `[id]/route.ts` | `where: {…, tenantId}`; create set tenantId; `[id]` guar `{id, tenantId}`. |
| `src/app/api/products/route.ts`, `[id]/route.ts` | Idem. |
| `src/app/api/transactions/route.ts`, `[id]/route.ts` | GET `where.tenantId`; POST: settings per tenant (`findUnique({where:{tenantId}})`), create + tenantId. |
| `src/app/api/users/route.ts`, `[id]/route.ts` | Scope tenant; create `tenantId: user.tenantId` (bukan dari body). |
| `src/app/api/settings/route.ts` + `src/lib/settings.ts` | Upsert/find per `tenantId`. |
- Uji: `npx tsc --noEmit`; smoke curl 2 tenant — owner Cabang B tidak melihat produk Toko Utama; regresi login→kasir→transaksi→struk tenant utama.

## Fase 1 — Dashboard/Laba (paralel dgn F2)
| File | Perubahan |
|---|---|
| `src/app/api/transactions/route.ts` POST | Snapshot `costPrice: p.costPrice` per item line. |
| `src/app/api/reports/summary/route.ts` (baru) | revenue, txCount, profit Σ(price−costPrice)·qty (item null di-skip), lowStockCount, dailySeries 7 hr WIB (+07:00), topProducts; exclude `status:"VOID"` (FK4). OWNER-only. |
| `src/app/dashboard/page.tsx` (baru) | Kartu ringkas + bar chart CSS murni; link navbar OWNER-only (`src/components/navbar.tsx`). |

## Fase 2 — Pelanggan + Loyalty (paralel dgn F1)
| File | Perubahan |
|---|---|
| `prisma/schema.prisma` | `Customer {id, tenantId, name, phone?, points Int @default(0), isActive, createdAt}`; `Transaction.customerId?` SetNull. |
| `src/app/api/customers/route.ts` + `[id]/` (baru) | CRUD OWNER; scope tenant. |
| `src/app/api/transactions/route.ts` POST | `customerId` opsional (wajib tenant sama); poin `floor(net/1000)` di `$transaction` sama. |
| `src/lib/validation.ts` | `parseCustomer`. |
| `src/app/pelanggan/page.tsx` (baru), kasir page picker, `struk/[id]` + poin, riwayat kolom pelanggan. |

## Fase 3 — Stok Masuk (paralel dgn F4)
| File | Perubahan |
|---|---|
| `prisma/schema.prisma` | `StockIn {id, tenantId, productId, quantity>0, unitCost?, note?, createdAt, userId}`. |
| `src/app/api/stock-ins/route.ts` (baru) | POST increment stock + set costPrice bila unitCost, satu `$transaction`; GET list. |
| `src/app/stok-masuk/page.tsx` (baru, OWNER) | Form + daftar stok < minStock. |

## Fase 4 — Void/Refund (paralel dgn F3)
| File | Perubahan |
|---|---|
| `src/app/api/transactions/[id]/void/route.ts` (baru) | OWNER-only; restore stok hanya item ber-`productId` (deleted → skip); 409 bila sudah VOID; status kembali `status:"SELESAI"`. |
| `src/app/riwayat/page.tsx` | Badge VOID, tetap tampil. `src/app/struk/[id]/page.tsx` cap VOID. |

## Fase 5 — Ekspor CSV
| File | Perubahan |
|---|---|
| `src/lib/csv.ts` (baru) | Escape RFC4180 + BOM. |
| `src/lib/csv.test.mjs` (baru) | `node --test`: koma, kutip, newline. |
| `src/app/api/export/transactions/route.ts`, `src/app/api/export/products/route.ts` (baru) | Hormati filter date/method; `Content-Disposition`; scope tenant. |
| `src/app/riwayat/page.tsx`, `src/app/produk/page.tsx` | Tombol Ekspor. |

## Urutan, regresi, verifikasi
0 → (1∥2) → (3∥4) → 5; tiap fase: `npx tsc --noEmit` + smoke curl. Akhir: `npm run build`, `node --test src/lib/`, grep query tanpa `tenantId` di `src/app/api/`, regresi full tenant utama. Bukti → `.agile/verification.md`.
