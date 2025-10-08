import { z } from "zod";

export const costTypeSchema = z.enum(["MATERIAL", "LABOR", "OTHER"]);

// schema/rab/index.ts
export const categoryRabSchema = z.enum([
  "PRELIMINARY",
  "SITEPREP",
  "STRUCTURE",
  "ARCHITECTURE",
  "MEP",
  "FINISHING",
  "LANDSCAPE",
  "EQUIPMENT",
  "OVERHEAD",
  "OTHER",
]);

export const rabDetailSchema = z.object({
  productId: z.string().uuid().optional().nullable(),
  description: z.string().min(1, "Deskripsi harus diisi"),
  categoryRab: categoryRabSchema.default("STRUCTURE"),
  qty: z.number().min(0.01, "Quantity harus lebih dari 0"),
  unit: z.string().min(1, "Satuan harus diisi"),
  price: z.number().min(0, "Harga tidak boleh negatif"),
  costType: costTypeSchema.default("MATERIAL"),
  notes: z.string().optional().nullable(),
});

export const rabCreateSchema = z.object({
  projectId: z.string().uuid("Project harus dipilih"),
  name: z.string().min(1, "Nama RAB harus diisi"),
  description: z.string().optional().nullable(),
  rabDetails: z
    .array(rabDetailSchema)
    .min(1, "Minimal 1 item harus ditambahkan"),
});

export const rabUpdateSchema = rabCreateSchema.partial().extend({
  id: z.string().uuid(),
});

export const rabStatusSchema = z.object({
  status: z.enum(["DRAFT", "APPROVED", "REJECTED"]),
});

export type RabCreateFormData = z.infer<typeof rabCreateSchema>;
export type RabUpdateFormData = z.infer<typeof rabUpdateSchema>;
export type RabDetailFormData = z.infer<typeof rabDetailSchema>;
export type RabStatusFormData = z.infer<typeof rabStatusSchema>;
