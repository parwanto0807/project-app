"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, Edit, MinusCircle } from "lucide-react"

import type { SalesOrder as ValidationSalesOrder } from "@/lib/validations/sales-order"

type Props = {
    order: ValidationSalesOrder
    open?: boolean
    onOpenChange?: (open: boolean) => void
    onDeleteSuccess?: () => void
}

export function ActionDeleteSalesOrder({
    order,
    open = false,
    onOpenChange,
    onDeleteSuccess,
}: Props) {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)

    const handleEditOrder = () => {
        router.push(`/super-admin-area/sales/salesOrder/update/${order.id}`)
    }

    const handleViewDetails = () => {
        console.log("View order details:", order.id)
    }

    const openDeleteDialog = (e?: Event) => {
        e?.preventDefault()
        onOpenChange?.(true)
    }

    const closeDeleteDialog = () => {
        if (!isDeleting) {
            onOpenChange?.(false)
        }
    }

    const handleDeleteOrder = async () => {
        setIsDeleting(true)
        try {
            const response = await fetch(`/api/salesOrder/sales-orders/remove/${order.id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            closeDeleteDialog()
            
            // Beri sedikit delay sebelum refresh
            setTimeout(() => {
                if (onDeleteSuccess) {
                    onDeleteSuccess()
                } else {
                    router.refresh()
                }
            }, 100)

        } catch (error) {
            console.error("Error deleting order:", error)
            closeDeleteDialog()
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 cursor-pointer hover:bg-muted"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem
                        className="cursor-pointer gap-2"
                        onSelect={(e) => { e.preventDefault(); handleViewDetails() }}
                    >
                        <Eye className="h-4 w-4" />
                        View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="cursor-pointer gap-2"
                        onSelect={(e) => { e.preventDefault(); handleEditOrder() }}
                    >
                        <Edit className="h-4 w-4" />
                        Edit Order
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 cursor-pointer gap-2"
                        onSelect={openDeleteDialog}
                    >
                        <MinusCircle className="h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent onClick={(e) => e.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete order #{order.soNumber}.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={closeDeleteDialog}
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
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}