import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { bad, json } from "@/lib/api";
import { parseCategory } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const activeOnly = request.nextUrl.searchParams.get("active") === "true";
  const categories = await db.category.findMany({
    where: activeOnly ? { isActive: true } : {},
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });
  return json(categories.map(({ _count, ...c }) => ({ ...c, productCount: _count.products })));
}

export async function POST(request: NextRequest) {
  const parsed = parseCategory(await request.json());
  if ("error" in parsed) return bad(parsed.error);
  try {
    const category = await db.category.create({ data: parsed.data });
    return NextResponse.json({ ...category, productCount: 0 }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return bad("Nama kategori sudah digunakan", 409);
    }
    throw e;
  }
}