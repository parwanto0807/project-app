export type SourceProductType =
  | "PEMBELIAN_BARANG"
  | "PENGAMBILAN_STOK"
  | "OPERATIONAL"
  | "JASA_PEMBELIAN"
  | "JASA_INTERNAL";

export interface PurchaseRequestDetail {
  id?: string;
  productId: string;
  projectBudgetId?: string;
  jumlah: number;
  satuan: string;
  estimasiHargaSatuan: number;
  estimasiTotalHarga: number;
  catatanItem?: string;
  sourceProduct?: SourceProductType | null; // ✅ Tambahan baru
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
  };
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

// Untuk backward compatibility
export type PurchaseRequestItem = PurchaseRequestDetail;

export interface CreatePurchaseRequestData {
  projectId: string;
  spkId: string;
  karyawanId: string;
  tanggalPr: Date;
  keterangan?: string;
  details: Omit<PurchaseRequestDetail, "id" | "estimasiTotalHarga">[]; // ✅ sudah termasuk sourceProduct
}

export interface UpdatePurchaseRequestData {
  tanggalPr?: Date;
  keterangan?: string;
  details?: Omit<PurchaseRequestDetail, "id" | "estimasiTotalHarga">[]; // ✅ sudah termasuk sourceProduct
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
  karyawanId?: string;
  spkId?: string;
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
  spkId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UangMukaWithRelations extends UangMuka {
  pertanggungjawaban?: PertanggungjawabanWithDetails[];
}

export interface PertanggungjawabanWithDetails extends Pertanggungjawaban {
  details: RincianPertanggungjawaban[];
}
