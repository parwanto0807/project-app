"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { postDepreciation } from "@/lib/action/accounting/asset";
import { getPeriods } from "@/lib/action/accounting/period";

interface DepreciateAssetDialogProps {
    asset: any;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function DepreciateAssetDialog({ asset, isOpen, onClose, onSuccess }: DepreciateAssetDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [periods, setPeriods] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        periodId: "",
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        const fetchPeriods = async () => {
            try {
                const res = await getPeriods();
                setPeriods(res.data || []);
                // Default to last open period if possible
                if (res.data && res.data.length > 0) {
                    const openPeriods = res.data.filter((p: any) => !p.isClosed);
                    if (openPeriods.length > 0) {
                        setFormData(prev => ({ ...prev, periodId: openPeriods[0].id }));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch periods");
            }
        };
        if (isOpen) fetchPeriods();
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.periodId) {
            toast.error("Pilih periode akuntansi");
            return;
        }

        setIsLoading(true);
        try {
            await postDepreciation(asset.id, formData.periodId, formData.date);
            toast.success(`Penyusutan untuk ${asset.name} berhasil dicatat di Jurnal.`);
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Gagal memproses penyusutan");
        } finally {
            setIsLoading(false);
        }
    };

    if (!asset) return null;

    // Calculate preview (optional)
    const monthlyDep = (parseFloat(asset.acquisitionCost) - parseFloat(asset.salvageValue)) / (asset.usefulLife * 12);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Hitung & Catat Penyusutan</DialogTitle>
                        <DialogDescription>
                            Proses ini akan menghitung penyusutan bulanan dan mencatatnya ke Buku Besar (Journal Entry).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center text-xs">
                            <div>
                                <p className="text-slate-500 font-medium">Nilai Penyusutan/Bulan</p>
                                <p className="text-slate-900 font-black">Rp{monthlyDep.toLocaleString('id-ID')}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-500 font-medium">Nilai Buku Saat Ini</p>
                                <p className="text-emerald-600 font-black">Rp{parseFloat(asset.bookValue).toLocaleString('id-ID')}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date">Tanggal Jurnal</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Periode Akuntansi</Label>
                            <Select
                                value={formData.periodId}
                                onValueChange={(v) => setFormData(p => ({ ...p, periodId: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Periode" />
                                </SelectTrigger>
                                <SelectContent>
                                    {periods.map(period => (
                                        <SelectItem key={period.id} value={period.id} disabled={period.isClosed}>
                                            {period.periodName} {period.isClosed ? '(Closed)' : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Batal</Button>
                        <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
                            {isLoading ? 'Memproses...' : 'Proses & Posting ke Jurnal'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
