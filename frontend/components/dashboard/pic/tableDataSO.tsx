import * as React from "react"
import { format } from "date-fns"
import {
    FileTextIcon,
    SearchIcon,
    ShoppingCartIcon,
    UserCheck2Icon,
    Eye,
    EyeOff,
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
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import Link from "next/link"
import { FaToolbox } from "react-icons/fa"
import { CheckCircle2, ReceiptText, MinusCircle } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { OrderStatusEnum } from "@/schemas/index";
import * as z from "zod";

type OrderStatus = z.infer<typeof OrderStatusEnum>;

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
    role: string
    showViewAllButton?: boolean
}

// Helper function to render document status
function renderDocumentStatus(documents: { docType: "QUOTATION" | "PO" | "BAP" | "INVOICE" | "PAYMENT_RECEIPT" }[]) {
    const has = (type: "QUOTATION" | "PO" | "BAP" | "INVOICE" | "PAYMENT_RECEIPT") =>
        Array.isArray(documents) && documents.some((d) => d.docType === type);

    const DocumentRow = ({ ok, label }: { ok: boolean; label: string }) => (
        <li className="flex items-center gap-1 py-0.5">
            {ok ? (
                <CheckCircle2 className="h-3 w-3 text-green-600" />
            ) : (
                <MinusCircle className="h-3 w-3 text-muted-foreground" />
            )}
            <span className={cn(
                "text-xs",
                ok ? "text-green-700 font-medium" : "text-muted-foreground"
            )}>
                {label}
            </span>
        </li>
    );

    return (
        <>
            <DocumentRow ok={has("QUOTATION")} label="Quotation" />
            <DocumentRow ok={has("PO")} label="PO" />
            <DocumentRow ok={has("BAP")} label="BAST" />
            <DocumentRow ok={has("INVOICE")} label="Invoice" />
            <DocumentRow ok={has("PAYMENT_RECEIPT")} label="Paid" />
        </>
    );
}

// Mobile Card View untuk Dashboard
function MobileSalesOrderCard({ order, onExpand }: { order: SalesOrder; onExpand: () => void }) {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const status = (order?.status ?? "DRAFT") as OrderStatus;
    const config = statusConfig[status] || statusConfig.DRAFT;

    const toggleExpand = () => {
        setIsExpanded(prev => !prev)
        onExpand()
    }

    return (
        <div className="border rounded-lg p-3 mb-2 bg-white dark:bg-slate-950 shadow-sm">
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/50">
                        <FileTextIcon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="font-semibold text-sm">{order.soNumber}</p>
                        <p className="text-xs text-muted-foreground">
                            {format(new Date(order.soDate), "dd MMM yyyy")}
                        </p>
                    </div>
                </div>
                <Badge className={cn("text-xs rounded-md px-1.5 py-0", config.className)}>
                    {config.label}
                </Badge>
            </div>

            <div className="space-y-1 mb-2">
                <div className="flex items-center gap-1">
                    <FaToolbox className="h-3 w-3 text-red-500" />
                    <span className="text-xs font-medium truncate">{order.project?.name || "No Project"}</span>
                </div>
                <div className="flex items-center gap-1">
                    <UserCheck2Icon className="h-3 w-3 text-purple-500" />
                    <span className="text-xs truncate">{order.customer.name}</span>
                </div>
            </div>

            {/* Document Status */}
            <div className="mb-2">
                <div className="flex justify-between items-center">
                    {Array.isArray(order.documents) && order.documents.length > 0 ? (
                        <ul className="flex flex-wrap gap-2">
                            {renderDocumentStatus(order.documents)}
                        </ul>
                    ) : (
                        <p className="text-xs text-muted-foreground">No documents</p>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between border-t pt-2">
                <div className="text-xs text-muted-foreground">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation()
                            toggleExpand()
                        }}
                        className="text-xs h-6 px-2"
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
                </div>
            </div>
        </div>
    )
}

export function DashboardSalesOrderTable({ salesOrders: initialSalesOrders, isLoading, role, showViewAllButton = true }: SalesOrderTableProps) {
    const [searchTerm, setSearchTerm] = React.useState("")
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [expanded, setExpanded] = React.useState<ExpandedState>({})
    const isMobile = useMediaQuery("(max-width: 768px)")
    // const [salesOrders, setSalesOrders] = React.useState<SalesOrder[]>(initialSalesOrders)
    const basePath = getBasePath(role);

    // Ambil hanya 10 data terakhir untuk dashboard
    const recentSalesOrders = React.useMemo(() => {
        const sorted = [...initialSalesOrders]
            .sort((a, b) => new Date(b.soDate).getTime() - new Date(a.soDate).getTime())
            .slice(0, 5);

        return sorted.filter((order) => {
            return (
                order.soNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.project?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.customer.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
        })
    }, [initialSalesOrders, searchTerm])

    const columns: ColumnDef<SalesOrder>[] = React.useMemo(() => [
        {
            id: "no",
            header: () => (
                <div className="w-8 text-center text-muted-foreground">#</div>
            ),
            cell: ({ row }) => (
                <div className="w-8 text-center text-sm font-medium text-muted-foreground">
                    {row.index + 1}
                </div>
            ),
            size: 40, // cukup untuk angka 1-99
            minSize: 40,
            maxSize: 40,
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "soNumber",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="SO Number" />
            ),
            cell: ({ row }) => {
                const order = row.original;
                return (
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex items-center justify-center h-7 w-7 rounded-md bg-blue-100 dark:bg-blue-900/50 flex-shrink-0">
                            <FileTextIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0">
                            <Badge
                                variant="outline"
                                className={cn(
                                    "font-medium bg-blue-50 text-blue-700 border-blue-200 px-2 py-0.5 text-xs",
                                    "dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300"
                                )}
                            >
                                {order.soNumber}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {format(new Date(order.soDate), "dd MMM yyyy")}
                            </p>
                        </div>
                    </div>
                );
            },
            size: 180, // sedikit lebih kecil
            minSize: 160,
        },
        {
            accessorKey: "project.name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Project" />
            ),
            cell: ({ row }) => {
                const order = row.original
                return (
                    <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/50">
                            <FaToolbox className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{order.project?.name || "No Project"}</p>
                            <p className="text-xs text-muted-foreground truncate">
                                {order.customer.name}
                            </p>
                        </div>
                    </div>
                )
            },
            size: 250,
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

                if (has("PAYMENT_RECEIPT")) {
                    return (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 rounded-md px-2 py-0 text-xs">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Paid
                        </Badge>
                    );
                }

                if (has("INVOICE")) {
                    return (
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 rounded-md px-2 py-0 text-xs">
                            <ReceiptText className="mr-1 h-3 w-3" />
                            Invoiced
                        </Badge>
                    );
                }

                const status = (order?.status ?? "DRAFT") as OrderStatus;
                const config = statusConfig[status] || statusConfig.DRAFT;

                return (
                    <Badge className={`capitalize rounded-md px-2 py-0 text-xs ${config.className}`}>
                        {config.label}
                    </Badge>
                );
            },
            size: 150,
        },
        {
            id: "documents",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Documents" />
            ),
            cell: ({ row }) => {
                const order = row.original;
                const docs = Array.isArray(order?.documents) ? order.documents : [];

                return (
                    <div className="text-xs">
                        {docs.length > 0 ? (
                            <ul className="space-y-1">
                                {renderDocumentStatus(docs)}
                            </ul>
                        ) : (
                            <span className="text-muted-foreground">No documents</span>
                        )}
                    </div>
                )
            },
            size: 200,
        },
        {
            id: "actions",
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => {
                return (
                    <div className="flex justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => row.toggleExpanded(!row.getIsExpanded())}
                            className="flex items-center gap-1 h-7 text-xs"
                        >
                            <Eye className="h-3 w-3" />
                            {row.getIsExpanded() ? "Hide" : "View"}
                        </Button>
                    </div>
                )
            },
            size: 100,
        },
    ], [])

    const table = useReactTable({
        data: recentSalesOrders,
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
            <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ShoppingCartIcon className="h-5 w-5" />
                            5 Recent Sales Orders
                        </CardTitle>
                        {showViewAllButton && (
                            <Link href={`${basePath}`} passHref>
                                <Button variant="outline" size="sm" className="text-xs h-8">
                                    View All
                                </Button>
                            </Link>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-3 ">
                    {isLoading ? (
                        <div className="space-y-3 ">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="border rounded-lg p-3 bg-white">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-6 w-6 rounded-full" />
                                            <div className="space-y-1">
                                                <Skeleton className="h-3 w-24" />
                                                <Skeleton className="h-2 w-16" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-5 w-16" />
                                    </div>
                                    <Skeleton className="h-3 w-full mb-1" />
                                    <Skeleton className="h-3 w-3/4 mb-2" />
                                    <div className="flex justify-between items-center border-t pt-2">
                                        <Skeleton className="h-2 w-12" />
                                        <Skeleton className="h-6 w-12" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {recentSalesOrders.map((order) => {
                                const row = table.getRow(order.id)
                                return (
                                    <React.Fragment key={order.id}>
                                        <MobileSalesOrderCard
                                            order={order}
                                            onExpand={() => row?.toggleExpanded(!row.getIsExpanded())}
                                        />
                                        {row?.getIsExpanded() && (
                                            <div className="p-3 mb-2 bg-gray-50 dark:bg-slate-950 border rounded-md text-xs">
                                                <div className="font-medium mb-2 text-green-600">Detail Items:</div>
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} className="mb-2 pb-2 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0">
                                                        <div className="font-medium">{item.name}</div>
                                                        {item.description && (
                                                            <div className="text-gray-500 dark:text-gray-400 mt-1">
                                                                {item.description}
                                                            </div>
                                                        )}
                                                        <div className="flex justify-between mt-1">
                                                            <span>{item.qty} {item.uom || 'pcs'}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="text-xs text-muted-foreground mt-2">
                                                    {order.items.length} item{order.items.length !== 1 ? 's' : ''} total
                                                </div>
                                            </div>
                                        )}
                                    </React.Fragment>
                                )
                            })}
                            {recentSalesOrders.length === 0 && (
                                <div className="text-center py-4 text-muted-foreground text-sm">
                                    No sales orders found
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border shadow-sm">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <ShoppingCartIcon className="h-5 w-5" />
                        5 Recent Sales Orders
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <SearchIcon className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 transform text-muted-foreground" />
                            <Input
                                placeholder="Search orders..."
                                className="w-48 pl-7 h-8 text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {showViewAllButton && (
                            <Link href={`${basePath}`} passHref>
                                <Button variant="outline" size="sm" className="h-8">
                                    View All
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 dark:bg-gray-950">
                {isLoading ? (
                    <div className="space-y-2 p-4 ">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-4 p-3 border rounded-lg">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="space-y-1 flex-grow">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <Skeleton className="h-6 w-20" />
                                <Skeleton className="h-6 w-24" />
                                <Skeleton className="h-7 w-16" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-b-lg">
                        <Table>
                            <TableHeader className="bg-cyan-50 border dark:bg-gray-800">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id} className="h-10">
                                        {headerGroup.headers.map((header) => (
                                            <TableHead
                                                key={header.id}
                                                className="py-2 font-semibold text-xs"
                                                style={{ width: `${header.getSize()}px` }}
                                            >
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
                                                className="h-12 cursor-pointer hover:bg-muted/20"
                                                onClick={(e) => {
                                                    if (!e.defaultPrevented) {
                                                        row.toggleExpanded(!row.getIsExpanded())
                                                    }
                                                }}
                                            >
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell key={cell.id} className="py-2">
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </TableCell>
                                                ))}
                                            </TableRow>

                                            {row.getIsExpanded() && (
                                                <TableRow key={`${row.id}-expanded`}>
                                                    <TableCell
                                                        colSpan={table.getVisibleLeafColumns().length}
                                                        className="p-3 bg-muted/10"
                                                    >
                                                        <div className="text-sm">
                                                            <div className="font-medium mb-2 text-green-600">
                                                                Order Items:
                                                            </div>
                                                            <div className="grid gap-2">
                                                                {row.original.items.map((item, idx) => (
                                                                    <div key={idx} className="flex justify-between items-start p-2 bg-white dark:bg-slate-900 rounded border">
                                                                        <div className="flex-1">
                                                                            <div className="font-medium">{item.name}</div>
                                                                            {item.description && (
                                                                                <div className="text-xs text-muted-foreground mt-1">
                                                                                    {item.description}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground ml-4">
                                                                            {item.qty} {item.uom || 'pcs'}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={table.getVisibleLeafColumns().length}
                                            className="h-20 text-center text-muted-foreground"
                                        >
                                            <div className="flex flex-col items-center justify-center py-4">
                                                <ShoppingCartIcon className="h-8 w-8 text-muted-foreground/50 mb-2" />
                                                <p className="text-sm font-medium">No orders found</p>
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
    )
}

// Helper function
function getBasePath(role?: string) {
    return role === "super"
        ? "/super-admin-area/sales/salesOrder"
        : "/admin-area/sales/salesOrder"
}