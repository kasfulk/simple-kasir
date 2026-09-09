import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { bad, json } from "@/lib/api";
import { parseUser } from "@/lib/validation";
import { hashPassword, requireOwner } from "@/lib/auth";

export async function GET(request: NextRequest) {
  if (!(await requireOwner(request))) return bad("Akses khusus Owner", 403);
  const users = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, username: true, name: true, role: true, isActive: true, createdAt: true },
  });
  return json(users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })));
}

export async function POST(request: NextRequest) {
  if (!(await requireOwner(request))) return bad("Akses khusus Owner", 403);
  const parsed = parseUser(await request.json(), { requireUsername: true, requirePassword: true });
  if ("error" in parsed) return bad(parsed.error);
  const { password, ...data } = parsed.data;
  if (!password) return bad("Password wajib diisi");

  try {
    const user = await db.user.create({
      data: { ...data, passwordHash: await hashPassword(password) },
      select: { id: true, username: true, name: true, role: true, isActive: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return bad("Username sudah digunakan", 409);
    }
    throw e;
  }
}