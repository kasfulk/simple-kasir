import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const USERS = [
  { username: "owner", name: "Owner Toko", role: "OWNER", password: "owner" },
  { username: "kasir", name: "Kasir Satu", role: "KASIR", password: "kasir" },
];

// ponytail: format hash harus identik dgn src/lib/auth.ts (pbkdf2:iterasi:salt:hash)
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 600000 }, key, 256));
  const hex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `pbkdf2:600000:${hex(salt)}:${hex(bits)}`;
}

async function seedUsers() {
  for (const { password, ...data } of USERS) {
    const passwordHash = await hashPassword(password);
    await db.user.upsert({
      where: { username: data.username },
      update: { name: data.name, role: data.role, passwordHash, isActive: true },
      create: { ...data, passwordHash },
    });
  }
}

if (process.argv[2] === "users-only") {
  await seedUsers();
  console.log("Akun siap: owner/owner (Owner), kasir/kasir (Kasir)");
  process.exit(0);
}

await db.transactionItem.deleteMany();
await db.transaction.deleteMany();
await db.product.deleteMany();
await db.category.deleteMany();
await db.user.deleteMany();
await seedUsers();

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

async function trx(invoiceNo, lines, method, paid, cashierName) {
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
      cashierId: kasir.id,
      cashierName,
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

const kasir = await db.user.findUnique({ where: { username: "kasir" } });
await trx("INV-7F3A91C2", [
  { sku: "IND-GORENG-001", price: 3500, qty: 2 },
  { sku: "AQUA-600-001", price: 4000, qty: 1 },
], "TUNAI", 15000, "Kasir Satu");
await trx("INV-0D4E82B6", [
  { sku: "ESP-BEANS-001", price: 45000, qty: 1 },
  { sku: "OREO-REG-001", price: 9000, qty: 1 },
], "QRIS", 59400, "Kasir Satu");

console.log(`Seed selesai: ${await db.user.count()} pengguna, ${await db.category.count()} kategori, ${await db.product.count()} produk, ${await db.transaction.count()} transaksi`);