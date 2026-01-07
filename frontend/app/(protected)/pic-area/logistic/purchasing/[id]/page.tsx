import ViewDetailPO from "@/components/purchasing/ViewDetailPO";
import { PicLayout } from "@/components/admin-panel/pic-layout";
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
    const userRole = user?.role || "pic";

    try {
        const purchaseOrder = await getPurchaseOrderById(id);
        const statusColor = getStatusColor(purchaseOrder.status);

        return (
            <PicLayout
                title={`Detail PO: ${purchaseOrder.poNumber}`}
                showBreadcrumb={false}
                role="pic"
            >
                <div className="h-full overflow-y-auto p-4 md:p-6 space-y-8">
                    {/* Premium Breadcrumb dengan Gradient */}
                    <div>
                        <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/30 dark:from-gray-900 dark:to-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                            {/* Breadcrumb Navigation */}
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem>
                                        <BreadcrumbLink
                                            href="/pic-area"
                                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-foreground hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-1.5 rounded-lg transition-all duration-200 group"
                                        >
                                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-300">
                                                <Home className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <span className="font-medium">Dashboard</span>
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator>
                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                    </BreadcrumbSeparator>
                                    <BreadcrumbItem>
                                        <BreadcrumbLink
                                            href="/pic-area/logistic/purchasing"
                                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-foreground hover:bg-green-50 dark:hover:bg-green-900/30 px-3 py-1.5 rounded-lg transition-all duration-200 group"
                                        >
                                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 flex items-center justify-center group-hover:from-green-200 group-hover:to-green-300">
                                                <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <span className="font-medium">Logistik</span>
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator>
                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                    </BreadcrumbSeparator>
                                    <BreadcrumbItem>
                                        <BreadcrumbLink
                                            href="/pic-area/logistic/purchasing"
                                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-foreground hover:bg-purple-50 dark:hover:bg-purple-900/30 px-3 py-1.5 rounded-lg transition-all duration-200 group"
                                        >
                                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 flex items-center justify-center group-hover:from-purple-200 group-hover:to-purple-300">
                                                <ShoppingCart className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <span className="font-medium">Purchasing</span>
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator>
                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                    </BreadcrumbSeparator>
                                    <BreadcrumbItem>
                                        <BreadcrumbPage className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 border border-blue-100 dark:border-gray-700">
                                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                                <FileText className="h-4 w-4 text-white" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900 dark:text-gray-100">{purchaseOrder.poNumber}</span>
                                                <span className="text-xs text-muted-foreground">Purchase Order</span>
                                            </div>
                                        </BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>

                            {/* PO Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center">
                                            <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Supplier</div>
                                            <div className="font-semibold truncate dark:text-gray-200">{purchaseOrder.supplier?.name || 'Tidak ada'}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 flex items-center justify-center">
                                            <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Tanggal Order</div>
                                            <div className="font-semibold dark:text-gray-200">
                                                {new Date(purchaseOrder.orderDate).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800 flex items-center justify-center">
                                            <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Total Nilai</div>
                                            <div className="font-bold text-primary dark:text-blue-400">
                                                {new Intl.NumberFormat("id-ID", {
                                                    style: "currency",
                                                    currency: "IDR",
                                                    minimumFractionDigits: 0,
                                                }).format(purchaseOrder.totalAmount)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-10 w-10 rounded-lg ${statusColor.bg} flex items-center justify-center shadow-sm`}>
                                                {getStatusIcon(purchaseOrder.status)}
                                            </div>
                                            <div>
                                                <div className="text-sm text-muted-foreground">Status</div>
                                                <div className="font-semibold dark:text-gray-200">{getStatusLabel(purchaseOrder.status)}</div>
                                            </div>
                                        </div>
                                        <Badge className={`${statusColor.badge} ${statusColor.text} border-0 shadow-sm`}>
                                            {purchaseOrder.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pb-10">
                        <ViewDetailPO poId={id} userRole={userRole} />
                    </div>
                </div>
            </PicLayout>
        );
    } catch (error) {
        console.error("Error fetching purchase order:", error);
        return (
            <PicLayout
                title="Purchase Order Tidak Ditemukan"
                showBreadcrumb={false}
                role="pic"
            >
                <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                    <div className="h-20 w-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                        <Package className="h-10 w-10 text-gray-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Purchase Order Tidak Ditemukan</h2>
                    <p className="text-muted-foreground max-w-md mb-8">
                        Data Purchase Order yang Anda cari tidak ditemukan. Kemungkinan data telah dihapus atau ID tidak valid.
                    </p>
                    <a
                        href="/pic-area/logistic/purchasing"
                        className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-blue-900/40"
                    >
                        <ChevronRight className="h-5 w-5 mr-2 rotate-180" />
                        Kembali ke Daftar PO
                    </a>
                </div>
            </PicLayout>
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
            bg: 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700',
            text: 'text-gray-700 dark:text-gray-300',
            badge: 'bg-gray-100 dark:bg-gray-800'
        },
        'PENDING_APPROVAL': {
            bg: 'bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800',
            text: 'text-amber-700 dark:text-amber-400',
            badge: 'bg-amber-100 dark:bg-amber-900/50'
        },
        'APPROVED': {
            bg: 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800',
            text: 'text-blue-700 dark:text-blue-400',
            badge: 'bg-blue-100 dark:bg-blue-900/50'
        },
        'REJECTED': {
            bg: 'bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800',
            text: 'text-red-700 dark:text-red-400',
            badge: 'bg-red-100 dark:bg-red-900/50'
        },
        'SENT': {
            bg: 'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800',
            text: 'text-purple-700 dark:text-purple-400',
            badge: 'bg-purple-100 dark:bg-purple-900/50'
        },
        'PARTIALLY_RECEIVED': {
            bg: 'bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800',
            text: 'text-orange-700 dark:text-orange-400',
            badge: 'bg-orange-100 dark:bg-orange-900/50'
        },
        'FULLY_RECEIVED': {
            bg: 'bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800',
            text: 'text-emerald-700 dark:text-emerald-400',
            badge: 'bg-emerald-100 dark:bg-emerald-900/50'
        },
        'CANCELLED': {
            bg: 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700',
            text: 'text-slate-700 dark:text-slate-400',
            badge: 'bg-slate-100 dark:bg-slate-800'
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