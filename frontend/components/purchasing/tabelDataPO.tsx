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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Eye,
    FileText,
    Send,
    Package,
    CheckCircle,
    XCircle,
    Clock,
    FileEdit,
    Truck,
    Building,
    Calendar,
    DollarSign,
    Folder,
    User
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { PurchaseOrder } from "@/types/poType";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";


interface PurchaseOrderTableProps {
    purchaseOrders: PurchaseOrder[];
    isLoading: boolean;
    role: string;
    highlightId?: string | null;
    onRefresh?: () => void;
}

// Enhanced status configuration with icons
const statusConfig = {
    DRAFT: {
        label: "Draft",
        className: "bg-gray-100 text-gray-800 border-gray-300",
        icon: FileEdit,
        iconColor: "text-gray-600"
    },
    PENDING_APPROVAL: {
        label: "Menunggu",
        className: "bg-amber-50 text-amber-800 border-amber-300",
        icon: Clock,
        iconColor: "text-amber-600"
    },
    APPROVED: {
        label: "Disetujui",
        className: "bg-blue-50 text-blue-800 border-blue-300",
        icon: CheckCircle,
        iconColor: "text-blue-600"
    },
    REJECTED: {
        label: "Ditolak",
        className: "bg-red-50 text-red-800 border-red-300",
        icon: XCircle,
        iconColor: "text-red-600"
    },
    SENT: {
        label: "Terkirim",
        className: "bg-purple-50 text-purple-800 border-purple-300",
        icon: Send,
        iconColor: "text-purple-600"
    },
    PARTIALLY_RECEIVED: {
        label: "Parsial",
        className: "bg-orange-50 text-orange-800 border-orange-300",
        icon: Package,
        iconColor: "text-orange-600"
    },
    FULLY_RECEIVED: {
        label: "Selesai",
        className: "bg-emerald-50 text-emerald-800 border-emerald-300",
        icon: CheckCircle,
        iconColor: "text-emerald-600"
    },
    CANCELLED: {
        label: "Dibatalkan",
        className: "bg-slate-100 text-slate-800 border-slate-300",
        icon: XCircle,
        iconColor: "text-slate-600"
    },
};

const currencyFormatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

// Skeleton Loading Component
const TableSkeleton = () => {
    return (
        <>
            {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index} className="animate-pulse">
                    <TableCell>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </TableCell>
                    <TableCell>
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                        <div className="h-4 bg-gray-200 rounded w-28"></div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </TableCell>
                    <TableCell>
                        <div className="h-4 bg-gray-200 rounded w-28 ml-auto"></div>
                    </TableCell>
                    <TableCell>
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </TableCell>
                    <TableCell>
                        <div className="flex justify-end gap-2">
                            <div className="h-8 w-8 bg-gray-200 rounded"></div>
                            <div className="h-8 w-8 bg-gray-200 rounded"></div>
                            <div className="h-8 w-8 bg-gray-200 rounded"></div>
                        </div>
                    </TableCell>
                </TableRow>
            ))}
        </>
    );
};

// Mobile Card View Component
const MobilePOCard = ({ po, onView }: {
    po: PurchaseOrder;
    onView: (id: string) => void;
}) => {
    const StatusIcon = statusConfig[po.status as keyof typeof statusConfig]?.icon || Clock;

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm mb-3">
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div>
                    <Link
                        href={`/admin-area/logistic/purchasing/${po.id}`}
                        className="hover:underline inline-block"
                    >
                        <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200 font-semibold text-base"
                        >
                            {po.poNumber}
                        </Badge>
                    </Link>
                    {po.PurchaseRequest?.nomorPr && (
                        <div className="flex items-center gap-1.5 mt-2">
                            <span className="text-xs text-muted-foreground">dari</span>
                            <Badge
                                variant="outline"
                                className="bg-purple-50 text-purple-700 border-purple-200 text-xs"
                            >
                                {po.PurchaseRequest.nomorPr}
                            </Badge>
                        </div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                        <StatusIcon className={cn("h-4 w-4", statusConfig[po.status as keyof typeof statusConfig]?.iconColor)} />
                        <Badge
                            variant="outline"
                            className={cn(
                                statusConfig[po.status as keyof typeof statusConfig]?.className,
                                "font-medium text-xs"
                            )}
                        >
                            {statusConfig[po.status as keyof typeof statusConfig]?.label || po.status}
                        </Badge>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onView(po.id)}
                >
                    <Eye className="h-4 w-4 text-blue-600" />
                </Button>
            </div>

            {/* Details */}
            <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Supplier:</span>
                    <span className="truncate">{po.supplier?.name || "N/A"}</span>
                </div>

                <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Gudang:</span>
                    <span className="truncate">{po.warehouse?.name || "N/A"}</span>
                </div>

                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Tanggal:</span>
                    <span>{format(new Date(po.orderDate), "dd MMM yyyy", { locale: id })}</span>
                </div>

                {po.expectedDeliveryDate && (
                    <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Pengiriman:</span>
                        <span>{format(new Date(po.expectedDeliveryDate), "dd MMM yyyy", { locale: id })}</span>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Items:</span>
                    <span>{po.lines?.length || 0} item</span>
                </div>

                <div className="flex items-center gap-2">
                    {/* <DollarSign className="h-4 w-4 text-gray-400" /> */}
                    <span className="font-medium">Total:</span>
                    <span className="font-semibold ml-auto">
                        {currencyFormatter.format(po.totalAmount)}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="font-medium">Payment:</span>
                    <Badge variant="outline" className="text-xs">
                        {po.paymentTerm?.replace(/_/g, ' ') || 'N/A'}
                    </Badge>
                </div>

                {po.project?.name && (
                    <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Proyek:</span>
                        <span className="truncate">{po.project.name}</span>
                    </div>
                )}
            </div>

            {/* Action Buttons (Visible on Mobile) */}
            <div className="mt-4 pt-3 border-t">
                <Button
                    variant="default"
                    size="sm"
                    onClick={() => onView(po.id)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 border-0"
                >
                    <Eye className="mr-2 h-4 w-4" />
                    View Detail
                </Button>
            </div>
        </div>
    );
};

export default function PurchaseOrderTable({
    purchaseOrders,
    isLoading,
    role,
    highlightId,
    onRefresh,
}: PurchaseOrderTableProps) {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

    const handleView = (id: string) => {
        router.push(`/admin-area/logistic/purchasing/${id}`);
    };

    // Toggle view mode on mobile
    const toggleViewMode = () => {
        setViewMode(prev => prev === 'table' ? 'card' : 'table');
    };

    if (isLoading && purchaseOrders.length === 0) {
        return (
            <div className="p-8 text-center">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                <p className="mt-3 text-sm text-muted-foreground">Memuat purchase orders...</p>
            </div>
        );
    }

    return (
        <>
            {/* View Toggle for Mobile */}
            <div className="flex justify-between items-center mb-4 md:hidden">
                <h3 className="text-lg font-semibold">Purchase Orders</h3>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleViewMode}
                    className="gap-2"
                >
                    {viewMode === 'table' ? (
                        <>
                            <div className="grid grid-cols-2 gap-1 h-3.5 w-3.5">
                                <div className="bg-current rounded-sm"></div>
                                <div className="bg-current rounded-sm"></div>
                                <div className="bg-current rounded-sm"></div>
                                <div className="bg-current rounded-sm"></div>
                            </div>
                            Cards
                        </>
                    ) : (
                        <>
                            <div className="flex flex-col gap-0.5 h-3.5 w-3.5">
                                <div className="bg-current h-0.5 w-full"></div>
                                <div className="bg-current h-0.5 w-full"></div>
                                <div className="bg-current h-0.5 w-full"></div>
                            </div>
                            Table
                        </>
                    )}
                </Button>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                                <div className="space-y-2">
                                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                                    <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : viewMode === 'card' ? (
                    <div className="space-y-3">
                        {purchaseOrders.map((po) => (
                            <MobilePOCard
                                po={po}
                                onView={handleView}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>PO Number</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchaseOrders.map((po) => {
                                    const StatusIcon = statusConfig[po.status as keyof typeof statusConfig]?.icon || Clock;
                                    return (
                                        <TableRow
                                            key={po.id}
                                            className={cn(
                                                highlightId === po.id && "bg-blue-50",
                                                "hover:bg-muted/50"
                                            )}
                                        >
                                            <TableCell className="font-medium">
                                                <Link
                                                    href={`/admin-area/logistic/purchasing/${po.id}`}
                                                    className="text-primary hover:underline"
                                                >
                                                    {po.poNumber}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <StatusIcon className={cn("h-4 w-4", statusConfig[po.status as keyof typeof statusConfig]?.iconColor)} />
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            statusConfig[po.status as keyof typeof statusConfig]?.className,
                                                            "font-medium text-xs"
                                                        )}
                                                    >
                                                        {statusConfig[po.status as keyof typeof statusConfig]?.label || po.status}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-blue-50 text-blue-600"
                                                    onClick={() => handleView(po.id)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[120px]">PO Number</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead className="hidden lg:table-cell">Warehouse</TableHead>
                            <TableHead className="hidden xl:table-cell">Order Date</TableHead>
                            <TableHead className="hidden 2xl:table-cell">Delivery Date</TableHead>
                            <TableHead className="hidden xl:table-cell">Payment Term</TableHead>
                            <TableHead className="text-center">Items</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="hidden lg:table-cell">Project</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableSkeleton />
                        ) : purchaseOrders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8">
                                    <div className="flex flex-col items-center justify-center text-gray-500">
                                        <FileText className="h-12 w-12 mb-3 opacity-20" />
                                        <p className="text-lg font-medium">No Purchase Orders</p>
                                        <p className="text-sm">Create your first purchase order to get started</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            purchaseOrders.map((po) => {
                                const StatusIcon = statusConfig[po.status as keyof typeof statusConfig]?.icon || Clock;
                                return (
                                    <TableRow
                                        key={po.id}
                                        className={cn(
                                            highlightId === po.id && "bg-blue-50 dark:bg-blue-950/20",
                                            "hover:bg-muted/50 transition-colors"
                                        )}
                                    >
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col gap-2">
                                                <Link
                                                    href={`/admin-area/logistic/purchasing/${po.id}`}
                                                    className="hover:underline group flex items-center gap-2"
                                                >
                                                    <FileText className="h-4 w-4 text-primary/70 group-hover:text-primary flex-shrink-0" />
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 font-semibold"
                                                    >
                                                        {po.poNumber}
                                                    </Badge>
                                                </Link>
                                                {po.PurchaseRequest?.nomorPr && (
                                                    <div className="flex items-center gap-2 ml-6">
                                                        {/* <span className="text-xs text-muted-foreground"></span> */}
                                                        <Badge
                                                            variant="outline"
                                                            className="bg-purple-50 text-purple-700 border-purple-200 text-xs"
                                                        >
                                                            {po.PurchaseRequest.nomorPr}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-wrap max-w-[250px] flex items-center gap-2">
                                                <User className="h-4 w-4 text-gray-400" />
                                                {po.supplier?.name || "N/A"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            <div className="truncate max-w-[150px] flex items-center gap-2">
                                                <Building className="h-4 w-4 text-gray-400" />
                                                {po.warehouse?.name || "N/A"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden xl:table-cell">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                {format(new Date(po.orderDate), "dd MMM yyyy", { locale: id })}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden 2xl:table-cell">
                                            {po.expectedDeliveryDate ? (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Truck className="h-4 w-4 text-gray-400" />
                                                    {format(new Date(po.expectedDeliveryDate), "dd MMM yyyy", { locale: id })}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="hidden xl:table-cell">
                                            <Badge variant="outline" className="text-xs">
                                                {po.paymentTerm?.replace(/_/g, ' ') || 'N/A'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Package className="h-3.5 w-3.5 text-gray-400" />
                                                <span className="font-medium">{po.lines?.length || 0}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">
                                            <div className="flex items-center justify-end gap-2">
                                                <DollarSign className="h-4 w-4 text-gray-400" />
                                                {currencyFormatter.format(po.totalAmount)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    statusConfig[po.status as keyof typeof statusConfig]?.className,
                                                    "font-medium text-xs flex items-center gap-1.5 px-3 py-1.5"
                                                )}
                                            >
                                                <StatusIcon className={cn("h-3.5 w-3.5", statusConfig[po.status as keyof typeof statusConfig]?.iconColor)} />
                                                {statusConfig[po.status as keyof typeof statusConfig]?.label || po.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            <div className="max-w-[2000px] flex items-center gap-2 text-wrap">
                                                <Folder className="h-4 w-4 text-gray-400" />
                                                {po.project?.name || "-"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="default"
                                                size="sm"
                                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 border-0"
                                                onClick={() => handleView(po.id)}
                                            >
                                                <Eye className="mr-2 h-4 w-4" />
                                                View Detail
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            }))}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}