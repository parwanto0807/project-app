"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, CreditCard, CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addPayment } from "@/lib/action/invoice/invoice";
import { AddPaymentRequest } from "@/schemas/invoice";
import { formatCurrencyNumber } from "@/lib/utils";
import { BankAccount } from "@/schemas/bank";
import { paymentFormSchema } from "@/lib/validations/invoice";
import { toast } from "sonner";

interface PaymentProcessDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    invoiceId: string;
    invoiceNumber: string;
    balanceDue: number;
    banks: BankAccount[];
    currentUser: { id: string, name: string } | undefined;
    onRefresh?: () => void; // ✅ NEW: Callback untuk refresh data
    installments?: Array<{
        id: string;
        dueDate: Date;
        amount: number;
        balance: number;
        description?: string;
    }>;
}

interface PaymentFormData {
    payDate: Date;
    amount: number;
    method: string;
    bankAccountId: string;
    reference: string;
    notes: string;
    installmentId?: string;
    verifiedById?: string;
    accountCOAId?: string;
    paymentType?: "FULL" | "PARTIAL";
    adminFee?: number;
}

export function PaymentProcessDialog({
    open,
    onOpenChange,
    invoiceId,
    invoiceNumber,
    balanceDue,
    banks,
    currentUser,
    onRefresh, // ✅ NEW
    installments = []
}: PaymentProcessDialogProps) {

    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState<Date>(new Date());
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [formData, setFormData] = useState<PaymentFormData>({
        payDate: new Date(),
        amount: Number(balanceDue),
        method: "TRANSFER",
        bankAccountId: "",
        reference: "",
        notes: "",
        installmentId: "",
        verifiedById: currentUser?.id || undefined,
        accountCOAId: "",
        paymentType: "FULL",
        adminFee: 0,
    });
    const formSchema = paymentFormSchema(balanceDue);

    // Auto-set amount when switching to FULL payment or when admin fee changes
    useEffect(() => {
        if (formData.paymentType === "FULL") {
            // For FULL payment: amount = balanceDue - adminFee
            // So that: amount + adminFee = balanceDue
            const calculatedAmount = balanceDue - (formData.adminFee || 0);
            setFormData(prev => ({ ...prev, amount: Math.max(0, calculatedAmount) }));
        }
    }, [formData.paymentType, formData.adminFee, balanceDue]);

    const paymentMethods = [
        { value: "TRANSFER", label: "Bank Transfer", icon: "🏦" },
        { value: "VA", label: "Virtual Account", icon: "📟" },
        { value: "CREDIT_CARD", label: "Credit Card", icon: "💳" },
        { value: "CASH", label: "Cash", icon: "💵" },
        { value: "CHEQUE", label: "Check", icon: "📄" },
        { value: "E_WALLET", label: "Digital Wallet", icon: "📱" },
    ];

    useEffect(() => {
        if (open) {
            setFormData(prev => ({
                ...prev,
                amount: Number(balanceDue), // ✅
                payDate: new Date()
            }));
            setDate(new Date());
        }
    }, [open, balanceDue]);

    const handleInputChange = (field: keyof PaymentFormData, value: string | number | Date) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSelectChange = (field: keyof PaymentFormData) => (value: string) => {
        if (field === "bankAccountId") {
            const selectedBank = banks.find(b => b.id === value);
            setFormData(prev => ({
                ...prev,
                [field]: value,
                accountCOAId: selectedBank?.accountCOAId || ""
            }));
        } else {
            handleInputChange(field, value);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setFormErrors({}); // Reset error sebelum validasi

        const totalCharged = (formData.amount || 0) + (formData.adminFee || 0);

        // 1. Validasi Lebih Bayar
        if (totalCharged > balanceDue) {
            toast.error("Total Pembayaran melebihi sisa tagihan!", {
                position: "top-center",
                description: `Maksimal: ${formatCurrencyNumber(balanceDue)}, Input: ${formatCurrencyNumber(totalCharged)}`
            });
            setLoading(false);
            return;
        }

        // 2. Validasi Kurang Bayar tapi Mode FULL
        console.log('💰 Payment Validation:', {
            totalCharged,
            balanceDue,
            amount: formData.amount,
            adminFee: formData.adminFee,
            paymentType: formData.paymentType,
            isUnderpayment: totalCharged < balanceDue && formData.paymentType === "FULL"
        });

        if (totalCharged < balanceDue && formData.paymentType === "FULL") {
            toast.warning("Nominal kurang dari tagihan.", {
                position: "top-center",
                description: "Mode pembayaran otomatis diubah ke 'Partial Payment'. Silakan konfirmasi kembali."
            });
            setFormData(prev => ({ ...prev, paymentType: "PARTIAL" }));
            setLoading(false);
            return;
        }

        console.log('✅ Validation passed, proceeding to Zod validation...');

        const result = formSchema.safeParse(formData);

        if (!result.success) {
            // 🔹 Konversi error Zod ke objek { fieldName: "pesan error" }
            const fieldErrors: Record<string, string> = {};
            result.error.issues.forEach(issue => {
                const path = issue.path.join('.'); // misal: "reference", "amount"
                fieldErrors[path] = issue.message;
            });

            console.error('❌ Zod Validation Failed:', {
                errors: fieldErrors,
                formData: formData
            });

            // Show toast for each validation error
            Object.entries(fieldErrors).forEach(([field, message]) => {
                toast.error(`Validasi Gagal: ${field}`, {
                    position: "top-center",
                    description: message
                });
            });

            setFormErrors(fieldErrors);
            setLoading(false);
            return;
        }

        console.log('✅ Zod validation passed, submitting payment...');


        try {
            const paymentData: AddPaymentRequest = {
                payDate: date.toISOString(),
                amount: result.data.amount, // ✅ Ambil dari data hasil validasi (sudah benar tipenya)
                method: result.data.method,
                bankAccountId: result.data.bankAccountId || undefined,
                reference: result.data.reference,
                notes: result.data.notes || undefined,
                installmentId: result.data.installmentId || undefined,
                verifiedById: currentUser?.id || undefined,
                accountCOAId: result.data.accountCOAId || undefined,
                adminFee: formData.adminFee || 0,
                paymentType: formData.paymentType,
            };

            await addPayment(invoiceId, paymentData);

            // Reset & tutup
            setFormData({
                payDate: new Date(),
                amount: balanceDue,
                method: "TRANSFER",
                bankAccountId: "",
                reference: "",
                notes: "",
                installmentId: "",
                verifiedById: currentUser?.id,
                accountCOAId: "",
                paymentType: "FULL",
                adminFee: 0,
            });

            onOpenChange(false);

            // ✅ REFRESH DATA TABEL
            if (onRefresh) {
                onRefresh();
            }
        } catch (error) {
            console.error("Failed to process payment:", error);
            alert("Gagal memproses pembayaran. Silakan coba lagi."); // 👈 Beri feedback ke user!
        } finally {
            setLoading(false);
        }
    };

    const getPaymentMethodIcon = (method: string) => {
        const found = paymentMethods.find(m => m.value === method);
        return found ? found.icon : "💳";
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="border-b pb-4 mb-4">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CreditCard className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl">Process Payment</DialogTitle>
                                <DialogDescription>
                                    Invoice <strong>#{invoiceNumber}</strong>
                                </DialogDescription>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-sm text-gray-500 block">Balance Due</span>
                            <span className="text-xl font-bold text-blue-700">
                                {formatCurrencyNumber(balanceDue)}
                            </span>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-4">

                    {/* Row 1: Date, Type, Method */}
                    <div className="col-span-12 sm:col-span-4 space-y-1.5">
                        <Label htmlFor="payDate" className="text-xs font-semibold text-gray-600">Payment Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal h-9",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={(newDate) => {
                                        const selectedDate = newDate || new Date();
                                        setDate(selectedDate);
                                        handleInputChange("payDate", selectedDate);
                                    }}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="col-span-12 sm:col-span-4 space-y-1.5">
                        <Label htmlFor="paymentType" className="text-xs font-semibold text-gray-600">Payment Type</Label>
                        <Select
                            value={formData.paymentType}
                            onValueChange={(val) => handleInputChange("paymentType", val)}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="FULL">Full Payment</SelectItem>
                                <SelectItem value="PARTIAL">Partial Payment</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="col-span-12 sm:col-span-4 space-y-1.5">
                        <Label htmlFor="method" className="text-xs font-semibold text-gray-600">Payment Method</Label>
                        <Select
                            value={formData.method}
                            onValueChange={handleSelectChange("method")}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue>
                                    <div className="flex items-center gap-2">
                                        <span>{getPaymentMethodIcon(formData.method)}</span>
                                        <span className="truncate">
                                            {paymentMethods.find(m => m.value === formData.method)?.label}
                                        </span>
                                    </div>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {paymentMethods.map((method) => (
                                    <SelectItem key={method.value} value={method.value}>
                                        <div className="flex items-center gap-2">
                                            <span>{method.icon}</span>
                                            <span>{method.label}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Row 2: Bank Account & Reference */}
                    <div className="col-span-12 sm:col-span-8 space-y-1.5">
                        <Label htmlFor="bankAccountId" className="text-xs font-semibold text-gray-600">Bank Account</Label>
                        <Select
                            value={formData.bankAccountId}
                            onValueChange={handleSelectChange("bankAccountId")}
                        >
                            <SelectTrigger className={`truncate h-9 ${formErrors.bankAccountId ? "border-red-500 border-2" : ""}`}>
                                <SelectValue placeholder="Select Bank Account" />
                            </SelectTrigger>
                            <SelectContent>
                                {banks.map((account) => (
                                    <SelectItem key={account.id} value={account.id}>
                                        <span className="font-bold">{account.accountNumber}</span> - {account.bankName} - {account.branch} {account.accountCOA?.code ? <span className="font-bold text-gray-500">({account.accountCOA.code})</span> : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {formErrors.bankAccountId && (
                            <p className="text-xs text-red-500 mt-1">{formErrors.bankAccountId}</p>
                        )}
                    </div>

                    <div className="col-span-12 sm:col-span-4 space-y-1.5">
                        <Label htmlFor="reference" className="text-xs font-semibold text-gray-600">Reference No.</Label>
                        <Input
                            id="reference"
                            value={formData.reference}
                            onChange={(e) => handleInputChange("reference", e.target.value)}
                            className={`h-9 ${formErrors.reference ? "border-red-500" : ""}`}
                            placeholder="e.g. TRX-001"
                        />
                    </div>

                    {/* Row 3: Financials */}
                    <div className="col-span-12 sm:col-span-4 space-y-1.5">
                        <Label htmlFor="amount" className="text-xs font-semibold text-gray-600">Pay Amount</Label>
                        <Input
                            id="amount"
                            type="number"
                            value={formData.amount}
                            onChange={(e) => handleInputChange("amount", parseFloat(e.target.value) || 0)}
                            className={`h-9 font-bold ${formErrors.amount ? "border-red-500" : ""}`}
                            max={balanceDue}
                            step="0.01"
                        />
                        {/* Compact Warning */}
                        {formData.paymentType === "FULL" && (formData.amount + (formData.adminFee || 0)) < balanceDue && (
                            <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1 mt-1">
                                <AlertTriangle className="h-3 w-3" />
                                Underpayment! Total charged is less than balance due.
                            </p>
                        )}
                    </div>

                    <div className="col-span-12 sm:col-span-4 space-y-1.5">
                        <Label htmlFor="adminFee" className="text-xs font-semibold text-gray-600">Admin Bank / Admin Fee</Label>
                        <Input
                            id="adminFee"
                            type="number"
                            value={formData.adminFee}
                            onChange={(e) => handleInputChange("adminFee", parseFloat(e.target.value) || 0)}
                            className="h-9"
                            min="0"
                        />
                    </div>

                    <div className="col-span-12 sm:col-span-4 space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-600">Total Charged</Label>
                        <div className="h-9 px-3 flex items-center bg-slate-100 rounded-md border border-slate-200 text-slate-800 font-bold">
                            {formatCurrencyNumber((formData.amount || 0) + (formData.adminFee || 0))}
                        </div>
                    </div>

                    {/* Row 4: Installment (Conditional) */}
                    {installments.length > 0 && (
                        <div className="col-span-12 space-y-1.5">
                            <Label htmlFor="installmentId" className="text-xs font-semibold text-gray-600">Installment Allocation</Label>
                            <Select
                                value={formData.installmentId || ""}
                                onValueChange={handleSelectChange("installmentId")}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select installment" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">General Balance (No specific installment)</SelectItem>
                                    {installments.map((installment) => (
                                        <SelectItem key={installment.id} value={installment.id}>
                                            {installment.description || `Due: ${format(installment.dueDate, "dd MMM yyyy")}`} - Bal: {formatCurrencyNumber(installment.balance)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Row 5: Notes */}
                    <div className="col-span-12 space-y-1.5">
                        <Label htmlFor="notes" className="text-xs font-semibold text-gray-600">Notes</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => handleInputChange("notes", e.target.value)}
                            placeholder="Add memo..."
                            className="resize-none"
                            rows={2}
                        />
                    </div>

                    {/* Row 6: Alert */}
                    <div className="col-span-12">
                        <Alert className="py-2 px-3 bg-amber-50 border-amber-200 text-amber-900 flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                            <div className="text-xs leading-tight">
                                <span className="font-bold block mb-0.5">Update Ledger Otomatis</span>
                                Tindakan ini berdampak langsung pada General Ledger & Laporan Keuangan. Mohon verifikasi nominal dan akun bank sebelum melanjutkan.
                            </div>
                        </Alert>
                    </div>

                    {/* Footer */}
                    <div className="col-span-12 flex justify-end gap-2 pt-2 border-t mt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || formData.amount <= 0}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Confirm Payment
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}