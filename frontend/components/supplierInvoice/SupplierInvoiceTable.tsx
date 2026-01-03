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
    Loader2
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";
import { getSupplierInvoices, deleteSupplierInvoice } from "@/lib/actions/supplierInvoice";
import { SupplierInvoice, SUPPLIER_INVOICE_STATUS_OPTIONS } from "@/types/supplierInvoice";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SupplierInvoiceTableProps {
    role: string;
}

export default function SupplierInvoiceTable({ role }: SupplierInvoiceTableProps) {
    const router = useRouter();
    const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [deletingId, setDeletingId] = useState<string | null>(null);

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
                setInvoices(response.data);
                setTotalPages(response.pagination.totalPages);
                setTotalItems(response.pagination.total);
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

    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* Stats Cards */}
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
                                {invoices.filter(inv =>
                                    new Date(inv.dueDate) < new Date() &&
                                    (inv.totalAmount - inv.amountPaid) > 0
                                ).length}
                            </p>
                        </div>
                        <div className="p-3 bg-white rounded-lg">
                            <AlertCircle className="h-6 w-6 text-rose-600" />
                        </div>
                    </div>
                </div>
            </div>

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
                        onClick={() => router.push("/admin-area/accounting/supplier-invoice/create")}
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
                            onClick={() => router.push("/admin-area/accounting/supplier-invoice/create")}
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
                                <TableHead className="py-4 font-semibold text-gray-700">Invoice Details</TableHead>
                                <TableHead className="py-4 font-semibold text-gray-700">Supplier</TableHead>
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
                                const isOverdue = new Date(invoice.dueDate) < new Date() && paymentPercentage < 100;

                                return (
                                    <TableRow key={invoice.id} className="hover:bg-gray-50/50 border-b border-gray-100">
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
                                                <p className="font-semibold text-gray-900">{formatCurrency(invoice.totalAmount)}</p>
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                    <p className="text-sm text-emerald-600 font-medium">
                                                        Paid: {formatCurrency(invoice.amountPaid)}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600">{Math.round(paymentPercentage)}%</span>
                                                    <span className="font-medium">
                                                        {formatCurrency(invoice.totalAmount - invoice.amountPaid)}
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full transition-all duration-300",
                                                            getPaymentStatusColor(invoice)
                                                        )}
                                                        style={{ width: `${paymentPercentage}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    {paymentPercentage === 100 ? "Fully Paid" : "Partial Payment"}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => router.push(`/admin-area/accounting/supplier-invoice/${invoice.id}`)}
                                                    className="h-9 w-9 hover:bg-gray-100 rounded-lg"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4 text-gray-600" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => router.push(`/admin-area/accounting/supplier-invoice/update/${invoice.id}`)}
                                                    className="h-9 w-9 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                                                    title="Edit Invoice"
                                                    disabled={invoice.status === 'FULLY_PAID' || invoice.status === 'CANCELLED'}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
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
        </div>
    );
}