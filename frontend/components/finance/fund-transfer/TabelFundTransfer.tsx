"use client";

import React, { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, ArrowRight, FileText, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { formatCurrencyNumber } from "@/lib/utils";
import { FundTransfer } from "@/types/finance/fundTransfer";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TabelFundTransferProps {
    data: FundTransfer[];
    isLoading: boolean;
    onView: (transfer: FundTransfer) => void;
    onVoid: (transfer: FundTransfer) => void;
}

const TabelFundTransfer = ({ data, isLoading, onView, onVoid }: TabelFundTransferProps) => {
    if (isLoading) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mb-2 opacity-20" />
                    <p>Belum ada data transfer dana.</p>
                </CardContent>
            </Card>
        );
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'POSTED':
                return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Posted
                </Badge>;
            case 'VOIDED':
                return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                    <XCircle className="w-3 h-3 mr-1" /> Voided
                </Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="rounded-md border bg-white overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                        <TableHead className="w-[180px]">No. Transfer</TableHead>
                        <TableHead className="w-[120px]">Tanggal</TableHead>
                        <TableHead>Deskripsi Akun</TableHead>
                        <TableHead className="text-right">Nominal</TableHead>
                        <TableHead className="text-center w-[120px]">Status</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((transfer) => (
                        <TableRow key={transfer.id} className="hover:bg-slate-50/50 transition-colors">
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-900">{transfer.transferNo}</span>
                                    {transfer.referenceNo && (
                                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Ref: {transfer.referenceNo}</span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-sm">
                                {format(new Date(transfer.transferDate), "dd MMM yyyy")}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col max-w-[180px]">
                                        <span className="text-xs font-semibold text-slate-600 truncate">DARI :</span>
                                        <span className="text-sm font-medium truncate">{transfer.fromAccount?.name}</span>
                                        <span className="text-[10px] text-slate-400">{transfer.fromAccount?.code}</span>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
                                    <div className="flex flex-col max-w-[180px]">
                                        <span className="text-xs font-semibold text-slate-600 truncate">KE :</span>
                                        <span className="text-sm font-medium truncate">{transfer.toAccount?.name}</span>
                                        <span className="text-[10px] text-slate-400">{transfer.toAccount?.code}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-900">
                                        {formatCurrencyNumber(Number(transfer.totalAmount))}
                                    </span>
                                    {Number(transfer.feeAmount) > 0 && (
                                        <span className="text-[10px] text-rose-500 font-medium">
                                            Inc. Fee: {formatCurrencyNumber(Number(transfer.feeAmount))}
                                        </span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                                {getStatusBadge(transfer.status)}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 transition-all hover:scale-110 active:scale-95 shadow-sm"
                                                    onClick={() => onView(transfer)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-white text-indigo-900 border-indigo-100">Lihat Detail</TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100 transition-all hover:scale-110 active:scale-95 shadow-sm"
                                                >
                                                    <FileText className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-white text-slate-900 border-slate-100">Cetak Kwitansi</TooltipContent>
                                        </Tooltip>

                                        {transfer.status === 'POSTED' && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 transition-all hover:scale-110 active:scale-95 shadow-sm"
                                                        onClick={() => onVoid(transfer)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-white text-rose-900 border-rose-100">Void Transaksi</TooltipContent>
                                            </Tooltip>
                                        )}
                                    </TooltipProvider>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default TabelFundTransfer;
