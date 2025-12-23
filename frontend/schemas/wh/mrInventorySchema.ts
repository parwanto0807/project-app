import * as z from "zod";

// Schema untuk membuat MR Baru
export const createMRSchema = z.object({
    projectId: z.string().uuid("Project harus dipilih"),
    warehouseId: z.string().uuid("Gudang harus dipilih"),
    requestedById: z.string().min(1, "User pemohon wajib diisi"),
    items: z.array(z.object({
        productId: z.string().uuid(),
        prDetailId: z.string().uuid().optional(),
        qty: z.number().positive("Jumlah harus lebih dari 0"),
        unit: z.string().min(1, "Satuan wajib diisi")
    })).min(1, "Minimal harus ada 1 item")
});

// Schema untuk proses Scan QR (Sisi Petugas Gudang)
export const scanIssueSchema = z.object({
    qrToken: z.string().min(5, "Token tidak valid"),
    issuedById: z.string().uuid("ID Petugas tidak valid")
});

export type CreateMRInput = z.infer<typeof createMRSchema>;
export type ScanIssueInput = z.infer<typeof scanIssueSchema>;