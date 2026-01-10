export type BankAccount = {
    id: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    branch: string | null;
    isActive: boolean;
    accountCOAId: string | null;
    accountCOA?: {
        id: string;
        code: string;
        name: string;
    } | null;
    currentBalance: number;
    createdAt: string;
    updatedAt: string;
};
