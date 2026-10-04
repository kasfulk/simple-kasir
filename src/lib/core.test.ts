// Uji logika murni: CSV escape (RFC4180), poin loyalty, ringkasan laporan.
// Jalankan: node --test src/lib/core.test.ts (Node 24 type stripping; import .ts eksplisit di luar tsc)
import assert from "node:assert/strict";
import { test } from "node:test";
// @ts-expect-error — import extension .ts sah untuk Node type-stripping, tapi tidak untuk tsc bundler
import { toCsv, csvResponse } from "./csv.ts";
// @ts-expect-error — import extension .ts sah untuk Node type-stripping, tapi tidak untuk tsc bundler
import { loyaltyPoints } from "./loyalty.ts";
// @ts-expect-error — import extension .ts sah untuk Node type-stripping, tapi tidak untuk tsc bundler
import { pointsToRp, usablePoints } from "./loyalty.ts";
// @ts-expect-error — import extension .ts sah untuk Node type-stripping, tapi tidak untuk tsc bundler
import { summarize } from "./reports.ts";

test("csv: nilai polos", () => {
  assert.equal(toCsv([{ a: 1, b: "x" }]), "a,b\n1,x");
});

test("csv: escape koma, kutip, newline (RFC4180)", () => {
  const out = toCsv([{ name: 'Kopi "Nusantara", Item' }, { name: "Baris\nBaru" }]);
  assert.equal(out, 'name\n"Kopi ""Nusantara"", Item"\n"Baris\nBaru"');
});

test("csv: BOM di awal file untuk Excel (byte-level; res.text() WHATWG justru melucuti BOM)", async () => {
  const res = csvResponse("data.csv", toCsv([{ a: 1 }]));
  const bytes = Array.from(new Uint8Array(await res.arrayBuffer()));
  assert.deepEqual(bytes.slice(0, 3), [0xef, 0xbb, 0xbf]); // EF BB BF = UTF-8 BOM fisik
  assert.match(res.headers.get("content-disposition") ?? "", /attachment; filename="data\.csv"/);
});
test("loyalty: floor(net/1000), 0 utk nilai kecil", () => {
  assert.equal(loyaltyPoints(999), 0);
  assert.equal(loyaltyPoints(1000), 1);
  assert.equal(loyaltyPoints(185000), 185);
});

test("loyalty: penukaran 1 poin = Rp100", () => {
  assert.equal(pointsToRp(0), 0);
  assert.equal(pointsToRp(1), 100);
  assert.equal(pointsToRp(250), 25000);
});

test("loyalty: usablePoints dibatasi permintaan, saldo, dan nilai belanja", () => {
  assert.equal(usablePoints(400, 1000, 40000), 400);  // sesuai permintaan
  assert.equal(usablePoints(2000, 1000, 200000), 1000); // dipotong saldo
  assert.equal(usablePoints(50, 1000, 3000), 30);      // dipotong net (floor(3000/100))
  assert.equal(usablePoints(-5, 1000, 40000), 0);      // negatif → 0
  assert.equal(usablePoints(100, 100, 0), 0);          // net 0 → tak bisa tukar
});

test("reports: revenue & txCount non-VOID; profit hanya dari item ber-snapshot costPrice", () => {
  const now = new Date().toISOString();
  const rows = [
    {
      status: "SELESAI", total: 11000, createdAt: now,
      items: [
        { price: 45000, costPrice: 32000, quantity: 1 },
        { price: 3500, costPrice: null, quantity: 2 },
      ],
    },
    { status: "VOID", total: 5500, createdAt: now, items: [{ price: 5000, costPrice: 1000, quantity: 1 }] },
  ];
  const s = summarize(rows);
  assert.equal(s.revenue, 11000);
  assert.equal(s.txCount, 1);
  assert.equal(s.profit, 13000); // (45000-32000)*1; item tanpa costPrice dikecualikan dari laba
});
