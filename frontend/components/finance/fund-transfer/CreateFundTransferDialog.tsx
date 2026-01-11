"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Landmark, Wallet, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { fundTransferSchema, FundTransferFormValues } from "@/lib/validations/fundTransfer";
import { coaApi } from "@/lib/action/coa/coa";
import { CoaType, CoaPostingType } from "@/types/coa";
import { toast } from "sonner";
import { createFundTransfer } from "@/lib/action/fundTransfer";
import { getBankAccounts } from "@/lib/action/master/bank/bank";
import { BankAccount } from "@/schemas/bank/index";
import { formatCurrencyNumber } from "@/lib/utils";
import { getSystemAccounts } from "@/lib/action/systemAccount";

interface CreateFundTransferDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const CreateFundTransferDialog = ({ open, onOpenChange, onSuccess }: CreateFundTransferDialogProps) => {
    const [loading, setLoading] = useState(false);
    const [banks, setBanks] = useState<BankAccount[]>([]);
    const [expenseAccounts, setExpenseAccounts] = useState<any[]>([]);

    const form = useForm<FundTransferFormValues>({
        resolver: zodResolver(fundTransferSchema),
        defaultValues: {
            transferDate: new Date(),
            amount: 0,
            feeAmount: 0,
            fromAccountId: "",
            toAccountId: "",
            feeAccountId: "",
            referenceNo: "",
            notes: "",
        },
    });

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                // Fetch from BankAccount model for Source & Destination
                const bankAccounts = await getBankAccounts();
                setBanks(bankAccounts.filter(b => b.isActive));

                // Fetch from COA for Admin Fee (Expense)
                const coaResponse = await coaApi.getCOAs({ limit: 1000 });
                if (coaResponse.success) {
                    const expAccts = coaResponse.data.filter(coa =>
                        coa.type === CoaType.BEBAN && coa.postingType === CoaPostingType.POSTING
                    );
                    setExpenseAccounts(expAccts);

                    // Auto-fill from SystemAccount mapping
                    const sysResponse = await getSystemAccounts();
                    if (sysResponse.success) {
                        const adminFeeMapping = sysResponse.data.find((sa: any) => sa.key === "PAYMENT_BANK_CHARGE_EXPENSE");
                        if (adminFeeMapping) {
                            form.setValue("feeAccountId", adminFeeMapping.coaId);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch accounts", error);
            }
        };

        if (open) {
            fetchAccounts();
            form.reset({
                transferDate: new Date(),
                amount: 0,
                feeAmount: 0,
                fromAccountId: "",
                toAccountId: "",
                feeAccountId: "",
                referenceNo: "",
                notes: "",
            });
        }
    }, [open, form]);

    const onSubmit = async (values: FundTransferFormValues) => {
        setLoading(true);
        try {
            const fromBank = banks.find(b => b.id === values.fromAccountId);
            const toBank = banks.find(b => b.id === values.toAccountId);

            if (!fromBank?.accountCOAId || !toBank?.accountCOAId) {
                toast.error("Akun bank yang dipilih belum dipetakan ke COA.");
                setLoading(false);
                return;
            }

            const result = await createFundTransfer({
                ...values,
                fromAccountId: fromBank.accountCOAId, // Kirim COA ID ke backend
                toAccountId: toBank.accountCOAId,     // Kirim COA ID ke backend
                transferDate: values.transferDate.toISOString(),
                fromAccountName: `${fromBank.bankName} (${fromBank.accountNumber})`,
                toAccountName: `${toBank.bankName} (${toBank.accountNumber})`,
            });

            if (result.success) {
                toast.success("Transfer berhasil diproses dan diposting ke GL");
                onSuccess();
                onOpenChange(false);
            } else {
                toast.error(result.message || "Gagal memproses transfer");
            }
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan sistem");
        } finally {
            setLoading(false);
        }
    };

    const amount = form.watch("amount") || 0;
    const feeAmount = form.watch("feeAmount") || 0;
    const referenceNo = form.watch("referenceNo");
    const fromAccountId = form.watch("fromAccountId");
    const toAccountId = form.watch("toAccountId");

    const totalAmount = Number(amount) + Number(feeAmount);

    // Validation for button disable
    const isFormInvalid =
        Number(amount) <= 0 ||
        !referenceNo ||
        referenceNo.trim() === "" ||
        !fromAccountId ||
        !toAccountId ||
        fromAccountId === toAccountId;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                <DialogHeader className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Landmark className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">New Fund Transfer</DialogTitle>
                            <DialogDescription className="text-indigo-100/80">
                                Kirim dana antar akun internal (Kas/Bank)
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6 bg-slate-50/50">
                        <div className="grid grid-cols-2 gap-6">
                            {/* Row 1: Date & Ref */}
                            <FormField
                                control={form.control}
                                name="transferDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal Transfer</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal h-11 rounded-xl border-slate-200 bg-white",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 rounded-xl overflow-hidden shadow-xl border-none" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="referenceNo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider">No. Referensi (Opsional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. TR-2024-X" {...field} className="h-11 rounded-xl border-slate-200 bg-white focus:ring-indigo-500" />
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />

                            {/* Row 2: Accounts */}
                            <FormField
                                control={form.control}
                                name="fromAccountId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dari Akun (Sumber)</FormLabel>
                                        <Select
                                            onValueChange={(val) => {
                                                if (val === form.getValues("toAccountId")) {
                                                    toast.error("Akun sumber tidak boleh sama dengan akun tujuan", {
                                                        position: "top-center",
                                                        style: { background: "#ef4444", color: "#fff", border: "none" }
                                                    });
                                                    form.setValue("fromAccountId", "");
                                                    return;
                                                }
                                                field.onChange(val);
                                            }}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white focus:ring-indigo-500">
                                                    <SelectValue placeholder="Pilih akun asal" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="max-h-80 rounded-xl shadow-xl border-none">
                                                {banks.map((bank) => (
                                                    <SelectItem key={bank.id} value={bank.id} className="py-3">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900">{bank.bankName}</span>
                                                            <span className="text-xs text-slate-500">{bank.accountNumber} - {bank.branch}</span>
                                                            <span className="text-[10px] font-bold text-emerald-600 mt-1">
                                                                Saldo: {formatCurrencyNumber(bank.currentBalance)}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="toAccountId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ke Akun (Tujuan)</FormLabel>
                                        <Select
                                            onValueChange={(val) => {
                                                if (val === form.getValues("fromAccountId")) {
                                                    toast.error("Akun tujuan tidak boleh sama dengan akun sumber", {
                                                        position: "top-center",
                                                        style: { background: "#ef4444", color: "#fff", border: "none" }
                                                    });
                                                    form.setValue("toAccountId", "");
                                                    return;
                                                }
                                                field.onChange(val);
                                            }}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white focus:ring-indigo-500">
                                                    <SelectValue placeholder="Pilih akun tujuan" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="max-h-80 rounded-xl shadow-xl border-none">
                                                {banks.map((bank) => (
                                                    <SelectItem key={bank.id} value={bank.id} className="py-3">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900">{bank.bankName}</span>
                                                            <span className="text-xs text-slate-500">{bank.accountNumber} - {bank.branch}</span>
                                                            <span className="text-[10px] font-bold text-emerald-600 mt-1">
                                                                Saldo: {formatCurrencyNumber(bank.currentBalance)}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />

                            {/* Row 3: Amount & Fee */}
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nominal Transfer</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input type="number" placeholder="0.00" {...field} className="h-11 pl-10 rounded-xl border-slate-200 bg-white font-bold text-lg" />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="feeAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Biaya Admin (Opsional)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="0.00" {...field} className="h-11 rounded-xl border-slate-200 bg-white" />
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />

                            {/* Row 4: Fee Account (Conditional) */}
                            {feeAmount > 0 && (
                                <FormField
                                    control={form.control}
                                    name="feeAccountId"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel className="text-xs font-semibold text-rose-500 uppercase tracking-wider flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" /> Akun Biaya Admin
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11 rounded-xl border-rose-200 bg-rose-50/30 focus:ring-rose-500">
                                                        <SelectValue placeholder="Pilih akun beban admin" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl shadow-xl border-none">
                                                    {expenseAccounts.map((acc) => (
                                                        <SelectItem key={acc.id} value={acc.id}>
                                                            {acc.code} - {acc.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-[10px]" />
                                            <p className="text-[10px] text-slate-500 italic mt-1">Akun ini akan didebit untuk mencatat beban biaya admin bank.</p>
                                        </FormItem>
                                    )}
                                />
                            )}

                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Keterangan</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Tambahkan detail transaksi..."
                                                className="resize-none rounded-xl border-slate-200 bg-white h-24"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Summary Section */}
                        <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50">
                            <div className="flex justify-between items-center text-sm font-medium text-indigo-900/60 mb-2">
                                <span>Total yang didebit dari akun asal:</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <div className="flex items-center gap-2 text-indigo-700">
                                    <Info className="h-4 w-4" />
                                    <span className="text-xs italic leading-tight">Mencakup nominal transfer + biaya admin.</span>
                                </div>
                                <span className="text-2xl font-black text-indigo-600">
                                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(totalAmount)}
                                </span>
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="rounded-xl h-12 px-6"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading || isFormInvalid}
                                className="rounded-xl h-12 px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all font-bold group"
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Proses & Posting Jurnal
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateFundTransferDialog;
