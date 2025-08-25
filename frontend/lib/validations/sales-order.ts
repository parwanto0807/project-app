/* ===== Enums (string unions) ===== */
export type OrderType = "REGULAR" | "SUPPORT";
export type OrderStatus =
  | "DRAFT"
  | "SENT"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "FULFILLED"
  | "PARTIALLY_INVOICED"
  | "INVOICED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "CANCELLED";
export type ItemType = "PRODUCT" | "SERVICE" | "CUSTOM";
export type DocType =
  | "QUOTATION"
  | "PO"
  | "BAP"
  | "INVOICE"
  | "PAYMENT_RECEIPT";

/* ===== Documents ===== */
export interface SalesOrderDocument {
  id: string;
  salesOrderId?: string;
  docType: DocType;
  docNumber?: string | null;
  docDate?: string | null; // ISO string
  fileUrl?: string | null;
  meta?: unknown | null;
  createdAt: string; // ISO string
}

/* ===== Items ===== */
export interface SalesOrderItem {
  id: string;
  salesOrderId?: string;

  lineNo: number; // urutan baris unik per SO
  itemType: ItemType;

  // Snapshot & relasi product (optional untuk SERVICE/CUSTOM)
  productId?: string | null;
  product?: { id: string; name: string } | null;

  name: string; // snapshot nama saat input
  description?: string | null;
  uom?: string | null;

  qty: number; // 4 desimal di DB; FE pakai number
  unitPrice: number; // 2 desimal di DB
  discount: number; // nominal, 2 desimal
  taxRate: number; // persen (0–100), 2 desimal

  lineTotal: number; // total baris (exclusive tax formula)
}

/* ===== Header / Sales Order ===== */
export interface SalesOrder {
  id: string;
  soNumber: string;
  soDate: string; // ISO string

  customerId: string;
  projectId: string; // FK wajib di model
  userId: string;

  type: OrderType;
  status: OrderStatus;
  currency: string; // e.g. "IDR"
  isTaxInclusive: boolean; // harga sudah termasuk pajak atau belum

  // Header totals (hasil agregasi item)
  subtotal: number; // sum(net) = setelah diskon, sebelum pajak
  discountTotal: number; // sum(discount)
  taxTotal: number; // sum(tax)
  grandTotal: number; // sum(total)

  notes?: string | null;

  createdAt: string; // ISO string
  updatedAt: string; // ISO string

  // Relasi untuk display
  customer: {
    id: string;
    name: string;
    address?: string;
    branch?: string | null;
  };
  project: { id: string; name: string };
  user?: { id: string; name?: string } | null;

  items: SalesOrderItem[];
  documents: SalesOrderDocument[]; // array dokumen terkait (QUOTATION/PO/BAP/INVOICE/PAYMENT_RECEIPT)
}
