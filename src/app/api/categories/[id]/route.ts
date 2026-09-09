import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { bad } from "@/lib/api";
import { parseCategory } from "@/lib/validation";
import { requireOwner } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Ctx) {
  if (!(await requireOwner(request))) return bad("Akses khusus Owner", 403);
  const { id } = await params;
  const parsed = parseCategory(await request.json());
  if ("error" in parsed) return bad(parsed.error);
  try {
    const category = await db.category.update({ where: { id }, data: parsed.data });
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
  if (!(await requireOwner(request))) return bad("Akses khusus Owner", 403);
  const { id } = await params;
  const bound = await db.product.count({ where: { categoryId: id } });
  if (bound > 0) {
    return bad(`Tidak dapat menghapus kategori karena masih memiliki ${bound} produk terikat`);
  }
  try {
    await db.category.delete({ where: { id } });
    return NextResponse.json({ message: "Kategori dihapus" });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return bad("Kategori tidak ditemukan", 404);
    }
    throw e;
  }
}