"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
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
    CheckCircle,
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
import { fetchKaryawanByEmail, fetchAllKaryawan } from "@/lib/action/master/karyawan";
import { usePurchaseRequestsBySpkId } from "@/hooks/use-pr";
import { SourceProductType } from "@/schemas/pr";
import { ProductCombobox } from "./productCombobox";
import { api } from "@/lib/http";
import { toast } from "sonner";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";


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

// Update FormItem dengan menambahkan sourceProduct
interface FormItem extends Omit<PurchaseRequestDetail, "id" | "estimasiTotalHarga"> {
    tempId: string;
    // Field sementara untuk kompatibilitas UI
    itemName?: string;
    urgencyLevel?: "low" | "medium" | "high";
    sourceProduct?: SourceProductType; // Field baru untuk source product
    availableStock?: number;
    stockBreakdown?: { warehouseName: string; stock: number }[];
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
        parentPrId: existingData?.parentPrId || "", // ✅ Parent PR reference
        keterangan: existingData?.keterangan || "",
        tanggalPr: existingData?.tanggalPr ? new Date(existingData.tanggalPr) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        requestedById: existingData?.requestedById || "", // ✅ Add requester field
    });
    const [items, setItems] = useState<FormItem[]>([]);
    const [localProducts, setLocalProducts] = useState<Product[]>(products);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Sync localProducts with prop
    useEffect(() => {
        setLocalProducts(products);
    }, [products]);

    const handleProductCreated = useCallback((newProduct: { id: string, name: string }) => {
        setLocalProducts(prev => {
            if (prev.some(p => p.id === newProduct.id)) return prev;
            const fullNewProduct: Product = {
                id: newProduct.id,
                name: newProduct.name,
                type: "Material", // Default type
                usageUnit: "",
                description: "",
                price: 0
            };
            return [...prev, fullNewProduct];
        });
    }, []);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [selectedSpk, setSelectedSpk] = useState<SPK | null>(null);
    const [karyawanData, setKaryawanData] = useState<Karyawan | null>(null);
    const [allKaryawan, setAllKaryawan] = useState<Karyawan[]>([]); // ✅ List of all karyawan
    const [availableParentPRs, setAvailableParentPRs] = useState<PurchaseRequest[]>([]); // ✅ Available parent PRs
    const [selectedParentPR, setSelectedParentPR] = useState<PurchaseRequest | null>(null); // ✅ Selected parent PR
    const [loadingParentPRs, setLoadingParentPRs] = useState(false);
    const [loadingKaryawan, setLoadingKaryawan] = useState(false);
    const [loadingAllKaryawan, setLoadingAllKaryawan] = useState(false);
    const [parentPROpen, setParentPROpen] = useState(false); // ✅ Parent PR popover state


    // Hook untuk mendapatkan histori PR berdasarkan SPK
    const {
        data: purchaseRequests = [],
        isLoading: loadingPR,
        error: prError
    } = usePurchaseRequestsBySpkId(selectedSpk?.id);

    // Initialize form dengan existing data
    useEffect(() => {
        const loadExistingData = async () => {
            if (existingData) {
                // Set form data
                setFormData({
                    projectId: existingData.projectId || "",
                    spkId: existingData.spkId || "",
                    parentPrId: existingData.parentPrId || "", // ✅ Load existing parent PR
                    keterangan: existingData.keterangan || "",
                    tanggalPr: existingData.tanggalPr ? new Date(existingData.tanggalPr) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    requestedById: existingData.requestedById || "", // ✅ Load existing requester
                });

                // Set items dari existing details
                if (existingData.details && existingData.details.length > 0) {
                    // Create base items
                    const baseItems: FormItem[] = existingData.details.map((detail, index) => ({
                        tempId: `existing-${detail.id}-${index}`,
                        productId: detail.productId,
                        projectBudgetId: detail.projectBudgetId || "",
                        jumlah: detail.jumlah,
                        satuan: detail.satuan,
                        estimasiHargaSatuan: detail.estimasiHargaSatuan,
                        catatanItem: detail.catatanItem || "",
                        itemName: products.find(p => p.id === detail.productId)?.name || "",
                        urgencyLevel: "medium",
                        sourceProduct: detail.sourceProduct as SourceProductType || SourceProductType.PEMBELIAN_BARANG,
                    }));

                    // Fetch stock data significantly improves UX
                    const itemsWithStock = await Promise.all(baseItems.map(async (item) => {
                        if (!item.productId) return item;

                        try {
                            const response = await api.get('/api/inventory/latest-stock', {
                                params: { productId: item.productId, detail: 'true' }
                            });
                            if (response.data.success) {
                                return {
                                    ...item,
                                    availableStock: response.data.data,
                                    stockBreakdown: response.data.breakdown || []
                                };
                            }
                        } catch (e) {
                            console.error("Failed to fetch initial stock for item", item.productId, e);
                        }
                        return item;
                    }));

                    setItems(itemsWithStock);
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
        };

        loadExistingData();
    }, [existingData, dataSpk, products]);

    useEffect(() => {
        const fetchKaryawan = async () => {
            if (!currentUser?.email) {
                setLoadingKaryawan(false);
                return;
            }

            try {
                const response = await fetchKaryawanByEmail(currentUser.email);
                const karyawan = response.user;

                if (karyawan && karyawan.id) {
                    setKaryawanData(karyawan);

                    // ✅ Auto-set requestedById HANYA jika mode CREATE (tidak ada existingData)
                    // Dan jika requestedById masih kosong
                    if (!existingData && !formData.requestedById) {
                        setFormData(prev => ({
                            ...prev,
                            requestedById: karyawan.id
                        }));
                    }
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
    }, [currentUser?.email, existingData, formData.requestedById]);

    // ✅ Fetch all karyawan for requester dropdown
    useEffect(() => {
        const fetchAllKaryawanData = async () => {
            setLoadingAllKaryawan(true);
            try {
                const result = await fetchAllKaryawan();
                if (result.karyawan) {
                    setAllKaryawan(result.karyawan);
                }
            } catch (error) {
                console.error("Error fetching all karyawan:", error);
            } finally {
                setLoadingAllKaryawan(false);
            }
        };

        fetchAllKaryawanData();
    }, []);

    // ✅ Fetch available parent PRs when SPK is selected
    useEffect(() => {
        const fetchParentPRs = async () => {
            // Only fetch if SPK is selected (PR SPK needs parent)
            if (!formData.spkId || formData.spkId === "no-spk") {
                setAvailableParentPRs([]);
                setSelectedParentPR(null);
                return;
            }

            setLoadingParentPRs(true);
            try {
                // Fetch COMPLETED PR UM (spkId=null, status=COMPLETED)
                const response = await api.get('/api/pr/getAllPurchaseRequests', {
                    params: {
                        status: 'COMPLETED',
                        spkId: 'null', // Filter for PR UM only
                        limit: 100,
                    }
                });

                if (response.data.success) {
                    setAvailableParentPRs(response.data.data);

                    // If editing and has parentPrId, set selected parent
                    if (existingData?.parentPrId) {
                        const parent = response.data.data.find((pr: PurchaseRequest) => pr.id === existingData.parentPrId);
                        if (parent) {
                            setSelectedParentPR(parent);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching parent PRs:", error);
                setAvailableParentPRs([]);
            } finally {
                setLoadingParentPRs(false);
            }
        };

        fetchParentPRs();
    }, [formData.spkId, existingData?.parentPrId]);

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
            setSelectedParentPR(null); // ✅ Reset parent PR
            setFormData(prev => ({
                ...prev,
                spkId: "",
                projectId: "",
                parentPrId: "", // ✅ Reset parent PR ID
                keterangan: ""
            }));
        }
    };

    // ✅ Handle parent PR selection
    const handleParentPRChange = (parentPrId: string) => {
        const parentPR = availableParentPRs.find(pr => pr.id === parentPrId);
        setSelectedParentPR(parentPR || null);
        setFormData(prev => ({
            ...prev,
            parentPrId: parentPrId || "",
        }));
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
            sourceProduct: SourceProductType.PEMBELIAN_BARANG, // Default value
        };
        setItems((prev) => [...prev, newItem]);
    }, []);

    const removeItem = useCallback((tempId: string) => {
        setItems((prev) => prev.filter((item) => item.tempId !== tempId));
    }, []);

    const updateItem = useCallback(
        async (tempId: string, field: keyof FormItem, value: string | number | SourceProductType) => {
            // Fetch stock if product changes
            let stockValue = 0;
            let stockBreakdown: { warehouseName: string; stock: number }[] = [];

            if (field === "productId" && value) {
                try {
                    const response = await api.get('/api/inventory/latest-stock', {
                        params: { productId: value, detail: 'true' }
                    });
                    if (response.data.success) {
                        stockValue = response.data.data;
                        stockBreakdown = response.data.breakdown || [];
                    }
                } catch (err) {
                    console.error("Error fetching stock:", err);
                }
            }

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
                                updatedItem.availableStock = stockValue;
                                updatedItem.stockBreakdown = stockBreakdown;
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
        let errorMessages: string[] = [];

        // Validasi Requestor (Pemohon) - WAJIB
        if (!formData.requestedById || formData.requestedById.trim() === "") {
            newErrors.requestedById = "Requestor wajib dipilih";
            errorMessages.push("• Requestor (Pemohon) wajib dipilih");
        }

        // Validasi Tanggal PR
        if (!formData.tanggalPr) {
            newErrors.tanggalPr = "Tanggal PR wajib diisi";
            errorMessages.push("• Tanggal PR wajib diisi");
        }

        // Validasi items
        if (items.length === 0) {
            newErrors.items = "Minimal satu item harus ditambahkan";
            errorMessages.push("• Minimal satu item harus ditambahkan");
        }

        // Validasi setiap item
        items.forEach((item, index) => {
            const itemNumber = index + 1;
            if (!item.productId) {
                newErrors[`productId-${index}`] = "Product wajib dipilih";
                errorMessages.push(`• Item ${itemNumber}: Product wajib dipilih`);
            }
            if (item.jumlah <= 0) {
                newErrors[`quantity-${index}`] = "Qty harus > 0";
                errorMessages.push(`• Item ${itemNumber}: Quantity harus lebih dari 0`);
            }
            if (item.estimasiHargaSatuan < 0) {
                newErrors[`estimatedUnitCost-${index}`] = "Harga tidak boleh negatif";
                errorMessages.push(`• Item ${itemNumber}: Harga tidak boleh negatif`);
            }
            if (!item.satuan || !item.satuan.trim()) {
                newErrors[`unit-${index}`] = "Satuan wajib diisi";
                errorMessages.push(`• Item ${itemNumber}: Satuan wajib diisi`);
            }
            if (!item.sourceProduct) {
                newErrors[`sourceProduct-${index}`] = "Source product wajib dipilih";
                errorMessages.push(`• Item ${itemNumber}: Source product wajib dipilih`);
            }
        });

        setErrors(newErrors);

        // Tampilkan toast error dengan detail field yang salah
        if (errorMessages.length > 0) {
            const errorList = errorMessages.slice(0, 5).join("\n");
            const moreErrors = errorMessages.length > 5 ? `\n... dan ${errorMessages.length - 5} kesalahan lainnya` : "";

            toast.error("Validasi Gagal", {
                description: `Silakan perbaiki kesalahan berikut:\n${errorList}${moreErrors}`,
                duration: 5000,
            });
            return false;
        }

        return true;
    }, [formData, items]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validasi form
        if (!validateForm()) {
            return;
        }

        // Fallback: jika karyawanData tidak ditemukan, gunakan currentUser.id
        const finalKaryawanId = karyawanData?.id || currentUser?.id;

        if (!finalKaryawanId) {
            toast.error("Data Karyawan Tidak Ditemukan", {
                description: "Data karyawan tidak ditemukan. Silakan hubungi administrator."
            });
            return;
        }

        try {
            // Debug log
            console.log("📝 UPDATE Form Data before submit:", {
                karyawanId: finalKaryawanId,
                requestedById: formData.requestedById,
                requestedByIdType: typeof formData.requestedById,
                willUse: formData.requestedById || finalKaryawanId
            });

            const submitData: CreatePurchaseRequestData = {
                projectId: formData.projectId,
                spkId: formData.spkId === "no-spk" ? null : formData.spkId,
                parentPrId: formData.parentPrId && formData.parentPrId !== "" ? formData.parentPrId : null, // ✅ Include parent PR
                karyawanId: finalKaryawanId, // Gunakan fallback
                requestedById: formData.requestedById, // ✅ Send as-is, let backend handle
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
            // Toast success akan ditampilkan oleh parent component
            onSuccess();
        } catch (error) {
            console.error("Failed to update purchase request:", error);

            // Tampilkan error message yang lebih informatif
            const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat mengupdate Purchase Request";

            toast.error("Gagal Update Purchase Request", {
                description: errorMessage
            });
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

    // Fungsi untuk mendapatkan label source product
    const getSourceProductLabel = (source: SourceProductType): string => {
        const sourceLabels = {
            [SourceProductType.PEMBELIAN_BARANG]: "Pembelian Barang",
            [SourceProductType.PENGAMBILAN_STOK]: "Pengambilan Stok",
            [SourceProductType.OPERATIONAL]: "Operasional",
            [SourceProductType.JASA_PEMBELIAN]: "Jasa Pembelian",
            [SourceProductType.JASA_INTERNAL]: "Jasa Internal",
        };
        return sourceLabels[source] || source;
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

                                {/* ✅ Parent PR Selector - Only show when SPK is selected */}
                                {formData.spkId && formData.spkId !== "no-spk" && (
                                    <div className="space-y-2 md:col-span-2 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-lg shadow-sm">
                                        <Label htmlFor="parentPrId" className="font-bold flex items-center gap-2 text-base">
                                            <FileText className="h-5 w-5 text-amber-600" />
                                            Parent PR (PR UM)
                                            <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-md animate-pulse">
                                                WAJIB DIISI
                                            </span>
                                        </Label>
                                        <Popover open={parentPROpen} onOpenChange={setParentPROpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={parentPROpen}
                                                    className={cn(
                                                        "w-full justify-between border-2",
                                                        errors.parentPrId ? "border-red-500 bg-red-50" : "border-amber-400 bg-white shadow-sm",
                                                        !formData.parentPrId && "text-muted-foreground"
                                                    )}
                                                    disabled={loadingParentPRs || editMode}
                                                >
                                                    {loadingParentPRs ? (
                                                        "Loading parent PRs..."
                                                    ) : formData.parentPrId ? (
                                                        availableParentPRs.find((pr) => pr.id === formData.parentPrId)?.nomorPr
                                                    ) : (
                                                        "⚠️ Pilih Parent PR"
                                                    )}
                                                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[400px] p-0" align="start">
                                                <Command>
                                                    <CommandInput
                                                        placeholder="Cari nomor PR..."
                                                        className="h-9"
                                                    />
                                                    <CommandList>
                                                        <CommandEmpty>
                                                            <div className="p-4 text-center text-sm text-muted-foreground">
                                                                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                                                                <p>Tidak ditemukan</p>
                                                                <p className="text-xs mt-1">Coba kata kunci lain</p>
                                                            </div>
                                                        </CommandEmpty>
                                                        <CommandGroup className="max-h-64 overflow-auto">
                                                            {availableParentPRs.map((pr) => {
                                                                const parentBudget = pr.details?.reduce((sum, d) => sum + (Number(d.jumlah) * Number(d.estimasiHargaSatuan)), 0) || 0;
                                                                return (
                                                                    <CommandItem
                                                                        key={pr.id}
                                                                        value={pr.nomorPr}
                                                                        onSelect={() => {
                                                                            handleParentPRChange(pr.id);
                                                                            setParentPROpen(false);
                                                                        }}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        <div className="flex flex-col w-full">
                                                                            <span className="font-medium">{pr.nomorPr}</span>
                                                                            <span className="text-xs text-muted-foreground">
                                                                                Budget: {formatCurrency(parentBudget)}
                                                                            </span>
                                                                        </div>
                                                                        {formData.parentPrId === pr.id && (
                                                                            <CheckCircle className="ml-auto h-4 w-4 text-green-600" />
                                                                        )}
                                                                    </CommandItem>
                                                                );
                                                            })}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        {errors.parentPrId && <p className="text-xs text-red-500">{errors.parentPrId}</p>}

                                        {/* Budget Info */}
                                        {selectedParentPR && (
                                            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                                                <div className="flex items-start gap-2">
                                                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                                                    <div className="flex-1 text-sm">
                                                        <p className="font-medium text-green-900">Parent PR: {selectedParentPR.nomorPr}</p>
                                                        <p className="text-xs text-green-700 mt-1">
                                                            Total Budget: {formatCurrency(
                                                                selectedParentPR.details?.reduce((sum, d) =>
                                                                    sum + (Number(d.jumlah) * Number(d.estimasiHargaSatuan)), 0
                                                                ) || 0
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Pastikan total PR SPK tidak melebihi budget parent
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {editMode && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Parent PR tidak dapat diubah dalam mode edit
                                            </p>
                                        )}

                                        {!editMode && (
                                            <p className="text-xs text-muted-foreground">
                                                PR SPK wajib terkait dengan PR UM yang sudah COMPLETED
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="requestedById" className="font-semibold flex items-center gap-2">
                                        <UserIcon className="h-4 w-4 text-purple-600" />
                                        Requester (Pemohon) <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={formData.requestedById}
                                        onValueChange={(value) => setFormData((prev) => ({ ...prev, requestedById: value }))}
                                        disabled={loadingAllKaryawan}
                                    >
                                        <SelectTrigger className={cn("w-full", errors.requestedById && "border-red-500")}>
                                            <SelectValue placeholder={loadingAllKaryawan ? "Loading..." : "Pilih pemohon"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allKaryawan.map((karyawan) => (
                                                <SelectItem key={karyawan.id} value={karyawan.id}>
                                                    {karyawan.namaLengkap} {karyawan.jabatan ? `- ${karyawan.jabatan}` : ""}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.requestedById && <p className="text-xs text-red-500">{errors.requestedById}</p>}
                                    <p className="text-xs text-muted-foreground">
                                        Siapa yang mengajukan permintaan pembelian ini?
                                    </p>
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
                            </CardHeader>
                            <CardContent>
                                {errors.items && <p className="text-sm text-red-500 mb-4">{errors.items}</p>}
                                {items.length > 0 ? (
                                    <div className="border rounded-md overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-muted/50">
                                                <TableRow>
                                                    <TableHead className="w-[20%]">Product</TableHead>
                                                    <TableHead className="w-[15%]">Source</TableHead>
                                                    <TableHead className="w-[10%]">Qty</TableHead>
                                                    <TableHead className="w-[10%]">Available</TableHead>
                                                    <TableHead className="w-[10%]">Unit</TableHead>
                                                    <TableHead className="w-[15%]">Unit Cost</TableHead>
                                                    <TableHead className="w-[15%]">Total</TableHead>
                                                    <TableHead className="w-[5%]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {items.map((item, index) => (
                                                    <TableRow key={item.tempId}>
                                                        {/* Product */}
                                                        <TableCell className="align-top">
                                                            <ProductCombobox
                                                                value={item.productId}
                                                                onValueChange={(value) => updateItem(item.tempId, "productId", value)}
                                                                products={localProducts}
                                                                error={!!errors[`productId-${index}`]}
                                                                onCreated={handleProductCreated}
                                                            />
                                                            {errors[`productId-${index}`] && (
                                                                <p className="text-xs text-red-500 mt-1">{errors[`productId-${index}`]}</p>
                                                            )}
                                                        </TableCell>

                                                        {/* Source */}
                                                        <TableCell className="align-top">
                                                            <Select
                                                                value={item.sourceProduct || SourceProductType.PEMBELIAN_BARANG}
                                                                onValueChange={(value: SourceProductType) =>
                                                                    updateItem(item.tempId, "sourceProduct", value)
                                                                }
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Pilih sumber produk" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value={SourceProductType.PEMBELIAN_BARANG}>Pembelian Barang</SelectItem>
                                                                    <SelectItem value={SourceProductType.PENGAMBILAN_STOK}>Pengambilan Stok</SelectItem>
                                                                    <SelectItem value={SourceProductType.OPERATIONAL}>Operasional</SelectItem>
                                                                    <SelectItem value={SourceProductType.JASA_PEMBELIAN}>Jasa Pembelian</SelectItem>
                                                                    <SelectItem value={SourceProductType.JASA_INTERNAL}>Jasa Internal</SelectItem>
                                                                </SelectContent>
                                                            </Select>
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

                                                        {/* Stock Breakdown Tooltip */}
                                                        <TableCell className="align-top">
                                                            {(item.sourceProduct === SourceProductType.PEMBELIAN_BARANG || item.sourceProduct === SourceProductType.PENGAMBILAN_STOK) ? (
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <div className="py-2 px-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-md text-center font-bold text-sm cursor-help hover:bg-emerald-200 transition-colors">
                                                                                {item.availableStock !== undefined ? item.availableStock : '-'}
                                                                            </div>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className="p-0 border-none shadow-xl">
                                                                            <Card className="w-64 border-slate-200 dark:border-slate-800">
                                                                                <CardHeader className="py-3 px-4 bg-slate-50 dark:bg-slate-900 border-b">
                                                                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                                                                        <Package className="w-4 h-4 text-emerald-600" />
                                                                                        Stock Details
                                                                                    </CardTitle>
                                                                                </CardHeader>
                                                                                <CardContent className="p-0">
                                                                                    {item.stockBreakdown && item.stockBreakdown.length > 0 ? (
                                                                                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                                                                            {item.stockBreakdown.map((wh, idx) => (
                                                                                                <div key={idx} className="flex items-center justify-between py-2 px-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                                                                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{wh.warehouseName}</span>
                                                                                                    <Badge variant="outline" className="text-xs font-bold font-mono h-5 bg-white dark:bg-slate-950">
                                                                                                        {wh.stock}
                                                                                                    </Badge>
                                                                                                </div>
                                                                                            ))}
                                                                                            <div className="flex items-center justify-between py-2 px-4 bg-emerald-50/50 dark:bg-emerald-900/10 font-bold border-t">
                                                                                                <span className="text-xs text-emerald-700 dark:text-emerald-400">Total Valid</span>
                                                                                                <span className="text-xs text-emerald-700 dark:text-emerald-400">{item.availableStock}</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="p-4 text-center text-xs text-slate-400">
                                                                                            No Details
                                                                                        </div>
                                                                                    )}
                                                                                </CardContent>
                                                                            </Card>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            ) : (
                                                                <div className="py-2 px-3 text-center text-gray-400 font-medium text-sm">
                                                                    -
                                                                </div>
                                                            )}
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
                                            <div className=" p-4 rounded-full">
                                                <ShoppingCart className="h-12 w-12 text-slate-500" />
                                            </div>
                                            <h3 className="text-xl font-semibold">
                                                Daftar Item Masih Kosong
                                            </h3>
                                            <p className="text-muted-foreground max-w-xs mx-auto">
                                                Mulailah dengan menambahkan item pertama Anda ke dalam daftar permintaan pembelian.
                                            </p>
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
                                    Admin Input Purchase Request
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    <p><strong>Name:</strong> {karyawanData?.namaLengkap || currentUser?.name || 'N/A'}</p>
                                    <p><strong>Email:</strong> {currentUser?.email || 'N/A'}</p>
                                    {existingData?.karyawan && (
                                        <p><strong>Original Admin Input:</strong> {existingData.karyawan.namaLengkap}</p>
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
                                                    if (pr.spkId !== selectedSpk.id) {
                                                        return null;
                                                    }

                                                    return (
                                                        <div key={pr.id} className="border rounded-lg hover:bg-muted/30 transition-colors">
                                                            <div className="p-4 bg-card rounded-lg shadow-sm">
                                                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                                                    <div className={cn(
                                                                        "font-semibold text-base",
                                                                        pr.id === existingData?.id ? "text-green-600" : "text-blue-600"
                                                                    )}>
                                                                        {pr.nomorPr || `PR-${pr.id.slice(0, 8)}`}
                                                                        {pr.id === existingData?.id && (
                                                                            <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 text-xs">
                                                                                Current
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    {getStatusBadge(pr.status || "draft")}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {pr.tanggalPr ? format(new Date(pr.tanggalPr), "dd MMM yyyy") : "No date"}
                                                                </div>
                                                            </div>

                                                            <div className="border-t my-3" />

                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                                <div>
                                                                    <div className="font-medium text-muted-foreground mb-1">Total Items</div>
                                                                    <div className="text-base font-semibold">{pr.details?.length || 0}</div>
                                                                </div>
                                                                <div className="md:col-span-2 space-y-2">
                                                                    <div className="flex justify-between">
                                                                        <span className="font-medium">💰 Total Biaya</span>
                                                                        <span className="font-semibold">Rp {formatCurrency(pr.details?.reduce((acc, curr) => acc + (curr.jumlah * curr.estimasiHargaSatuan), 0) || 0)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {pr.details && pr.details.length > 0 && (
                                                                <div className="border-t mt-4 pt-4">
                                                                    <Accordion type="single" collapsible className="w-full">
                                                                        <AccordionItem value={`details-${pr.id}`} className="border-b-0">
                                                                            <AccordionTrigger className="px-0 py-1 hover:no-underline">
                                                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                                                    View Items ({pr.details.length})
                                                                                </div>
                                                                            </AccordionTrigger>
                                                                            <AccordionContent className="px-0 pt-3">
                                                                                <div className="space-y-3">
                                                                                    {pr.details.map((detail, index) => (
                                                                                        <div key={`${detail.id}-${index}`} className="flex justify-between items-start p-3 rounded-lg border">
                                                                                            <div className="flex-1">
                                                                                                <div className="font-medium flex items-center gap-2">
                                                                                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{index + 1}</span>
                                                                                                    {detail.catatanItem || detail.product?.name || `Item ${index + 1}`}
                                                                                                </div>
                                                                                                {detail.sourceProduct && (
                                                                                                    <div className="text-xs text-muted-foreground mt-1">
                                                                                                        Source: {getSourceProductLabel(detail.sourceProduct as SourceProductType)}
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                            <div className="text-right">
                                                                                                <div className="font-medium">{detail.jumlah} {detail.satuan}</div>
                                                                                                <div className="text-xs text-muted-foreground">Rp {formatCurrency(detail.estimasiHargaSatuan || 0)}/unit</div>
                                                                                                <div className="font-semibold text-green-600 mt-1">Rp {formatCurrency((detail.jumlah || 0) * (detail.estimasiHargaSatuan || 0))}</div>
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
                                                }).filter(Boolean)}
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
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="font-medium">💰 Total Pengajuan Biaya:</span>
                                        <span className="font-semibold">
                                            Rp {formatCurrency(totalBiaya)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="font-medium">🏭 Total biaya tidak diajukan:</span>
                                        <span className="font-semibold">
                                            Rp {formatCurrency(totalHPP)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between border-t pt-2 text-base">
                                        <span className="font-bold">🧾 Grand Total HPP:</span>
                                        <span className="font-bold">
                                            Rp {formatCurrency(grandTotal)}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground text-right mt-1">{items.length} items</p>
                            </CardContent>

                            <CardFooter className="flex flex-col gap-3 pt-6">
                                <Button
                                    type="submit"
                                    disabled={submitting || items.length === 0}
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