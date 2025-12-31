"use client";

import React, { useState, useEffect, useRef } from "react";
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
    Users,
    CheckCircle2,
    Info,
} from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import PurchaseOrderPdfDocument from "./purchaseOrderPdf";
import POReportHistory from "./POReportHistory";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { PurchaseOrder } from "@/types/poType";
import { getPurchaseOrderById, updatePurchaseOrderStatus, deletePurchaseOrder, sendPurchaseOrderEmail, updatePurchaseOrder } from "@/lib/action/po/po";
import { createMRFromPOAction } from "@/lib/action/inventory/mrInventroyAction";
import { createGoodsReceiptFromPOAction } from "@/lib/action/grInventory/grAction";
import { getAllTeam } from "@/lib/action/master/team/getAllTeam";

// ... existing imports

// Enhanced status config with colored icons
const statusConfig: Record<string, any> = {
    DRAFT: {
        label: "Draft",
        className: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 shadow-sm",
        icon: FileEdit,
        iconColor: "text-gray-600 dark:text-gray-400",
        gradient: "from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900",
    },
    PENDING_APPROVAL: {
        label: "Submited / Pending Approval",
        className: "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 shadow-sm",
        icon: Clock,
        iconColor: "text-amber-600 dark:text-amber-400",
        gradient: "from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900",
    },
    REVISION_NEEDED: {
        label: "Perlu Revisi",
        className: "bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800 shadow-sm",
        icon: AlertCircle,
        iconColor: "text-orange-600 dark:text-orange-400",
        gradient: "from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900",
    },
    APPROVED: {
        label: "Disetujui",
        className: "bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800 shadow-sm",
        icon: CheckCircle,
        iconColor: "text-blue-600 dark:text-blue-400",
        gradient: "from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900",
    },
    REJECTED: {
        label: "Ditolak",
        className: "bg-red-50 text-red-800 border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800 shadow-sm",
        icon: XCircle,
        iconColor: "text-red-600 dark:text-red-400",
        gradient: "from-red-50 to-red-100 dark:from-red-950 dark:to-red-900",
    },
    SENT: {
        label: "Terkirim ke Supplier",
        className: "bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800 shadow-sm",
        icon: Send,
        iconColor: "text-purple-600 dark:text-purple-400",
        gradient: "from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900",
    },
    PARTIALLY_RECEIVED: {
        label: "Diterima Sebagian",
        className: "bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800 shadow-sm",
        icon: Package,
        iconColor: "text-orange-600 dark:text-orange-400",
        gradient: "from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900",
    },
    FULLY_RECEIVED: {
        label: "Diterima Lengkap",
        className: "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 shadow-sm",
        icon: CheckCircle,
        iconColor: "text-emerald-600 dark:text-emerald-400",
        gradient: "from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900",
    },
    CANCELLED: {
        label: "Dibatalkan",
        className: "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 shadow-sm",
        icon: XCircle,
        iconColor: "text-slate-600 dark:text-slate-400",
        gradient: "from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900",
    },
};

const nextStatusOptionsMap: Record<string, string[]> = {
    DRAFT: ["PENDING_APPROVAL"],
    PENDING_APPROVAL: ["APPROVED", "REJECTED", "REVISION_NEEDED"],
    REVISION_NEEDED: ["PENDING_APPROVAL", "DRAFT"],
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


    // New Feature State
    const [isCreatingMR, setIsCreatingMR] = useState(false);

    // Share Feature State
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [teams, setTeams] = useState<any[]>([]);
    const [isFetchingTeams, setIsFetchingTeams] = useState(false);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [isSharing, setIsSharing] = useState(false);

    const fetchTeams = async () => {
        setIsFetchingTeams(true);
        try {
            // Import getAllTeam dynamically to avoid circular dependencies if any, 
            // or just use the imported action if we add it to top level.
            // For now assuming we will add import at top.
            const res = await getAllTeam(1, 100); // Fetch up to 100 teams
            if (res.success) {
                setTeams(res.data);
                // Pre-select current team if exists
                if (purchaseOrder?.teamId) {
                    setSelectedTeamId(purchaseOrder.teamId);
                }
            } else {
                toast.error("Gagal memuat data team");
            }
        } catch (error) {
            console.error("Error fetching teams:", error);
            toast.error("Gagal memuat data team");
        } finally {
            setIsFetchingTeams(false);
        }
    };

    const handleConfirmShare = async () => {
        if (!purchaseOrder) return;
        setIsSharing(true);
        try {
            await updatePurchaseOrder(purchaseOrder.id, { teamId: selectedTeamId });
            toast.success("PO berhasil dibagikan ke Team");

            // Refresh PO
            const updated = await getPurchaseOrderById(purchaseOrder.id);
            setPurchaseOrder(updated);
            setShareDialogOpen(false);
        } catch (error) {
            console.error("Error sharing PO:", error);
            toast.error("Gagal membagikan PO");
        } finally {
            setIsSharing(false);
        }
    };

    const handleCreateMR = async () => {
        if (!purchaseOrder) return;
        setIsCreatingMR(true);
        try {
            const res = await createMRFromPOAction(purchaseOrder.id);
            if (res.success) {
                toast.success("Material Requisition berhasil dibuat!");
                // Refresh PO to update relatedMRs
                const updated = await getPurchaseOrderById(purchaseOrder.id);
                setPurchaseOrder(updated);
            } else {
                toast.error(res.error || "Gagal membuat MR");
            }
        } catch (error: any) {
            console.error("Error creating MR:", error);
            toast.error("Terjadi kesalahan sistem");
        } finally {
            setIsCreatingMR(false);
        }
    };

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

            // Automatically create Goods Receipt (GR) if status is SENT
            if (status === 'SENT') {
                try {
                    toast.info("Membuat Dokumen Penerimaan Barang (GR) otomatis...");

                    // Create GR (Always create GR)
                    const grRes = await createGoodsReceiptFromPOAction(purchaseOrder.id);

                    if (grRes.success) {
                        toast.success("GR berhasil dibuat!");
                        // Refresh PO to update relatedMRs
                        const finalPO = await getPurchaseOrderById(purchaseOrder.id);
                        setPurchaseOrder(finalPO);
                    } else {
                        toast.warning(`Status updated, but GR creation failed: ${grRes.message}`);
                    }
                } catch (autoError) {
                    console.error("Auto Creation Failed:", autoError);
                    toast.warning("Status updated, but failed to auto-create documents");
                }

                // Fetch the latest PO data to ensure status is SENT before generating PDF
                const latestPO = await getPurchaseOrderById(purchaseOrder.id);
                setPurchaseOrder(latestPO);

                // Small delay to ensure state is updated
                await new Promise(resolve => setTimeout(resolve, 500));

                // Display PDF with updated SENT status
                try {
                    const blob = await pdf(<PurchaseOrderPdfDocument purchaseOrder={latestPO} />).toBlob();
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                } catch (error) {
                    console.error("Error generating PDF:", error);
                    toast.error("Gagal membuat PDF");
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

    // const handleSendEmail = async () => {
    //     if (!purchaseOrder) {
    //         toast.error("Data PO tidak tersedia.");
    //         return;
    //     }

    //     if (!purchaseOrder.supplier?.email) {
    //         toast.error("Email supplier tidak ditemukan. Pastikan data supplier memiliki email.");
    //         return;
    //     }

    //     setIsSendingEmail(true);
    //     try {
    //         const toastId = toast.loading("Membuat PDF dan mengirim email...");

    //         // 1. Generate PDF
    //         const blob = await pdf(<PurchaseOrderPdfDocument purchaseOrder={purchaseOrder} />).toBlob();

    //         // 2. Prepare Data
    //         const formData = new FormData();
    //         // Sanitize filename
    //         const filename = `PO-${purchaseOrder.poNumber.replace(/[\/\\?%*:|"<>]/g, '-')}.pdf`;
    //         formData.append('file', blob, filename);
    //         formData.append('email', purchaseOrder.supplier.email);
    //         formData.append('poNumber', purchaseOrder.poNumber);

    //         // 3. Send
    //         await sendPurchaseOrderEmail(purchaseOrder.id, formData);

    //         toast.dismiss(toastId);
    //         toast.success("Email berhasil dikirim ke supplier!");

    //         // 4. Update status if needed (optional) - e.g. change APPROVED to SENT
    //         if (purchaseOrder.status === 'APPROVED') {
    //             handleUpdateStatus('SENT');
    //         }

    //     } catch (error: any) {
    //         console.error("Error sending email:", error);
    //         toast.dismiss(); // Dismiss loading toast
    //         toast.error("Gagal mengirim email: " + (error.message || "Terjadi kesalahan"));
    //     } finally {
    //         setIsSendingEmail(false);
    //     }
    // };

    const handleSendEmail = async () => {
        toast.info("Fitur kirim email sedang dalam tahap pengembangan");
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

    const canEdit = purchaseOrder.status === "DRAFT" || purchaseOrder.status === "REVISION_NEEDED";
    const canDelete = purchaseOrder.status === "DRAFT";
    const canSend = purchaseOrder.status === "APPROVED";

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/30 animate-in fade-in duration-700">
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
                                            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700  dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
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
                                                onClick={() => {
                                                    if (!purchaseOrder.expectedDeliveryDate) {
                                                        toast.error("Mohon isi Estimasi Pengiriman terlebih dahulu sebelum mengubah status");
                                                        return;
                                                    }
                                                    setStatusDialogOpen(true);
                                                }}
                                                className={cn(
                                                    "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25",
                                                    !purchaseOrder.expectedDeliveryDate && "opacity-50 cursor-not-allowed grayscale"
                                                )}
                                                disabled={!purchaseOrder.expectedDeliveryDate}
                                            >
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Update Status
                                            </Button>
                                        )}

                                        {/* Debug: Current status is {purchaseOrder.status} */}

                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "border-blue-200 hover:bg-blue-50",
                                                purchaseOrder.status !== "APPROVED" && "opacity-50 cursor-not-allowed"
                                            )}
                                            onClick={() => {
                                                if (purchaseOrder.status === "APPROVED") {
                                                    setShareDialogOpen(true);
                                                    fetchTeams();
                                                } else {
                                                    toast.error("Share hanya tersedia untuk PO yang sudah disetujui (APPROVED)");
                                                }
                                            }}
                                        >
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
                            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
                                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                    <div className="border-b border-gray-100 dark:border-gray-700 px-6 my-4">
                                        <TabsList className="h-14 bg-transparent w-full justify-start gap-1">
                                            <TabsTrigger
                                                value="details"
                                                className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 dark:data-[state=active]:border-blue-400 rounded-xl h-14 px-6"
                                            >
                                                <FileText className="h-4 w-4 mr-2" />
                                                Informasi Utama
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="items"
                                                className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 dark:data-[state=active]:border-blue-400 rounded-xl h-14 px-6"
                                            >
                                                <Package className="h-4 w-4 mr-2" />
                                                Item Barang
                                                {purchaseOrder.lines && purchaseOrder.lines.length > 0 && (
                                                    <Badge className="ml-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100">
                                                        {purchaseOrder.lines.length}
                                                    </Badge>
                                                )}
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="delivery"
                                                className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 dark:data-[state=active]:border-blue-400 rounded-xl h-14 px-6"
                                            >
                                                <Truck className="h-4 w-4 mr-2" />
                                                Pengiriman
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="history"
                                                className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 dark:data-[state=active]:border-blue-400 rounded-xl h-14 px-6"
                                            >
                                                <History className="h-4 w-4 mr-2" />
                                                Laporan Penerimaan
                                            </TabsTrigger>
                                        </TabsList>
                                    </div>

                                    {/* Details Tab */}
                                    <TabsContent value="details" className="m-0 p-6 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Order Details Card */}
                                            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/20 dark:to-gray-800 dark:bg-gray-800">
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-center justify-between">
                                                        <CardTitle className="flex items-center gap-2 text-lg dark:text-gray-100">
                                                            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shadow-sm">
                                                                <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                            </div>
                                                            <span>Detail Pesanan</span>
                                                        </CardTitle>
                                                        <Badge variant="outline" className="bg-white dark:bg-gray-700 dark:text-gray-200 shadow-sm border-gray-100 dark:border-gray-600">
                                                            #{purchaseOrder.poNumber.split('-').pop()}
                                                        </Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                                <Hash className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                                                                <span>Nomor PO</span>
                                                            </div>
                                                            <div className="font-mono font-semibold dark:text-gray-200">{purchaseOrder.poNumber}</div>
                                                        </div>
                                                        {purchaseOrder.PurchaseRequest && (
                                                            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                                    <FileText className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                                                                    <span>Nomor PR</span>
                                                                </div>
                                                                <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 font-mono shadow-sm">
                                                                    {purchaseOrder.PurchaseRequest.nomorPr}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                                <Calendar className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                                                                <span>Tanggal Order</span>
                                                            </div>
                                                            <div className="font-medium dark:text-gray-200">
                                                                {format(new Date(purchaseOrder.orderDate), "dd MMMM yyyy", { locale: id })}
                                                            </div>
                                                        </div>
                                                        {purchaseOrder.project && (
                                                            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                                    <Folder className="h-4 w-4 text-green-500 dark:text-green-400" />
                                                                    <span>Proyek</span>
                                                                </div>
                                                                <div className="font-medium dark:text-gray-200">{purchaseOrder.project.name}</div>
                                                            </div>
                                                        )}
                                                        {purchaseOrder.SPK && (
                                                            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                                    <FileCheck className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
                                                                    <span>SPK</span>
                                                                </div>
                                                                <Badge variant="outline" className="bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800 font-mono shadow-sm">
                                                                    {purchaseOrder.SPK.spkNumber}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                        {purchaseOrder.paymentTerm && (
                                                            <div className="flex items-center justify-between py-2">
                                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                                    <CreditCard className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                                                                    <span>Termin Pembayaran</span>
                                                                </div>
                                                                <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 shadow-sm">
                                                                    {purchaseOrder.paymentTerm.replace(/_/g, ' ')}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            {/* Supplier Card */}
                                            <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-gray-800 dark:bg-gray-800">
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
                                                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                                                                    <User className="h-6 w-6 text-white" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold text-lg dark:text-gray-100">{purchaseOrder.supplier.name}</div>
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
                                            <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50/50 to-white md:col-span-2 dark:from-orange-950/20 dark:to-gray-800 dark:bg-gray-800">
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
                                                                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
                                                                    <Box className="h-7 w-7 text-white" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold text-lg dark:text-gray-100">{purchaseOrder.warehouse.name}</div>
                                                                    <div className="text-sm text-muted-foreground">Kode: {purchaseOrder.warehouse.code}</div>
                                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                                        <MapPin className="h-3.5 w-3.5 text-orange-500" />
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
                                                <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                                                    <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shadow-sm">
                                                        <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <div>Daftar Item Barang</div>
                                                        <CardDescription className="mt-1 dark:text-gray-400">
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
                                                                    <TableRow className="bg-gradient-to-r from-gray-50 to-blue-50/50 dark:from-gray-800 dark:to-blue-950/20 dark:border-gray-700">
                                                                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">#</TableHead>
                                                                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Produk</TableHead>
                                                                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-right">Jumlah</TableHead>
                                                                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-right">Harga Satuan</TableHead>
                                                                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-right">Total</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {purchaseOrder.lines.map((line, index) => (
                                                                        <TableRow key={line.id || index} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors border-b dark:border-gray-800">
                                                                            <TableCell className="font-medium dark:text-gray-300">{index + 1}</TableCell>
                                                                            <TableCell>
                                                                                <div className="font-semibold dark:text-gray-200">{line.product?.name || "N/A"}</div>
                                                                                {line.description && (
                                                                                    <div className="text-sm text-muted-foreground mt-1 dark:text-gray-400">
                                                                                        {line.description}
                                                                                    </div>
                                                                                )}
                                                                            </TableCell>
                                                                            <TableCell className="text-right font-medium">
                                                                                <div className="inline-flex items-center gap-1">
                                                                                    <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md shadow-sm">
                                                                                        {line.quantity}
                                                                                    </span>
                                                                                    <span className="text-muted-foreground text-sm dark:text-gray-400">
                                                                                        {line.product?.unit || "pcs"}
                                                                                    </span>
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell className="text-right font-semibold dark:text-gray-300">
                                                                                {formatCurrency(line.unitPrice)}
                                                                            </TableCell>
                                                                            <TableCell className="text-right font-bold text-blue-700 dark:text-blue-400">
                                                                                {formatCurrency(line.totalAmount)}
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </div>

                                                        {/* Enhanced Summary */}
                                                        <div className="bg-gradient-to-r from-blue-50/50 to-white border border-blue-100 dark:border-gray-800 rounded-2xl p-6 dark:from-gray-900 dark:to-gray-800/50 dark:shadow-inner-sm">
                                                            <div className="max-w-md ml-auto space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-muted-foreground dark:text-gray-400">Subtotal:</span>
                                                                    <span className="font-semibold dark:text-gray-200">
                                                                        {formatCurrency(purchaseOrder.subtotal || 0)}
                                                                    </span>
                                                                </div>
                                                                {purchaseOrder.taxAmount > 0 && (
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-muted-foreground dark:text-gray-400 flex items-center gap-2">
                                                                            <Receipt className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                                                                            Total Pajak:
                                                                        </span>
                                                                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                                                                            +{formatCurrency(purchaseOrder.taxAmount)}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                <Separator className="my-2 dark:bg-gray-700" />
                                                                <div className="flex items-center justify-between text-xl font-bold pt-2">
                                                                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                                                                        Total Keseluruhan:
                                                                    </span>
                                                                    <span className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                                                                        {formatCurrency(purchaseOrder.totalAmount)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-12">
                                                        <div className="h-20 w-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4 dark:from-gray-800 dark:to-gray-900">
                                                            <Package className="h-10 w-10 text-gray-400" />
                                                        </div>
                                                        <h3 className="text-lg font-semibold text-gray-700 mb-2 dark:text-gray-300">Tidak Ada Item</h3>
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
                                                <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                                                    <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center shadow-sm">
                                                        <Truck className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                    </div>
                                                    <span>Informasi Pengiriman</span>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                    <div className="space-y-6">
                                                        <div className="bg-gradient-to-br from-green-50/50 to-white rounded-xl p-6 border border-green-100 dark:from-green-950/20 dark:to-gray-800 dark:border-green-900/50">
                                                            <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                                                <MapPin className="h-5 w-5 text-green-600" />
                                                                Alamat Pengiriman
                                                            </h4>
                                                            {purchaseOrder.warehouse ? (
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center shadow-sm">
                                                                            <Warehouse className="h-6 w-6 text-green-600 dark:text-green-400" />
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-bold text-lg dark:text-gray-200">{purchaseOrder.warehouse.name}</div>
                                                                            <div className="text-sm text-muted-foreground dark:text-gray-400">{purchaseOrder.warehouse.code}</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-2 text-sm">
                                                                        <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-400">
                                                                            <MapPin className="h-4 w-4 text-green-500" />
                                                                            <span>Jl. Gudang Utama No. 45, Jakarta Selatan</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-400">
                                                                            <Phone className="h-4 w-4 text-green-500" />
                                                                            <span>(021) 555-6789</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="text-muted-foreground">Tidak ada informasi gudang</div>
                                                            )}
                                                        </div>

                                                        <div className="bg-gradient-to-br from-blue-50/50 to-white rounded-xl p-6 border border-blue-100 dark:from-blue-950/20 dark:to-gray-800 dark:border-blue-900/50">
                                                            <h4 className="font-semibold text-lg mb-4 flex items-center gap-2 dark:text-gray-100">
                                                                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                                Jadwal Pengiriman
                                                            </h4>
                                                            <div className="space-y-4">
                                                                <div className="flex items-center justify-between py-2 border-b border-blue-100 dark:border-blue-900/30">
                                                                    <span className="text-muted-foreground dark:text-gray-400">Tanggal Order:</span>
                                                                    <span className="font-medium dark:text-gray-300">
                                                                        {format(new Date(purchaseOrder.orderDate), "dd MMMM yyyy", { locale: id })}
                                                                    </span>
                                                                </div>
                                                                {purchaseOrder.expectedDeliveryDate ? (
                                                                    <div className="flex items-center justify-between py-2 border-b border-blue-100 dark:border-blue-900/30">
                                                                        <span className="text-muted-foreground dark:text-gray-400">Estimasi Tiba:</span>
                                                                        <span className="font-medium bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent dark:from-green-400 dark:to-emerald-400">
                                                                            {format(new Date(purchaseOrder.expectedDeliveryDate), "dd MMMM yyyy", { locale: id })}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center justify-between py-2">
                                                                        <span className="text-muted-foreground dark:text-gray-400">Estimasi Tiba:</span>
                                                                        <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 shadow-sm">
                                                                            Belum ditentukan
                                                                        </Badge>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-6">
                                                        <div className="bg-gradient-to-br from-purple-50/50 to-white rounded-xl p-6 border border-purple-100 dark:from-purple-950/20 dark:to-gray-800 dark:border-purple-900/50">
                                                            <h4 className="font-semibold text-lg mb-4 flex items-center gap-2 dark:text-gray-100">
                                                                <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
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
                                                                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
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
                                                                        <div className="bg-gray-100 rounded-lg p-3 dark:bg-gray-800">
                                                                            <div className="text-xs font-medium text-gray-700 mb-1 dark:text-gray-300">
                                                                                {Math.round((purchaseOrder.lines.reduce((acc, l) => acc + (l.receivedQuantity || 0), 0) / purchaseOrder.lines.reduce((acc, l) => acc + (l.quantity || 0), 0)) * 100)}% Complete
                                                                            </div>
                                                                            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
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

                                    {/* History Tab */}
                                    <TabsContent value="history" className="m-0 p-6">
                                        <Card className="border-0 shadow-sm">
                                            <CardContent className="p-6">
                                                <POReportHistory purchaseOrder={purchaseOrder} />
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>

                        {/* Right Column - Actions & Summary */}
                        <div className="space-y-6">
                            {/* Actions Card */}
                            <Card className="border-0 shadow-xl bg-gradient-to-b from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-950/10 dark:border dark:border-gray-700">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg dark:text-gray-100">
                                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                                            <Sparkles className="h-5 w-5 text-white" />
                                        </div>
                                        <span>Aksi Cepat</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-11 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-200 dark:hover:border-blue-800 transition-all group dark:border-gray-700"
                                        onClick={handlePrint}
                                    >
                                        <div className="h-8 w-8 rounded-md bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-800">
                                            <Printer className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-medium dark:text-gray-200">Cetak / PDF</div>
                                            <div className="text-xs text-muted-foreground dark:text-gray-400">Download dokumen</div>
                                        </div>
                                    </Button>

                                    {canSend && (
                                        <Button
                                            className={cn(
                                                "w-full justify-start h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/25",
                                                !purchaseOrder.expectedDeliveryDate && "opacity-50 cursor-not-allowed grayscale"
                                            )}
                                            disabled={!purchaseOrder.expectedDeliveryDate}
                                            onClick={() => {
                                                if (!purchaseOrder.expectedDeliveryDate) {
                                                    toast.error("Mohon isi Estimasi Pengiriman terlebih dahulu sebelum mengubah status");
                                                    return;
                                                }
                                                handleUpdateStatus("SENT");
                                            }}
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

                                    {/* Create MR Button (Requested Feature) */}
                                    {['SENT', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED'].includes(purchaseOrder.status) && (
                                        purchaseOrder.relatedMRs && purchaseOrder.relatedMRs.length > 0 ? (
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start h-11 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 hover:border-cyan-200 dark:hover:border-cyan-800 transition-all group dark:border-gray-700"
                                                onClick={() => {
                                                    const basePath = userRole === 'admin'
                                                        ? '/admin-area/inventory/requisition'
                                                        : '/warehouse/inventory/requisition'; // Adjust based on role if needed, currently user asked for admin-area
                                                    // Use user's requested path but add search for better UX
                                                    router.push(`/admin-area/inventory/requisition?search=${purchaseOrder.relatedMRs?.[0]?.mrNumber}`);
                                                }}
                                            >
                                                <div className="h-8 w-8 rounded-md bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center mr-3 group-hover:bg-cyan-200 dark:group-hover:bg-cyan-800">
                                                    <FileCheck className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-medium dark:text-gray-200">Lihat MR</div>
                                                    <div className="text-xs text-muted-foreground dark:text-gray-400">{purchaseOrder.relatedMRs?.[0]?.mrNumber}</div>
                                                </div>
                                            </Button>
                                        ) : (
                                            purchaseOrder.status !== 'SENT' && (
                                                <Button
                                                    className={cn(
                                                        "w-full justify-start h-11 shadow-lg transition-all",
                                                        "animate-pulse bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-500/25 text-white ring-2 ring-orange-300 ring-offset-2 dark:ring-offset-gray-900"
                                                    )}
                                                    onClick={handleCreateMR}
                                                    disabled={isCreatingMR}
                                                >
                                                    {isCreatingMR ? (
                                                        <div className="h-8 w-8 rounded-md bg-white/20 flex items-center justify-center mr-3">
                                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                        </div>
                                                    ) : (
                                                        <div className="h-8 w-8 rounded-md bg-white/20 flex items-center justify-center mr-3">
                                                            <AlertCircle className="h-4 w-4 text-white" />
                                                        </div>
                                                    )}
                                                    <div className="text-left">
                                                        <div className="font-medium">Buat Permintaan Material</div>
                                                        <div className="text-xs text-white/90">Wajib: Belum ada MR</div>
                                                    </div>
                                                </Button>
                                            )
                                        )
                                    )}

                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-11 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-200 dark:hover:border-red-800 hover:text-red-700 dark:hover:text-red-400 transition-all group dark:border-gray-700"
                                        onClick={() => setDeleteDialogOpen(true)}
                                        disabled={!canDelete}
                                    >
                                        <div className="h-8 w-8 rounded-md bg-red-100 dark:bg-red-900/50 flex items-center justify-center mr-3 group-hover:bg-red-200 dark:group-hover:bg-red-800">
                                            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-medium dark:text-gray-200">Hapus PO</div>
                                            <div className="text-xs text-muted-foreground dark:text-gray-400">Hapus permanen</div>
                                        </div>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-11 hover:bg-green-50 dark:hover:bg-green-950/30 hover:border-green-200 dark:hover:border-green-800 hover:text-green-700 dark:hover:text-green-400 transition-all group dark:border-gray-700"
                                        onClick={handleSendEmail}
                                        disabled={isSendingEmail}
                                    >
                                        {isSendingEmail ? (
                                            <>
                                                <div className="h-8 w-8 rounded-md bg-green-100 dark:bg-green-900/50 flex items-center justify-center mr-3">
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 dark:border-green-400 border-t-transparent" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-medium dark:text-gray-200">Mengirim...</div>
                                                    <div className="text-xs text-muted-foreground dark:text-gray-400">Sedang mengirim email</div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="h-8 w-8 rounded-md bg-green-100 dark:bg-green-900/50 flex items-center justify-center mr-3 group-hover:bg-green-200 dark:group-hover:bg-green-800">
                                                    <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-medium dark:text-gray-200">Kirim Email</div>
                                                    <div className="text-xs text-muted-foreground dark:text-gray-400">Ke supplier</div>
                                                </div>
                                            </>
                                        )}
                                    </Button>

                                    {canEdit && (
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start transition-all group dark:border-gray-700",
                                                !purchaseOrder.expectedDeliveryDate
                                                    ? "h-auto py-3 animate-pulse border-amber-500 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-600 dark:bg-amber-900/20 dark:border-amber-500 dark:text-amber-400 ring-2 ring-amber-500/20"
                                                    : "h-11 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-200 dark:hover:border-blue-800 hover:text-blue-700 dark:hover:text-blue-400"
                                            )}
                                            onClick={() => router.push(`/admin-area/logistic/purchasing/update/${poId}`)}
                                        >
                                            <div className={cn(
                                                "rounded-md flex items-center justify-center mr-3 flex-shrink-0 transition-colors",
                                                !purchaseOrder.expectedDeliveryDate
                                                    ? "h-10 w-10 bg-amber-200 text-amber-700 dark:bg-amber-800 dark:text-amber-300"
                                                    : "h-8 w-8 bg-blue-100 dark:bg-blue-900/50 group-hover:bg-blue-200 dark:group-hover:bg-blue-800"
                                            )}>
                                                <Edit className={cn(
                                                    !purchaseOrder.expectedDeliveryDate ? "h-5 w-5" : "h-4 w-4 text-blue-600 dark:text-blue-400"
                                                )} />
                                            </div>
                                            <div className="text-left flex-1">
                                                <div className={cn("font-medium", !purchaseOrder.expectedDeliveryDate ? "text-amber-900 dark:text-amber-200 font-bold" : "dark:text-gray-200")}>
                                                    Edit PO
                                                </div>
                                                <div className={cn("text-xs", !purchaseOrder.expectedDeliveryDate ? "text-amber-700 dark:text-amber-400 font-semibold mt-0.5" : "text-muted-foreground dark:text-gray-400")}>
                                                    {!purchaseOrder.expectedDeliveryDate ? (
                                                        <span className="flex items-center gap-1">
                                                            <AlertCircle className="h-3 w-3" />
                                                            Belum menentukan Estimasi Pengiriman
                                                        </span>
                                                    ) : (
                                                        "Update informasi"
                                                    )}
                                                </div>
                                            </div>
                                        </Button>
                                    )}

                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-11 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:border-purple-200 dark:hover:border-purple-800 hover:text-purple-700 dark:hover:text-purple-400 transition-all group dark:border-gray-700"
                                        onClick={handleDuplicate}
                                    >
                                        <div className="h-8 w-8 rounded-md bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mr-3 group-hover:bg-purple-200 dark:group-hover:bg-purple-800">
                                            <Copy className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-medium dark:text-gray-200">Duplikat PO</div>
                                            <div className="text-xs text-muted-foreground dark:text-gray-400">Buat salinan baru</div>
                                        </div>
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Financial Summary Card */}
                            <Card className="border-0 shadow-xl bg-gradient-to-b from-white to-emerald-50/30 dark:from-gray-800 dark:to-emerald-950/10 dark:border dark:border-emerald-900/30">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg dark:text-gray-100">
                                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                                            <DollarSign className="h-5 w-5 text-white" />
                                        </div>
                                        <span>Ringkasan Keuangan</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between py-2.5 border-b border-emerald-100 dark:border-emerald-900/30">
                                                <span className="text-muted-foreground dark:text-gray-400">Subtotal:</span>
                                                <span className="font-semibold dark:text-gray-200">
                                                    {formatCurrency(purchaseOrder.subtotal || 0)}
                                                </span>
                                            </div>
                                            {purchaseOrder.taxAmount > 0 && (
                                                <div className="flex items-center justify-between py-2.5 border-b border-emerald-100 dark:border-emerald-900/30">
                                                    <span className="text-muted-foreground flex items-center gap-2">
                                                        <Receipt className="h-3.5 w-3.5 text-blue-500" />
                                                        Total Pajak:
                                                    </span>
                                                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                                                        +{formatCurrency(purchaseOrder.taxAmount)}
                                                    </span>
                                                </div>
                                            )}

                                        </div>
                                        <Separator className="my-2" />
                                        <div className="pt-2">
                                            <div className="flex items-center justify-between text-xl font-bold">
                                                <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-green-400">
                                                    Total Akhir:
                                                </span>
                                                <span className="text-2xl bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-green-400">
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
                            <Card className="border-0 shadow-xl bg-gradient-to-b from-white to-purple-50/30 dark:from-gray-800 dark:to-purple-950/10 dark:border dark:border-purple-900/30">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-lg dark:text-gray-100">
                                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                                            <BarChart3 className="h-5 w-5 text-white" />
                                        </div>
                                        <span>Statistik</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-purple-50/50 rounded-lg p-4 text-center dark:bg-purple-900/20">
                                            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                                                {purchaseOrder.lines?.length || 0}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">Total Item</div>
                                        </div>
                                        <div className="bg-blue-50/50 rounded-lg p-4 text-center dark:bg-blue-900/20">
                                            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
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
                <DialogContent className="sm:max-w-md border-0 shadow-2xl dark:bg-gray-800 dark:border dark:border-gray-700">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                                <CheckCircle className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl dark:text-gray-100">Ubah Status PO</DialogTitle>
                                <DialogDescription className="dark:text-gray-400">
                                    Pilih status baru untuk melanjutkan proses
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border dark:border-gray-700">
                            <div>
                                <div className="text-sm text-muted-foreground dark:text-gray-400">Status Saat Ini</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge className={cn("px-3 py-1", statusConfig[purchaseOrder.status].className)}>
                                        <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                                        {statusConfig[purchaseOrder.status].label}
                                    </Badge>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground dark:text-gray-500" />
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
                                                ? "border-blue-300 dark:border-blue-700 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/40 shadow-md"
                                                : "border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "h-12 w-12 rounded-lg flex items-center justify-center shadow-inner",
                                                newStatus === status
                                                    ? "bg-gradient-to-br from-blue-500 to-blue-600"
                                                    : "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800"
                                            )}>
                                                <NextStatusIcon className={cn(
                                                    "h-5 w-5",
                                                    newStatus === status ? "text-white" : iconColor
                                                )} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900 dark:text-gray-100">{statusConfig[status].label}</div>
                                                <div className="text-sm text-muted-foreground mt-1 dark:text-gray-400">
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

            {/* Share Dialog */}
            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
                    {/* Header dengan Aksen Warna Premium */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                                <Share2 className="w-5 h-5 text-white" />
                            </div>
                            <DialogTitle className="text-xl font-semibold tracking-tight">
                                Bagikan Purchase Order
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-blue-100 text-sm leading-relaxed">
                            Berikan akses kolaborasi kepada tim terpilih untuk mempercepat proses belanja di lapangan.
                        </DialogDescription>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-blue-600" />
                                    Pilih Team Pelaksana
                                </Label>
                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Wajib Dipilih</span>
                            </div>

                            {isFetchingTeams ? (
                                <div className="space-y-2">
                                    <div className="h-12 w-full animate-pulse bg-slate-100 rounded-xl border border-slate-200"></div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <Select
                                        value={selectedTeamId || ""}
                                        onValueChange={setSelectedTeamId}
                                    >
                                        <SelectTrigger className="w-full h-14 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all hover:bg-slate-100/80">
                                            <SelectValue placeholder="Cari atau pilih team..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl shadow-xl border-slate-200 max-h-[600px] w-[var(--radix-select-trigger-width)]">
                                            {teams.map((team) => (
                                                <SelectItem
                                                    key={team.id}
                                                    value={team.id}
                                                    textValue={team.namaTeam}
                                                    className="focus:bg-blue-50 rounded-lg mx-1 my-1 cursor-pointer transition-colors"
                                                >
                                                    <div className="flex flex-col items-start py-3 px-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-slate-900">{team.namaTeam}</span>
                                                            {selectedTeamId === team.id && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                                                        </div>
                                                        {team.karyawan && team.karyawan.length > 0 && (
                                                            <div className="flex items-center gap-1.5 mt-1.5">
                                                                <div className="flex -space-x-2 mr-1">
                                                                    <div className="w-5 h-5 rounded-full bg-blue-100 border border-white flex items-center justify-center text-[8px] font-bold text-blue-600">
                                                                        {team.karyawan.length}
                                                                    </div>
                                                                </div>
                                                                <span className="text-[11px] text-slate-500 max-w-[280px] truncate italic">
                                                                    {team.karyawan.map((k: any) => k.karyawan.namaLengkap).join(", ")}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {/* Badge Anggota Team Terpilih */}
                                    {selectedTeamId && (
                                        <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                                            <div className="text-xs font-semibold text-slate-500 mb-2 ml-1">Anggota Team:</div>
                                            <div className="flex flex-wrap gap-2">
                                                {teams.find(t => t.id === selectedTeamId)?.karyawan?.map((member: any) => (
                                                    <div
                                                        key={member.id}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-medium shadow-sm"
                                                    >
                                                        <User className="w-3.5 h-3.5" />
                                                        <span>{member.karyawan?.namaLengkap || "Unknown"}</span>
                                                    </div>
                                                ))}
                                                {(!teams.find(t => t.id === selectedTeamId)?.karyawan?.length) && (
                                                    <span className="text-sm text-slate-400 italic">Tidak ada anggota</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Info Box Tipis */}
                        <div className="flex gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100/50">
                            <Info className="w-5 h-5 text-amber-500 shrink-0" />
                            <p className="text-[11px] text-amber-800/80 leading-relaxed">
                                Setelah disimpan, anggota tim yang terpilih akan menerima notifikasi di dashboard mereka untuk segera memproses item PO ini.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-slate-50/80 border-t border-slate-100 flex gap-3 sm:gap-0">
                        <Button
                            variant="ghost"
                            onClick={() => setShareDialogOpen(false)}
                            className="rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition-all"
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={handleConfirmShare}
                            disabled={isSharing || !selectedTeamId}
                            className={cn(
                                "rounded-xl px-8 font-bold transition-all shadow-lg shadow-blue-500/25",
                                "bg-blue-600 hover:bg-blue-700 active:scale-95"
                            )}
                        >
                            {isSharing ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Menyimpan...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span>Konfirmasi Akses</span>
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Enhanced Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md border-0 shadow-2xl dark:bg-gray-800 dark:border dark:border-gray-700">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg">
                                <Trash2 className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl dark:text-gray-100">Hapus Purchase Order</DialogTitle>
                                <DialogDescription className="dark:text-gray-400">
                                    Tindakan ini tidak dapat dibatalkan
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="py-4">
                        <div className="bg-gradient-to-r from-red-50/50 to-orange-50/50 dark:from-red-950/20 dark:to-orange-950/20 border border-red-200 dark:border-red-900/50 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-red-900 dark:text-red-300">Konfirmasi Penghapusan</p>
                                    <p className="font-mono text-lg mt-2 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent dark:from-red-400 dark:to-orange-400">
                                        {purchaseOrder.poNumber}
                                    </p>
                                    <p className="text-sm text-red-700 dark:text-red-400 mt-3">
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
