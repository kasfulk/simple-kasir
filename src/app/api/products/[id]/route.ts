import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { bad, json } from "@/lib/api";
import { parseProduct } from "@/lib/validation";
import { getSessionFromRequest, requireOwner } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  const user = await getSessionFromRequest(request);
  if (!user) return bad("Silakan login", 401);
  const { id } = await params;
  const product = await db.product.findFirst({
    where: { id, tenantId: user.tenantId },
    include: { category: { select: { id: true, name: true } } },
  });
  if (!product) return bad("Produk tidak ditemukan", 404);
  return json(product);
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  const me = await requireOwner(request);
  if (!me) return bad("Akses khusus Owner", 403);
  const { id } = await params;
  const parsed = parseProduct(await request.json());
  if ("error" in parsed) return bad(parsed.error);

  const cat = await db.category.findFirst({ where: { id: parsed.data.categoryId, tenantId: me.tenantId } });
  if (!cat) return bad("Kategori tidak valid");

  const existing = await db.product.findFirst({ where: { id, tenantId: me.tenantId } });
  if (!existing) return bad("Produk tidak ditemukan", 404);
  try {
    const product = await db.product.update({
      where: { id: existing.id },
      data: parsed.data,
      include: { category: { select: { id: true, name: true } } },
    });
    return NextResponse.json(product);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") return bad("SKU sudah digunakan", 409);
      if (e.code === "P2025") return bad("Produk tidak ditemukan", 404);
    }
    throw e;
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const me = await requireOwner(request);
  if (!me) return bad("Akses khusus Owner", 403);
  const { id } = await params;
  const existing = await db.product.findFirst({ where: { id, tenantId: me.tenantId } });
  if (!existing) return bad("Produk tidak ditemukan", 404);
  try {
    await db.product.delete({ where: { id: existing.id } });
    return NextResponse.json({ message: "Produk dihapus" });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return bad("Produk tidak ditemukan", 404);
    }
    throw e;
  }
}