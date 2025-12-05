"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
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
import { PurchaseRequestDetail, CreatePurchaseRequestData } from "@/types/pr";
import { Project } from "@/types/salesOrder";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import { formatCurrency } from "@/lib/action/rab/rab-utils";
import { fetchKaryawanByEmail } from "@/lib/action/master/karyawan";
import { usePurchaseRequestsBySpkId } from "@/hooks/use-pr";
import { ProductCombobox } from "./productCombobox";
import { SourceProductType } from "@/schemas/pr";

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
            sourceProduct?: SourceProductType;
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

interface TabelInputPRProps {
    products: Product[];
    dataSpk?: SPK[];
    currentUser?: User;
    onSubmit: (data: CreatePurchaseRequestData) => Promise<void>;
    onSuccess: () => void;
    submitting?: boolean;
}

// Update FormItem sesuai dengan PurchaseRequestDetail
interface FormItem extends Omit<PurchaseRequestDetail, "id" | "estimasiTotalHarga"> {
    tempId: string;
    // Field sementara untuk kompatibilitas UI
    itemName?: string;
    urgencyLevel?: "low" | "medium" | "high";
    sourceProduct: SourceProductType; // pastikan pakai ini
}

export function TabelInputPR({
    products,
    dataSpk = [],
    currentUser,
    onSubmit,
    onSuccess,
    submitting = false,
}: TabelInputPRProps) {
    const router = useRouter();
    const [formData, setFormData] = useState({
        projectId: "",
        spkId: "",
        keterangan: "",
        tanggalPr: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    const [items, setItems] = useState<FormItem[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [selectedSpk, setSelectedSpk] = useState<SPK | null>(null);
    const [karyawanData, setKaryawanData] = useState<Karyawan | null>(null);
    const [loadingKaryawan, setLoadingKaryawan] = useState(false);
    const lastProductRef = useRef<HTMLButtonElement | null>(null);
    const lastRowRef = useRef<HTMLTableRowElement | null>(null);


    // Hook untuk mendapatkan histori PR berdasarkan SPK
    const {
        data: purchaseRequests = [],
        isLoading: loadingPR,
        error: prError
    } = usePurchaseRequestsBySpkId(selectedSpk?.id);

    // console.log("Karyawan ID", karyawanData);
    // console.log("Purchase Requests Data:", purchaseRequests);
    // console.log("Selected SPK ID:", selectedSpk?.id);

    useEffect(() => {
        const fetchKaryawan = async () => {
            // console.log("Fetching karyawan for email:", currentUser?.email);

            if (!currentUser?.email) {
                // console.log("No email found for current user");
                setLoadingKaryawan(false);
                return;
            }

            try {
                const response = await fetchKaryawanByEmail(currentUser.email);
                // console.log("Karyawan response received:", response);

                // Extract user data dari response
                const karyawan = response.user; // Ambil dari property 'user'

                if (karyawan && karyawan.id) {
                    setKaryawanData(karyawan);
                    // console.log("Karyawan ID set to:", karyawan.id);
                } else {
                    // console.warn("Karyawan data incomplete or null:", karyawan);
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
            sourceProduct: SourceProductType.PEMBELIAN_BARANG, // Default value
            itemName: "",
            urgencyLevel: "medium",
        };
        setItems((prev) => [...prev, newItem]);
        setTimeout(() => {
            // Fokus ke ProductCombobox row baru
            lastProductRef.current?.focus();

            // Scroll ke row terakhir agar terlihat
            lastRowRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }, 100);
    }, []);

    const removeItem = useCallback((tempId: string) => {
        setItems((prev) => prev.filter((item) => item.tempId !== tempId));
    }, []);

    const updateItem = useCallback(
        (tempId: string, field: keyof FormItem, value: string | number | SourceProductType) => {
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

                                // Mapping yang lebih aman
                                const sourceProductMap: Record<string, SourceProductType> = {
                                    "Pembelian Barang": SourceProductType.PEMBELIAN_BARANG,
                                    "Pengambilan Stock": SourceProductType.PENGAMBILAN_STOK,
                                    "Operasional": SourceProductType.OPERATIONAL,
                                    "Jasa Pembelian": SourceProductType.JASA_PEMBELIAN,
                                    "Jasa Internal": SourceProductType.JASA_INTERNAL,
                                };


                                updatedItem.sourceProduct =
                                    sourceProductMap[selectedProduct.type] ?? SourceProductType.PEMBELIAN_BARANG;
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

    const { totalBiayaRecent, totalHPPRecent, grandTotalRecent } = useMemo(() => {
        const biayaTypes: string[] = [
            'PEMBELIAN_BARANG',
            'JASA_PEMBELIAN',
            'OPERATIONAL',
        ];

        const hppTypes: string[] = [
            'PENGAMBILAN_STOK',
            'JASA_INTERNAL',
        ];

        let totalBiayaRecent = 0;
        let totalHPPRecent = 0;

        // Handle case ketika selectedSpk null
        if (!selectedSpk) {
            return {
                totalBiayaRecent: 0,
                totalHPPRecent: 0,
                grandTotalRecent: 0,
            };
        }

        // Filter purchase requests hanya untuk SPK yang dipilih
        const filteredPRs = purchaseRequests?.filter(pr => pr.spkId === selectedSpk.id) || [];

        // Loop melalui semua PR yang sesuai dengan SPK dipilih
        for (const pr of filteredPRs) {
            if (pr.details && pr.details.length > 0) {
                for (const detail of pr.details) {
                    const jumlah = Number(detail.jumlah) || 0;
                    const harga = Number(detail.estimasiHargaSatuan) || 0;
                    const nominal = jumlah * harga;

                    if (detail.sourceProduct && biayaTypes.includes(detail.sourceProduct)) {
                        totalBiayaRecent += nominal;
                    } else if (detail.sourceProduct && hppTypes.includes(detail.sourceProduct)) {
                        totalHPPRecent += nominal;
                    }
                }
            }
        }

        return {
            totalBiayaRecent,
            totalHPPRecent,
            grandTotalRecent: totalBiayaRecent + totalHPPRecent,
        };
    }, [purchaseRequests, selectedSpk]); // Include selectedSpk secara lengkap

    const { totalBiaya, totalHPP, grandTotal } = useMemo(() => {
        const biayaTypes: SourceProductType[] = [
            SourceProductType.PEMBELIAN_BARANG,
            SourceProductType.JASA_PEMBELIAN,
            SourceProductType.OPERATIONAL,
        ];

        const hppTypes: SourceProductType[] = [
            SourceProductType.PENGAMBILAN_STOK,
            SourceProductType.JASA_INTERNAL,
        ];

        let totalBiaya = 0;
        let totalHPP = 0;

        for (const item of items) {
            const jumlah = Number(item.jumlah) || 0;
            const harga = Number(item.estimasiHargaSatuan) || 0;
            const nominal = jumlah * harga;

            if (item.sourceProduct && biayaTypes.includes(item.sourceProduct)) {
                totalBiaya += nominal;
            } else if (item.sourceProduct && hppTypes.includes(item.sourceProduct)) {
                totalHPP += nominal;
            }
        }

        return {
            totalBiaya,
            totalHPP,
            grandTotal: totalBiaya + totalHPP,
        };
    }, [items]);


    const validateForm = useCallback((): boolean => {
        const newErrors: Record<string, string> = {};

        // Validasi wajib
        // if (!formData.projectId) newErrors.projectId = "Project is required";
        if (!formData.tanggalPr) newErrors.tanggalPr = "Tanggal PR is required";

        // ✅ SPK tidak wajib lagi (optional)
        // if (!formData.spkId) newErrors.spkId = "SPK is required"; // ❌ Dihapus

        // Validasi minimal 1 item
        if (items.length === 0) newErrors.items = "At least one item is required";

        // Validasi detail items
        items.forEach((item, index) => {
            if (!item.productId) newErrors[`productId-${index}`] = "Product is required";
            if (item.jumlah <= 0) newErrors[`quantity-${index}`] = "Quantity must be greater than 0";
            if (item.estimasiHargaSatuan < 0) newErrors[`estimatedUnitCost-${index}`] = "Unit cost cannot be negative";
            if (!item.satuan.trim()) newErrors[`unit-${index}`] = "Unit is required";
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
                karyawanId: finalKaryawanId,
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
                    sourceProduct: item.sourceProduct || SourceProductType.PEMBELIAN_BARANG,

                })),
            };

            await onSubmit(submitData);
            onSuccess();
        } catch (error) {
            console.error("Failed to submit purchase request:", error);
        }
    };

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
        <div className="w-full mx-auto py-4 sm:p-6 space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-lg p-6 text-white shadow-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-lg">
                            <ShoppingCart className="h-4 w-4 md:h-7 md:w-7" />
                        </div>
                        <div>
                            <h1 className="text-base md:text-2xl font-bold">Create Purchase Request</h1>
                            <p className="text-xs md:text-smtext-blue-100">
                                Fill in the details below to create a new purchase request.
                            </p>
                        </div>
                    </div>
                    <Badge variant="secondary" className="bg-white/20 text-white py-1 px-3">
                        <FileText className="h-4 w-4 mr-2" />
                        Draft
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
                                    <Select value={formData.spkId} onValueChange={handleSpkChange}>
                                        <SelectTrigger className={cn(errors.spkId && "border-red-500")}>
                                            <SelectValue placeholder="Select SPK" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {dataSpk.map((spk) => (
                                                <SelectItem key={spk.id} value={spk.id}>
                                                    {spk.spkNumber} - {spk.salesOrder.project?.name} - {spk.salesOrder.customer.branch}
                                                </SelectItem>
                                            ))}
                                            {dataSpk.length === 0 && <SelectItem value="no-spk" disabled>No SPK available</SelectItem>}
                                        </SelectContent>
                                    </Select>
                                    {errors.spkId && <p className="text-xs text-red-500">{errors.spkId}</p>}
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
                                                    <TableHead className="w-[15%]">Source</TableHead>
                                                    <TableHead className="w-[10%]">Qty</TableHead>
                                                    <TableHead className="w-[15%]">Unit</TableHead>
                                                    <TableHead className="w-[15%]">Unit Cost</TableHead>
                                                    <TableHead className="w-[15%]">Total</TableHead>
                                                    <TableHead className="w-[5%]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {items.map((item, index) => (
                                                    <TableRow
                                                        key={item.tempId}
                                                        ref={index === items.length - 1 ? lastRowRef : null} // untuk scroll ke row terakhir
                                                    >
                                                        {/* Product */}
                                                        <TableCell className="align-top">
                                                            <ProductCombobox
                                                                ref={index === items.length - 1 ? lastProductRef : null} // ✅ focus ke product baru
                                                                value={item.productId}
                                                                onValueChange={(value) =>
                                                                    updateItem(item.tempId, "productId", value)
                                                                }
                                                                products={products}
                                                                error={!!errors[`productId-${index}`]}
                                                            />
                                                            {errors[`productId-${index}`] && (
                                                                <p className="text-xs text-red-500 mt-1">
                                                                    {errors[`productId-${index}`]}
                                                                </p>
                                                            )}
                                                        </TableCell>
                                                        {/* Source */}
                                                        <TableCell className="align-top">
                                                            <Select
                                                                value={item.sourceProduct || "PEMBELIAN_BARANG"}
                                                                onValueChange={(value: SourceProductType) =>
                                                                    updateItem(item.tempId, "sourceProduct", value)
                                                                }
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Pilih sumber produk" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="PEMBELIAN_BARANG">Pembelian Barang</SelectItem>
                                                                    <SelectItem value="PENGAMBILAN_STOK">Pengambilan Stok</SelectItem>
                                                                    <SelectItem value="OPERATIONAL">Operasional</SelectItem>
                                                                    <SelectItem value="JASA_PEMBELIAN">Jasa Pembelian</SelectItem>
                                                                    <SelectItem value="JASA_INTERNAL">Jasa Internal</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>


                                                        {/* Quantity */}
                                                        <TableCell className="align-top">
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                value={item.jumlah}
                                                                onChange={(e) => updateItem(item.tempId, "jumlah", parseInt(e.target.value) || 1)}
                                                                className={cn("w-20", errors[`quantity-${index}`] && "border-red-500")}
                                                            />
                                                            {errors[`quantity-${index}`] && (
                                                                <p className="text-xs text-red-500 mt-1">{errors[`quantity-${index}`]}</p>
                                                            )}
                                                        </TableCell>

                                                        {/* Unit */}
                                                        <TableCell className="align-top">
                                                            <Input
                                                                value={item.satuan}
                                                                onChange={(e) => updateItem(item.tempId, "satuan", e.target.value)}
                                                                className={cn("w-20", errors[`unit-${index}`] && "border-red-500")}
                                                            />
                                                            {errors[`unit-${index}`] && (
                                                                <p className="text-xs text-red-500 mt-1">{errors[`unit-${index}`]}</p>
                                                            )}
                                                        </TableCell>

                                                        {/* Unit Cost */}
                                                        <TableCell className="align-top">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={item.estimasiHargaSatuan}
                                                                onChange={(e) => updateItem(item.tempId, "estimasiHargaSatuan", parseFloat(e.target.value) || 0)}
                                                                className={cn("w-28", errors[`estimatedUnitCost-${index}`] && "border-red-500")}
                                                            />
                                                            {errors[`estimatedUnitCost-${index}`] && (
                                                                <p className="text-xs text-red-500 mt-1">{errors[`estimatedUnitCost-${index}`]}</p>
                                                            )}
                                                        </TableCell>

                                                        {/* Total */}
                                                        <TableCell className="align-top font-medium">
                                                            Rp. {formatCurrency(item.jumlah * item.estimasiHargaSatuan)}
                                                        </TableCell>

                                                        {/* Actions */}
                                                        <TableCell className="align-top">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeItem(item.tempId)}
                                                                className="text-destructive hover:bg-destructive/10"
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
                                                className="
    gap-1
    shadow-md
    hover:shadow-lg
    hover:scale-105
    transition-all
    duration-150
    ease-in-out
    bg-blue-600
    hover:bg-blue-700
    text-white
    focus-visible:ring-2
    focus-visible:ring-blue-400
    focus-visible:ring-offset-2
    focus-visible:outline-none
  "
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
                                            <div className="p-4 rounded-full">
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
                                                className="gap-2 mt-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none transition-all"
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
                                                                key={`${item.id}-${index}`} // Tambahkan index sebagai fallback
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
                                                                        <div className="font-semibold text-blue-600">
                                                                            {pr.nomorPr || `PR-${pr.id.slice(0, 8)}`}
                                                                        </div>
                                                                        {getStatusBadge(pr.status || 'draft')}
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="text-sm text-muted-foreground">
                                                                            {pr.tanggalPr ? format(new Date(pr.tanggalPr), "dd MMM yyyy") : 'No date'}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                                    <div>
                                                                        <div className="font-medium text-muted-foreground mb-1">
                                                                            Total Items
                                                                        </div>
                                                                        <div className="text-base font-semibold">{pr.details?.length || 0}</div>
                                                                    </div>

                                                                    <div className="md:col-span-2 space-y-2">
                                                                        <div className="flex justify-between">
                                                                            <span className="font-medium">💰 Total Pengajuan Biaya</span>
                                                                            <span className="font-semibold text-right">
                                                                                Rp {formatCurrency(totalBiayaRecent)}
                                                                            </span>
                                                                        </div>

                                                                        <div className="flex justify-between">
                                                                            <span className="font-medium">🏭 Total biaya tidak diajukan</span>
                                                                            <span className="font-semibold text-right">
                                                                                Rp {formatCurrency(totalHPPRecent)}
                                                                            </span>
                                                                        </div>

                                                                        <div className="border-t pt-2 flex justify-between text-base font-bold">
                                                                            <span>🧾 Grand Total HPP</span>
                                                                            <span>Rp {formatCurrency(grandTotalRecent)}</span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="md:col-span-3 text-sm pt-3 border-t">
                                                                        <span className="font-medium text-muted-foreground">Created By :</span>{" "}
                                                                        {pr.karyawan?.namaLengkap || "N/A"}
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
                                <div className="mt-4 border-t pt-3 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="font-medium">💰 Total Pengajuan Biaya :</span>
                                        <span className="font-semibold">
                                            Rp. {formatCurrency(totalBiaya)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="font-medium">🏭 Total biaya tidak diajukan :</span>
                                        <span className="font-semibold">
                                            Rp. {formatCurrency(totalHPP)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between border-t pt-2 text-base">
                                        <span className="font-bold">🧾 Grand Total HPP :</span>
                                        <span className="font-bold">
                                            Rp. {formatCurrency(grandTotal)}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground text-right mt-1">{items.length} items</p>
                            </CardContent>

                            <CardFooter className="flex flex-col gap-3 pt-6">
                                <Button
                                    type="submit"
                                    disabled={submitting || items.length === 0}
                                    className="w-full h-11 gap-2 bg-blue-600 hover:bg-blue-700 dark:text-white font-semibold"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingCart className="h-4 w-4 dark:text-white" /> Create Purchase Request
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
            </form >
        </div >
    );
}