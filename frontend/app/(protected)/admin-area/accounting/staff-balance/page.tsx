import React, { Suspense } from "react";
import { getStaffBalances } from "@/lib/action/staffBalance/staffBalanceAction";
import { StaffBalanceContent } from "./StaffBalanceContent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import HeaderCard from "@/components/ui/header-card";
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { AdminLayout } from "@/components/admin-panel/admin-layout";

interface PageProps {
    searchParams: Promise<{
        page?: string;
        limit?: string;
        search?: string;
        category?: string;
    }>;
}

export default async function StaffBalancePage({ searchParams }: PageProps) {
    const params = await searchParams;
    const page = parseInt(params.page || "1");
    const limit = parseInt(params.limit || "10");
    const search = params.search || "";
    const category = params.category || "";

    const response = await getStaffBalances({
        page,
        limit,
        search,
        category,
        sortBy: "updatedAt",
        sortOrder: "desc",
    });

    const { data, summary, pagination } = response;

    return (
        <AdminLayout title="Staff Balance" role="admin">
            <div className="container mx-auto py-6 space-y-6">
                {/* Breadcrumb */}
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href="/admin-area">Dashboard</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Saldo Karyawan</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                {/* Header Card */}
                <HeaderCard
                    title="Staff Balance"
                    description="Kelola dan pantau saldo karyawan untuk operasional proyek dan pinjaman pribadi"
                    icon={<Wallet className="h-6 w-6 text-white" />}
                    gradientFrom="from-blue-500"
                    gradientTo="to-indigo-600"
                    variant="default"
                    backgroundStyle="gradient"
                />

                {/* Summary Cards */}
                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Operasional / Sisa Saldo Operasional
                            </CardTitle>
                            <Wallet className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {formatCurrency(summary.totalOperasional)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Saldo berjalan operasional
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Pinjaman
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">
                                {formatCurrency(summary.totalPinjaman)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Saldo berjalan pinjaman
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Pengeluaran
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">
                                {formatCurrency(summary.totalOut)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Total dana keluar / terpakai
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Sisa Saldo Operasional dan Pinjaman
                            </CardTitle>
                            <Users className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(summary.grandTotal)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Total keseluruhan saldo aktif
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <Suspense fallback={<div>Loading...</div>}>
                    <StaffBalanceContent
                        initialData={data}
                        initialPagination={pagination}
                        initialSearch={search}
                        initialCategory={category}
                    />
                </Suspense>
            </div>
        </AdminLayout>
    );
}
