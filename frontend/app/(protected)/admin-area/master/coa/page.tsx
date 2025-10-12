"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";
import { CoaTable } from "@/components/master/coa/tableData";
import { useDeleteCOA, useCOAs } from "@/hooks/use-coa";
import { AdminLoading } from "@/components/admin-loading";

export default function COAPageAdmin() {
    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        search: "",
    });

    const router = useRouter();
    
    // Role auth dummy → ganti sesuai auth system kamu
    const userRole = "admin";

    // ✅ Panggil hook dengan filters
    const {
        data: coasResponse,
        isLoading,
        isError,
        error
    } = useCOAs(filters);

    const { mutate: deleteCOA, isPending: isDeleting } = useDeleteCOA();

    // Redirect jika bukan admin
    useEffect(() => {
        if (userRole !== "admin") {
            router.push("/unauthorized");
        }
    }, [userRole, router]);

    const handlePageChange = (page: number) => {
        setFilters(prev => ({ ...prev, page }));
    };

    const handleLimitChange = (limit: number) => {
        setFilters(prev => ({ ...prev, limit, page: 1 })); // Reset ke page 1 saat limit berubah
    };

    const handleSearchChange = (search: string) => {
        setFilters(prev => ({ ...prev, search, page: 1 })); // Reset ke page 1 saat search berubah
    };

    const handleDelete = (id: string) => {
        deleteCOA(id, {
            onSuccess: () => {
                // Optional: Refresh data atau tampilkan notifikasi
                // Data akan otomatis refresh karena query key berubah
            }
        });
    };

    // Handle loading state
    if (isLoading) {
        return <AdminLoading message="Loading Chart of Accounts data..." />;
    }

    // Handle error state
    if (isError) {
        return (
            <AdminLayout
                title="Chart of Accounts Management"
                role="admin"
            >
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="text-red-500 text-lg font-semibold">
                        Error loading chart of accounts
                    </div>
                    <div className="text-gray-600 text-sm">
                        {error?.message || "Terjadi kesalahan saat memuat data"}
                    </div>
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Coba Lagi
                    </button>
                </div>
            </AdminLayout>
        );
    }

    const layoutProps: LayoutProps = {
        title: "Chart of Accounts Management",
        role: "admin",
        children: (
            <>
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Badge variant="outline">
                                    <Link href="/admin-area">Dashboard</Link>
                                </Badge>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Badge variant="outline">
                                    Accounting Master
                                </Badge>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <Badge variant="outline">
                                <BreadcrumbPage>Chart of Accounts</BreadcrumbPage>
                            </Badge>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="h-full w-full">
                    <div className="flex-1 space-y-2 p-2 pt-1 md:p-4">
                        {/* ✅ lempar data ke komponen tabel */}
                        <CoaTable
                            coas={coasResponse?.data || []}
                            isLoading={isLoading}
                            isError={isError}
                            role="admin"
                            pagination={coasResponse?.pagination || { 
                                page: filters.page, 
                                limit: filters.limit, 
                                total: 0, 
                                pages: 1 
                            }}
                            onDelete={handleDelete}
                            isDeleting={isDeleting}
                            onPageChange={handlePageChange}
                            onLimitChange={handleLimitChange}
                            onSearchChange={handleSearchChange}
                            currentSearch={filters.search}
                        />
                    </div>
                </div>
            </>
        ),
    };

    return <AdminLayout {...layoutProps} />;
}