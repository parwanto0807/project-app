import { SpkFormValuesPdfProps } from "@/types/spk";

// Bentuk internal sebelum jadi props PDF
export interface SpkPdfValues {
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
    departemen?: string | null ;
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
        id: string;
        namaLengkap: string;
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

// 🔑 Mapper utama buat ke PDF
export function mapFormValuesToPdfProps(
  spk: SpkPdfValues
): SpkFormValuesPdfProps {
  return {
    id: spk.id,
    spkNumber: spk.spkNumber,
    spkDate: spk.spkDate,
    salesOrderId: spk.salesOrder?.id || "",
    teamId: spk.team?.id || "",
    createdById: spk.createdBy.id,

    createdBy: {
      id: spk.createdBy.id,
      namaLengkap: spk.createdBy.namaLengkap,
      jabatan: spk.createdBy.jabatan ?? null,
      nik: spk.createdBy.nik ?? undefined,
      departemen: spk.createdBy.departemen ?? undefined,
    },

    salesOrder: {
      id: spk.salesOrder?.id || "",
      soNumber: spk.salesOrder?.soNumber || "",
      projectName: spk.salesOrder?.projectName || "",
      customer: {
        name: spk.salesOrder.customer.name,
        address: spk.salesOrder.customer.address,
        branch: spk.salesOrder.customer.branch,
      },
      project: spk.salesOrder?.project
        ? {
            id: spk.salesOrder.project.id || "",
            name: spk.salesOrder.project.name || "",
          }
        : undefined,
      // ✅ tambahkan items biar ikut ke PDF
      items:
        spk.salesOrder?.items?.map((item) => ({
          id: item.id,
          lineNo: item.lineNo,
          itemType: item.itemType,
          name: item.name,
          description: item.description ?? undefined,
          qty: item.qty,
          uom: item.uom ?? "",
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxRate: item.taxRate,
          lineTotal: item.lineTotal,
        })) || [],
    },

    team: spk.team
      ? {
          id: spk.team.id,
          namaTeam: spk.team.namaTeam,
          teamKaryawan: spk.team.teamKaryawan
            ? {
                teamId: spk.team.teamKaryawan.teamId,
                karyawan: spk.team.teamKaryawan.karyawan
                  ? {
                      id: spk.team.teamKaryawan.karyawan.id || "",
                      namaLengkap:
                        spk.team.teamKaryawan.karyawan.namaLengkap || "",
                      jabatan: spk.team.teamKaryawan.karyawan.jabatan || "",
                      departemen:
                        spk.team.teamKaryawan.karyawan.departemen || "",
                    }
                  : undefined,
              }
            : undefined,
        }
      : undefined,

    details: spk.details.map((d) => ({
      id: d.id,
      karyawan: d.karyawan
        ? {
            id: d.karyawan.id,
            namaLengkap: d.karyawan.namaLengkap,
            jabatan: d.karyawan.jabatan,
            nik: d.karyawan.nik,
            departemen: d.karyawan.departemen,
          }
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

    notes: spk.notes ?? null,
    createdAt: spk.createdAt,
    updatedAt: spk.updatedAt,
  };
}
