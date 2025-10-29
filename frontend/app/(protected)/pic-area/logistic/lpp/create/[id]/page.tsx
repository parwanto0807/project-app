// app/(protected)/admin-area/logistic/lpp/create/[id]/page.tsx
"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
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
import { PicLayout } from "@/components/admin-panel/pic-layout"

export default function CreateLppFromSpkPagePIC() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [selectedPurchaseRequest, setSelectedPurchaseRequest] = useState<PurchaseRequest | null>(null)
    const [isFetching, setIsFetching] = useState(false)
    const [fetchError, setFetchError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false) // State untuk submit

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
        // console.log("DATA", data, "FOTO", fotoBuktiMap)
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

            router.push("/pic-area/logistic/pr");
            router.refresh();

        } catch (err) {
            console.error("❌ Gagal membuat LPP:", err);
            toast.error(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRetry = () => {
        handleFetchPurchaseRequest()
    }

    const handleBack = () => {
        router.push('/pic-area/logistic/pr')
    }

    // Loading state
    const isLoading = isFetching

    // // Debug sebelum render
    // console.log("🎯 [PAGE] Before render - isLoading:", isLoading, "error:", fetchError, "data:", !!selectedPurchaseRequest)

    if (isLoading) {
        return (
            <PicLayout title="Buat LPP dari SPK" role="pic">
                <div className="space-y-4">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/pic-area">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                Logistic
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/pic-area/logistic/pr">Purchase Request</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Buat LPP</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <AdminLoading message="Memuat data purchase request..." />
                </div>
            </PicLayout>
        )
    }

    if (fetchError) {
        // console.log("❌ [PAGE] Rendering error state:", fetchError)
        return (
            <PicLayout title="Buat LPP dari SPK" role="pic">
                <div className="space-y-4">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/pic-area">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                Logistic
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/pic-area/logistic/pr">Purchase Request</BreadcrumbLink>
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
            </PicLayout>
        )
    }

    if (!selectedPurchaseRequest) {
        // console.log("❌ [PAGE] Rendering no data state - selectedPurchaseRequest is null")
        return (
            <PicLayout title="Buat LPP dari SPK" role="pic">
                <div className="space-y-4">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/pic-area">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                Logistic
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/pic-area/logistic/pr">Purchase Request</BreadcrumbLink>
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
            </PicLayout>
        )
    }

    // console.log("✅ [PAGE] Rendering form dengan data:", selectedPurchaseRequest)
    return (
        <PicLayout title="Buat Laporan Pertanggungjawaban (LPP) dari SPK" role="pic">
            <div className="space-y-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/pic-area">Dashboard</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            Logistic
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/pic-area/logistic/pr">Purchase Request</BreadcrumbLink>
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
        </PicLayout>
    )
}