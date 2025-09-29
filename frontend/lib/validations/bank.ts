// frontend/lib/action/master/bank/validasi.ts
import { z } from "zod";
import {
  bankAccountCreateSchema,
  bankAccountUpdateSchema,
} from "@/schemas/bank/index";

// Validasi form create
export const createBankValidation = bankAccountCreateSchema;

// Validasi form update
export const updateBankValidation = bankAccountUpdateSchema;

// Types
export type CreateBankFormValues = z.infer<typeof createBankValidation>;
export type UpdateBankFormValues = z.infer<typeof updateBankValidation>;
