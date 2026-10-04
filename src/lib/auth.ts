// Auth tanpa dependensi eksternal: PBKDF2 (Web Crypto) untuk password,
// HMAC-SHA256 untuk sesi cookie. Berjalan di Node runtime & Edge middleware.
import type { NextRequest } from "next/server";

export type Role = "OWNER" | "KASIR";

export type SessionUser = {
  id: string;
  username: string;
  name: string;
  role: Role;
  tenantId: string;
};

const SESSION_COOKIE = "sk_session";
const SESSION_TTL = 60 * 60 * 24 * 7; // detik (7 hari)
// ponytail: PBKDF2-SHA256 600k iterasi (OWASP 2023); naikkan ke argon2 bila sudah pindah Postgres/multi-instance
const PBKDF2_ITERATIONS = 600_000;
// ponytail: sesi stateless — nonaktif/hapus akun tidak mencabut cookie yang sudah terbit (maks. 7 hari); pakai daftar sesi di DB bila perlu logout paksa

const enc = new TextEncoder();

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET wajib diisi (min 32 karakter) di .env");
  return s;
}

const toHex = (buf: ArrayBuffer | Uint8Array) =>
  Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");

const fromHex = (hex: string): Uint8Array<ArrayBuffer> =>
  new Uint8Array((hex.match(/../g) ?? []).map((h) => parseInt(h, 16)));

// b64url tanpa Buffer agar aman di Edge runtime
function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function safeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// ===== Password =====

async function deriveBits(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number
): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  return crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = new Uint8Array(await deriveBits(password, salt, PBKDF2_ITERATIONS));
  return `pbkdf2:${PBKDF2_ITERATIONS}:${toHex(salt)}:${toHex(bits)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iters, saltHex, hashHex] = stored.split(":");
  if (scheme !== "pbkdf2" || !iters || !saltHex || !hashHex) return false;
  const bits = new Uint8Array(await deriveBits(password, fromHex(saltHex), Number(iters)));
  return safeEqual(bits, fromHex(hashHex));
}

// ===== Sesi =====

type SessionPayload = SessionUser & { exp: number };

async function hmacKey(usage: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, usage);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  const payload: SessionPayload = { ...user, exp: Date.now() + SESSION_TTL * 1000 };
  const body = b64urlEncode(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(["sign"]), enc.encode(body));
  return `${body}.${b64urlEncode(new Uint8Array(sig))}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot === -1) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  try {
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(["verify"]), b64urlDecode(sig), enc.encode(body));
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(body))) as SessionPayload;
    if (!payload || typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return { id: payload.id, username: payload.username, name: payload.name, role: payload.role, tenantId: payload.tenantId };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL,
  secure: process.env.NODE_ENV === "production",
};

// ===== Helper server =====


export async function getSessionFromRequest(req: NextRequest): Promise<SessionUser | null> {
  return verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
}

export async function requireOwner(req: NextRequest): Promise<SessionUser | null> {
  const user = await getSessionFromRequest(req);
  return user && user.role === "OWNER" ? user : null;
}

export { SESSION_COOKIE };