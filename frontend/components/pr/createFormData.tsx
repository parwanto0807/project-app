"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
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
    CheckCircle,
    XCircle,
} from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { cn, formatDateIndo } from "@/lib/utils";
import { PurchaseRequestDetail, CreatePurchaseRequestData, PurchaseRequest } from "@/types/pr";
import { Project } from "@/types/salesOrder";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import { formatCurrency } from "@/lib/action/rab/rab-utils";
import { fetchKaryawanByEmail, fetchAllKaryawan } from "@/lib/action/master/karyawan";
import { usePurchaseRequestsBySpkId } from "@/hooks/use-pr";
import { ProductCombobox } from "./productCombobox";
import { SourceProductType } from "@/schemas/pr";
import { api } from "@/lib/http";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
    purchaseUnit?: string;
    storageUnit?: string;
    conversionToStorage?: number;
    conversionToUsage?: number;
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


interface FormItem extends Omit<PurchaseRequestDetail, "id" | "estimasiTotalHarga"> {
    tempId: string;
    // Field sementara untuk kompatibilitas UI
    itemName?: string;
    availableStock?: number; // Renamed from stockAkhir
    stockBreakdown?: { warehouseName: string; stock: number }[]; // New field for breakdown
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
        parentPrId: "", // ✅ Parent PR reference
        keterangan: "",
        tanggalPr: new Date(),
        requestedById: "", // ✅ Add requester field
    });
    const [items, setItems] = useState<FormItem[]>([]);
    const [localProducts, setLocalProducts] = useState<Product[]>(products);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [selectedSpk, setSelectedSpk] = useState<SPK | null>(null);
    const [karyawanData, setKaryawanData] = useState<Karyawan | null>(null);
    const [allKaryawan, setAllKaryawan] = useState<Karyawan[]>([]); // ✅ List of all karyawan
    const [availableParentPRs, setAvailableParentPRs] = useState<PurchaseRequest[]>([]); // ✅ Available parent PRs
    const [selectedParentPR, setSelectedParentPR] = useState<PurchaseRequest | null>(null); // ✅ Selected parent PR
    const [loadingParentPRs, setLoadingParentPRs] = useState(false);
    const [parentPROpen, setParentPROpen] = useState(false); // ✅ Parent PR popover state
    const [loadingKaryawan, setLoadingKaryawan] = useState(false);
    const [loadingAllKaryawan, setLoadingAllKaryawan] = useState(false);
    const lastProductRef = useRef<HTMLButtonElement | null>(null);
    const lastRowRef = useRef<HTMLTableRowElement | null>(null);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [isBudgetWarningOpen, setIsBudgetWarningOpen] = useState(false); // ✅ New state for budget warning

    // Sync localProducts with prop
    useEffect(() => {
        setLocalProducts(products);
    }, [products]);

    const handleProductCreated = useCallback((newProduct: { id: string, name: string }) => {
        setLocalProducts(prev => {
            // Check if product already exists to avoid duplicates
            if (prev.some(p => p.id === newProduct.id)) return prev;

            // Create a full product object (with dummy values for fields we don't have yet)
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
            if (!currentUser?.email) {
                setLoadingKaryawan(false);
                return;
            }

            try {
                const response = await fetchKaryawanByEmail(currentUser.email);
                const karyawan = response.user;

                if (karyawan && karyawan.id) {
                    setKaryawanData(karyawan);
                    // ✅ Default requester to current user
                    setFormData(prev => ({
                        ...prev,
                        requestedById: karyawan.id
                    }));
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
                setFormData(prev => ({ ...prev, parentPrId: "" }));
                return;
            }

            setLoadingParentPRs(true);
            try {
                // Fetch COMPLETED PR UM (spkId=null, status=COMPLETED)
                const response = await api.get('/api/pr/getAllPurchaseRequests', {
                    params: {
                        status: 'COMPLETED',
                        type: 'umum', // Correct filter for PR UM only (spkId=null)
                        limit: 300,
                    }
                });

                if (response.data.success) {
                    // Client-side filter as double-check: only PRs without spkId
                    const prUmumOnly = response.data.data.filter((pr: any) => !pr.spkId);
                    setAvailableParentPRs(prUmumOnly);
                }
            } catch (error) {
                console.error("Error fetching parent PRs:", error);
                setAvailableParentPRs([]);
            } finally {
                setLoadingParentPRs(false);
            }
        };

        fetchParentPRs();
    }, [formData.spkId]);

    // Debug log ketika karyawanData berubah
    // useEffect(() => {
    //     console.log("Karyawan data updated:", karyawanData);
    // }, [karyawanData]);

    const handleSpkChange = (spkId: string) => {
        // Jika user memilih "Tidak menggunakan SPK"
        if (spkId === "no-spk") {
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
            return;
        }

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
            sourceProduct: (!formData.spkId || formData.spkId === "no-spk")
                ? SourceProductType.PEMBELIAN_BARANG
                : SourceProductType.PEMBELIAN_BARANG, // Default value based on SPK
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
    }, [formData.spkId]);

    const removeItem = useCallback((tempId: string) => {
        setItems((prev) => prev.filter((item) => item.tempId !== tempId));
    }, []);

    const updateItem = useCallback(
        async (tempId: string, field: keyof FormItem, value: string | number | SourceProductType) => {
            // Update state immediately for responsiveness
            setItems((prev) =>
                prev.map((item) => {
                    if (item.tempId === tempId) {
                        return { ...item, [field]: value };
                    }
                    return item;
                })
            );

            // If sourceProduct changes, update satuan accordingly
            if (field === "sourceProduct" && value) {
                setItems((prev) =>
                    prev.map((item) => {
                        if (item.tempId === tempId && item.productId) {
                            const selectedProduct = products.find(p => p.id === item.productId);
                            if (selectedProduct) {
                                const updatedItem = { ...item };

                                // Set satuan berdasarkan sourceProduct yang baru
                                if (value === SourceProductType.PEMBELIAN_BARANG) {
                                    updatedItem.satuan = selectedProduct.purchaseUnit || selectedProduct.usageUnit || "pcs";
                                } else if (value === SourceProductType.PENGAMBILAN_STOK) {
                                    updatedItem.satuan = selectedProduct.usageUnit || selectedProduct.storageUnit || "pcs";
                                } else {
                                    updatedItem.satuan = selectedProduct.usageUnit || "pcs";
                                }

                                return updatedItem;
                            }
                        }
                        return item;
                    })
                );
            }

            // If product changes, fetch additional data
            if (field === "productId" && value) {
                const selectedProduct = products.find(p => p.id === value);

                // Fetch latest stock with breakdown
                let stockValue = 0;
                let stockBreakdown: { warehouseName: string; stock: number }[] = [];
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

                setItems((prev) =>
                    prev.map((item) => {
                        if (item.tempId === tempId && selectedProduct) {
                            const updatedItem = { ...item };
                            updatedItem.itemName = selectedProduct.name;
                            updatedItem.catatanItem = selectedProduct.description || "";

                            // Tentukan satuan berdasarkan sourceProduct
                            // Jika sourceProduct belum diset, gunakan default berdasarkan SPK
                            const currentSourceProduct = updatedItem.sourceProduct ||
                                (!formData.spkId || formData.spkId === "no-spk"
                                    ? SourceProductType.PEMBELIAN_BARANG
                                    : SourceProductType.PEMBELIAN_BARANG);

                            // Set satuan berdasarkan sourceProduct
                            if (currentSourceProduct === SourceProductType.PEMBELIAN_BARANG) {
                                updatedItem.satuan = selectedProduct.purchaseUnit || selectedProduct.usageUnit || "pcs";
                            } else if (currentSourceProduct === SourceProductType.PENGAMBILAN_STOK) {
                                updatedItem.satuan = selectedProduct.usageUnit || selectedProduct.storageUnit || "pcs";
                            } else {
                                updatedItem.satuan = selectedProduct.usageUnit || "pcs";
                            }

                            updatedItem.estimasiHargaSatuan = selectedProduct.price || 0;
                            updatedItem.availableStock = stockValue;
                            updatedItem.stockBreakdown = stockBreakdown;

                            // Map Type
                            const sourceProductMap: Record<string, SourceProductType> = {
                                "Pembelian Barang": SourceProductType.PEMBELIAN_BARANG,
                                "Pengambilan Stock": SourceProductType.PENGAMBILAN_STOK,
                                "Operasional": SourceProductType.OPERATIONAL,
                                "Jasa Pembelian": SourceProductType.JASA_PEMBELIAN,
                                "Jasa Internal": SourceProductType.JASA_INTERNAL,
                            };

                            // Check if SPK is selected
                            const isNonSpk = !formData.spkId || formData.spkId === "no-spk";

                            updatedItem.sourceProduct = isNonSpk
                                ? SourceProductType.PEMBELIAN_BARANG
                                : (sourceProductMap[selectedProduct.type] ?? SourceProductType.PEMBELIAN_BARANG);

                            return updatedItem;
                        }
                        return item;
                    })
                );
            }
        },
        [products, formData.spkId]
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

        // ✅ Parent PR wajib jika SPK dipilih (PR SPK)
        if (formData.spkId && formData.spkId !== "no-spk" && !formData.parentPrId) {
            newErrors.parentPrId = "Parent PR is required for PR SPK";
        }

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

        // Check if over budget (only for PR SPK)
        const isPrSpk = !!(formData.spkId && formData.spkId !== "no-spk");
        if (isPrSpk && selectedParentPR) {
            const currentSisa = Number(selectedParentPR.sisaBudget || 0);
            if (totalBiaya > currentSisa) {
                setIsBudgetWarningOpen(true);
                return;
            }
        }

        setIsConfirmDialogOpen(true);
    };

    const handleConfirmSubmit = async () => {
        const finalKaryawanId = karyawanData?.id || currentUser?.id;

        if (!finalKaryawanId) return;

        try {
            // Debug log
            console.log("📝 Form Data before submit:", {
                karyawanId: finalKaryawanId,
                requestedById: formData.requestedById,
                willUse: formData.requestedById || finalKaryawanId
            });

            const submitData: CreatePurchaseRequestData = {
                projectId: formData.projectId,
                spkId: formData.spkId === "no-spk" ? null : formData.spkId,
                parentPrId: formData.parentPrId && formData.parentPrId !== "" ? formData.parentPrId : null, // ✅ Send null if empty
                karyawanId: finalKaryawanId,
                requestedById: formData.requestedById || finalKaryawanId, // ✅ Include requester
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
        } finally {
            setIsConfirmDialogOpen(false);
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

            {/* ✅ PR Type Indicator */}
            <div className={cn(
                "p-4 rounded-lg shadow-md border-2 transition-all duration-300",
                formData.spkId && formData.spkId !== "no-spk"
                    ? "bg-gradient-to-r from-green-100 to-emerald-100 border-green-400"
                    : "bg-gradient-to-r from-orange-100 to-orange-100 border-orange-400"
            )}>
                <div className="flex items-center justify-center gap-3">
                    <FileText className={cn(
                        "h-6 w-6",
                        formData.spkId && formData.spkId !== "no-spk" ? "text-green-700" : "text-orange-700"
                    )} />
                    <h2 className={cn(
                        "text-xl md:text-2xl font-bold",
                        formData.spkId && formData.spkId !== "no-spk" ? "text-green-800" : "text-red-800"
                    )}>
                        {formData.spkId && formData.spkId !== "no-spk" ? "PR SPK" : "PR UMUM"}
                    </h2>
                    <Badge className={cn(
                        "text-xs font-semibold",
                        formData.spkId && formData.spkId !== "no-spk"
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-red-600 hover:bg-red-700"
                    )}>
                        {formData.spkId && formData.spkId !== "no-spk" ? "Dengan SPK" : "Tanpa SPK"}
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
                                    <Label htmlFor="spkId" className="font-semibold">SPK (Surat Perintah Kerja)</Label>
                                    <Select value={formData.spkId || "no-spk"} onValueChange={handleSpkChange}>
                                        <SelectTrigger className={cn(errors.spkId && "border-red-500")}>
                                            <SelectValue placeholder="Select SPK" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="no-spk">Tidak menggunakan SPK</SelectItem>
                                            {dataSpk.map((spk) => (
                                                <SelectItem key={spk.id} value={spk.id}>
                                                    {spk.spkNumber} - {spk.salesOrder.project?.name} - {spk.salesOrder.customer.branch}
                                                </SelectItem>
                                            ))}
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
                                                {formData.tanggalPr ? formatDateIndo(formData.tanggalPr, "PPP") : <span>Pick a date</span>}
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
                                                        errors.parentPrId ? "border-red-500 bg-red-50" : "border-amber-400 bg-white",
                                                        !formData.parentPrId && "text-muted-foreground"
                                                    )}
                                                    disabled={loadingParentPRs}
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
                                        {errors.parentPrId && (
                                            <p className="text-sm text-red-600 font-semibold flex items-center gap-1">
                                                <AlertTriangle className="h-4 w-4" />
                                                {errors.parentPrId}
                                            </p>
                                        )}

                                        {/* Budget Info */}
                                        {selectedParentPR && (
                                            <>
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
                                                            <p className="text-xs font-bold text-amber-700 mt-1">
                                                                Sisa Budget Tersedia: {formatCurrency(selectedParentPR.sisaBudget || 0)}
                                                            </p>
                                                            {totalBiaya > 0 && (
                                                                <p className={cn(
                                                                    "text-xs font-bold mt-1",
                                                                    (selectedParentPR.sisaBudget || 0) - totalBiaya < 0 ? "text-red-600" : "text-blue-600"
                                                                )}>
                                                                    Proyeksi Sisa Setelah PR ini: {formatCurrency((selectedParentPR.sisaBudget || 0) - totalBiaya)}
                                                                </p>
                                                            )}
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                Pastikan total PR SPK tidak melebihi budget parent (hanya item Biaya/Cash yang memotong budget)
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Parent PR Items Detail */}
                                                {selectedParentPR.details && selectedParentPR.details.length > 0 && (
                                                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                                        <p className="text-xs font-semibold text-blue-900 mb-2">Parent PR Items:</p>
                                                        <div className="max-h-48 overflow-y-auto">
                                                            <table className="w-full text-xs">
                                                                <thead className="bg-blue-100 sticky top-0">
                                                                    <tr>
                                                                        <th className="text-left p-1 text-blue-900">Product</th>
                                                                        <th className="text-right p-1 text-blue-900">Qty</th>
                                                                        <th className="text-right p-1 text-blue-900">Unit Price</th>
                                                                        <th className="text-right p-1 text-blue-900">Total</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {selectedParentPR.details.map((detail, idx) => (
                                                                        <tr key={idx} className="border-b border-blue-100">
                                                                            <td className="p-1 text-blue-900">
                                                                                {detail.product?.name || detail.productId}
                                                                            </td>
                                                                            <td className="text-right p-1 text-blue-700">
                                                                                {detail.jumlah} {detail.satuan}
                                                                            </td>
                                                                            <td className="text-right p-1 text-blue-700">
                                                                                {formatCurrency(Number(detail.estimasiHargaSatuan))}
                                                                            </td>
                                                                            <td className="text-right p-1 font-medium text-blue-900">
                                                                                {formatCurrency(Number(detail.jumlah) * Number(detail.estimasiHargaSatuan))}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        <p className="text-xs text-amber-800 font-medium bg-amber-100 p-2 rounded border border-amber-300">
                                            ⚠️ PR SPK wajib terkait dengan PR UM yang sudah COMPLETED
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="requestedById" className="font-semibold flex items-center gap-2">
                                        <UserIcon className="h-4 w-4 text-purple-600" />
                                        Requester (Pemohon)
                                    </Label>
                                    <Select
                                        value={formData.requestedById}
                                        onValueChange={(value) => setFormData((prev) => ({ ...prev, requestedById: value }))}
                                        disabled={loadingAllKaryawan}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={loadingAllKaryawan ? "Loading..." : "Select requester"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allKaryawan.map((karyawan) => (
                                                <SelectItem key={karyawan.id} value={karyawan.id}>
                                                    {karyawan.namaLengkap} {karyawan.jabatan ? `- ${karyawan.jabatan}` : ""}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Who is requesting this purchase? (Default: You)
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
                                                    <TableHead className="w-[10%]">Available Stock</TableHead>
                                                    <TableHead className="w-[10%]">Status/Selisih</TableHead>
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
                                                                products={localProducts}
                                                                error={!!errors[`productId-${index}`]}
                                                                onCreated={handleProductCreated}
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
                                                                    {/* Jika spkId kosong, tampilkan Pembelian Barang, Pengambilan Stock, dan Jasa Pembelian */}
                                                                    {!formData.spkId ? (
                                                                        <>
                                                                            <SelectItem value="PEMBELIAN_BARANG">Pembelian Barang</SelectItem>
                                                                            {/* <SelectItem value="PENGAMBILAN_STOK">Pengambilan Stock</SelectItem> */}
                                                                            <SelectItem value="OPERATIONAL">Operational</SelectItem>
                                                                            <SelectItem value="JASA_PEMBELIAN">Jasa Pembelian</SelectItem>
                                                                        </>
                                                                    ) : (
                                                                        /* Jika spkId ada, tampilkan Pengambilan Stok, Operational, Jasa Pembelian, dan Jasa Internal */
                                                                        <>
                                                                            <SelectItem value="PENGAMBILAN_STOK">Pengambilan Stok</SelectItem>
                                                                            <SelectItem value="OPERATIONAL">Operational</SelectItem>
                                                                            <SelectItem value="JASA_PEMBELIAN">Jasa Pembelian</SelectItem>
                                                                            <SelectItem value="JASA_INTERNAL">Jasa Internal</SelectItem>
                                                                        </>
                                                                    )}
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

                                                        {/* Stock Akhir */}
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
                                                                                        {(() => {
                                                                                            const selectedProduct = products.find(p => p.id === item.productId);
                                                                                            const storageUnit = selectedProduct?.storageUnit || selectedProduct?.usageUnit || "pcs";
                                                                                            return (
                                                                                                <span className="text-xs font-normal text-muted-foreground ml-auto">
                                                                                                    ({storageUnit})
                                                                                                </span>
                                                                                            );
                                                                                        })()}
                                                                                    </CardTitle>
                                                                                </CardHeader>
                                                                                <CardContent className="p-0">
                                                                                    {item.stockBreakdown && item.stockBreakdown.length > 0 ? (
                                                                                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                                                                            {(() => {
                                                                                                const selectedProduct = products.find(p => p.id === item.productId);
                                                                                                const conversionToStorage = selectedProduct?.conversionToStorage || 1;
                                                                                                const purchaseUnit = selectedProduct?.purchaseUnit;
                                                                                                const showConversion = purchaseUnit && conversionToStorage > 1;

                                                                                                return item.stockBreakdown.map((wh, idx) => {
                                                                                                    const stockInPurchaseUnit = showConversion
                                                                                                        ? (wh.stock / conversionToStorage).toFixed(2)
                                                                                                        : null;

                                                                                                    return (
                                                                                                        <div key={idx} className="py-2 px-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                                                                                            <div className="flex items-center justify-between">
                                                                                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{wh.warehouseName}</span>
                                                                                                                <Badge variant="outline" className="text-xs font-bold font-mono h-5 bg-white dark:bg-slate-950">
                                                                                                                    {wh.stock}
                                                                                                                </Badge>
                                                                                                            </div>
                                                                                                            {showConversion && (
                                                                                                                <div className="flex items-center justify-end mt-1 gap-1">
                                                                                                                    <span className="text-[10px] text-blue-600 dark:text-blue-400">
                                                                                                                        ≈ {stockInPurchaseUnit} {purchaseUnit}
                                                                                                                    </span>
                                                                                                                </div>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    );
                                                                                                });
                                                                                            })()}
                                                                                            <div className="flex items-center justify-between py-2 px-4 bg-emerald-50/50 dark:bg-emerald-900/10 font-bold border-t">
                                                                                                <span className="text-xs text-emerald-700 dark:text-emerald-400">Total Valid</span>
                                                                                                <span className="text-xs text-emerald-700 dark:text-emerald-400">{item.availableStock}</span>
                                                                                            </div>
                                                                                            {(() => {
                                                                                                const selectedProduct = products.find(p => p.id === item.productId);
                                                                                                if (!selectedProduct) return null;

                                                                                                // Hitung konversi ke purchaseUnit jika ada
                                                                                                const conversionToStorage = selectedProduct.conversionToStorage || 1;
                                                                                                const purchaseUnit = selectedProduct.purchaseUnit;
                                                                                                const storageUnit = selectedProduct.storageUnit || selectedProduct.usageUnit;

                                                                                                if (!purchaseUnit || conversionToStorage <= 1) return null;

                                                                                                // Konversi: availableStock (storage) / conversionToStorage = purchaseUnit
                                                                                                const stockInPurchaseUnit = (item.availableStock || 0) / conversionToStorage;

                                                                                                return (
                                                                                                    <div className="flex items-center justify-between py-2 px-4 bg-blue-50/50 dark:bg-blue-900/10 font-bold border-t">
                                                                                                        <span className="text-xs text-blue-700 dark:text-blue-400">
                                                                                                            ≈ Total {purchaseUnit}
                                                                                                        </span>
                                                                                                        <Badge variant="outline" className="text-xs font-bold font-mono h-5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700">
                                                                                                            {stockInPurchaseUnit.toFixed(2)}
                                                                                                        </Badge>
                                                                                                    </div>
                                                                                                );
                                                                                            })()}
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

                                                        {/* Status/Selisih */}
                                                        <TableCell className="align-top">
                                                            {(() => {
                                                                // Hanya tampilkan status untuk PENGAMBILAN_STOK
                                                                if (item.sourceProduct !== SourceProductType.PENGAMBILAN_STOK) {
                                                                    return <div className="text-center text-gray-400">-</div>;
                                                                }

                                                                const available = item.availableStock || 0;
                                                                const qty = item.jumlah || 0;
                                                                const isDeficit = qty > available;
                                                                const deficitAmount = qty - available;

                                                                if (isDeficit) {
                                                                    return (
                                                                        <div className="flex items-center justify-center gap-1 py-2 px-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 rounded-md font-medium text-sm">
                                                                            <span className="font-bold">-{deficitAmount}</span>
                                                                            <span className="text-[12px]">(Kurang)</span>
                                                                        </div>
                                                                    );
                                                                } else {
                                                                    return (
                                                                        <div className="flex items-center justify-center py-2">
                                                                            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                                                                                <CheckCircle className="h-4 w-4" />
                                                                                <span className="text-[12px] font-medium">Cukup</span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }
                                                            })()}
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
                                                            <div className="flex flex-col gap-1">
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    value={item.estimasiHargaSatuan}
                                                                    onChange={(e) => updateItem(item.tempId, "estimasiHargaSatuan", parseFloat(e.target.value) || 0)}
                                                                    className={cn("w-28", errors[`estimatedUnitCost-${index}`] && "border-red-500")}
                                                                    disabled={item.sourceProduct === SourceProductType.PENGAMBILAN_STOK && !!formData.spkId}
                                                                />
                                                                {item.sourceProduct === SourceProductType.PENGAMBILAN_STOK && !!formData.spkId && (
                                                                    <span className="text-[10px] leading-tight text-amber-600 font-medium">
                                                                        Harga otomatis diambil dari Data stock FIFO
                                                                    </span>
                                                                )}
                                                            </div>
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
                                    Admin Input Purchase Request
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

            <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi</AlertDialogTitle>
                        <AlertDialogDescription className="flex flex-col gap-3" asChild>
                            <div>
                                <span>Anda yakin akan menyimpan data PR ini?</span>
                                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 rounded-md p-3 text-sm">
                                    <span className="font-bold">PENTING:</span> Apakah anda sudah memastikan Request PR ini adalah atas nama:
                                    <div className="font-bold text-lg mt-1 text-center uppercase tracking-wide mb-4">
                                        "{allKaryawan.find(k => k.id === formData.requestedById)?.namaLengkap || currentUser?.name || "..."}"
                                    </div>
                                    <span className="font-bold">INTEGRASI DATA:</span> Karena PR ini akan menghubungkan ke Data Accouting Staff Ledger:
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmSubmit}>
                            Ya, Simpan
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ✅ Budget Warning Dialog */}
            <AlertDialog open={isBudgetWarningOpen} onOpenChange={setIsBudgetWarningOpen}>
                <AlertDialogContent className="border-2 border-red-500">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-6 w-6" />
                            Peringatan Budget Melebihi Batas
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4" asChild>
                            <div className="space-y-4">
                                <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
                                    <p className="font-bold text-lg mb-2">Hati-hati!</p>
                                    <p className="text-sm leading-relaxed">
                                        PR SPK yang anda buat melebihi Budget yang ditentukan pada Parent PR ({selectedParentPR?.nomorPr}).
                                    </p>
                                    <div className="mt-4 grid grid-cols-2 gap-4 text-xs font-mono">
                                        <div className="flex flex-col">
                                            <span className="text-red-600 uppercase">Sisa Budget:</span>
                                            <span className="text-base font-bold">{formatCurrency(selectedParentPR?.sisaBudget || 0)}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-red-600 uppercase">Input PR ini:</span>
                                            <span className="text-base font-bold">{formatCurrency(totalBiaya)}</span>
                                        </div>
                                        <div className="col-span-2 pt-2 border-t border-red-200">
                                            <span className="text-red-600 uppercase font-black">Defisit:</span>
                                            <span className="text-lg font-black ml-2">
                                                {formatCurrency(totalBiaya - (Number(selectedParentPR?.sisaBudget || 0)))}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="mt-4 text-xs font-medium italic">
                                        Sisa budget akan menjadi minus (-) jika Anda tetap menyimpan data ini.
                                    </p>
                                </div>
                                <p className="text-sm font-semibold text-center text-muted-foreground">
                                    Apakah anda ingin Batal atau tetap Simpan?
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel className="font-bold border-2">Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                setIsBudgetWarningOpen(false);
                                setTimeout(() => setIsConfirmDialogOpen(true), 100);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold px-6"
                        >
                            Tetap Simpan
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
}