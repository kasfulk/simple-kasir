import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { bad } from "@/lib/api";
import { getSessionFromRequest } from "@/lib/auth";
import { toCsv, csvResponse } from "@/lib/csv";

const METHODS = ["TUNAI", "DEBIT", "QRIS", "INVOICE"] as const;

export async function GET(request: NextRequest) {
  const user = await getSessionFromRequest(request);
  if (!user) return bad("Silakan login", 401);
  const sp = request.nextUrl.searchParams;
  const method = sp.get("method") ?? "";
  const dateStr = sp.get("date") ?? "";

  let createdAt: { gte: Date; lt: Date } | undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const gte = new Date(`${dateStr}T00:00:00+07:00`);
    const lt = new Date(gte);
    lt.setDate(lt.getDate() + 1);
    createdAt = { gte, lt };
  }

  const where = {
    tenantId: user.tenantId,
    ...(method && (METHODS as readonly string[]).includes(method) ? { method } : {}),
    ...(createdAt ? { createdAt } : {}),
  };

  const rows = await db.transaction.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: 5000,
    include: { customer: { select: { name: true } }, _count: { select: { items: true } } },
  });

  const csv = toCsv(
    rows.map((t) => ({
      Invoice: t.invoiceNo,
      Tanggal: t.createdAt.toISOString(),
      Status: t.status,
      Subtotal: t.subtotal,
      Diskon: t.discount,
      PPN: t.tax,
      Total: t.total,
      Metode: t.method,
      Kasir: t.cashierName ?? "-",
      Pelanggan: t.customer?.name ?? "-",
      Item: t._count.items,
    }))
  );
  return csvResponse(`transaksi-${dateStr || "semua"}.csv`, csv);
}
