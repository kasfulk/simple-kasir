// Reset semua password user menjadi "password" (format hash sama dengan src/lib/auth.ts)
import { PrismaClient } from "@prisma/client";
import { randomBytes, pbkdf2Sync } from "node:crypto";

const db = new PrismaClient();
const ITER = 600_000;
const hash = (pw) => {
  const salt = randomBytes(16);
  return `pbkdf2:${ITER}:${salt.toString("hex")}:${pbkdf2Sync(pw, salt, ITER, 32, "sha256").toString("hex")}`;
};

const users = await db.user.findMany();
console.log("reset:", users.length, "user");
for (const u of users) {
  await db.user.update({ where: { id: u.id }, data: { passwordHash: hash("password") } });
}
for (const u of await db.user.findMany()) {
  const [scheme, iters, saltHex, hashHex] = u.passwordHash.split(":");
  const ok =
    scheme === "pbkdf2" &&
    pbkdf2Sync("password", Buffer.from(saltHex, "hex"), +iters, 32, "sha256").toString("hex") === hashHex;
  console.log(u.username, `(${u.role})`, ok ? "OK" : "FAIL");
}
await db.$disconnect();