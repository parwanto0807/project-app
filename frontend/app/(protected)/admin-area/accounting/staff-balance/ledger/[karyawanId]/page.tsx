import { Suspense } from "react";
import { getStaffLedgerByKaryawan, getStaffBalanceByKaryawan } from "@/lib/action/staffBalance/staffBalanceAction";
import { StaffLedgerContent } from "@/components/staffBalance/StaffLedgerContent";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Wallet } from "lucide-react";
import Link from "next/link";
import { StaffBalance } from "@/types/staffBalance";
import HeaderCard from "@/components/ui/header-card";
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { AdminLayout } from "@/components/admin-panel/admin-layout";

interface PageProps {
    params: Promise<{
        karyawanId: string;
    }>;
    searchParams: Promise<{
        page?: string;
        limit?: string;
        category?: string;
        type?: string;
        startDate?: string;
        endDate?: string;
    }>;
}

export default async function StaffLedgerPage({ params, searchParams }: PageProps) {
    const { karyawanId } = await params;
    const resolvedSearchParams = await searchParams;
    const page = parseInt(resolvedSearchParams.page || "1");
    const limit = parseInt(resolvedSearchParams.limit || "20");
    const category = resolvedSearchParams.category || "";
    const type = resolvedSearchParams.type || "";
    const startDate = resolvedSearchParams.startDate || "";
    const endDate = resolvedSearchParams.endDate || "";

    try {
        // Fetch ledger data and balance info in parallel
        const [ledgerResponse, balanceResponse] = await Promise.all([
            getStaffLedgerByKaryawan(karyawanId, {
                page,
                limit,
                category,
                type,
                startDate,
                endDate,
            }),
            getStaffBalanceByKaryawan(karyawanId),
        ]);

        const karyawanInfo = balanceResponse.data[0]?.karyawan;

        return (
            <AdminLayout title="Staff Ledger" role="admin">
                <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
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
                                    <BreadcrumbLink asChild>
                                        <Link href="/admin-area/accounting/staff-balance">
                                            Saldo Karyawan
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>
                                        {karyawanInfo?.namaLengkap || "Ledger"}
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        {/* Header Card */}
                        <HeaderCard
                            title={karyawanInfo?.namaLengkap || "Karyawan"}
                            description={`Ledger transaksi dan riwayat saldo karyawan`}
                            icon={<User className="h-6 w-6 text-white" />}
                            gradientFrom="from-blue-500"
                            gradientTo="to-purple-600"
                            variant="default"
                            backgroundStyle="gradient"
                        >
                            {/* Employee Details */}
                            <div className="mt-4 pt-4 border-t border-white/20">
                                <div className="flex flex-wrap gap-4 text-sm text-white/90">
                                    {karyawanInfo?.email && (
                                        <span className="flex items-center gap-1">
                                            📧 {karyawanInfo.email}
                                        </span>
                                    )}
                                    {karyawanInfo?.departemen && (
                                        <span className="flex items-center gap-1">
                                            🏢 {karyawanInfo.departemen}
                                        </span>
                                    )}
                                    {karyawanInfo?.jabatan && (
                                        <span className="flex items-center gap-1">
                                            💼 {karyawanInfo.jabatan}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </HeaderCard>

                        {/* Balance Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {balanceResponse.data.map((balance: StaffBalance) => (
                                <div
                                    key={balance.id}
                                    className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                {balance.category === "OPERASIONAL_PROYEK"
                                                    ? "Operasional Proyek"
                                                    : "Pinjaman Pribadi"}
                                            </p>
                                            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                                {new Intl.NumberFormat("id-ID", {
                                                    style: "currency",
                                                    currency: "IDR",
                                                    minimumFractionDigits: 0,
                                                }).format(Number(balance.amount))}
                                            </p>
                                        </div>
                                        <Wallet className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Ledger Content */}
                        <Suspense fallback={<LedgerSkeleton />}>
                            <StaffLedgerContent
                                initialData={ledgerResponse.data}
                                pagination={ledgerResponse.pagination}
                                karyawanId={karyawanId}
                                karyawanName={karyawanInfo?.namaLengkap || "Karyawan"}
                            />
                        </Suspense>
                    </div>
                </div>
            </AdminLayout>
        );
    } catch (error) {
        console.error("Error loading staff ledger:", error);
        return (
            <AdminLayout title="Staff Ledger" role="admin">
                <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
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
                                    <BreadcrumbLink asChild>
                                        <Link href="/admin-area/finance/staff-balance">
                                            Saldo Karyawan
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Ledger</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                            <div className="text-center py-12">
                                <p className="text-red-600 dark:text-red-400">
                                    Gagal memuat data ledger. Silakan coba lagi.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        );
    }
}

function LedgerSkeleton() {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    );
}
