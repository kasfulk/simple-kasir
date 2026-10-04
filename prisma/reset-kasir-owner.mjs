// ponytail: sekali pakai — reset password owner/kasir. Hapus kalau sudah jalan.
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "./seed-helpers.mjs";

const db = new PrismaClient();
const TARGET = { owner: "owner", kasir: "kasir" };

const hex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
async function verify(password, stored) {
  const [scheme, iters, saltHex, hashHex] = stored.split(":");
  if (scheme !== "pbkdf2") return false;
  const salt = new Uint8Array(Buffer.from(saltHex, "hex"));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: +iters }, key, 256));
  return hex(bits) === hashHex;
}

for (const [username, password] of Object.entries(TARGET)) {
  const u = await db.user.findUnique({ where: { username } });
  if (!u) {
    console.log(`${username}: TIDAK ADA`);
    continue;
  }
  await db.user.update({ where: { id: u.id }, data: { passwordHash: await hashPassword(password), isActive: true } });
  const fresh = await db.user.findUnique({ where: { id: u.id } });
  console.log(`${username} (${u.role}) -> ${await verify(password, fresh.passwordHash) ? "OK" : "FAIL"} active=${fresh.isActive}`);
}
await db.$disconnect();
