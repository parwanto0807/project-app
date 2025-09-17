import * as React from "react"
import { format } from "date-fns"
import {
    FileTextIcon,
    PlusCircleIcon,
    SearchIcon,
    ShoppingCartIcon,
    UserCheck2Icon,
    Edit,
    MoreHorizontal,
    Eye,
    Trash2,
    EyeIcon,
    DownloadIcon,
    EyeOff,
    Loader2,
    CalendarIcon,
} from "lucide-react"
import Decimal from "decimal.js"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getExpandedRowModel,
    type ExpandedState,
    getSortedRowModel,
    SortingState,
} from "@tanstack/react-table"
import { useRouter } from "next/navigation"

import { type SalesOrder } from "@/lib/validations/sales-order"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
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
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import Link from "next/link"
import { FaToolbox } from "react-icons/fa"
import { CheckCircle2, ReceiptText, MinusCircle } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import SalesOrderPdfPreview, { SalesOrderFormData } from "./SalesOrderPdfPreview"
import { mapFormToPdfData } from "./SalesOrderPDF";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { pdf } from "@react-pdf/renderer"
import { SalesOrderPDF } from "./SalesOrderPDF"
import { OrderStatusEnum } from "@/schemas/index";
import * as z from "zod";


type OrderStatus = z.infer<typeof OrderStatusEnum>;

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
    DRAFT: {
        label: "Draft",
        className: "bg-gray-100 text-gray-700 border-gray-200",
    },
    SENT: {
        label: "Sent",
        className: "bg-yellow-100 text-yellow-700 border-yellow-200",
    },
    CONFIRMED: {
        label: "Confirmed",
        className: "bg-indigo-100 text-indigo-700 border-indigo-200",
    },
    IN_PROGRESS_SPK: {
        label: "In Progress SPK",
        className: "bg-orange-100 text-orange-700 border-orange-200",
    },
    FULFILLED: {
        label: "Fulfilled",
        className: "bg-purple-100 text-purple-700 border-purple-200",
    },
    PARTIALLY_INVOICED: {
        label: "Partially Invoiced",
        className: "bg-cyan-100 text-cyan-700 border-cyan-200",
    },
    INVOICED: {
        label: "Invoiced",
        className: "bg-blue-100 text-blue-700 border-blue-200",
    },
    PARTIALLY_PAID: {
        label: "Partially Paid",
        className: "bg-teal-100 text-teal-700 border-teal-200",
    },
    PAID: {
        label: "Paid",
        className: "bg-green-100 text-green-700 border-green-200",
    },
    CANCELLED: {
        label: "Cancelled",
        className: "bg-red-100 text-red-700 border-red-200",
    },
};


interface SalesOrderTableProps {
    salesOrders: SalesOrder[]
    isLoading: boolean
    onDeleteOrder?: (id: string) => Promise<void> | void;
    role: string
}

// Helper component to render the expanded details of an order
function SalesOrderDetail({ order }: { order: SalesOrder }) {
    const total = order.items.reduce((sum, item) => {
        const itemQty = new Decimal(item.qty.toString())
        const itemPrice = new Decimal(item.unitPrice.toString())
        return sum.plus(itemQty.times(itemPrice))
    }, new Decimal(0))

    const formatIDR = (n: number) =>
        new Intl.NumberFormat("id-ID", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(n)

    return (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6 rounded-lg">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6 mb-4 md:mb-6">
                {/* Customer Details */}
                <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-primary flex items-center gap-2">
                        <UserCheck2Icon className="h-4 w-4" />
                        <span className="hidden md:inline">Customer Details</span>
                        <span className="md:hidden">Customer</span>
                    </h4>
                    <p className="text-sm font-medium">{order.customer.name}</p>
                    <p className="text-xs md:text-sm text-muted-foreground text-wrap">
                        {order.customer.address?.substring(0, 60) ?? "No address provided"}
                        {order.customer.address && order.customer.address.length > 60 ? "..." : ""}
                    </p>
                </div>

                {/* Order Info */}
                <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-primary">
                        <span className="hidden md:inline">Order Info</span>
                        <span className="md:hidden">Info</span>
                    </h4>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize text-xs">
                            {order.type.toLowerCase()}
                        </Badge>
                        {order.type === "SUPPORT" && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                Support
                            </Badge>
                        )}
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground">
                        {format(new Date(order.soDate), "dd MMM yyyy")}
                    </p>
                </div>

                {/* Document Status */}
                <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-primary">
                        <span className="hidden md:inline">Document Status</span>
                        <span className="md:hidden">Documents</span>
                    </h4>
                    {Array.isArray(order.documents) && order.documents.length > 0 ? (
                        <ul className="space-y-1 text-xs md:text-sm">
                            {renderDocumentStatus(order.documents)}
                        </ul>
                    ) : (
                        <p className="text-xs md:text-sm text-muted-foreground">No documents yet</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
                {/* Financial Summary */}
                <div className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-lg border">
                    <h4 className="font-semibold text-sm text-primary mb-2 md:mb-3">
                        <span className="hidden md:inline">Financial Summary</span>
                        <span className="md:hidden">Financials</span>
                    </h4>
                    <div className="space-y-1 md:space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs md:text-sm text-muted-foreground">Subtotal</span>
                            <span className="text-xs md:text-sm font-medium">
                                Rp {formatIDR(total.toNumber())}
                            </span>
                        </div>
                        <div className="flex justify-between items-center border-t pt-1 md:pt-2">
                            <span className="text-xs md:text-sm font-semibold">Total</span>
                            <span className="text-sm md:text-lg font-bold text-green-600">
                                Rp {formatIDR(total.toNumber())}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-lg border">
                    <h4 className="font-semibold text-sm text-primary mb-2 md:mb-3">
                        <span className="hidden md:inline">Quick Actions</span>
                        <span className="md:hidden">Actions</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" className="text-xs h-8">
                            <FileTextIcon className="h-3 w-3 mr-1" />
                            Docs
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs h-8">
                            <ReceiptText className="h-3 w-3 mr-1" />
                            Invoice
                        </Button>
                    </div>
                </div>
            </div>

            {/* Order Items */}
            <div>
                <h4 className="font-semibold text-sm text-primary mb-2 md:mb-3 flex items-center gap-2">
                    <ShoppingCartIcon className="h-4 w-4" />
                    <span className="hidden md:inline">Order Items</span>
                    <span className="md:hidden">Items</span>
                </h4>
                <div className="rounded-lg border bg-white dark:bg-slate-800 overflow-hidden">
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="font-semibold text-xs md:text-sm">Product/Service</TableHead>
                                    <TableHead className="text-right font-semibold text-xs md:text-sm">Qty</TableHead>
                                    <TableHead className="text-right font-semibold text-xs md:text-sm">Unit Price</TableHead>
                                    <TableHead className="text-right font-semibold text-xs md:text-sm">Subtotal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {order.items.map((item) => {
                                    const itemQty = new Decimal(item.qty.toString())
                                    const itemPrice = new Decimal(item.unitPrice.toString())
                                    const subtotal = itemQty.times(itemPrice)

                                    return (
                                        <TableRow key={item.id} className="hover:bg-muted/30">
                                            <TableCell className="py-2 md:py-3">
                                                <div>
                                                    <p className="font-medium text-xs md:text-sm">{item.name}</p>
                                                    {item.description && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {item.description.substring(0, 50)}
                                                            {item.description.length > 50 ? "..." : ""}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right py-2 md:py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <span className="text-xs md:text-sm">{item.qty}</span>
                                                    {item.uom && (
                                                        <Badge variant="outline" className="text-[10px] md:text-xs">
                                                            {item.uom}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-xs md:text-sm py-2 md:py-3">
                                                Rp {formatIDR(itemPrice.toNumber())}
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-green-600 text-xs md:text-sm py-2 md:py-3">
                                                Rp {formatIDR(subtotal.toNumber())}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                                <TableRow className="bg-muted/30">
                                    <TableCell colSpan={3} className="text-right font-semibold text-xs md:text-sm py-2 md:py-3">
                                        Total
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-sm md:text-lg text-green-600 py-2 md:py-3">
                                        Rp {formatIDR(total.toNumber())}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile view for order items */}
                    <div className="md:hidden p-3 space-y-3">
                        {order.items.map((item) => {
                            const itemQty = new Decimal(item.qty.toString())
                            const itemPrice = new Decimal(item.unitPrice.toString())
                            const subtotal = itemQty.times(itemPrice)

                            return (
                                <div key={item.id} className="border rounded-lg p-3 bg-white">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{item.name}</p>
                                            {item.description && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {item.description.substring(0, 60)}
                                                    {item.description.length > 60 ? "..." : ""}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-muted-foreground">Qty: </span>
                                            <span className="font-medium">{item.qty}</span>
                                            {item.uom && (
                                                <Badge variant="outline" className="ml-1 text-[10px]">
                                                    {item.uom}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className="text-muted-foreground">Price: </span>
                                            <span className="font-medium">Rp {formatIDR(itemPrice.toNumber())}</span>
                                        </div>
                                        <div className="col-span-2 text-right border-t pt-1">
                                            <span className="text-muted-foreground">Subtotal: </span>
                                            <span className="font-medium text-green-600">Rp {formatIDR(subtotal.toNumber())}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        <div className="border-t pt-3 text-right">
                            <span className="font-semibold text-sm">Total: </span>
                            <span className="font-bold text-lg text-green-600">Rp {formatIDR(total.toNumber())}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Helper function to render document status
function renderDocumentStatus(documents: { docType: "QUOTATION" | "PO" | "BAP" | "INVOICE" | "PAYMENT_RECEIPT" }[]) {
    const has = (type: "QUOTATION" | "PO" | "BAP" | "INVOICE" | "PAYMENT_RECEIPT") =>
        Array.isArray(documents) && documents.some((d) => d.docType === type);

    const DocumentRow = ({ ok, label }: { ok: boolean; label: string }) => (
        <li className="flex items-center gap-2 py-1">
            {ok ? (
                <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
            ) : (
                <MinusCircle className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            )}
            <span className={cn(
                "text-xs md:text-sm",
                ok ? "text-green-700 font-medium" : "text-muted-foreground"
            )}>
                {label}
            </span>
        </li>
    );

    return (
        <>
            <DocumentRow ok={has("QUOTATION")} label="Quotation" />
            <DocumentRow ok={has("PO")} label="PO Received" />
            <DocumentRow ok={has("BAP")} label="BAST" />
            <DocumentRow ok={has("INVOICE")} label="Invoiced" />
            <DocumentRow ok={has("PAYMENT_RECEIPT")} label="Paid" />
        </>
    );
}

// Komponen ActionsCell terpisah untuk menghindari masalah hook
function ActionsCell({ order, onDeleteSuccess, role }: { order: SalesOrder; onDeleteSuccess: (orderId: string) => void; role?: { role: string } }) {
    const router = useRouter()
    const isMobile = useMediaQuery("(max-width: 768px)")
    const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
    const [isDeleting, setIsDeleting] = React.useState(false)

    // Lock body scroll ketika dialog terbuka
    useBodyScrollLock(showDeleteDialog);

    const handleDeleteOrder = async () => {
        setIsDeleting(true)
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/salesOrder/sales-orders/remove/${order.id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            setShowDeleteDialog(false)

            // Panggil callback untuk update state lokal
            onDeleteSuccess(order.id)

            // Optional: refresh data dari server setelah 500ms
            setTimeout(() => {
                router.refresh()
            }, 500)

        } catch (error) {
            console.error("Error deleting order:", error)
            setShowDeleteDialog(false)
        } finally {
            setIsDeleting(false)
        }
    }

    function handleEditOrder(e: React.MouseEvent) {
        e.stopPropagation()
        router.push(`${getBasePath(role?.role)}/update/${order.id}`)
        // router.push(`/admin-area/sales/salesOrder/update/${order.id}`)
    }

    function handleViewDetails(e: React.MouseEvent) {
        e.stopPropagation()
        // console.log("View order details:", order.id)
    }

    function handleDeleteClick(e: React.MouseEvent) {
        e.stopPropagation()
        e.preventDefault()
        setShowDeleteDialog(true)
    }

    function cancelDelete(e: React.MouseEvent) {
        e.stopPropagation()
        setShowDeleteDialog(false)
    }

    if (isMobile) {
        return (
            <>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 cursor-pointer hover:bg-muted"
                            onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                            }}
                        >
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem
                            className="cursor-pointer gap-2 text-xs"
                            onClick={handleViewDetails}
                        >
                            <Eye className="h-3 w-3" />
                            View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="cursor-pointer gap-2 text-xs"
                            onClick={handleEditOrder}
                        >
                            <Edit className="h-3 w-3" />
                            Edit Order
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 cursor-pointer gap-2 text-xs"
                            onClick={handleDeleteClick}
                        >
                            <Trash2 className="h-3 w-3" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {showDeleteDialog && (
                    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                        <div className="bg-white dark:bg-slate-900 rounded-lg border p-6 w-11/12 max-w-md">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Delete Sales Order</h3>
                                <p className="text-muted-foreground text-wrap">
                                    Are you sure you want to delete sales order{" "}
                                    <span className="font-semibold">{order.soNumber}</span>?
                                    This action cannot be undone.
                                </p>
                                <div className="flex justify-end space-x-3">
                                    <Button
                                        variant="outline"
                                        onClick={cancelDelete}
                                        disabled={isDeleting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleDeleteOrder}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? "Deleting..." : "Delete"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </>
        )
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 cursor-pointer hover:bg-muted"
                        onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                        }}
                    >
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem
                        className="cursor-pointer gap-2"
                        onClick={handleEditOrder}
                    >
                        <Edit className="h-4 w-4" />
                        Edit Order
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 cursor-pointer gap-2"
                        onClick={handleDeleteClick}
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {showDeleteDialog && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white dark:bg-slate-900 rounded-lg border p-6 w-11/12 max-w-md">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Delete Sales Order</h3>
                            <p className="text-muted-foreground text-wrap">
                                Are you sure you want to delete sales order{" "}
                                <span className="font-semibold">{order.soNumber}</span>?
                                This action cannot be undone.
                            </p>
                            <div className="flex justify-end space-x-3">
                                <Button
                                    variant="outline"
                                    onClick={cancelDelete}
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleDeleteOrder}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? "Deleting..." : "Delete"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

// Mobile Card View
function MobileSalesOrderCard({ order, onExpand, onDeleteSuccess }: { order: SalesOrder; onExpand: () => void; onDeleteSuccess: (orderId: string) => void }) {
    const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
    const [isDeleting, setIsDeleting] = React.useState(false)
    const router = useRouter()
    const pdfActions = usePdfActions();
    const [isExpanded, setisExpanded] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const status = (order?.status ?? "DRAFT") as OrderStatus;
    const config = statusConfig[status] || statusConfig.DRAFT;

    const handleClick = async () => {
        setIsLoading(true);
        try {
            await pdfActions.handleDownloadPdf(order); // Pastikan ini async/returns Promise
        } catch (error) {
            console.error('Download failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleExpand = () => {
        setisExpanded(prev => !prev)
    }

    const total = order.items.reduce((sum, item) => {
        const itemQty = new Decimal(item.qty ?? 0)
        const itemPrice = new Decimal(item.unitPrice ?? 0)
        return sum.plus(itemQty.times(itemPrice))
    }, new Decimal(0))

    const formattedTotal = new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(total.toNumber())

    // const docs = Array.isArray(order?.documents) ? order.documents : [];
    // const hasPaid = docs.some((d) => d.docType === "PAYMENT_RECEIPT");
    // const hasInvoice = docs.some((d) => d.docType === "INVOICE");

    useBodyScrollLock(showDeleteDialog);

    const handleDeleteOrder = async () => {
        setIsDeleting(true)
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/salesOrder/sales-orders/remove/${order.id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            setShowDeleteDialog(false)

            // Panggil callback untuk update state lokal
            onDeleteSuccess(order.id)

            // Optional: refresh data dari server setelah 500ms
            setTimeout(() => {
                router.refresh()
            }, 500)

        } catch (error) {
            console.error("Error deleting order:", error)
            setShowDeleteDialog(false)
        } finally {
            setIsDeleting(false)
        }
    }

    function handleDeleteClick(e: React.MouseEvent) {
        e.stopPropagation()
        e.preventDefault()
        setShowDeleteDialog(true)
    }

    function cancelDelete(e: React.MouseEvent) {
        e.stopPropagation()
        setShowDeleteDialog(false)
    }

    return (
        <>
            <div className="border rounded-lg p-2 mb-1 bg-white dark:bg-slate-800 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50">
                            <FileTextIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-xs">{order.soNumber}</p>
                            <p className="text-xs text-muted-foreground">
                                {format(new Date(order.soDate), "dd MMM yyyy")}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        {/* <span className="text-sm text-muted-foreground">Status:</span> */}
                        <Badge className={cn("text-xs rounded-md px-2 py-0.5", config.className)}>
                            {config.label}
                        </Badge>
                    </div>
                </div>

                <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2">
                        <FaToolbox className="h-4 w-4 text-red-500" />
                        <span className="text-xs font-medium">{order.project?.name || "No Project"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <UserCheck2Icon className="h-4 w-4 text-purple-500" />
                        <span className="text-xs">{order.customer.name} </span>
                    </div>
                </div>

                <div className="flex items-center justify-between border-t pt-3">
                    <div>
                        <p className="text-xs text-muted-foreground">Total Amount</p>
                        <p className="font-semibold text-green-600">Rp {formattedTotal}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation()
                                onExpand();
                                toggleExpand();
                            }}
                            className="text-xs h-8"
                        >
                            {isExpanded ? (
                                <>
                                    <EyeOff className="h-3 w-3 mr-1" />
                                    Hide
                                </>
                            ) : (
                                <>
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                </>
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClick}
                            disabled={isLoading} // Opsional: disable tombol saat loading
                            className="h-8"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <DownloadIcon className="h-4 w-4" />
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={handleDeleteClick}
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            </div>

            {showDeleteDialog && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white dark:bg-slate-900 rounded-lg border p-6 w-11/12 max-w-md">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Delete Sales Order</h3>
                            <p className="text-muted-foreground text-wrap">
                                Are you sure you want to delete sales order{" "}
                                <span className="font-semibold">{order.soNumber}</span>?
                                This action cannot be undone.
                            </p>
                            <div className="flex justify-end space-x-3">
                                <Button
                                    variant="outline"
                                    onClick={cancelDelete}
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleDeleteOrder}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? "Deleting..." : "Delete"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

// Tambahkan di atas komponen SalesOrderTable
const useBodyScrollLock = (isLocked: boolean) => {
    React.useEffect(() => {
        if (isLocked) {
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [isLocked]);
};

function mapToFormData(order: SalesOrder): SalesOrderFormData {
    return {
        soNumber: order.soNumber,
        soDate: order.soDate ? new Date(order.soDate) : null,
        customerId: order.customerId,
        customerName: order.customer.name,
        branch: order.customer.branch ?? undefined,
        location: order.customer.address ?? undefined,
        customerPIC: order.customer?.contactPerson ?? undefined,
        projectId: order.projectId,
        userId: order.userId,
        type: order.type,
        status: order.status,
        currency: order.currency,
        notes: order.notes,
        isTaxInclusive: order.isTaxInclusive,
        items: order.items.map(item => ({
            itemType: item.itemType,
            productId: item.productId ?? null,
            name: item.name ?? "N/A",
            description: item.description ?? null,
            uom: item.uom ?? null,
            qty: item.qty ?? 0,
            unitPrice: item.unitPrice ?? 0,
            discount: item.discount ?? 0,
            taxRate: item.taxRate ?? 0,
        })),
        project: order.project,
        customer: order.customer
            ? { ...order.customer, branch: order.customer.branch ?? undefined }
            : undefined,
    };
}

// Custom hook for PDF actions
function usePdfActions() {
    const [pdfDialogOpen, setPdfDialogOpen] = React.useState(false);
    const [selectedOrder, setSelectedOrder] = React.useState<SalesOrderFormData | null>(null);

    const handleDownloadPdf = React.useCallback(async (order: SalesOrder) => {
        try {
            const formData = mapToFormData(order);
            const pdfData = mapFormToPdfData(formData);

            const blob = await pdf(<SalesOrderPDF data={pdfData} />).toBlob();
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `SalesOrder-${order.id}.pdf`;
            a.click();

            setTimeout(() => URL.revokeObjectURL(url), 100);
        } catch (error) {
            console.error("Error generating PDF:", error);
        }
    }, []);

    const handlePreview = React.useCallback((order: SalesOrder) => {
        setSelectedOrder(mapToFormData(order));
        setPdfDialogOpen(true);
    }, []);

    return {
        pdfDialogOpen,
        setPdfDialogOpen,
        selectedOrder,
        handleDownloadPdf,
        handlePreview
    };
}

function getBasePath(role?: string) {
    return role === "super"
        ? "/super-admin-area/sales/salesOrder"
        : "/admin-area/sales/salesOrder"
}


export function SalesOrderTable({ salesOrders: initialSalesOrders, isLoading, onDeleteOrder, role }: SalesOrderTableProps) {
    const [searchTerm, setSearchTerm] = React.useState("")
    const [currentPage, setCurrentPage] = React.useState(1)
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)
    const [orderToDelete, setOrderToDelete] = React.useState<string | null>(null)
    const itemsPerPage = 10
    const [expanded, setExpanded] = React.useState<ExpandedState>({})
    const isMobile = useMediaQuery("(max-width: 768px)")
    const [salesOrders, setSalesOrders] = React.useState<SalesOrder[]>(initialSalesOrders)
    const handleDelete = onDeleteOrder ?? (() => { });
    const pdfActions = usePdfActions();
    const basePath = getBasePath(role);

    // Update local state when prop changes
    React.useEffect(() => {
        setSalesOrders(initialSalesOrders)
    }, [initialSalesOrders])

    const handleDeleteSuccess = React.useCallback((deletedOrderId: string) => {
        // Hapus order dari state lokal
        setSalesOrders(prevOrders => {
            const newOrders = prevOrders.filter(order => order.id !== deletedOrderId)
            return newOrders
        })

        // Panggil parent callback
        if (onDeleteOrder) {
            onDeleteOrder(deletedOrderId)
        }
    }, [onDeleteOrder])

    const confirmDelete = () => {
        if (orderToDelete) {
            handleDelete(orderToDelete)
        }
        setDeleteConfirmOpen(false)
        setOrderToDelete(null)
    }

    const cancelDelete = () => {
        setDeleteConfirmOpen(false)
        setOrderToDelete(null)
    }

    const columns: ColumnDef<SalesOrder>[] = React.useMemo(() => [
        {
            accessorKey: "soNumber",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="SO Number" />
            ),
            cell: ({ row }) => {
                const order = row.original
                return (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50">
                            <FileTextIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="font-medium text-base">{order.soNumber}</p>
                            <p className="text-sm text-muted-foreground">
                                {format(new Date(order.soDate), "dd MMM yyyy")}
                            </p>
                        </div>
                    </div>
                )
            },
        },
        {
            accessorKey: "project.name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Project" />
            ),
            cell: ({ row }) => {
                const order = row.original
                return (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/50">
                            <FaToolbox className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="font-medium">{order.project?.name || "No Project"}</p>
                            <p className="text-sm text-muted-foreground">
                                {order.customer.name} - Cabang : {order.customer.branch ?? "-"}
                            </p>
                        </div>
                    </div>
                )
            },
        },
        {
            accessorKey: "status",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Status" />
            ),
            cell: ({ row }) => {
                const order = row.original;
                const docs = Array.isArray(order?.documents) ? order.documents : [];
                const has = (t: "QUOTATION" | "PO" | "BAP" | "INVOICE" | "PAYMENT_RECEIPT") =>
                    docs.some((d) => d.docType === t);

                // Override jika ada dokumen tertentu
                if (has("PAYMENT_RECEIPT")) {
                    return (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 rounded-md px-2.5 py-0.5">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Paid
                        </Badge>
                    );
                }

                if (has("INVOICE")) {
                    return (
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 rounded-md px-2.5 py-0.5">
                            <ReceiptText className="mr-1 h-3 w-3" />
                            Invoiced
                        </Badge>
                    );
                }

                // Ambil status, fallback ke "DRAFT"
                const status = (order?.status ?? "DRAFT") as OrderStatus;

                // Ambil konfigurasi berdasarkan status
                const config = statusConfig[status] || statusConfig.DRAFT;

                return (
                    <Badge className={`capitalize rounded-md px-2.5 py-0.5 ${config.className}`}>
                        {config.label}
                    </Badge>
                );
            },
        },
        {
            id: "total",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Total Amount" />
            ),
            cell: ({ row }) => {
                const order = row.original
                const total = order.items.reduce((sum, item) => {
                    const itemQty = new Decimal(item.qty ?? 0)
                    const itemPrice = new Decimal(item.unitPrice ?? 0)
                    return sum.plus(itemQty.times(itemPrice))
                }, new Decimal(0))

                const formatted = new Intl.NumberFormat("id-ID", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                }).format(total.toNumber())

                return (
                    <div className="text-right">
                        <p className="font-semibold text-green-600">Rp {formatted}</p>
                        <p className="text-xs text-muted-foreground">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                )
            },
        },
        {
            id: "actions",
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => {
                const order = row.original;

                return (
                    <div className="flex justify-end gap-2">
                        <ActionsCell order={row.original} onDeleteSuccess={handleDeleteSuccess} />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => row.toggleExpanded(!row.getIsExpanded())}
                            className="flex items-center gap-2 cursor-pointer"
                        >
                            <Eye className="h-4 w-4" />
                            {row.getIsExpanded() ? "Hide" : "View"}
                        </Button>


                        <Dialog open={pdfActions.pdfDialogOpen} onOpenChange={pdfActions.setPdfDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => pdfActions.handlePreview(order)}
                                >
                                    <EyeIcon className="h-4 w-4 mr-1" />
                                    Preview
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh]">
                                <DialogHeader>
                                    <DialogTitle>Preview Sales Order - {order.soNumber}</DialogTitle>
                                </DialogHeader>
                                {pdfActions.selectedOrder && (
                                    <SalesOrderPdfPreview formData={pdfActions.selectedOrder} />
                                )}
                            </DialogContent>
                        </Dialog>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => pdfActions.handleDownloadPdf(order)}
                        >
                            <DownloadIcon className="h-4 w-4" />
                        </Button>
                    </div>
                )
            },
        },
    ], [handleDeleteSuccess, pdfActions])

    const filteredSalesOrders = React.useMemo(() => {
        return salesOrders.filter((order) => {
            return (
                order.soNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.project?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.customer.branch?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        })
    }, [salesOrders, searchTerm])

    const paginatedOrders = React.useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        return filteredSalesOrders.slice(startIndex, startIndex + itemsPerPage)
    }, [filteredSalesOrders, currentPage])

    const totalPages = Math.ceil(filteredSalesOrders.length / itemsPerPage)

    const table = useReactTable({
        data: paginatedOrders,
        columns,
        state: {
            expanded,
            sorting,
        },
        onExpandedChange: setExpanded,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getRowId: (row) => row.id,
    })

    if (isMobile) {
        return (
            <>
                <Card className="border-none shadow-lg gap-4">
                    <CardHeader className="flex flex-col gap-4 bg-gradient-to-r from-cyan-600 to-purple-600 p-2 rounded-lg text-white shadow-lg transform transition-all duration-300 hover:shadow-xl">
                        <div className="flex flex-col space-y-1">
                            <div className="flex items-center space-x-3">
                                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary">
                                    <ShoppingCartIcon className="h-6 w-6 text-primary-foreground" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Sales Orders </CardTitle>
                                    <p className="text-sm text-white dark:text-muted-foreground">
                                        Manage sales orders
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <div className="flex flex-col space-y-2">
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                            <Input
                                placeholder="Search orders..."
                                className="w-full pl-9"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setCurrentPage(1)
                                }}
                            />
                        </div>
                        <Link href={`${basePath}/create`} passHref>
                            <Button className="bg-primary hover:bg-primary/90 w-full">
                                <PlusCircleIcon className="mr-2 h-4 w-4" />
                                New Order
                            </Button>
                        </Link>
                    </div>
                    <CardContent className="p-1">
                        {isLoading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="border rounded-lg p-2 bg-white">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-10 w-10 rounded-full" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-32" />
                                                    <Skeleton className="h-3 w-24" />
                                                </div>
                                            </div>
                                            <Skeleton className="h-6 w-16" />
                                        </div>
                                        <Skeleton className="h-4 w-full mb-2" />
                                        <Skeleton className="h-4 w-3/4 mb-3" />
                                        <div className="flex justify-between items-center border-t pt-3">
                                            <Skeleton className="h-4 w-20" />
                                            <div className="flex gap-2">
                                                <Skeleton className="h-8 w-16" />
                                                <Skeleton className="h-8 w-8" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                {paginatedOrders.map((order) => {
                                    const row = table.getRow(order.id)

                                    return (
                                        <React.Fragment key={order.id}>
                                            <MobileSalesOrderCard
                                                order={order}
                                                onExpand={() => row?.toggleExpanded(!row.getIsExpanded())}
                                                onDeleteSuccess={handleDeleteSuccess}
                                            />

                                            {/* Tambahkan detailnya di sini */}
                                            {row?.getIsExpanded() && (
                                                <div className="p-4 mb-4 bg-white dark:bg-slate-950 border rounded-md text-sm shadow">
                                                    <div className="mt-0 mb-4 md:hidden">
                                                        <div className="text-sm font-medium mb-2 text-green-600 ">Detail Items:</div>
                                                        {order.items.map((item, idx) => (
                                                            <div key={idx} className="mb-3 pb-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0 last:mb-0 last:pb-0">
                                                                <div className="font-medium">{item.name}</div>
                                                                {item.description && (
                                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                        {item.description}
                                                                    </div>
                                                                )}
                                                                <div className="flex justify-between mt-2">
                                                                    <span>{item.qty} x Rp {item.unitPrice.toLocaleString('id-ID')}</span>
                                                                    <span className="font-medium">
                                                                        Rp {(item.qty * item.unitPrice).toLocaleString('id-ID')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <div className="flex justify-between mt-1 pt-1 border-t border-gray-200 dark:border-gray-700 font-bold">
                                                            <span>Total Amount:</span>
                                                            <span>
                                                                Rp {order.items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0).toLocaleString('id-ID')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </React.Fragment>
                                    )
                                })}


                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between pt-1 border-t mt-1">
                                        <p className="text-xs text-muted-foreground">
                                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredSalesOrders.length)} of {filteredSalesOrders.length} orders
                                        </p>
                                        <Pagination>
                                            <PaginationContent>
                                                <PaginationItem>
                                                    <PaginationPrevious
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                                                        }}
                                                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                                    />
                                                </PaginationItem>
                                                <PaginationItem>
                                                    <span className="px-2 text-xs">
                                                        {currentPage}/{totalPages}
                                                    </span>
                                                </PaginationItem>
                                                <PaginationItem>
                                                    <PaginationNext
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                                                        }}
                                                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                                    />
                                                </PaginationItem>
                                            </PaginationContent>
                                        </Pagination>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the sales order
                                {orderToDelete && (
                                    <span className="font-semibold"> {
                                        salesOrders.find(order => order.id === orderToDelete)?.soNumber
                                    }</span>
                                )}.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmDelete}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </>
        )
    }

    return (
        <Card className="border-none shadow-lg gap-4">
            <CardHeader className="bg-gradient-to-r from-cyan-600 to-purple-600 p-4 rounded-lg text-white">
                <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary">
                            <ShoppingCartIcon className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl">Sales Orders</CardTitle>
                            <p className="text-sm text-white">
                                Manage and track all sales orders
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-white" />
                            <Input
                                placeholder="Search orders..."
                                className="w-full pl-9 sm:w-64"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setCurrentPage(1)
                                }}
                            />
                        </div>
                        <Link href={`${basePath}/create`} passHref>
                            <Button className="bg-primary hover:bg-primary/90">
                                <PlusCircleIcon className="mr-2 h-4 w-4" />
                                New Order
                            </Button>
                        </Link>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-2">
                {isLoading ? (
                    <div className="space-y-4 p-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="space-y-2 flex-grow">
                                    <Skeleton className="h-4 w-48" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                                <Skeleton className="h-6 w-20" />
                                <Skeleton className="h-8 w-24" />
                                <Skeleton className="h-8 w-8" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="rounded-b-lg">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => (
                                                <TableHead key={header.id} className="py-4 font-semibold">
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(header.column.columnDef.header, header.getContext())}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableHeader>

                                <TableBody>
                                    {table.getRowModel().rows.length ? (
                                        table.getRowModel().rows.map((row) => (
                                            <React.Fragment key={row.id}>
                                                <TableRow
                                                    data-state={row.getIsSelected() && "selected"}
                                                    className="cursor-pointer hover:bg-muted/30"
                                                    onClick={(e) => {
                                                        // Hanya toggle expanded jika klik tidak pada button/action
                                                        if (!e.defaultPrevented) {
                                                            row.toggleExpanded(!row.getIsExpanded())
                                                        }
                                                    }}
                                                >
                                                    {row.getVisibleCells().map((cell) => (
                                                        <TableCell key={cell.id} className="py-4">
                                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>

                                                {row.getIsExpanded() && (
                                                    <TableRow key={`${row.id}-expanded`}>
                                                        <TableCell
                                                            colSpan={table.getVisibleLeafColumns().length}
                                                            className="p-0 border-b-2 border-primary/20"
                                                        >
                                                            <SalesOrderDetail order={row.original} />
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={table.getVisibleLeafColumns().length}
                                                className="h-24 text-center text-muted-foreground p-6"
                                            >
                                                <div className="flex flex-col items-center justify-center py-8">
                                                    <ShoppingCartIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                                    <p className="text-lg font-medium">No orders found</p>
                                                    <p className="text-sm text-muted-foreground mb-4">
                                                        {searchTerm ? "Try adjusting your search query" : "Get started by creating a new sales order"}
                                                    </p>
                                                    {!searchTerm && (
                                                        <Link href={`${basePath}/create`} passHref>
                                                            <Button>
                                                                <PlusCircleIcon className="mr-2 h-4 w-4" />
                                                                Create Order
                                                            </Button>
                                                        </Link>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-between p-4 border-t">
                                <p className="text-sm text-muted-foreground">
                                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredSalesOrders.length)} of {filteredSalesOrders.length} orders
                                </p>
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                                                }}
                                                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                            />
                                        </PaginationItem>
                                        <PaginationItem>
                                            <span className="px-4 text-sm">
                                                Page {currentPage} of {totalPages}
                                            </span>
                                        </PaginationItem>
                                        <PaginationItem>
                                            <PaginationNext
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                                                }}
                                                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    )
}