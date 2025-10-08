import { RABDetail, RABCreateInput, CategoryRAB } from "@/types/rab";

// Calculate RAB totals
export function calculateRABTotals(rabDetails: RABDetail[]): {
  subtotal: number;
  taxTotal: number;
  total: number;
} {
  const subtotal = rabDetails.reduce((sum, detail) => {
    return sum + detail.qty * detail.price;
  }, 0);

  // You can add tax calculation here if needed
  const taxTotal = 0;
  const total = subtotal + taxTotal;

  return {
    subtotal,
    taxTotal,
    total,
  };
}

// Format currency for display
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

// Get status color
export function getStatusColor(status: string): string {
  switch (status) {
    case "APPROVED":
      return "bg-green-100 text-green-800";
    case "REJECTED":
      return "bg-red-100 text-red-800";
    case "DRAFT":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Get status text
export function getStatusText(status: string): string {
  switch (status) {
    case "APPROVED":
      return "Disetujui";
    case "REJECTED":
      return "Ditolak";
    case "DRAFT":
      return "Draft";
    default:
      return status;
  }
}

// Get cost type text
export function getCostTypeText(costType: string): string {
  switch (costType) {
    case "MATERIAL":
      return "Material";
    case "LABOR":
      return "Tenaga Kerja";
    case "OTHER":
      return "Lainnya";
    default:
      return costType;
  }
}

// Validate RAB data before submission
export function validateRABData(data: RABCreateInput): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.projectId) {
    errors.push("Project harus dipilih");
  }

  if (!data.name?.trim()) {
    errors.push("Nama RAB harus diisi");
  }

  if (!data.rabDetails || data.rabDetails.length === 0) {
    errors.push("Minimal 1 item harus ditambahkan");
  } else {
    data.rabDetails.forEach((detail, index) => {
      if (!detail.description?.trim()) {
        errors.push(`Item ${index + 1}: Deskripsi harus diisi`);
      }
      if (detail.qty <= 0) {
        errors.push(`Item ${index + 1}: Quantity harus lebih dari 0`);
      }
      if (!detail.unit?.trim()) {
        errors.push(`Item ${index + 1}: Satuan harus diisi`);
      }
      if (detail.price < 0) {
        errors.push(`Item ${index + 1}: Harga tidak boleh negatif`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function getCategoryRabText(category: CategoryRAB): string {
  const categoryMap: Record<CategoryRAB, string> = {
    PRELIMINARY: "Pekerjaan Pendahuluan",
    SITEPREP: "Pekerjaan Persiapan",
    STRUCTURE: "Pekerjaan Struktur",
    ARCHITECTURE: "Pekerjaan Arsitektur",
    MEP: "MEP (Mechanical, Electrical, Plumbing)",
    FINISHING: "Pekerjaan Finishing",
    LANDSCAPE: "Pekerjaan Landscaping",
    EQUIPMENT: "Peralatan dan Perlengkapan",
    OVERHEAD: "Biaya Overhead & Profit",
    OTHER: "Lain-lain",
  };
  return categoryMap[category] || category;
}

export function getCategoryRabColor(category: CategoryRAB): string {
  const colorMap: Record<CategoryRAB, string> = {
    PRELIMINARY: "bg-blue-100 text-blue-800",
    SITEPREP: "bg-orange-100 text-orange-800",
    STRUCTURE: "bg-red-100 text-red-800",
    ARCHITECTURE: "bg-green-100 text-green-800",
    MEP: "bg-purple-100 text-purple-800",
    FINISHING: "bg-yellow-100 text-yellow-800",
    LANDSCAPE: "bg-emerald-100 text-emerald-800",
    EQUIPMENT: "bg-cyan-100 text-cyan-800",
    OVERHEAD: "bg-gray-100 text-gray-800",
    OTHER: "bg-slate-100 text-slate-800",
  };
  return colorMap[category] || "bg-gray-100 text-gray-800";
}
