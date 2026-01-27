export type ExpenseStatus = 'DRAFT' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface OperationalExpense {
    id: string;
    expenseNumber: string;
    date: string;
    description: string;
    amount: number;
    receiptUrl?: string;
    status: ExpenseStatus;

    createdById: string;
    createdBy: { name: string };

    approvedById?: string;
    approvedBy?: { name: string };

    expenseAccountId: string;
    expenseAccount: { code: string, name: string };

    paidFromAccountId?: string;
    paidFromAccount?: { code: string, name: string };

    journalEntryId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface OperationalExpenseFilters {
    status?: ExpenseStatus;
    startDate?: string;
    endDate?: string;
}
