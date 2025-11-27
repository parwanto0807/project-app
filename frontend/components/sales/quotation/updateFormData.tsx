// components/sales/quotation/updateFormData.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import {
    Plus,
    Trash2,
    Calendar,
    User,
    FileText,
    Percent,
    DollarSign,
    Package,
    CreditCard,
    ChevronsUpDown,
    Check,
    Search,
} from 'lucide-react';
import {
    LineType,
    CreateQuotationRequest,
    Customer,
    Product,
    Tax,
    PaymentTerm,
    QuotationLine,
    DiscountType,
    QuotationStatus,
    QuotationApiResponse,
} from '@/types/quotation';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { SalesOrder } from '@/schemas';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface UpdateQuotationFormProps {
    customers: Customer[];
    products: Product[];
    taxes: Tax[];
    salesOrders: SalesOrder[];
    paymentTerms: PaymentTerm[];
    onSubmit: (data: CreateQuotationRequest) => Promise<void>;
    // returnUrl: string;
    // highlightId: string | null;
    // highlightStatus: string | null;
    // page: number;
    isLoading?: boolean;
    initialData?: QuotationApiResponse;
    isUpdate?: boolean;
}

// Type untuk form data
interface FormData {
    customerId: string;
    quotationDate: string;
    quotationNumber: string;
    currency: string;
    exchangeRate: number;
    status: QuotationStatus;
    validFrom: string;
    validUntil: string;
    paymentTermId: string;
    discountType: DiscountType;
    discountValue: number;
    taxInclusive: boolean;
    otherCharges: number;
    notes: string;
    preparedBy: string;
    lines: Array<{
        productId: string;
        description: string;
        qty: number;
        uom: string;
        unitPrice: number;
        lineDiscountType: DiscountType;
        lineDiscountValue: number;
        taxId: string;
        lineType: LineType;
    }>;
}

// Definisikan tipe untuk item state
interface ProductItemState {
    productSearchOpen: boolean;
    productSearchQuery: string;
}

export const UpdateQuotationForm: React.FC<UpdateQuotationFormProps> = ({
    customers,
    products,
    taxes,
    paymentTerms,
    onSubmit,
    isLoading = false,
    // returnUrl,
    // page,
    // highlightId,
    // highlightStatus,
    initialData,
    isUpdate = false
}) => {
    const router = useRouter();
    const [itemState, setItemState] = useState<{ [key: number]: ProductItemState }>({});

    // React Hook Form initialization
    const {
        control,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors, isValid }
    } = useForm<FormData>({
        defaultValues: {
            customerId: "",
            quotationNumber: "",
            currency: "IDR",
            exchangeRate: 1,
            status: QuotationStatus.DRAFT,
            validFrom: "",
            validUntil: "",
            paymentTermId: "",
            discountType: DiscountType.PERCENT,
            discountValue: 0,
            taxInclusive: false,
            otherCharges: 0,
            notes: "",
            preparedBy: "",
            lines: [{
                productId: "",
                description: "",
                qty: 1,
                uom: "",
                unitPrice: 0,
                lineDiscountType: DiscountType.PERCENT,
                lineDiscountValue: 0,
                taxId: "",
                lineType: LineType.PRODUCT
            }]
        },
        mode: "onChange"
    });

    // Field array untuk lines
    const { fields, append, remove } = useFieldArray({
        control,
        name: "lines"
    });

    // Watch form values untuk real-time calculations
    const watchedLines = watch("lines");
    const watchedDiscountType = watch("discountType");
    const watchedDiscountValue = watch("discountValue");
    const watchedOtherCharges = watch("otherCharges");
    const watchedTaxInclusive = watch("taxInclusive");
    // const watchedCustomerId = watch("customerId");

    // Function untuk update item state
    const updateItemState = (index: number, newState: Partial<ProductItemState>) => {
        setItemState(prev => ({
            ...prev,
            [index]: {
                ...prev[index],
                ...newState
            }
        }));
    };

    // Function untuk filter produk
    const filteredProducts = (index: number) => {
        const query = itemState[index]?.productSearchQuery || '';
        if (!query) return products;

        return products.filter(product =>
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.code?.toLowerCase().includes(query.toLowerCase())
        );
    };

    // Effect untuk load initial data
    useEffect(() => {
        if (initialData?.data) {
            const quotationData = initialData.data;

            const formatDate = (date: string | Date | null): string => {
                if (!date) return '';
                try {
                    const dateObj = new Date(date);
                    return dateObj.toISOString().split('T')[0];
                } catch {
                    return '';
                }
            };

            const formattedData: FormData = {
                customerId: quotationData.customerId || "",
                quotationDate: formatDate(quotationData.quotationDate ?? null), // Tambahkan quotationDate
                quotationNumber: quotationData.quotationNumber || "",
                currency: quotationData.currency || "IDR",
                exchangeRate: Number(quotationData.exchangeRate) || 1,
                status: (quotationData.status as QuotationStatus) || QuotationStatus.DRAFT,
                validFrom: formatDate(quotationData.validFrom ?? null),
                validUntil: formatDate(quotationData.validUntil ?? null),
                paymentTermId: quotationData.paymentTermId || "",
                discountType: quotationData.discountType as DiscountType || DiscountType.PERCENT,
                discountValue: Number(quotationData.discountValue) || 0,
                taxInclusive: Boolean(quotationData.taxInclusive) || false,
                otherCharges: Number(quotationData.otherCharges) || 0,
                notes: quotationData.notes || "",
                preparedBy: quotationData.preparedBy || "",
                lines: quotationData.lines?.map((line: QuotationLine) => ({
                    productId: line.productId || "",
                    description: line.description || "",
                    qty: Number(line.qty) || 1,
                    uom: line.uom || "",
                    unitPrice: Number(line.unitPrice) || 0,
                    lineDiscountType: (line.lineDiscountType as DiscountType) || DiscountType.PERCENT,
                    lineDiscountValue: Number(line.lineDiscountValue) || 0,
                    taxId: line.taxId || "",
                    lineType: line.lineType || LineType.PRODUCT
                })) || [{
                    productId: "",
                    description: "",
                    qty: 1,
                    uom: "",
                    unitPrice: 0,
                    lineDiscountType: DiscountType.PERCENT,
                    lineDiscountValue: 0,
                    taxId: "",
                    lineType: LineType.PRODUCT
                }]
            };

            reset(formattedData);
        }
    }, [initialData, reset]);

    const formatDateTimeForSchema = (dateString: string): string => {
        if (!dateString) return new Date().toISOString();

        try {
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
        } catch {
            return new Date().toISOString();
        }
    };

    // Handler untuk product selection
    const handleProductSelect = (index: number, productId: string) => {
        if (productId === "") {
            // Reset line jika no product selected
            setValue(`lines.${index}.productId`, "");
            setValue(`lines.${index}.description`, "");
            setValue(`lines.${index}.unitPrice`, 0);
            setValue(`lines.${index}.uom`, "");
            return;
        }

        const product = products.find(p => p.id === productId);
        if (product) {
            setValue(`lines.${index}.productId`, product.id);
            setValue(`lines.${index}.description`, product.name || "");
            setValue(`lines.${index}.unitPrice`, product.price || 0);
            setValue(`lines.${index}.uom`, product.uom || "");
        }
    };

    // Calculate totals
    const calculateLineTotal = (line: FormData['lines'][0]): number => {
        const quantity = line.qty || 0;
        const unitPrice = line.unitPrice || 0;
        const discount = line.lineDiscountValue || 0;

        let subtotal = quantity * unitPrice;

        if (line.lineDiscountType === DiscountType.PERCENT) {
            subtotal -= subtotal * (discount / 100);
        } else {
            subtotal -= discount;
        }

        return Math.max(0, subtotal);
    };

    const calculateSubtotal = (): number => {
        return (watchedLines || []).reduce((total, line) => total + calculateLineTotal(line), 0);
    };

    const calculateHeaderDiscount = (subtotal: number): number => {
        const discount = watchedDiscountValue || 0;

        if (watchedDiscountType === DiscountType.PERCENT) {
            return subtotal * (discount / 100);
        } else {
            return discount;
        }
    };

    const calculateTotal = (): number => {
        const subtotal = calculateSubtotal();
        const discount = calculateHeaderDiscount(subtotal);
        const otherCharges = watchedOtherCharges || 0;

        const total = subtotal - discount + otherCharges;

        return Math.max(0, total);
    };

    const calculateTaxTotal = (): number => {
        if (watchedTaxInclusive) {
            const subtotal = calculateSubtotal();
            const discount = calculateHeaderDiscount(subtotal);
            const afterDiscount = subtotal - discount;
            return afterDiscount * 0.1;
        }
        return 0;
    };

    const onSubmitForm = async (data: FormData) => {
        // Hitung nilai yang diperlukan
        const subtotal = calculateSubtotal();
        const taxTotal = calculateTaxTotal();
        const total = calculateTotal();

        // Convert FormData ke CreateQuotationRequest
        const submitData: CreateQuotationRequest = {
            ...data,
            quotationDate: data.quotationDate
                ? formatDateTimeForSchema(data.quotationDate)
                : new Date().toISOString(), // Langsung gunakan toISOString()
            paymentTermId: data.paymentTermId || null,
            discountType: data.discountType,
            status: data.status,
            validFrom: data.validFrom ? formatDateTimeForSchema(data.validFrom) : null,
            validUntil: data.validUntil ? formatDateTimeForSchema(data.validUntil) : null,
            subtotal: subtotal,
            taxTotal: taxTotal,
            total: total,
            lines: data.lines.map(line => ({
                ...line,
                qty: Number(line.qty),
                unitPrice: Number(line.unitPrice),
                lineDiscountValue: Number(line.lineDiscountValue),
                lineSubtotal: calculateLineTotal(line),
                lineDiscountType: line.lineDiscountType,
                lineType: line.lineType
            }))
        };
        await onSubmit(submitData);
    };

    // Get quotation number untuk display di header
    const getDisplayQuotationNumber = (): string => {
        return initialData?.data?.quotationNumber || "";
    };

    // Helper function untuk calculate line subtotal
    const calculateLineSubtotal = (line: FormData['lines'][0]): number => {
        return calculateLineTotal(line);
    };

    // Helper function untuk calculate form subtotal
    const calculateFormSubtotal = (): number => {
        return calculateSubtotal();
    };

    const formatDisplayDate = (dateString: string): string => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch {
            return '-';
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 bg-white dark:bg-slate-900 dark:text-white rounded-lg shadow-sm">
            {/* Header */}
            <div className="border-b border-gray-200 pb-4 mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <h1 className="text-2xl font-bold">
                        {isUpdate ? 'Update Quotation' : 'Create New Quotation'}
                        {getDisplayQuotationNumber() && (
                            <span className="text-lg font-normal text-gray-600 ml-2">
                                ({getDisplayQuotationNumber()})
                            </span>
                        )}
                    </h1>
                </div>
                <p className="text-gray-600">
                    {isUpdate
                        ? 'Update the quotation details below'
                        : 'Fill in the details below to create a new quotation'}
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
                {/* Customer & Basic Info Section */}
                <Card className="bg-gradient-to-r from-primary/5 to-blue-100 dark:from-slate-800 dark:to-slate-900 border-0">
                    <CardHeader className="border-b border-cyan-300 dark:border-gray-700 px-4">
                        <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-blue-600" />
                            <CardTitle className="text-lg font-semibold">Customer & Basic Information</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                            {/* Customer Selection */}
                            <div className="md:col-span-3 space-y-2">
                                <Label htmlFor="customer">
                                    Customer <span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="customerId"
                                    control={control}
                                    rules={{ required: "Customer is required" }}
                                    render={({ field }) => (
                                        <div className="space-y-1">
                                            <Select
                                                key={field.value || 'empty'} // Force re-render when value changes
                                                value={field.value}
                                                onValueChange={field.onChange}
                                            >
                                                <SelectTrigger className="bg-white dark:bg-gray-800 dark:text-white">
                                                    <SelectValue placeholder="Select Customer" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-gray-800 dark:text-white">
                                                    {customers.map((customer) => (
                                                        <SelectItem
                                                            key={customer.id}
                                                            value={customer.id}
                                                            className="dark:text-white"
                                                        >
                                                            {customer.code} - {customer.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.customerId && (
                                                <p className="text-sm text-red-600">{errors.customerId.message}</p>
                                            )}
                                        </div>
                                    )}
                                />
                            </div>

                            {/* Currency */}
                            <div className="md:col-span-1 space-y-2">
                                <Label htmlFor="currency">Currency</Label>
                                <Controller
                                    name="currency"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger className="bg-white dark:bg-gray-800 dark:text-white">
                                                <SelectValue placeholder="Select Currency" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white dark:bg-gray-800 dark:text-white">
                                                <SelectItem value="IDR">IDR - Indonesian Rupiah</SelectItem>
                                                <SelectItem value="USD">USD - US Dollar</SelectItem>
                                                <SelectItem value="SGD">SGD - Singapore Dollar</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>

                            {/* Exchange Rate */}
                            <div className="space-y-2">
                                <Label htmlFor="exchangeRate">Exchange Rate</Label>
                                <Controller
                                    name="exchangeRate"
                                    control={control}
                                    rules={{
                                        required: "Exchange rate is required",
                                        min: { value: 0, message: "Exchange rate must be positive" }
                                    }}
                                    render={({ field }) => (
                                        <div className="space-y-1">
                                            <Input
                                                {...field}
                                                type="number"
                                                step="0.0001"
                                                min="0"
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                                                className="bg-white dark:bg-gray-800 dark:text-white"
                                            />
                                            {errors.exchangeRate && (
                                                <p className="text-sm text-red-600">{errors.exchangeRate.message}</p>
                                            )}
                                        </div>
                                    )}
                                />
                            </div>

                            {/* Payment Term */}
                            <div className="space-y-2">
                                <Label htmlFor="paymentTerm">Payment Term</Label>
                                <Controller
                                    name="paymentTermId"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value || ""}
                                            onValueChange={(value) => field.onChange(value === "no-payment-term" ? "" : value)}
                                        >
                                            <SelectTrigger className="bg-white dark:bg-gray-800 dark:text-white">
                                                <SelectValue placeholder="Select Payment Term" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white dark:bg-gray-800 dark:text-white">
                                                <SelectItem value="no-payment-term">Select Payment Term</SelectItem>
                                                {paymentTerms.map((term) => (
                                                    <SelectItem key={term.id} value={term.id}>
                                                        {term.code} - {term.name} ({term.dueDays} days)
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="paymentTerm">Status</Label>
                                <Controller
                                    name="status"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger className="bg-white dark:bg-gray-800 dark:text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white dark:bg-gray-800 dark:text-white">
                                                <SelectItem value={QuotationStatus.DRAFT}>Draft</SelectItem>
                                                <SelectItem value={QuotationStatus.SENT}>Sent</SelectItem>
                                                <SelectItem value={QuotationStatus.APPROVED}>Approved</SelectItem>
                                                <SelectItem value={QuotationStatus.REJECTED}>Rejected</SelectItem>
                                                <SelectItem value={QuotationStatus.EXPIRED}>Expired</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Validity Period Card */}
                <Card className="bg-gradient-to-r from-primary/5 to-blue-100 dark:from-slate-800 dark:to-slate-900 border-0">
                    <CardHeader className="border-b border-cyan-300 dark:border-gray-700 px-4">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-green-600" />
                            <CardTitle className="text-lg font-semibold">Quotation Dates</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="px-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Quotation Date Field */}
                            <div className="space-y-2">
                                <Label htmlFor="quotationDate" className="flex items-center gap-1">
                                    Quotation Date
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="quotationDate"
                                    control={control}
                                    rules={{ required: "Quotation date is required" }}
                                    defaultValue="" // Tambahkan defaultValue
                                    render={({ field, fieldState }) => (
                                        <div>
                                            <Input
                                                {...field}
                                                value={field.value || ""} // Pastikan selalu string
                                                type="date"
                                                className={`bg-white dark:bg-gray-800 dark:text-white ${fieldState.error ? "border-red-500" : ""
                                                    }`}
                                            />
                                            {fieldState.error && (
                                                <p className="text-red-500 text-xs mt-1">{fieldState.error.message}</p>
                                            )}
                                        </div>
                                    )}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="validFrom">Valid From</Label>
                                <Controller
                                    name="validFrom"
                                    control={control}
                                    defaultValue="" // Tambahkan defaultValue
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            value={field.value || ""} // Pastikan selalu string
                                            type="date"
                                            className="bg-white dark:bg-gray-800 dark:text-white"
                                        />
                                    )}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="validUntil">Valid Until</Label>
                                <Controller
                                    name="validUntil"
                                    control={control}
                                    defaultValue="" // Tambahkan defaultValue
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            value={field.value || ""} // Pastikan selalu string
                                            type="date"
                                            className="bg-white dark:bg-gray-800 dark:text-white"
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        {/* Validation summary */}
                        {watch("quotationDate") && (watch("validFrom") || watch("validUntil")) && (
                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    Quotation akan diterbitkan pada <strong>{formatDisplayDate(watch("quotationDate"))}</strong>
                                    {' '}dan berlaku dari <strong>{formatDisplayDate(watch("validFrom"))}</strong> hingga{' '}
                                    <strong>{formatDisplayDate(watch("validUntil"))}</strong>
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quotation Items Section */}
                <Card className="bg-gradient-to-r from-primary/5 to-blue-100 dark:from-slate-800 dark:to-slate-900 border-0">
                    <CardHeader className="border-b border-cyan-300 dark:border-gray-700 px-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Package className="w-5 h-5 text-purple-600" />
                                <CardTitle className="text-lg font-semibold">Quotation Items</CardTitle>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-6 space-y-2">
                        {fields.map((field, index) => (
                            <Card key={field.id} className="border-2">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-4 h-4 text-gray-600" />
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">Item {index + 1}</span>
                                                <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
                                                    {field.lineType === LineType.PRODUCT ? 'Product' :
                                                        field.lineType === LineType.SERVICE ? 'Service' : 'Custom'}
                                                </Badge>
                                            </div>
                                        </div>
                                        {fields.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => remove(index)}
                                                className="h-8 w-8 text-red-600 hover:bg-red-50"
                                                title="Remove item"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Line Type */}
                                    <div className="lg:col-span-1 space-y-2">
                                        <Label>Type</Label>
                                        <Controller
                                            name={`lines.${index}.lineType`}
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                >
                                                    <SelectTrigger className="bg-white dark:bg-gray-800 dark:text-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white dark:bg-gray-800 dark:text-white">
                                                        <SelectItem value={LineType.PRODUCT}>Product</SelectItem>
                                                        <SelectItem value={LineType.SERVICE}>Service</SelectItem>
                                                        <SelectItem value={LineType.CUSTOM}>Custom</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>

                                    {/* Product & Description */}
                                    <div className="grid grid-cols-1 lg:grid-cols-8 gap-4">
                                        {/* Product Selection */}
                                        <div className="lg:col-span-3 space-y-2">
                                            <Label>Product</Label>
                                            <div className="flex items-center gap-4 min-w-0 w-full">
                                                <Controller
                                                    name={`lines.${index}.productId`}
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Popover
                                                            open={itemState[index]?.productSearchOpen || false}
                                                            onOpenChange={(open) =>
                                                                updateItemState(index, {
                                                                    productSearchOpen: open,
                                                                    productSearchQuery: open ? "" : itemState[index]?.productSearchQuery || "",
                                                                })
                                                            }
                                                        >
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    role="combobox"
                                                                    className="flex-1 overflow-hidden truncate text-left justify-between bg-white dark:bg-gray-800 dark:text-white"
                                                                >
                                                                    <span className="truncate block">
                                                                        {field.value
                                                                            ? products.find((opt) => opt.id === field.value)?.name
                                                                            : `Pilih ${watch(`lines.${index}.lineType`) === LineType.PRODUCT ? "produk" : "service / jasa"}`}
                                                                    </span>
                                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                </Button>
                                                            </PopoverTrigger>

                                                            <PopoverContent className="w-full p-0 bg-white dark:bg-gray-800 dark:text-white">
                                                                <Command>
                                                                    <div className="flex items-center border-b px-3">
                                                                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                                                        <CommandInput
                                                                            placeholder={`Cari ${watch(`lines.${index}.lineType`) === LineType.PRODUCT ? "produk" : "jasa"}...`}
                                                                            value={itemState[index]?.productSearchQuery || ""}
                                                                            onValueChange={(value) =>
                                                                                updateItemState(index, { productSearchQuery: value })
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <CommandList>
                                                                        <CommandEmpty>
                                                                            {itemState[index]?.productSearchQuery
                                                                                ? "Tidak ditemukan"
                                                                                : "Tidak ada data"}
                                                                        </CommandEmpty>
                                                                        <CommandGroup>
                                                                            {filteredProducts(index).map((opt) => (
                                                                                <CommandItem
                                                                                    key={opt.id}
                                                                                    value={opt.name}
                                                                                    onSelect={() => {
                                                                                        field.onChange(opt.id);
                                                                                        handleProductSelect(index, opt.id);
                                                                                        updateItemState(index, {
                                                                                            productSearchOpen: false,
                                                                                            productSearchQuery: "",
                                                                                        });
                                                                                    }}
                                                                                    className="dark:text-white"
                                                                                >
                                                                                    <Check
                                                                                        className={cn(
                                                                                            "mr-2 h-4 w-4",
                                                                                            field.value === opt.id
                                                                                                ? "opacity-100"
                                                                                                : "opacity-0"
                                                                                        )}
                                                                                    />
                                                                                    {opt.name}
                                                                                </CommandItem>
                                                                            ))}
                                                                        </CommandGroup>
                                                                    </CommandList>
                                                                </Command>
                                                            </PopoverContent>
                                                        </Popover>
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div className="lg:col-span-5 space-y-2">
                                            <Label>Description</Label>
                                            <Controller
                                                name={`lines.${index}.description`}
                                                control={control}
                                                rules={{ required: "Description is required" }}
                                                render={({ field }) => (
                                                    <div className="space-y-1">
                                                        <Textarea
                                                            {...field}
                                                            placeholder="Item description..."
                                                            className="bg-white dark:bg-gray-800 dark:text-white"
                                                        />
                                                        {errors.lines?.[index]?.description && (
                                                            <p className="text-sm text-red-600">{errors.lines[index]?.description?.message}</p>
                                                        )}
                                                    </div>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {/* Quantity, UOM, Unit Price, Tax */}
                                    <div className="grid grid-cols-2 md:grid-cols-8 lg:grid-cols-8 gap-2">
                                        {/* Quantity */}
                                        <div className="space-y-2">
                                            <Label>Quantity</Label>
                                            <Controller
                                                name={`lines.${index}.qty`}
                                                control={control}
                                                rules={{
                                                    required: "Quantity is required",
                                                    min: { value: 0.01, message: "Quantity must be greater than 0" }
                                                }}
                                                render={({ field }) => (
                                                    <div className="space-y-1">
                                                        <Input
                                                            {...field}
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                            className="bg-white dark:bg-gray-800 dark:text-white"
                                                        />
                                                        {errors.lines?.[index]?.qty && (
                                                            <p className="text-sm text-red-600">{errors.lines[index]?.qty?.message}</p>
                                                        )}
                                                    </div>
                                                )}
                                            />
                                        </div>

                                        {/* UOM */}
                                        <div className="space-y-2">
                                            <Label>Unit</Label>
                                            <Controller
                                                name={`lines.${index}.uom`}
                                                control={control}
                                                render={({ field }) => (
                                                    <Input
                                                        {...field}
                                                        type="text"
                                                        placeholder="e.g., pcs, kg"
                                                        className="bg-white dark:bg-gray-800 dark:text-white"
                                                    />
                                                )}
                                            />
                                        </div>

                                        {/* Unit Price */}
                                        <div className="space-y-2">
                                            <Label>Unit Price</Label>
                                            <Controller
                                                name={`lines.${index}.unitPrice`}
                                                control={control}
                                                rules={{
                                                    required: "Unit price is required",
                                                    min: { value: 0, message: "Unit price must be positive" }
                                                }}
                                                render={({ field }) => (
                                                    <div className="space-y-1">
                                                        <Input
                                                            {...field}
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                            className="bg-white dark:bg-gray-800 dark:text-white"
                                                        />
                                                        {errors.lines?.[index]?.unitPrice && (
                                                            <p className="text-sm text-red-600">{errors.lines[index]?.unitPrice?.message}</p>
                                                        )}
                                                    </div>
                                                )}
                                            />
                                        </div>

                                        {/* Tax */}
                                        <div className="space-y-2">
                                            <Label>Tax</Label>
                                            <Controller
                                                name={`lines.${index}.taxId`}
                                                control={control}
                                                render={({ field }) => (
                                                    <Select
                                                        value={field.value || ""}
                                                        onValueChange={(value) => field.onChange(value === "no-tax" ? "" : value)}
                                                    >
                                                        <SelectTrigger className="bg-white dark:bg-gray-800 dark:text-white">
                                                            <SelectValue placeholder="No Tax" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white dark:bg-gray-800 dark:text-white">
                                                            <SelectItem value="no-tax">No Tax</SelectItem>
                                                            {taxes.map(tax => (
                                                                <SelectItem key={tax.id} value={tax.id}>
                                                                    {tax.code} ({tax.rate}%)
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        </div>

                                        {/* Discount */}
                                        <div className='md:col-span-4 space-y-2'>
                                            <div className="grid grid-cols-1 gap-4 pt-4 border-t">
                                                <div className="space-y-2">
                                                    <Label>Discount Type</Label>
                                                    <Controller
                                                        name={`lines.${index}.lineDiscountType`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <RadioGroup
                                                                value={field.value}
                                                                onValueChange={field.onChange}
                                                                className="flex gap-6"
                                                            >
                                                                <div className="flex items-center space-x-2">
                                                                    <RadioGroupItem value={DiscountType.PERCENT} id={`percent-${index}`} />
                                                                    <Label htmlFor={`percent-${index}`} className="flex items-center cursor-pointer">
                                                                        <Percent className="w-4 h-4 mr-1 text-gray-600" />
                                                                        Percent
                                                                    </Label>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <RadioGroupItem value={DiscountType.AMOUNT} id={`amount-${index}`} />
                                                                    <Label htmlFor={`amount-${index}`} className="flex items-center cursor-pointer">
                                                                        <DollarSign className="w-4 h-4 mr-1 text-gray-600" />
                                                                        Amount
                                                                    </Label>
                                                                </div>
                                                            </RadioGroup>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                            <div className="mt-4 space-y-2">
                                                <Label>Discount Value</Label>
                                                <Controller
                                                    name={`lines.${index}.lineDiscountValue`}
                                                    control={control}
                                                    rules={{ min: { value: 0, message: "Discount value cannot be negative" } }}
                                                    render={({ field }) => (
                                                        <div className="space-y-1">
                                                            <Input
                                                                {...field}
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                                className="bg-white dark:bg-gray-800 dark:text-white"
                                                            />
                                                            {errors.lines?.[index]?.lineDiscountValue && (
                                                                <p className="text-sm text-red-600">{errors.lines[index]?.lineDiscountValue?.message}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* SubTotal */}
                                    <div className="pt-4 border-t">
                                        <div className="flex justify-between items-center bg-amber-100 dark:bg-slate-600 px-4 py-3 rounded-lg">
                                            <Label className="text-base font-semibold">SubTotal Line</Label>
                                            <div className="text-lg font-bold text-blue-600 dark:text-white">
                                                {calculateLineSubtotal(watch(`lines.${index}`) || {
                                                    productId: "",
                                                    description: "",
                                                    qty: 1,
                                                    uom: "",
                                                    unitPrice: 0,
                                                    lineDiscountType: DiscountType.PERCENT,
                                                    lineDiscountValue: 0,
                                                    taxId: "",
                                                    lineType: LineType.PRODUCT
                                                }).toLocaleString('id-ID', {
                                                    style: 'currency',
                                                    currency: 'IDR',
                                                    minimumFractionDigits: 2
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </CardContent>
                    {/* Tombol Add Item */}
                    <div className='flex justify-end items-end'>
                        <Button
                            type="button"
                            onClick={() => append({
                                productId: "",
                                description: "",
                                qty: 1,
                                uom: "",
                                unitPrice: 0,
                                lineDiscountType: DiscountType.PERCENT,
                                lineDiscountValue: 0,
                                taxId: "",
                                lineType: LineType.PRODUCT
                            })}
                            className="flex items-center mx-6"
                        >
                            <Plus className="w-4 h-4" />
                            Add Item
                        </Button>
                    </div>
                </Card>

                {/* Discount & Charges Section */}
                <Card className="bg-gradient-to-r from-primary/5 to-blue-100 dark:from-slate-800 dark:to-slate-900 border-0">
                    <CardHeader className="border-b border-cyan-300 dark:border-gray-700 px-4">
                        <div className="flex items-center gap-3">
                            <Percent className="w-5 h-5 text-orange-600" />
                            <CardTitle className="text-lg font-semibold">Discount & Additional Charges</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="px-6">
                        <div className="grid grid-cols-1 md:grid-cols-10 lg:grid-cols-10 gap-6">
                            {/* Discount Type */}
                            <div className='md:col-span-1 lg:col-span-1 space-y-4'>
                                <Label>Discount Type</Label>
                                <Controller
                                    name="discountType"
                                    control={control}
                                    render={({ field }) => (
                                        <RadioGroup
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            className="flex gap-6"
                                        >
                                            <div className="flex items-center space-x-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                <RadioGroupItem
                                                    value={DiscountType.PERCENT}
                                                    id="header-percent"
                                                    className="text-orange-600 border-orange-300"
                                                />
                                                <Label htmlFor="header-percent" className="flex items-center cursor-pointer font-medium">
                                                    <Percent className="w-4 h-4 mr-2 text-orange-600" />
                                                    Percent
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                <RadioGroupItem
                                                    value={DiscountType.AMOUNT}
                                                    id="header-amount"
                                                    className="text-orange-600 border-orange-300"
                                                />
                                                <Label htmlFor="header-amount" className="flex items-center cursor-pointer font-medium">
                                                    <DollarSign className="w-4 h-4 mr-2 text-orange-600" />
                                                    Amount
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    )}
                                />
                            </div>

                            {/* Discount Value */}
                            <div className="lg:col-span-2 lg:col-start-4 space-y-4">
                                <Label>Discount Value</Label>
                                <Controller
                                    name="discountValue"
                                    control={control}
                                    rules={{ min: { value: 0, message: "Discount value cannot be negative" } }}
                                    render={({ field }) => (
                                        <div className="space-y-1">
                                            <Input
                                                {...field}
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                className="bg-white dark:bg-gray-800 dark:text-white"
                                            />
                                            {errors.discountValue && (
                                                <p className="text-sm text-red-600">{errors.discountValue.message}</p>
                                            )}
                                        </div>
                                    )}
                                />
                            </div>

                            <div className="md:col-span-2 lg:col-span-2">
                                {/* Other Charges */}
                                <div className="space-y-4">
                                    <Label>Other Charges</Label>
                                    <Controller
                                        name="otherCharges"
                                        control={control}
                                        rules={{ min: { value: 0, message: "Other charges cannot be negative" } }}
                                        render={({ field }) => (
                                            <div className="space-y-1">
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                    className="bg-white dark:bg-gray-800 dark:text-white"
                                                />
                                                {errors.otherCharges && (
                                                    <p className="text-sm text-red-600">{errors.otherCharges.message}</p>
                                                )}
                                            </div>
                                        )}
                                    />
                                </div>
                            </div>
                            {/* Tax Inclusive */}
                            <div className='md:col-span-2 lg:col-span-2 mt-4'>
                                <div className="flex items-center space-x-2 pt-6">
                                    <Controller
                                        name="taxInclusive"
                                        control={control}
                                        render={({ field }) => (
                                            <Checkbox
                                                id="taxInclusive"
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                className="bg-white dark:bg-gray-800 dark:text-black"
                                            />
                                        )}
                                    />
                                    <Label htmlFor="taxInclusive" className="flex items-center cursor-pointer">
                                        <CreditCard className="w-4 h-4 mr-1 text-orange-600" />
                                        Prices include tax
                                    </Label>
                                </div>
                            </div>
                        </div>

                        {/* Summary Section - Menampilkan perhitungan total */}
                        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Subtotal:</span>
                                    <span className="font-semibold">
                                        {calculateFormSubtotal().toLocaleString('id-ID', {
                                            style: 'currency',
                                            currency: 'IDR',
                                            minimumFractionDigits: 2
                                        })}
                                    </span>
                                </div>

                                {/* Discount Display */}
                                {(watchedDiscountValue || 0) > 0 && (
                                    <div className="flex justify-between items-center text-red-600">
                                        <span className="text-sm font-medium">
                                            Discount {watchedDiscountType === DiscountType.PERCENT ? `(${watchedDiscountValue}%)` : ''}:
                                        </span>
                                        <span className="font-semibold">
                                            -{calculateHeaderDiscount(calculateFormSubtotal()).toLocaleString('id-ID', {
                                                style: 'currency',
                                                currency: 'IDR',
                                                minimumFractionDigits: 2
                                            })}
                                        </span>
                                    </div>
                                )}

                                {/* Other Charges Display */}
                                {(watchedOtherCharges || 0) > 0 && (
                                    <div className="flex justify-between items-center text-green-600">
                                        <span className="text-sm font-medium">Other Charges:</span>
                                        <span className="font-semibold">
                                            +{(watchedOtherCharges || 0).toLocaleString('id-ID', {
                                                style: 'currency',
                                                currency: 'IDR',
                                                minimumFractionDigits: 2
                                            })}
                                        </span>
                                    </div>
                                )}

                                {/* Total */}
                                <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <span className="text-lg font-bold">Total:</span>
                                    <span className="text-lg font-bold text-primary">
                                        {calculateTotal().toLocaleString('id-ID', {
                                            style: 'currency',
                                            currency: 'IDR',
                                            minimumFractionDigits: 2
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Notes Section */}
                <Card className="bg-gradient-to-r from-primary/5 to-blue-100 dark:from-slate-800 dark:to-slate-900 border-0">
                    <CardHeader className="border-b border-cyan-300 dark:border-gray-700 px-4">
                        <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-gray-600" />
                            <CardTitle className="text-lg font-semibold">Additional Notes</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <Controller
                            name="notes"
                            control={control}
                            render={({ field }) => (
                                <Textarea
                                    {...field}
                                    placeholder="Enter any additional notes or terms for this quotation..."
                                    className="min-h-[120px] bg-white dark:bg-gray-800 dark:text-white"
                                />
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="flex justify-end gap-2 sticky bottom-4 bg-cyan-100 dark:bg-cyan-950 p-4 rounded-lg border shadow-sm">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isLoading}
                    >
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading || !isValid}
                        className="min-w-40 flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                {isUpdate ? 'Updating Quotation...' : 'Creating Quotation...'}
                            </>
                        ) : (
                            <>
                                <FileText className="w-5 h-5" />
                                {isUpdate ? 'Update Quotation' : 'Create Quotation'}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
};