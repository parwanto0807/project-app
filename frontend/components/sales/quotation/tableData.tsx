"use client";

import React, { useState } from "react";
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
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    ChevronDown,
    ChevronUp,
    Search,
    Plus,
    FileText,
    Eye,
    Edit,
    Trash2,
    Download,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    Filter,
    Calendar,
    User,
    Mail,
    DollarSign,
    List,
    Package,
    Type,
    Scale,
    Tag,
    Paperclip,
    Info,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Quotation, QuotationLine, QuotationSummary } from "@/types/quotation";
import { useRouter } from "next/navigation";
import QuotationPdfDocument from "./pdfPreview";
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';

export interface QuotationItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

interface QuotationTableProps {
    quotations: QuotationSummary[];
    isLoading: boolean;
    isError: boolean;
    role: string;
    pagination?: PaginationInfo;
    onPageChange?: (page: number) => void;
    onLimitChange?: (limit: number) => void;
}

type SortField = "quotationNumber" | "customerName" | "totalAmount" | "createdAt" | "status";
type SortOrder = "asc" | "desc";

export function QuotationTable({
    quotations,
    isLoading,
    isError,
    role,
    pagination = {
        page: 1,
        limit: 10,
        total: 0,
        pages: 1
    },
    onPageChange,
    onLimitChange
}: QuotationTableProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState<SortField>("createdAt");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(pagination.page);
    const [selectedQuotation, setSelectedQuotation] = useState<QuotationSummary | null>(null);
    const [showPdfPreview, setShowPdfPreview] = useState(false);
    const [showPdfDialog, setShowPdfDialog] = useState(false);

    const router = useRouter();
    console.log("Role", role);
    // Filter quotations based on search term
    const filteredQuotations = quotations.filter(quotation =>
        quotation.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort quotations dengan type-safe implementation
    const sortedQuotations = [...filteredQuotations].sort((a, b) => {
        let aValue: string | number | Date;
        let bValue: string | number | Date;

        switch (sortField) {
            case "quotationNumber":
                aValue = a.quotationNumber;
                bValue = b.quotationNumber;
                break;
            case "customerName":
                aValue = a.customer.name;
                bValue = b.customer.name;
                break;
            case "totalAmount":
                aValue = a.total;
                bValue = b.total;
                break;
            case "status":
                aValue = a.status;
                bValue = b.status;
                break;
            case "createdAt":
                aValue = new Date(a.createdAt);
                bValue = new Date(b.createdAt);
                break;
            default:
                aValue = a.quotationNumber;
                bValue = b.quotationNumber;
        }

        if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
        if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
        return 0;
    });

    const getStatusText = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return 'Disetujui';
            case 'REJECTED':
                return 'Ditolak';
            case 'PENDING':
                return 'Menunggu';
            case 'EXPIRED':
                return 'Kadaluarsa';
            default:
                return status;
        }
    };

    // Handle close preview
    const handleClosePreview = () => {
        setShowPdfPreview(false);
        setSelectedQuotation(null);
    };

    // Handle buka PDF Dialog
    const handleOpenPdfDialog = (quotation: QuotationSummary) => {
        setSelectedQuotation(quotation);
        setShowPdfDialog(true);
    };

    // Handle tutup PDF Dialog
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    const handleCreateQuotation = () => {
        router.push("/admin-area/sales/quotation/create");
    };


    const toggleRowExpansion = (quotationId: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(quotationId)) {
            newExpanded.delete(quotationId);
        } else {
            newExpanded.add(quotationId);
        }
        setExpandedRows(newExpanded);
    };

    // Handle row click untuk expand/collapse
    const handleRowClick = (quotationId: string) => {
        toggleRowExpansion(quotationId);
    };

    // Handle eye button click (stop propagation agar tidak trigger row click)
    const handleEyeClick = (quotationId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        toggleRowExpansion(quotationId);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        onPageChange?.(page);
    };

    const handleLimitChange = (limit: number) => {
        onLimitChange?.(limit);
    };

    const getStatusVariant = (status: Quotation["status"]) => {
        switch (status) {
            case "DRAFT": return "secondary";
            case "SENT": return "default";
            case "APPROVED": return "success";
            case "REJECTED": return "destructive";
            case "EXPIRED": return "outline";
            default: return "secondary";
        }
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

    // Calculate display range
    const startItem = (currentPage - 1) * pagination.limit + 1;
    const endItem = Math.min(currentPage * pagination.limit, pagination.total);

    // Expanded Row Content Component
    // Ganti ExpandedRowContent component dengan yang ini
    const ExpandedRowContent = ({ quotation }: { quotation: QuotationSummary }) => {
        // Format discount display
        const formatDiscount = (type: string, value: number) => {
            if (type === 'PERCENTAGE') {
                return `${value}%`;
            } else if (type === 'AMOUNT') {
                return formatCurrency(value);
            }
            return 'None';
        };

        // Get line description
        const getLineDescription = (line: QuotationLine) => {
            if (line.product?.name) {
                return line.product.name;
            }
            return line.description || `Item ${line.lineNo}`;
        };

        return (
            <div className="bg-gradient-to-br from-gray-50/80 to-white dark:from-gray-900/80 dark:to-gray-950 p-6 border-t border-gray-200/50 dark:border-gray-700/50">
                {/* Basic Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Customer Information */}
                    <div className="space-y-3 bg-white/60 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                        <h4 className="font-semibold text-sm flex items-center gap-2 text-blue-600 dark:text-blue-400">
                            <User className="h-4 w-4" />
                            Customer Information
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Name:</span>
                                <span className="font-medium">{quotation.customer.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Code:</span>
                                <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                    {quotation.customer.code}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Email:</span>
                                <span className="text-blue-600 dark:text-blue-400">{quotation.customer.email}</span>
                            </div>
                            <div className="pt-1">
                                <span className="text-gray-500 block mb-1">Address:</span>
                                <span className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded block">
                                    {quotation.customer.address || "No address provided"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="space-y-3 bg-white/60 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                        <h4 className="font-semibold text-sm flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                            <DollarSign className="h-4 w-4" />
                            Financial Summary
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Subtotal:</span>
                                <span>{formatCurrency(quotation.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Tax Total:</span>
                                <span className="text-orange-600 dark:text-orange-400">
                                    {formatCurrency(quotation.taxTotal)}
                                </span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                                <span className="text-gray-500 font-medium">Grand Total:</span>
                                <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(quotation.total)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Version:</span>
                                <span className="font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs">
                                    v{quotation.version}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Dates & Validity */}
                    <div className="space-y-3 bg-white/60 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                        <h4 className="font-semibold text-sm flex items-center gap-2 text-purple-600 dark:text-purple-400">
                            <Calendar className="h-4 w-4" />
                            Dates & Validity
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Created:</span>
                                <span>{formatDate(quotation.createdAt)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Updated:</span>
                                <span>{formatDate(quotation.updatedAt)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Valid From:</span>
                                <span className={quotation.validFrom ? "text-green-600 dark:text-green-400" : "text-gray-400"}>
                                    {quotation.validFrom ? formatDate(quotation.validFrom) : "Immediately"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Valid Until:</span>
                                <span className={quotation.validUntil ? "text-amber-600 dark:text-amber-400" : "text-gray-400"}>
                                    {quotation.validUntil ? formatDate(quotation.validUntil) : "Not set"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="space-y-3 bg-white/60 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                        <h4 className="font-semibold text-sm flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                            <Info className="h-4 w-4" />
                            Additional Info
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Status:</span>
                                <Badge variant={getStatusVariant(quotation.status)} className="ml-2">
                                    {quotation.status.charAt(0) + quotation.status.slice(1).toLowerCase()}
                                </Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Total Lines:</span>
                                <span className="font-medium">
                                    {quotation.lines?.length || quotation._count?.lines || 0}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Attachments:</span>
                                <span className="font-medium flex items-center gap-1">
                                    <Paperclip className="h-3 w-3" />
                                    {quotation._count?.attachments || 0}
                                </span>
                            </div>
                            <div className="pt-1">
                                <span className="text-gray-500 block mb-1">Notes:</span>
                                <span className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded block">
                                    {quotation.notes || "No additional notes"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Line Items Table */}
                {quotation.lines && quotation.lines.length > 0 ? (
                    <div className="mb-8">
                        <h4 className="font-semibold text-sm mb-4 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <List className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            Line Items ({quotation.lines.length})
                        </h4>
                        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                                    <tr>
                                        <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-400">#</th>
                                        <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-400">Item Description</th>
                                        <th className="text-right p-4 font-medium text-gray-600 dark:text-gray-400">Qty</th>
                                        <th className="text-right p-4 font-medium text-gray-600 dark:text-gray-400">Unit Price</th>
                                        <th className="text-right p-4 font-medium text-gray-600 dark:text-gray-400">Discount</th>
                                        <th className="text-right p-4 font-medium text-gray-600 dark:text-gray-400">Tax</th>
                                        <th className="text-right p-4 font-medium text-gray-600 dark:text-gray-400">Line Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quotation.lines.map((line: QuotationLine) => (
                                        <tr key={line.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="p-4 font-mono text-xs text-gray-500">{line.lineNo}</td>
                                            <td className="p-4">
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-gray-100">
                                                        {getLineDescription(line)}
                                                    </div>
                                                    <div className="text-xs text-gray-500 space-y-1 mt-2">
                                                        {line.product?.code && (
                                                            <div className="flex items-center gap-1">
                                                                <Tag className="h-3 w-3" />
                                                                SKU: {line.product.code}
                                                            </div>
                                                        )}
                                                        {line.uom && (
                                                            <div className="flex items-center gap-1">
                                                                <Scale className="h-3 w-3" />
                                                                UOM: {line.uom}
                                                            </div>
                                                        )}
                                                        {line.lineType && (
                                                            <div className="flex items-center gap-1">
                                                                <Type className="h-3 w-3" />
                                                                Type: {line.lineType}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right font-medium">{line.qty}</td>
                                            <td className="p-4 text-right">{formatCurrency(line.unitPrice)}</td>
                                            <td className="p-4 text-right">
                                                <div className="space-y-1">
                                                    {line.lineDiscountValue > 0 ? (
                                                        <>
                                                            <div className="text-amber-600 dark:text-amber-400">
                                                                {formatDiscount(line.lineDiscountType, line.lineDiscountValue)}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {formatCurrency(line.lineSubtotal)}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="text-gray-400">-</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="space-y-1">
                                                    <div className="text-orange-600 dark:text-orange-400">
                                                        {formatCurrency(line.taxAmount)}
                                                    </div>
                                                    {line.tax?.name && (
                                                        <div className="text-xs text-gray-500">{line.tax.name}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right font-bold text-gray-900 dark:text-gray-100">
                                                {formatCurrency(line.lineTotal)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-t-2 border-gray-200 dark:border-gray-600">
                                    <tr>
                                        <td colSpan={6} className="p-4 text-right font-medium text-gray-600 dark:text-gray-400">
                                            Subtotal:
                                        </td>
                                        <td className="p-4 text-right font-medium">
                                            {formatCurrency(quotation.subtotal)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan={6} className="p-4 text-right font-medium text-gray-600 dark:text-gray-400">
                                            Tax Total:
                                        </td>
                                        <td className="p-4 text-right font-medium text-orange-600 dark:text-orange-400">
                                            {formatCurrency(quotation.taxTotal)}
                                        </td>
                                    </tr>
                                    <tr className="border-t border-gray-300 dark:border-gray-500">
                                        <td colSpan={6} className="p-4 text-right font-bold text-gray-700 dark:text-gray-300">
                                            Grand Total:
                                        </td>
                                        <td className="p-4 text-right font-bold text-lg text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(quotation.total)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="mb-8 text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl bg-white/50 dark:bg-gray-800/50">
                        <Package className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">No line items available</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">This quotation doesnt contain any items</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/30"
                        onClick={() => handleOpenPdfDialog(quotation)}
                    >
                        <Eye className="h-4 w-4" />
                        Preview Pdf
                    </Button>
                    <PDFDownloadLink
                        document={<QuotationPdfDocument quotation={quotation} />}
                        fileName={`quotation-${quotation.quotationNumber}.pdf`}
                        className="flex-1 min-w-[120px]"
                    >
                        {({ loading }) => (
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
                                disabled={loading}
                            >
                                <Download className="h-4 w-4 mr-1" />
                                {loading ? 'Generating...' : 'PDF'}
                            </Button>
                        )}
                    </PDFDownloadLink>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-900/30"
                    // onClick={() => router.push(`/admin-area/sales/quotation/${quotation.id}/edit`)}
                    >
                        <Edit className="h-4 w-4" />
                        Edit Quotation
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete
                    </Button>

                    {/* Contextual Actions */}
                    <div className="flex gap-2 ml-auto">
                        {quotation.status === "DRAFT" && (
                            <Button size="sm" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                                <Mail className="h-4 w-4" />
                                Send to Customer
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Juga perbaiki mobile expanded content - ganti dengan ini:
    {/* Mobile Cards */ }
    <div className="md:hidden space-y-4 p-4">
        {sortedQuotations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No quotations found</p>
                {searchTerm && (
                    <p className="text-sm">Try adjusting your search terms</p>
                )}
            </div>
        ) : (
            sortedQuotations.map((quotation) => (
                <Card key={quotation.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-lg">{quotation.quotationNumber}</CardTitle>
                                <CardDescription>{quotation.customer.name}</CardDescription>
                            </div>
                            <Badge variant={getStatusVariant(quotation.status)}>
                                {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1).toLowerCase()}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Amount:</span>
                                <span className="font-medium">{formatCurrency(quotation.total)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Created:</span>
                                <span>{formatDate(quotation.createdAt)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Valid Until:</span>
                                <span>{formatDate(quotation.validUntil ?? "")}</span>
                            </div>
                        </div>

                        {/* Expanded Content for Mobile */}
                        {expandedRows.has(quotation.id) && (
                            <div className="mt-4 pt-4 border-t space-y-4">
                                {/* Customer Info */}
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Customer
                                    </h4>
                                    <div className="space-y-1 text-sm">
                                        <p><span className="text-gray-500">Email:</span> {quotation.customer.email}</p>
                                        <p><span className="text-gray-500">Code:</span> {quotation.customer.code}</p>
                                        <p><span className="text-gray-500">Address:</span> {quotation.customer.address || "N/A"}</p>
                                    </div>
                                </div>

                                {/* Financial */}
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                        <DollarSign className="h-4 w-4" />
                                        Financial
                                    </h4>
                                    <div className="space-y-1 text-sm">
                                        <p><span className="text-gray-500">Subtotal:</span> {formatCurrency(quotation.subtotal)}</p>
                                        <p><span className="text-gray-500">Tax:</span> {formatCurrency(quotation.taxTotal)}</p>
                                        <p><span className="text-gray-500">Items:</span> {quotation.lines?.length || quotation._count?.lines || 0}</p>
                                        <p><span className="text-gray-500">Version:</span> v{quotation.version}</p>
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Dates
                                    </h4>
                                    <div className="space-y-1 text-sm">
                                        <p><span className="text-gray-500">Valid Until:</span> {quotation.validUntil ? formatDate(quotation.validUntil) : "Not set"}</p>
                                        <p><span className="text-gray-500">Updated:</span> {formatDate(quotation.updatedAt)}</p>
                                    </div>
                                </div>

                                {/* Line Items Summary untuk Mobile */}
                                {quotation.lines && quotation.lines.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-sm flex items-center gap-2">
                                            <List className="h-4 w-4" />
                                            Items ({quotation.lines.length})
                                        </h4>
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {quotation.lines.slice(0, 3).map((line: QuotationLine) => (
                                                <div key={line.id} className="text-sm p-2 border rounded">
                                                    <div className="font-medium">
                                                        {line.lineNo}. {line.product?.name || line.description || `Item ${line.lineNo}`}
                                                    </div>
                                                    <div className="flex justify-between text-xs text-gray-500">
                                                        <span>{line.qty} x {formatCurrency(line.unitPrice)}</span>
                                                        <span className="font-medium">{formatCurrency(line.lineTotal)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {quotation.lines.length > 3 && (
                                                <div className="text-center text-xs text-gray-500 py-2">
                                                    +{quotation.lines.length - 3} more items
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2 pt-2">
                                    <Button variant="outline" size="sm" className="flex-1 min-w-[120px]">
                                        <Eye className="h-4 w-4 mr-1" />
                                        View
                                    </Button>
                                    <Button variant="outline" size="sm" className="flex-1 min-w-[120px]">
                                        <Download className="h-4 w-4 mr-1" />
                                        PDF
                                    </Button>
                                    {quotation.status === "DRAFT" && (
                                        <Button size="sm" className="flex-1 min-w-[120px]">
                                            <Mail className="h-4 w-4 mr-1" />
                                            Send
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <div className="px-4 pb-3 flex justify-between border-t pt-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleRowExpansion(quotation.id)}
                        >
                            {expandedRows.has(quotation.id) ? "Less" : "More"} Details
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => toggleRowExpansion(quotation.id)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    {expandedRows.has(quotation.id) ? "Hide" : "Show"} Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </Card>
            ))
        )}
    </div>

    // Skeleton loader
    if (isLoading) {
        return <QuotationTableSkeleton />;
    }

    // Error state
    if (isError) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-32">
                    <div className="text-center text-red-500">
                        <p>Failed to load quotations</p>
                        <Button
                            variant="outline"
                            className="mt-2"
                            onClick={() => window.location.reload()}
                        >
                            Try Again
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header dengan Gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-lg p-4 text-white mt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="mb-4 md:mb-0">
                        <h1 className="text-2xl font-bold">Quotation Management</h1>
                        <p className="text-blue-100 mt-1">
                            Manage and track all your quotations in one place
                        </p>
                    </div>
                    <Button
                        className="bg-white text-blue-700 hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg"
                        onClick={handleCreateQuotation}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Quotation
                    </Button>
                </div>
            </div>

            {/* Search and Filters */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Search quotations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                                <Filter className="h-4 w-4 mr-2" />
                                Filter
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        Rows: {pagination.limit}
                                        <ChevronDown className="h-4 w-4 ml-2" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleLimitChange(10)}>
                                        10 per page
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleLimitChange(25)}>
                                        25 per page
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleLimitChange(50)}>
                                        50 per page
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>

                {/* Desktop Table */}
                <CardContent className="p-0">
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader className="border rounde-lg">
                                <TableRow>
                                    <TableHead className="w-12"></TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-gray-300 hover:text-black dark:hover:bg-gray-600 dark:hover:text-white transition-colors rounded-lg"
                                        onClick={() => handleSort("quotationNumber")}
                                    >
                                        <div className="flex items-center">
                                            Quotation #
                                            {sortField === "quotationNumber" && (
                                                sortOrder === "asc" ?
                                                    <ChevronUp className="h-4 w-4 ml-1" /> :
                                                    <ChevronDown className="h-4 w-4 ml-1" />
                                            )}
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-gray-300 hover:text-black dark:hover:bg-gray-600 dark:hover:text-white transition-colors rounded-lg"
                                        onClick={() => handleSort("customerName")}
                                    >
                                        <div className="flex items-center">
                                            Customer
                                            {sortField === "customerName" && (
                                                sortOrder === "asc" ?
                                                    <ChevronUp className="h-4 w-4 ml-1" /> :
                                                    <ChevronDown className="h-4 w-4 ml-1" />
                                            )}
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-gray-300 hover:text-black dark:hover:bg-gray-600 dark:hover:text-white transition-colors rounded-lg"
                                        onClick={() => handleSort("totalAmount")}
                                    >
                                        <div className="flex items-center">
                                            Amount
                                            {sortField === "totalAmount" && (
                                                sortOrder === "asc" ?
                                                    <ChevronUp className="h-4 w-4 ml-1" /> :
                                                    <ChevronDown className="h-4 w-4 ml-1" />
                                            )}
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-gray-300 hover:text-black dark:hover:bg-gray-600 dark:hover:text-white transition-colors rounded-lg"
                                        onClick={() => handleSort("status")}
                                    >
                                        <div className="flex items-center">
                                            Status
                                            {sortField === "status" && (
                                                sortOrder === "asc" ?
                                                    <ChevronUp className="h-4 w-4 ml-1" /> :
                                                    <ChevronDown className="h-4 w-4 ml-1" />
                                            )}
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-gray-300 hover:text-black dark:hover:bg-gray-600 dark:hover:text-white transition-colors rounded-lg"
                                        onClick={() => handleSort("createdAt")}
                                    >
                                        <div className="flex items-center">
                                            Created
                                            {sortField === "createdAt" && (
                                                sortOrder === "asc" ?
                                                    <ChevronUp className="h-4 w-4 ml-1" /> :
                                                    <ChevronDown className="h-4 w-4 ml-1" />
                                            )}
                                        </div>
                                    </TableHead>
                                    <TableHead className="hover:bg-gray-300 hover:text-black dark:hover:bg-gray-600 dark:hover:text-white transition-colors rounded-lg">Valid Until</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedQuotations.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                            <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                            <p>No quotations found</p>
                                            {searchTerm && (
                                                <p className="text-sm">Try adjusting your search terms</p>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sortedQuotations.map((quotation) => (
                                        <React.Fragment key={quotation.id}>
                                            <TableRow
                                                className="group hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                                onClick={() => handleRowClick(quotation.id)}
                                            >
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => handleEyeClick(quotation.id, e)}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        {expandedRows.has(quotation.id) ? (
                                                            <ChevronUp className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {quotation.quotationNumber}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{quotation.customer.name}</div>
                                                        <div className="text-sm text-gray-500">{quotation.customer.email}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {formatCurrency(quotation.total)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusVariant(quotation.status)}>
                                                        {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1).toLowerCase()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{formatDate(quotation.createdAt)}</TableCell>
                                                <TableCell>{formatDate(quotation.validUntil ?? "")}</TableCell>
                                                <TableCell>
                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {/* <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => handleEyeClick(quotation.id, e)}
                                                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                                            title="View Details"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button> */}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                /* Handle preview PDF */
                                                            }}
                                                            className="h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-50"
                                                            title="Download PDF"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                /* Handle edit */
                                                            }}
                                                            className="h-8 w-8 p-0 text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                                                            title="Edit Quotation"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                /* Handle delete */
                                                            }}
                                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                                                            title="Delete Quotation"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            {expandedRows.has(quotation.id) && (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="p-0">
                                                        <ExpandedRowContent quotation={quotation} />
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-4 p-4">
                        {sortedQuotations.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                <p>No quotations found</p>
                                {searchTerm && (
                                    <p className="text-sm">Try adjusting your search terms</p>
                                )}
                            </div>
                        ) : (
                            sortedQuotations.map((quotation) => (
                                <Card key={quotation.id} className="overflow-hidden">
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg">{quotation.quotationNumber}</CardTitle>
                                                <CardDescription>{quotation.customer.name}</CardDescription>
                                            </div>
                                            <Badge variant={getStatusVariant(quotation.status)}>
                                                {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1).toLowerCase()}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pb-3">
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Amount:</span>
                                                <span className="font-medium">{formatCurrency(quotation.total)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Created:</span>
                                                <span>{formatDate(quotation.createdAt)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Valid Until:</span>
                                                <span>{formatDate(quotation.validUntil ?? "")}</span>
                                            </div>
                                        </div>

                                        {/* Expanded Content for Mobile */}
                                        {expandedRows.has(quotation.id) && (
                                            <div className="mt-4 pt-4 border-t space-y-3">
                                                <div className="space-y-2">
                                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                                        <User className="h-4 w-4" />
                                                        Customer
                                                    </h4>
                                                    <div className="space-y-1 text-sm">
                                                        <p><span className="text-gray-500">Email:</span> {quotation.customer.email}</p>
                                                        <p><span className="text-gray-500">Company:</span> {quotation.customer.address || "N/A"}</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                                        <DollarSign className="h-4 w-4" />
                                                        Financial
                                                    </h4>
                                                    <div className="space-y-1 text-sm">
                                                        <p><span className="text-gray-500">Subtotal:</span> {formatCurrency(quotation.subtotal || quotation.total)}</p>
                                                        <p><span className="text-gray-500">Tax:</span> {formatCurrency(quotation.taxTotal || 0)}</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    <Button variant="outline" size="sm" className="flex-1 min-w-[120px]">
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        View
                                                    </Button>
                                                    <PDFDownloadLink
                                                        document={<QuotationPdfDocument quotation={quotation} />}
                                                        fileName={`quotation-${quotation.quotationNumber}.pdf`}
                                                        className="flex-1 min-w-[120px]"
                                                    >
                                                        {({ loading }) => (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="flex-1 min-w-[120px]"
                                                                disabled={loading}
                                                            >
                                                                <Download className="h-4 w-4 mr-1" />
                                                                {loading ? 'Generating...' : 'PDF'}
                                                            </Button>
                                                        )}
                                                    </PDFDownloadLink>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                    <div className="px-4 pb-3 flex justify-between border-t pt-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => toggleRowExpansion(quotation.id)}
                                        >
                                            {expandedRows.has(quotation.id) ? "Less" : "More"} Details
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => toggleRowExpansion(quotation.id)}>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    {expandedRows.has(quotation.id) ? "Hide" : "Show"} Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleOpenPdfDialog(quotation)}>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Preview PDF
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <PDFDownloadLink
                                                        document={<QuotationPdfDocument quotation={quotation} />}
                                                        fileName={`quotation-${quotation.quotationNumber}.pdf`}
                                                        className="flex items-center"
                                                    >
                                                        {({ loading }) => (
                                                            <>
                                                                <Download className="h-4 w-4 mr-2" />
                                                                {loading ? 'Generating...' : 'Download PDF'}
                                                            </>
                                                        )}
                                                    </PDFDownloadLink>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600">
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </CardContent>

                {/* Pagination - tetap sama */}
                {sortedQuotations.length > 0 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t">
                        <div className="text-sm text-gray-500">
                            Showing {startItem} to {endItem} of {pagination.total} quotations
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center space-x-1">
                                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                                    const page = i + 1;
                                    return (
                                        <Button
                                            key={page}
                                            variant={currentPage === page ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handlePageChange(page)}
                                            className="h-8 w-8 p-0"
                                        >
                                            {page}
                                        </Button>
                                    );
                                })}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(Math.min(pagination.pages, currentPage + 1))}
                                disabled={currentPage === pagination.pages}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
            {showPdfPreview && selectedQuotation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold">
                                Preview Quotation - {selectedQuotation.quotationNumber}
                            </h3>
                            <div className="flex items-center space-x-2">
                                <PDFDownloadLink
                                    document={<QuotationPdfDocument quotation={selectedQuotation} />}
                                    fileName={`quotation-${selectedQuotation.quotationNumber}.pdf`}
                                >
                                    {({ loading }) => (
                                        <Button size="sm" disabled={loading}>
                                            <Download className="h-4 w-4 mr-2" />
                                            {loading ? 'Generating...' : 'Download'}
                                        </Button>
                                    )}
                                </PDFDownloadLink>
                                <Button variant="outline" size="sm" onClick={handleClosePreview}>
                                    Tutup
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1">
                            <PDFViewer width="100%" height="100%">
                                <QuotationPdfDocument quotation={selectedQuotation} />
                            </PDFViewer>
                        </div>
                    </div>
                </div>
            )}

            {/* PDF Dialog */}
            <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
                <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 ">
                    <DialogHeader className="flex-shrink-0 px-6 py-4 border-b mt-8">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="flex items-center">
                                <FileText className="h-5 w-5 mr-2 text-green-600" />
                                <span className="text-sm">
                                    Quotation - {selectedQuotation?.quotationNumber}
                                    {selectedQuotation?.version || 0 > 1 && ` (Revisi ${selectedQuotation?.version})`}
                                </span>
                            </DialogTitle>
                            <div className="flex items-center space-x-2">
                                {selectedQuotation && (
                                    <PDFDownloadLink
                                        document={<QuotationPdfDocument quotation={selectedQuotation} />}
                                        fileName={`quotation-${selectedQuotation.quotationNumber}.pdf`}
                                    >
                                        {({ loading }) => (
                                            <Button size="sm" disabled={loading}>
                                                <Download className="h-4 w-4 mr-2" />
                                                {loading ? 'Generating...' : 'Download'}
                                            </Button>
                                        )}
                                    </PDFDownloadLink>
                                )}
                                {/* <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleClosePdfDialog}
                                    className="h-8 w-8 p-0"
                                >
                                    <X className="h-4 w-4" />
                                </Button> */}
                            </div>
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <span>
                                <strong>Customer:</strong> {selectedQuotation?.customer.name}
                            </span>
                            <span>
                                <strong>Total:</strong> {selectedQuotation ? formatCurrency(selectedQuotation.total) : '-'}
                            </span>
                            <span>
                                <strong>Status:</strong> {selectedQuotation ? getStatusText(selectedQuotation.status) : '-'}
                            </span>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 min-h-0">
                        {selectedQuotation && (
                            <PDFViewer width="100%" height="100%" className="border-0">
                                <QuotationPdfDocument quotation={selectedQuotation} />
                            </PDFViewer>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Skeleton Loader Component (diperbarui untuk expanded rows)
function QuotationTableSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-lg p-6 text-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="mb-4 md:mb-0">
                        <Skeleton className="h-8 w-48 bg-blue-500 mb-2" />
                        <Skeleton className="h-4 w-64 bg-blue-400" />
                    </div>
                    <Skeleton className="h-10 w-40 bg-white/20" />
                </div>
            </div>

            {/* Table Skeleton */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <Skeleton className="h-10 w-full max-w-md bg-gray-200" />
                        <div className="flex gap-2">
                            <Skeleton className="h-9 w-20 bg-gray-200" />
                            <Skeleton className="h-9 w-28 bg-gray-200" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Desktop Table Skeleton */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {[...Array(8)].map((_, i) => (
                                        <TableHead key={i}>
                                            <Skeleton className="h-4 w-20 bg-gray-200" />
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[...Array(5)].map((_, i) => (
                                    <>
                                        <TableRow key={i}>
                                            {[...Array(8)].map((_, j) => (
                                                <TableCell key={j}>
                                                    <Skeleton className="h-4 w-full bg-gray-100" />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                        {/* Expanded row skeleton */}
                                        <TableRow>
                                            <TableCell colSpan={8}>
                                                <div className="p-6 space-y-4">
                                                    <div className="grid grid-cols-4 gap-4">
                                                        {[...Array(4)].map((_, k) => (
                                                            <div key={k} className="space-y-2">
                                                                <Skeleton className="h-4 w-24 bg-gray-200" />
                                                                <Skeleton className="h-3 w-20 bg-gray-100" />
                                                                <Skeleton className="h-3 w-20 bg-gray-100" />
                                                                <Skeleton className="h-3 w-20 bg-gray-100" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {[...Array(4)].map((_, k) => (
                                                            <Skeleton key={k} className="h-9 w-24 bg-gray-200" />
                                                        ))}
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    </>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Cards Skeleton */}
                    <div className="md:hidden space-y-4 p-4">
                        {[...Array(3)].map((_, i) => (
                            <Card key={i}>
                                <CardHeader>
                                    <div className="flex justify-between">
                                        <div className="space-y-2">
                                            <Skeleton className="h-6 w-32 bg-gray-200" />
                                            <Skeleton className="h-4 w-24 bg-gray-200" />
                                        </div>
                                        <Skeleton className="h-6 w-16 bg-gray-200" />
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {[...Array(3)].map((_, j) => (
                                        <div key={j} className="flex justify-between">
                                            <Skeleton className="h-4 w-16 bg-gray-200" />
                                            <Skeleton className="h-4 w-20 bg-gray-200" />
                                        </div>
                                    ))}
                                    {/* Expanded content skeleton for mobile */}
                                    <div className="mt-4 pt-4 space-y-3">
                                        <Skeleton className="h-4 w-full bg-gray-200" />
                                        <Skeleton className="h-4 w-3/4 bg-gray-200" />
                                        <div className="flex gap-2">
                                            <Skeleton className="h-9 w-20 bg-gray-200" />
                                            <Skeleton className="h-9 w-20 bg-gray-200" />
                                        </div>
                                    </div>
                                </CardContent>
                                <div className="p-4 border-t flex justify-between">
                                    <Skeleton className="h-9 w-28 bg-gray-200" />
                                    <Skeleton className="h-9 w-9 bg-gray-200" />
                                </div>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}