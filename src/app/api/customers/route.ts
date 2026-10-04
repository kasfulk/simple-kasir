import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { bad, json } from "@/lib/api";
import { parseCustomer } from "@/lib/validation";
import { getSessionFromRequest, requireOwner } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getSessionFromRequest(request);
  if (!user) return bad("Silakan login", 401);
  const rows = await db.customer.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, phone: true, points: true, isActive: true, createdAt: true },
  });
  return json(rows.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })));
}

export async function POST(request: NextRequest) {
  const me = await requireOwner(request);
  if (!me) return bad("Akses khusus Owner", 403);
  const parsed = parseCustomer(await request.json());
  if ("error" in parsed) return bad(parsed.error);
  try {
    const customer = await db.customer.create({ data: { ...parsed.data, tenantId: me.tenantId } });
    return NextResponse.json(customer, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return bad("Nama pelanggan sudah digunakan", 409);
    }
    throw e;
  }
}
