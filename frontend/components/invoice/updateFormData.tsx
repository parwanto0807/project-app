
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { format } from "date-fns";
import {
    CalendarIcon,
    Plus,
    Trash2,
    FileText,
    ShoppingCart,
    CreditCard,
    FileDigit,
    CalendarDays,
    UserCheck,
    Landmark,
    Clock,
    StickyNote,
    ShieldCheck,
    Percent,
    Package,
    Calculator
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Form,
    FormControl,
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
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { updateInvoice } from "@/lib/action/invoice/invoice";
import { SalesOrder } from "@/schemas";
import { Karyawan } from "@/lib/validations/karyawan";
import { invoiceFormSchema } from "@/lib/validations/invoice";
import { Invoice, UpdateInvoiceRequest } from "@/schemas/invoice";
import { differenceInCalendarDays } from "date-fns";
import { BankAccount } from "@/schemas/bank";

// Types
interface UpdateInvoiceFormProps {
    currentUser: {
        id: string,
        name: string,
    }
    salesOrders: SalesOrder[];
    users: Karyawan[];
    banks: BankAccount[];
    initialData: Invoice;
}

interface InvoiceFormData {
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate: Date;
    salesOrderId: string;
    currency: string;  // tetap string karena default selalu ada
    exchangeRate: number;
    paymentTerm?: string;
    installmentType: string;
    notes?: string;
    internalNotes?: string;
    termsConditions?: string;
    createdById: string; // ⬅️ tambahkan biar sama dengan schema
    approvedById: string;
    bankAccountId: string;
    items?: Array<{
        soItemId?: string; // ✅ TERIMA null juga
        itemCode?: string; // ✅ TERIMA null juga
        name: string;
        description?: string; // ✅ TERIMA null juga
        uom?: string; // ✅ TERIMA null juga
        qty: number;
        unitPrice: number;
        discount: number;
        discountPercent: number;
        taxRate: number;
        taxCode?: string; // ✅ TERIMA null juga
        taxable: boolean;
    }>;

    installments?: Array<{
        installmentNumber: number;
        name: string;
        amount: number;
        percentage?: number;
        dueDate: Date;
        description?: string;
        conditions?: string;
    }>;
}


// Color variants for icons
const iconVariants = {
    primary: "text-blue-600 dark:text-blue-400",
    success: "text-green-600 dark:text-green-400",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-red-600 dark:text-red-400",
    info: "text-cyan-600 dark:text-cyan-400"
};

export function UpdateInvoiceForm({ currentUser, salesOrders, users, banks, initialData }: UpdateInvoiceFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Transform initial data to form format
    const transformInitialData = (invoiceData: Invoice): InvoiceFormData => {
        return {
            invoiceNumber: invoiceData.invoiceNumber || "",
            invoiceDate: invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate) : new Date(),
            dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate) : new Date(),
            salesOrderId: invoiceData.salesOrderId || "",
            currency: invoiceData.currency || "IDR",
            exchangeRate: Number(invoiceData.exchangeRate) || 1,
            bankAccountId: invoiceData.bankAccountId || "",
            paymentTerm: invoiceData.paymentTerm || undefined,
            installmentType: invoiceData.installmentType || "FULL",
            notes: invoiceData.notes || undefined,
            internalNotes: invoiceData.internalNotes || undefined,
            termsConditions: invoiceData.termsConditions || undefined,
            approvedById: invoiceData.approvedById || "",
            createdById: currentUser.id,
            items: (invoiceData?.items || []).map(item => ({
                soItemId: item.soItemId || undefined,
                itemCode: item.itemCode || undefined,
                name: item.name || "Unnamed Item",
                description: item.description || undefined,
                uom: item.uom || undefined,
                qty: Number(item.qty || 0),
                unitPrice: Number(item.unitPrice || 0),
                discount: Number(item.discount || 0), // DEFAULT 0
                discountPercent: Number(item.discountPercent || 0), // DEFAULT 0
                taxRate: Number(item.taxRate || 0), // DEFAULT 0
                taxCode: item.taxCode || undefined,
                taxable: item.taxable ?? true,
            })),
            installments: (invoiceData.installments || []).map(installment => ({
                installmentNumber: installment.installmentNumber || 1,
                name: installment.name || "Installment",
                amount: Number(installment.amount || 0),
                percentage: installment.percentage ? Number(installment.percentage) : undefined,
                dueDate: installment.dueDate ? new Date(installment.dueDate) : new Date(),
                description: installment.description || undefined,
                conditions: installment.conditions || undefined,
            })),
        };
    };

    const form = useForm({
        resolver: zodResolver(invoiceFormSchema),
        defaultValues: transformInitialData(initialData)
    });

    const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
        control: form.control,
        name: "items",
    });

    const { fields: installmentFields, append: appendInstallment, remove: removeInstallment } = useFieldArray({
        control: form.control,
        name: "installments",
    });

    const installmentType = form.watch("installmentType");
    const items = form.watch("items");

    // Calculate totals dengan type yang lebih spesifik
    const calculateTotals = (items: Array<{
        qty: number;
        unitPrice: number;
        discount: number;
        discountPercent: number;
        taxRate: number;
        taxable: boolean;
    }>) => {
        const subtotal = items.reduce((sum, item) => {
            const quantity = item.qty;
            const unitPrice = item.unitPrice;
            const discountAmount = (unitPrice * quantity * item.discountPercent) / 100 + item.discount;
            return sum + (unitPrice * quantity - discountAmount);
        }, 0);

        const discountTotal = items.reduce((sum, item) => {
            const quantity = item.qty;
            const unitPrice = item.unitPrice;
            return sum + (unitPrice * quantity * item.discountPercent) / 100 + item.discount;
        }, 0);

        const taxTotal = items.reduce((sum, item) => {
            if (!item.taxable) return sum;
            const quantity = item.qty;
            const unitPrice = item.unitPrice;
            const discountAmount = (unitPrice * quantity * item.discountPercent) / 100 + item.discount;
            const taxableAmount = unitPrice * quantity - discountAmount;
            return sum + (taxableAmount * item.taxRate) / 100;
        }, 0);

        const grandTotal = subtotal + taxTotal;

        return {
            subtotal,
            discountTotal,
            taxTotal,
            grandTotal
        };
    };

    const { subtotal, discountTotal, taxTotal, grandTotal } = calculateTotals(items as Array<{
        qty: number;
        unitPrice: number;
        discount: number;
        discountPercent: number;
        taxRate: number;
        taxable: boolean;
    }>);


    // Handle sales order selection
    const handleSalesOrderChange = (soId: string) => {
        const so = salesOrders.find(order => order.id === soId);

        if (so) {
            form.setValue(
                "items",
                so.items.map((item) => ({
                    soItemId: item.id,
                    itemCode: item.product.id || "",
                    name: item.product.name || `Item from SO ${so.soNumber}`,
                    description: item.description || `Item from Sales Order ${so.soNumber}`,
                    uom: item.uom || "PCS",
                    qty: Number(item.qty),
                    unitPrice: Number(item.unitPrice),
                    discount: Number(item.discount ?? 0),
                    discountPercent: 0,
                    taxRate: 0,
                    taxCode: "PPN",
                    taxable: true,
                }))
            );
        }
    };

    const dueDate = form.watch("dueDate");
    const invoiceDate = form.watch("invoiceDate");

    useEffect(() => {
        if (!dueDate) return;

        const daysDiff = differenceInCalendarDays(dueDate, invoiceDate);

        let term: string | undefined;
        if (daysDiff <= 15) term = "NET_15";
        else if (daysDiff <= 30) term = "NET_30";
        else if (daysDiff <= 60) term = "NET_60";
        else term = "DUE_ON_RECEIPT";

        form.setValue("paymentTerm", term);
    }, [dueDate, invoiceDate, form]);

    // Add installment
    const handleAddInstallment = () => {
        const installments = form.getValues("installments") || [];
        const nextNumber = installments.length + 1;

        appendInstallment({
            installmentNumber: nextNumber,
            name: `Termin ${nextNumber}`,
            amount: grandTotal / (installments.length + 1),
            dueDate: new Date(Date.now() + nextNumber * 30 * 24 * 60 * 60 * 1000),
            description: "",
            conditions: "",
        });
    };

    // Update installments when grandTotal changes
    useEffect(() => {
        if (installmentType === "INSTALLMENT" && installmentFields.length > 0) {
            const installments = form.getValues("installments");
            if (installments && installments.length > 0) {
                const equalAmount = grandTotal / installments.length;
                const updatedInstallments = installments.map((inst) => ({
                    ...inst,
                    amount: equalAmount,
                    percentage: (equalAmount / grandTotal) * 100,
                }));
                form.setValue("installments", updatedInstallments);
            }
        }
    }, [grandTotal, installmentType, installmentFields.length, form]);

    const onSubmit = async (data: InvoiceFormData) => {
        setIsSubmitting(true);
        try {
            // Debug: Cek bank account yang dipilih
            const selectedBank = banks.find(bank => bank.id === data.bankAccountId);
            console.log("Selected bank:", selectedBank);
            console.log("Available banks:", banks);

            if (!selectedBank) {
                toast.error("Selected bank account is invalid");
                return;
            }
            const payload: UpdateInvoiceRequest = {
                ...data,
                invoiceDate: data.invoiceDate.toISOString(),
                dueDate: data.dueDate.toISOString(),
                approvedById: data.approvedById,
                bankAccountId: data.bankAccountId,
                installmentType: data.installmentType as "FULL" | "INSTALLMENT", // Type assertion
                items: data.items?.map(item => ({
                    ...item,
                    soItemId: item.soItemId || undefined,
                    itemCode: item.itemCode || undefined,
                    description: item.description || undefined,
                    uom: item.uom || undefined,
                    taxCode: item.taxCode || undefined,
                })),
                installments: data.installments?.map(installment => ({
                    ...installment,
                    dueDate: installment.dueDate.toISOString(),
                    percentage: installment.percentage || null,
                    description: installment.description || undefined,
                    conditions: installment.conditions || undefined,
                })),
            };

            const result = await updateInvoice(initialData.id, payload);

            if (result) {
                toast.success("Invoice updated successfully!");
                router.push("/admin-area/finance/invoice");
            } else {
                toast.error("Failed to update invoice");
            }
        } catch (error) {
            console.error("Error updating invoice:", error);
            toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header dengan Gradient */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 dark:from-blue-900 dark:via-purple-900 dark:to-cyan-900 rounded-lg p-6 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                    <FileText className="h-8 w-8" />
                    <h1 className="text-2xl font-bold">Update Invoice</h1>
                </div>
                <p className="text-blue-100 dark:text-blue-200">
                    Update invoice information and manage payment details
                </p>
                <Badge variant="secondary" className="mt-2 bg-white/20 text-white border-none">
                    Invoice: {initialData.invoiceNumber}
                </Badge>
            </div>

            <Card className="shadow-lg">
                <CardContent className="p-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            {/* Section 1: Basic Information */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <FileDigit className={`h-5 w-5 ${iconVariants.primary}`} />
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        Basic Information
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="invoiceNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-blue-500" />
                                                    Invoice Number *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="00001/INV-RYLIF/IX/2025" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="salesOrderId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <ShoppingCart className="h-4 w-4 text-green-500" />
                                                    Sales Order
                                                </FormLabel>
                                                <Select onValueChange={(value) => {
                                                    field.onChange(value);
                                                    handleSalesOrderChange(value);
                                                }} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select Sales Order" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {salesOrders.map((so) => (
                                                            <SelectItem key={so.id} value={so.id}>
                                                                {so.soNumber} - {so.customer.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="currency"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <Landmark className="h-4 w-4 text-amber-500" />
                                                    Currency
                                                </FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="IDR">IDR - Indonesian Rupiah</SelectItem>
                                                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                                                        <SelectItem value="SGD">SGD - Singapore Dollar</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="invoiceDate"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel className="flex items-center gap-2">
                                                    <CalendarDays className="h-4 w-4 text-purple-500" />
                                                    Invoice Date *
                                                </FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full pl-3 text-left font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(field.value, "PPP")
                                                                ) : (
                                                                    <span>Pick a date</span>
                                                                )}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            disabled={(date) => date > new Date()}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="dueDate"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-red-500" />
                                                    Due Date *
                                                </FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full pl-3 text-left font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(field.value, "PPP")
                                                                ) : (
                                                                    <span>Pick a date</span>
                                                                )}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            disabled={(date) => date < new Date()}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="paymentTerm"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <CreditCard className="h-4 w-4 text-cyan-500" />
                                                    Payment Term
                                                </FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select payment term" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="NET_15">NET 15</SelectItem>
                                                        <SelectItem value="NET_30">NET 30</SelectItem>
                                                        <SelectItem value="NET_60">NET 60</SelectItem>
                                                        <SelectItem value="DUE_ON_RECEIPT">Due on Receipt</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="approvedById"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <UserCheck className="h-4 w-4 text-green-500" />
                                                    Approved By
                                                </FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Pilih karyawan" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {users.map((user) => (
                                                            <SelectItem key={user.id} value={user.id}>
                                                                {user.namaLengkap}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="bankAccountId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <ShoppingCart className="h-4 w-4 text-green-500" />
                                                    Account Bank
                                                </FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select Account Bank" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {banks.map((ba) => (
                                                            <SelectItem key={ba.id} value={ba.id}>
                                                                {ba.accountNumber} - {ba.accountHolder}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <Separator />

                            {/* Section 2: Items Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Package className={`h-5 w-5 ${iconVariants.info}`} />
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                            Invoice Items
                                        </h3>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => appendItem({
                                            name: "",
                                            qty: 1,
                                            unitPrice: 0,
                                            uom: "",
                                            discount: 0,
                                            discountPercent: 0,
                                            taxRate: 11,
                                            taxCode: "PPN",
                                            taxable: true,
                                        })}
                                        className="flex items-center gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Item
                                    </Button>
                                </div>

                                <Card>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader className="bg-gray-50 dark:bg-gray-800">
                                                <TableRow>
                                                    <TableHead className="font-semibold">Item Name</TableHead>
                                                    <TableHead className="font-semibold">Qty</TableHead>
                                                    <TableHead className="font-semibold">Satuan</TableHead>
                                                    <TableHead className="font-semibold">Unit Price</TableHead>
                                                    <TableHead className="font-semibold">
                                                        <div className="flex items-center gap-1">
                                                            <Percent className="h-3 w-3" />
                                                            Discount %
                                                        </div>
                                                    </TableHead>
                                                    <TableHead className="font-semibold">Tax Rate %</TableHead>
                                                    <TableHead className="font-semibold text-right">Total</TableHead>
                                                    <TableHead className="font-semibold">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {itemFields.map((field, index) => (
                                                    <TableRow key={field.id} className={index % 2 === 0 ? "bg-gray-50/50 dark:bg-gray-800/50" : ""}>
                                                        <TableCell className="font-medium">
                                                            <FormField
                                                                control={form.control}
                                                                name={`items.${index}.name`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormControl>
                                                                            <Input placeholder="Item name" {...field} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <FormField
                                                                control={form.control}
                                                                name={`items.${index}.qty`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormControl>
                                                                            <Input
                                                                                type="number"
                                                                                step="0.01"
                                                                                {...field}
                                                                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            <FormField
                                                                control={form.control}
                                                                name={`items.${index}.uom`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormControl>
                                                                            <Input placeholder="Satuan" {...field} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <FormField
                                                                control={form.control}
                                                                name={`items.${index}.unitPrice`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormControl>
                                                                            <Input
                                                                                type="number"
                                                                                step="0.01"
                                                                                value={field.value}
                                                                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <FormField
                                                                control={form.control}
                                                                name={`items.${index}.discountPercent`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormControl>
                                                                            <Input
                                                                                type="number"
                                                                                step="0.01"
                                                                                value={field.value}
                                                                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <FormField
                                                                control={form.control}
                                                                name={`items.${index}.taxRate`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormControl>
                                                                            <Input
                                                                                type="number"
                                                                                step="0.01"
                                                                                value={field.value}
                                                                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            <Badge variant="secondary" className="text-sm">
                                                                {(
                                                                    ((items?.[index]?.qty ?? 0) *
                                                                        (items?.[index]?.unitPrice ?? 0) *
                                                                        (1 - (items?.[index]?.discountPercent ?? 0) / 100)
                                                                    ).toLocaleString("id-ID", { style: "currency", currency: "IDR" })
                                                                )}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeItem(index)}
                                                                disabled={itemFields.length === 1}
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>

                                        {/* Summary Section */}
                                        <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 border-t">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                                                    <p className="text-sm text-muted-foreground">Subtotal</p>
                                                    <p className="font-semibold text-lg">{subtotal.toLocaleString('id-ID', {
                                                        style: 'currency',
                                                        currency: 'IDR'
                                                    })}</p>
                                                </div>
                                                <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                                                    <p className="text-sm text-muted-foreground">Discount</p>
                                                    <p className="font-semibold text-lg text-red-600">{discountTotal.toLocaleString('id-ID', {
                                                        style: 'currency',
                                                        currency: 'IDR'
                                                    })}</p>
                                                </div>
                                                <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                                                    <p className="text-sm text-muted-foreground">Tax</p>
                                                    <p className="font-semibold text-lg text-blue-600">{taxTotal.toLocaleString('id-ID', {
                                                        style: 'currency',
                                                        currency: 'IDR'
                                                    })}</p>
                                                </div>
                                                <div className="text-center p-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-lg">
                                                    <p className="text-sm font-medium">Grand Total</p>
                                                    <p className="font-bold text-xl">{grandTotal.toLocaleString('id-ID', {
                                                        style: 'currency',
                                                        currency: 'IDR'
                                                    })}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Separator />

                            {/* Section 3: Payment Configuration */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <CreditCard className={`h-5 w-5 ${iconVariants.warning}`} />
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        Payment Configuration
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="installmentType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2 text-base">
                                                    <Calculator className="h-4 w-4 text-purple-500" />
                                                    Payment Type
                                                </FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-12 text-lg">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="FULL">Full Payment</SelectItem>
                                                        <SelectItem value="INSTALLMENT">Installment</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {installmentType === "INSTALLMENT" && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-medium flex items-center gap-2">
                                                    <CreditCard className="h-4 w-4 text-amber-500" />
                                                    Payment Installments
                                                </h4>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleAddInstallment}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    Add Installment
                                                </Button>
                                            </div>

                                            <div className="space-y-3">
                                                {installmentFields.map((field, index) => (
                                                    <Card key={field.id} className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
                                                        <CardContent className="p-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                                <FormField
                                                                    control={form.control}
                                                                    name={`installments.${index}.name`}
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormLabel>Installment Name</FormLabel>
                                                                            <FormControl>
                                                                                <Input placeholder="DP, Final, etc." {...field} />
                                                                            </FormControl>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                                <FormField
                                                                    control={form.control}
                                                                    name={`installments.${index}.amount`}
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormLabel>Amount</FormLabel>
                                                                            <FormControl>
                                                                                <Input
                                                                                    type="number"
                                                                                    step="0.01"
                                                                                    {...field}
                                                                                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                                                />
                                                                            </FormControl>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                                <FormField
                                                                    control={form.control}
                                                                    name={`installments.${index}.dueDate`}
                                                                    render={({ field }) => (
                                                                        <FormItem className="flex flex-col">
                                                                            <FormLabel>Due Date</FormLabel>
                                                                            <Popover>
                                                                                <PopoverTrigger asChild>
                                                                                    <FormControl>
                                                                                        <Button
                                                                                            variant={"outline"}
                                                                                            className={cn(
                                                                                                "text-left font-normal",
                                                                                                !field.value && "text-muted-foreground"
                                                                                            )}
                                                                                        >
                                                                                            {field.value ? (
                                                                                                format(field.value, "PPP")
                                                                                            ) : (
                                                                                                <span>Pick a date</span>
                                                                                            )}
                                                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                                        </Button>
                                                                                    </FormControl>
                                                                                </PopoverTrigger>
                                                                                <PopoverContent className="w-auto p-0" align="start">
                                                                                    <Calendar
                                                                                        mode="single"
                                                                                        selected={field.value}
                                                                                        onSelect={field.onChange}
                                                                                        disabled={(date) => date < new Date()}
                                                                                        initialFocus
                                                                                    />
                                                                                </PopoverContent>
                                                                            </Popover>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                                <div className="flex items-end">
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        onClick={() => removeInstallment(index)}
                                                                        disabled={installmentFields.length === 1}
                                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            {/* Section 4: Notes & Terms */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <StickyNote className={`h-5 w-5 ${iconVariants.success}`} />
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        Notes & Terms
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="notes"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-blue-500" />
                                                    Customer Notes
                                                </FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Notes for customer"
                                                        {...field}
                                                        className="min-h-[100px]"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="internalNotes"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <ShieldCheck className="h-4 w-4 text-green-500" />
                                                    Internal Notes
                                                </FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Internal notes for finance team"
                                                        {...field}
                                                        className="min-h-[100px]"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="termsConditions"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <ShieldCheck className="h-4 w-4 text-purple-500" />
                                                Terms & Conditions
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Terms and conditions for this invoice"
                                                    {...field}
                                                    className="min-h-[100px]"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex gap-4 justify-end pt-6 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                    className="flex items-center gap-2"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 flex items-center gap-2 dark:text-white"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="h-4 w-4 dark:text-white" />
                                            Update Invoice
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}