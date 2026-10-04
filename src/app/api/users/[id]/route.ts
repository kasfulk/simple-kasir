import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { bad } from "@/lib/api";
import { parseUser } from "@/lib/validation";
import { hashPassword, requireOwner } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

const SELECT = { id: true, username: true, name: true, role: true, isActive: true } as const;

export async function PUT(request: NextRequest, { params }: Ctx) {
  const me = await requireOwner(request);
  if (!me) return bad("Akses khusus Owner", 403);
  const { id } = await params;
  const parsed = parseUser(await request.json(), { requirePassword: false });
  if ("error" in parsed) return bad(parsed.error);

  const target = await db.user.findFirst({ where: { id, tenantId: me.tenantId } });
  if (!target) return bad("Pengguna tidak ditemukan", 404);

  const losingOwner =
    target.role === "OWNER" &&
    target.isActive &&
    (parsed.data.role === "KASIR" || !parsed.data.isActive);
  if (losingOwner) {
    const others = await db.user.count({
      where: { role: "OWNER", isActive: true, id: { not: target.id }, tenantId: me.tenantId },
    });
    if (others === 0) return bad("Minimal harus ada satu Owner aktif");
  }

  const data: { name: string; role: "OWNER" | "KASIR"; isActive: boolean; passwordHash?: string } = {
    name: parsed.data.name,
    role: parsed.data.role,
    isActive: parsed.data.isActive,
  };
  if (parsed.data.password) data.passwordHash = await hashPassword(parsed.data.password);

  try {
    const user = await db.user.update({ where: { id: target.id }, data, select: SELECT });
    return NextResponse.json(user);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return bad("Pengguna tidak ditemukan", 404);
    }
    throw e;
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const me = await requireOwner(request);
  if (!me) return bad("Akses khusus Owner", 403);
  const { id } = await params;
  if (id === me.id) return bad("Tidak dapat menghapus akun sendiri");

  const target = await db.user.findFirst({ where: { id, tenantId: me.tenantId } });
  if (!target) return bad("Pengguna tidak ditemukan", 404);
  if (target.role === "OWNER" && target.isActive) {
    const others = await db.user.count({
      where: { role: "OWNER", isActive: true, id: { not: target.id }, tenantId: me.tenantId },
    });
    if (others === 0) return bad("Minimal harus ada satu Owner aktif");
  }

  try {
    await db.user.delete({ where: { id: target.id } });
    return NextResponse.json({ message: "Pengguna dihapus" });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return bad("Pengguna tidak ditemukan", 404);
    }
    throw e;
  }
}
