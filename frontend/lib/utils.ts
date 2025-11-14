import { SPK } from "@/components/spk/tabelDataSpk";
import { SPKDataApi } from "@/types/spk";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { SpkPdfValues } from "./validations/spk-mapper";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// /lib/utils/formatDate.ts

export function formatDateToDDMMMYYYY(date: Date | string | number): string {
  const d = new Date(date);
  // Ubah angka jadi dua digit (01-31)
  const day = String(d.getDate()).padStart(2, "0");
  // Ambil short month name (Jan, Feb, ...)
  const month = d.toLocaleString("en-US", { month: "short" });
  // Ambil tahun
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

// lib/utils.ts
export const getFullImageUrl = (path: string | undefined): string => {
  if (!path) return "/placeholder-image.jpg"; // fallback image

  // Jika sudah full URL (http://...), biarkan
  if (path.startsWith("http")) return path;

  // Jika path relatif (misal: /images/spk/xxx.jpg), prefix dengan base URL
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
};

export function formatCurrencyNumber(value: number, currency = "IDR") {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export const formatIndoDate = (dateString?: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export function getTimeAgo(dateInput: Date | string): string {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);

  if (isNaN(date.getTime())) {
    return "Waktu tidak valid";
  }

  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} detik yang lalu`;
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} menit yang lalu`;
  } else if (diffInHours < 24) {
    return `${diffInHours} jam yang lalu`;
  } else if (diffInDays < 7) {
    return `${diffInDays} hari yang lalu`;
  } else {
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
}

export function normalizePdfProps(data: SPKDataApi) {
  return {
    ...data,
    spkDate: new Date(data.spkDate),
  };
}

export function mapSpkToPdfValues(spk: SPK): SpkPdfValues {
  const spkDate =
    spk.spkDate instanceof Date ? spk.spkDate : new Date(spk.spkDate);

  return {
    id: spk.id,
    spkNumber: spk.spkNumber,
    spkDate: spkDate,
    salesOrderId: spk.salesOrderId,
    teamId: spk.teamId,
    createdById: spk.createdById,

    createdBy: {
      id: spk.createdBy?.id || "",
      namaLengkap: spk.createdBy?.namaLengkap || "",
      jabatan: spk.createdBy?.jabatan ?? null,
      nik: spk.createdBy?.nik ?? null,
      departemen: spk.createdBy?.departemen ?? null,
    },

    salesOrder: spk.salesOrder
      ? {
          id: spk.salesOrder.id,
          soNumber: spk.salesOrder.soNumber,
          projectName: spk.salesOrder.project?.name || "",
          customer: {
            name: spk.salesOrder.customer?.name || "",
            address: spk.salesOrder.customer?.address || "",
            branch: spk.salesOrder.customer?.branch || "",
          },
          project: spk.salesOrder.project
            ? {
                id: spk.salesOrder.project.id || "",
                name: spk.salesOrder.project.name || "",
              }
            : undefined,
          items:
            spk.salesOrder.items?.map((item) => ({
              id: item.id,
              lineNo: item.lineNo,
              itemType: item.itemType,
              name: item.name ?? "",
              description: item.description ?? "",
              qty: Number(item.qty) || 0,
              uom: item.uom ?? "",
              unitPrice: Number(item.unitPrice) || 0,
              discount: Number(item.discount) || 0,
              taxRate: Number(item.taxRate) || 0,
              lineTotal: Number(item.lineTotal) || 0,
            })) || [],
        }
      : {
          id: "",
          soNumber: "",
          projectName: "",
          customer: { name: "", address: "", branch: "" },
          project: undefined,
          items: [],
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
                      id: spk.team.teamKaryawan.karyawan.id,
                      namaLengkap: spk.team.teamKaryawan.karyawan.namaLengkap,
                      jabatan: spk.team.teamKaryawan.karyawan.jabatan,
                      departemen: spk.team.teamKaryawan.karyawan.departemen,
                    }
                  : undefined,
              }
            : undefined,
        }
      : null,

    details:
      spk.details?.map((detail) => ({
        id: detail.id,
        karyawan: detail.karyawan
          ? {
              id: detail.karyawan?.id ?? "",
              namaLengkap: detail.karyawan?.namaLengkap ?? "",
              jabatan: detail.karyawan?.jabatan ?? "",
              nik: detail.karyawan?.nik ?? "",
              departemen: detail.karyawan?.departemen ?? "",
            }
          : undefined,
        lokasiUnit: detail.lokasiUnit ?? null,
        salesOrderItemSPK: detail.salesOrderItemSPK
          ? {
              id: detail.salesOrderItemSPK.id,
              name: detail.salesOrderItemSPK.name ?? "",
              description: detail.salesOrderItemSPK.description ?? "",
              qty: Number(detail.salesOrderItemSPK.qty) || 0,
              uom: detail.salesOrderItemSPK.uom ?? "",
            }
          : undefined,
      })) || [],

    notes: spk.notes ?? null,
    createdAt: new Date(spk.createdAt),
    updatedAt: new Date(spk.updatedAt),
  };
}

// Helper function untuk mapping data lainnya jika diperlukan
export function mapSpkForExport(spk: SPK) {
  return {
    spkNumber: spk.spkNumber,
    spkDate: spk.spkDate,
    soNumber: spk.salesOrder?.soNumber,
    customerName: spk.salesOrder?.customer?.name,
    teamName: spk.team?.namaTeam,
    progress: spk.progress,
    status: spk.spkStatusClose ? "Closed" : "On Progress",
  };
}
