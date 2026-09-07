import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { bad, json } from "@/lib/api";
import { parseProduct } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const q = sp.get("q")?.trim() ?? "";
  const categoryId = sp.get("categoryId") ?? "";
  const status = sp.get("status") ?? "";
  const sort = sp.get("sort") ?? "name";
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(1000, Math.max(1, Number(sp.get("pageSize")) || 20));

  const where = {
    ...(q ? { OR: [{ name: { contains: q } }, { sku: { contains: q } }] } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(status === "active" ? { isActive: true } : status === "inactive" ? { isActive: false } : {}),
  };

  const orderBy =
    sort === "price-asc" ? { price: "asc" as const } :
    sort === "price-desc" ? { price: "desc" as const } :
    sort === "stock-asc" ? { stock: "asc" as const } :
    sort === "stock-desc" ? { stock: "desc" as const } :
    { name: "asc" as const };

  const [items, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { category: { select: { id: true, name: true } } },
    }),
    db.product.count({ where }),
  ]);

  return json({ items, total, page, pageSize });
}

export async function POST(request: NextRequest) {
  const parsed = parseProduct(await request.json());
  if ("error" in parsed) return bad(parsed.error);

  const cat = await db.category.findUnique({ where: { id: parsed.data.categoryId } });
  if (!cat || !cat.isActive) return bad("Kategori tidak valid atau nonaktif");

  try {
    const product = await db.product.create({
      data: parsed.data,
      include: { category: { select: { id: true, name: true } } },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return bad("SKU sudah digunakan", 409);
    }
    throw e;
  }
}