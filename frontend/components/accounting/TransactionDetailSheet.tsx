"use client";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
    Calendar,
    FileText,
    Search,
    Loader2,
    Hash,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useMemo } from "react";
import { getGeneralLedgerPostings } from "@/lib/action/accounting/ledger";
import { LedgerLine } from "@/schemas/accounting/ledger";
import { Input } from "@/components/ui/input";

interface TransactionDetailSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    coaId?: string;
    coaName?: string;
    coaCode?: string;
    date?: string; // ISO String from summary
    periodId?: string;
}

export const TransactionDetailSheet = ({
    open,
    onOpenChange,
    coaId,
    coaName,
    coaCode,
    date,
    periodId
}: TransactionDetailSheetProps) => {
    const [lines, setLines] = useState<LedgerLine[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [expandedJournals, setExpandedJournals] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchLines = async () => {
            if (!open || !coaId || !date) return;

            setIsLoading(true);
            try {
                // IMPORTANT: Pass the raw ISO date string to match exactly with the summary's daily grouping
                const response = await getGeneralLedgerPostings({
                    coaId,
                    startDate: date, // Raw ISO string from DB (normalized day start)
                    endDate: date,
                    periodId,
                    limit: 300
                });

                if (response.success) {
                    setLines(response.data as any);
                }
            } catch (error) {
                console.error("Error fetching transactions:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLines();
        if (open) {
            setSearch("");
            setExpandedJournals({});
        }
    }, [open, coaId, date, periodId]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const filteredLines = useMemo(() => {
        return lines.filter(line =>
            line.ledger?.ledgerNumber.toLowerCase().includes(search.toLowerCase()) ||
            line.description?.toLowerCase().includes(search.toLowerCase()) ||
            line.ledger?.description.toLowerCase().includes(search.toLowerCase()) ||
            line.reference?.toLowerCase().includes(search.toLowerCase())
        );
    }, [lines, search]);

    const toggleJournal = (id: string) => {
        setExpandedJournals(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-[95vw] sm:max-w-[1000px] h-full p-0 flex flex-col gap-0 border-l border-slate-200">
                <SheetHeader className="p-6 bg-slate-50 border-b shrink-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <SheetTitle className="text-xl flex items-center gap-3 text-slate-800">
                                <div className="p-2 rounded-lg bg-blue-600 text-white">
                                    <Hash className="h-5 w-5" />
                                </div>
                                Transaksi Buku Besar: <span className="text-blue-600 ml-1">{coaCode}</span>
                            </SheetTitle>
                            <p className="text-sm text-slate-500 flex items-center gap-2">
                                <span className="font-medium text-slate-700">{coaName}</span>
                            </p>
                        </div>
                        {date && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-sm font-medium text-slate-700 shadow-sm">
                                <Calendar className="h-4 w-4 text-blue-500" />
                                {format(new Date(date), "dd MMMM yyyy", { locale: id })}
                            </div>
                        )}
                    </div>
                </SheetHeader>

                <div className="p-4 bg-white border-b shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Cari nomor jurnal, referensi, atau deskripsi..."
                            className="pl-10 h-10 border-slate-200 focus-visible:ring-blue-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-hidden bg-slate-50/30 flex flex-col">
                    <ScrollArea className="flex-1 h-full h-px">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                                <p className="text-sm text-slate-500 font-medium">Memuat data transaksi...</p>
                            </div>
                        ) : filteredLines.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="p-4 rounded-full bg-slate-100 mb-4">
                                    <FileText className="h-8 w-8 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-800 mb-1">Tidak Ada Transaksi</h3>
                                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                                    Tidak ditemukan transaksi POSTED untuk filter yang dipilih pada tanggal ini.
                                </p>
                            </div>
                        ) : (
                            <div className="p-4 space-y-4">
                                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-xs text-blue-700 font-medium mb-4 flex justify-between items-center">
                                    <span>Menampilkan {filteredLines.length} baris transaksi.</span>
                                    <Badge variant="outline" className="bg-white text-emerald-700 border-emerald-200 font-bold p-0 px-2 h-5 text-[10px]">VERIFIED POSTED</Badge>
                                </div>

                                {filteredLines.map((line, idx) => (
                                    <div key={`${line.id}-${idx}`} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:border-blue-200 transition-colors">
                                        <div className="p-4 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline" className="font-mono text-blue-700 bg-white border-blue-200 py-1">
                                                    {line.ledger?.ledgerNumber}
                                                </Badge>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Referensi</span>
                                                    <span className="text-xs text-slate-700 font-medium">{line.reference || line.ledger?.referenceNumber || "-"}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Nilai Posting</div>
                                                    <div className={cn(
                                                        "text-sm font-bold font-mono",
                                                        line.debitAmount > 0 ? "text-emerald-600" : "text-rose-600"
                                                    )}>
                                                        {line.debitAmount > 0 ? `+${formatCurrency(line.debitAmount)}` : `-${formatCurrency(line.creditAmount)}`}
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleJournal(line.id)}
                                                    className="h-8 w-8 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600"
                                                >
                                                    {expandedJournals[line.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="p-4">
                                            <div className="text-sm text-slate-800 font-medium italic mb-1">
                                                {line.description || line.ledger?.description}
                                            </div>

                                            {expandedJournals[line.id] && (
                                                <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Rincian Jurnal Lengkap</p>
                                                    <div className="rounded-lg border border-slate-100 overflow-hidden text-[11px]">
                                                        <table className="w-full">
                                                            <thead>
                                                                <tr className="bg-slate-50 border-b">
                                                                    <th className="text-left py-2 px-3 font-bold text-slate-500">AKUN</th>
                                                                    <th className="text-right py-2 px-3 font-bold text-slate-500">DEBIT</th>
                                                                    <th className="text-right py-2 px-3 font-bold text-slate-500">KREDIT</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y">
                                                                {line.ledger?.ledgerLines?.map((jl: any, idx: number) => (
                                                                    <tr key={idx} className={cn(jl.id === line.id ? "bg-blue-50/70" : "opacity-75")}>
                                                                        <td className="py-2 px-3 flex items-center gap-2">
                                                                            <span className="font-bold">{jl.coa?.code}</span>
                                                                            <span className="text-slate-500 truncate">{jl.coa?.name}</span>
                                                                        </td>
                                                                        <td className="py-2 px-3 text-right font-mono">{jl.debitAmount > 0 ? formatCurrency(jl.debitAmount) : "-"}</td>
                                                                        <td className="py-2 px-3 text-right font-mono">{jl.creditAmount > 0 ? formatCurrency(jl.creditAmount) : "-"}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                <div className="p-4 border-t bg-white shrink-0 flex justify-end gap-3">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Tutup</Button>
                </div>
            </SheetContent>
        </Sheet>
    );
};
