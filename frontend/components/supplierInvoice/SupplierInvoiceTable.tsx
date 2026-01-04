"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
import PaginationNew from "@/components/ui/paginationNew";
import {
    Plus,
    Search,
    Eye,
    Edit,
    Trash2,
    FileText,
    Calendar,
    DollarSign,
    Building,
    Filter,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    Download,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    Clock,
    XCircle,
    TrendingUp,
    Loader2,
    Printer,
    FileCheck,
    Send
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";
import {
    getSupplierInvoices,
    deleteSupplierInvoice,
    updateSupplierInvoiceStatus,
} from "@/lib/actions/supplierInvoice";
import { SupplierInvoice, SupplierInvoiceStatus, SUPPLIER_INVOICE_STATUS_OPTIONS } from "@/types/supplierInvoice";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { pdf } from "@react-pdf/renderer";
import { SupplierInvoicePdf } from "./SupplierInvoicePdf";


interface SupplierInvoiceTableProps {
    role: string;
}

export default function SupplierInvoiceTable({ role }: SupplierInvoiceTableProps) {
    const router = useRouter();
    const basePath = role === "pic" ? "/pic-area" : role === "super" ? "/super-admin-area" : "/admin-area";
    const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Selection State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [alertDialogOpen, setAlertDialogOpen] = useState(false);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const response = await getSupplierInvoices({
                page,
                limit: 10,
                search,
                status: statusFilter !== "all" ? statusFilter as any : undefined,
            });

            if (response.success) {
                // For PIC role, we might want to filter the visible invoices on client side 
                // OR ideally send a filter to the backend. For now, let's filter purely for display if requested,
                // BUT the user request says "tampilkan data tabel role=pic hnya mencapai level DRAFT dan REVISION_NEEDED".
                // However, usually a list should show more. But let's follow the instruction strictly if possible, 
                // or interpret it as "PIC only deals with DRAFT/REVISION -> UNVERIFIED workflow".
                // Let's filter client-side for now to match exactly "hanya mencapai level DRAFT dan REVISION_NEEDED" (and maybe UNVERIFIED as they just submitted it?)
                // Actually, if they submit it, it becomes UNVERIFIED. If they can't see UNVERIFIED, they can't see what they just did.
                // Re-reading: "tampilkan data tabel role=pic hnya mencapai level DRAFT dan REVISION_NEEDED"
                // This implies they should only see items they need to work on.

                let data = response.data;
                if (role === 'pic') {
                    // Filter to show only DRAFT and REVISION_NEEDED as per instruction
                    // Adding UNVERIFIED so they can see what they just submitted is usually good UX, but strict obedience:
                    // The user said: "tampilkan data tabel role=pic hnya mencapai level DRAFT dan REVISION_NEEDED"
                    data = data.filter(inv => ['DRAFT', 'REVISION_NEEDED'].includes(inv.status));
                }
                setInvoices(data);
                setTotalPages(response.pagination.totalPages);
                setTotalItems(response.pagination.total);
                setSelectedIds([]); // Reset selection on fetch
            }
        } catch (error) {
            toast.error("Failed to fetch supplier invoices");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, [page, search, statusFilter]);

    const handleDelete = async (id: string) => {
        try {
            setDeletingId(id);
            const response = await deleteSupplierInvoice(id);
            if (response.success) {
                toast.success("Invoice deleted successfully");
                fetchInvoices();
            } else {
                toast.error(response.message || "Failed to delete invoice");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to delete invoice");
        } finally {
            setDeletingId(null);
        }
    };

    const getStatusConfig = (status: string) => {
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
                icon: <FileText className="h-3 w-3" />
            },
            yellow: {
                bg: "bg-amber-50/80",
                text: "text-amber-700",
                border: "border-amber-200",
                icon: <AlertCircle className="h-3 w-3" />
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

        return colorMap[config.color] || colorMap.gray;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const TableSkeleton = () => (
        <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-3 w-1/3" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                </div>
            ))}
        </div>
    );

    const getAmountPaidPercentage = (invoice: SupplierInvoice) => {
        if (invoice.totalAmount === 0) return 0;
        return Math.min(100, (invoice.amountPaid / invoice.totalAmount) * 100);
    };

    const getPaymentStatusColor = (invoice: SupplierInvoice) => {
        const percentage = getAmountPaidPercentage(invoice);
        if (percentage === 0) return "bg-gray-100";
        if (percentage === 100) return "bg-emerald-500";
        if (percentage >= 50) return "bg-amber-500";
        return "bg-rose-500";
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1); // Reset to first page on search
    };

    // Selection Logic
    const toggleSelectAll = () => {
        if (selectedIds.length === invoices.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(invoices.map(inv => inv.id));
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(itemId => itemId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handlePrint = async () => {
        const selectedInvoices = invoices.filter(inv => selectedIds.includes(inv.id));
        const suppliers = new Set(selectedInvoices.map(inv => inv.supplier?.id));

        if (suppliers.size > 1) {
            setAlertDialogOpen(true);
            return;
        }

        try {
            const blob = await pdf(<SupplierInvoicePdf invoices={selectedInvoices} />).toBlob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error("Gagal membuat PDF Tanda Terima");
        }
    };

    const getSelectedInvoiceNumbers = () => {
        return invoices
            .filter(inv => selectedIds.includes(inv.id))
            .map(inv => inv.invoiceNumber);
    };

    const handleUpdateStatus = async (id: string, newStatus: SupplierInvoiceStatus) => {
        try {
            toast.loading("Updating status...", { id: "update-status" });
            const result = await updateSupplierInvoiceStatus(id, newStatus);

            if (result.success) {
                toast.success(`Status updated to ${newStatus}`, { id: "update-status" });
                fetchInvoices(); // Refresh data
            } else {
                throw new Error(result.message || "Failed to update status");
            }
        } catch (error) {
            console.error("Error updates status:", error);
            toast.error("Failed to update status", { id: "update-status" });
        }
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* Stats Cards - Hidden for PIC */}
            {role !== 'pic' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-700 mb-1">Total Invoices Supplier</p>
                                <p className="text-2xl font-bold text-blue-900">{totalItems}</p>
                            </div>
                            <div className="p-3 bg-white rounded-lg">
                                <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-emerald-700 mb-1">Total Tagihan</p>
                                <p className="text-2xl font-bold text-emerald-900">
                                    {formatCurrency(invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0))}
                                </p>
                            </div>
                            <div className="p-3 bg-white rounded-lg">
                                <DollarSign className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-amber-700 mb-1">Draft</p>
                                <p className="text-2xl font-bold text-amber-900">
                                    {invoices.filter(inv => inv.status === 'DRAFT').length}
                                </p>
                            </div>
                            <div className="p-3 bg-white rounded-lg">
                                <Clock className="h-6 w-6 text-amber-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 rounded-xl p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-rose-700 mb-1">Overdue</p>
                                <p className="text-2xl font-bold text-rose-900">
                                    {invoices.filter(inv => {
                                        const isCash = new Date(inv.invoiceDate).getTime() === new Date(inv.dueDate).getTime();
                                        return !isCash && new Date(inv.dueDate) < new Date() && (inv.totalAmount - inv.amountPaid) > 0;
                                    }).length}
                                </p>
                            </div>
                            <div className="p-3 bg-white rounded-lg">
                                <AlertCircle className="h-6 w-6 text-rose-600" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Warning for PIC Role */}
            {role === 'pic' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-amber-900 text-sm">Perhatian Penting</h4>
                        <p className="text-amber-800 text-sm mt-1">
                            Mohon pastikan Anda telah mencetak <strong>Tanda Terima Invoice Supplier</strong> terlebih dahulu sebelum melakukan <strong>Submit</strong>.
                            Data invoice yang telah disubmit akan berpindah status dan tidak lagi muncul di halaman ini.
                        </p>
                    </div>
                </div>
            )}
            {/* Actions Toolbar */}
            <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center">
                {/* Search */}
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search invoices, suppliers, or invoice numbers..."
                        value={search}
                        onChange={handleSearch}
                        className="pl-12 h-10 border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                </div>

                {/* Filters & Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Print Button with Tooltip */}
                    {selectedIds.length > 0 && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handlePrint}
                                        className="h-10 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 hover:border-blue-300 px-4"
                                    >
                                        <Printer className="h-4 w-4 mr-2" />
                                        Print ({selectedIds.length})
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <div className="text-xs">
                                        <p className="font-semibold mb-1">Cetak Invoice:</p>
                                        <ul className="list-disc pl-3 space-y-0.5">
                                            {getSelectedInvoiceNumbers().map((num, idx) => (
                                                <li key={idx}>{num}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    <div className="flex items-center gap-2 px-3 bg-gray-50 border border-gray-200 rounded-lg h-10 justify-center">
                        <Filter className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700 hidden sm:inline">Filter</span>
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[180px] h-10 border-gray-200">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="py-2.5">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-gray-400" />
                                    All Status
                                </div>
                            </SelectItem>
                            {SUPPLIER_INVOICE_STATUS_OPTIONS.map((status) => {
                                const config = getStatusConfig(status.value);
                                return (
                                    <SelectItem key={status.value} value={status.value} className="py-2.5">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("h-2 w-2 rounded-full", {
                                                "bg-blue-400": status.color === "blue",
                                                "bg-gray-400": status.color === "gray",
                                                "bg-amber-400": status.color === "yellow",
                                                "bg-emerald-400": status.color === "green",
                                                "bg-rose-400": status.color === "red",
                                            })} />
                                            {status.label}
                                        </div>
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>

                    <span className="w-px bg-gray-200 hidden sm:block mx-1" />

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchInvoices}
                        className="h-10 border-gray-200 hover:border-gray-300 px-4"
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span className="ml-2 hidden lg:inline">Refresh</span>
                    </Button>
                    <Button
                        onClick={() => router.push(`${basePath}/accounting/supplier-invoice/create`)}
                        className="h-10 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary px-4"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Buat Penerimaan Invoice Supplier
                    </Button>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <TableSkeleton />
            ) : invoices.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
                    <div className="max-w-md mx-auto">
                        <div className="p-4 bg-gray-50 rounded-full w-16 h-16 mx-auto mb-6">
                            <FileText className="h-8 w-8 text-gray-400 mx-auto" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No invoices found</h3>
                        <p className="text-gray-500 mb-6">
                            {search || statusFilter !== "all"
                                ? "Try adjusting your search or filter to find what you're looking for."
                                : "Get started by creating your first supplier invoice."
                            }
                        </p>
                        <Button
                            onClick={() => router.push(`${basePath}/accounting/supplier-invoice/create`)}
                            className="bg-gradient-to-r from-primary to-primary/90"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Buat Penerimaan Invoice Supplier
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50 hover:bg-gray-50">
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={selectedIds.length === invoices.length && invoices.length > 0}
                                        onCheckedChange={toggleSelectAll}
                                    />
                                </TableHead>
                                <TableHead className="py-4 font-semibold text-gray-700">Invoice Details</TableHead>
                                <TableHead className="py-4 font-semibold text-gray-700">Reference</TableHead>
                                <TableHead className="py-4 font-semibold text-gray-700">Supplier</TableHead>
                                <TableHead className="py-4 font-semibold text-gray-700">Term Of Payment</TableHead>
                                <TableHead className="py-4 font-semibold text-gray-700">Dates</TableHead>
                                <TableHead className="py-4 font-semibold text-gray-700 text-right">Amounts</TableHead>
                                <TableHead className="py-4 font-semibold text-gray-700">Payment Status</TableHead>
                                <TableHead className="py-4 font-semibold text-gray-700 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.map((invoice) => {
                                const statusConfig = getStatusConfig(invoice.status);
                                const paymentPercentage = getAmountPaidPercentage(invoice);
                                const isCash = new Date(invoice.invoiceDate).getTime() === new Date(invoice.dueDate).getTime();
                                const isOverdue = !isCash && new Date(invoice.dueDate) < new Date() && paymentPercentage < 100;
                                const isSelected = selectedIds.includes(invoice.id);

                                return (
                                    <TableRow
                                        key={invoice.id}
                                        className={cn(
                                            "hover:bg-gray-50/50 border-b border-gray-100 transition-colors",
                                            isSelected && "bg-blue-50/30 hover:bg-blue-50/50"
                                        )}
                                    >
                                        <TableCell>
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => toggleSelect(invoice.id)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-primary/10 rounded-lg">
                                                        <FileText className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{invoice.invoiceNumber}</p>
                                                        {statusConfig && (
                                                            <Badge
                                                                variant="outline"
                                                                className={cn(
                                                                    "mt-1 px-2 py-0.5 text-xs",
                                                                    statusConfig.bg,
                                                                    statusConfig.text,
                                                                    statusConfig.border
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-1">
                                                                    {statusConfig.icon}
                                                                    {SUPPLIER_INVOICE_STATUS_OPTIONS.find(s => s.value === invoice.status)?.label}
                                                                </div>
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col items-start gap-1.5">
                                                {invoice.purchaseOrder ? (
                                                    <>
                                                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm hover:bg-indigo-100 transition-colors">
                                                            PO: {invoice.purchaseOrder.poNumber}
                                                        </Badge>
                                                        {invoice.purchaseOrder.PurchaseRequest?.nomorPr && (
                                                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 shadow-sm hover:bg-purple-100 transition-colors">
                                                                PR: {invoice.purchaseOrder.PurchaseRequest.nomorPr}
                                                            </Badge>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">No Reference</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-100 rounded-lg">
                                                    <Building className="h-4 w-4 text-gray-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{invoice.supplier?.name || "N/A"}</p>
                                                    {invoice.supplier?.code && (
                                                        <p className="text-xs text-gray-500">{invoice.supplier.code}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {(() => {
                                                const invDate = new Date(invoice.invoiceDate);
                                                const dDate = new Date(invoice.dueDate);
                                                invDate.setHours(0, 0, 0, 0);
                                                dDate.setHours(0, 0, 0, 0);

                                                const diffTime = dDate.getTime() - invDate.getTime();
                                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                                if (diffDays <= 0) {
                                                    return (
                                                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none">
                                                            CASH
                                                        </Badge>
                                                    );
                                                }
                                                return (
                                                    <div className="flex flex-col items-start gap-1">
                                                        <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                                                            CREDIT
                                                        </Badge>
                                                        <span className="text-xs font-medium text-gray-600">
                                                            {diffDays} Days
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                    <span className="text-sm text-gray-700">
                                                        {format(new Date(invoice.invoiceDate), "dd MMM yyyy", { locale: idLocale })}
                                                    </span>
                                                </div>
                                                <div className={cn(
                                                    "flex items-center gap-2",
                                                    isOverdue ? "text-rose-600" : "text-gray-500"
                                                )}>
                                                    <Clock className="h-3.5 w-3.5" />
                                                    <span className="text-sm">
                                                        {format(new Date(invoice.dueDate), "dd MMM yyyy", { locale: idLocale })}
                                                    </span>
                                                    {isOverdue && (
                                                        <Badge variant="destructive" className="ml-2 px-2 py-0.5 text-xs">
                                                            Overdue
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="space-y-1">
                                                <div className="flex justify-between items-center gap-4">
                                                    <span className="text-gray-500 text-xs">Total:</span>
                                                    <p className="font-semibold text-gray-900">{formatCurrency(invoice.totalAmount)}</p>
                                                </div>
                                                <div className="flex justify-between items-center gap-4">
                                                    <span className="text-red-500 text-xs">Tax:</span>
                                                    <p className="text-xs text-red-600">{formatCurrency(invoice.taxAmount)}</p>
                                                </div>
                                                <div className="flex justify-between items-center gap-4">
                                                    <span className="text-gray-500 text-xs">Paid:</span>
                                                    <div className="flex items-center justify-end gap-1">
                                                        <div className={cn("w-1.5 h-1.5 rounded-full", invoice.amountPaid > 0 ? "bg-emerald-500" : "bg-gray-300")} />
                                                        <p className="text-sm text-emerald-600 font-medium">
                                                            {formatCurrency(invoice.amountPaid)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {(() => {
                                                // Override for CASH: Always show 100% Paid
                                                const finalPercentage = isCash ? 100 : paymentPercentage;
                                                const remainingAmount = isCash ? 0 : (invoice.totalAmount - invoice.amountPaid);
                                                const statusText = isCash || finalPercentage === 100 ? "Fully Paid" : "Partial Payment";

                                                return (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="text-gray-600">{Math.round(finalPercentage)}%</span>
                                                            <span className="font-medium">
                                                                {formatCurrency(remainingAmount)}
                                                            </span>
                                                        </div>
                                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={cn(
                                                                    "h-full rounded-full transition-all duration-300",
                                                                    isCash ? "bg-emerald-500" : getPaymentStatusColor(invoice)
                                                                )}
                                                                style={{ width: `${finalPercentage}%` }}
                                                            />
                                                        </div>
                                                        <p className="text-xs text-gray-500">
                                                            {statusText}
                                                        </p>
                                                    </div>
                                                );
                                            })()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => router.push(`${basePath}/accounting/supplier-invoice/${invoice.id}`)}
                                                    className="h-9 w-9 hover:bg-gray-100 rounded-lg"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4 text-gray-600" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => router.push(`${basePath}/accounting/supplier-invoice/update/${invoice.id}`)}
                                                    className="h-9 w-9 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                                                    title="Edit Invoice"
                                                    disabled={invoice.status === 'FULLY_PAID' || invoice.status === 'CANCELLED'}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                {/* Dynamic Action Button based on Status */}
                                                {(() => {
                                                    const status = invoice.status;
                                                    let buttonConfig = {
                                                        label: "Submit Doc",
                                                        icon: <Send className="h-4 w-4 mr-2" />,
                                                        className: "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200",
                                                        disabled: false,
                                                        action: () => handleUpdateStatus(invoice.id, 'UNVERIFIED') // Default action
                                                    };

                                                    if (status === 'DRAFT' || status === 'REVISION_NEEDED') {
                                                        buttonConfig = {
                                                            label: "Submit",
                                                            icon: <Send className="h-4 w-4 mr-2" />,
                                                            className: "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 hover:border-blue-300",
                                                            disabled: false,
                                                            action: () => handleUpdateStatus(invoice.id, 'UNVERIFIED')
                                                        };
                                                    } else if (status === 'UNVERIFIED') {
                                                        buttonConfig = {
                                                            label: "Verify",
                                                            icon: <FileCheck className="h-4 w-4 mr-2" />,
                                                            className: "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200 hover:border-amber-300",
                                                            disabled: false, // Check role permission here
                                                            action: () => handleUpdateStatus(invoice.id, 'VERIFIED')
                                                        };
                                                    } else if (status === 'VERIFIED') {
                                                        buttonConfig = {
                                                            label: "Req Approval",
                                                            icon: <Send className="h-4 w-4 mr-2" />,
                                                            className: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 hover:border-indigo-300",
                                                            disabled: false,
                                                            action: () => handleUpdateStatus(invoice.id, 'PENDING_APPROVAL')
                                                        };
                                                    } else if (status === 'PENDING_APPROVAL') {
                                                        buttonConfig = {
                                                            label: "Approve",
                                                            icon: <CheckCircle className="h-4 w-4 mr-2" />,
                                                            className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 hover:border-emerald-300",
                                                            disabled: false, // Check role permission here
                                                            action: () => handleUpdateStatus(invoice.id, 'APPROVED')
                                                        };
                                                    } else if (status === 'APPROVED') {
                                                        buttonConfig = {
                                                            label: "Post Ledger",
                                                            icon: <FileCheck className="h-4 w-4 mr-2" />,
                                                            className: "bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200 hover:border-purple-300",
                                                            disabled: false,
                                                            action: () => handleUpdateStatus(invoice.id, 'POSTED')
                                                        };
                                                    } else if (status === 'POSTED') {
                                                        buttonConfig = {
                                                            label: "Schedule Pay",
                                                            icon: <DollarSign className="h-4 w-4 mr-2" />,
                                                            className: "bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border-cyan-200 hover:border-cyan-300",
                                                            disabled: false,
                                                            action: () => handleUpdateStatus(invoice.id, 'AWAITING_PAYMENT')
                                                        };
                                                    } else {
                                                        // Hide button or show disabled state for end states
                                                        return null;
                                                    }

                                                    return (
                                                        <Button
                                                            size="sm"
                                                            onClick={buttonConfig.action}
                                                            className={cn(
                                                                "h-9 px-3 ml-2 mr-1 rounded-lg shadow-sm transition-all border",
                                                                buttonConfig.className
                                                            )}
                                                            title={`Action: ${buttonConfig.label}`}
                                                            disabled={buttonConfig.disabled}
                                                        >
                                                            {buttonConfig.icon}
                                                            <span className="font-semibold text-xs">{buttonConfig.label}</span>
                                                        </Button>
                                                    );
                                                })()}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 hover:bg-gray-100 rounded-lg"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuItem className="cursor-pointer">
                                                            <Download className="h-4 w-4 mr-2" />
                                                            Download PDF
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                                                            onClick={() => {
                                                                const hasPayments = invoice.paymentAllocations && invoice.paymentAllocations.length > 0;
                                                                if (hasPayments) {
                                                                    toast.error("Cannot delete invoice with payment allocations");
                                                                    return;
                                                                }
                                                                if (confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}?`)) {
                                                                    handleDelete(invoice.id);
                                                                }
                                                            }}
                                                            disabled={(invoice.paymentAllocations && invoice.paymentAllocations.length > 0) || deletingId === invoice.id}
                                                        >
                                                            {deletingId === invoice.id ? (
                                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                            )}
                                                            Delete Invoice
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4">
                    <div className="text-sm text-gray-500">
                        Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, totalItems)} of {totalItems} invoices
                    </div>
                    <PaginationNew
                        totalPages={totalPages}
                        currentPage={page}
                        onPageChange={setPage}
                    />
                </div>
            )}

            {/* Warning Dialog for Mixed Suppliers */}
            <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Peringatan: Perbedaan Supplier Terdeteksi</AlertDialogTitle>
                        <AlertDialogDescription>
                            Mohon maaf, Anda tidak dapat mencetak dokumen dari supplier yang berbeda secara bersamaan.
                            Pencetakan gabungan hanya diizinkan untuk satu supplier yang sama.
                            Silakan filter atau pilih kembali invoice dari supplier yang sama.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setAlertDialogOpen(false)}>
                            Mengerti
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}