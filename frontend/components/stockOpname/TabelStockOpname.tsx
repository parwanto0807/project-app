// components/so/TabelStockOpname.tsx
"use client";

import { useState } from "react";
import {
    Eye,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    MoreVertical,
    ClipboardList,
    Warehouse,
    User,
    Calendar,
    Package,
    TrendingUp,
    TrendingDown,
    Minus,
    ArrowRightCircle,
    CheckCircle2,
    RefreshCw,
    Database,
    TrendingUp as TrendingUpIcon,
    AlertTriangle,
    BadgeCheck
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import type { StockOpname, OpnameType, OpnameStatus } from "@/types/soType";
import { formatDate, formatCurrency, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useSession } from "../clientSessionProvider";

interface TabelStockOpnameProps {
    data: StockOpname[];
    loading: boolean;
    onViewDetail: (id: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onAdjust: (id: string) => void;
    onCancel: (id: string) => void;
    getStatusBadge: (status: OpnameStatus) => React.ReactNode;
    getTypeBadge: (type: OpnameType) => React.ReactNode;
    pagination: {
        page: number;
        limit: number;
    };
}

export default function TabelStockOpname({
    data,
    loading,
    pagination,
    onViewDetail,
    onEdit,
    onDelete,
    onAdjust,
    onCancel,
    getStatusBadge,
    getTypeBadge,
}: TabelStockOpnameProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [syncDialogOpen, setSyncDialogOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<StockOpname | null>(null);
    const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
    const session = useSession();

    const handleDeleteClick = (id: string, item: StockOpname) => {
        setSelectedId(id);
        setSelectedItem(item);
        setDeleteDialogOpen(true);
    };

    const handleAdjustClick = (id: string, item: StockOpname) => {
        setSelectedId(id);
        setSelectedItem(item);
        setAdjustDialogOpen(true);
    };

    const handleCancelClick = (id: string, item: StockOpname) => {
        setSelectedId(id);
        setSelectedItem(item);
        setCancelDialogOpen(true);
    };

    const handleSyncClick = (id: string, item: StockOpname) => {
        setSelectedId(id);
        setSelectedItem(item);
        setSyncDialogOpen(true);
    };

    const handleViewDetails = (item: StockOpname) => {
        setSelectedItem(item);
        setViewDetailsOpen(true);
    };

    const confirmDelete = () => {
        if (selectedId) {
            onDelete(selectedId);
            setDeleteDialogOpen(false);
            setSelectedId(null);
            setSelectedItem(null);
        }
    };

    const confirmAdjust = () => {
        if (selectedId) {
            onAdjust(selectedId);
            setAdjustDialogOpen(false);
            setSelectedId(null);
            setSelectedItem(null);
        }
    };

    const confirmCancel = () => {
        if (selectedId) {
            onCancel(selectedId);
            setCancelDialogOpen(false);
            setSelectedId(null);
            setSelectedItem(null);
        }
    };

    const confirmSync = () => {
        if (selectedId) {
            onAdjust(selectedId);
            setSyncDialogOpen(false);
            setSelectedId(null);
            setSelectedItem(null);
        }
    };

    const calculateTotals = (items: StockOpname["items"]) => {
        return (items || []).reduce((acc, item) => {
            acc.totalItems += 1;
            acc.totalNilai += Number(item.totalNilai || 0);
            acc.totalSelisih += Number(item.selisih || 0);
            return acc;
        }, { totalItems: 0, totalNilai: 0, totalSelisih: 0 });
    };

    const getSelisihIcon = (selisih: number) => {
        if (selisih > 0) {
            return <TrendingUp className="h-4 w-4 text-green-500" />;
        } else if (selisih < 0) {
            return <TrendingDown className="h-4 w-4 text-red-500" />;
        }
        return <Minus className="h-4 w-4 text-gray-500" />;
    };

    // Fungsi untuk mendapatkan status sync/penyesuaian
    const getSyncStatusDisplay = (item: StockOpname) => {
        if (item.status === "ADJUSTED") {
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 rounded-full border border-emerald-200 shadow-sm">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span className="text-xs font-semibold">✓ Synced to Balance</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            <p className="font-medium">Stok sudah disesuaikan ke sistem</p>
                            <p className="text-xs text-muted-foreground">
                                Data stok fisik telah terupdate di database
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        }

        if (item.status === "COMPLETED") {
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full border border-blue-200 shadow-sm">
                                <Database className="h-3.5 w-3.5" />
                                <span className="text-xs font-semibold">● Ready to Sync</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            <p className="font-medium">Siap untuk sinkronisasi ke sistem</p>
                            <p className="text-xs text-muted-foreground">
                                Klik tombol sync untuk update stok database
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        }

        if (item.status === "DRAFT") {
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 rounded-full border border-amber-200 shadow-sm">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                <span className="text-xs font-semibold">○ Draft Mode</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            <p className="font-medium">Belum disinkronkan ke sistem</p>
                            <p className="text-xs text-muted-foreground">
                                Masih dalam tahap pengisian data
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        }

        return null;
    };

    if (loading) {
        return <LoadingSkeleton />;
    }

    if (data.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                    <ClipboardList className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">Tidak ada data stock opname</h3>
                <p className="text-muted-foreground mt-1">
                    Mulai dengan membuat stock opname baru
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Mobile View (Card Layout) */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {data.map((item, index) => {
                    const totals = calculateTotals(item.items);
                    const nomorIndex = (pagination?.page - 1) * pagination?.limit + index + 1;

                    return (
                        <Card key={item.id} className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                            <div className="bg-slate-50 border-b p-3 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="h-6 w-6 flex items-center justify-center p-0 rounded-full bg-white text-[10px] font-bold">
                                        {nomorIndex}
                                    </Badge>
                                    <span className="font-bold text-sm text-slate-900">{item.nomorOpname}</span>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-blue-600"
                                        onClick={() => onViewDetail(item.id)}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    {item.status === "DRAFT" && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onEdit(item.id)}>
                                                    <Edit className="h-4 w-4 mr-2 text-blue-500" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleAdjustClick(item.id, item)}>
                                                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Adjust Stok
                                                </DropdownMenuItem>
                                                {(session?.user?.role === "admin" || session?.user?.role === "super") && (
                                                    <DropdownMenuItem onClick={() => handleCancelClick(item.id, item)}>
                                                        <XCircle className="h-4 w-4 mr-2 text-orange-500" /> Batalkan
                                                    </DropdownMenuItem>
                                                )}
                                                {(session?.user?.role === "admin" || session?.user?.role === "super") && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleDeleteClick(item.id, item)} className="text-red-600">
                                                            <Trash2 className="h-4 w-4 mr-2" /> Hapus
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            </div>
                            <CardContent className="p-4 space-y-4">
                                {/* Sync Status Indicator - Mobile */}
                                <div className="flex justify-center">
                                    {getSyncStatusDisplay(item)}
                                </div>

                                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-dashed border-slate-200">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase">Status & Tipe</p>
                                        <div className="flex flex-col gap-1.5 pt-1">
                                            <div>{getStatusBadge(item.status)}</div>
                                            <div>{getTypeBadge(item.type)}</div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase">Tanggal</p>
                                        <p className="text-sm font-medium pt-1">{formatDate(item.tanggalOpname, 'short')}</p>
                                        <p className="text-[10px] text-slate-400">Dibuat: {formatDate(item.createdAt, 'short')}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-dashed border-slate-200">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase">Gudang</p>
                                        <div className="flex items-center gap-1.5 pt-1">
                                            <Warehouse className="h-3 w-3 text-blue-500" />
                                            <span className="text-sm font-medium leading-tight">{item.warehouse?.name}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase">Petugas</p>
                                        <div className="flex items-center gap-1.5 pt-1">
                                            <User className="h-3 w-3 text-green-500" />
                                            <span className="text-sm font-medium leading-tight">{item.petugas?.name}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                                        <p className="text-[9px] font-medium text-slate-500 uppercase">Items</p>
                                        <p className="text-xs font-bold pt-0.5">{item.items?.length || 0}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                                        <p className="text-[9px] font-medium text-slate-500 uppercase">Selisih</p>
                                        <div className="flex items-center justify-center gap-1 pt-0.5">
                                            {getSelisihIcon(totals.totalSelisih)}
                                            <span className={cn(
                                                "text-xs font-bold",
                                                totals.totalSelisih > 0 && "text-green-600",
                                                totals.totalSelisih < 0 && "text-red-600"
                                            )}>
                                                {formatNumber(totals.totalSelisih)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                                        <p className="text-[9px] font-medium text-slate-500 uppercase">Total Nilai</p>
                                        <p className="text-[10px] font-bold pt-1 truncate">{formatCurrency(totals.totalNilai)}</p>
                                    </div>
                                </div>

                                {/* Sync Status Badge for Completed Items - Mobile */}
                                {item.status === "COMPLETED" && session?.user?.role === "admin" && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSyncClick(item.id, item)}
                                        className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800 hover:border-purple-300"
                                    >
                                        <RefreshCw className="h-3.5 w-3.5 mr-2" />
                                        Sync ke Balance
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Desktop View (Table Layout) */}
            <div className="hidden md:block rounded-md border overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead className="min-w-[180px]">Info Stock Opname</TableHead>
                            <TableHead className="min-w-[150px]">Status & Tipe</TableHead>
                            <TableHead>Gudang & Petugas</TableHead>
                            <TableHead>Items & Nilai</TableHead>
                            <TableHead className="text-center min-w-[160px]">Sync Status</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead className="text-right min-w-[150px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((item, index) => {
                            const totals = calculateTotals(item.items);
                            const nomorIndex = (pagination?.page - 1) * pagination?.limit + index + 1;

                            return (
                                <TableRow key={item.id} className="hover:bg-muted/30">
                                    <TableCell>
                                        <div className="font-medium text-center">
                                            {nomorIndex}
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <ClipboardList className="h-4 w-4 text-primary" />
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span className="font-medium truncate max-w-[200px] cursor-help">
                                                                {item.nomorOpname}
                                                            </span>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{item.nomorOpname}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            {item.keterangan && (
                                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                    {item.keterangan}
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <div className="space-y-2">
                                            <div>{getStatusBadge(item.status)}</div>
                                            <div>{getTypeBadge(item.type)}</div>
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 font-bold">
                                                <Warehouse className="h-3 w-3 text-blue-500" />
                                                <span className="text-sm">
                                                    {item.warehouse?.name || "Unknown"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <User className="h-3 w-3 text-green-500" />
                                                <span className="text-sm">
                                                    {item.petugas?.name || "Unknown"}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 font-bold">
                                                <Package className="h-3 w-3 text-purple-500" />
                                                <span className="text-sm">
                                                    {item.items?.length || 0} items
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-3 w-3 flex items-center justify-center font-bold">
                                                    {getSelisihIcon(totals.totalSelisih)}
                                                </div>
                                                <span className={cn(
                                                    "text-sm font-medium",
                                                    totals.totalSelisih > 0 && "text-green-600",
                                                    totals.totalSelisih < 0 && "text-red-600"
                                                )}>
                                                    {formatNumber(totals.totalSelisih)} selisih
                                                </span>
                                            </div>
                                            <div className="text-xs font-bold">
                                                Total: {formatCurrency(totals.totalNilai)}
                                            </div>
                                        </div>
                                    </TableCell>


                                    <TableCell className="text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            {getSyncStatusDisplay(item)}

                                            {item.status === "COMPLETED" && session?.user?.role === "admin" && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleSyncClick(item.id, item)}
                                                                className="h-8 px-3 text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200 transition-colors duration-200"
                                                            >
                                                                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                                                                Sync
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Sync hasil opname ke balance stok</p>
                                                            <p className="text-xs text-muted-foreground">Admin only</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3 w-3 text-orange-500" />
                                                <span className="text-sm">
                                                    {formatDate(item.tanggalOpname, 'short')}
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                dibuat: {formatDate(item.createdAt, 'short')}
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => onViewDetail(item.id)}
                                                            className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Lihat Detail</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>

                                            {item.status === "DRAFT" && (
                                                <>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => onEdit(item.id)}
                                                                    className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Edit Stock Opname</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>

                                                    {(session?.user?.role === "admin" || session?.user?.role === "super") && (
                                                        <>
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="icon"
                                                                            onClick={() => handleCancelClick(item.id, item)}
                                                                            className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-50 transition-colors duration-200"
                                                                        >
                                                                            <XCircle className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Batalkan</TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>

                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="icon"
                                                                            onClick={() => handleDeleteClick(item.id, item)}
                                                                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Hapus</TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </>
                                                    )}
                                                </>
                                            )}

                                            {/* Sync to Balance Button - Admin Only */}
                                            {session?.user?.role === "admin" && item.status === "COMPLETED" && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() => handleSyncClick(item.id, item)}
                                                                className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50 transition-colors duration-200 border-purple-200"
                                                            >
                                                                <TrendingUpIcon className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Sync to Balance (Admin)</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="sm:max-w-[425px]">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-red-100 p-2">
                                <Trash2 className="h-6 w-6 text-red-600" />
                            </div>
                            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="pt-2">
                            Apakah Anda yakin ingin menghapus stock opname ini?
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {selectedItem && (
                        <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Nomor Opname:</span>
                                <span className="font-semibold">{selectedItem.nomorOpname}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Gudang:</span>
                                <span>{selectedItem.warehouse?.name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Items:</span>
                                <span>{selectedItem.items?.length || 0} items</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Tanggal:</span>
                                <span>{formatDate(selectedItem.tanggalOpname, 'short')}</span>
                            </div>
                        </div>
                    )}

                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Ya, Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Adjust Confirmation Dialog */}
            <AlertDialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
                <AlertDialogContent className="sm:max-w-[425px]">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-green-100 p-2">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <AlertDialogTitle>Konfirmasi Adjustment</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="pt-2">
                            Apakah Anda yakin ingin menyesuaikan stok berdasarkan stock opname ini?
                            Tindakan ini akan mengupdate stok sistem dan tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {selectedItem && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-medium mb-2">Ringkasan Adjustment:</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Total Items:</span>
                                        <div className="font-medium">{selectedItem.items?.length || 0}</div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Total Selisih:</span>
                                        <div className="font-medium">
                                            {formatNumber(calculateTotals(selectedItem.items).totalSelisih)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="text-sm text-muted-foreground">
                                <p>✓ Stok fisik akan menjadi stok sistem baru</p>
                                <p>✓ Perubahan akan tercatat dalam history stok</p>
                                <p>✓ Status stock opname akan berubah menjadi ADJUSTED</p>
                            </div>
                        </div>
                    )}

                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmAdjust}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            Ya, Adjust Stok
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Cancel Confirmation Dialog */}
            <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <AlertDialogContent className="sm:max-w-[425px]">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-orange-100 p-2">
                                <XCircle className="h-6 w-6 text-orange-600" />
                            </div>
                            <AlertDialogTitle>Konfirmasi Pembatalan</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="pt-2">
                            Apakah Anda yakin ingin membatalkan stock opname ini?
                            Data tetap akan tersimpan dengan status CANCELLED.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {selectedItem && (
                        <div className="bg-orange-50 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">Stock Opname yang akan dibatalkan:</h4>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span>Nomor:</span>
                                    <span className="font-medium">{selectedItem.nomorOpname}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Gudang:</span>
                                    <span>{selectedItem.warehouse?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Petugas:</span>
                                    <span>{selectedItem.petugas?.name}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel>Tidak</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmCancel}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            Ya, Batalkan
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Sync to Balance Confirmation Dialog */}
            <AlertDialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
                <AlertDialogContent className="sm:max-w-[500px]">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-blue-100 p-2">
                                <TrendingUpIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            <AlertDialogTitle className="text-xl">Konfirmasi Sync to Balance</AlertDialogTitle>
                        </div>
                        <div className="pt-4 space-y-3">
                            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 flex items-start gap-2">
                                <Trash2 className="h-5 w-5 shrink-0 mt-0.5" />
                                <div className="text-sm font-medium">
                                    PERINGATAN: Tindakan ini TIDAK DAPAT DIBATALKAN (IRREVERSIBLE).
                                </div>
                            </div>
                            <AlertDialogDescription className="text-base">
                                Anda akan melakukan sinkronisasi hasil Stock Opname ini ke saldo sistem.
                            </AlertDialogDescription>
                            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 pl-2">
                                <li>Stok Sistem saat ini akan ditimpa dengan Stok Fisik hasil opname.</li>
                                <li>Akan tercatat jurnal penyesuaian/adjustment secara otomatis.</li>
                                <li>Status akan berubah menjadi <strong>ADJUSTED</strong>.</li>
                            </ul>
                        </div>
                    </AlertDialogHeader>

                    {selectedItem && (
                        <div className="bg-slate-50 p-4 rounded-lg mt-2 border border-slate-200">
                            <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-200">
                                <span className="text-sm font-semibold text-slate-700">Detail Opname:</span>
                                <span className="font-mono font-bold text-slate-900">{selectedItem.nomorOpname}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm_">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">Total Item</p>
                                    <p className="font-medium text-slate-900">{selectedItem.items?.length || 0} Products</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 uppercase font-bold">Total Selisih Nilai</p>
                                    <p className={cn(
                                        "font-bold",
                                        calculateTotals(selectedItem.items).totalSelisih > 0 ? "text-green-600" : "text-red-600"
                                    )}>
                                        {formatCurrency(calculateTotals(selectedItem.items).totalNilai)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <AlertDialogFooter className="mt-6 gap-2 sm:gap-0">
                        <AlertDialogCancel className="h-11">Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmSync}
                            className="h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-6 shadow-md shadow-blue-200/50"
                        >
                            <BadgeCheck className="w-4 h-4 mr-2" />
                            Ya, Sync ke Balance
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* View Details Dialog */}
            <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    {selectedItem && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-primary/10 p-2">
                                        <ClipboardList className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <DialogTitle>Detail Stock Opname</DialogTitle>
                                        <DialogDescription>
                                            {selectedItem.nomorOpname}
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="space-y-6">
                                {/* Sync Status Banner */}
                                <div className="flex justify-center">
                                    {getSyncStatusDisplay(selectedItem)}
                                </div>

                                {/* Header Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Warehouse className="h-4 w-4 text-blue-500" />
                                            <span className="font-medium">Gudang:</span>
                                        </div>
                                        <p>{selectedItem.warehouse?.name} ({selectedItem.warehouse?.code})</p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-green-500" />
                                            <span className="font-medium">Petugas:</span>
                                        </div>
                                        <p>{selectedItem.petugas?.name}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-orange-500" />
                                            <span className="font-medium">Tanggal Opname:</span>
                                        </div>
                                        <p>{formatDate(selectedItem.tanggalOpname, 'long')}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <ClipboardList className="h-4 w-4 text-purple-500" />
                                            <span className="font-medium">Status & Tipe:</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {getStatusBadge(selectedItem.status)}
                                            {getTypeBadge(selectedItem.type)}
                                        </div>
                                    </div>
                                </div>

                                {/* Keterangan */}
                                {selectedItem.keterangan && (
                                    <div className="bg-muted/50 p-4 rounded-lg">
                                        <h4 className="font-medium mb-2">Keterangan:</h4>
                                        <p className="text-sm">{selectedItem.keterangan}</p>
                                    </div>
                                )}

                                {/* Items Table */}
                                <div>
                                    <h4 className="font-medium mb-3">Daftar Items ({selectedItem.items?.length || 0})</h4>
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50">
                                                <tr>
                                                    <th className="p-3 text-left">Produk</th>
                                                    <th className="p-3 text-center">Stok Sistem</th>
                                                    <th className="p-3 text-center">Stok Fisik</th>
                                                    <th className="p-3 text-center">Selisih</th>
                                                    <th className="p-3 text-center">Nilai</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(selectedItem.items || []).map((item) => (
                                                    <tr key={item.id} className="border-t hover:bg-muted/30">
                                                        <td className="p-3">
                                                            <div>
                                                                <div className="font-medium">{item.product?.name}</div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {item.product?.code} • {item.product?.storageUnit}
                                                                </div>
                                                                {item.catatanItem && (
                                                                    <div className="text-xs text-blue-600 mt-1">
                                                                        {item.catatanItem}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            {formatNumber(item.stokSistem)}
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <span className="font-medium">
                                                                {formatNumber(item.stokFisik)}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                {getSelisihIcon(item.selisih)}
                                                                <span className={cn(
                                                                    "font-medium",
                                                                    item.selisih > 0 && "text-green-600",
                                                                    item.selisih < 0 && "text-red-600"
                                                                )}>
                                                                    {formatNumber(item.selisih)}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            {formatCurrency(item.totalNilai)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="bg-primary/5 p-4 rounded-lg border">
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Total Items</div>
                                            <div className="text-xl font-bold">
                                                {selectedItem.items?.length || 0}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Total Selisih</div>
                                            <div className={cn(
                                                "text-xl font-bold",
                                                calculateTotals(selectedItem.items).totalSelisih > 0 && "text-green-600",
                                                calculateTotals(selectedItem.items).totalSelisih < 0 && "text-red-600"
                                            )}>
                                                {formatNumber(calculateTotals(selectedItem.items).totalSelisih)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Total Nilai</div>
                                            <div className="text-xl font-bold">
                                                {formatCurrency(calculateTotals(selectedItem.items).totalNilai)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sync Button for Admins */}
                                {selectedItem.status === "COMPLETED" && session?.user?.role === "admin" && (
                                    <div className="flex justify-center pt-4">
                                        <Button
                                            onClick={() => handleSyncClick(selectedItem.id, selectedItem)}
                                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-6 shadow-lg"
                                        >
                                            <RefreshCw className="h-5 w-5 mr-2" />
                                            Sync ke Stock Balance
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Skeleton Loading Component
function LoadingSkeleton() {
    return (
        <div className="space-y-4">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Table Skeleton */}
            <div className="rounded-md border">
                <div className="p-4 border-b bg-muted/50">
                    <div className="flex justify-between">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Skeleton key={i} className="h-4 w-24" />
                        ))}
                    </div>
                </div>

                {Array.from({ length: 5 }).map((_, rowIndex) => (
                    <div key={rowIndex} className="p-4 border-b">
                        <div className="flex justify-between items-center">
                            {Array.from({ length: 8 }).map((_, colIndex) => (
                                <div key={colIndex} className="flex items-center">
                                    {colIndex === 0 ? (
                                        <Skeleton className="h-4 w-4 rounded-full" />
                                    ) : (
                                        <Skeleton className="h-4 w-32" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination Skeleton */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-48" />
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>
        </div>
    );
}