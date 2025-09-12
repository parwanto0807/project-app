export interface SpkFormValuesPdfProps {
  id: string;
  spkNumber: string; // wajib
  spkDate: Date | string;
  salesOrderId: string;
  teamId: string;
  createdById: string;
  createdBy: {
    id: string;
    nama: string;
    jabatan?: string | null;
    nik?: string;
  };
  salesOrder: {
    id: string;
    soNumber: string;
    customerName: string;
    projectName: string;
    project: {
      id: string;
      name: string;
    };
  };
  team?: {
    id: string;
    namaTeam: string;
  } | null;
  details: {
    id: string;
    karyawan?: {
      id: string;
      nama: string;
    };
    salesOrderItem?: {
      id: string;
      name: string;
      description?: string;
      qty: number;
      uom: string;
    };
    lokasiUnit?: string | null;
  }[];
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
