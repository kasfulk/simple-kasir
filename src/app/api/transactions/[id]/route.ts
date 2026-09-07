import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { bad, json } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const t = await db.transaction.findUnique({
    where: { id },
    include: { items: { orderBy: { name: "asc" } } },
  });
  if (!t) return bad("Transaksi tidak ditemukan", 404);
  return json(t);
}