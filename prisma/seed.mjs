import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

await db.transactionItem.deleteMany();
await db.transaction.deleteMany();
await db.product.deleteMany();
await db.category.deleteMany();

const catsData = [
  { name: "Makanan", description: "Produk makanan siap saji", displayOrder: 1 },
  { name: "Minuman", description: "Air mineral, teh, kopi, dan lainnya", displayOrder: 2 },
  { name: "Snack", description: "Camilan dan kue", displayOrder: 3 },
  { name: "Rumah Tangga", description: "Perlengkapan kebersihan rumah", displayOrder: 4 },
  { name: "Musiman", description: "Produk limited edition", displayOrder: 5, isActive: false },
];

const c = {};
for (const data of catsData) c[data.name] = await db.category.create({ data });

const P = (sku, name, cat, price, stock, minStock, extra = {}) => ({
  sku,
  name,
  categoryId: c[cat].id,
  price,
  stock,
  minStock,
  ...extra,
});

const products = [
  P("ESP-BEANS-001", "Espresso Beans Premium", "Minuman", 45000, 12, 5, { costPrice: 32000, description: "Biji kopi arabika pilihan" }),
  P("ESP-AMERICANO-001", "Americano Hot", "Minuman", 18000, 0, 5, { costPrice: 8000 }),
  P("IND-GORENG-001", "Indomie Goreng", "Makanan", 3500, 48, 10, { costPrice: 2800 }),
  P("NASI-PUTIH-001", "Nasi Putih Segar", "Makanan", 5000, 20, 5, { costPrice: 2500, description: "Dipanaskan setiap jam" }),
  P("TELUR-AYAM-001", "Telur Ayam (1 pcs)", "Makanan", 2500, 3, 10, { costPrice: 1800 }),
  P("AQUA-600-001", "Aqua 600ml", "Minuman", 4000, 36, 12, { costPrice: 2500 }),
  P("TEH-SOSRO-001", "Teh Botol Sosro", "Minuman", 5000, 24, 10, { costPrice: 3200 }),
  P("COCACOLA-390-001", "Coca-Cola 390ml", "Minuman", 5500, 18, 6, { costPrice: 3800 }),
  P("OREO-REG-001", "Oreo Original", "Snack", 9000, 15, 5, { costPrice: 6500 }),
  P("TANGO-WAFER-001", "Tango Wafer Coklat", "Snack", 3000, 22, 8, { costPrice: 1800 }),
  P("CHOCOLATOS-001", "Chocolatos", "Snack", 2000, 0, 10, { costPrice: 1200, isActive: false }),
  P("SABUN-LIFEBUOY-001", "Sabun Lifebuoy", "Rumah Tangga", 5000, 12, 5, { costPrice: 3200 }),
  P("PASTA-PEPSODENT-001", "Pasta Gigi Pepsodent", "Rumah Tangga", 12000, 8, 3, { costPrice: 8000 }),
  P("SHAMPO-CLEAR-001", "Shampo Clear", "Rumah Tangga", 18000, 6, 2, { costPrice: 12000 }),
  P("RINSO-POWDER-001", "Deterjen Rinso Powder", "Rumah Tangga", 15000, 9, 3, { costPrice: 10000 }),
];

const p = {};
for (const data of products) p[data.sku] = await db.product.create({ data });

async function trx(invoiceNo, lines, method, paid) {
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;
  await db.transaction.create({
    data: {
      invoiceNo,
      subtotal,
      tax,
      total,
      method,
      paid,
      change: paid - total,
      items: {
        create: lines.map((l) => ({
          productId: p[l.sku].id,
          name: p[l.sku].name,
          price: l.price,
          quantity: l.qty,
        })),
      },
    },
  });
  for (const l of lines) {
    await db.product.update({ where: { id: p[l.sku].id }, data: { stock: { decrement: l.qty } } });
  }
}

await trx("INV-7F3A91C2", [
  { sku: "IND-GORENG-001", price: 3500, qty: 2 },
  { sku: "AQUA-600-001", price: 4000, qty: 1 },
], "TUNAI", 15000);
await trx("INV-0D4E82B6", [
  { sku: "ESP-BEANS-001", price: 45000, qty: 1 },
  { sku: "OREO-REG-001", price: 9000, qty: 1 },
], "QRIS", 59400);

console.log(`Seed selesai: ${await db.category.count()} kategori, ${await db.product.count()} produk, ${await db.transaction.count()} transaksi`);