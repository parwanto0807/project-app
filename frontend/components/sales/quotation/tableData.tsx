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
    Building,
    MapPin,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Send,
    Copy,
    BarChart3,
    CreditCard,
    FileDigit,
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
    const [showPdfDialog, setShowPdfDialog] = useState(false);
    const router = useRouter();
    console.log("role", role)
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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'REJECTED':
                return <XCircle className="h-4 w-4 text-red-600" />;
            case 'PENDING':
                return <Clock className="h-4 w-4 text-amber-600" />;
            case 'EXPIRED':
                return <AlertCircle className="h-4 w-4 text-gray-600" />;
            default:
                return <FileText className="h-4 w-4 text-blue-600" />;
        }
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
            <div className="bg-gradient-to-br from-slate-50/80 to-white dark:from-slate-900/80 dark:to-slate-950 p-6 border-t border-slate-200/50 dark:border-slate-700/50">
                {/* Basic Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Customer Information */}
                    <div className="space-y-3 bg-white/80 dark:bg-slate-800/80 rounded-xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
                        <h4 className="font-semibold text-sm flex items-center gap-2 text-blue-600 dark:text-blue-400">
                            <Building className="h-4 w-4" />
                            Informasi Pelanggan
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Nama:</span>
                                <span className="font-medium">{quotation.customer.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Kode:</span>
                                <span className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                                    {quotation.customer.code}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Email:</span>
                                <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {quotation.customer.email}
                                </span>
                            </div>
                            <div className="pt-1">
                                <span className="text-slate-500 mb-1 flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    Alamat:
                                </span>
                                <span className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 p-2 rounded block">
                                    {quotation.customer.address || "Alamat tidak tersedia"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="space-y-3 bg-white/80 dark:bg-slate-800/80 rounded-xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
                        <h4 className="font-semibold text-sm flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                            <CreditCard className="h-4 w-4" />
                            Ringkasan Keuangan
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Subtotal:</span>
                                <span>{formatCurrency(quotation.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Pajak:</span>
                                <span className="text-orange-600 dark:text-orange-400">
                                    {formatCurrency(quotation.taxTotal)}
                                </span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                                <span className="text-slate-500 font-medium">Total:</span>
                                <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(quotation.total)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Versi:</span>
                                <span className="font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs">
                                    v{quotation.version}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Dates & Validity */}
                    <div className="space-y-3 bg-white/80 dark:bg-slate-800/80 rounded-xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
                        <h4 className="font-semibold text-sm flex items-center gap-2 text-purple-600 dark:text-purple-400">
                            <Calendar className="h-4 w-4" />
                            Tanggal & Masa Berlaku
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Dibuat:</span>
                                <span>{formatDate(quotation.createdAt)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Diupdate:</span>
                                <span>{formatDate(quotation.updatedAt)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Berlaku Dari:</span>
                                <span className={quotation.validFrom ? "text-green-600 dark:text-green-400" : "text-slate-400"}>
                                    {quotation.validFrom ? formatDate(quotation.validFrom) : "Segera"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Berlaku Sampai:</span>
                                <span className={quotation.validUntil ? "text-amber-600 dark:text-amber-400" : "text-slate-400"}>
                                    {quotation.validUntil ? formatDate(quotation.validUntil) : "Tidak ditetapkan"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="space-y-3 bg-white/80 dark:bg-slate-800/80 rounded-xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
                        <h4 className="font-semibold text-sm flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                            <BarChart3 className="h-4 w-4" />
                            Informasi Tambahan
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">Status:</span>
                                <Badge variant={getStatusVariant(quotation.status)} className="ml-2 flex items-center gap-1">
                                    {getStatusIcon(quotation.status)}
                                    {quotation.status.charAt(0) + quotation.status.slice(1).toLowerCase()}
                                </Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Total Item:</span>
                                <span className="font-medium flex items-center gap-1">
                                    <List className="h-3 w-3 text-blue-600" />
                                    {quotation.lines?.length || quotation._count?.lines || 0}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Lampiran:</span>
                                <span className="font-medium flex items-center gap-1">
                                    <Paperclip className="h-3 w-3 text-amber-600" />
                                    {quotation._count?.attachments || 0}
                                </span>
                            </div>
                            <div className="pt-1">
                                <span className="text-slate-500 block mb-1">Catatan:</span>
                                <span className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 p-2 rounded block">
                                    {quotation.notes || "Tidak ada catatan tambahan"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Line Items Table */}
                {quotation.lines && quotation.lines.length > 0 ? (
                    <div className="mb-8">
                        <h4 className="font-semibold text-sm mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <List className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            Daftar Item ({quotation.lines.length})
                        </h4>
                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
                                    <tr>
                                        <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-400">#</th>
                                        <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-400">Deskripsi Item</th>
                                        <th className="text-right p-4 font-medium text-slate-600 dark:text-slate-400">Qty</th>
                                        <th className="text-right p-4 font-medium text-slate-600 dark:text-slate-400">Harga Satuan</th>
                                        <th className="text-right p-4 font-medium text-slate-600 dark:text-slate-400">Diskon</th>
                                        <th className="text-right p-4 font-medium text-slate-600 dark:text-slate-400">Pajak</th>
                                        <th className="text-right p-4 font-medium text-slate-600 dark:text-slate-400">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quotation.lines.map((line: QuotationLine) => (
                                        <tr key={line.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="p-4 font-mono text-xs text-slate-500">{line.lineNo}</td>
                                            <td className="p-4">
                                                <div>
                                                    <div className="font-medium text-slate-900 dark:text-slate-100">
                                                        {getLineDescription(line)}
                                                    </div>
                                                    <div className="text-xs text-slate-500 space-y-1 mt-2">
                                                        {line.product?.code && (
                                                            <div className="flex items-center gap-1">
                                                                <Tag className="h-3 w-3 text-blue-600" />
                                                                SKU: {line.product.code}
                                                            </div>
                                                        )}
                                                        {line.uom && (
                                                            <div className="flex items-center gap-1">
                                                                <Scale className="h-3 w-3 text-green-600" />
                                                                Satuan: {line.uom}
                                                            </div>
                                                        )}
                                                        {line.lineType && (
                                                            <div className="flex items-center gap-1">
                                                                <Type className="h-3 w-3 text-purple-600" />
                                                                Tipe: {line.lineType}
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
                                                            <div className="text-xs text-slate-500">
                                                                {formatCurrency(line.lineSubtotal)}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="text-slate-400">-</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="space-y-1">
                                                    <div className="text-orange-600 dark:text-orange-400">
                                                        {formatCurrency(line.taxAmount)}
                                                    </div>
                                                    {line.tax?.name && (
                                                        <div className="text-xs text-slate-500">{line.tax.name}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right font-bold text-slate-900 dark:text-slate-100">
                                                {formatCurrency(line.lineTotal)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-t-2 border-slate-200 dark:border-slate-600">
                                    <tr>
                                        <td colSpan={6} className="p-4 text-right font-medium text-slate-600 dark:text-slate-400">
                                            Subtotal:
                                        </td>
                                        <td className="p-4 text-right font-medium">
                                            {formatCurrency(quotation.subtotal)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan={6} className="p-4 text-right font-medium text-slate-600 dark:text-slate-400">
                                            Total Pajak:
                                        </td>
                                        <td className="p-4 text-right font-medium text-orange-600 dark:text-orange-400">
                                            {formatCurrency(quotation.taxTotal)}
                                        </td>
                                    </tr>
                                    <tr className="border-t border-slate-300 dark:border-slate-500">
                                        <td colSpan={6} className="p-4 text-right font-bold text-slate-700 dark:text-slate-300">
                                            Total Keseluruhan:
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
                    <div className="mb-8 text-center py-12 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl bg-white/50 dark:bg-slate-800/50">
                        <Package className="h-16 w-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                        <p className="text-slate-500 dark:text-slate-400 text-lg font-medium mb-2">Tidak ada item tersedia</p>
                        <p className="text-sm text-slate-400 dark:text-slate-500">Quotation ini tidak mengandung item apapun</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/30"
                        onClick={() => handleOpenPdfDialog(quotation)}
                    >
                        <Eye className="h-4 w-4" />
                        Preview PDF
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
                                {loading ? 'Membuat...' : 'Unduh PDF'}
                            </Button>
                        )}
                    </PDFDownloadLink>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-900/30"
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
                        Hapus
                    </Button>

                    {/* Contextual Actions */}
                    <div className="flex gap-2 ml-auto">
                        {quotation.status === "DRAFT" && (
                            <Button size="sm" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                                <Send className="h-4 w-4" />
                                Kirim ke Pelanggan
                            </Button>
                        )}
                        {quotation.status === "SENT" && (
                            <Button size="sm" className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white">
                                <Copy className="h-4 w-4" />
                                Buat Revisi
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

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
                        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                        <p>Gagal memuat quotation</p>
                        <Button
                            variant="outline"
                            className="mt-2"
                            onClick={() => window.location.reload()}
                        >
                            Coba Lagi
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header dengan Gradient yang Lebih Profesional */}
            <div className="bg-gradient-to-r from-cyan-600 to-purple-600 p-4 mt-6 rounded-lg text-white shadow-lg transform transition-all duration-300 hover:shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="mb-4 md:mb-0">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/10 rounded-lg">
                                <FileDigit className="h-6 w-6 text-blue-300" />
                            </div>
                            <h1 className="text-2xl font-bold">Manajemen Quotation</h1>
                        </div>
                        <p className="text-slate-200 mt-1 flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Kelola dan lacak semua quotation Anda di satu tempat
                        </p>
                    </div>
                    <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2"
                        onClick={handleCreateQuotation}
                    >
                        <Plus className="h-4 w-4" />
                        Buat Quotation Baru
                    </Button>
                </div>
            </div>

            {/* Search and Filters */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                            <Input
                                placeholder="Cari quotation..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 border-slate-300 focus:border-blue-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="border-slate-300">
                                <Filter className="h-4 w-4 mr-2 text-slate-600" />
                                Filter
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="border-slate-300">
                                        <List className="h-4 w-4 mr-2 text-slate-600" />
                                        {pagination.limit} per halaman
                                        <ChevronDown className="h-4 w-4 ml-2" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleLimitChange(10)} className="flex items-center gap-2">
                                        <List className="h-4 w-4 text-blue-600" />
                                        10 per halaman
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleLimitChange(25)} className="flex items-center gap-2">
                                        <List className="h-4 w-4 text-green-600" />
                                        25 per halaman
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleLimitChange(50)} className="flex items-center gap-2">
                                        <List className="h-4 w-4 text-purple-600" />
                                        50 per halaman
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
                            <TableHeader>
                                <TableRow className="hover:bg-slate-200/50 dark:hover:bg-slate-800 uppercase">
                                    <TableHead className="w-12"></TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors rounded-lg"
                                        onClick={() => handleSort("quotationNumber")}
                                    >
                                        <div className="flex items-center gap-2 text-slate-700 dark:text-white font-semibold">
                                            Nomor Quotation
                                            {sortField === "quotationNumber" && (
                                                sortOrder === "asc" ?
                                                    <ChevronUp className="h-4 w-4 ml-1 text-blue-600" /> :
                                                    <ChevronDown className="h-4 w-4 ml-1 text-blue-600" />
                                            )}
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors rounded-lg"
                                        onClick={() => handleSort("customerName")}
                                    >
                                        <div className="flex items-center gap-2 text-slate-700 dark:text-white font-semibold">
                                            Pelanggan
                                            {sortField === "customerName" && (
                                                sortOrder === "asc" ?
                                                    <ChevronUp className="h-4 w-4 ml-1 text-green-600" /> :
                                                    <ChevronDown className="h-4 w-4 ml-1 text-green-600" />
                                            )}
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-slate-200  dark:hover:bg-slate-600 transition-colors rounded-lg"
                                        onClick={() => handleSort("totalAmount")}
                                    >
                                        <div className="flex items-center gap-2 text-slate-700 dark:text-white font-semibold">
                                            Jumlah
                                            {sortField === "totalAmount" && (
                                                sortOrder === "asc" ?
                                                    <ChevronUp className="h-4 w-4 ml-1 text-emerald-600" /> :
                                                    <ChevronDown className="h-4 w-4 ml-1 text-emerald-600" />
                                            )}
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-slate-200  dark:hover:bg-slate-600 transition-colors rounded-lg"
                                        onClick={() => handleSort("status")}
                                    >
                                        <div className="flex items-center gap-2 text-slate-700 dark:text-white font-semibold">
                                            Status
                                            {sortField === "status" && (
                                                sortOrder === "asc" ?
                                                    <ChevronUp className="h-4 w-4 ml-1 text-purple-600" /> :
                                                    <ChevronDown className="h-4 w-4 ml-1 text-purple-600" />
                                            )}
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-slate-200  dark:hover:bg-slate-600 transition-colors rounded-lg"
                                        onClick={() => handleSort("createdAt")}
                                    >
                                        <div className="flex items-center gap-2 text-slate-700 dark:text-white font-semibold">
                                            Dibuat
                                            {sortField === "createdAt" && (
                                                sortOrder === "asc" ?
                                                    <ChevronUp className="h-4 w-4 ml-1 text-orange-600" /> :
                                                    <ChevronDown className="h-4 w-4 ml-1 text-orange-600" />
                                            )}
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-slate-700 dark:text-white  font-semibold">
                                        <div className="flex items-center gap-2">
                                            Berlaku Sampai
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-right text-slate-700 dark:text-white  font-semibold">
                                        <div className="flex items-center gap-2 justify-end">
                                            Aksi
                                        </div>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedQuotations.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                                            <FileText className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                                            <p className="text-lg font-medium mb-2">Tidak ada quotation ditemukan</p>
                                            {searchTerm && (
                                                <p className="text-sm">Coba sesuaikan kata pencarian Anda</p>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sortedQuotations.map((quotation) => (
                                        <React.Fragment key={quotation.id}>
                                            <TableRow
                                                className="group hover:bg-slate-50/80 dark:hover:bg-slate-800 transition-colors cursor-pointer border-b border-slate-100  dark:border-slate-800"
                                                onClick={() => handleRowClick(quotation.id)}
                                            >
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => handleEyeClick(quotation.id, e)}
                                                        className="h-8 w-8 p-0 hover:bg-slate-200"
                                                    >
                                                        {expandedRows.has(quotation.id) ? (
                                                            <ChevronUp className="h-4 w-4 text-slate-600" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4 text-slate-600" />
                                                        )}
                                                    </Button>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <FileDigit className="h-4 w-4 text-blue-600" />
                                                        {quotation.quotationNumber}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium flex items-center gap-2">
                                                            <Building className="h-4 w-4 text-green-600" />
                                                            {quotation.customer.name}
                                                        </div>
                                                        <div className="text-sm text-slate-500 flex items-center gap-1">
                                                            <Mail className="h-3 w-3" />
                                                            {quotation.customer.email}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <CreditCard className="h-4 w-4 text-emerald-600" />
                                                        {formatCurrency(quotation.total)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusVariant(quotation.status)} className="flex items-center gap-1">
                                                        {getStatusIcon(quotation.status)}
                                                        {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1).toLowerCase()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-orange-600" />
                                                        {formatDate(quotation.createdAt)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4 text-amber-600" />
                                                        {formatDate(quotation.validUntil ?? "")}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenPdfDialog(quotation);
                                                            }}
                                                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 cursor-pointer border-2 dark:hover:border-blue-600"
                                                            title="Preview PDF"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <PDFDownloadLink
                                                            document={<QuotationPdfDocument quotation={quotation} />}
                                                            fileName={`quotation-${quotation.quotationNumber}.pdf`}
                                                        >
                                                            {({ loading }) => (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="h-8 w-8 p-0 text-green-600 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50 border-2 dark:hover:border-green-600 cursor-pointer"
                                                                    title="Download PDF"
                                                                    disabled={loading}
                                                                >
                                                                    <Download className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </PDFDownloadLink>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                /* Handle edit */
                                                            }}
                                                            className="h-8 w-8 p-0 text-orange-600 hover:text-orange-800 dark:hover:text-orange-300 hover:bg-orange-50 border-2 dark:hover:border-orange-600 cursor-pointer"
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
                                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:border-red-600 cursor-pointer border-2"
                                                            title="Delete Quotation"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            {expandedRows.has(quotation.id) && (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="p-0 bg-slate-50/50">
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
                            <div className="text-center py-8 text-slate-500">
                                <FileText className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                                <p>Tidak ada quotation ditemukan</p>
                                {searchTerm && (
                                    <p className="text-sm">Coba sesuaikan kata pencarian Anda</p>
                                )}
                            </div>
                        ) : (
                            sortedQuotations.map((quotation) => (
                                <Card key={quotation.id} className="overflow-hidden border-slate-200 shadow-sm">
                                    <CardHeader className="pb-3 bg-slate-50/50">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <FileDigit className="h-4 w-4 text-blue-600" />
                                                    {quotation.quotationNumber}
                                                </CardTitle>
                                                <CardDescription className="flex items-center gap-2 mt-1">
                                                    <Building className="h-4 w-4 text-green-600" />
                                                    {quotation.customer.name}
                                                </CardDescription>
                                            </div>
                                            <Badge variant={getStatusVariant(quotation.status)} className="flex items-center gap-1">
                                                {getStatusIcon(quotation.status)}
                                                {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1).toLowerCase()}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pb-3">
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500 flex items-center gap-2">
                                                    <CreditCard className="h-4 w-4 text-emerald-600" />
                                                    Jumlah:
                                                </span>
                                                <span className="font-medium">{formatCurrency(quotation.total)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500 flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-orange-600" />
                                                    Dibuat:
                                                </span>
                                                <span>{formatDate(quotation.createdAt)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500 flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-amber-600" />
                                                    Berlaku Sampai:
                                                </span>
                                                <span>{formatDate(quotation.validUntil ?? "")}</span>
                                            </div>
                                        </div>

                                        {/* Expanded Content for Mobile */}
                                        {expandedRows.has(quotation.id) && (
                                            <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                                                <div className="space-y-3">
                                                    <h4 className="font-semibold text-sm flex items-center gap-2 text-slate-700">
                                                        <User className="h-4 w-4 text-blue-600" />
                                                        Informasi Pelanggan
                                                    </h4>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <Mail className="h-4 w-4 text-green-600" />
                                                            <span className="text-slate-600">{quotation.customer.email}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="h-4 w-4 text-orange-600" />
                                                            <span className="text-slate-600">{quotation.customer.address || "N/A"}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <h4 className="font-semibold text-sm flex items-center gap-2 text-slate-700">
                                                        <DollarSign className="h-4 w-4 text-emerald-600" />
                                                        Informasi Keuangan
                                                    </h4>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">Subtotal:</span>
                                                            <span>{formatCurrency(quotation.subtotal)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">Pajak:</span>
                                                            <span className="text-orange-600">{formatCurrency(quotation.taxTotal)}</span>
                                                        </div>
                                                        <div className="flex justify-between font-semibold border-t pt-2">
                                                            <span className="text-slate-700">Total:</span>
                                                            <span className="text-emerald-600">{formatCurrency(quotation.total)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1 min-w-[120px] flex items-center gap-2"
                                                        onClick={() => handleOpenPdfDialog(quotation)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        Preview
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
                                                                className="flex-1 min-w-[120px] flex items-center gap-2"
                                                                disabled={loading}
                                                            >
                                                                <Download className="h-4 w-4" />
                                                                {loading ? 'Membuat...' : 'PDF'}
                                                            </Button>
                                                        )}
                                                    </PDFDownloadLink>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                    <div className="px-4 pb-3 flex justify-between border-t border-slate-200 pt-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => toggleRowExpansion(quotation.id)}
                                            className="flex items-center gap-2"
                                        >
                                            {expandedRows.has(quotation.id) ? (
                                                <>
                                                    <ChevronUp className="h-4 w-4" />
                                                    Lebih Sedikit
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="h-4 w-4" />
                                                    Lebih Detail
                                                </>
                                            )}
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => toggleRowExpansion(quotation.id)} className="flex items-center gap-2">
                                                    <Eye className="h-4 w-4" />
                                                    {expandedRows.has(quotation.id) ? "Sembunyikan" : "Tampilkan"} Detail
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleOpenPdfDialog(quotation)} className="flex items-center gap-2">
                                                    <Eye className="h-4 w-4 text-blue-600" />
                                                    Preview PDF
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <PDFDownloadLink
                                                        document={<QuotationPdfDocument quotation={quotation} />}
                                                        fileName={`quotation-${quotation.quotationNumber}.pdf`}
                                                        className="flex items-center gap-2"
                                                    >
                                                        {({ loading }) => (
                                                            <div className="flex items-center gap-2">
                                                                <Download className="h-4 w-4 text-green-600" />
                                                                {loading ? 'Membuat...' : 'Unduh PDF'}
                                                            </div>
                                                        )}
                                                    </PDFDownloadLink>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="flex items-center gap-2">
                                                    <Edit className="h-4 w-4 text-orange-600" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600 flex items-center gap-2">
                                                    <Trash2 className="h-4 w-4" />
                                                    Hapus
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </CardContent>

                {/* Pagination */}
                {sortedQuotations.length > 0 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50/50 dark:bg-slate-900">
                        <div className="text-sm text-slate-500 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Menampilkan {startItem} sampai {endItem} dari {pagination.total} quotation
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="border-slate-300"
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
                                            className="h-8 w-8 p-0 border-slate-300"
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
                                className="border-slate-300"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* PDF Dialog */}
            <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
                <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
                    <DialogHeader className="flex-shrink-0 px-6 py-4 border-b mt-8">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-green-600" />
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
                                            <Button size="sm" disabled={loading} className="flex items-center gap-2">
                                                <Download className="h-4 w-4" />
                                                {loading ? 'Membuat...' : 'Unduh'}
                                            </Button>
                                        )}
                                    </PDFDownloadLink>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                                <Building className="h-4 w-4 text-green-600" />
                                <strong>Pelanggan:</strong> {selectedQuotation?.customer.name}
                            </span>
                            <span className="flex items-center gap-1">
                                <CreditCard className="h-4 w-4 text-emerald-600" />
                                <strong>Total:</strong> {selectedQuotation ? formatCurrency(selectedQuotation.total) : '-'}
                            </span>
                            <span className="flex items-center gap-1">
                                {selectedQuotation && getStatusIcon(selectedQuotation.status)}
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

// Skeleton Loader Component yang Diperbarui
function QuotationTableSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 text-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="mb-4 md:mb-0">
                        <div className="flex items-center gap-3 mb-2">
                            <Skeleton className="h-10 w-10 bg-slate-600 rounded-lg" />
                            <Skeleton className="h-8 w-48 bg-slate-600" />
                        </div>
                        <Skeleton className="h-4 w-64 bg-slate-500" />
                    </div>
                    <Skeleton className="h-10 w-40 bg-slate-600" />
                </div>
            </div>

            {/* Table Skeleton */}
            <Card className="shadow-sm border-slate-200">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <Skeleton className="h-10 w-full max-w-md bg-slate-200" />
                        <div className="flex gap-2">
                            <Skeleton className="h-9 w-20 bg-slate-200" />
                            <Skeleton className="h-9 w-28 bg-slate-200" />
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
                                            <Skeleton className="h-4 w-20 bg-slate-200" />
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
                                                    <Skeleton className="h-4 w-full bg-slate-100" />
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
                                                                <Skeleton className="h-4 w-24 bg-slate-200" />
                                                                <Skeleton className="h-3 w-20 bg-slate-100" />
                                                                <Skeleton className="h-3 w-20 bg-slate-100" />
                                                                <Skeleton className="h-3 w-20 bg-slate-100" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {[...Array(4)].map((_, k) => (
                                                            <Skeleton key={k} className="h-9 w-24 bg-slate-200" />
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
                                            <Skeleton className="h-6 w-32 bg-slate-200" />
                                            <Skeleton className="h-4 w-24 bg-slate-200" />
                                        </div>
                                        <Skeleton className="h-6 w-16 bg-slate-200" />
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {[...Array(3)].map((_, j) => (
                                        <div key={j} className="flex justify-between">
                                            <Skeleton className="h-4 w-16 bg-slate-200" />
                                            <Skeleton className="h-4 w-20 bg-slate-200" />
                                        </div>
                                    ))}
                                    {/* Expanded content skeleton for mobile */}
                                    <div className="mt-4 pt-4 space-y-3">
                                        <Skeleton className="h-4 w-full bg-slate-200" />
                                        <Skeleton className="h-4 w-3/4 bg-slate-200" />
                                        <div className="flex gap-2">
                                            <Skeleton className="h-9 w-20 bg-slate-200" />
                                            <Skeleton className="h-9 w-20 bg-slate-200" />
                                        </div>
                                    </div>
                                </CardContent>
                                <div className="p-4 border-t flex justify-between">
                                    <Skeleton className="h-9 w-28 bg-slate-200" />
                                    <Skeleton className="h-9 w-9 bg-slate-200" />
                                </div>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}