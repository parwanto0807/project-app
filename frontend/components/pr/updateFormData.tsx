"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    CalendarIcon,
    Plus,
    Trash2,
    ArrowLeft,
    FileText,
    ShoppingCart,
    ClipboardList,
    Users,
    Package,
    User as UserIcon,
    History,
    AlertTriangle,
    Save,
} from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PurchaseRequestDetail, CreatePurchaseRequestData, PurchaseRequest } from "@/types/pr";
import { Project } from "@/types/salesOrder";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import { formatCurrency } from "@/lib/action/rab/rab-utils";
import { fetchKaryawanByEmail } from "@/lib/action/master/karyawan";
import { usePurchaseRequestsBySpkId } from "@/hooks/use-pr";

interface Product {
    id: string;
    name: string;
    type: "Material" | "Jasa" | "Alat";
    usageUnit: string;
    description: string;
    price: number;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
}

interface Karyawan {
    id: string;
    namaLengkap: string;
    email: string;
    jabatan?: string;
    departemen?: string;
    nik?: string;
}

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

interface TabelUpdatePRProps {
    products: Product[];
    dataSpk?: SPK[];
    currentUser?: User;
    onSubmit: (data: CreatePurchaseRequestData) => Promise<void>;
    onSuccess: () => void;
    submitting?: boolean;
    editMode?: boolean;
    existingData?: PurchaseRequest;
}

// Update FormItem sesuai dengan PurchaseRequestDetail
interface FormItem extends Omit<PurchaseRequestDetail, "id" | "estimasiTotalHarga"> {
    tempId: string;
    // Field sementara untuk kompatibilitas UI
    itemName?: string;
    urgencyLevel?: "low" | "medium" | "high";
}

export function TabelUpdatePR({
    products,
    dataSpk = [],
    currentUser,
    onSubmit,
    onSuccess,
    submitting = false,
    editMode = false,
    existingData,
}: TabelUpdatePRProps) {
    const router = useRouter();
    const [formData, setFormData] = useState({
        projectId: existingData?.projectId || "",
        spkId: existingData?.spkId || "",
        keterangan: existingData?.keterangan || "",
        tanggalPr: existingData?.tanggalPr ? new Date(existingData.tanggalPr) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    const [items, setItems] = useState<FormItem[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [selectedSpk, setSelectedSpk] = useState<SPK | null>(null);
    const [karyawanData, setKaryawanData] = useState<Karyawan | null>(null);
    const [loadingKaryawan, setLoadingKaryawan] = useState(false);

    // Hook untuk mendapatkan histori PR berdasarkan SPK
    const {
        data: purchaseRequests = [],
        isLoading: loadingPR,
        error: prError
    } = usePurchaseRequestsBySpkId(selectedSpk?.id);

    // Initialize form dengan existing data
    useEffect(() => {
        if (existingData) {

            // Set form data
            setFormData({
                projectId: existingData.projectId || "",
                spkId: existingData.spkId || "",
                keterangan: existingData.keterangan || "",
                tanggalPr: existingData.tanggalPr ? new Date(existingData.tanggalPr) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            });

            // Set items dari existing details
            if (existingData.details && existingData.details.length > 0) {
                const initialItems: FormItem[] = existingData.details.map((detail, index) => ({
                    tempId: `existing-${detail.id}-${index}`,
                    productId: detail.productId,
                    projectBudgetId: detail.projectBudgetId || "",
                    jumlah: detail.jumlah,
                    satuan: detail.satuan,
                    estimasiHargaSatuan: detail.estimasiHargaSatuan,
                    catatanItem: detail.catatanItem || "",
                    itemName: products.find(p => p.id === detail.productId)?.name || "",
                    urgencyLevel: "medium",
                }));
                setItems(initialItems);
            }

            // Cari SPK yang sesuai dengan existing data
            if (existingData.spkId && dataSpk.length > 0) {
                const spk = dataSpk.find(s => s.id === existingData.spkId);
                if (spk) {
                    setSelectedSpk(spk);
                    setSelectedProject(spk.salesOrder?.project || null);
                }
            }
        }
    }, [existingData, dataSpk, products]);

    useEffect(() => {
        const fetchKaryawan = async () => {
            if (!currentUser?.email) {
                setLoadingKaryawan(false);
                return;
            }

            try {
                const response = await fetchKaryawanByEmail(currentUser.email);

                // Extract user data dari response
                const karyawan = response.user; // Ambil dari property 'user'

                if (karyawan && karyawan.id) {
                    setKaryawanData(karyawan);
                } else {
                    setKaryawanData(null);
                }
            } catch (error) {
                console.error("Error fetching karyawan:", error);
                setKaryawanData(null);
            } finally {
                setLoadingKaryawan(false);
            }
        };

        fetchKaryawan();
    }, [currentUser?.email]);

    // Debug log ketika karyawanData berubah
    // useEffect(() => {
    //     console.log("Karyawan data updated:", karyawanData);
    // }, [karyawanData]);

    const handleSpkChange = (spkId: string) => {
        const spk = dataSpk.find(s => s.id === spkId);

        if (spk) {
            const projectName = spk.salesOrder.project?.name || 'N/A';
            setSelectedProject(spk.salesOrder?.project || null);
            setSelectedSpk(spk);

            const keterangan = `Purchase request for SPK : ${spk.spkNumber} related to SO : ${spk.salesOrder.soNumber} and related to project ${projectName}.`;

            setFormData(prev => ({
                ...prev,
                spkId,
                projectId: spk.salesOrder?.project?.id ?? '',
                keterangan: keterangan,
            }));
        } else {
            setSelectedProject(null);
            setSelectedSpk(null);
            setFormData(prev => ({
                ...prev,
                spkId: "",
                projectId: "",
                keterangan: ""
            }));
        }
    };

    const addItem = useCallback(() => {
        const newItem: FormItem = {
            tempId: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            productId: "",
            projectBudgetId: "", // Field baru yang required
            jumlah: 1, // Ganti dari quantity
            satuan: "pcs", // Ganti dari unit
            estimasiHargaSatuan: 0, // Ganti dari estimatedUnitCost
            catatanItem: "", // Ganti dari description/specifications
            itemName: "",
            urgencyLevel: "medium",
        };
        setItems((prev) => [...prev, newItem]);
    }, []);

    const removeItem = useCallback((tempId: string) => {
        setItems((prev) => prev.filter((item) => item.tempId !== tempId));
    }, []);

    const updateItem = useCallback(
        (tempId: string, field: keyof FormItem, value: string | number) => {
            setItems((prev) =>
                prev.map((item) => {
                    if (item.tempId === tempId) {
                        const updatedItem = { ...item, [field]: value };
                        if (field === "productId" && value) {
                            const selectedProduct = products.find(p => p.id === value);
                            if (selectedProduct) {
                                updatedItem.itemName = selectedProduct.name;
                                updatedItem.catatanItem = selectedProduct.description || "";
                                updatedItem.satuan = selectedProduct.usageUnit || "pcs";
                                updatedItem.estimasiHargaSatuan = selectedProduct.price || 0;
                            }
                        }
                        return updatedItem;
                    }
                    return item;
                })
            );
        },
        [products]
    );

    const calculateTotalAmount = useCallback(() => {
        return items.reduce((total, item) => {
            return total + item.jumlah * item.estimasiHargaSatuan;
        }, 0);
    }, [items]);

    const validateForm = useCallback((): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.spkId) newErrors.spkId = "SPK is required";
        if (!formData.projectId) newErrors.projectId = "Project is required";
        if (!formData.tanggalPr) newErrors.tanggalPr = "Tanggal PR is required";
        if (items.length === 0) newErrors.items = "At least one item is required";

        items.forEach((item, index) => {
            if (!item.productId) newErrors[`productId-${index}`] = "Product is required";
            if (item.jumlah <= 0) newErrors[`quantity-${index}`] = "Qty > 0";
            if (item.estimasiHargaSatuan < 0) newErrors[`estimatedUnitCost-${index}`] = "Cost >= 0";
            if (!item.satuan.trim()) newErrors[`unit-${index}`] = "Unit required";
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData, items]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        // Fallback: jika karyawanData tidak ditemukan, gunakan currentUser.id
        const finalKaryawanId = karyawanData?.id || currentUser?.id;

        if (!finalKaryawanId) {
            alert("Employee data not found. Please contact administrator.");
            return;
        }

        try {
            const submitData: CreatePurchaseRequestData = {
                projectId: formData.projectId,
                spkId: formData.spkId,
                karyawanId: finalKaryawanId, // Gunakan fallback
                tanggalPr: formData.tanggalPr,
                keterangan: formData.keterangan,
                details: items.map(item => ({
                    productId: item.productId,
                    projectBudgetId: item.projectBudgetId || undefined,
                    jumlah: item.jumlah,
                    satuan: item.satuan,
                    estimasiHargaSatuan: item.estimasiHargaSatuan,
                    estimasiTotalHarga: item.jumlah * item.estimasiHargaSatuan,
                    catatanItem: item.catatanItem || "",
                })),
            };

            await onSubmit(submitData);
            onSuccess();
        } catch (error) {
            console.error("Failed to update purchase request:", error);
        }
    };

    const totalAmount = calculateTotalAmount();

    // Fungsi untuk mendapatkan status badge
    const getStatusBadge = (status: string) => {
        const statusConfig = {
            draft: { variant: "secondary" as const, label: "Draft" },
            submitted: { variant: "outline" as const, label: "Submitted" },
            approved: { variant: "default" as const, label: "Approved" },
            rejected: { variant: "destructive" as const, label: "Rejected" },
            ordered: { variant: "default" as const, label: "Ordered" },
            completed: { variant: "default" as const, label: "Completed" },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || { variant: "secondary" as const, label: status };

        return (
            <Badge variant={config.variant} className="text-xs">
                {config.label}
            </Badge>
        );
    };

    return (
        <div className="w-full mx-auto p-4 sm:p-6 space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-lg p-6 text-white shadow-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-lg">
                            <Save className="h-7 w-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Update Purchase Request</h1>
                            <p className="text-blue-100">
                                Update the details below to modify the purchase request.
                            </p>
                            {existingData && (
                                <div className="flex items-center gap-4 mt-2">
                                    <span className="text-blue-100 text-sm">
                                        PR Number: <strong>{existingData.nomorPr}</strong>
                                    </span>
                                    {existingData.status && (
                                        <Badge variant="secondary" className="bg-white/20 text-white">
                                            {existingData.status}
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <Badge variant="secondary" className="bg-white/20 text-white py-1 px-3">
                        <FileText className="h-4 w-4 mr-2" />
                        Editing Mode
                    </Badge>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3 text-lg">
                                    <ClipboardList className="h-5 w-5 text-blue-600" />
                                    Basic Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="spkId" className="font-semibold">SPK (Surat Perintah Kerja) <span className="text-red-500">*</span></Label>
                                    <Select value={formData.spkId} onValueChange={handleSpkChange} disabled={editMode}>
                                        <SelectTrigger className={cn(errors.spkId && "border-red-500")}>
                                            <SelectValue placeholder="Select SPK" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {dataSpk.map((spk) => (
                                                <SelectItem key={spk.id} value={spk.id}>
                                                    {spk.spkNumber}
                                                </SelectItem>
                                            ))}
                                            {dataSpk.length === 0 && <SelectItem value="no-spk" disabled>No SPK available</SelectItem>}
                                        </SelectContent>
                                    </Select>
                                    {errors.spkId && <p className="text-xs text-red-500">{errors.spkId}</p>}
                                    {editMode && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            SPK cannot be changed in edit mode
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tanggalPr" className="font-semibold">Tanggal PR <span className="text-red-500">*</span></Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !formData.tanggalPr && "text-muted-foreground",
                                                    errors.tanggalPr && "border-red-500"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {formData.tanggalPr ? format(formData.tanggalPr, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={formData.tanggalPr}
                                                onSelect={(date) => setFormData((prev) => ({ ...prev, tanggalPr: date || new Date() }))}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    {errors.tanggalPr && <p className="text-xs text-red-500">{errors.tanggalPr}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="projectId" className="font-semibold">Project <span className="text-red-500">*</span></Label>
                                    <Input
                                        value={selectedProject?.name || ""}
                                        placeholder="Auto-filled from SPK"
                                        readOnly
                                        className={cn("bg-muted/50", errors.projectId && "border-red-500")}
                                    />
                                    {errors.projectId && <p className="text-xs text-red-500">{errors.projectId}</p>}
                                </div>
                            </CardContent>

                            <div className="space-y-2 px-6 pb-6">
                                <Label htmlFor="keterangan" className="font-semibold">Keterangan</Label>
                                <Textarea
                                    id="keterangan"
                                    value={formData.keterangan}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, keterangan: e.target.value }))}
                                    placeholder="Optional notes"
                                />
                            </div>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-3 text-lg">
                                    <ShoppingCart className="h-5 w-5 text-orange-600" />
                                    Purchase Items
                                    <Badge variant="secondary" className="ml-2">{items.length}</Badge>
                                </CardTitle>
                                {/* <Button type="button" onClick={addItem} variant="outline" size="sm" className="gap-1">
                                    <Plus className="h-4 w-4" /> Add Item
                                </Button> */}
                            </CardHeader>
                            <CardContent>
                                {errors.items && <p className="text-sm text-red-500 mb-4">{errors.items}</p>}
                                {items.length > 0 ? (
                                    <div className="border rounded-md overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-muted/50">
                                                <TableRow>
                                                    <TableHead className="w-[25%]">Product</TableHead>
                                                    <TableHead></TableHead>
                                                    <TableHead>Qty</TableHead>
                                                    <TableHead>Unit</TableHead>
                                                    <TableHead>Unit Cost</TableHead>
                                                    <TableHead>Total</TableHead>
                                                    <TableHead className="w-[50px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {items.map((item, index) => (
                                                    <TableRow key={item.tempId}>
                                                        <TableCell className="align-top">
                                                            <Select
                                                                value={item.productId}
                                                                onValueChange={(value) => updateItem(item.tempId, "productId", value)}
                                                            >
                                                                <SelectTrigger className={cn(errors[`productId-${index}`] && "border-red-500")}>
                                                                    <SelectValue placeholder="Select product" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {products.map(p => (
                                                                        <SelectItem key={p.id} value={p.id}>
                                                                            {p.name}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            {errors[`productId-${index}`] && (
                                                                <p className="text-xs text-red-500 mt-1">{errors[`productId-${index}`]}</p>
                                                            )}
                                                        </TableCell>

                                                        <TableCell className="align-top">
                                                            <Input
                                                                value={item.projectBudgetId}
                                                                onChange={(e) => updateItem(item.tempId, "projectBudgetId", e.target.value)}
                                                                placeholder="Project Budget ID"
                                                                className={cn(errors[`projectBudgetId-${index}`] && "border-red-500")}
                                                                hidden
                                                            />
                                                            {errors[`projectBudgetId-${index}`] && (
                                                                <p className="text-xs text-red-500 mt-1">{errors[`projectBudgetId-${index}`]}</p>
                                                            )}
                                                        </TableCell>

                                                        <TableCell className="align-top">
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                value={item.jumlah}
                                                                onChange={(e) => updateItem(item.tempId, "jumlah", parseInt(e.target.value) || 1)}
                                                                className={cn("w-20", errors[`quantity-${index}`] && "border-red-500")}
                                                            />
                                                        </TableCell>

                                                        <TableCell className="align-top">
                                                            <Input
                                                                value={item.satuan}
                                                                onChange={(e) => updateItem(item.tempId, "satuan", e.target.value)}
                                                                className={cn("w-20", errors[`unit-${index}`] && "border-red-500")}
                                                            />
                                                        </TableCell>

                                                        <TableCell className="align-top">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={item.estimasiHargaSatuan}
                                                                onChange={(e) => updateItem(item.tempId, "estimasiHargaSatuan", parseFloat(e.target.value) || 0)}
                                                                className={cn("w-28", errors[`estimatedUnitCost-${index}`] && "border-red-500")}
                                                            />
                                                        </TableCell>

                                                        <TableCell className="align-top font-medium">
                                                            Rp. {formatCurrency(item.jumlah * item.estimasiHargaSatuan)}
                                                        </TableCell>

                                                        <TableCell className="align-top">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeItem(item.tempId)}
                                                                className="text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        <div className="flex items-end justify-end right-0 p-4">
                                            <Button
                                                type="button"
                                                onClick={addItem}
                                                size="sm"
                                                // 1. Hapus variant="outline" agar menjadi solid
                                                // 2. Tambahkan bayangan (shadow) dan efek transisi
                                                className="gap-1 shadow-md hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Add Item
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 px-6 border-2 border-dashed rounded-lg">
                                        <div className="space-y-4 flex flex-col items-center">

                                            {/* 1. Icon dengan background agar lebih menonjol */}
                                            <div className=" p-4 rounded-full">
                                                <ShoppingCart className="h-12 w-12 text-slate-500" />
                                            </div>

                                            {/* 2. Judul yang lebih jelas dan tebal */}
                                            <h3 className="text-xl font-semibold">
                                                Daftar Item Masih Kosong
                                            </h3>

                                            {/* 3. Teks deskripsi yang memandu pengguna */}
                                            <p className="text-muted-foreground max-w-xs mx-auto">
                                                Mulailah dengan menambahkan item pertama Anda ke dalam daftar permintaan pembelian.
                                            </p>

                                            {/* 4. Tombol Call-to-Action (CTA) utama */}
                                            <Button
                                                onClick={addItem}
                                                className="gap-2 mt-2"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Tambah Item Pertama
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Summary & Actions */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="shadow-sm sticky top-6">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3 text-lg">
                                    <UserIcon className="h-5 w-5 text-green-600" />
                                    Requester Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    <p><strong>Name:</strong> {karyawanData?.namaLengkap || currentUser?.name || 'N/A'}</p>
                                    <p><strong>Email:</strong> {currentUser?.email || 'N/A'}</p>
                                    {existingData?.karyawan && (
                                        <p><strong>Original Requester:</strong> {existingData.karyawan.namaLengkap}</p>
                                    )}
                                </div>
                                {!karyawanData && !loadingKaryawan && (
                                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                                        ⚠️ Employee data not found. Please contact administrator.
                                    </div>
                                )}
                            </CardContent>

                            <Separator />

                            {/* SPK Items Section */}
                            {selectedSpk && selectedSpk.salesOrder.items.length > 0 && (
                                <CardContent>
                                    <Accordion type="single" collapsible className="w-full">
                                        <AccordionItem value="spk-items" className="border-0">
                                            <AccordionTrigger className="py-2 px-0 hover:no-underline hover:bg-transparent">
                                                <div className="flex items-center gap-2 text-left">
                                                    <Package className="h-4 w-4 text-blue-600" />
                                                    <span className="font-semibold text-lg">SPK Items</span>
                                                    <Badge variant="outline" className="ml-2 mt-1">
                                                        {selectedSpk.salesOrder.items.length} items
                                                    </Badge>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pt-3 pb-0 px-0">
                                                <div className="border rounded-lg overflow-hidden">
                                                    <div className="grid grid-cols-12 gap-2 p-3 bg-muted/50 font-semibold text-sm">
                                                        <div className="col-span-1 text-xs">No</div>
                                                        <div className="col-span-7 text-xs">Item Pekerjaan</div>
                                                        <div className="col-span-2 text-xs text-center">Qty</div>
                                                        <div className="col-span-2 text-xs text-center">Satuan</div>
                                                    </div>

                                                    <div className="divide-y max-h-48 overflow-y-auto">
                                                        {selectedSpk.salesOrder.items.map((item, index) => (
                                                            <div
                                                                key={`${item.id}-${index}`}
                                                                className="grid grid-cols-12 gap-2 p-2 text-sm hover:bg-muted/30"
                                                            >
                                                                <div className="col-span-1 font-medium text-center text-xs">{item.lineNo}</div>
                                                                <div className="col-span-7">
                                                                    <div className="font-medium text-sm">{item.name}</div>
                                                                    {item.description && (
                                                                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                                                            {item.description}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="col-span-2 text-center font-medium text-sm">
                                                                    {item.qty.toLocaleString()}
                                                                </div>
                                                                <div className="col-span-2 text-center text-muted-foreground text-xs">
                                                                    {item.uom || 'pcs'}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </CardContent>
                            )}

                            {/* Team SPK Information */}
                            {selectedSpk?.team && (
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-blue-600" />
                                            <Label className="font-semibold">SPK Team</Label>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-start">
                                                <span className="text-sm font-medium">Team Name:</span>
                                                <Badge variant="outline" className="ml-2 bg-orange-600 text-white font-semibold px-4">
                                                    {selectedSpk.team.namaTeam}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            )}

                            <Separator />

                            {selectedSpk && (
                                <Card className="shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-3 text-lg">
                                            <History className="h-5 w-5 text-purple-600" />
                                            Purchase Request History
                                            <Badge variant="outline" className="ml-2">
                                                {purchaseRequests?.length || 0} PR
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {loadingPR ? (
                                            <div className="text-center py-8">
                                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-600 border-t-transparent mx-auto"></div>
                                                <p className="text-sm text-muted-foreground mt-2">Loading purchase requests...</p>
                                            </div>
                                        ) : prError ? (
                                            <div className="text-center py-8">
                                                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                                                <p className="text-sm text-destructive font-medium mb-2">
                                                    Failed to load purchase requests
                                                </p>
                                                <p className="text-xs text-muted-foreground mb-3">
                                                    {prError.message || "Unknown error occurred"}
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => window.location.reload()}
                                                >
                                                    Try Again
                                                </Button>
                                            </div>
                                        ) : purchaseRequests && purchaseRequests.length > 0 ? (
                                            <div className="space-y-4">
                                                {purchaseRequests.map((pr) => {
                                                    // Filter PR yang hanya terkait dengan SPK yang dipilih
                                                    if (pr.spkId !== selectedSpk.id) {
                                                        return null;
                                                    }

                                                    return (
                                                        <div key={pr.id} className="border rounded-lg hover:bg-muted/30 transition-colors">
                                                            {/* Header - Always Visible */}
                                                            <div className="p-4">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={cn(
                                                                            "font-semibold",
                                                                            pr.id === existingData?.id ? "text-green-600" : "text-blue-600"
                                                                        )}>
                                                                            {pr.nomorPr || `PR-${pr.id.slice(0, 8)}`}
                                                                            {pr.id === existingData?.id && (
                                                                                <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 text-xs">
                                                                                    Current
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        {getStatusBadge(pr.status || 'draft')}
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="text-sm text-muted-foreground">
                                                                            {pr.tanggalPr ? format(new Date(pr.tanggalPr), "dd MMM yyyy") : 'No date'}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-3">
                                                                    <div>
                                                                        <span className="font-medium">Total Items:</span> {pr.details?.length || 0}
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-medium">Total Amount:</span> Rp. {formatCurrency(
                                                                            pr.details?.reduce((total, detail) =>
                                                                                total + (detail.jumlah * detail.estimasiHargaSatuan), 0
                                                                            ) || 0
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-medium">Created By:</span> {pr.karyawan?.namaLengkap || 'N/A'}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Accordion Content untuk semua items PR */}
                                                            {pr.details && pr.details.length > 0 && (
                                                                <div className="border-t">
                                                                    <Accordion type="single" collapsible className="w-full">
                                                                        <AccordionItem value={`details-${pr.id}`} className="border-b-0">
                                                                            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                                                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                                                    <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                                                                                    View Items ({pr.details.length})
                                                                                </div>
                                                                            </AccordionTrigger>
                                                                            <AccordionContent className="px-4 pb-4">
                                                                                <div className="space-y-3">
                                                                                    {pr.details.map((detail, index) => (
                                                                                        <div
                                                                                            key={`${detail.id}-${index}`}
                                                                                            className="flex justify-between items-start p-3 rounded-lg border"
                                                                                        >
                                                                                            <div className="flex-1">
                                                                                                <div className="font-medium flex items-center gap-2">
                                                                                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                                                                        {index + 1}
                                                                                                    </span>
                                                                                                    {detail.catatanItem || `Item ${index + 1}`}
                                                                                                </div>
                                                                                                {detail.catatanItem && detail.productId && (
                                                                                                    <div className="text-xs text-muted-foreground mt-1">
                                                                                                        {detail.catatanItem}
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                            <div className="text-right">
                                                                                                <div className="font-medium">
                                                                                                    {detail.jumlah} {detail.satuan}
                                                                                                </div>
                                                                                                <div className="text-sm text-muted-foreground">
                                                                                                    Rp. {formatCurrency(detail.estimasiHargaSatuan || 0)}/unit
                                                                                                </div>
                                                                                                <div className="font-semibold text-green-600 mt-1">
                                                                                                    Rp. {formatCurrency((detail.jumlah || 0) * (detail.estimasiHargaSatuan || 0))}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </AccordionContent>
                                                                        </AccordionItem>
                                                                    </Accordion>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                }).filter(Boolean) /* Remove null values */}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 border-2 border-dashed rounded-lg">
                                                <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                                                <p className="mt-4 text-muted-foreground">No purchase requests found for this SPK</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Create the first purchase request for {selectedSpk.spkNumber}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                            <Separator />
                            <CardContent>
                                <div className="flex justify-between items-center text-lg font-bold">
                                    <span>Total Amount:</span>
                                    <span className="text-blue-600 text-2xl">
                                        Rp. {formatCurrency(totalAmount)}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground text-right mt-1">{items.length} items</p>
                            </CardContent>

                            <CardFooter className="flex flex-col gap-3 pt-6">
                                <Button
                                    type="submit"
                                    disabled={submitting || items.length === 0 || !formData.spkId}
                                    className="w-full h-11 gap-2 bg-green-600 hover:bg-green-700 dark:text-white font-semibold"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 dark:text-white" /> Update Purchase Request
                                        </>
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => router.back()}
                                    className="w-full h-11 gap-2"
                                    disabled={submitting}
                                >
                                    <ArrowLeft className="h-4 w-4" /> Back
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </form>
        </div>
    );
}