import { Suspense } from 'react';
import { Metadata } from 'next';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import HeaderCard from '@/components/ui/header-card';
import Pagination from '@/components/ui/paginationNew';
import { TabelGrInventory } from '@/components/inventoryGr/TabelGrInventory';
import { GrFilters } from '@/components/inventoryGr/GrFilters';
import { getGoodsReceiptsAction, getGoodsReceiptSummaryAction } from '@/lib/action/grInventory/grAction';
import { DocumentStatus } from '@/types/grInventoryType';
import { Package } from 'lucide-react';
import { AdminLayout } from '@/components/admin-panel/admin-layout';
import CreateGrButton from '@/components/inventoryGr/createGrButton';

export const metadata: Metadata = {
    title: 'Goods Receipts Inventory | Warehouse Management',
    description: 'Manage goods receipts and quality control inspections',
};

interface PageProps {
    searchParams: Promise<{
        page?: string;
        limit?: string;
        search?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
        warehouseId?: string;
    }>;
}

export default async function GoodsReceiptsPage({ searchParams }: PageProps) {
    // Await searchParams as required by Next.js 15
    const params = await searchParams;

    // Parse search params
    const page = parseInt(params.page || '1');
    const limit = parseInt(params.limit || '10');
    // Validate status is a valid DocumentStatus enum value
    const statusParam = params.status;
    const status = statusParam && Object.values(DocumentStatus).includes(statusParam as DocumentStatus)
        ? (statusParam as DocumentStatus)
        : undefined;

    const search = params.search;

    // Convert date strings to Date objects
    const startDate = params.startDate ? new Date(params.startDate) : undefined;
    const endDate = params.endDate ? new Date(params.endDate) : undefined;
    const warehouseId = params.warehouseId;

    // Fetch data
    const [grResponse, summaryResponse] = await Promise.all([
        getGoodsReceiptsAction({
            page,
            limit,
            search,
            status,
            startDate,
            endDate,
            warehouseId,
        }),
        getGoodsReceiptSummaryAction(),
    ]);

    const goodsReceipts = grResponse.success ? grResponse.data?.data || [] : [];
    const pagination = grResponse.success ? grResponse.data?.pagination : undefined;
    const summary = summaryResponse.success ? summaryResponse.data : undefined;

    // Prepare stats for HeaderCard
    const stats = [
        {
            title: 'Total GRs',
            value: summary?.totalGRs?.toString() || '0',
            description: 'Total Goods Receipts',
            className: "bg-blue-50/50 border-blue-100 hover:bg-blue-50",
            iconColor: "text-blue-600",
            headerColor: "text-blue-600"
        },
        {
            title: 'Total Received',
            value: summary?.qcStats?.totalReceived ? Number(summary.qcStats.totalReceived).toFixed(0) : '0',
            description: 'Total quantity received',
            className: "bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50",
            iconColor: "text-emerald-600",
            headerColor: "text-emerald-600"
        },
        {
            title: 'Passing Rate',
            value: summary?.qcStats?.passingRate ? `${Number(summary.qcStats.passingRate).toFixed(1)}%` : '0%',
            description: 'QC passing rate',
            className: "bg-violet-50/50 border-violet-100 hover:bg-violet-50",
            iconColor: "text-violet-600",
            headerColor: "text-violet-600"
        },
        {
            title: 'Draft',
            value: summary?.statusCounts?.find((s: any) => s.status === 'DRAFT')?.count || '0',
            description: 'Pending QC inspections',
            className: "bg-amber-50/50 border-amber-100 hover:bg-amber-50",
            iconColor: "text-amber-600",
            headerColor: "text-amber-600"
        },
    ];

    return (
        <AdminLayout title="Goods Receipts Inventory" role="admin">
            {/* Breadcrumb */}
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/warehouse">Warehouse</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Goods Receipts</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* Stats Cards */}
            <div className="flex-1 min-h-0 overflow-auto">
                <div className="space-y-4 p-2 pt-1 md:p-4">
                    {/* Ganti HeaderCard dengan versi sederhana untuk debugging */}
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 p-6 shadow-lg">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            {/* Left side - Title and description */}
                            <div className="flex items-start gap-4">
                                <div className="rounded-lg bg-white/10 p-3">
                                    <Package className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">
                                        Goods Receipts / Penerimaan Barang Management
                                    </h1>
                                    <p className="text-white/80 mt-1">
                                        Manage and monitor all goods receipts and quality control
                                    </p>
                                </div>
                            </div>

                            {/* Right side - Action Area */}
                            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center w-full lg:flex-1 lg:justify-end">
                                {/* Desktop Filters */}
                                <div className="hidden lg:block lg:flex-1 lg:max-w-5xl w-full">
                                    <div className="[&_input]:bg-white/10 [&_input]:border-white/20 [&_input]:text-white [&_input::placeholder]:text-white/60 [&_button]:bg-white/10 [&_button]:border-white/20 [&_button]:text-white [&_button:hover]:bg-white/20 [&_svg]:text-white/80">
                                        <Suspense>
                                            <GrFilters
                                                initialFilters={{
                                                    status,
                                                    search,
                                                    startDate,
                                                    endDate,
                                                    warehouseId
                                                }}
                                            />
                                        </Suspense>
                                    </div>
                                </div>

                                {/* Create Button - visible in all sizes */}
                                <div className="w-full lg:w-auto">
                                    <CreateGrButton role="admin" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {stats.map((stat, i) => (
                            <div
                                key={i}
                                className={`relative overflow-hidden rounded-xl border backdrop-blur-md shadow-sm p-4 transition-all duration-300 hover:shadow-md group ${stat.className}`}
                            >
                                <div className="relative z-10">
                                    <p className={`text-sm font-medium ${stat.headerColor}`}>{stat.title}</p>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                                            {stat.value}
                                        </h3>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{stat.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Main Content */}
                    <div className="space-y-6">
                        {/* Filters (Mobile Only) */}
                        <Card className="lg:hidden">
                            <CardHeader>
                                <CardTitle>Filters</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Suspense fallback={<div>Loading filters...</div>}>
                                    <GrFilters
                                        initialFilters={{
                                            status,
                                            search,
                                            startDate: startDate ? new Date(startDate) : undefined,
                                            endDate: endDate ? new Date(endDate) : undefined,
                                            warehouseId
                                        }}
                                    />
                                </Suspense>
                            </CardContent>
                        </Card>

                        {/* Table */}
                        <Card >
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Goods Receipts List</CardTitle>
                                <div className="text-sm text-gray-500">
                                    Showing {goodsReceipts.length} of {pagination?.totalCount || 0} receipts
                                </div>
                            </CardHeader>
                            <CardContent>
                                <TabelGrInventory
                                    data={goodsReceipts}
                                    isLoading={!grResponse.success}
                                    currentPage={page}
                                    totalPages={pagination?.totalPages || 1}
                                />
                            </CardContent>
                        </Card>

                        {/* Pagination */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex justify-center">
                                <Pagination
                                    currentPage={page}
                                    totalPages={pagination.totalPages}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}