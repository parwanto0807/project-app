"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
    FileText,
    Building,
    Calendar,
    DollarSign,
    Package,
    ArrowLeft,
    Edit,
    Printer,
    AlertTriangle,
    Receipt,
    Hash,
    Clock,
    CheckCircle,
    XCircle,
    TrendingUp,
    CreditCard,
    Banknote,
    CalendarDays,
    FileSignature,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { SupplierInvoice, SUPPLIER_INVOICE_STATUS_OPTIONS } from "@/types/supplierInvoice";
import { cn } from "@/lib/utils";

interface SupplierInvoiceDetailProps {
    invoice: SupplierInvoice;
}

export default function SupplierInvoiceDetail({ invoice }: SupplierInvoiceDetailProps) {
    const router = useRouter();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        const config = SUPPLIER_INVOICE_STATUS_OPTIONS.find(s => s.value === status);
        if (!config) return null;

        const colorMap: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
            gray: {
                bg: "bg-gray-50/80",
                text: "text-gray-700",
                border: "border-gray-200",
                icon: <Clock className="h-3 w-3" />
            },
            blue: {
                bg: "bg-blue-50/80",
                text: "text-blue-700",
                border: "border-blue-200",
                icon: <FileSignature className="h-3 w-3" />
            },
            yellow: {
                bg: "bg-amber-50/80",
                text: "text-amber-700",
                border: "border-amber-200",
                icon: <AlertTriangle className="h-3 w-3" />
            },
            green: {
                bg: "bg-emerald-50/80",
                text: "text-emerald-700",
                border: "border-emerald-200",
                icon: <CheckCircle className="h-3 w-3" />
            },
            red: {
                bg: "bg-rose-50/80",
                text: "text-rose-700",
                border: "border-rose-200",
                icon: <XCircle className="h-3 w-3" />
            },
        };

        const colors = colorMap[config.color] || colorMap.gray;

        return (
            <Badge
                variant="outline"
                className={cn(
                    "font-medium px-4 py-2 rounded-lg backdrop-blur-sm",
                    colors.bg,
                    colors.text,
                    colors.border,
                    "flex items-center gap-2"
                )}
            >
                {colors.icon}
                {config.label}
            </Badge>
        );
    };

    const remainingAmount = invoice.totalAmount - invoice.amountPaid;
    const hasVariance = invoice.items?.some(item => item.priceVariance && item.priceVariance !== 0);
    const isOverdue = new Date() > new Date(invoice.dueDate) && remainingAmount > 0;

    return (
        <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-6">
            {/* Header with minimal design */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
                            <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight">{invoice.invoiceNumber}</h1>
                                {isOverdue && (
                                    <Badge variant="destructive" className="px-3 py-1.5 text-xs font-medium">
                                        OVERDUE
                                    </Badge>
                                )}
                            </div>
                            <p className="text-muted-foreground mt-1">Supplier Invoice</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push("/admin-area/accounting/supplier-invoice")}
                        className="h-10 border-gray-200 hover:border-gray-300"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    {invoice.status !== 'FULLY_PAID' && invoice.status !== 'CANCELLED' && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin-area/accounting/supplier-invoice/update/${invoice.id}`)}
                            className="h-10 border-gray-200 hover:border-gray-300"
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-10 border-gray-200 hover:border-gray-300"
                    >
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                    </Button>
                </div>
            </div>

            {/* Invoice Status and Key Information */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Invoice Info */}
                <Card className="lg:col-span-2 border-gray-100 shadow-sm">
                    <CardHeader className="pb-4">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-xl font-semibold">Invoice Details</CardTitle>
                            {getStatusBadge(invoice.status)}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Supplier Info */}
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 bg-gray-50/50 rounded-lg">
                                <div className="p-3 bg-white rounded-lg border">
                                    <Building className="h-5 w-5 text-gray-700" />
                                </div>
                                <div className="space-y-1 flex-1">
                                    <p className="text-sm text-muted-foreground font-medium">Supplier</p>
                                    <p className="text-lg font-semibold">{invoice.supplier?.name || "N/A"}</p>
                                    {invoice.supplier?.code && (
                                        <p className="text-sm text-muted-foreground">Code: {invoice.supplier.code}</p>
                                    )}
                                </div>
                            </div>

                            {/* Invoice Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-blue-50 rounded-lg">
                                            <CalendarDays className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Invoice Date</p>
                                            <p className="font-medium">
                                                {format(new Date(invoice.invoiceDate), "dd MMM yyyy", { locale: idLocale })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-amber-50 rounded-lg">
                                            <Clock className="h-4 w-4 text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Created</p>
                                            <p className="font-medium">
                                                {format(new Date(invoice.createdAt), "dd MMM yyyy, HH:mm", { locale: idLocale })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "p-2.5 rounded-lg",
                                            isOverdue ? "bg-rose-50" : "bg-emerald-50"
                                        )}>
                                            <Calendar className={cn("h-4 w-4", isOverdue ? "text-rose-600" : "text-emerald-600")} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Due Date</p>
                                            <p className={cn(
                                                "font-medium",
                                                isOverdue ? "text-rose-600" : "text-gray-900"
                                            )}>
                                                {format(new Date(invoice.dueDate), "dd MMM yyyy", { locale: idLocale })}
                                            </p>
                                        </div>
                                    </div>

                                    {invoice.purchaseOrder && (
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-purple-50 rounded-lg">
                                                <Receipt className="h-4 w-4 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Purchase Order</p>
                                                <p className="font-medium">{invoice.purchaseOrder.poNumber}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column - Financial Summary */}
                <Card className="border-gray-100 shadow-sm">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg">
                                <DollarSign className="h-5 w-5 text-emerald-600" />
                            </div>
                            <CardTitle className="text-xl font-semibold">Financial Summary</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                            </div>

                            <div className="flex justify-between items-center py-2">
                                <span className="text-muted-foreground">Tax (PPN 11%)</span>
                                <span className="font-medium">{formatCurrency(invoice.taxAmount || 0)}</span>
                            </div>

                            <Separator className="my-2" />

                            <div className="flex justify-between items-center py-2">
                                <span className="font-semibold">Total Amount</span>
                                <span className="text-2xl font-bold text-primary">{formatCurrency(invoice.totalAmount)}</span>
                            </div>

                            <Separator className="my-2" />

                            <div className="flex justify-between items-center py-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-emerald-50 rounded">
                                        <CheckCircle className="h-3 w-3 text-emerald-600" />
                                    </div>
                                    <span className="text-muted-foreground">Amount Paid</span>
                                </div>
                                <span className="font-semibold text-emerald-600">{formatCurrency(invoice.amountPaid)}</span>
                            </div>

                            <div className="flex justify-between items-center py-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-amber-50 rounded">
                                        <Clock className="h-3 w-3 text-amber-600" />
                                    </div>
                                    <span className="font-medium">Remaining Balance</span>
                                </div>
                                <span className={cn(
                                    "text-xl font-bold",
                                    remainingAmount > 0 ? "text-amber-600" : "text-emerald-600"
                                )}>
                                    {formatCurrency(remainingAmount)}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Price Variance Warning */}
            {hasVariance && (
                <div className="flex items-start gap-4 p-4 bg-amber-50/50 border border-amber-200 rounded-xl">
                    <div className="p-2 bg-amber-100 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                        <p className="font-medium text-amber-900">Price Variance Detected</p>
                        <p className="text-sm text-amber-700 mt-1">
                            Some items have price differences from the original purchase order. Please review the variance column below.
                        </p>
                    </div>
                </div>
            )}

            {/* Invoice Items */}
            <Card className="border-gray-100 shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-primary/10 rounded-lg">
                                <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-semibold">Invoice Items</CardTitle>
                                <CardDescription>
                                    {invoice.items?.length || 0} items • Total: {formatCurrency(invoice.totalAmount)}
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border border-gray-100 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                    <TableHead className="font-medium text-gray-700">Product</TableHead>
                                    <TableHead className="text-right font-medium text-gray-700">Quantity</TableHead>
                                    <TableHead className="text-right font-medium text-gray-700">Unit Price</TableHead>
                                    <TableHead className="text-right font-medium text-gray-700">Total</TableHead>
                                    {hasVariance && (
                                        <TableHead className="text-right font-medium text-gray-700">
                                            <div className="flex items-center justify-end gap-2">
                                                <TrendingUp className="h-4 w-4" />
                                                Variance
                                            </div>
                                        </TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoice.items && invoice.items.length > 0 ? (
                                    invoice.items.map((item, index) => (
                                        <TableRow key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}>
                                            <TableCell className="font-medium">
                                                <div className="space-y-1">
                                                    <p>{item.productName}</p>
                                                    {item.productCode && (
                                                        <p className="text-sm text-muted-foreground">{item.productCode}</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {formatCurrency(item.totalPrice)}
                                            </TableCell>
                                            {hasVariance && (
                                                <TableCell className="text-right">
                                                    {item.priceVariance && item.priceVariance !== 0 ? (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <span className={cn(
                                                                "font-medium",
                                                                item.priceVariance > 0 ? "text-rose-600" : "text-emerald-600"
                                                            )}>
                                                                {formatCurrency(item.priceVariance)}
                                                            </span>
                                                            {item.priceVariance > 0 ? (
                                                                <TrendingUp className="h-4 w-4 text-rose-500" />
                                                            ) : (
                                                                <TrendingUp className="h-4 w-4 text-emerald-500 rotate-180" />
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={hasVariance ? 5 : 4} className="text-center py-12">
                                            <div className="space-y-2">
                                                <Package className="h-12 w-12 text-gray-300 mx-auto" />
                                                <p className="text-gray-500">No items found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Payment Allocations */}
            {invoice.paymentAllocations && invoice.paymentAllocations.length > 0 && (
                <Card className="border-gray-100 shadow-sm">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                                <CreditCard className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-semibold">Payment History</CardTitle>
                                <CardDescription>
                                    {invoice.paymentAllocations.length} payment{invoice.paymentAllocations.length > 1 ? 's' : ''} allocated to this invoice
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {invoice.paymentAllocations.map((allocation) => (
                                <div key={allocation.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white border rounded-lg">
                                            {allocation.supplierPayment?.paymentMethod === 'BANK_TRANSFER' ? (
                                                <Banknote className="h-5 w-5 text-blue-600" />
                                            ) : (
                                                <CreditCard className="h-5 w-5 text-purple-600" />
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">
                                                {allocation.supplierPayment?.paymentNumber || "Payment"}
                                            </p>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {allocation.supplierPayment?.paymentDate
                                                        ? format(new Date(allocation.supplierPayment.paymentDate), "dd MMM yyyy", { locale: idLocale })
                                                        : "N/A"}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Hash className="h-3 w-3" />
                                                    {allocation.supplierPayment?.paymentNumber || "No Reference"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-emerald-600">
                                            {formatCurrency(allocation.amount)}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {allocation.supplierPayment?.paymentMethod || "N/A"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Additional Notes or Metadata */}
            {invoice.notes && (
                <Card className="border-gray-100 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl font-semibold">Additional Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="p-4 bg-gray-50/50 rounded-lg">
                            <p className="text-gray-700">{invoice.notes}</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}