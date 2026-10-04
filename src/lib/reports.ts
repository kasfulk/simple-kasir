export type SummaryItem = { price: number; costPrice: number | null; quantity: number };
export type SummaryRow = { status: string; total: number; items: SummaryItem[] };
export type Summary = { revenue: number; txCount: number; profit: number };

// Revenue/count dari transaksi non-VOID; profit hanya dari item ber-snapshot costPrice.
export function summarize(rows: SummaryRow[]): Summary {
  let revenue = 0;
  let txCount = 0;
  let profit = 0;
  for (const t of rows) {
    if (t.status === "VOID") continue;
    revenue += t.total;
    txCount += 1;
    for (const it of t.items) {
      if (it.costPrice != null) profit += (it.price - it.costPrice) * it.quantity;
    }
  }
  return { revenue, txCount, profit };
}
