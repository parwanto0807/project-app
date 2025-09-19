// types/spk.ts
export interface SpkFieldReport {
  id: string;
  spkId: string;
  karyawanId: string;
  type: "PROGRESS" | "FINAL";
  note?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reportedAt: string;
  karyawan?: {
    id: string;
    nik: string;
    namaLengkap: string;
    tanggalLahir?: string | null;
    alamat?: string | null;
    nomorTelepon?: string | null;
    email?: string | null;
    jabatan?: string | null;
    departemen?: string | null;
    tanggalMasuk?: string | null;
    tanggalKeluar?: string | null;
    statusKerja: string;
    foto?: string | null;
    tipeKontrak?: string | null;
    gajiPokok?: number | null;
    tunjangan?: number | null;
    potongan?: number | null;
    isActive: boolean;

    createdAt: string;
    updatedAt: string;
  };
  photos?: SpkFieldReportPhoto[];
}

export interface SpkFieldReportPhoto {
  id: string;
  reportId: string;
  imageUrl: string;
  caption?: string;
  uploadedBy: string;
  uploadedAt: string;
}

// src/types/reportHistory.ts
export interface ReportHistory {
  id: string;
  spkNumber: string;
  clientName: string;
  projectName: string;
  type: "PROGRESS" | "FINAL";
  note: string | null;
  photos: string[];
  reportedAt: Date;
  soDetailId: string;
  itemName: string;
  karyawanName: string;
  email: string;
  progress: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export interface SPK {
  id: string;
  spkNumber: string;
  spkDate: Date;
  salesOrderId: string;
  teamId: string;
  createdById: string;

  createdBy: {
    id: string;
    namaLengkap: string;
    jabatan?: string | null;
    nik?: string | null;
    departemen?: string | null;
  };

  salesOrder: {
    id: string;
    soNumber: string;
    projectName: string;
    customer: {
      name: string; // diisi dari customer.name
      address: string; // ✅ baru
      branch: string; // ✅ baru
    };
    project?: {
      id: string;
      name: string;
    };
    items: {
      id: string;
      lineNo: number;
      itemType: string;
      name: string;
      description?: string | null;
      qty: number;
      uom?: string | null;
      unitPrice: number;
      discount: number;
      taxRate: number;
      lineTotal: number;
    }[];
  };

  team?: {
    id: string;
    namaTeam: string;
    teamKaryawan?: {
      teamId: string;
      karyawan?: {
        namaLengkap: string;
        email: string;
        jabatan: string;
        departemen: string;
      };
    };
  } | null;

  details: {
    id: string;
    karyawan?: {
      id: string;
      namaLengkap: string;
      jabatan: string;
      email: string;
      departemen: string;
      nik: string;
    };
    salesOrderItem?: {
      id: string;
      name: string;
      description?: string;
      qty: number;
      uom?: string | null;
    };
    lokasiUnit?: string | null;
  }[];

  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
