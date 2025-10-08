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
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";
import { RABTable } from "@/components/rab/tableData";
import { useDeleteRAB, useRABs } from "@/hooks/use-rab";
import { useEffect } from "react";
import { AdminLoading } from "@/components/admin-loading";

export default function RABPageAdmin() {
    const { mutate: deleteRAB, isPending: isDeleting } = useDeleteRAB();
    const router = useRouter();

    // Role auth dummy → ganti sesuai auth system kamu
    const userRole = "admin";

    // ✅ Panggil hook → langsung dapat data, loading, error
    const {
        data: rabsResponse,
        isLoading,
        isError,
        error
    } = useRABs();

    // Redirect jika bukan admin
    useEffect(() => {
        if (userRole !== "admin") {
            router.push("/unauthorized");
        }
    }, [userRole, router]);

    // const handleCreateRAB = () => {
    //     router.push("/admin-area/logistic/rab/create");
    // };

    // Handle loading state
    if (isLoading) {
        return <AdminLoading message="Loading RAB data..." />;
    }

    // Handle error state
    if (isError) {
        return (
            <AdminLayout
                title="RAB Management"
                role="admin"
            >
                <div className="flex items-center justify-center h-64">
                    <div className="text-red-500">
                        Error loading RABs: {error?.message}
                    </div>
                </div>
            </AdminLayout>
        );
    }

    // Extract data dari response
    const rabs = rabsResponse?.data || [];
    const pagination = rabsResponse?.pagination;

    const layoutProps: LayoutProps = {
        title: "RAB Management",
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
                                        <Link href="/admin-area/project">Project Management</Link>
                                    </Badge>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <Badge variant="outline">
                                    <BreadcrumbPage>RAB List</BreadcrumbPage>
                                </Badge>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
{/* 
                    <Button onClick={handleCreateRAB} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create RAB
                    </Button> */}
                </div>

                <div className="h-full w-full">
                    <div className="flex-1 space-y-2 p-2 pt-1 md:p-4">
                        {/* ✅ lempar data ke komponen tabel */}
                        <RABTable
                            rabs={rabs}
                            isLoading={isLoading}
                            isError={isError}
                            role={userRole}
                            pagination={pagination}
                            onDelete={(id, options) =>
                                deleteRAB(id, {
                                    onSuccess: () => {
                                        options?.onSuccess?.();
                                    },
                                })
                            }
                            isDeleting={isDeleting}
                        />
                    </div>
                </div>
            </>
        ),
    };

    return <AdminLayout {...layoutProps} />;
}