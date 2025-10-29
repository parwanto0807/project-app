"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { LayoutProps } from "@/types/layout";
import { TabelUpdatePR } from "@/components/pr/updateFormData";
import { AdminLoading } from "@/components/admin-loading";
import { useProducts } from "@/hooks/use-product";
import { useCurrentUser } from "@/hooks/use-current-user";
import { usePurchaseRequest, usePurchaseRequestDetail } from "@/hooks/use-pr";
import { CreatePurchaseRequestData, UpdatePurchaseRequestData } from "@/types/pr";
import { fetchAllSpk } from "@/lib/action/master/spk/spk";
import { toast } from "sonner";
import { PicLayout } from "@/components/admin-panel/pic-layout";

interface SPK {
    id: string;
    spkNumber: string;
    spkDate: Date;
    salesOrderId: string;
    teamId: string;
    createdById: string;
    progress: number;
    createdBy: {
        id: string;
        namaLengkap: string;
        jabatan?: string | null;
        nik?: string | null;
        departemen?: string | null;
    };

    salesOrder: {
        id: string;
        soNumber: string;
        projectName: string;
        customer: {
            name: string;
            address: string;
            branch: string;
        }
        project?: {
            id: string;
            name: string;
        };
        items: {
            id: string;
            lineNo: number;
            itemType: string;
            name: string;
            description?: string | null;
            qty: number;
            uom?: string | null;
            unitPrice: number;
            discount: number;
            taxRate: number;
            lineTotal: number;
        }[];
    };

    team?: {
        id: string;
        namaTeam: string;
        teamKaryawan?: {
            teamId: string;
            karyawan?: {
                id: string;
                namaLengkap: string;
                jabatan: string;
                departemen: string;
            };
        };
    } | null;

    details: {
        id: string;
        karyawan?: {
            id: string;
            namaLengkap: string;
            jabatan: string;
            departemen: string;
            nik: string;
        };
        salesOrderItemSPK?: {
            id: string;
            name: string;
            description?: string;
            qty: number;
            uom?: string | null;
        };
        lokasiUnit?: string | null;
    }[];

    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// Helper function untuk get error message
const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return "Terjadi kesalahan";
};

export default function UpdatePRPagePIC() {
    const router = useRouter();
    const params = useParams();
    const prId = params.id as string;

    // Dummy auth role → ganti dengan sistem auth kamu
    const userRole = "pic";

    const {
        data: productsData,
        isLoading: loadingProducts,
        error: errorProducts
    } = useProducts();

    const {
        user,
        loading: loadingUser,
    } = useCurrentUser();

    // Gunakan hook usePurchaseRequest untuk update
    const {
        updatePurchaseRequest,
        loading: submitting,
        error: submitError,
        clearError
    } = usePurchaseRequest();

    // Gunakan hook usePurchaseRequestDetail untuk mendapatkan data PR
    const {
        data: purchaseRequest,
        isLoading: loadingPR,
        error: prError
    } = usePurchaseRequestDetail(prId);

    const [dataSpk, setDataSpk] = useState<SPK[]>([]);
    const [loadingSpk, setLoadingSpk] = useState(true);
    const products = productsData?.products || [];

    // Redirect jika bukan admin
    useEffect(() => {
        if (userRole !== "pic") {
            router.push("/unauthorized");
        }
    }, [userRole, router]);

    // Fetch SPK data
    const fetchData = useCallback(async () => {
        try {
            setLoadingSpk(true);
            const spkResult = await fetchAllSpk();
            setDataSpk(spkResult);
        } catch (error) {
            console.error("Error fetching SPK data:", error);
            toast.error("Gagal memuat data SPK");
        } finally {
            setLoadingSpk(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Function untuk handle update menggunakan hook yang sudah ada
    const handleUpdatePurchaseRequest = async (prData: CreatePurchaseRequestData): Promise<void> => {
        try {
            // Clear any previous errors
            clearError();

            // Convert CreatePurchaseRequestData to UpdatePurchaseRequestData
            const updateData: UpdatePurchaseRequestData = {
                ...prData,
                // Tambahkan field lain yang diperlukan untuk update
            };

            // Gunakan updatePurchaseRequest dari hook
            await updatePurchaseRequest(prId, updateData);
            toast.success("Purchase Request berhasil diupdate");

            // Redirect ke halaman list PR setelah berhasil
            router.push("/pic-area/logistic/pr");

        } catch (error) {
            console.error("Error updating purchase request:", error);
            const errorMessage = getErrorMessage(error);
            toast.error(`Gagal mengupdate Purchase Request: ${errorMessage}`);
            throw error;
        }
    };

    // Handle loading state untuk semua data
    const isLoading = loadingProducts || loadingUser || loadingPR || loadingSpk;

    // Handle error state untuk semua data
    const hasError = errorProducts || prError;

    // Handle PR not found
    if (!loadingPR && !purchaseRequest && prId) {
        return (
            <PicLayout title="Update Purchase Request" role="pic">
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="text-red-500 text-lg font-semibold">
                        Purchase Request tidak ditemukan
                    </div>
                    <div className="text-gray-600 text-sm">
                        Purchase Request dengan ID {prId} tidak ditemukan atau telah dihapus.
                    </div>
                    <button
                        onClick={() => router.push("/admin-area/logistic/pr")}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Kembali ke Daftar PR
                    </button>
                </div>
            </PicLayout>
        );
    }

    // Handle loading
    if (isLoading) {
        return <AdminLoading message="Loading form data..." />;
    }

    // Handle error
    if (hasError) {
        const errorMessage = getErrorMessage(errorProducts || prError);
        return (
            <PicLayout title="Update Purchase Request" role="pic">
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="text-red-500 text-lg font-semibold">
                        Error loading form data
                    </div>
                    <div className="text-gray-600 text-sm">
                        {errorMessage}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => router.push("/admin-area/logistic/pr")}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                            Kembali
                        </button>
                    </div>
                </div>
            </PicLayout>
        );
    }

    // Jika tidak ada PR ID
    if (!prId) {
        return (
            <PicLayout title="Update Purchase Request" role="pic">
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="text-red-500 text-lg font-semibold">
                        ID Purchase Request tidak valid
                    </div>
                    <button
                        onClick={() => router.push("/admin-area/logistic/pr")}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Kembali ke Daftar PR
                    </button>
                </div>
            </PicLayout>
        );
    }

    const layoutProps: LayoutProps = {
        title: `Update Purchase Request - ${purchaseRequest?.nomorPr || 'Loading...'}`,
        role: "pic",
        children: (
            <>
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Badge variant="outline">
                                    <Link href="/pic-area">Dashboard</Link>
                                </Badge>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Badge variant="outline">
                                    <Link href="/pic-area/logistic/pr">Purchase Request List</Link>
                                </Badge>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <Badge variant="outline">
                                <BreadcrumbPage>Update PR</BreadcrumbPage>
                            </Badge>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="h-full w-full">
                    <div className="flex-1 space-y-2 p-2 pt-1 md:p-4">
                        {/* Info PR yang sedang diupdate */}
                        {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-blue-800">
                                        Update Purchase Request
                                    </h3>
                                    <p className="text-blue-600 text-sm">
                                        PR Number: <span className="font-medium">{purchaseRequest?.nomorPr}</span>
                                    </p>
                                    {purchaseRequest?.status && (
                                        <p className="text-blue-600 text-sm">
                                            Status: <span className="font-medium">{purchaseRequest.status}</span>
                                        </p>
                                    )}
                                    {purchaseRequest?.project?.name && (
                                        <p className="text-blue-600 text-sm">
                                            Project: <span className="font-medium">{purchaseRequest.project.name}</span>
                                        </p>
                                    )}
                                </div>
                                <Badge variant="outline" className="bg-white text-blue-700">
                                    Editing Mode
                                </Badge>
                            </div>
                        </div> */}

                        {/* Tampilkan submit error jika ada */}
                        {submitError && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                <div className="text-red-800 text-sm font-medium">
                                    Error: {submitError}
                                </div>
                            </div>
                        )}

                        {/* Form Input Master + Detail */}
                        {purchaseRequest && (
                            <TabelUpdatePR
                                products={products}
                                dataSpk={dataSpk}
                                currentUser={user || undefined}
                                onSubmit={handleUpdatePurchaseRequest}
                                onSuccess={() => {
                                    toast.success("Purchase Request berhasil diupdate");
                                    router.push("/pic-area/logistic/pr");
                                }}
                                submitting={submitting}
                                // Tambahkan props untuk edit mode
                                editMode={true}
                                existingData={purchaseRequest}
                            />
                        )}
                    </div>
                </div>
            </>
        ),
    };

    return <PicLayout {...layoutProps} />;
}