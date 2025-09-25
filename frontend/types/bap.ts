import { z } from "zod";
import {
  BAPSchema,
  BAPCreateSchema,
  BAPUpdateSchema,
  BAPPhotoSchema,
  BAPStatusEnum,
} from "@/schemas/bap";

// Enum type
export type BAPStatus = z.infer<typeof BAPStatusEnum>;

// Photo type
export type BAPPhoto = z.infer<typeof BAPPhotoSchema>;

// BAP type penuh (hasil fetch dari backend)
export type BAP = z.infer<typeof BAPSchema>;

// Untuk create
export type BAPCreateInput = z.infer<typeof BAPCreateSchema>;

// Untuk update
export type BAPUpdateInput = z.infer<typeof BAPUpdateSchema>;
