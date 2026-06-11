"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin-panel/admin-layout';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { TransferForm } from '@/components/transfer/TransferForm';
import { useTransfer } from '@/hooks/use-tf';
import { toast } from 'sonner';

export default function EditTransferPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const { data: transferResponse, isLoading, isError } = useTransfer(id);

    const handleSuccess = () => {
        router.push('/admin-area/inventory/transfer');
    };

    const handleCancel = () => {
        router.back();
    };

    if (isLoading) {
        return (
            <AdminLayout title="Edit Transfer" role="admin">
                <div className="flex items-center justify-center h-full min-h-[400px]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </AdminLayout>
        );
    }

    if (isError || !transferResponse?.data) {
        return (
            <AdminLayout title="Edit Transfer" role="admin">
                <div className="p-4 flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
                    <p className="text-lg text-slate-600 dark:text-slate-400">Gagal memuat data transfer atau data tidak ditemukan.</p>
                    <Button onClick={() => router.back()} variant="outline">
                        Kembali
                    </Button>
                </div>
            </AdminLayout>
        );
    }

    const transferData = transferResponse.data;

    if (transferData.status !== 'DRAFT') {
        return (
            <AdminLayout title="Edit Transfer" role="admin">
                <div className="p-4 flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
                    <p className="text-lg text-red-500 font-medium">Hanya transfer berstatus DRAFT yang dapat diedit.</p>
                    <Button onClick={() => router.back()} variant="outline">
                        Kembali
                    </Button>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title={`Edit Transfer ${transferData.transferNumber}`} role="admin">
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
                        <BreadcrumbLink href="/admin-area/inventory/transfer">Transfer</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Edit</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex-1 min-h-0 overflow-auto">
                <div className="space-y-4 p-2 pt-1 md:p-4">
                    {/* Back Button */}
                    <div>
                        <Button
                            variant="ghost"
                            onClick={handleCancel}
                            className="mb-2"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Kembali
                        </Button>
                    </div>

                    {/* Form Card */}
                    <Card className="max-w-7xl mx-auto">
                        <CardHeader>
                            <CardTitle>Edit Transfer - {transferData.transferNumber}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <TransferForm 
                                initialData={transferData}
                                onSuccess={handleSuccess} 
                                onCancel={handleCancel} 
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
