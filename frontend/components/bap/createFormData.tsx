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
import { Upload, FileText, Package, Loader2, ZoomIn, Plus, Trash2, Calendar, Check, Square, CheckSquare } from "lucide-react";
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
    spkDate: string;
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

export enum ReportType {
    PROGRESS = "PROGRESS",
    FINAL = "FINAL"
}

export enum ReportStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}

export interface SpkFieldReport {
    id: string;
    spkId: string;
    karyawanId: string;
    type: "PROGRESS" | "FINAL";
    note?: string;
    reportedAt: string;
    progress?: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    photos: SpkPhoto[];
    createdAt: string;
    updatedAt: string;
    soDetailId?: string;
    soDetail?: {
        id: string;
        productId: string;
        qty: number;
        price: number;
        product?: {
            id: string;
            name: string;
            code: string;
        }
    };
    karyawan?: {
        id: string;
        namaLengkap: string;
    };
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
    tempId?: string;
}

// 🎯 PERBAIKAN: Extended SpkPhoto interface dengan tambahan fields untuk frontend
interface SpkPhoto {
    id: string;
    caption?: string;
    imageUrl: string;
    reportId: string;
    uploadedBy: string;
    createdAt: string;
    updatedAt: string;
    uploadedAt: string;
    // 🎯 Tambahan untuk enrichment data
    productName?: string;
    productCode?: string;
    reportType?: string;
    karyawanName?: string;
    // Untuk backward compatibility - menggunakan union type
    [key: string]: string | number | boolean | null | undefined | Record<string, unknown> | unknown[];
}

// 🎯 Extended interface untuk enriched photos
interface EnrichedSpkPhoto extends SpkPhoto {
    productName?: string;
    productCode?: string;
    reportType?: string;
    karyawanName?: string;
    isSelected?: boolean;
}

type CreateBAPFormProps = {
    currentUser: { id: string; name: string };
    salesOrders: SalesOrder[];
    users: Karyawan[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const getReportsBySpkId = async (
    spkId: string,
): Promise<{ success: boolean; data: SpkPhoto[] }> => { // 🎯 Ubah return type ke SpkPhoto[]
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

                <div className="space-y-3">
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

                    <div>
                        <Label htmlFor={`caption-${index}`}>Keterangan (Opsional)</Label>
                        <Input
                            id={`caption-${index}`}
                            value={photo.caption || ""}
                            onChange={(e) => onUpdate(index, { caption: e.target.value })}
                            placeholder="Masukkan keterangan foto..."
                        />
                    </div>

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
    const [spkPhotos, setSpkPhotos] = useState<EnrichedSpkPhoto[]>([]); // 🎯 Update type
    const [dialogOpen, setDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchingPhotos, setFetchingPhotos] = useState(false);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const [bapPhotos, setBapPhotos] = useState<BAPPhotoFrontend[]>([]);
    const [isAddingManual, setIsAddingManual] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // State untuk filter & selection
    const [selectedPhotos, setSelectedPhotos] = useState<EnrichedSpkPhoto[]>([]); // 🎯 Update type
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
    const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

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

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // 🎯 PERBAIKAN: fetchSpkReports dengan type yang benar
    useEffect(() => {
        const fetchSpkReports = async () => {
            if (selectedSalesOrder && selectedSalesOrder.spk.length > 0) {
                setFetchingPhotos(true);
                try {
                    const spkId = selectedSalesOrder.spk[0].id;

                    const result = await getReportsBySpkId(spkId);
                    if (result.success && result.data && Array.isArray(result.data)) {
                        // 🎯 Define type untuk photo dengan nested properties
                        interface PhotoWithExtra extends SpkPhoto {
                            reportInfo?: {
                                id: string;
                                type: string;
                                reportedAt: string;
                                status: string;
                                progress?: number;
                                note?: string;
                                karyawanName?: string;
                            };
                            productInfo?: {
                                id: string;
                                name: string;
                                code: string;
                            };
                            spkInfo?: {
                                spkNumber: string;
                                spkDate: string;
                            };
                        }

                        const allPhotos: EnrichedSpkPhoto[] = result.data.map((photo: PhotoWithExtra) => {
                            // 🎯 Build full image URL
                            let fullImageUrl = photo.imageUrl;
                            if (photo.imageUrl && !photo.imageUrl.startsWith('http') && !photo.imageUrl.startsWith('blob:')) {
                                fullImageUrl = `${API_URL}${photo.imageUrl.startsWith('/') ? photo.imageUrl : '/' + photo.imageUrl}`;
                            }

                            return {
                                id: photo.id,
                                caption: photo.caption,
                                imageUrl: fullImageUrl,
                                reportId: photo.reportId,
                                uploadedBy: photo.uploadedBy,
                                createdAt: photo.createdAt,
                                updatedAt: photo.updatedAt,
                                uploadedAt: photo.uploadedAt,
                                // 🎯 Extract enriched data dari nested objects
                                productName: photo.productInfo?.name,
                                productCode: photo.productInfo?.code,
                                reportType: photo.reportInfo?.type,
                                karyawanName: photo.reportInfo?.karyawanName,
                                // 🎯 Tambahkan data tambahan untuk filter
                                _reportId: photo.reportId,
                                _productId: photo.productInfo?.id,
                                _spkNumber: photo.spkInfo?.spkNumber
                            };
                        });

                        setSpkPhotos(allPhotos);

                        if (allPhotos.length === 0) {
                            toast.warning("Tidak ada foto yang ditemukan dalam SPK ini");
                        }
                    } else {
                        console.warn("No photos found in API response");
                        setSpkPhotos([]);
                    }
                } catch (error) {
                    console.error("Error fetching SPK reports:", error);
                    setSpkPhotos([]);
                    toast.error("Gagal mengambil foto dari SPK");
                } finally {
                    setFetchingPhotos(false);
                    setSelectedPhotos([]);
                    setSelectedReportId(null);
                    setLastSelectedIndex(null);
                }
            } else {
                setSpkPhotos([]);
                setSelectedPhotos([]);
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

    // 🎯 Update filteredPhotos dengan type yang benar
    const filteredPhotos = selectedReportId
        ? spkPhotos.filter(photo => photo.reportId === selectedReportId)
        : spkPhotos;

    // 🎯 Update togglePhotoSelection dengan type yang benar
    const togglePhotoSelection = (photo: EnrichedSpkPhoto, index: number, e?: React.MouseEvent) => {
        setSelectedPhotos(prev => {
            const isSelected = prev.some(p => p.id === photo.id);

            if (e?.shiftKey && lastSelectedIndex !== null) {
                const start = Math.min(lastSelectedIndex, index);
                const end = Math.max(lastSelectedIndex, index);
                const photosInRange = filteredPhotos.slice(start, end + 1);

                if (isSelected) {
                    return prev.filter(p =>
                        !photosInRange.some(rangePhoto => rangePhoto.id === p.id)
                    );
                } else {
                    const newSelection = [...prev];
                    photosInRange.forEach(rangePhoto => {
                        if (!newSelection.some(p => p.id === rangePhoto.id)) {
                            newSelection.push(rangePhoto);
                        }
                    });
                    return newSelection;
                }
            }

            if (isSelected) {
                return prev.filter(p => p.id !== photo.id);
            } else {
                return [...prev, photo];
            }
        });

        setLastSelectedIndex(index);
    };

    const selectAllFiltered = () => {
        setSelectedPhotos(filteredPhotos);
    };

    const deselectAll = () => {
        setSelectedPhotos([]);
        setLastSelectedIndex(null);
    };

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

    const updateBAPPhoto = (index: number, updates: Partial<BAPPhotoFrontend>) => {
        setBapPhotos(prev => prev.map((photo, i) =>
            i === index ? { ...photo, ...updates } : photo
        ));
    };

    const removeBAPPhoto = (index: number) => {
        setBapPhotos(prev => prev.filter((_, i) => i !== index));
    };

    // 🎯 Update addPhotosFromSPK dengan type yang benar
    const addPhotosFromSPK = (photosToAdd: EnrichedSpkPhoto[]) => {
        if (photosToAdd.length === 0) {
            toast.warning("Pilih foto terlebih dahulu");
            return;
        }

        const newBAPPhotos: BAPPhotoFrontend[] = photosToAdd.map(spkPhoto => {
            const imageUrl = spkPhoto.imageUrl?.startsWith("http")
                ? spkPhoto.imageUrl
                : `${API_URL}${spkPhoto.imageUrl}`;

            return {
                photoUrl: imageUrl,
                category: "PROCESS" as const,
                caption: spkPhoto.caption ||
                    (spkPhoto.productName
                        ? `Foto ${spkPhoto.productName} - ${new Date(spkPhoto.createdAt).toLocaleDateString("id-ID")}`
                        : `Foto dari SPK - ${new Date(spkPhoto.createdAt).toLocaleDateString("id-ID")}`),
                source: "spk",
                tempId: `spk-${spkPhoto.id}`
            };
        });

        setBapPhotos(prev => [...prev, ...newBAPPhotos]);
        setSelectedPhotos([]);
        setDialogOpen(false);
        toast.success(`${photosToAdd.length} foto berhasil ditambahkan`);
    };

    const onSubmit = async (values: z.infer<typeof BAPCreateSchema>) => {
        try {
            setLoading(true);

            const submitData = {
                ...values,
                photos: bapPhotos.map((photo) => {
                    if (photo.file instanceof File) {
                        return {
                            photoUrl: photo.file,
                            category: photo.category,
                            caption: photo.caption || undefined,
                        };
                    }

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

            const result = await createBAP(submitData);

            if (result.success) {
                handleSuccess();
            } else {
                toast.error(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error("Error creating BAP:", error);
            toast.error("Failed to create BAP");
        } finally {
            setLoading(false);
        }
    };

    const handleSuccess = () => {
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
            setSelectedPhotos([]);
            setSelectedReportId(null);

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
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600 self-start sm:self-center">
                    <FileSignature className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-xs md:text-1xl sm:text-2xl font-bold text-foreground">Create BAST</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">Lengkapi form untuk membuat dokumen BAST baru</p>
                </div>
            </div>

            <Alert className="mb-6 sm:mb-8 bg-gradient-to-r from-cyan-600 to-purple-600 text-xs sm:text-sm">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle className="font-bold text-sm text-white">Informasi</AlertTitle>
                <AlertDescription className="text-white">
                    Pilih Sales Order terlebih dahulu. Foto bisa ditambah manual atau dari laporan SPK.
                </AlertDescription>
            </Alert>

            <Card className="border-none shadow-lg">
                <CardContent className="space-y-6 sm:space-y-8 p-4 sm:p-6">
                    <section>
                        <div className="flex items-center space-x-2 mb-4">
                            <ClipboardList className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            <h2 className="text-lg font-semibold">Informasi Dasar</h2>
                            <Separator className="flex-1 ml-4 hidden sm:block" />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:gap-6">
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

                            <div className="space-y-2 w-full ">
                                <Label className="flex items-center space-x-2 text-sm">
                                    <Package className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                    <span>Sales Order *</span>
                                </Label>
                                <Select
                                    onValueChange={(val) => {
                                        const so = salesOrders.find((s) => s.id === val) || null;
                                        setSelectedSalesOrder(so);
                                        form.setValue("salesOrderId", val);
                                        form.setValue("projectId", so?.projectId || "");
                                        setBapPhotos([]);
                                        setSelectedPhotos([]);
                                        setSelectedReportId(null);
                                    }}
                                >
                                    <SelectTrigger className="border-gray-300 py-2 h-auto">
                                        <SelectValue placeholder="Pilih Sales Order" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {salesOrders.map((so) => (
                                            <SelectItem key={so.id} value={so.id} className="text-sm">
                                                {isMobile
                                                    ? so.soNumber
                                                    : `${so.soNumber} - ${so.customer?.name} ${so.spk?.[0] ? `(SPK: ${so.spk[0].spkNumber})` : ''}`
                                                }
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

                    {selectedSalesOrder && (
                        <section>
                            <div className="flex items-center space-x-2 mb-4">
                                <MapPin className="h-5 w-5 text-green-600 flex-shrink-0" />
                                <h2 className="text-lg font-semibold">Detail Proyek</h2>
                                <Separator className="flex-1 ml-4 hidden sm:block" />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:gap-6">
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

                                <div className="space-y-2">
                                    <Label className="flex items-center space-x-2 text-sm">
                                        <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                        <span>SPK Created</span>
                                    </Label>
                                    <Input
                                        value={selectedSalesOrder.spk?.[0]?.spkDate
                                            ? new Date(selectedSalesOrder.spk[0].spkDate).toLocaleDateString("id-ID", {
                                                day: "2-digit",
                                                month: "long",
                                                year: "numeric",
                                            })
                                            : "Tidak ada SPK"}
                                        disabled
                                        className="bg-gray-50 py-2 text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center space-x-2 text-sm">
                                        <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                        <span>Dibuat Oleh</span>
                                    </Label>
                                    <Input value={currentUser?.name || ""} disabled className="bg-gray-50 py-2 text-sm" />
                                </div>

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

                    <section>
                        <div className="flex items-center space-x-2 mb-4">
                            <ClipboardList className="h-5 w-5 text-purple-600 flex-shrink-0" />
                            <h2 className="text-lg font-semibold">Deskripsi & Catatan</h2>
                            <Separator className="flex-1 ml-4 hidden sm:block" />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:gap-6">
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
                                                key={photo.tempId || photo.id || `photo-${index}`}
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

                    <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-border/50 p-3 sm:p-4 z-50">
                        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 px-2">
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

                            <div className="hidden sm:block w-px h-8 bg-border/40"></div>

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
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-300/30 via-transparent to-violet-300/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur"></div>

                                {loading || isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                                        <span className="hidden sm:inline">Sedang Membuat BAP...</span>
                                        <span className="inline sm:hidden">Loading...</span>
                                    </>
                                ) : (
                                    <>
                                        <FileSignature className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                        <span>Buat BAST</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Dialog untuk memilih foto dari SPK */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Pilih Foto dari SPK
                            <Badge variant="outline" className="ml-2">
                                {spkPhotos.length} foto tersedia
                            </Badge>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden flex flex-col p-6 pt-4">
                        {fetchingPhotos ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                                    <p>Memuat foto dari SPK...</p>
                                </div>
                            </div>
                        ) : spkPhotos.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center text-gray-500">
                                    <ImageIcon className="h-12 w-12 mx-auto mb-4" />
                                    <p>Tidak ada foto tersedia</p>
                                    <p className="text-sm mt-1">SPK ini belum memiliki laporan dengan foto</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Filter controls */}
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <Select
                                            value={selectedReportId || "all"}
                                            onValueChange={(val) => setSelectedReportId(val === "all" ? null : val)}
                                        >
                                            <SelectTrigger className="w-[250px]">
                                                <SelectValue placeholder="Filter berdasarkan laporan" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Laporan</SelectItem>
                                                {Array.from(new Set(spkPhotos.map(p => p.reportId))).map(reportId => {
                                                    const photoWithReport = spkPhotos.find(p => p.reportId === reportId);
                                                    return (
                                                        <SelectItem key={reportId} value={reportId}>
                                                            {photoWithReport?.productName || `Laporan ${reportId.substring(0, 8)}`}
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={selectAllFiltered}
                                                className="h-8"
                                            >
                                                <CheckSquare className="h-3 w-3 mr-1" />
                                                Pilih Semua ({filteredPhotos.length})
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={deselectAll}
                                                className="h-8"
                                            >
                                                <Square className="h-3 w-3 mr-1" />
                                                Batal Pilih
                                            </Button>
                                        </div>
                                        <Badge variant="secondary" className="h-8 px-3">
                                            Terpilih: {selectedPhotos.length}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Photos grid */}
                                <div className="flex-1 overflow-auto">
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {filteredPhotos.map((photo, index) => {
                                            const isSelected = selectedPhotos.some(p => p.id === photo.id);
                                            return (
                                                <div
                                                    key={photo.id}
                                                    className={`
                                            relative group cursor-pointer rounded-lg overflow-hidden border-2
                                            ${isSelected
                                                            ? 'border-blue-500 ring-2 ring-blue-200 shadow-md'
                                                            : 'border-gray-200 hover:border-blue-300'
                                                        }
                                            transition-all duration-200
                                        `}
                                                    onClick={(e) => togglePhotoSelection(photo, index, e)}
                                                >
                                                    {/* Checkbox overlay */}
                                                    <div className={`
                                            absolute top-2 left-2 z-10 w-5 h-5 flex items-center justify-center 
                                            rounded-md border transition-all duration-200
                                            ${isSelected
                                                            ? 'bg-blue-500 border-blue-500 text-white'
                                                            : 'bg-white/90 border-gray-300 text-transparent'
                                                        }
                                        `}>
                                                        {isSelected && <Check className="h-3 w-3" />}
                                                    </div>

                                                    {/* Image container */}
                                                    <div className="aspect-square relative bg-gray-100">
                                                        <Image
                                                            src={photo.imageUrl}
                                                            alt={photo.caption || 'SPK Photo'}
                                                            fill
                                                            className="object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = "/placeholder.jpg";
                                                            }}
                                                        />

                                                        {/* Hover overlay */}
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 
                                                transition-all duration-200 flex items-center justify-center">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="opacity-0 group-hover:opacity-100 
                                                        bg-white/90 hover:bg-white transition-all duration-200
                                                        absolute bottom-2 right-2"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setZoomedImage(photo.imageUrl);
                                                                }}
                                                            >
                                                                <ZoomIn className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* Info overlay */}
                                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t 
                                            from-black/80 via-black/50 to-transparent p-3 text-white">
                                                        <div className="font-medium text-sm truncate">
                                                            {photo.productName || 'Unknown Product'}
                                                        </div>
                                                        <div className="text-xs opacity-90 truncate mt-0.5">
                                                            {photo.reportType} • {photo.karyawanName}
                                                        </div>
                                                        {photo.caption && (
                                                            <div className="text-xs opacity-70 truncate mt-1">
                                                                {photo.caption}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Dialog footer dengan preview foto yang dipilih */}
                    <div className="border-t">
                        {/* Bagian preview foto yang dipilih */}
                        {selectedPhotos.length > 0 && (
                            <div className="p-4 border-b bg-gray-50">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm">Foto Terpilih:</span>
                                        <Badge variant="secondary" className="text-xs">
                                            {selectedPhotos.length} foto
                                        </Badge>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={deselectAll}
                                        className="h-7 text-xs"
                                    >
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        Hapus Semua
                                    </Button>
                                </div>

                                {/* Container preview foto yang dipilih */}
                                <div className="flex gap-3 overflow-x-auto pb-2">
                                    {selectedPhotos.map((photo, index) => (
                                        <div
                                            key={photo.id}
                                            className="flex-shrink-0 relative group w-20 h-20"
                                        >
                                            <div className="relative w-full h-full rounded-md overflow-hidden border border-blue-300">
                                                <Image
                                                    src={photo.imageUrl}
                                                    alt={photo.caption || `Selected ${index + 1}`}
                                                    fill
                                                    className="object-cover"
                                                />
                                                {/* Overlay untuk hapus */}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 
                                        transition-opacity duration-200 flex items-center justify-center">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 bg-red-500 hover:bg-red-600 text-white"
                                                        onClick={() => {
                                                            setSelectedPhotos(prev =>
                                                                prev.filter(p => p.id !== photo.id)
                                                            );
                                                        }}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                            {/* Badge nomor */}
                                            <div className="absolute -top-1 -right-1 bg-blue-500 text-white 
                                    text-xs font-semibold rounded-full w-5 h-5 flex items-center 
                                    justify-center">
                                                {index + 1}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Bagian action buttons */}
                        <div className="p-4 flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                                <span className="font-medium">{selectedPhotos.length}</span> foto terpilih •
                                Total: <span className="font-medium">{spkPhotos.length}</span> foto
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setDialogOpen(false)}
                                    className="min-w-[80px]"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => addPhotosFromSPK(selectedPhotos)}
                                    disabled={selectedPhotos.length === 0}
                                    className="min-w-[120px] bg-blue-600 hover:bg-blue-700"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Tambahkan ({selectedPhotos.length})
                                </Button>
                            </div>
                        </div>

                        {/* Tips */}
                        {selectedPhotos.length > 0 && (
                            <div className="px-4 pb-4">
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <Info className="h-3 w-3" />
                                    <span>
                                        Tip: Gunakan <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Shift</kbd> + klik
                                        untuk memilih multiple foto sekaligus
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Zoom modal */}
            {zoomedImage && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setZoomedImage(null)}>
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute -top-10 right-0 text-white hover:bg-white/20"
                            onClick={() => setZoomedImage(null)}
                        >
                            ×
                        </Button>
                        <Image
                            src={zoomedImage}
                            alt="Zoomed"
                            width={1200}
                            height={800}
                            className="object-contain max-h-[90vh]"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder.jpg";
                            }}
                        />
                    </div>
                </div>
            )}
        </form>
    );
}