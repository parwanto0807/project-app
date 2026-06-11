"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ArrowLeftRight, Plus } from 'lucide-react';
import { AdminLayout } from '@/components/admin-panel/admin-layout';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { TransferTable } from '@/components/transfer/TransferTable';
import { useTransfers } from '@/hooks/use-tf';

export default function TransferPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const search = searchParams.get('search') || '';
    const [page, setPage] = useState(1);
    const limit = 10;
    
    const { data: transfersData, isLoading } = useTransfers({ page, limit, search });

    // API returns: { success: true, data: [...], pagination: {...} }
    // data is DIRECTLY the array, not nested!
    const transfers = transfersData?.success && Array.isArray(transfersData.data) ? transfersData.data : [];
    const pagination = (transfersData as any)?.pagination;

    const handleCreateTransfer = () => {
        router.push('/admin-area/inventory/transfer/create');
    };

    return (
        <AdminLayout title="Warehouse Transfer" role="admin">
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
                        <BreadcrumbPage>Transfer</BreadcrumbPage>
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
                                    <ArrowLeftRight className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">
                                        Warehouse Transfer Management
                                    </h1>
                                    <p className="text-white/80 mt-1">
                                        Transfer stock between warehouses
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={handleCreateTransfer}
                                className="bg-white text-indigo-600 hover:bg-white/90"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                New Transfer
                            </Button>
                        </div>
                    </div>

                    {/* Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Transfer List</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <TransferTable data={transfers} isLoading={isLoading} pagination={pagination} onPageChange={setPage} initialSearchQuery={search} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
