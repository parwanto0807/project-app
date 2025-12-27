"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Eye,
    Loader2,
    Search,
    Filter,
    Download,
    Calendar,
    Truck,
    Warehouse,
    Package,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    Clock,
    FileText,
    XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import type { StockTransfer, TransferStatus } from '@/types/tfType';
import { cn } from '@/lib/utils';
import { TransferDetailSheet } from './TransferDetailSheet';
import { useCreateTransferGR } from '@/hooks/use-tf';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import StockTransferPickListPdfDocument from './transferPdf';

const BlobProvider = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.BlobProvider),
    {
        ssr: false,
        loading: () => <Button variant="ghost" size="icon" disabled><Loader2 className="h-4 w-4 animate-spin" /></Button>,
    }
);

interface TransferTableProps {
    data: StockTransfer[];
    isLoading?: boolean;
}

const statusConfig: Record<TransferStatus, {
    label: string;
    className: string;
    icon: React.ReactNode;
    color: string;
}> = {
    DRAFT: {
        label: 'Draft',
        className: 'bg-gray-50/80 text-gray-700 border-gray-200',
        icon: <FileText className="h-3 w-3" />,
        color: 'text-gray-600'
    },
    PENDING: {
        label: 'Pending',
        className: 'bg-amber-50/80 text-amber-700 border-amber-200',
        icon: <Clock className="h-3 w-3" />,
        color: 'text-amber-600'
    },
    IN_TRANSIT: {
        label: 'In Transit',
        className: 'bg-blue-50/80 text-blue-700 border-blue-200',
        icon: <Truck className="h-3 w-3" />,
        color: 'text-blue-600'
    },
    RECEIVED: {
        label: 'Received',
        className: 'bg-emerald-50/80 text-emerald-700 border-emerald-200',
        icon: <CheckCircle2 className="h-3 w-3" />,
        color: 'text-emerald-600'
    },
    CANCELLED: {
        label: 'Cancelled',
        className: 'bg-rose-50/80 text-rose-700 border-rose-200',
        icon: <XCircle className="h-3 w-3" />,
        color: 'text-rose-600'
    },
};

export function TransferTable({ data, isLoading }: TransferTableProps) {
    const router = useRouter();
    const createGR = useCreateTransferGR();
    const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>('all');

    const handleViewDetails = (transfer: StockTransfer) => {
        setSelectedTransfer(transfer);
        setSheetOpen(true);
    };

    const filteredData = data.filter(transfer => {
        const matchesSearch =
            transfer.transferNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            transfer.fromWarehouse?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            transfer.toWarehouse?.name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const SkeletonRow = () => (
        <TableRow>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-6 w-24" /></TableCell>
            <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
        </TableRow>
    );

    if (isLoading) {
        return (
            <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-9 w-32" />
                    </div>
                    <div className="flex items-center gap-3 pt-3">
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Card dengan Filter */}
            <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Package className="h-5 w-5 text-blue-600" />
                                Stock Transfers
                            </CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                                {filteredData.length} transfers found
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="gap-2">
                                <Download className="h-4 w-4" />
                                Export
                            </Button>
                        </div>
                    </div>

                    {/* Filter Controls */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search transfers, warehouse..."
                                className="pl-9 border-gray-300 focus:border-blue-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-48 border-gray-300">
                                <Filter className="h-4 w-4 mr-2 text-gray-400" />
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                {Object.entries(statusConfig).map(([key, config]) => (
                                    <SelectItem key={key} value={key}>
                                        <div className="flex items-center gap-2">
                                            <span className={config.color}>
                                                {config.icon}
                                            </span>
                                            {config.label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={dateFilter} onValueChange={setDateFilter}>
                            <SelectTrigger className="w-full sm:w-48 border-gray-300">
                                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                <SelectValue placeholder="Date Range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Dates</SelectItem>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="week">This Week</SelectItem>
                                <SelectItem value="month">This Month</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
            </Card>

            {/* Quick Stats Tabs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(statusConfig).map(([status, config]) => {
                    const count = filteredData.filter(t => t.status === status).length;
                    return (
                        <Card key={status} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">{count}</p>
                                        <p className="text-sm text-gray-500 mt-1">{config.label}</p>
                                    </div>
                                    <div className={cn("p-2 rounded-lg", config.className)}>
                                        <div className={config.color}>
                                            {config.icon}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Main Table Card */}
            <Card className="border border-gray-200 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                    <TableHead className="font-semibold text-gray-700">Transfer #</TableHead>
                                    <TableHead className="font-semibold text-gray-700">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3.5 w-3.5" />
                                            Date
                                        </div>
                                    </TableHead>
                                    <TableHead className="font-semibold text-gray-700">
                                        <div className="flex items-center gap-1">
                                            <Warehouse className="h-3.5 w-3.5" />
                                            From
                                        </div>
                                    </TableHead>
                                    <TableHead className="font-semibold text-gray-700">
                                        <div className="flex items-center gap-1">
                                            <Warehouse className="h-3.5 w-3.5" />
                                            To
                                        </div>
                                    </TableHead>
                                    <TableHead className="font-semibold text-gray-700">
                                        <div className="flex items-center gap-1">
                                            <Package className="h-3.5 w-3.5" />
                                            Items
                                        </div>
                                    </TableHead>
                                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                                    <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7}>
                                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                                <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
                                                <p className="text-gray-500 font-medium">No transfers found</p>
                                                <p className="text-gray-400 text-sm mt-1">
                                                    Try adjusting your search or filter criteria
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredData.map((transfer) => (
                                        <TableRow
                                            key={transfer.id}
                                            className="hover:bg-gray-50/80 border-b border-gray-100 last:border-0 group cursor-pointer transition-colors"
                                            onClick={() => handleViewDetails(transfer)}
                                        >
                                            <TableCell className="font-medium text-gray-900">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-blue-50 rounded-md">
                                                        <Package className="h-3.5 w-3.5 text-blue-600" />
                                                    </div>
                                                    <span className="font-semibold">{transfer.transferNumber}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                    {format(new Date(transfer.transferDate), 'dd MMM yyyy')}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Warehouse className="h-3.5 w-3.5 text-gray-400" />
                                                    {transfer.fromWarehouse?.name || '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Warehouse className="h-3.5 w-3.5 text-gray-400" />
                                                    {transfer.toWarehouse?.name || '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="bg-gray-50">
                                                        {transfer.items?.length || 0} items
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "font-medium border px-3 py-1",
                                                        statusConfig[transfer.status].className
                                                    )}
                                                >
                                                    <div className="flex items-center gap-1.5">
                                                        {statusConfig[transfer.status].icon}
                                                        {statusConfig[transfer.status].label}
                                                    </div>
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2 transition-opacity">
                                                    {/* Print Button */}
                                                    {/* Create GR Button */}
                                                    {!transfer.goodsReceiptId && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700 hover:border-emerald-300 transition-colors"
                                                            disabled={createGR.isPending}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (confirm('Buat Goods Receipt (Draft) otomatis untuk transfer ini?')) {
                                                                    createGR.mutate(transfer.id);
                                                                }
                                                            }}
                                                        >
                                                            {createGR.isPending ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Package className="h-4 w-4 mr-1" />
                                                            )}
                                                            Create GR
                                                        </Button>
                                                    )}

                                                    {/* Print Button */}
                                                    {/* Print Button - Hidden if IN_TRANSIT or RECEIVED */}
                                                    {!['IN_TRANSIT', 'RECEIVED'].includes(transfer.status) && (
                                                        <BlobProvider document={<StockTransferPickListPdfDocument transfer={transfer} />}>
                                                            {({ url, loading }: any) => (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 hover:text-orange-700 hover:border-orange-300 transition-colors"
                                                                    disabled={loading}
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
                                                                        <Download className="h-4 w-4 mr-1" />
                                                                    )}
                                                                    Print
                                                                </Button>
                                                            )}
                                                        </BlobProvider>
                                                    )}

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewDetails(transfer);
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        View
                                                        <ChevronRight className="h-3 w-3 ml-1" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Transfer Detail Sheet */}
            <TransferDetailSheet
                transfer={selectedTransfer}
                open={sheetOpen}
                onOpenChange={setSheetOpen}
            />
        </div>
    );
}