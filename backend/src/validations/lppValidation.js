import { z } from 'zod';

// Helper untuk validasi UUID
const uuidSchema = z.string().uuid('ID harus berupa UUID yang valid');

// Helper untuk validasi decimal/number
const decimalSchema = z.number()
  .positive('Nilai harus positif')
  .refine(val => {
    const decimalPart = val.toString().split('.')[1];
    return !decimalPart || decimalPart.length <= 2;
  }, 'Maksimal 2 digit desimal');

const nonNegativeDecimalSchema = z.number()
  .min(0, 'Nilai tidak boleh negatif')
  .refine(val => {
    const decimalPart = val.toString().split('.')[1];
    return !decimalPart || decimalPart.length <= 2;
  }, 'Maksimal 2 digit desimal');

// Schema untuk detail rincian
const detailSchema = z.object({
  tanggalTransaksi: z.coerce.date({
    required_error: 'Tanggal transaksi harus diisi',
    invalid_type_error: 'Format tanggal tidak valid'
  }),
  keterangan: z.string()
    .min(1, 'Keterangan harus diisi')
    .max(255, 'Keterangan maksimal 255 karakter'),
  jumlah: decimalSchema,
  nomorBukti: z.string()
    .max(100, 'Nomor bukti maksimal 100 karakter')
    .optional()
    .or(z.literal('')),
  jenisPembayaran: z.enum(['CASH', 'TRANSFER', 'DEBIT', 'CREDIT_CARD', 'QRIS'], {
    required_error: 'Jenis pembayaran harus diisi',
    invalid_type_error: 'Jenis pembayaran tidak valid'
  }),
  productId: uuidSchema,
  purchaseRequestDetailId: uuidSchema.optional().or(z.literal(''))
});

// Schema untuk update detail (semua field optional)
const updateDetailSchema = z.object({
  tanggalTransaksi: z.coerce.date()
    .optional()
    .refine(val => !val || val <= new Date(), {
      message: 'Tanggal transaksi tidak boleh melebihi tanggal sekarang'
    }),
  keterangan: z.string()
    .max(255, 'Keterangan maksimal 255 karakter')
    .optional(),
  jumlah: decimalSchema.optional(),
  nomorBukti: z.string()
    .max(100, 'Nomor bukti maksimal 100 karakter')
    .optional()
    .or(z.literal('')),
  jenisPembayaran: z.enum(['CASH', 'TRANSFER', 'DEBIT', 'CREDIT_CARD', 'QRIS'])
    .optional(),
  productId: uuidSchema.optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'Minimal satu field harus diisi untuk update'
});

// Validasi untuk membuat LPP
export const createLppValidation = z.object({
  uangMukaId: uuidSchema,
  totalBiaya: decimalSchema,
  sisaUangDikembalikan: nonNegativeDecimalSchema,
  keterangan: z.string()
    .max(500, 'Keterangan maksimal 500 karakter')
    .optional()
    .or(z.literal('')),
  details: z.array(detailSchema)
    .min(1, 'Minimal harus ada satu detail rincian')
});

// Validasi untuk update LPP
export const updateLppValidation = z.object({
  totalBiaya: decimalSchema.optional(),
  sisaUangDikembalikan: nonNegativeDecimalSchema.optional(),
  keterangan: z.string()
    .max(500, 'Keterangan maksimal 500 karakter')
    .optional()
    .or(z.literal('')),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'REVISION'])
    .optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'Minimal satu field harus diisi untuk update'
});

// Validasi untuk menambah detail
export const addDetailValidation = detailSchema;

// Validasi untuk update detail
export const updateDetailValidation = updateDetailSchema;

// Validasi ID LPP
export const lppIdValidation = z.object({
  id: uuidSchema
});

// Validasi ID detail
export const detailIdValidation = z.object({
  id: uuidSchema,
  detailId: uuidSchema
});

// Validasi ID foto bukti
export const fotoIdValidation = z.object({
  fotoId: uuidSchema
});

// Validasi untuk update status LPP
export const updateStatusValidation = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'REVISION'], {
    required_error: 'Status harus diisi',
    invalid_type_error: 'Status tidak valid'
  }),
  catatan: z.string()
    .max(500, 'Catatan maksimal 500 karakter')
    .optional()
    .or(z.literal(''))
});

// Validasi query parameters untuk get all LPP
export const lppQueryValidation = z.object({
  page: z.coerce.number()
    .int('Page harus bilangan bulat')
    .positive('Page harus positif')
    .default(1),
  limit: z.coerce.number()
    .int('Limit harus bilangan bulat')
    .positive('Limit harus positif')
    .max(100, 'Maksimal 100 data per page')
    .default(10),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'REVISION']).optional(),
  search: z.string().max(100, 'Pencarian maksimal 100 karakter').optional()
});

// Validasi untuk upload foto bukti
export const uploadFotoValidation = z.object({
  keterangan: z.string()
    .max(255, 'Keterangan maksimal 255 karakter')
    .optional()
    .or(z.literal(''))
});

// Export individual schemas untuk digunakan di tempat lain jika needed
export {
  uuidSchema,
  decimalSchema,
  nonNegativeDecimalSchema,
  detailSchema
};