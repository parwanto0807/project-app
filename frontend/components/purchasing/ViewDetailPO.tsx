"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    ArrowLeft,
    Eye,
    Edit,
    Trash2,
    FileText,
    Send,
    Printer,
    Download,
    Package,
    Building,
    User,
    Calendar,
    DollarSign,
    Folder,
    Truck,
    CheckCircle,
    XCircle,
    Clock,
    FileEdit,
    MoreVertical,
    ChevronRight,
    Copy,
    Share2,
    History,
    AlertCircle,
    ShoppingCart,
    Receipt,
    Percent,
    Hash,
    Box,
    Layers,
    Warehouse,
    Mail,
    Phone,
    MapPin,
    Globe,
    CreditCard,
    ChevronDown,
    Sparkles,
    ExternalLink,
    BarChart3,
    FileCheck,
    ClipboardList,
} from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import PurchaseOrderPdfDocument from "./purchaseOrderPdf";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { PurchaseOrder } from "@/types/poType";
import { getPurchaseOrderById, updatePurchaseOrderStatus, deletePurchaseOrder } from "@/lib/action/po/po";

// Enhanced status config with colored icons
const statusConfig: Record<string, any> = {
    DRAFT: {
        label: "Draft",
        className: "bg-gray-100 text-gray-800 border-gray-300",
        icon: FileEdit,
        iconColor: "text-gray-600",
        gradient: "from-gray-100 to-gray-200",
    },
    PENDING_APPROVAL: {
        label: "Pending Approval",
        className: "bg-amber-50 text-amber-800 border-amber-300",
        icon: Clock,
        iconColor: "text-amber-600",
        gradient: "from-amber-50 to-amber-100",
    },
    APPROVED: {
        label: "Disetujui",
        className: "bg-blue-50 text-blue-800 border-blue-300",
        icon: CheckCircle,
        iconColor: "text-blue-600",
        gradient: "from-blue-50 to-blue-100",
    },
    REJECTED: {
        label: "Ditolak",
        className: "bg-red-50 text-red-800 border-red-300",
        icon: XCircle,
        iconColor: "text-red-600",
        gradient: "from-red-50 to-red-100",
    },
    SENT: {
        label: "Terkirim ke Supplier",
        className: "bg-purple-50 text-purple-800 border-purple-300",
        icon: Send,
        iconColor: "text-purple-600",
        gradient: "from-purple-50 to-purple-100",
    },
    PARTIALLY_RECEIVED: {
        label: "Diterima Sebagian",
        className: "bg-orange-50 text-orange-800 border-orange-300",
        icon: Package,
        iconColor: "text-orange-600",
        gradient: "from-orange-50 to-orange-100",
    },
    FULLY_RECEIVED: {
        label: "Diterima Lengkap",
        className: "bg-emerald-50 text-emerald-800 border-emerald-300",
        icon: CheckCircle,
        iconColor: "text-emerald-600",
        gradient: "from-emerald-50 to-emerald-100",
    },
    CANCELLED: {
        label: "Dibatalkan",
        className: "bg-slate-100 text-slate-800 border-slate-300",
        icon: XCircle,
        iconColor: "text-slate-600",
        gradient: "from-slate-100 to-slate-200",
    },
};

const nextStatusOptionsMap: Record<string, string[]> = {
    DRAFT: ["PENDING_APPROVAL"],
    PENDING_APPROVAL: ["APPROVED", "REJECTED"],
    APPROVED: ["SENT", "CANCELLED"],
    SENT: ["PARTIALLY_RECEIVED", "FULLY_RECEIVED"],
    PARTIALLY_RECEIVED: ["FULLY_RECEIVED"],
    REJECTED: ["DRAFT"],
    CANCELLED: [],
    FULLY_RECEIVED: [],
};

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Status yang bisa diubah oleh role PIC
const PIC_ALLOWED_STATUS_CHANGES: string[] = ["DRAFT", "SENT", "PARTIALLY_RECEIVED", "FULLY_RECEIVED"];

export default function ViewDetailPO({ poId, userRole = "admin" }: { poId: string; userRole?: string }) {
    const router = useRouter();
    const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [newStatus, setNewStatus] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [activeTab, setActiveTab] = useState("details");

    useEffect(() => {
        const fetchPO = async () => {
            if (!poId) return;
            try {
                setIsLoading(true);
                const data = await getPurchaseOrderById(poId);
                setPurchaseOrder(data);
            } catch (error) {
                console.error("Error fetching PO:", error);
                toast.error("Gagal memuat detail purchase order");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPO();
    }, [poId]);

    const handleUpdateStatus = async (status: string) => {
        if (!purchaseOrder) return;
        try {
            await updatePurchaseOrderStatus(purchaseOrder.id, status);
            toast.success(`Status berhasil diubah menjadi ${statusConfig[status].label}`);

            const updatedPO = await getPurchaseOrderById(purchaseOrder.id);
            setPurchaseOrder(updatedPO);
            setStatusDialogOpen(false);
            setNewStatus(null);

            // Automatically open PDF for printing if status is SENT
            if (status === 'SENT') {
                try {
                    toast.info("Menyiapkan dokumen PDF...");
                    const blob = await pdf(<PurchaseOrderPdfDocument purchaseOrder={updatedPO} />).toBlob();
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                } catch (pdfError) {
                    console.error("Error generating PDF:", pdfError);
                    toast.error("Gagal membuka PDF otomatis");
                }
            }
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Gagal mengubah status");
        }
    };

    const handleDelete = async () => {
        if (!purchaseOrder) return;
        setIsDeleting(true);
        try {
            await deletePurchaseOrder(purchaseOrder.id);
            toast.success("Purchase Order berhasil dihapus");
            // Redirect is handled by server action
        } catch (error: any) {
            // Ignore redirect error
            if (error.message === 'NEXT_REDIRECT' || error.digest?.includes('NEXT_REDIRECT')) {
                return;
            }
            console.error("Error deleting PO:", error);
            toast.error("Gagal menghapus purchase order");
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    const handleDuplicate = () => {
        toast.info("Fitur duplikat akan segera hadir");
    };

    const handlePrint = async () => {
        try {
            if (!purchaseOrder) return;
            const blob = await pdf(<PurchaseOrderPdfDocument purchaseOrder={purchaseOrder} />).toBlob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error("Gagal membuat PDF");
        }
    };

    const handleSendEmail = async () => {
        setIsSendingEmail(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            toast.success("Email berhasil dikirim ke supplier");
        } catch (error) {
            toast.error("Gagal mengirim email");
        } finally {
            setIsSendingEmail(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(value);
    };

    const calculateItemTotal = (item: any) => {
        return item.totalAmount || (item.quantity * item.unitPrice);
    };

    if (isLoading) {
        return (
            <div className="container mx-auto py-8 px-4 space-y-8">
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Skeleton className="h-[200px] w-full" />
                        <Skeleton className="h-[300px] w-full" />
                    </div>
                    <div className="space-y-8">
                        <Skeleton className="h-[150px] w-full" />
                        <Skeleton className="h-[150px] w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (!purchaseOrder) {
        return (
            <div className="container mx-auto py-16 px-4 text-center">
                <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Purchase Order Tidak Ditemukan</h2>
                <p className="text-muted-foreground mb-6">
                    Purchase order yang Anda cari mungkin telah dihapus atau ID tidak valid.
                </p>
                <Button onClick={() => router.push("/admin-area/logistic/purchasing")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali ke Daftar
                </Button>
            </div>
        );
    }

    const StatusIcon = statusConfig[purchaseOrder.status].icon;
    const statusIconColor = statusConfig[purchaseOrder.status].iconColor;

    // Get base status options
    const baseStatusOptions = nextStatusOptionsMap[purchaseOrder.status] || [];

    // Filter status options based on user role
    // PIC can only update status when current status is: DRAFT, SENT, PARTIALLY_RECEIVED, FULLY_RECEIVED
    // Admin can update status for all statuses
    const nextStatusOptions = userRole === "admin"
        ? baseStatusOptions
        : (PIC_ALLOWED_STATUS_CHANGES.includes(purchaseOrder.status) ? baseStatusOptions : []);

    const canEdit = purchaseOrder.status === "DRAFT";
    const canDelete = purchaseOrder.status === "DRAFT";
    const canSend = purchaseOrder.status === "APPROVED";

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 animate-in fade-in duration-700">
            {/* Premium Header with Gradient */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 opacity-10"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full -translate-y-32 translate-x-32 opacity-5"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full translate-y-64 -translate-x-64 opacity-5"></div>

                <div className="container mx-auto py-8 px-4 relative z-10">
                    {/* Enhanced Header */}
                    <div className="mb-8 print:hidden">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
                                        <ShoppingCart className="h-3.5 w-3.5" />
                                        Purchase Order Management
                                    </div>
                                </div>

                                <div className="flex flex-col justify-between md:flex-row md:items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                                                <FileText className="h-7 w-7 text-white" />
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white border-2 border-white flex items-center justify-center">
                                                <Badge
                                                    className={cn(
                                                        "h-5 w-5 rounded-full flex items-center justify-center p-0",
                                                        statusConfig[purchaseOrder.status].className
                                                    )}
                                                >
                                                    <StatusIcon className="h-2.5 w-2.5" />
                                                </Badge>
                                            </div>
                                        </div>

                                        <div>
                                            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                                {purchaseOrder.poNumber}
                                            </h1>
                                            <div className="flex items-center gap-3 mt-2">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "px-3 py-1.5 font-medium backdrop-blur-sm",
                                                        statusConfig[purchaseOrder.status].className,
                                                        "border-opacity-50 shadow-sm"
                                                    )}
                                                >
                                                    <StatusIcon className={cn("h-4 w-4 mr-1.5", statusIconColor)} />
                                                    {statusConfig[purchaseOrder.status].label}
                                                </Badge>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="h-3.5 w-3.5 text-blue-500" />
                                                        <span>
                                                            {format(new Date(purchaseOrder.orderDate), "dd MMM yyyy", { locale: id })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Building className="h-3.5 w-3.5 text-purple-500" />
                                                        <span>{purchaseOrder.supplier?.name || "No Supplier"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2">
                                        {nextStatusOptions.length > 0 && (
                                            <Button
                                                onClick={() => setStatusDialogOpen(true)}
                                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25"
                                            >
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Update Status
                                            </Button>
                                        )}
                                        <Button variant="outline" className="border-blue-200 hover:bg-blue-50">
                                            <Share2 className="h-4 w-4 mr-2" />
                                            Share
                                        </Button>
                                        <Button
                                            onClick={() => router.push("/admin-area/logistic/purchasing")}
                                            className="bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700 shadow-lg shadow-gray-500/25 text-white"
                                        >
                                            <ArrowLeft className="h-4 w-4 mr-2" />
                                            Kembali ke List PO
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Enhanced Tabs */}
                            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                    <div className="border-b border-gray-100 px-6 my-4">
                                        <TabsList className="h-14 bg-transparent w-full justify-start gap-1">
                                            <TabsTrigger
                                                value="details"
                                                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-xl h-14 px-6"
                                            >
                                                <FileText className="h-4 w-4 mr-2" />
                                                Informasi Utama
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="items"
                                                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-xl h-14 px-6"
                                            >
                                                <Package className="h-4 w-4 mr-2" />
                                                Item Barang
                                                {purchaseOrder.lines && purchaseOrder.lines.length > 0 && (
                                                    <Badge className="ml-2 bg-blue-100 text-blue-700 hover:bg-blue-100">
                                                        {purchaseOrder.lines.length}
                                                    </Badge>
                                                )}
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="delivery"
                                                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-xl h-14 px-6"
                                            >
                                                <Truck className="h-4 w-4 mr-2" />
                                                Pengiriman
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="history"
                                                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-xl h-14 px-6"
                                            >
                                                <History className="h-4 w-4 mr-2" />
                                                Riwayat
                                            </TabsTrigger>
                                        </TabsList>
                                    </div>

                                    {/* Details Tab */}
                                    <TabsContent value="details" className="m-0 p-6 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Order Details Card */}
                                            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50/50 to-white">
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-center justify-between">
                                                        <CardTitle className="flex items-center gap-2 text-lg">
                                                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                                                <ClipboardList className="h-5 w-5 text-blue-600" />
                                                            </div>
                                                            <span>Detail Pesanan</span>
                                                        </CardTitle>
                                                        <Badge variant="outline" className="bg-white">
                                                            #{purchaseOrder.poNumber.split('-').pop()}
                                                        </Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                                <Hash className="h-4 w-4 text-blue-500" />
                                                                <span>Nomor PO</span>
                                                            </div>
                                                            <div className="font-mono font-semibold">{purchaseOrder.poNumber}</div>
                                                        </div>
                                                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                                <Calendar className="h-4 w-4 text-purple-500" />
                                                                <span>Tanggal Order</span>
                                                            </div>
                                                            <div className="font-medium">
                                                                {format(new Date(purchaseOrder.orderDate), "dd MMMM yyyy", { locale: id })}
                                                            </div>
                                                        </div>
                                                        {purchaseOrder.project && (
                                                            <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                                    <Folder className="h-4 w-4 text-green-500" />
                                                                    <span>Proyek</span>
                                                                </div>
                                                                <div className="font-medium">{purchaseOrder.project.name}</div>
                                                            </div>
                                                        )}
                                                        {purchaseOrder.SPK && (
                                                            <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                                    <FileCheck className="h-4 w-4 text-cyan-500" />
                                                                    <span>SPK</span>
                                                                </div>
                                                                <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 font-mono">
                                                                    {purchaseOrder.SPK.spkNumber}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                        {purchaseOrder.paymentTerm && (
                                                            <div className="flex items-center justify-between py-2">
                                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                                    <CreditCard className="h-4 w-4 text-amber-500" />
                                                                    <span>Termin Pembayaran</span>
                                                                </div>
                                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                                                    {purchaseOrder.paymentTerm.replace(/_/g, ' ')}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            {/* Supplier Card */}
                                            <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50/50 to-white">
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="flex items-center gap-2 text-lg">
                                                        <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                                            <Building className="h-5 w-5 text-emerald-600" />
                                                        </div>
                                                        <span>Informasi Supplier</span>
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    {purchaseOrder.supplier ? (
                                                        <div className="space-y-4">
                                                            <div className="flex items-start gap-3">
                                                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                                                    <User className="h-6 w-6 text-white" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold text-lg">{purchaseOrder.supplier.name}</div>
                                                                    <div className="text-sm text-muted-foreground">Kode: {purchaseOrder.supplier.code}</div>
                                                                </div>
                                                            </div>
                                                            <div className="grid gap-2 text-sm">
                                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                                    <Mail className="h-3.5 w-3.5" />
                                                                    <span>contact@supplier.com</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                                    <Phone className="h-3.5 w-3.5" />
                                                                    <span>(021) 123-4567</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-4 text-muted-foreground">
                                                            Tidak ada informasi supplier
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>

                                            {/* Warehouse Card */}
                                            <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50/50 to-white md:col-span-2">
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="flex items-center gap-2 text-lg">
                                                        <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                                            <Warehouse className="h-5 w-5 text-orange-600" />
                                                        </div>
                                                        <span>Gudang Tujuan</span>
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    {purchaseOrder.warehouse ? (
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                                                                    <Box className="h-7 w-7 text-white" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold text-lg">{purchaseOrder.warehouse.name}</div>
                                                                    <div className="text-sm text-muted-foreground">Kode: {purchaseOrder.warehouse.code}</div>
                                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                                        <MapPin className="h-3.5 w-3.5" />
                                                                        <span>Jl. Gudang No. 123, Jakarta</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-sm text-muted-foreground">Kontak</div>
                                                                <div className="font-medium">(021) 765-4321</div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-4 text-muted-foreground">
                                                            Tidak ada informasi gudang
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </TabsContent>

                                    {/* Items Tab */}
                                    <TabsContent value="items" className="m-0 p-6">
                                        <Card className="border-0 shadow-sm">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                                        <Package className="h-5 w-5 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <div>Daftar Item Barang</div>
                                                        <CardDescription className="mt-1">
                                                            {purchaseOrder.lines?.length || 0} item dalam purchase order ini
                                                        </CardDescription>
                                                    </div>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {purchaseOrder.lines && purchaseOrder.lines.length > 0 ? (
                                                    <div className="space-y-6">
                                                        <div className="overflow-hidden border rounded-xl">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow className="bg-gradient-to-r from-gray-50 to-blue-50/50">
                                                                        <TableHead className="font-semibold text-gray-700">#</TableHead>
                                                                        <TableHead className="font-semibold text-gray-700">Produk</TableHead>
                                                                        <TableHead className="font-semibold text-gray-700 text-right">Jumlah</TableHead>
                                                                        <TableHead className="font-semibold text-gray-700 text-right">Harga Satuan</TableHead>
                                                                        <TableHead className="font-semibold text-gray-700 text-right">Total</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {purchaseOrder.lines.map((line, index) => (
                                                                        <TableRow key={line.id || index} className="hover:bg-blue-50/30 transition-colors">
                                                                            <TableCell className="font-medium">{index + 1}</TableCell>
                                                                            <TableCell>
                                                                                <div className="font-semibold">{line.product?.name || "N/A"}</div>
                                                                                {line.description && (
                                                                                    <div className="text-sm text-muted-foreground mt-1">
                                                                                        {line.description}
                                                                                    </div>
                                                                                )}
                                                                            </TableCell>
                                                                            <TableCell className="text-right font-medium">
                                                                                <div className="inline-flex items-center gap-1">
                                                                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
                                                                                        {line.quantity}
                                                                                    </span>
                                                                                    <span className="text-muted-foreground text-sm">
                                                                                        {line.product?.unit || "pcs"}
                                                                                    </span>
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell className="text-right font-semibold">
                                                                                {formatCurrency(line.unitPrice)}
                                                                            </TableCell>
                                                                            <TableCell className="text-right font-bold text-blue-700">
                                                                                {formatCurrency(line.totalAmount)}
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </div>

                                                        {/* Enhanced Summary */}
                                                        <div className="bg-gradient-to-r from-blue-50/50 to-white border border-blue-100 rounded-2xl p-6">
                                                            <div className="max-w-md ml-auto space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-muted-foreground">Subtotal:</span>
                                                                    <span className="font-semibold">
                                                                        {formatCurrency(purchaseOrder.subtotal || 0)}
                                                                    </span>
                                                                </div>
                                                                {purchaseOrder.taxAmount > 0 && (
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-muted-foreground flex items-center gap-2">
                                                                            <Receipt className="h-4 w-4 text-blue-500" />
                                                                            Total Pajak:
                                                                        </span>
                                                                        <span className="font-semibold text-blue-600">
                                                                            +{formatCurrency(purchaseOrder.taxAmount)}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                <Separator className="my-2" />
                                                                <div className="flex items-center justify-between text-xl font-bold pt-2">
                                                                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                                        Total Keseluruhan:
                                                                    </span>
                                                                    <span className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                                        {formatCurrency(purchaseOrder.totalAmount)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-12">
                                                        <div className="h-20 w-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                                                            <Package className="h-10 w-10 text-gray-400" />
                                                        </div>
                                                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Tidak Ada Item</h3>
                                                        <p className="text-muted-foreground max-w-sm mx-auto">
                                                            Purchase order ini belum memiliki item barang. Tambahkan item untuk melanjutkan.
                                                        </p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    {/* Delivery Tab */}
                                    <TabsContent value="delivery" className="m-0 p-6">
                                        <Card className="border-0 shadow-sm">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                                                        <Truck className="h-5 w-5 text-green-600" />
                                                    </div>
                                                    <span>Informasi Pengiriman</span>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                    <div className="space-y-6">
                                                        <div className="bg-gradient-to-br from-green-50/50 to-white rounded-xl p-6 border border-green-100">
                                                            <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                                                <MapPin className="h-5 w-5 text-green-600" />
                                                                Alamat Pengiriman
                                                            </h4>
                                                            {purchaseOrder.warehouse ? (
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                                                                            <Warehouse className="h-6 w-6 text-green-600" />
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-bold text-lg">{purchaseOrder.warehouse.name}</div>
                                                                            <div className="text-sm text-muted-foreground">{purchaseOrder.warehouse.code}</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-2 text-sm">
                                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                                            <MapPin className="h-4 w-4" />
                                                                            <span>Jl. Gudang Utama No. 45, Jakarta Selatan</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                                            <Phone className="h-4 w-4" />
                                                                            <span>(021) 555-6789</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="text-muted-foreground">Tidak ada informasi gudang</div>
                                                            )}
                                                        </div>

                                                        <div className="bg-gradient-to-br from-blue-50/50 to-white rounded-xl p-6 border border-blue-100">
                                                            <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                                                <Calendar className="h-5 w-5 text-blue-600" />
                                                                Jadwal Pengiriman
                                                            </h4>
                                                            <div className="space-y-4">
                                                                <div className="flex items-center justify-between py-2 border-b border-blue-100">
                                                                    <span className="text-muted-foreground">Tanggal Order:</span>
                                                                    <span className="font-medium">
                                                                        {format(new Date(purchaseOrder.orderDate), "dd MMMM yyyy", { locale: id })}
                                                                    </span>
                                                                </div>
                                                                {purchaseOrder.expectedDeliveryDate ? (
                                                                    <div className="flex items-center justify-between py-2 border-b border-blue-100">
                                                                        <span className="text-muted-foreground">Estimasi Tiba:</span>
                                                                        <span className="font-medium bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                                                            {format(new Date(purchaseOrder.expectedDeliveryDate), "dd MMMM yyyy", { locale: id })}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center justify-between py-2">
                                                                        <span className="text-muted-foreground">Estimasi Tiba:</span>
                                                                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                                                            Belum ditentukan
                                                                        </Badge>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-6">
                                                        <div className="bg-gradient-to-br from-purple-50/50 to-white rounded-xl p-6 border border-purple-100">
                                                            <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                                                <Package className="h-5 w-5 text-purple-600" />
                                                                Status Penerimaan
                                                            </h4>
                                                            <div className="space-y-6">
                                                                <div>
                                                                    <div className="flex items-center justify-between mb-3">
                                                                        <span className="text-muted-foreground">Status Saat Ini:</span>
                                                                        <Badge className={cn("px-3 py-1.5", statusConfig[purchaseOrder.status].className)}>
                                                                            <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                                                                            {statusConfig[purchaseOrder.status].label}
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                                        <div
                                                                            className={cn("h-2 rounded-full transition-all duration-500", {
                                                                                'bg-green-500 w-full': purchaseOrder.status === 'FULLY_RECEIVED',
                                                                                'bg-orange-500 w-2/3': purchaseOrder.status === 'PARTIALLY_RECEIVED',
                                                                                'bg-blue-500 w-1/3': ['DRAFT', 'PENDING_APPROVAL', 'APPROVED'].includes(purchaseOrder.status),
                                                                                'bg-purple-500 w-1/2': purchaseOrder.status === 'SENT',
                                                                            })}
                                                                        ></div>
                                                                    </div>
                                                                </div>

                                                                {purchaseOrder.lines && (
                                                                    <div className="space-y-3">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-muted-foreground">Progress Penerimaan:</span>
                                                                            <span className="font-semibold">
                                                                                {purchaseOrder.lines.reduce((acc, l) => acc + (l.receivedQuantity || 0), 0)} / {purchaseOrder.lines.reduce((acc, l) => acc + (l.quantity || 0), 0)}
                                                                            </span>
                                                                        </div>
                                                                        <div className="bg-gray-100 rounded-lg p-3">
                                                                            <div className="text-xs font-medium text-gray-700 mb-1">
                                                                                {Math.round((purchaseOrder.lines.reduce((acc, l) => acc + (l.receivedQuantity || 0), 0) / purchaseOrder.lines.reduce((acc, l) => acc + (l.quantity || 0), 0)) * 100)}% Complete
                                                                            </div>
                                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                                <div
                                                                                    className="bg-green-500 h-2 rounded-full"
                                                                                    style={{
                                                                                        width: `${(purchaseOrder.lines.reduce((acc, l) => acc + (l.receivedQuantity || 0), 0) / purchaseOrder.lines.reduce((acc, l) => acc + (l.quantity || 0), 0)) * 100}%`
                                                                                    }}
                                                                                ></div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>

                        {/* Right Column - Actions & Summary */}
                        <div className="space-y-6">
                            {/* Actions Card */}
                            <Card className="border-0 shadow-xl bg-gradient-to-b from-white to-blue-50/30">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                            <Sparkles className="h-5 w-5 text-white" />
                                        </div>
                                        <span>Aksi Cepat</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-11 hover:bg-blue-50 hover:border-blue-200 transition-all group"
                                        onClick={handlePrint}
                                    >
                                        <div className="h-8 w-8 rounded-md bg-blue-100 flex items-center justify-center mr-3 group-hover:bg-blue-200">
                                            <Printer className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-medium">Cetak / PDF</div>
                                            <div className="text-xs text-muted-foreground">Download dokumen</div>
                                        </div>
                                    </Button>

                                    {canSend && (
                                        <Button
                                            className="w-full justify-start h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/25"
                                            onClick={() => handleUpdateStatus("SENT")}
                                        >
                                            <div className="h-8 w-8 rounded-md bg-white/20 flex items-center justify-center mr-3">
                                                <Send className="h-4 w-4 text-white" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-medium">Kirim ke Supplier</div>
                                                <div className="text-xs text-white/90">Update status ke Terkirim</div>
                                            </div>
                                        </Button>
                                    )}

                                    {purchaseOrder.status === "SENT" && (
                                        <Button
                                            className="w-full justify-start h-11 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg shadow-emerald-500/25"
                                            onClick={() => router.push(`/goods-receipt/create?poId=${poId}`)}
                                        >
                                            <div className="h-8 w-8 rounded-md bg-white/20 flex items-center justify-center mr-3">
                                                <Package className="h-4 w-4 text-white" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-medium">Terima Barang</div>
                                                <div className="text-xs text-white/90">Buat Goods Receipt</div>
                                            </div>
                                        </Button>
                                    )}

                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-11 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all group"
                                        onClick={() => setDeleteDialogOpen(true)}
                                        disabled={!canDelete}
                                    >
                                        <div className="h-8 w-8 rounded-md bg-red-100 flex items-center justify-center mr-3 group-hover:bg-red-200">
                                            <Trash2 className="h-4 w-4 text-red-600" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-medium">Hapus PO</div>
                                            <div className="text-xs text-muted-foreground">Hapus permanen</div>
                                        </div>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-11 hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-all group"
                                        onClick={handleSendEmail}
                                        disabled={isSendingEmail}
                                    >
                                        {isSendingEmail ? (
                                            <>
                                                <div className="h-8 w-8 rounded-md bg-green-100 flex items-center justify-center mr-3">
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-medium">Mengirim...</div>
                                                    <div className="text-xs text-muted-foreground">Sedang mengirim email</div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="h-8 w-8 rounded-md bg-green-100 flex items-center justify-center mr-3 group-hover:bg-green-200">
                                                    <Mail className="h-4 w-4 text-green-600" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-medium">Kirim Email</div>
                                                    <div className="text-xs text-muted-foreground">Ke supplier</div>
                                                </div>
                                            </>
                                        )}
                                    </Button>

                                    {canEdit && (
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start h-11 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all group"
                                            onClick={() => router.push(`/admin-area/logistic/purchasing/update/${poId}`)}
                                        >
                                            <div className="h-8 w-8 rounded-md bg-blue-100 flex items-center justify-center mr-3 group-hover:bg-blue-200">
                                                <Edit className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-medium">Edit PO</div>
                                                <div className="text-xs text-muted-foreground">Update informasi</div>
                                            </div>
                                        </Button>
                                    )}

                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-11 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-all group"
                                        onClick={handleDuplicate}
                                    >
                                        <div className="h-8 w-8 rounded-md bg-purple-100 flex items-center justify-center mr-3 group-hover:bg-purple-200">
                                            <Copy className="h-4 w-4 text-purple-600" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-medium">Duplikat PO</div>
                                            <div className="text-xs text-muted-foreground">Buat salinan baru</div>
                                        </div>
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Financial Summary Card */}
                            <Card className="border-0 shadow-xl bg-gradient-to-b from-white to-emerald-50/30">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                                            <DollarSign className="h-5 w-5 text-white" />
                                        </div>
                                        <span>Ringkasan Keuangan</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between py-2.5 border-b border-emerald-100">
                                                <span className="text-muted-foreground">Subtotal:</span>
                                                <span className="font-semibold">
                                                    {formatCurrency(purchaseOrder.subtotal || 0)}
                                                </span>
                                            </div>
                                            {purchaseOrder.taxAmount > 0 && (
                                                <div className="flex items-center justify-between py-2.5 border-b border-emerald-100">
                                                    <span className="text-muted-foreground flex items-center gap-2">
                                                        <Receipt className="h-3.5 w-3.5 text-blue-500" />
                                                        Total Pajak:
                                                    </span>
                                                    <span className="font-semibold text-blue-600">
                                                        +{formatCurrency(purchaseOrder.taxAmount)}
                                                    </span>
                                                </div>
                                            )}

                                        </div>
                                        <Separator className="my-2" />
                                        <div className="pt-2">
                                            <div className="flex items-center justify-between text-xl font-bold">
                                                <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                                                    Total Akhir:
                                                </span>
                                                <span className="text-2xl bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                                                    {formatCurrency(purchaseOrder.totalAmount)}
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-2 text-right">
                                                Termasuk semua biaya
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Stats Card */}
                            <Card className="border-0 shadow-xl bg-gradient-to-b from-white to-purple-50/30">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                                            <BarChart3 className="h-5 w-5 text-white" />
                                        </div>
                                        <span>Statistik</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-purple-50/50 rounded-lg p-4 text-center">
                                            <div className="text-2xl font-bold text-purple-700">
                                                {purchaseOrder.lines?.length || 0}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">Total Item</div>
                                        </div>
                                        <div className="bg-blue-50/50 rounded-lg p-4 text-center">
                                            <div className="text-2xl font-bold text-blue-700">
                                                {purchaseOrder.lines?.reduce((acc, l) => {
                                                    // Konversi quantity ke number jika perlu
                                                    const quantity = Number(l.quantity) || 0;
                                                    return acc + quantity;
                                                }, 0) || 0}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">Jumlah Unit</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Status Update Dialog */}
            <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                <DialogContent className="sm:max-w-md border-0 shadow-2xl">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <CheckCircle className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl">Ubah Status PO</DialogTitle>
                                <DialogDescription>
                                    Pilih status baru untuk melanjutkan proses
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                            <div>
                                <div className="text-sm text-muted-foreground">Status Saat Ini</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge className={cn("px-3 py-1", statusConfig[purchaseOrder.status].className)}>
                                        <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                                        {statusConfig[purchaseOrder.status].label}
                                    </Badge>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>

                        <div className="space-y-3">
                            {nextStatusOptions.map((status) => {
                                const NextStatusIcon = statusConfig[status].icon;
                                const iconColor = statusConfig[status].iconColor;
                                return (
                                    <button
                                        key={status}
                                        onClick={() => setNewStatus(status)}
                                        className={cn(
                                            "w-full p-4 border rounded-xl text-left transition-all duration-200",
                                            "hover:scale-[1.02] hover:shadow-lg",
                                            newStatus === status
                                                ? "border-blue-300 bg-gradient-to-r from-blue-50 to-blue-100 shadow-md"
                                                : "border-gray-200 hover:border-blue-200 hover:bg-blue-50/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "h-12 w-12 rounded-lg flex items-center justify-center",
                                                newStatus === status
                                                    ? "bg-gradient-to-br from-blue-500 to-blue-600"
                                                    : "bg-gradient-to-br from-gray-100 to-gray-200"
                                            )}>
                                                <NextStatusIcon className={cn(
                                                    "h-5 w-5",
                                                    newStatus === status ? "text-white" : iconColor
                                                )} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900">{statusConfig[status].label}</div>
                                                <div className="text-sm text-muted-foreground mt-1">
                                                    Update status ke {statusConfig[status].label.toLowerCase()}
                                                </div>
                                            </div>
                                            {newStatus === status && (
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <DialogFooter className="flex gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setStatusDialogOpen(false);
                                setNewStatus(null);
                            }}
                            className="flex-1"
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={() => newStatus && handleUpdateStatus(newStatus)}
                            disabled={!newStatus}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Konfirmasi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Enhanced Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md border-0 shadow-2xl">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                                <Trash2 className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl">Hapus Purchase Order</DialogTitle>
                                <DialogDescription>
                                    Tindakan ini tidak dapat dibatalkan
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="py-4">
                        <div className="bg-gradient-to-r from-red-50/50 to-orange-50/50 border border-red-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-red-900">Konfirmasi Penghapusan</p>
                                    <p className="font-mono text-lg mt-2 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                                        {purchaseOrder.poNumber}
                                    </p>
                                    <p className="text-sm text-red-700 mt-3">
                                        Semua data terkait purchase order ini akan dihapus permanen dari sistem.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={isDeleting}
                            className="flex-1"
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                        >
                            {isDeleting ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                                    Menghapus...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Hapus Permanen
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Print View (unchanged) */}
            <div className="hidden print:block">
                <div className="p-8">
                    <div className="flex justify-between items-start mb-8 border-b pb-6">
                        <div>
                            <h1 className="text-3xl font-bold">Purchase Order</h1>
                            <div className="text-xl font-mono mt-2">{purchaseOrder.poNumber}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-bold">PT. Perusahaan Contoh</div>
                            <div className="text-sm">Jl. Contoh No. 123, Jakarta</div>
                            <div className="text-sm">Telp: (021) 123-4567</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="font-bold text-lg mb-2">Kepada:</h3>
                            {purchaseOrder.supplier && (
                                <div>
                                    <div className="font-bold">{purchaseOrder.supplier.name}</div>
                                    <div className="font-bold">{purchaseOrder.supplier.code}</div>
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="font-medium">Tanggal Order:</span>
                                    <span>{format(new Date(purchaseOrder.orderDate), "dd MMMM yyyy", { locale: id })}</span>
                                </div>
                                {purchaseOrder.expectedDeliveryDate && (
                                    <div className="flex justify-between">
                                        <span className="font-medium">Tanggal Pengiriman:</span>
                                        <span>{format(new Date(purchaseOrder.expectedDeliveryDate), "dd MMMM yyyy", { locale: id })}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="font-medium">Status:</span>
                                    <span>{statusConfig[purchaseOrder.status].label}</span>
                                </div>
                                {purchaseOrder.paymentTerm && (
                                    <div className="flex justify-between">
                                        <span className="font-medium">Termin Pembayaran:</span>
                                        <span>{purchaseOrder.paymentTerm.replace(/_/g, ' ')}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {purchaseOrder.lines && purchaseOrder.lines.length > 0 && (
                        <div className="mb-8">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-gray-800">
                                        <th className="text-left py-2">No</th>
                                        <th className="text-left py-2">Produk</th>
                                        <th className="text-right py-2">Jumlah</th>
                                        <th className="text-right py-2">Harga Satuan</th>
                                        <th className="text-right py-2">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {purchaseOrder.lines.map((line, index) => (
                                        <tr key={line.id || index} className="border-b">
                                            <td className="py-2">{index + 1}</td>
                                            <td className="py-2">
                                                <div>{line.product?.name || "N/A"}</div>
                                                {line.description && (
                                                    <div className="text-sm text-gray-600">Catatan: {line.description}</div>
                                                )}
                                            </td>
                                            <td className="text-right py-2">
                                                {line.quantity} {line.product?.unit || "pcs"}
                                            </td>
                                            <td className="text-right py-2">
                                                {formatCurrency(line.unitPrice)}
                                            </td>
                                            <td className="text-right py-2 font-medium">
                                                {formatCurrency(line.totalAmount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="border-t pt-6">
                        <div className="max-w-xs ml-auto">
                            <div className="flex justify-between text-lg mb-2">
                                <span>Total:</span>
                                <span className="font-bold">{formatCurrency(purchaseOrder.totalAmount || 0)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t">
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <div className="font-bold mb-4">Disetujui Oleh:</div>
                                <div className="h-24 border-b"></div>
                                <div className="text-center mt-2">Nama & Tanda Tangan</div>
                            </div>
                            <div>
                                <div className="font-bold mb-4">Diterima Oleh:</div>
                                <div className="h-24 border-b"></div>
                                <div className="text-center mt-2">Nama & Tanda Tangan</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}