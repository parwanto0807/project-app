export type FundTransferStatus = 'DRAFT' | 'POSTED' | 'VOIDED';

export interface FundTransfer {
    id: string;
    transferNo: string;
    transferDate: string;
    amount: number;
    feeAmount: number;
    totalAmount: number;
    fromAccountId: string;
    toAccountId: string;
    feeAccountId?: string;
    referenceNo?: string;
    notes?: string;
    status: FundTransferStatus;
    ledgerId?: string;
    periodId?: string;
    createdById: string;
    approvedById?: string;
    approvedAt?: string;
    voidedById?: string;
    voidedAt?: string;
    voidReason?: string;
    createdAt: string;
    updatedAt: string;

    // Relations
    fromAccount?: {
        id: string;
        code: string;
        name: string;
    };
    toAccount?: {
        id: string;
        code: string;
        name: string;
    };
    feeAccount?: {
        id: string;
        code: string;
        name: string;
    };
    createdBy?: {
        name: string;
    };
}

export interface FundTransferRequest {
    transferDate: string;
    amount: number;
    feeAmount?: number;
    fromAccountId: string;
    toAccountId: string;
    feeAccountId?: string;
    fromAccountName?: string; // For description in ledger
    toAccountName?: string;   // For description in ledger
    referenceNo?: string;
    notes?: string;
}
