"use client";

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
import { Button } from "@/components/ui/button";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";
import { PrApprovalTable } from "@/components/prApprove/tabelData";
import { useUangMuka, useDeleteUangMuka } from "@/hooks/use-um";
import { useEffect, useState } from "react";
import { AdminLoading } from "@/components/admin-loading";
import { UangMukaQueryInput } from "@/types/typesUm";
import { useSession } from "@/components/clientSessionProvider";

export default function UmPageAdmin() {
    const { mutate: deleteUangMuka, isPending: isDeleting } = useDeleteUangMuka();
    const router = useRouter();
    const { user, isLoading: userLoading } = useSession();

    const [filters, setFilters] = useState<UangMukaQueryInput>({
        page: 1,
        limit: 10,
        search: "",
        status: undefined,
    });

    // ✅ Gunakan filters di hook useUangMuka
    const {
        data: uangMukaResponse,
        isLoading,
        isError,
        error,
        refetch
    } = useUangMuka(filters);

    const handleFilterChange = (newFilters: UangMukaQueryInput) => {
        setFilters(newFilters);
    };

    // Redirect jika bukan admin
    useEffect(() => {
        if (!userLoading && user?.role !== "admin") {
            router.push("/unauthorized");
        }
    }, [user, userLoading, router]);

    if (userLoading || isLoading) {
        return <AdminLoading message="Loading Uang Muka data..." />;
    }

    // Handle error state
    if (isError) {
        return (
            <AdminLayout
                title="Uang Muka Management"
                role="admin"
            >
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="text-red-500 text-lg font-semibold">
                        Error loading uang muka
                    </div>
                    <div className="text-gray-600 text-sm">
                        {error?.message || "Terjadi kesalahan saat memuat data"}
                    </div>
                    <Button
                        onClick={() => refetch()}
                        variant="outline"
                    >
                        Try Again
                    </Button>
                </div>
            </AdminLayout>
        );
    }

    const userRole = user ? { id: user.id } : { id: "unknown" };
    
    // ✅ Fix pagination dengan default values
    const uangMukaList = uangMukaResponse?.data || [];
    const pagination = {
        page: uangMukaResponse?.pagination?.page || filters.page || 1,
        limit: uangMukaResponse?.pagination?.limit || filters.limit || 10,
        total: uangMukaResponse?.pagination?.total || 0,
        totalPages: uangMukaResponse?.pagination?.totalPages || 0
    };

    const layoutProps: LayoutProps = {
        title: "Finance",
        role: "admin",
        children: (
            <>
                <div className="flex justify-between items-center mb-4">
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
                                        <Link href="/admin-area/finance">Finance</Link>
                                    </Badge>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <Badge variant="outline">
                                    <BreadcrumbPage>Request Approve List</BreadcrumbPage>
                                </Badge>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                <div className="h-full w-full">
                    <div className="flex-1 space-y-2 p-2 pt-1 md:p-4">
                        <PrApprovalTable
                            uangMukaList={uangMukaList}
                            isLoading={isLoading}
                            isError={isError}
                            role={userRole}
                            pagination={pagination}
                            onDelete={(id, options) =>
                                deleteUangMuka(id, {
                                    onSuccess: () => {
                                        options?.onSuccess?.();
                                        refetch();
                                    },
                                    onError: (error) => {
                                        options?.onError?.(error);
                                    },
                                })
                            }
                            isDeleting={isDeleting}
                            onRefresh={refetch}
                            onFilterChange={handleFilterChange}
                            currentFilters={filters}
                        />
                    </div>
                </div>
            </>
        ),
    };

    return <AdminLayout {...layoutProps} />;
}