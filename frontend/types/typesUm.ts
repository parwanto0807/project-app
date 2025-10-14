import { SalesOrder } from "./salesOrder";

export type UangMukaStatus = "PENDING" | "DISBURSED" | "SETTLED" | "REJECTED";
export type MetodePembayaran = "CASH" | "BANK_TRANSFER" | "E_WALLET";

// Base types
export interface UangMuka {
  id: string;
  nomor: string;
  tanggalPengajuan: Date;
  tanggalPencairan?: Date | null;
  jumlah: number;
  keterangan?: string | null;
  status: UangMukaStatus;
  buktiPencairanUrl?: string | null;

  // FIELD BARU: Metode pembayaran
  metodePencairan?: MetodePembayaran;
  namaBankTujuan?: string | null;
  nomorRekeningTujuan?: string | null;
  namaEwalletTujuan?: string | null;

  purchaseRequestId?: string | null;
  karyawanId: string;
  spkId: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations (optional, tergantung include query)
  karyawan?: Karyawan;
  spk?: SPK;
  purchaseRequest?: PurchaseRequest;
  pertanggungjawaban?: Pertanggungjawaban;
}

// Relation types (sesuaikan dengan model Anda)
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
  project?: Project; // Ditambahkan untuk kemudahan akses
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

// Input types untuk forms
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
  karyawanId?: string | null; // Ubah jadi optional/nullable
  spkId?: string | null; // Ubah jadi optional/nullable
  status?: UangMukaStatus;
}

export interface UpdateUangMukaInput {
  tanggalPengajuan?: Date;
  tanggalPencairan?: Date | null; // Ditambahkan
  jumlah?: number;
  keterangan?: string;
  status?: UangMukaStatus;
  buktiPencairanUrl?: string;

  // FIELD BARU: Metode pembayaran
  metodePencairan?: MetodePembayaran;
  namaBankTujuan?: string;
  nomorRekeningTujuan?: string;
  namaEwalletTujuan?: string;

  purchaseRequestId?: string | null;
  karyawanId?: string;
  spkId?: string;
}

export interface UpdateStatusInput {
  status: UangMukaStatus;
  tanggalPencairan?: Date | null;
  buktiPencairanUrl?: string; // Untuk URL yang sudah diupload

  // FIELD BARU: Wajib jika status DISBURSED
  metodePencairan?: MetodePembayaran;
  namaBankTujuan?: string;
  nomorRekeningTujuan?: string;
  namaEwalletTujuan?: string;

  buktiPencairan?: File; // Untuk file upload (frontend only)
}

export interface UangMukaQueryInput {
  page?: number;
  limit?: number;
  search?: string;
  status?: UangMukaStatus;
  metodePencairan?: MetodePembayaran; // FIELD BARU: Filter metode pencairan
  karyawanId?: string;
  spkId?: string;
  startDate?: Date;
  endDate?: Date;
}

// Response types
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

// Filter types
export interface UangMukaFilters {
  search?: string;
  status?: UangMukaStatus;
  metodePencairan?: MetodePembayaran; // FIELD BARU
  karyawanId?: string;
  spkId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

// Form data untuk file upload
export interface UpdateStatusFormData {
  status: UangMukaStatus;
  tanggalPencairan?: Date | null;

  // FIELD BARU
  metodePencairan?: MetodePembayaran;
  namaBankTujuan?: string;
  nomorRekeningTujuan?: string;
  namaEwalletTujuan?: string;

  buktiPencairan?: File;
}

// Form data untuk create uang muka
export interface CreateUangMukaFormData {
  tanggalPengajuan?: Date;
  tanggalPencairan?: Date | null;
  jumlah: number;
  keterangan?: string;

  // FIELD BARU (WAJIB)
  metodePencairan: MetodePembayaran;
  namaBankTujuan?: string;
  nomorRekeningTujuan?: string;
  namaEwalletTujuan?: string;

  purchaseRequestId?: string | null;
  karyawanId: string;
  spkId: string;
  buktiPencairan?: File; // Untuk upload file saat create
}

// Select options
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

// Utility types
export type UangMukaWithRelations = UangMuka & {
  karyawan: Karyawan;
  spk: SPK & {
    project: Project;
  };
  purchaseRequest?: PurchaseRequest;
  pertanggungjawaban?: Pertanggungjawaban;
};

// Type untuk conditional rendering berdasarkan metode pembayaran
export interface PaymentMethodFields {
  metodePencairan: MetodePembayaran;
  showBankFields: boolean;
  showEwalletFields: boolean;
  requiredBankFields: boolean;
  requiredEwalletFields: boolean;
}

// Type untuk validasi form
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

// Type untuk summary/dashboard
export interface UangMukaSummary {
  totalPending: number;
  totalDisbursed: number;
  totalSettled: number;
  totalRejected: number;
  totalAmount: number;
  recentUangMuka: UangMuka[];
}


// types/um.ts
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
    project?: {
      name: string;
    };
  };
  karyawan?: {
    id: string;
    namaLengkap: string;
  };
  spk?: {
    id: string;
    spkNumber: string;
  };
  tanggalPengajuan: Date;
  tanggalPencairan?: Date;
  buktiPencairanUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Di file types Anda, tambahkan existingData
export interface CairkanUangMukaData {
  id: string;
  tanggalPencairan: Date;
  buktiTransaksi: File;
  existingData: {
    metodePencairan: string; // Wajib
    namaBankTujuan?: string;
    nomorRekeningTujuan?: string;
    namaEwalletTujuan?: string;
  };
}