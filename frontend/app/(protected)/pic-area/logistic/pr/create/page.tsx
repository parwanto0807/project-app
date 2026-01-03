"use client";

import { useEffect, useState } from "react";
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
import { LayoutProps } from "@/types/layout";
import { TabelInputPR } from "@/components/pr/createFormData";
import { AdminLoading } from "@/components/admin-loading";
import { useProducts } from "@/hooks/use-product";
import { usePurchaseRequest } from "@/hooks/use-pr";
import { CreatePurchaseRequestData } from "@/types/pr";
import { fetchAllSpkPr } from "@/lib/action/master/spk/spk";
import { toast } from "sonner";
import { PicLayout } from "@/components/admin-panel/pic-layout";
import { useSession } from "@/components/clientSessionProvider";

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
            name: string;      // diisi dari customer.name
            address: string;   // ✅ baru
            branch: string;    // ✅ baru
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

function getBasePath(role?: string) {
    return role === "admin"
        ? "/admin-area/logistic/pr"
        : "/pic-area/logistic/pr"
}

export default function CreatePRPagePIC() {
    const router = useRouter();

    // Dummy auth role → ganti dengan sistem auth kamu
    const userRole = "pic";

    const {
        data: productsData,
        isLoading: loadingProducts,
        error: errorProducts
    } = useProducts();

    const {
        user,
        isLoading: loadingUser,
    } = useSession();

    // Gunakan hook usePurchaseRequest yang sudah ada
    const {
        createPurchaseRequest,
        loading: submitting,
        error: submitError,
        clearError
    } = usePurchaseRequest();

    const [dataSpk, setDataSpk] = useState<SPK[]>([]);
    const products = productsData?.products || [];

    const currentUser = user ? {
        id: user.id,
        name: user.name || 'Unknown User',
        email: user.email || '', // Add missing email property
        role: user.role || 'user' // Add missing role property
    } : {
        id: 'unknown',
        name: 'Unknown User',
        email: '',
        role: 'user'
    };

    // Redirect jika bukan admin
    useEffect(() => {
        if (userRole !== "pic") {
            router.push("/unauthorized");
        }
        fetchData();
    }, [userRole, router]);

    const fetchData = async () => {
        try {
            const result = await fetchAllSpkPr();
            setDataSpk(result);
        } catch (error) {
            console.error("Error fetching SPK data:", error);
            toast.error("Gagal memuat data SPK");
        }
    };

    // Function untuk handle submit menggunakan hook yang sudah ada
    const handleCreatePurchaseRequest = async (prData: CreatePurchaseRequestData): Promise<void> => {
        try {
            // Clear any previous errors
            clearError();

            // Gunakan createPurchaseRequest dari hook - ignore return value
            await createPurchaseRequest(prData);
            const basePath = getBasePath(userRole);
            router.push(basePath)

            // Tidak perlu return apa-apa karena type Promise<void>
        } catch (error) {
            console.error("Error creating purchase request:", error);
            throw error;
        }
    };

    // Handle loading state untuk semua data
    const isLoading = loadingProducts || loadingUser;

    // Handle error state untuk semua data
    const hasError = errorProducts;

    // Handle loading
    if (isLoading) {
        return <AdminLoading message="Loading form data..." />;
    }

    // Handle error
    if (hasError) {
        return (
            <PicLayout title="Create Purchase Request" role="pic">
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="text-red-500 text-lg font-semibold">
                        Error loading form data
                    </div>
                    <div className="text-gray-600 text-sm">
                        {getErrorMessage(errorProducts)}
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Try Again
                    </button>
                </div>
            </PicLayout>
        );
    }

    const layoutProps: LayoutProps = {
        title: "Create Purchase Request",
        role: "pic",
        children: (
            <>
                <div className="h-full flex flex-col min-h-0 ml-4">
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
                                    <BreadcrumbPage>Create PR</BreadcrumbPage>
                                </Badge>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <div className="h-full w-full">
                        <div className="flex-1 space-y-2 py-2 pt-1 md:py-4">
                            {/* Tampilkan submit error jika ada */}
                            {submitError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                    <div className="text-red-800 text-sm font-medium">
                                        Error: {submitError}
                                    </div>
                                </div>
                            )}

                            {/* Form Input Master + Detail */}
                            <TabelInputPR
                                products={products}
                                dataSpk={dataSpk}
                                currentUser={currentUser}
                                onSubmit={handleCreatePurchaseRequest}
                                onSuccess={() => router.push("/pic-area/logistic/pr")}
                                submitting={submitting}
                            />
                        </div>
                    </div>
                </div>
            </>
        ),
    };

    return <PicLayout {...layoutProps} />;
}