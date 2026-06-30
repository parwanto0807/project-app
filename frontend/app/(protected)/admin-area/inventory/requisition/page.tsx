"use client";

import { useEffect, useState, useCallback } from "react";
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
import { ClipboardList } from "lucide-react";

import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { useSession } from "@/components/clientSessionProvider";

import HeaderCard from "@/components/ui/header-card";
import { getDataMr } from "@/lib/action/inventory/mrInventroyAction";
import TableMR from "@/components/inventoryMr/TableMr";

export default function MaterialRequisitionPage() {
    const [allMR, setAllMR] = useState<any[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isInternalLoading, setIsInternalLoading] = useState(true);

    const router = useRouter();
    const { user, isLoading: sessionLoading } = useSession();

    /* =========================
        FETCH DATA
    ========================= */
    useEffect(() => {
        if (sessionLoading) return;

        // Proteksi Role (Opsional)
        if (user?.role !== "admin" && user?.role !== "staff") {
            router.push("/unauthorized");
            return;
        }

        const fetchData = async () => {
            setIsInternalLoading(true);
            try {
                // Kita ambil data tanpa filter page dulu karena pagination dilakukan di client sesuai pola Anda
                const res = await getDataMr({ pageSize: 9999 });

                if (res.success && res.data) {
                    setAllMR(res.data.data);
                } else {
                    setAllMR([]);
                }
            } catch (error) {
                console.error("❌ Error fetching MR:", error);
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

                {/* Tabel MR */}
                <TableMR
                    data={allMR}
                    isLoading={isInternalLoading || sessionLoading}
                    onRefresh={handleRefresh}
                />
            </div>
        </AdminLayout>
    );
}