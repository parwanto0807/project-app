"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import {
    Plus,
    Trash2,
    X,
    Package,
    ShoppingCart,
    Calendar,
    FileText,
    Building,
    User,
    Truck,
    Percent,
    DollarSign,
    Receipt,
    AlertCircle,
    Save,
    Check,
    Calculator,
    ChevronsUpDown,
    Search,
    Sparkles,
    Layers,
    Tag,
    Briefcase,
    MapPin,
    FileCheck,
    ArrowLeft,
    Zap,
    TrendingUp,
    CreditCard,
    ChevronDown,
    LucideIcon,
} from "lucide-react";

import { Separator } from "@/components/ui/separator";

import { Supplier } from "@/types/supplierType";
import { Warehouse } from "@/types/whType";
import { Project } from "@/types/salesOrder";
import { Product } from "@/types/quotation";
import { SPKDataApi } from "@/types/spk";
import { DatePicker } from "../ui/date-picker";
import { createPurchaseOrder } from "@/lib/action/po/po";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

// Define form schema
const formSchema = z.object({
    supplierId: z.string().min(1, "Supplier harus dipilih"),
    warehouseId: z.string().min(1, "Gudang harus dipilih"),
    spkId: z.string().optional(),
    projectId: z.string().optional(),
    orderDate: z.date({
        required_error: "Tanggal order harus diisi",
    }),
    deliveryDate: z.date().optional(),
    paymentTerm: z.enum(["CASH", "COD", "NET_7", "NET_14", "NET_30", "DP_PERCENTAGE"], {
        required_error: "Termin pembayaran harus dipilih"
    }),
    notes: z.string().optional(),
    items: z.array(
        z.object({
            productId: z.string().min(1, "Produk harus dipilih"),
            quantity: z.number().min(1, "Jumlah minimal 1"),
            unitPrice: z.number().min(0, "Harga harus lebih dari 0"),
            discount: z.number().min(0).max(100).optional(),
            taxRate: z.number().min(0).max(100).optional(),
            notes: z.string().optional(),
        })
    ).min(1, "Minimal ada 1 item"),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateFormPOProps {
    suppliers: Supplier[];
    warehouses: Warehouse[];
    projects: Project[];
    products: Product[];
    spkList: SPKDataApi[];
    poNumber: string;
    onSuccess?: (poId: string) => void;
    onCancel?: () => void;
}

interface ProductItem {
    id: string;
    name: string;
    unit: string;
    sku: string;
    stock: number;
    productId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    taxRate?: number;
    notes?: string;
}

export default function CreateFormPO({
    suppliers,
    warehouses,
    projects,
    products,
    spkList,
    poNumber,
    onSuccess,
    onCancel
}: CreateFormPOProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedItems, setSelectedItems] = useState<ProductItem[]>([]);
    const [productSearchStates, setProductSearchStates] = useState<Record<number, { open: boolean; query: string }>>({});
    const [selectedProjectName, setSelectedProjectName] = useState<string>("");

    // Initialize form
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            supplierId: "",
            warehouseId: "",
            spkId: "",
            projectId: "",
            orderDate: new Date(),
            deliveryDate: undefined,
            paymentTerm: "NET_30",
            notes: "",
            items: [],
        },
    });

    // Calculate totals
    const calculateTotals = () => {
        const items = form.getValues().items;
        let subtotal = 0;
        let totalDiscount = 0;
        let totalTax = 0;

        items.forEach(item => {
            const itemTotal = item.quantity * item.unitPrice;
            const itemDiscount = (itemTotal * (item.discount || 0)) / 100;
            const itemAfterDiscount = itemTotal - itemDiscount;
            const itemTax = (itemAfterDiscount * (item.taxRate || 0)) / 100;

            subtotal += itemTotal;
            totalDiscount += itemDiscount;
            totalTax += itemTax;
        });

        const grandTotal = subtotal - totalDiscount + totalTax;

        return {
            subtotal,
            totalDiscount,
            totalTax,
            grandTotal,
        };
    };

    // Add new item
    const addItem = () => {
        const items = form.getValues().items;
        const newIndex = items.length;

        form.setValue("items", [
            ...items,
            {
                productId: "",
                quantity: 1,
                unitPrice: 0,
                discount: undefined,
                taxRate: undefined,
                notes: "",
            },
        ]);

        // Focus on the new item's product field and scroll into view
        setTimeout(() => {
            const newItemContainer = document.querySelectorAll('[class*="border-0 shadow-sm rounded-2xl"]')[newIndex] as HTMLElement;

            if (newItemContainer) {
                newItemContainer.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'nearest'
                });

                setTimeout(() => {
                    const productTrigger = newItemContainer.querySelector('[role="combobox"]') as HTMLButtonElement;
                    productTrigger?.focus();
                }, 100);
            }
        }, 150);
    };

    // Remove item
    const removeItem = (index: number) => {
        const items = form.getValues().items;
        const updatedItems = items.filter((_, i) => i !== index);
        form.setValue("items", updatedItems);

        const updatedSelected = [...selectedItems];
        updatedSelected.splice(index, 1);
        setSelectedItems(updatedSelected);
    };

    // Handle product selection
    const handleProductSelect = (index: number, productId: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const items = form.getValues().items;

        items[index].productId = productId;
        items[index].unitPrice = product.price || 0;
        form.setValue("items", items);

        const updatedSelected = [...selectedItems];
        updatedSelected[index] = {
            id: product.id,
            name: product.name,
            unit: product.uom || "pcs",
            sku: product.code,
            stock: 0,
            ...items[index],
        };
        setSelectedItems(updatedSelected);
    };

    // Update product search state
    const updateProductSearchState = (index: number, updates: Partial<{ open: boolean; query: string }>) => {
        setProductSearchStates(prev => ({
            ...prev,
            [index]: {
                open: updates.open ?? prev[index]?.open ?? false,
                query: updates.query ?? prev[index]?.query ?? "",
            }
        }));
    };

    // Handle form submission
    const onSubmit = async (values: FormValues) => {
        if (values.items.length === 0) {
            toast.error("Minimal tambahkan 1 item");
            return;
        }

        setIsSubmitting(true);
        try {
            const totals = calculateTotals();

            const poData = {
                ...values,
                poNumber,
                totalAmount: totals.grandTotal,
                subtotal: totals.subtotal,
                totalDiscount: totals.totalDiscount,
                totalTax: totals.totalTax,
                status: "DRAFT" as const,
            };

            const result = await createPurchaseOrder(poData);

            toast.success("Purchase Order berhasil dibuat!");

            if (onSuccess) {
                onSuccess(result.id);
            }
        } catch (error: any) {
            console.error("Error creating PO:", error);
            toast.error(error.message || "Gagal membuat Purchase Order");
        } finally {
            setIsSubmitting(false);
        }
    };

    const totals = calculateTotals();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/20 animate-in fade-in duration-700">
            {/* Premium Header */}
            <div className="relative overflow-hidden mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 opacity-5"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full -translate-y-48 translate-x-48 opacity-5"></div>

                <div className="container mx-auto py-6 px-4 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 shadow-sm transition-all duration-300"
                                    onClick={onCancel}
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full border border-blue-100/50 dark:border-blue-900/20">
                                    <FileText className="h-3.5 w-3.5" />
                                    Buat Purchase Order Baru
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                                            <ShoppingCart className="h-8 w-8 text-white" />
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-white dark:bg-gray-900 border-2 border-white dark:border-gray-800 flex items-center justify-center shadow-sm">
                                            <Badge className="h-7 w-7 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center p-0">
                                                <Plus className="h-3.5 w-3.5 text-white" />
                                            </Badge>
                                        </div>
                                    </div>

                                    <div>
                                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent dark:from-white dark:via-gray-200 dark:to-gray-100">
                                            Buat Purchase Order Baru
                                        </h1>
                                        <div className="flex items-center gap-3 mt-2">
                                            <Badge variant="outline" className="px-3 py-1.5 font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900/50">
                                                <FileText className="h-4 w-4 mr-1.5 text-amber-600 dark:text-amber-500" />
                                                PO: {poNumber}
                                            </Badge>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-blue-500" />
                                                    <span>
                                                        {new Date().toLocaleDateString('id-ID', {
                                                            weekday: 'long',
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={onCancel}
                                        disabled={isSubmitting}
                                        className="border-blue-200 hover:bg-blue-50"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting || form.watch("items").length === 0}
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25"
                                        onClick={form.handleSubmit(onSubmit)}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                                                Membuat...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="h-4 w-4 mr-2" />
                                                Buat PO
                                            </>
                                        )}
                                    </Button>
                                </div> */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Form Content */}
            <div className="container mx-auto px-4 pb-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Form */}
                    <div className="lg:col-span-2 space-y-8">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                {/* Supplier & Warehouse Card */}
                                <Card className="border-0 shadow-xl bg-gradient-to-b from-white to-blue-50/30 dark:from-gray-900 dark:to-gray-800/50 overflow-hidden">
                                    <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
                                        <CardTitle className="flex items-center gap-3 text-lg">
                                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center shadow-sm">
                                                <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <div>Informasi Supplier & Gudang</div>
                                                <p className="text-sm text-muted-foreground font-normal mt-1">
                                                    Pilih supplier dan gudang tujuan untuk PO ini
                                                </p>
                                            </div>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Supplier */}
                                            <FormField
                                                control={form.control}
                                                name="supplierId"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-sm font-medium flex items-center gap-2 mb-3">
                                                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/50 flex items-center justify-center">
                                                                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                            </div>
                                                            <span>Supplier <span className="text-red-500">*</span></span>
                                                        </FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            defaultValue={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="w-full h-11 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors bg-gradient-to-r from-blue-50/30 to-white dark:from-gray-900 dark:to-gray-800">
                                                                    <SelectValue placeholder="Pilih supplier" className="truncate" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent className="max-w-[400px] shadow-xl">
                                                                {suppliers.map((supplier) => (
                                                                    <SelectItem
                                                                        key={supplier.id}
                                                                        value={supplier.id}
                                                                        className="cursor-pointer hover:bg-blue-50 transition-colors"
                                                                        title={`${supplier.name}${supplier.code ? ` (${supplier.code})` : ''}`}
                                                                    >
                                                                        <div className="flex items-center gap-3 max-w-full">
                                                                            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center flex-shrink-0">
                                                                                <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                                                            </div>
                                                                            <div className="flex flex-col gap-0.5">
                                                                                <span className="font-medium truncate">{supplier.name}</span>
                                                                                {supplier.code && (
                                                                                    <span className="text-xs text-muted-foreground">
                                                                                        Kode: {supplier.code}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Warehouse */}
                                            <FormField
                                                control={form.control}
                                                name="warehouseId"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-sm font-medium flex items-center gap-2 mb-3">
                                                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/50 dark:to-emerald-800/50 flex items-center justify-center">
                                                                <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                            </div>
                                                            <span>Gudang Tujuan <span className="text-red-500">*</span></span>
                                                        </FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            defaultValue={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="w-full h-11 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-500 transition-colors bg-gradient-to-r from-emerald-50/30 to-white dark:from-gray-900 dark:to-gray-800">
                                                                    <SelectValue placeholder="Pilih gudang" className="truncate" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent className="max-w-[400px] shadow-xl">
                                                                {warehouses.map((warehouse) => (
                                                                    <SelectItem
                                                                        key={warehouse.id}
                                                                        value={warehouse.id}
                                                                        className="cursor-pointer hover:bg-emerald-50 transition-colors"
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800 flex items-center justify-center flex-shrink-0">
                                                                                <Building className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                                                            </div>
                                                                            <div className="flex flex-col gap-0.5">
                                                                                <span className="font-medium truncate">{warehouse.name}</span>
                                                                                <span className="text-xs text-muted-foreground truncate">
                                                                                    {warehouse.code} • {warehouse.address || 'No address'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Additional Information Card */}
                                <Card className="border-0 shadow-xl bg-gradient-to-b from-white to-purple-50/30 dark:from-gray-900 dark:to-gray-800/50 overflow-hidden">
                                    <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
                                        <CardTitle className="flex items-center gap-3 text-lg">
                                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 flex items-center justify-center shadow-sm">
                                                <Tag className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <div>
                                                <div>Informasi Tambahan</div>
                                                <p className="text-sm text-muted-foreground font-normal mt-1">
                                                    Tanggal, proyek, dan termin pembayaran
                                                </p>
                                            </div>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* SPK */}
                                            <div>
                                                <FormField
                                                    control={form.control}
                                                    name="spkId"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-sm font-medium flex items-center gap-2 mb-3">
                                                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900 dark:to-cyan-800 flex items-center justify-center">
                                                                    <FileCheck className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                                                                </div>
                                                                <span>SPK (Opsional)</span>
                                                            </FormLabel>
                                                            <Select
                                                                onValueChange={(value) => {
                                                                    field.onChange(value);
                                                                    // Auto-populate projectId from selected SPK
                                                                    const selectedSpk = spkList.find(spk => spk.id === value);
                                                                    // Try different paths for projectId
                                                                    const projectId = selectedSpk?.salesOrder?.project?.id ||
                                                                        (selectedSpk?.salesOrder as { projectId?: string })?.projectId
                                                                    if (projectId) {
                                                                        form.setValue("projectId", projectId, { shouldValidate: true, shouldDirty: true });
                                                                        setSelectedProjectName(selectedSpk?.salesOrder?.project?.name || selectedSpk?.salesOrder?.projectName || "");
                                                                        toast.success(`Project otomatis dipilih: ${selectedSpk?.salesOrder?.project?.name}`);
                                                                    } else {
                                                                        console.log("No projectId found in SPK");
                                                                        setSelectedProjectName("");
                                                                        toast.info("SPK ini tidak memiliki project terkait");
                                                                    }
                                                                }}
                                                                value={field.value}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger className="w-full h-11 border-gray-200 dark:border-gray-700 hover:border-cyan-300 dark:hover:border-cyan-500 bg-gradient-to-r from-cyan-50/30 to-white dark:from-gray-900 dark:to-gray-800">
                                                                        <SelectValue placeholder="Pilih SPK" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {spkList.map((spk) => (
                                                                        <SelectItem
                                                                            key={spk.id}
                                                                            value={spk.id}
                                                                        >
                                                                            <div className="flex flex-col">
                                                                                <span className="font-medium dark:text-gray-100">{spk.spkNumber}</span>
                                                                                <span className="text-xs text-muted-foreground">
                                                                                    {spk.salesOrder?.project?.name || spk.salesOrder?.projectName || spk.salesOrder?.soNumber}
                                                                                </span>
                                                                            </div>
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <FormField
                                                    control={form.control}
                                                    name="projectId"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-sm font-medium flex items-center gap-2 mb-3">
                                                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900 dark:to-amber-800 flex items-center justify-center">
                                                                    <Briefcase className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                                                </div>
                                                                <span>Proyek</span>
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    value={selectedProjectName}
                                                                    disabled
                                                                    placeholder="Pilih SPK untuk mengisi proyek"
                                                                    className="w-full h-11 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            {/* Payment Term - Row 1 with Project */}
                                            <div>
                                                <FormField
                                                    control={form.control}
                                                    name="paymentTerm"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-sm font-medium flex items-center gap-2 mb-3">
                                                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900 dark:to-indigo-800 flex items-center justify-center">
                                                                    <CreditCard className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                                                </div>
                                                                <span>Termin Pembayaran <span className="text-red-500">*</span></span>
                                                            </FormLabel>
                                                            <Select
                                                                onValueChange={field.onChange}
                                                                defaultValue={field.value}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger className="w-full h-11 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 bg-gradient-to-r from-indigo-50/30 to-white dark:from-gray-900 dark:to-gray-800">
                                                                        <SelectValue placeholder="Pilih termin pembayaran" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="CASH">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="h-5 w-5 rounded-md bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800 flex items-center justify-center">
                                                                                <DollarSign className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                                                            </div>
                                                                            <span>Tunai</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem value="COD">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="h-5 w-5 rounded-md bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center">
                                                                                <Truck className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                                                            </div>
                                                                            <span>Cash on Delivery</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem value="NET_7">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="h-5 w-5 rounded-md bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 flex items-center justify-center">
                                                                                <Calendar className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                                                                            </div>
                                                                            <span>Net 7 Hari</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem value="NET_14">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="h-5 w-5 rounded-md bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 flex items-center justify-center">
                                                                                <Calendar className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                                                                            </div>
                                                                            <span>Net 14 Hari</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem value="NET_30">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="h-5 w-5 rounded-md bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900 dark:to-indigo-800 flex items-center justify-center">
                                                                                <Calendar className="h-3 w-3 text-indigo-600" />
                                                                            </div>
                                                                            <span>Net 30 Hari</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem value="DP_PERCENTAGE">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="h-5 w-5 rounded-md bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900 dark:to-pink-800 flex items-center justify-center">
                                                                                <Percent className="h-3 w-3 text-pink-600 dark:text-pink-400" />
                                                                            </div>
                                                                            <span>Down Payment (%)</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormDescription className="text-xs text-muted-foreground mt-2">
                                                                Ketentuan pembayaran dengan supplier
                                                            </FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            {/* Order Date */}
                                            <div>
                                                <FormField
                                                    control={form.control}
                                                    name="orderDate"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-col">
                                                            <FormLabel className="text-sm font-medium flex items-center gap-2 mb-3">
                                                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center">
                                                                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                                </div>
                                                                <span>Tanggal Order <span className="text-red-500">*</span></span>
                                                            </FormLabel>
                                                            <DatePicker
                                                                date={field.value}
                                                                onSelect={field.onChange}
                                                                className="border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 bg-gradient-to-r from-blue-50/30 to-white dark:from-gray-900 dark:to-gray-800"
                                                            />
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            {/* Delivery Date */}
                                            <div>
                                                <FormField
                                                    control={form.control}
                                                    name="deliveryDate"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-col">
                                                            <FormLabel className="text-sm font-medium flex items-center gap-2 mb-3">
                                                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 flex items-center justify-center">
                                                                    <Truck className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                                </div>
                                                                <span>Tanggal Kirim</span>
                                                            </FormLabel>
                                                            <DatePicker
                                                                date={field.value}
                                                                onSelect={field.onChange}
                                                                className="border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-500 bg-gradient-to-r from-green-50/30 to-white dark:from-gray-900 dark:to-gray-800"
                                                            />
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Items Section */}
                                <Card className="border-0 shadow-xl bg-gradient-to-b from-white to-indigo-50/30 dark:from-gray-900 dark:to-gray-800/50 overflow-hidden">
                                    <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900 dark:to-indigo-800 flex items-center justify-center">
                                                    <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg dark:text-gray-100">Item Barang</CardTitle>
                                                    <p className="text-sm text-muted-foreground font-normal mt-1">
                                                        Tambahkan produk yang ingin dipesan
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={addItem}
                                                className="border-indigo-200 dark:border-indigo-900/50 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Tambah Item
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        {form.watch("items").length === 0 ? (
                                            <div className="text-center py-12 border-2 border-dashed border-indigo-100 dark:border-indigo-900/50 rounded-2xl bg-gradient-to-b from-indigo-50/30 to-white dark:from-indigo-950/20 dark:to-gray-950">
                                                <div className="h-20 w-20 mx-auto bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900 dark:to-indigo-800 rounded-full flex items-center justify-center mb-4">
                                                    <Package className="h-10 w-10 text-indigo-400 dark:text-indigo-500" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Belum Ada Item</h3>
                                                <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                                                    Tambahkan item pertama untuk melanjutkan pembuatan PO
                                                </p>
                                                <Button
                                                    type="button"
                                                    onClick={addItem}
                                                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 dark:text-black"
                                                >
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Tambah Item Pertama
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                {form.watch("items").map((item, index) => {
                                                    const searchState = productSearchStates[index] || { open: false, query: "" };
                                                    const availableProducts = products.filter(product => {
                                                        const selectedProductIds = form.getValues().items
                                                            .map((item, i) => i !== index ? item.productId : null)
                                                            .filter(Boolean);
                                                        return !selectedProductIds.includes(product.id);
                                                    });
                                                    const filteredProducts = availableProducts.filter(product =>
                                                        product.name.toLowerCase().includes(searchState.query.toLowerCase()) ||
                                                        product.code.toLowerCase().includes(searchState.query.toLowerCase())
                                                    );
                                                    const selectedProduct = products.find(p => p.id === item.productId);

                                                    return (
                                                        <div
                                                            key={index}
                                                            className="border-0 shadow-sm rounded-2xl overflow-hidden bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900 dark:to-gray-800/50 border dark:border-gray-800"
                                                        >
                                                            <div className="p-6 space-y-6">
                                                                {/* Item Header */}
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                                                            <span className="text-white font-bold">{index + 1}</span>
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">Item {index + 1}</h4>
                                                                            <p className="text-xs text-muted-foreground">Produk dan kuantitas</p>
                                                                        </div>
                                                                    </div>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => removeItem(index)}
                                                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>

                                                                {/* Product Selection */}
                                                                <FormField
                                                                    control={form.control}
                                                                    name={`items.${index}.productId`}
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormLabel className="text-sm font-medium flex items-center gap-2 mb-3">
                                                                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/50 dark:to-purple-800/50 flex items-center justify-center">
                                                                                    <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                                                                </div>
                                                                                <span>Produk <span className="text-red-500">*</span></span>
                                                                            </FormLabel>
                                                                            <Popover
                                                                                open={searchState.open}
                                                                                onOpenChange={(open) => {
                                                                                    updateProductSearchState(index, {
                                                                                        open,
                                                                                        query: open ? searchState.query : ""
                                                                                    });
                                                                                }}
                                                                            >
                                                                                <PopoverTrigger asChild>
                                                                                    <FormControl>
                                                                                        <Button
                                                                                            variant="outline"
                                                                                            role="combobox"
                                                                                            className={cn(
                                                                                                "w-full h-11 justify-between text-left font-normal",
                                                                                                "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500",
                                                                                                "bg-gradient-to-r from-purple-50/30 to-white dark:from-gray-900 dark:to-gray-800"
                                                                                            )}
                                                                                        >
                                                                                            {selectedProduct ? (
                                                                                                <div className="flex items-center gap-3">
                                                                                                    <div className="h-8 w-8 rounded-md bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 flex items-center justify-center">
                                                                                                        <Package className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                                                                                    </div>
                                                                                                    <div className="text-left">
                                                                                                        <div className="font-medium">{selectedProduct.name}</div>
                                                                                                        <div className="text-xs text-muted-foreground">
                                                                                                            {selectedProduct.code} • {selectedProduct.uom || 'pcs'}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            ) : (
                                                                                                <span className="text-muted-foreground">Pilih produk...</span>
                                                                                            )}
                                                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                                        </Button>
                                                                                    </FormControl>
                                                                                </PopoverTrigger>
                                                                                <PopoverContent className="w-[500px] p-0 shadow-2xl border-gray-200 dark:border-gray-800 dark:bg-gray-900" align="start">
                                                                                    <Command>
                                                                                        <div className="flex items-center border-b border-gray-100 dark:border-gray-800 px-3 py-2">
                                                                                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-purple-500 dark:text-purple-400" />
                                                                                            <CommandInput
                                                                                                placeholder="Cari produk..."
                                                                                                value={searchState.query}
                                                                                                onValueChange={(value) =>
                                                                                                    updateProductSearchState(index, { query: value })
                                                                                                }
                                                                                            />
                                                                                        </div>
                                                                                        <CommandList className="max-h-[300px]">
                                                                                            <CommandEmpty className="py-6 text-center text-muted-foreground">
                                                                                                {searchState.query ? "Produk tidak ditemukan" : "Tidak ada produk tersedia"}
                                                                                            </CommandEmpty>
                                                                                            <CommandGroup>
                                                                                                {filteredProducts.map((product) => (
                                                                                                    <CommandItem
                                                                                                        key={product.id}
                                                                                                        value={product.name}
                                                                                                        onSelect={() => {
                                                                                                            field.onChange(product.id);
                                                                                                            handleProductSelect(index, product.id);
                                                                                                            updateProductSearchState(index, {
                                                                                                                open: false,
                                                                                                                query: ""
                                                                                                            });
                                                                                                        }}
                                                                                                        className="py-3 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                                                                                                    >
                                                                                                        <Check
                                                                                                            className={cn(
                                                                                                                "mr-3 h-4 w-4",
                                                                                                                field.value === product.id ? "opacity-100 text-purple-600" : "opacity-0"
                                                                                                            )}
                                                                                                        />
                                                                                                        <div className="flex items-center gap-3">
                                                                                                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 flex items-center justify-center flex-shrink-0">
                                                                                                                <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                                                                                            </div>
                                                                                                            <div className="flex flex-col">
                                                                                                                <span className="font-medium dark:text-gray-100">{product.name}</span>
                                                                                                                <span className="text-xs text-muted-foreground">
                                                                                                                    {product.code} • {product.uom || 'pcs'} • {new Intl.NumberFormat("id-ID", {
                                                                                                                        style: "currency",
                                                                                                                        currency: "IDR",
                                                                                                                    }).format(product.price || 0)}
                                                                                                                </span>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </CommandItem>
                                                                                                ))}
                                                                                            </CommandGroup>
                                                                                        </CommandList>
                                                                                    </Command>
                                                                                </PopoverContent>
                                                                            </Popover>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />

                                                                {/* Item Details Grid */}
                                                                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                                                    {/* Quantity */}
                                                                    <FormField
                                                                        control={form.control}
                                                                        name={`items.${index}.quantity`}
                                                                        render={({ field }) => (
                                                                            <FormItem>
                                                                                <FormLabel className="text-xs font-medium flex items-center gap-2 mb-2">
                                                                                    <div className="h-6 w-6 rounded-md bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/50 flex items-center justify-center">
                                                                                        <TrendingUp className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                                                                    </div>
                                                                                    <span>Qty <span className="text-red-500">*</span></span>

                                                                                    {selectedItems[index] && (
                                                                                        <FormDescription className="text-xs mt-1 uppercase">
                                                                                            {selectedItems[index]?.unit}
                                                                                        </FormDescription>
                                                                                    )}
                                                                                </FormLabel>
                                                                                <FormControl>
                                                                                    <Input
                                                                                        type="number"
                                                                                        min="1"
                                                                                        className="h-10 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 bg-gradient-to-r from-blue-50/30 to-white dark:from-gray-900 dark:to-gray-800"
                                                                                        {...field}
                                                                                        onChange={(e) =>
                                                                                            field.onChange(parseInt(e.target.value) || 1)
                                                                                        }
                                                                                    />
                                                                                </FormControl>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        )}
                                                                    />

                                                                    {/* Unit Price */}
                                                                    <FormField
                                                                        control={form.control}
                                                                        name={`items.${index}.unitPrice`}
                                                                        render={({ field }) => (
                                                                            <FormItem>
                                                                                <FormLabel className="text-xs font-medium flex items-center gap-2 mb-2">
                                                                                    <div className="h-6 w-6 rounded-md bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/50 dark:to-emerald-800/50 flex items-center justify-center">
                                                                                        <DollarSign className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                                                                    </div>
                                                                                    <span>Harga <span className="text-red-500">*</span></span>
                                                                                </FormLabel>
                                                                                <FormControl>
                                                                                    <Input
                                                                                        type="number"
                                                                                        min="0"
                                                                                        step="0.01"
                                                                                        className="h-10 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-500 bg-gradient-to-r from-emerald-50/30 to-white dark:from-gray-900 dark:to-gray-800"
                                                                                        {...field}
                                                                                        onChange={(e) =>
                                                                                            field.onChange(parseFloat(e.target.value) || 0)
                                                                                        }
                                                                                    />
                                                                                </FormControl>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        )}
                                                                    />

                                                                    {/* Discount */}
                                                                    <FormField
                                                                        control={form.control}
                                                                        name={`items.${index}.discount`}
                                                                        render={({ field }) => (
                                                                            <FormItem>
                                                                                <FormLabel className="text-xs font-medium flex items-center gap-2 mb-2">
                                                                                    <div className="h-6 w-6 rounded-md bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900 dark:to-amber-800 flex items-center justify-center">
                                                                                        <Percent className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                                                                    </div>
                                                                                    <span>Diskon (%)</span>
                                                                                </FormLabel>
                                                                                <FormControl>
                                                                                    <Input
                                                                                        type="number"
                                                                                        min="0"
                                                                                        max="100"
                                                                                        className="h-10 border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-500 bg-gradient-to-r from-amber-50/30 to-white dark:from-gray-900 dark:to-gray-800"
                                                                                        placeholder="0"
                                                                                        {...field}
                                                                                        value={field.value || ''}
                                                                                        onChange={(e) =>
                                                                                            field.onChange(parseFloat(e.target.value) || undefined)
                                                                                        }
                                                                                    />
                                                                                </FormControl>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        )}
                                                                    />

                                                                    {/* Tax */}
                                                                    <FormField
                                                                        control={form.control}
                                                                        name={`items.${index}.taxRate`}
                                                                        render={({ field }) => (
                                                                            <FormItem>
                                                                                <FormLabel className="text-xs font-medium flex items-center gap-2 mb-2">
                                                                                    <div className="h-6 w-6 rounded-md bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/50 dark:to-red-800/50 flex items-center justify-center">
                                                                                        <Receipt className="h-3 w-3 text-red-600 dark:text-red-400" />
                                                                                    </div>
                                                                                    <span>Pajak (%)</span>
                                                                                </FormLabel>
                                                                                <FormControl>
                                                                                    <Input
                                                                                        type="number"
                                                                                        min="0"
                                                                                        max="100"
                                                                                        className="h-10 border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-500 bg-gradient-to-r from-red-50/30 to-white dark:from-gray-900 dark:to-gray-800"
                                                                                        placeholder="0"
                                                                                        {...field}
                                                                                        value={field.value || ''}
                                                                                        onChange={(e) =>
                                                                                            field.onChange(parseFloat(e.target.value) || undefined)
                                                                                        }
                                                                                    />
                                                                                </FormControl>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        )}
                                                                    />

                                                                    {/* Calculated Total */}
                                                                    <div className="md:col-span-2">
                                                                        <FormLabel className="text-xs font-medium flex items-center gap-2 mb-4">
                                                                            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/50 dark:to-purple-800/50 flex items-center justify-center">
                                                                                <Calculator className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                                                                            </div>
                                                                            <span>Total Harga</span>
                                                                        </FormLabel>
                                                                        <div className="h-10 px-3 py-2 bg-gradient-to-r from-purple-50/50 to-white dark:from-purple-950 dark:to-gray-900 border border-purple-100 dark:border-purple-900/50 rounded-lg flex items-center justify-end">
                                                                            <div className="text-right">
                                                                                <div className="font-bold text-purple-700 dark:text-purple-400 text-sm">
                                                                                    {new Intl.NumberFormat("id-ID", {
                                                                                        style: "currency",
                                                                                        currency: "IDR",
                                                                                        minimumFractionDigits: 0,
                                                                                    }).format(
                                                                                        (item.quantity * item.unitPrice) *
                                                                                        (1 - (item.discount || 0) / 100) *
                                                                                        (1 + (item.taxRate || 0) / 100)
                                                                                    )}
                                                                                </div>
                                                                                <div className="text-xs text-muted-foreground mt-1">
                                                                                    {item.quantity} × {item.unitPrice.toLocaleString("id-ID")}
                                                                                    {(item.discount ?? 0) > 0 && ` - ${item.discount}%`}
                                                                                    {(item.taxRate ?? 0) > 0 && ` + ${item.taxRate}%`}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Item Notes */}
                                                                <FormField
                                                                    control={form.control}
                                                                    name={`items.${index}.notes`}
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormLabel className="text-xs font-medium flex items-center gap-2 mb-2">
                                                                                <div className="h-6 w-6 rounded-md bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                                                                                    <FileText className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                                                                                </div>
                                                                                <span>Catatan Item (Opsional)</span>
                                                                            </FormLabel>
                                                                            <FormControl>
                                                                                <Textarea
                                                                                    placeholder="Catatan untuk item ini..."
                                                                                    className="resize-none text-sm h-16 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-gradient-to-r from-gray-50/30 to-white dark:from-gray-900 dark:to-gray-800"
                                                                                    {...field}
                                                                                />
                                                                            </FormControl>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {/* Add More Items Button */}
                                                <div className="pt-4 border-t border-gray-100">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={addItem}
                                                        className="w-full h-11 border-indigo-200 dark:border-indigo-900/50 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400"
                                                    >
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        Tambah Item Lainnya
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Notes Section */}
                                <Card className="border-0 shadow-xl bg-gradient-to-b from-white to-gray-50/30 dark:from-gray-900 dark:to-gray-800/50 overflow-hidden">
                                    <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
                                        <CardTitle className="flex items-center gap-3 text-lg">
                                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                                                <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                            </div>
                                            <div>
                                                <div>Catatan Tambahan</div>
                                                <p className="text-sm text-muted-foreground font-normal mt-1">
                                                    Instruksi khusus atau informasi tambahan (Opsional)
                                                </p>
                                            </div>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <FormField
                                            control={form.control}
                                            name="notes"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Tambahkan catatan atau instruksi khusus untuk PO ini..."
                                                            className="resize-none min-h-[120px] border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-gradient-to-r from-gray-50/30 to-white dark:from-gray-900 dark:to-gray-800"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription className="text-sm text-muted-foreground mt-2">
                                                        Catatan akan muncul pada dokumen Purchase Order
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>

                                {/* Form Actions */}
                                <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-800">
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="h-5 w-5 text-amber-500" />
                                        <div className="text-sm text-gray-600">
                                            Status PO akan menjadi{" "}
                                            <Badge variant="outline" className="mx-1 bg-amber-50 text-amber-700 border-amber-200">
                                                DRAFT
                                            </Badge>
                                            setelah dibuat
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={onCancel}
                                            disabled={isSubmitting}
                                            className="border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300"
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Batal
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting || form.watch("items").length === 0}
                                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25 dark:text-black"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                                                    Membuat...
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="h-4 w-4 mr-2" />
                                                    Buat Purchase Order
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </Form>
                    </div>

                    {/* Right Column - Summary */}
                    <div className="space-y-6">
                        {/* Financial Summary Card */}
                        <Card className="border-0 shadow-xl bg-gradient-to-b from-white to-white/95 dark:from-gray-900 dark:to-gray-800/95 sticky top-6">
                            <CardHeader className="pb-3 border-b border-emerald-100/50 dark:border-emerald-900/20">
                                <CardTitle className="flex items-center gap-3 text-lg">
                                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800 flex items-center justify-center">
                                        <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <div>Ringkasan Keuangan</div>
                                        <p className="text-sm text-muted-foreground font-normal mt-1">
                                            Total pembayaran dan detail
                                        </p>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 bg-white/90 dark:bg-gray-900/90">
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between py-3 border-b border-emerald-100 dark:border-emerald-900/30">
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-md bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center">
                                                    <Layers className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Subtotal:</span>
                                            </div>
                                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                {new Intl.NumberFormat("id-ID", {
                                                    style: "currency",
                                                    currency: "IDR",
                                                    minimumFractionDigits: 0,
                                                }).format(totals.subtotal)}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between py-3 border-b border-emerald-100 dark:border-emerald-900/30">
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-md bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900 dark:to-amber-800 flex items-center justify-center">
                                                    <Percent className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                                </div>
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Total Diskon:</span>
                                            </div>
                                            <span className="font-semibold text-red-600 dark:text-red-400">
                                                -{new Intl.NumberFormat("id-ID", {
                                                    style: "currency",
                                                    currency: "IDR",
                                                    minimumFractionDigits: 0,
                                                }).format(totals.totalDiscount)}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between py-3 border-b border-emerald-100 dark:border-emerald-900/30">
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-md bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/50 dark:to-red-800/50 flex items-center justify-center">
                                                    <Receipt className="h-3 w-3 text-red-600 dark:text-red-400" />
                                                </div>
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Total Pajak:</span>
                                            </div>
                                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                                                +{new Intl.NumberFormat("id-ID", {
                                                    style: "currency",
                                                    currency: "IDR",
                                                    minimumFractionDigits: 0,
                                                }).format(totals.totalTax)}
                                            </span>
                                        </div>
                                    </div>

                                    <Separator className="my-2" />

                                    <div className="pt-2">
                                        <div className="flex items-center justify-between text-xl font-bold">
                                            <span className="bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent">
                                                Total Pembayaran:
                                            </span>
                                            <span className="text-2xl bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent">
                                                {new Intl.NumberFormat("id-ID", {
                                                    style: "currency",
                                                    currency: "IDR",
                                                    minimumFractionDigits: 0,
                                                }).format(totals.grandTotal)}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-2 text-right">
                                            Termasuk semua biaya
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Stats Card */}
                        <Card className="border-0 shadow-xl bg-gradient-to-b from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-800/50">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-3 text-lg">
                                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center">
                                        <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <div>Statistik</div>
                                        <p className="text-sm text-muted-foreground font-normal mt-1">
                                            Ringkasan item dan nilai
                                        </p>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 text-center border border-blue-100 dark:border-blue-900/50">
                                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                                            {form.watch("items").length}
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total Item</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 text-center border border-purple-100 dark:border-purple-900/50">
                                        <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                                            {form.watch("items").reduce((acc, item) => acc + item.quantity, 0)}
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Jumlah Unit</div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-between">
                                        <span>Rata-rata harga:</span>
                                        <span className="font-medium dark:text-gray-100">
                                            {form.watch("items").length > 0
                                                ? new Intl.NumberFormat("id-ID", {
                                                    style: "currency",
                                                    currency: "IDR",
                                                    minimumFractionDigits: 0,
                                                }).format(
                                                    form.watch("items").reduce((acc, item) => acc + item.unitPrice, 0) /
                                                    form.watch("items").length
                                                )
                                                : "Rp 0"
                                            }
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Information Card */}
                        <Card className="border-0 shadow-xl bg-gradient-to-b from-white to-amber-50/30 dark:from-gray-900 dark:to-gray-800/50">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-3 text-lg">
                                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800 flex items-center justify-center shadow-sm">
                                        <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div>
                                        <div className="dark:text-gray-100">Tips Cepat</div>
                                        <p className="text-sm text-muted-foreground font-normal mt-1">
                                            Panduan pembuatan PO
                                        </p>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                                    <li className="flex items-start gap-2">
                                        <div className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center flex-shrink-0">
                                            <Check className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <span>Pastikan supplier dan gudang sudah dipilih</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <div className="h-5 w-5 rounded-full bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 flex items-center justify-center flex-shrink-0">
                                            <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                                        </div>
                                        <span>Periksa kembali harga dan diskon untuk setiap item</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <div className="h-5 w-5 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 flex items-center justify-center flex-shrink-0">
                                            <Check className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <span>Status PO akan menjadi DRAFT dan dapat diedit nanti</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}