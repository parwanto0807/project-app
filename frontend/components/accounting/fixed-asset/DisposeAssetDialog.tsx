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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { disposeAsset } from "@/lib/action/accounting/asset";
import { getPeriods } from "@/lib/action/accounting/period";
import { coaApi } from "@/lib/action/coa/coa";

interface DisposeAssetDialogProps {
    asset: any;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function DisposeAssetDialog({ asset, isOpen, onClose, onSuccess }: DisposeAssetDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [periods, setPeriods] = useState<any[]>([]);
    const [coaOptions, setCoaOptions] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        disposalDate: new Date().toISOString().split('T')[0],
        disposalType: "WRITTEN_OFF",
        proceeds: "0",
        periodId: "",
        remarks: "",
        cashBankAccountId: "",
        gainLossAccountId: ""
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pRes, cRes] = await Promise.all([
                    getPeriods(),
                    coaApi.getCOAHierarchy("")
                ]);
                setPeriods(pRes.data || []);

                const flatten = (items: any[]): any[] => {
                    return items.reduce((acc, item) => {
                        if (item.postingType === 'POSTING') acc.push(item);
                        if (item.children) acc.push(...flatten(item.children));
                        return acc;
                    }, []);
                };
                setCoaOptions(flatten(cRes.data || []));

                const openPeriods = (pRes.data || []).filter((p: any) => !p.isClosed);
                if (openPeriods.length > 0) {
                    setFormData(prev => ({ ...prev, periodId: openPeriods[0].id }));
                }
            } catch (error) {
                console.error("Failed to fetch data for disposal");
            }
        };
        if (isOpen) fetchData();
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.periodId) return toast.error("Pilih periode akuntansi");
        if (formData.disposalType === "SOLD" && !formData.cashBankAccountId) return toast.error("Pilih akun Kas/Bank");

        setIsLoading(true);
        try {
            await disposeAsset(asset.id, {
                ...formData,
                proceeds: parseFloat(formData.proceeds)
            });
            toast.success(`Aset ${asset.name} telah berhasil dilepas.`);
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Gagal melepas aset");
        } finally {
            setIsLoading(false);
        }
    };

    if (!asset) return null;

    const bookValue = parseFloat(asset.bookValue);
    const gainLoss = parseFloat(formData.proceeds) - bookValue;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Pelepasan Aset Tetap</DialogTitle>
                        <DialogDescription>
                            Hentikan penggunaan aset atau catat penjualan aset tetap ini.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="p-3 bg-rose-50 rounded-lg border border-rose-100 flex justify-between items-center text-xs">
                            <div>
                                <p className="text-rose-600 font-medium">Nilai Buku Saat Ini</p>
                                <p className="text-rose-900 font-black">Rp{bookValue.toLocaleString('id-ID')}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-500 font-medium">Est. Laba/Rugi</p>
                                <p className={cn("font-black", gainLoss >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                    {gainLoss >= 0 ? '+' : ''}Rp{gainLoss.toLocaleString('id-ID')}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="disposalDate">Tanggal Pelepasan</Label>
                                <Input
                                    id="disposalDate"
                                    type="date"
                                    value={formData.disposalDate}
                                    onChange={(e) => setFormData(p => ({ ...p, disposalDate: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Jenis Pelepasan</Label>
                                <Select
                                    value={formData.disposalType}
                                    onValueChange={(v) => setFormData(p => ({ ...p, disposalType: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="WRITTEN_OFF">Penghapusan (Write-off)</SelectItem>
                                        <SelectItem value="SOLD">Penjualan (Sold)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {formData.disposalType === "SOLD" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="proceeds">Hasil Penjualan (Rp)</Label>
                                    <Input
                                        id="proceeds"
                                        type="number"
                                        value={formData.proceeds}
                                        onChange={(e) => setFormData(p => ({ ...p, proceeds: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Akun Penerimaan</Label>
                                    <select
                                        className="w-full h-10 rounded-md border border-input px-3 py-2 text-sm bg-transparent"
                                        value={formData.cashBankAccountId}
                                        onChange={(e) => setFormData(p => ({ ...p, cashBankAccountId: e.target.value }))}
                                        required
                                    >
                                        <option value="">Pilih Kas/Bank</option>
                                        {coaOptions.filter(c => c.type === 'KAS_BANK' || c.type === 'ASET').map(c => (
                                            <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Akun Laba/Rugi Pelepasan (Opsional)</Label>
                            <select
                                className="w-full h-10 rounded-md border border-input px-3 py-2 text-sm bg-transparent"
                                value={formData.gainLossAccountId}
                                onChange={(e) => setFormData(p => ({ ...p, gainLossAccountId: e.target.value }))}
                            >
                                <option value="">Auto (Gunakan Akun Beban Kategori)</option>
                                {coaOptions.filter(c => c.type === 'PENDAPATAN' || c.type === 'BEBAN').map(c => (
                                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                                ))}
                            </select>
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
                                            {period.periodName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="remarks">Catatan / Alasan Pelepasan</Label>
                            <Textarea
                                id="remarks"
                                value={formData.remarks}
                                onChange={(e) => setFormData(p => ({ ...p, remarks: e.target.value }))}
                                placeholder="Misal: Rusak tidak bisa diperbaiki, dijual ke vendor X"
                                rows={2}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Batal</Button>
                        <Button type="submit" disabled={isLoading} variant="destructive">
                            {isLoading ? 'Memproses...' : 'Proses Pelepasan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
