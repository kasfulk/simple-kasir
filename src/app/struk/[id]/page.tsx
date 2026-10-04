import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getSessionUser } from "@/lib/auth-server";
import { ReceiptView, type ReceiptData } from "@/components/receipt-view";

export const dynamic = "force-dynamic";

export default async function StrukPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) notFound();
  const [t, s] = await Promise.all([
    db.transaction.findFirst({
      where: { id, tenantId: user.tenantId },
      include: { items: { orderBy: { name: "asc" } }, customer: { select: { name: true } } },
    }),
    getSettings(user.tenantId),
  ]);
  if (!t) notFound();

  const data: ReceiptData = {
    invoiceNo: t.invoiceNo,
    subtotal: t.subtotal,
    discount: t.discount,
    pointsUsed: t.pointsUsed,
    tax: t.tax,
    total: t.total,
    method: t.method,
    cashierName: t.cashierName,
    status: t.status,
    customerName: t.customer?.name ?? null,
    paid: t.paid,
    change: t.change,
    taxRate: t.taxRate,
    outletName: s.outletName,
    outletAddress: s.outletAddress,
    outletPhone: s.outletPhone,
    receiptFooter: s.receiptFooter,
    logo: s.logo,
    createdAt: t.createdAt.toISOString(),
    items: t.items.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
  };

  return <ReceiptView t={data} />;
}