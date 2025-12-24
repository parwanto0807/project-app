import ViewDetailPO from "@/components/purchasing/ViewDetailPO";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { getPurchaseOrderById } from "@/lib/action/po/po";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home, Package, ShoppingCart, FileText, ChevronRight, Building, Calendar, DollarSign, CheckCircle, XCircleIcon, SendIcon, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { getUserFromToken } from "@/lib/auth";

export default async function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await getUserFromToken();
    const userRole = user?.role || "admin";

    try {
        const purchaseOrder = await getPurchaseOrderById(id);
        const statusColor = getStatusColor(purchaseOrder.status);

        return (
            <AdminLayout
                title={`Detail PO: ${purchaseOrder.poNumber}`}
                showBreadcrumb={false}
                role={userRole}
            >
                {/* Premium Breadcrumb dengan Gradient */}
                <div className="mb-8">
                    <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/30 rounded-xl p-6 border border-gray-100 shadow-sm">
                        {/* Breadcrumb Navigation */}
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink
                                        href="/admin-area"
                                        className="flex items-center gap-2 text-gray-600 hover:text-primary hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all duration-200 group"
                                    >
                                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-300">
                                            <Home className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <span className="font-medium">Dashboard</span>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator>
                                    <ChevronRight className="h-4 w-4 text-gray-400" />
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbLink
                                        href="/admin-area/logistic/purchasing"
                                        className="flex items-center gap-2 text-gray-600 hover:text-primary hover:bg-green-50 px-3 py-1.5 rounded-lg transition-all duration-200 group"
                                    >
                                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center group-hover:from-green-200 group-hover:to-green-300">
                                            <Package className="h-4 w-4 text-green-600" />
                                        </div>
                                        <span className="font-medium">Logistik</span>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator>
                                    <ChevronRight className="h-4 w-4 text-gray-400" />
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbLink
                                        href="/admin-area/logistic/purchasing"
                                        className="flex items-center gap-2 text-gray-600 hover:text-primary hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-all duration-200 group"
                                    >
                                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center group-hover:from-purple-200 group-hover:to-purple-300">
                                            <ShoppingCart className="h-4 w-4 text-purple-600" />
                                        </div>
                                        <span className="font-medium">Purchasing</span>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator>
                                    <ChevronRight className="h-4 w-4 text-gray-400" />
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
                                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                            <FileText className="h-4 w-4 text-white" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900">{purchaseOrder.poNumber}</span>
                                            <span className="text-xs text-muted-foreground">Purchase Order</span>
                                        </div>
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        {/* PO Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                            <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                        <Building className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Supplier</div>
                                        <div className="font-semibold truncate">{purchaseOrder.supplier?.name || 'Tidak ada'}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                                        <Calendar className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Tanggal Order</div>
                                        <div className="font-semibold">
                                            {new Date(purchaseOrder.orderDate).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                                        <DollarSign className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Total Nilai</div>
                                        <div className="font-bold text-primary">
                                            {new Intl.NumberFormat("id-ID", {
                                                style: "currency",
                                                currency: "IDR",
                                                minimumFractionDigits: 0,
                                            }).format(purchaseOrder.totalAmount)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 rounded-lg ${statusColor.bg} flex items-center justify-center`}>
                                            {getStatusIcon(purchaseOrder.status)}
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Status</div>
                                            <div className="font-semibold">{getStatusLabel(purchaseOrder.status)}</div>
                                        </div>
                                    </div>
                                    <Badge className={`${statusColor.badge} ${statusColor.text} border-0`}>
                                        {purchaseOrder.status.replace('_', ' ')}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="min-h-screen">
                    <ViewDetailPO poId={id} />
                </div>
            </AdminLayout>
        );
    } catch (error) {
        // Fallback implementation
        return (
            <AdminLayout
                title="Detail Purchase Order"
                showBreadcrumb={false}
                role={userRole}
            >
                <div className="mb-8">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/admin-area/dashboard" className="flex items-center gap-2">
                                    <Home className="h-4 w-4" />
                                    Dashboard
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator>
                                <ChevronRight className="h-4 w-4" />
                            </BreadcrumbSeparator>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/admin-area/logistic" className="flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    Logistik
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator>
                                <ChevronRight className="h-4 w-4" />
                            </BreadcrumbSeparator>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/admin-area/logistic/purchasing" className="flex items-center gap-2">
                                    <ShoppingCart className="h-4 w-4" />
                                    Purchasing
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator>
                                <ChevronRight className="h-4 w-4" />
                            </BreadcrumbSeparator>
                            <BreadcrumbItem>
                                <BreadcrumbPage className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Detail PO
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                <div className="min-h-screen">
                    <ViewDetailPO poId={id} />
                </div>
            </AdminLayout>
        );
    }
}

// Helper functions
function getStatusLabel(status: string): string {
    const statusConfig: Record<string, string> = {
        'DRAFT': 'Draft',
        'PENDING_APPROVAL': 'Menunggu Approval',
        'APPROVED': 'Disetujui',
        'REJECTED': 'Ditolak',
        'SENT': 'Terkirim',
        'PARTIALLY_RECEIVED': 'Diterima Sebagian',
        'FULLY_RECEIVED': 'Diterima Lengkap',
        'CANCELLED': 'Dibatalkan'
    };
    return statusConfig[status] || status;
}

function getStatusColor(status: string) {
    const colors: Record<string, { bg: string; text: string; badge: string }> = {
        'DRAFT': {
            bg: 'bg-gradient-to-br from-gray-100 to-gray-200',
            text: 'text-gray-700',
            badge: 'bg-gray-100'
        },
        'PENDING_APPROVAL': {
            bg: 'bg-gradient-to-br from-amber-100 to-amber-200',
            text: 'text-amber-700',
            badge: 'bg-amber-100'
        },
        'APPROVED': {
            bg: 'bg-gradient-to-br from-blue-100 to-blue-200',
            text: 'text-blue-700',
            badge: 'bg-blue-100'
        },
        'REJECTED': {
            bg: 'bg-gradient-to-br from-red-100 to-red-200',
            text: 'text-red-700',
            badge: 'bg-red-100'
        },
        'SENT': {
            bg: 'bg-gradient-to-br from-purple-100 to-purple-200',
            text: 'text-purple-700',
            badge: 'bg-purple-100'
        },
        'PARTIALLY_RECEIVED': {
            bg: 'bg-gradient-to-br from-orange-100 to-orange-200',
            text: 'text-orange-700',
            badge: 'bg-orange-100'
        },
        'FULLY_RECEIVED': {
            bg: 'bg-gradient-to-br from-emerald-100 to-emerald-200',
            text: 'text-emerald-700',
            badge: 'bg-emerald-100'
        },
        'CANCELLED': {
            bg: 'bg-gradient-to-br from-slate-100 to-slate-200',
            text: 'text-slate-700',
            badge: 'bg-slate-100'
        },
    };
    return colors[status] || colors['DRAFT'];
}

function getStatusIcon(status: string) {
    const icons: Record<string, any> = {
        'DRAFT': <FileText className="h-5 w-5 text-gray-600" />,
        'PENDING_APPROVAL': <Calendar className="h-5 w-5 text-amber-600" />,
        'APPROVED': <CheckCircle className="h-5 w-5 text-blue-600" />,
        'REJECTED': <XCircleIcon className="h-5 w-5 text-red-600" />,
        'SENT': <SendIcon className="h-5 w-5 text-purple-600" />,
        'PARTIALLY_RECEIVED': <Package className="h-5 w-5 text-orange-600" />,
        'FULLY_RECEIVED': <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
        'CANCELLED': <XCircleIcon className="h-5 w-5 text-slate-600" />,
    };

    return icons[status] || icons['DRAFT'];
}