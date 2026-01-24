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
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import IncomeStatementPDFButton from './IncomeStatementPDFButton';

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

export interface IncomeStatementData {
    revenue: ReportSection;
    cogs: ReportSection;
    grossProfit: number;
    expenses: ReportSection;
    netProfit: number;
}

interface IncomeStatementTableProps {
    data: IncomeStatementData | null;
    isLoading: boolean;
    period: {
        startDate: string;
        endDate: string;
    } | null;
    salesOrderName?: string;
}

export default function IncomeStatementTable({ data, isLoading, period, salesOrderName }: IncomeStatementTableProps) {
    if (isLoading) {
        return (
            <Card className="w-full shadow-sm border-slate-200">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <p className="text-lg font-medium text-slate-700">Memuat data laporan...</p>
                    <p className="text-sm text-slate-500 mt-1">Mohon tunggu, sedang memproses data keuangan Anda</p>
                </CardContent>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card className="w-full shadow-sm border-dashed border-slate-300">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <DollarSign className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-lg font-semibold text-slate-700">Data Laporan Tidak Tersedia</p>
                    <p className="text-sm text-slate-500 mt-2 max-w-md">
                        Tidak ada data keuangan ditemukan untuk periode yang dipilih.
                        {period && (
                            <span className="block mt-1">
                                Periode: {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                            </span>
                        )}
                    </p>
                </CardContent>
            </Card>
        );
    }

    const SectionRow = ({
        title,
        total,
        type,
        trend
    }: {
        title: React.ReactNode;
        total: number;
        type: 'header' | 'subtotal' | 'main-total' | 'profit';
        trend?: 'up' | 'down' | 'neutral';
    }) => {
        const getRowClasses = () => {
            switch (type) {
                case 'header':
                    return "font-semibold text-slate-800 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 dark:text-slate-300";
                case 'subtotal':
                    return "font-semibold text-slate-900 border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/70";
                case 'main-total':
                    return "font-bold text-white bg-gradient-to-r from-primary to-primary/90";
                case 'profit':
                    return "font-bold text-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white";
                default:
                    return "";
            }
        };

        const getTrendIcon = () => {
            if (!trend || trend === 'neutral') return null;
            return trend === 'up'
                ? <TrendingUp className="w-4 h-4 ml-6" /> // adjusted margin
                : <TrendingDown className="w-4 h-4 ml-6" />;
        };

        return (
            <TableRow className={`${type === 'profit' ? 'hover:bg-emerald-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                <TableCell className={`${getRowClasses()} ${type === 'profit' ? 'py-4' : 'py-3'} pl-6`} colSpan={2}>
                    <div className="flex items-center justify-between pr-4">
                        <span>{title}</span>
                        {getTrendIcon()}
                    </div>
                </TableCell>
                <TableCell className={`text-right ${getRowClasses()} ${type === 'profit' ? 'py-4' : 'py-3'} pr-6`}>
                    {type === 'header' ? '' : (
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
                {accounts.map((account) => (
                    <TableRow
                        key={account.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                        <TableCell className="w-[100px] text-slate-600 dark:text-slate-400 pl-6 font-medium">
                            {account.code}
                        </TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300">
                            {account.name}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                            <span className="tabular-nums font-medium text-slate-900 dark:text-slate-200">
                                {formatCurrency(account.amount)}
                            </span>
                        </TableCell>
                    </TableRow>
                ))}
            </>
        );
    };

    const isProfitable = data.netProfit > 0;

    // Helper for bilingual text
    const Bilingual = ({ id, en, inverse = false }: { id: string, en: string, inverse?: boolean }) => (
        <span className="flex flex-col leading-tight">
            <span className={inverse ? "" : ""}>{id}</span>
            <span className={`text-[10px] italic underline font-normal opacity-80 ${inverse ? "text-slate-200" : "text-slate-500"}`}>
                {en}
            </span>
        </span>
    );

    // Helper for white text bilingual (for main totals)
    const BilingualWhite = ({ id, en }: { id: string, en: string }) => (
        <Bilingual id={id} en={en} inverse={true} />
    );



    return (
        <Card className="w-full shadow-md border-slate-200 dark:border-slate-800 overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 print:hidden">
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl sm:text-2xl text-slate-900 dark:text-white flex items-center gap-2">
                            <DollarSign className="w-6 h-6 text-primary" />
                            <div>
                                Laporan Laba Rugi
                                <span className="block text-sm font-normal text-slate-500 italic underline">Income Statement</span>
                            </div>
                        </CardTitle>
                        <CardDescription className="flex flex-col gap-1 mt-2">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {period ? (
                                    <>
                                        Periode: {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                                    </>
                                ) : (
                                    "Pilih periode untuk melihat laporan"
                                )}
                            </div>
                            {salesOrderName && (
                                <div className="flex items-center gap-2 text-primary font-medium">
                                    <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
                                        Project: {salesOrderName}
                                    </Badge>
                                </div>
                            )}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                        <IncomeStatementPDFButton
                            data={data}
                            period={period || { startDate: '', endDate: '' }}
                            logoSrc="/Logo.png"
                            salesOrderName={salesOrderName}
                        />
                        <Badge
                            variant={isProfitable ? "success" : "destructive"}
                            className="text-sm px-3 py-1.5 h-9"
                        >
                            {isProfitable ? (
                                <TrendingUp className="w-4 h-4 mr-1.5" />
                            ) : (
                                <TrendingDown className="w-4 h-4 mr-1.5" />
                            )}
                            {isProfitable ? 'Untung (Profitable)' : 'Rugi (Loss Making)'}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b-2 border-slate-200 dark:border-slate-800">
                                <TableHead className="w-[100px] pl-6 ring-slate-700 dark:text-slate-400">
                                    <div className="font-semibold text-slate-700 dark:text-slate-400">
                                        Kode <span className="text-[10px] block font-normal italic underline text-slate-500">Code</span>
                                    </div>
                                </TableHead>
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-400">
                                    <div>
                                        Nama Akun <span className="text-[10px] block font-normal italic underline text-slate-500">Account Name</span>
                                    </div>
                                </TableHead>
                                <TableHead className="text-right pr-6 font-semibold text-slate-700 dark:text-slate-400">
                                    <div>
                                        Jumlah <span className="text-[10px] block font-normal italic underline text-slate-500">Amount</span>
                                    </div>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* REVENUE SECTION */}
                            <SectionRow
                                title={<Bilingual id="PENDAPATAN" en="REVENUE" />}
                                total={0}
                                type="header"
                                trend="up"
                            />
                            <AccountRows accounts={data.revenue.accounts} />
                            <SectionRow
                                title={<Bilingual id="Total Pendapatan" en="Total Revenue" />}
                                total={data.revenue.total}
                                type="subtotal"
                            />

                            {/* COGS SECTION */}
                            <SectionRow
                                title={<Bilingual id="BEBAN POKOK PENJUALAN" en="COST OF GOODS SOLD" />}
                                total={0}
                                type="header"
                                trend="down"
                            />
                            <AccountRows accounts={data.cogs.accounts} />
                            <SectionRow
                                title={<Bilingual id="Total Beban Pokok Penjualan" en="Total COGS" />}
                                total={data.cogs.total}
                                type="subtotal"
                            />

                            {/* GROSS PROFIT */}
                            <SectionRow
                                title={<BilingualWhite id="LABA KOTOR" en="GROSS PROFIT" />}
                                total={data.grossProfit}
                                type="main-total"
                                trend={data.grossProfit > 0 ? 'up' : 'down'}
                            />

                            {/* SEPARATOR WITH GRADIENT */}
                            <TableRow>
                                <TableCell colSpan={3} className="h-6 bg-gradient-to-r from-transparent via-slate-100 to-transparent dark:via-slate-900"></TableCell>
                            </TableRow>

                            {/* EXPENSE SECTION */}
                            <SectionRow
                                title={<Bilingual id="BEBAN OPERASIONAL" en="OPERATING EXPENSES" />}
                                total={0}
                                type="header"
                                trend="down"
                            />
                            <AccountRows accounts={data.expenses.accounts} />
                            <SectionRow
                                title={<Bilingual id="Total Beban Operasional" en="Total Expenses" />}
                                total={data.expenses.total}
                                type="subtotal"
                            />

                            {/* NET PROFIT */}
                            <SectionRow
                                title={<BilingualWhite id="LABA BERSIH" en="NET PROFIT" />}
                                total={data.netProfit}
                                type="profit"
                                trend={data.netProfit > 0 ? 'up' : 'down'}
                            />
                        </TableBody>
                    </Table>
                </div>

                {/* SUMMARY FOOTER */}
                <div className="border-t border-slate-100 dark:border-slate-800 p-6 print:hidden">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                Margin Kotor
                                <span className="block text-[10px] italic underline text-slate-400">Gross Margin</span>
                            </p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                {data.revenue.total > 0
                                    ? `${((data.grossProfit / data.revenue.total) * 100).toFixed(1)}%`
                                    : "0%"
                                }
                            </p>
                            <p className="text-sm text-slate-500">
                                {formatCurrency(data.grossProfit)}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                Margin Operasional
                                <span className="block text-[10px] italic underline text-slate-400">Operating Margin</span>
                            </p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                {data.revenue.total > 0
                                    ? `${((data.netProfit / data.revenue.total) * 100).toFixed(1)}%`
                                    : "0%"
                                }
                            </p>
                            <p className="text-sm text-slate-500">
                                {formatCurrency(data.netProfit)}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                Rasio Beban
                                <span className="block text-[10px] italic underline text-slate-400">Expense Ratio</span>
                            </p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                {data.revenue.total > 0
                                    ? `${((data.expenses.total / data.revenue.total) * 100).toFixed(1)}%`
                                    : "0%"
                                }
                            </p>
                            <p className="text-sm text-slate-500">
                                {formatCurrency(data.expenses.total)}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}