// ponytail: sekali pakai — bersihkan produk + riwayat (transaksi, item, stok masuk). User, kategori, tenant tetap.
import { PrismaClient } from "@prisma/client";
import { copyFileSync } from "node:fs";

const db = new PrismaClient();
const bak = process.argv[2];
if (bak) {
  copyFileSync("prisma/dev.db", bak);
  console.log(`backup -> ${bak}`);
}

const before = {
  product: await db.product.count(),
  category: await db.category.count(),
  transaction: await db.transaction.count(),
  transactionItem: await db.transactionItem.count(),
  stockIn: await db.stockIn.count(),
  customer: await db.customer.count(),
};

// urutan FK: item -> transaksi -> stok masuk -> produk
await db.$transaction([
  db.transactionItem.deleteMany(),
  db.transaction.deleteMany(),
  db.stockIn.deleteMany(),
  db.product.deleteMany(),
]);

const after = {
  product: await db.product.count(),
  category: await db.category.count(),
  transaction: await db.transaction.count(),
  transactionItem: await db.transactionItem.count(),
  stockIn: await db.stockIn.count(),
  customer: await db.customer.count(),
  user: await db.user.count(),
  tenant: await db.tenant.count(),
};
for (const k of Object.keys(after)) {
  console.log(`${k.padEnd(16)} ${before[k] ?? "-"} -> ${after[k]}`);
}
await db.$disconnect();
