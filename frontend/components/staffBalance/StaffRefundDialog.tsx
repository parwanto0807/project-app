"use client";

import React, { useEffect, useState } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Wallet, Calendar, FileText, ArrowRightLeft, Loader2, Building } from "lucide-react";
import { StaffRefundSchema, StaffRefundFormValues } from "@/schemas/accounting/staffRefund";
import { processStaffRefundAction } from "@/lib/action/staffBalance/staffBalanceAction";
import { coaApi } from "@/lib/action/coa/coa";
import { formatCurrency } from "@/lib/utils";

interface StaffRefundDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    karyawanId: string;
    karyawanName: string;
    category: string;
    currentBalance: number;
    onSuccess?: () => void;
}

export function StaffRefundDialog({
    open,
    onOpenChange,
    karyawanId,
    karyawanName,
    category,
    currentBalance,
    onSuccess,
}: StaffRefundDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [coaList, setCoaList] = useState<any[]>([]);
    const [isLoadingCoa, setIsLoadingCoa] = useState(false);

    const form = useForm<StaffRefundFormValues>({
        resolver: zodResolver(StaffRefundSchema),
        defaultValues: {
            karyawanId,
            category,
            amount: currentBalance > 0 ? currentBalance : 0,
            coaId: "",
            tanggal: new Date().toISOString().split("T")[0],
            keterangan: "",
            refId: "",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                karyawanId,
                category,
                amount: currentBalance > 0 ? currentBalance : 0,
                coaId: "",
                tanggal: new Date().toISOString().split("T")[0],
                keterangan: `Pengembalian sisa dana operasional oleh ${karyawanName}`,
                refId: "",
            });
            fetchCoa();
        }
    }, [open, karyawanId, category, currentBalance, karyawanName, form]);

    const fetchCoa = async () => {
        setIsLoadingCoa(true);
        try {
            // Fetch accounts that are typically used for receipt (Cash/Bank)
            const data = await coaApi.getCOAs({
                limit: 1000,
                status: "ACTIVE" as any,
                postingType: "POSTING" as any
            });
            // Filter only Cash and Bank accounts (typically code starts with 1-101 or 1-100)
            const filteredCoa = (data.data || []).filter((coa: any) =>
                coa.code.startsWith("1-100") || coa.code.startsWith("1-101")
            );
            setCoaList(filteredCoa);
        } catch (error) {
            console.error("Error fetching COA:", error);
            toast.error("Gagal memuat daftar akun kas/bank");
        } finally {
            setIsLoadingCoa(false);
        }
    };

    const onSubmit = async (values: StaffRefundFormValues) => {
        setIsSubmitting(true);
        try {
            await processStaffRefundAction(values);
            toast.success("Pengembalian dana berhasil diproses");
            onOpenChange(false);
            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast.error(error.message || "Gagal memproses pengembalian dana");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <ArrowRightLeft className="h-5 w-5 text-blue-600" />
                        Refund / Pengembalian Sisa Dana
                    </DialogTitle>
                    <DialogDescription>
                        Catat pengembalian sisa dana dari karyawan ke kas/bank perusahaan.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-blue-700 font-medium">Nama Karyawan:</span>
                        <span className="font-bold text-blue-900">{karyawanName}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-blue-700 font-medium">Saldo Saat Ini:</span>
                        <span className="font-bold text-blue-900">{formatCurrency(currentBalance)}</span>
                    </div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="tanggal"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-slate-500" />
                                            Tanggal
                                        </FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <Wallet className="h-4 w-4 text-slate-500" />
                                            Jumlah Refund (Rp)
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                {...field}
                                                onChange={(e) => field.onChange(Number(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="coaId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <Building className="h-4 w-4 text-slate-500" />
                                        Masuk ke Akun (Kas/Bank)
                                    </FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        disabled={isLoadingCoa}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={isLoadingCoa ? "Memuat akun..." : "Pilih Akun Kas/Bank"} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {coaList.map((coa) => (
                                                <SelectItem key={coa.id} value={coa.id}>
                                                    <span className="font-mono text-xs text-blue-600 mr-2">{coa.code}</span>
                                                    {coa.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="keterangan"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-slate-500" />
                                        Keterangan
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Contoh: Pengembalian sisa dana PO #12345"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="refId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>No. Referensi (Opsional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Contoh: PO-12345" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || isLoadingCoa}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    "Konfirmasi Refund"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
