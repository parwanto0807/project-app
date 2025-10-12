export interface PurchaseRequestDetail {
  id?: string;
  productId: string;
  projectBudgetId?: string;
  jumlah: number;
  satuan: string;
  estimasiHargaSatuan: number;
  estimasiTotalHarga: number;
  catatanItem?: string;
}

export interface PurchaseRequest {
  id: string;
  nomorPr: string; // Ganti prNumber menjadi nomorPr
  projectId: string;
  spkId: string; // Tambahkan spkId
  spkIds: string;
  karyawanId: string; // Tambahkan karyawanId (requestedBy)
  tanggalPr: Date; // Ganti requestedDate menjadi tanggalPr
  keterangan?: string; // Ganti description/remarks menjadi keterangan
  status:
    | "DRAFT"
    | "REVISION_NEEDED"
    | "SUBMITTED"
    | "APPROVED"
    | "REJECTED"
    | "COMPLETED"; // Sesuaikan dengan enum di Prisma

  // Relasi (optional untuk response)
  project?: {
    id: string;
    name: string;
  };
  spk?: {
    id: string;
    spkNumber: string;
  };
  karyawan?: {
    id: string;
    namaLengkap: string;
  };
  details: PurchaseRequestDetail[];
  createdAt: Date;
  updatedAt: Date;
}

// Untuk backward compatibility, bisa buat alias
export type PurchaseRequestItem = PurchaseRequestDetail;

export interface CreatePurchaseRequestData {
  projectId: string;
  spkId: string;
  karyawanId: string; // Wajib sesuai model
  tanggalPr: Date;
  keterangan?: string;
  details: Omit<PurchaseRequestDetail, "id" | "estimasiTotalHarga">[]; // Ganti items menjadi details
}

export interface UpdatePurchaseRequestData {
  tanggalPr?: Date;
  keterangan?: string;
  details?: Omit<PurchaseRequestDetail, "id" | "estimasiTotalHarga">[]; // Ganti items menjadi details
}

export interface UpdatePurchaseRequestStatusData {
  status: PurchaseRequest["status"];
  reviewedBy?: string;
  approvedBy?: string;
  remarks?: string;
}

export interface PurchaseRequestFilters {
  projectId?: string;
  status?: PurchaseRequest["status"];
  dateFrom?: Date;
  dateTo?: Date;
  karyawanId?: string; // Ganti requestedBy menjadi karyawanId
  spkId?: string; // Tambahkan filter spkId
  // Tambahkan properti untuk pagination dan search
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PurchaseRequestResponse {
  success: boolean;
  data: PurchaseRequest | PurchaseRequest[];
  message?: string;
  pagination?: PaginationInfo;
}

export interface PurchaseRequestError {
  success: false;
  error: string;
  details?: unknown;
}

// Tambahkan interface untuk relasi jika diperlukan
export interface PurchaseRequestWithRelations extends PurchaseRequest {
  project: {
    id: string;
    name: string;
  };
  spk: {
    id: string;
    spkNumber: string;
    salesOrder: {
      soNumber: string;
      customer: {
        name: string;
      };
    };
  };
  karyawan: {
    id: string;
    namaLengkap: string;
    jabatan?: string;
  };
  details: (PurchaseRequestDetail & {
    product: {
      id: string;
      name: string;
      description?: string;
    };
    projectBudget: {
      id: string;
      namaBudget: string;
    };
  })[];
}
