import * as z from "zod";

export const StaffRefundSchema = z.object({
    karyawanId: z.string().min(1, "Karyawan wajib dipilih"),
    category: z.string().min(1, "Kategori wajib dipilih"),
    amount: z.coerce.number().min(1, "Jumlah minimal Rp 1"),
    coaId: z.string().min(1, "Akun Kas/Bank wajib dipilih"),
    tanggal: z.string().min(1, "Tanggal wajib diisi"),
    keterangan: z.string().optional(),
    refId: z.string().optional(),
});

export type StaffRefundFormValues = z.infer<typeof StaffRefundSchema>;
