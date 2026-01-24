"use client";

import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Scale, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface AccountData {
    id: string;
    code: string;
    name: string;
    amount: number;
}

interface ReportSection {
    accounts: AccountData[];
    total: number;
}

interface AssetSection {
    currentAssets: ReportSection;
    fixedAssets: ReportSection;
    total: number;
}

interface LiabilitySection {
    currentLiabilities: ReportSection;
    longTermLiabilities: ReportSection;
    total: number;
}

interface EquitySection extends ReportSection {
    currentYearEarnings: number;
    retainedEarnings: number;
    totalEquity: number;
}

export interface BalanceSheetData {
    assets: AssetSection;
    liabilities: LiabilitySection;
    equity: EquitySection;
    totalLiabilitiesAndEquity: number;
    checks: {
        isBalanced: boolean;
        difference: number;
    };
}

interface BalanceSheetTableProps {
    data: BalanceSheetData | null;
    isLoading: boolean;
    snapshotDate: string | null;
}

export default function BalanceSheetTable({ data, isLoading, snapshotDate }: BalanceSheetTableProps) {
    if (isLoading) {
        return (
            <Card className="w-full shadow-sm border-slate-200">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <p className="text-lg font-medium text-slate-700">Memuat data neraca...</p>
                    <p className="text-sm text-slate-500 mt-1">Mohon tunggu, sedang memproses posisi keuangan Anda</p>
                </CardContent>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card className="w-full shadow-sm border-dashed border-slate-300">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Scale className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-lg font-semibold text-slate-700">Data Laporan Tidak Tersedia</p>
                    <p className="text-sm text-slate-500 mt-2 max-w-md">
                        Silakan pilih tanggal snapshot untuk melihat laporan posisi keuangan.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const SectionRow = ({
        title,
        total,
        type,
        className = ""
    }: {
        title: React.ReactNode;
        total?: number;
        type: 'header' | 'sub-category' | 'subtotal' | 'main-total' | 'validation';
        className?: string;
    }) => {
        const getRowClasses = () => {
            switch (type) {
                case 'header':
                    return "font-bold text-slate-900 bg-slate-50 dark:bg-slate-900/50 uppercase tracking-wider text-[11px]";
                case 'sub-category':
                    return "font-semibold text-slate-700 dark:text-slate-400 bg-slate-50/30 dark:bg-slate-900/10 italic text-[12px]";
                case 'subtotal':
                    return "font-semibold text-slate-900 border-t border-slate-200 dark:border-slate-800 bg-slate-50/20";
                case 'main-total':
                    return "font-bold text-lg bg-primary text-white";
                case 'validation':
                    return cn(
                        "font-bold border-t-2",
                        Math.abs(total || 0) > 0.01
                            ? "bg-red-100 text-red-700 border-red-300"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    );
                default:
                    return "";
            }
        };

        return (
            <TableRow className={cn(
                "transition-colors",
                type === 'main-total' ? "hover:bg-primary/90" : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                className
            )}>
                <TableCell className={cn(getRowClasses(), "py-3")} colSpan={2}>
                    <div className={cn(type === 'sub-category' ? "pl-8" : "pl-6")}>
                        {title}
                    </div>
                </TableCell>
                <TableCell className={cn("text-right py-3 pr-6", getRowClasses())}>
                    {total !== undefined && (
                        <span className="tabular-nums tracking-tight">
                            {formatCurrency(total)}
                        </span>
                    )}
                </TableCell>
            </TableRow>
        );
    };

    const AccountRows = ({ accounts }: { accounts: AccountData[] }) => {
        return (
            <>
                {accounts.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-slate-400 text-xs italic">
                            Tidak ada akun dalam kategori ini
                        </TableCell>
                    </TableRow>
                ) : (
                    accounts.map((account) => (
                        <TableRow
                            key={account.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                            <TableCell className="w-[120px] text-slate-500 dark:text-slate-400 pl-12 font-medium text-xs">
                                {account.code}
                            </TableCell>
                            <TableCell className="text-slate-700 dark:text-slate-300 text-sm">
                                {account.name}
                            </TableCell>
                            <TableCell className="text-right pr-6">
                                <span className="tabular-nums font-medium text-slate-900 dark:text-slate-200 text-sm">
                                    {formatCurrency(account.amount)}
                                </span>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </>
        );
    };

    const Bilingual = ({ id, en, inverse = false }: { id: string, en: string, inverse?: boolean }) => (
        <span className="flex flex-col leading-tight">
            <span>{id}</span>
            <span className={cn(
                "text-[10px] italic font-normal opacity-80",
                inverse ? "text-slate-100" : "text-slate-500"
            )}>
                {en}
            </span>
        </span>
    );

    return (
        <div className="space-y-6">
            {!data.checks.isBalanced && (
                <Alert variant="destructive" className="bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900 text-red-800">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertTitle className="font-bold">Neraca Tidak Seimbang (Unbalanced!)</AlertTitle>
                    <AlertDescription>
                        Terdapat selisih sebesar <span className="font-bold">{formatCurrency(data.checks.difference)}</span> antara Total Aset dan Total (Liabilitas + Ekuitas). Mohon periksa kembali pencatatan jurnal Anda.
                    </AlertDescription>
                </Alert>
            )}

            {data.checks.isBalanced && (
                <Alert className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <AlertTitle className="font-bold">Neraca Seimbang</AlertTitle>
                    <AlertDescription>
                        Total Aktiva dan Pasiva sudah sesuai. Posisi keuangan terverifikasi seimbang.
                    </AlertDescription>
                </Alert>
            )}

            <Card className="w-full shadow-md border-slate-200 dark:border-slate-800 overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <CardTitle className="text-2xl text-slate-900 dark:text-white flex items-center gap-2">
                                <Scale className="w-6 h-6 text-primary" />
                                <div>
                                    Laporan Neraca
                                    <span className="block text-sm font-normal text-slate-500 italic underline">Balance Sheet</span>
                                </div>
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-2">
                                <Calendar className="w-4 h-4" />
                                Per Tanggal: {snapshotDate ? new Date(snapshotDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/30">
                            <TableRow>
                                <TableHead className="pl-6 w-[150px]">Kode Akun</TableHead>
                                <TableHead>Nama Akun</TableHead>
                                <TableHead className="text-right pr-6">Saldo (IDR)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* ASSETS SECTION */}
                            <SectionRow
                                title={<Bilingual id="ASET" en="ASSETS" />}
                                type="header"
                            />

                            {/* Aset Lancar */}
                            <SectionRow
                                title={<Bilingual id="ASET LANCAR" en="CURRENT ASSETS" />}
                                type="sub-category"
                            />
                            <AccountRows accounts={data.assets.currentAssets.accounts} />
                            <SectionRow
                                title="Total Aset Lancar"
                                total={data.assets.currentAssets.total}
                                type="subtotal"
                            />

                            {/* Aset Tetap */}
                            <SectionRow
                                title={<Bilingual id="ASET TETAP" en="FIXED ASSETS" />}
                                type="sub-category"
                            />
                            <AccountRows accounts={data.assets.fixedAssets.accounts} />
                            <SectionRow
                                title="Total Aset Tetap"
                                total={data.assets.fixedAssets.total}
                                type="subtotal"
                            />

                            <SectionRow
                                title={<Bilingual id="TOTAL ASET" en="TOTAL ASSETS" />}
                                total={data.assets.total}
                                type="main-total"
                                className="mt-4"
                            />

                            <TableRow className="h-6 bg-slate-50/30 dark:bg-slate-900/10"><TableCell colSpan={3}></TableCell></TableRow>

                            {/* LIABILITIES SECTION */}
                            <SectionRow
                                title={<Bilingual id="KEWAJIBAN / LIABILITAS" en="LIABILITIES" />}
                                type="header"
                            />

                            {/* Jangka Pendek */}
                            <SectionRow
                                title={<Bilingual id="KEWAJIBAN JANGKA PENDEK" en="CURRENT LIABILITIES" />}
                                type="sub-category"
                            />
                            <AccountRows accounts={data.liabilities.currentLiabilities.accounts} />
                            <SectionRow
                                title="Total Kewajiban Jangka Pendek"
                                total={data.liabilities.currentLiabilities.total}
                                type="subtotal"
                            />

                            {/* Jangka Panjang */}
                            <SectionRow
                                title={<Bilingual id="KEWAJIBAN JANGKA PANJANG" en="LONG-TERM LIABILITIES" />}
                                type="sub-category"
                            />
                            <AccountRows accounts={data.liabilities.longTermLiabilities.accounts} />
                            <SectionRow
                                title="Total Kewajiban Jangka Panjang"
                                total={data.liabilities.longTermLiabilities.total}
                                type="subtotal"
                            />

                            <SectionRow
                                title={<Bilingual id="TOTAL LIABILITAS" en="TOTAL LIABILITIES" />}
                                total={data.liabilities.total}
                                type="subtotal"
                                className="mt-4"
                            />

                            <TableRow className="h-4"><TableCell colSpan={3}></TableCell></TableRow>

                            {/* EQUITY SECTION */}
                            <SectionRow
                                title={<Bilingual id="EKUITAS" en="EQUITY" />}
                                type="header"
                            />
                            <AccountRows accounts={data.equity.accounts} />

                            {/* Special Equity Calculations */}
                            <TableRow className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <TableCell className="w-[120px] text-slate-500 dark:text-slate-400 pl-12 font-medium text-xs">-</TableCell>
                                <TableCell className="text-slate-700 dark:text-slate-300 text-sm italic">
                                    Laba Ditahan (Retained Earnings)
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                    <span className="tabular-nums font-medium text-slate-900 dark:text-slate-200 text-sm">
                                        {formatCurrency(data.equity.retainedEarnings)}
                                    </span>
                                </TableCell>
                            </TableRow>
                            <TableRow className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <TableCell className="w-[120px] text-slate-500 dark:text-slate-400 pl-12 font-medium text-xs">-</TableCell>
                                <TableCell className="text-slate-700 dark:text-slate-300 text-sm italic">
                                    Laba Tahun Berjalan (Current Year Earnings)
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                    <span className="tabular-nums font-medium text-slate-900 dark:text-slate-200 text-sm">
                                        {formatCurrency(data.equity.currentYearEarnings)}
                                    </span>
                                </TableCell>
                            </TableRow>

                            <SectionRow
                                title={<Bilingual id="TOTAL EKUITAS" en="TOTAL EQUITY" />}
                                total={data.equity.totalEquity}
                                type="subtotal"
                            />

                            <TableRow className="h-1 bg-slate-100/50 dark:bg-slate-900/30"><TableCell colSpan={3}></TableCell></TableRow>

                            {/* PASIVA TOTAL */}
                            <SectionRow
                                title={<Bilingual id="TOTAL LIABILITAS & EKUITAS" en="TOTAL LIABILITIES & EQUITY" />}
                                total={data.totalLiabilitiesAndEquity}
                                type="main-total"
                            />

                            {/* VALIDATION ROW */}
                            <SectionRow
                                title={<Bilingual id="SELISIH (BALANCE CHECK)" en="DIFFERENCE" />}
                                total={data.assets.total - data.totalLiabilitiesAndEquity}
                                type="validation"
                                className="mt-4"
                            />
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
