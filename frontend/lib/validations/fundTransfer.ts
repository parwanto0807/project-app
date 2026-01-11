import { z } from "zod";

export const fundTransferSchema = z.object({
    transferDate: z.date({
        required_error: "Tanggal transfer wajib diisi",
    }),
    amount: z.coerce.number().min(0.01, "Jumlah transfer minimal 0.01"),
    feeAmount: z.coerce.number().min(0, "Biaya admin tidak boleh negatif"),
    fromAccountId: z.string().min(1, "Rekening asal wajib dipilih"),
    toAccountId: z.string().min(1, "Rekening tujuan wajib dipilih"),
    feeAccountId: z.string().optional(),
    referenceNo: z.string().optional(),
    notes: z.string().optional(),
}).refine((data) => data.fromAccountId !== data.toAccountId, {
    message: "Rekening asal dan tujuan tidak boleh sama",
    path: ["toAccountId"],
});

export type FundTransferFormValues = z.infer<typeof fundTransferSchema>;
