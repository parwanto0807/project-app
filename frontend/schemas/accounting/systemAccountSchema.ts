import * as z from "zod";

export const SystemAccountSchema = z.object({
    key: z.string().min(1, "Key is required"),
    description: z.string().optional(),
    coaId: z.string().min(1, "Account (COA) is required"),
});

export type SystemAccountValues = z.infer<typeof SystemAccountSchema>;
