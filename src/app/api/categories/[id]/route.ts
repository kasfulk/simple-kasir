import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { bad } from "@/lib/api";
import { getSessionFromRequest, requireOwner } from "@/lib/auth";
import { parseCategory } from "@/lib/validation";
type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Ctx) {
  const me = await requireOwner(request);
  if (!me) return bad("Akses khusus Owner", 403);
  const { id } = await params;
  const parsed = parseCategory(await request.json());
  if ("error" in parsed) return bad(parsed.error);
  const existing = await db.category.findFirst({ where: { id, tenantId: me.tenantId } });
  if (!existing) return bad("Kategori tidak ditemukan", 404);
  try {
    const category = await db.category.update({ where: { id: existing.id }, data: parsed.data });
    return NextResponse.json(category);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") return bad("Nama kategori sudah digunakan", 409);
      if (e.code === "P2025") return bad("Kategori tidak ditemukan", 404);
    }
    throw e;
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const me = await requireOwner(request);
  if (!me) return bad("Akses khusus Owner", 403);
  const { id } = await params;
  const existing = await db.category.findFirst({ where: { id, tenantId: me.tenantId } });
  if (!existing) return bad("Kategori tidak ditemukan", 404);
  const bound = await db.product.count({ where: { categoryId: existing.id } });
  if (bound > 0) {
    return bad(`Tidak dapat menghapus kategori karena masih memiliki ${bound} produk terikat`);
  }
  await db.category.delete({ where: { id: existing.id } });
  return NextResponse.json({ message: "Kategori dihapus" });
}