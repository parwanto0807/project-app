
import { z } from "zod";

export const CreatePeriodSchema = z.object({
    periodCode: z.string().min(1, "Code is required"),
    periodName: z.string().min(1, "Name is required"),
    startDate: z.date({ required_error: "Start Date is required" }),
    endDate: z.date({ required_error: "End Date is required" }),
}).refine((data) => data.endDate >= data.startDate, {
    message: "End Date must be after Start Date",
    path: ["endDate"],
});

export type CreatePeriodFormValues = z.infer<typeof CreatePeriodSchema>;

export const UpdatePeriodSchema = z.object({
    periodName: z.string().optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
});

export type UpdatePeriodFormValues = z.infer<typeof UpdatePeriodSchema>;

export interface AccountingPeriod {
    id: string;
    periodCode: string;
    periodName: string;
    startDate: string;
    endDate: string;
    fiscalYear: number;
    quarter: number;
    isClosed: boolean;
    closedAt?: string;
    closedBy?: string;
    reopenAt?: string;
    reopenBy?: string;
    reopenReason?: string;
    createdAt: string;
    updatedAt: string;
}
