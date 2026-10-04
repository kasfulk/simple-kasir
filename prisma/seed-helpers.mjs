// Dipakai seed.mjs & tenant-backfill.mjs. Format harus identik dgn src/lib/auth.ts (pbkdf2:iterasi:salt:hash)
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 600000 }, key, 256));
  const hex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `pbkdf2:600000:${hex(salt)}:${hex(bits)}`;
}
