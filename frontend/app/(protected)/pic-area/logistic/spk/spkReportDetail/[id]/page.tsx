"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
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
import { useParams, useRouter } from "next/navigation";
import { fetchSpkById } from "@/lib/action/master/spk/spk";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";
import FormMonitoringProgressSpkByID from "@/components/spk/tableDataDetail";
import { SPKDataApi } from "@/types/spk";
import { PicLayout } from "@/components/admin-panel/pic-layout";

export default function SpkReportDetailByIdPageAdmin() {
    const params = useParams<{ id: string }>();
    const spkId = params?.id;
    const { user, loading: userLoading } = useCurrentUser();
    const [dataSpk, setDataSpk] = useState<SPKDataApi | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const role = user?.role || '';

    const fetchData = useCallback(async () => {
        if (!spkId) {
            console.warn("SPK ID tidak tersedia");
            setError("SPK ID tidak ditemukan");
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            console.log("🔄 Fetching SPK dengan ID:", spkId);

            let result: SPKDataApi | null = null;
            if (role === "admin" || role === 'super' || role === 'pic') {
                result = await fetchSpkById(spkId);
                console.log("✅ Data diterima:", result);
            }

            setDataSpk(result);

        } catch (error) {
            console.error("Error fetching SPK:", error);
            const errorMessage = error instanceof Error ? error.message : "Gagal memuat data SPK";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [spkId, role]);

    useEffect(() => {
        if (userLoading) return;
        if (!user) {
            router.replace("/auth/login");
            return;
        }
        if (user.role !== "pic") {
            router.replace("/not-authorized");
            return;
        }

        if (spkId) {
            fetchData();
        } else {
            console.warn("SPK tidak tersedia, tidak dapat memuat SPK");
            setError("SPK ID tidak valid");
            setIsLoading(false);
        }
    }, [router, user, userLoading, spkId, fetchData]);

    // Tampilkan error state
    if (error) {
        return (
            <PicLayout title="Production Management" role="pic">
                <div className="h-full w-full p-6 flex flex-col items-center justify-center text-center">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                        <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
                        <p className="text-red-600 mb-4">{error}</p>
                        <Button
                            onClick={() => router.push('/pic-area/logistic/spk')}
                            variant="outline"
                        >
                            Kembali ke Daftar SPK
                        </Button>
                    </div>
                </div>
            </PicLayout>
        );
    }

    return (
        <PicLayout title="Production Management" role="pic">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Badge variant="outline">
                                <Link href="/user-area">Dashboard</Link>
                            </Badge>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Badge variant="outline">
                                <Link href="/pic-area/logistic/spk">SPK List</Link>
                            </Badge>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <Badge variant="outline">
                            <BreadcrumbPage>
                                {dataSpk ? `SPK ${dataSpk.spkNumber}` : 'Monitoring Progress'}
                            </BreadcrumbPage>
                        </Badge>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="h-full w-full">
                <div className="flex-1 space-y-4 p-0 pt-6 md:p-4">
                    <FormMonitoringProgressSpkByID
                        dataSpk={dataSpk}
                        isLoading={isLoading}
                        role={role}
                        userId={spkId}
                    />
                </div>
            </div>
        </PicLayout>
    );
}