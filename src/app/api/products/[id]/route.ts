import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { bad, json } from "@/lib/api";
import { parseProduct } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const product = await db.product.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true } } },
  });
  if (!product) return bad("Produk tidak ditemukan", 404);
  return json(product);
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const parsed = parseProduct(await request.json());
  if ("error" in parsed) return bad(parsed.error);

  const cat = await db.category.findUnique({ where: { id: parsed.data.categoryId } });
  if (!cat) return bad("Kategori tidak valid");

  try {
    const product = await db.product.update({
      where: { id },
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

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    await db.product.delete({ where: { id } });
    return NextResponse.json({ message: "Produk dihapus" });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return bad("Produk tidak ditemukan", 404);
    }
    throw e;
  }
}