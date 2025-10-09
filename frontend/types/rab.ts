export type CostType =
  | "MATERIAL"   // Produk / bahan bangunan
  | "LABOR"      // Tukang / pekerja / jasa
  | "EQUIPMENT"  // Peralatan / sewa alat
  | "SUBCON"     // Pekerjaan subkontraktor
  | "TRANSPORT"  // Mobilisasi / transportasi
  | "OVERHEAD"   // Biaya overhead proyek
  | "OTHER";     // Biaya lain-lain / tak terduga


export type RABStatus = "DRAFT" | "APPROVED" | "REJECTED";

export type CategoryRAB =
  | "PRELIMINARY" // Pekerjaan Pendahuluan
  | "SITEPREP" // Pekerjaan Persiapan
  | "STRUCTURE" // Pekerjaan Struktur
  | "ARCHITECTURE" // Pekerjaan Arsitektur
  | "MEP" // Mechanical, Electrical, Plumbing
  | "FINISHING" // Pekerjaan Finishing
  | "LANDSCAPE" // Pekerjaan Landscaping
  | "EQUIPMENT" // Peralatan dan Perlengkapan
  | "OVERHEAD" // Biaya Overhead & Profit
  | "OTHER"; // Lain-lain

export interface RABDetail {
  id?: string;
  productId?: string | null;
  description: string;
  categoryRab: CategoryRAB;
  qty: number;
  unit: string;
  price: number;
  subtotal?: number;
  costType: CostType;
  notes?: string | null;
  product?: {
    id: string;
    name: string;
    sku?: string;
    category?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}
export interface RAB {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  total: number;
  status: RABStatus;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  project?: {
    id: string;
    name: string;
    customer?: {
      id: string;
      name: string;
      address?: string;
    };
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  rabDetails: RABDetail[];
  _count?: {
    rabDetails: number;
  };
}

export interface RABCreateInput {
  projectId: string;
  name: string;
  description?: string | null;
  rabDetails: Omit<RABDetail, "id" | "product">[];
  createdById?: string;
  project?: {
    id: string;
    name: string;
    customer?: {
      id: string;
      name: string;
      address?: string;
    };
  };
}

export interface RABUpdateInput extends Partial<RABCreateInput> {
  id: string;
}

export interface RABListResponse {
  success: boolean;
  data: RAB[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface RABResponse {
  success: boolean;
  data: RAB;
  message?: string;
}

export interface RABStatusUpdate {
  status: RABStatus;
}
