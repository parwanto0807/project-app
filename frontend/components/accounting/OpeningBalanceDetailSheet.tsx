import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OpeningBalance } from "@/types/openingBalance";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
    Calendar,
    FileText,
    CheckCircle2,
    AlertCircle,
    Wallet,
    Download
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OpeningBalanceDetailSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: OpeningBalance | null;
}

export const OpeningBalanceDetailSheet = ({
    open,
    onOpenChange,
    data
}: OpeningBalanceDetailSheetProps) => {
    if (!data) return null;

    const totalDebit = data.details?.reduce((sum, d) => sum + (Number(d.debit) || 0), 0) || 0;
    const totalCredit = data.details?.reduce((sum, d) => sum + (Number(d.credit) || 0), 0) || 0;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-[90vw] sm:max-w-[800px] p-0 flex flex-col gap-0 border-l border-slate-200">
                <SheetHeader className="p-6 bg-slate-50 border-b shrink-0">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-xl flex items-center gap-3 text-slate-800">
                            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                <Wallet className="h-5 w-5" />
                            </div>
                            Detail Saldo Awal
                        </SheetTitle>
                        <Badge variant="outline" className={cn(
                            "px-3 py-1 text-xs font-semibold uppercase tracking-wider",
                            data.isPosted
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                        )}>
                            {data.isPosted ? (
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Posted
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5">
                                    <AlertCircle className="h-3.5 w-3.5" /> Draft
                                </span>
                            )}
                        </Badge>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-hidden bg-white flex flex-col">
                    <div className="p-6 bg-slate-50/50 border-b space-y-4">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase tracking-wider">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Tanggal Saldo (As Of)
                                </div>
                                <p className="text-lg font-semibold text-slate-900">
                                    {format(new Date(data.asOfDate), "dd MMMM yyyy", { locale: id })}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase tracking-wider">
                                    <FileText className="h-3.5 w-3.5" />
                                    Keterangan
                                </div>
                                <p className="text-sm font-medium text-slate-700">
                                    {data.description || "-"}
                                </p>
                            </div>
                        </div>

                        {data.isPosted && data.postedAt && (
                            <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 flex items-center gap-3 text-xs text-emerald-800">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                <div>
                                    Diposting pada <span className="font-semibold">{format(new Date(data.postedAt), "dd MMM yyyy HH:mm", { locale: id })}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-hidden flex flex-col">
                        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-100/80 border-b text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            <div className="col-span-6">Akun (COA)</div>
                            <div className="col-span-3 text-right">Debit</div>
                            <div className="col-span-3 text-right">Kredit</div>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="divide-y divide-slate-100">
                                {data.details?.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors text-sm">
                                        <div className="col-span-6">
                                            <div className="flex items-start gap-3">
                                                <span className="font-mono text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded text-xs">
                                                    {item.account?.code}
                                                </span>
                                                <span className="text-slate-700 font-medium">
                                                    {item.account?.name}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="col-span-3 text-right font-medium text-slate-900">
                                            {item.debit > 0 ? formatCurrency(item.debit) : "-"}
                                        </div>
                                        <div className="col-span-3 text-right font-medium text-slate-900">
                                            {item.credit > 0 ? formatCurrency(item.credit) : "-"}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-t font-bold text-sm">
                            <div className="col-span-6 text-slate-600 text-xs uppercase tracking-wider flex items-center">Total Balance</div>
                            <div className="col-span-3 text-right text-slate-900">{formatCurrency(totalDebit)}</div>
                            <div className="col-span-3 text-right text-slate-900">{formatCurrency(totalCredit)}</div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t bg-white shrink-0 flex justify-end gap-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Tutup
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
};
