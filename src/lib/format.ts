export const rupiah = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");

const METHOD_LABEL: Record<string, string> = {
  TUNAI: "Tunai",
  DEBIT: "Kartu Debit",
  QRIS: "QRIS",
  INVOICE: "Invoice",
};

export const methodLabel = (m: string) => METHOD_LABEL[m] ?? m;

export function tanggalWaktu(d: Date | string) {
  const dt = new Date(d);
  return (
    dt.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) +
    ", " +
    dt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  );
}