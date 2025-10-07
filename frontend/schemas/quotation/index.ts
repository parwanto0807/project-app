import { z } from "zod";
import { QuotationStatus, LineType, DiscountType } from "../../types/quotation";

// Base Schemas
export const quotationStatusSchema = z.nativeEnum(QuotationStatus);
export const lineTypeSchema = z.nativeEnum(LineType);
export const discountTypeSchema = z.nativeEnum(DiscountType);

// History Payload Schema
export const quotationHistoryPayloadSchema = z.object({
  id: z.string().uuid(),
  quotationNumber: z.string(),
  version: z.number().int().positive(),
  customerId: z.string().uuid(),
  currency: z.string(),
  exchangeRate: z.number().positive(),
  status: quotationStatusSchema,
  validFrom: z.string().datetime().optional().nullable(),
  validUntil: z.string().datetime().optional().nullable(),
  paymentTermId: z.string().uuid().optional().nullable(),
  subtotal: z.number().min(0),
  discountType: discountTypeSchema,
  discountValue: z.number().min(0),
  taxInclusive: z.boolean(),
  taxTotal: z.number().min(0),
  otherCharges: z.number().min(0),
  total: z.number().min(0),
  notes: z.string().optional().nullable(),
  preparedBy: z.string().optional().nullable(),
  approvedBy: z.string().optional().nullable(),
  approvedAt: z.string().datetime().optional().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const quotationChangePayloadSchema = z.object({
  changes: z.array(
    z.object({
      field: z.string(),
      oldValue: z.unknown(),
      newValue: z.unknown(),
    })
  ),
  snapshot: quotationHistoryPayloadSchema,
});

export const quotationHistoryPayloadUnionSchema = z.union([
  quotationHistoryPayloadSchema,
  quotationChangePayloadSchema,
]);

// Quotation Line Schema
export const quotationLineSchema = z.object({
  lineType: lineTypeSchema.default(LineType.PRODUCT),
  productId: z.string().uuid().optional().nullable(),
  description: z
    .string()
    .min(1, "Description is required")
    .optional()
    .nullable(),
  qty: z.number().min(0.001, "Quantity must be greater than 0"),
  uom: z.string().optional().nullable(),
  unitPrice: z.number().min(0, "Unit price must be non-negative"),
  lineDiscountType: discountTypeSchema.default(DiscountType.PERCENT),
  lineDiscountValue: z.number().min(0, "Discount value must be non-negative"),
  taxId: z.string().uuid().optional().nullable(),
});

// Main Quotation Schema
export const createQuotationSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID"),
  quotationNumber: z.string().optional(),
  salesOrderId: z.string().optional(),
  currency: z.string().min(1, "Currency is required").default("IDR"),
  exchangeRate: z
    .number()
    .positive("Exchange rate must be positive")
    .default(1.0),
  status: quotationStatusSchema.default(QuotationStatus.DRAFT),
  validFrom: z.string().datetime().optional().nullable(),
  validUntil: z.string().datetime().optional().nullable(),
  paymentTermId: z.string().uuid().optional().nullable(),
  discountType: discountTypeSchema.default(DiscountType.PERCENT),
  discountValue: z
    .number()
    .min(0, "Discount value must be non-negative")
    .default(0),
  taxInclusive: z.boolean().default(false),
  otherCharges: z
    .number()
    .min(0, "Other charges must be non-negative")
    .default(0),
  notes: z.string().optional().nullable(),
  preparedBy: z.string().optional().nullable(),
  lines: z
    .array(quotationLineSchema)
    .min(1, "At least one line item is required")
    .refine(
      (lines) =>
        lines.every(
          (line, index, arr) =>
            arr.findIndex(
              (l) => l.productId === line.productId && l.productId
            ) === index
        ),
      { message: "Duplicate products are not allowed" }
    ),
  autoGenerateNumber: z.boolean().default(true),
});

export const updateQuotationSchema = createQuotationSchema
  .partial()
  .extend({
    customerId: z.string().uuid("Invalid customer ID"), // override supaya tetap wajib
    version: z.number().int().positive().optional(),
  });

export const updateQuotationStatusSchema = z.object({
  status: quotationStatusSchema,
  notes: z.string().optional(),
  actedBy: z.string().min(1, "Actor is required"),
});

// Attachment Schema
export const uploadAttachmentSchema = z.object({
  uploadedBy: z.string().min(1, "Uploader is required"),
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 10 * 1024 * 1024,
      "File size must be less than 10MB"
    )
    .refine(
      (file) =>
        [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ].includes(file.type),
      "File type not supported"
    ),
});

export const deleteAttachmentSchema = z.object({
  attachmentId: z.string().uuid("Invalid attachment ID"),
});

// Comment Schema
export const addCommentSchema = z.object({
  comment: z
    .string()
    .min(1, "Comment is required")
    .max(1000, "Comment too long"),
  commentedBy: z.string().min(1, "Commenter is required"),
});

// Filter Schema
export const quotationFilterSchema = z.object({
  status: quotationStatusSchema.optional(),
  customerId: z.string().uuid().optional(),
  search: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateUntil: z.string().datetime().optional(),
});

// Pagination Schema
export const quotationPaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z
    .enum(["quotationNumber", "createdAt", "updatedAt", "total", "status"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Search Schema
export const quotationSearchSchema = quotationFilterSchema.merge(
  quotationPaginationSchema
);

// Validation Functions
export const validateQuotationLine = (line: unknown) => {
  return quotationLineSchema.safeParse(line);
};

export const validateCreateQuotation = (data: unknown) => {
  return createQuotationSchema.safeParse(data);
};

export const validateUpdateQuotation = (data: unknown) => {
  return updateQuotationSchema.safeParse(data);
};

export const validateQuotationStatus = (data: unknown) => {
  return updateQuotationStatusSchema.safeParse(data);
};

export const validateQuotationHistoryPayload = (payload: unknown) => {
  return quotationHistoryPayloadUnionSchema.safeParse(payload);
};

// Default Values
export const defaultQuotationLine: z.infer<typeof quotationLineSchema> = {
  lineType: LineType.PRODUCT,
  productId: null,
  description: "",
  qty: 1,
  uom: "",
  unitPrice: 0,
  lineDiscountType: DiscountType.PERCENT,
  lineDiscountValue: 0,
  taxId: null,
};

export const defaultQuotationForm: z.infer<typeof createQuotationSchema> = {
  customerId: "",
  currency: "IDR",
  exchangeRate: 1.0,
  status: QuotationStatus.DRAFT,
  validFrom: null,
  validUntil: null,
  paymentTermId: null,
  discountType: DiscountType.PERCENT,
  discountValue: 0,
  taxInclusive: false,
  otherCharges: 0,
  notes: "",
  preparedBy: "",
  lines: [defaultQuotationLine],
  autoGenerateNumber: true,
};

// Export all schemas
export const quotationSchemas = {
  createQuotation: createQuotationSchema,
  updateQuotation: updateQuotationSchema,
  updateStatus: updateQuotationStatusSchema,
  uploadAttachment: uploadAttachmentSchema,
  deleteAttachment: deleteAttachmentSchema,
  addComment: addCommentSchema,
  filter: quotationFilterSchema,
  pagination: quotationPaginationSchema,
  search: quotationSearchSchema,
  line: quotationLineSchema,
  historyPayload: quotationHistoryPayloadUnionSchema,
};

export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
export type UpdateQuotationInput = z.infer<typeof updateQuotationSchema>;
export type QuotationLineInput = z.infer<typeof quotationLineSchema>;
export type QuotationFilterInput = z.infer<typeof quotationFilterSchema>;
export type QuotationPaginationInput = z.infer<
  typeof quotationPaginationSchema
>;
export type QuotationHistoryPayload = z.infer<
  typeof quotationHistoryPayloadSchema
>;
export type QuotationChangePayload = z.infer<
  typeof quotationChangePayloadSchema
>;
