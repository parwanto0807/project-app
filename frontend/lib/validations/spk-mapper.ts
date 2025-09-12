import { SpkFormValuesPdfProps } from "@/types/spk";

// Bentuk internal sebelum jadi props PDF
export interface SpkPdfValues {
  id: string;
  spkNumber: string;
  spkDate: Date;
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
  };
  team?: { id: string; namaTeam: string } | null;
  details: {
    id: string;
    karyawan?: { id: string; namaLengkap: string };
    salesOrderItem?: {
      id: string;
      name: string;
      description?: string | null;
      qty: number;
      uom?: string | null;
    };
    lokasiUnit?: string | null;
  }[];
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// 🔑 Mapper utama buat ke PDF
export function mapFormValuesToPdfProps(
  spk: SpkPdfValues
): SpkFormValuesPdfProps {
  return {
    id: spk.id,
    spkNumber: spk.spkNumber,
    spkDate: spk.spkDate.toISOString(),
    salesOrderId: spk.salesOrder?.id || "",
    teamId: spk.team?.id || "",
    createdById: spk.createdBy.id,
    createdBy: {
      id: spk.createdBy.id,
      nama: spk.createdBy.namaLengkap,
      jabatan: spk.createdBy.jabatan || null,
      nik: spk.createdBy.nik || undefined,
    },
    salesOrder: {
      id: spk.salesOrder.id,
      soNumber: spk.salesOrder.soNumber,
      customerName: spk.salesOrder.customerName,
      projectName: spk.salesOrder.projectName,
      project: {
        id: spk.salesOrder.project?.id || "",
        name: spk.salesOrder.project?.name || "",
      },
    },

    team: spk.team ? { id: spk.team.id, namaTeam: spk.team.namaTeam } : null,
    details: spk.details.map((d) => ({
      id: d.id,
      karyawan: d.karyawan
        ? { id: d.karyawan.id, nama: d.karyawan.namaLengkap }
        : undefined,
      salesOrderItem: d.salesOrderItem
        ? {
            id: d.salesOrderItem.id,
            name: d.salesOrderItem.name,
            description: d.salesOrderItem.description ?? undefined,
            qty: d.salesOrderItem.qty,
            uom: d.salesOrderItem.uom ?? "",
          }
        : undefined,
      lokasiUnit: d.lokasiUnit ?? null,
    })),
    notes: spk.notes || null,
    createdAt: spk.createdAt,
    updatedAt: spk.updatedAt,
  };
}
