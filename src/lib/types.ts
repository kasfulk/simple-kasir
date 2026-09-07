export type CategoryWithCount = {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  productCount: number;
};

export type ProductWithCategory = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  categoryId: string;
  price: number;
  costPrice: number | null;
  stock: number;
  minStock: number;
  isActive: boolean;
  category: { id: string; name: string };
};

export type AppSettings = {
  outletName: string;
  outletAddress: string | null;
  outletPhone: string | null;
  taxRate: number;
  receiptFooter: string;
};

export type TransactionRow = {
  id: string;
  invoiceNo: string;
  subtotal: number;
  discount: number;
  taxRate: number;
  tax: number;
  total: number;
  method: string;
  paid: number;
  change: number;
  createdAt: string;
  totalQty: number;
};