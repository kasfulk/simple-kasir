# Verification — Simple POS: Tenancy + 5 Fitur

Tiap acceptance criteria dibuktikan command + output aktual (server produksi :3210, seed bersih).

| # | Kriteria | Bukti (command → output) |
|---|---|---|
| 1 | Isolasi data per tenant | smoke e2e → `PASS isolate: A 15 produk`, `PASS isolate: B 1 produk`, `PASS cross GET produk 404`, `PASS cross GET transaksi 404`, `PASS stok masuk lintas tenant 404` |
| 2 | Laba dari snapshot costPrice saat jual | checkout Aqua(2500)×3 → `PASS item.costPrice snapshot 2500`; laporan → `PASS laporan laba 18400` (Σ margin seed, item legacy tanpa snapshot dikecualikan) |
| 3 | VOID: OWNER-only, sekali, stok kembali, keluar dari omzet | `PASS kasir void 403`, `PASS owner void 200`, `PASS void: stok kembali`, `PASS void dua kali 409`, `PASS laporan laba 18400` + `terlaris Indomie x2` (Aqua ter-VOID tidak masuk omzet/top) |
| 4 | Poin = floor(net/1000), sekali, dalam $transaction | belanja net 7000 → `PASS poin floor(7000/1000) = 7` |
| 5 | Stok masuk menaikkan stok + costPrice | `PASS stok masuk 201`, `PASS stok +10 & costPrice 3000` |
| 6 | Ekspor CSV RFC4180 + BOM, scope tenant, filter hormat | `PASS CSV BOM + kolom` (byte EF BB BF), `PASS CSV produk B 1 baris data`, `PASS kasir ekspor 200` |
| 7 | Checkout lama tetap benar (regresi) | `PASS total = (12000-5000)+10% = 7700`, `PASS stok terpotong 3`, `PASS transaksi dibuat` |
| 8 | Typecheck / unit / build | `tsc --noEmit` exit 0; `node --test` 5/5; `npm run build` sukses |

Verdict: **SEMUA KRITERIA TERBUKTI**. Server dihentikan, DB dikembalikan ke seed bersih setelah pengambilan bukti.
