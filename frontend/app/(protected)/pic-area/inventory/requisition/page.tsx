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

import { PicLayout } from '@/components/admin-panel/pic-layout';
import { useSession } from "@/components/clientSessionProvider";
import { useMediaQuery } from "@/hooks/use-media-query";
import HeaderCard from "@/components/ui/header-card";

import { getDataMr } from "@/lib/action/inventory/mrInventroyAction";
import TableMR from "@/components/inventoryMr/TableMr";

export default function MaterialRequisitionPage() {
    const [allMR, setAllMR] = useState<any[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isInternalLoading, setIsInternalLoading] = useState(true);

    const router = useRouter();
    const { user, isLoading: sessionLoading } = useSession();
    const isMobile = useMediaQuery("(max-width: 768px)");

    /* =========================
        FETCH DATA
    ========================= */
    useEffect(() => {
        if (sessionLoading) return;

        // Proteksi Role (Opsional)
        if (user?.role !== "admin" && user?.role !== "staff" && user?.role !== "pic") {
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
        <PicLayout title="Material Requisition" role="pic">
            <div className="space-y-4 p-4">
                {/* Breadcrumb */}
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <Badge variant="outline" asChild>
                                <Link href="/pic-area">Dashboard</Link>
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
                    title={isMobile ? "MR" : "Material Requisition / Pengambilan Barang Management"}
                    description="Pantau dan kelola pengeluaran barang gudang"
                    icon={<ClipboardList className={isMobile ? "h-5 w-5" : "h-7 w-7"} />}
                    showActionArea={!isMobile}
                    actionArea={false}
                />

                {/* Tabel MR */}
                <TableMR
                    data={allMR}
                    isLoading={isInternalLoading || sessionLoading}
                    onRefresh={handleRefresh}
                />
            </div>
        </PicLayout>
    );
}
