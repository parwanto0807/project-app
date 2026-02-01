"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
    CalendarIcon, Plus, Trash2, RefreshCw, ChevronDown,
    Package, Building, FileText, ClipboardList, Truck,
    Info, CheckCircle, AlertCircle, Calculator, Check
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Supplier } from "@/types/supplierType";
import { Warehouse } from "@/types/whType";
import { Project } from "@/types/salesOrder";
import { Product } from "@/types/quotation";
import { updatePurchaseOrder } from "@/lib/action/po/po";
import { PurchaseOrder, PurchaseOrderLine, PurchaseOrderStatus } from "@/types/poType";
import { SPKDataApi } from "@/types/spk";
import { FileCheck, CreditCard, DollarSign, Percent, Briefcase } from "lucide-react";

// Schema validation
const formSchema = z.object({
    supplierId: z.string().min(1, "Supplier harus dipilih"),
    warehouseId: z.string().min(1, "Gudang harus dipilih"),
    spkId: z.string().optional(),
    projectId: z.string().optional(),
    poNumber: z.string().min(1, "PO Number harus diisi"),
    poDate: z.date({ required_error: "Tanggal PO harus diisi" }),
    deliveryDate: z.date().optional(),
    paymentTerm: z.enum(["CASH", "COD", "NET_7", "NET_14", "NET_30", "DP_PERCENTAGE"]).optional(),
    notes: z.string().optional(),
    items: z.array(
        z.object({
            id: z.string().optional(),
            productId: z.string().min(1, "Produk harus dipilih"),
            quantity: z.number().min(1, "Jumlah minimal 1"),
            price: z.number().min(0, "Harga tidak boleh negatif"),
            unit: z.string().min(1, "Satuan harus diisi"),
            total: z.number().min(0),
        })
    ).min(1, "Minimal 1 item produk"),
});

type FormData = z.infer<typeof formSchema>;

interface UpdateFormPOProps {
    purchaseOrderId: string;
    initialData: PurchaseOrder;
    suppliers: Supplier[];
    warehouses: Warehouse[];
    projects: Project[];
    products: Product[];
    spkList: SPKDataApi[];
    poNumber: string;
    onSuccess: (poId: string) => void;
    onCancel: () => void;
}

// Gradient Icon Component
const GradientIcon = ({ icon: Icon, size = 20, className = "" }: { icon: any, size?: number, className?: string }) => (
    <div className={`relative ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-primary/60 blur-sm opacity-60 rounded-full"></div>
        <Icon
            size={size}
            className="relative text-white"
            style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #9333ea 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
            }}
        />
    </div>
);

// Status Badge Component with Gradient
const StatusBadge = ({ status }: { status: PurchaseOrderStatus }) => {
    const getStatusConfig = () => {
        switch (status) {
            case PurchaseOrderStatus.DRAFT:
                return {
                    bg: "from-gray-500 to-gray-600",
                    text: "text-gray-700",
                    icon: <FileText className="h-3 w-3" />
                };
            case PurchaseOrderStatus.PENDING_APPROVAL:
                return {
                    bg: "from-amber-500 to-orange-500",
                    text: "text-amber-700",
                    icon: <AlertCircle className="h-3 w-3" />
                };
            case PurchaseOrderStatus.APPROVED:
                return {
                    bg: "from-emerald-500 to-green-600",
                    text: "text-emerald-700",
                    icon: <CheckCircle className="h-3 w-3" />
                };
            case PurchaseOrderStatus.SENT:
                return {
                    bg: "from-blue-500 to-indigo-600",
                    text: "text-blue-700",
                    icon: <Truck className="h-3 w-3" />
                };
            default:
                return {
                    bg: "from-primary to-primary/80",
                    text: "text-primary",
                    icon: <Info className="h-3 w-3" />
                };
        }
    };

    const config = getStatusConfig();

    return (
        <div className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r border border-transparent self-center",
            config.bg,
            "bg-opacity-10 dark:bg-opacity-20"
        )}>
            {config.icon}
            <span className={cn("text-xs font-semibold uppercase tracking-wider", config.text, "dark:brightness-125")}>
                {status.replace(/_/g, ' ')}
            </span>
        </div>
    );
};

// Isolated component for totals to prevent parent re-renders
const TotalsSummary = ({ control, fieldsCount }: { control: any; fieldsCount: number }) => {
    const watchItems = useWatch({
        control,
        name: "items",
    });

    const { subtotal, tax, grandTotal } = useMemo(() => {
        const sub = (watchItems || []).reduce((sum: any, item: any) => sum + (item.total || 0), 0);
        const t = sub * 0.11;
        return {
            subtotal: sub,
            tax: t,
            grandTotal: sub + t,
        };
    }, [watchItems]);

    return (
        <div className="space-y-5">
            <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Item:</span>
                <span className="font-semibold text-lg">{fieldsCount}</span>
            </div>
            <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200/50 dark:border-gray-800">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                        Rp {subtotal.toLocaleString("id-ID")}
                    </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-200/50">
                    <span className="text-gray-600">PPN (11%):</span>
                    <span className="font-medium text-gray-800">
                        Rp {tax.toLocaleString("id-ID")}
                    </span>
                </div>
                <div className="pt-4">
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total:</span>
                        <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                            Rp {grandTotal.toLocaleString("id-ID")}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Memoized Row Component for better performance
const POItemRow = React.memo(({
    index,
    item,
    error,
    control,
    allProducts,
    selectedProductIds,
    onProductSelect,
    onQuantityChange,
    onPriceChange,
    onRemove,
}: {
    index: number;
    item: any;
    error: any;
    control: any;
    allProducts: Product[];
    selectedProductIds: string[];
    onProductSelect: (index: number, productId: string) => void;
    onQuantityChange: (index: number, quantity: number) => void;
    onPriceChange: (index: number, price: number) => void;
    onRemove: (index: number) => void;
}) => {
    const [open, setOpen] = useState(false);

    // Local filtering for products to improve dropdown performance
    const availableProducts = useMemo(() => {
        const currentProductId = item.productId;
        return allProducts.filter(product => {
            const isCurrentProduct = product.id.toString() === currentProductId;
            const isAlreadySelected = selectedProductIds.includes(product.id.toString()) &&
                product.id.toString() !== currentProductId;
            return isCurrentProduct || !isAlreadySelected;
        });
    }, [allProducts, selectedProductIds, item.productId]);

    const selectedProduct = useMemo(() =>
        allProducts.find(p => p.id.toString() === item.productId),
        [allProducts, item.productId]);

    return (
        <TableRow className="hover:bg-gray-50/30 group">
            <TableCell>
                <Controller
                    control={control}
                    name={`items.${index}.productId`}
                    render={({ field }) => (
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={open}
                                    className={cn(
                                        "w-full h-11 justify-between border-gray-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 font-normal rounded-lg",
                                        !field.value && "text-muted-foreground",
                                        error && "border-red-500"
                                    )}
                                >
                                    <span className="truncate">
                                        {field.value
                                            ? selectedProduct?.name || "Produk terpilih"
                                            : "Pilih produk..."}
                                    </span>
                                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0 rounded-xl" align="start">
                                <Command className="rounded-xl">
                                    <CommandInput placeholder="Cari produk..." />
                                    <CommandList className="max-h-[300px]">
                                        <CommandEmpty>Produk tidak ditemukan.</CommandEmpty>
                                        <CommandGroup>
                                            {availableProducts.map((product) => (
                                                <CommandItem
                                                    key={product.id}
                                                    value={`${product.name} ${product.code}`}
                                                    onSelect={() => {
                                                        const val = product.id.toString();
                                                        field.onChange(val);
                                                        onProductSelect(index, val);
                                                        setOpen(false);
                                                    }}
                                                    className="rounded-lg"
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            field.value === product.id.toString()
                                                                ? "opacity-100"
                                                                : "opacity-0"
                                                        )}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span>{product.name}</span>
                                                        {product.code && (
                                                            <span className="text-xs text-muted-foreground">
                                                                SKU: {product.code}
                                                            </span>
                                                        )}
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    )}
                />
                {error?.productId && (
                    <p className="text-sm text-red-500 mt-1">
                        {error.productId.message}
                    </p>
                )}
            </TableCell>
            <TableCell>
                <Input
                    type="number"
                    min="1"
                    defaultValue={item.quantity}
                    onBlur={(e) => onQuantityChange(index, Number(e.target.value))}
                    className={cn(
                        "w-24 h-11 border-gray-300/80 rounded-lg",
                        error?.quantity && "border-red-500"
                    )}
                />
                {error?.quantity && (
                    <p className="text-sm text-red-500 mt-1">
                        {error.quantity.message}
                    </p>
                )}
            </TableCell>
            <TableCell>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        Rp
                    </span>
                    <Input
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={item.price}
                        onBlur={(e) => onPriceChange(index, Number(e.target.value))}
                        className={cn(
                            "w-32 h-11 pl-8 border-gray-300/80 rounded-lg",
                            error?.price && "border-red-500"
                        )}
                    />
                </div>
                {error?.price && (
                    <p className="text-sm text-red-500 mt-1">
                        {error.price.message}
                    </p>
                )}
            </TableCell>
            <TableCell>
                <Controller
                    control={control}
                    name={`items.${index}.unit`}
                    render={({ field }) => (
                        <Input
                            {...field}
                            className={cn(
                                "w-24 h-11 border-gray-300/80 rounded-lg bg-gray-50",
                                error?.unit && "border-red-500"
                            )}
                            readOnly={true}
                        />
                    )}
                />
                {error?.unit && (
                    <p className="text-sm text-red-500 mt-1">
                        {error.unit.message}
                    </p>
                )}
            </TableCell>
            <TableCell>
                <div className="font-semibold text-gray-900 dark:text-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-900/50 py-2 px-3 rounded-lg">
                    Rp {(item.total || 0).toLocaleString("id-ID")}
                </div>
            </TableCell>
            <TableCell>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(index)}
                    className="h-10 w-10 text-gray-500 hover:text-red-600 hover:bg-red-50/50 rounded-lg transition-all duration-300"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </TableCell>
        </TableRow>
    );
});

POItemRow.displayName = "POItemRow";

export default function UpdateFormPO({
    purchaseOrderId,
    initialData,
    suppliers,
    warehouses,
    projects,
    products,
    spkList,
    poNumber,
    onSuccess,
    onCancel,
}: UpdateFormPOProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedProjectName, setSelectedProjectName] = useState<string>(
        initialData.project?.name || ""
    );

    const {
        control,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        reset,
        getValues,
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            supplierId: initialData.supplierId || "",
            warehouseId: initialData.warehouseId || "",
            spkId: initialData.sPKId || initialData.SPK?.id || initialData.PurchaseRequest?.spkId || "",
            projectId: initialData.projectId || "",
            poNumber: initialData.poNumber || "",
            poDate: initialData.orderDate ? new Date(initialData.orderDate) : new Date(),
            deliveryDate: initialData.expectedDeliveryDate ? new Date(initialData.expectedDeliveryDate) : undefined,
            paymentTerm: (initialData.paymentTerm as "CASH" | "COD" | "NET_7" | "NET_14" | "NET_30" | "DP_PERCENTAGE") || "NET_30",
            notes: initialData.notes || "",
            items: initialData.lines?.map((item: PurchaseOrderLine) => ({
                id: item.id,
                productId: item.productId,
                quantity: Number(item.quantity),
                price: Number(item.unitPrice),
                unit: item.product?.purchaseUnit || item.product?.unit || "pcs",
                total: Number(item.totalAmount),
            })) || [],
        },
    });

    const { fields, append, remove, update } = useFieldArray({
        control,
        name: "items",
    });

    // Watch items ONLY for selectedProductIds calculation at this level
    const watchItemsForProducts = useWatch({
        control,
        name: "items",
    });

    // Memoize selected product IDs to stabilize props
    const selectedProductIds = useMemo(() => {
        return (watchItemsForProducts || []).map((item: any) => item.productId).filter(Boolean);
    }, [JSON.stringify((watchItemsForProducts || []).map((item: any) => item.productId))]);

    // Initialize loading state
    useEffect(() => {
        setIsLoading(false);
    }, []);

    // Initialize SPK and Project from initial data
    useEffect(() => {
        // Get spkId from initialData - try both sPKId and SPK?.id
        // Get spkId from initialData - try sPKId, SPK?.id, or fallback to PurchaseRequest's spkId
        const spkIdValue = initialData.sPKId || initialData.SPK?.id || initialData.PurchaseRequest?.spkId || "";

        console.log("SPK Init Debug:", {
            sPKId: initialData.sPKId,
            SPK: initialData.SPK,
            spkIdValue,
            spkListLength: spkList.length
        });

        if (spkIdValue) {
            setValue("spkId", spkIdValue);

            // Find the SPK in spkList to get project name
            if (spkList.length > 0) {
                const selectedSpk = spkList.find(spk => spk.id === spkIdValue);
                if (selectedSpk) {
                    const projectName = selectedSpk.salesOrder?.project?.name ||
                        selectedSpk.salesOrder?.projectName ||
                        initialData.project?.name || "";
                    setSelectedProjectName(projectName);

                    // Also set projectId if available
                    const projectId = selectedSpk.salesOrder?.project?.id || initialData.projectId;
                    if (projectId) {
                        setValue("projectId", projectId);
                    }
                }
            }

            // Always set project name from initialData if available
            if (initialData.project?.name) {
                setSelectedProjectName(initialData.project.name);
            }
        } else if (initialData.project?.name) {
            // No SPK but has project from initial data
            setSelectedProjectName(initialData.project.name);
        }
    }, [initialData.sPKId, initialData.SPK, initialData.projectId, initialData.project, spkList, setValue]);

    // Add new item
    const addItem = React.useCallback(() => {
        append({ productId: "", quantity: 1, price: 0, unit: "", total: 0 });
    }, [append]);

    // Remove item
    const removeItem = React.useCallback((index: number) => {
        const currentItems = getValues("items");
        const productIdToRemove = currentItems[index]?.productId;
        remove(index);

        // No longer using selectedProducts state for filtering, using selectedProductIds from useWatch
    }, [remove, getValues]);

    // Handle product selection
    const handleProductSelect = React.useCallback((index: number, productId: string) => {
        const product = products.find(p => p.id.toString() === productId);
        if (product) {
            const currentItems = getValues("items");
            const currentItem = currentItems[index];
            const unit = product.purchaseUnit || product.uom || "pcs";
            const price = Number(product.price) || 0;
            const quantity = Number(currentItem?.quantity) || 1;

            update(index, {
                ...currentItem,
                productId: product.id.toString(),
                price: price,
                unit: unit,
                quantity: quantity,
                total: quantity * price,
            });
        }
    }, [products, update, getValues]);

    // Handle quantity change
    const handleQuantityChange = React.useCallback((index: number, quantity: number) => {
        const currentItems = getValues("items");
        const currentItem = currentItems[index];
        const price = currentItem?.price || 0;
        update(index, {
            ...currentItem,
            quantity,
            total: quantity * price,
        });
    }, [update, getValues]);

    // Handle price change
    const handlePriceChange = React.useCallback((index: number, price: number) => {
        const currentItems = getValues("items");
        const currentItem = currentItems[index];
        const quantity = currentItem?.quantity || 1;
        update(index, {
            ...currentItem,
            price,
            total: quantity * price,
        });
    }, [update, getValues]);


    // Handle form submission
    const onSubmit = async (data: FormData) => {
        // Check if PO status allows update
        // Prevent editing if PO is already approved or further along
        if (initialData.status === PurchaseOrderStatus.APPROVED ||
            initialData.status === PurchaseOrderStatus.SENT ||
            initialData.status === PurchaseOrderStatus.FULLY_RECEIVED) {
            toast.error(`PO dengan status "${initialData.status}" tidak dapat diubah`);
            return;
        }

        setIsSubmitting(true);
        try {
            const lines = data.items.map(item => ({
                id: item.id,
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.price,
                totalAmount: item.total,
                description: "",
            }));

            const currentItems = getValues("items");
            const sub = (currentItems || []).reduce((sum, item) => sum + (item.total || 0), 0);
            const taxActual = sub * 0.11;
            const grandTotalActual = sub + taxActual;

            const formattedData = {
                ...data,
                orderDate: data.poDate.toISOString(),
                expectedDeliveryDate: data.deliveryDate?.toISOString() || null,
                subtotal: sub,
                tax: taxActual,
                totalAmount: grandTotalActual,
                status: initialData.status,
                lines,
            };

            await updatePurchaseOrder(purchaseOrderId, formattedData);

            toast.success("Purchase Order berhasil diperbarui!");
            onSuccess(purchaseOrderId);
        } catch (error) {
            console.error("Error updating purchase order:", error);
            toast.error("Terjadi kesalahan saat memperbarui Purchase Order");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reset to initial data
    const handleReset = () => {
        reset({
            supplierId: initialData.supplierId || "",
            warehouseId: initialData.warehouseId || "",
            projectId: initialData.projectId || "",
            poNumber: initialData.poNumber || "",
            poDate: initialData.orderDate ? new Date(initialData.orderDate) : new Date(),
            deliveryDate: initialData.expectedDeliveryDate ? new Date(initialData.expectedDeliveryDate) : new Date(),
            notes: initialData.notes || "",
            items: initialData.lines?.map((item: PurchaseOrderLine) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.unitPrice,
                unit: (item.product as any)?.purchaseUnit || (item.product as any)?.uom || "",
                total: item.totalAmount,
            })) || [],
        });

        if (initialData.lines && products.length > 0) {
            const productIds = initialData.lines.map(item => item.productId);
            const selectedProds = products.filter(product =>
                productIds.includes(product.id.toString())
            );
            setSelectedProducts(selectedProds);
        }

        toast.info("Data telah direset ke nilai asli");
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-72 rounded-2xl" />
                        <Skeleton className="h-96 rounded-2xl" />
                    </div>
                    <Skeleton className="h-64 rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <form id="update-po-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Header with Gradient Background */}
            <div className="relative rounded-2xl overflow-hidden border dark:border-gray-800">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/5 dark:to-primary/10"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/50 to-transparent dark:via-gray-900/50"></div>
                <div className="relative p-6 md:p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-start gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/60 rounded-xl blur-md opacity-40"></div>
                                <div className="relative bg-gradient-to-br from-primary via-primary/80 to-primary/60 p-3 rounded-xl">
                                    <ClipboardList className="h-8 w-8 text-white" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent dark:from-white dark:via-gray-200 dark:to-gray-100">
                                    Edit Purchase Order
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 mt-2">
                                    Perbarui informasi purchase order #{initialData.poNumber}
                                </p>
                            </div>
                        </div>
                        <StatusBadge status={initialData.status as PurchaseOrderStatus} />
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Information */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Information Card */}
                    <Card className="border border-gray-200/80 dark:border-gray-800 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                        <CardHeader className="border-b border-gray-200/50 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <GradientIcon icon={ClipboardList} size={24} />
                                <div>
                                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent dark:from-gray-100 dark:to-gray-400">
                                        Informasi Dasar
                                    </CardTitle>
                                    <CardDescription className="text-gray-500">
                                        Lengkapi informasi dasar purchase order
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Supplier */}
                                <div className="space-y-3">
                                    <Label htmlFor="supplierId" className="text-sm font-medium flex items-center gap-2">
                                        <Building className="h-4 w-4 text-gray-500" />
                                        Supplier <span className="text-red-500">*</span>
                                    </Label>
                                    <Controller
                                        name="supplierId"
                                        control={control}
                                        render={({ field }) => (
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <SelectTrigger className={cn(
                                                    "w-full h-12 border-gray-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl",
                                                    errors.supplierId && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                                )}>
                                                    <SelectValue placeholder="Pilih supplier" />
                                                    <ChevronDown className="h-4 w-4 ml-auto opacity-50" />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[300px] rounded-xl">
                                                    {suppliers.map((supplier) => (
                                                        <SelectItem key={supplier.id} value={supplier.id.toString()} className="rounded-lg">
                                                            <div className="flex flex-col py-1">
                                                                <span className="font-medium">{supplier.name}</span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {supplier.email}
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.supplierId && (
                                        <p className="text-sm text-red-500 flex items-center gap-1">
                                            {errors.supplierId.message}
                                        </p>
                                    )}
                                </div>

                                {/* Warehouse */}
                                <div className="space-y-3">
                                    <Label htmlFor="warehouseId" className="text-sm font-medium flex items-center gap-2">
                                        <Package className="h-4 w-4 text-gray-500" />
                                        Gudang Tujuan <span className="text-red-500">*</span>
                                    </Label>
                                    <Controller
                                        name="warehouseId"
                                        control={control}
                                        render={({ field }) => (
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <SelectTrigger className={cn(
                                                    "w-full h-12 border-gray-300/80 rounded-xl",
                                                    errors.warehouseId && "border-red-500"
                                                )}>
                                                    <SelectValue placeholder="Pilih gudang" />
                                                    <ChevronDown className="h-4 w-4 ml-auto opacity-50" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    {warehouses.map((warehouse) => (
                                                        <SelectItem key={warehouse.id} value={warehouse.id.toString()} className="rounded-lg">
                                                            {warehouse.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.warehouseId && (
                                        <p className="text-sm text-red-500">{errors.warehouseId.message}</p>
                                    )}
                                </div>

                                {/* SPK */}
                                <div className="space-y-3">
                                    <Label htmlFor="spkId" className="text-sm font-medium flex items-center gap-2">
                                        <FileCheck className="h-4 w-4 text-cyan-600" />
                                        SPK (Opsional)
                                    </Label>
                                    <Controller
                                        name="spkId"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                value={field.value || "_none"}
                                                onValueChange={(value) => {
                                                    field.onChange(value === "_none" ? "" : value);
                                                    // Auto-populate projectId from selected SPK
                                                    if (value !== "_none") {
                                                        const selectedSpk = spkList.find(spk => spk.id === value);
                                                        const projectId = selectedSpk?.salesOrder?.project?.id;
                                                        if (projectId) {
                                                            setValue("projectId", projectId);
                                                            setSelectedProjectName(selectedSpk?.salesOrder?.project?.name || selectedSpk?.salesOrder?.projectName || "");
                                                        }
                                                    } else {
                                                        setSelectedProjectName("");
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="w-full h-12 border-gray-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl">
                                                    <SelectValue placeholder="Pilih SPK">
                                                        {/* Show SPK number from initialData when spkList is not loaded */}
                                                        {field.value && field.value !== "_none" && (
                                                            spkList.find(spk => spk.id === field.value)?.spkNumber ||
                                                            initialData.SPK?.spkNumber ||
                                                            "Loading..."
                                                        )}
                                                    </SelectValue>
                                                    <ChevronDown className="h-4 w-4 ml-auto opacity-50" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="_none" className="rounded-lg text-muted-foreground">
                                                        Tidak ada SPK
                                                    </SelectItem>
                                                    {/* Show initialData.SPK if not in spkList */}
                                                    {initialData.SPK && !spkList.some(spk => spk.id === initialData.SPK?.id) && (
                                                        <SelectItem key={initialData.SPK.id} value={initialData.SPK.id} className="rounded-lg">
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{initialData.SPK.spkNumber}</span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {initialData.project?.name || "Proyek"}
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    )}
                                                    {spkList.map((spk) => (
                                                        <SelectItem key={spk.id} value={spk.id} className="rounded-lg">
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{spk.spkNumber}</span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {spk.salesOrder?.project?.name || spk.salesOrder?.projectName || spk.salesOrder?.soNumber}
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>

                                {/* Project (disabled, auto-populated from SPK) */}
                                <div className="space-y-3">
                                    <Label htmlFor="projectId" className="text-sm font-medium flex items-center gap-2">
                                        <Briefcase className="h-4 w-4 text-amber-600" />
                                        Proyek
                                    </Label>
                                    <Input
                                        value={selectedProjectName}
                                        disabled
                                        placeholder="Pilih SPK untuk mengisi proyek"
                                        className="w-full h-12 border-gray-300/80 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                                    />
                                </div>

                                {/* Payment Term */}
                                <div className="space-y-3">
                                    <Label htmlFor="paymentTerm" className="text-sm font-medium flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-indigo-600" />
                                        Termin Pembayaran
                                    </Label>
                                    <Controller
                                        name="paymentTerm"
                                        control={control}
                                        render={({ field }) => (
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <SelectTrigger className="w-full h-12 border-gray-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl">
                                                    <SelectValue placeholder="Pilih termin pembayaran" />
                                                    <ChevronDown className="h-4 w-4 ml-auto opacity-50" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="CASH" className="rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            <DollarSign className="h-4 w-4 text-emerald-600" />
                                                            <span>Tunai</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="COD" className="rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            <Truck className="h-4 w-4 text-blue-600" />
                                                            <span>Cash on Delivery</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="NET_7" className="rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            <CalendarIcon className="h-4 w-4 text-purple-600" />
                                                            <span>Net 7 Hari</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="NET_14" className="rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            <CalendarIcon className="h-4 w-4 text-orange-600" />
                                                            <span>Net 14 Hari</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="NET_30" className="rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            <CalendarIcon className="h-4 w-4 text-indigo-600" />
                                                            <span>Net 30 Hari</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="DP_PERCENTAGE" className="rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            <Percent className="h-4 w-4 text-pink-600" />
                                                            <span>Down Payment (%)</span>
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>

                                {/* PO Number */}
                                <div className="space-y-3">
                                    <Label htmlFor="poNumber" className="text-sm font-medium flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-gray-500" />
                                        Nomor PO <span className="text-red-500">*</span>
                                    </Label>
                                    <Controller
                                        name="poNumber"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                {...field}
                                                placeholder="PO-001/2024"
                                                className={cn(
                                                    "h-12 border-gray-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl",
                                                    errors.poNumber && "border-red-500"
                                                )}
                                            />
                                        )}
                                    />
                                    {errors.poNumber && (
                                        <p className="text-sm text-red-500">{errors.poNumber.message}</p>
                                    )}
                                </div>

                                {/* PO Date */}
                                <div className="space-y-3">
                                    <Label htmlFor="poDate" className="text-sm font-medium">
                                        Tanggal PO <span className="text-red-500">*</span>
                                    </Label>
                                    <Controller
                                        name="poDate"
                                        control={control}
                                        render={({ field }) => (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full h-12 justify-start text-left font-normal border-gray-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl hover:bg-gray-50/50 dark:hover:bg-gray-800",
                                                            !field.value && "text-muted-foreground",
                                                            errors.poDate && "border-red-500"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-3 h-4 w-4" />
                                                        {field.value ? (
                                                            format(field.value, "dd MMMM yyyy", { locale: id })
                                                        ) : (
                                                            <span>Pilih tanggal</span>
                                                        )}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        initialFocus
                                                        locale={id}
                                                        className="rounded-xl border"
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        )}
                                    />
                                    {errors.poDate && (
                                        <p className="text-sm text-red-500">{errors.poDate.message}</p>
                                    )}
                                </div>

                                {/* Delivery Date */}
                                <div className="space-y-3">
                                    <Label htmlFor="deliveryDate" className="text-sm font-medium">
                                        Tanggal Pengiriman <span className="text-red-500">*</span>
                                    </Label>
                                    <Controller
                                        name="deliveryDate"
                                        control={control}
                                        render={({ field }) => (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full h-12 justify-start text-left font-normal border-gray-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl hover:bg-gray-50/50 dark:hover:bg-gray-800",
                                                            !field.value && "text-muted-foreground",
                                                            errors.deliveryDate && "border-red-500"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-3 h-4 w-4" />
                                                        {field.value ? (
                                                            format(field.value, "dd MMMM yyyy", { locale: id })
                                                        ) : (
                                                            <span>Pilih tanggal</span>
                                                        )}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        initialFocus
                                                        locale={id}
                                                        className="rounded-xl border"
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        )}
                                    />
                                    {errors.deliveryDate && (
                                        <p className="text-sm text-red-500">{errors.deliveryDate.message}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Items Section Card */}
                    <Card className="border border-gray-200/80 dark:border-gray-800 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                        <CardHeader className="border-b border-gray-200/50 dark:border-gray-800">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <GradientIcon icon={Package} size={24} />
                                    <div>
                                        <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent dark:from-gray-100 dark:to-gray-400">
                                            Item Produk
                                        </CardTitle>
                                        <CardDescription className="text-gray-500">
                                            Tambahkan produk yang akan dipesan
                                        </CardDescription>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    onClick={addItem}
                                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white dark:text-black shadow-md hover:shadow-lg transition-all duration-300"
                                >
                                    <Plus className="h-4 w-4" />
                                    Tambah Item
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {fields.length > 0 ? (
                                <div className="overflow-hidden border border-gray-200/50 rounded-xl">
                                    <Table>
                                        <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-900">
                                            <TableRow className="dark:border-gray-800">
                                                <TableHead className="font-semibold text-gray-700 dark:text-gray-300 py-4">Produk</TableHead>
                                                <TableHead className="font-semibold text-gray-700 dark:text-gray-300 py-4">Kuantitas</TableHead>
                                                <TableHead className="font-semibold text-gray-700 dark:text-gray-300 py-4">Harga Satuan</TableHead>
                                                <TableHead className="font-semibold text-gray-700 dark:text-gray-300 py-4">Satuan</TableHead>
                                                <TableHead className="font-semibold text-gray-700 dark:text-gray-300 py-4">Total</TableHead>
                                                <TableHead className="font-semibold text-gray-700 dark:text-gray-300 py-4 w-[100px]">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {fields.map((field, index) => (
                                                <POItemRow
                                                    key={field.id}
                                                    index={index}
                                                    item={field}
                                                    error={errors.items?.[index]}
                                                    control={control}
                                                    allProducts={products}
                                                    selectedProductIds={selectedProductIds}
                                                    onProductSelect={handleProductSelect}
                                                    onQuantityChange={handleQuantityChange}
                                                    onPriceChange={handlePriceChange}
                                                    onRemove={removeItem}
                                                />
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <Card className="p-12 text-center border-2 border-dashed border-gray-300/50 bg-gradient-to-br from-gray-50/50 to-gray-100/30 rounded-2xl">
                                    <div className="relative mx-auto w-20 h-20 mb-6">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full blur-md"></div>
                                        <div className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-4 rounded-full shadow-lg">
                                            <Package className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                                        </div>
                                    </div>
                                    <p className="text-lg font-medium text-gray-600 mb-2">
                                        Belum ada item produk
                                    </p>
                                    <p className="text-gray-400 mb-6">
                                        Klik "Tambah Item" untuk menambahkan produk pertama
                                    </p>
                                    <Button
                                        type="button"
                                        onClick={addItem}
                                        className="rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white dark:text-black shadow-md hover:shadow-lg transition-all duration-300"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Tambah Item Pertama
                                    </Button>
                                </Card>
                            )}

                            {errors.items && fields.length === 0 && (
                                <div className="mt-4 p-4 bg-gradient-to-r from-red-50/50 to-red-100/30 border border-red-200/50 rounded-xl">
                                    <p className="text-sm text-red-600 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" />
                                        <span className="font-semibold">Perhatian:</span> Minimal 1 item produk diperlukan
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Notes Section */}
                    <Card className="border border-gray-200/80 dark:border-gray-800 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                        <CardHeader className="border-b border-gray-200/50">
                            <div className="flex items-center gap-3">
                                <GradientIcon icon={FileText} size={24} />
                                <div>
                                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent dark:text-white">
                                        Catatan Tambahan
                                    </CardTitle>
                                    <CardDescription className="text-gray-500">
                                        Tambahkan catatan atau instruksi khusus untuk PO ini
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <Controller
                                name="notes"
                                control={control}
                                render={({ field }) => (
                                    <Textarea
                                        {...field}
                                        placeholder="Contoh: Mohon produk dikirim dengan packaging yang baik, sertakan invoice, dll..."
                                        className="min-h-[120px] resize-none border-gray-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl"
                                    />
                                )}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Summary & Actions */}
                <div className="space-y-6">
                    {/* Summary Card */}
                    <Card className="border border-gray-200 dark:border-gray-800 shadow-xl rounded-2xl overflow-hidden bg-white dark:bg-gray-900 sticky top-6">
                        <CardHeader className="border-b border-gray-200/50 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <GradientIcon icon={Calculator} size={24} />
                                <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent dark:from-gray-100 dark:to-gray-400">
                                    Ringkasan PO
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <TotalsSummary control={control} fieldsCount={fields.length} />
                        </CardContent>
                    </Card>

                    {/* Actions Card */}
                    <Card className="border border-gray-200/80 dark:border-gray-800 shadow-xl rounded-2xl overflow-hidden bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                        <CardHeader className="border-b border-gray-200/50 dark:border-gray-800">
                            <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent dark:from-gray-100 dark:to-gray-400">
                                Aksi
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleReset}
                                    className="w-full h-12 flex items-center justify-center gap-2 border-gray-300/80 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50/50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 rounded-xl transition-all duration-300"
                                    disabled={isSubmitting}
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Reset ke Data Asli
                                </Button>

                                <div className="space-y-3">
                                    <Button
                                        type="submit"
                                        className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white dark:text-black font-medium shadow-md hover:shadow-lg transition-all duration-300"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center gap-2">
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                Memproses...
                                            </div>
                                        ) : (
                                            "Simpan Perubahan"
                                        )}
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={onCancel}
                                        className="w-full h-12 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-300"
                                        disabled={isSubmitting}
                                    >
                                        Batal
                                    </Button>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200/50">
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    <span className="font-medium">Status saat ini:</span>{" "}
                                    <span className="font-semibold">{initialData.status}</span>
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                    Pastikan semua data sudah benar sebelum menyimpan perubahan.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Info Card */}
                    <Card className="border border-blue-100/50 dark:border-blue-900/30 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-gray-900">
                        <CardContent className="p-5">
                            <div className="flex items-start gap-3">
                                <div className="rounded-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900 dark:to-blue-800 p-2 shadow-sm">
                                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">
                                        Informasi Status
                                    </p>
                                    <p className="text-xs text-blue-600/90 dark:text-blue-400 leading-relaxed">
                                        PO dengan status "Dikirim" atau "Disetujui" tidak dapat diubah.
                                        Pastikan status masih dalam tahap "Draft" atau "Pending" untuk melakukan perubahan.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Hidden submit button */}
            <button type="submit" className="hidden" />
        </form>
    );
}