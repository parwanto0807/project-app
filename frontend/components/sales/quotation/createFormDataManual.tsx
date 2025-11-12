// components/sales/quotation/manualCreateForm.tsx
"use client";

import React, { useState } from 'react';
import {
    Plus,
    Trash2,
    Calendar,
    User,
    FileText,
    Percent,
    DollarSign,
    Package,
    Truck,
    Settings,
    CreditCard,
    ChevronsUpDown,
    Check,
} from 'lucide-react';
import {
    QuotationStatus,
    LineType,
    DiscountType,
    CreateQuotationRequest,
    CreateQuotationLineRequest,
    Customer,
    Product,
    Tax,
    PaymentTerm,
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
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface ManualCreateQuotationFormProps {
    customers: Customer[];
    products: Product[];
    taxes: Tax[];
    paymentTerms: PaymentTerm[];
    onSubmit: (data: CreateQuotationRequest) => Promise<void>;
    isLoading?: boolean;
}

export const ManualCreateQuotationForm: React.FC<ManualCreateQuotationFormProps> = ({
    customers,
    products,
    taxes,
    paymentTerms,
    onSubmit,
    isLoading = false
}) => {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    // Helper functions
    const formatDateForInput = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [formData, setFormData] = useState<Omit<CreateQuotationRequest, 'lines'>>(() => {
        const today = new Date();
        const nextMonth = new Date(today.getTime());
        nextMonth.setDate(today.getDate() + 30);

        return {
            customerId: '',
            quotationDate: formatDateForInput(today),
            currency: 'IDR',
            exchangeRate: 1,
            status: QuotationStatus.DRAFT,
            validFrom: formatDateForInput(today),
            validUntil: formatDateForInput(nextMonth),
            paymentTermId: '',
            subtotal: 0,
            discountType: DiscountType.PERCENT,
            discountValue: 0,
            taxInclusive: false,
            taxTotal: 0,
            total: 0,
            otherCharges: 0,
            notes: '',
            preparedBy: '',
            autoGenerateNumber: true
        };
    });

    const [lines, setLines] = useState<CreateQuotationLineRequest[]>([
        {
            lineType: LineType.PRODUCT,
            productId: '',
            description: '',
            qty: 1,
            uom: '',
            unitPrice: 0,
            lineDiscountType: DiscountType.PERCENT,
            lineDiscountValue: 0,
            lineSubtotal: 0,
            taxId: ''
        }
    ]);

    const handleHeaderChange = (field: keyof typeof formData, value: string | number | boolean | null) => {
        setFormData(prev => ({
            ...prev,
            [field]: value === null ? '' : value
        }));
    };

    const handleLineChange = (index: number, field: keyof CreateQuotationLineRequest, value: string | number | LineType | DiscountType | null) => {
        const updatedLines = lines.map((line, i) => {
            if (i === index) {
                return {
                    ...line,
                    [field]: value === undefined ? '' : value
                };
            }
            return line;
        });
        setLines(updatedLines);
    };

    const addLine = () => {
        setLines(prev => [...prev, {
            lineType: LineType.PRODUCT,
            productId: null,
            description: '',
            qty: 1,
            uom: '',
            unitPrice: 0,
            lineDiscountType: DiscountType.PERCENT,
            lineDiscountValue: 0,
            lineSubtotal: 0,
            taxId: null
        }]);
    };

    const removeLine = (index: number) => {
        if (lines.length > 1) {
            setLines(prev => prev.filter((_, i) => i !== index));
        }
    };

    // Fungsi untuk menghitung subtotal dari semua line items
    const calculateFormSubtotal = () => {
        return lines.reduce((total, line) => {
            return total + calculateLineSubtotal(line);
        }, 0);
    };

    // Fungsi untuk menghitung subtotal per line item
    const calculateLineSubtotal = (line: CreateQuotationLineRequest) => {
        const quantity = line.qty || 0;
        const unitPrice = line.unitPrice || 0;
        const discountValue = line.lineDiscountValue || 0;

        let subtotal = quantity * unitPrice;

        // Apply discount
        if (line.lineDiscountType === DiscountType.PERCENT) {
            subtotal -= subtotal * (discountValue / 100);
        } else if (line.lineDiscountType === DiscountType.AMOUNT) {
            subtotal -= discountValue;
        }

        return Math.max(0, subtotal);
    };

    // Fungsi untuk menghitung discount header
    const calculateHeaderDiscount = (subtotal: number) => {
        const discountValue = formData.discountValue || 0;

        if (formData.discountType === DiscountType.PERCENT) {
            return subtotal * (discountValue / 100);
        } else {
            return discountValue;
        }
    };

    // Fungsi untuk menghitung total
    const calculateTotal = () => {
        const subtotal = calculateFormSubtotal();
        const discountValue = formData.discountValue || 0;
        const otherCharges = formData.otherCharges || 0;
        const taxTotal = formData.taxTotal || 0;

        let total = subtotal;

        // Apply header discount
        if (formData.discountType === DiscountType.PERCENT) {
            total -= total * (discountValue / 100);
        } else {
            total -= discountValue;
        }

        // Add other charges
        total += otherCharges;

        // Add tax if not inclusive
        if (!formData.taxInclusive) {
            total += taxTotal;
        }

        return Math.max(0, total);
    };

    const handleProductChange = (index: number, productId: string) => {
        const safeProductId = productId === 'no-product' ? '' : productId;

        if (safeProductId === '') {
            setLines(prev => prev.map((line, i) =>
                i === index ? {
                    ...line,
                    productId: '',
                    description: '',
                    unitPrice: 0,
                    uom: ''
                } : line
            ));
            return;
        }

        const product = products.find(p => p.id === safeProductId);
        if (product) {
            setLines(prev => prev.map((line, i) =>
                i === index ? {
                    ...line,
                    productId: product.id,
                    description: product.name || '',
                    unitPrice: product.price || 0,
                    uom: product.uom || ''
                } : line
            ));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validasi quotation date harus diisi
        if (!formData.quotationDate) {
            alert('Please select a quotation date');
            return;
        }

        // Validasi dasar
        if (!formData.customerId) {
            alert('Please select a customer');
            return;
        }

        if (lines.length === 0) {
            alert('Please add at least one item');
            return;
        }

        // Validasi line items
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line.description?.trim()) {
                alert(`Item ${i + 1}: Description is required`);
                return;
            }
            if (line.qty <= 0) {
                alert(`Item ${i + 1}: Quantity must be greater than 0`);
                return;
            }
            if (line.unitPrice < 0) {
                alert(`Item ${i + 1}: Unit price cannot be negative`);
                return;
            }
            if ((line.lineDiscountValue ?? 0) < 0) {
                alert(`Item ${i + 1}: Discount value cannot be negative`);
                return;
            }
        }

        // Handle undefined case untuk formData fields
        if ((formData.discountValue ?? 0) < 0) {
            alert('Discount value cannot be negative');
            return;
        }

        if ((formData.otherCharges ?? 0) < 0) {
            alert('Other charges cannot be negative');
            return;
        }

        // Validasi tanggal: quotationDate tidak boleh lebih baru dari validUntil
        if (formData.quotationDate && formData.validUntil) {
            const quotationDate = new Date(formData.quotationDate);
            const validUntil = new Date(formData.validUntil);

            if (quotationDate > validUntil) {
                alert('Quotation date cannot be later than valid until date');
                return;
            }
        }

        // Validasi tanggal: quotationDate tidak boleh lebih lama dari validFrom
        if (formData.quotationDate && formData.validFrom) {
            const quotationDate = new Date(formData.quotationDate);
            const validFrom = new Date(formData.validFrom);

            if (quotationDate < validFrom) {
                alert('Quotation date cannot be earlier than valid from date');
                return;
            }
        }

        // Prepare data untuk submit
        const submitData: CreateQuotationRequest = {
            ...formData,
            quotationDate: formData.quotationDate,
            validFrom: formData.validFrom || null,
            validUntil: formData.validUntil || null,
            paymentTermId: formData.paymentTermId || null,
            notes: formData.notes || null,
            preparedBy: formData.preparedBy || null,
            lines: lines.map(line => ({
                ...line,
                productId: line.productId || null,
                taxId: line.taxId || null,
                qty: Number(line.qty),
                unitPrice: Number(line.unitPrice),
                lineDiscountValue: Number(line.lineDiscountValue),
                description: line.description?.trim() || ''
            })),
            discountValue: Number(formData.discountValue),
            otherCharges: Number(formData.otherCharges),
            exchangeRate: Number(formData.exchangeRate),
        };

        await onSubmit(submitData);
    };

    const getLineTypeIcon = (lineType: LineType) => {
        switch (lineType) {
            case LineType.PRODUCT: return <Package className="w-4 h-4 text-blue-600" />;
            case LineType.SERVICE: return <Settings className="w-4 h-4 text-green-600" />;
            case LineType.CUSTOM: return <Truck className="w-4 h-4 text-orange-600" />;
            default: return <FileText className="w-4 h-4 text-gray-600" />;
        }
    };

    const getLineTypeBadge = (lineType: LineType) => {
        switch (lineType) {
            case LineType.PRODUCT: return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">Product</Badge>;
            case LineType.SERVICE: return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">Service</Badge>;
            case LineType.CUSTOM: return <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">Freight</Badge>;
            default: return <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">Other</Badge>;
        }
    };

    const formatDisplayDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="max-w-7xl mx-auto p-4 bg-white dark:bg-slate-900 dark:text-white rounded-lg shadow-sm">
            {/* Header */}
            <div className="border-b border-gray-200 pb-4 mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <h1 className="text-2xl font-bold">Create Manual Quotation</h1>
                </div>
                <p className="text-gray-600">Fill in the details below to create a new quotation manually</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                                <Select
                                    value={formData.customerId}
                                    onValueChange={(value) => handleHeaderChange("customerId", value)}
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
                                                <span className="hidden md:inline">
                                                    {customer.name} - {customer.branch}
                                                </span>
                                                <span className="md:hidden">
                                                    {customer.branch}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Currency */}
                            <div className="md:col-span-1 space-y-2">
                                <Label htmlFor="currency">Currency</Label>
                                <Select
                                    value={formData.currency}
                                    onValueChange={(value) => handleHeaderChange("currency", value)}
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
                            </div>

                            {/* Exchange Rate */}
                            <div className="md:col-span-1 space-y-2">
                                <Label htmlFor="exchangeRate">Exchange Rate</Label>
                                <Input
                                    id="exchangeRate"
                                    type="number"
                                    step="0.0001"
                                    min="0"
                                    value={formData.exchangeRate}
                                    onChange={(e) =>
                                        handleHeaderChange("exchangeRate", parseFloat(e.target.value) || 1)
                                    }
                                    className="bg-white dark:bg-gray-800 dark:text-white"
                                />
                            </div>

                            {/* Payment Term */}
                            <div className="md:col-span-1 space-y-2">
                                <Label htmlFor="paymentTerm">Payment Term</Label>
                                <Select
                                    value={formData.paymentTermId || ""}
                                    onValueChange={(value) =>
                                        handleHeaderChange("paymentTermId", value || null)
                                    }
                                >
                                    <SelectTrigger className="bg-white dark:bg-gray-800 dark:text-white">
                                        <SelectValue placeholder="Select Payment Term" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-gray-800 dark:text-white">
                                        <SelectItem value="no-term">Select Payment Term</SelectItem>
                                        {paymentTerms.map((term) => (
                                            <SelectItem key={term.id} value={term.id}>
                                                {term.code} - {term.name} ({term.dueDays} days)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Validity Period Section */}
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
                                <Input
                                    id="quotationDate"
                                    type="date"
                                    value={formData.quotationDate || ''}
                                    onChange={(e) => handleHeaderChange('quotationDate', e.target.value || '')}
                                    className="bg-white dark:bg-gray-800 dark:text-white"
                                    required
                                />
                                <p className="text-xs text-gray-500">Date when quotation is issued</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="validFrom">Valid From</Label>
                                <Input
                                    id="validFrom"
                                    type="date"
                                    value={formData.validFrom || ''}
                                    onChange={(e) => handleHeaderChange('validFrom', e.target.value || '')}
                                    className="bg-white dark:bg-gray-800 dark:text-white"
                                />
                                <p className="text-xs text-gray-500">Start date of validity</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="validUntil">Valid Until</Label>
                                <Input
                                    id="validUntil"
                                    type="date"
                                    value={formData.validUntil || ''}
                                    onChange={(e) => handleHeaderChange('validUntil', e.target.value || '')}
                                    className="bg-white dark:bg-gray-800 dark:text-white"
                                />
                                <p className="text-xs text-gray-500">End date of validity</p>
                            </div>
                        </div>

                        {/* Validation message */}
                        {formData.quotationDate && formData.validFrom && formData.validUntil && (
                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    Quotation akan diterbitkan pada <strong>{formatDisplayDate(formData.quotationDate)}</strong>
                                    {' '} dan berlaku dari <strong>{formatDisplayDate(formData.validFrom)}</strong> hingga{' '}
                                    <strong>{formatDisplayDate(formData.validUntil)}</strong>
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
                            <Button
                                type="button"
                                onClick={addLine}
                                className="flex items-center gap-2"
                                variant="outline"
                            >
                                <Plus className="w-4 h-4" />
                                Add Item
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="px-6 space-y-2">
                        {lines.map((line, index) => (
                            <Card key={index} className="border-2">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {getLineTypeIcon(line.lineType)}
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">Item {index + 1}</span>
                                                {getLineTypeBadge(line.lineType)}
                                            </div>
                                        </div>
                                        {lines.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeLine(index)}
                                                className="h-8 w-8 text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 lg:grid-cols-8 gap-4">
                                        {/* Line Type */}
                                        <div className="lg:col-span-1 space-y-2">
                                            <Label>Type</Label>
                                            <Select
                                                value={line.lineType}
                                                onValueChange={(value) => handleLineChange(index, 'lineType', value as LineType)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value={LineType.PRODUCT}>Product</SelectItem>
                                                    <SelectItem value={LineType.SERVICE}>Service</SelectItem>
                                                    <SelectItem value={LineType.CUSTOM}>Custom</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Product Selection */}
                                        <div className="lg:col-span-3 space-y-2">
                                            <Label>Product</Label>

                                            <Popover open={open} onOpenChange={setOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className="w-full justify-between"
                                                    >
                                                        {line.productId
                                                            ? products.find((p) => p.id === line.productId)?.name
                                                            : "Select Product"}
                                                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>

                                                <PopoverContent className="w-[350px] p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Search product..." />

                                                        {/* ✅ Tambah CommandList untuk support keyboard */}
                                                        <CommandList>
                                                            <CommandEmpty>No product found.</CommandEmpty>

                                                            <CommandGroup>
                                                                {products.map((product) => (
                                                                    <CommandItem
                                                                        key={product.id}
                                                                        value={product.name}
                                                                        onSelect={() => {
                                                                            handleProductChange(index, product.id);
                                                                            setOpen(false); // ✅ Tutup popover saat pilih, termasuk ENTER atau TAB
                                                                        }}
                                                                    >
                                                                        <div className="flex justify-between w-full">
                                                                            <span>{product.name}</span>
                                                                            <span className="text-muted-foreground">{product.price}</span>
                                                                        </div>

                                                                        <Check
                                                                            className={cn(
                                                                                "ml-auto h-4 w-4",
                                                                                line.productId === product.id ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </div>

                                        {/* Description */}
                                        <div className="lg:col-span-4 space-y-2">
                                            <Label>Description</Label>
                                            <Textarea
                                                value={line.description || ""}
                                                onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                                                placeholder="Item description..."
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-8 lg:grid-cols-8 gap-2">
                                        {/* Quantity */}
                                        <div className="space-y-2">
                                            <Label>Quantity</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={line.qty}
                                                onChange={(e) => handleLineChange(index, 'qty', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>

                                        {/* UOM */}
                                        <div className="space-y-2">
                                            <Label>Unit</Label>
                                            <Input
                                                type="text"
                                                value={line.uom || ""}
                                                onChange={(e) => handleLineChange(index, 'uom', e.target.value)}
                                                placeholder="e.g., pcs, kg"
                                            />
                                        </div>

                                        {/* Unit Price */}
                                        <div className="md:col-span-2 lg:col-span-2 space-y-2">
                                            <Label>Unit Price</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={line.unitPrice}
                                                onChange={(e) => handleLineChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>

                                        {/* Tax */}
                                        <div className="space-y-2">
                                            <Label>Tax</Label>
                                            <Select
                                                value={line.taxId || ""}
                                                onValueChange={(value) => handleLineChange(index, 'taxId', value === 'no-tax' ? '' : value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="No Tax" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="no-tax">No Tax</SelectItem>
                                                    {taxes.map(tax => (
                                                        <SelectItem key={tax.id} value={tax.id}>
                                                            {tax.code} ({tax.rate}%)
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className='md:col-span-3 lg:col-span-3 space-y-2'>
                                            {/* Line Discount */}
                                            <div className="grid grid-cols-1 md:grid-cols-1 gap-4 pt-4 border-t">
                                                <div className="space-y-2">
                                                    <Label>Discount Type</Label>
                                                    <RadioGroup
                                                        value={line.lineDiscountType}
                                                        onValueChange={(value) => handleLineChange(index, 'lineDiscountType', value as DiscountType)}
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
                                                </div>
                                            </div>
                                            <div className="mt-4 space-y-2">
                                                <Label>Discount Value</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={line.lineDiscountValue}
                                                    onChange={(e) => handleLineChange(index, 'lineDiscountValue', parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* SubTotal - Hanya untuk tampilan UI */}
                                    <div className="pt-4 border-t">
                                        <div className="flex justify-between items-center bg-amber-100 dark:bg-slate-600  px-4 py-3 rounded-lg">
                                            <Label className="text-base font-semibold">SubTotal Line</Label>
                                            <div className="text-lg font-bold text-blue-600 dark:text-white">
                                                {calculateLineSubtotal(line).toLocaleString('id-ID', {
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
                                <RadioGroup
                                    value={formData.discountType}
                                    onValueChange={(value) => handleHeaderChange('discountType', value as DiscountType)}
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
                            </div>

                            {/* Discount Value */}
                            <div className="lg:col-span-2 lg:col-start-4 space-y-2">
                                <Label>Discount Value</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.discountValue}
                                    onChange={(e) => handleHeaderChange('discountValue', parseFloat(e.target.value) || 0)}
                                    className="bg-white dark:bg-gray-800 dark:text-white mt-4"
                                />
                            </div>

                            <div className="md:col-span-2 lg:col-span-2">
                                {/* Other Charges */}
                                <div className="space-y-2">
                                    <Label>Other Charges</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.otherCharges}
                                        onChange={(e) => handleHeaderChange('otherCharges', parseFloat(e.target.value) || 0)}
                                        className="bg-white dark:bg-gray-800 dark:text-white mt-4"
                                    />
                                </div>
                            </div>
                            {/* Tax Inclusive */}
                            <div className='md:col-span-2 lg:col-span-2 mt-4'>
                                <div className="flex items-center space-x-2 pt-6">
                                    <Checkbox
                                        id="taxInclusive"
                                        checked={formData.taxInclusive}
                                        onCheckedChange={(checked) => handleHeaderChange('taxInclusive', checked as boolean)}
                                        className="bg-white dark:bg-gray-800 dark:text-black"
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
                                {(formData.discountValue || 0) > 0 && (
                                    <div className="flex justify-between items-center text-red-600">
                                        <span className="text-sm font-medium">
                                            Discount {formData.discountType === DiscountType.PERCENT ? `(${formData.discountValue}%)` : ''}:
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
                                {(formData.otherCharges || 0) > 0 && (
                                    <div className="flex justify-between items-center text-green-600">
                                        <span className="text-sm font-medium">Other Charges:</span>
                                        <span className="font-semibold">
                                            +{(formData.otherCharges || 0).toLocaleString('id-ID', {
                                                style: 'currency',
                                                currency: 'IDR',
                                                minimumFractionDigits: 2
                                            })}
                                        </span>
                                    </div>
                                )}

                                {/* Tax Display */}
                                {(formData.taxTotal || 0) > 0 && (
                                    <div className="flex justify-between items-center text-blue-600">
                                        <span className="text-sm font-medium">
                                            Tax {formData.taxInclusive ? '(Included)' : ''}:
                                        </span>
                                        <span className="font-semibold">
                                            {formData.taxInclusive ? '(Included)' : `+${(formData.taxTotal || 0).toLocaleString('id-ID', {
                                                style: 'currency',
                                                currency: 'IDR',
                                                minimumFractionDigits: 2
                                            })}`}
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
                        <Textarea
                            value={formData.notes || ''}
                            onChange={(e) => handleHeaderChange('notes', e.target.value || '')}
                            placeholder="Enter any additional notes or terms for this quotation..."
                            className="min-h-[120px]"
                        />
                    </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="flex justify-end gap-2 sticky bottom-4 bg-cyan-100 dark:bg-cyan-950 p-4 rounded-lg border shadow-sm">
                    {/* Tombol Batal */}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isLoading}
                    >
                        Batal
                    </Button>

                    {/* Tombol Simpan */}
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="min-w-40 flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Creating Quotation...
                            </>
                        ) : (
                            <>
                                <FileText className="w-5 h-5" />
                                Create Manual Quotation
                            </>
                        )}
                    </Button>
                </div>

            </form>
        </div>
    );
};