import * as React from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Icons
import {
    CheckCircle,
    Clock,
    Package,
    Truck,
    XCircle,
    MoreHorizontal,
    RefreshCw,
    Search,
    Filter,
    QrCode,
    Eye,
    Download,
    Printer,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    CheckCheck,
    ScanLine,
    User,
    Building,
    Calendar,
    FileText,
    BarChart3,
    Grid,
    List,
    Plus,
    TrendingUp,
    Smartphone,
    Monitor,
} from "lucide-react"

import { format } from "date-fns"
import { id } from "date-fns/locale"
import QRCode from "qrcode"
import { MRDetailSheet } from "./MRDetailSheet"
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
}

interface MaterialRequisitionItem {
    id: string
    product: {
        name: string
        code: string
    }
    qtyRequested: number
    qtyIssued: number
    unit: string
}

interface TableMRProps {
    data: MaterialRequisition[]
    isLoading: boolean
    onRefresh: () => void
}

const TableMR: React.FC<TableMRProps> = ({ data, isLoading, onRefresh }) => {
    const [search, setSearch] = React.useState("")
    const [statusFilter, setStatusFilter] = React.useState<string>("all")
    const [dateFilter, setDateFilter] = React.useState<string>("all")
    const [selectedMR, setSelectedMR] = React.useState<MaterialRequisition | null>(null)
    const [showQRScanner, setShowQRScanner] = React.useState(false)
    const [isProcessingQR, setIsProcessingQR] = React.useState(false)
    const [showDetailSheet, setShowDetailSheet] = React.useState(false)
    const [qrCodeUrl, setQrCodeUrl] = React.useState<string>("")
    const [currentPage, setCurrentPage] = React.useState(1)
    const [viewMode, setViewMode] = React.useState<"list" | "grid">("list")
    const [columnVisibility, setColumnVisibility] = React.useState({
        mrNumber: true,
        date: true,
        project: true,
        requestedBy: true,
        warehouse: true,
        items: true,
        status: true,
        actions: true,
    })

    const itemsPerPage = 10
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

    // Filter data
    const filteredData = data.filter((mr) => {
        const matchesSearch =
            mr.mrNumber.toLowerCase().includes(search.toLowerCase()) ||
            mr.requestedBy?.name?.toLowerCase().includes(search.toLowerCase()) ||
            mr.Warehouse?.name?.toLowerCase().includes(search.toLowerCase()) ||
            mr.project?.name?.toLowerCase().includes(search.toLowerCase())

        const matchesStatus = statusFilter === "all" || mr.status === statusFilter
        const matchesDate = dateFilter === "all" || true // Add date filtering logic

        return matchesSearch && matchesStatus && matchesDate
    })

    // Pagination
    const totalPages = Math.ceil(filteredData.length / itemsPerPage)
    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const getStatusConfig = (status: string) => {
        const configs = {
            PENDING: {
                icon: Clock,
                color: "text-amber-600",
                bg: "bg-gradient-to-r from-amber-50 to-amber-25",
                border: "border-amber-200",
                label: "Menunggu",
                gradient: "from-amber-500/10 to-amber-400/5"
            },
            APPROVED: {
                icon: CheckCircle,
                color: "text-blue-600",
                bg: "bg-gradient-to-r from-blue-50 to-blue-25",
                border: "border-blue-200",
                label: "Disetujui",
                gradient: "from-blue-500/10 to-blue-400/5"
            },
            READY_TO_PICKUP: {
                icon: Package,
                color: "text-emerald-600",
                bg: "bg-gradient-to-r from-emerald-50 to-emerald-25",
                border: "border-emerald-200",
                label: "Siap Diambil",
                gradient: "from-emerald-500/10 to-emerald-400/5"
            },
            ISSUED: {
                icon: Truck,
                color: "text-purple-600",
                bg: "bg-gradient-to-r from-purple-50 to-purple-25",
                border: "border-purple-200",
                label: "Diterbitkan",
                gradient: "from-purple-500/10 to-purple-400/5"
            },
            CANCELLED: {
                icon: XCircle,
                color: "text-red-600",
                bg: "bg-gradient-to-r from-red-50 to-red-25",
                border: "border-red-200",
                label: "Dibatalkan",
                gradient: "from-red-500/10 to-red-400/5"
            }
        }
        return configs[status as keyof typeof configs] || configs.PENDING
    }

    const generateQRCode = async (token: string) => {
        try {
            const url = await QRCode.toDataURL(token, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#1e40af',
                    light: '#f8fafc'
                }
            })
            setQrCodeUrl(url)
        } catch (err) {
            console.error('Failed to generate QR code:', err)
        }
    }

    const handleApprove = (mr: MaterialRequisition) => {
        setSelectedMR(mr)
        setShowQRScanner(true)
    }

    const handleViewDetails = (mr: MaterialRequisition) => {
        setSelectedMR(mr)
        generateQRCode(mr.qrToken)
        setShowDetailSheet(true)
    }

    const handleScanQRCode = () => {
        // Implement QR code scanning logic
        console.log("Scan QR Code untuk:", selectedMR?.mrNumber)
    }

    const SkeletonRow = () => (
        <TableRow className="hover:bg-slate-50/50 transition-colors">
            <TableCell>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
            </TableCell>
            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
            <TableCell><Skeleton className="h-4 w-36" /></TableCell>
            <TableCell>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                </div>
            </TableCell>
            <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
            <TableCell>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-20 rounded-md" />
                    <Skeleton className="h-9 w-9 rounded-md" />
                </div>
            </TableCell>
        </TableRow>
    )

    const MobileCardView = ({ mr }: { mr: MaterialRequisition }) => {
        const statusConfig = getStatusConfig(mr.status)
        const StatusIcon = statusConfig.icon

        return (
            <Card className="mb-3 border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                <CardContent className="p-4">
                    <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-lg ${statusConfig.bg} ${statusConfig.gradient}`}>
                                    <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-base">{mr.mrNumber}</h3>
                                    <p className="text-sm text-slate-500">
                                        {format(new Date(mr.issuedDate), "dd MMM yyyy • HH:mm", { locale: id })}
                                    </p>
                                </div>
                            </div>
                            <Badge
                                className={`${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} font-semibold`}
                                variant="outline"
                            >
                                {statusConfig.label}
                            </Badge>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <User className="h-3.5 w-3.5" />
                                    <span>Diminta Oleh</span>
                                </div>
                                <p className="font-semibold text-slate-800">{mr.requestedBy?.name || "N/A"}</p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Building className="h-3.5 w-3.5" />
                                    <span>Project</span>
                                </div>
                                <p className="font-semibold text-slate-800">{mr.project?.name || mr.projectId}</p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Package className="h-3.5 w-3.5" />
                                    <span>Gudang</span>
                                </div>
                                <p className="font-semibold text-slate-800">{mr.Warehouse?.name || "N/A"}</p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <FileText className="h-3.5 w-3.5" />
                                    <span>Items</span>
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">{mr.items.length} items</p>
                                    <p className="text-xs text-slate-400">
                                        Total: {mr.items.reduce((sum, item) => sum + item.qtyRequested, 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2 border-t border-slate-100">
                            {mr.status === "PENDING" && (
                                <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleApprove(mr)}
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold"
                                >
                                    <CheckCheck className="h-4 w-4 mr-2" />
                                    Approve
                                </Button>
                            )}

                            <Sheet open={showDetailSheet && selectedMR?.id === mr.id} onOpenChange={setShowDetailSheet}>
                                <SheetTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleViewDetails(mr)}
                                        className="flex-1 border-slate-300 font-semibold"
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        Detail
                                    </Button>
                                </SheetTrigger>
                                <MRDetailSheet
                                    mr={selectedMR}
                                    qrCodeUrl={qrCodeUrl}
                                    onScanQRCode={handleScanQRCode}
                                />
                            </Sheet>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="border-slate-300">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleViewDetails(mr)}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Download className="h-4 w-4 mr-2" />
                                        Download PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Printer className="h-4 w-4 mr-2" />
                                        Print
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header dengan Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                {[
                    {
                        label: "Total MR",
                        value: data.length,
                        icon: FileText,
                        colorLight: "from-blue-500 to-blue-400",
                        colorDark: "from-blue-400 to-blue-300",
                        bgLight: "bg-gradient-to-br from-blue-50 to-blue-100",
                        bgDark: "bg-gradient-to-br from-blue-900/30 to-blue-800/20",
                        textLight: "text-blue-600",
                        textDark: "text-blue-300"
                    },
                    {
                        label: "Pending",
                        value: data.filter(d => d.status === "PENDING").length,
                        icon: Clock,
                        colorLight: "from-amber-500 to-amber-400",
                        colorDark: "from-amber-400 to-amber-300",
                        bgLight: "bg-gradient-to-br from-amber-50 to-amber-100",
                        bgDark: "bg-gradient-to-br from-amber-900/30 to-amber-800/20",
                        textLight: "text-amber-600",
                        textDark: "text-amber-300"
                    },
                    {
                        label: "Approved",
                        value: data.filter(d => d.status === "APPROVED").length,
                        icon: CheckCircle,
                        colorLight: "from-emerald-200 to-emerald-400",
                        colorDark: "from-emerald-400 to-emerald-300",
                        bgLight: "bg-gradient-to-br from-emerald-50 to-emerald-100",
                        bgDark: "bg-gradient-to-br from-emerald-900/30 to-emerald-800/20",
                        textLight: "text-emerald-600",
                        textDark: "text-emerald-300"
                    },
                    {
                        label: "Ready",
                        value: data.filter(d => d.status === "READY_TO_PICKUP").length,
                        icon: Package,
                        colorLight: "from-purple-500 to-purple-400",
                        colorDark: "from-purple-400 to-purple-300",
                        bgLight: "bg-gradient-to-br from-purple-50 to-purple-100",
                        bgDark: "bg-gradient-to-br from-purple-900/30 to-purple-800/20",
                        textLight: "text-purple-600",
                        textDark: "text-purple-300"
                    },
                    {
                        label: "Issued",
                        value: data.filter(d => d.status === "ISSUED").length,
                        icon: Truck,
                        colorLight: "from-indigo-500 to-indigo-400",
                        colorDark: "from-indigo-400 to-indigo-300",
                        bgLight: "bg-gradient-to-br from-indigo-50 to-indigo-100",
                        bgDark: "bg-gradient-to-br from-indigo-900/30 to-indigo-800/20",
                        textLight: "text-indigo-600",
                        textDark: "text-indigo-300"
                    }
                ].map((stat, index) => (
                    <div
                        key={index}
                        className={`
                ${stat.bgLight} dark:${stat.bgDark}
                backdrop-blur-sm rounded-xl p-3 md:p-4 
                border border-slate-200/50 dark:border-slate-700/50 
                hover:border-slate-300 dark:hover:border-slate-600
                transition-all duration-300 hover:scale-[1.02] hover:shadow-md
                shadow-sm
            `}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`
                        text-xs md:text-sm font-medium 
                        text-slate-600 dark:text-slate-300
                        mb-1 md:mb-2
                    `}>
                                    {stat.label}
                                </p>
                                <p className={`
                        text-xl md:text-2xl lg:text-3xl font-bold 
                        ${stat.textLight} dark:${stat.textDark}
                        mb-1 md:mb-2
                    `}>
                                    {stat.value}
                                </p>
                                <div className="flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        {index === 0 ? "All time" : "This month"}
                                    </span>
                                </div>
                            </div>
                            <div className={`
                    p-2 md:p-3 rounded-lg 
                    bg-gradient-to-br ${stat.colorLight}/30 dark:${stat.colorDark}/20
                    border border-slate-200/30 dark:border-slate-700/30
                `}>
                                <stat.icon className={`
                        h-5 w-5 md:h-6 md:w-6 
                        ${stat.textLight} dark:${stat.textDark}
                    `} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search and Filter Section */}
            <Card className="border border-slate-200 shadow-lg rounded-2xl overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                placeholder="Cari MR Number, Nama, Project, atau Gudang..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-12 h-12 rounded-xl border-slate-300 focus:border-blue-500 focus:ring-blue-500 text-base"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-[180px] h-12 rounded-xl border-slate-300">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-4 w-4" />
                                        <span>Status</span>
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="PENDING">Menunggu</SelectItem>
                                    <SelectItem value="APPROVED">Disetujui</SelectItem>
                                    <SelectItem value="READY_TO_PICKUP">Siap Diambil</SelectItem>
                                    <SelectItem value="ISSUED">Diterbitkan</SelectItem>
                                    <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={dateFilter} onValueChange={setDateFilter}>
                                <SelectTrigger className="w-full md:w-[180px] h-12 rounded-xl border-slate-300">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>Tanggal</span>
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Tanggal</SelectItem>
                                    <SelectItem value="today">Hari Ini</SelectItem>
                                    <SelectItem value="week">Minggu Ini</SelectItem>
                                    <SelectItem value="month">Bulan Ini</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="h-12 rounded-xl border-slate-300">
                                            <BarChart3 className="h-4 w-4 mr-2" />
                                            <span className="hidden md:inline">Kolom</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuLabel>Pilih Kolom</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {Object.entries(columnVisibility).map(([key, visible]) => (
                                            <DropdownMenuCheckboxItem
                                                key={key}
                                                checked={visible}
                                                onCheckedChange={(checked) =>
                                                    setColumnVisibility(prev => ({ ...prev, [key]: checked }))
                                                }
                                            >
                                                {key.charAt(0).toUpperCase() + key.slice(1)}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="hidden md:block">
                                    <TabsList className="h-12 rounded-xl bg-slate-100">
                                        <TabsTrigger value="list" className="rounded-lg data-[state=active]:bg-white">
                                            <List className="h-4 w-4" />
                                        </TabsTrigger>
                                        <TabsTrigger value="grid" className="rounded-lg data-[state=active]:bg-white">
                                            <Grid className="h-4 w-4" />
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="text-sm text-slate-600">
                            <span className="font-semibold text-slate-800">{filteredData.length}</span> MR ditemukan
                        </div>

                        <div className="flex items-center gap-3">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="rounded-xl border-slate-300">
                                        <Download className="h-4 w-4 mr-2" />
                                        <span className="hidden md:inline">Export</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Excel (.xlsx)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Printer className="h-4 w-4 mr-2" />
                                        PDF Report
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <FileText className="h-4 w-4 mr-2" />
                                        CSV Format
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Data Display - Responsive */}
            {viewMode === "grid" || isMobile ? (
                // Grid/Mobile View
                <div className="space-y-3">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <Card key={i} className="border border-slate-200 shadow-sm">
                                <CardContent className="p-4">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-12 w-12 rounded-xl" />
                                            <div className="space-y-2 flex-1">
                                                <Skeleton className="h-5 w-40" />
                                                <Skeleton className="h-4 w-32" />
                                            </div>
                                            <Skeleton className="h-7 w-24 rounded-full" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {Array.from({ length: 4 }).map((_, j) => (
                                                <div key={j} className="space-y-2">
                                                    <Skeleton className="h-4 w-20" />
                                                    <Skeleton className="h-5 w-full" />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2 pt-3">
                                            <Skeleton className="h-10 flex-1 rounded-lg" />
                                            <Skeleton className="h-10 flex-1 rounded-lg" />
                                            <Skeleton className="h-10 w-10 rounded-lg" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : paginatedData.length === 0 ? (
                        <Card className="border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white">
                            <CardContent className="py-16 text-center">
                                <div className="max-w-md mx-auto">
                                    <div className="p-4 bg-gradient-to-br from-slate-100 to-slate-50 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                                        <Package className="h-10 w-10 text-slate-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-700 mb-2">
                                        Tidak ada Material Requisition
                                    </h3>
                                    <p className="text-slate-500 mb-6">
                                        Mulai dengan membuat MR baru atau ubah filter pencarian Anda
                                    </p>
                                    <Button className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Buat MR Baru
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        paginatedData.map((mr) => <MobileCardView key={mr.id} mr={mr} />)
                    )}
                </div>
            ) : (
                // Desktop Table View
                <Card className="border border-slate-200 shadow-lg rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100/50 hover:bg-slate-100/50">
                                    {columnVisibility.mrNumber && (
                                        <TableHead className="font-semibold text-slate-700 py-5 px-6 text-base">
                                            MR Number
                                        </TableHead>
                                    )}
                                    {columnVisibility.date && (
                                        <TableHead className="font-semibold text-slate-700 py-5 px-6 text-base">
                                            Tanggal & Waktu
                                        </TableHead>
                                    )}
                                    {columnVisibility.project && (
                                        <TableHead className="font-semibold text-slate-700 py-5 px-6 text-base">
                                            Proyek
                                        </TableHead>
                                    )}
                                    {columnVisibility.requestedBy && (
                                        <TableHead className="font-semibold text-slate-700 py-5 px-6 text-base">
                                            Diminta Oleh
                                        </TableHead>
                                    )}
                                    {columnVisibility.warehouse && (
                                        <TableHead className="font-semibold text-slate-700 py-5 px-6 text-base">
                                            Gudang
                                        </TableHead>
                                    )}
                                    {columnVisibility.items && (
                                        <TableHead className="font-semibold text-slate-700 py-5 px-6 text-base">
                                            Items & Quantity
                                        </TableHead>
                                    )}
                                    {columnVisibility.status && (
                                        <TableHead className="font-semibold text-slate-700 py-5 px-6 text-base">
                                            Status
                                        </TableHead>
                                    )}
                                    {columnVisibility.actions && (
                                        <TableHead className="font-semibold text-slate-700 py-5 px-6 text-base text-right">
                                            Actions
                                        </TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                                ) : paginatedData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-96 text-center">
                                            <div className="max-w-md mx-auto py-12">
                                                <div className="p-6 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl inline-flex mb-6">
                                                    <Package className="h-16 w-16 text-slate-400" />
                                                </div>
                                                <h3 className="text-xl font-semibold text-slate-700 mb-2">
                                                    Tidak ada data ditemukan
                                                </h3>
                                                <p className="text-slate-500 mb-6">
                                                    Coba ubah kata kunci pencarian atau filter yang Anda gunakan
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => { setSearch(""); setStatusFilter("all"); }}
                                                    className="border-slate-300"
                                                >
                                                    Reset Filter
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedData.map((mr) => {
                                        const statusConfig = getStatusConfig(mr.status)
                                        const StatusIcon = statusConfig.icon

                                        return (
                                            <TableRow
                                                key={mr.id}
                                                className="group hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-slate-50/30 transition-all duration-300 border-b border-slate-100"
                                            >
                                                {columnVisibility.mrNumber && (
                                                    <TableCell className="py-5 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-3 rounded-xl ${statusConfig.bg}`}>
                                                                <FileText className="h-6 w-6 text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-lg text-slate-900 group-hover:text-blue-700 transition-colors">
                                                                    {mr.mrNumber}
                                                                </p>
                                                                {/* <p className="text-sm text-slate-500">
                                                                    #Token : {mr.qrToken.substring(0, 8)}
                                                                </p> */}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                )}

                                                {columnVisibility.date && (
                                                    <TableCell className="py-5 px-6">
                                                        <div className="space-y-1">
                                                            <p className="font-semibold text-slate-800">
                                                                {format(new Date(mr.issuedDate), "dd MMM yyyy", { locale: id })}
                                                            </p>
                                                            <p className="text-sm text-slate-500 flex items-center gap-1">
                                                                <Clock className="h-3.5 w-3.5" />
                                                                {format(new Date(mr.issuedDate), "HH:mm", { locale: id })} WIB
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                )}

                                                {columnVisibility.project && (
                                                    <TableCell className="py-5 px-6">
                                                        <div className="flex items-center gap-2 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-lg p-3">
                                                            <Building className="h-4 w-4 text-slate-500" />
                                                            <span className="font-semibold text-slate-800">{mr.project?.name || mr.projectId}</span>
                                                        </div>
                                                    </TableCell>
                                                )}

                                                {columnVisibility.requestedBy && (
                                                    <TableCell className="py-5 px-6">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <User className="h-4 w-4 text-slate-500" />
                                                                <p className="font-semibold text-slate-800">{mr.requestedBy?.name || "N/A"}</p>
                                                            </div>
                                                            <p className="text-sm text-slate-500 pl-6">{mr.requestedBy?.department}</p>
                                                        </div>
                                                    </TableCell>
                                                )}

                                                {columnVisibility.warehouse && (
                                                    <TableCell className="py-5 px-6">
                                                        <div className="flex items-center gap-2 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-lg p-3">
                                                            <Package className="h-4 w-4 text-slate-500" />
                                                            <span className="font-semibold text-slate-800">{mr.Warehouse?.name || "N/A"}</span>
                                                        </div>
                                                    </TableCell>
                                                )}

                                                {columnVisibility.items && (
                                                    <TableCell className="py-5 px-6">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <div className="bg-gradient-to-r from-emerald-100 to-emerald-50 rounded-lg px-3 py-1.5">
                                                                    <span className="font-bold text-emerald-700">
                                                                        {mr.items.length} items
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <p className="text-sm text-slate-500">
                                                                Total Qty: <span className="font-semibold text-slate-700">
                                                                    {mr.items.reduce((sum, item) => sum + item.qtyRequested, 0).toLocaleString()}
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                )}

                                                {columnVisibility.status && (
                                                    <TableCell className="py-5 px-6">
                                                        <Badge
                                                            className={`
                                                                ${statusConfig.bg} 
                                                                ${statusConfig.color} 
                                                                ${statusConfig.border}
                                                                border
                                                                font-semibold
                                                                text-sm
                                                                px-4 py-2.5
                                                                rounded-xl
                                                                flex items-center gap-2
                                                                w-fit
                                                                backdrop-blur-sm
                                                                shadow-sm
                                                            `}
                                                            variant="outline"
                                                        >
                                                            <StatusIcon className="h-4 w-4" />
                                                            {statusConfig.label}
                                                        </Badge>
                                                    </TableCell>
                                                )}

                                                {columnVisibility.actions && (
                                                    <TableCell className="py-5 px-6">
                                                        <div className="flex justify-end gap-2">
                                                            {mr.status === "PENDING" && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="default"
                                                                    onClick={() => handleApprove(mr)}
                                                                    className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold shadow-md"
                                                                >
                                                                    <CheckCheck className="h-4 w-4 mr-2" />
                                                                    Approve
                                                                </Button>
                                                            )}

                                                            <Sheet open={showDetailSheet && selectedMR?.id === mr.id} onOpenChange={setShowDetailSheet}>
                                                                <SheetTrigger asChild>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => handleViewDetails(mr)}
                                                                        className="border-slate-300 font-semibold hover:bg-slate-50"
                                                                    >
                                                                        <Eye className="h-4 w-4 mr-2" />
                                                                        Detail
                                                                    </Button>
                                                                </SheetTrigger>
                                                                <MRDetailSheet
                                                                    mr={selectedMR}
                                                                    qrCodeUrl={qrCodeUrl}
                                                                    onScanQRCode={handleScanQRCode}
                                                                />
                                                            </Sheet>

                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="border-slate-300"
                                                                    >
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-48">
                                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem onClick={() => handleViewDetails(mr)}>
                                                                        <Eye className="h-4 w-4 mr-2" />
                                                                        View Details
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem>
                                                                        <Download className="h-4 w-4 mr-2" />
                                                                        Download PDF
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem>
                                                                        <Printer className="h-4 w-4 mr-2" />
                                                                        Print
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem className="text-red-600">
                                                                        <AlertTriangle className="h-4 w-4 mr-2" />
                                                                        Reject
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {!isLoading && paginatedData.length > 0 && (
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-5 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-white/50">
                            <div className="text-sm text-slate-600">
                                Menampilkan <span className="font-semibold text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> -{" "}
                                <span className="font-semibold text-slate-800">
                                    {Math.min(currentPage * itemsPerPage, filteredData.length)}
                                </span> dari{" "}
                                <span className="font-semibold text-slate-800">{filteredData.length}</span> entri
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className="border-slate-300 rounded-lg"
                                >
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="border-slate-300 rounded-lg"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="flex items-center gap-2 mx-2">
                                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                        const pageNum = i + 1;
                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`
                                                    w-10 h-10 rounded-lg
                                                    ${currentPage === pageNum
                                                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
                                                        : 'border-slate-300'
                                                    }
                                                `}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                    {totalPages > 5 && (
                                        <span className="px-2 text-slate-500">...</span>
                                    )}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="border-slate-300 rounded-lg"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="border-slate-300 rounded-lg"
                                >
                                    <ChevronsRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            )}


            {/* QR Scanner Dialog */}
            <QRScannerDialog
                open={showQRScanner}
                onOpenChange={setShowQRScanner}
                expectedToken={selectedMR?.qrToken}
                title="Scan QR Code untuk Approve"
                description="Scan QR Code pada Material Requisition untuk memverifikasi dan menyetujui permintaan"
                onScanSuccess={async (scannedToken) => {
                    console.log("QR Scanned successfully:", scannedToken)
                    console.log("Approve MR:", selectedMR?.id)

                    try {
                        setIsProcessingQR(true)
                        setShowQRScanner(false)

                        // Call backend API to issue MR
                        const result = await issueMR({
                            qrToken: scannedToken,
                            issuedById: "temp-user-id" // TODO: Get from auth session
                        })

                        console.log("API Response:", result)

                        if (result.success) {
                            toast.success("Material berhasil dikeluarkan!", {
                                description: "Stok telah diperbarui dan MR telah diproses."
                            })
                            // Refresh data
                            onRefresh()
                        } else {
                            toast.error("Gagal mengeluarkan material", {
                                description: result.error || "Terjadi kesalahan saat memproses"
                            })
                        }
                    } catch (error: any) {
                        console.error("Issue MR Error:", error)
                        toast.error("Terjadi kesalahan", {
                            description: "Koneksi ke server terputus"
                        })
                    } finally {
                        setIsProcessingQR(false)
                    }
                }}
            />
        </div>
    )
}

export default TableMR