"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, Plus, Eye, Loader2, Package, ArrowRight, User, FileText } from 'lucide-react';
import { AdminLayout } from '@/components/admin-panel/admin-layout';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useTransfers } from '@/hooks/use-tf';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

export default function InternalTransferPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const search = searchParams.get('search') || '';
    const [page, setPage] = useState(1);
    const [localSearch, setLocalSearch] = useState(search);
    const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const limit = 10;
    
    const { data: transfersData, isLoading } = useTransfers({ page: 1, limit: 1000, search: '' }); // Fetch all for client-side filtering

    // Filter only direct transfers (DT- prefix) AND apply search filter
    const allTransfers = transfersData?.success && Array.isArray(transfersData.data) ? transfersData.data : [];
    const directTransfers = allTransfers.filter((t: any) => {
        // Must be DT-* prefix
        if (!t.transferNumber?.startsWith('DT-')) return false;

        // If no search query, include all DT-* transfers
        if (!localSearch) return true;

        // Search in transfer number
        if (t.transferNumber?.toLowerCase().includes(localSearch.toLowerCase())) return true;

        // Search in notes
        if (t.notes?.toLowerCase().includes(localSearch.toLowerCase())) return true;

        // Search in warehouse names
        if (t.fromWarehouse?.name?.toLowerCase().includes(localSearch.toLowerCase())) return true;
        if (t.toWarehouse?.name?.toLowerCase().includes(localSearch.toLowerCase())) return true;

        // Search in sender name
        if (t.sender?.namaLengkap?.toLowerCase().includes(localSearch.toLowerCase())) return true;

        // Search in items (product code, product name)
        if (t.items && Array.isArray(t.items)) {
            const hasMatchingItem = t.items.some((item: any) => 
                item.product?.code?.toLowerCase().includes(localSearch.toLowerCase()) ||
                item.product?.name?.toLowerCase().includes(localSearch.toLowerCase())
            );
            if (hasMatchingItem) return true;
        }

        return false;
    });

    // Apply pagination client-side
    const paginatedTransfers = directTransfers.slice((page - 1) * limit, page * limit);
    const totalPages = Math.ceil(directTransfers.length / limit);

    const handleCreateTransfer = () => {
        router.push('/admin-area/inventory/internal-transfer/create');
    };

    const handleViewDetail = (transfer: any) => {
        setSelectedTransfer(transfer);
        setSheetOpen(true);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        router.push(`/admin-area/inventory/internal-transfer?search=${localSearch}`);
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: id });
        } catch {
            return dateString;
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value);
    };

    return (
        <AdminLayout title="Internal Transfer" role="admin">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/admin-area/inventory">Inventory</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Internal Transfer</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex-1 min-h-0 overflow-auto">
                <div className="space-y-4 p-2 pt-1 md:p-4">
                    {/* Header */}
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 shadow-lg">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="rounded-lg bg-white/10 p-3">
                                    <ArrowRightLeft className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">
                                        Internal Transfer
                                    </h1>
                                    <p className="text-white/80 mt-1">
                                        Simple transfer: Bengkel/Kantor → WIP Project
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={handleCreateTransfer}
                                className="bg-white text-emerald-600 hover:bg-white/90"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                New Transfer
                            </Button>
                        </div>
                    </div>

                    {/* Info Card */}
                    <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                                <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/50 p-2">
                                    <ArrowRightLeft className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-1">
                                        Quick Internal Transfer
                                    </h3>
                                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                        Transfer stock langsung dari Bengkel/Kantor ke WIP Project tanpa proses MR/GR. 
                                        Stock otomatis terupdate di kedua gudang.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Table */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Transfer History</CardTitle>
                                    {localSearch && (
                                        <p className="text-sm text-slate-500 mt-1">
                                            Found {directTransfers.length} transfer(s) matching "{localSearch}"
                                        </p>
                                    )}
                                </div>
                                <form onSubmit={handleSearch} className="flex gap-2">
                                    <Input
                                        placeholder="Cari: transfer no, product, gudang..."
                                        value={localSearch}
                                        onChange={(e) => setLocalSearch(e.target.value)}
                                        className="w-72"
                                    />
                                    <Button type="submit" size="sm">Cari</Button>
                                    {localSearch && (
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => {
                                                setLocalSearch('');
                                                setPage(1);
                                            }}
                                        >
                                            Clear
                                        </Button>
                                    )}
                                </form>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                                    <span className="ml-3 text-slate-600">Loading...</span>
                                </div>
                            ) : directTransfers.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <ArrowRightLeft className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p className="text-lg font-medium">Belum ada internal transfer</p>
                                    <p className="text-sm mt-1">Klik "New Transfer" untuk membuat transfer pertama</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                                            <tr>
                                                <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Transfer Number</th>
                                                <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Tanggal</th>
                                                <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Dari</th>
                                                <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Ke</th>
                                                <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Catatan</th>
                                                <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Items</th>
                                                <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                                                <th className="text-center py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedTransfers.map((transfer: any) => (
                                                <tr key={transfer.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                                    <td className="py-3 px-4">
                                                        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                                            {transfer.transferNumber}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                                                        {formatDate(transfer.createdAt)}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="text-sm font-medium">{transfer.fromWarehouse?.name || '-'}</div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="text-sm font-medium">{transfer.toWarehouse?.name || '-'}</div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {transfer.notes ? (
                                                            <div className="max-w-xs">
                                                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2" title={transfer.notes}>
                                                                    {transfer.notes}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-slate-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <Badge variant="secondary">
                                                            {transfer.items?.length || 0} item(s)
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                                                            {transfer.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                                                            <SheetTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleViewDetail(transfer)}
                                                                    className="text-emerald-600 hover:text-emerald-700"
                                                                >
                                                                    <Eye className="h-4 w-4 mr-1" />
                                                                    View
                                                                </Button>
                                                            </SheetTrigger>
                                                        </Sheet>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, directTransfers.length)} of {directTransfers.length} transfers
                                            </p>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                                    disabled={page === 1}
                                                >
                                                    Previous
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                                    disabled={page === totalPages}
                                                >
                                                    Next
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Detail Sheet */}
            {selectedTransfer && (
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
                        <SheetHeader>
                            <SheetTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-emerald-600" />
                                Transfer Detail
                            </SheetTitle>
                            <SheetDescription>
                                Detail informasi internal transfer
                            </SheetDescription>
                        </SheetHeader>

                        <div className="mt-6 space-y-6">
                            {/* Transfer Info */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                    Informasi Transfer
                                </h3>
                                <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Transfer Number</p>
                                        <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                            {selectedTransfer.transferNumber}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Status</p>
                                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                                            {selectedTransfer.status}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Tanggal Dibuat</p>
                                        <p className="font-medium text-sm">{formatDate(selectedTransfer.createdAt)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Pengirim</p>
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-slate-400" />
                                            <p className="font-medium text-sm">{selectedTransfer.sender?.namaLengkap || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Warehouse Info */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                    Perpindahan Gudang
                                </h3>
                                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/30 dark:to-emerald-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <div className="flex-1 text-center">
                                        <Package className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                                        <p className="text-xs text-slate-500 mb-1">Dari</p>
                                        <p className="font-semibold text-sm">{selectedTransfer.fromWarehouse?.name || '-'}</p>
                                    </div>
                                    <ArrowRight className="h-6 w-6 text-emerald-600 flex-shrink-0" />
                                    <div className="flex-1 text-center">
                                        <Package className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
                                        <p className="text-xs text-slate-500 mb-1">Ke</p>
                                        <p className="font-semibold text-sm">{selectedTransfer.toWarehouse?.name || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Notes */}
                            {selectedTransfer.notes && (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                        Catatan
                                    </h3>
                                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                        <p className="text-sm text-slate-700 dark:text-slate-300">
                                            {selectedTransfer.notes}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <Separator />

                            {/* Items */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                    Item Transfer ({selectedTransfer.items?.length || 0})
                                </h3>
                                <div className="space-y-2">
                                    {selectedTransfer.items?.map((item: any, index: number) => (
                                        <div key={item.id || index} className="p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                            {item.product?.code || '-'}
                                                        </span>
                                                        <span className="text-slate-400">|</span>
                                                        <span className="font-medium text-sm">{item.product?.name || '-'}</span>
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className="text-xs">
                                                    #{index + 1}
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-xs">
                                                <div>
                                                    <span className="text-slate-500">Quantity:</span>
                                                    <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                                                        {item.quantity} {item.unit}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Harga/Unit:</span>
                                                    <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                                                        {formatCurrency(item.cogs || item.pricePerUnit || 0)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Total:</span>
                                                    <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                                        {formatCurrency((item.quantity || 0) * (item.cogs || item.pricePerUnit || 0))}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Separator />

                            {/* Summary */}
                            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Total Items:
                                    </span>
                                    <span className="font-bold text-lg">
                                        {selectedTransfer.items?.length || 0} item(s)
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Total Value:
                                    </span>
                                    <span className="font-bold text-xl text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(
                                            selectedTransfer.items?.reduce((sum: number, item: any) => 
                                                sum + ((item.quantity || 0) * (item.cogs || item.pricePerUnit || 0)), 0
                                            ) || 0
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            )}
        </AdminLayout>
    );
}
