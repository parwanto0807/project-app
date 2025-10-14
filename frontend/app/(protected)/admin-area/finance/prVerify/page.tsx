"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { PurchaseRequestVerifyTable } from "@/components/prVerify/tableData";
import { usePurchaseRequest } from "@/hooks/use-pr";
import { AdminLoading } from "@/components/admin-loading";
import { PurchaseRequestFilters, PurchaseRequest } from "@/types/pr";

export default function PurchaseRequestPageAdmin() {
    const [filters, setFilters] = useState<PurchaseRequestFilters>({
        status: undefined,
        projectId: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        page: 1,
        limit: 10,
        search: "",
    });

    const router = useRouter();

    // Role auth dummy → ganti sesuai auth system kamu
    const userRole = "admin";

    // ✅ Panggil hook dengan filters
    const {
        purchaseRequests,
        loading,
        error,
        fetchAllPurchaseRequests,
        deletePurchaseRequest,
        updatePurchaseRequestStatus
    } = usePurchaseRequest();

    // Fetch data ketika filter berubah
    useEffect(() => {
        fetchAllPurchaseRequests(filters);
    }, [filters, fetchAllPurchaseRequests]);

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
        setFilters(prev => ({ ...prev, limit, page: 1 }));
    };

    const handleSearchChange = (search: string) => {
        setFilters(prev => ({ ...prev, search, page: 1 }));
    };

    const handleStatusFilterChange = (status: PurchaseRequestFilters['status']) => {
        setFilters(prev => ({ ...prev, status, page: 1 }));
    };

    const handleProjectFilterChange = (projectId: string) => {
        setFilters(prev => ({ ...prev, projectId, page: 1 }));
    };

    const handleDateFilterChange = (dateFrom?: Date, dateTo?: Date) => {
        setFilters(prev => ({ ...prev, dateFrom, dateTo, page: 1 }));
    };

    const handleClearFilters = () => {
        setFilters({
            status: undefined,
            projectId: undefined,
            dateFrom: undefined,
            dateTo: undefined,
            page: 1,
            limit: 10,
            search: "",
        });
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this purchase request?")) {
            try {
                await deletePurchaseRequest(id);
                toast.success("Purchase request deleted successfully");
                // Refresh data setelah delete
                fetchAllPurchaseRequests(filters);
            } catch (error) {
                console.error("Failed to delete purchase request:", error);
                toast.error("Failed to delete purchase request");
            }
        }
    };

    // Handle status update - disesuaikan dengan signature fungsi yang ada
    const handleStatusUpdate = async (id: string, status: PurchaseRequest['status']) => {
        try {
            // Tampilkan loading toast
            const toastId = toast.loading(`Updating status to ${status}...`);

            // Sesuai dengan signature fungsi: updatePurchaseRequestStatus(id: string, data: UpdatePurchaseRequestStatusData)
            await updatePurchaseRequestStatus(id, { status });

            // Update toast menjadi success
            toast.success(`Purchase request status updated to ${status}`, {
                id: toastId
            });

            // Refresh data setelah update status
            fetchAllPurchaseRequests(filters);
        } catch (error) {
            console.error("Failed to update purchase request status:", error);
            toast.error(`Failed to update status: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    };

    // Handle loading state
    if (loading) {
        return <AdminLoading message="Loading Purchase Requests data..." />;
    }

    // Handle error state
    if (error) {
        return (
            <AdminLayout
                title="Purchase Request Management"
                role="admin"
            >
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="text-red-500 text-lg font-semibold">
                        Error loading purchase requests
                    </div>
                    <div className="text-gray-600 text-sm">
                        {error || "Terjadi kesalahan saat memuat data"}
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Try Again
                    </button>
                </div>
            </AdminLayout>
        );
    }

    // Buat pagination info default
    const defaultPagination = {
        page: filters.page || 1,
        limit: filters.limit || 10,
        total: purchaseRequests.length,
        totalPages: Math.ceil(purchaseRequests.length / (filters.limit || 10))
    };

    const layoutProps: LayoutProps = {
        title: "Purchase Request Management",
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
                                    Logistic
                                </Badge>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <Badge variant="outline">
                                <BreadcrumbPage>Verify Purchase Requests</BreadcrumbPage>
                            </Badge>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="h-full w-full">
                    <div className="flex-1 space-y-2 p-2 pt-1 md:p-4">
                        <PurchaseRequestVerifyTable
                            purchaseRequests={purchaseRequests}
                            isLoading={loading}
                            isError={!!error}
                            role="admin"
                            pagination={defaultPagination}
                            onDelete={handleDelete}
                            isDeleting={loading}
                            onPageChange={handlePageChange}
                            onLimitChange={handleLimitChange}
                            onSearchChange={handleSearchChange}
                            onStatusFilterChange={handleStatusFilterChange}
                            onProjectFilterChange={handleProjectFilterChange}
                            onDateFilterChange={handleDateFilterChange}
                            onClearFilters={handleClearFilters}
                            onStatusUpdate={handleStatusUpdate} // ✅ Ditambahkan
                            currentSearch={filters.search}
                            currentStatus={filters.status}
                            currentProjectId={filters.projectId}
                            currentDateFrom={filters.dateFrom}
                            currentDateTo={filters.dateTo}
                        />
                    </div>
                </div>
            </>
        ),
    };

    return <AdminLayout {...layoutProps} />;
}