// /types/spk.ts
import { SalesOrder } from "./sales-order"
import { SalesOrderItem } from "./sales-order"
import { Karyawan } from "./karyawan"
import { Team } from "./team"

export interface SPK {
  id: string
  spkNumber: string
  spkDate: Date // ISO string

  createdById: string
  salesOrderId: string
  teamId?: string | null

  notes?: string | null

  createdAt: string
  updatedAt: string
}

export interface SPKDetail {
  id: string
  spkId: string

  karyawanId?: string | null
  salesOrderItemId?: string | null

  lokasiUnit?: string | null

  createdAt: string
  updatedAt: string
}

/**
 * ===== Versi Dengan Relasi =====
 */
export interface Project {
id: string;
name: string;
}

export interface SPKWithRelations extends SPK {
  createdBy: Karyawan
  salesOrder: SalesOrder
  project: Project
  team?: Team | null
  details: SPKDetailWithRelations[]
}

export interface SPKDetailWithRelations extends SPKDetail {
  karyawan?: Karyawan | null
  salesOrderItem?: SalesOrderItem | null
}


export interface SpkFormValuesPdf {
  spkNumber?: string;
  spkDate: Date;

  salesOrderId: string;
  salesOrder?: {
    id: string;
    soNumber: string;
    customerName: string;
    projectName: string;
  };

  teamId?: string;
  team?: {
    id: string;
    namaTeam: string;
  };

  details: {
    id: string;
    karyawanId: string;
    karyawan?: {
      id: string;
      namaLengkap: string;
    };
    salesOrderItemId?: string | null;
    salesOrderItem?: {
      id: string;
      name: string;
      description: string;
      qty: number;
      uom: string;
    };
    lokasiUnit?: string | null;
  }[];

  notes?: string;
  createdById: string;
  createdBy?: {
    id: string;
    namaLengkap: string;
    jabatan: string;
    nik: string;
  };
}