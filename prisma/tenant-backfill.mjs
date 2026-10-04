// Backfill sekali untuk DB lama: semua data existing menjadi milik tenant "Toko Utama".
// CATATAN URUTAN: kolom tenantId REQUIRED — `db push` ke DB lama akan gagal/membuat ulang tabel.
// Pilihan: (a) demo/hitung ulang: backup lalu hapus prisma/dev.db -> db:push -> db:seed;
//          (b) data nyata: push kolom nullable -> node prisma/tenant-backfill.mjs -> perketat jadi required -> push lagi.
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

let t = await db.tenant.findFirst({ where: { name: "Toko Utama" } });
if (!t) {
  t = await db.tenant.create({ data: { name: "Toko Utama" } });
  await db.user.updateMany({ data: { tenantId: t.id } });
  await db.category.updateMany({ data: { tenantId: t.id } });
  await db.product.updateMany({ data: { tenantId: t.id } });
  await db.transaction.updateMany({ data: { tenantId: t.id } });
  const s = await db.setting.findFirst();
  if (s) await db.setting.delete({ where: { id: s.id } });
  await db.setting.create({ data: { tenantId: t.id } });
}
console.log(`Backfill selesai. Tenant utama: ${t.id}`);
await db.$disconnect();
