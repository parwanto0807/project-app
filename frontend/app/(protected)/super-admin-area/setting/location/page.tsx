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
import { MapPin, Plus, Save, RefreshCw, Edit, Trash2, Navigation, ExternalLink } from 'lucide-react';
import { fetchLocations, createLocation, updateLocation, deleteLocation } from '@/lib/action/master/location';
import toast from 'react-hot-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { SuperLayout } from "@/components/admin-panel/super-layout";
import { LayoutProps } from "@/types/layout";
import { cn } from '@/lib/utils';

type AttendanceLocation = {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
    isActive: boolean;
};

export default function LocationSettingsPage() {
    const [locations, setLocations] = useState<AttendanceLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<AttendanceLocation | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        latitude: 0,
        longitude: 0,
        radius: 100,
        isActive: true,
    });
    const [saving, setSaving] = useState(false);

    // Use useCallback for loading data to prevent recreation
    const loadData = useCallback(async () => {
        try {
            const result = await fetchLocations();
            if (result.success) {
                setLocations(result.data);
            }
        } catch (error) {
            console.error("Failed to fetch locations", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleOpenDialog = (location: AttendanceLocation | null = null) => {
        if (location) {
            setSelectedLocation(location);
            setFormData({
                name: location.name,
                latitude: location.latitude,
                longitude: location.longitude,
                radius: location.radius,
                isActive: location.isActive,
            });
        } else {
            setSelectedLocation(null);
            setFormData({
                name: '',
                latitude: 0,
                longitude: 0,
                radius: 100,
                isActive: true,
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const result = selectedLocation 
                ? await updateLocation(selectedLocation.id, formData)
                : await createLocation(formData);

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
        if (!confirm('Hapus lokasi ini?')) return;
        const result = await deleteLocation(id);
        if (result.success) {
            toast.success('Terhapus');
            await loadData();
        }
    };

    const layoutProps: LayoutProps = {
        title: "Koordinat Absensi",
        role: "super",
        children: (
            <div className="container mx-auto p-6 max-w-5xl space-y-8">
                <div className="flex flex-col md:flex-row items-center justify-between bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            <Navigation className="text-teal-600" />
                            Geofencing Center
                        </h1>
                        <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest mt-1">High Performance Management</p>
                    </div>
                    <Button onClick={() => handleOpenDialog()} className="bg-teal-600 hover:bg-teal-700 rounded-2xl font-black px-10 h-14 shadow-xl shadow-teal-600/20 w-full md:w-auto">
                        <Plus className="h-5 w-5 mr-2" />
                        TAMBAH LOKASI
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {loading ? (
                        Array.from({ length: 2 }).map((_, i) => (
                            <Skeleton key={i} className="h-48 w-full rounded-[2.5rem]" />
                        ))
                    ) : locations.length > 0 ? (
                        locations.map((loc) => (
                            <Card key={loc.id} className={cn(
                                "overflow-hidden border-2 transition-all rounded-[2.5rem] shadow-sm hover:shadow-xl group",
                                loc.isActive ? "border-teal-100 bg-white" : "border-gray-100 bg-gray-50 opacity-80"
                            )}>
                                <CardContent className="p-0 flex flex-col md:flex-row h-full md:min-h-48">
                                    {/* Static Placeholder instead of Iframe */}
                                    <div className="w-full md:w-80 h-48 md:h-auto relative overflow-hidden bg-teal-50 dark:bg-teal-950/20 flex items-center justify-center">
                                        <div className="text-center opacity-40 group-hover:opacity-100 transition-opacity p-6">
                                            <div className="p-4 bg-white dark:bg-gray-800 rounded-full inline-block shadow-lg mb-2">
                                                <MapPin className="text-teal-600" size={32} />
                                            </div>
                                            <div className="text-[10px] font-black uppercase tracking-tighter text-teal-700 dark:text-teal-400">GPS COORDINATES</div>
                                            <div className="text-xs font-bold text-gray-500">{loc.latitude}, {loc.longitude}</div>
                                            <Button 
                                                variant="link" 
                                                className="text-teal-600 font-black text-[10px] uppercase p-0 h-auto mt-2"
                                                onClick={() => window.open(`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`, '_blank')}
                                            >
                                                Lihat di Google Maps <ExternalLink size={10} className="ml-1" />
                                            </Button>
                                        </div>
                                        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-5">
                                            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                                                <defs>
                                                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1"/>
                                                    </pattern>
                                                </defs>
                                                <rect width="100%" height="100%" fill="url(#grid)" />
                                            </svg>
                                        </div>
                                    </div>

                                    <div className="flex-1 p-8 flex flex-col justify-between">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-teal-600 transition-colors">
                                                    {loc.name}
                                                </h3>
                                                <div className="flex gap-4 mt-2">
                                                    <Badge variant="secondary" className="rounded-lg font-black text-[9px] uppercase tracking-tighter px-3 bg-teal-100 text-teal-700 border-none">
                                                        Radius {loc.radius}m
                                                    </Badge>
                                                    <Badge variant="outline" className="rounded-lg font-black text-[9px] uppercase tracking-tighter px-3 border-2">
                                                        {loc.isActive ? 'OPERATIONAL' : 'DRAFT'}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl border">
                                                <Switch 
                                                    checked={loc.isActive} 
                                                    onCheckedChange={async (checked) => {
                                                        await updateLocation(loc.id, { ...loc, isActive: checked });
                                                        await loadData();
                                                    }}
                                                    className="data-[state=checked]:bg-teal-600"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-50">
                                            <div className="flex gap-3">
                                                <Button variant="outline" className="rounded-2xl border-2 font-black h-12 px-6 hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-all" onClick={() => handleOpenDialog(loc)}>
                                                    <Edit size={16} className="mr-2" /> EDIT DATA
                                                </Button>
                                                <Button variant="ghost" className="rounded-2xl h-12 w-12 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(loc.id)}>
                                                    <Trash2 size={18} />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-24 border-4 border-dashed rounded-[3rem] border-gray-100 bg-gray-50/50">
                            <MapPin size={64} className="mx-auto mb-6 text-gray-200" />
                            <h2 className="text-xl font-black text-gray-400 uppercase tracking-[0.2em]">Data Lokasi Kosong</h2>
                        </div>
                    )}
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-md rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
                        <div className="bg-teal-600 p-10 text-white relative overflow-hidden">
                            <DialogTitle className="text-3xl font-black relative z-10">Konfigurasi</DialogTitle>
                            <DialogDescription className="text-teal-50 opacity-80 font-medium relative z-10 text-xs uppercase tracking-widest">Setel Geofencing GPS</DialogDescription>
                            <Navigation className="absolute -right-8 -bottom-8 text-teal-500/20 w-40 h-40" />
                        </div>
                        <div className="p-10 space-y-8 bg-white dark:bg-gray-900">
                            <div className="space-y-3">
                                <Label className="font-black text-[10px] uppercase tracking-[0.2em] text-teal-600">Label Lokasi</Label>
                                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Misal: Workshop A" className="rounded-2xl border-2 h-14 text-lg font-bold" />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label className="font-black text-[10px] uppercase tracking-[0.2em] text-teal-600">Latitude</Label>
                                    <Input type="number" step="any" value={formData.latitude} onChange={(e) => setFormData({...formData, latitude: parseFloat(e.target.value)})} className="rounded-2xl border-2 h-14 font-mono" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="font-black text-[10px] uppercase tracking-[0.2em] text-teal-600">Longitude</Label>
                                    <Input type="number" step="any" value={formData.longitude} onChange={(e) => setFormData({...formData, longitude: parseFloat(e.target.value)})} className="rounded-2xl border-2 h-14 font-mono" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label className="font-black text-[10px] uppercase tracking-[0.2em] text-teal-600">Radius Aman (Meter)</Label>
                                <Input type="number" value={formData.radius} onChange={(e) => setFormData({...formData, radius: parseFloat(e.target.value)})} className="rounded-2xl border-2 h-14 text-2xl font-black text-teal-600" />
                            </div>
                        </div>
                        <DialogFooter className="p-10 bg-gray-50 dark:bg-gray-800/50 flex gap-4">
                            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-2xl font-bold h-14 px-8">BATAL</Button>
                            <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700 rounded-2xl h-14 px-12 font-black shadow-xl shadow-teal-600/30 text-white">
                                {saving ? <RefreshCw className="h-6 w-6 animate-spin" /> : 'SIMPAN DATA'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        )
    };

    return <SuperLayout {...layoutProps} />;
}
