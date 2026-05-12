'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Network, Plus, Save, RefreshCw, Edit, Trash2, Wifi } from 'lucide-react';
import { fetchWifiSsids, createWifiSsid, updateWifiSsid, deleteWifiSsid } from '@/lib/action/master/wifi-ssid';
import { toast } from 'sonner';

import { Skeleton } from '@/components/ui/skeleton';
import { SuperLayout } from "@/components/admin-panel/super-layout";
import { LayoutProps } from "@/types/layout";
import { cn } from '@/lib/utils';

type WifiSsid = {
    id: string;
    name: string;
    isActive: boolean;
};

export default function WifiSsidSettingsPage() {
    const [wifiSsids, setWifiSsids] = useState<WifiSsid[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedSsid, setSelectedSsid] = useState<WifiSsid | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        isActive: true,
    });
    const [saving, setSaving] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await fetchWifiSsids();
            if (result.success) {
                setWifiSsids(result.data);
            }
        } catch (error) {
            console.error("Failed to fetch wifi ssids", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleOpenDialog = (ssid: WifiSsid | null = null) => {
        if (ssid) {
            setSelectedSsid(ssid);
            setFormData({
                name: ssid.name,
                isActive: ssid.isActive,
            });
        } else {
            setSelectedSsid(null);
            setFormData({
                name: '',
                isActive: true,
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('Nama SSID wajib diisi');
            return;
        }

        setSaving(true);
        try {
            const result = selectedSsid 
                ? await updateWifiSsid(selectedSsid.id, formData)
                : await createWifiSsid(formData);

            if (result.success) {
                toast.success('Berhasil disimpan');
                setIsDialogOpen(false);
                await loadData();
            } else {
                toast.error(result.error || 'Gagal menyimpan');
            }
        } catch (err) {
            toast.error('Terjadi kesalahan sistem');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus Wifi SSID ini?')) return;
        const result = await deleteWifiSsid(id);
        if (result.success) {
            toast.success('Terhapus');
            await loadData();
        }
    };

    const layoutProps: LayoutProps = {
        title: "Master Wifi SSID",
        role: "super",
        children: (
            <div className="container mx-auto p-6 max-w-5xl space-y-8">
                <div className="flex flex-col md:flex-row items-center justify-between bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            <Network className="text-blue-600" />
                            Wifi SSID Hub
                        </h1>
                        <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest mt-1">Attendance Access Control</p>
                    </div>
                    <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700 rounded-2xl font-black px-10 h-14 shadow-xl shadow-blue-600/20 w-full md:w-auto">
                        <Plus className="h-5 w-5 mr-2" />
                        TAMBAH WIFI
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-32 w-full rounded-[2.5rem]" />
                        ))
                    ) : wifiSsids.length > 0 ? (
                        wifiSsids.map((ssid) => (
                            <Card key={ssid.id} className={cn(
                                "overflow-hidden border-2 transition-all rounded-[2.5rem] shadow-sm hover:shadow-xl group",
                                ssid.isActive ? "border-blue-100 bg-white" : "border-gray-100 bg-gray-50 opacity-80"
                            )}>
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "p-4 rounded-2xl",
                                            ssid.isActive ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-400"
                                        )}>
                                            <Wifi size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                {ssid.name}
                                            </h3>
                                            <Badge variant={ssid.isActive ? "secondary" : "outline"} className={cn(
                                                "mt-1 rounded-lg font-black text-[9px] uppercase tracking-tighter px-3",
                                                ssid.isActive ? "bg-blue-100 text-blue-700 border-none" : ""
                                            )}>
                                                {ssid.isActive ? 'ACTIVE' : 'INACTIVE'}
                                            </Badge>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-blue-50 text-blue-600" onClick={() => handleOpenDialog(ssid)}>
                                            <Edit size={18} />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-red-50 text-red-500" onClick={() => handleDelete(ssid.id)}>
                                            <Trash2 size={18} />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-24 border-4 border-dashed rounded-[3rem] border-gray-100 bg-gray-50/50">
                            <Wifi size={64} className="mx-auto mb-6 text-gray-200" />
                            <h2 className="text-xl font-black text-gray-400 uppercase tracking-[0.2em]">Data Wifi SSID Kosong</h2>
                        </div>
                    )}
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-md rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
                        <div className="bg-blue-600 p-10 text-white relative overflow-hidden">
                            <DialogTitle className="text-3xl font-black relative z-10">Konfigurasi Wifi</DialogTitle>
                            <DialogDescription className="text-blue-50 opacity-80 font-medium relative z-10 text-xs uppercase tracking-widest">Daftarkan SSID Resmi</DialogDescription>
                            <Wifi className="absolute -right-8 -bottom-8 text-blue-500/20 w-40 h-40" />
                        </div>
                        <div className="p-10 space-y-8 bg-white dark:bg-gray-900">
                            <div className="space-y-3">
                                <Label className="font-black text-[10px] uppercase tracking-[0.2em] text-blue-600">Nama SSID</Label>
                                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Misal: Kantor_Pusat_WIFI" className="rounded-2xl border-2 h-14 text-lg font-bold" />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-bold">Status Aktif</Label>
                                    <p className="text-[10px] text-muted-foreground uppercase font-black">Aktifkan untuk referensi absensi</p>
                                </div>
                                <Switch 
                                    checked={formData.isActive} 
                                    onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                                    className="data-[state=checked]:bg-blue-600"
                                />
                            </div>
                        </div>
                        <DialogFooter className="p-10 bg-gray-50 dark:bg-gray-800/50 flex gap-4">
                            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-2xl font-bold h-14 px-8">BATAL</Button>
                            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 rounded-2xl h-14 px-12 font-black shadow-xl shadow-blue-600/30 text-white flex-1">
                                {saving ? <RefreshCw className="h-6 w-6 animate-spin" /> : 'SIMPAN WIFI'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        )
    };

    return <SuperLayout {...layoutProps} />;
}
