import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { ReceiptView, type ReceiptData } from "@/components/receipt-view";

export const dynamic = "force-dynamic";

export default async function StrukPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [t, s] = await Promise.all([
    db.transaction.findUnique({
      where: { id },
      include: { items: { orderBy: { name: "asc" } } },
    }),
    getSettings(),
  ]);
  if (!t) notFound();

  const data: ReceiptData = {
    invoiceNo: t.invoiceNo,
    subtotal: t.subtotal,
    discount: t.discount,
    tax: t.tax,
    total: t.total,
    method: t.method,
    cashierName: t.cashierName,
    paid: t.paid,
    change: t.change,
    taxRate: t.taxRate,
    outletName: s.outletName,
    outletAddress: s.outletAddress,
    outletPhone: s.outletPhone,
    receiptFooter: s.receiptFooter,
    createdAt: t.createdAt.toISOString(),
    items: t.items.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
  };

  return <ReceiptView t={data} />;
}