// Staff Balance Types

export interface Karyawan {
    id: string;
    namaLengkap: string;
    email?: string;
    departemen?: string;
    jabatan?: string;
}

export interface StaffBalance {
    id: string;
    karyawanId: string;
    karyawan: Karyawan;
    category: LedgerCategory;
    totalIn: number;  // Total dana yang diterima/dicairkan
    totalOut: number; // Total dana yang dilaporkan/dipakai
    amount: number;   // Saldo berjalan (totalIn - totalOut)
    updatedAt: string;
}

export interface StaffLedger {
    id: string;
    karyawanId: string;
    karyawan: Karyawan;
    tanggal: string;
    keterangan: string;
    saldoAwal: number;  // Saldo sebelum transaksi
    debit: number;
    kredit: number;
    saldo: number;  // Saldo setelah transaksi (saldoAwal + debit - kredit)
    category: LedgerCategory;
    type: TransactionStaffBalanceType;
    purchaseRequestId?: string | null;
    purchaseRequest?: {
        id: string;
        nomorPr: string;
        keterangan?: string;
    } | null;
    refId?: string | null;
    createdBy?: string | null;
}

export enum LedgerCategory {
    OPERASIONAL_PROYEK = "OPERASIONAL_PROYEK",
    PINJAMAN_PRIBADI = "PINJAMAN_PRIBADI",
}

export enum TransactionStaffBalanceType {
    OPENING_BALANCE = "OPENING_BALANCE",
    CASH_ADVANCE = "CASH_ADVANCE",
    EXPENSE_REPORT = "EXPENSE_REPORT",
    LOAN_DISBURSEMENT = "LOAN_DISBURSEMENT",
    LOAN_REPAYMENT = "LOAN_REPAYMENT",
    REIMBURSEMENT = "REIMBURSEMENT",
}

export interface StaffBalanceSummary {
    totalOperasional: number;
    totalPinjaman: number;
    grandTotal: number;
    countOperasional?: number;
    countPinjaman?: number;
    totalEmployees?: number;
}

export interface StaffBalanceResponse {
    success: boolean;
    data: StaffBalance[];
    summary: StaffBalanceSummary;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface StaffLedgerResponse {
    success: boolean;
    data: StaffLedger[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Helper function to get category label
export const getCategoryLabel = (category: LedgerCategory): string => {
    const labels: Record<LedgerCategory, string> = {
        [LedgerCategory.OPERASIONAL_PROYEK]: "Operasional Proyek",
        [LedgerCategory.PINJAMAN_PRIBADI]: "Pinjaman Pribadi",
    };
    return labels[category] || category;
};

// Helper function to get transaction type label
export const getTransactionTypeLabel = (
    type: TransactionStaffBalanceType
): string => {
    const labels: Record<TransactionStaffBalanceType, string> = {
        [TransactionStaffBalanceType.OPENING_BALANCE]: "Saldo Awal",
        [TransactionStaffBalanceType.CASH_ADVANCE]: "Kasbon / Uang Muka",
        [TransactionStaffBalanceType.EXPENSE_REPORT]: "Laporan Pengeluaran",
        [TransactionStaffBalanceType.LOAN_DISBURSEMENT]: "Pencairan Pinjaman",
        [TransactionStaffBalanceType.LOAN_REPAYMENT]: "Pembayaran Pinjaman",
        [TransactionStaffBalanceType.REIMBURSEMENT]: "Reimbursement",
    };
    return labels[type] || type;
};

// Helper function to get category badge color
export const getCategoryColor = (category: LedgerCategory): string => {
    const colors: Record<LedgerCategory, string> = {
        [LedgerCategory.OPERASIONAL_PROYEK]: "bg-blue-100 text-blue-800",
        [LedgerCategory.PINJAMAN_PRIBADI]: "bg-purple-100 text-purple-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
};

// Helper function to get transaction type badge color
export const getTransactionTypeColor = (
    type: TransactionStaffBalanceType
): string => {
    const colors: Record<TransactionStaffBalanceType, string> = {
        [TransactionStaffBalanceType.OPENING_BALANCE]: "bg-indigo-100 text-indigo-800",
        [TransactionStaffBalanceType.CASH_ADVANCE]: "bg-green-100 text-green-800",
        [TransactionStaffBalanceType.EXPENSE_REPORT]: "bg-orange-100 text-orange-800",
        [TransactionStaffBalanceType.LOAN_DISBURSEMENT]: "bg-purple-100 text-purple-800",
        [TransactionStaffBalanceType.LOAN_REPAYMENT]: "bg-red-100 text-red-800",
        [TransactionStaffBalanceType.REIMBURSEMENT]: "bg-blue-100 text-blue-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
};
