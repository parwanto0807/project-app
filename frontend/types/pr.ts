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
  nomorPr: string;
  projectId: string;
  spkId: string;
  spkIds: string;
  karyawanId: string;
  tanggalPr: Date;
  keterangan?: string;
  status:
    | "DRAFT"
    | "REVISION_NEEDED"
    | "SUBMITTED"
    | "APPROVED"
    | "REJECTED"
    | "COMPLETED";

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

  // TAMBAHKAN UANG MUKA
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
    spkId: string;
    createdAt: Date;
    updatedAt: Date;
    pertanggungjawaban?: Pertanggungjawaban[];
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

  // Relasi opsional
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

  // Relasi opsional
  product?: {
    id: string;
    name: string;
    code: string;
  };
  // Relasi ke foto bukti
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
  page?: number;
  limit?: number;
  totalCount?: number;
  totalPages?: number;
  search?: string;
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
}

export interface PurchaseRequestError {
  success: false;
  error: string;
  details?: unknown;
}

// Tambahkan interface untuk relasi jika diperlukan
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
  };
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
  // Override uangMuka jadi versi dengan relasi lengkap
  uangMuka?: UangMukaWithRelations[];
}

export interface UangMukaWithRelations extends UangMuka {
  pertanggungjawaban?: PertanggungjawabanWithDetails[];
}

// ======================= UANG MUKA ==========================
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
  spkId: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface PertanggungjawabanWithDetails extends Pertanggungjawaban {
  details: RincianPertanggungjawaban[];
}
