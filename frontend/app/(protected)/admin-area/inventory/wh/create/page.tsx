"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PackagePlus } from "lucide-react";

import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { useSession } from "@/components/clientSessionProvider";
import { AdminLoading } from "@/components/admin-loading";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/use-media-query";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import CreateWarehouseForm from "@/components/wh/createWhForm";
import { generateSimpleCode } from "@/lib/action/wh/whAction";

export default function CreateWarehousePage() {
    const router = useRouter();
    const { user, isLoading } = useSession();
    const isMobile = useMediaQuery("(max-width: 768px)");

    // 🔐 Guard role
    useEffect(() => {
        if (!isLoading && user?.role !== "admin") {
            toast.error("You are not authorized to access this page");
            router.push("/admin-area/inventory/wh");
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return <AdminLoading />;
    }

    return (
        <AdminLayout
            title="Warehouse Management"
            role={user?.role || "guest"}
        >
            <div className="h-full w-full">
                <div className="flex-1 space-y-4 py-2 pt-4 md:p-8">

                    {/* Breadcrumb */}
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/admin-area/inventory/wh">
                                    Warehouse
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Create Warehouse</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-primary/10 p-2 dark:bg-primary/20">
                                <PackagePlus className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold">
                                    Create New Warehouse
                                </h1>
                                <p className="text-sm md:text-base text-muted-foreground mt-1">
                                    Add a new warehouse to your inventory system
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Card */}
                    <div className="rounded-xl border bg-background p-4 md:p-6 shadow-sm">
                        <CreateWarehouseForm
                            generateCode={generateSimpleCode}
                            onSuccess={() => {
                                toast.success("Warehouse created successfully");
                                router.push("/admin-area/inventory/wh");
                            }}
                            onCancel={() => router.back()}
                        />
                    </div>

                </div>
            </div>
        </AdminLayout>
    );
}