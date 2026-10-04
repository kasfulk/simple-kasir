import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { bad } from "@/lib/api";
import { parseCustomer } from "@/lib/validation";
import { requireOwner } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Ctx) {
  const me = await requireOwner(request);
  if (!me) return bad("Akses khusus Owner", 403);
  const { id } = await params;
  const parsed = parseCustomer(await request.json());
  if ("error" in parsed) return bad(parsed.error);
  const existing = await db.customer.findFirst({ where: { id, tenantId: me.tenantId } });
  if (!existing) return bad("Pelanggan tidak ditemukan", 404);
  try {
    const customer = await db.customer.update({ where: { id: existing.id }, data: parsed.data });
    return NextResponse.json(customer);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") return bad("Nama pelanggan sudah digunakan", 409);
      if (e.code === "P2025") return bad("Pelanggan tidak ditemukan", 404);
    }
    throw e;
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const me = await requireOwner(request);
  if (!me) return bad("Akses khusus Owner", 403);
  const { id } = await params;
  const existing = await db.customer.findFirst({ where: { id, tenantId: me.tenantId } });
  if (!existing) return bad("Pelanggan tidak ditemukan", 404);
  // customerId di Transaction SetNull — riwayat tetap utuh
  await db.customer.delete({ where: { id: existing.id } });
  return NextResponse.json({ message: "Pelanggan dihapus" });
}
