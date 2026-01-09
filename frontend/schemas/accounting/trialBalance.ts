import { ChartOfAccounts } from "../coa/index";
import { AccountingPeriod } from "./period";

export interface TrialBalance {
    id: string;
    periodId: string;
    period?: AccountingPeriod;
    coaId: string;
    coa: ChartOfAccounts;

    // Saldo awal periode
    openingDebit: number;
    openingCredit: number;

    // Mutasi periode berjalan
    periodDebit: number;
    periodCredit: number;

    // Saldo akhir periode
    endingDebit: number;
    endingCredit: number;

    // Saldo YTD (Year-to-Date)
    ytdDebit: number;
    ytdCredit: number;

    currency: string;
    calculatedAt: string | Date;
}

export interface TrialBalanceTotals {
    openingDebit: number;
    openingCredit: number;
    periodDebit: number;
    periodCredit: number;
    endingDebit: number;
    endingCredit: number;
    ytdDebit: number;
    ytdCredit: number;
}

export interface TrialBalanceResponse {
    success: boolean;
    data: TrialBalance[];
    totals: TrialBalanceTotals;
    period: AccountingPeriod;
    message?: string;
}
