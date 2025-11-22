// app/(protected)/admin-area/logistic/lpp/create/[id]/page.tsx
"use client"

import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { AdminLayout } from "@/components/admin-panel/admin-layout"
import { AdminLoading } from "@/components/admin-loading"
import CreateLppFormInput, { FotoBuktiMap, uploadFotoAfterCreate } from "@/components/lpp/createFormData"
import { PurchaseRequest } from "@/types/pr"
import { CreateLppForm } from "@/types/types-lpp"
import { getPurchaseRequestById } from "@/lib/action/pr/pr"
import { createLpp } from "@/lib/action/lpp/action-lpp";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react"
import { toast } from 'sonner';
import { useMutation } from "@tanstack/react-query"

export default function CreateLppFromSpkPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [selectedPurchaseRequest, setSelectedPurchaseRequest] = useState<PurchaseRequest | null>(null)
    const [isFetching, setIsFetching] = useState(false)
    const [fetchError, setFetchError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false) // State untuk submit

    const searchParams = useSearchParams();

    const urlPage = Number(searchParams.get("page")) || 1;
    const urlPageSize = Number(searchParams.get("limit")) || 10;
    const urlSearch = searchParams.get("search") || "";
    const urlFilter = searchParams.get("filter") || "on-progress";
    const urlStatus = searchParams.get("status") || "";
    const urlProject = searchParams.get("projectId") || "";
    const highlightId = searchParams.get("highlightId") || "";

    // Ambil nilai langsung dari URL params
    const query = new URLSearchParams({
        page: String(urlPage),
        limit: String(urlPageSize),
        search: urlSearch,
        filter: urlFilter,
        status: urlStatus,
        projectId: urlProject,
        highLightId: highlightId,
    }).toString();

    // Mutation hanya untuk redirect
    const redirectMutation = useMutation({
        mutationFn: async () => true, // tidak update apapun
        onSuccess: () => {
            router.push(`/admin-area/logistic/pr?${query}`);
        },
    });

    const handleFetchPurchaseRequest = useCallback(async () => {
        if (!id) {
            setFetchError("ID tidak tersedia")
            return
        }

        try {
            setIsFetching(true)
            setFetchError(null)

            const data = await getPurchaseRequestById(id)

            if (!data) {
                throw new Error("Purchase request tidak ditemukan")
            }
            setSelectedPurchaseRequest(data)

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Gagal memuat data purchase request"
            console.log("❌ [PAGE] Error fetching:", err)
            setFetchError(errorMessage)
        } finally {
            setIsFetching(false)
        }
    }, [id])

    // Fetch data purchase request berdasarkan ID
    useEffect(() => {
        if (id) {
            handleFetchPurchaseRequest()
        }
    }, [handleFetchPurchaseRequest, id])

    const handleSubmit = async (data: CreateLppForm, fotoBuktiMap?: FotoBuktiMap) => {
        console.log("DATA", data, "FOTO", fotoBuktiMap)
        try {
            setIsSubmitting(true);

            // Step 1: Buat LPP dulu
            const createResult = await createLpp(data) as {
                success: boolean;
                data?: {
                    id: string;
                    details: Array<{ id: string }>;
                };
                message?: string;
            };

            // Ambil LPP ID dari response
            const lppId = createResult.data?.id;
            if (!lppId) {
                throw new Error("LPP ID tidak tersedia, tidak bisa upload foto");
            }

            // Step 2: Upload foto per detail jika ada
            if (fotoBuktiMap && createResult.data?.details && createResult.data.details.length > 0) {
                try {

                    const uploadResults = await uploadFotoAfterCreate(
                        createResult.data.details,
                        fotoBuktiMap,
                        lppId
                    );

                    if (uploadResults.length > 0) {
                        toast.success(`✅ LPP berhasil dibuat dengan ${uploadResults.length} foto`);
                    } else {
                        toast.success("✅ LPP berhasil dibuat (tanpa foto)");
                    }

                } catch (uploadError) {
                    console.error("⚠️ Error during foto upload:", uploadError);
                    toast.warning("LPP berhasil dibuat, tetapi ada masalah saat upload foto");
                }
            } else {
                console.log("⏭️ No foto to upload");
                toast.success("✅ LPP berhasil dibuat (tanpa foto)");
            }

            // PERBAIKAN: Gunakan mutation untuk redirect
            redirectMutation.mutate();

        } catch (err) {
            console.error("❌ Gagal membuat LPP:", err);
            toast.error(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // PERBAIKAN: Handle back juga menggunakan query yang sama
    const handleBack = () => {
        const redirectUrl = query
            ? `/admin-area/logistic/pr?${query}`
            : `/admin-area/logistic/pr`;
        router.push(redirectUrl);
    };

    const handleRetry = () => {
        handleFetchPurchaseRequest()
    }

    // Loading state
    const isLoading = isFetching

    if (isLoading) {
        return (
            <AdminLayout title="Buat LPP dari SPK" role="admin">
                <div className="space-y-4">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/admin-area">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                Logistic
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/admin-area/logistic/pr">Purchase Request</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Buat LPP</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <AdminLoading message="Memuat data purchase request..." />
                </div>
            </AdminLayout>
        )
    }

    if (fetchError) {
        return (
            <AdminLayout title="Buat LPP dari SPK" role="admin">
                <div className="space-y-4">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/admin-area">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                Logistic
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/admin-area/logistic/pr">Purchase Request</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Buat LPP</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="sm" onClick={handleBack}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Kembali
                            </Button>
                        </div>

                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Gagal memuat data Purchase Request: {fetchError}
                            </AlertDescription>
                        </Alert>

                        <div className="flex gap-2">
                            <Button onClick={handleRetry} variant="outline">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Coba Lagi
                            </Button>
                            <Button onClick={handleBack}>
                                Kembali ke Purchase Requests
                            </Button>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        )
    }

    if (!selectedPurchaseRequest) {
        return (
            <AdminLayout title="Buat LPP dari SPK" role="admin">
                <div className="space-y-4">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/admin-area">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                Logistic
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/admin-area/logistic/pr">Purchase Request</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Buat LPP</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="sm" onClick={handleBack}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Kembali
                            </Button>
                        </div>

                        <div className="text-center py-8">
                            <h2 className="text-xl font-semibold text-red-600">Purchase Request tidak ditemukan</h2>
                            <p className="text-gray-600 mt-2">Data purchase request dengan ID {id} tidak ditemukan</p>
                            <div className="mt-4 flex justify-center gap-2">
                                <Button onClick={handleRetry} variant="outline">
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Coba Lagi
                                </Button>
                                <Button onClick={handleBack}>
                                    Kembali ke Purchase Requests
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout title="Buat Laporan Pertanggungjawaban (LPP) dari SPK" role="admin">
            <div className="space-y-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/admin-area">Dashboard</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            Logistic
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/admin-area/logistic/pr">Purchase Request</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Buat LPP dari PR</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <div className="mt-6">
                    <CreateLppFormInput
                        purchaseRequest={selectedPurchaseRequest}
                        onSubmit={handleSubmit}
                        isLoading={isSubmitting} // Pass loading state ke form
                    />
                </div>
            </div>
        </AdminLayout>
    )
}