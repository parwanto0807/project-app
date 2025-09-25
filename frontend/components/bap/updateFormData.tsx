"use client";

import { useState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Package, Loader2, ZoomIn, Plus, Trash2, Calendar, Edit, RefreshCw } from "lucide-react";
import Image from "next/image";
import { Karyawan } from "@/lib/validations/karyawan";
import { BAPCreateSchema } from "@/schemas/bap";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, CheckCircle2, Image as ImageIcon, User, MapPin, ClipboardList, Users, Shield, Archive } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateBAP, getBAPById, uploadBAPPhoto } from "@/lib/action/bap/bap";
import { toast } from "sonner";
import { BAPUpdateInput } from "@/types/bap";
import { getImageUrlBap } from "@/lib/getImageUrl";

export interface Customer {
    id: string;
    code: string;
    name: string;
    email: string | null;
    phone: string | null;
    address?: string | null;
    branch?: string | null;
}

export interface Project {
    id: string;
    customerId: string;
    name: string;
    location: string | null;
    createdAt: string;
}

export interface SPK {
    spkNumber: string;
    id: string;
}

export interface User {
    id: string;
    email: string;
    password?: string | null;
    name: string;
    mfaSecret?: string | null;
}

export interface SalesOrderItem {
    id: string;
    salesOrderId: string;
    productId: string;
    qty: number;
    price: number;
    discount?: number;
    total: number;
}

export interface SalesOrder {
    id: string;
    soNumber: string;
    soDate: string;
    projectId: string;
    customerId: string;
    userId: string;
    type: "REGULAR" | "OTHER";
    status: "DRAFT" | "IN_PROGRESS_SPK" | "COMPLETED" | string;
    isTaxInclusive: boolean;
    subtotal: string;
    discountTotal: string;
    taxTotal: string;
    grandTotal: string;
    notes: string | null;
    createdAt: string;
    updatedAt: string;

    customer: Customer;
    project: Project;
    spk: SPK[];
    items: SalesOrderItem[];
    user: User;
}

export interface SpkFieldReport {
    id: string;
    spkId: string;
    userId: string;
    reportDate: string;
    description: string;
    location: string;
    photos: SpkPhoto[];
    createdAt: string;
    updatedAt: string;
}

export interface BAPPhoto {
    id?: string;
    bapId?: string;
    photoUrl: string;
    category: "BEFORE" | "PROCESS" | "AFTER";
    caption?: string;
    createdAt?: string;
}

// Extended interface untuk frontend usage
interface BAPPhotoFrontend extends BAPPhoto {
    file?: File;
    source?: "manual" | "spk" | "existing";
    tempId?: string;
    isExisting?: boolean;
}

type SpkPhoto = {
    id: string;
    caption: string;
    imageUrl: string;
    reportId: string;
    uploadedBy: string;
    createdAt: string;
    updatedAt: string;
    uploadedAt: string;
};

type UpdateBAPFormProps = {
    currentUser: { id: string; name: string };
    bapDataById: string;
    salesOrders: SalesOrder[];
    users: Karyawan[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const getReportsBySpkId = async (
    spkId: string,
): Promise<{ success: boolean; data: SpkFieldReport[] }> => {
    try {
        const url = `${API_URL}/api/spk/report/getReportsBySpkIdBap/${encodeURIComponent(spkId)}`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        return json;
    } catch (error) {
        console.error("Error fetching reports by SPK ID:", error);
        throw error;
    }
};

// Komponen Skeleton untuk Loading State
function UpdateBAPSkeleton() {
    return (
        <div className="max-w-4xl mx-auto px-1 py-4 space-y-6">
            {/* Header Skeleton */}
            <div className="flex items-center space-x-4 mb-6">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
            </div>

            {/* Alert Skeleton */}
            <Skeleton className="h-20 w-full rounded-lg" />

            {/* Form Sections Skeleton */}
            <div className="space-y-6">
                {[1, 2, 3, 4].map((section) => (
                    <Card key={section} className="border-none shadow-lg">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center space-x-2 mb-4">
                                <Skeleton className="h-5 w-5 rounded" />
                                <Skeleton className="h-6 w-48" />
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {[1, 2].map((field) => (
                                    <div key={field} className="space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Submit Button Skeleton */}
            <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t p-4">
                <div className="max-w-4xl mx-auto flex justify-end">
                    <Skeleton className="h-12 w-48 rounded-xl" />
                </div>
            </div>
        </div>
    );
}

// Komponen untuk form input foto BAP
function BAPPhotoForm({
    photo,
    index,
    onUpdate,
    onRemove,
    source = "manual"
}: {
    photo: BAPPhotoFrontend;
    index: number;
    onUpdate: (index: number, updates: Partial<BAPPhotoFrontend>) => void;
    onRemove: (index: number) => void;
    source?: "manual" | "spk" | "existing";
}) {
    return (
        <Card className="p-4 border-l-4 border-l-blue-500">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-2">
                    <div className="p-1 bg-blue-100 rounded">
                        <ImageIcon className="h-3 w-3 text-blue-600" />
                    </div>
                    <h4 className="font-medium">Foto {index + 1}</h4>
                    <Badge variant="secondary" className={
                        source === "spk" ? "bg-green-100 text-green-800" :
                            source === "existing" ? "bg-blue-100 text-blue-800" :
                                "bg-gray-100 text-gray-800"
                    }>
                        {source === "spk" ? "Dari SPK" : source === "existing" ? "Existing" : "Manual"}
                    </Badge>
                </div>
                {source !== "existing" && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(index)}
                        className="hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Preview Foto */}
                <div className="space-y-2">
                    <Label className="flex items-center space-x-2 text-sm">
                        <ZoomIn className="h-3 w-3 text-gray-500" />
                        <span>Preview Foto</span>
                    </Label>
                    <div className="relative w-full h-32 border-2 border-dashed border-gray-300 rounded-md overflow-hidden">
                        {photo.photoUrl ? (
                            <Image
                                src={`${API_URL}${photo.photoUrl}`}
                                alt={`Preview ${index + 1}`}
                                fill
                                className="object-cover"
                                onError={(e) => {
                                    console.error(`Error loading image: ${photo.photoUrl}`);
                                    (e.target as HTMLImageElement).src = "/placeholder.jpg";
                                }}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                <Upload className="h-8 w-8" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Form Input */}
                <div className="space-y-3">
                    {/* Category */}
                    <div>
                        <Label className="flex items-center space-x-2 text-sm">
                            <Archive className="h-3 w-3 text-gray-500" />
                            <span>Kategori</span>
                        </Label>
                        <Select
                            value={photo.category}
                            onValueChange={(value: "BEFORE" | "PROCESS" | "AFTER") =>
                                onUpdate(index, { category: value })
                            }
                            disabled={source === "existing"}
                        >
                            <SelectTrigger className={source === "existing" ? "bg-gray-50" : ""}>
                                <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="BEFORE">Sebelum</SelectItem>
                                <SelectItem value="PROCESS">Proses</SelectItem>
                                <SelectItem value="AFTER">Sesudah</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Caption */}
                    <div>
                        <Label className="flex items-center space-x-2 text-sm">
                            <FileText className="h-3 w-3 text-gray-500" />
                            <span>Keterangan {source === "existing" && "(Read-only)"}</span>
                        </Label>
                        <Input
                            value={photo.caption || ""}
                            onChange={(e) => onUpdate(index, { caption: e.target.value })}
                            placeholder="Masukkan keterangan foto..."
                            disabled={source === "existing"}
                            className={source === "existing" ? "bg-gray-50" : ""}
                        />
                    </div>

                    {/* Upload File - hanya untuk foto manual */}
                    {source === "manual" && (
                        <div>
                            <Label className="flex items-center space-x-2 text-sm">
                                <Upload className="h-3 w-3 text-gray-500" />
                                <span>Upload Foto Baru</span>
                            </Label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const url = URL.createObjectURL(file);
                                        onUpdate(index, {
                                            photoUrl: url,
                                            file: file
                                        });
                                    }
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}

export function UpdateBAPForm({
    currentUser,
    bapDataById,
    salesOrders,
    users,
}: UpdateBAPFormProps) {
    const [isPending, startTransition] = useTransition();
    const [selectedSalesOrder, setSelectedSalesOrder] = useState<SalesOrder | null>(null);
    const [spkPhotos, setSpkPhotos] = useState<SpkPhoto[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [fetchingPhotos, setFetchingPhotos] = useState(false);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const [bapPhotos, setBapPhotos] = useState<BAPPhotoFrontend[]>([]);
    const [isAddingManual, setIsAddingManual] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [bapData, setBapData] = useState<BAPUpdateInput | null>(null);

    const router = useRouter();
    const form = useForm({
        resolver: zodResolver(BAPCreateSchema),
        defaultValues: {
            bapDate: "",
            salesOrderId: "",
            projectId: "",
            createdById: currentUser.id,
            userId: "",
            status: "DRAFT" as const,
            isApproved: false,
            workDescription: "",
            location: "",
            notes: "",
            photos: [] as BAPPhoto[],
        },
    });

    // Fetch BAP data by ID
    useEffect(() => {
        const fetchBAPData = async () => {
            try {
                setLoading(true);

                // Pastikan salesOrders sudah terload
                if (salesOrders.length === 0) {
                    console.log("Menunggu salesOrders...");
                    return;
                }

                const result = await getBAPById(bapDataById);

                if (result.success && result.data) {
                    const bap = result.data;
                    setBapData(bap);

                    // Set form values
                    form.reset({
                        bapDate: bap.bapDate
                            ? new Date(bap.bapDate).toISOString().split("T")[0] // ✅ format jadi YYYY-MM-DD
                            : "",
                        salesOrderId: bap.salesOrderId,
                        projectId: bap.projectId,
                        createdById: bap.createdById,
                        userId: bap.userId,
                        status: bap.status,
                        isApproved: bap.isApproved,
                        workDescription: bap.workDescription,
                        location: bap.location,
                        notes: bap.notes || "",
                    });


                    // Set selected sales order dengan validasi
                    const so = salesOrders.find(s => s.id === bap.salesOrderId);
                    if (!so) {
                        console.warn("Sales order tidak ditemukan:", bap.salesOrderId);
                    }
                    setSelectedSalesOrder(so || null);

                    // Set existing photos dengan safe mapping
                    const existingPhotos: BAPPhotoFrontend[] = (bap.photos ?? []).map(photo => ({
                        ...photo,
                        caption: photo.caption ?? undefined, // 🔑 null → undefined
                        source: "existing" as const,
                        isExisting: true,
                        tempId: `existing-${photo.id}`,
                        createdAt: photo.createdAt
                            ? (typeof photo.createdAt === "string"
                                ? photo.createdAt
                                : photo.createdAt.toISOString())
                            : new Date().toISOString(),
                    }));

                    setBapPhotos(existingPhotos);
                } else {
                    throw new Error(result.error || "Failed to fetch BAP data");
                }
            } catch (error) {
                console.error("Error fetching BAP data:", error);

                // Tampilkan pesan error yang lebih spesifik
                if (error instanceof Error) {
                    toast.error(`Gagal memuat data BAP: ${error.message}`);
                } else {
                    toast.error("Gagal memuat data BAP - Error tidak diketahui");
                }

                // Delay redirect untuk memberi waktu toast muncul
                setTimeout(() => {
                    router.push("/admin-area/logistic/bap");
                }, 1000);
            } finally {
                setLoading(false);
            }
        };

        if (bapDataById && salesOrders.length > 0) {
            fetchBAPData();
        }
    }, [bapDataById, form, salesOrders, router]);

    // Di useEffect saat fetch SPK reports
    useEffect(() => {
        const fetchSpkReports = async () => {
            if (selectedSalesOrder && selectedSalesOrder.spk.length > 0) {
                setFetchingPhotos(true);
                try {
                    const spkId = selectedSalesOrder.spk[0].id;
                    const result = await getReportsBySpkId(spkId);

                    if (result.success) {
                        const allPhotos: SpkPhoto[] = result.data.flatMap(
                            (report: SpkFieldReport) => report.photos || []
                        );

                        // Debug: lihat struktur data photos
                        console.log('SPK Photos data:', {
                            spkId,
                            reportCount: result.data.length,
                            photoCount: allPhotos.length,
                            photos: allPhotos.map(p => ({
                                id: p.id,
                                path: p.imageUrl,
                                caption: p.caption
                            }))
                        });

                        setSpkPhotos(allPhotos);
                    } else {
                        setSpkPhotos([]);
                    }
                } catch (error) {
                    console.error("Error fetching SPK reports:", error);
                    setSpkPhotos([]);
                } finally {
                    setFetchingPhotos(false);
                }
            } else {
                setSpkPhotos([]);
            }
        };

        fetchSpkReports();
    }, [selectedSalesOrder]);

    const { setValue } = form;

    useEffect(() => {
        if (selectedSalesOrder?.project.name) {
            setValue("workDescription", selectedSalesOrder.project.name);
        }
        if (selectedSalesOrder?.customer.address || selectedSalesOrder?.project.location) {
            setValue("location", selectedSalesOrder.customer.address || selectedSalesOrder.project.location || "");
        }
    }, [selectedSalesOrder, setValue]);

    // Fungsi untuk menambah foto BAP baru (manual upload)
    const addBAPPhoto = () => {
        setIsAddingManual(true);
        setBapPhotos(prev => [...prev, {
            photoUrl: "",
            category: "BEFORE",
            caption: "",
            source: "manual",
            tempId: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }]);
    };

    // Fungsi untuk mengupdate foto BAP
    const updateBAPPhoto = (index: number, updates: Partial<BAPPhotoFrontend>) => {
        setBapPhotos(prev => prev.map((photo, i) =>
            i === index ? { ...photo, ...updates } : photo
        ));
    };

    // Fungsi untuk menghapus foto BAP
    const removeBAPPhoto = (index: number) => {
        setBapPhotos(prev => prev.filter((_, i) => i !== index));
    };

    // Fungsi addPhotosFromSPK - tambahkan debugging
    const addPhotosFromSPK = (selectedSpkPhotos: SpkPhoto[]) => {
        setIsDialogOpen(true);
        console.log('Adding photos from SPK:', selectedSpkPhotos.map(p => ({
            id: p.id,
            originalPath: p.imageUrl,
            resolvedUrl: getImageUrlBap(p.imageUrl)
        })));

        const newBAPPhotos: BAPPhotoFrontend[] = selectedSpkPhotos.map(spkPhoto => {
            const imageUrl = spkPhoto.imageUrl?.startsWith("http")
                ? spkPhoto.imageUrl
                : `${API_URL}${spkPhoto.imageUrl}`;

            return {
                photoUrl: imageUrl,
                category: "PROCESS" as const,
                caption: spkPhoto.caption || `Foto dari SPK - ${new Date(spkPhoto.createdAt).toLocaleDateString()}`,
                source: "spk",
                tempId: `spk-${spkPhoto.id}`
            };
        });

        setBapPhotos(prev => [...prev, ...newBAPPhotos]);
        setDialogOpen(false);
    };

    const onSubmit = async (values: z.infer<typeof BAPCreateSchema>) => {
        try {
            setLoading(true);

            if (!bapDataById) {
                throw new Error("BAP ID is required");
            }

            // Pisahkan foto baru dan lama
            const newPhotos = bapPhotos.filter(photo => photo.file instanceof File);
            const existingPhotos = bapPhotos.filter(photo => !(photo.file instanceof File));

            // Upload foto baru
            const uploadPromises = newPhotos.map(async (photo) => {
                if (photo.file instanceof File) {
                    const uploadResult = await uploadBAPPhoto(photo.file);

                    if (!uploadResult.success || !uploadResult.data) {
                        throw new Error(`Failed to upload photo: ${uploadResult.error || 'Unknown error'}`);
                    }

                    return {
                        photoUrl: uploadResult.data.photoUrl,
                        category: photo.category,
                        caption: photo.caption || undefined,
                        bapId: bapDataById,
                        createdAt: null, // ✅ tambahkan default
                    };
                }
                return null;
            });

            const uploadedPhotos = await Promise.all(uploadPromises);

            // Foto existing
            const preparedExistingPhotos = existingPhotos.map((photo) => {
                let safeUrl = photo.photoUrl || "";
                if (safeUrl.startsWith("blob:")) safeUrl = "";
                else if (safeUrl.startsWith("http")) safeUrl = new URL(safeUrl).pathname;

                return {
                    id: photo.id,
                    photoUrl: safeUrl,
                    category: photo.category,
                    caption: photo.caption || undefined,
                    bapId: bapDataById,
                    // 🔑 ubah string ke Date | null
                    createdAt: photo.createdAt
                        ? new Date(photo.createdAt) // kalau string → jadi Date
                        : null,                    // kalau kosong → null
                };
            });


            // Gabungkan semua foto
            const allPhotos = [
                ...preparedExistingPhotos,
                ...uploadedPhotos.filter(
                    (photo): photo is NonNullable<typeof photo> => photo !== null
                ),
            ];

            // Data final untuk update
            const updateInput = {
                ...values,
                photos: allPhotos,
            };

            console.log("📤 Final data untuk updateBAP:", {
                id: bapDataById,
                input: updateInput,
                photoCount: allPhotos.length,
            });

            const result = await updateBAP(bapDataById, updateInput);

            if (result.success) {
                handleSuccess();
            } else {
                toast.error(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error("Error updating BAP:", error);
            toast.error(error instanceof Error ? error.message : "Failed to update BAP");
        } finally {
            setLoading(false);
        }
    };


    // Helper untuk reset form setelah sukses
    const handleSuccess = () => {
        toast.success("BAP berhasil diperbarui!");

        startTransition(() => {
            router.push("/admin-area/logistic/bap");
        });
    };

    if (loading) {
        return <UpdateBAPSkeleton />;
    }

    if (!bapData) {
        return (
            <div className="max-w-4xl mx-auto px-1 py-4">
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        Gagal memuat data BAP. Redirecting...
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-4xl mx-auto px-1 py-4">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
                <div className="p-3 rounded-full bg-gradient-to-r from-green-100 to-blue-100 text-green-600 self-start sm:self-center">
                    <Edit className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-xs md:text-1xl sm:text-2xl font-bold text-foreground">Update BAST</h1>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                            No: {bapData.bapNumber}
                        </Badge>
                        <Badge variant="secondary" className={
                            bapData.status === "APPROVED" ? "bg-green-100 text-green-800" :
                                bapData.status === "IN_PROGRESS" ? "bg-red-100 text-red-800" :
                                    "bg-yellow-100 text-yellow-800"
                        }>
                            {bapData.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                            Terakhir update: {bapData.updatedAt
                                ? new Date(bapData.updatedAt).toLocaleDateString('id-ID')
                                : 'Belum pernah'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Informasi Penting */}
            <Alert className="mb-6 sm:mb-8 bg-gradient-to-r from-amber-500 to-orange-500 text-xs sm:text-sm">
                <Info className="h-4 w-4" />
                <AlertTitle className="font-bold text-sm text-white">Update Informasi BAST</AlertTitle>
                <AlertDescription className="text-white">
                    Perbarui informasi BAST yang diperlukan. Foto existing tidak dapat dihapus tetapi dapat ditambah foto baru.
                </AlertDescription>
            </Alert>

            <Card className="border-none shadow-lg">
                <CardContent className="space-y-6 sm:space-y-8 p-4 sm:p-6">

                    {/* SECTION 1: Informasi Dasar */}
                    <section>
                        <div className="flex items-center space-x-2 mb-4">
                            <ClipboardList className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            <h2 className="text-lg font-semibold">Informasi Dasar</h2>
                            <Separator className="flex-1 ml-4 hidden sm:block" />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:gap-6">
                            {/* Tanggal BAP */}
                            <div className="space-y-2">
                                <Label htmlFor="bapDate" className="flex items-center space-x-2 text-sm">
                                    <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                    <span>Tanggal BAST *</span>
                                </Label>
                                <Input
                                    id="bapDate"
                                    type="date"
                                    required
                                    {...form.register("bapDate")}
                                    className="border-gray-300 focus:ring-blue-500 focus:border-blue-500 py-2"
                                />
                                {form.formState.errors.bapDate && (
                                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.bapDate.message}</p>
                                )}
                            </div>

                            {/* Sales Order */}
                            <div className="space-y-2">
                                <Label className="flex items-center space-x-2 text-sm">
                                    <Package className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                    <span>Sales Order *</span>
                                </Label>
                                <Select
                                    value={form.watch("salesOrderId")}
                                    onValueChange={(val) => {
                                        const so = salesOrders.find((s) => s.id === val) || null;
                                        setSelectedSalesOrder(so);
                                        form.setValue("salesOrderId", val);
                                        form.setValue("projectId", so?.projectId || "");
                                    }}
                                >
                                    <SelectTrigger className="border-gray-300 py-2 h-auto">
                                        <SelectValue placeholder="Pilih Sales Order" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {salesOrders.map((so) => (
                                            <SelectItem key={so.id} value={so.id} className="text-sm">
                                                {so.soNumber} - {so.customer?.name} {so.spk?.[0] ? `(SPK: ${so.spk[0].spkNumber})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.formState.errors.salesOrderId && (
                                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.salesOrderId.message}</p>
                                )}
                            </div>
                        </div>
                    </section>

                    <Separator className="my-4 sm:my-6" />

                    {/* SECTION 2: Detail Proyek & Penanggung Jawab */}
                    {selectedSalesOrder && (
                        <section>
                            <div className="flex items-center space-x-2 mb-4">
                                <MapPin className="h-5 w-5 text-green-600 flex-shrink-0" />
                                <h2 className="text-lg font-semibold">Detail Proyek</h2>
                                <Separator className="flex-1 ml-4 hidden sm:block" />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:gap-6">
                                {/* SPK Number */}
                                <div className="space-y-2">
                                    <Label className="flex items-center space-x-2 text-sm">
                                        <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                        <span>SPK Number</span>
                                    </Label>
                                    <Input
                                        value={selectedSalesOrder.spk?.[0]?.spkNumber || "Tidak ada SPK"}
                                        disabled
                                        className="bg-gray-50 py-2 text-sm"
                                    />
                                </div>

                                {/* Created By */}
                                <div className="space-y-2">
                                    <Label className="flex items-center space-x-2 text-sm">
                                        <Shield className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                        <span>Dibuat Oleh</span>
                                    </Label>
                                    <Input value={currentUser?.name || ""} disabled className="bg-gray-50 py-2 text-sm" />
                                </div>

                                {/* Penanggung Jawab */}
                                <div className="space-y-2">
                                    <Label className="flex items-center space-x-2 text-sm">
                                        <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                        <span>Penanggung Jawab *</span>
                                    </Label>
                                    <Select
                                        value={form.watch("userId")}
                                        onValueChange={(val) => form.setValue("userId", val)}
                                    >
                                        <SelectTrigger className="border-gray-300 py-2 h-auto">
                                            <SelectValue placeholder="Pilih User" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users.map((user) => (
                                                <SelectItem key={user.id} value={user.id} className="text-sm">
                                                    {user.namaLengkap}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {form.formState.errors.userId && (
                                        <p className="text-red-500 text-xs mt-1">{form.formState.errors.userId.message}</p>
                                    )}
                                </div>

                                {/* Lokasi */}
                                <div className="space-y-2">
                                    <Label className="flex items-center space-x-2 text-sm">
                                        <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                        <span>Lokasi Pekerjaan *</span>
                                    </Label>
                                    <Input
                                        placeholder="Lokasi pekerjaan"
                                        {...form.register("location")}
                                        className="border-gray-300 py-2 text-sm"
                                    />
                                    {form.formState.errors.location && (
                                        <p className="text-red-500 text-xs mt-1">{form.formState.errors.location.message}</p>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}

                    <Separator className="my-4 sm:my-6" />

                    {/* SECTION 3: Deskripsi & Catatan */}
                    <section>
                        <div className="flex items-center space-x-2 mb-4">
                            <ClipboardList className="h-5 w-5 text-purple-600 flex-shrink-0" />
                            <h2 className="text-lg font-semibold">Deskripsi & Catatan</h2>
                            <Separator className="flex-1 ml-4 hidden sm:block" />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:gap-6">
                            {/* Work Description */}
                            <div className="space-y-2">
                                <Label className="flex items-center space-x-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                    <span>Deskripsi Pekerjaan</span>
                                </Label>
                                <Input
                                    placeholder="Jelaskan pekerjaan yang telah dilakukan..."
                                    {...form.register("workDescription")}
                                    className="border-gray-300 py-2 text-sm"
                                />
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <Label className="flex items-center space-x-2 text-sm">
                                    <Info className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                    <span>Catatan Tambahan</span>
                                </Label>
                                <Input
                                    placeholder="Catatan opsional..."
                                    {...form.register("notes")}
                                    className="border-gray-300 py-2 text-sm"
                                />
                            </div>
                        </div>
                    </section>

                    <Separator className="my-4 sm:my-6" />

                    {/* SECTION 4: Foto BAP */}
                    <section>
                        <Card className="border border-gray-200">
                            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gradient-to-r from-green-600 to-blue-600 rounded-t-lg gap-3">
                                <div className="flex items-center space-x-2">
                                    <ImageIcon className="h-5 w-5 text-white flex-shrink-0" />
                                    <CardTitle className="text-base sm:text-lg font-semibold text-white">
                                        Foto Dokumentasi BAP
                                    </CardTitle>
                                    <Badge variant="secondary" className="ml-2 text-xs sm:text-sm bg-white text-green-800 px-2 py-0.5">
                                        Total: {bapPhotos.length}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        onClick={addBAPPhoto}
                                        variant="outline"
                                        disabled={isDialogOpen}
                                        size="sm"
                                        className="border-white text-white hover:bg-white/20 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                                    >
                                        <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                        Tambah Manual
                                    </Button>

                                    {selectedSalesOrder && selectedSalesOrder.spk.length > 0 && (
                                        <Button
                                            type="button"
                                            onClick={() => setDialogOpen(true)}
                                            variant="outline"
                                            size="sm"
                                            disabled={fetchingPhotos || isAddingManual}
                                            className="border-white text-white hover:bg-white/20 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                                        >
                                            {fetchingPhotos ? (
                                                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 animate-spin" />
                                            ) : (
                                                <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                            )}
                                            Dari SPK ({spkPhotos.length})
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-3 sm:p-4 space-y-4">
                                {bapPhotos.length === 0 ? (
                                    <div className="text-center py-8 sm:py-12 text-gray-500 border-2 border-dashed rounded-lg border-gray-300">
                                        <ImageIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-gray-400" />
                                        <p className="font-medium text-sm">Belum ada foto</p>
                                        <p className="text-xs mt-1">Tambah manual atau pilih dari SPK</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {bapPhotos.map((photo, index) => (
                                            <BAPPhotoForm
                                                key={photo.tempId || photo.id || index}
                                                photo={photo}
                                                index={index}
                                                onUpdate={updateBAPPhoto}
                                                onRemove={removeBAPPhoto}
                                                source={photo.source}
                                            />
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </section>

                    {/* Submit Button */}
                    <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-border/50 p-3 sm:p-4 z-50">
                        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 px-2">
                            {/* Tombol Batal */}
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                onClick={() => startTransition(() => router.push("/admin-area/logistic/bap"))}
                                disabled={loading || isPending}
                                className="w-full sm:w-auto font-medium transition-all duration-200 rounded-xl
                text-foreground/80 hover:text-foreground hover:bg-accent/50
                dark:text-foreground/70 dark:hover:text-foreground dark:hover:bg-accent/30
                border border-amber-300 hover:border-amber-700 dark:border-purple-600 dark:hover:border-purple-400"
                            >
                                <span>←</span>
                                <span className="ml-2">Batal</span>
                            </Button>

                            <div className="hidden sm:block w-px h-8 bg-border/40"></div>

                            {/* Tombol Update */}
                            <Button
                                type="submit"
                                size="lg"
                                className={`
                flex-1 sm:flex-none min-w-[200px] group relative overflow-hidden
                font-semibold py-5 sm:py-6 text-base sm:text-lg rounded-xl
                shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5
                bg-gradient-to-r from-green-600 to-blue-600
                hover:from-green-700 hover:to-blue-700
                text-white
                dark:from-green-500 dark:to-blue-500
                dark:hover:from-green-400 dark:hover:to-blue-400
                after:absolute after:inset-0 after:rounded-xl
                after:bg-gradient-to-r after:from-white/10 after:to-transparent
                after:opacity-0 after:group-hover:opacity-100 after:transition-opacity after:duration-500
                active:scale-95
            `}
                                disabled={loading || isPending}
                            >
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-300/30 via-transparent to-blue-300/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur"></div>

                                {loading || isPending ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                                        <span className="hidden sm:inline">Memperbarui BAP...</span>
                                        <span className="inline sm:hidden">Updating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Edit className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                        <span>Perbarui Dokumen BAST</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Dialog untuk lihat & pilih foto dari SPK */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-full sm:max-w-4xl max-h-[80vh] overflow-y-auto p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 text-base sm:text-lg">
                            <ImageIcon className="h-5 w-5 text-blue-600" />
                            <span>Pilih Foto dari SPK: {selectedSalesOrder?.spk[0]?.spkNumber}</span>
                        </DialogTitle>
                    </DialogHeader>

                    {fetchingPhotos ? (
                        <div className="flex flex-col items-center justify-center py-10 sm:py-16 space-y-3">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            <span className="text-gray-600 text-sm">Memuat foto...</span>
                        </div>
                    ) : spkPhotos.length === 0 ? (
                        <div className="text-center py-10 sm:py-16 text-gray-500">
                            <ImageIcon className="h-10 w-10 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">Tidak ada foto ditemukan untuk SPK ini</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mt-4">
                                {spkPhotos.map((photo, idx) => {
                                    const imageUrl = photo.imageUrl?.startsWith("http")
                                        ? photo.imageUrl
                                        : `${API_URL}${photo.imageUrl}`;

                                    return (
                                        <div
                                            key={photo.id || idx}
                                            className="group relative border-2 border-gray-200 rounded-lg overflow-hidden hover:border-green-400 transition-all duration-200 cursor-pointer"
                                            onClick={() => addPhotosFromSPK([photo])}
                                        >
                                            <div className="relative w-full pt-[75%]">
                                                <Image
                                                    src={imageUrl || "/placeholder.jpg"}
                                                    alt={photo.caption || `SPK photo ${idx + 1}`}
                                                    fill
                                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                    sizes="(max-width: 200px) 100vw, 200px"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = "/placeholder.jpg";
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                                </div>
                                            </div>
                                            {photo.caption && (
                                                <div className="p-2 bg-white border-t">
                                                    <p className="text-xs text-gray-700 line-clamp-2">{photo.caption}</p>
                                                    <p className="text-xs text-gray-500 mt-1 truncate">{photo.imageUrl}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                <Button
                                    type="button"
                                    onClick={() => addPhotosFromSPK(spkPhotos)}
                                    variant="default"
                                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-sm py-2"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Tambah Semua ({spkPhotos.length})
                                </Button>
                                <span className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                                    Klik pada foto untuk menambahkannya
                                </span>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal Zoom Image */}
            {zoomedImage && (
                <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
                    <DialogContent className="max-w-full sm:max-w-4xl max-h-[90vh] p-2 sm:p-6">
                        <DialogHeader>
                            <DialogTitle className="flex items-center space-x-2 text-base">
                                <ZoomIn className="h-5 w-5" />
                                <span>Preview Gambar</span>
                            </DialogTitle>
                        </DialogHeader>
                        <div className="relative w-full h-64 sm:h-96 bg-gray-100 rounded-lg overflow-hidden">
                            <Image
                                src={zoomedImage}
                                alt="Zoomed preview"
                                fill
                                className="object-contain p-2 sm:p-4"
                                sizes="100vw"
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </form>
    );
}