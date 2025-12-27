"use client";

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { AdminLayout } from '@/components/admin-panel/admin-layout';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { TransferForm } from '@/components/transfer/TransferForm';

export default function CreateTransferPage() {
    const router = useRouter();

    const handleSuccess = () => {
        router.push('/admin-area/inventory/transfer');
    };

    const handleCancel = () => {
        router.back();
    };

    return (
        <AdminLayout title="Create Transfer" role="admin">
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
                        <BreadcrumbPage>Create</BreadcrumbPage>
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
                            <CardTitle>Buat Transfer Baru</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <TransferForm onSuccess={handleSuccess} onCancel={handleCancel} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
