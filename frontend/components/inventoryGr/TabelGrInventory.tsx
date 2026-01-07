'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/clientSessionProvider';
import {
    MoreHorizontal,
    Eye,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    Download,
    Trash2,
    Hash,
    Store,
    Truck,
    PackageCheck,
    ThumbsUp,
    Printer,
    Loader2,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import GoodsReceiptPdfDocument from './GoodReceivePdf';

const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
    { ssr: false, loading: () => null }
);

const BlobProvider = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.BlobProvider),
    { ssr: false, loading: () => null }
);
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
    type GoodsReceipt,
    type GoodsReceiptTableColumn,
    DocumentStatus,
    QCStatus,
} from '@/types/grInventoryType';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { deleteGoodsReceiptAction } from '@/lib/action/grInventory/grAction';
import { Sheet } from '@/components/ui/sheet';
import { Card, CardContent } from "@/components/ui/card";
import { GRDetailSheet } from './GRDetailSheet';
import { MarkAsArrivedDialog } from './MarkAsArrivedDialog';
import { QCCheckDialog } from './QCCheckDialog';
import { ApproveGRDialog } from './ApproveGRDialog';

interface TabelGrInventoryProps {
    data: GoodsReceipt[];
    isLoading?: boolean;
    onPageChange?: (page: number) => void;
    currentPage?: number;
    totalPages?: number;
}

const columns: GoodsReceiptTableColumn[] = [
    { id: 'grNumber', label: 'Nomor GR', sortable: true },
    { id: 'createdAt', label: 'Tgl Dibuat', sortable: true },
    { id: 'expectedDate', label: 'Tanggal :', sortable: true },
    // { id: 'receivedDate', label: 'Tgl Diterima', sortable: true },
    { id: 'vendorDeliveryNote', label: 'Delivery Note', sortable: true },
    // { id: 'notes', label: 'Catatan', sortable: false },
    { id: 'vendorName', label: 'Vendor', sortable: true },
    // { id: 'warehouseName', label: 'Gudang', sortable: true },
    { id: 'status', label: 'Status', sortable: true },
    { id: 'actions', label: '', align: 'center', sortable: false },
];

const getWarehouseStyle = (name: string = "") => {
    // Simple logic to create consistent colors based on name length
    const colorIndex = name.length % 5;
    const styles = [
        "bg-blue-50 text-blue-700 border-blue-200",
        "bg-emerald-50 text-emerald-700 border-emerald-200",
        "bg-violet-50 text-violet-700 border-violet-200",
        "bg-orange-50 text-orange-700 border-orange-200",
        "bg-cyan-50 text-cyan-700 border-cyan-200",
    ];
    return styles[colorIndex] || styles[0];
};

const getStatusBadge = (status: DocumentStatus) => {
    const commonClasses = "px-3 py-1 rounded-full text-[10px] font-semibold border flex items-center gap-1.5 w-fit";

    switch (status) {
        case DocumentStatus.DRAFT:
            return (
                <div className={`${commonClasses} bg-amber-50 text-amber-700 border-amber-200`}>
                    <Clock className="w-3.5 h-3.5" />
                    Menunggu Kedatangan Barang
                </div>
            );
        case DocumentStatus.COMPLETED:
            return (
                <div className={`${commonClasses} bg-emerald-50 text-emerald-700 border-emerald-200`}>
                    <CheckCircle className="w-3.5 h-3.5" />
                    Completed
                </div>
            );
        case DocumentStatus.CANCELLED:
            return (
                <div className={`${commonClasses} bg-red-50 text-red-700 border-red-200`}>
                    <XCircle className="w-3.5 h-3.5" />
                    Cancelled
                </div>
            );
        default:
            return <div className={`${commonClasses} bg-slate-100 text-slate-700 border-slate-200`}>{status}</div>;
    }
};



export function TabelGrInventory({
    data,
    isLoading = false,
    onPageChange,
    currentPage = 1,
    totalPages = 1,
}: TabelGrInventoryProps) {
    const router = useRouter();
    const { user } = useSession();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [selectedGR, setSelectedGR] = useState<GoodsReceipt | null>(null);
    const [detailSheetOpen, setDetailSheetOpen] = useState(false);

    // Workflow dialog states
    const [markArrivedDialogOpen, setMarkArrivedDialogOpen] = useState(false);
    const [qcCheckDialogOpen, setQCCheckDialogOpen] = useState(false);
    const [approveDialogOpen, setApproveDialogOpen] = useState(false);

    // Sort data with priority: ARRIVED/PASSED first (for QC), then DRAFT, then others, then by createdAt DESC
    const sortedData = useMemo(() => {
        if (!data || data.length === 0) return [];
        return [...data].sort((a, b) => {
            // Priority levels for status
            const getPriority = (status: string) => {
                if (status === DocumentStatus.ARRIVED || status === DocumentStatus.PASSED) return 3; // Highest priority
                if (status === DocumentStatus.DRAFT) return 2; // Second priority
                return 1; // Others (COMPLETED, CANCELLED, etc.)
            };

            const aPriority = getPriority(a.status);
            const bPriority = getPriority(b.status);

            // First: Sort by priority (higher priority first)
            if (aPriority !== bPriority) {
                return bPriority - aPriority;
            }

            // Second: Within same priority, sort by createdAt DESC (newest first)
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA; // DESC order
        });
    }, [data]);

    const handleView = (gr: GoodsReceipt) => {
        setSelectedGR(gr);
        setDetailSheetOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this goods receipt?')) return;

        setDeletingId(id);
        try {
            const result = await deleteGoodsReceiptAction(id);
            if (result.success) {
                router.refresh();
            } else {
                alert(result.message || 'Failed to delete goods receipt');
            }
        } catch (error) {
            console.error('Error deleting:', error);
            alert('Failed to delete goods receipt');
        } finally {
            setDeletingId(null);
        }
    };

    const handleExport = (gr: GoodsReceipt) => {
        // Implement export logic
        console.log('Exporting:', gr.id);
    };

    const handleQC = (id: string) => {
        router.push(`/warehouse/goods-receipts/${id}/qc`);
    };

    // Workflow handlers
    const handleMarkArrived = (gr: GoodsReceipt) => {
        setSelectedGR(gr);
        setMarkArrivedDialogOpen(true);
    };

    const handleQCCheck = (gr: GoodsReceipt) => {
        setSelectedGR(gr);
        setQCCheckDialogOpen(true);
    };

    const handleApprove = (gr: GoodsReceipt) => {
        setSelectedGR(gr);
        setApproveDialogOpen(true);
    };

    const renderMobileCard = (gr: GoodsReceipt) => (
        <Card key={gr.id} className="rounded-xl border shadow-sm bg-white dark:bg-slate-900 overflow-hidden hover:shadow-md transition-all">
            <CardContent className="p-3">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-slate-400">GR NUMBER</span>
                        </div>
                        <span className="font-mono font-bold text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{gr.grNumber}</span>
                    </div>
                    {getStatusBadge(gr.status)}
                </div>

                <div className="space-y-2 mb-4">
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="flex flex-col gap-1">
                            <span className="text-slate-400">Vendor</span>
                            <div className="flex items-center gap-1.5 font-medium text-slate-700">
                                <Truck className="w-3 h-3 text-slate-400" />
                                <span className="truncate">{gr.PurchaseOrder?.supplier?.name || <span className="text-[10px] text-slate-400 italic font-normal">Internal Transaction</span>}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-slate-400">Warehouse</span>
                            <div className="flex items-center gap-1.5 font-medium text-slate-700">
                                <Store className="w-3 h-3 text-slate-400" />
                                <span className="truncate">{gr.Warehouse?.name || '-'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 grid grid-cols-2 gap-3 text-[10px]">
                        <div>
                            <span className="text-slate-400 block mb-0.5">Created</span>
                            <span className="font-medium text-slate-700">{gr.createdAt ? format(new Date(gr.createdAt), "dd MMM yyyy", { locale: id }) : '-'}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block mb-0.5">Note</span>
                            <span className="font-mono font-medium text-slate-700">{gr.vendorDeliveryNote || '-'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-end border-t border-slate-100 pt-3">
                    <TooltipProvider>
                        {gr.status === DocumentStatus.DRAFT && (
                            gr.sourceType === 'TRANSFER' ? (
                                gr.transferStatus === 'IN_TRANSIT' ? (
                                    <Button variant="default" size="sm" onClick={() => handleMarkArrived(gr)} className="h-8 text-[10px] px-3 bg-blue-600 hover:bg-blue-700">
                                        <Truck className="h-3 w-3 mr-1.5" /> Terima
                                    </Button>
                                ) : (
                                    <Button variant="outline" size="sm" disabled className="h-8 text-[10px] px-3 bg-amber-50 text-amber-700 border-amber-300 opacity-75">
                                        <AlertCircle className="h-3 w-3 mr-1.5" /> Belum Diambil
                                    </Button>
                                )
                            ) : (
                                (() => {
                                    const allItemsPending = gr.items?.every(item => item.qcStatus === QCStatus.PENDING);
                                    if (!allItemsPending) return null;
                                    const isWIPWarehouse = gr.Warehouse?.isWip === true;
                                    if (isWIPWarehouse) {
                                        const poLines = gr.PurchaseOrder?.lines || [];
                                        const hasUncheckedReports = poLines.some((line: any) => line.checkPurchaseExecution === false);
                                        const allFieldReportsChecked = poLines.length > 0 && poLines.every((line: any) => line.checkPurchaseExecution === true);
                                        if (hasUncheckedReports || !allFieldReportsChecked) {
                                            return (
                                                <Button variant="outline" size="sm" disabled className="h-8 text-[10px] px-3 bg-amber-50 text-amber-700 border-amber-300 opacity-75">
                                                    <AlertCircle className="h-3 w-3 mr-1.5" /> Cek Nota
                                                </Button>
                                            );
                                        }
                                    }
                                    return (
                                        <Button variant="default" size="sm" onClick={() => handleMarkArrived(gr)} className="h-8 text-[10px] px-3 bg-blue-600 hover:bg-blue-700">
                                            <Truck className="h-3 w-3 mr-1.5" /> Terima
                                        </Button>
                                    );
                                })()
                            )
                        )}

                        {(gr.status === DocumentStatus.ARRIVED || gr.status === DocumentStatus.DRAFT) && gr.items?.every(item => item.qcStatus === QCStatus.ARRIVED) && (
                            <Button variant="default" size="sm" onClick={() => handleQCCheck(gr)} className="h-8 text-[10px] px-3 bg-green-600 hover:bg-green-700">
                                <PackageCheck className="h-3 w-3 mr-1.5" /> QC Check
                            </Button>
                        )}

                        {(gr.status === DocumentStatus.PASSED || gr.status === DocumentStatus.DRAFT) && gr.items?.every(item =>
                            item.qcStatus === QCStatus.PASSED || item.qcStatus === QCStatus.REJECTED || item.qcStatus === QCStatus.PARTIAL
                        ) && gr.items.length > 0 && (
                                <Button variant="default" size="sm" onClick={() => handleApprove(gr)} className="h-8 text-[10px] px-3 bg-emerald-600 hover:bg-emerald-700">
                                    <ThumbsUp className="h-3 w-3 mr-1.5" /> Approve
                                </Button>
                            )}

                        <Button variant="outline" size="sm" onClick={() => handleView(gr)} className="h-8 px-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700">
                            <Eye className="h-3 w-3" />
                        </Button>
                    </TooltipProvider>
                </div>
            </CardContent>
        </Card>
    );

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />
                ))}
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No goods receipts found</h3>
                <p className="text-gray-500">Create your first goods receipt to get started.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border hidden lg:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((column) => (
                                <TableHead
                                    key={column.id}
                                    className={column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''}
                                    style={column.width ? { width: column.width } : undefined}
                                >
                                    {column.label}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedData.map((gr) => (
                            <TableRow key={gr.id} className="hover:bg-slate-50 transition-colors group">
                                <TableCell className="py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-100 p-2 rounded-lg text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                            <Hash className="w-4 h-4" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-slate-500 font-medium">GR:</span>
                                                <span className="font-mono font-semibold text-xs bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-200/50 shadow-sm">
                                                    {gr.grNumber}
                                                </span>
                                            </div>
                                            {gr.PurchaseOrder?.poNumber && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-slate-500 font-medium">PO:</span>
                                                    <span className="font-mono font-semibold text-xs bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 px-2.5 py-1 rounded-md border border-emerald-200/50 shadow-sm">
                                                        {gr.PurchaseOrder.poNumber}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1">
                                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 font-medium">
                                                    {gr.items.length} Items
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                {/* Created At */}
                                <TableCell>
                                    {gr.createdAt ? (
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-700 text-sm">
                                                {format(new Date(gr.createdAt), "dd MMM yyyy", { locale: id })}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {format(new Date(gr.createdAt), "HH:mm")} WIB
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">-</span>
                                    )}
                                </TableCell>
                                {/* Expected Date */}
                                <TableCell>
                                    {gr.expectedDate ? (
                                        <div className="flex flex-col">
                                            <span className="font-medium text-blue-700 text-sm">
                                                Estimasi : {format(new Date(gr.expectedDate), "dd MMM yyyy", { locale: id })}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">-</span>
                                    )}
                                    {/* </TableCell>
                                <TableCell> */}
                                    {gr.receivedDate ? (
                                        <div className="flex flex-col">
                                            <span className="font-medium text-green-700 text-sm">
                                                Actual : {format(new Date(gr.receivedDate), "dd MMM yyyy", { locale: id })}
                                            </span>
                                            <span className="text-xs text-green-600">
                                                {format(new Date(gr.receivedDate), "HH:mm")} WIB
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">Belum diterima</span>
                                    )}
                                </TableCell>
                                {/* Vendor Delivery Note */}
                                <TableCell>
                                    {gr.vendorDeliveryNote ? (
                                        <span className="font-mono text-sm text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                            {gr.vendorDeliveryNote}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">-</span>
                                    )}
                                    {/* </TableCell>
                                <TableCell> */}
                                    {gr.notes ? (
                                        <div className="max-w-[500px] text-sm stext-slate-600 text-wrap" title={gr.notes}>
                                            {gr.notes}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Truck className="w-4 h-4 text-slate-400" />
                                        <span className="font-bold text-slate-800 text-sm">
                                            {gr.PurchaseOrder?.supplier?.name || <span className="text-[10px] text-slate-500 italic font-normal">Internal Transaction</span>}
                                        </span>
                                    </div>
                                    {/* </TableCell>
                                <TableCell> */}
                                    <div className={`
                                        flex items-center gap-2 px-3 py-1.5 rounded-lg border w-fit
                                        ${getWarehouseStyle(gr.Warehouse?.name)}
                                    `}>
                                        <Store className="w-3.5 h-3.5" />
                                        <span className="font-semibold text-xs">
                                            {gr.Warehouse?.name || 'N/A'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {getStatusBadge(gr.status)}
                                </TableCell>
                                <TableCell className="text-center">
                                    <TooltipProvider>
                                        <div className="flex items-center justify-center gap-1">
                                            {/* Mark as Arrived - show when GR is DRAFT */}
                                            {gr.status === DocumentStatus.DRAFT && (
                                                gr.sourceType === 'TRANSFER' ? (
                                                    // Transfer GR: Check if transfer is IN_TRANSIT
                                                    gr.transferStatus === 'IN_TRANSIT' ? (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="default"
                                                                    size="sm"
                                                                    onClick={() => handleMarkArrived(gr)}
                                                                    className="h-9 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-200 font-semibold animate-pulse"
                                                                >
                                                                    <Truck className="h-4 w-4 mr-1.5" />
                                                                    Terima Barang
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Mark as Arrived - Input penerimaan barang</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    ) : (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    disabled
                                                                    className="h-9 px-4 bg-amber-50 text-amber-700 border-amber-300 cursor-not-allowed opacity-75"
                                                                >
                                                                    <AlertCircle className="h-4 w-4 mr-1.5" />
                                                                    Barang Belum Diambil
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-xs">
                                                                <p className="font-semibold text-amber-600">Barang Belum Diambil dari Gudang Asal</p>
                                                                <p className="text-xs mt-1">Transfer harus berstatus IN_TRANSIT terlebih dahulu</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )
                                                ) : (
                                                    // Regular GR: Check WIP warehouse and field report verification
                                                    (() => {
                                                        const allItemsPending = gr.items?.every(item => item.qcStatus === QCStatus.PENDING);
                                                        if (!allItemsPending) return null;

                                                        // Check if warehouse is WIP
                                                        const isWIPWarehouse = gr.Warehouse?.isWip === true;

                                                        if (isWIPWarehouse) {
                                                            // For WIP warehouse, check if all PO lines have field reports verified
                                                            const poLines = gr.PurchaseOrder?.lines || [];
                                                            const allFieldReportsChecked = poLines.length > 0 && poLines.every((line: any) => line.checkPurchaseExecution === true);
                                                            const hasUncheckedReports = poLines.some((line: any) => line.checkPurchaseExecution === false);

                                                            if (hasUncheckedReports || !allFieldReportsChecked) {
                                                                // Show warning button if field reports not verified
                                                                return (
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                disabled
                                                                                className="h-9 px-4 bg-amber-50 text-amber-700 border-amber-300 cursor-not-allowed opacity-75 animate-pulse"
                                                                            >
                                                                                <AlertCircle className="h-4 w-4 mr-1.5" />
                                                                                Nota/Bon Belum Dicek
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className="max-w-xs">
                                                                            <p className="font-semibold text-amber-600">Laporan Nota Lapangan Belum Dicek</p>
                                                                            <p className="text-xs mt-1">Semua laporan nota lapangan harus diverifikasi terlebih dahulu untuk gudang WIP</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                );
                                                            }
                                                        }

                                                        // Show active button if all conditions met
                                                        return (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="default"
                                                                        size="sm"
                                                                        onClick={() => handleMarkArrived(gr)}
                                                                        className="h-9 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-200 font-semibold animate-pulse"
                                                                    >
                                                                        <Truck className="h-4 w-4 mr-1.5" />
                                                                        Terima Barang
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Mark as Arrived - Input penerimaan barang</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        );
                                                    })()
                                                )
                                            )}

                                            {/* QC Check - show when GR is ARRIVED and all items are ARRIVED */}
                                            {(gr.status === DocumentStatus.ARRIVED || gr.status === DocumentStatus.DRAFT) && gr.items?.every(item => item.qcStatus === QCStatus.ARRIVED) && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            onClick={() => handleQCCheck(gr)}
                                                            className="h-9 px-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg transition-all duration-200 font-semibold animate-pulse"
                                                        >
                                                            <PackageCheck className="h-4 w-4 mr-1.5" />
                                                            QC Check
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Lakukan pemeriksaan kualitas barang</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}

                                            {/* Approve - show when GR is PASSED and all items have completed QC */}
                                            {(gr.status === DocumentStatus.PASSED || gr.status === DocumentStatus.DRAFT) && gr.items?.every(item =>
                                                item.qcStatus === QCStatus.PASSED ||
                                                item.qcStatus === QCStatus.REJECTED ||
                                                item.qcStatus === QCStatus.PARTIAL
                                            ) && gr.items.length > 0 && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                onClick={() => handleApprove(gr)}
                                                                className="h-9 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-md hover:shadow-lg transition-all duration-200 font-semibold animate-pulse"
                                                            >
                                                                <ThumbsUp className="h-4 w-4 mr-1.5" />
                                                                Approve GR
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="max-w-xs">
                                                            <div className="space-y-1">
                                                                <p className="font-semibold text-emerald-600">Approve GR dan Update Stock</p>
                                                                <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                                                                    <AlertCircle className="h-3 w-3" />
                                                                    Perhatian: Setelah di-approve, transaksi ini tidak dapat dibatalkan!
                                                                </p>
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )}
                                            {/* View Button */}
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleView(gr)}
                                                        className="h-8 px-2 bg-blue-50/50 hover:bg-blue-100/70 border-blue-200 text-blue-700 hover:text-blue-800"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>View Details</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            {/* Print GRN Button - only for PASSED status */}
                                            {gr.status === DocumentStatus.PASSED && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span tabIndex={-1}>
                                                            <BlobProvider document={<GoodsReceiptPdfDocument goodsReceipt={gr} />}>
                                                                {({ url, loading }: { url: string | null, loading: boolean }) => (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        disabled={loading}
                                                                        className="h-8 px-2 bg-purple-50/50 hover:bg-purple-100/70 border-purple-200 text-purple-700 hover:text-purple-800"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (url) {
                                                                                window.open(url, '_blank');
                                                                            }
                                                                        }}
                                                                    >
                                                                        {loading ? (
                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <Printer className="h-4 w-4" />
                                                                        )}
                                                                    </Button>
                                                                )}
                                                            </BlobProvider>
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Cetak GRN</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}

                                            {/* Delete Button - only for DRAFT and admin role */}
                                            {gr.status === DocumentStatus.DRAFT && user?.role === 'admin' && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDelete(gr.id)}
                                                            disabled={deletingId === gr.id}
                                                            className="h-8 px-2 bg-red-50/50 hover:bg-red-100/70 border-red-200 text-red-700 hover:text-red-800 disabled:opacity-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{deletingId === gr.id ? 'Deleting...' : 'Delete GR'}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </TooltipProvider>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-2">
                {sortedData.map(gr => renderMobileCard(gr))}
            </div>

            {onPageChange && totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                        Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage <= 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Detail Sheet */}
            <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
                <GRDetailSheet
                    gr={selectedGR}
                    onClose={() => setDetailSheetOpen(false)}
                />
            </Sheet>

            {/* Workflow Dialogs */}
            {selectedGR && (
                <>
                    <MarkAsArrivedDialog
                        open={markArrivedDialogOpen}
                        onOpenChange={setMarkArrivedDialogOpen}
                        gr={selectedGR}
                        onSuccess={() => router.refresh()}
                        onOpenQCDialog={() => {
                            setQCCheckDialogOpen(true);
                        }}
                    />

                    <QCCheckDialog
                        open={qcCheckDialogOpen}
                        onOpenChange={setQCCheckDialogOpen}
                        gr={selectedGR}
                        onSuccess={() => router.refresh()}
                    />

                    <ApproveGRDialog
                        open={approveDialogOpen}
                        onOpenChange={setApproveDialogOpen}
                        gr={selectedGR}
                        onSuccess={() => router.refresh()}
                    />
                </>
            )}
        </div>
    );
}