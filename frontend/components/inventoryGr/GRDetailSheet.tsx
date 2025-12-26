import * as React from "react"
import {
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
    XCircle,
    AlertCircle,
    Download,
    User,
    Building,
    FileText,
    Hash,
    Calendar,
    Truck,
    Package,
    Store,
} from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import type { GoodsReceipt, DocumentStatus, QCStatus } from "@/types/grInventoryType"

interface GRDetailSheetProps {
    gr: GoodsReceipt | null
    onClose?: () => void
}

// Warehouse style helper - matched with TableGrInventory
const getWarehouseStyle = (name: string = "") => {
    const colorIndex = name.length % 5;
    const styles = [
        "bg-blue-50 text-blue-700 border-blue-200",
        "bg-emerald-50 text-emerald-700 border-emerald-200",
        "bg-violet-50 text-violet-700 border-violet-200",
        "bg-orange-50 text-orange-700 border-orange-200",
        "bg-cyan-50 text-cyan-700 border-cyan-200",
    ];
    return styles[colorIndex] || styles[0];
};

// Helper function untuk status config
const getStatusConfig = (status: DocumentStatus) => {
    const configs = {
        DRAFT: {
            icon: Clock,
            color: "text-yellow-600",
            bg: "bg-yellow-50",
            border: "border-yellow-200",
            label: "Menunggu Kedatangan Barang"
        },
        ARRIVED: {
            icon: Truck,
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-200",
            label: "Barang Sudah Diterima"
        },
        PASSED: {
            icon: CheckCircle,
            color: "text-green-600",
            bg: "bg-green-50",
            border: "border-green-200",
            label: "QC Passed - Menunggu Approval"
        },
        COMPLETED: {
            icon: CheckCircle,
            color: "text-green-600",
            bg: "bg-green-50",
            border: "border-green-200",
            label: "Completed"
        },
        CANCELLED: {
            icon: XCircle,
            color: "text-red-600",
            bg: "bg-red-50",
            border: "border-red-200",
            label: "Cancelled"
        }
    }
    return configs[status] || configs.DRAFT
}

const getQCStatusConfig = (status: QCStatus) => {
    const configs = {
        PENDING: {
            icon: Clock,
            color: "text-yellow-600",
            bg: "bg-yellow-50",
            label: "Menunggu Kedatangan Barang"
        },
        ARRIVED: {
            icon: Truck,
            color: "text-blue-600",
            bg: "bg-blue-50",
            label: "Barang sudah diterima"
        },
        PASSED: {
            icon: CheckCircle,
            color: "text-green-600",
            bg: "bg-green-50",
            label: "Passed"
        },
        REJECTED: {
            icon: XCircle,
            color: "text-red-600",
            bg: "bg-red-50",
            label: "Rejected"
        },
        PARTIAL: {
            icon: AlertCircle,
            color: "text-orange-600",
            bg: "bg-orange-50",
            label: "Partial"
        }
    }
    return configs[status] || configs.PENDING
}

export const GRDetailSheet: React.FC<GRDetailSheetProps> = ({ gr, onClose }) => {
    if (!gr) return null

    const statusConfig = getStatusConfig(gr.status)
    const StatusIcon = statusConfig.icon

    const handleExport = () => {
        // TODO: Implement PDF export
        console.log('Exporting GR:', gr.id)
    }

    return (
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto px-2">
            <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-slate-800">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Detail Goods Receipt
                </SheetTitle>
                <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                        <Hash className="h-4 w-4 text-slate-500" />
                        <span className="font-mono font-bold text-lg text-slate-700">{gr.grNumber}</span>
                    </div>
                </div>
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
                                        <h3 className="text-sm font-semibold text-slate-600">Status</h3>
                                    </div>
                                    <Badge
                                        className={`
                                            ${statusConfig.bg} 
                                            ${statusConfig.color} 
                                            ${statusConfig.border}
                                            border font-semibold text-sm
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
                                        <h3 className="text-sm font-semibold text-slate-600">Tanggal Dibuat</h3>
                                    </div>
                                    {gr.createdAt ? (
                                        <>
                                            <p className="font-semibold text-lg text-slate-800">
                                                {format(new Date(gr.createdAt), "dd MMMM yyyy", { locale: id })}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {format(new Date(gr.createdAt), "HH:mm", { locale: id })} WIB
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic">-</p>
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="h-4 w-4 text-blue-400" />
                                        <h3 className="text-sm font-semibold text-slate-600">Tgl Kedatangan Material</h3>
                                    </div>
                                    {gr.expectedDate ? (
                                        <p className="font-semibold text-lg text-blue-700">
                                            {format(new Date(gr.expectedDate), "dd MMMM yyyy", { locale: id })}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic">Tidak ada estimasi</p>
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="h-4 w-4 text-green-400" />
                                        <h3 className="text-sm font-semibold text-slate-600">Tanggal Diterima</h3>
                                    </div>
                                    {gr.receivedDate ? (
                                        <>
                                            <p className="font-semibold text-lg text-green-700">
                                                {format(new Date(gr.receivedDate), "dd MMMM yyyy", { locale: id })}
                                            </p>
                                            <p className="text-sm text-green-600">
                                                {format(new Date(gr.receivedDate), "HH:mm", { locale: id })} WIB
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic">Belum diterima</p>
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <User className="h-4 w-4 text-slate-400" />
                                        <h3 className="text-sm font-semibold text-slate-600">Diterima Oleh</h3>
                                    </div>
                                    <p className="font-semibold text-slate-800">{gr.receivedBy?.name || "N/A"}</p>
                                    <p className="text-sm text-slate-500">{gr.receivedBy?.email || ""}</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Building className="h-4 w-4 text-slate-400" />
                                        <h3 className="text-sm font-semibold text-slate-600">Supplier</h3>
                                    </div>
                                    <p className="font-semibold text-lg text-slate-800">
                                        {gr.PurchaseOrder?.supplier?.name || "N/A"}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-slate-600 mb-2">Gudang</h3>
                                    <div className={`
                                        flex items-center gap-2 px-3 py-2 rounded-lg border w-fit
                                        ${getWarehouseStyle(gr.Warehouse?.name)}
                                    `}>
                                        <Store className="w-4 h-4" />
                                        <span className="font-semibold text-sm">
                                            {gr.Warehouse?.name || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Truck className="h-4 w-4 text-slate-400" />
                                        <h3 className="text-sm font-semibold text-slate-600">Delivery Info</h3>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Delivery Note:</span>
                                            <span className="font-medium text-slate-800">{gr.vendorDeliveryNote}</span>
                                        </div>
                                        {gr.vehicleNumber && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Vehicle:</span>
                                                <span className="font-medium text-slate-800">{gr.vehicleNumber}</span>
                                            </div>
                                        )}
                                        {gr.driverName && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Driver:</span>
                                                <span className="font-medium text-slate-800">{gr.driverName}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
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
                                        <h3 className="font-semibold text-lg text-slate-800">Detail Item</h3>
                                        <p className="text-sm text-slate-500">
                                            Total {gr.items.length} item
                                        </p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="border-slate-300">
                                    {gr.items.reduce((sum, item) => sum + Number(item.qtyReceived), 0).toLocaleString()} Total Qty
                                </Badge>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-100/50 hover:bg-slate-100/50 border-b border-slate-200">
                                        <TableHead className="font-semibold text-slate-600 py-4">Produk</TableHead>
                                        <TableHead className="font-semibold text-slate-600 text-right py-4">Planned</TableHead>
                                        <TableHead className="font-semibold text-slate-600 text-right py-4">Diterima</TableHead>
                                        <TableHead className="font-semibold text-slate-600 text-right py-4">Passed</TableHead>
                                        <TableHead className="font-semibold text-slate-600 text-right py-4">Rejected</TableHead>
                                        <TableHead className="font-semibold text-slate-600 text-center py-4">QC Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {gr.items.map((item, index) => {
                                        const qcConfig = getQCStatusConfig(item.qcStatus)
                                        const QCIcon = qcConfig.icon

                                        return (
                                            <TableRow
                                                key={item.id}
                                                className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                                            >
                                                <TableCell className="py-4">
                                                    <div className="space-y-1">
                                                        <p className="font-bold text-slate-800">{item.product.name}</p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                                                {item.product.code}
                                                            </span>
                                                            <span className="text-xs text-slate-500">
                                                                {item.unit}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-4">
                                                    <div className="bg-blue-50 rounded-lg px-3 py-2 inline-block min-w-[80px]">
                                                        <p className="font-bold text-blue-700">
                                                            {Number(item.qtyPlanReceived || 0).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-4">
                                                    <div className="bg-slate-100 rounded-lg px-3 py-2 inline-block min-w-[80px]">
                                                        <p className="font-bold text-slate-800">
                                                            {Number(item.qtyReceived).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-4">
                                                    <div className="bg-green-50 rounded-lg px-3 py-2 inline-block min-w-[80px]">
                                                        <p className="font-bold text-green-700">
                                                            {Number(item.qtyPassed).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-4">
                                                    <div className="bg-red-50 rounded-lg px-3 py-2 inline-block min-w-[80px]">
                                                        <p className="font-bold text-red-700">
                                                            {Number(item.qtyRejected).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center py-4">
                                                    <Badge
                                                        variant="outline"
                                                        className={`
                                                            ${qcConfig.bg} 
                                                            ${qcConfig.color}
                                                            font-semibold px-3 py-1.5
                                                        `}
                                                    >
                                                        <QCIcon className="h-3.5 w-3.5 mr-1.5" />
                                                        {qcConfig.label}
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

                {/* Notes Section */}
                {gr.notes && (
                    <Card className="border border-slate-200 shadow-sm">
                        <CardContent className="p-6">
                            <h3 className="text-sm font-semibold text-slate-600 mb-2">Catatan</h3>
                            <p className="text-slate-700">{gr.notes}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-slate-200">
                    <Button
                        variant="outline"
                        className="border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                        size="lg"
                        onClick={handleExport}
                    >
                        <Download className="h-5 w-5 mr-2" />
                        Export PDF
                    </Button>
                </div>
            </div>
        </SheetContent>
    )
}
