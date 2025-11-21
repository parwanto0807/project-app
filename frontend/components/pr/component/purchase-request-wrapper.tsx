// components/purchase-request-client-wrapper.tsx - Alternatif lebih baik
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
    };
}

export function PurchaseRequestClientWrapper({ initialData }: PurchaseRequestClientWrapperProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState(initialData);
    const { user, isLoading: userLoading } = useSession();


    // Simulasi loading untuk demo
    useEffect(() => {
        console.log('⏰ Starting loading timer...');
        const timer = setTimeout(() => {
            console.log('✅ Loading completed');
            setIsLoading(false);
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    // Update data ketika initialData berubah
    useEffect(() => {
        if (initialData.purchaseRequests.length > 0) {
            setData(initialData);
        }
    }, [initialData]);

    // Tampilkan AdminLoading FULL SCREEN selama loading
    if (isLoading) {
        return (
            <>
                {/* Background overlay - full screen */}
                <div className="fixed inset-0 z-10 bg-background/95 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-full text-center">
                        <AdminLoading message="Loading purchase requests data..." />
                        <div className="mt-6 space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Preparing your data...
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

                {/* Konten asli yang di-blur di belakang */}
                {/* <div className="blur-sm pointer-events-none">
                    <PurchaseRequestTable
                        purchaseRequests={data.purchaseRequests}
                        isLoading={true}
                        isError={false}
                        role="admin"
                        pagination={data.pagination}
                        currentSearch={data.currentSearch}
                        currentStatus={data.currentStatus}
                        currentProjectId={data.currentProjectId}
                        currentDateFrom={data.currentDateFrom}
                        currentDateTo={data.currentDateTo}
                    />
                </div> */}
            </>
        );
    }
    return (
        <PurchaseRequestTable
            purchaseRequests={data.purchaseRequests}
            isLoading={userLoading}
            isError={false}
            role={user?.role as "super" | "admin" | "pic"}
            pagination={data.pagination}
            currentSearch={data.currentSearch}
            currentStatus={data.currentStatus}
            currentProjectId={data.currentProjectId}
            currentDateFrom={data.currentDateFrom}
            currentDateTo={data.currentDateTo}
        />
    );
}