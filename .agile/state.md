# State — Pengembangan fitur Simple POS

```yaml
stage: COMPLETE
status: DONE
completed: [brainstorm, plan, deep_research_skip, code_plan, coding, code_review, testing, verification]
current: []
next: []
```

Classification: **LARGE** — tenancy + 5 track fitur; dikerjakan berurutan (Fase 0 → 5) di satu cabang kerja.

Skipped stages:
- DEEP_RESEARCH: SKIPPED — keputusan teknis selesai di brainstorm dari audit codebase; tidak ada ketidakpastian multi-sumber.
- WORKTREE ISOLATION: SKIPPED — dikerjakan single-flight di satu working tree (satu pemain, tanpa subagent paralel; urutan fase punya dependensi berantai).

## Hasil (2026-10-03)
- Fase 0: multi-tenant (Tenant + tenantId di semua model; seed 2 tenant: Toko Utama owner/kasir, Cabang B owner2/kasir2).
- Fase 1: /dashboard — omzet, laba (snapshot TransactionItem.costPrice), stok menipis, top produk (OWNER).
- Fase 2: pelanggan + loyalty (Customer, poin floor(net/1000) dalam $transaction checkout).
- Fase 3: stok masuk (StockIn, increment stok + update costPrice).
- Fase 4: void transaksi (status VOID, OWNER-only, restore stok, keluar dari omzet).
- Fase 5: ekspor CSV (transactions + products; RFC4180 + BOM).

## Bukti
- review.md: PASS • test-report.md: tsc 0, node --test 5/5, build sukses, smoke e2e 2-tenant 24/24 PASS • verification.md: 8/8 kriteria.

## Bugfix — Navbar hilang di handphone (2026-10-03)

```yaml
stage: COMPLETE
status: DONE
classification: BUG
```

- Root cause: breakpoint ≤768px hanya memberi `.navbar-tabs` `overflow-x: auto` tanpa toggle; di layar sempit menu tak terjangkau.
- Fix: tombol hamburger `.nav-burger` (mobile-only, `type="button"`, `aria-expanded`, ikon menu↔X) di `src/components/navbar.tsx`; dropdown `.navbar.menu-open .navbar-tabs` + `.navbar-brand { margin-right: auto }` di `src/app/globals.css` (≤768px). Desktop tak berubah.
- Bukti: Chromium 390×844 (login owner) — burger tampil, dropdown 9 tab, klik "Produk" navigasi + menu tertutup otomatis, `aria-expanded` benar; desktop 1280px — burger tersembunyi, tabs inline normal.

## Fitur — Tukar poin loyalty di checkout (2026-10-04)

```yaml
stage: COMPLETE
status: DONE
classification: STANDARD
```

- TDD: tes RED dulu (`pointsToRp`, `usablePoints` di `core.test.ts`) → implementasi GREEN (7/7 pass).
- `src/lib/loyalty.ts`: `POINT_RP = 100` (1 poin = Rp 100), `pointsToRp()`, `usablePoints()` (clamp permintaan/saldo/nilai belanja).
- Skema: `Transaction.pointsUsed Int @default(0)`; `prisma db push`.
- Checkout (`api/transactions/route.ts`): server revalidasi poin (saldo fetch ulang, bukan percaya klien), `netFinal = subtotal − discount − redeemRp`, pajak/total/poin-earned dari `netFinal`, decrement race-safe `updateMany` + guard `POINTS:`.
- Void (`api/transactions/[id]/void/route.ts`): pulihkan `pointsUsed`, tarik poin earned; saldo kurang → dibisukan (ponytail), void tetap sukses.
- UI: input "Tukar Poin" + "Pakai Semua" di modal bayar (`page.tsx`), baris "Poin Ditukar" di struk (`receipt-view.tsx`, `struk/[id]/page.tsx`).

## Bukti
- node --test 7/7 • tsc --noEmit 0 error • next build sukses • smoke e2e 15/15 PASS (login, earn, tolak > saldo, redeem, total & saldo benar, struk "Poin Ditukar", void memulihkan saldo).
