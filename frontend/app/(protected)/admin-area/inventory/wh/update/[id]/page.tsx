"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { useSession } from "@/components/clientSessionProvider";
import { useMediaQuery } from "@/hooks/use-media-query";
import { toast } from "sonner";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { getWarehouseById } from "@/lib/action/wh/whAction";
import { AdminLoading } from "@/components/admin-loading";
import { Warehouse } from "@/types/whType";
import UpdateWhForm from "@/components/wh/updateWhForm";

export default function EditWarehousePage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user, isLoading } = useSession();
    const isMobile = useMediaQuery("(max-width: 768px)");

    const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
    const [isFetching, setIsFetching] = useState(true);

    // 🔐 Role guard
    useEffect(() => {
        if (!isLoading && user?.role !== "admin") {
            toast.error("Unauthorized access");
            router.push("/admin-area/inventory/wh");
        }
    }, [user, isLoading, router]);

    // 📦 Fetch warehouse detail
    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                const res = await getWarehouseById(id);
                if (!res.success || !res.data) {
                    throw new Error(res.message || "Warehouse not found");
                }

                setWarehouse(res.data);
            } catch (error: unknown) {
                console.error("Fetch warehouse failed:", error);
                toast.error("Warehouse not found");
                router.push("/admin-area/inventory/wh");
            } finally {
                setIsFetching(false);
            }
        };

        fetchData();
    }, [id, router]);

    if (isLoading || isFetching) {
        return <AdminLoading />;
    }

    return (
        <AdminLayout
            title="Warehouse Management"
            role={user?.role || "guest"}
        >
            <div className="flex-1 space-y-4 py-4 md:p-8">

                {/* Breadcrumb */}
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/admin-area">Dashboard</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/admin-area/inventory/wh">
                                Warehouse
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Edit Warehouse</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                {/* Form */}
                <div className="rounded-xl border bg-background p-4 md:p-6 shadow-sm">
                    <UpdateWhForm
                        defaultValues={warehouse}
                        onSuccess={() => {
                            toast.success("Warehouse updated successfully");
                            router.push("/admin-area/inventory/wh");
                        }}
                        onCancel={() => router.back()}
                    />
                </div>

            </div>
        </AdminLayout>
    );
}
