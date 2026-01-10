export interface OpeningBalanceDetail {
    id?: string;
    accountId: string;
    account?: {
        code: string;
        name: string;
    };
    debit: number;
    credit: number;
}

export interface OpeningBalance {
    id: string;
    asOfDate: string;
    description: string;
    isPosted: boolean;
    postedAt?: string;
    createdAt: string;
    details?: OpeningBalanceDetail[];
    _count?: {
        details: number;
    };
}

export interface CreateOpeningBalanceInput {
    asOfDate: string;
    description: string;
    details: OpeningBalanceDetail[];
}
