"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Plus,
    Search,
    Eye,
    Edit,
    Trash2,
    Receipt,
    Calendar,
    DollarSign,
    CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";
import { getSupplierPayments, deleteSupplierPayment } from "@/lib/actions/supplierPayment";
import { SupplierPayment, PAYMENT_METHOD_OPTIONS } from "@/types/supplierInvoice";

interface SupplierPaymentTableProps {
    role: string;
}

export default function SupplierPaymentTable({ role }: SupplierPaymentTableProps) {
    const router = useRouter();
    const [payments, setPayments] = useState<SupplierPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [methodFilter, setMethodFilter] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const response = await getSupplierPayments({
                page,
                limit: 10,
                search,
                paymentMethod: methodFilter !== "all" ? methodFilter as any : undefined,
            });

            if (response.success) {
                setPayments(response.data);
                setTotalPages(response.pagination.totalPages);
            }
        } catch (error) {
            toast.error("Failed to fetch supplier payments");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, [page, search, methodFilter]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this payment? This will reverse all allocations.")) return;

        try {
            const response = await deleteSupplierPayment(id);
            if (response.success) {
                toast.success("Payment deleted successfully");
                fetchPayments();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to delete payment");
        }
    };

    const getPaymentMethodBadge = (method: string) => {
        const config = PAYMENT_METHOD_OPTIONS.find(m => m.value === method);
        if (!config) return <Badge>{method}</Badge>;

        return (
            <Badge variant="outline" className="font-medium">
                {config.label}
            </Badge>
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Supplier Payments</h2>
                    <p className="text-muted-foreground">Manage payments to suppliers</p>
                </div>
                <Button onClick={() => router.push("/admin-area/accounting/supplier-payment/create")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Payment
                </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by payment number..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={methodFilter} onValueChange={setMethodFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filter by method" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Methods</SelectItem>
                        {PAYMENT_METHOD_OPTIONS.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                                {method.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Payment Number</TableHead>
                            <TableHead>Payment Date</TableHead>
                            <TableHead>Payment Method</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Allocations</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
                                </TableCell>
                            </TableRow>
                        ) : payments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <Receipt className="h-12 w-12 mb-3 opacity-20" />
                                        <p className="text-lg font-medium">No payments found</p>
                                        <p className="text-sm">Create your first supplier payment to get started</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            payments.map((payment) => (
                                <TableRow key={payment.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Receipt className="h-4 w-4 text-muted-foreground" />
                                            {payment.paymentNumber}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            {format(new Date(payment.paymentDate), "dd MMM yyyy", { locale: idLocale })}
                                        </div>
                                    </TableCell>
                                    <TableCell>{getPaymentMethodBadge(payment.paymentMethod)}</TableCell>
                                    <TableCell className="text-right font-semibold">
                                        <div className="flex items-center justify-end gap-2">
                                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                                            {formatCurrency(payment.amount)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {payment.allocations?.length || 0} invoice(s)
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate">
                                        {payment.notes || "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => router.push(`/admin-area/accounting/supplier-payment/${payment.id}`)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => router.push(`/admin-area/accounting/supplier-payment/update/${payment.id}`)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(payment.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </Button>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            Page {page} of {totalPages}
                        </span>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
