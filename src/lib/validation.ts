type Parsed<T> = { error: string } | { data: T };

export type ProductData = {
  sku: string;
  name: string;
  categoryId: string;
  price: number;
  stock: number;
  minStock: number;
  costPrice: number | null;
  description: string | null;
  isActive: boolean;
};

export type CategoryData = {
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
};

const asObject = (b: unknown): Record<string, unknown> =>
  b && typeof b === "object" ? (b as Record<string, unknown>) : {};

const intGte0 = (v: number) => Number.isInteger(v) && v >= 0;

export function parseProduct(b: unknown): Parsed<ProductData> {
  const o = asObject(b);
  const sku = String(o.sku ?? "").trim();
  const name = String(o.name ?? "").trim();
  const categoryId = String(o.categoryId ?? "");
  const price = o.price === "" || o.price == null ? NaN : Number(o.price);
  const stock = o.stock === "" || o.stock == null ? NaN : Number(o.stock);
  const minStock = o.minStock === "" || o.minStock == null ? 5 : Number(o.minStock);
  const costPrice = o.costPrice === "" || o.costPrice == null ? null : Number(o.costPrice);
  const description = o.description ? String(o.description).trim().slice(0, 1000) : null;
  const isActive = o.isActive !== false && o.isActive !== "false";

  if (!sku) return { error: "SKU wajib diisi" };
  if (!/^[A-Za-z0-9-]+$/.test(sku)) return { error: "SKU hanya boleh huruf, angka, dan dash" };
  if (!name) return { error: "Nama produk wajib diisi" };
  if (name.length > 200) return { error: "Nama produk maksimal 200 karakter" };
  if (!intGte0(price)) return { error: "Harga harus angka bulat >= 0" };
  if (costPrice !== null && !intGte0(costPrice)) return { error: "Harga pokok harus angka bulat >= 0" };
  if (!intGte0(stock)) return { error: "Stok harus angka bulat >= 0" };
  if (!intGte0(minStock)) return { error: "Minimum stok harus angka bulat >= 0" };

  return { data: { sku, name, categoryId, price, stock, minStock, costPrice, description, isActive } };
}

export function parseCategory(b: unknown): Parsed<CategoryData> {
  const o = asObject(b);
  const name = String(o.name ?? "").trim();
  const description = o.description ? String(o.description).trim().slice(0, 500) : null;
  const displayOrder = o.displayOrder === "" || o.displayOrder == null ? 0 : Number(o.displayOrder);
  const isActive = o.isActive !== false && o.isActive !== "false";

  if (!name) return { error: "Nama kategori wajib diisi" };
  if (name.length > 100) return { error: "Nama kategori maksimal 100 karakter" };
  if (!intGte0(displayOrder)) return { error: "Urutan tampilan harus angka bulat >= 0" };

  return { data: { name, description, displayOrder, isActive } };
}

export type SettingsData = {
  outletName: string;
  outletAddress: string | null;
  outletPhone: string | null;
  taxRate: number;
  receiptFooter: string;
  logo: string | null;
};

export function parseSettings(b: unknown): Parsed<SettingsData> {
  const o = asObject(b);
  const outletName = String(o.outletName ?? "").trim();
  const outletAddress = o.outletAddress ? String(o.outletAddress).trim().slice(0, 200) : null;
  const outletPhone = o.outletPhone ? String(o.outletPhone).trim().slice(0, 30) : null;
  const taxRate = o.taxRate === "" || o.taxRate == null ? 10 : Number(o.taxRate);
  const receiptFooter =
    String(o.receiptFooter ?? "").trim().slice(0, 200) || "Terima kasih atas kunjungan Anda";

  const logo = typeof o.logo === "string" && o.logo ? o.logo : null;
  if (logo && !/^data:image\/(png|jpe?g|webp);base64,/.test(logo)) {
    return { error: "Logo harus berkas gambar PNG/JPG/WebP" };
  }
  if (logo && logo.length > 300_000) {
    return { error: "Logo terlalu besar (maksimal ±220KB)" };
  }
  if (!outletName) return { error: "Nama outlet wajib diisi" };
  if (outletName.length > 100) return { error: "Nama outlet maksimal 100 karakter" };
  if (!Number.isInteger(taxRate) || taxRate < 0 || taxRate > 100) return { error: "PPN harus angka bulat 0-100" };

  return { data: { outletName, outletAddress, outletPhone, taxRate, receiptFooter, logo } };
}

export type UserData = {
  username: string;
  name: string;
  role: "OWNER" | "KASIR";
  isActive: boolean;
  password: string | null;
};

export function parseUser(
  b: unknown,
  opts: { requireUsername?: boolean; requirePassword?: boolean } = {}
): Parsed<UserData> {
  const o = asObject(b);
  const username = String(o.username ?? "").trim().toLowerCase();
  const name = String(o.name ?? "").trim();
  const role = o.role === "OWNER" ? "OWNER" : "KASIR";
  const isActive = o.isActive !== false && o.isActive !== "false";
  const password = o.password ? String(o.password) : null;

  if (opts.requireUsername && !username) return { error: "Username wajib diisi" };
  if (username && !/^[a-z0-9._-]{3,30}$/.test(username)) {
    return { error: "Username 3-30 karakter: huruf kecil, angka, titik, dash, atau underscore" };
  }
  if (!name) return { error: "Nama wajib diisi" };
  if (name.length > 100) return { error: "Nama maksimal 100 karakter" };
  if (password !== null && password.length < 6) return { error: "Password minimal 6 karakter" };
  if (opts.requirePassword && password === null) return { error: "Password wajib diisi" };

  return { data: { username, name, role, isActive, password } };
}

export type CustomerData = { name: string; phone: string | null; isActive: boolean };

export function parseCustomer(b: unknown): Parsed<CustomerData> {
  const o = asObject(b);
  const name = String(o.name ?? "").trim();
  const phone = o.phone ? String(o.phone).trim().slice(0, 30) : null;
  const isActive = o.isActive !== false && o.isActive !== "false";

  if (!name) return { error: "Nama pelanggan wajib diisi" };
  if (name.length > 100) return { error: "Nama pelanggan maksimal 100 karakter" };

  return { data: { name, phone, isActive } };
}

// Item kasir manual (tidak terdaftar): nama bebas, harga/jumlah angka bulat — tanpa SKU/kategori/stok
export type ManualItemData = { name: string; price: number; quantity: number };

export function parseManualItem(b: unknown): Parsed<ManualItemData> {
  const o = asObject(b);
  const name = String(o.name ?? "").trim();
  const price = Number(o.price);
  const quantity = o.quantity == null || o.quantity === "" ? 1 : Number(o.quantity);

  if (!name) return { error: "Nama item wajib diisi" };
  if (name.length > 100) return { error: "Nama item maksimal 100 karakter" };
  if (!intGte0(price) || price > 100_000_000) return { error: "Harga harus angka bulat 0-100 juta" };
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) return { error: "Jumlah harus angka bulat 1-999" };

  return { data: { name, price, quantity } };
}