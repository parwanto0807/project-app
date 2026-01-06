import { getUserFromToken } from "@/lib/auth";
import { getInventoryMonitoring } from "@/lib/action/inventory/inventoryAction";
import DashboardClient from "./DashboardClient";
import HeaderCard from "@/components/ui/header-card";
import { Layers, Home, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { PicLayout } from "@/components/admin-panel/pic-layout";

// Force dynamic rendering (uses cookies for auth)
export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
    const user = await getUserFromToken();

    // 1. Logika Periode Default
    const now = new Date();
    const defaultPeriod = format(now, "yyyy-MM");

    // 2. Fetch Data Awal
    const res = await getInventoryMonitoring({
        period: defaultPeriod,
        page: 1,
        limit: 10
    });

    const initialData = res.success && res.data ? res.data.data : [];
    const initialPagination = res.success && res.data ? res.data.pagination : {
        totalCount: 0, totalPages: 0, currentPage: 1, pageSize: 10, hasNext: false, hasPrev: false
    };

    const { getAllWarehouses } = await import("@/lib/action/inventory/inventoryAction");
    const allWarehouses = await getAllWarehouses();

    return (
        <PicLayout title="Inventory Dashboard" role="pic">
            <div className="flex-1 space-y-4 p-4 md:p-6 pt-6">

                {/* --- BREADCRUMB SHADCN UI --- */}
                <Breadcrumb className="mb-4">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <Badge variant="outline">
                                <BreadcrumbLink href="/pic-area">PIC Area</BreadcrumbLink>
                            </Badge>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <Badge variant="outline">
                                <BreadcrumbLink href="#">Inventory</BreadcrumbLink>
                            </Badge>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <Badge variant="outline">
                                <BreadcrumbPage className="font-bold text-indigo-600 dark:text-indigo-400">
                                    Inventory List
                                </BreadcrumbPage>
                            </Badge>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                {/* --- HEADER CARD --- */}
                <HeaderCard
                    title={
                        <div className="flex items-center gap-3">
                            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                                Inventory
                            </span>
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 backdrop-blur-md rounded-full border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-emerald-500 font-bold text-[10px] tracking-[0.2em]">LIVE</span>
                            </div>
                        </div>
                    }
                    description="Real-time analytical oversight of global stock distribution and period-based movement."
                    icon={
                        <div className="p-3 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-inner">
                            <Layers className="h-6 w-6 text-white" />
                        </div>
                    }
                    gradientFrom="from-[#020617]"
                    gradientTo="to-[#1e3a8a]"
                    className="relative overflow-hidden border-b-0 shadow-2xl rounded-3xl"
                >
                    <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/20 blur-[100px] rounded-full -mr-20 -mt-20 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-indigo-500/10 blur-[80px] rounded-full -ml-10 -mb-10 pointer-events-none" />
                </HeaderCard>

                {/* --- CLIENT DASHBOARD --- */}
                <DashboardClient
                    initialItems={initialData}
                    initialPagination={initialPagination}
                    initialTotalValue={res.success && res.data && res.data.summary ? Number(res.data.summary.totalInventoryValue || 0) : 0}
                    initialStats={res.success && res.data && res.data.summary && res.data.summary.stats ? res.data.summary.stats : {
                        total: 0, critical: 0, warning: 0, safe: 0, inactive: 0
                    }}
                    defaultPeriod={defaultPeriod}
                    allWarehouses={allWarehouses}
                    role={user?.role || "guest"}
                />
            </div>
        </PicLayout>
    );
}
