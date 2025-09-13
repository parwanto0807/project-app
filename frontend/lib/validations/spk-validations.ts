// /types/spk.ts
import { SalesOrder } from "./sales-order";
import { SalesOrderItem } from "./sales-order";
import { Karyawan } from "./karyawan";
import { Team } from "./team";

export interface SPK {
  id: string;
  spkNumber: string;
  spkDate: Date; // ISO string

  createdById: string;
  salesOrderId: string;
  teamId?: string | null;

  notes?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface SPKDetail {
  id: string;
  spkId: string;

  karyawanId?: string | null;
  salesOrderItemId?: string | null;

  lokasiUnit?: string | null;

  createdAt: string;
  updatedAt: string;
}

/**
 * ===== Versi Dengan Relasi =====
 */
export interface Project {
  id: string;
  name: string;
}

export interface SPKWithRelations extends SPK {
  createdBy: Karyawan;
  salesOrder: SalesOrder;
  project: Project;
  team?: Team | null;
  details: SPKDetailWithRelations[];
}

export interface SPKDetailWithRelations extends SPKDetail {
  karyawan?: Karyawan | null;
  salesOrderItem?: SalesOrderItem | null;
}

export interface SpkFormValuesPdf {
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
  };

  salesOrder: {
    id: string;
    soNumber: string;
    customerName: string;
    projectName: string;
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
        jabatan: string;
        department: string;
      };
    };
  } | null;

  details: {
    id: string;
    karyawan?: {
      id: string;
      namaLengkap: string;
      jabatan: string;
      department: string;
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


