import * as React from "react"
import { format } from "date-fns"
import {
    CalendarIcon,
    FileTextIcon,
    PlusCircleIcon,
    SearchIcon,
    ShoppingCartIcon,
    BuildingIcon,
    FileIcon,
    CheckCircleIcon,
    ClockIcon,
    DollarSignIcon,
    ChevronDownIcon, // NEW: Icon for expander
} from "lucide-react"
import Decimal from "decimal.js"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getExpandedRowModel, // NEW: Import for expandable rows
    type ExpandedState, // NEW: Type for expanded state
} from "@tanstack/react-table"
import { DotsHorizontalIcon } from "@radix-ui/react-icons"

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
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import Link from "next/link"

interface SalesOrderTableProps {
    salesOrders: SalesOrder[]
    isLoading: boolean
}

// Helper component to render the expanded details of an order
// (You can place this inside or outside the SalesOrderTable component, or in its own file)
function SalesOrderDetail({ order }: { order: SalesOrder }) {
    const total = order.items.reduce((sum, item) => {
        const itemQty = new Decimal(item.qty.toString())
        const itemPrice = new Decimal(item.unitPrice.toString())
        return sum.plus(itemQty.times(itemPrice))
    }, new Decimal(0))

    return (
        <div className="bg-muted/50 p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-4">
                <div>
                    <h4 className="font-semibold text-sm mb-1">Customer Details</h4>
                    <p className="text-sm text-muted-foreground">{order.customer.name}</p>
                    <p className="text-sm text-muted-foreground">{order.customer.address ?? "No address provided"}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-sm mb-1">Order Info</h4>
                    <p className="text-sm text-muted-foreground">
                        PO Number: <span className="font-medium">{order.poNumber ?? "N/A"}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Order Type: <span className="font-medium">{order.type}</span>
                    </p>
                </div>
                <div>
                    <h4 className="font-semibold text-sm mb-1">Financials</h4>
                    <p className="text-sm text-muted-foreground">
                        Total Amount: <span className="font-medium text-green-600">${total.toDecimalPlaces(2).toString()}</span>
                    </p>
                </div>
            </div>

            <h4 className="font-semibold text-sm mb-2">Order Items</h4>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {order.items.map((item) => {
                            const itemQty = new Decimal(item.qty.toString())
                            const itemPrice = new Decimal(item.unitPrice.toString())
                            const subtotal = itemQty.times(itemPrice)

                            return (
                                <TableRow key={item.id}>
                                    <TableCell>{item.description}</TableCell>
                                    <TableCell className="text-right">{item.qty}</TableCell>
                                    <TableCell className="text-right">${itemPrice.toDecimalPlaces(2).toString()}</TableCell>
                                    <TableCell className="text-right font-medium">${subtotal.toDecimalPlaces(2).toString()}</TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}


const columns: ColumnDef<SalesOrder>[] = [
    // NEW: Expander column
    {
        id: "expander",
        header: () => null,
        cell: ({ row }) => {
            return (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={row.getToggleExpandedHandler()}
                    className="h-8 w-8 p-0"
                >
                    <ChevronDownIcon
                        className={`h-4 w-4 transition-transform duration-200 ${row.getIsExpanded() ? "" : "-rotate-90"
                            }`}
                    />
                    <span className="sr-only">Toggle details</span>
                </Button>
            )
        },
    },
    {
        accessorKey: "soNumber",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="SO Number" />
        ),
        cell: ({ row }) => {
            const order = row.original
            return (
                <div className="flex items-center gap-2">
                    <FileTextIcon className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{order.soNumber}</span>
                    {order.type === "SUPPORT" && (
                        <Badge variant="outline" className="border-green-500 text-green-600">
                            Support
                        </Badge>
                    )}
                </div>
            )
        },
    },
    {
        accessorKey: "customer.name",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Customer" />
        ),
        cell: ({ row }) => {
            const order = row.original
            return (
                <div className="flex items-center gap-2">
                    <BuildingIcon className="h-4 w-4 text-purple-500" />
                    <span>{order.customer.name}</span>
                </div>
            )
        },
    },
    {
        accessorKey: "soDate",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Date" />
        ),
        cell: ({ row }) => {
            const order = row.original
            return (
                <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-amber-500" />
                    <span>{format(new Date(order.soDate), "dd MMM yyyy")}</span>
                </div>
            )
        },
    },
    {
        id: "total",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Total" />
        ),
        cell: ({ row }) => {
            const order = row.original
            const total = order.items.reduce((sum, item) => {
                const itemQty = new Decimal(item.qty.toString())
                const itemPrice = new Decimal(item.unitPrice.toString())
                return sum.plus(itemQty.times(itemPrice))
            }, new Decimal(0))

            return (
                <div className="flex items-center gap-2 font-medium">
                    <DollarSignIcon className="h-4 w-4 text-green-500" />
                    <span>
                        {total.toDecimalPlaces(2).toString()}
                    </span>
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
            // ... (your existing status logic remains unchanged)
            const order = row.original
            const document = order.document

            if (!document) {
                return (
                    <Badge variant="outline" className="bg-gray-100 text-gray-600">
                        <ClockIcon className="mr-1 h-3 w-3" />
                        Draft
                    </Badge>
                )
            }
            if (document.isInvoice && document.isPaymentStatus) {
                return (
                    <Badge variant="outline" className="bg-green-100 text-green-600">
                        <CheckCircleIcon className="mr-1 h-3 w-3" />
                        Paid
                    </Badge>
                )
            }
            if (document.isInvoice) {
                return (
                    <Badge variant="outline" className="bg-blue-100 text-blue-600">
                        <FileIcon className="mr-1 h-3 w-3" />
                        Invoiced
                    </Badge>
                )
            }
            if (document.isPo) {
                return (
                    <Badge variant="outline" className="bg-purple-100 text-purple-600">
                        <FileTextIcon className="mr-1 h-3 w-3" />
                        PO Received
                    </Badge>
                )
            }
            if (document.isOffer) {
                return (
                    <Badge variant="outline" className="bg-amber-100 text-amber-600">
                        <FileTextIcon className="mr-1 h-3 w-3" />
                        Quotation
                    </Badge>
                )
            }
            return (
                <Badge variant="outline" className="bg-gray-100 text-gray-600">
                    <ClockIcon className="mr-1 h-3 w-3" />
                    Draft
                </Badge>
            )
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const order = row.original

            function handleEditOrder(order: SalesOrder) {
                console.log("Edit order:", order)
            }
            function handleDeleteOrder(orderId: string) {
                console.log("Delete order:", orderId)
            }

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <span className="sr-only">Open menu</span>
                            <DotsHorizontalIcon className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        {/* MODIFIED: Use the expander button instead of a menu item */}
                        <DropdownMenuItem
                            onClick={() => row.toggleExpanded(!row.getIsExpanded())}
                        >
                            {row.getIsExpanded() ? "Hide Details" : "View Details"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleEditOrder(order)}
                        >
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => handleDeleteOrder(order.id)}
                        >
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]


export function SalesOrderTable({ salesOrders, isLoading }: SalesOrderTableProps) {
    const [searchTerm, setSearchTerm] = React.useState("")
    const [currentPage, setCurrentPage] = React.useState(1)
    const itemsPerPage = 10
    const [expanded, setExpanded] = React.useState<ExpandedState>({}) // NEW: State for expanded rows

    const filteredSalesOrders = React.useMemo(() => {
        return salesOrders.filter((order) => {
            return (
                order.soNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (order.poNumber && order.poNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
                order.type.toLowerCase().includes(searchTerm.toLowerCase())
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
        state: { // NEW: Pass expanded state to the table
            expanded,
        },
        onExpandedChange: setExpanded, // NEW: Handle state changes
        getCoreRowModel: getCoreRowModel(),
        getExpandedRowModel: getExpandedRowModel(), // NEW: Enable the expanded row model
        getRowId: (row) => row.id, // NEW: Important for stable expansion
    })

    return (
        <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
                <div className="flex items-center space-x-2">
                    <ShoppingCartIcon className="h-6 w-6 text-primary" />
                    <CardTitle>Sales Orders</CardTitle>
                </div>
                <div className="flex w-full flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0 md:w-auto">
                    <div className="relative w-full sm:w-64">
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
                    <Link href="/super-admin-area/sales/salesOrder/create" passHref>
                        <Button className="shrink-0">
                            <PlusCircleIcon className="mr-2 h-4 w-4" />
                            Add Sales Order
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-4 px-4 py-6">
                        <div className="space-y-4 px-4 py-6">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center space-x-4">
                                    <div className="space-y-2 flex-grow">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                    <Skeleton className="h-8 w-24" />
                                    <Skeleton className="h-8 w-8" />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => {
                                                return (
                                                    <TableHead key={header.id}>
                                                        {header.isPlaceholder
                                                            ? null
                                                            : flexRender(
                                                                header.column.columnDef.header,
                                                                header.getContext()
                                                            )}
                                                    </TableHead>
                                                )
                                            })}
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {table.getRowModel().rows?.length ? (
                                        table.getRowModel().rows.map((row) => (
                                            <React.Fragment key={row.id}>
                                                <TableRow data-state={row.getIsSelected() && "selected"}>
                                                    {row.getVisibleCells().map((cell) => (
                                                        <TableCell key={cell.id}>
                                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                                {/* NEW: Render expanded content */}
                                                {row.getIsExpanded() && (
                                                    <TableRow>
                                                        <TableCell colSpan={columns.length} className="p-0">
                                                            <SalesOrderDetail order={row.original} />
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={columns.length}
                                                className="h-24 text-center"
                                            >
                                                No results found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {totalPages > 1 && (
                            <div className="mt-4 flex justify-center">
                                {totalPages > 1 && (
                                    <div className="mt-4 flex justify-center">
                                        <Pagination>
                                            <PaginationContent>
                                                <PaginationItem>
                                                    <PaginationPrevious
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            setCurrentPage(prev => Math.max(prev - 1, 1))
                                                        }}
                                                        className={
                                                            currentPage === 1 ? "pointer-events-none opacity-50" : undefined
                                                        }
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
                                                            setCurrentPage(prev => Math.min(prev + 1, totalPages))
                                                        }}
                                                        className={
                                                            currentPage === totalPages
                                                                ? "pointer-events-none opacity-50"
                                                                : undefined
                                                        }
                                                    />
                                                </PaginationItem>
                                            </PaginationContent>
                                        </Pagination>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    )
}