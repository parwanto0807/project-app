"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
    FileText,
    Eye,
    Edit,
    Trash2,
    CreditCard,
    MoreHorizontal,
    Building,
    PrinterCheck,
    Printer,
    Loader2,
    Download,
    BanknoteArrowDown,
    BookCheck,
    AlertTriangle,
    FileSpreadsheet,
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { Invoice } from "@/schemas/invoice";
import { InvoiceDetailDrawer } from "./invoiceDetailDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import InvoicePdfDocument from "./invoicePdfPreview";
import { PaymentProcessDialog } from "./paymentProcessDialog";
import { BankAccount } from "@/schemas/bank";
import { deleteInvoice, postInvoiceToJournal } from "@/lib/action/invoice/invoice";
import { toast } from "sonner";
import InvoicePdfDocumentOld from "./invoicePdfPreviewOld";
import { FaToolbox } from "react-icons/fa";
import InvoiceSummaryPDF from "./InvoiceSummaryPDF";



interface InvoiceDataTableProps {
    invoiceData: Invoice[];
    isLoading: boolean;
    role: string | undefined;
    banks: BankAccount[];
    currentUser: { id: string, name: string } | undefined;
    onRefresh?: () => void; // ✅ NEW: Callback untuk refresh data
}

export function InvoiceDataTable({ invoiceData, isLoading, banks, currentUser, onRefresh }: InvoiceDataTableProps) {
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isOldPdfPreviewOpen, setIsOldPdfPreviewOpen] = useState(false);
    const [isNewPdfPreviewOpen, setIsNewPdfPreviewOpen] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isPostJournalOpen, setIsPostJournalOpen] = useState(false); // Added
    const [isSummaryPdfOpen, setIsSummaryPdfOpen] = useState(false);

    const handlePostJournalClick = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsPostJournalOpen(true);
    };

    const executePostToJournal = async () => {
        if (!selectedInvoice) return;

        toast.promise(
            postInvoiceToJournal(selectedInvoice.id),
            {
                loading: 'Posting ke Jurnal...',
                success: () => {
                    onRefresh?.();
                    setIsPostJournalOpen(false);
                    return 'Invoice berhasil diposting ke Jurnal!';
                },
                error: (err) => `Gagal memposting jurnal: ${err.message}`,
            }
        );
    };

    const handleDeleteInvoice = async (invoiceId: string) => {
        if (confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
            try {
                await deleteInvoice(invoiceId);
                toast.success("Invoice deleted successfully");

                window.location.reload();

            } catch (error) {
                console.error("Delete invoice error:", error);
                toast.error("Failed to delete invoice");
            }
        }
    };

    const handleExportCSV = () => {
        if (!invoiceData.length) {
            toast.error("Tidak ada data untuk diekspor");
            return;
        }

        const headers = [
            "Invoice #",
            "SO #",
            "Customer",
            "Branch",
            "Project",
            "Invoice Date",
            "Due Date",
            "Currency",
            "Total Amount",
            "Balance Due",
            "Status",
            "Approval Status"
        ];

        const rows = invoiceData.map(inv => [
            `"${inv.invoiceNumber}"`,
            `"${inv.salesOrder.soNumber}"`,
            `"${inv.salesOrder.customer.name.replace(/"/g, '""')}"`,
            `"${(inv.salesOrder.customer.branch || "").replace(/"/g, '""')}"`,
            `"${(inv.salesOrder.project?.name || "").replace(/"/g, '""')}"`,
            inv.invoiceDate,
            inv.dueDate,
            "IDR",
            inv.totalAmount,
            inv.balanceDue,
            inv.status,
            inv.approvalStatus
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Invoices-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Data Invoice berhasil diekspor ke CSV");
    };

    const handlePaymentClick = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setDialogOpen(true);
    };

    const handleViewDetails = async (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setDrawerOpen(true);
    };

    const handlePdfPreview = (invoice: Invoice, mode: 'old' | 'new' = 'new') => {
        setSelectedInvoice(invoice);
        if (mode === 'old') {
            setIsOldPdfPreviewOpen(true);
        } else {
            setIsNewPdfPreviewOpen(true);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            DRAFT: { variant: "outline" as const, label: "DRAFT" },
            WAITING_APPROVAL: { variant: "secondary" as const, label: "WAITING APPROVAL" },
            APPROVED: { variant: "default" as const, label: "APPROVED" },
            REJECTED: { variant: "destructive" as const, label: "REJECTED" },
            UNPAID: { variant: "warning" as const, label: "UNPAID" },
            PARTIALLY_PAID: { variant: "secondary" as const, label: "PARTIALLY PAID" },
            PAID: { variant: "success" as const, label: "PAID" },
            OVERDUE: { variant: "destructive" as const, label: "OVERDUE" },
            CANCELLED: { variant: "outline" as const, label: "CANCELLED" },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;

        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const getApproveStatusBadge = (approvalStatus: string) => {
        const approvalStatusConfig = {
            PENDING: {
                variant: "outline" as const,
                label: "PENDING",
                className: "border-amber-200 bg-amber-50 text-amber-700"
            },
            APPROVED: {
                variant: "default" as const,
                label: "APPROVED",
                className: "bg-blue-500 text-white border-blue-600"
            },
            REJECTED: {
                variant: "destructive" as const,
                label: "REJECTED",
                className: "bg-red-500 text-white border-red-600"
            },
            POSTED: {
                variant: "secondary" as const,
                label: "POSTED",
                className: "bg-emerald-500 text-white border-emerald-600" // ✅ Green for success
            },
        };

        const config = approvalStatusConfig[approvalStatus as keyof typeof approvalStatusConfig] || approvalStatusConfig.PENDING;

        return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <Skeleton className="h-10 flex-1" />
                            <Skeleton className="h-10 w-32" />
                        </div>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {[...Array(6)].map((_, i) => (
                                            <TableHead key={i}>
                                                <Skeleton className="h-4 w-20" />
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[...Array(5)].map((_, i) => (
                                        <TableRow key={i}>
                                            {[...Array(6)].map((_, j) => (
                                                <TableCell key={j}>
                                                    <Skeleton className="h-4 w-full" />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="w-full border rounded-lg md:p-0">
            <Card className="border-none shadow-none m-0">
                <CardContent>
                    <div className="flex justify-end mb-4 gap-2">
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={handleExportCSV}
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                            Export CSV
                        </Button>
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => setIsSummaryPdfOpen(true)}
                        >
                            <Printer className="h-4 w-4" />
                            Print Summary (A4 Landscape)
                        </Button>
                    </div>
                    {/* Desktop View */}
                    <div className="hidden md:block rounded-md border m-0">
                        <Table className="min-w-full">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice #</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Project</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead>Status & Approved</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoiceData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p>No invoices found</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    invoiceData.map((invoice) => (
                                        <TableRow key={invoice.id}>
                                            <TableCell className="font-medium">
                                                {/* Invoice Badge */}
                                                <div className="flex items-center bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded px-1.5 py-0.5 mb-1">
                                                    <span className="text-[10px] font-bold text-blue-700 bg-blue-200 px-1 py-0.5 rounded mr-1">INV</span>
                                                    <span className="text-xs font-medium text-gray-900">{invoice.invoiceNumber}</span>
                                                </div>

                                                {/* SO Badge */}
                                                <div className="flex items-center bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded px-1.5 py-0.5">
                                                    <span className="text-[10px] font-bold text-green-700 bg-green-200 px-1 py-0.5 rounded mr-1">SO&nbsp;</span>
                                                    <span className="text-xs font-medium text-gray-900">{invoice.salesOrder.soNumber}</span>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex flex-col space-y-1.5">
                                                    {/* Customer Name - Professional Finance Style */}
                                                    <div className="flex items-center gap-2">
                                                        <Building className="h-4 w-4 text-blue-600" />
                                                        <span className="font-bold text-gray-900 text-sm font-['Inter']">
                                                            {invoice.salesOrder.customer.name}
                                                        </span>
                                                    </div>

                                                    {/* Branch Info - Subtle but clear */}
                                                    <div className="flex items-center gap-2 pl-6">
                                                        <span className="text-xs text-gray-600 font-medium bg-gray-100 px-2 py-1 rounded">
                                                            Kantor Cabang: {invoice.salesOrder.customer.branch}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="group relative">
                                                    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg ${invoice.salesOrder?.project?.name} 'bg-green-50' : 'bg-gray-100'}`}>
                                                                <FaToolbox className={`h-4 w-4 ${invoice.salesOrder?.project?.name ? 'text-green-600' : 'text-gray-400'}`} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                {/* <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Project</div> */}
                                                                <div className="text-xs uppercase font-bold text-gray-900 text-wrap">
                                                                    {invoice.salesOrder?.project?.name || (
                                                                        <span className="text-gray-400 italic font-normal">No Project Assigned</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <div className="flex">
                                                        {/* Timeline */}
                                                        <div className="flex flex-col items-center mr-3">
                                                            <div className="w-2 h-2 bg-green-500 rounded-full mb-1"></div>
                                                            <div className="w-0.5 h-6 bg-gray-300"></div>
                                                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                                        </div>

                                                        {/* Dates - Fixed Column Layout */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center mb-1">
                                                                <div className="text-xs font-medium text-gray-500 w-24 flex-shrink-0">INVOICE DATE</div>
                                                                <div className="text-xs font-bold text-gray-900 truncate">{formatDate(invoice.invoiceDate)}</div>
                                                            </div>

                                                            <div className="flex items-center">
                                                                <div className="text-xs font-medium text-gray-500 w-24 flex-shrink-0">DUE DATE</div>
                                                                <div className="text-xs font-bold text-gray-900 truncate">{formatDate(invoice.dueDate)}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            {/* Total Amount Cell */}
                                            <TableCell className="text-right">
                                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <BanknoteArrowDown className="h-5 w-5 text-green-600" />
                                                        <span className="text-xl font-bold text-gray-900">
                                                            {formatCurrency(invoice.totalAmount)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-end mt-1">
                                                        <Badge
                                                            variant="outline"
                                                            className={`${new Date(invoice.dueDate) < new Date() && invoice.balanceDue > 0
                                                                ? "bg-red-500 text-white border-red-600 hover:bg-red-600"
                                                                : "text-green-700 bg-green-100 border-green-200 hover:bg-green-200"
                                                                }`}
                                                        >
                                                            Balance Due = {formatCurrency(invoice.balanceDue)}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Status Cell */}
                                            <TableCell>
                                                <div className="flex flex-col gap-2 items-start">
                                                    {getStatusBadge(invoice.status)}
                                                    {getApproveStatusBadge(invoice.approvalStatus)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-row-reverse gap-2">
                                                    {(invoice.approvalStatus === "POSTED" ||
                                                        (invoice.approvalStatus === "APPROVED" && new Date(invoice.invoiceDate) < new Date('2026-01-01'))) && (
                                                            <div>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handlePaymentClick(invoice)}
                                                                    disabled={invoice.balanceDue <= 0}
                                                                    className={`flex cursor-pointer items-center gap-1 ${invoice.balanceDue <= 0 ? "opacity-50 cursor-not-allowed" : ""
                                                                        }`}
                                                                >
                                                                    <CreditCard className="h-4 w-4 mr-2 text-green-600" />
                                                                    Pay
                                                                </Button>
                                                            </div>
                                                        )}

                                                    {/* Posting Journal Button */}
                                                    {invoice.status !== "PAID" &&
                                                        invoice.approvalStatus === "APPROVED" &&
                                                        new Date(invoice.invoiceDate) >= new Date('2026-01-01') && (
                                                            <div>
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                size="sm"
                                                                                onClick={() => handlePostJournalClick(invoice)}
                                                                                className="flex cursor-pointer items-center gap-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-0 shadow-md transition-all duration-200"
                                                                            >
                                                                                <BookCheck className="h-4 w-4 mr-2" />
                                                                                Posting
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p className="max-w-xs text-center">Mencatat invoice ini ke dalam Buku Besar sebagai Piutang Usaha dan Pendapatan.</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </div>
                                                        )}

                                                    <div className="flex items-center gap-2">
                                                        {/* View Details Button */}
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => handleViewDetails(invoice)}
                                                            className="h-9 px-3 rounded-lg border border-slate-300 bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-md transition-all duration-200 group cursor-pointer flex items-center gap-2 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-emerald-950/30 dark:hover:border-emerald-700 dark:text-slate-200"
                                                        >
                                                            <Eye className="h-4 w-4 text-slate-600 group-hover:text-emerald-600 transition-colors duration-200 dark:text-slate-400 dark:group-hover:text-emerald-400" />
                                                            <span className="text-sm font-medium text-slate-700 group-hover:text-emerald-700 dark:text-slate-300 dark:group-hover:text-emerald-300">
                                                                Details
                                                            </span>
                                                        </Button>

                                                        {/* Preview PDF Button */}
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handlePdfPreview(invoice, 'old')}
                                                                className="h-8 px-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 cursor-pointer flex items-center gap-1 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
                                                                title="Mode Print Lama"
                                                            >
                                                                <Printer className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                                                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Lama</span>
                                                            </Button>

                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handlePdfPreview(invoice, 'new')}
                                                                className="h-8 px-2 rounded-lg border border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 transition-all duration-200 cursor-pointer flex items-center gap-1 dark:border-blue-600 dark:bg-blue-950/30 dark:hover:bg-blue-950/50"
                                                                title="Mode Print Baru"
                                                            >
                                                                <PrinterCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                                                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Baru</span>
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuItem
                                                                    className={invoice.approvalStatus === "PENDING" ? "cursor-pointer" : "text-gray-400 cursor-not-allowed"}
                                                                    onClick={invoice.approvalStatus === "PENDING" ? () => window.location.href = `/admin-area/finance/invoice/update/${invoice.id}` : undefined}
                                                                    disabled={invoice.approvalStatus !== "PENDING"}
                                                                >
                                                                    <Edit className="h-4 w-4 mr-2" />
                                                                    Edit Invoice
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className={invoice.approvalStatus === "PENDING" ? "text-red-600" : "text-gray-400"}
                                                                    onClick={invoice.approvalStatus === "PENDING" ? () => handleDeleteInvoice(invoice.id) : undefined}
                                                                    disabled={invoice.approvalStatus !== "PENDING"}
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Delete Invoice
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden space-y-2">
                        {invoiceData.map((invoice) => (
                            <Card key={invoice.id} className="p-2">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="font-semibold text-sm">{invoice.invoiceNumber}</p>
                                        <p className="text-xs text-gray-500">{invoice.salesOrder.customer.name}</p>
                                    </div>
                                    {getStatusBadge(invoice.status)}
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Amount:</span>
                                        <span className="font-medium">{formatCurrency(invoice.totalAmount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Due Date:</span>
                                        <span>{formatDate(invoice.dueDate)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Date:</span>
                                        <span>{formatDate(invoice.invoiceDate)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Approval:</span>
                                        {getApproveStatusBadge(invoice.approvalStatus)}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleViewDetails(invoice)}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePaymentClick(invoice)}
                                        disabled={(invoice.approvalStatus !== "POSTED" &&
                                            !(invoice.approvalStatus === "APPROVED" && new Date(invoice.invoiceDate) < new Date('2026-01-01'))) ||
                                            invoice.balanceDue <= 0}
                                        className={(invoice.balanceDue <= 0) ? "opacity-50 cursor-not-allowed" : ""}
                                    >
                                        <CreditCard className="h-4 w-4" />
                                    </Button>
                                    {invoice.status !== "PAID" &&
                                        invoice.approvalStatus === "APPROVED" &&
                                        new Date(invoice.invoiceDate) >= new Date('2026-01-01') && (
                                            <Button
                                                size="sm"
                                                onClick={() => handlePostJournalClick(invoice)}
                                                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-0 shadow-sm"
                                            >
                                                <BookCheck className="h-4 w-4" />
                                            </Button>
                                        )}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handlePdfPreview(invoice, 'old')}>
                                                <Printer className="h-4 w-4 mr-2" />
                                                PDF Lama
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handlePdfPreview(invoice, 'new')}>
                                                <PrinterCheck className="h-4 w-4 mr-2" />
                                                PDF Baru
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={invoice.approvalStatus === "PENDING" ? () => window.location.href = `/admin-area/finance/invoice/update/${invoice.id}` : undefined}
                                                disabled={invoice.approvalStatus !== "PENDING"}
                                            >
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-red-600"
                                                onClick={invoice.approvalStatus === "PENDING" ? () => handleDeleteInvoice(invoice.id) : undefined}
                                                disabled={invoice.approvalStatus !== "PENDING"}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Invoice Detail Drawer */}
            <InvoiceDetailDrawer
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                invoice={selectedInvoice}
                onRefresh={onRefresh} // ✅ Pass onRefresh
            />

            {/* Payment Process Dialog */}
            {selectedInvoice && (
                <PaymentProcessDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    invoiceId={selectedInvoice.id}
                    invoiceNumber={selectedInvoice.invoiceNumber}
                    balanceDue={selectedInvoice.balanceDue}
                    banks={banks}
                    currentUser={currentUser}
                    installments={[]}
                    onRefresh={onRefresh} // ✅ Pass onRefresh
                    invoiceDate={selectedInvoice.invoiceDate} // ✅ Pass invoiceDate
                />
            )}

            {/* Modal Preview PDF - Mode Baru */}
            <Dialog open={isNewPdfPreviewOpen} onOpenChange={setIsNewPdfPreviewOpen}>
                <DialogContent className="max-w-4xl max-h-screen overflow-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Preview PDF Invoice: {selectedInvoice?.invoiceNumber}
                            <Badge variant="default" className="ml-2 bg-blue-600">
                                Mode Baru
                            </Badge>
                        </DialogTitle>
                    </DialogHeader>
                    {selectedInvoice && (
                        <div className="py-4">
                            <PDFDownloadLink
                                document={<InvoicePdfDocument invoice={selectedInvoice} />}
                                fileName={`Invoice-${selectedInvoice.invoiceNumber}-baru.pdf`}
                            >
                                {({ loading }) =>
                                    loading ? (
                                        <Button disabled>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Memuat PDF...
                                        </Button>
                                    ) : (
                                        <Button>
                                            <Download className="h-4 w-4 mr-2" />
                                            Unduh PDF (Mode Baru)
                                        </Button>
                                    )
                                }
                            </PDFDownloadLink>

                            <div className="mt-6 border-t pt-4">
                                <h3 className="text-lg font-medium mb-4">Preview Dokumen - Mode Baru</h3>
                                <div className="bg-white rounded shadow" style={{ height: "600px" }}>
                                    <PDFViewer width="100%" height="100%">
                                        <InvoicePdfDocument invoice={selectedInvoice} />
                                    </PDFViewer>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal Preview PDF - Mode Lama */}
            <Dialog open={isOldPdfPreviewOpen} onOpenChange={setIsOldPdfPreviewOpen}>
                <DialogContent className="max-w-4xl max-h-screen overflow-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Preview PDF Invoice: {selectedInvoice?.invoiceNumber}
                            <Badge variant="outline" className="ml-2 border-slate-400 text-slate-600">
                                Mode Lama
                            </Badge>
                        </DialogTitle>
                    </DialogHeader>
                    {selectedInvoice && (
                        <div className="py-4">
                            <PDFDownloadLink
                                document={<InvoicePdfDocumentOld invoice={selectedInvoice} />}
                                fileName={`Invoice-${selectedInvoice.invoiceNumber}-lama.pdf`}
                            >
                                {({ loading }) =>
                                    loading ? (
                                        <Button disabled>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Memuat PDF...
                                        </Button>
                                    ) : (
                                        <Button variant="outline">
                                            <Download className="h-4 w-4 mr-2" />
                                            Unduh PDF (Mode Lama)
                                        </Button>
                                    )
                                }
                            </PDFDownloadLink>

                            <div className="mt-6 border-t pt-4">
                                <h3 className="text-lg font-medium mb-4">Preview Dokumen - Mode Lama</h3>
                                <div className="bg-white rounded shadow" style={{ height: "600px" }}>
                                    <PDFViewer width="100%" height="100%">
                                        <InvoicePdfDocumentOld invoice={selectedInvoice} />
                                    </PDFViewer>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal Preview PDF - Summary Report */}
            <Dialog open={isSummaryPdfOpen} onOpenChange={setIsSummaryPdfOpen}>
                <DialogContent className="max-w-4xl max-h-screen overflow-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Preview PDF Summary Report
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <PDFDownloadLink
                            document={<InvoiceSummaryPDF data={invoiceData} />}
                            fileName={`Invoice-Summary-${new Date().toISOString().split('T')[0]}.pdf`}
                        >
                            {({ loading }) =>
                                loading ? (
                                    <Button disabled>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Memuat PDF...
                                    </Button>
                                ) : (
                                    <Button>
                                        <Download className="h-4 w-4 mr-2" />
                                        Unduh Laporan PDF
                                    </Button>
                                )
                            }
                        </PDFDownloadLink>

                        <div className="mt-6 border-t pt-4">
                            <h3 className="text-lg font-medium mb-4">Preview Dokumen</h3>
                            <div className="bg-white rounded shadow" style={{ height: "600px" }}>
                                <PDFViewer width="100%" height="100%">
                                    <InvoiceSummaryPDF data={invoiceData} />
                                </PDFViewer>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog Posting Jurnal */}
            {/* Confirmation Dialog Posting Jurnal */}
            <AlertDialog open={isPostJournalOpen} onOpenChange={setIsPostJournalOpen}>
                <AlertDialogContent className="max-w-[480px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl bg-white">
                    {/* Decorative Header Bar */}
                    <div className="bg-gradient-to-r from-emerald-500 to-green-600 h-2 w-full" />

                    <div className="p-6 pt-8">
                        <AlertDialogHeader className="mb-6">
                            {/* Centered Icon with Ring Animation Effect */}
                            <div className="mx-auto bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-inner ring-8 ring-emerald-50/50">
                                <BookCheck className="h-9 w-9 text-emerald-600 drop-shadow-sm" />
                            </div>

                            <AlertDialogTitle className="text-center text-2xl font-bold text-gray-900 tracking-tight">
                                Posting Jurnal
                            </AlertDialogTitle>

                            <AlertDialogDescription className="text-center text-gray-500 text-[15px] leading-relaxed mt-2 max-w-sm mx-auto">
                                Anda akan mencatat transaksi Invoice <span className="font-semibold text-gray-900">{selectedInvoice?.invoiceNumber}</span> ke dalam Buku Besar.
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        {/* Warning / Information Box */}
                        <div className="bg-amber-50/80 border border-amber-100 rounded-xl p-4 mb-8">
                            <div className="flex gap-3 items-start">
                                <div className="p-1.5 bg-amber-100 rounded-full shrink-0 mt-0.5">
                                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Penting Diperhatikan</p>
                                    <p className="text-sm text-amber-700/90 leading-snug">
                                        Invoice yang sudah diposting <strong>tidak dapat diedit langsung</strong>. Koreksi data memerlukan proses <span className="font-medium">Jurnal Balik (Reversal)</span> secara manual.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-center gap-3 w-full">
                            <AlertDialogCancel className="w-full sm:w-auto h-11 px-6 rounded-xl border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm order-1 sm:order-none mt-2 sm:mt-0">
                                Batal
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={executePostToJournal}
                                className="w-full sm:w-auto h-11 px-8 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold shadow-lg shadow-emerald-200 transition-all hover:shadow-emerald-300 transform active:scale-[0.98]"
                            >
                                Ya, Posting Sekarang
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}