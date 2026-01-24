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
import { Activity, TrendingUp, TrendingDown, DollarSign, Calendar, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface AccountData {
    id: string;
    code: string;
    name: string;
    amount: number;
}

interface ActivitySection {
    accounts: AccountData[];
    total: number;
}

interface OperatingSection {
    in: ActivitySection;
    out: ActivitySection;
    net: number;
    total: number;
}

export interface CashFlowData {
    operating: OperatingSection;
    investing: ActivitySection;
    financing: ActivitySection;
    beginningBalance: number;
    netChange: number;
    endingBalance: number;
}

interface CashFlowTableProps {
    data: CashFlowData | null;
    isLoading: boolean;
    period: {
        startDate: string;
        endDate: string;
    } | null;
}

export default function CashFlowTable({ data, isLoading, period }: CashFlowTableProps) {
    if (isLoading) {
        return (
            <Card className="w-full shadow-sm border-slate-200">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mb-4"></div>
                    <p className="text-lg font-medium text-slate-700">Menganalisis Arus Kas...</p>
                    <p className="text-sm text-slate-500 mt-1">Sedang memproses seluruh transaksi kas dan bank</p>
                </CardContent>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card className="w-full shadow-sm border-dashed border-slate-300">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Activity className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-lg font-semibold text-slate-700">Data Tidak Tersedia</p>
                    <p className="text-sm text-slate-500 mt-2 max-w-sm">
                        Pilih periode untuk melihat Laporan Arus Kas.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const Bilingual = ({ id, en, inverse = false }: { id: string, en: string, inverse?: boolean }) => (
        <span className="flex flex-col leading-tight">
            <span>{id}</span>
            <span className={`text-[10px] italic font-normal opacity-80 ${inverse ? "text-slate-200" : "text-slate-500"}`}>
                {en}
            </span>
        </span>
    );

    const SectionHeader = ({ id, en, icon: Icon, color }: { id: string, en: string, icon: any, color: string }) => (
        <TableRow className={`${color} border-t-2 border-slate-200 hover:bg-opacity-100 transition-colors`}>
            <TableCell colSpan={2} className="py-3 pl-6 font-bold text-slate-900">
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-600" />
                    <Bilingual id={id} en={en} />
                </div>
            </TableCell>
            <TableCell className="text-right py-3 pr-6 font-bold text-slate-900"></TableCell>
        </TableRow>
    );

    const SubSection = ({ id, en, isOutflow = false }: { id: string, en: string, isOutflow?: boolean }) => (
        <TableRow className="bg-slate-50/50 hover:bg-slate-50/80 transition-colors">
            <TableCell colSpan={3} className="py-2 pl-10 font-semibold text-slate-700 italic text-[13px]">
                <div className="flex items-center gap-2">
                    {isOutflow ? <ArrowDownCircle className="w-3 h-3 text-rose-500" /> : <ArrowUpCircle className="w-3 h-3 text-emerald-500" />}
                    <Bilingual id={id} en={en} />
                </div>
            </TableCell>
        </TableRow>
    );

    const AccountRows = ({ accounts }: { accounts: AccountData[] }) => (
        <>
            {accounts.map(acc => {
                const isOutflow = acc.amount < 0;
                return (
                    <TableRow key={acc.id} className="hover:bg-slate-50 transition-colors group">
                        <TableCell className="pl-14 text-slate-500 text-xs w-[120px]">{acc.code}</TableCell>
                        <TableCell className="text-slate-600 font-medium">
                            <div className="flex items-center gap-2">
                                {isOutflow ? (
                                    <ArrowDownCircle className="w-3 h-3 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                    <ArrowUpCircle className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                                {acc.name}
                            </div>
                        </TableCell>
                        <TableCell className={`text-right pr-6 font-semibold tabular-nums ${isOutflow ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {isOutflow ? `(${formatCurrency(Math.abs(acc.amount))})` : formatCurrency(acc.amount)}
                        </TableCell>
                    </TableRow>
                );
            })}
            {accounts.length === 0 && (
                <TableRow>
                    <TableCell colSpan={3} className="text-center py-4 text-slate-400 italic text-xs">
                        Tidak ada transaksi di kategori ini
                    </TableCell>
                </TableRow>
            )}
        </>
    );

    const TotalRow = ({ id, en, amount }: { id: string, en: string, amount: number }) => (
        <TableRow className="bg-slate-50/80 font-bold border-b border-slate-200 hover:bg-slate-100 transition-colors">
            <TableCell colSpan={2} className="pl-10 py-3 text-slate-900">
                <Bilingual id={id} en={en} />
            </TableCell>
            <TableCell className={`text-right pr-6 py-3 tabular-nums ${amount >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {amount < 0 ? `(${formatCurrency(Math.abs(amount))})` : formatCurrency(amount)}
            </TableCell>
        </TableRow>
    );

    const TotalNetRow = ({ id, en, amount }: { id: string, en: string, amount: number }) => (
        <TableRow className="bg-slate-100 font-bold hover:bg-slate-200 transition-colors">
            <TableCell colSpan={2} className="pl-6 py-3 text-slate-900">
                <Bilingual id={id} en={en} />
            </TableCell>
            <TableCell className={`text-right pr-6 py-3 tabular-nums ${amount >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {amount < 0 ? `(${formatCurrency(Math.abs(amount))})` : formatCurrency(amount)}
            </TableCell>
        </TableRow>
    );

    return (
        <Card className="w-full shadow-md border-slate-200 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <CardTitle className="text-2xl text-slate-900 flex items-center gap-2">
                            <Activity className="w-6 h-6 text-cyan-600" />
                            <div>
                                Laporan Arus Kas
                                <span className="block text-sm font-normal text-slate-500 italic underline">Cash Flow Statement (Direct Method)</span>
                            </div>
                        </CardTitle>
                        <CardDescription className="mt-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Periode: {new Date(period?.startDate || "").toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} - {new Date(period?.endDate || "").toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant={data.netChange >= 0 ? "success" : "destructive"} className="px-3 py-1">
                            {data.netChange >= 0 ? <TrendingUp className="w-4 h-4 mr-1.5" /> : <TrendingDown className="w-4 h-4 mr-1.5" />}
                            {data.netChange >= 0 ? "Kenaikan Kas Bersih" : "Penurunan Kas Bersih"}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-100/50">
                            <TableHead className="pl-6 w-[150px]">KODE</TableHead>
                            <TableHead>KETERANGAN / AKUN</TableHead>
                            <TableHead className="text-right pr-6">JUMLAH (IDR)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* OPERATING ACTIVITIES */}
                        <SectionHeader
                            id="ARUS KAS DARI AKTIVITAS OPERASI"
                            en="CASH FLOWS FROM OPERATING ACTIVITIES"
                            icon={Activity}
                            color="bg-emerald-50/50"
                        />
                        <SubSection id="Penerimaan Kas (Inflows)" en="Cash Receipts" />
                        <AccountRows accounts={data.operating.in.accounts} />
                        <TotalRow id="Sub-total Penerimaan Operasi" en="Total Operating Receipts" amount={data.operating.in.total} />

                        <SubSection id="Pengeluaran Kas (Outflows)" en="Cash Payments" isOutflow />
                        <AccountRows accounts={data.operating.out.accounts} />
                        <TotalRow id="Sub-total Pengeluaran Operasi" en="Total Operating Payments" amount={data.operating.out.total} />

                        <TotalNetRow
                            id="Arus Kas Bersih dari Aktivitas Operasi"
                            en="Net Cash from Operating Activities"
                            amount={data.operating.net}
                        />

                        {/* INVESTING ACTIVITIES */}
                        <SectionHeader
                            id="ARUS KAS DARI AKTIVITAS INVESTASI"
                            en="CASH FLOWS FROM INVESTING ACTIVITIES"
                            icon={TrendingUp}
                            color="bg-blue-50/50"
                        />
                        <AccountRows accounts={data.investing.accounts} />
                        <TotalNetRow
                            id="Arus Kas Bersih dari Aktivitas Investasi"
                            en="Net Cash from Investing Activities"
                            amount={data.investing.total}
                        />

                        {/* FINANCING ACTIVITIES */}
                        <SectionHeader
                            id="ARUS KAS DARI AKTIVITAS PENDANAAN"
                            en="CASH FLOWS FROM FINANCING ACTIVITIES"
                            icon={DollarSign}
                            color="bg-purple-50/50"
                        />
                        <AccountRows accounts={data.financing.accounts} />
                        <TotalNetRow
                            id="Arus Kas Bersih dari Aktivitas Pendanaan"
                            en="Net Cash from Financing Activities"
                            amount={data.financing.total}
                        />

                        {/* SUMMARY SECTION */}
                        <TableRow className="bg-slate-800 text-white hover:bg-slate-900 transition-colors">
                            <TableCell colSpan={2} className="py-5 pl-6 font-bold text-base">
                                <BilingualWhite id="KENAIKAN / (PENURUNAN) KAS BERSIH" en="NET INCREASE / (DECREASE) IN CASH" />
                            </TableCell>
                            <TableCell className={`text-right pr-6 py-5 font-bold text-base tabular-nums ${data.netChange < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                                {data.netChange < 0 ? `(${formatCurrency(Math.abs(data.netChange))})` : formatCurrency(data.netChange)}
                            </TableCell>
                        </TableRow>
                        <TableRow className="bg-slate-50 hover:bg-slate-100 transition-colors border-t border-slate-200">
                            <TableCell colSpan={2} className="py-3 pl-6 font-semibold text-slate-700">
                                <Bilingual id="Saldo Kas Awal Periode" en="Cash Balance at Beginning of Period" />
                            </TableCell>
                            <TableCell className="text-right pr-6 py-3 font-semibold tabular-nums text-slate-900">
                                {formatCurrency(data.beginningBalance)}
                            </TableCell>
                        </TableRow>
                        <TableRow className="bg-cyan-600 text-white hover:bg-cyan-700 transition-colors">
                            <TableCell colSpan={2} className="py-5 pl-6 font-black text-xl">
                                <BilingualWhite id="SALDO KAS AKHIR PERIODE" en="CASH BALANCE AT END OF PERIOD" />
                            </TableCell>
                            <TableCell className="text-right pr-6 py-5 font-black text-xl tabular-nums">
                                {formatCurrency(data.endingBalance)}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

const BilingualWhite = ({ id, en }: { id: string, en: string }) => (
    <span className="flex flex-col leading-tight">
        <span>{id}</span>
        <span className="text-[10px] italic font-normal text-slate-100 opacity-80">
            {en}
        </span>
    </span>
);
