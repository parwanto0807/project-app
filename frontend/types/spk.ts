export interface SpkFormValuesPdfProps {
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

// types/spk.ts
export interface SPKBase {
  id: string;
  spkNumber: string;
  spkDate: Date;
  salesOrderId: string;
  teamId: string;
  createdById: string;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SPKDataApi extends SPKBase {
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
      name: string;
      address: string;
      branch: string;
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
      departemen: string;
      email: string;
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
    status?: "PENDING" | "DONE";
  }[];

  spkFieldReport?: {
    id: string;
    soDetailId?: string;
    progress?: number;
    status?: string;
    reportedAt?: Date;
    createdAt: Date;
  }[] | null;
}

export interface FetchSpkParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  statusFilter?: string;
  filterBy: string;
}

export interface SpkResponse {
  data: SPK[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

interface SPK {
  id: string;
  spkNumber: string;
  spkDate: Date;
  salesOrderId: string;
  teamId: string;
  createdById: string;
  progress: number;
  spkStatusClose: boolean;
  spkStatus: boolean;
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
      name: string;
      address: string;
      branch: string;
    }
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
    salesOrderItemSPK?: {
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