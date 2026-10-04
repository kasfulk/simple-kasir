import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bad, json } from "@/lib/api";
import { requireOwner } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const me = await requireOwner(request);
  if (!me) return bad("Akses khusus Owner", 403);
  const rows = await db.stockIn.findMany({
    where: { tenantId: me.tenantId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { product: { select: { name: true, sku: true } } },
  });
  return json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
}

export async function POST(request: NextRequest) {
  const me = await requireOwner(request);
  if (!me) return bad("Akses khusus Owner", 403);
  const body = await request.json().catch(() => null);
  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  const productId = String(o.productId ?? "");
  const quantity = Number(o.quantity);
  const unitCost = o.unitCost === "" || o.unitCost == null ? null : Number(o.unitCost);
  const note = o.note ? String(o.note).trim().slice(0, 200) : null;

  if (!productId) return bad("Produk wajib dipilih");
  if (!Number.isInteger(quantity) || quantity < 1) return bad("Jumlah harus angka bulat >= 1");
  if (unitCost !== null && (!Number.isInteger(unitCost) || unitCost < 0)) {
    return bad("Harga beli harus angka bulat >= 0");
  }

  const product = await db.product.findFirst({ where: { id: productId, tenantId: me.tenantId } });
  if (!product) return bad("Produk tidak ditemukan", 404);

  const rec = await db.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: product.id },
      data: { stock: { increment: quantity }, ...(unitCost != null ? { costPrice: unitCost } : {}) },
    });
    return tx.stockIn.create({
      data: { tenantId: me.tenantId, productId: product.id, quantity, unitCost, note, userId: me.id },
    });
  });
  return NextResponse.json(rec, { status: 201 });
}
