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

export type PaymentMethod = "CASH" | "TRANSFER" | "DEBIT" | "CREDIT_CARD" | "QRIS";

export interface UploadFotoResult {
  url: string;
  id?: string;
  rincianPjId?: string;
  keterangan?: string;
  success?: boolean;
  message?: string;
}

export interface ExistingPertanggungjawabanDetail {
  id?: string;
  tanggalTransaksi: string;
  keterangan: string;
  jumlah: number;
  nomorBukti: string;
  jenisPembayaran: PaymentMethod;
  productId: string;
  purchaseRequestDetailId: string;
  fotoBukti?: Array<{
    id?: string;
    url: string;
    keterangan: string;
    createdAt?: string;
  }>;
}

export interface ExistingPertanggungjawaban {
  id?: string;
  nomor?: string;
  tanggal?: string;
  totalBiaya?: number;
  sisaUangDikembalikan?: number;
  keterangan?: string;
  status?: string;
  details?: ExistingPertanggungjawabanDetail[];
}

export interface PertanggungjawabanData {
  id: string;
  nomor: string;
  tanggal: Date; // Ganti string menjadi Date
  totalBiaya: number;
  sisaUangDikembalikan: number;
  keterangan: string;
  status: string;
  details: Array<{
    id: string;
    tanggalTransaksi: Date; // Ganti string menjadi Date
    keterangan: string;
    jumlah: number;
    nomorBukti: string;
    jenisPembayaran: string;
    purchaseRequestDetailId: string;
    productId: string;
    fotoBukti: Array<{
      id: string;
      url: string;
      keterangan: string;
      createdAt: Date; // Ganti string menjadi Date
    }>;
  }>;
}

export type UploadFotoResponse = {
  success: boolean;
  url: string;
  keterangan?: string;
};

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
