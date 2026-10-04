import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { bad, json } from "@/lib/api";
import { POINT_RP, loyaltyPoints } from "@/lib/loyalty";
import { requireOwner } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

// Void sekali arah: status VOID + stok dikembalikan utk item ber-productId
// (produk yang sudah dihapus → item.productId null → dilewati).
export async function POST(request: NextRequest, { params }: Ctx) {
  const me = await requireOwner(request);
  if (!me) return bad("Akses khusus Owner", 403);
  const { id } = await params;
  const t = await db.transaction.findFirst({
    where: { id, tenantId: me.tenantId },
    include: { items: true },
  });
  if (!t) return bad("Transaksi tidak ditemukan", 404);
  if (t.status === "VOID") return bad("Transaksi sudah dibatalkan sebelumnya", 409);

  const updated = await db.$transaction(async (tx) => {
    for (const it of t.items) {
      if (!it.productId) continue;
      await tx.product.update({
        where: { id: it.productId },
        data: { stock: { increment: it.quantity } },
      });
    }
    if (t.customerId) {
      // Pulihkan poin yang ditukar, lalu tarik poin yang pernah didapat dari transaksi ini.
      const earned = loyaltyPoints(t.subtotal - t.discount - t.pointsUsed * POINT_RP);
      const r = await tx.customer.updateMany({
        where: { id: t.customerId },
        data: { points: { increment: t.pointsUsed } },
      });
      if (r.count === 1 && earned > 0) {
        // ponytail: saldo < earned (poin sudah terpakai transaksi lain) → dibisukan, void tetap sukses
        await tx.customer.updateMany({
          where: { id: t.customerId, points: { gte: earned } },
          data: { points: { decrement: earned } },
        });
      }
    }
    return tx.transaction.update({ where: { id: t.id }, data: { status: "VOID" } });
  });
  return json(updated);
}
