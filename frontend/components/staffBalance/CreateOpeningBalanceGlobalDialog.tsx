"use client";

import React, { useState, useEffect } from "react";
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
import { Loader2, DollarSign, Calendar, FileText, User } from "lucide-react";

interface Karyawan {
    id: string;
    namaLengkap: string;
    email?: string;
    departemen?: string;
}

interface CreateOpeningBalanceGlobalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function CreateOpeningBalanceGlobalDialog({
    open,
    onOpenChange,
    onSuccess,
}: CreateOpeningBalanceGlobalDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingKaryawan, setIsLoadingKaryawan] = useState(false);
    const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
    const [formData, setFormData] = useState({
        karyawanId: "",
        category: LedgerCategory.OPERASIONAL_PROYEK,
        amount: "",
        tanggal: getCurrentDateJakarta(),
        keterangan: "",
    });

    // Fetch karyawan list when dialog opens
    useEffect(() => {
        if (open) {
            fetchKaryawan();
        }
    }, [open]);

    const fetchKaryawan = async () => {
        setIsLoadingKaryawan(true);
        try {
            const response = await fetch("/api/karyawan/getAllKaryawan");
            const result = await response.json();

            if (Array.isArray(result)) {
                setKaryawanList(result);
            } else if (result.success && Array.isArray(result.data)) {
                setKaryawanList(result.data);
            } else {
                console.warn("Unexpected response format for karyawan list:", result);
                setKaryawanList([]);
            }
        } catch (error) {
            console.error("Error fetching karyawan:", error);
            toast.error("Gagal memuat daftar karyawan");
        } finally {
            setIsLoadingKaryawan(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.karyawanId) {
            toast.error("Pilih karyawan terlebih dahulu");
            return;
        }

        if (!formData.amount || Number(formData.amount) === 0) {
            toast.error("Jumlah saldo awal harus diisi");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await createOpeningBalance({
                karyawanId: formData.karyawanId,
                category: formData.category,
                amount: Number(formData.amount),
                tanggal: formData.tanggal,
                keterangan: formData.keterangan || undefined,
            });

            toast.success(result.message || "Saldo awal berhasil dibuat");
            onOpenChange(false);

            // Reset form
            setFormData({
                karyawanId: "",
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

    const selectedKaryawan = karyawanList.find(k => k.id === formData.karyawanId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span>Buat Saldo Awal Karyawan</span>
                    </DialogTitle>
                    <DialogDescription>
                        Pilih karyawan dan buat saldo awal. Saldo awal hanya bisa dibuat sekali per kategori untuk setiap karyawan.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        {/* Karyawan Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="karyawan" className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Karyawan <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.karyawanId}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, karyawanId: value })
                                }
                                disabled={isLoadingKaryawan}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={isLoadingKaryawan ? "Memuat..." : "Pilih Karyawan"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {karyawanList.map((karyawan) => (
                                        <SelectItem key={karyawan.id} value={karyawan.id}>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{karyawan.namaLengkap}</span>
                                                {karyawan.departemen && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {karyawan.departemen}
                                                    </span>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedKaryawan?.email && (
                                <p className="text-xs text-muted-foreground">
                                    📧 {selectedKaryawan.email}
                                </p>
                            )}
                        </div>

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
                        <Button type="submit" disabled={isSubmitting || !formData.karyawanId}>
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
