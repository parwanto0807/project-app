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
  type: 'PROGRESS' | 'FINAL';
  note: string | null;
  photos: string[];
  reportedAt: Date;
  soDetailId: string;
  itemName: string;
  karyawanName: string;
  progress: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}