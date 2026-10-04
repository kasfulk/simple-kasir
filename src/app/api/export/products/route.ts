import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { bad } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET(request: NextRequest) {
  const me = await requireOwner(request);
  if (!me) return bad("Akses khusus Owner", 403);
  const rows = await db.product.findMany({
    where: { tenantId: me.tenantId },
    orderBy: { name: "asc" },
    include: { category: { select: { name: true } } },
  });
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
  const csv = toCsv(
    rows.map((p) => ({
      SKU: p.sku,
      Nama: p.name,
      Kategori: p.category.name,
      Harga: p.price,
      HargaPokok: p.costPrice ?? "-",
      Stok: p.stock,
      MinStok: p.minStock,
      Status: p.isActive ? "Aktif" : "Nonaktif",
    }))
  );
  return csvResponse(`produk-${today}.csv`, csv);
}
