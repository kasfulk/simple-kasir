# Code Review — Simple POS: Tenancy + 5 Fitur

Scope: Fase 0 (tenancy) + Dashboard/Laba + Pelanggan/Poin + Stok Masuk + Void + Ekspor CSV. Review vs acceptance criteria `.agile/plan.md` dan audit `grep` seluruh query `src/app/api` (findMany/findFirst/findUnique/update/delete/upsert).

## Temuan selama loop (semua diperbaiki, tertutup tsc+smoke)
1. `categories/route.ts` — impor `parseCategory` tertimpa & `user` tak terdefinisi di POST; POST juga kehilangan `return 201`. Fixed.
2. `page.tsx` (kasir) — body checkout sempat kehilangan `discount: safeDiscount` lalu `method,`; state `discountInput` hilang. Fixed (`#FC1E`, `#A33F`).
3. `ui.tsx` — JSX ConfirmDialog rusak akibat edit; diperbaiki + `confirmLabel` untuk dialog Void.
4. `struk/[id]` — `cashierName` hilang dari ReceiptData; CUT duplikat `method`. Fixed (`#D9B3`).
5. Kontrak POST /api/transactions tidak meng-include items pada respons create — smoke mengasersi via GET detail, kontrak lama dipertahankan (breaking change dihindari).

## Audit konsistensi tenant
Semua query di 13 route file ber-scope `tenantId` dari sesi (grep audit penuh); unik global: `username` (login), `invoiceNo`. Guard Owner per tenant, bukan global.

## Kualitas
- Tanpa dependensi baru; Chart = div CSS; test = node --test.
- Race stok tetap guarded (`updateMany stock:{gte}` + count check); void & poin dalam `$transaction` yang sama.
-ponytail terdokumentasi: poin 1/1000, WIB offset, sesi stateless.

## Verdict: **PASS**
Alasan: semua acceptance criteria terbukti di verification.md; tidak ada temuan terbuka; tidak ada scope creep di luar plan yang disetujui.

## Review — Fitur: INVOICE + Logo Struk + Unduh PNG (2026-10-04)

Scope: allowlist metode (2 route) + label/format, modal bayar & filter riwayat, `Setting.logo` (schema → `parseSettings` → upload UI → struk), `lib/receipt-image.ts`, CSS struk. Tanpa dependensi baru.

- Konsistensi: audit `grep "QRIS"` — semua situs daftar metode + label map ditambah INVOICE; perilaku TUNAI/DEBIT/QRIS tak berubah.
- Keamanan: logo divalidasi di `parseSettings` (data URL image + batas ukuran) sebagai trust boundary; render `<img>` data URL; canvas bebas taint (sumber hanya data URL).
- Bug ditemukan & diperbaiki: serialisasi SVG string-concat rusak oleh `&`/`<` (IMG_ONERROR) → diganti DOM + `XMLSerializer`; dibuktikan ulang lewat unduh nyata di Chromium.
- Scope terjaga: INVOICE = non-tunai lunas (bukan AR); hanya kolom opsional di schema.

## Verdict: **PASS**
