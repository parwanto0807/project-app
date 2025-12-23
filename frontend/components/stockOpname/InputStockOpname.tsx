"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    CalendarIcon,
    Package,
    User as UserIcon,
    Warehouse as WarehouseIcon,
    Plus,
    Trash2,
    Info,
    Save,
    ClipboardCheck,
    History,
    Search,
    Check,
    ChevronsUpDown,
    AlertCircle,
    DollarSign,
    TrendingUp,
    TrendingDown,
    PackagePlus,
    Lightbulb
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { api } from "@/lib/http";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
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
import { ProductCreateDialog } from "../sales/salesOrder/productDialog";

import { createStockOpnameSchema, CreateStockOpnameInput } from "@/schemas/stockOpname/soSchema";
import { OpnameType } from "@/types/soType";
import { Warehouse } from "@/types/whType";

export interface Product {
    id: string;
    code: string;
    name: string;
    satuan?: string;
    storageUnit?: string;
    stokSistem?: number;
    hargaSatuan?: number;
}

export interface User {
    id: string;
    name: string;
    userId?: string;
    role?: string;
    email?: string;
    namaLengkap?: string;
    username?: string;
    // Add other fields as necessary based on fetchAllKaryawan response
}

interface StockOpnameFormProps {
    initialType?: OpnameType;
    products: Product[];
    warehouses: Warehouse[];
    users: User[];
    currentUserId?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
    onTypeChange?: (type: OpnameType) => void;
    submitAction?: (data: any) => Promise<any>;
    defaultValues?: Partial<CreateStockOpnameInput>;
}

export default function StockOpnameForm({
    initialType = OpnameType.PERIODIC,
    products = [],
    warehouses = [],
    users = [],
    currentUserId,
    onSuccess,
    onCancel,
    onTypeChange,
    submitAction,
    defaultValues
}: StockOpnameFormProps) {
    const form = useForm<CreateStockOpnameInput>({
        resolver: zodResolver(createStockOpnameSchema),
        defaultValues: defaultValues || {
            tanggalOpname: format(new Date(), "yyyy-MM-dd"),
            type: initialType,
            warehouseId: "",
            keterangan: "",
            items: [{ productId: "", stokFisik: 0, hargaSatuan: 0, stokSistem: 0, catatanItem: "" }],
        },
    });

    const user = users.find(u => u.userId === currentUserId || u.id === currentUserId);

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    const [productSearchQueries, setProductSearchQueries] = useState<string[]>(
        Array(fields.length).fill("")
    );
    const [productSearchOpen, setProductSearchOpen] = useState<boolean[]>(
        Array(fields.length).fill(false)
    );
    const [activeInputIndex, setActiveInputIndex] = useState<{ row: number; field: string } | null>(null);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Removed totalValue state to fix synchronization issue

    // Removed hargaSatuanManual, using form state instead
    const [localProducts, setLocalProducts] = useState<Product[]>(products);
    const inputRefs = useRef<(HTMLInputElement | HTMLButtonElement | null)[][]>([]);

    // Sync local products with prop
    useEffect(() => {
        setLocalProducts(products);
    }, [products]);

    // Calculate total value directly from current form values to ensure instant updates
    const currentItems = form.watch("items");
    const totalValue = currentItems.reduce((acc, item, index) => {
        const product = localProducts.find(p => p.id === item.productId);
        const stokFisik = item.stokFisik || 0;
        const hargaSatuan = item.hargaSatuan || 0;
        return acc + (stokFisik * hargaSatuan);
    }, 0);

    // Initialize states when fields change
    useEffect(() => {
        inputRefs.current = fields.map(() => [null, null, null, null, null, null]);
    }, [fields.length]);

    // Sync form type with initialType prop
    useEffect(() => {
        form.setValue("type", initialType);
    }, [initialType, form]);

    const updateProductSearchQuery = (index: number, value: string) => {
        const newQueries = [...productSearchQueries];
        newQueries[index] = value;
        setProductSearchQueries(newQueries);
    };

    const updateProductSearchOpen = (index: number, value: boolean) => {
        if (value) {
            const warehouseId = form.getValues("warehouseId");
            if (!warehouseId) {
                toast.error("Mohon pilih Gudang Lokasi terlebih dahulu sebelum memilih produk.", {
                    description: "Produk hanya dapat dipilih setelah gudang ditentukan."
                });
                return;
            }
        }

        const newOpenStates = [...productSearchOpen];
        newOpenStates[index] = value;
        setProductSearchOpen(newOpenStates);
        if (value) {
            setActiveInputIndex({ row: index, field: 'productSearch' });
        }
    };

    const handleProductSelect = async (index: number, productId: string) => {
        const selectedProduct = localProducts.find(p => p.id === productId);
        if (selectedProduct) {
            // Optimistic update first with local data (if any)
            form.setValue(`items.${index}.hargaSatuan`, selectedProduct.hargaSatuan || 0);

            // Fetch latest stock balance from backend
            const warehouseId = form.getValues("warehouseId");
            if (warehouseId) {
                try {
                    const response = await api.get('/api/inventory/latest-stock', {
                        params: { productId, warehouseId }
                    });

                    if (response.data.success) {
                        const latestStock = response.data.data;
                        form.setValue(`items.${index}.stokSistem`, latestStock);
                        // Default stok fisik to system stock
                        form.setValue(`items.${index}.stokFisik`, latestStock);
                    }
                } catch (error) {
                    console.error("Failed to fetch latest stock:", error);
                    toast.error("Gagal mengambil stok sistem terbaru");

                    // Fallback to local product data
                    form.setValue(`items.${index}.stokSistem`, selectedProduct.stokSistem || 0);
                    form.setValue(`items.${index}.stokFisik`, selectedProduct.stokSistem || 0);
                }
            } else {
                // Fallback if no warehouse selected (should be prevented by earlier checks but safe to have)
                form.setValue(`items.${index}.stokSistem`, selectedProduct.stokSistem || 0);
                form.setValue(`items.${index}.stokFisik`, selectedProduct.stokSistem || 0);
            }

            // Focus on stok fisik input after product selection
            setTimeout(() => {
                inputRefs.current[index]?.[1]?.focus?.();
            }, 10);
        }
    };

    const getProductInfo = (productId: string, index?: number) => {
        const product = localProducts.find(p => p.id === productId);
        // We might want to read from form state if index is provided, but for display purposes here product info is safer?
        // Actually, for price we should read from form if available.
        // But getProductInfo is mainly used for static product data.
        // Let's rely on form.watch in the render for dynamic values.
        return {
            name: product ? `${product.code} - ${product.name}` : "",
            satuan: product?.satuan || product?.storageUnit || "",
            stokSistem: product?.stokSistem || 0,
            hargaSatuan: product?.hargaSatuan || 0 // Base price
        };
    };

    const getSelisihInfo = (index: number) => {
        const productId = form.watch(`items.${index}.productId`);
        const stokFisik = form.watch(`items.${index}.stokFisik`) || 0;
        const stokSistem = form.watch(`items.${index}.stokSistem`) || 0;

        const selisih = stokFisik - stokSistem;
        const selisihPersen = stokSistem > 0 ? ((selisih / stokSistem) * 100) : 0;

        return {
            selisih,
            selisihPersen,
            isPositive: selisih > 0,
            isNegative: selisih < 0,
            isZero: selisih === 0
        };
    };

    // Handle keyboard navigation
    const handleKeyDown = (event: React.KeyboardEvent, index: number, fieldName: string) => {
        const fieldIndex = ['product', 'stokFisik', 'hargaSatuan', 'catatanItem', 'delete'].indexOf(fieldName);

        switch (event.key) {
            case 'Tab':
                event.preventDefault();
                if (event.shiftKey) {
                    // Shift+Tab - move to previous field
                    if (fieldIndex > 0) {
                        inputRefs.current[index]?.[fieldIndex - 1]?.focus?.();
                    } else if (index > 0) {
                        // Move to last field of previous row
                        inputRefs.current[index - 1]?.[3]?.focus?.();
                    }
                } else {
                    // Tab - move to next field
                    if (fieldIndex < 3) {
                        inputRefs.current[index]?.[fieldIndex + 1]?.focus?.();
                    } else if (index < fields.length - 1) {
                        // Move to first field of next row
                        inputRefs.current[index + 1]?.[0]?.focus?.();
                    } else {
                        // Last field, focus on add button
                        const addButton = document.getElementById('add-item-button');
                        addButton?.focus();
                    }
                }
                break;

            case 'Enter':
                if (fieldName === 'product') {
                    updateProductSearchOpen(index, true);
                } else if (fieldName === 'stokFisik' || fieldName === 'hargaSatuan' || fieldName === 'catatanItem') {
                    event.preventDefault();
                    if (fieldIndex < 3) {
                        inputRefs.current[index]?.[fieldIndex + 1]?.focus?.();
                    } else if (index < fields.length - 1) {
                        // Move to next row
                        inputRefs.current[index + 1]?.[0]?.focus?.();
                    } else {
                        // Last row, focus on add button
                        const addButton = document.getElementById('add-item-button');
                        addButton?.focus();
                    }
                }
                break;

            case 'ArrowDown':
                event.preventDefault();
                if (index < fields.length - 1) {
                    inputRefs.current[index + 1]?.[fieldIndex]?.focus?.();
                } else {
                    // Move to add button
                    const addButton = document.getElementById('add-item-button');
                    addButton?.focus();
                }
                break;

            case 'ArrowUp':
                event.preventDefault();
                if (index > 0) {
                    inputRefs.current[index - 1]?.[fieldIndex]?.focus?.();
                }
                break;

            case 'Delete':
                if (event.ctrlKey && fields.length > 1) {
                    event.preventDefault();
                    removeItem(index);
                }
                break;

            case 'Insert':
                if (event.ctrlKey) {
                    event.preventDefault();
                    addNewItem();
                    setTimeout(() => {
                        const newIndex = fields.length;
                        inputRefs.current[newIndex]?.[0]?.focus?.();
                    }, 10);
                }
                break;

            case 'Escape':
                if (onCancel) {
                    event.preventDefault();
                    onCancel();
                }
                break;

            case 's':
            case 'S':
                if (event.ctrlKey) {
                    event.preventDefault();
                    form.handleSubmit(onSubmit)();
                }
                break;
        }
    };

    const onSubmit = async (data: CreateStockOpnameInput) => {
        if (!submitAction) {
            toast.error("Submit action not defined");
            return;
        }

        setIsSubmitting(true);
        try {
            await submitAction(data);
            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error(error);
            // Error toast handled by parent or action wrapper usually, but good to have fallback
            toast.error("Gagal menyimpan stock opname");
        } finally {
            setIsSubmitting(false);
        }
    };

    const addNewItem = () => {
        append({ productId: "", stokFisik: 0, hargaSatuan: 0, stokSistem: 0, catatanItem: "" });
        // Add new search query state for the new item
        setProductSearchQueries(prev => [...prev, ""]);
        setProductSearchOpen(prev => [...prev, false]);

        // Focus on new row's product input
        setTimeout(() => {
            const newIndex = fields.length;
            const element = inputRefs.current[newIndex]?.[0];
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
                element.focus({ preventScroll: true });
            }
        }, 100);
    };

    const removeItem = (index: number) => {
        remove(index);
        // Remove the corresponding search states
        // Remove the corresponding search states
        setProductSearchQueries(prev => prev.filter((_, i) => i !== index));
        setProductSearchOpen(prev => prev.filter((_, i) => i !== index));

        // Focus on previous row or first field
        setTimeout(() => {
            if (index > 0) {
                inputRefs.current[index - 1]?.[0]?.focus?.();
            } else if (fields.length > 1) {
                inputRefs.current[0]?.[0]?.focus?.();
            }
        }, 10);
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatNumber = (amount: number) => {
        return new Intl.NumberFormat('id-ID').format(amount);
    };

    return (
        <div className="w-full mx-auto px-6 space-y-8 animate-in fade-in duration-500">

            {/* Keyboard Shortcuts Guide */}
            <Alert className="flex flex-row bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50 mb-6">
                <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-blue-900 dark:text-blue-300 font-semibold">Keyboard Shortcuts : </AlertTitle>
                <AlertDescription className="flex flex-row gap-4 text-blue-700 dark:text-blue-400 text-sm space-y-1">
                    <div className="flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded text-xs font-mono dark:text-slate-300">Tab</kbd>
                        <span className="text-blue-700 dark:text-blue-400 ml-1">Next Field</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded text-xs font-mono dark:text-slate-300">Enter</kbd>
                        <span className="text-blue-700 dark:text-blue-400 ml-1">Add Item / Confirm</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded text-xs font-mono dark:text-slate-300">Ctrl+S</kbd>
                        <span className="text-blue-700 dark:text-blue-400 ml-1">Save</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded text-xs font-mono dark:text-slate-300">Esc</kbd>
                        <span className="text-blue-700 dark:text-blue-400 ml-1">Cancel</span>
                    </div>
                </AlertDescription>
            </Alert>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                    <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">

                        {/* --- GROUP 1: INFORMASI UTAMA --- */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card className="border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden dark:bg-slate-900/50">
                                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b dark:border-slate-700">
                                    <div className="flex items-center gap-2">
                                        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                                            Informasi Utama
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="tanggalOpname"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tanggal Pelaksanaan</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <CalendarIcon className="absolute left-3 top-2.5 h-4 h-4 text-slate-400 dark:text-slate-500" />
                                                        <Input
                                                            type="date"
                                                            className="pl-10"
                                                            {...field}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Tab' && !e.shiftKey) {
                                                                    e.preventDefault();
                                                                    const typeSelect = document.getElementById('type-select');
                                                                    typeSelect?.focus();
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tipe Opname</FormLabel>
                                                <Select
                                                    onValueChange={(val) => {
                                                        field.onChange(val);
                                                        if (onTypeChange) {
                                                            onTypeChange(val as OpnameType);
                                                        }
                                                    }}
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger id="type-select">
                                                            <SelectValue placeholder="Pilih Tipe" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value={OpnameType.PERIODIC}>Periodic (Rutin)</SelectItem>
                                                        <SelectItem value={OpnameType.INITIAL}>Initial (Saldo Awal)</SelectItem>
                                                        <SelectItem value={OpnameType.AD_HOC}>Ad-Hoc (Mendadak)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="warehouseId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Gudang Lokasi</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <div className="flex items-center gap-2">
                                                                <WarehouseIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                                                <SelectValue placeholder="Pilih Gudang" />
                                                            </div>
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {warehouses.map((wh) => (
                                                            <SelectItem key={wh.id} value={wh.id}>
                                                                {wh.name || wh.name}
                                                            </SelectItem>
                                                        ))}
                                                        {warehouses.length === 0 && (
                                                            <SelectItem value="empty" disabled>Tidak ada gudang tersedia</SelectItem>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            <Card className="dark:bg-slate-900/50 dark:border-slate-700">
                                <CardContent className="pt-6">
                                    <FormField
                                        control={form.control}
                                        name="keterangan"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Catatan Internal</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Berikan alasan opname atau keterangan tambahan..."
                                                        className="min-h-[120px] resize-none"
                                                        {...field}
                                                        value={field.value ?? ""}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        {/* --- GROUP 2: ITEM PRODUK --- */}
                        <div className="lg:col-span-5 flex flex-col">
                            <Card className="border-slate-200 dark:border-slate-600 dark:bg-slate-800/30 shadow-lg flex-1 mb-4">
                                <CardHeader className="flex flex-row items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 border-b dark:border-b-gray-600 py-2">
                                    <div className="flex items-center gap-2">
                                        <Package className="w-4 h-4 text-blue-600" />
                                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                                            Daftar Barang (Stock Items)
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-slate-100/50 dark:bg-slate-800/50 sticky top-0 z-10">
                                                <TableRow>
                                                    <TableHead className="w-[600px] text-slate-900 dark:text-slate-300">Produk</TableHead>
                                                    <TableHead className="w-[100px] text-center text-slate-900 dark:text-slate-300">Stok Sistem</TableHead>
                                                    <TableHead className="w-[120px] text-center text-slate-900 dark:text-slate-300">Stok Fisik</TableHead>
                                                    <TableHead className="w-[120px] text-center text-slate-900 dark:text-slate-300">Selisih</TableHead>
                                                    <TableHead className="w-[120px] text-center text-slate-900 dark:text-slate-300">Harga Satuan</TableHead>
                                                    <TableHead className="w-[140px] text-center text-slate-900 dark:text-slate-300">Harga Total</TableHead>
                                                    <TableHead className="min-w-[50px] text-slate-900 dark:text-slate-300">Keterangan Item</TableHead>
                                                    <TableHead className="w-[50px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {fields.map((field, index) => {
                                                    const selectedProductId = form.watch(`items.${index}.productId`);
                                                    const stokFisik = form.watch(`items.${index}.stokFisik`) || 0;
                                                    const stokSistem = form.watch(`items.${index}.stokSistem`) || 0;
                                                    const hargaSatuan = form.watch(`items.${index}.hargaSatuan`) || 0;
                                                    const productInfo = getProductInfo(selectedProductId, index);
                                                    const selisihInfo = getSelisihInfo(index);
                                                    const hargaTotal = stokFisik * hargaSatuan;
                                                    const filteredProducts = localProducts.filter(product =>
                                                        product.name.toLowerCase().includes(productSearchQueries[index].toLowerCase()) ||
                                                        product.code.toLowerCase().includes(productSearchQueries[index].toLowerCase())
                                                    );

                                                    return (
                                                        <TableRow
                                                            key={field.id}
                                                            className={cn(
                                                                "hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors",
                                                                activeInputIndex?.row === index && "bg-blue-50 dark:bg-blue-900"
                                                            )}
                                                        >
                                                            <TableCell className={cn(
                                                                "align-top p-2",
                                                                "dark:text-slate-300"
                                                            )}>
                                                                <FormField
                                                                    control={form.control}
                                                                    name={`items.${index}.productId`}
                                                                    render={({ field: formField }) => (
                                                                        <FormItem>
                                                                            <Popover
                                                                                open={productSearchOpen[index]}
                                                                                onOpenChange={(open) => {
                                                                                    updateProductSearchOpen(index, open);
                                                                                    if (!open) {
                                                                                        updateProductSearchQuery(index, "");
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <PopoverTrigger asChild>
                                                                                    <FormControl>
                                                                                        <Button
                                                                                            variant="outline"
                                                                                            role="combobox"
                                                                                            className={cn(
                                                                                                "w-full justify-between text-left font-normal h-10",
                                                                                                !formField.value && "text-muted-foreground",
                                                                                                form.formState.errors.items?.[index]?.productId && "border-red-500 ring-1 ring-red-500"
                                                                                            )}
                                                                                            ref={(el) => {
                                                                                                if (!inputRefs.current[index]) {
                                                                                                    inputRefs.current[index] = [null, null, null, null];
                                                                                                }
                                                                                                inputRefs.current[index][0] = el;
                                                                                            }}
                                                                                            onKeyDown={(e) => handleKeyDown(e, index, 'product')}
                                                                                            onClick={() => updateProductSearchOpen(index, true)}
                                                                                        >
                                                                                            {formField.value ? (
                                                                                                <div className="flex flex-col gap-0.5 truncate">
                                                                                                    <span className="font-medium truncate text-sm">
                                                                                                        {productInfo.name}
                                                                                                    </span>
                                                                                                    <span className="text-xs text-muted-foreground truncate">
                                                                                                        {productInfo.satuan}
                                                                                                    </span>
                                                                                                </div>
                                                                                            ) : (
                                                                                                <span className="text-sm">Pilih produk...</span>
                                                                                            )}
                                                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                                        </Button>
                                                                                    </FormControl>
                                                                                </PopoverTrigger>
                                                                                <PopoverContent className="w-[500px] p-0" align="start">
                                                                                    <Command>
                                                                                        <div className="flex items-center border-b px-3">
                                                                                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                                                                            <CommandInput
                                                                                                placeholder="Cari produk (kode atau nama)..."
                                                                                                value={productSearchQueries[index]}
                                                                                                onValueChange={(value) => updateProductSearchQuery(index, value)}
                                                                                                autoFocus
                                                                                            />
                                                                                        </div>
                                                                                        <CommandList className="max-h-[300px]">
                                                                                            <CommandEmpty className="py-2 px-2">
                                                                                                <div className="text-center text-sm text-gray-500 mb-2">Produk tidak ditemukan.</div>
                                                                                                <ProductCreateDialog
                                                                                                    createEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/api/master/product/createProduct`}
                                                                                                    onCreated={(created) => {
                                                                                                        const newProduct: Product = {
                                                                                                            id: created.id,
                                                                                                            code: "NEW",
                                                                                                            name: created.name,
                                                                                                            satuan: "Pcs",
                                                                                                            storageUnit: "Pcs",
                                                                                                            stokSistem: 0,
                                                                                                            hargaSatuan: 0
                                                                                                        };
                                                                                                        setLocalProducts(prev => [...prev, newProduct]);
                                                                                                        formField.onChange(newProduct.id);
                                                                                                        handleProductSelect(index, newProduct.id);
                                                                                                        updateProductSearchOpen(index, false);
                                                                                                        updateProductSearchQuery(index, "");
                                                                                                    }}
                                                                                                    trigger={
                                                                                                        <Button
                                                                                                            type="button"
                                                                                                            size="lg"
                                                                                                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all px-6"
                                                                                                        >
                                                                                                            <PackagePlus className="w-5 h-5 mr-2" /> Buat Produk Baru
                                                                                                        </Button>
                                                                                                    }
                                                                                                />
                                                                                            </CommandEmpty>
                                                                                            <CommandGroup>
                                                                                                {filteredProducts.map((product) => (
                                                                                                    <CommandItem
                                                                                                        key={product.id}
                                                                                                        value={`${product.code} ${product.name}`}
                                                                                                        onSelect={() => {
                                                                                                            const currentItems = form.getValues("items");
                                                                                                            const isDuplicate = currentItems.some((item, idx) => item.productId === product.id && idx !== index);

                                                                                                            formField.onChange(product.id);
                                                                                                            handleProductSelect(index, product.id);
                                                                                                            updateProductSearchOpen(index, false);
                                                                                                            updateProductSearchQuery(index, "");

                                                                                                            if (isDuplicate) {
                                                                                                                toast.warning("Produk Duplikat Ditambahkan!", {
                                                                                                                    description: `Produk "${product.name}" sudah ada di baris lain.`,
                                                                                                                    duration: 4000,
                                                                                                                    className: "bg-orange-50 border-orange-200 text-orange-900 icon-orange-500"
                                                                                                                });
                                                                                                                setTimeout(() => {
                                                                                                                    form.setError(`items.${index}.productId`, {
                                                                                                                        type: "manual",
                                                                                                                        message: "Produk duplikat (sudah dipilih)"
                                                                                                                    });
                                                                                                                }, 0);
                                                                                                            } else {
                                                                                                                form.clearErrors(`items.${index}.productId`);
                                                                                                            }
                                                                                                        }}
                                                                                                        className="py-2"
                                                                                                    >
                                                                                                        <Check
                                                                                                            className={cn(
                                                                                                                "mr-2 h-4 w-4",
                                                                                                                formField.value === product.id
                                                                                                                    ? "opacity-100"
                                                                                                                    : "opacity-0"
                                                                                                            )}
                                                                                                        />
                                                                                                        <div className="flex-1">
                                                                                                            <div className="font-medium dark:text-slate-200">
                                                                                                                {product.code} - {product.name}
                                                                                                            </div>
                                                                                                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                                                                                                                <div className="flex items-center gap-3">
                                                                                                                    <span>Satuan: {product.satuan || product.storageUnit || "-"}</span>
                                                                                                                    <span>•</span>
                                                                                                                    <span>Stok: {product.stokSistem || 0}</span>
                                                                                                                </div>
                                                                                                                <span className="font-semibold text-green-600 dark:text-green-400">
                                                                                                                    {product.hargaSatuan ? formatCurrency(product.hargaSatuan) : "Rp 0"}
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
                                                                            <FormMessage className="text-xs" />
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            </TableCell>
                                                            <TableCell className="align-top p-2 text-center">
                                                                <div className="flex flex-col gap-1 py-2">
                                                                    <span className="font-medium text-gray-900 text-sm dark:text-white">
                                                                        {formatNumber(form.getValues(`items.${index}.stokSistem`) || 0)}
                                                                    </span>
                                                                    {productInfo.satuan && (
                                                                        <span className="text-xs text-gray-500 dark:text-white">
                                                                            {productInfo.satuan}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="align-top p-2">
                                                                <FormField
                                                                    control={form.control}
                                                                    name={`items.${index}.stokFisik`}
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormControl>
                                                                                <div className="relative">
                                                                                    <Input
                                                                                        type="number"
                                                                                        className="text-center font-mono pr-8 h-10 text-sm"
                                                                                        {...field}
                                                                                        value={(field.value === 0 && activeInputIndex?.row === index && activeInputIndex?.field === 'stokFisik') ? '' : field.value}
                                                                                        onChange={e => {
                                                                                            const value = e.target.value === '' ? 0 : Number(e.target.value);
                                                                                            field.onChange(value);
                                                                                        }}
                                                                                        onFocus={() => setActiveInputIndex({ row: index, field: 'stokFisik' })}
                                                                                        onBlur={() => setActiveInputIndex(null)}
                                                                                        onKeyDown={(e) => handleKeyDown(e, index, 'stokFisik')}
                                                                                        ref={(el) => {
                                                                                            if (!inputRefs.current[index]) {
                                                                                                inputRefs.current[index] = [null, null, null, null];
                                                                                            }
                                                                                            inputRefs.current[index][1] = el;
                                                                                        }}
                                                                                    />
                                                                                    {productInfo.satuan && (
                                                                                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                                                                                            {productInfo.satuan}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </FormControl>
                                                                            <FormMessage className="text-xs" />
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            </TableCell>
                                                            <TableCell className="align-top p-2 text-center">
                                                                <div className="flex flex-col items-center justify-center gap-1 py-2">
                                                                    <div className={cn(
                                                                        "flex items-center gap-1 font-bold text-sm dark:text-white",
                                                                        selisihInfo.isPositive && "text-green-600 dark:text-green-400",
                                                                        selisihInfo.isNegative && "text-red-600 dark:text-red-400",
                                                                        selisihInfo.isZero && "text-gray-600 dark:text-gray-400"
                                                                    )}>
                                                                        {selisihInfo.isPositive && <TrendingUp className="w-3 h-3" />}
                                                                        {selisihInfo.isNegative && <TrendingDown className="w-3 h-3" />}
                                                                        <span>
                                                                            {selisihInfo.selisih > 0 ? '+' : ''}{formatNumber(selisihInfo.selisih)}
                                                                        </span>
                                                                    </div>
                                                                    <div className={cn(
                                                                        "text-xs dark:text-white",
                                                                        selisihInfo.isPositive && "text-green-500 dark:text-green-400",
                                                                        selisihInfo.isNegative && "text-red-500 dark:text-red-400",
                                                                        selisihInfo.isZero && "text-gray-500 dark:text-gray-400"
                                                                    )}>
                                                                        {selisihInfo.selisihPersen !== 0 && (
                                                                            <span>{selisihInfo.selisihPersen > 0 ? '+' : ''}{selisihInfo.selisihPersen.toFixed(1)}%</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="align-top p-2">

                                                                <FormField
                                                                    control={form.control}
                                                                    name={`items.${index}.hargaSatuan`}
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormControl>
                                                                                <div className="relative">
                                                                                    <Input
                                                                                        type="number"
                                                                                        className="text-center font-mono pr-8 h-10 text-sm"
                                                                                        {...field}
                                                                                        value={(field.value === 0 && activeInputIndex?.row === index && activeInputIndex?.field === 'hargaSatuan') ? '' : field.value}
                                                                                        onChange={e => {
                                                                                            const value = e.target.value === '' ? 0 : Number(e.target.value);
                                                                                            field.onChange(value);
                                                                                        }}
                                                                                        onFocus={() => setActiveInputIndex({ row: index, field: 'hargaSatuan' })}
                                                                                        onBlur={() => setActiveInputIndex(null)}
                                                                                        onKeyDown={(e) => handleKeyDown(e, index, 'hargaSatuan')}
                                                                                        ref={(el) => {
                                                                                            if (!inputRefs.current[index]) {
                                                                                                inputRefs.current[index] = [null, null, null, null];
                                                                                            }
                                                                                            inputRefs.current[index][2] = el;
                                                                                        }}
                                                                                    />
                                                                                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                                                                                        Rp
                                                                                    </div>
                                                                                </div>
                                                                            </FormControl>
                                                                            <FormMessage className="text-xs" />
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                                {productInfo.hargaSatuan === 0 && (
                                                                    <div className="text-xs text-amber-600 mt-1">
                                                                        *Harga kosong, input manual
                                                                    </div>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="align-top p-2 text-center">
                                                                <div className="flex flex-col gap-1 py-2">
                                                                    <span className="font-bold text-gray-900 text-sm dark:text-white">
                                                                        {formatCurrency(hargaTotal)}
                                                                    </span>
                                                                    <span className="text-xs text-green-600 dark:text-green-400">
                                                                        {stokFisik} × {formatCurrency(hargaSatuan)}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="align-top p-2">
                                                                <FormField
                                                                    control={form.control}
                                                                    name={`items.${index}.catatanItem`}
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormControl>
                                                                                <Input
                                                                                    placeholder="Misal: Barang rusak, expired, dll."
                                                                                    className="h-10 text-sm"
                                                                                    {...field}
                                                                                    value={field.value ?? ""}
                                                                                    onFocus={() => setActiveInputIndex({ row: index, field: 'catatanItem' })}
                                                                                    onBlur={() => setActiveInputIndex(null)}
                                                                                    onKeyDown={(e) => handleKeyDown(e, index, 'catatanItem')}
                                                                                    ref={(el) => {
                                                                                        if (!inputRefs.current[index]) {
                                                                                            inputRefs.current[index] = [null, null, null, null];
                                                                                        }
                                                                                        inputRefs.current[index][3] = el;
                                                                                    }}
                                                                                />
                                                                            </FormControl>
                                                                            <FormMessage className="text-xs" />
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            </TableCell>
                                                            <TableCell className="align-top p-2">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                                                    onClick={() => removeItem(index)}
                                                                    disabled={fields.length === 1}
                                                                    title="Hapus item (Ctrl+Delete)"
                                                                    onKeyDown={(e) => handleKeyDown(e, index, 'delete')}
                                                                    ref={(el) => {
                                                                        if (!inputRefs.current[index]) {
                                                                            inputRefs.current[index] = [null, null, null, null];
                                                                        }
                                                                        inputRefs.current[index][4] = el;
                                                                    }}
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {fields.length === 0 && (
                                        <div className="py-20 text-center space-y-3">
                                            <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                                                <Package className="w-6 h-6 text-slate-400" />
                                            </div>
                                            <p className="text-slate-500 text-sm">Belum ada item yang ditambahkan.</p>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={addNewItem}
                                                className="mt-2"
                                                id="add-item-button"
                                            >
                                                <Plus className="w-4 h-4 mr-2" /> Tambah Item Pertama
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Add Item & Create Product Buttons */}
                            <div className="flex flex-row-reverse justify-between gap-4 mb-6 px-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="lg"
                                    onClick={addNewItem}
                                    className="border-dashed border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 px-8"
                                    id="add-item-button"
                                >
                                    <Plus className="w-5 h-5 mr-2" /> Tambah Item Baru (Ctrl+Insert)
                                </Button>

                                <ProductCreateDialog
                                    createEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/api/master/product/createProduct`}
                                    onCreated={(created) => {
                                        const newProduct: Product = {
                                            id: created.id,
                                            code: "NEW",
                                            name: created.name,
                                            satuan: "Pcs",
                                            storageUnit: "Pcs",
                                            stokSistem: 0,
                                            hargaSatuan: 0
                                        };
                                        setLocalProducts(prev => [...prev, newProduct]);
                                        toast.success("Produk baru berhasil ditambahkan", {
                                            description: `${created.name} kini tersedia di pencarian.`
                                        });
                                    }}
                                    trigger={
                                        <Button
                                            type="button"
                                            size="lg"
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all px-6"
                                        >
                                            <PackagePlus className="w-5 h-5 mr-2" /> Buat Produk Baru
                                        </Button>
                                    }
                                />
                            </div>

                            {/* Summary Section - Now properly separated */}
                            <Card className="border-blue-100 bg-gradient-to-r from-blue-50/50 to-white shadow-sm">
                                <CardContent className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                                        <div className="text-center space-y-2">
                                            <div className="text-sm text-blue-600 font-medium">Total Items</div>
                                            <div className="text-2xl font-bold text-blue-900">{fields.length}</div>
                                        </div>
                                        <div className="text-center space-y-2">
                                            <div className="text-sm text-green-600 font-medium">Produk Terpilih</div>
                                            <div className="text-2xl font-bold text-green-900">
                                                {fields.filter((_, index) => form.watch(`items.${index}.productId`)).length}
                                            </div>
                                        </div>
                                        <div className="text-center space-y-2">
                                            <div className="text-sm text-purple-600 font-medium">Total Nilai</div>
                                            <div className="text-2xl font-bold text-purple-900">
                                                {formatCurrency(totalValue)}
                                            </div>
                                        </div>
                                        <div className="text-center space-y-2">
                                            <div className="text-sm text-amber-600 font-medium">Selisih Total</div>
                                            <div className="text-2xl font-bold text-amber-900">
                                                {fields.reduce((total, _, index) => {
                                                    const selisih = getSelisihInfo(index).selisih;
                                                    return total + selisih;
                                                }, 0)}
                                            </div>
                                        </div>
                                        <div className="text-center space-y-2">
                                            <div className="text-sm text-emerald-600 font-medium">Status</div>
                                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 px-3 py-1">
                                                Draft - {fields.length} items
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between p-6 bg-white border rounded-2xl shadow-sm">
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                            <div className="flex items-center gap-1">
                                <UserIcon className="w-4 h-4" />
                                <span>Petugas:</span>
                                <span className="font-semibold text-slate-900 ml-1">{user?.namaLengkap || user?.name || user?.username || "-"}</span>
                            </div>
                            <div className="w-1 h-1 bg-slate-300 rounded-full" />
                            <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                <span>Total Nilai:</span>
                                <span className="font-bold text-green-700 ml-1">{formatCurrency(totalValue)}</span>
                            </div>
                            <div className="w-1 h-1 bg-slate-300 rounded-full" />
                            <div>Total Item: {fields.length}</div>
                        </div>
                        <div className="flex gap-4">
                            <Button
                                type="button"
                                variant="destructive"
                                className="px-8"
                                onClick={() => setShowCancelDialog(true)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        setShowCancelDialog(true);
                                    }
                                }}
                            >
                                Batal (Esc)
                            </Button>
                            <Button
                                type="submit"
                                size="lg"
                                className="bg-blue-600 hover:bg-blue-700 px-10 shadow-lg shadow-blue-200 dark:text-white"
                                disabled={!form.watch('warehouseId') || fields.length === 0 || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <ClipboardCheck className="w-4 h-4 mr-2" /> Konfirmasi & Simpan (Ctrl+S)
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </Form>

            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Batalkan Stock Opname?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini akan menghapus semua data yang belum disimpan. Anda yakin ingin membatalkan?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Kembali</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => onCancel?.()}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            Lanjut Batal
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
}