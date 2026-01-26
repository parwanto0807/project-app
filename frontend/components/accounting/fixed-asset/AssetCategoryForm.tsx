"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getAssetCategories, createAssetCategory } from "@/lib/action/accounting/asset";
import { coaApi } from "@/lib/action/coa/coa";

interface AssetCategoryFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AssetCategoryForm({ isOpen, onClose, onSuccess }: AssetCategoryFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [coaOptions, setCoaOptions] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        name: "",
        usefulLife: "",
        assetAccountId: "",
        accumDeprecAccountId: "",
        deprecExpenseAccountId: ""
    });

    useEffect(() => {
        const fetchCoas = async () => {
            try {
                const res = await coaApi.getCOAHierarchy("");
                // Flatten COA for select
                const flatten = (items: any[]): any[] => {
                    return items.reduce((acc, item) => {
                        if (item.postingType === 'POSTING') acc.push(item);
                        if (item.children) acc.push(...flatten(item.children));
                        return acc;
                    }, []);
                };
                setCoaOptions(flatten(res.data || []));
            } catch (error) {
                console.error("Failed to fetch COA");
            }
        };
        if (isOpen) fetchCoas();
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await createAssetCategory(formData);
            toast.success("Kategori berhasil dibuat");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Gagal simpan kategori");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Setup Asset Category</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Category Name</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                required
                                placeholder="Misal: Peralatan Kantor"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Default Useful Life (Years)</Label>
                            <Input
                                type="number"
                                value={formData.usefulLife}
                                onChange={(e) => setFormData(p => ({ ...p, usefulLife: e.target.value }))}
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase">Asset (Debit) Account</Label>
                            <select
                                className="w-full h-9 rounded-md border border-input px-3 py-1 text-sm bg-transparent"
                                value={formData.assetAccountId}
                                onChange={(e) => setFormData(p => ({ ...p, assetAccountId: e.target.value }))}
                                required
                            >
                                <option value="">Pilih Akun Aset</option>
                                {coaOptions.filter(c => c.type === 'ASET').map(c => (
                                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase">Accum. Deprec (Kredit) Account</Label>
                            <select
                                className="w-full h-9 rounded-md border border-input px-3 py-1 text-sm bg-transparent"
                                value={formData.accumDeprecAccountId}
                                onChange={(e) => setFormData(p => ({ ...p, accumDeprecAccountId: e.target.value }))}
                                required
                            >
                                <option value="">Pilih Akun Akumulasi</option>
                                {coaOptions.filter(c => c.type === 'ASET').map(c => (
                                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase">Deprec. Expense (Debit) Account</Label>
                            <select
                                className="w-full h-9 rounded-md border border-input px-3 py-1 text-sm bg-transparent"
                                value={formData.deprecExpenseAccountId}
                                onChange={(e) => setFormData(p => ({ ...p, deprecExpenseAccountId: e.target.value }))}
                                required
                            >
                                <option value="">Pilih Akun Beban</option>
                                {coaOptions.filter(c => c.type === 'BEBAN').map(c => (
                                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>Save Category</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
