"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
    FileText,
    Building,
    DollarSign,
    Package,
    Save,
    X,
    CheckCircle2,
    Calendar,
    Receipt,
    Hash,
    Loader2,
    Percent,
    ShoppingCart,
    AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { updateSupplierInvoice } from "@/lib/actions/supplierInvoice";
import { SupplierInvoice, SUPPLIER_INVOICE_STATUS_OPTIONS } from "@/types/supplierInvoice";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
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

interface UpdateSupplierInvoiceFormProps {
    invoice: SupplierInvoice;
    role?: string;
}

export default function UpdateSupplierInvoiceForm({ invoice, role = "admin" }: UpdateSupplierInvoiceFormProps) {
    const router = useRouter();
    const basePath = role === "pic" ? "/pic-area" : role === "super" ? "/super-admin-area" : "/admin-area";
    const [loading, setLoading] = useState(false);

    // Confirmation Dialog State
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [confirmationData, setConfirmationData] = useState<{ type: string; diffDays: number }>({ type: '', diffDays: 0 });

    // Form State
    const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState(invoice.invoiceNumber);
    const [invoiceDate, setInvoiceDate] = useState(invoice.invoiceDate ? format(new Date(invoice.invoiceDate), "yyyy-MM-dd") : "");
    const [dueDate, setDueDate] = useState(invoice.dueDate ? format(new Date(invoice.dueDate), "yyyy-MM-dd") : "");
    const [status, setStatus] = useState(invoice.status);

    // Financial State
    const [taxAmount, setTaxAmount] = useState<string>(invoice.taxAmount.toString());
    const [taxRate, setTaxRate] = useState<number>(0); // Calculated or manual

    // Calculate initial tax rate or default to 11 if matches
    useEffect(() => {
        if (invoice.subtotal > 0 && invoice.taxAmount > 0) {
            const calculatedRate = (invoice.taxAmount / invoice.subtotal) * 100;
            // Round to nearest integer to check against common rates
            const roundedRate = Math.round(calculatedRate);
            if (roundedRate === 11 || roundedRate === 10) {
                setTaxRate(roundedRate);
            } else {
                setTaxRate(0); // Custom or 0
            }
        }
    }, [invoice]);

    const handleTaxRateChange = (rate: number) => {
        setTaxRate(rate);
        const taxAmountValue = (invoice.subtotal * rate) / 100;
        setTaxAmount(taxAmountValue.toFixed(2));
    };

    // Memoized financial calculations (Subtotal is fixed as items are read-only)
    const subtotal = Number(invoice.subtotal) || 0;
    const taxAmountNumber = parseFloat(taxAmount) || 0;
    const totalAmount = subtotal + taxAmountNumber;

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!supplierInvoiceNumber || !invoiceDate || !dueDate) {
            toast.error("Please fill in all required fields");
            return;
        }

        const invDate = new Date(invoiceDate);
        const dDate = new Date(dueDate);
        invDate.setHours(0, 0, 0, 0);
        dDate.setHours(0, 0, 0, 0);

        const diffTime = dDate.getTime() - invDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const type = diffDays <= 0 ? 'CASH' : 'CREDIT';

        setConfirmationData({ type, diffDays });
        setConfirmDialogOpen(true);
    };

    const executeSubmit = async () => {
        try {
            setLoading(true);
            setConfirmDialogOpen(false);

            const response = await updateSupplierInvoice(invoice.id, {
                invoiceNumber: supplierInvoiceNumber,
                invoiceDate: new Date(invoiceDate),
                dueDate: new Date(dueDate),
                status: status,
                subtotal: subtotal,
                taxAmount: taxAmountNumber,
                totalAmount: totalAmount,
            });

            if (response.success) {
                toast.success("Supplier invoice updated successfully", {
                    icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
                });
                router.push(`${basePath}/accounting/supplier-invoice`);
            } else {
                toast.error(response.message || "Failed to update invoice");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to update invoice");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-6 bg-gray-100 rounded-xl dark:bg-slate-900">
            {/* Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
                        <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Update Supplier Invoice</h1>
                        <p className="text-muted-foreground">Modify invoice details and status</p>
                    </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 mt-4 shadow-sm">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <span className="font-semibold block mb-1">Mode Edit Terbatas</span>
                        Form ini hanya untuk mengubah <strong>Data Header</strong> (Nomor Faktur, Tanggal, Status) dan <strong>Perhitungan Pajak</strong>.
                        Detail item barang bersifat <em>Read-Only</em> dan tidak dapat diubah di sini.
                    </div>
                </div>
            </div>

            {/* Payment Confirmation Dialog */}
            <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Update Invoice</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-4 pt-2">
                                <p>Mohon verifikasi detail pembayaran sebelum menyimpan perubahan:</p>
                                <div className="grid grid-cols-2 gap-4 text-sm p-4 bg-gray-50 rounded-lg border">
                                    <div className="text-gray-500 self-center">Tipe Pembayaran</div>
                                    <div className="font-bold text-gray-900 text-right">
                                        {confirmationData.type === 'CASH' ? (
                                            <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100">CASH</span>
                                        ) : (
                                            <span className="text-blue-600 bg-blue-50 px-2.5 py-1 rounded border border-blue-100">CREDIT</span>
                                        )}
                                    </div>

                                    <div className="text-gray-500 self-center">Jatuh Tempo</div>
                                    <div className="font-semibold text-gray-900 text-right">
                                        {dueDate && format(new Date(dueDate), "dd MMMM yyyy", { locale: idLocale })}
                                        {confirmationData.type === 'CREDIT' && (
                                            <span className="block text-xs text-blue-600 font-normal mt-0.5">
                                                (Tempo {confirmationData.diffDays} Hari)
                                            </span>
                                        )}
                                    </div>

                                    <Separator className="col-span-2 my-1" />

                                    <div className="text-gray-500 font-medium self-center">Total Tagihan</div>
                                    <div className="font-bold text-lg text-primary text-right">
                                        {formatCurrency(totalAmount)}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 italic bg-amber-50 p-2 rounded text-amber-700 border border-amber-100">
                                    <CheckCircle2 className="inline h-3 w-3 mr-1 mb-0.5" />
                                    Pastikan data sudah benar. Perubahan ini akan mempengaruhi pencatatan data.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Periksa Kembali</AlertDialogCancel>
                        <AlertDialogAction onClick={executeSubmit} className="bg-primary hover:bg-primary/90">
                            <Save className="h-4 w-4 mr-2" />
                            Simpan Perubahan
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <form onSubmit={handleFormSubmit} className="space-y-6">
                {/* Invoice Information */}
                <Card className="border-gray-100 shadow-sm">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-50/50 border-b">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 rounded-lg">
                                <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-semibold">Invoice Information</CardTitle>
                                <CardDescription>Basic details and dates</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Read-Only Info */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                    <div className="p-1.5 bg-amber-100 rounded">
                                        <Building className="h-3 w-3 text-amber-600" />
                                    </div>
                                    Supplier
                                </Label>
                                <div className="h-11 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed">
                                    <span className="font-medium">{invoice.supplier?.name}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                    <div className="p-1.5 bg-purple-100 rounded">
                                        <ShoppingCart className="h-3 w-3 text-purple-600" />
                                    </div>
                                    Purchase Order
                                </Label>
                                <div className="h-11 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed">
                                    <span className="font-medium">{invoice.purchaseOrder?.poNumber || "N/A"}</span>
                                </div>
                            </div>

                            {/* Editable Fields */}
                            <div className="space-y-2">
                                <Label htmlFor="supplierInvoiceNumber" className="text-sm font-medium flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-100 rounded">
                                        <Receipt className="h-3 w-3 text-blue-600" />
                                    </div>
                                    Supplier Invoice Number *
                                </Label>
                                <Input
                                    id="supplierInvoiceNumber"
                                    placeholder="Enter supplier invoice number"
                                    value={supplierInvoiceNumber}
                                    onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                                    required
                                    className="h-11 border-emerald-200 bg-emerald-50/50 focus:border-emerald-500 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status" className="text-sm font-medium flex items-center gap-2">
                                    <div className="p-1.5 bg-gray-100 rounded">
                                        <Hash className="h-3 w-3 text-gray-600" />
                                    </div>
                                    Status
                                </Label>
                                <Select value={status} onValueChange={(val: any) => setStatus(val)} disabled={role === "pic"}>
                                    <SelectTrigger className="h-11 border-emerald-200 bg-emerald-50/50 focus:ring-emerald-500">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SUPPLIER_INVOICE_STATUS_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full bg-${option.color}-500`} />
                                                    {option.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="invoiceDate" className="text-sm font-medium flex items-center gap-2">
                                        <div className="p-1.5 bg-emerald-100 rounded">
                                            <Calendar className="h-3 w-3 text-emerald-600" />
                                        </div>
                                        Invoice Date *
                                    </Label>
                                    <Input
                                        id="invoiceDate"
                                        type="date"
                                        value={invoiceDate}
                                        onChange={(e) => setInvoiceDate(e.target.value)}
                                        required
                                        className="h-11 border-emerald-200 bg-emerald-50/50 focus:border-emerald-500 focus:ring-emerald-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="dueDate" className="text-sm font-medium flex items-center gap-2">
                                        <div className="p-1.5 bg-rose-100 rounded">
                                            <Calendar className="h-3 w-3 text-rose-600" />
                                        </div>
                                        Due Date *
                                    </Label>
                                    <Input
                                        id="dueDate"
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        required
                                        className="h-11 border-emerald-200 bg-emerald-50/50 focus:border-emerald-500 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Items Information (Read-Only) */}
                <Card className="border-gray-100 shadow-sm opacity-80">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-50/50 border-b">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-primary/10 rounded-lg">
                                    <Package className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-semibold">Invoice Items</CardTitle>
                                    <CardDescription>
                                        Items are read-only in update mode
                                    </CardDescription>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gradient-to-r from-gray-50 to-gray-50/50">
                                        <TableHead className="font-semibold text-gray-700">Product</TableHead>
                                        <TableHead className="font-semibold text-gray-700 text-right">Quantity</TableHead>
                                        <TableHead className="font-semibold text-gray-700 text-right">Unit Price</TableHead>
                                        <TableHead className="font-semibold text-gray-700 text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoice.items && invoice.items.length > 0 ? (
                                        invoice.items.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">
                                                    <div className="space-y-1">
                                                        <p>{item.productName === "Product" ? (item.product?.name || item.productName) : item.productName}</p>
                                                        {item.productCode && (
                                                            <p className="text-xs text-gray-500">{item.productCode}</p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">{item.quantity}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                                                <TableCell className="text-right font-semibold">{formatCurrency(item.totalPrice)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                                                No items found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Financial Summary */}
                <Card className="border-gray-100 shadow-sm">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-50/50 border-b">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg">
                                <DollarSign className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-semibold">Financial Summary</CardTitle>
                                <CardDescription>Recalculate tax if needed</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Subtotal */}
                            <div className="space-y-4 p-5 bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-100 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-white rounded-lg">
                                            <DollarSign className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <span className="font-medium text-gray-700">Subtotal</span>
                                    </div>
                                    <div className="text-2xl font-bold text-blue-700">
                                        {formatCurrency(subtotal)}
                                    </div>
                                </div>
                            </div>

                            {/* Tax Calculation */}
                            <div className="space-y-4 p-5 bg-gradient-to-br from-purple-50 to-purple-50/50 border border-purple-100 rounded-xl">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-white rounded-lg">
                                                <Percent className="h-4 w-4 text-purple-600" />
                                            </div>
                                            <span className="font-medium text-gray-700">Tax Rate</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {[0, 11, 10].map((rate) => (
                                                <Button
                                                    key={rate}
                                                    type="button"
                                                    variant={taxRate === rate ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => handleTaxRateChange(rate)}
                                                    className={cn(
                                                        "h-8 px-3",
                                                        taxRate === rate && "bg-purple-600 hover:bg-purple-700"
                                                    )}
                                                >
                                                    {rate}%
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Tax Amount</span>
                                        <div className="text-xl font-semibold text-purple-700">
                                            {formatCurrency(taxAmountNumber)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Total Amount */}
                            <div className="space-y-4 p-5 bg-gradient-to-br from-emerald-50 to-emerald-50/50 border border-emerald-100 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-white rounded-lg">
                                            <DollarSign className="h-4 w-4 text-emerald-600" />
                                        </div>
                                        <span className="font-medium text-gray-700">Total Amount</span>
                                    </div>
                                    <div className="text-3xl font-bold text-emerald-700">
                                        {formatCurrency(totalAmount)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push(`${basePath}/accounting/supplier-invoice`)}
                        disabled={loading}
                        className="h-11 px-6 border-gray-200 hover:border-gray-300"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="h-11 px-8 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
