import * as React from "react"
import { format } from "date-fns"
import { useRouter, useSearchParams } from "next/navigation"
import {
    BarChart2,
    ChevronUp,
    Edit,
    EyeIcon,
    FileTextIcon,
    MinusCircle,
    MoreHorizontal,
    Plus,
    ShoppingCartIcon,
    Trash2,
    TrendingDown,
    TrendingUp,
    UserCheck2Icon,
} from "lucide-react"
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

import { type SalesOrder } from "@/lib/validations/sales-order"
import { Card, CardContent } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import SalesOrderPdfPreview, { SalesOrderFormData } from "./SalesOrderPdfPreview"
import { mapFormToPdfData } from "./SalesOrderPDF";
import { SalesOrderPDF } from "./SalesOrderPDF"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { FaToolbox } from "react-icons/fa"
import { CheckCircle2, ReceiptText } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { OrderStatusEnum } from "@/schemas/index";
import * as z from "zod";
import Decimal from "decimal.js"
import { Button } from "@/components/ui/button"
import { pdf } from "@react-pdf/renderer"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SalesOrderSummary } from "./salesOrderSummary"

type OrderStatus = z.infer<typeof OrderStatusEnum>;

function getBasePath(role?: string) {
    const paths: Record<string, string> = {
        super: "/super-admin-area/sales/salesOrder",
        pic: "/pic-area/sales/salesOrder",
        admin: "/admin-area/sales/salesOrder",
    }
    return paths[role ?? "admin"] || "/admin-area/sales/salesOrder"
}

function getBasePathSPK(role?: string) {
    const paths: Record<string, string> = {
        super: "/super-admin-area/logistic/spk",
        pic: "/pic-area/logistic/spk",
        admin: "/admin-area/logistic/spk",
    }
    return paths[role ?? "admin"] || "/admin-area/logistic/spk"
}

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
    DRAFT: {
        label: "Draft",
        className: "bg-red-400 text-gray-700 border-gray-200",
    },
    CONFIRMED: {
        label: "Confirmed",
        className: "bg-indigo-300 text-indigo-800 border-indigo-200",
    },
    IN_PROGRESS_SPK: {
        label: "In Progress SPK",
        className: "bg-orange-300 text-orange-800 border-orange-200",
    },
    FULFILLED: {
        label: "SPK Closing",
        className: "bg-blue-500 text-white border-purple-200",
    },
    BAST: {
        label: "BAST",
        className: "bg-purple-300 text-purple-800 border-purple-200",
    },
    PARTIALLY_INVOICED: {
        label: "Partially Invoiced",
        className: "bg-cyan-300 text-cyan-800 border-cyan-200",
    },
    INVOICED: {
        label: "Invoiced",
        className: "bg-blue-300 text-blue-800 border-blue-200",
    },
    PARTIALLY_PAID: {
        label: "Partially Paid",
        className: "bg-teal-300 text-teal-800 border-teal-200",
    },
    PAID: {
        label: "Paid",
        className: "bg-green-300 text-green-800 border-green-200",
    },
    CANCELLED: {
        label: "Cancelled",
        className: "bg-red-300 text-red-800 border-red-200",
    },
};

interface SalesOrderTableProps {
    salesOrders: SalesOrder[]
    isLoading: boolean
    onDeleteSuccess?: (orderId: string) => void;
    onDeleteOrder?: (id: string) => Promise<void> | void;
    role: string;
    highlightId: string | null;
}

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
export function useBodyScrollLock(locked: boolean) {
    React.useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;

        if (locked) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = originalStyle;
        }

        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, [locked]);
}

function ActionsCell({ order, onDeleteSuccess, role }: { order: SalesOrder; onDeleteSuccess: (orderId: string) => void; role: string }) {
    const router = useRouter()
    const isMobile = useMediaQuery("(max-width: 768px)")
    const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
    const [isDeleting, setIsDeleting] = React.useState(false)
    const searchParams = useSearchParams();
    const page = Number(searchParams.get("page")) || 1;
    const highlightStatus = searchParams.get("status") || "";
    const pageSize = searchParams.get("pageSize") || "";
    const searchUrl = searchParams.get("search") || "";

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
        e.stopPropagation();

        const basePath = getBasePath(role);
        const currentPage = page || 1;

        const highlightId = order.id;
        const status = highlightStatus ?? undefined;
        const itemPerPage = pageSize;
        const search = searchUrl;
        const returnUrl = `${basePath}?pageSize=${itemPerPage}&page=${currentPage}&highlightId=${highlightId}&status=${status}&search=${search}`;

        const url = new URL(`${basePath}/update/${order.id}`, window.location.origin);

        url.searchParams.set("returnUrl", returnUrl);
        url.searchParams.set("highlightId", highlightId);
        if (itemPerPage)
            url.searchParams.set("pageSize", itemPerPage)
        if (status) {
            url.searchParams.set("status", status)
        }

        router.push(url.toString());
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
                            onClick={handleEditOrder}
                            disabled={[
                                "INVOICED",
                                "PAID",
                                "BAST",
                                "PARTIALLY_INVOICED",
                                "PARTIALLY_PAID",
                            ].includes(order.status)}
                            className={`cursor-pointer gap-2 text-xs ${[
                                "INVOICED",
                                "PAID",
                                "BAST",
                                "PARTIALLY_INVOICED",
                                "PARTIALLY_PAID",
                            ].includes(order.status)
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                                }`}
                        >
                            <Edit className="h-3 w-3" />
                            Edit Order
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={handleDeleteClick}
                            disabled={order.status !== "DRAFT"}
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
                        onClick={handleEditOrder}
                        disabled={[
                            "INVOICED",
                            "PAID",
                            "BAST",
                            "PARTIALLY_INVOICED",
                            "PARTIALLY_PAID",
                        ].includes(order.status)}
                        className={`cursor-pointer gap-2 text-xs ${[
                            "INVOICED",
                            "PAID",
                            "BAST",
                            "PARTIALLY_INVOICED",
                            "PARTIALLY_PAID",
                        ].includes(order.status)
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                            }`}
                    >
                        <Edit className="h-3 w-3" />
                        Edit Order
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={handleDeleteClick}
                        disabled={order.status !== "DRAFT"}
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

// Helper function untuk document status
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

// Helper component untuk detail order
function SalesOrderDetail({ order, role }: { order: SalesOrder, role: string }) {
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

    const isAdminOrSuper = role === "admin" || role === "super";

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

            {isAdminOrSuper && (
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
            )}

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

                                    {isAdminOrSuper && (
                                        <>
                                            <TableHead className="text-right font-semibold text-xs md:text-sm">Unit Price</TableHead>
                                            <TableHead className="text-right font-semibold text-xs md:text-sm">Subtotal</TableHead>
                                        </>
                                    )}
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
                                                <p className="font-medium text-xs md:text-sm">{item.name}</p>
                                                {item.description && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.description.substring(0, 50)}{item.description.length > 50 ? "..." : ""}
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right py-2 md:py-3">
                                                {item.qty} {item.uom && <Badge variant="outline" className="ml-1 text-[10px]">{item.uom}</Badge>}
                                            </TableCell>

                                            {isAdminOrSuper && (
                                                <>
                                                    <TableCell className="text-right font-medium text-xs md:text-sm py-2 md:py-3">
                                                        Rp {formatIDR(itemPrice.toNumber())}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium text-green-600 text-xs md:text-sm py-2 md:py-3">
                                                        Rp {formatIDR(subtotal.toNumber())}
                                                    </TableCell>
                                                </>
                                            )}
                                        </TableRow>
                                    )
                                })}

                                {isAdminOrSuper && (
                                    <TableRow className="bg-muted/30">
                                        <TableCell colSpan={3} className="text-right font-semibold text-xs md:text-sm py-2 md:py-3">
                                            Total
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-sm md:text-lg text-green-600 py-2 md:py-3">
                                            Rp {formatIDR(total.toNumber())}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile view for order items */}
                    <div className="md:hidden py-3 space-y-3">
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
                                        {isAdminOrSuper && (
                                            <div className="text-right">
                                                <span className="text-muted-foreground">Price: </span>
                                                <span className="font-medium">Rp {formatIDR(itemPrice.toNumber())}</span>
                                            </div>
                                        )}
                                        {isAdminOrSuper && (
                                            <div className="col-span-2 text-right border-t pt-1">
                                                <span className="text-muted-foreground">Subtotal: </span>
                                                <span className="font-medium text-green-600">Rp {formatIDR(subtotal.toNumber())}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                        {isAdminOrSuper && (
                            <div className="border-t pt-3 text-right">
                                <span className="font-semibold text-sm">Total: </span>
                                <span className="font-bold text-lg text-green-600">Rp {formatIDR(total.toNumber())}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}


export function SalesOrderTable({
    salesOrders: initialSalesOrders,
    isLoading,
    onDeleteSuccess,
    role,
    highlightId,
}: SalesOrderTableProps) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [expanded, setExpanded] = React.useState<ExpandedState>({})
    const isMobile = useMediaQuery("(max-width: 768px)")
    const rowRefs = React.useRef<{ [key: string]: HTMLTableRowElement | null }>({});
    const [salesOrders, setSalesOrders] = React.useState<SalesOrder[]>(initialSalesOrders)
    const pdfActions = usePdfActions()
    const router = useRouter();
    const [summaryExpanded, setSummaryExpanded] = React.useState(false);
    const [expandedItems, setExpandedItems] = React.useState<{ [key: string]: boolean }>({});
    const [summaryTotals, setSummaryTotals] = React.useState({
        totalSales: new Decimal(0),
        totalPR: new Decimal(0),
        totalUangMuka: new Decimal(0),
        totalLPP: new Decimal(0),
        profit: new Decimal(0),
        profitMargin: 0,
        totalOrders: 0,
        validOrdersCount: 0
    });

    const isAdminOrSuper = role === "admin" || role === "super";

    const toggleItemsExpanded = (orderId: string) => {
        setExpandedItems(prev => ({
            ...prev,
            [orderId]: !prev[orderId]
        }));
    };

    // Function untuk menghitung summary totals
    const calculateSummaryTotals = React.useCallback((orders: SalesOrder[]) => {
        const validOrders = orders.filter(order =>
            order.status !== 'DRAFT' && order.status !== 'CANCELLED'
        );

        // Hitung total sales dari items
        const totalSales = validOrders.reduce((sum, order) => {
            const orderTotal = order.items.reduce((orderSum, item) => {
                const itemQty = new Decimal(item.qty ?? 0);
                const itemPrice = new Decimal(item.unitPrice ?? 0);
                return orderSum.plus(itemQty.times(itemPrice));
            }, new Decimal(0));
            return sum.plus(orderTotal);
        }, new Decimal(0));

        // Hitung total PR dari semua SPK
        const totalPR = validOrders.reduce((sum, order) => {
            const orderPR = order.spk?.reduce((spkSum, spk) => {
                const spkPR = spk.purchaseRequest?.reduce((prSum, pr) => {
                    const prTotal = pr.details?.reduce((detailSum, detail) => {
                        return detailSum.plus(new Decimal(detail.estimasiTotalHarga ?? 0));
                    }, new Decimal(0)) ?? new Decimal(0);
                    return prSum.plus(prTotal);
                }, new Decimal(0)) ?? new Decimal(0);
                return spkSum.plus(spkPR);
            }, new Decimal(0)) ?? new Decimal(0);
            return sum.plus(orderPR);
        }, new Decimal(0));

        // Hitung total uang muka
        const totalUangMuka = validOrders.reduce((sum, order) => {
            const orderUM = order.spk?.reduce((spkSum, spk) => {
                const spkUM = spk.purchaseRequest?.reduce((prSum, pr) => {
                    const prUM = pr.uangMuka?.reduce((umSum, um) => {
                        return umSum.plus(new Decimal(um.jumlah ?? 0));
                    }, new Decimal(0)) ?? new Decimal(0);
                    return prSum.plus(prUM);
                }, new Decimal(0)) ?? new Decimal(0);
                return spkSum.plus(spkUM);
            }, new Decimal(0)) ?? new Decimal(0);
            return sum.plus(orderUM);
        }, new Decimal(0));

        // Hitung total LPP (realisasi biaya)
        const totalLPP = validOrders.reduce((sum, order) => {
            const orderLPP = order.spk?.reduce((spkSum, spk) => {
                const spkLPP = spk.purchaseRequest?.reduce((prSum, pr) => {
                    const prLPP = pr.uangMuka?.reduce((umSum, um) => {
                        const umLPP = um.pertanggungjawaban?.reduce((pjSum, pj) => {
                            return pjSum.plus(new Decimal(pj.totalBiaya ?? 0));
                        }, new Decimal(0)) ?? new Decimal(0);
                        return umSum.plus(umLPP);
                    }, new Decimal(0)) ?? new Decimal(0);
                    return prSum.plus(prLPP);
                }, new Decimal(0)) ?? new Decimal(0);
                return spkSum.plus(spkLPP);
            }, new Decimal(0)) ?? new Decimal(0);
            return sum.plus(orderLPP);
        }, new Decimal(0));

        const profit = totalSales.minus(totalLPP);
        const profitMargin = totalSales.isZero() ? 0 : profit.div(totalSales).times(100).toNumber();

        setSummaryTotals({
            totalSales,
            totalPR,
            totalUangMuka,
            totalLPP,
            profit,
            profitMargin,
            totalOrders: orders.length,
            validOrdersCount: validOrders.length
        });
    }, []);


    // Filter salesOrders berdasarkan role
    const filteredSalesOrders = React.useMemo(() => {
        if (isAdminOrSuper) {
            // Tampilkan semua data untuk admin/super
            return initialSalesOrders;
        } else {
            // Filter out status tertentu untuk non-admin/super
            const restrictedStatuses = ["BAST", "PARTIALLY_INVOICED", "INVOICED", "PARTIALLY_PAID", "PAID", "CANCELLED"];
            return initialSalesOrders.filter(order =>
                !restrictedStatuses.includes(order.status)
            );
        }
    }, [initialSalesOrders, isAdminOrSuper]);

    // Update salesOrders dengan data yang sudah difilter
    React.useEffect(() => {
        setSalesOrders(filteredSalesOrders);
        calculateSummaryTotals(filteredSalesOrders);
    }, [filteredSalesOrders, calculateSummaryTotals]);

    // Highlight effect
    React.useEffect(() => {
        if (!highlightId) return;

        const highlightElement = rowRefs.current[highlightId];
        if (!highlightElement) return;

        const SCROLL_DELAY = 300;
        const HIGHLIGHT_DURATION = 5000;
        const ANIMATION_CLASSES = [
            "bg-yellow-200",
            "dark:bg-yellow-900",
            "animate-pulse",
            "ring-2",
            "ring-yellow-400",
            "ring-offset-2",
            "transition-all",
            "duration-500"
        ];

        // Delay kecil supaya DOM siap
        const scrollTimer = setTimeout(() => {
            highlightElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "nearest"
            });
        }, SCROLL_DELAY);

        // Tambahkan highlight animasi
        highlightElement.classList.add(...ANIMATION_CLASSES);

        // Hapus highlight + bersihkan URL
        const cleanupTimer = setTimeout(() => {
            highlightElement.classList.remove(...ANIMATION_CLASSES);

            // Tambahkan sedikit smoothing setelah animasi
            highlightElement.classList.add("transition-colors", "duration-300");

            // Hapus highlightId dari URL tanpa reload
            const params = new URLSearchParams(window.location.search);
            params.delete("highlightId");
            const newUrl = params.toString()
                ? `${window.location.pathname}?${params.toString()}`
                : window.location.pathname;

            window.history.replaceState({}, "", newUrl);

        }, HIGHLIGHT_DURATION);

        return () => {
            clearTimeout(scrollTimer);
            clearTimeout(cleanupTimer);
            highlightElement.classList.remove(...ANIMATION_CLASSES);
        };
    }, [highlightId]);

    const handleDeleteSuccess = React.useCallback((deletedOrderId: string) => {
        setSalesOrders(prevOrders => {
            const newOrders = prevOrders.filter(order => order.id !== deletedOrderId)
            return newOrders
        })

        // Panggil callback onDeleteSuccess jika ada
        if (onDeleteSuccess) {
            onDeleteSuccess(deletedOrderId);
        }
    }, [onDeleteSuccess])



    const columns: ColumnDef<SalesOrder>[] = React.useMemo(() => {
        const baseColumns: ColumnDef<SalesOrder>[] = [
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
                                <p className="font-bold uppercase">{order.project?.name || "No Project"}</p>
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
                    <DataTableColumnHeader column={column} title="Status" className="text-right" />
                ),
                cell: ({ row }) => {
                    const order = row.original;
                    const docs = Array.isArray(order?.documents) ? order.documents : [];
                    const has = (t: "QUOTATION" | "PO" | "BAP" | "INVOICE" | "PAYMENT_RECEIPT") =>
                        docs.some((d) => d.docType === t);

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

                    const status = (order?.status ?? "DRAFT") as OrderStatus;
                    const config = statusConfig[status] || statusConfig.DRAFT;

                    return (
                        <Badge className={`rounded-md px-3.5 py-1.5 uppercase font-bold ${config.className}`}>
                            {config.label}
                        </Badge>
                    );
                },
            },
        ]

        // Kondisional kolom Total hanya untuk admin & super
        if (isAdminOrSuper) {
            baseColumns.push({
                id: "total",
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Total Amount" className="text-right" />
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
                            <p className="font-bold text-green-600">Rp {formatted}</p>
                            <p className="text-xs text-muted-foreground">
                                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    )
                },
            })
        }

        if (isAdminOrSuper) {
            baseColumns.push({
                id: "totalPR",
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Total PR" className="text-right" />
                ),
                cell: ({ row }) => {
                    const order = row.original as SalesOrder;

                    // Ambil semua details dari semua purchaseRequest di semua SPK
                    const allDetails = order.spk?.flatMap(spk =>
                        spk.purchaseRequest?.flatMap(pr => pr.details ?? []) ?? []
                    ) ?? [];

                    const totalPR = allDetails.reduce((sum, detail) => {
                        const detailJumlah = new Decimal(detail.estimasiTotalHarga ?? 0);
                        return sum.plus(detailJumlah);
                    }, new Decimal(0));

                    // Total sales dari items
                    const totalSales = order.items.reduce((sum, item) => {
                        const itemQty = new Decimal(item.qty ?? 0);
                        const itemPrice = new Decimal(item.unitPrice ?? 0);
                        return sum.plus(itemQty.times(itemPrice));
                    }, new Decimal(0));

                    if (totalPR.isZero()) return null;

                    // Tentukan warna berdasarkan margin
                    let colorClass = "text-green-600"; // default hijau
                    if (totalPR.gt(totalSales)) {
                        colorClass = "text-red-600"; // merah jika PR > total sales
                    } else if (totalPR.div(totalSales).gte(0.8)) {
                        colorClass = "text-yellow-600"; // kuning jika PR mendekati total sales (80%-100%)
                    }

                    const formatted = new Intl.NumberFormat("id-ID", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                    }).format(totalPR.toNumber());

                    // Hitung persentase margin untuk tooltip
                    const marginPercent = totalPR.div(totalSales).times(100).toFixed(0);

                    return (
                        <div className="text-right">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <p className={`font-bold ${colorClass}`}>Rp {formatted}</p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <span>
                                            Margin: {marginPercent}% dari total sales.<br />
                                            Total biaya PR dibanding total Sales Order:<br />
                                            - 0–70%: Aman (Hijau)<br />
                                            - 70–90%: Tipis (Kuning)<br />
                                            - {'>'}100%: Overbudget (Merah)
                                        </span>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            {allDetails.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    {allDetails.length} item{allDetails.length !== 1 ? "s" : ""}
                                </p>
                            )}
                        </div>
                    );
                },
            });
        }

        if (isAdminOrSuper) {
            baseColumns.push({
                id: "uangMuka",
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="ACC Finance" className="text-right" />
                ),
                cell: ({ row }) => {
                    const order = row.original as SalesOrder;

                    // Ambil semua UangMuka dari semua SPK dan PR
                    const allUangMuka = order.spk?.flatMap(spk =>
                        spk.purchaseRequest?.flatMap(pr => pr.uangMuka ?? []) ?? []
                    ) ?? [];

                    if (allUangMuka.length === 0) return null;

                    // Total jumlah Uang Muka
                    const totalUM = allUangMuka.reduce((sum, um) => {
                        return sum.plus(new Decimal(um.jumlah ?? 0));
                    }, new Decimal(0));

                    const formattedUM = new Intl.NumberFormat("id-ID", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                    }).format(totalUM.toNumber());

                    return (
                        <div className="text-right space-y-1">
                            <p className="font-bold text-blue-600">Rp {formattedUM}</p>
                            <p className="text-xs text-muted-foreground">
                                {allUangMuka.length} item
                            </p>
                        </div>
                    );
                },
            });
        }

        if (isAdminOrSuper) {
            baseColumns.push({
                id: "pertanggungjawaban",
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Total LPP" className="text-right" />
                ),
                cell: ({ row }) => {
                    const order = row.original as SalesOrder;

                    // Ambil semua Pertanggungjawaban dari semua UangMuka di semua PR di semua SPK
                    const allPJ = order.spk?.flatMap(spk =>
                        spk.purchaseRequest?.flatMap(pr =>
                            pr.uangMuka?.flatMap(um => um.pertanggungjawaban ?? []) ?? []
                        ) ?? []
                    ) ?? [];

                    if (allPJ.length === 0) return null;

                    // Total realisasi biaya & total sisa uang
                    const totalBiaya = allPJ.reduce((sum, pj) => sum.plus(new Decimal(pj.totalBiaya ?? 0)), new Decimal(0));
                    const totalSisa = allPJ.reduce((sum, pj) => sum.plus(new Decimal(pj.sisaUangDikembalikan ?? 0)), new Decimal(0));

                    // Total sales dari items
                    const totalSales = order.items.reduce(
                        (sum, item) => sum.plus(new Decimal(item.qty ?? 0).times(new Decimal(item.unitPrice ?? 0))),
                        new Decimal(0)
                    );

                    // Tentukan warna berdasarkan totalBiaya
                    let colorClass = "text-green-600";
                    if (totalBiaya.gt(totalSales)) colorClass = "text-red-600";
                    else if (totalBiaya.div(totalSales).gte(0.8)) colorClass = "text-yellow-600";

                    const formattedBiaya = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(totalBiaya.toNumber());
                    const formattedSisa = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(totalSisa.toNumber());

                    const marginPercent = totalBiaya.div(totalSales).times(100).toFixed(0);

                    return (
                        <div className="text-right space-y-1">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <div>
                                            <p className={`font-bold ${colorClass} text-right`}>Realisasi Biaya: Rp {formattedBiaya}</p>
                                            <p className="text-xs text-muted-foreground text-right">Sisa Biaya: Rp {formattedSisa}</p>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <span>
                                            Margin biaya LPP: {marginPercent}% dari total sales.<br />
                                            Total biaya dibanding total Sales Order:<br />
                                            - 0–70%: Aman (Hijau)<br />
                                            - 70–90%: Tipis (Kuning)<br />
                                            - {'>'}100%: Overbudget (Merah)
                                        </span>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    );
                },
            });
        }

        if (isAdminOrSuper) {
            // Kolom indikator tren
            baseColumns.push({
                id: "trend",
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Trend Biaya" className="text-center" />
                ),
                cell: ({ row }) => {
                    const order = row.original as SalesOrder;

                    const allPJ = order.spk?.flatMap(spk =>
                        spk.purchaseRequest?.flatMap(pr =>
                            pr.uangMuka?.flatMap(um => um.pertanggungjawaban ?? []) ?? []
                        ) ?? []
                    ) ?? [];

                    if (allPJ.length === 0) return null;

                    const totalBiaya = allPJ.reduce((sum, pj) => sum.plus(new Decimal(pj.totalBiaya ?? 0)), new Decimal(0));

                    const totalSales = order.items.reduce(
                        (sum, item) => sum.plus(new Decimal(item.qty ?? 0).times(new Decimal(item.unitPrice ?? 0))),
                        new Decimal(0)
                    );

                    const ratio = totalBiaya.div(totalSales);

                    let IconComponent = TrendingUp;
                    let colorClass = "text-green-600";
                    if (ratio.gt(1)) {
                        IconComponent = TrendingDown;
                        colorClass = "text-red-600";
                    } else if (ratio.gte(0.8)) {
                        IconComponent = BarChart2;
                        colorClass = "text-yellow-600";
                    }

                    return (
                        <div className="flex justify-center">
                            <IconComponent size={24} className={colorClass} />
                        </div>
                    );
                },
            });
        }

        // Kolom actions tetap ada untuk semua role
        baseColumns.push({
            id: "actions",
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => {
                const order = row.original
                // Cek apakah order sudah memiliki SPK
                const hasSPK = order.spk && order.spk.length > 0;

                return (
                    <div className="flex justify-end gap-2">
                        <ActionsCell
                            order={row.original}
                            onDeleteSuccess={handleDeleteSuccess}
                            role={role}
                        />
                        {/* Button Create SPK */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span>
                                        <Button
                                            variant="default"
                                            size="sm"
                                            disabled={hasSPK && ["BAST", "PARTIALLY_INVOICED", "INVOICED", "PARTIALLY_PAID", "PAID", "CANCELLED"].includes(order.status)}
                                            onClick={() => hasSPK ?
                                                router.push(`${getBasePathSPK(role)}?search=${encodeURIComponent(order.spk?.[0].spkNumber || '')}&page=1`) :
                                                router.push(`${getBasePathSPK(role)}/create/${order.id}`)
                                            }
                                            className={hasSPK ?
                                                (["BAST", "PARTIALLY_INVOICED", "INVOICED", "PARTIALLY_PAID", "PAID", "CANCELLED"].includes(order.status) ?
                                                    "bg-gray-400 cursor-not-allowed" :
                                                    "bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white shadow-lg shadow-green-500/30 dark:shadow-green-600/30") :
                                                "bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-600/30"
                                            }
                                        >
                                            {hasSPK ?
                                                (["BAST", "PARTIALLY_INVOICED", "INVOICED", "PARTIALLY_PAID", "PAID", "CANCELLED"].includes(order.status) ?
                                                    "SPK Created" :
                                                    "Cek SPK") :
                                                "+ Create SPK"
                                            }
                                        </Button>
                                    </span>
                                </TooltipTrigger>
                                {hasSPK && (
                                    <TooltipContent>
                                        {["BAST", "PARTIALLY_INVOICED", "INVOICED", "PARTIALLY_PAID", "PAID", "CANCELLED"].includes(order.status) ?
                                            "Tidak dapat mengakses SPK karena order sudah diproses lebih lanjut" :
                                            "SPK untuk Sales Order ini sudah dibuat"
                                        }
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </TooltipProvider>
                        {/* PDF hanya untuk admin/super */}
                        {isAdminOrSuper && (
                            <>
                                <Dialog
                                    open={pdfActions.pdfDialogOpen}
                                    onOpenChange={pdfActions.setPdfDialogOpen}
                                >
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => pdfActions.handlePreview(order)}
                                            className="cursor-pointer hover:bg-cyan-700 hover:text-white dark:hover:bg-cyan-700"
                                        >
                                            <EyeIcon className="h-4 w-4 mr-1" />
                                            Preview
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl max-h-[90vh]">
                                        <DialogHeader>
                                            <DialogTitle>
                                                Preview Sales Order - {order.soNumber}
                                            </DialogTitle>
                                        </DialogHeader>
                                        {pdfActions.selectedOrder && (
                                            <SalesOrderPdfPreview formData={pdfActions.selectedOrder} />
                                        )}
                                    </DialogContent>
                                </Dialog>

                                {/* Button Create Quotation */}
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => router.push(`/admin-area/sales/quotation/create/${order.id}`)}
                                                className="bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white shadow-lg shadow-green-500/30 dark:shadow-green-600/30 cursor-pointer"
                                            >
                                                + Quotation
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Buat Quotation baru untuk Sales Order ini
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </>
                        )}
                    </div>
                )
            },
        })

        return baseColumns
    }, [isAdminOrSuper, pdfActions, router, handleDeleteSuccess, role])

    const table = useReactTable({
        data: salesOrders,
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

    // Mobile view
    if (isMobile) {
        return (
            <>
                <Card className="border-none shadow-lg mx-0 w-full">
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="space-y-2 p-2">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="border rounded-lg p-3 bg-white">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Skeleton className="h-8 w-8 rounded-full" />
                                                <div className="space-y-1">
                                                    <Skeleton className="h-3 w-24" />
                                                    <Skeleton className="h-2 w-16" />
                                                </div>
                                            </div>
                                            <Skeleton className="h-5 w-12" />
                                        </div>
                                        <Skeleton className="h-3 w-full mb-1" />
                                        <Skeleton className="h-3 w-2/3" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-1 p-1">
                                {salesOrders.map((order) => {
                                    const hasSPK = order.spk && order.spk.length > 0;

                                    return (
                                        <div
                                            key={order.id}
                                            className={cn(
                                                "border rounded-lg bg-white dark:bg-slate-800 transition-colors",
                                                highlightId === order.id ? "bg-yellow-100 border-yellow-300" : ""
                                            )}
                                        >
                                            <div className="p-2">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 flex-shrink-0">
                                                            <FileTextIcon className="h-4 w-4 text-blue-600" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-bold text-xs truncate">{order.soNumber}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {format(new Date(order.soDate), "dd MMM yy")}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Badge className={cn(
                                                        "rounded px-2 py-0.5 text-xs uppercase font-semibold flex-shrink-0 ml-1",
                                                        statusConfig[order.status as OrderStatus]?.className || statusConfig.DRAFT.className
                                                    )}>
                                                        {statusConfig[order.status as OrderStatus]?.label || "Draft"}
                                                    </Badge>
                                                </div>

                                                <div className="space-y-1 text-xs">
                                                    <div className="flex items-center gap-1">
                                                        <FaToolbox className="h-3 w-3 text-red-500 flex-shrink-0" />
                                                        <span className="font-medium text-wrap">{order.project?.name || "No Project"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <UserCheck2Icon className="h-3 w-3 text-purple-500 flex-shrink-0" />
                                                        <span className="text-xs font-bold">{order.customer.branch}</span>
                                                    </div>
                                                </div>

                                                {/* Detail Items untuk mobile */}
                                                <div className="mt-2 space-y-2 text-xs">
                                                    <div className="font-medium text-green-600">Items:</div>
                                                    {order.items.slice(0, 2).map((item, idx) => {
                                                        const itemTotal = isAdminOrSuper ? item.qty * item.unitPrice : 0;
                                                        return (
                                                            <div key={idx} className="flex justify-between items-center">
                                                                <span className="truncate flex-1">
                                                                    {item.qty} x {item.name}
                                                                </span>
                                                                <span className={`font-medium ml-2 flex-shrink-0 whitespace-nowrap ${isAdminOrSuper ? 'text-green-600' : 'text-gray-400 italic'
                                                                    }`}>
                                                                    {isAdminOrSuper
                                                                        ? `Rp ${itemTotal.toLocaleString('id-ID')}`
                                                                        : '***'
                                                                    }
                                                                </span>
                                                            </div>
                                                        );
                                                    })}

                                                    {/* Tampilkan item tambahan jika expanded */}
                                                    {expandedItems[order.id] && order.items.length > 2 && (
                                                        <>
                                                            {order.items.slice(2).map((item, idx) => {
                                                                const itemTotal = isAdminOrSuper ? item.qty * item.unitPrice : 0;
                                                                return (
                                                                    <div key={idx + 2} className="flex justify-between items-center">
                                                                        <span className="truncate flex-1">
                                                                            {item.qty} x {item.name}
                                                                        </span>
                                                                        <span className="font-medium text-green-600 ml-2 flex-shrink-0 whitespace-nowrap">
                                                                            {isAdminOrSuper
                                                                                ? `Rp ${itemTotal.toLocaleString('id-ID')}`
                                                                                : '***'
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </>
                                                    )}

                                                    {/* Button untuk show/hide items */}
                                                    {order.items.length > 2 && (
                                                        <button
                                                            onClick={() => toggleItemsExpanded(order.id)}
                                                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium mt-1"
                                                        >
                                                            {expandedItems[order.id] ? (
                                                                <>
                                                                    <ChevronUp className="h-3 w-3" />
                                                                    Show Less
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Plus className="h-3 w-3" />
                                                                    +{order.items.length - 2} more items
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>

                                                {isAdminOrSuper && (
                                                    <div className="mt-2 pt-2 border-t border-gray-100">
                                                        <div className="flex justify-between items-center">
                                                            <p className="text-xs font-bold uppercase">Total Amount</p>
                                                            <p className="font-bold text-green-600 text-sm">
                                                                Rp {order.items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0).toLocaleString("id-ID")}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Actions untuk mobile */}
                                                <div className="mt-2 flex justify-end gap-1">
                                                    <ActionsCell
                                                        order={order}
                                                        onDeleteSuccess={handleDeleteSuccess}
                                                        role={role}
                                                    />


                                                    {/* Create SPK Button */}
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span>
                                                                    <Button
                                                                        variant="default"
                                                                        size="sm"
                                                                        disabled={hasSPK && ["BAST", "PARTIALLY_INVOICED", "INVOICED", "PARTIALLY_PAID", "PAID", "CANCELLED"].includes(order.status)}
                                                                        onClick={() => hasSPK ?
                                                                            router.push(`${getBasePathSPK(role)}?search=${encodeURIComponent(order.spk?.[0].spkNumber || '')}&page=1`) :
                                                                            router.push(`${getBasePathSPK(role)}/create/${order.id}`)
                                                                        }
                                                                        className={hasSPK ?
                                                                            (["BAST", "PARTIALLY_INVOICED", "INVOICED", "PARTIALLY_PAID", "PAID", "CANCELLED"].includes(order.status) ?
                                                                                "bg-gray-400 cursor-not-allowed" :
                                                                                "bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white shadow-lg shadow-green-500/30 dark:shadow-green-600/30") :
                                                                            "bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-600/30"
                                                                        }
                                                                    >
                                                                        {hasSPK ?
                                                                            (["BAST", "PARTIALLY_INVOICED", "INVOICED", "PARTIALLY_PAID", "PAID", "CANCELLED"].includes(order.status) ?
                                                                                "SPK Created" :
                                                                                "Cek SPK") :
                                                                            "+ Create SPK"
                                                                        }
                                                                    </Button>
                                                                </span>
                                                            </TooltipTrigger>
                                                            {hasSPK && (
                                                                <TooltipContent>
                                                                    {["BAST", "PARTIALLY_INVOICED", "INVOICED", "PARTIALLY_PAID", "PAID", "CANCELLED"].includes(order.status) ?
                                                                        "Tidak dapat mengakses SPK karena order sudah diproses lebih lanjut" :
                                                                        "SPK untuk Sales Order ini sudah dibuat"
                                                                    }
                                                                </TooltipContent>
                                                            )}
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                    {isAdminOrSuper && (
                                                        <>
                                                            {/* Create Quotation Button */}
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="default"
                                                                            size="sm"
                                                                            onClick={() => router.push(`/admin-area/sales/quotation/create/${order.id}`)}
                                                                            className="bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white shadow-lg shadow-green-500/30 dark:shadow-green-600/30 cursor-pointer"
                                                                        >
                                                                            + Quotation
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        Buat Quotation baru untuk Sales Order ini
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </>
        )
    }

    return (
        <Card className="border-none shadow-lg">
            <CardContent className="p-0">
                {/* Sales Order Summary untuk Admin/Super */}
                {(role === "admin" || role === "super") && (
                    <SalesOrderSummary
                        role={role}
                        summaryExpanded={summaryExpanded}
                        setSummaryExpanded={setSummaryExpanded}
                        summaryTotals={summaryTotals}
                    />
                )}

                {isLoading ? (
                    <div className="space-y-4 p-6">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className="flex items-center space-x-4 p-4 border rounded-lg"
                            >
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="space-y-2 flex-grow">
                                    <Skeleton className="h-4 w-48" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                                <Skeleton className="h-6 w-20" />
                                <Skeleton className="h-8 w-24" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-b-lg">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead key={header.id} className="py-4 font-semibold">
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
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
                                                ref={(el) => {
                                                    const id = row.original?.id;
                                                    if (id) rowRefs.current[id] = el;
                                                }}
                                                data-row-id={row.original?.id}
                                                data-state={row.getIsSelected() && "selected"}
                                                className={cn(
                                                    "cursor-pointer hover:bg-muted/30 transition-colors",
                                                    highlightId === row.original?.id ? "bg-yellow-200 dark:bg-yellow-900" : ""
                                                )}
                                                onClick={() => row.toggleExpanded(!row.getIsExpanded())}
                                            >

                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell key={cell.id} className="py-4">
                                                        {flexRender(
                                                            cell.column.columnDef.cell,
                                                            cell.getContext()
                                                        )}
                                                    </TableCell>
                                                ))}
                                            </TableRow>

                                            {row.getIsExpanded() && (
                                                <TableRow key={`${row.id}-expanded`}>
                                                    <TableCell
                                                        colSpan={table.getVisibleLeafColumns().length}
                                                        className="p-0 border-b-2 border-primary/20"
                                                    >
                                                        <SalesOrderDetail
                                                            order={row.original}
                                                            role={role}
                                                        />
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
                                                <p className="text-lg font-medium">
                                                    No orders found
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}