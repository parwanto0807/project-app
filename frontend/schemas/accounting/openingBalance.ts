import * as z from "zod";

export const OpeningBalanceDetailSchema = z.object({
    accountId: z.string().min(1, "Account is required"),
    debit: z.number().min(0),
    credit: z.number().min(0),
}).refine(data => data.debit > 0 || data.credit > 0, {
    message: "Either Debit or Credit must be greater than 0",
    path: ["debit"],
});

export const OpeningBalanceSchema = z.object({
    asOfDate: z.string().min(1, "Date is required"),
    description: z.string().min(3, "Description must be at least 3 characters"),
    details: z.array(OpeningBalanceDetailSchema).min(1, "At least one account detail is required"),
}).refine(data => {
    const totalDebit = data.details.reduce((acc, curr) => acc + curr.debit, 0);
    const totalCredit = data.details.reduce((acc, curr) => acc + curr.credit, 0);
    // Use a small epsilon for float comparison if needed, but for IDR usually exact or 0.01
    return Math.abs(totalDebit - totalCredit) < 0.01;
}, {
    message: "Total Debit and Credit must be balanced",
    path: ["details"],
});

export type OpeningBalanceFormValues = z.infer<typeof OpeningBalanceSchema>;
