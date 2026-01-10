import { ChartOfAccounts } from "./coa";

export interface SystemAccount {
    id: string;
    key: string;
    description?: string;
    coaId: string;
    coa?: ChartOfAccounts;
    createdAt: string;
    updatedAt: string;
}

export interface SystemAccountFormData {
    key: string;
    description?: string;
    coaId: string;
}

export interface SystemAccountResponse {
    success: boolean;
    message?: string;
    data: SystemAccount;
}

export interface SystemAccountListResponse {
    success: boolean;
    data: SystemAccount[];
}
