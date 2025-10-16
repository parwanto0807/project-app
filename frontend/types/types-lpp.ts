import { z } from "zod";
import {
  updateDetailSchema,
  updateLppSchema,
  lppIdSchema,
  detailIdSchema,
  fotoIdSchema,
  updateStatusSchema,
  lppQuerySchema,
  uploadFotoSchema,
  createLppSchema,
  LppItemSchema,
} from "@/schemas/lpp/schemas-lpp";

export interface UploadFotoResult {
  url: string;
  id?: string;
  rincianPjId?: string;
  keterangan?: string;
  success?: boolean;
  message?: string;
}

// === Types ===
export type Detail = z.infer<typeof LppItemSchema>;
export type UpdateDetail = z.infer<typeof updateDetailSchema>;
export type UpdateLppForm = z.infer<typeof updateLppSchema>;
export type LppId = z.infer<typeof lppIdSchema>;
export type DetailId = z.infer<typeof detailIdSchema>;
export type FotoId = z.infer<typeof fotoIdSchema>;
export type UpdateStatus = z.infer<typeof updateStatusSchema>;
export type LppQueryParams = z.infer<typeof lppQuerySchema>;
export type UploadFotoForm = z.infer<typeof uploadFotoSchema>;
export type CreateLppForm = z.infer<typeof createLppSchema>;
