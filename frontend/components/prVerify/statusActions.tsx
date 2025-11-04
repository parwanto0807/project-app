import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    FileText,
    Building,
    User,
    Calendar,
    Package,
    AlertCircle,
    CheckCircle,
    ThumbsUp,
    ThumbsDown,
    X
} from "lucide-react";
import { useEffect, useRef } from "react";

// Import type dari @/types/pr
import { PurchaseRequest } from "@/types/prVerify";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

// Enum untuk Source Product Type
enum SourceProductType {
    PEMBELIAN_BARANG = "PEMBELIAN_BARANG",
    PENGAMBILAN_STOK = "PENGAMBILAN_STOK",
    OPERATIONAL = "OPERATIONAL",
    JASA_PEMBELIAN = "JASA_PEMBELIAN",
    JASA_INTERNAL = "JASA_INTERNAL"
}

// Definisikan type untuk status berdasarkan type yang sudah ada
type PurchaseRequestStatus = PurchaseRequest['status'];

// Definisikan props untuk StatusActions
interface StatusActionsProps {
    currentStatus: PurchaseRequestStatus;
    onStatusUpdate: (status: PurchaseRequestStatus) => void;
}

// Komponen StatusActions yang terpisah dengan desain lebih profesional
function StatusActions({ currentStatus, onStatusUpdate }: StatusActionsProps) {
    const validTransitions: Record<PurchaseRequestStatus, PurchaseRequestStatus[]> = {
        DRAFT: ["SUBMITTED"],
        SUBMITTED: ["APPROVED", "REJECTED"],
        APPROVED: ["COMPLETED", "REVISION_NEEDED"],
        REJECTED: ["SUBMITTED"],
        REVISION_NEEDED: ["SUBMITTED"],
        COMPLETED: [],
    };

    const isButtonDisabled = (targetStatus: PurchaseRequestStatus) => {
        return !validTransitions[currentStatus]?.includes(targetStatus);
    };

    const statusConfig = {
        REVISION_NEEDED: {
            label: "Need Revision",
            icon: AlertCircle,
            className: "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 hover:text-amber-800 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-900 dark:hover:text-amber-200 cursor-pointer transition-all duration-200"
        },
        SUBMITTED: {
            label: "Submit",
            icon: CheckCircle,
            className: "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 hover:text-blue-800 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900 dark:hover:text-blue-200 cursor-pointer transition-all duration-200"
        },
        APPROVED: {
            label: "Approve",
            icon: ThumbsUp,
            className: "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700 dark:hover:bg-emerald-900 dark:hover:text-emerald-200 cursor-pointer transition-all duration-200"
        },
        REJECTED: {
            label: "Reject",
            icon: ThumbsDown,
            className: "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 hover:text-rose-800 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-700 dark:hover:bg-rose-900 dark:hover:text-rose-200 cursor-pointer transition-all duration-200"
        },
        COMPLETED: {
            label: "Complete",
            icon: CheckCircle,
            className: "bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100 hover:text-orange-800 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-700 dark:hover:bg-orange-900 dark:hover:text-orange-200 cursor-pointer transition-all duration-200"
        }
    };

    return (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
            {Object.entries(statusConfig).map(([status, config]) => {
                const IconComponent = config.icon;
                return (
                    <Button
                        key={status}
                        onClick={() => onStatusUpdate(status as PurchaseRequestStatus)}
                        variant="outline"
                        disabled={isButtonDisabled(status as PurchaseRequestStatus)}
                        className={`
                            flex items-center gap-2 px-3 sm:px-4 py-2 border-2 font-medium
                            transition-all duration-200 hover:scale-105 disabled:opacity-50 
                            disabled:cursor-not-allowed disabled:hover:scale-100
                            rounded-lg text-xs sm:text-sm
                            ${config.className}
                        `}
                    >
                        <IconComponent className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">{config.label}</span>
                        <span className="sm:hidden">{config.label.split(' ')[0]}</span>
                    </Button>
                );
            })}
        </div>
    );
}

// Definisikan status icons, labels, dan colors
const statusIcons = {
    DRAFT: FileText,
    SUBMITTED: CheckCircle,
    APPROVED: ThumbsUp,
    REJECTED: ThumbsDown,
    REVISION_NEEDED: AlertCircle,
    COMPLETED: CheckCircle,
};

const statusLabels = {
    DRAFT: "Draft",
    SUBMITTED: "Submitted",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    REVISION_NEEDED: "Revision Needed",
    COMPLETED: "Completed",
};

const premiumStatusColors = {
    DRAFT: "bg-gray-200 text-gray-900 border-gray-400 font-bold",
    SUBMITTED: "bg-blue-200 text-blue-900 border-blue-500 font-bold",
    APPROVED: "bg-green-200 text-green-900 border-green-500 font-bold",
    REJECTED: "bg-red-200 text-red-900 border-red-500 font-bold",
    REVISION_NEEDED: "bg-yellow-200 text-yellow-900 border-yellow-500 font-bold",
    COMPLETED: "bg-orange-200 text-orange-900 border-orange-500 font-bold",
};

// Helper functions
const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

// Helper untuk mendapatkan label source product
const getSourceProductLabel = (source: SourceProductType): string => {
    const sourceLabels = {
        [SourceProductType.PEMBELIAN_BARANG]: "Pembelian Barang",
        [SourceProductType.PENGAMBILAN_STOK]: "Pengambilan Stok",
        [SourceProductType.OPERATIONAL]: "Operasional",
        [SourceProductType.JASA_PEMBELIAN]: "Jasa Pembelian",
        [SourceProductType.JASA_INTERNAL]: "Jasa Internal",
    };
    return sourceLabels[source] || source;
};

// Props untuk komponen utama
interface PurchaseRequestSheetProps {
    detailSheetOpen: boolean;
    setDetailSheetOpen: (open: boolean) => void;
    selectedPurchaseRequest: PurchaseRequest | null;
    onStatusUpdate: (id: string, status: PurchaseRequestStatus) => void;
}

export function PurchaseRequestSheet({
    detailSheetOpen,
    setDetailSheetOpen,
    selectedPurchaseRequest,
    onStatusUpdate
}: PurchaseRequestSheetProps) {
    const contentRef = useRef<HTMLDivElement>(null);

    console.log(selectedPurchaseRequest);

    // Fungsi untuk menghitung summary
    const calculateSummary = () => {
        if (!selectedPurchaseRequest?.details) {
            return { totalBiaya: 0, totalHPP: 0, grandTotal: 0 };
        }

        let totalBiaya = 0;
        let totalHPP = 0;

        selectedPurchaseRequest.details.forEach((detail) => {
            const subtotal = Number(detail.estimasiTotalHarga || 0);

            switch (detail.sourceProduct) {
                case SourceProductType.PEMBELIAN_BARANG:
                case SourceProductType.OPERATIONAL:
                case SourceProductType.JASA_PEMBELIAN:
                    totalBiaya += subtotal;
                    break;
                case SourceProductType.PENGAMBILAN_STOK:
                case SourceProductType.JASA_INTERNAL:
                    totalHPP += subtotal;
                    break;
                default:
                    totalBiaya += subtotal;
            }
        });

        const grandTotal = totalBiaya + totalHPP;

        return { totalBiaya, totalHPP, grandTotal };
    };

    // Gunakan di dalam komponen
    const { totalBiaya, totalHPP, grandTotal } = calculateSummary();

    const handleStatusUpdateFromActions = (status: PurchaseRequestStatus) => {
        if (selectedPurchaseRequest) {
            onStatusUpdate(selectedPurchaseRequest.id, status);
        }
    };

    // Reset scroll ketika sheet dibuka
    useEffect(() => {
        if (detailSheetOpen && contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    }, [detailSheetOpen, selectedPurchaseRequest]);


    return (
        <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
            <SheetContent
                side="bottom"
                className="overflow-y-auto sm:max-w-4xl lg:max-w-5xl ml-auto rounded-t-2xl rounded-b-none sm:mb-4 w-full sm:w-auto sm:mr-36 dark:bg-slate-800 md:px-2 max-h-[95vh]"
            >
                <div className="flex flex-col h-full px-2 sm:px-2">
                    {/* Header dengan close button mobile-friendly */}
                    <SheetHeader className="border-b pb-4 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <SheetTitle className="text-lg sm:text-xl font-bold truncate">
                                        Purchase Request Details
                                    </SheetTitle>
                                    <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">
                                        {selectedPurchaseRequest
                                            ? "Detailed information about the purchase request"
                                            : "Loading purchase request details..."
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* Status Badge dengan layout mobile-friendly */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {selectedPurchaseRequest && (
                                    <Badge
                                        variant="outline"
                                        className={`
                                            ${premiumStatusColors[selectedPurchaseRequest.status]}
                                            border font-semibold text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full 
                                            flex items-center gap-1.5 backdrop-blur-sm 
                                            transition-all duration-200 hover:scale-105
                                            shadow-sm hover:shadow-md whitespace-nowrap
                                        `}
                                    >
                                        {(() => {
                                            const IconComponent = statusIcons[selectedPurchaseRequest.status];
                                            return <IconComponent className="h-3 w-3 sm:h-3.5 sm:w-3.5" />;
                                        })()}
                                        <span className="hidden xs:inline">
                                            {statusLabels[selectedPurchaseRequest.status]}
                                        </span>
                                        <span className="xs:hidden">
                                            {statusLabels[selectedPurchaseRequest.status].split(' ')[0]}
                                        </span>
                                    </Badge>
                                )}

                                {/* Close button untuk mobile */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="sm:hidden h-8 w-8 rounded-full"
                                    onClick={() => setDetailSheetOpen(false)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </SheetHeader>

                    {/* Main Content Area dengan Scroll */}
                    <div
                        ref={contentRef}
                        className="flex-1 overflow-y-auto py-4 sm:py-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400"
                    >
                        {selectedPurchaseRequest ? (
                            <div className="space-y-4 sm:space-y-6">
                                {/* Header Card dengan layout mobile-friendly */}
                                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
                                    <CardContent className="p-4 sm:p-6">
                                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
                                                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                                                            {selectedPurchaseRequest.nomorPr}
                                                        </h2>
                                                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                                            Purchase Request Number
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 text-sm">
                                                    <div>
                                                        <p className="text-xs text-gray-500 font-medium">Request Date</p>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {formatDate(selectedPurchaseRequest.tanggalPr)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 font-medium">SPK Number</p>
                                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                                            {selectedPurchaseRequest.spk?.spkNumber || selectedPurchaseRequest.spkId}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 font-medium">Keterangan</p>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {selectedPurchaseRequest.keterangan}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border flex-shrink-0 w-full sm:w-auto">
                                                <div className="text-center">
                                                    <p className="text-xs text-gray-500 font-medium mb-2">Total Pengajuan Biaya</p>
                                                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 mb-1">
                                                        {formatCurrency(totalBiaya)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {selectedPurchaseRequest.details?.length || 0} items
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                                    {/* Left Column - Information */}
                                    <div className="lg:w-1/3 space-y-4 sm:space-y-6">
                                        {/* Project Information Card */}
                                        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                                    <Building className="h-4 w-4 text-green-600" />
                                                    Project Information
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3 sm:space-y-4">
                                                <div className="space-y-1">
                                                    <p className="text-xs text-gray-500 font-medium">Project Name</p>
                                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                                        {selectedPurchaseRequest.project?.name || selectedPurchaseRequest.projectId}
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs text-gray-500 font-medium">Requested By</p>
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1 bg-purple-50 rounded flex-shrink-0">
                                                            <User className="h-3 w-3 text-purple-600" />
                                                        </div>
                                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                                            {selectedPurchaseRequest.karyawan?.namaLengkap || selectedPurchaseRequest.karyawanId}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Timeline Card */}
                                        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-orange-600" />
                                                    Timeline
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-xs text-gray-500">Request Date</p>
                                                        <p className="text-xs font-semibold text-gray-900">
                                                            {formatDate(selectedPurchaseRequest.tanggalPr)}
                                                        </p>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-xs text-gray-500">Last Updated</p>
                                                        <p className="text-xs font-semibold text-gray-900">
                                                            {formatDate(selectedPurchaseRequest.updatedAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Right Column - Items Table */}
                                    <div className="lg:w-2/3">
                                        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm h-full">
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                                    <Package className="h-4 w-4 text-blue-600" />
                                                    Requested Items ({selectedPurchaseRequest.details?.length || 0})
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-0">
                                                <div className="rounded-lg border border-gray-200 overflow-hidden">
                                                    {/* Table Header - Desktop */}
                                                    <div className="hidden sm:grid sm:grid-cols-12 bg-gray-50 text-xs font-semibold px-4 py-3 text-gray-700 border-b border-gray-200">
                                                        <div className="col-span-1 text-center">No</div>
                                                        <div className="col-span-3 pl-2">Item Description</div>
                                                        <div className="col-span-2 text-center">Source</div>
                                                        <div className="col-span-2 text-center">Quantity</div>
                                                        <div className="col-span-2 text-right pr-4">Unit Price</div>
                                                        <div className="col-span-2 text-right pr-4">Total</div>
                                                    </div>

                                                    {/* Mobile Table Header */}
                                                    <div className="sm:hidden bg-gray-50 text-xs font-semibold px-3 py-2 text-gray-700 border-b border-gray-200">
                                                        Items List
                                                    </div>

                                                    {/* Table Body dengan Scroll */}
                                                    {selectedPurchaseRequest.details && selectedPurchaseRequest.details.length > 0 ? (
                                                        <>
                                                            <div className="max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                                                {selectedPurchaseRequest.details.map((detail, index) => (
                                                                    <div
                                                                        key={detail.id}
                                                                        className="border-b border-gray-100 last:border-b-0"
                                                                    >
                                                                        {/* Mobile View */}
                                                                        <div className="sm:hidden p-3 hover:bg-gray-50/50 transition-colors">
                                                                            <div className="flex justify-between items-start mb-2">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                                                        {index + 1}
                                                                                    </span>
                                                                                    <span className="font-medium text-gray-900 text-xs line-clamp-2">
                                                                                        {detail.product.name || "Unnamed Item"}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="space-y-2">
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-xs text-gray-500">Source</span>
                                                                                    <Badge
                                                                                        variant="outline"
                                                                                        className="text-xs"
                                                                                    >
                                                                                        {getSourceProductLabel(detail.sourceProduct as SourceProductType)}
                                                                                    </Badge>
                                                                                </div>
                                                                                <div className="flex justify-between items-center">
                                                                                    <div className="text-xs text-gray-700">
                                                                                        <span className="font-semibold">{detail.jumlah}</span>
                                                                                        <span className="text-gray-500 ml-1">{detail.satuan}</span>
                                                                                    </div>
                                                                                    <div className="text-right">
                                                                                        <div className="text-xs text-gray-700">
                                                                                            {formatCurrency(detail.estimasiHargaSatuan)}
                                                                                        </div>
                                                                                        <div className="text-xs font-semibold text-green-600">
                                                                                            {formatCurrency(detail.estimasiTotalHarga)}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Desktop View - Fixed */}
                                                                        <div className="hidden sm:grid sm:grid-cols-12 w-full items-center px-4 py-3 hover:bg-gray-50/50 transition-colors">
                                                                            <div className="col-span-1 text-center text-xs font-medium text-gray-500">
                                                                                {index + 1}
                                                                            </div>
                                                                            <div className="col-span-3 text-sm font-medium text-gray-900 pl-2 pr-2 truncate">
                                                                                <TooltipProvider>
                                                                                    <Tooltip>
                                                                                        <TooltipTrigger asChild>
                                                                                            <span className="cursor-default truncate block hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200">
                                                                                                {detail.product?.name || "Unnamed Item"}
                                                                                            </span>
                                                                                        </TooltipTrigger>

                                                                                        <TooltipContent
                                                                                            className="
        rounded-2xl 
        shadow-xl 
        bg-gradient-to-br from-emerald-50 to-cyan-50 
        dark:from-emerald-950/80 dark:to-cyan-950/80 
        backdrop-blur-xl 
        border border-white/20 
        dark:border-emerald-500/20
        text-[13px]
        p-3
      "
                                                                                        >
                                                                                            <p className="max-w-xs text-emerald-900 dark:text-emerald-100 font-semibold">
                                                                                                {detail.product?.name || "Unnamed Item"}
                                                                                            </p>
                                                                                        </TooltipContent>
                                                                                    </Tooltip>
                                                                                </TooltipProvider>
                                                                            </div>
                                                                            <div className="col-span-2 text-center">
                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className={`
                                        text-xs
                                        ${detail.sourceProduct === SourceProductType.PEMBELIAN_BARANG ||
                                                                                            detail.sourceProduct === SourceProductType.OPERATIONAL ||
                                                                                            detail.sourceProduct === SourceProductType.JASA_PEMBELIAN
                                                                                            ? "bg-blue-50 text-blue-700 border-blue-200"
                                                                                            : "bg-green-50 text-green-700 border-green-200"
                                                                                        }
                                    `}
                                                                                >
                                                                                    {getSourceProductLabel(detail.sourceProduct as SourceProductType)}
                                                                                </Badge>
                                                                            </div>
                                                                            <div className="col-span-2 text-center text-sm text-gray-700">
                                                                                <span className="font-semibold">{detail.jumlah}</span>
                                                                                <span className="text-xs text-gray-500 ml-1">{detail.satuan}</span>
                                                                            </div>
                                                                            <div className="col-span-2 text-right text-sm text-gray-700 pr-4">
                                                                                {formatCurrency(detail.estimasiHargaSatuan)}
                                                                            </div>
                                                                            <div className="col-span-2 text-right text-sm font-semibold text-green-600 pr-4">
                                                                                {formatCurrency(detail.estimasiTotalHarga)}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* Summary Section */}
                                                            {/* Summary Section */}
                                                            <div className="mt-4 border-t pt-3 space-y-2 text-sm bg-gray-50/50 p-4 text-black">
                                                                <div className="flex justify-between">
                                                                    <span className="font-medium">💰 Total Pengajuan Biaya :</span>
                                                                    <span className="font-semibold">
                                                                        Rp. {formatCurrency(totalBiaya)}
                                                                    </span>
                                                                </div>

                                                                <div className="flex justify-between">
                                                                    <span className="font-medium">🏭 Total biaya tidak diajukan :</span>
                                                                    <span className="font-semibold">
                                                                        Rp. {formatCurrency(totalHPP)}
                                                                    </span>
                                                                </div>

                                                                <div className="flex justify-between border-t pt-2 text-base">
                                                                    <span className="font-bold">🧾 Grand Total HPP :</span>
                                                                    <span className="font-bold">
                                                                        Rp. {formatCurrency(grandTotal)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="p-6 sm:p-8 text-center">
                                                            <Package className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3" />
                                                            <p className="text-gray-500 font-medium text-sm">No items available</p>
                                                            <p className="text-xs sm:text-sm text-gray-400 mt-1">
                                                                There are no items in this purchase request
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center py-8 sm:py-12">
                                <div className="text-center">
                                    <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 font-medium text-sm sm:text-base">No purchase request selected</p>
                                    <p className="text-xs sm:text-sm text-gray-400 mt-1">
                                        Please select a purchase request to view details
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons - Sticky di bagian bawah untuk mobile */}
                    {selectedPurchaseRequest && (
                        <div className="border-t bg-white py-4 dark:py-4 sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 pb-4 sm:pb-0 -mb-4 sm:mb-0 rounded-lg mt-auto flex-shrink-0">
                            <StatusActions
                                currentStatus={selectedPurchaseRequest.status}
                                onStatusUpdate={handleStatusUpdateFromActions}
                            />
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}