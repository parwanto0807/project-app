"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Play, Download, Loader2, CheckCircle, XCircle, Plus } from "lucide-react";

import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { useSession } from "@/components/clientSessionProvider";

import HeaderCard from "@/components/ui/header-card";
import { getDataMr, bulkIssueMR } from "@/lib/action/inventory/mrInventroyAction";
import TableMR from "@/components/inventoryMr/TableMr";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function MaterialRequisitionPage() {
    const [allMR, setAllMR] = useState<any[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isInternalLoading, setIsInternalLoading] = useState(true);

    const [bulkOpen, setBulkOpen] = useState(false);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkProgress, setBulkProgress] = useState("");
    const [bulkResult, setBulkResult] = useState<{ succeeded: any[]; failed: any[] } | null>(null);

    const router = useRouter();
    const { user, isLoading: sessionLoading } = useSession();

    /* =========================
        FETCH DATA
    ========================= */
    useEffect(() => {
        if (sessionLoading) return;

        if (user?.role !== "admin" && user?.role !== "staff") {
            router.push("/unauthorized");
            return;
        }

        const fetchData = async () => {
            setIsInternalLoading(true);
            try {
                const res = await getDataMr({ pageSize: 9999 });

                if (res.success && res.data) {
                    setAllMR(res.data.data);
                } else {
                    setAllMR([]);
                }
            } catch (error) {
                console.error("âŒ Error fetching MR:", error);
                setAllMR([]);
            } finally {
                setIsInternalLoading(false);
            }
        };

        fetchData();
    }, [router, user, sessionLoading, refreshTrigger]);

    /* =========================
        HANDLERS
    ========================= */
    const handleRefresh = useCallback(() => {
        setRefreshTrigger((prev) => prev + 1);
    }, []);

    /* =========================
        BULK APPROVE
    ========================= */
    const handleBulkApprove = async () => {
        if (!user?.id) {
            toast.error("User ID tidak ditemukan");
            return;
        }

        setBulkOpen(true);
        setBulkLoading(true);
        setBulkProgress("Memproses semua MR PENDING...");
        setBulkResult(null);

        try {
            const res = await bulkIssueMR(user.id);
            if (res.success && res.data) {
                setBulkResult(res.data);
                toast.success(`Bulk approve selesai: ${res.data.succeeded.length} berhasil, ${res.data.failed.length} gagal`);
            } else {
                toast.error(res.error || "Gagal bulk approve");
            }
        } catch (err: any) {
            toast.error(err.message || "Terjadi kesalahan");
        } finally {
            setBulkLoading(false);
            setBulkProgress("");
            handleRefresh();
        }
    };

    const exportCSV = () => {
        if (!bulkResult?.failed?.length) return;

        const header = "MR Number,Product Code,Product Name,Qty Requested,Error Message";
        const rows = bulkResult.failed.flatMap((f: any) =>
            (f.items || []).map((it: any) =>
                `"${f.mrNumber}","${it.productCode}","${it.productName}","${it.qtyRequested}","${(f.error || '').replace(/"/g, '""')}"`
            )
        );

        const csv = [header, ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bulk-approve-failed-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <AdminLayout title="Material Requisition" role={user?.role || "guest"}>
            <div className="space-y-4 p-4">
                {/* Breadcrumb */}
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <Badge variant="outline" asChild>
                                <Link href="/admin-area">Dashboard</Link>
                            </Badge>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <Badge variant="outline">Inventory</Badge>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <Badge variant="outline">
                                <BreadcrumbPage>Material Requisition</BreadcrumbPage>
                            </Badge>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                {/* Header */}
                <HeaderCard
                    title={
                        <span>
                            <span className="md:hidden">MR</span>
                            <span className="hidden md:inline">Material Requisition / Pengambilan Barang Gudang</span>
                        </span>
                    }
                    description="Pantau dan kelola pengeluaran barang gudang"
                    icon={<ClipboardList className="h-5 w-5 md:h-7 md:w-7" />}
                    showActionArea={false}
                    actionArea={false}
                />

                {/* Action Buttons */}
                <div className="flex justify-between items-center gap-4">
                    <Link href="/admin-area/inventory/requisition/direct">
                        <Button className="bg-emerald-600 hover:bg-emerald-700 hover:text-white text-white gap-2">
                            <Plus className="h-4 w-4" />
                            Buat Pengeluaran Kantor
                        </Button>
                    </Link>
                    <Button onClick={handleBulkApprove} disabled={bulkLoading} className="gap-2">
                        {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                        Approve Semua (Bulk)
                    </Button>
                </div>

                {/* Tabel MR */}
                <TableMR
                    data={allMR}
                    isLoading={isInternalLoading || sessionLoading}
                    onRefresh={handleRefresh}
                />
            </div>


            {/* Bulk Progress / Result Dialog */}
            <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>
                            {bulkLoading ? "Memproses..." : "Hasil Bulk Approve"}
                        </DialogTitle>
                        <DialogDescription>
                            {bulkLoading
                                ? bulkProgress
                                : bulkResult
                                    ? `${bulkResult.succeeded.length} berhasil, ${bulkResult.failed.length} gagal`
                                    : ""}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                        {bulkLoading && (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            </div>
                        )}

                        {!bulkLoading && bulkResult && (
                            <>
                                {bulkResult.succeeded.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-green-700 mb-1 flex items-center gap-1">
                                            <CheckCircle className="h-4 w-4" /> Berhasil ({bulkResult.succeeded.length})
                                        </h4>
                                        <div className="max-h-32 overflow-y-auto text-xs space-y-0.5">
                                            {bulkResult.succeeded.map((s: any) => (
                                                <div key={s.id} className="text-green-600">âœ“ {s.mrNumber}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {bulkResult.failed.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-red-700 mb-1 flex items-center gap-1">
                                            <XCircle className="h-4 w-4" /> Gagal ({bulkResult.failed.length})
                                        </h4>
                                        <div className="max-h-64 overflow-y-auto text-xs space-y-1">
                                            {bulkResult.failed.map((f: any) => (
                                                <div key={f.id} className="p-2 rounded bg-red-50 border border-red-200">
                                                    <span className="font-semibold text-red-800">{f.mrNumber}</span>
                                                    <span className="text-red-600 ml-2">{f.error}</span>
                                                    {f.items?.length > 0 && (
                                                        <div className="mt-1 text-red-500">
                                                            {f.items.map((it: any, i: number) => (
                                                                <div key={i}>
                                                                    {it.productName} ({it.productCode}) x{it.qtyRequested}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <DialogFooter className="gap-2">
                        {!bulkLoading && (bulkResult?.failed?.length ?? 0) > 0 && (
                            <Button variant="outline" onClick={exportCSV} className="gap-2">
                                <Download className="h-4 w-4" />
                                Export Gagal ke CSV
                            </Button>
                        )}
                        <Button variant="secondary" onClick={() => setBulkOpen(false)}>
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
