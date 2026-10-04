import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { bad, json } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { summarize } from "@/lib/reports";

// Ringkasan 7 hari (termasuk hari ini, WIB). VOID dikecualikan dari omzet & laba.
export async function GET(request: NextRequest) {
  const me = await requireOwner(request);
  if (!me) return bad("Akses khusus Owner", 403);

  // ponytail: offset WIB (+07:00) konsisten dgn filter harian transactions
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" });
  const today = fmt.format(new Date());
  const start = new Date(`${today}T00:00:00+07:00`);
  start.setDate(start.getDate() - 6);

  const [rows, lows] = await Promise.all([
    db.transaction.findMany({
      where: { tenantId: me.tenantId, createdAt: { gte: start } },
      include: { items: true },
      orderBy: { createdAt: "asc" },
    }),
    db.product.findMany({
      where: { tenantId: me.tenantId, isActive: true },
      select: { stock: true, minStock: true },
    }),
  ]);

  const keys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(`${today}T00:00:00+07:00`);
    d.setDate(d.getDate() - i);
    keys.push(fmt.format(d));
  }
  const revByDay: Record<string, number> = {};
  for (const k of keys) revByDay[k] = 0;
  for (const t of rows) {
    if (t.status === "VOID") continue;
    revByDay[fmt.format(t.createdAt)] += t.total;
  }

  const byName: Record<string, { qty: number; revenue: number }> = {};
  for (const t of rows) {
    if (t.status === "VOID") continue;
    for (const it of t.items) {
      const e = (byName[it.name] ??= { qty: 0, revenue: 0 });
      e.qty += it.quantity;
      e.revenue += it.price * it.quantity;
    }
  }
  const topProducts = Object.entries(byName)
    .map(([name, e]) => ({ name, ...e }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  return json({
    ...summarize(rows),
    lowStockCount: lows.filter((p) => p.stock < p.minStock).length,
    dailySeries: keys.map((k) => ({ date: k, revenue: revByDay[k] })),
    topProducts,
  });
}
