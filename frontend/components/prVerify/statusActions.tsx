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
    X,
    ChevronDown,
    Info,
    Check,
    Trash2
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { api } from "@/lib/http";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import toast, { Toaster } from 'react-hot-toast';

// Import type dari @/types/pr
import { PurchaseRequest, PurchaseRequestDetail } from "@/types/pr";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

enum SourceProductType {
    PEMBELIAN_BARANG = "PEMBELIAN_BARANG",
    PENGAMBILAN_STOK = "PENGAMBILAN_STOK",
    OPERATIONAL = "OPERATIONAL",
    JASA_PEMBELIAN = "JASA_PEMBELIAN",
    JASA_INTERNAL = "JASA_INTERNAL"
}

type PurchaseRequestDetailWithRelations = PurchaseRequestDetail & {
    product?: {
        id: string;
        name: string;
        code?: string;
        description?: string | null;
    } | null;
};


// Definisikan type untuk status berdasarkan type yang sudah ada
type PurchaseRequestStatus = PurchaseRequest['status'];

// Definisikan props untuk StatusActions
interface StatusActionsProps {
    currentStatus: PurchaseRequestStatus;
    onStatusUpdate: (status: PurchaseRequestStatus, catatan?: string, warehouseAllocations?: Record<string, any[]>) => void;
}

// Komponen StatusActions yang terpisah dengan desain lebih profesional
function StatusActions({ currentStatus, onStatusUpdate }: StatusActionsProps) {
    const validTransitions: Record<PurchaseRequestStatus, PurchaseRequestStatus[]> = {
        DRAFT: ["SUBMITTED"],
        SUBMITTED: ["APPROVED", "REJECTED", "REVISION_NEEDED"],
        APPROVED: ["COMPLETED"],
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

            {/* Cancel Approve Button - Only visible when status is APPROVED */}
            {currentStatus === 'APPROVED' && (
                <Button
                    onClick={() => {
                        if (window.confirm('Apakah Anda yakin ingin membatalkan approval? Stock yang sudah di-booking akan dikembalikan.')) {
                            onStatusUpdate('SUBMITTED', 'Approval dibatalkan');
                        }
                    }}
                    variant="outline"
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 border-2 font-medium
                        transition-all duration-200 hover:scale-105
                        rounded-lg text-xs sm:text-sm
                        bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 hover:text-amber-800 
                        dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-900 dark:hover:text-amber-200"
                >
                    <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Cancel Approve</span>
                    <span className="sm:hidden">Cancel</span>
                </Button>
            )}
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
    onStatusUpdate: (id: string, status: PurchaseRequestStatus, catatan?: string, warehouseAllocations?: Record<string, any[]>) => void;
    onDeleteItem?: (detailId: string) => void;
}

export function PurchaseRequestSheet({
    detailSheetOpen,
    setDetailSheetOpen,
    selectedPurchaseRequest,
    onStatusUpdate,
    onDeleteItem
}: PurchaseRequestSheetProps): React.ReactElement {
    const contentRef = useRef<HTMLDivElement>(null);

    // State for stock data
    const [stockData, setStockData] = useState<Record<string, { available: number, breakdown: { warehouseId: string; warehouseName: string; stock: number; price: number }[] }>>({});

    // State for selected warehouses per item (checklist)
    const [warehouseSelections, setWarehouseSelections] = useState<Record<string, string[]>>({});

    // State for source product changes (when stock is 0, allow changing from PENGAMBILAN_STOK to PEMBELIAN_BARANG)
    const [sourceProductChanges, setSourceProductChanges] = useState<Record<string, SourceProductType>>({});

    // State for auto-split items (when stock is insufficient, create additional item for shortage)
    const [splitItems, setSplitItems] = useState<Record<string, PurchaseRequestDetailWithRelations>>({});

    // State for manual overrides of split item quantities
    const [splitQuantityOverrides, setSplitQuantityOverrides] = useState<Record<string, number>>({});

    // Derived details with live price calculation (replacing localDetails state)
    const localDetails = React.useMemo(() => {
        if (!selectedPurchaseRequest?.details) return [];

        const newSplitItems: Record<string, PurchaseRequestDetailWithRelations> = {};

        const processedDetails = selectedPurchaseRequest.details.map(detail => {
            const detailId = detail.id || '';
            const selections = warehouseSelections[detailId];
            const detailStock = stockData[detailId];

            // Use changed source if exists, otherwise use original
            const effectiveSource = sourceProductChanges[detailId] || detail.sourceProduct;

            // Only recalculate if we have selections and stock data for this stok pengambilan item
            if (
                effectiveSource === SourceProductType.PENGAMBILAN_STOK &&
                selections &&
                selections.length > 0 &&
                detailStock
            ) {
                let remainingNeeded = Number(detail.jumlah);
                let totalCost = 0;
                let totalAllocated = 0;

                // Prioritize selections based on the order in breakdown (availability)
                const sortedSelections = detailStock.breakdown.filter(wh => selections.includes(wh.warehouseId));

                for (const wh of sortedSelections) {
                    if (remainingNeeded <= 0) break;

                    const takeQty = Math.min(remainingNeeded, wh.stock);
                    if (takeQty > 0) {
                        // wh.price corresponds to pricePerUnit from StockDetail (fetched by backend)
                        totalCost += takeQty * (wh.price || 0);
                        totalAllocated += takeQty;
                        remainingNeeded -= takeQty;
                    }
                }

                // Check if stock is insufficient - create split item for shortage
                if (totalAllocated > 0 && totalAllocated < Number(detail.jumlah)) {
                    const shortage = Number(detail.jumlah) - totalAllocated;
                    const splitItemId = `split-${detailId}`;

                    // Check if user has manually overridden the split quantity
                    const splitQty = splitQuantityOverrides[detailId] !== undefined
                        ? splitQuantityOverrides[detailId]
                        : shortage;

                    // IMPORTANT: Parent quantity should ALWAYS equal totalAllocated (available stock)
                    // It should NOT change when user edits split quantity
                    const parentQty = totalAllocated;

                    // Calculate cost for parent item based on available stock
                    const newUnitPrice = parentQty > 0 ? totalCost / parentQty : 0;

                    // Create split item for shortage (Pembelian Barang)
                    newSplitItems[detailId] = {
                        ...detail,
                        id: splitItemId,
                        jumlah: splitQty,
                        sourceProduct: SourceProductType.PEMBELIAN_BARANG,
                        estimasiHargaSatuan: detail.estimasiHargaSatuan || 0,
                        estimasiTotalHarga: (detail.estimasiHargaSatuan || 0) * splitQty,
                    } as PurchaseRequestDetailWithRelations;

                    // Return original item with quantity = totalAllocated (available stock)
                    return {
                        ...detail,
                        jumlah: parentQty,
                        estimasiHargaSatuan: newUnitPrice,
                        estimasiTotalHarga: totalCost
                    } as PurchaseRequestDetailWithRelations;
                } else if (totalAllocated > 0) {
                    // Stock is sufficient
                    const newUnitPrice = totalCost / totalAllocated;
                    return {
                        ...detail,
                        estimasiHargaSatuan: newUnitPrice,
                        estimasiTotalHarga: totalCost
                    } as PurchaseRequestDetailWithRelations;
                }
            } else if (
                effectiveSource === SourceProductType.PENGAMBILAN_STOK &&
                (!selections || selections.length === 0)
            ) {
                // If no warehouse selected, keep the original values from database
                return {
                    ...detail,
                    estimasiHargaSatuan: detail.estimasiHargaSatuan || 0,
                    estimasiTotalHarga: detail.estimasiTotalHarga || 0
                } as PurchaseRequestDetailWithRelations;
            }

            return detail as PurchaseRequestDetailWithRelations;
        });

        // Update split items state
        setSplitItems(newSplitItems);

        // Combine original items with split items
        const allDetails = [...processedDetails];
        Object.entries(newSplitItems).forEach(([parentId, splitItem]) => {
            // Insert split item right after its parent
            const parentIndex = allDetails.findIndex(d => d.id === parentId);
            if (parentIndex !== -1) {
                allDetails.splice(parentIndex + 1, 0, splitItem);
            }
        });

        return allDetails;
    }, [selectedPurchaseRequest, warehouseSelections, stockData, sourceProductChanges, splitQuantityOverrides]);

    // Fungsi untuk menghitung summary
    const calculateSummary = () => {
        const detailsToUse = localDetails.length > 0 ? localDetails : (selectedPurchaseRequest?.details || []);

        if (detailsToUse.length === 0) {
            return { totalBiaya: 0, totalHPP: 0, grandTotal: 0 };
        }

        let totalBiaya = 0;
        let totalHPP = 0;

        detailsToUse.forEach((detail) => {
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


    const handleToggleWarehouse = (detailId: string, warehouseId: string) => {
        setWarehouseSelections(prev => {
            const currentSelections = prev[detailId] || [];
            let newSelections;
            if (currentSelections.includes(warehouseId)) {
                newSelections = currentSelections.filter(id => id !== warehouseId);
            } else {
                newSelections = [...currentSelections, warehouseId];
            }

            return { ...prev, [detailId]: newSelections };
        });
    };

    const handleSourceProductChange = (detailId: string, newSource: SourceProductType) => {
        setSourceProductChanges(prev => ({
            ...prev,
            [detailId]: newSource
        }));

        // Clear warehouse selections if changing away from PENGAMBILAN_STOK
        if (newSource !== SourceProductType.PENGAMBILAN_STOK) {
            setWarehouseSelections(prev => ({
                ...prev,
                [detailId]: []
            }));
        }
    };



    // Fetch stock data when selectedPurchaseRequest changes
    useEffect(() => {
        const fetchStockData = async () => {
            if (selectedPurchaseRequest?.details) {
                const newStockData: Record<string, { available: number, breakdown: any[] }> = {};

                await Promise.all(selectedPurchaseRequest.details.map(async (detail) => {
                    if (detail.productId) {
                        try {
                            const response = await api.get('/api/inventory/latest-stock', {
                                params: { productId: detail.productId, detail: 'true' }
                            });

                            if (response.data.success && detail.id) {
                                newStockData[detail.id] = {
                                    available: response.data.data,
                                    breakdown: response.data.breakdown || []
                                };
                            }
                        } catch (error) {
                            console.error("Error fetching stock for item:", detail.productId, error);
                        }
                    }
                }));

                setStockData(newStockData);
            }
        };

        if (selectedPurchaseRequest) {
            fetchStockData();
        } else {
            setStockData({});
        }
    }, [selectedPurchaseRequest]);

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
            <Toaster />
            <SheetContent
                side="bottom"
                className="overflow-y-auto sm:max-w-5xl lg:max-w-6xl ml-auto rounded-t-2xl rounded-b-none sm:mb-4 w-full sm:w-auto sm:mr-36 dark:bg-slate-800 md:px-2 max-h-[95vh]"
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
                                        ${premiumStatusColors[selectedPurchaseRequest.status as keyof typeof premiumStatusColors]}
                                        border font-semibold text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full 
                                        flex items-center gap-1.5 backdrop-blur-sm 
                                        transition-all duration-200 hover:scale-105
                                        shadow-sm hover:shadow-md whitespace-nowrap
                                    `}
                                    >
                                        {(() => {
                                            const IconComponent = statusIcons[selectedPurchaseRequest.status as keyof typeof statusIcons];
                                            return <IconComponent className="h-3 w-3 sm:h-3.5 sm:w-3.5" />;
                                        })()}
                                        <span className="hidden xs:inline">
                                            {statusLabels[selectedPurchaseRequest.status as keyof typeof statusLabels]}
                                        </span>
                                        <span className="xs:hidden">
                                            {statusLabels[selectedPurchaseRequest.status as keyof typeof statusLabels].split(' ')[0]}
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
                                    <div className="lg:w-1/5 space-y-4 sm:space-y-6">
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
                                                    <p className="text-sm font-semibold text-gray-900 text-wrap">
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
                                    <div className="lg:w-4/3">
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
                                                        <div className="col-span-2 pl-2">Item Description</div>
                                                        <div className="col-span-2 text-center">Source</div>
                                                        <div className="col-span-1 text-center">Availbl. Stock</div>
                                                        <div className="col-span-1 text-center">Qty</div>
                                                        <div className="col-span-2 text-right pr-4">Unit Price</div>
                                                        <div className="col-span-2 text-right pr-4">Total</div>
                                                        <div className="col-span-1 text-center">Action</div>
                                                    </div>

                                                    {/* Mobile Table Header */}
                                                    <div className="sm:hidden bg-gray-50 text-xs font-semibold px-3 py-2 text-gray-700 border-b border-gray-200">
                                                        Items List
                                                    </div>

                                                    {/* Table Body dengan Scroll */}
                                                    {/* Table Body dengan Scroll */}
                                                    {localDetails && localDetails.length > 0 ? (
                                                        <>
                                                            <div className="max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                                                {localDetails.map((detail, index) => (
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
                                                                                    <span className="font-medium text-gray-900 text-xs line-clamp-2 flex items-center gap-2">
                                                                                        {detail.product?.name || "Unnamed Item"}
                                                                                        {detail.id?.startsWith('split-') && (
                                                                                            <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200 px-1 py-0">
                                                                                                Auto-Split
                                                                                            </Badge>
                                                                                        )}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="space-y-2">
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-xs text-gray-500">Source</span>
                                                                                    <div className="flex flex-col gap-2">
                                                                                        <Badge
                                                                                            variant="outline"
                                                                                            className="text-xs w-fit"
                                                                                        >
                                                                                            {getSourceProductLabel(detail.sourceProduct as SourceProductType)}
                                                                                        </Badge>

                                                                                        {/* Mobile Warehouse Selection */}
                                                                                        {(detail.sourceProduct === SourceProductType.PENGAMBILAN_STOK && stockData[detail.id || '']?.breakdown?.length > 0) && (
                                                                                            <Dialog>
                                                                                                <DialogTrigger asChild>
                                                                                                    <Button variant="outline" size="sm" className="h-8 text-xs flex items-center gap-1 w-full justify-between">
                                                                                                        <span>
                                                                                                            {warehouseSelections[detail.id || '']?.length
                                                                                                                ? `${warehouseSelections[detail.id || '']?.length} WH Selected`
                                                                                                                : "Select Stock"}
                                                                                                        </span>
                                                                                                        <ChevronDown className="h-3 w-3 opacity-50" />
                                                                                                    </Button>
                                                                                                </DialogTrigger>
                                                                                                <DialogContent className="w-[90%] max-w-[400px] p-0 gap-0">
                                                                                                    <div className="p-4 bg-gray-50 border-b rounded-t-lg">
                                                                                                        <DialogHeader>
                                                                                                            <DialogTitle className="text-base font-semibold">Select Warehouse</DialogTitle>
                                                                                                            <DialogDescription className="text-xs text-gray-500">
                                                                                                                Pick source warehouses for this item
                                                                                                            </DialogDescription>
                                                                                                        </DialogHeader>
                                                                                                    </div>
                                                                                                    <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                                                                                                        {stockData[detail.id || '']?.breakdown.map((wh) => (
                                                                                                            <div
                                                                                                                key={wh.warehouseId}
                                                                                                                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                                                                                                onClick={() => handleToggleWarehouse(detail.id || '', wh.warehouseId)}
                                                                                                            >
                                                                                                                <Checkbox
                                                                                                                    checked={(warehouseSelections[detail.id || ''] || []).includes(wh.warehouseId)}
                                                                                                                    onCheckedChange={() => handleToggleWarehouse(detail.id || '', wh.warehouseId)}
                                                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                                                    id={`mobile-${detail.id}-${wh.warehouseId}`}
                                                                                                                    className="mt-1"
                                                                                                                />
                                                                                                                <div className="grid gap-1 w-full">
                                                                                                                    <label
                                                                                                                        htmlFor={`mobile-${detail.id}-${wh.warehouseId}`}
                                                                                                                        className="text-sm font-medium leading-none cursor-pointer"
                                                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                                                    >
                                                                                                                        {wh.warehouseName}
                                                                                                                    </label>
                                                                                                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                                                                                                        <span>Stock: {wh.stock}</span>
                                                                                                                        {((warehouseSelections[detail.id || ''] || []).includes(wh.warehouseId)) && (
                                                                                                                            <Check className="h-3 w-3 text-green-600" />
                                                                                                                        )}
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                    <div className="p-4 border-t bg-gray-50 rounded-b-lg">
                                                                                                        <div className="flex justify-between items-center text-sm font-medium">
                                                                                                            <span>Total Selected Stock:</span>
                                                                                                            <span className="text-green-600 font-bold">
                                                                                                                {stockData[detail.id || '']?.breakdown
                                                                                                                    .filter(wh => (warehouseSelections[detail.id || ''] || []).includes(wh.warehouseId))
                                                                                                                    .reduce((sum, wh) => sum + wh.stock, 0)
                                                                                                                }
                                                                                                            </span>
                                                                                                        </div>
                                                                                                        <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                                                                                                            <span>Required:</span>
                                                                                                            <span>{detail.jumlah} {detail.satuan}</span>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </DialogContent>
                                                                                            </Dialog>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex justify-between items-center">
                                                                                    <div className="text-xs text-gray-700">
                                                                                        {detail.id?.startsWith('split-') ? (
                                                                                            <div className="flex items-center gap-1">
                                                                                                <Input
                                                                                                    type="number"
                                                                                                    value={detail.jumlah || ''}
                                                                                                    onChange={(e) => {
                                                                                                        const newQty = parseFloat(e.target.value);
                                                                                                        const parentId = detail.id?.replace('split-', '') || '';
                                                                                                        const originalDetail = selectedPurchaseRequest?.details.find(d => d.id === parentId);

                                                                                                        if (!isNaN(newQty) && newQty > 0) {
                                                                                                            setSplitQuantityOverrides(prev => ({
                                                                                                                ...prev,
                                                                                                                [parentId]: newQty
                                                                                                            }));
                                                                                                        }
                                                                                                    }}
                                                                                                    onKeyDown={(e) => {
                                                                                                        // Prevent arrow keys from affecting parent elements
                                                                                                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                                                                                            e.stopPropagation();
                                                                                                        }
                                                                                                    }}
                                                                                                    className="h-7 w-24 text-center text-xs font-semibold border-blue-300 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                                                />
                                                                                                <span className="text-gray-500">{detail.satuan}</span>
                                                                                            </div>
                                                                                        ) : (
                                                                                            <>
                                                                                                <span className="font-semibold">{detail.jumlah}</span>
                                                                                                <span className="text-gray-500 ml-1">{detail.satuan}</span>
                                                                                            </>
                                                                                        )}
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
                                                                            {/* Mobile Actions */}
                                                                            <div className="mt-2 flex justify-end gap-2 border-t pt-2 border-gray-100">
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-7 px-3 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded-full"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        if (onDeleteItem && detail.id) {
                                                                                            // Add confirmation
                                                                                            if (window.confirm('Are you sure you want to delete this item?')) {
                                                                                                onDeleteItem(detail.id);
                                                                                            }
                                                                                        }
                                                                                    }}
                                                                                    disabled={!detail.id || detail.id.startsWith('split-') || selectedPurchaseRequest.status === 'APPROVED' || selectedPurchaseRequest.status === 'COMPLETED'}
                                                                                >
                                                                                    <Trash2 className="h-3 w-3 mr-1" />
                                                                                    Delete
                                                                                </Button>
                                                                            </div>
                                                                        </div>

                                                                        {/* Desktop View - Fixed */}
                                                                        <div className={`hidden sm:grid sm:grid-cols-12 w-full items-center px-4 py-3 hover:bg-gray-50/50 transition-colors ${detail.id?.startsWith('split-') ? 'bg-blue-50/30 border-l-4 border-blue-400' : ''}`}>
                                                                            <div className="col-span-1 text-center text-xs font-medium text-gray-500">
                                                                                {index + 1}
                                                                            </div>
                                                                            <div className="col-span-2 text-sm font-medium text-gray-900 pl-2 pr-2 truncate">
                                                                                <TooltipProvider>
                                                                                    <Tooltip>
                                                                                        <TooltipTrigger asChild>
                                                                                            <div className="flex items-center gap-2">
                                                                                                <span className="cursor-default truncate block hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200">
                                                                                                    {detail.product?.name || "Unnamed Item"}
                                                                                                </span>
                                                                                                {/* Show badge if this is a split item */}
                                                                                                {detail.id?.startsWith('split-') && (
                                                                                                    <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 px-1 py-0">
                                                                                                        Auto-Split
                                                                                                    </Badge>
                                                                                                )}
                                                                                            </div>
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
                                                                                {/* Show dropdown if stock is 0 and source is PENGAMBILAN_STOK */}
                                                                                {(detail.sourceProduct === SourceProductType.PENGAMBILAN_STOK && stockData[detail.id || '']?.available === 0) ? (
                                                                                    <Select
                                                                                        value={sourceProductChanges[detail.id || ''] || detail.sourceProduct}
                                                                                        onValueChange={(value) => handleSourceProductChange(detail.id || '', value as SourceProductType)}
                                                                                        disabled={selectedPurchaseRequest?.status === 'APPROVED' ||
                                                                                            selectedPurchaseRequest?.status === 'COMPLETED' ||
                                                                                            selectedPurchaseRequest?.status === 'REJECTED'}
                                                                                    >
                                                                                        <SelectTrigger className="h-auto p-1 border-orange-300 bg-orange-50 hover:bg-orange-100">
                                                                                            <SelectValue>
                                                                                                <Badge
                                                                                                    variant="outline"
                                                                                                    className="text-xs bg-orange-50 text-orange-700 border-orange-200 pointer-events-none"
                                                                                                >
                                                                                                    {getSourceProductLabel((sourceProductChanges[detail.id || ''] || detail.sourceProduct) as SourceProductType)}
                                                                                                    <ChevronDown className="h-3 w-3 ml-1" />
                                                                                                </Badge>
                                                                                            </SelectValue>
                                                                                        </SelectTrigger>
                                                                                        <SelectContent>
                                                                                            <SelectItem value={SourceProductType.PENGAMBILAN_STOK}>
                                                                                                Pengambilan Stok (Stok: 0)
                                                                                            </SelectItem>
                                                                                            <SelectItem value={SourceProductType.PEMBELIAN_BARANG}>
                                                                                                Pembelian Barang
                                                                                            </SelectItem>
                                                                                        </SelectContent>
                                                                                    </Select>
                                                                                ) : (detail.sourceProduct === SourceProductType.PENGAMBILAN_STOK && stockData[detail.id || '']?.breakdown?.length > 0) ? (
                                                                                    <Dialog>
                                                                                        <DialogTrigger asChild>
                                                                                            <Button
                                                                                                variant="ghost"
                                                                                                className="h-auto p-1 hover:bg-gray-100 flex flex-col gap-1 items-center group"
                                                                                                onClick={(e) => {
                                                                                                    // Prevent dialog from opening if PR is already approved/completed/rejected
                                                                                                    if (selectedPurchaseRequest?.status === 'APPROVED' ||
                                                                                                        selectedPurchaseRequest?.status === 'COMPLETED' ||
                                                                                                        selectedPurchaseRequest?.status === 'REJECTED') {
                                                                                                        e.preventDefault();
                                                                                                        toast.error('Purchase Request ini sudah disetujui dan tidak dapat dilakukan perubahan pemilihan stok.', {
                                                                                                            duration: 4000,
                                                                                                            position: 'top-center',
                                                                                                            style: {
                                                                                                                background: '#dc2626',
                                                                                                                color: '#fff',
                                                                                                                padding: '16px',
                                                                                                                borderRadius: '8px',
                                                                                                                fontSize: '14px',
                                                                                                                fontWeight: '500',
                                                                                                            },
                                                                                                            icon: '🚫',
                                                                                                        });
                                                                                                        return;
                                                                                                    }
                                                                                                }}
                                                                                            >
                                                                                                <Badge
                                                                                                    variant="outline"
                                                                                                    className="text-xs bg-green-50 text-green-700 border-green-200 group-hover:bg-green-100 transition-colors pointer-events-none"
                                                                                                >
                                                                                                    {getSourceProductLabel(detail.sourceProduct as SourceProductType)}
                                                                                                    <ChevronDown className="h-3 w-3 ml-1" />
                                                                                                </Badge>
                                                                                                {(warehouseSelections[detail.id || '']?.length > 0) && (
                                                                                                    <span className="text-[10px] text-green-600 font-medium">
                                                                                                        {warehouseSelections[detail.id || ''].length} WH Selected
                                                                                                    </span>
                                                                                                )}
                                                                                            </Button>
                                                                                        </DialogTrigger>
                                                                                        <DialogContent className="max-w-[400px] p-0 gap-0">
                                                                                            <div className="p-4 bg-gray-50 border-b rounded-t-lg">
                                                                                                <DialogHeader>
                                                                                                    <DialogTitle className="text-base font-semibold flex items-center gap-2">
                                                                                                        <Package className="h-4 w-4 text-blue-500" />
                                                                                                        Allocate Stock
                                                                                                    </DialogTitle>
                                                                                                    <DialogDescription className="text-xs text-gray-500">
                                                                                                        Select warehouses to fulfill <strong>{detail.jumlah} {detail.satuan}</strong>
                                                                                                    </DialogDescription>
                                                                                                </DialogHeader>
                                                                                            </div>
                                                                                            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                                                                                                {stockData[detail.id || '']?.breakdown.map((wh) => (
                                                                                                    <div
                                                                                                        key={wh.warehouseId}
                                                                                                        className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                                                                                                        onClick={() => handleToggleWarehouse(detail.id || '', wh.warehouseId)}
                                                                                                    >
                                                                                                        <Checkbox
                                                                                                            checked={(warehouseSelections[detail.id || ''] || []).includes(wh.warehouseId)}
                                                                                                            onCheckedChange={() => handleToggleWarehouse(detail.id || '', wh.warehouseId)}
                                                                                                            onClick={(e) => e.stopPropagation()}
                                                                                                            id={`desktop-${detail.id}-${wh.warehouseId}`}
                                                                                                            className="mt-1 bg-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                                                                                        />
                                                                                                        <div className="grid gap-1 w-full">
                                                                                                            <label
                                                                                                                htmlFor={`desktop-${detail.id}-${wh.warehouseId}`}
                                                                                                                className="text-sm font-medium leading-none group-hover:text-blue-600 transition-colors cursor-pointer"
                                                                                                                onClick={(e) => e.stopPropagation()}
                                                                                                            >
                                                                                                                {wh.warehouseName}
                                                                                                            </label>
                                                                                                            <div className="flex justify-between items-center text-xs text-gray-500">
                                                                                                                <Badge variant="secondary" className="text-[10px] px-1.5 h-5 font-mono">
                                                                                                                    Qty: {wh.stock}
                                                                                                                </Badge>

                                                                                                                {wh.stock > 0 ? (
                                                                                                                    <span className="text-green-600 flex items-center gap-1">Available <CheckCircle className="h-3 w-3" /></span>
                                                                                                                ) : (
                                                                                                                    <span className="text-red-400">Out of Stock</span>
                                                                                                                )}
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                ))}
                                                                                                {stockData[detail.id || '']?.breakdown.length === 0 && (
                                                                                                    <div className="text-center py-4 text-gray-400 text-xs">
                                                                                                        No stock data available
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                            <div className="p-4 border-t bg-gray-50 rounded-b-lg">
                                                                                                <div className="flex justify-between items-center text-sm font-medium mb-1">
                                                                                                    <span className="text-gray-600">Required:</span>
                                                                                                    <span className="font-bold">{detail.jumlah}</span>
                                                                                                </div>
                                                                                                <div className="flex justify-between items-center text-sm font-medium">
                                                                                                    <span className="text-gray-600">Selected Total:</span>
                                                                                                    <span className={`font-bold ${(stockData[detail.id || '']?.breakdown
                                                                                                        .filter(wh => (warehouseSelections[detail.id || ''] || []).includes(wh.warehouseId))
                                                                                                        .reduce((sum, wh) => sum + wh.stock, 0)) >= detail.jumlah ? 'text-green-600' : 'text-amber-600'
                                                                                                        }`}>
                                                                                                        {stockData[detail.id || '']?.breakdown
                                                                                                            .filter(wh => (warehouseSelections[detail.id || ''] || []).includes(wh.warehouseId))
                                                                                                            .reduce((sum, wh) => sum + wh.stock, 0)
                                                                                                        }
                                                                                                    </span>
                                                                                                </div>

                                                                                                {/* Status Indication */}
                                                                                                <div className="mt-2 text-xs text-center border-t border-gray-200 pt-2">
                                                                                                    {(stockData[detail.id || '']?.breakdown
                                                                                                        .filter(wh => (warehouseSelections[detail.id || ''] || []).includes(wh.warehouseId))
                                                                                                        .reduce((sum, wh) => sum + wh.stock, 0)) >= detail.jumlah ? (
                                                                                                        <span className="text-green-600 flex items-center justify-center gap-1 font-semibold">
                                                                                                            <Check className="h-4 w-4" /> Fully Allocated
                                                                                                        </span>
                                                                                                    ) : (
                                                                                                        <span className="text-amber-600 flex items-center justify-center gap-1 font-semibold">
                                                                                                            <Info className="h-4 w-4" /> Partial Allocation
                                                                                                        </span>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        </DialogContent>
                                                                                    </Dialog>
                                                                                ) : (
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
                                                                                )}
                                                                            </div>
                                                                            <div className="col-span-1 text-center font-medium">
                                                                                {(detail.id && (detail.sourceProduct === SourceProductType.PEMBELIAN_BARANG || detail.sourceProduct === SourceProductType.PENGAMBILAN_STOK)) ? (
                                                                                    <TooltipProvider>
                                                                                        <Tooltip>
                                                                                            <TooltipTrigger asChild>
                                                                                                <div className="mx-auto w-fit px-2 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-md text-xs font-bold cursor-help hover:bg-emerald-200 transition-colors">
                                                                                                    {stockData[detail.id]?.available !== undefined ? stockData[detail.id]?.available : '-'}
                                                                                                </div>
                                                                                            </TooltipTrigger>
                                                                                            <TooltipContent className="p-0 border-none shadow-xl z-50">
                                                                                                <Card className="w-64 border-slate-200 dark:border-slate-800">
                                                                                                    <CardHeader className="py-3 px-4 bg-slate-50 dark:bg-slate-900 border-b">
                                                                                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                                                                                            <Package className="w-4 h-4 text-emerald-600" />
                                                                                                            Stock Details
                                                                                                        </CardTitle>
                                                                                                    </CardHeader>
                                                                                                    <CardContent className="p-0">
                                                                                                        {stockData[detail.id]?.breakdown && stockData[detail.id].breakdown.length > 0 ? (
                                                                                                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                                                                                                {stockData[detail.id].breakdown.map((wh: { warehouseName: string; stock: number }, idx: number) => (
                                                                                                                    <div key={idx} className="flex items-center justify-between py-2 px-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                                                                                                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{wh.warehouseName}</span>
                                                                                                                        <Badge variant="outline" className="text-xs font-bold font-mono h-5 bg-white dark:bg-slate-950">
                                                                                                                            {wh.stock}
                                                                                                                        </Badge>
                                                                                                                    </div>
                                                                                                                ))}
                                                                                                                <div className="flex items-center justify-between py-2 px-4 bg-emerald-50/50 dark:bg-emerald-900/10 font-bold border-t">
                                                                                                                    <span className="text-xs text-emerald-700 dark:text-emerald-400">Total Valid</span>
                                                                                                                    <span className="text-xs text-emerald-700 dark:text-emerald-400">{stockData[detail.id].available}</span>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        ) : (
                                                                                                            <div className="p-4 text-center text-xs text-slate-400">
                                                                                                                No Details
                                                                                                            </div>
                                                                                                        )}
                                                                                                    </CardContent>
                                                                                                </Card>
                                                                                            </TooltipContent>
                                                                                        </Tooltip>
                                                                                    </TooltipProvider>
                                                                                ) : (
                                                                                    <span className="text-gray-400">-</span>
                                                                                )}
                                                                            </div>
                                                                            <div className="col-span-1 text-center text-sm text-gray-700">
                                                                                {detail.id?.startsWith('split-') ? (
                                                                                    <div className="flex items-center justify-center gap-1">
                                                                                        <Input
                                                                                            type="number"
                                                                                            value={detail.jumlah || ''}
                                                                                            onChange={(e) => {
                                                                                                const newQty = parseFloat(e.target.value);
                                                                                                const parentId = detail.id?.replace('split-', '') || '';
                                                                                                const originalDetail = selectedPurchaseRequest?.details.find(d => d.id === parentId);

                                                                                                if (!isNaN(newQty) && newQty > 0) {
                                                                                                    setSplitQuantityOverrides(prev => ({
                                                                                                        ...prev,
                                                                                                        [parentId]: newQty
                                                                                                    }));
                                                                                                }
                                                                                            }}
                                                                                            onKeyDown={(e) => {
                                                                                                // Prevent arrow keys from affecting parent elements
                                                                                                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                                                                                    e.stopPropagation();
                                                                                                }
                                                                                            }}
                                                                                            className="h-8 w-32 text-center font-semibold border-blue-300 focus:border-blue-500 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                                        />
                                                                                        <span className="text-xs text-gray-500">{detail.satuan}</span>
                                                                                    </div>
                                                                                ) : (
                                                                                    <>
                                                                                        <span className="font-semibold">{detail.jumlah}</span>
                                                                                        <span className="text-xs text-gray-500 ml-1">{detail.satuan}</span>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                            <div className="col-span-2 text-right text-sm text-gray-700 pr-4">
                                                                                {formatCurrency(detail.estimasiHargaSatuan)}
                                                                            </div>
                                                                            <div className="col-span-2 text-right text-sm font-semibold text-green-600 pr-4">
                                                                                {formatCurrency(detail.estimasiTotalHarga)}
                                                                            </div>
                                                                            <div className="col-span-1 text-center">
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-8 w-8 bg-red-50 hover:bg-red-100 text-red-600 rounded-full transition-colors duration-200"
                                                                                    onClick={() => {
                                                                                        if (onDeleteItem && detail.id) {
                                                                                            // Add confirmation
                                                                                            if (window.confirm('Are you sure you want to delete this item?')) {
                                                                                                onDeleteItem(detail.id);
                                                                                            }
                                                                                        }
                                                                                    }}
                                                                                    disabled={!detail.id || detail.id.startsWith('split-') || selectedPurchaseRequest.status === 'APPROVED' || selectedPurchaseRequest.status === 'COMPLETED'}
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>

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
                        <div className="border-t bg-white py-4 dark:py-4 sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 pb-4 sm:pb-0 mb-4 sm:mb-4 rounded-lg mt-auto flex-shrink-0">
                            <StatusActions
                                currentStatus={selectedPurchaseRequest.status}
                                onStatusUpdate={(status) => {
                                    // Validation: Check if all PENGAMBILAN_STOK items have warehouse selections
                                    if (status === 'APPROVED') {
                                        const pengambilanStokItems = localDetails.filter(detail =>
                                            detail.sourceProduct === SourceProductType.PENGAMBILAN_STOK &&
                                            !detail.id?.startsWith('split-') // Exclude split items
                                        );

                                        const itemsWithoutWarehouse = pengambilanStokItems.filter(detail => {
                                            const detailId = detail.id || '';
                                            const selections = warehouseSelections[detailId];
                                            return !selections || selections.length === 0;
                                        });

                                        if (itemsWithoutWarehouse.length > 0) {
                                            const itemNames = itemsWithoutWarehouse
                                                .map(item => item.product?.name || 'Unknown')
                                                .join(', ');

                                            toast.error(
                                                `Tidak dapat approve! Pilih gudang terlebih dahulu untuk item: ${itemNames}`,
                                                {
                                                    duration: 5000,
                                                    position: 'top-center',
                                                    style: {
                                                        background: '#FEE2E2',
                                                        color: '#991B1B',
                                                        border: '1px solid #FCA5A5',
                                                        fontWeight: '600',
                                                    },
                                                }
                                            );
                                            return; // Stop execution
                                        }

                                        // Validation: Check if quantity exceeds available stock
                                        const itemsExceedingStock: Array<{ name: string, requested: number, available: number }> = [];

                                        pengambilanStokItems.forEach(detail => {
                                            const detailId = detail.id || '';
                                            const detailStock = stockData[detailId];
                                            const requestedQty = Number(detail.jumlah) || 0;
                                            const availableStock = detailStock?.available || 0;

                                            if (requestedQty > availableStock) {
                                                itemsExceedingStock.push({
                                                    name: detail.product?.name || 'Unknown',
                                                    requested: requestedQty,
                                                    available: availableStock
                                                });
                                            }
                                        });

                                        if (itemsExceedingStock.length > 0) {
                                            const errorMessage = itemsExceedingStock
                                                .map(item => `${item.name} (Diminta: ${item.requested}, Tersedia: ${item.available})`)
                                                .join(', ');

                                            toast.error(
                                                `Tidak dapat approve! Quantity melebihi stok tersedia untuk item: ${errorMessage}`,
                                                {
                                                    duration: 6000,
                                                    position: 'top-center',
                                                    style: {
                                                        background: '#FEE2E2',
                                                        color: '#991B1B',
                                                        border: '1px solid #FCA5A5',
                                                        fontWeight: '600',
                                                    },
                                                }
                                            );
                                            return; // Stop execution
                                        }
                                    }

                                    // Transform warehouseSelections to the expected format
                                    const warehouseAllocations: Record<string, any[]> = {};

                                    if (status === 'APPROVED' || status === 'COMPLETED') {
                                        Object.keys(warehouseSelections).forEach(detailId => {
                                            const selectedIds = warehouseSelections[detailId];
                                            const detailStock = stockData[detailId];

                                            if (selectedIds && selectedIds.length > 0 && detailStock) {
                                                const allocations = detailStock.breakdown
                                                    .filter(wh => selectedIds.includes(wh.warehouseId))
                                                    .map(wh => ({
                                                        warehouseId: wh.warehouseId,
                                                        warehouseName: wh.warehouseName,
                                                        stock: wh.stock
                                                    }));

                                                if (allocations.length > 0) {
                                                    warehouseAllocations[detailId] = allocations;
                                                }
                                            }
                                        });

                                        // Add split items data
                                        const splitItemsData = Object.entries(splitItems).map(([parentId, splitItem]) => ({
                                            parentDetailId: parentId,
                                            productId: splitItem.product?.id || splitItem.productId,
                                            jumlah: splitItem.jumlah,
                                            satuan: splitItem.satuan,
                                            sourceProduct: splitItem.sourceProduct,
                                            estimasiHargaSatuan: splitItem.estimasiHargaSatuan,
                                            estimasiTotalHarga: splitItem.estimasiTotalHarga,
                                            catatanItem: `Auto-split from insufficient stock`,
                                        }));

                                        // Add split items to warehouseAllocations with special key
                                        if (splitItemsData.length > 0) {
                                            warehouseAllocations['__splitItems__'] = splitItemsData;
                                        }
                                    }

                                    onStatusUpdate(selectedPurchaseRequest.id, status, undefined, warehouseAllocations);
                                }}
                            />
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}