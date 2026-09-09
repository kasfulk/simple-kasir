import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bad } from "@/lib/api";
import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifyPassword,
  type Role,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const username = String(body?.username ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  if (!username || !password) return bad("Username dan password wajib diisi");

  const user = await db.user.findUnique({ where: { username } });
  // pesan identik utk user tak ada / password salah: jangan bocorkan keberadaan akun
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return bad("Username atau password salah", 401);
  }
  if (!user.isActive) return bad("Akun dinonaktifkan, hubungi Owner", 403);

  const token = await createSessionToken({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role as Role,
  });
  const res = NextResponse.json({ id: user.id, username: user.username, name: user.name, role: user.role });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}