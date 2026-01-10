// frontend/lib/action/master/bank/schema.ts
import { z } from "zod";

// Zod schema for creating a bank account
export const bankAccountCreateSchema = z.object({
  bankName: z.string().min(1, "Bank name is required"),
  accountNumber: z
    .string()
    .min(5, "Account number must be at least 5 characters"),
  accountHolder: z.string().min(1, "Account holder is required"),
  branch: z.string().optional(),
  isActive: z.boolean(),
  accountCOAId: z.string().optional(),
});

// Zod schema for updating a bank account
export const bankAccountUpdateSchema = bankAccountCreateSchema.partial();

// Infer types
export type BankAccountCreateSchema = z.infer<typeof bankAccountCreateSchema>;
export type BankAccountUpdateSchema = z.infer<typeof bankAccountUpdateSchema>;

// Response type from backend
export type BankAccount = {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch?: string | null;
  isActive: boolean;
  accountCOAId?: string | null;
  accountCOA?: {
    id: string;
    code: string;
    name: string;
  } | null;
  currentBalance: number;
  createdAt: string;
  updatedAt: string;
};
