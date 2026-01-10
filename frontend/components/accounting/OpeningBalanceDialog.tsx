"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetDescription,
} from "@/components/ui/sheet";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Trash2,
    Calculator,
    AlertTriangle,
    CheckCircle2,
    Search,
    Wallet,
    Info
} from "lucide-react";
import {
    OpeningBalanceSchema,
    OpeningBalanceFormValues
} from "@/schemas/accounting/openingBalance";
import { OpeningBalance } from "@/types/openingBalance";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { coaApi } from "@/lib/action/coa/coa";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface OpeningBalanceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: OpeningBalanceFormValues) => void;
    initialData?: OpeningBalance | null;
    isSubmitting: boolean;
}

export const OpeningBalanceDialog = ({
    open,
    onOpenChange,
    onSubmit,
    initialData,
    isSubmitting,
}: OpeningBalanceDialogProps) => {
    const [coaList, setCoaList] = useState<any[]>([]);
    const [isLoadingCoa, setIsLoadingCoa] = useState(false);

    const form = useForm<OpeningBalanceFormValues>({
        resolver: zodResolver(OpeningBalanceSchema),
        defaultValues: {
            asOfDate: new Date().toISOString().split("T")[0],
            description: "",
            details: [{ accountId: "", debit: 0, credit: 0 }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "details",
    });

    useEffect(() => {
        if (open) {
            fetchCoa();
            if (initialData) {
                form.reset({
                    asOfDate: new Date(initialData.asOfDate).toISOString().split("T")[0],
                    description: initialData.description,
                    details: initialData.details?.map(d => ({
                        accountId: d.accountId,
                        debit: Number(d.debit),
                        credit: Number(d.credit)
                    })) || [],
                });
            } else {
                form.reset({
                    asOfDate: new Date().toISOString().split("T")[0],
                    description: "",
                    details: [{ accountId: "", debit: 0, credit: 0 }],
                });
            }
        }
    }, [open, initialData, form]);

    const fetchCoa = async () => {
        setIsLoadingCoa(true);
        try {
            const data = await coaApi.getCOAs({
                limit: 1000,
                status: "ACTIVE" as any,
                postingType: "POSTING" as any
            });
            // Filter only posting accounts if needed, but for now take all
            setCoaList(data.data || []);
        } catch (error) {
            toast.error("Gagal memuat daftar akun");
        } finally {
            setIsLoadingCoa(false);
        }
    };

    const totals = form.watch("details").reduce(
        (acc, curr) => ({
            debit: acc.debit + (Number(curr.debit) || 0),
            credit: acc.credit + (Number(curr.credit) || 0),
        }),
        { debit: 0, credit: 0 }
    );

    const diff = Math.abs(totals.debit - totals.credit);
    const isBalanced = diff < 0.01;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-[90vw] sm:max-w-[1000px] p-0 flex flex-col gap-0 border-l border-slate-200">
                <SheetHeader className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shrink-0">
                    <SheetTitle className="text-2xl flex items-center gap-3 text-white">
                        <Wallet className="h-6 w-6" />
                        {initialData ? "Edit Saldo Awal" : "Tambah Saldo Awal Baru"}
                    </SheetTitle>
                    <SheetDescription className="text-blue-100 font-medium">
                        Masukkan saldo awal akun per tanggal tertentu untuk Go-Live sistem.
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => onSubmit(data as OpeningBalanceFormValues))} className="flex flex-col flex-1 overflow-hidden bg-slate-50">
                        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                            {/* General Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                                <FormField<OpeningBalanceFormValues>
                                    control={form.control}
                                    name="asOfDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-600 font-semibold">Tanggal (As Of)</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} value={field.value as string} className="rounded-lg border-slate-200 focus:ring-blue-500" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField<OpeningBalanceFormValues>
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-600 font-semibold">Keterangan / Memo</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Contoh: Saldo Awal Go-Live Januari 2024" {...field} value={field.value as string} className="rounded-lg border-slate-200 focus:ring-blue-500" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Details Table */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <Calculator className="h-4 w-4 text-blue-500" />
                                        Rincian Saldo Akun
                                    </h3>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => append({ accountId: "", debit: 0, credit: 0 })}
                                        className="rounded-full bg-white border-blue-200 text-blue-600 hover:bg-blue-50"
                                    >
                                        <Plus className="h-3.5 w-3.5 mr-1" />
                                        Tambah Baris
                                    </Button>
                                </div>

                                <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
                                    <div className="grid grid-cols-12 gap-2 p-3 bg-slate-100 border-b text-[10px] uppercase tracking-wider font-bold text-slate-500">
                                        <div className="col-span-6">Nama Akun (COA)</div>
                                        <div className="col-span-2 text-right">Debit</div>
                                        <div className="col-span-2 text-right">Kredit</div>
                                        <div className="col-span-2 text-center">Aksi</div>
                                    </div>
                                    <ScrollArea className="h-[400px]">
                                        <div className="divide-y relative">
                                            {fields.map((item, index) => (
                                                <div key={item.id} className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-slate-50 transition-colors">
                                                    <div className="col-span-6">
                                                        <FormField<OpeningBalanceFormValues>
                                                            control={form.control}
                                                            name={`details.${index}.accountId`}
                                                            render={({ field }) => (
                                                                <FormItem className="space-y-0">
                                                                    <Select onValueChange={field.onChange} value={field.value as string}>
                                                                        <FormControl>
                                                                            <SelectTrigger className="h-9 text-xs border-slate-200 bg-white">
                                                                                <SelectValue placeholder="Pilih Akun..." />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent className="max-h-[300px]">
                                                                            {coaList.map((coa) => (
                                                                                <SelectItem key={coa.id} value={coa.id} className="text-xs">
                                                                                    <span className="font-mono text-blue-600 mr-2">{coa.code}</span>
                                                                                    {coa.name}
                                                                                    {coa.bankAccount && coa.bankAccount.length > 0 && (
                                                                                        <span className="ml-2 text-slate-500 font-medium">
                                                                                            [{coa.bankAccount[0].bankName} - {coa.bankAccount[0].accountNumber}]
                                                                                        </span>
                                                                                    )}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <FormField<OpeningBalanceFormValues>
                                                            control={form.control}
                                                            name={`details.${index}.debit`}
                                                            render={({ field }) => (
                                                                <FormItem className="space-y-0 text-right">
                                                                    <FormControl>
                                                                        <Input
                                                                            type="number"
                                                                            value={field.value as number}
                                                                            className="h-9 text-xs text-right border-slate-200"
                                                                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <FormField<OpeningBalanceFormValues>
                                                            control={form.control}
                                                            name={`details.${index}.credit`}
                                                            render={({ field }) => (
                                                                <FormItem className="space-y-0 text-right">
                                                                    <FormControl>
                                                                        <Input
                                                                            type="number"
                                                                            value={field.value as number}
                                                                            className="h-9 text-xs text-right border-slate-200"
                                                                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                    <div className="col-span-2 flex justify-center">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => remove(index)}
                                                            disabled={fields.length <= 1}
                                                            className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>

                                    {/* Footer Summary */}
                                    <div className="grid grid-cols-12 gap-2 p-4 bg-slate-50 border-t font-bold text-xs uppercase">
                                        <div className="col-span-6 flex items-center gap-2">
                                            Total Saldo
                                            {!isBalanced && (
                                                <Badge variant="destructive" className="ml-2 text-[8px] px-1 animate-pulse">
                                                    Tidak Seimbang
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="col-span-2 text-right text-blue-700">{formatCurrency(totals.debit)}</div>
                                        <div className="col-span-2 text-right text-indigo-700">{formatCurrency(totals.credit)}</div>
                                        <div className="col-span-2"></div>
                                    </div>
                                </div>

                                {/* Balance Check Alert */}
                                {!isBalanced ? (
                                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs">
                                        <AlertTriangle className="h-5 w-5 shrink-0" />
                                        <div className="space-y-1">
                                            <p className="font-bold">Jurnal Tidak Seimbang!</p>
                                            <p className="opacity-80">
                                                Total Debit dan Kredit harus sama. Selisih saat ini:
                                                <span className="font-mono bg-red-100 px-1.5 py-0.5 rounded ml-1">
                                                    {formatCurrency(diff)}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
                                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                                        <p className="font-bold">Jurnal Seimbang. Siap untuk dipublikasikan sebagai Draft.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <SheetFooter className="p-6 bg-white border-t rounded-none shrink-0 sm:justify-between">
                            <div className="flex items-center gap-1.5 text-slate-500 text-[10px] italic">
                                <Info className="h-3 w-3" />
                                Saldo yang disimpan akan berstatus Draft sebelum diposting.
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    className="rounded-lg px-6"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || !isBalanced}
                                    className="rounded-lg px-8 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200"
                                >
                                    {isSubmitting ? "Menyimpan..." : initialData ? "Simpan Perubahan" : "Simpan Draft Saldo"}
                                </Button>
                            </div>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
};
