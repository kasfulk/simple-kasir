# Test Report — Simple POS: Tenancy + 5 Fitur

Semua command dijalankan dari root project, 2026-10-03.

## 1. Typecheck
```
npx tsc --noEmit   → exit 0 (tanpa error)
```

## 2. Unit test (node --test, stdlib)
```
node --test src/lib/core.test.ts
ℹ tests 5  ℹ pass 5  ℹ fail 0
```
Cakupan: CSV escape RFC4180 + BOM byte-level, loyaltyPoints floor(net/1000), summarize (revenue/profit exclude VOID, profit hanya item ber-snapshot costPrice).

## 3. Build produksi
```
npm run build → sukses; semua route ƒ dynamic, termasuk:
/api/customers, /api/stock-ins, /api/reports/summary,
/api/transactions/[id]/void, /api/export/{transactions,products},
/dashboard, /pelanggan, /stok-masuk
```

## 4. Smoke e2e dua-tenant (server produksi :3210, seed bersih)
```
SMOKE: ALL PASS — 24/24
PASS isolate: A 15 produk / B 1 produk
PASS cross GET produk 404 / cross GET transaksi 404
PASS customer dibuat, poin 0
PASS total = (12000-5000)+10% = 7700
PASS item.costPrice snapshot 2500
PASS stok terpotong 3
PASS poin floor(7000/1000) = 7
PASS kasir void 403 / owner void 200 / void: stok kembali / void dua kali 409
PASS stok masuk 201 / stok +10 & costPrice 3000 / lintas tenant 404
PASS laporan laba 18400 / txCount 2 / stok menipis 2 / terlaris Indomie x2 / kasir 403
PASS CSV BOM + kolom / kasir ekspor 200 / CSV produk B 1 baris data
```

## Catatan regression
- Smoke dijalankan setelah reset DB (db push + seed) tiap iterasi — script smoke bersifat destruktif, disimpan di /tmp lalu dihapus setelah bukti.
- Kelima temuan review (impor hilang, return 201 hilang, regresi discount/method di body checkout, JSX ui.tsx, cashierName) diperbaiki dan tertutup oleh typecheck+smoke.
