import { Product } from "./quotation";

export type SourceProductType =
  | "PEMBELIAN_BARANG"
  | "PENGAMBILAN_STOK"
  | "OPERATIONAL"
  | "JASA_PEMBELIAN"
  | "JASA_INTERNAL";

export type PRStatus =
  | "DRAFT"
  | "REVISION_NEEDED"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED";

export interface PurchaseRequestDetail {
  id?: string;
  productId: string;
  projectBudgetId?: string;
  product?: Product;
  jumlah: number;
  satuan: string;
  estimasiHargaSatuan: number;
  estimasiTotalHarga: number;
  catatanItem?: string;
  sourceProduct?: SourceProductType | null;
}

export interface PurchaseRequest {
  id: string;
  nomorPr: string;
  projectId: string | null;
  spkId: string | null; // ✅ Ubah dari string ke string | null
  spkIds?: string; // ✅ Tambahkan ? karena ini optional (tidak ada di model)
  karyawanId: string;
  tanggalPr: Date;
  keterangan?: string;
  status: PRStatus;

  // Relasi opsional
  project?: {
    id: string;
    name: string;
  };
  spk?: {
    id: string;
    spkNumber: string;
    salesOrder?: {
      soNumber: string;
      customer?: {
        name: string;
      };
    };
  } | null; // ✅ Tambahkan | null karena bisa null
  karyawan?: {
    id: string;
    namaLengkap: string;
  };

  details: PurchaseRequestDetail[];

  // Relasi uang muka (opsional)
  uangMuka?: {
    id: string;
    nomor: string;
    tanggalPengajuan: Date;
    tanggalPencairan: Date;
    jumlah: number;
    keterangan?: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "DISBURSED" | "COMPLETED";
    buktiPencairanUrl?: string;
    metodePencairan: "CASH" | "TRANSFER" | "DEBIT" | "CREDIT_CARD" | "QRIS";
    namaBankTujuan?: string;
    nomorRekeningTujuan?: string;
    namaEwalletTujuan?: string;
    purchaseRequestId: string;
    karyawanId: string;
    spkId: string; // ❗ Perlu cek apakah ini juga optional?
    createdAt: Date;
    updatedAt: Date;
    pertanggungjawaban?: Pertanggungjawaban[];
  }[];

  // Relasi Purchase Orders (opsional, hanya jika includeExistingPOs=true)
  purchaseOrders?: {
    id: string;
    poNumber: string;
    status: string;
    totalAmount: number;
    supplier?: {
      id: string;
      name: string;
    };
  }[];

  createdAt: Date;
  updatedAt: Date;
}

export interface Pertanggungjawaban {
  id: string;
  nomor: string;
  tanggal: Date;
  totalBiaya: number;
  sisaUangDikembalikan: number;
  keterangan?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SETTLED";
  uangMukaId: string;
  details: RincianPertanggungjawaban[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RincianPertanggungjawaban {
  id: string;
  pertanggungjawabanId: string;
  tanggalTransaksi: Date;
  keterangan: string;
  jumlah: number;
  nomorBukti?: string;
  jenisPembayaran: "CASH" | "TRANSFER" | "DEBIT" | "CREDIT_CARD" | "QRIS";
  product?: {
    id: string;
    name: string;
    code: string;
  };
  fotoBukti: FotoBuktiPertanggungjawaban[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FotoBuktiPertanggungjawaban {
  id: string;
  rincianPjId: string;
  url: string;
  keterangan?: string;
  createdAt: Date;
}

export type PurchaseRequestItem = PurchaseRequestDetail;

export interface CreatePurchaseRequestData {
  projectId?: string | null;
  spkId?: string | null; // ✅ Ubah menjadi optional
  karyawanId: string;
  tanggalPr?: Date; // ✅ Tambahkan ? karena biasanya auto-generated
  keterangan?: string;
  details: Omit<PurchaseRequestDetail, "id" | "estimasiTotalHarga">[];
}

export interface UpdatePurchaseRequestData {
  spkId?: string | null; // ✅ Tambahkan field ini
  tanggalPr?: Date;
  keterangan?: string;
  details?: Omit<PurchaseRequestDetail, "id" | "estimasiTotalHarga">[];
}

export interface UpdatePurchaseRequestStatusData {
  status: PRStatus;
  reviewedBy?: string;
  approvedBy?: string;
  remarks?: string;
  warehouseAllocations?: Record<string, any[]>;
}

export interface PurchaseRequestFilters {
  projectId?: string | "null";
  status?: PRStatus;
  dateFrom?: Date;
  dateTo?: Date;
  karyawanId?: string;
  spkId?: string | "null"; // ✅ Ubah untuk support filter "null"
  page?: number;
  limit?: number;
  totalCount?: number;
  totalPages?: number;
  search?: string;
  includeWithoutSPK?: boolean; // ✅ Tambahkan filter khusus
}

export interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export interface PurchaseRequestResponse {
  success: boolean;
  data: PurchaseRequest | PurchaseRequest[];
  message?: string;
  pagination?: PaginationInfo;
  warning?: string; // ✅ Tambahkan untuk warning
}

export interface PurchaseRequestError {
  success: false;
  error: string;
  details?: unknown;
}

// ============== Relasi Lengkap ==============

export interface PurchaseRequestWithRelations extends PurchaseRequest {
  project?: {
    id: string;
    name: string;
  };
  spk?: {
    id: string;
    spkNumber: string;
    salesOrder?: {
      soNumber: string;
      customer?: {
        name: string;
      };
    };
  } | null; // ✅ Tambahkan | null
  karyawan?: {
    id: string;
    namaLengkap: string;
    jabatan?: string;
  };
  details: (PurchaseRequestDetail & {
    product?: {
      id: string;
      name: string;
      description?: string;
    };
    projectBudget?: {
      id: string;
      namaBudget: string;
    };
  })[];
  uangMuka?: UangMukaWithRelations[];
}

export interface UangMuka {
  id: string;
  nomor: string;
  tanggalPengajuan: Date;
  tanggalPencairan: Date;
  jumlah: number;
  keterangan?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "DISBURSED" | "COMPLETED";
  buktiPencairanUrl?: string;
  metodePencairan: "CASH" | "TRANSFER" | "DEBIT" | "CREDIT_CARD" | "QRIS";
  namaBankTujuan?: string;
  nomorRekeningTujuan?: string;
  namaEwalletTujuan?: string;
  purchaseRequestId: string;
  karyawanId: string;
  spkId: string; // ❗ Perlu cek: apakah ini juga optional?
  createdAt: Date;
  updatedAt: Date;
}

export interface UangMukaWithRelations extends UangMuka {
  pertanggungjawaban?: PertanggungjawabanWithDetails[];
}

export interface PertanggungjawabanWithDetails extends Pertanggungjawaban {
  details: RincianPertanggungjawaban[];
}

// ============== TYPES BARU ==============

// ✅ Type untuk PR tanpa SPK
export interface PurchaseRequestWithoutSPK extends Omit<PurchaseRequest, 'spkId' | 'spk'> {
  spkId: null;
  spk: null;
}

// ✅ Type guard untuk cek apakah PR punya SPK
export function hasSPK(pr: PurchaseRequest): pr is PurchaseRequest & { spkId: string; spk: NonNullable<PurchaseRequest['spk']> } {
  return pr.spkId !== null && pr.spk !== null;
}

// ✅ Type guard untuk PR tanpa SPK
export function isWithoutSPK(pr: PurchaseRequest): pr is PurchaseRequestWithoutSPK {
  return pr.spkId === null;
}

// ✅ Type untuk validasi business rules
export interface PurchaseRequestValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

// ✅ Type untuk response create/update
export interface PurchaseRequestOperationResult {
  success: boolean;
  data: PurchaseRequestWithRelations;
  message: string;
  warning?: string;
  requiresSpecialApproval?: boolean;
}

// ✅ Enum untuk approval level jika tanpa SPK
export enum ApprovalLevel {
  NORMAL = 'NORMAL',
  MANAGER = 'MANAGER',
  DIRECTOR = 'DIRECTOR',
  FINANCE = 'FINANCE'
}

// ✅ Type untuk menentukan approval level berdasarkan kondisi
export interface ApprovalRequirements {
  level: ApprovalLevel;
  reason: string;
  thresholds?: {
    maxAmount: number;
    requiresManager: boolean;
    requiresDirector: boolean;
    requiresFinance: boolean;
  }[];
}

// ✅ Helper type untuk form input
export interface PurchaseRequestFormData {
  projectId?: string | null;
  spkId?: string | null;
  karyawanId: string;
  keterangan?: string;
  details: Array<{
    productId: string;
    projectBudgetId?: string;
    jumlah: number | string;
    satuan: string;
    estimasiHargaSatuan: number | string;
    catatanItem?: string;
    sourceProduct?: SourceProductType | null;
  }>;
}

// ✅ Type untuk summary report
export interface PurchaseRequestSummary {
  totalPR: number;
  totalWithSPK: number;
  totalWithoutSPK: number;
  totalAmount: number;
  totalAmountWithSPK: number;
  totalAmountWithoutSPK: number;
  byStatus: Record<PRStatus, number>;
  byMonth: Array<{
    month: string;
    withSPK: number;
    withoutSPK: number;
    totalAmount: number;
  }>;
}