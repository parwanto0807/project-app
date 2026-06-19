"use client";

import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin-panel/admin-layout';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import InternalTransferForm from '@/components/transfer/InternalTransferForm';

export default function CreateInternalTransferPage() {
    const router = useRouter();

    return (
        <AdminLayout title="Create Internal Transfer" role="admin">
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
                        <BreadcrumbLink href="/admin-area/inventory/internal-transfer">Internal Transfer</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Create New</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex-1 min-h-0 overflow-auto">
                <div className="space-y-4 p-2 pt-1 md:p-4 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 shadow-lg">
                        <div className="flex items-start gap-4">
                            <div className="rounded-lg bg-white/10 p-3">
                                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H9m9 0v9m-9 0h9" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">
                                    Create Internal Transfer
                                </h1>
                                <p className="text-white/80 mt-1">
                                    Transfer stock langsung dari Bengkel/Kantor ke WIP Project
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4">
                        <div className="flex items-start gap-3">
                            <div className="text-2xl">⚡</div>
                            <div>
                                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                                    Quick Transfer - No MR/GR Needed
                                </h3>
                                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                                    <li>✓ Stock otomatis terupdate di kedua gudang</li>
                                    <li>✓ Tanpa proses approval</li>
                                    <li>✓ Tanpa MR dan GR</li>
                                    <li>✓ Instant completion</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Transfer Form */}
                    <InternalTransferForm />
                </div>
            </div>
        </AdminLayout>
    );
}
