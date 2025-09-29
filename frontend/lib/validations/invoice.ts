import { z } from "zod";

export const invoiceFormSchema = z.object({
  invoiceNumber: z.string(),
  invoiceDate: z.date(),
  dueDate: z.date(),
  salesOrderId: z.string().nonempty({ message: "Sales Order harus diisi" }),
  currency: z.string().default("IDR"),
  exchangeRate: z.number().default(1),
  paymentTerm: z.string().optional(),
  installmentType: z.string().default("FULL"),
  notes: z.string().optional(),
  bankAccountId: z.string().nonempty({ message: "Bank Account harus diisi" }),
  internalNotes: z.string().optional(),
  termsConditions: z.string().optional(),
  createdById: z.string().nonempty({ message: "Created Invoice harus diisi" }),
  approvedById: z
    .string()
    .nonempty({ message: "Approved Invoice harus diisi" }),
  items: z
    .array(
      z.object({
        soItemId: z.string().optional(),
        itemCode: z.string().optional(),
        name: z.string().min(1, "Name is required"),
        description: z.string().optional(),
        uom: z.string().optional(),
        qty: z.number().min(0, "Qty must be >= 0"),
        unitPrice: z.number().min(0, "Unit price must be >= 0"),
        discount: z.number().default(0),
        discountPercent: z.number().default(0),
        taxRate: z.number().default(0),
        taxCode: z.string().optional(),
        taxable: z.boolean().default(true),
      })
    )
    .optional(),
  installments: z
    .array(
      z.object({
        installmentNumber: z.number(),
        name: z.string(),
        amount: z.number(),
        percentage: z.number().optional(),
        dueDate: z.date(),
        description: z.string().optional(),
        conditions: z.string().optional(),
      })
    )
    .optional(),
});

export type InvoiceFormData = z.infer<typeof invoiceFormSchema>;
