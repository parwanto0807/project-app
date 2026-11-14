// components/pr/component/purchase-request-wrapper.tsx - VERSI REAL LOADING
"use client";

import { useState, useEffect } from "react";
import { PurchaseRequestTable } from "@/components/pr/component/PurchaseRequestTable";
import { AdminLoading } from "@/components/admin-loading";
import { PurchaseRequest, PaginationInfo, PRStatus } from "@/types/pr";
import { useSession } from "@/components/clientSessionProvider";

interface PurchaseRequestClientWrapperProps {
    initialData: {
        purchaseRequests: PurchaseRequest[];
        pagination: PaginationInfo;
        currentSearch: string;
        currentStatus?: PRStatus;
        currentProjectId?: string;
        currentDateFrom?: Date;
        currentDateTo?: Date;
        currentTab?: "all" | "umum" | "project";
    };
}

export function PurchaseRequestClientWrapper({ initialData }: PurchaseRequestClientWrapperProps) {
    const [data, setData] = useState(initialData);
    const { user, isLoading: userLoading } = useSession();

    // Update data ketika initialData berubah
    useEffect(() => {
        setData(initialData);
    }, [initialData]);

    // Tampilkan AdminLoading hanya saat sesi user masih dicek.
    // (Delay buatan 800ms dihapus — data sudah tersedia dari server component.)
    if (userLoading) {
        return (
            <div className="fixed inset-0 z-10 bg-background/95 backdrop-blur-sm flex items-center justify-center">
                <div className="w-full text-center">
                    <AdminLoading message="Checking user session..." />
                    <div className="mt-6 space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Checking user session...
                        </p>
                        <div className="flex justify-center space-x-1">
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                                    style={{ animationDelay: `${i * 0.1}s` }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <PurchaseRequestTable
            purchaseRequests={data.purchaseRequests}
            isLoading={false}
            isError={false}
            role={user?.role as "super" | "admin" | "pic"}
            pagination={data.pagination}
            currentSearch={data.currentSearch}
            currentStatus={data.currentStatus}
            currentProjectId={data.currentProjectId}
            currentDateFrom={data.currentDateFrom}
            currentDateTo={data.currentDateTo}
            currentTab={data.currentTab}
        />
    );
}