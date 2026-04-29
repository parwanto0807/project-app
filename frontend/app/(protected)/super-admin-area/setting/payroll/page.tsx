'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Banknote, Plus, Save, RefreshCw, Edit, Trash2 } from 'lucide-react';
import { fetchPayrollConfigs, createPayrollConfig, updatePayrollConfig } from '@/lib/action/payroll';
import toast from 'react-hot-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { SuperLayout } from "@/components/admin-panel/super-layout";
import { LayoutProps } from "@/types/layout";

type PayrollConfig = {
    id: string;
    name: string;
    gajiPerHari: number;
    lemburPerJam: number;
    isActive: boolean;
};

export default function PayrollSettingsPage() {
    const [configs, setConfigs] = useState<PayrollConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedConfig, setSelectedConfig] = useState<PayrollConfig | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        gajiPerHari: 0,
        lemburPerJam: 0,
        isActive: true,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadConfigs();
    }, []);

    const loadConfigs = async () => {
        setLoading(true);
        const result = await fetchPayrollConfigs();
        if (result.success) {
            setConfigs(result.data);
        } else {
            toast.error('Gagal mengambil data konfigurasi payroll');
        }
        setLoading(false);
    };

    const handleOpenDialog = (config: PayrollConfig | null = null) => {
        if (config) {
            setSelectedConfig(config);
            setFormData({
                name: config.name,
                gajiPerHari: config.gajiPerHari,
                lemburPerJam: config.lemburPerJam,
                isActive: config.isActive,
            });
        } else {
            setSelectedConfig(null);
            setFormData({
                name: '',
                gajiPerHari: 0,
                lemburPerJam: 0,
                isActive: true,
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        const result = selectedConfig 
            ? await updatePayrollConfig(selectedConfig.id, formData)
            : await createPayrollConfig(formData);

        if (result.success) {
            toast.success(selectedConfig ? 'Konfigurasi diperbarui' : 'Konfigurasi ditambahkan');
            setIsDialogOpen(false);
            loadConfigs();
        } else {
            toast.error(result.error || 'Terjadi kesalahan');
        }
        setSaving(false);
    };

    const layoutProps: LayoutProps = {
        title: "Parameter Gaji",
        role: "super",
        children: (
            <div className="container mx-auto p-6 space-y-6">
                <Card className="border-2 border-primary/20 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-primary/10 rounded-lg">
                                    <Banknote className="h-8 w-8 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl">Parameter Gaji & Lembur</CardTitle>
                                    <CardDescription className="text-base mt-1">
                                        Kelola parameter perhitungan gaji harian dan tarif lembur
                                    </CardDescription>
                                </div>
                            </div>
                            <Button onClick={() => handleOpenDialog()}>
                                <Plus className="h-4 w-4 mr-2" />
                                Tambah Parameter
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama Konfigurasi</TableHead>
                                        <TableHead>Gaji Per Hari</TableHead>
                                        <TableHead>Lembur Per Jam</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        Array.from({ length: 3 }).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-[60px]" /></TableCell>
                                                <TableCell><Skeleton className="h-8 w-[80px] ml-auto" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : configs.length > 0 ? (
                                        configs.map((config) => (
                                            <TableRow key={config.id}>
                                                <TableCell className="font-medium">{config.name}</TableCell>
                                                <TableCell>Rp {config.gajiPerHari.toLocaleString()}</TableCell>
                                                <TableCell>Rp {config.lemburPerJam.toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <Switch checked={config.isActive} disabled />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(config)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24">
                                                Belum ada data konfigurasi.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{selectedConfig ? 'Edit Parameter' : 'Tambah Parameter'}</DialogTitle>
                            <DialogDescription>
                                Masukkan detail parameter untuk perhitungan payroll
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama Konfigurasi</Label>
                                <Input 
                                    id="name" 
                                    value={formData.name} 
                                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                    placeholder="Contoh: Standar Gaji 2024"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="gajiPerHari">Gaji Per Hari</Label>
                                <Input 
                                    id="gajiPerHari" 
                                    type="number"
                                    value={formData.gajiPerHari} 
                                    onChange={(e) => setFormData({...formData, gajiPerHari: parseFloat(e.target.value)})} 
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="lemburPerJam">Tarif Lembur Per Jam</Label>
                                <Input 
                                    id="lemburPerJam" 
                                    type="number"
                                    value={formData.lemburPerJam} 
                                    onChange={(e) => setFormData({...formData, lemburPerJam: parseFloat(e.target.value)})} 
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch 
                                    id="isActive" 
                                    checked={formData.isActive} 
                                    onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                                />
                                <Label htmlFor="isActive">Aktif</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                Simpan
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        )
    };

    return <SuperLayout {...layoutProps} />;
}
