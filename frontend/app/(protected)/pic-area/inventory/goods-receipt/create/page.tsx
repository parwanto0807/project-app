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
import HeaderCard from '@/components/ui/header-card';
import { PackagePlus, ArrowLeft } from 'lucide-react';
import { PicLayout } from '@/components/admin-panel/pic-layout';
import { GoodsReceiptForm } from '@/components/inventoryGr/GoodsReceiptForm';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
    title: 'Create Goods Receipt | Warehouse Management',
    description: 'Create new goods receipt for incoming materials',
};

interface PageProps {
    searchParams: Promise<{
        poId?: string;
    }>;
}

export default async function CreateGoodsReceiptPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const poId = params.poId;

    return (
        <PicLayout title="Create Goods Receipt" role="pic">
            {/* Breadcrumb */}
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/pic-area">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/pic-area/inventory/dashboard">Inventory</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/pic-area/inventory/goods-receipt">
                            Goods Receipts
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Create New</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* Main Content */}
            <div className="flex-1 min-h-0 overflow-auto">
                <div className="space-y-4 p-2 pt-1 md:p-4">
                    {/* Header Card */}
                    <HeaderCard
                        title="Create Goods Receipt"
                        description="Record incoming materials and perform quality control inspection"
                        icon={<PackagePlus className="h-7 w-7" />}
                        gradientFrom="from-emerald-600"
                        gradientTo="to-teal-600"
                        showActionArea={true}
                        actionArea={
                            <Link href="/pic-area/inventory/goods-receipt">
                                <Button variant="outline" className="gap-2">
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to List
                                </Button>
                            </Link>
                        }
                    />

                    {/* Form Card */}
                    <Card>
                        <CardContent className="pt-6">
                            <Suspense fallback={<div className="text-center py-8">Loading form...</div>}>
                                <GoodsReceiptForm poId={poId} />
                            </Suspense>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PicLayout>
    );
}

