import { z } from "zod";

/**
 * CREATE
 * Semua field wajib kecuali yang memang optional
 */
export const CreateWarehouseSchema = z.object({
  code: z.string().min(1, "Kode gudang wajib diisi").max(50),
  name: z.string().min(1, "Nama gudang wajib diisi").max(100),
  address: z.string().optional(),
  isMain: z.boolean().default(false),
  isActive: z.boolean().default(true),
  isWip: z.boolean().default(false),
  inventoryAccountId: z.string().optional().nullable(),
});

export type CreateWarehouseInput = z.infer<typeof CreateWarehouseSchema>;

/**
 * UPDATE
 * Partial → hanya field yang diubah yang dikirim
 */
export const UpdateWarehouseSchema = CreateWarehouseSchema.partial();

export type UpdateWarehouseInput = z.infer<typeof UpdateWarehouseSchema>;
