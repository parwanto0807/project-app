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

const paymentMethods = [
  "TRANSFER",
  "CASH",
  "CREDIT_CARD",
  "VA",
  "E_WALLET",
  "CHEQUE",
] as const;

export const paymentFormSchema = (balanceDue: number) =>
  z
    .object({
      payDate: z
        .date()
        .max(
          new Date(Date.now() + 24 * 60 * 60 * 1000),
          "Tanggal pembayaran tidak boleh lebih dari 1 hari ke depan"
        )
        .min(new Date("2020-01-01"), "Tanggal tidak valid"),

      amount: z
        .number({ invalid_type_error: "Jumlah harus berupa angka" })
        .positive("Jumlah pembayaran harus lebih dari 0")
        .max(
          balanceDue,
          `Jumlah tidak boleh melebihi sisa tagihan: ${balanceDue}`
        ),

      method: z.enum(paymentMethods, {
        errorMap: () => ({ message: "Metode pembayaran tidak valid" }),
      }),

      bankAccountId: z.string().trim().optional(), // ✅ trim dulu, baru optional

      reference: z.string().min(1, "Nomor referensi wajib diisi").trim(), // ✅ wajib, jadi tidak perlu optional

      notes: z.string().trim().optional(), // ✅ benar

      installmentId: z.string().trim().optional(), // ✅ benar

      verifiedById: z.string().trim().optional(), // ✅ benar

      accountCOAId: z.string().trim().optional(), // ✅ Added

      adminFee: z.number().min(0).default(0), // Biaya admin, default 0
    })
    .superRefine((data, ctx) => {
      if (data.method === "TRANSFER" && !data.bankAccountId) {
        ctx.addIssue({
          path: ["bankAccountId"],
          code: "custom",
          message: "Rekening bank wajib dipilih untuk metode transfer bank",
        });
      }
    });
