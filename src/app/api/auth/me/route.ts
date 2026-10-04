import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { bad, json } from "@/lib/api";

export async function GET(request: NextRequest) {
  const user = await getSessionFromRequest(request);
  if (!user) return bad("Belum login", 401);
  return json(user);
}