import { ChartOfAccounts } from "./coa";

export interface GeneralLedgerSummary {
    id: string;
    coaId: string;
    coa: {
        code: string;
        name: string;
        type: string;
    };
    periodId: string;
    period: {
        name: string;
    };
    date: string;
    openingBalance: number;
    debitTotal: number;
    creditTotal: number;
    closingBalance: number;
    transactionCount: number;
    currency: string;
}

export interface GLSummaryPagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface GLSummaryResponse {
    success: boolean;
    data: GeneralLedgerSummary[];
    pagination: GLSummaryPagination;
}
