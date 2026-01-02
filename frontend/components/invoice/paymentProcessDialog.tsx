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
import { CalendarIcon, CreditCard, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addPayment } from "@/lib/action/invoice/invoice";
import { AddPaymentRequest } from "@/schemas/invoice";
import { formatCurrencyNumber } from "@/lib/utils";
import { BankAccount } from "@/schemas/bank";
import { paymentFormSchema } from "@/lib/validations/invoice";

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
    const router = useRouter();
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
    });
    const formSchema = paymentFormSchema(balanceDue);

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
        handleInputChange(field, value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setFormErrors({}); // Reset error sebelum validasi

        const result = formSchema.safeParse(formData);

        if (!result.success) {
            // 🔹 Konversi error Zod ke objek { fieldName: "pesan error" }
            const fieldErrors: Record<string, string> = {};
            result.error.issues.forEach(issue => {
                const path = issue.path.join('.'); // misal: "reference", "amount"
                fieldErrors[path] = issue.message;
            });
            setFormErrors(fieldErrors);
            setLoading(false);
            return;
        }


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
            };

            await addPayment(invoiceId, paymentData);

            // Reset & tutup
            setFormData({
                payDate: new Date(),
                amount: balanceDue,
                method: "bank_transfer",
                bankAccountId: "",
                reference: "",
                notes: "",
                installmentId: "",
                verifiedById: currentUser?.id,
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
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CreditCard className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Process Payment</DialogTitle>
                            <DialogDescription>
                                Add payment for invoice <strong>#{invoiceNumber}</strong>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Balance Summary */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                            <span className="text-blue-700 font-medium">Balance Due:</span>
                            <span className="text-2xl font-bold text-blue-700">
                                {formatCurrencyNumber(balanceDue)}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Payment Date */}
                        <div className="space-y-2">
                            <Label htmlFor="payDate" className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-gray-500" />
                                Payment Date
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
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

                        {/* Amount */}
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-gray-500">$</span>
                                <Input
                                    id="amount"
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => handleInputChange("amount", parseFloat(e.target.value) || 0)}
                                    className={`pl-8 ${formErrors.amount ? "border-red-500" : ""}`}
                                    max={balanceDue}
                                    step="0.01"
                                    required
                                />
                            </div>
                            {formErrors.amount && (
                                <p className="text-xs text-red-500">{formErrors.amount}</p>
                            )}
                            <p className="text-xs text-gray-500">
                                Max: {formatCurrencyNumber(balanceDue)}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Payment Method */}
                        <div className="space-y-2">
                            <Label htmlFor="method">Payment Method</Label>
                            <Select
                                value={formData.method}
                                onValueChange={handleSelectChange("method")}
                            >
                                <SelectTrigger>
                                    <SelectValue>
                                        <div className="flex items-center gap-2">
                                            <span>{getPaymentMethodIcon(formData.method)}</span>
                                            <span>
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

                        {/* Bank Account */}
                        <div className="space-y-2">
                            <Label htmlFor="bankAccountId">Bank Account</Label>
                            <Select
                                value={formData.bankAccountId}
                                onValueChange={handleSelectChange("bankAccountId")}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select bank account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {banks.map((account) => (
                                        <SelectItem key={account.id} value={account.id}>
                                            {account.accountNumber} - {account.bankName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Installment Selection */}
                    {installments.length > 0 && (
                        <div className="space-y-2">
                            <Label htmlFor="installmentId">Apply to Installment (Optional)</Label>
                            <Select
                                value={formData.installmentId || ""}
                                onValueChange={handleSelectChange("installmentId")}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select installment" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">None - Apply to general balance</SelectItem>
                                    {installments.map((installment) => (
                                        <SelectItem key={installment.id} value={installment.id}>
                                            {installment.description || `Installment - ${format(installment.dueDate, "MMM dd, yyyy")}`}
                                            (Balance: ${installment.balance.toLocaleString()})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Reference */}
                    <div className="space-y-2">
                        <Label htmlFor="reference">Reference Number</Label>
                        <Input
                            id="reference"
                            value={formData.reference}
                            onChange={(e) => handleInputChange("reference", e.target.value)}
                            className={formErrors.reference ? "border-red-500" : ""}
                            placeholder="e.g., TRX-123456, Check #789"
                        />
                        {formErrors.reference && (
                            <p className="text-xs text-red-500">{formErrors.reference}</p>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => handleInputChange("notes", e.target.value)}
                            placeholder="Additional payment notes..."
                            rows={3}
                        />
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                            className="flex items-center gap-2"
                        >
                            <XCircle className="h-4 w-4" />
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || formData.amount <= 0}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4" />
                                    Process Payment
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}