"use client";

import { useState, useEffect } from "react";
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    Building,
    Calendar,
    Camera,
    ChevronDown,
    ChevronUp,
    Edit,
    Eye,
    FileDigit,
    FileText,
    ListChecks,
    MoreHorizontal,
    Package,
    Search,
    Trash2,
    Download,
    MapPin,
    Clock,
    CheckCircle,
    AlertCircle,
    PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { BAPPdfDocument } from "./bapPdfPreview";
import { BAPDetailDrawer } from "./bapDetailDialog";
import { DeleteConfirmationDialog } from "./alertDeleteDialog";
import { useDeleteBAP } from "@/hooks/use-delete-bap";
import { toast } from "sonner";
import { processBapImagesForPdf } from "./pdfUtils";

export interface BAPData {
    id: string;
    bapNumber: string;
    bapDate: string;
    salesOrderId: string;
    projectId: string;
    createdById: string;
    userId: string;
    workDescription: string;
    location: string;
    status: "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "APPROVED";
    isApproved: boolean;
    approvedAt: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    salesOrder: {
        id: string;
        soNumber: string;
        customer: { id: string; name: string; branch: string, contactPerson: string; address: string };
        project?: {
            name: string;
            location: string | null;
        };
        spk: {
            spkNumber: string;
            spkDate: string;
        }[],
        items?: {
            id: string;
            name: string;
            description: string;
            productId: string;
            qty: number;
            price: number;
            discount?: number;
            total: number;
            uom: string;
        }[];
    };
    createdBy: {
        id: string;
        name: string;
    };
    user: {
        id: string;
        namaLengkap: string;
    };
    photos?: {
        id?: string;
        bapId: string;
        photoUrl: string;
        caption?: string;
        category: "BEFORE" | "PROCESS" | "AFTER";
        createdAt?: string;
    }[];
}

interface BAPDataTableProps {
    bapData: BAPData[];
    isLoading: boolean;
}

export function BAPDataTable({
    bapData,
    isLoading,
}: BAPDataTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    const [globalFilter, setGlobalFilter] = useState("");

    const router = useRouter();
    const [selectedBap, setSelectedBap] = useState<BAPData | null>(null);
    const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
    const [selectedBapForDetail, setSelectedBapForDetail] = useState<BAPData | null>(null);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [expandedProductRows, setExpandedProductRows] = useState<Set<string>>(new Set());

    const {
        isDialogOpen,
        isLoading: isDeleting,
        openDialog,
        closeDialog,
        handleDelete,
    } = useDeleteBAP({
        onSuccess: () => {
            toast.success("BAP berhasil dihapus");
        },
        onError: (error) => {
            toast.error(`Gagal menghapus BAP: ${error}`);
        },
    });



    const [processedBap, setProcessedBap] = useState<BAPData | null>(null);
    const [isProcessingPdf, setIsProcessingPdf] = useState(false);

    const handlePdfPreview = async (bap: BAPData) => {
        setSelectedBap(bap);
        setProcessedBap(null); // Reset previous state
        setIsPdfPreviewOpen(true);
        setIsProcessingPdf(true);

        try {
            // Process images (convert WebP to JPG)
            const processed = await processBapImagesForPdf(bap);
            setProcessedBap(processed);
        } catch (error) {
            console.error("Error processing BAP for PDF:", error);
            toast.error("Gagal memproses gambar untuk PDF");
            // Fallback to original BAP if processing fails, but images might not show
            setProcessedBap(bap);
        } finally {
            setIsProcessingPdf(false);
        }
    };

    const handleViewDetail = (bap: BAPData) => {
        setSelectedBapForDetail(bap);
        setIsDetailDialogOpen(true);
    };

    const toggleProductExpansion = (bapId: string) => {
        setExpandedProductRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(bapId)) {
                newSet.delete(bapId);
            } else {
                newSet.add(bapId);
            }
            return newSet;
        });
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "APPROVED":
                return <CheckCircle className="h-3.5 w-3.5" />;
            case "COMPLETED":
                return <CheckCircle className="h-3.5 w-3.5" />;
            case "IN_PROGRESS":
                return <PlayCircle className="h-3.5 w-3.5" />;
            case "DRAFT":
                return <AlertCircle className="h-3.5 w-3.5" />;
            default:
                return <AlertCircle className="h-3.5 w-3.5" />;
        }
    };

    const columns: ColumnDef<BAPData>[] = [
        {
            accessorKey: "bapNumber",
            header: "Nomor BAP",
            cell: ({ row }) => (
                <div className="flex items-center space-x-3 p-2 bg-gradient-to-r from-green-50/80 to-yellow-50/80 dark:from-emerald-900 dark:to-yellow-900/40 rounded-lg border border-green-100 dark:border-emerald-600">
                    <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                            {row.getValue("bapNumber")}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-emerald-200 flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-green-600 dark:text-emerald-300" />
                            {format(new Date(row.original.bapDate), "dd MMM yyyy")}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "salesOrder",
            header: "Informasi Project",
            cell: ({ row }) => {
                const bap = row.original;
                return (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-green-600" />
                            <div>
                                <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                                    {bap.salesOrder.customer.branch}
                                </div>
                                <div className="text-xs text-slate-500">
                                    {bap.salesOrder.customer.name}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "salesOrder.soNumber",
            header: () => <div className="w-48">Sales Order</div>, // Lebar header
            cell: ({ row }) => (
                <div className="w-96 space-y-1"> {/* Lebar cell */}
                    <div className="flex items-center gap-2">
                        <FileDigit className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {row.original.salesOrder.soNumber}
                        </span>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 text-wrap">
                        <MapPin className="h-3 w-3" />
                        {row.original.location || "Lokasi tidak tersedia"}
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "workDescription",
            header: "Deskripsi Pekerjaan",
            cell: ({ row }) => (
                <div className="max-w-xl">
                    <div className="p-3 bg-gradient-to-r from-cyan-50/80 to-blue-50/80 dark:from-cyan-900/30 dark:to-blue-900/20 rounded-lg border border-cyan-100 dark:border-cyan-800/40 shadow-sm">
                        <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-cyan-600 dark:text-cyan-400 mt-0.5 flex-shrink-0" />
                            <div className="text-xs font-bold text-slate-900 dark:text-cyan-100 line-clamp-2 text-wrap uppercase">
                                {row.getValue("workDescription") || "Tidak ada deskripsi"}
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string;

                const statusConfig = {
                    "APPROVED": { variant: "success" as const, label: "Disetujui" },
                    "COMPLETED": { variant: "default" as const, label: "Selesai" },
                    "IN_PROGRESS": { variant: "secondary" as const, label: "Dalam Proses" },
                    "DRAFT": { variant: "outline" as const, label: "Draft" }
                };

                const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;

                return (
                    <div className="flex flex-col items-center space-y-2">
                        <Badge
                            variant={config.variant}
                            className="flex items-center gap-1 px-3 py-1 font-semibold"
                        >
                            {getStatusIcon(status)}
                            {config.label}
                        </Badge>
                        {row.original.approvedAt && (
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(row.original.approvedAt), "dd MMM")}
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: "photos",
            header: "Dokumentasi",
            cell: ({ row }) => {
                const photos = row.original.photos || [];
                const bap = row.original;

                return (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetail(bap)}
                        className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700 hover:from-green-100 hover:to-emerald-100"
                    >
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded flex items-center justify-center">
                                    <Camera className="h-3 w-3 text-white" />
                                </div>
                                {photos.length > 0 && (
                                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                        {photos.length}
                                    </div>
                                )}
                            </div>
                            <span className="text-xs font-medium">
                                {photos.length} foto
                            </span>
                        </div>
                    </Button>
                );
            },
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {
                const bap = row.original;

                return (
                    <div className="flex items-center justify-end space-x-2">
                        <div className="relative group">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePdfPreview(bap)}
                                className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/20 dark:border-blue-700 dark:text-blue-200 dark:hover:from-blue-800/40 dark:hover:to-cyan-800/30 transition-all duration-200 shadow-sm hover:shadow-md px-3"
                            >
                                <div className="flex items-center gap-2">
                                    <Eye className="h-4 w-4" />
                                    <span className="text-sm font-medium">View PDF</span>
                                </div>
                            </Button>

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                                <div className="bg-slate-900 dark:bg-slate-800 text-white text-xs rounded py-1.5 px-2.5 whitespace-nowrap shadow-lg border border-slate-700">
                                    Preview & Download PDF
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-800"></div>
                                </div>
                            </div>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="bg-slate-50 border-slate-200">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Aksi BAP
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => router.push(`/admin-area/logistic/bap/update/${bap.id}`)}
                                    className="flex items-center gap-2 text-amber-600"
                                >
                                    <Edit className="h-4 w-4" />
                                    Edit BAP
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="flex items-center gap-2 text-red-600"
                                    onClick={() => openDialog(bap.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Hapus BAP
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ];

    const table = useReactTable({
        data: bapData,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            globalFilter,
        },
    });

    if (isLoading) {
        return (
            <Card className="w-full border-0 shadow-lg">
                <CardContent className="p-6">
                    <div className="flex items-center py-4">
                        <Skeleton className="h-10 w-full max-w-sm" />
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id} className="bg-gradient-to-r from-slate-50 to-slate-100">
                                        {headerGroup.headers.map((header) => {
                                            return (
                                                <TableHead key={header.id} className="font-bold text-slate-700">
                                                    <Skeleton className="h-6 w-20" />
                                                </TableHead>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <TableRow key={index} className="hover:bg-slate-50/50">
                                        {Array.from({ length: columns.length }).map((_, cellIndex) => (
                                            <TableCell key={cellIndex}>
                                                <Skeleton className="h-6 w-full" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className="w-full border-0 shadow-xl">
                <CardContent className="p-1 md:p-6">
                    {/* Mobile View */}
                    <div className="md:hidden space-y-3">
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => {
                                const bap = row.original;
                                return (
                                    <Card key={row.id} className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
                                        {/* Header */}
                                        <CardHeader className="py-2 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800 rounded-t-lg border-b border-slate-200 dark:border-slate-700">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <FileText className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                                                    <div className="min-w-0">
                                                        <CardTitle className="text-sm font-bold truncate text-slate-900 dark:text-slate-100">
                                                            {bap.bapNumber}
                                                        </CardTitle>
                                                        <CardDescription className="flex items-center gap-1 text-xs mt-0.5">
                                                            <Building className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                                                            <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                                                                {bap.salesOrder.customer.branch}
                                                            </span>
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                                <Badge
                                                    variant={
                                                        bap.status === "APPROVED" ? "success" :
                                                            bap.status === "COMPLETED" ? "default" :
                                                                bap.status === "IN_PROGRESS" ? "secondary" : "outline"
                                                    }
                                                    className="flex items-center gap-1 px-2 py-1 text-xs flex-shrink-0 ml-2 capitalize"
                                                >
                                                    {bap.status.toLowerCase().replace("_", " ")}
                                                </Badge>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="py-2">
                                            {/* Informasi Utama */}
                                            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-orange-600 flex-shrink-0" />
                                                    <div>
                                                        <div className="text-slate-500 text-[11px]">Tanggal BAP</div>
                                                        <div className="font-medium text-slate-900 dark:text-slate-100">
                                                            {format(new Date(bap.bapDate), "dd MMM yyyy")}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Package className="h-3.5 w-3.5 text-purple-600 flex-shrink-0" />
                                                    <div>
                                                        <div className="text-slate-500 text-[11px]">Project</div>
                                                        <div className="font-medium text-slate-900 dark:text-slate-100 text-wrap">
                                                            {bap.salesOrder.project?.name || "-"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Informasi Sales Order */}
                                            <div className="border-t border-slate-200 dark:border-slate-700 pt-2">
                                                <div className="flex items-center gap-1.5 text-xs mb-2">
                                                    <FileDigit className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                                                    <span className="text-slate-500">Sales Order:</span>
                                                    <span className="font-medium text-slate-900 dark:text-slate-100">
                                                        {bap.salesOrder.soNumber}
                                                    </span>
                                                </div>

                                                {/* Items Preview */}
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-semibold text-xs flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                                            <ListChecks className="h-3.5 w-3.5 text-indigo-600" />
                                                            Item yang diserahkan
                                                        </h4>

                                                        {/* Photo Counter dengan Tooltip Detail */}
                                                        {bap.photos && bap.photos.length > 0 && (
                                                            <div className="relative group">
                                                                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md cursor-help">
                                                                    <Camera className="h-3.5 w-3.5 text-purple-600" />
                                                                    <span>{bap.photos.length}</span>
                                                                </div>
                                                                {/* Detailed Tooltip */}
                                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10 min-w-[140px]">
                                                                    <div className="bg-slate-900 text-white text-xs rounded py-2 px-3">
                                                                        <div className="font-semibold mb-1">Dokumentasi Foto:</div>
                                                                        <div className="space-y-1">
                                                                            <div className="flex justify-between">
                                                                                <span>Before:</span>
                                                                                <span>{bap.photos.filter(p => p.category === 'BEFORE').length}</span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span>Process:</span>
                                                                                <span>{bap.photos.filter(p => p.category === 'PROCESS').length}</span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span>After:</span>
                                                                                <span>{bap.photos.filter(p => p.category === 'AFTER').length}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Items list */}
                                                    {(expandedProductRows.has(bap.id) ? bap.salesOrder.items : bap.salesOrder.items?.slice(0, 2))?.map((item, index) => (
                                                        <div key={item.id} className="flex items-center gap-2 px-2 py-0.5 bg-slate-50 dark:bg-slate-800 rounded-md">
                                                            <div className="flex-shrink-0">
                                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                                                                    {index + 1}
                                                                </span>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-xs text-slate-900 dark:text-slate-100 truncate">
                                                                    {item.name}
                                                                </p>
                                                            </div>
                                                            <div className="flex-shrink-0">
                                                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                                    {item.qty}-{item.uom}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Toggle button */}
                                                    {bap.salesOrder.items && bap.salesOrder.items.length > 2 && (
                                                        <div className="text-center py-1">
                                                            <button
                                                                onClick={() => toggleProductExpansion(bap.id)}
                                                                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center justify-center gap-1 mx-auto cursor-pointer"
                                                            >
                                                                {expandedProductRows.has(bap.id) ? (
                                                                    <>
                                                                        <ChevronUp className="h-3 w-3" />
                                                                        Tampilkan lebih sedikit
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <ChevronDown className="h-3 w-3" />
                                                                        + {bap.salesOrder.items.length - 2} item lainnya
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>

                                        {/* Action Buttons */}
                                        <div className="px-3 pb-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                                            <div className="flex justify-between items-center">
                                                {/* Preview PDF Button */}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handlePdfPreview(bap)}
                                                    className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    <span>Preview PDF</span>
                                                </Button>

                                                {/* Action Buttons */}
                                                <div className="flex gap-1">
                                                    {/* Edit Button */}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => router.push(`/admin-area/logistic/bap/update/${bap.id}`)}
                                                        className="h-9 w-9 p-0 border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-600"
                                                        title="Edit BAP"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>

                                                    {/* View Detail Button */}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleViewDetail(bap)}
                                                        className="h-9 w-9 p-0 border-green-200 bg-green-50 hover:bg-green-100 text-green-600"
                                                        title="Lihat Detail"
                                                    >
                                                        <Search className="h-4 w-4" />
                                                    </Button>

                                                    {/* Delete Button */}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openDialog(bap.id)}
                                                        className="h-9 w-9 p-0 border-red-200 bg-red-50 hover:bg-red-100 text-red-600"
                                                        title="Hapus BAP"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <FileText className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                                <p>Tidak ada data BAP ditemukan</p>
                            </div>
                        )}
                    </div>

                    {/* Desktop Version - Premium Design */}
                    <div className="hidden md:block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow
                                        key={headerGroup.id}
                                        className="bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-b border-slate-200 dark:border-slate-600"
                                    >
                                        {headerGroup.headers.map((header) => {
                                            return (
                                                <TableHead
                                                    key={header.id}
                                                    className="font-bold text-slate-700 dark:text-slate-200 py-4 text-sm uppercase tracking-wide"
                                                >
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                </TableHead>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                            className="group hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-cyan-50/30 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 border-b border-slate-100 dark:border-slate-700 transition-all duration-200"
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell
                                                    key={cell.id}
                                                    className="py-1 align-top"
                                                >
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-32 text-center"
                                        >
                                            <div className="flex flex-col items-center justify-center space-y-3 text-slate-500 dark:text-slate-400">
                                                <FileText className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                                                <div className="text-lg font-semibold dark:text-slate-300">Tidak ada data BAP</div>
                                                <div className="text-sm dark:text-slate-500">Data BAP akan muncul di sini</div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                </CardContent>
            </Card>

            {/* Modal Preview PDF */}
            <Dialog open={isPdfPreviewOpen} onOpenChange={setIsPdfPreviewOpen}>
                <DialogContent className="max-w-6xl max-h-screen overflow-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-cyan-600" />
                            Preview PDF BAP: {selectedBap?.bapNumber}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedBap && (
                        <div className="py-4 space-y-4">
                            {isProcessingPdf ? (
                                <div className="flex flex-col items-center justify-center p-8 space-y-4">
                                    <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-sm text-slate-500 font-medium animate-pulse">
                                        Sedang memproses gambar untuk PDF...
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex gap-3">
                                        <PDFDownloadLink
                                            document={<BAPPdfDocument bap={processedBap || selectedBap} />}
                                            fileName={`BAP-${selectedBap.bapNumber}.pdf`}
                                        >
                                            {({ loading }) =>
                                                loading ? (
                                                    <Button disabled className="bg-gradient-to-r from-blue-500 to-cyan-600">
                                                        <Download className="h-4 w-4 mr-2" />
                                                        Memuat PDF...
                                                    </Button>
                                                ) : (
                                                    <Button className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700">
                                                        <Download className="h-4 w-4 mr-2" />
                                                        Unduh PDF
                                                    </Button>
                                                )
                                            }
                                        </PDFDownloadLink>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleViewDetail(selectedBap)}
                                            className="border-green-200 text-green-700 hover:bg-green-50"
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            Lihat Detail Lengkap
                                        </Button>
                                    </div>

                                    <div className="border-t border-slate-200 pt-4">
                                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-slate-600" />
                                            Preview Dokumen
                                        </h3>
                                        <div className="bg-white rounded-lg shadow-lg border" style={{ height: "700px" }}>
                                            <PDFViewer width="100%" height="100%">
                                                <BAPPdfDocument bap={processedBap || selectedBap} />
                                            </PDFViewer>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Dialog Detail */}
            <BAPDetailDrawer
                open={isDetailDialogOpen}
                onOpenChange={setIsDetailDialogOpen}
                bap={selectedBapForDetail}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                isOpen={isDialogOpen}
                onClose={closeDialog}
                onConfirm={handleDelete}
                isLoading={isDeleting}
                title="Hapus BAP"
                description="Apakah Anda yakin ingin menghapus BAP ini? Tindakan ini tidak dapat dibatalkan dan data akan dihapus secara permanen."
            />
        </>
    );
}