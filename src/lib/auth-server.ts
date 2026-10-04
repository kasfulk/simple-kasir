// Terpisah dari lib/auth agar middleware (Edge runtime) tidak menarik next/headers.
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken, type SessionUser } from "./auth";

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}