import { Invoice, InvoiceStatus } from "@/schemas/invoice/index";

export function calculateItemTotal(item: {
  qty: number;
  unitPrice: number;
  taxRate?: number;
}): number {
  const subtotal = item.qty * item.unitPrice;
  const taxAmount = item.taxRate ? subtotal * (item.taxRate / 100) : 0;
  return subtotal + taxAmount;
}

export function calculateInvoiceTotals(
  items: Array<{ qty: number; unitPrice: number; taxRate?: number }>
) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.qty * item.unitPrice,
    0
  );
  const taxAmount = items.reduce((sum, item) => {
    const itemSubtotal = item.qty * item.unitPrice;
    return sum + (item.taxRate ? itemSubtotal * (item.taxRate / 100) : 0);
  }, 0);
  const totalAmount = subtotal + taxAmount;
  return { subtotal, taxAmount, totalAmount };
}

export function isInvoiceOverdue(invoice: Invoice): boolean {
  const dueDate = new Date(invoice.dueDate);
  const today = new Date();
  return (
    dueDate < today && invoice.balanceDue > 0 && invoice.status === "APPROVED"
  );
}

export function getInvoiceStatusColor(status: InvoiceStatus): string {
  const statusColors = {
    DRAFT: "bg-gray-100 text-gray-800",
    WAITING_APPROVAL: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  };
  return statusColors[status] || "bg-gray-100 text-gray-800";
}
