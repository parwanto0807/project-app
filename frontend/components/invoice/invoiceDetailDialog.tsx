import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import {
    X,
    FileText,
    CreditCard,
    Building,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Calendar,
    User,
    Hash,
    DollarSign,
    Receipt,
    TrendingUp,
    CheckSquare,
    AlertTriangle,
    DoorClosed,
    Loader2
} from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Invoice } from '@/schemas/invoice';
import { formatCurrencyNumber, formatDateToDDMMMYYYY } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { approveInvoice } from '@/lib/action/invoice/invoice';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';

interface InvoiceDetailDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    invoice: Invoice | null;
    onRefresh?: () => void; // ✅ NEW: Callback untuk refresh data
}

const ApprovedWatermark = () => (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-100/30 to-emerald-200/20"></div>
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <div className="relative w-full h-full">
                {/* Watermark diagonal berulang */}
                {Array.from({ length: 8 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute transform -rotate-45 origin-center"
                        style={{
                            top: `${(i * 25) - 10}%`,
                            left: '-10%',
                            width: '120%',
                        }}
                    >
                        <div className="flex items-center justify-center">
                            <span className="text-[4rem] md:text-[5rem] font-black text-green-600/30 tracking-widest whitespace-nowrap">
                                APPROVED • APPROVED • APPROVED • APPROVED
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Watermark utama di tengah */}
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="transform -rotate-45">
                <span className="text-[8rem] md:text-[12rem] font-black text-green-700/10 tracking-widest select-none">
                    APPROVED
                </span>
            </div>
        </div>
    </div>
);


export const InvoiceDetailDrawer = ({ open, onOpenChange, invoice, onRefresh }: InvoiceDetailDrawerProps) => {
    const [isApproving, setIsApproving] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    console.log("Data Invoice", invoice);

    if (!invoice) return null;
    const statusVariantMap: Record<string, "default" | "destructive" | "outline" | "secondary" | "success"> = {
        APPROVED: "success",
        DRAFT: "outline",
        WAITING_APPROVAL: "secondary",
        REJECTED: "destructive",
        CANCELLED: "outline",
    };

    const variant = statusVariantMap[invoice.status] || "outline";

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'APPROVED': return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'REJECTED': return <XCircle className="h-4 w-4 text-red-600" />;
            case 'DRAFT': return <FileText className="h-4 w-4 text-gray-600" />;
            case 'WAITING_APPROVAL': return <Clock className="h-4 w-4 text-amber-600" />;
            case 'CANCELLED': return <XCircle className="h-4 w-4 text-gray-600" />;
            default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
        }
    };

    const getPaymentMethodIcon = (method: string) => {
        switch (method) {
            case 'TRANSFER': return <CreditCard className="h-4 w-4 text-blue-600" />;
            case 'CASH': return <DollarSign className="h-4 w-4 text-green-600" />;
            case 'CREDIT_CARD': return <CreditCard className="h-4 w-4 text-purple-600" />;
            case 'VA': return <Building className="h-4 w-4 text-orange-600" />;
            case 'E_WALLET': return <CreditCard className="h-4 w-4 text-teal-600" />;
            case 'CHEQUE': return <FileText className="h-4 w-4 text-indigo-600" />;
            default: return <CreditCard className="h-4 w-4 text-gray-600" />;
        }
    };

    const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.balanceDue > 0;
    const isApproved = invoice.approvalStatus === "APPROVED";

    const handleApproveClick = () => {
        setShowConfirmDialog(true);
    };

    const handleConfirmApprove = async () => {
        if (!invoice?.id) return;

        setIsApproving(true);
        setShowConfirmDialog(false);

        // Sonner: Toast loading
        const toastId = toast.loading('Approving invoice...');

        try {
            await approveInvoice(invoice.id);

            // Sonner: Success toast
            toast.success(`Invoice ${invoice.invoiceNumber} has been successfully approved!`, {
                id: toastId,
                duration: 3000,
                action: {
                    label: 'View',
                    onClick: () => console.log('View invoice clicked'),
                },
            });

            onOpenChange(false);

            // ✅ REFRESH DATA TABEL
            if (onRefresh) {
                onRefresh();
            }

        } catch (error: unknown) {
            console.error('Error approving invoice:', error);

            // Sonner: Error toast
            toast.error(error instanceof Error ? error.message : 'Failed to approve invoice. Please try again.', {
                id: toastId,
                duration: 5000,
                action: {
                    label: 'Retry',
                    onClick: () => handleConfirmApprove(),
                },
            });
        } finally {
            setIsApproving(false);
        }
    };

    const canApprove = invoice?.approvalStatus === 'PENDING';

    return (
        <>
            <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
                <DrawerContent className="h-full w-full sm:w-[900px] ml-auto mb-10" aria-describedby={undefined}>
                    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50/50 to-gray-50/50">
                        <div className={cn(
                            "flex flex-col h-full bg-gradient-to-br from-blue-50/50 to-gray-50/50 relative",
                            isApproved && "bg-gradient-to-br from-green-50/60 to-emerald-100/40"
                        )}>
                            {/* Watermark APPROVED */}
                            {isApproved && <ApprovedWatermark />}

                            {/* Header dengan gradient - disesuaikan jika approved */}
                            <DrawerHeader className={cn(
                                "flex-shrink-0 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sm:p-6 relative z-10",
                                isApproved && "bg-gradient-to-r from-green-600 to-emerald-600"
                            )}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "p-2 bg-white/20 rounded-lg",
                                            isApproved && "bg-white/30"
                                        )}>
                                            <Receipt className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <DrawerTitle className="text-lg font-bold text-white">
                                                INVOICE DETAIL
                                                {isApproved && (
                                                    <span className="ml-2 text-emerald-200">✓</span>
                                                )}
                                            </DrawerTitle>
                                            <p className="text-blue-100 text-sm mt-1">
                                                {invoice.invoiceNumber}
                                                {isApproved && (
                                                    <span className="ml-2 text-emerald-200">• Approved</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onOpenChange(false)}
                                        className="h-8 w-8 text-white hover:bg-white/20"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex items-center justify-between mt-4">
                                    <div className="flex items-center gap-4">
                                        <Badge
                                            variant="secondary"
                                            className={cn(
                                                "capitalize text-xs bg-white/20 border-white/30 text-white",
                                                isApproved && "bg-white/30 border-white/40"
                                            )}
                                        >
                                            <Calendar className="h-3 w-3 mr-1" />
                                            {formatDateToDDMMMYYYY(invoice.invoiceDate)}
                                        </Badge>
                                        <Badge
                                            variant={variant}
                                            className="capitalize text-xs bg-white text-gray-800 font-semibold flex items-center gap-1"
                                        >
                                            {getStatusIcon(invoice.status)}
                                            {invoice.status.toLowerCase().replace("_", " ")}
                                        </Badge>
                                    </div>
                                    {isOverdue && (
                                        <Badge variant="destructive" className="text-xs flex items-center gap-1 animate-pulse relative z-10">
                                            <AlertTriangle className="h-3 w-3" />
                                            OVERDUE
                                        </Badge>
                                    )}
                                    {isApproved && (
                                        <Badge variant="success" className="text-xs flex items-center gap-1 bg-white/30 text-white border-white/40 relative z-10">
                                            <CheckCircle className="h-3 w-3" />
                                            APPROVED
                                        </Badge>
                                    )}
                                </div>
                            </DrawerHeader>

                            {/* Content */}
                            <ScrollArea className="flex-1 p-4 sm:px-6 overflow-y-auto">
                                <div className="space-y-6">
                                    {/* Header Invoice Card */}
                                    <div className="bg-white rounded-xl shadow-sm border p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Hash className="h-4 w-4 text-blue-600" />
                                                    <span>Invoice Number</span>
                                                </div>
                                                <p className="font-bold text-lg text-gray-900">{invoice.invoiceNumber}</p>
                                                <p className="font-bold text-xs text-gray-900">SO Number : {invoice.salesOrder.soNumber}</p>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <User className="h-4 w-4 text-green-600" />
                                                    <span>Client</span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{invoice.salesOrder.customer.name || "N/A"}</p>
                                                    <p className="text-sm text-muted-foreground">Kantor Cabang : {invoice.salesOrder.customer.branch || "N/A"}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <DollarSign className="h-4 w-4 text-amber-600" />
                                                    <span>Total Amount</span>
                                                </div>
                                                <p className="font-bold text-2xl text-blue-600">
                                                    {formatCurrencyNumber(invoice.totalAmount)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Informasi Tanggal dan Status */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Tanggal */}
                                        <div className="bg-white rounded-xl shadow-sm border p-6">
                                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-gray-700">
                                                <Calendar className="h-5 w-5 text-blue-600" />
                                                Date Information
                                            </h3>
                                            <div className="space-y-4">
                                                <DateInfo
                                                    label="Invoice Date"
                                                    date={invoice.invoiceDate}
                                                    icon={<FileText className="h-4 w-4 text-green-600" />}
                                                />
                                                <DateInfo
                                                    label="Due Date"
                                                    date={invoice.dueDate}
                                                    icon={<Clock className="h-4 w-4 text-amber-600" />}
                                                    isOverdue={isOverdue}
                                                />
                                            </div>
                                            <div className="space-y-2 mt-6">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <span className="font-medium w-32">Bank Name:</span>
                                                    <span className="text-gray-900">{invoice.bankAccount.bankName || "-"}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <span className="font-xs w-32">Account Number:</span>
                                                    <span className="text-gray-900">{invoice.bankAccount.accountNumber || "-"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status dan Metadata */}
                                        <div className="bg-white rounded-xl shadow-sm border p-6">
                                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-gray-700">
                                                <TrendingUp className="h-5 w-5 text-purple-600" />
                                                Status & Metadata
                                            </h3>
                                            <div className="space-y-4">
                                                <MetadataInfo
                                                    label="Created"
                                                    value={formatDateToDDMMMYYYY(invoice.createdAt)}
                                                />
                                                <MetadataInfo
                                                    label="Last Updated"
                                                    value={formatDateToDDMMMYYYY(invoice.updatedAt)}
                                                />
                                                {invoice.approvedById && (
                                                    <MetadataInfo
                                                        label="Approved By"
                                                        value={`${invoice.approvedBy.namaLengkap} - ${invoice.approvedBy.jabatan} `}
                                                        icon={<CheckSquare className="h-4 w-4 text-green-600" />}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items Table */}
                                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                        <div className="p-6 border-b">
                                            <h3 className="font-semibold text-lg flex items-center gap-2 text-gray-700">
                                                <Receipt className="h-5 w-5 text-blue-600" />
                                                Invoice Items ({invoice.items.length})
                                            </h3>
                                        </div>
                                        <div className="p-1">
                                            {/* Table Header */}
                                            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                <div className="col-span-5">Item Description</div>
                                                <div className="col-span-1 text-center">Quantity</div>
                                                <div className="col-span-2 text-right">Unit Price</div>
                                                <div className="col-span-1 text-center">Discount %</div>
                                                <div className="col-span-1 text-center">Tax</div>
                                                <div className="col-span-2 text-right">Total</div>
                                            </div>

                                            {/* Items List */}
                                            <div className="divide-y">
                                                {invoice.items.map((item, idx) => {
                                                    // Handle discountPercent yang mungkin undefined
                                                    const discountPercent = item.discountPercent || 0;

                                                    // Hitung subtotal sebelum diskon
                                                    const subtotalBeforeDiscount = item.qty * item.unitPrice;

                                                    // Hitung nilai diskon (aman karena discountPercent sudah di-handle)
                                                    const discountAmount = subtotalBeforeDiscount * (discountPercent / 100);

                                                    // Hitung subtotal setelah diskon
                                                    const subtotalAfterDiscount = subtotalBeforeDiscount - discountAmount;

                                                    return (
                                                        <div key={idx} className="grid grid-cols-12 gap-4 px-4 py-3 text-sm hover:bg-gray-50/50 transition-colors">
                                                            <div className="col-span-5 font-medium text-gray-900">{item.name}</div>
                                                            <div className="col-span-1 text-center text-gray-600">{item.qty}</div>
                                                            <div className="col-span-2 text-right text-gray-700">
                                                                {formatCurrencyNumber(item.unitPrice)}
                                                            </div>
                                                            <div
                                                                className={`col-span-1 text-center ${discountPercent > 0
                                                                    ? "text-red-600 font-bold"
                                                                    : "text-gray-600"
                                                                    }`}
                                                            >
                                                                {discountPercent}%
                                                            </div>
                                                            <div className="col-span-1 text-center text-gray-600">
                                                                {item.taxRate ?? 0}%
                                                            </div>
                                                            <div className="col-span-2 text-right font-semibold text-blue-600">
                                                                {formatCurrencyNumber(subtotalAfterDiscount)}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Amount Summary */}
                                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-sm text-white p-6">
                                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                            <DollarSign className="h-5 w-5" />
                                            Amount Summary
                                        </h3>
                                        <div className="space-y-3 max-w-md ml-auto">
                                            <AmountRow
                                                label="Subtotal"
                                                value={invoice.subtotal}
                                                className="text-blue-100"
                                            />
                                            <AmountRow
                                                label="Tax Amount"
                                                value={isNaN(invoice.taxAmount) ? 0 : invoice.taxAmount}
                                                className="text-blue-100"
                                            />
                                            <Separator className="bg-white/30" />
                                            <AmountRow
                                                label="Total Amount"
                                                value={isNaN(invoice.totalAmount) ? 0 : invoice.totalAmount}
                                                className="font-bold text-lg text-white"
                                            />
                                            <AmountRow
                                                label="Amount Paid"
                                                value={isNaN(invoice.amountPaid) ? 0 : invoice.amountPaid}
                                                className="text-green-300"
                                            />
                                            <Separator className="bg-white/30" />
                                            <AmountRow
                                                label="Balance Due"
                                                value={invoice.balanceDue}
                                                className={cn(
                                                    "font-bold text-lg",
                                                    invoice.balanceDue > 0 ? "text-red-300" : "text-green-300"
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {/* Riwayat Pembayaran */}
                                    {invoice.payments && invoice.payments.length > 0 && (
                                        <div className="bg-white rounded-xl shadow-sm border p-6">
                                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-gray-700">
                                                <CreditCard className="h-5 w-5 text-green-600" />
                                                Payment History ({invoice.payments.length})
                                            </h3>
                                            <div className="space-y-3">
                                                {invoice.payments.map((payment, index) => (
                                                    <div key={payment.id || index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-green-100 rounded-lg">
                                                                {getPaymentMethodIcon(payment.method)}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-900">
                                                                    {formatDateToDDMMMYYYY(payment.payDate)}
                                                                </p>
                                                                <p className="text-sm text-green-600 font-medium capitalize">
                                                                    {payment.method.replace('_', ' ').toLowerCase()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-lg text-green-600">
                                                                {formatCurrencyNumber(payment.amount)}
                                                            </p>
                                                            {payment.createdAt && (
                                                                <p className="text-xs text-gray-500">
                                                                    recorded {formatDateToDDMMMYYYY(payment.createdAt)}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Alasan Penolakan */}
                                    {invoice.status === 'REJECTED' && invoice.rejectionReason && (
                                        <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 p-6">
                                            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-red-700">
                                                <AlertCircle className="h-5 w-5 text-red-600" />
                                                Rejection Reason
                                            </h3>
                                            <div className="p-3 bg-white rounded-lg border border-red-200">
                                                <p className="text-sm text-red-700">{invoice.rejectionReason}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>

                            {/* Footer */}
                            <div className="flex-shrink-0 border-t bg-white p-4 mb-8">
                                <div className="flex gap-3 flex-wrap">
                                    {/* Reject Button - Modern Red */}
                                    <Button
                                        onClick={() => {
                                            toast.info('Reject feature coming soon!');
                                        }}
                                        className="flex-1 bg-gradient-to-br from-red-400 via-red-500 to-red-600 
                       hover:from-red-500 hover:via-red-600 hover:to-red-700
                       dark:from-red-600 dark:via-red-700 dark:to-red-800
                       dark:hover:from-red-700 dark:hover:via-red-800 dark:hover:to-red-900
                       text-white font-semibold shadow-lg hover:shadow-red-500/25
                       dark:shadow-red-600/25 transition-all duration-300 hover:-translate-y-0.5
                       border-0 min-w-[140px] relative overflow-hidden group"
                                        size="sm"
                                        disabled={isApproving || !canApprove}
                                    >
                                        <span className="relative z-10 flex items-center">
                                            <X className="w-4 h-4 mr-2" />
                                            Reject Invoice
                                        </span>
                                    </Button>

                                    {/* Close Button - Modern Gray */}
                                    <Button
                                        onClick={() => onOpenChange(false)}
                                        className="flex-1 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 
                   hover:from-gray-200 hover:via-gray-300 hover:to-gray-400
                   dark:from-gray-700 dark:via-gray-800 dark:to-gray-900
                   dark:hover:from-gray-600 dark:hover:via-gray-700 dark:hover:to-gray-800
                   text-gray-800 dark:text-gray-200 font-medium 
                   border border-gray-300 dark:border-gray-600
                   shadow-lg hover:shadow-xl transition-all duration-300
                   min-w-[120px] relative overflow-hidden group"
                                        variant="outline"
                                        size="sm"
                                    >
                                        <span className="relative z-10 flex items-center">
                                            <DoorClosed className="w-4 h-4 mr-2" />
                                            Close
                                        </span>
                                    </Button>

                                    {/* Approve Button */}
                                    <Button
                                        onClick={handleApproveClick}
                                        disabled={isApproving || !canApprove}
                                        className="flex-1 bg-gradient-to-br from-green-400 via-green-500 to-green-600 
                       hover:from-green-500 hover:via-green-600 hover:to-green-700
                       dark:from-green-600 dark:via-green-700 dark:to-green-800
                       dark:hover:from-green-700 dark:hover:via-green-800 dark:hover:to-green-900
                       text-white font-semibold shadow-lg hover:shadow-green-500/25
                       dark:shadow-green-600/25 transition-all duration-300 hover:-translate-y-0.5
                       border-0 min-w-[140px] relative overflow-hidden group"
                                        size="sm"
                                    >
                                        <span className="relative z-10 flex items-center">
                                            {isApproving ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                            )}
                                            {isApproving ? 'Approving...' : 'Approve Invoice'}
                                        </span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
            {/* Confirmation Dialog */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Approve Invoice?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to approve invoice <strong>{invoice?.invoiceNumber}</strong>?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            disabled={isApproving}
                            onClick={() => toast.info('Approval cancelled')}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmApprove}
                            disabled={isApproving}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isApproving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Approving...
                                </>
                            ) : (
                                'Yes, Approve'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

// Komponen DateInfo
const DateInfo = ({ label, date, icon, isOverdue = false }: {
    label: string;
    date: string;
    icon: React.ReactNode;
    isOverdue?: boolean;
}) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm text-gray-600">{label}</span>
        </div>
        <span className={cn(
            "font-medium text-sm",
            isOverdue ? "text-red-600 font-semibold" : "text-gray-900"
        )}>
            {formatDateToDDMMMYYYY(date)}
        </span>
    </div>
);

// Komponen MetadataInfo
const MetadataInfo = ({ label, value, icon }: {
    label: string;
    value: string;
    icon?: React.ReactNode;
}) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm text-gray-600">{label}</span>
        </div>
        <span className="font-medium text-sm text-gray-900">{value}</span>
    </div>
);

// Komponen AmountRow
const AmountRow = ({ label, value, className }: { label: string; value: number; className?: string }) => (
    <div className="flex justify-between items-center py-1">
        <span className="text-sm">{label}</span>
        <span className={cn("font-medium", className)}>
            {formatCurrencyNumber(value)}
        </span>
    </div>
);