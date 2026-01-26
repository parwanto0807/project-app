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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { getMaintenances, createMaintenance } from "@/lib/action/accounting/asset";
import { getPeriods } from "@/lib/action/accounting/period";
import { fetchSuppliers } from "@/lib/action/supplier/supplierAction";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Wrench, Plus, History } from "lucide-react";

interface AssetMaintenanceDialogProps {
    asset: any;
    isOpen: boolean;
    onClose: () => void;
}

export function AssetMaintenanceDialog({ asset, isOpen, onClose }: AssetMaintenanceDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [periods, setPeriods] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [isAdding, setIsAdding] = useState(false);

    const [formData, setFormData] = useState({
        maintenanceDate: new Date().toISOString().split('T')[0],
        type: "ROUTINE",
        description: "",
        cost: "0",
        performedBy: "",
        supplierId: "",
        nextSchedule: "",
        status: "COMPLETED",
        isJournaled: false,
        periodId: ""
    });

    useEffect(() => {
        if (isOpen && asset) {
            fetchHistory();
            fetchPeriods();
            fetchSuppliersList();
        }
    }, [isOpen, asset]);

    const fetchHistory = async () => {
        try {
            const res = await getMaintenances(asset.id);
            setHistory(res.data || []);
        } catch (error) {
            console.error("Failed to fetch maintenance history");
        }
    };

    const fetchPeriods = async () => {
        try {
            const res = await getPeriods();
            setPeriods(res.data || []);
            const openPeriods = (res.data || []).filter((p: any) => !p.isClosed);
            if (openPeriods.length > 0) {
                setFormData(p => ({ ...p, periodId: openPeriods[0].id }));
            }
        } catch (error) {
            console.error("Failed to fetch periods");
        }
    };

    const fetchSuppliersList = async () => {
        try {
            const res = await fetchSuppliers({ activeOnly: true });
            setSuppliers(res.data || []);
        } catch (error) {
            console.error("Failed to fetch suppliers");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await createMaintenance({
                ...formData,
                assetId: asset.id,
                cost: parseFloat(formData.cost),
                supplierId: formData.supplierId === "none" ? null : formData.supplierId
            });
            toast.success("Catatan pemeliharaan berhasil disimpan.");
            setIsAdding(false);
            fetchHistory();
        } catch (error: any) {
            toast.error(error.message || "Gagal menyimpan data");
        } finally {
            setIsLoading(false);
        }
    };

    if (!asset) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-indigo-600" />
                        <DialogTitle>Maintenance Tracking: {asset.name}</DialogTitle>
                    </div>
                    <DialogDescription>
                        Kelola jadwal dan riwayat pemeliharaan aset {asset.assetCode}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-auto py-4 space-y-6">
                    {isAdding ? (
                        <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-slate-50">
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <Plus className="h-4 w-4" /> Tambah Catatan Baru
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Tanggal</Label>
                                    <Input
                                        type="date"
                                        value={formData.maintenanceDate}
                                        onChange={(e) => setFormData(p => ({ ...p, maintenanceDate: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Jenis</Label>
                                    <Select value={formData.type} onValueChange={(v) => setFormData(p => ({ ...p, type: v }))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ROUTINE">Routine Maintenance</SelectItem>
                                            <SelectItem value="REPAIR">Repair</SelectItem>
                                            <SelectItem value="UPGRADE">Upgrade</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Deskripsi Pekerjaan</Label>
                                <Input
                                    value={formData.description}
                                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Apa yang dikerjakan?"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Biaya (Rp)</Label>
                                    <Input
                                        type="number"
                                        value={formData.cost}
                                        onChange={(e) => setFormData(p => ({ ...p, cost: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Vendor / Supplier</Label>
                                    <Select value={formData.supplierId} onValueChange={(v) => setFormData(p => ({ ...p, supplierId: v }))}>
                                        <SelectTrigger className="text-xs h-9">
                                            <SelectValue placeholder="Pilih Supplier" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none" className="text-xs">Bukan Supplier Terdaftar</SelectItem>
                                            {suppliers.map(s => (
                                                <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Teknisi / Personel</Label>
                                    <Input
                                        value={formData.performedBy}
                                        onChange={(e) => setFormData(p => ({ ...p, performedBy: e.target.value }))}
                                        placeholder="Nama teknisi pelaksana"
                                        className="h-9 text-xs"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 p-2 border rounded bg-white">
                                <Checkbox
                                    id="journaled"
                                    checked={formData.isJournaled}
                                    onCheckedChange={(v) => setFormData(p => ({ ...p, isJournaled: !!v }))}
                                />
                                <Label htmlFor="journaled" className="text-xs cursor-pointer">Catat biaya ke Jurnal Umum (Accounting)</Label>
                            </div>

                            {formData.isJournaled && (
                                <div className="space-y-2">
                                    <Label className="text-xs">Periode Akuntansi</Label>
                                    <Select value={formData.periodId} onValueChange={(v) => setFormData(p => ({ ...p, periodId: v }))}>
                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {periods.map(p => (
                                                <SelectItem key={p.id} value={p.id} disabled={p.isClosed}>{p.periodName}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Batal</Button>
                                <Button type="submit" size="sm" disabled={isLoading}>Simpan Catatan</Button>
                            </div>
                        </form>
                    ) : (
                        <div className="flex justify-between items-center px-1">
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <History className="h-4 w-4" /> Riwayat Pemeliharaan
                            </h3>
                            <Button size="sm" variant="outline" className="h-8" onClick={() => setIsAdding(true)}>
                                <Plus className="h-3.5 w-3.5 mr-1" /> Catat Pemeliharaan
                            </Button>
                        </div>
                    )}

                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="text-[10px] uppercase">Tanggal</TableHead>
                                    <TableHead className="text-[10px] uppercase">Vendor/Teknisi</TableHead>
                                    <TableHead className="text-[10px] uppercase">Deskripsi</TableHead>
                                    <TableHead className="text-[10px] uppercase text-right">Biaya</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {history.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-slate-400 italic text-xs">
                                            Belum ada riwayat pemeliharaan
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    history.map((h) => (
                                        <TableRow key={h.id} className="text-xs">
                                            <TableCell className="py-2">{format(new Date(h.maintenanceDate), "dd/MM/yyyy")}</TableCell>
                                            <TableCell className="py-2">
                                                <div>
                                                    <p className="font-bold text-slate-700">{h.supplier?.name || h.performedBy || "-"}</p>
                                                    <p className="text-[10px] text-slate-400">{h.type}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate py-2">{h.description}</TableCell>
                                            <TableCell className="text-right font-medium text-rose-600 py-2">
                                                Rp{parseFloat(h.cost).toLocaleString('id-ID')}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
