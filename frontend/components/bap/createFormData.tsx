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
import { Upload, FileText, Package, Loader2, ZoomIn, Plus, Trash2, Calendar } from "lucide-react";
import Image from "next/image";
import { Karyawan } from "@/lib/validations/karyawan";
import { BAPCreateSchema } from "@/schemas/bap";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, CheckCircle2, Image as ImageIcon, User, MapPin, ClipboardList, FileSignature, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { createBAP } from "@/lib/action/bap/bap";
import { toast } from "sonner";

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
    source?: "manual" | "spk";
    tempId?: string; // Untuk identifikasi di frontend
}

type SpkPhoto = {
    id: string
    caption: string
    imageUrl: string
    reportId: string
    uploadedBy: string
    createdAt: string
    updatedAt: string
    uploadedAt: string
};

type CreateBAPFormProps = {
    currentUser: { id: string; name: string };
    salesOrders: SalesOrder[];
    users: Karyawan[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const getReportsBySpkId = async (
    spkId: string,
): Promise<{ success: boolean; data: SpkFieldReport[] }> => {
    try {
        console.log("SPK ID:", spkId);
        const url = `${API_URL}/api/spk/report/getReportsBySpkIdBap/${encodeURIComponent(spkId)}`;

        console.log("[getReportsBySpkId] URL:", url);

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        console.log("[getReportsBySpkId] Status:", response.status);

        if (!response.ok) {
            const text = await response.text();
            console.error("[getReportsBySpkId] Error response text:", text);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        console.log("[getReportsBySpkId] Response JSON:", json);

        return json;
    } catch (error) {
        console.error("Error fetching reports by SPK ID:", error);
        throw error;
    }
};

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
    source?: "manual" | "spk";
}) {
    return (
        <Card className="p-4">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-2">
                    <h4 className="font-medium">Foto {index + 1}</h4>
                    {source === "spk" && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Dari SPK
                        </Badge>
                    )}
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(index)}
                >
                    <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Preview Foto */}
                <div className="space-y-2">
                    <Label>Preview Foto</Label>
                    <div className="relative w-full h-32 border rounded-md overflow-hidden">
                        {photo.photoUrl ? (
                            <Image
                                src={photo.photoUrl}
                                alt={`Preview ${index + 1}`}
                                fill
                                className="object-cover"
                                onError={(e) => {
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
                        <Label htmlFor={`category-${index}`}>Kategori</Label>
                        <Select
                            value={photo.category}
                            onValueChange={(value: "BEFORE" | "PROCESS" | "AFTER") =>
                                onUpdate(index, { category: value })
                            }
                        >
                            <SelectTrigger>
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
                        <Label htmlFor={`caption-${index}`}>Keterangan (Opsional)</Label>
                        <Input
                            id={`caption-${index}`}
                            value={photo.caption || ""}
                            onChange={(e) => onUpdate(index, { caption: e.target.value })}
                            placeholder="Masukkan keterangan foto..."
                        />
                    </div>

                    {/* Upload File - hanya untuk foto manual */}
                    {source === "manual" && (
                        <div>
                            <Label htmlFor={`file-${index}`}>Upload Foto</Label>
                            <Input
                                id={`file-${index}`}
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

export function CreateBAPForm({
    currentUser,
    salesOrders,
    users,
}: CreateBAPFormProps) {
    const [isPending, startTransition] = useTransition();
    const [selectedSalesOrder, setSelectedSalesOrder] = useState<SalesOrder | null>(null);
    const [spkPhotos, setSpkPhotos] = useState<SpkPhoto[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchingPhotos, setFetchingPhotos] = useState(false);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const [bapPhotos, setBapPhotos] = useState<BAPPhotoFrontend[]>([]);
    const [isAddingManual, setIsAddingManual] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const router = useRouter();
    const form = useForm({
        resolver: zodResolver(BAPCreateSchema),
        defaultValues: {
            bapDate: new Date().toISOString().split('T')[0],
            salesOrderId: "",
            projectId: "",
            createdById: currentUser.id,
            userId: "",
            status: "DRAFT",
            isApproved: false,
            workDescription: "",
            location: "",
            notes: "",
            photos: [] as BAPPhoto[],
        },
    });

    // Fetch SPK reports when selected sales order changes
    useEffect(() => {
        const fetchSpkReports = async () => {
            if (selectedSalesOrder && selectedSalesOrder.spk.length > 0) {
                setFetchingPhotos(true);
                try {
                    const spkId = selectedSalesOrder.spk[0].id;
                    console.log("Fetching photos for SPK:", spkId);

                    const result = await getReportsBySpkId(spkId);
                    console.log("Fetched result:", result);

                    if (result.success) {
                        const allPhotos: SpkPhoto[] = result.data.flatMap(
                            (report: SpkFieldReport) => report.photos || []
                        );
                        console.log("All photos found:", allPhotos);
                        setSpkPhotos(allPhotos);
                    } else {
                        console.warn("No photos found or API returned unsuccessful");
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

    const { setValue } = form; // atau useFormContext()

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

    // Fungsi untuk menambah foto dari SPK ke BAP
    const addPhotosFromSPK = (selectedSpkPhotos: SpkPhoto[]) => {
        setIsDialogOpen(true);
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

            const submitData = {
                ...values,
                photos: bapPhotos.map((photo) => {
                    if (photo.file instanceof File) {
                        // manual → kirim File
                        return {
                            photoUrl: photo.file,
                            category: photo.category,
                            caption: photo.caption || undefined,
                        };
                    }

                    // SPK → string path
                    let safeUrl = photo.photoUrl || "";
                    if (safeUrl.startsWith("blob:")) safeUrl = "";
                    else if (safeUrl.startsWith("http")) safeUrl = new URL(safeUrl).pathname;

                    return {
                        photoUrl: safeUrl,
                        category: photo.category,
                        caption: photo.caption || undefined,
                    };
                }),
            };

            console.log("📤 Final data untuk createBAP:", submitData);

            const result = await createBAP(submitData);

            if (result.success) {
                handleSuccess();
            } else {
                // ❌ Ganti alert error dengan toast.error
                toast.error(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error("Error creating BAP:", error);
            // ❌ Ganti alert dengan toast.error
            toast.error("Failed to create BAP");
        } finally {
            setLoading(false);
        }
    };

    // Helper untuk reset form setelah sukses
    const handleSuccess = () => {
        // ✅ Ganti alert sukses dengan toast.success
        toast.success("BAP created successfully!");

        startTransition(() => {
            form.reset({
                bapDate: new Date().toISOString().split("T")[0],
                salesOrderId: "",
                projectId: "",
                createdById: currentUser.id,
                userId: "",
                status: "DRAFT",
                isApproved: false,
                workDescription: "",
                location: "",
                notes: "",
                photos: [],
            });
            setBapPhotos([]);
            setSelectedSalesOrder(null);

            router.push("/admin-area/logistic/bap");
        });
    };


    if (!salesOrders.length || !users.length) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Loading Form...</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-4xl mx-auto px-1 py-4">
            {/* Header Section - Mobile Friendly */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600 self-start sm:self-center">
                    <FileSignature className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-xs md:text-1xl sm:text-2xl font-bold text-foreground">Create BAST</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">Lengkapi form untuk membuat dokumen BAST baru</p>
                </div>
            </div>

            {/* Informasi Penting */}
            <Alert className="mb-6 sm:mb-8 bg-gradient-to-r from-cyan-600 to-purple-600 text-xs sm:text-sm">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle className="font-bold text-sm text-white">Informasi</AlertTitle>
                <AlertDescription className="text-white">
                    Pilih Sales Order terlebih dahulu. Foto bisa ditambah manual atau dari laporan SPK.
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
                                    {...form.register("bapDate", {
                                        required: "Tanggal BAP wajib diisi",
                                    })}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        console.log("📅 Date input changed:", value);
                                        form.setValue("bapDate", value);
                                    }}
                                    className="border-gray-300 focus:ring-blue-500 focus:border-blue-500 py-2"
                                />
                                {form.formState.errors.bapDate && (
                                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.bapDate.message}</p>
                                )}
                            </div>

                            {/* Sales Order */}
                            <div className="space-y-2 w-full ">
                                <Label className="flex items-center space-x-2 text-sm">
                                    <Package className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                    <span>Sales Order *</span>
                                </Label>
                                <Select
                                    onValueChange={(val) => {
                                        const so = salesOrders.find((s) => s.id === val) || null;
                                        console.log("Selected SO:", so);
                                        setSelectedSalesOrder(so);
                                        form.setValue("salesOrderId", val);
                                        form.setValue("projectId", so?.projectId || "");
                                        setBapPhotos([]);
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
                                    {selectedSalesOrder.spk.length === 0 && (
                                        <p className="text-xs text-red-500 mt-1">
                                            Sales Order ini tidak memiliki SPK
                                        </p>
                                    )}
                                </div>

                                {/* Created By */}
                                <div className="space-y-2">
                                    <Label className="flex items-center space-x-2 text-sm">
                                        <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
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
                                {form.formState.errors.workDescription && (
                                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.workDescription.message}</p>
                                )}
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
                            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-lg gap-3">
                                <div className="flex items-center space-x-2">
                                    <ImageIcon className="h-5 w-5 text-orange-600 flex-shrink-0" />
                                    <CardTitle className="text-base sm:text-lg font-semibold text-white">Foto Dokumentasi BAP</CardTitle>
                                    <Badge variant="secondary" className="ml-2 text-xs sm:text-sm bg-orange-100 text-orange-800 px-2 py-0.5">
                                        {bapPhotos.length}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        onClick={addBAPPhoto}
                                        variant="outline"
                                        disabled={isDialogOpen}
                                        size="sm"
                                        className="border-orange-500 text-orange-700 dark:text-orange-200 hover:bg-orange-50 hover:text-orange-400 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                                    >
                                        <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                        Manual
                                    </Button>

                                    {selectedSalesOrder && selectedSalesOrder.spk.length > 0 && (
                                        <Button
                                            type="button"
                                            onClick={() => setDialogOpen(true)}
                                            variant="outline"
                                            size="sm"
                                            disabled={fetchingPhotos || isAddingManual}
                                            className="border-blue-500 text-green-700 dark:text-green-200 hover:bg-blue-50 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                                        >
                                            {fetchingPhotos ? (
                                                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 animate-spin" />
                                            ) : (
                                                <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                            )}
                                            Source SPK ({spkPhotos.length})
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
                                                key={photo.tempId || index}
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

                    {/* Submit Button - Full Width & Responsive */}
                    <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-border/50 p-3 sm:p-4 z-50">
                        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 px-2">
                            {/* Tombol Batal — Diperbaiki untuk Dark Mode */}
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                onClick={() => startTransition(() => router.push("/admin-area/logistic/bap"))}
                                disabled={isPending || loading}
                                className="w-full sm:w-auto font-medium transition-all duration-200 rounded-xl
                text-foreground/80 hover:text-foreground hover:bg-accent/50
                dark:text-foreground/70 dark:hover:text-foreground dark:hover:bg-accent/30
                border border-amber-300 hover:border-amber-700 dark:border-purple-600 dark:hover:border-purple-400"
                            >
                                <span>←</span>
                                <span className="ml-2">Batal</span>
                            </Button>

                            {/* Divider Vertikal (hanya di desktop) — Lebih halus */}
                            <div className="hidden sm:block w-px h-8 bg-border/40"></div>

                            {/* Tombol Simpan — Gradient Responsif & Glow Elegan */}
                            <Button
                                type="submit"
                                size="lg"
                                className={`
                flex-1 sm:flex-none min-w-[200px] group relative overflow-hidden
                font-semibold py-5 sm:py-6 text-base sm:text-lg rounded-xl
                shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5
                bg-gradient-to-r from-blue-600 to-violet-600
                hover:from-blue-700 hover:to-violet-700
                text-white
                dark:from-blue-500 dark:to-violet-500
                dark:hover:from-blue-400 dark:hover:to-violet-400
                after:absolute after:inset-0 after:rounded-xl
                after:bg-gradient-to-r after:from-white/10 after:to-transparent
                after:opacity-0 after:group-hover:opacity-100 after:transition-opacity after:duration-500
                active:scale-95
            `}
                                disabled={loading || isPending}
                            >
                                {/* Inner Glow Ring (Terlihat di Dark & Light) */}
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-300/30 via-transparent to-violet-300/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur"></div>

                                {/* Icon + Text */}
                                {loading || isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                                        <span className="hidden sm:inline">Sedang Membuat BAP...</span>
                                        <span className="inline sm:hidden">Loading...</span>
                                    </>
                                ) : (
                                    <>
                                        <FileSignature className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                        <span>Simpan Dokumen BAST</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Dialog untuk lihat & pilih foto dari SPK */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen} >
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
                            <span className="text-gray-600 text-sm">Loading photos...</span>
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
                                            className="group relative border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-400 transition-all duration-200 cursor-pointer"
                                            onClick={() => addPhotosFromSPK([photo])}
                                        >
                                            <div className="relative w-full pt-[75%]"> {/* 4:3 Aspect Ratio */}
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
                                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-sm py-2"
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