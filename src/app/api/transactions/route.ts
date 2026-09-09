import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { bad, json } from "@/lib/api";
import { getSessionFromRequest } from "@/lib/auth";

const METHODS = ["TUNAI", "DEBIT", "QRIS"] as const;

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const method = sp.get("method") ?? "";
  const dateStr = sp.get("date") ?? "";
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize")) || 20));

  // ponytail: filter harian memakai offset WIB (+07:00); ganti timezone-aware saat multi-cabang.
  let createdAt: { gte: Date; lt: Date } | undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const gte = new Date(`${dateStr}T00:00:00+07:00`);
    const lt = new Date(gte);
    lt.setDate(lt.getDate() + 1);
    createdAt = { gte, lt };
  }

  const where = {
    ...(method && (METHODS as readonly string[]).includes(method) ? { method } : {}),
    ...(createdAt ? { createdAt } : {}),
  };

  const [rows, total] = await Promise.all([
    db.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { items: true } } },
    }),
    db.transaction.count({ where }),
  ]);

  const items = rows.map(({ _count, ...t }) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    totalQty: _count.items,
  }));
  return json({ items, total, page, pageSize });
}

export async function POST(request: NextRequest) {
  const user = await getSessionFromRequest(request);
  if (!user) return bad("Silakan login", 401);
  const body = await request.json().catch(() => null);
  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const method = String(o.method ?? "");
  if (!(METHODS as readonly string[]).includes(method)) return bad("Metode pembayaran tidak valid");

  const rawItems = Array.isArray(o.items) ? o.items : [];
  const lines = rawItems
    .map((i) => {
      const it = i as Record<string, unknown>;
      return { productId: String(it.productId ?? ""), quantity: Number(it.quantity) };
    })
    .filter((l) => l.productId && Number.isInteger(l.quantity) && l.quantity >= 1);
  if (lines.length === 0) return bad("Keranjang kosong");

  const products = await db.product.findMany({
    where: { id: { in: lines.map((l) => l.productId) } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  for (const l of lines) {
    const p = byId.get(l.productId);
    if (!p) return bad("Ada produk yang tidak ditemukan");
    if (!p.isActive) return bad(`${p.name} sudah nonaktif`);
    if (p.stock < l.quantity) return bad(`Stok ${p.name} tidak mencukupi (sisa ${p.stock})`);
    subtotal += p.price * l.quantity;
  }

  const discount = o.discount == null || o.discount === "" ? 0 : Number(o.discount);
  if (!Number.isInteger(discount) || discount < 0 || discount > subtotal) {
    return bad("Diskon tidak valid");
  }
  const settings = await db.setting.findUnique({ where: { id: "default" } });
  const taxRate = settings?.taxRate ?? 10;
  const net = subtotal - discount;
  const tax = Math.round((net * taxRate) / 100);
  const total = net + tax;

  let paid: number;
  if (method === "TUNAI") {
    paid = Number(o.paid);
    if (!Number.isInteger(paid) || paid < 0) return bad("Jumlah bayar tidak valid");
    if (paid < total) return bad("Uang bayar kurang dari total");
  } else {
    paid = total;
  }
  const change = paid - total;

  try {
    const created = await db.$transaction(async (tx) => {
      for (const l of lines) {
        const r = await tx.product.updateMany({
          where: { id: l.productId, stock: { gte: l.quantity } },
          data: { stock: { decrement: l.quantity } },
        });
        if (r.count !== 1) throw new Error(`STOCK:${byId.get(l.productId)!.name}`);
      }
      return tx.transaction.create({
        data: {
          invoiceNo: "INV-" + randomBytes(4).toString("hex").toUpperCase(),
          subtotal,
          discount,
          tax,
          total,
          taxRate,
          method,
          paid,
          change,
          cashierId: user.id,
          cashierName: user.name,
          items: {
            create: lines.map((l) => {
              const p = byId.get(l.productId)!;
              return { productId: p.id, name: p.name, price: p.price, quantity: l.quantity };
            }),
          },
        },
      });
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.startsWith("STOCK:")) return bad(`Stok ${msg.slice(6)} tidak mencukupi`);
    throw e;
  }
}