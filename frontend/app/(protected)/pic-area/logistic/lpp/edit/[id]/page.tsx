// app/(protected)/pic-area/logistic/lpp/create/[id]/page.tsx
"use client"

import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { AdminLoading } from "@/components/admin-loading"
import { PurchaseRequest } from "@/types/pr"
import { UpdateLppForm, ExistingPertanggungjawaban, PaymentMethod, PertanggungjawabanData } from "@/types/types-lpp"
import { getPurchaseRequestById } from "@/lib/action/pr/pr"
import { updateLpp, uploadFoto } from "@/lib/action/lpp/action-lpp"
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
import EditLppForm, { FotoBuktiMap } from "@/components/lpp/editFormData"
import { useMutation } from "@tanstack/react-query"
import { PicLayout } from "@/components/admin-panel/pic-layout"

// Extended allowed file types dengan MIME types yang lebih comprehensive
const ALLOWED_FILE_TYPES = [
    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
    "image/svg+xml",

    // PDF
    "application/pdf",

    // Documents (optional - tambah jika perlu)
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Fungsi validasi file yang lebih robust
function validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        const allowedExtensions = ALLOWED_FILE_TYPES.map(type => {
            const parts = type.split('/');
            return parts[1]?.toUpperCase() || parts[0];
        }).join(', ');

        return {
            isValid: false,
            error: `Format file "${file.name}" tidak didukung. Gunakan: ${allowedExtensions}`
        };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        return {
            isValid: false,
            error: `File "${file.name}" terlalu besar (${(file.size / 1024 / 1024).toFixed(2)}MB). Maksimal 10MB`
        };
    }

    // Check empty file
    if (file.size === 0) {
        return {
            isValid: false,
            error: `File "${file.name}" kosong`
        };
    }

    return { isValid: true };
}

enum PaymentMethodEnum {
    CASH = "CASH",
    TRANSFER = "TRANSFER",
    DEBIT = "DEBIT",
    CREDIT_CARD = "CREDIT_CARD",
    QRIS = "QRIS",
}


function normalizeJenisPembayaran(jp?: string): PaymentMethod {
    const upper = jp?.toUpperCase() ?? "";
    return PaymentMethodEnum[upper as keyof typeof PaymentMethodEnum] || PaymentMethodEnum.CASH;
}


async function uploadFotoAfterCreate(
    details: Array<{ id: string }>,
    fotoBuktiMap: FotoBuktiMap,
    lppId: string
): Promise<Array<{ url: string; keterangan: string }>> {
    const skippedFiles: Array<{ fileName: string; reason: string }> = [];
    let validFilesCount = 0;

    const results = await Promise.all(
        details.map(async (detail, index) => {
            if (!detail.id) {
                console.warn(`❌ Detail di index ${index} tidak memiliki ID`);
                return [];
            }

            // GUNAKAN INDEX untuk access fotoBuktiMap
            const files = fotoBuktiMap[index];
            if (!files?.length) {
                console.log(`⏭️ No files for detail index ${index}, id: ${detail.id}`);
                return [];
            }

            const uploaded = await Promise.all(
                files.map(async (f) => {
                    // Validasi file
                    const validation = validateFile(f.file);
                    if (!validation.isValid) {
                        skippedFiles.push({
                            fileName: f.file.name,
                            reason: validation.error!
                        });
                        console.warn(`⚠️ ${validation.error}`);
                        return null;
                    }

                    validFilesCount++;

                    try {
                        const res = await uploadFoto(detail.id, f.file, { keterangan: f.keterangan }, lppId);
                        return {
                            url: res.url,
                            keterangan: f.keterangan || f.file.name
                        };
                    } catch (err) {
                        console.error(`❌ Upload gagal untuk detail ${detail.id}:`, err);
                        skippedFiles.push({
                            fileName: f.file.name,
                            reason: `Upload error: ${err instanceof Error ? err.message : 'Unknown error'}`
                        });
                        return null;
                    }
                })
            );

            return uploaded.filter(Boolean) as Array<{ url: string; keterangan: string }>;
        })
    );

    // Show detailed warning for skipped files
    if (skippedFiles.length > 0) {
        const skippedMessage = `Beberapa file di-skip:\n${skippedFiles.map(f => `• ${f.fileName}: ${f.reason}`).join('\n')}`;
        console.warn("⚠️ Skipped files:", skippedMessage);

        // Jika semua file di-skip, show toast lebih spesifik
        if (validFilesCount === 0 && skippedFiles.length > 0) {
            toast.warning(`Semua file di-skip. Periksa format dan ukuran file.`);
        }
    }

    return results.flat();
}

export default function EditLppFromSpkPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [selectedPurchaseRequest, setSelectedPurchaseRequest] = useState<PurchaseRequest | null>(null)
    const [isFetching, setIsFetching] = useState(false)
    const [fetchError, setFetchError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [existingPertanggungjawaban, setExistingPertanggungjawaban] = useState<PertanggungjawabanData | null>(null)

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
    const updateMutation = useMutation({
        mutationFn: async () => true, // tidak update apapun
        onSuccess: () => {
            router.push(`/pic-area/logistic/pr?${query}`);
        },
    });

    const handleFetchPurchaseRequest = useCallback(async () => {
        if (!id) {
            setFetchError("ID tidak tersedia");
            return;
        }

        try {
            setIsFetching(true);
            setFetchError(null);

            const data = await getPurchaseRequestById(id);
            if (!data) throw new Error("Purchase request tidak ditemukan");

            setSelectedPurchaseRequest(data);

            const existingPj = data.uangMuka
                ?.flatMap(um => um.pertanggungjawaban || [])
                .map(pj => ({
                    ...pj,
                    keterangan: pj.keterangan ?? "",
                    details: pj.details.map(d => {
                        // Cari PR detail yang sesuai productId
                        const prDetail = data.details.find(prd => prd.productId === d.id);

                        return {
                            ...d,
                            id: d.id,
                            pertanggungjawabanId: d.pertanggungjawabanId ?? "",
                            purchaseRequestDetailId: prDetail?.id ?? "", // ✅ ambil dari PR detail
                            productId: d.product?.id ?? "",
                            tanggalTransaksi: new Date(d.tanggalTransaksi),
                            keterangan: d.keterangan ?? "",
                            jumlah: Number(d.jumlah) ?? 0,
                            nomorBukti: d.nomorBukti ?? "",
                            jenisPembayaran: normalizeJenisPembayaran(d.jenisPembayaran),
                            fotoBukti: (d.fotoBukti ?? []).map(f => ({
                                id: f.id,
                                url: f.url,
                                keterangan: f.keterangan ?? "",
                                createdAt: new Date(f.createdAt),
                            })),
                        };
                    }),
                }))[0];

            if (existingPj) {
                setExistingPertanggungjawaban(existingPj);
            } else {
                setFetchError("Data pertanggungjawaban tidak ditemukan");
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Gagal memuat data purchase request";
            console.error("❌ Fetch error:", err);
            setFetchError(message);
        } finally {
            setIsFetching(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) handleFetchPurchaseRequest();
    }, [handleFetchPurchaseRequest, id]);

    const handleSubmit = async (data: UpdateLppForm, fotoBuktiMap?: FotoBuktiMap) => {
        if (!existingPertanggungjawaban?.id) {
            toast.error("ID pertanggungjawaban tidak tersedia");
            return;
        }

        setIsSubmitting(true);

        try {
            // Step 1: Update LPP
            const updateResult = await updateLpp(existingPertanggungjawaban.id, data) as {
                success: boolean;
                data?: { id: string; details: Array<{ id: string }> };
            };

            const lppId = updateResult.data?.id || existingPertanggungjawaban.id;

            // Step 2: Upload foto jika ada
            if (fotoBuktiMap && updateResult.data?.details) {
                const uploadedFotos = await uploadFotoAfterCreate(updateResult.data.details, fotoBuktiMap, lppId);

                // Hitung total file dari fotoBuktiMap
                const totalFiles = Object.values(fotoBuktiMap).reduce((sum, arr) => sum + arr.length, 0);

                if (uploadedFotos.length === 0 && totalFiles > 0) {
                    toast.warning("Beberapa file di-skip karena format tidak valid.");
                } else if (uploadedFotos.length > 0) {
                    toast.success("✅ Semua foto valid berhasil diupload");
                }
            }

            if (!updateResult.success) {
                toast.error("Update LPP gagal, coba lagi.");
                return;
            }

            // Step 3: Success toast & redirect menggunakan mutation
            toast.success("LPP berhasil diperbarui!");
            updateMutation.mutate(); // Arahkan ke URL sebelumnya
        } catch (err) {
            console.error("❌ Update LPP error:", err);
            toast.error(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Retry fetch
    const handleRetry = () => handleFetchPurchaseRequest();
    const handleBack = () => router.push("/pic-area/logistic/pr");

    // Loading state
    const isLoading = isFetching

    if (isLoading) {
        return (
            <PicLayout title="Edit LPP dari SPK" role="pic">
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
                                <BreadcrumbPage>Edit LPP</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <AdminLoading message="Memuat data purchase request..." />
                </div>
            </PicLayout>
        )
    }

    if (fetchError) {
        return (
            <PicLayout title="Edit LPP dari SPK" role="pic">
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
                                <BreadcrumbPage>Edit LPP</BreadcrumbPage>
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
                                Gagal memuat data: {fetchError}
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

    if (!selectedPurchaseRequest || !existingPertanggungjawaban) {
        return (
            <PicLayout title="Edit LPP dari SPK" role="pic">
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
                                <BreadcrumbPage>Edit LPP</BreadcrumbPage>
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
                            <h2 className="text-xl font-semibold text-red-600">Data tidak lengkap</h2>
                            <p className="text-gray-600 mt-2">
                                {!selectedPurchaseRequest
                                    ? `Data purchase request dengan ID ${id} tidak ditemukan`
                                    : "Data pertanggungjawaban tidak ditemukan untuk PR ini"
                                }
                            </p>
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

    // 🔹 Transform existingPertanggungjawaban ke tipe yang sesuai EditLppForm
    const initialData: ExistingPertanggungjawaban = {
        ...existingPertanggungjawaban,
        tanggal: existingPertanggungjawaban.tanggal instanceof Date
            ? existingPertanggungjawaban.tanggal.toISOString()
            : existingPertanggungjawaban.tanggal || "",
        details: existingPertanggungjawaban.details.map(d => ({
            ...d,
            tanggalTransaksi: d.tanggalTransaksi instanceof Date
                ? d.tanggalTransaksi.toISOString()
                : d.tanggalTransaksi || "",
            jenisPembayaran: normalizeJenisPembayaran(d.jenisPembayaran),
            fotoBukti: (d.fotoBukti ?? []).map(f => ({
                id: f.id,
                url: f.url,
                keterangan: f.keterangan ?? "",
                createdAt: f.createdAt instanceof Date
                    ? f.createdAt.toISOString()
                    : f.createdAt || "",
            }))
        }))
    };

    return (
        <PicLayout title="Edit Laporan Pertanggungjawaban (LPP)" role="pic">
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
                            <BreadcrumbPage>Edit LPP</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <div className="mt-6">
                    <EditLppForm
                        purchaseRequest={selectedPurchaseRequest}
                        onSubmit={handleSubmit}
                        isLoading={isSubmitting}
                        onBack={handleBack}
                        initialData={initialData}
                    />
                </div>
            </div>
        </PicLayout>
    )
}