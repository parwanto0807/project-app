import { z } from "zod";

export const LedgerStatusSchema = z.enum(["DRAFT", "POSTED", "VOID"]);

export const LedgerLineSchema = z.object({
    id: z.string(),
    ledgerId: z.string(),
    coaId: z.string(),
    coa: z.object({
        id: z.string(),
        code: z.string(),
        name: z.string(),
        type: z.string()
    }).optional(),
    debitAmount: z.number(),
    creditAmount: z.number(),
    description: z.string().nullable().optional(),
    reference: z.string().nullable().optional(),
    lineNumber: z.number(),
    createdAt: z.string().or(z.date()),
    updatedAt: z.string().or(z.date()),
});

export const LedgerSchema = z.object({
    id: z.string(),
    ledgerNumber: z.string(),
    referenceNumber: z.string().nullable(),
    referenceType: z.string(),
    transactionDate: z.string().or(z.date()),
    postingDate: z.string().or(z.date()),
    description: z.string(),
    notes: z.string().nullable(),
    periodId: z.string(),
    status: LedgerStatusSchema,
    currency: z.string(),
    exchangeRate: z.number(),
    createdBy: z.string(),
    ledgerLines: z.array(LedgerLineSchema).optional(),
});

export type Ledger = z.infer<typeof LedgerSchema>;
export type LedgerLine = z.infer<typeof LedgerLineSchema>;

export interface LedgerResponse {
    success: boolean;
    data: Ledger[];
    pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }
}

export interface GeneralLedgerResponse {
    success: boolean;
    data: Ledger[]; // Data is now a list of transactions (Ledgers)
    pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }
}
