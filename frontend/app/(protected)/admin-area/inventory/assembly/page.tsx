"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Plus, Wrench, Loader2, Eye, ArrowRight, Package } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { getAssemblies, completeAssembly, cancelAssembly } from "@/lib/action/assembly/assemblyAction";
import { getWarehouses } from "@/lib/action/wh/whAction";
import { useEffect } from "react";
import { toast } from "sonner";

const statusBadge: Record<string, { label: string; className: string }> = {
    DRAFT: { label: "DRAFT", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400" },
    COMPLETED: { label: "COMPLETED", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400" },
    CANCELLED: { label: "CANCELLED", className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400" },
};

export default function AssemblyPage() {
    const router = useRouter();
    const [assemblies, setAssemblies] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<any>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [warehouseMap, setWarehouseMap] = useState<Record<string, string>>({});

    const loadAssemblies = async (query = "") => {
        setIsLoading(true);
        try {
            const res = await getAssemblies({ limit: 1000, search: query });
            if (res.success) {
                setAssemblies(res.data?.data || []);
            } else {
                toast.error(res.message || "Gagal memuat data perakitan");
            }
        } catch {
            toast.error("Terjadi kesalahan memuat data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAssemblies();
        getWarehouses().then(res => {
            if (res.success && res.data) {
                const map: Record<string, string> = {};
                (res.data.data || []).forEach((w: any) => (map[w.id] = w.name));
                setWarehouseMap(map);
            }
        });
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadAssemblies(search);
    };

    const handleComplete = async (assembly: any) => {
        setIsActionLoading(true);
        try {
            const res = await completeAssembly(assembly.id);
            if (res.success) {
                toast.success("Perakitan diselesaikan, stock terupdate!");
                loadAssemblies(search);
                setSelected(null);
                setSheetOpen(false);
            } else {
                toast.error(res.message || "Gagal menyelesaikan perakitan");
            }
        } catch {
            toast.error("Terjadi kesalahan");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleCancel = async (assembly: any) => {
        if (!window.confirm(`Batalkan perakitan ${assembly.assemblyNumber}?`)) return;
        setIsActionLoading(true);
        try {
            const res = await cancelAssembly(assembly.id);
            if (res.success) {
                toast.success("Perakitan dibatalkan");
                loadAssemblies(search);
            } else {
                toast.error(res.message || "Gagal membatalkan perakitan");
            }
        } catch {
            toast.error("Terjadi kesalahan");
        } finally {
            setIsActionLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: id });
        } catch {
            return dateString;
        }
    };

    return (
        <AdminLayout title="Perakitan Barang" role="admin">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/admin-area/inventory">Inventory</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Perakitan Barang</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex-1 min-h-0 overflow-auto">
                <div className="space-y-4 p-2 pt-1 md:p-4">
                    {/* Header */}
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 p-6 shadow-lg">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="rounded-lg bg-white/10 p-3">
                                    <Wrench className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">Perakitan Barang</h1>
                                    <p className="text-white/80 mt-1">
                                        Rakit komponen stock gudang menjadi barang baru dengan Part Number baru
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={() => router.push("/admin-area/inventory/assembly/create")}
                                className="bg-white text-indigo-600 hover:bg-white/90"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                New Perakitan
                            </Button>
                        </div>
                    </div>

                    {/* Table */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>History Perakitan</CardTitle>
                                <form onSubmit={handleSearch} className="flex gap-2">
                                    <Input
                                        placeholder="Cari: nomor, produk hasil..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-72"
                                    />
                                    <Button type="submit" size="sm">Cari</Button>
                                </form>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                                    <span className="ml-3 text-slate-600">Loading...</span>
                                </div>
                            ) : assemblies.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <Wrench className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p className="text-lg font-medium">Belum ada perakitan</p>
                                    <p className="text-sm mt-1">Klik "New Perakitan" untuk membuat perakitan pertama</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                                            <tr>
                                                <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">No. Perakitan</th>
                                                <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Tanggal</th>
                                                <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Gudang</th>
                                                <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Hasil Perakitan</th>
                                                <th className="text-center py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Komponen</th>
                                                <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                                                <th className="text-center py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {assemblies.map((a: any) => (
                                                <tr key={a.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                                    <td className="py-3 px-4">
                                                        <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                                                            {a.assemblyNumber}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                                                        {formatDate(a.assemblyDate)}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="text-sm font-medium">{a.warehouse?.name || warehouseMap[a.warehouseId] || "-"}</span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                                                                {a.outputProduct?.code} - {a.outputProduct?.name}
                                                            </span>
                                                            <Badge variant="secondary" className="whitespace-nowrap">
                                                                {Number(a.outputQuantity)} {a.outputUnit}
                                                            </Badge>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <Badge variant="secondary">{a.components?.length || 0} item(s)</Badge>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <Badge className={statusBadge[a.status]?.className}>
                                                            {statusBadge[a.status]?.label || a.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => { setSelected(a); setSheetOpen(true); }}
                                                                className="text-indigo-600 hover:text-indigo-700"
                                                            >
                                                                <Eye className="h-4 w-4 mr-1" />
                                                                View
                                                            </Button>
                                                            {a.status === "DRAFT" && (
                                                                <>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        disabled={isActionLoading}
                                                                        onClick={() => handleComplete(a)}
                                                                        className="text-emerald-600 hover:text-emerald-700"
                                                                    >
                                                                        <Wrench className="h-4 w-4 mr-1" />
                                                                        Selesai
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        disabled={isActionLoading}
                                                                        onClick={() => handleCancel(a)}
                                                                        className="text-red-600 hover:text-red-700"
                                                                    >
                                                                        Batal
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Detail Sheet */}
            {selected && (
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
                        <SheetHeader>
                            <SheetTitle className="flex items-center gap-2">
                                <Wrench className="h-5 w-5 text-indigo-600" />
                                Detail Perakitan
                            </SheetTitle>
                            <SheetDescription>
                                Detail informasi perakitan barang
                            </SheetDescription>
                        </SheetHeader>

                        <div className="mt-6 space-y-6">
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                    Informasi Perakitan
                                </h3>
                                <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">No. Perakitan</p>
                                        <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                            {selected.assemblyNumber}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Status</p>
                                        <Badge className={statusBadge[selected.status]?.className}>
                                            {statusBadge[selected.status]?.label || selected.status}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Tanggal</p>
                                        <p className="font-medium text-sm">{formatDate(selected.assemblyDate)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Gudang</p>
                                        <p className="font-medium text-sm">{selected.warehouse?.name || warehouseMap[selected.warehouseId] || "-"}</p>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                    Hasil Perakitan
                                </h3>
                                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                    <div className="rounded-lg bg-indigo-100 dark:bg-indigo-900/50 p-3">
                                        <Package className="h-8 w-8 text-indigo-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-800 dark:text-slate-100">
                                            {selected.outputProduct?.code} - {selected.outputProduct?.name}
                                        </p>
                                        <p className="text-sm text-slate-500 mt-0.5">
                                            Jumlah: {Number(selected.outputQuantity)} {selected.outputUnit}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                    Komponen ({selected.components?.length || 0})
                                </h3>
                                <div className="space-y-2">
                                    {selected.components?.map((comp: any, index: number) => (
                                        <div key={comp.id || index} className="p-3 border rounded-lg">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                        {comp.product?.code || "-"}
                                                    </span>
                                                    <span className="text-slate-400">|</span>
                                                    <span className="font-medium text-sm">{comp.product?.name || "-"}</span>
                                                </div>
                                                <Badge variant="secondary" className="text-xs">#{index + 1}</Badge>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div>
                                                    <span className="text-slate-500">Quantity:</span>
                                                    <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                                                        {Number(comp.quantity)} {comp.unit}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Cogs:</span>
                                                    <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                                                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(comp.cogs))}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {selected.notes && (
                                <>
                                    <Separator />
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                            Catatan
                                        </h3>
                                        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                            <p className="text-sm text-slate-700 dark:text-slate-300">{selected.notes}</p>
                                        </div>
                                    </div>
                                </>
                            )}

                            {selected.status === "DRAFT" && (
                                <>
                                    <Separator />
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            disabled={isActionLoading}
                                            onClick={() => handleCancel(selected)}
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            disabled={isActionLoading}
                                            onClick={() => handleComplete(selected)}
                                            className="bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            <Wrench className="h-4 w-4 mr-2" />
                                            Selesaikan Perakitan
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>
            )}
        </AdminLayout>
    );
}
