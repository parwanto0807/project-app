"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createOpeningBalance } from "@/lib/action/staffBalance/staffBalanceAction";
import { LedgerCategory } from "@/types/staffBalance";
import { getCurrentDateJakarta } from "@/lib/utils";
import { Loader2, DollarSign, Calendar, FileText } from "lucide-react";

interface CreateOpeningBalanceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    karyawanId: string;
    karyawanName: string;
    onSuccess?: () => void;
}

export function CreateOpeningBalanceDialog({
    open,
    onOpenChange,
    karyawanId,
    karyawanName,
    onSuccess,
}: CreateOpeningBalanceDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        category: LedgerCategory.OPERASIONAL_PROYEK,
        amount: "",
        tanggal: getCurrentDateJakarta(),
        keterangan: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.amount || Number(formData.amount) === 0) {
            toast.error("Jumlah saldo awal harus diisi");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await createOpeningBalance({
                karyawanId,
                category: formData.category,
                amount: Number(formData.amount),
                tanggal: formData.tanggal,
                keterangan: formData.keterangan || undefined,
            });

            toast.success(result.message || "Saldo awal berhasil dibuat");
            onOpenChange(false);

            // Reset form
            setFormData({
                category: LedgerCategory.OPERASIONAL_PROYEK,
                amount: "",
                tanggal: getCurrentDateJakarta(),
                keterangan: "",
            });

            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            toast.error(error.message || "Gagal membuat saldo awal");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span>Buat Saldo Awal</span>
                    </DialogTitle>
                    <DialogDescription>
                        Buat saldo awal untuk <strong>{karyawanName}</strong>. Saldo awal hanya bisa dibuat sekali per kategori.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        {/* Category */}
                        <div className="space-y-2">
                            <Label htmlFor="category">Kategori</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, category: value as LedgerCategory })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={LedgerCategory.OPERASIONAL_PROYEK}>
                                        Operasional Proyek
                                    </SelectItem>
                                    <SelectItem value={LedgerCategory.PINJAMAN_PRIBADI}>
                                        Pinjaman Pribadi
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <Label htmlFor="amount">
                                Jumlah Saldo Awal <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                    Rp
                                </span>
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="0"
                                    value={formData.amount}
                                    onChange={(e) =>
                                        setFormData({ ...formData, amount: e.target.value })
                                    }
                                    className="pl-10"
                                    required
                                />
                            </div>
                            <p className="text-xs text-slate-500">
                                Gunakan angka positif untuk saldo masuk, negatif untuk saldo keluar
                            </p>
                        </div>

                        {/* Date */}
                        <div className="space-y-2">
                            <Label htmlFor="tanggal" className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Tanggal
                            </Label>
                            <Input
                                id="tanggal"
                                type="date"
                                value={formData.tanggal}
                                onChange={(e) =>
                                    setFormData({ ...formData, tanggal: e.target.value })
                                }
                                max={getCurrentDateJakarta()}
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="keterangan" className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Keterangan (Opsional)
                            </Label>
                            <Textarea
                                id="keterangan"
                                placeholder="Contoh: Saldo awal periode Januari 2026"
                                value={formData.keterangan}
                                onChange={(e) =>
                                    setFormData({ ...formData, keterangan: e.target.value })
                                }
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                "Simpan Saldo Awal"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
