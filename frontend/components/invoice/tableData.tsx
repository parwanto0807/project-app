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
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
    FileText,
    Eye,
    FileDown,
    Edit,
    Trash2,
    CreditCard,
    MoreHorizontal,
    Building,
    DollarSign,
    Wallet2Icon,
    SearchIcon,
    PlusCircleIcon,
    PrinterCheck
} from "lucide-react";
import { Invoice } from "@/schemas/invoice";
import Link from "next/link";
import { InvoiceDetailDrawer } from "./invoiceDetailDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import InvoicePdfDocument from "./invoicePdfPreview";
import { PaymentProcessDialog } from "./paymentProcessDialog";
import { BankAccount } from "@/schemas/bank";
import { deleteInvoice } from "@/lib/action/invoice/invoice";
import { toast } from "sonner";

interface InvoiceDataTableProps {
    invoiceData: Invoice[];
    isLoading: boolean;
    role: string | undefined;
    banks: BankAccount[];
    currentUser: { id: string, name: string } | undefined
}

function getBasePath(role?: string) {
    return role === "super"
        ? "/super-admin-area/finance/invoice"
        : "/admin-area/finance/invoice"
}

export function InvoiceDataTable({ invoiceData, isLoading, role, banks, currentUser }: InvoiceDataTableProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const basePath = getBasePath(role);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false);

    // Filter data berdasarkan search term
    const filteredData = invoiceData.filter((invoice) =>
        Object.values(invoice).some((value) =>
            value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

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

    const handlePaymentClick = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setDialogOpen(true);
    };

    const handleViewDetails = async (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setDrawerOpen(true);
    };

    const handlePdfPreview = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsPdfPreviewOpen(true);
    };

    // Pagination logic
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

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
            PENDING: { variant: "outline" as const, label: "PENDING" },
            APPROVED: { variant: "default" as const, label: "APPROVED" },
            REJECTED: { variant: "destructive" as const, label: "REJECTED" },
        };

        const config = approvalStatusConfig[approvalStatus as keyof typeof approvalStatusConfig] || approvalStatusConfig.PENDING;

        return <Badge variant={config.variant}>{config.label}</Badge>;
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
        <div className="w-full border rounded-lg md:p-4">
            <Card className="border-none shadow-none m-0">
                {/* HEADER: hanya title dan icon */}
                <CardHeader
                    className="p-4 rounded-lg text-white
      bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
      dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900"
                >
                    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary">
                                <Wallet2Icon className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <div>
                                <CardTitle className="text-lg md:text-2xl">Invoice Customer</CardTitle>
                                <p className="text-xs md:text-sm text-white">
                                    Manage and track all invoice customer
                                </p>
                            </div>
                        </div>

                        {/* Desktop: tampil di kanan header */}
                        <div className="hidden md:flex flex-row space-x-2">
                            <div className="relative w-64">
                                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-white" />
                                <Input
                                    placeholder="Search Invoice..."
                                    className="w-full pl-9 text-white placeholder-white/70"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                />
                            </div>
                            <Link href={`${basePath}/create`} passHref>
                                <Button className="bg-primary hover:bg-primary/90">
                                    <PlusCircleIcon className="mr-2 h-4 w-4" />
                                    New Invoice
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardHeader>

                {/* MOBILE: search + button di bawah header */}
                <CardContent className="flex flex-col space-y-2 mt-4 md:hidden">
                    <div className="relative w-full">
                        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                        <Input
                            placeholder="Search Invoice..."
                            className="w-full pl-9"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                setCurrentPage(1)
                            }}
                        />
                    </div>
                    <Link href={`${basePath}/create`} passHref>
                        <Button className="w-full bg-primary hover:bg-primary/90">
                            <PlusCircleIcon className="mr-2 h-4 w-4" />
                            New Invoice
                        </Button>
                    </Link>
                </CardContent>
            </Card>

            <CardContent>
                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                    {currentData.map((invoice) => (
                        <Card key={invoice.id} className="p-4">
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
                            </div>
                            <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
                                <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>
                                            <FileDown className="h-4 w-4 mr-2" />
                                            Preview PDF
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <CreditCard className="h-4 w-4 mr-2" />
                                            Payment
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-red-600">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block rounded-md border m-0">
                    <Table className="min-w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice #</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Status & Approved</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p>No invoices found</p>
                                        {searchTerm && (
                                            <p className="text-sm">Try adjusting your search terms</p>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentData.map((invoice) => (
                                    <TableRow key={invoice.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-blue-600" />
                                                {invoice.invoiceNumber}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Building className="h-4 w-4 text-gray-500" />
                                                <span>{invoice.salesOrder.customer.name}</span>
                                                <span>Kantor Cabang : {invoice.salesOrder.customer.branch}</span>
                                            </div>

                                        </TableCell>
                                        <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                                        <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                                        <TableCell className="text-right font-semibold">
                                            <div className="flex items-center justify-end gap-1">
                                                <DollarSign className="h-4 w-4 text-green-600" />
                                                {formatCurrency(invoice.totalAmount)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="flex gap-2">
                                            {getStatusBadge(invoice.status)}
                                            {getApproveStatusBadge(invoice.approvalStatus)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-row-reverse gap-2">
                                                <div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handlePaymentClick(invoice)}
                                                        disabled={invoice.status !== "UNPAID" || invoice.balanceDue <= 0}
                                                        className={`flex cursor-pointer items-center gap-1 ${invoice.status !== "UNPAID" ? "opacity-50 cursor-not-allowed" : ""
                                                            }`}
                                                    >
                                                        <CreditCard className="h-4 w-4 mr-2 text-green-600" />
                                                        Pay
                                                    </Button>
                                                </div>

                                                <div>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => handleViewDetails(invoice)}
                                                        className="h-8 w-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-400 dark:hover:border-emerald-600 hover:shadow-sm transition-all duration-200 group cursor-pointer"
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4 text-slate-500 group-hover:text-emerald-600 transition-colors" />
                                                    </Button>
                                                </div>

                                                <div>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => handlePdfPreview(invoice)}
                                                        className="h-8 w-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-400 dark:hover:border-blue-600 hover:shadow-sm transition-all duration-200 group cursor-pointer"
                                                        title="Preview Pdf"
                                                    >
                                                        <PrinterCheck className="h-4 w-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
                                                    </Button>
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

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                        <div className="text-sm text-gray-500">
                            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of{" "}
                            {filteredData.length} entries
                        </div>
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setCurrentPage((prev) => Math.max(prev - 1, 1));
                                        }}
                                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                                    />
                                </PaginationItem>

                                {[...Array(totalPages)].map((_, index) => (
                                    <PaginationItem key={index}>
                                        <PaginationLink
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setCurrentPage(index + 1);
                                            }}
                                            isActive={currentPage === index + 1}
                                        >
                                            {index + 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}

                                <PaginationItem>
                                    <PaginationNext
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                                        }}
                                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </CardContent>
            <InvoiceDetailDrawer
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                invoice={selectedInvoice}
            />
            {selectedInvoice && (
                <PaymentProcessDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    invoiceId={selectedInvoice.id}
                    invoiceNumber={selectedInvoice.invoiceNumber}
                    balanceDue={selectedInvoice.balanceDue}
                    banks={banks}
                    currentUser={currentUser}
                    installments={[]} // You can pass actual installments here
                />
            )}
            {/* Modal Preview PDF */}
            <Dialog open={isPdfPreviewOpen} onOpenChange={setIsPdfPreviewOpen}>
                <DialogContent className="max-w-4xl max-h-screen overflow-auto">
                    <DialogHeader>
                        <DialogTitle>Preview PDF Invoice: {selectedInvoice?.invoiceNumber}</DialogTitle>
                    </DialogHeader>
                    {selectedInvoice && (
                        <div className="py-4">
                            <PDFDownloadLink
                                document={<InvoicePdfDocument invoice={selectedInvoice} />}
                                fileName={`Invoice-${selectedInvoice.invoiceNumber}.pdf`}
                            >
                                {({ loading }) =>
                                    loading ? (
                                        <Button disabled>
                                            Memuat PDF...
                                        </Button>
                                    ) : (
                                        <Button>
                                            Unduh PDF
                                        </Button>
                                    )
                                }
                            </PDFDownloadLink>

                            <div className="mt-6 border-t pt-4">
                                <h3 className="text-lg font-medium mb-4">Preview Dokumen</h3>
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

        </div>
    );

}