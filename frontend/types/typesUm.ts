import { SalesOrder } from "./salesOrder";

export type UangMukaStatus = "PENDING" | "DISBURSED" | "SETTLED" | "REJECTED";
export type MetodePembayaran = "CASH" | "BANK_TRANSFER" | "E_WALLET";

// ===================================================
// BASE ENTITY
// ===================================================
export interface UangMuka {
  id: string;
  nomor: string;
  tanggalPengajuan: Date;
  tanggalPencairan?: Date | null;
  jumlah: number;
  keterangan?: string | null;

  status: UangMukaStatus;
  buktiPencairanUrl?: string | null; // JSON string array

  metodePencairan?: MetodePembayaran;
  namaBankTujuan?: string | null;
  nomorRekeningTujuan?: string | null;
  namaEwalletTujuan?: string | null;

  purchaseRequestId?: string | null;
  karyawanId: string;
  spkId: string;

  createdAt: Date;
  updatedAt: Date;

  // Relations
  karyawan?: Karyawan;
  spk?: SPK;
  purchaseRequest?: PurchaseRequest;
  pertanggungjawaban?: Pertanggungjawaban;
}

// ===================================================
// RELATION TYPES
// ===================================================
export interface Karyawan {
  id: string;
  namaLengkap: string;
  nip?: string | null;
  department?: string | null;
  position?: string | null;
}

export interface SPK {
  id: string;
  spkNumber: string;
  salesOrder: SalesOrder;
  project?: Project;
}

export interface Project {
  id: string;
  name: string;
  client?: string | null;
}

export interface PurchaseRequest {
  id: string;
  nomorPr: string;
  keterangan?: string | null;
  status: string;
  details?: PurchaseRequestDetail[];
}

export interface PurchaseRequestDetail {
  id: string;
  catatanItem: string;
  jumlah: number;
  satuan: string;
  estimasiHargaSatuan: number;
  estimasiTotalHarga: number;
}

export interface Pertanggungjawaban {
  id: string;
  nomor: string;
  status: string;
  tanggalPengajuan?: Date | null;
  totalBiaya?: number | null;
}

// ===================================================
// INPUT TYPES
// ===================================================
export interface CreateUangMukaInput {
  tanggalPengajuan: Date;
  tanggalPencairan?: Date | null;
  jumlah: number;
  keterangan?: string;
  buktiPencairanUrl?: string;

  metodePencairan: MetodePembayaran;
  namaBankTujuan?: string;
  nomorRekeningTujuan?: string;
  namaEwalletTujuan?: string;

  purchaseRequestId?: string | null;
  karyawanId?: string | null;
  spkId?: string | null;
  status?: UangMukaStatus;
}

export interface UpdateUangMukaInput {
  tanggalPengajuan?: Date;
  tanggalPencairan?: Date | null;
  jumlah?: number;
  keterangan?: string;
  status?: UangMukaStatus;
  buktiPencairanUrl?: string[]; // JSON string array
  buktiTransaksi?: File | null;

  metodePencairan?: MetodePembayaran;
  namaBankTujuan?: string;
  nomorRekeningTujuan?: string;
  namaEwalletTujuan?: string;

  purchaseRequestId?: string | null;
  karyawanId?: string;
  spkId?: string;
}

/**
 * UPDATE STATUS — BACKEND menerima:
 * - buktiPencairanUrl (string JSON)
 * - FILES (multiple)
 * - replaceImages (opsional)
 */
export interface UpdateStatusInput {
  status: UangMukaStatus;
  tanggalPencairan?: Date | null;
  buktiPencairanUrl?: string; // JSON array string
  metodePencairan?: MetodePembayaran;
  namaBankTujuan?: string;
  nomorRekeningTujuan?: string;
  namaEwalletTujuan?: string;

  // NEW: multiple file upload
  buktiPencairan?: File | File[];

  // NEW: replace total gambar lama?
  replaceImages?: boolean;

  accountPencairanId?: string;
}

// ===================================================
// QUERY TYPES
// ===================================================
export interface UangMukaQueryInput {
  page?: number;
  limit?: number;
  search?: string;
  status?: UangMukaStatus;
  metodePencairan?: MetodePembayaran;
  karyawanId?: string;
  spkId?: string;
  startDate?: Date;
  endDate?: Date;
}

// ===================================================
// RESPONSE TYPES
// ===================================================
export interface UangMukaResponse {
  success: boolean;
  data: UangMuka;
  message?: string;
}

export interface UangMukaListResponse {
  success: boolean;
  data: UangMuka[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

// ===================================================
// FILTER TYPES
// ===================================================
export interface UangMukaFilters {
  search?: string;
  status?: UangMukaStatus;
  metodePencairan?: MetodePembayaran;
  karyawanId?: string;
  spkId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

// ===================================================
// FRONTEND FORM TYPES
// ===================================================
export interface UpdateStatusFormData {
  status: UangMukaStatus;
  tanggalPencairan?: Date | null;

  metodePencairan?: MetodePembayaran;
  namaBankTujuan?: string;
  nomorRekeningTujuan?: string;
  namaEwalletTujuan?: string;

  // NEW: multiple file upload
  buktiPencairan?: File | File[];

  // NEW
  replaceImages?: boolean;
}

export interface CreateUangMukaFormData {
  tanggalPengajuan?: Date;
  tanggalPencairan?: Date | null;
  jumlah: number;
  keterangan?: string;

  metodePencairan: MetodePembayaran;
  namaBankTujuan?: string;
  nomorRekeningTujuan?: string;
  namaEwalletTujuan?: string;

  purchaseRequestId?: string | null;
  karyawanId: string;
  spkId: string;

  // NEW
  buktiPencairan?: File[];
}

// ===================================================
// OTHER TYPES
// ===================================================
export interface UangMukaStatusOption {
  value: UangMukaStatus;
  label: string;
  color: string;
}

export interface MetodePembayaranOption {
  value: MetodePembayaran;
  label: string;
  description: string;
}

export type UangMukaWithRelations = UangMuka & {
  karyawan: Karyawan;
  spk: SPK & { project: Project };
  purchaseRequest?: PurchaseRequest;
  pertanggungjawaban?: Pertanggungjawaban;
};

export interface PaymentMethodFields {
  metodePencairan: MetodePembayaran;
  showBankFields: boolean;
  showEwalletFields: boolean;
  requiredBankFields: boolean;
  requiredEwalletFields: boolean;
}

export interface UangMukaFormValidation {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
  }[];
  paymentMethodValidation?: {
    isValid: boolean;
    missingFields: string[];
  };
}

// ===================================================
// DETAIL
// ===================================================
export interface UangMukaDetail {
  id: string;
  jumlah: number;
  metodePencairan: "CASH" | "BANK_TRANSFER" | "E_WALLET";
  keterangan?: string;
  namaBankTujuan?: string;
  nomorRekeningTujuan?: string;
  namaEwalletTujuan?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID";

  purchaseRequest?: {
    id: string;
    nomorPr: string;
    project?: { name: string };
  };

  karyawan?: { id: string; namaLengkap: string };
  spk?: { id: string; spkNumber: string };

  tanggalPengajuan: Date;
  tanggalPencairan?: Date;
  buktiPencairanUrl?: string[]; // JSON string array

  createdAt: Date;
  updatedAt: Date;
}

// ===================================================
// CAIRKAN UM
// ===================================================
export interface CairkanUangMukaData {
  id: string;
  tanggalPencairan: Date;
  buktiTransaksi: File[]; // NEW multiple
  accountPencairanId?: string;
  existingData: {
    metodePencairan: string;
    namaBankTujuan?: string;
    nomorRekeningTujuan?: string;
    namaEwalletTujuan?: string;
  };
}
