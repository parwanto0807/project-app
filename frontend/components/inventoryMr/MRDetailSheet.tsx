import * as React from "react"
import { QRCodeSVG } from "qrcode.react"
import {
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    CheckCircle,
    Clock,
    Package,
    Truck,
    XCircle,
    QrCode,
    Download,
    User,
    Building,
    FileText,
    ScanLine,
    CheckCheck,
    Hash,
    Calendar,
    Loader2,
} from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { QRScannerDialog } from "./QRScannerDialog"
import { issueMR } from "@/lib/action/inventory/mrInventroyAction"
import { toast } from "sonner"

// Types
interface MaterialRequisition {
    id: string
    mrNumber: string
    qrToken: string
    issuedDate: Date
    projectId: string
    requestedById: string
    status: "PENDING" | "APPROVED" | "READY_TO_PICKUP" | "ISSUED" | "CANCELLED"
    items: MaterialRequisitionItem[]
    warehouseId?: string
    preparedById?: string
    issuedById?: string
    createdAt: Date
    updatedAt: Date
    Warehouse?: {
        name: string
    }
    PurchaseOrder?: {
        poNumber: string
    }
    sourceType?: string
    project?: {
        name: string
    }
    requestedBy?: {
        name: string
        department?: string
    }
    preparedBy?: {
        name: string
    }
    notes?: string | null
    isAllStockSufficient?: boolean
}

interface MaterialRequisitionItem {
    id: string
    productId?: string
    isStockSufficient?: boolean
    currentStock?: number
    baseQtyRequired?: number
    product: {
        name: string
        code: string
    }
    purchaseRequestDetail?: {
        purchaseRequest?: {
            nomorPr: string
        }
    }
    qtyRequested: number
    qtyIssued: number
    unit: string
}

interface MRDetailSheetProps {
    mr: MaterialRequisition | null
    onScanQRCode?: () => void
    onRefresh?: () => void
    currentUserId?: string
}

// Helper function untuk status config
const getStatusConfig = (status: string) => {
    const configs = {
        PENDING: {
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-50",
            border: "border-amber-200",
            label: "Menunggu Persetujuan"
        },
        APPROVED: {
            icon: CheckCircle,
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-200",
            label: "Disetujui"
        },
        READY_TO_PICKUP: {
            icon: Package,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            border: "border-emerald-200",
            label: "Siap Diambil"
        },
        ISSUED: {
            icon: Truck,
            color: "text-purple-600",
            bg: "bg-purple-50",
            border: "border-purple-200",
            label: "Telah Diterbitkan"
        },
        CANCELLED: {
            icon: XCircle,
            color: "text-red-600",
            bg: "bg-red-50",
            border: "border-red-200",
            label: "Dibatalkan"
        }
    }
    return configs[status as keyof typeof configs] || configs.PENDING
}

export const MRDetailSheet: React.FC<MRDetailSheetProps> = ({
    mr,
    onScanQRCode,
    onRefresh,
    currentUserId = "temp-user-id" // TODO: Get from auth session
}) => {
    const [scannerOpen, setScannerOpen] = React.useState(false)
    const [isProcessing, setIsProcessing] = React.useState(false)

    if (!mr) return null

    const statusConfig = getStatusConfig(mr.status)
    const StatusIcon = statusConfig.icon

    const handleScanSuccess = async (scannedToken: string) => {
        try {
            setIsProcessing(true)
            setScannerOpen(false) // Close scanner dialog

            // Call backend API to issue MR
            const result = await issueMR({
                qrToken: scannedToken,
                issuedById: currentUserId
            })

            if (result.success) {
                toast.success("Material berhasil dikeluarkan!", {
                    description: "Stok telah diperbarui dan MR telah diproses."
                })

                // Call parent callback if provided
                if (onScanQRCode) {
                    onScanQRCode()
                }

                // Refresh MR data
                if (onRefresh) {
                    onRefresh()
                }
            } else {
                let errorDesc = result.error || "Terjadi kesalahan saat memproses";
                if (mr?.items) {
                    mr.items.forEach(item => {
                        if (item.productId && errorDesc.includes(item.productId)) {
                            const name = item.product?.name || "Produk";
                            const code = item.product?.code ? ` (${item.product.code})` : "";
                            errorDesc = errorDesc.split(item.productId).join(`"${name}${code}"`);
                        }
                    });
                }
                toast.error("Gagal mengeluarkan material", {
                    description: errorDesc
                });
            }
        } catch (error: any) {
            console.error("Issue MR Error:", error)
            let errorDesc = error.message || "Koneksi ke server terputus";
            if (mr?.items) {
                mr.items.forEach(item => {
                    if (item.productId && errorDesc.includes(item.productId)) {
                        const name = item.product?.name || "Produk";
                        const code = item.product?.code ? ` (${item.product.code})` : "";
                        errorDesc = errorDesc.split(item.productId).join(`"${name}${code}"`);
                    }
                });
            }
            toast.error("Terjadi kesalahan", {
                description: errorDesc
            })
        } finally {
            setIsProcessing(false)
        }
    }

    const getQtyStatusStyle = (requested: number, issued: number) => {
        if (issued === 0) return "bg-red-50 text-red-700"
        if (issued < requested) return "bg-amber-50 text-amber-700"
        return "bg-emerald-50 text-emerald-700"
    }

    return (
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
            <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-slate-800">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Detail Permintaan Material
                </SheetTitle>
                <SheetDescription className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-slate-400" />
                    Nomor MR: <span className="font-bold text-slate-800">{mr.mrNumber}</span>
                </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 py-6">
                {/* Header Info */}
                <Card className="border border-slate-200 shadow-sm">
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-5">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`p-1.5 rounded-lg ${statusConfig.bg}`}>
                                            <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
                                        </div>
                                        <h3 className="text-sm font-semibold text-slate-600">Status Permintaan</h3>
                                    </div>
                                    <Badge
                                        className={`
                      ${statusConfig.bg} 
                      ${statusConfig.color} 
                      ${statusConfig.border}
                      border
                      font-semibold
                      text-sm
                      flex items-center gap-1.5 w-fit px-3 py-1.5
                    `}
                                        variant="outline"
                                    >
                                        <StatusIcon className="h-3.5 w-3.5" />
                                        {statusConfig.label}
                                    </Badge>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="h-4 w-4 text-slate-400" />
                                        <h3 className="text-sm font-semibold text-slate-600">Tanggal Permintaan</h3>
                                    </div>
                                    <p className="font-semibold text-lg text-slate-800">
                                        {format(new Date(mr.issuedDate), "dd MMMM yyyy", { locale: id })}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        {format(new Date(mr.issuedDate), "HH:mm", { locale: id })} WIB
                                    </p>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <User className="h-4 w-4 text-slate-400" />
                                        <h3 className="text-sm font-semibold text-slate-600">Diminta Oleh</h3>
                                    </div>
                                    <p className="font-semibold text-slate-800">{mr.requestedBy?.name || "N/A"}</p>
                                    <p className="text-sm text-slate-500">{mr.requestedBy?.department || "Departemen tidak tersedia"}</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Building className="h-4 w-4 text-slate-400" />
                                        <h3 className="text-sm font-semibold text-slate-600">Gudang Tujuan</h3>
                                    </div>
                                    <p className="font-semibold text-lg text-slate-800">{mr.Warehouse?.name || "Tidak ditentukan"}</p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-slate-600 mb-2">Project</h3>
                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                        <p className="font-semibold text-slate-800">{mr.project?.name || mr.projectId}</p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-slate-600 mb-2">Token QR Code</h3>
                                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                        <p className="font-mono font-semibold text-blue-700 text-sm tracking-wide">
                                            {mr.qrToken}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="h-4 w-4 text-slate-400" />
                                        <h3 className="text-sm font-semibold text-slate-600">Dokumen Pendukung</h3>
                                    </div>
                                    <div className="space-y-2">
                                        {mr.PurchaseOrder && (
                                            <div className="flex justify-between items-center bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                                                <span className="text-sm text-slate-500">PO Number</span>
                                                <span className="font-semibold text-sm text-slate-800">{mr.PurchaseOrder.poNumber}</span>
                                            </div>
                                        )}
                                        {mr.items && mr.items.some(item => item.purchaseRequestDetail?.purchaseRequest?.nomorPr) && (
                                            <div className="flex justify-between items-center bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                                                <span className="text-sm text-slate-500">PR Number</span>
                                                <span className="font-semibold text-sm text-slate-800">
                                                    {Array.from(new Set(mr.items.map(i => i.purchaseRequestDetail?.purchaseRequest?.nomorPr).filter(Boolean))).join(", ")}
                                                </span>
                                            </div>
                                        )}
                                        {mr.notes && mr.notes.includes('[TF-') && (
                                            <div className="flex justify-between items-center bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                                                <span className="text-sm text-slate-500">Stock Transfer</span>
                                                <a href={`/admin-area/inventory/transfer?search=${mr.notes.match(/\[(TF-[A-Z0-9-]+)\]/)?.[1] || ''}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-sm text-indigo-600 hover:underline">
                                                    {mr.notes.match(/\[(TF-[A-Z0-9-]+)\]/)?.[1]}
                                                </a>
                                            </div>
                                        )}
                                        {!mr.PurchaseOrder && 
                                         (!mr.items || !mr.items.some(item => item.purchaseRequestDetail?.purchaseRequest?.nomorPr)) && 
                                         !(mr.notes?.includes('[TF-')) && (
                                            <p className="text-sm text-slate-500 italic">Tidak ada dokumen pendukung</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {mr.notes && (
                            <div className="mt-5 pt-5 border-t border-slate-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText className="h-4 w-4 text-slate-400" />
                                    <h3 className="text-sm font-semibold text-slate-600">Catatan</h3>
                                </div>
                                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                                    <p className="text-slate-700 italic text-sm">
                                        {mr.notes}
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Items Table */}
                <Card className="border border-slate-200 shadow-sm">
                    <CardContent className="p-0">
                        <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Package className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg text-slate-800">Detail Item Material</h3>
                                        <p className="text-sm text-slate-500">
                                            Total {mr.items.length} item
                                        </p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="border-slate-300">
                                    {mr.items.reduce((sum, item) => sum + item.qtyRequested, 0).toLocaleString()} Total Qty
                                </Badge>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                                        <TableHead className="font-semibold text-slate-700 py-4">Produk</TableHead>
                                        <TableHead className="font-semibold text-slate-700 text-right py-4">Jumlah Diminta</TableHead>
                                        <TableHead className="font-semibold text-slate-700 text-right py-4">Jumlah Dikeluarkan</TableHead>
                                        <TableHead className="font-semibold text-slate-700 text-center py-4">Satuan</TableHead>
                                        {mr.status === 'PENDING' && (
                                            <TableHead className="font-semibold text-slate-700 text-center py-4">
                                                Cek Stok
                                                <span className="block text-[11px] font-normal text-slate-500">({mr.Warehouse?.name || 'Gudang MR'})</span>
                                            </TableHead>
                                        )}
                                        <TableHead className="font-semibold text-slate-700 text-right py-4">Status Pemenuhan</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mr.items.map((item, index) => {
                                        const isComplete = item.qtyIssued === item.qtyRequested
                                        const isPartial = item.qtyIssued > 0 && item.qtyIssued < item.qtyRequested
                                        const isEmpty = item.qtyIssued === 0

                                        return (
                                            <TableRow
                                                key={item.id}
                                                className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                                            >
                                                <TableCell className="py-4">
                                                    <div className="space-y-1">
                                                        <p className="font-semibold text-slate-800">{item.product.name}</p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                                                Kode: {item.product.code}
                                                            </span>
                                                            <span className="text-xs text-slate-500">
                                                                {item.unit}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-4">
                                                    <div className="flex justify-end">
                                                        <div className="bg-slate-100 rounded-lg px-3 py-2 min-w-[100px]">
                                                            <p className="font-bold text-lg text-slate-800">
                                                                {item.qtyRequested.toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-4">
                                                    <div className="flex justify-end">
                                                        <div className={`
                                                            rounded-lg px-3 py-2 min-w-[100px] 
                                                            ${getQtyStatusStyle(item.qtyRequested, item.qtyIssued)}
                                                            transition-all duration-200
                                                        `}>
                                                            <p className="font-bold text-lg">
                                                                {item.qtyIssued.toLocaleString()}
                                                            </p>
                                                            {isPartial && (
                                                                <p className="text-xs font-medium mt-0.5">
                                                                    ({Math.round((item.qtyIssued / item.qtyRequested) * 100)}%)
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center py-4">
                                                    <span className="font-medium text-slate-700">
                                                        {item.unit}
                                                    </span>
                                                </TableCell>
                                                {mr.status === 'PENDING' && (
                                                    <TableCell className="text-center py-4">
                                                        {item.isStockSufficient !== undefined ? (
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${item.isStockSufficient ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                                <span className={`h-1.5 w-1.5 rounded-full ${item.isStockSufficient ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                                {item.isStockSufficient ? 'Cukup' : 'Kurang'} (Stok: {item.currentStock?.toLocaleString() ?? 0})
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-slate-400">-</span>
                                                        )}
                                                    </TableCell>
                                                )}
                                                <TableCell className="text-right py-4">
                                                    <Badge
                                                        variant={isComplete ? "default" : "outline"}
                                                        className={`
                                                            font-semibold px-3 py-1.5
                                                            ${isComplete
                                                                ? "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                                                : isEmpty
                                                                    ? "bg-red-100 text-red-800 border-red-200 hover:bg-red-100"
                                                                    : "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100"
                                                            }
                                                        `}
                                                    >
                                                        {isComplete ? "Lengkap" : isEmpty ? "Belum Diproses" : "Parsial"}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* QR Code Section */}
                <Card className="border border-slate-200 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                            <div className="space-y-4 flex-1">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <QrCode className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <h3 className="font-semibold text-lg text-slate-800">Scan QR Code</h3>
                                </div>
                                <p className="text-slate-600 leading-relaxed">
                                    Gunakan QR Code berikut untuk melakukan scan pada saat penerimaan barang di gudang.
                                    Pastikan token sesuai dengan yang tertera di sistem.
                                </p>
                                <div className="pt-2">
                                    <Button
                                        onClick={() => setScannerOpen(true)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5"
                                        size="lg"
                                        disabled={isProcessing || mr.status === 'ISSUED'}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                                Memproses...
                                            </>
                                        ) : (
                                            <>
                                                <ScanLine className="h-5 w-5 mr-2" />
                                                Scan QR Code
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl border-2 border-slate-200 shadow-sm flex flex-col items-center">
                                <div className="mb-4">
                                    <Badge variant="outline" className="border-blue-200 text-blue-700 font-semibold">
                                        MR: {mr.mrNumber}
                                    </Badge>
                                </div>
                                {mr.qrToken ? (
                                    <div className="p-4 bg-white rounded-lg border border-slate-100 flex items-center justify-center">
                                        <QRCodeSVG
                                            value={mr.qrToken}
                                            size={200}
                                            level="M"
                                            includeMargin={true}
                                        />
                                    </div>
                                ) : (
                                    <div className="w-56 h-56 flex flex-col items-center justify-center bg-slate-50 rounded-lg border border-slate-200">
                                        <QrCode className="h-16 w-16 text-slate-300 mb-4" />
                                        <p className="text-sm text-slate-400">QR Code tidak tersedia</p>
                                    </div>
                                )}
                                <p className="text-center text-sm text-slate-500 mt-4 font-medium">
                                    Token: <span className="font-mono">{mr.qrToken.substring(0, 8)}...</span>
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-slate-200">
                    <Button
                        variant="outline"
                        className="border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                        size="lg"
                    >
                        <Download className="h-5 w-5 mr-2" />
                        Download PDF
                    </Button>

                    {mr.status === "PENDING" && (
                        <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                            size="lg"
                            onClick={() => {
                                // Implement approve logic
                            }}
                        >
                            <CheckCheck className="h-5 w-5 mr-2" />
                            Setujui Permintaan
                        </Button>
                    )}

                    {mr.status === "READY_TO_PICKUP" && (
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                            size="lg"
                            onClick={() => setScannerOpen(true)}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    <ScanLine className="h-5 w-5 mr-2" />
                                    Scan & Konfirmasi Penerimaan
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* QR Scanner Dialog */}
            <QRScannerDialog
                open={scannerOpen}
                onOpenChange={setScannerOpen}
                onScanSuccess={handleScanSuccess}
                expectedToken={mr.qrToken}
                title="Scan QR Code MR"
                description={`Scan QR Code untuk Material Requisition ${mr.mrNumber}`}
            />
        </SheetContent>
    )
}
