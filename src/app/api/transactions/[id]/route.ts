import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { bad, json } from "@/lib/api";
import { getSessionFromRequest } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  const user = await getSessionFromRequest(request);
  if (!user) return bad("Silakan login", 401);
  const { id } = await params;
  const t = await db.transaction.findFirst({
    where: { id, tenantId: user.tenantId },
    include: {
      items: { orderBy: { name: "asc" } },
      customer: { select: { name: true, points: true } },
    },
  });
  if (!t) return bad("Transaksi tidak ditemukan", 404);
  return json(t);
}
