import { db } from "@/lib/db";
import type { AppSettings } from "@/lib/types";

export const DEFAULT_SETTINGS: AppSettings = {
  outletName: "Simple POS",
  outletAddress: null,
  outletPhone: null,
  taxRate: 10,
  receiptFooter: "Terima kasih atas kunjungan Anda",
};

export async function getSettings(): Promise<AppSettings> {
  const s = await db.setting.findUnique({ where: { id: "default" } });
  return s ?? DEFAULT_SETTINGS;
}