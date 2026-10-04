import { db } from "@/lib/db";
import type { AppSettings } from "@/lib/types";

export const DEFAULT_SETTINGS: AppSettings = {
  outletName: "Simple POS",
  outletAddress: null,
  outletPhone: null,
  taxRate: 10,
  receiptFooter: "Terima kasih atas kunjungan Anda",
};

export async function getSettings(tenantId: string): Promise<AppSettings> {
  const s = await db.setting.findUnique({ where: { tenantId } });
  return s ?? DEFAULT_SETTINGS;
}