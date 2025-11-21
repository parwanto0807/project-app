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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ChevronDown,
    ChevronUp,
    Edit,
    Trash2,
    FileDigit,
    Building,
    Mail,
    CreditCard,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    FileText,
    MapPin,
    BarChart3,
    List,
    Paperclip,
    Tag,
    Scale,
    Type,
    Package,
    Eye,
    User,
    DollarSign,
    MoreHorizontal,
    Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { QuotationLine, QuotationSummary } from "@/types/quotation";
import { useRouter, useSearchParams } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import QuotationPdfDocument from "./pdfPreview";

type SortField = "quotationNumber" | "customerName" | "totalAmount" | "createdAt" | "status";
type SortOrder = "asc" | "desc";

interface QuotationTableProps {
    quotations: QuotationSummary[];
    isLoading: boolean;
    isError: boolean;
    onDelete: (id: string, options?: { onSuccess?: () => void }) => void;
    isDeleting?: boolean;
    highlightId?: string | null;
}

export function QuotationTable({
    quotations,
    isLoading,
    isError,
    onDelete,
    isDeleting,
    highlightId,
}: QuotationTableProps) {
    const [sortField, setSortField] = useState<SortField>("createdAt");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const rowRefs = React.useRef<{ [key: string]: HTMLTableRowElement | null }>({});
    const searchParams = useSearchParams();
    const page = Number(searchParams.get("page")) || 1;
    const highlightStatus = searchParams.get("status") || "";
    const pageSize = searchParams.get("pageSize") || "";
    const searchUrl = searchParams.get("search") || ""; 
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [selectedQuotation, setSelectedQuotation] = useState<QuotationSummary | null>(null);
    const [showPdfDialog, setShowPdfDialog] = useState(false);
    const [showAlertDialog, setShowAlertDialog] = useState(false);
    const router = useRouter();

    // Sort quotations
    const sortedQuotations = [...quotations].sort((a, b) => {
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

    const toggleRowExpansion = (quotationId: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(quotationId)) {
            newExpanded.delete(quotationId);
        } else {
            newExpanded.add(quotationId);
        }
        setExpandedRows(newExpanded);
    };

    const handleEdit = (e: React.MouseEvent, quotationId: string) => {
        e.stopPropagation();

        // Base path untuk quotation admin
        const basePath = "/admin-area/sales/quotation";
        const currentPage = page || 1;

        const focusId = quotationId;
        const status = highlightStatus ?? undefined;
        const itemPerPage = pageSize;
        const search = searchUrl;

        // Build returnUrl dengan status
        const returnUrl = `${basePath}?pageSize=${itemPerPage}&page=${currentPage}&highlightId=${focusId}${status ? `&status=${status}` : ""}&search=${search}`;

        // Buat URL untuk navigasi
        const url = new URL(`${basePath}/update/${focusId}`, window.location.origin);
        url.searchParams.set("returnUrl", returnUrl);
        url.searchParams.set("highlightId", focusId);
        if (itemPerPage) url.searchParams.set("pageSize", itemPerPage);
        if (status) url.searchParams.set("status", status);

        router.push(url.toString());
    };


    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    const getStatusVariant = (status: string) => {
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

    React.useEffect(() => {
        if (!highlightId) return;

        const highlightElement = rowRefs.current[highlightId];
        if (!highlightElement) return;

        const SCROLL_DELAY = 300;
        const HIGHLIGHT_DURATION = 5000;
        const ANIMATION_CLASSES = [
            "bg-yellow-200",
            "dark:bg-yellow-900",
            "animate-pulse",
            "ring-2",
            "ring-yellow-400",
            "ring-offset-2",
            "transition-all",
            "duration-500"
        ];

        // Delay kecil supaya DOM siap
        const scrollTimer = setTimeout(() => {
            highlightElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "nearest"
            });
        }, SCROLL_DELAY);

        // Tambahkan highlight animasi
        highlightElement.classList.add(...ANIMATION_CLASSES);

        // Hapus highlight + bersihkan URL
        const cleanupTimer = setTimeout(() => {
            highlightElement.classList.remove(...ANIMATION_CLASSES);

            // Tambahkan sedikit smoothing setelah animasi
            highlightElement.classList.add("transition-colors", "duration-300");

            // Hapus highlightId dari URL tanpa reload
            const params = new URLSearchParams(window.location.search);
            params.delete("highlightId");
            const newUrl = params.toString()
                ? `${window.location.pathname}?${params.toString()}`
                : window.location.pathname;

            window.history.replaceState({}, "", newUrl);

        }, HIGHLIGHT_DURATION);

        return () => {
            clearTimeout(scrollTimer);
            clearTimeout(cleanupTimer);
            highlightElement.classList.remove(...ANIMATION_CLASSES);
        };
    }, [highlightId]);

    // Handle row click untuk expand/collapse
    const handleRowClick = (quotationId: string) => {
        toggleRowExpansion(quotationId);
    };

    // Handle eye button click (stop propagation agar tidak trigger row click)
    const handleEyeClick = (quotationId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        toggleRowExpansion(quotationId);
    };
    const handleOpenAlertDialog = (quotation: QuotationSummary) => {
        setSelectedQuotation(quotation);
        setShowAlertDialog(true);
    };

    const handleOpenPdfDialog = (quotation: QuotationSummary) => {
        setSelectedQuotation(quotation);
        setShowPdfDialog(true);
    };

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
                <div className="flex flex-row-reverse gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/30"
                        onClick={() => handleOpenPdfDialog(quotation)}
                    >
                        <Eye className="h-4 w-4" />
                        Preview PDF
                    </Button>
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
                        onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAlertDialog(quotation);
                        }}
                        disabled={isDeleting}
                    >
                        <Trash2 className="h-4 w-4" />
                        Hapus
                    </Button>

                    {/* Contextual Actions */}
                    {/* <div className="flex gap-2 ml-auto">
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
                        </div> */}
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
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 relative z-0"> {/* Tambahkan z-0 */}
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
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sortedQuotations.map((quotation) => (
                                        <React.Fragment key={quotation.id}>
                                            <TableRow
                                                ref={(el) => {
                                                    rowRefs.current[quotation.id] = el;
                                                }}
                                                className={`group hover:bg-slate-50/80 dark:hover:bg-slate-800 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800
  ${quotation.id === highlightId ? "bg-yellow-200 dark:bg-yellow-900" : ""}
`}

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
                                                            {quotation.customer.name} - {quotation.customer.branch}
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
                                                        {formatDate(quotation.quotationDate)}
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
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => handleEdit(e, quotation.id)}
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
                                                                handleOpenAlertDialog(quotation); // set quotation yang akan dihapus
                                                            }}
                                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:border-red-600 cursor-pointer border-2"
                                                            title="Delete Quotation"
                                                            disabled={isDeleting} // disable saat delete
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
                    <div className="md:hidden space-y-4 p-1">
                        {sortedQuotations.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                <FileText className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                                <p>Tidak ada quotation ditemukan</p>
                            </div>
                        ) : (
                            sortedQuotations.map((quotation) => (
                                <Card key={quotation.id} className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
                                    <CardHeader className="py-1 bg-slate-100/50 dark:bg-slate-900 rounded-xl">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-xs font-bold flex items-center gap-2">
                                                    <FileDigit className="h-4 w-4 text-blue-600" />
                                                    {quotation.quotationNumber}
                                                </CardTitle>
                                                <CardDescription className="flex text-xs items-center gap-2 mt-1">
                                                    <Building className="h-4 w-4 text-green-600" />
                                                    <span className="font-bold">{quotation.customer.branch}</span>
                                                </CardDescription>
                                            </div>
                                            <Badge variant={getStatusVariant(quotation.status)} className="flex items-center gap-1">
                                                {getStatusIcon(quotation.status)}
                                                {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1).toLowerCase()}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pb-3">
                                        <div className="space-y-3 text-xs">
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
                                            <div className="mt-2 pt-2 border-t border-slate-200 space-y-2">
                                                <div className="space-y-3">
                                                    <h4 className="font-semibold text-xs flex items-center gap-2 text-slate-700">
                                                        <User className="h-4 w-4 text-blue-600" />
                                                        Informasi Pelanggan
                                                    </h4>
                                                    <div className="space-y-2 text-xs">
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
                                                    <h4 className="font-semibold text-xs flex items-center gap-2 text-slate-700">
                                                        <DollarSign className="h-4 w-4 text-emerald-600" />
                                                        Informasi Keuangan
                                                    </h4>
                                                    <div className="space-y-2 text-xs">
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
                                                {/* <DropdownMenuItem onClick={() => toggleRowExpansion(quotation.id)} className="flex items-center gap-2">
                                                    <Eye className="h-4 w-4" />
                                                    {expandedRows.has(quotation.id) ? "Sembunyikan" : "Tampilkan"} Detail
                                                </DropdownMenuItem> */}
                                                <DropdownMenuItem
                                                    className="flex items-center gap-2"
                                                    onClick={(e) => handleEdit(e, quotation.id)}
                                                >
                                                    <Edit className="h-4 w-4 text-orange-600" />
                                                    Edit
                                                </DropdownMenuItem>

                                                <DropdownMenuItem
                                                    className="text-red-600 flex items-center gap-2"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // tetap hentikan bubbling
                                                        handleOpenAlertDialog(quotation); // set quotation yang akan dihapus
                                                    }}
                                                >
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
            </Card>
            {/* PDF Dialog */}
            <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
                <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
                    <DialogHeader className="flex-shrink-0 px-6 py-4 border-b mt-8">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-green-600" />
                                <span className="text-xs">
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

            <AlertDialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Quotation</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah kamu yakin ingin menghapus quotation {selectedQuotation?.quotationNumber}? Tindakan ini tidak bisa dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-500 text-white hover:bg-red-600 flex items-center gap-2"
                            onClick={() =>
                                onDelete(selectedQuotation?.id ?? "", {
                                    onSuccess: () => setShowAlertDialog(false),
                                })
                            }
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    Menghapus...
                                </>
                            ) : (
                                "Hapus"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// Skeleton Loader Component
function QuotationTableSkeleton() {
    return (
        <Card className="shadow-sm border-slate-200">
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {[...Array(7)].map((_, i) => (
                                <TableHead key={i}>
                                    <Skeleton className="h-4 w-20 bg-slate-200" />
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...Array(5)].map((_, i) => (
                            <TableRow key={i}>
                                {[...Array(7)].map((_, j) => (
                                    <TableCell key={j}>
                                        <Skeleton className="h-4 w-full bg-slate-100" />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}