// schemas/stockOpnameSchema.ts
import * as z from 'zod';
import { OpnameType, OpnameStatus } from '@/types/soType';

// Schema untuk input item stock opname (saat create/update)
export const stockOpnameItemInputSchema = z.object({
    productId: z.string().uuid('Produk harus dipilih'),
    stokFisik: z.coerce.number({
        required_error: 'Stok fisik harus diisi',
        invalid_type_error: 'Stok fisik harus berupa angka'
    }).min(0, 'Stok fisik tidak boleh negatif'),
    hargaSatuan: z.coerce.number().min(0, 'Harga satuan tidak boleh negatif'),
    stokSistem: z.coerce.number(),
    catatanItem: z.string().max(200, 'Catatan maksimal 200 karakter').optional().nullable(),
});

// Schema untuk item yang sudah ada di database
export const stockOpnameItemSchema = stockOpnameItemInputSchema.extend({
    id: z.string().uuid(),
    stockOpnameId: z.string().uuid(),
    stokSistem: z.number().min(0, 'Stok sistem tidak boleh negatif'),
    selisih: z.number(),
    hargaSatuan: z.number().min(0, 'Harga satuan tidak boleh negatif'),
    totalNilai: z.number().min(0, 'Total nilai tidak boleh negatif'),
    product: z.object({
        id: z.string(),
        kode: z.string(),
        nama: z.string(),
        satuan: z.string().optional(),
    }).optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

// Schema untuk form create stock opname (DRAFT)
export const createStockOpnameSchema = z.object({
    tanggalOpname: z.string().refine((val) => {
        const date = new Date(val);
        return !isNaN(date.getTime());
    }, {
        message: 'Format tanggal tidak valid'
    }),
    type: z.nativeEnum(OpnameType, {
        errorMap: () => ({ message: 'Tipe opname tidak valid' }),
    }),
    warehouseId: z.string().uuid('Gudang harus dipilih'),
    keterangan: z.string().max(500, 'Keterangan maksimal 500 karakter').optional().nullable(),
    items: z.array(stockOpnameItemInputSchema).min(1, 'Minimal harus ada satu item'),
});

// Schema untuk form update stock opname (hanya DRAFT yang bisa diupdate)
export const updateStockOpnameSchema = z.object({
    tanggalOpname: z.string().refine((val) => {
        const date = new Date(val);
        return !isNaN(date.getTime());
    }, {
        message: 'Format tanggal tidak valid'
    }).optional(),
    warehouseId: z.string().uuid('Gudang harus dipilih').optional(),
    keterangan: z.string().max(500, 'Keterangan maksimal 500 karakter').optional().nullable(),
    items: z.array(
        stockOpnameItemInputSchema.extend({
            id: z.string().uuid().optional(), // Untuk update item yang sudah ada
        })
    ).min(1, 'Minimal harus ada satu item').optional(),
});

// Schema untuk response/detail stock opname
export const stockOpnameSchema = z.object({
    id: z.string().uuid(),
    nomorOpname: z.string().min(3, 'Nomor Opname minimal 3 karakter'),
    tanggalOpname: z.string(),
    type: z.nativeEnum(OpnameType),
    status: z.nativeEnum(OpnameStatus),
    petugasId: z.string().uuid(),
    warehouseId: z.string().uuid(),
    keterangan: z.string().nullable(),
    items: z.array(stockOpnameItemSchema),
    petugas: z.object({
        id: z.string(),
        nama: z.string(),
        email: z.string().email().optional(),
    }).optional(),
    warehouse: z.object({
        id: z.string(),
        kode: z.string(),
        nama: z.string(),
    }).optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

// Schema untuk filter/search
export const stockOpnameFilterSchema = z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(10),
    search: z.string().optional(),
    status: z.nativeEnum(OpnameStatus).optional(),
    warehouseId: z.string().uuid().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    type: z.nativeEnum(OpnameType).optional(),
});

// Schema untuk action adjust/cancel
export const stockOpnameActionSchema = z.object({
    id: z.string().uuid(),
    reason: z.string().max(200, 'Alasan maksimal 200 karakter').optional(),
});

// Schema untuk adjust action dengan validasi tambahan
export const adjustStockOpnameSchema = z.object({
    confirmed: z.boolean().refine(val => val === true, {
        message: 'Anda harus mengonfirmasi adjustment'
    }),
    reason: z.string().max(200, 'Alasan maksimal 200 karakter').optional(),
});

// Schema untuk list response
export const stockOpnameListResponseSchema = z.object({
    data: z.array(stockOpnameSchema),
    pagination: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
});

// Schema untuk summary
export const stockOpnameSummarySchema = z.object({
    totalOpname: z.number(),
    totalItems: z.number(),
    totalNilai: z.number(),
    byStatus: z.record(z.nativeEnum(OpnameStatus), z.number()),
    byType: z.record(z.nativeEnum(OpnameType), z.number()),
});

// Infer types untuk digunakan di React Hook Form
export type StockOpnameItemInput = z.infer<typeof stockOpnameItemInputSchema>;
export type StockOpnameItem = z.infer<typeof stockOpnameItemSchema>;
export type CreateStockOpnameInput = z.infer<typeof createStockOpnameSchema>;
export type UpdateStockOpnameInput = z.infer<typeof updateStockOpnameSchema>;
export type StockOpname = z.infer<typeof stockOpnameSchema>;
export type StockOpnameFilterInput = z.infer<typeof stockOpnameFilterSchema>;
export type StockOpnameActionInput = z.infer<typeof stockOpnameActionSchema>;
export type AdjustStockOpnameInput = z.infer<typeof adjustStockOpnameSchema>;
export type StockOpnameListResponse = z.infer<typeof stockOpnameListResponseSchema>;
export type StockOpnameSummary = z.infer<typeof stockOpnameSummarySchema>;

// Utility function untuk calculate fields
export function calculateStockOpnameItem(
    stokSistem: number,
    stokFisik: number,
    hargaSatuan: number
): { selisih: number; totalNilai: number } {
    const selisih = stokFisik - stokSistem;
    const totalNilai = Math.abs(selisih) * hargaSatuan;

    return { selisih, totalNilai };
}

// Validation function untuk check jika stock opname bisa di-adjust
export function validateForAdjustment(
    status: OpnameStatus,
    items: StockOpnameItem[]
): { isValid: boolean; message?: string } {
    if (status !== OpnameStatus.DRAFT) {
        return {
            isValid: false,
            message: 'Hanya stock opname dengan status DRAFT yang bisa di-adjust'
        };
    }

    if (items.length === 0) {
        return {
            isValid: false,
            message: 'Stock opname harus memiliki minimal satu item'
        };
    }

    return { isValid: true };
}