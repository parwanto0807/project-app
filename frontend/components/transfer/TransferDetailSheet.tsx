"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import {
    Building2,
    MapPin,
    User,
    Calendar,
    Package,
    FileText,
    ArrowRightLeft,
    Hash
} from 'lucide-react';
import type { StockTransfer, TransferStatus } from '@/types/tfType';
import { cn } from '@/lib/utils';

interface TransferDetailSheetProps {
    transfer: StockTransfer | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<TransferStatus, { label: string; className: string }> = {
    DRAFT: { label: 'Draft', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100' },
    PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' },
    IN_TRANSIT: { label: 'In Transit', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' },
    RECEIVED: { label: 'Received', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' },
    CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' },
};

export function TransferDetailSheet({ transfer, open, onOpenChange }: TransferDetailSheetProps) {
    if (!transfer) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-2xl overflow-y-auto px-4">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-3">
                        <div className="rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 p-2 shadow-md">
                            <ArrowRightLeft className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <div className="text-xl font-bold">Transfer Details</div>
                            <div className="text-sm text-muted-foreground font-normal">
                                {transfer.transferNumber}
                            </div>
                        </div>
                    </SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {/* Status and Date */}
                    <div className="rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 border border-slate-200 dark:border-slate-700">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">Status</div>
                                <Badge className={cn(statusConfig[transfer.status].className)}>
                                    {statusConfig[transfer.status].label}
                                </Badge>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Transfer Date
                                </div>
                                <div className="font-medium">
                                    {format(new Date(transfer.transferDate), 'dd MMM yyyy, HH:mm')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Warehouse Information */}
                    <div>
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-indigo-600" />
                            Warehouse Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* From Warehouse */}
                            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
                                <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-blue-500" />
                                    From
                                </div>
                                <div className="font-semibold text-sm mb-1">
                                    {transfer.fromWarehouse?.code}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {transfer.fromWarehouse?.name}
                                </div>
                                {(transfer.fromWarehouse as any)?.address && (
                                    <div className="text-xs text-muted-foreground mt-2">
                                        {(transfer.fromWarehouse as any).address}
                                    </div>
                                )}
                            </div>

                            {/* To Warehouse */}
                            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
                                <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-purple-500" />
                                    To
                                </div>
                                <div className="font-semibold text-sm mb-1">
                                    {transfer.toWarehouse?.code}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {transfer.toWarehouse?.name}
                                </div>
                                {(transfer.toWarehouse as any)?.address && (
                                    <div className="text-xs text-muted-foreground mt-2">
                                        {(transfer.toWarehouse as any).address}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Personnel */}
                    <div>
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <User className="h-4 w-4 text-green-600" />
                            Personnel
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Sender */}
                            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
                                <div className="text-xs text-muted-foreground mb-2">Sender</div>
                                <div className="font-medium text-sm">
                                    {(transfer.sender as any)?.namaLengkap || '-'}
                                </div>
                                {(transfer.sender as any)?.nik && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                        NIK: {(transfer.sender as any).nik}
                                    </div>
                                )}
                            </div>

                            {/* Receiver */}
                            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
                                <div className="text-xs text-muted-foreground mb-2">Receiver</div>
                                <div className="font-medium text-sm">
                                    {(transfer.receiver as any)?.namaLengkap || '-'}
                                </div>
                                {(transfer.receiver as any)?.nik && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                        NIK: {(transfer.receiver as any).nik}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Transfer Items */}
                    <div>
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Package className="h-4 w-4 text-pink-600" />
                            Transfer Items ({transfer.items?.length || 0})
                        </h3>
                        <div className="space-y-2">
                            {transfer.items?.map((item, index) => (
                                <div
                                    key={item.id}
                                    className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Hash className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground">
                                                    Item {index + 1}
                                                </span>
                                            </div>
                                            <div className="font-medium text-sm mb-1">
                                                {item.product?.code} - {item.product?.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Category: {(item.product as any)?.category || '-'}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-indigo-600">
                                                {item.quantity}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {item.unit}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    {transfer.notes && (
                        <div>
                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-amber-600" />
                                Notes
                            </h3>
                            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900">
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {transfer.notes}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
