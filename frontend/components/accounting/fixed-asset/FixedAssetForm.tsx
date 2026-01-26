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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createAsset, getAssetCategories } from "@/lib/action/accounting/asset";

interface FixedAssetFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

export function FixedAssetForm({ isOpen, onClose, onSuccess, initialData }: FixedAssetFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        assetCode: "",
        name: "",
        description: "",
        categoryId: "",
        acquisitionDate: "",
        acquisitionCost: "",
        usefulLife: "",
        salvageValue: "0",
        location: "",
        department: ""
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await getAssetCategories();
                setCategories(res.data);
            } catch (error) {
                console.error("Failed to fetch categories");
            }
        };
        if (isOpen) fetchCategories();
    }, [isOpen]);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await createAsset(formData);
            toast.success("Aset berhasil ditambahkan");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Gagal menyimpan aset");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{initialData ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
                        <DialogDescription>
                            Masukkan informasi aset tetap secara lengkap untuk pencatatan akuntansi.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="assetCode" className="text-xs font-bold uppercase">Asset Code</Label>
                            <Input
                                id="assetCode"
                                name="assetCode"
                                value={formData.assetCode}
                                onChange={handleChange}
                                placeholder="FA-001"
                                required
                                className="h-9 text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs font-bold uppercase">Asset Name</Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Misal: Toyota Avanza"
                                required
                                className="h-9 text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="categoryId" className="text-xs font-bold uppercase">Category</Label>
                            <Select
                                value={formData.categoryId}
                                onValueChange={(v) => setFormData(p => ({ ...p, categoryId: v }))}
                            >
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="Pilih Kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="acquisitionDate" className="text-xs font-bold uppercase">Acquisition Date</Label>
                            <Input
                                id="acquisitionDate"
                                name="acquisitionDate"
                                type="date"
                                value={formData.acquisitionDate}
                                onChange={handleChange}
                                required
                                className="h-9 text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="acquisitionCost" className="text-xs font-bold uppercase">Acquisition Cost</Label>
                            <Input
                                id="acquisitionCost"
                                name="acquisitionCost"
                                type="number"
                                value={formData.acquisitionCost}
                                onChange={handleChange}
                                placeholder="0"
                                required
                                className="h-9 text-sm font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="usefulLife" className="text-xs font-bold uppercase">Useful Life (Years)</Label>
                            <Input
                                id="usefulLife"
                                name="usefulLife"
                                type="number"
                                value={formData.usefulLife}
                                onChange={handleChange}
                                placeholder="Misal: 5"
                                required
                                className="h-9 text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 mb-4">
                        <Label htmlFor="description" className="text-xs font-bold uppercase">Notes / Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="text-sm resize-none"
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Asset'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
