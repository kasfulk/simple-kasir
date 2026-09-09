// ponytail: skrip sekali pakai utk reset password owner; hapus setelah dijalankan
import { PrismaClient } from "@prisma/client";
import { randomBytes, pbkdf2Sync } from "node:crypto";

const db = new PrismaClient();
const salt = randomBytes(16);
const hash = pbkdf2Sync("owner123", salt, 600000, 32, "sha256");
const hex = (b) => b.toString("hex");
const passwordHash = `pbkdf2:600000:${hex(salt)}:${hex(hash)}`;

const u = await db.user.update({ where: { username: "owner" }, data: { passwordHash } });
console.log(`reset ok: ${u.username} (${u.role}) -> ${u.passwordHash.slice(0, 24)}...`);
await db.$disconnect();