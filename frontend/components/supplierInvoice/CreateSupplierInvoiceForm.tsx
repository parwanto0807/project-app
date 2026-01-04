"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
    FileText,
    Building,
    DollarSign,
    Package,
    Save,
    X,
    CheckCircle2,
    AlertTriangle,
    Calendar,
    Receipt,
    Hash,
    Loader2,
    ChevronRight,
    Percent,
    TrendingUp,
    Check,
    ShoppingCart,
    ClipboardList,
    FileCheck,
    Calculator,
    BadgeCheck,
    AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { createSupplierInvoice, generateSupplierInvoiceNumber } from "@/lib/actions/supplierInvoice";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getGoodsReceipts } from "@/lib/actions/goodsReceipt";

interface Supplier {
    id: string;
    name: string;
    code?: string;
}

interface PurchaseOrder {
    id: string;
    poNumber: string;
    totalAmount: number;
    supplier?: {
        id: string;
        name: string;
    };
}

interface POLine {
    id: string;
    productId: string;
    description: string; // Deskripsi dari PO Line
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    product?: {
        id: string;
        name: string;
        code?: string;
        description?: string; // Deskripsi master product
    };
}

interface InvoiceItem extends POLine {
    checked: boolean;
    receivedQuantity: number;
    receivedPrice: number;
    receivedTotal: number;
    priceVariance: number;
    variancePercentage: number;
    grQuantity?: number; // Added to track GR quantity
}

export default function CreateSupplierInvoiceForm({ role = "admin" }: { role?: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingPO, setLoadingPO] = useState(false);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);

    const [internalInvoiceNumber, setInternalInvoiceNumber] = useState("");
    const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState("");
    const [supplierId, setSupplierId] = useState("");
    const [purchaseOrderId, setPurchaseOrderId] = useState("");
    const [invoiceDate, setInvoiceDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [dueDate, setDueDate] = useState(() => {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 30);
        return format(nextWeek, "yyyy-MM-dd");
    });
    const [taxAmount, setTaxAmount] = useState<string>("0");
    const [taxRate, setTaxRate] = useState<number>(0);
    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [step, setStep] = useState(1);

    const [varianceDialogOpen, setVarianceDialogOpen] = useState(false);
    const [varianceDetails, setVarianceDetails] = useState<{ productName: string; invoiceQty: number; grQty: number; isGr: boolean }[]>([]);

    // Generate auto number on load
    useEffect(() => {
        generateInvoiceNumber();
    }, []);

    const generateInvoiceNumber = async () => {
        try {
            const result = await generateSupplierInvoiceNumber();
            if (result.success && result.data.invoiceNumber) {
                setInternalInvoiceNumber(result.data.invoiceNumber);
            } else {
                const year = new Date().getFullYear();
                const month = String(new Date().getMonth() + 1).padStart(2, '0');
                setInternalInvoiceNumber(`INV-SUPP/${year}/${month}/XXXX`);
            }
        } catch (error) {
            const year = new Date().getFullYear();
            const month = String(new Date().getMonth() + 1).padStart(2, '0');
            setInternalInvoiceNumber(`INV-SUPP/${year}/${month}/XXXX`);
        }
    };

    // Fetch suppliers
    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/supplier?activeOnly=true&onWip=false`);
                const data = await response.json();
                if (data.success) setSuppliers(data.data);
            } catch (error) {
                console.error("Failed to fetch suppliers:", error);
            }
        };
        fetchSuppliers();
    }, []);

    // Fetch POs when supplier changes
    useEffect(() => {
        if (supplierId) {
            const fetchPOs = async () => {
                try {
                    const response = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/po?supplierId=${supplierId}&status=FULLY_RECEIVED`
                    );
                    const data = await response.json();
                    if (data.success) {
                        setPurchaseOrders(data.data);
                        setStep(2);
                    }
                } catch (error) {
                    console.error("Failed to fetch POs:", error);
                }
            };
            fetchPOs();
        } else {
            setPurchaseOrders([]);
            setPurchaseOrderId("");
            setItems([]);
        }
    }, [supplierId]);

    // Load PO items when PO is selected
    const handlePOSelect = async (poId: string) => {
        if (!poId) {
            setItems([]);
            return;
        }

        setPurchaseOrderId(poId);
        setLoadingPO(true);

        try {
            // Fetch PO details and Goods Receipts in parallel
            const [poResponse, grResponse] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/po/${poId}`).then(res => res.json()),
                getGoodsReceipts({ purchaseOrderId: poId, limit: 100 })
            ]);

            if (poResponse.success && poResponse.data.lines) {
                const grItemsMap = new Map<string, number>();

                // Aggregate GR quantities by PO Line ID
                if (grResponse.success && grResponse.data?.data) {
                    grResponse.data.data.forEach((gr: any) => {
                        if (gr.items && Array.isArray(gr.items)) {
                            gr.items.forEach((item: any) => {
                                if (item.purchaseOrderLineId) {
                                    const currentQty = grItemsMap.get(item.purchaseOrderLineId) || 0;
                                    grItemsMap.set(item.purchaseOrderLineId, currentQty + (Number(item.qtyPassed) || 0));
                                }
                            });
                        }
                    });
                }

                const poLines: InvoiceItem[] = poResponse.data.lines.map((line: POLine) => {
                    const variance = 0;
                    const variancePercentage = line.totalAmount > 0 ? (variance / line.totalAmount) * 100 : 0;

                    // Use GR quantity if available, otherwise fallback to PO quantity
                    const grQty = grItemsMap.get(line.id);
                    const initialQty = grQty !== undefined ? grQty : line.quantity;

                    return {
                        ...line,
                        checked: true,
                        receivedQuantity: initialQty,
                        receivedPrice: line.unitPrice,
                        receivedTotal: initialQty * line.unitPrice,
                        priceVariance: variance,
                        variancePercentage,
                        grQuantity: grQty,
                    };
                });

                setItems(poLines);
                setStep(3);

                // Show info toast about loaded items
                const grLoadedCount = poLines.filter(p => p.grQuantity !== undefined).length;
                if (grLoadedCount > 0) {
                    toast.success(`${poLines.length} items loaded. ${grLoadedCount} items matched with Goods Receipts.`, {
                        icon: <Package className="h-5 w-5 text-emerald-600" />,
                    });
                } else {
                    toast.success(`${poLines.length} items loaded from PO`, {
                        icon: <Package className="h-5 w-5 text-emerald-600" />,
                    });
                }
            }
        } catch (error) {
            toast.error("Failed to load PO items");
            console.error(error);
        } finally {
            setLoadingPO(false);
        }
    };

    const toggleItem = (index: number) => {
        const newItems = [...items];
        newItems[index].checked = !newItems[index].checked;
        setItems(newItems);
    };

    const updateReceivedQuantity = (index: number, quantity: number) => {
        const newItems = [...items];
        const qty = Number(quantity);
        const price = Number(newItems[index].receivedPrice);
        const poTotal = Number(newItems[index].totalAmount);

        newItems[index].receivedQuantity = qty;
        newItems[index].receivedTotal = qty * price;
        newItems[index].priceVariance = newItems[index].receivedTotal - poTotal;
        newItems[index].variancePercentage = poTotal > 0 ? (newItems[index].priceVariance / poTotal) * 100 : 0;

        setItems(newItems);
    };

    const updateReceivedPrice = (index: number, price: number) => {
        const newItems = [...items];
        const prc = Number(price);
        const qty = Number(newItems[index].receivedQuantity);
        const poTotal = Number(newItems[index].totalAmount);

        newItems[index].receivedPrice = prc;
        newItems[index].receivedTotal = qty * prc;
        newItems[index].priceVariance = newItems[index].receivedTotal - poTotal;
        newItems[index].variancePercentage = poTotal > 0 ? (newItems[index].priceVariance / poTotal) * 100 : 0;

        setItems(newItems);
    };

    const handleTaxRateChange = (rate: number) => {
        setTaxRate(rate);
        const taxAmountValue = (subtotal * rate) / 100;
        setTaxAmount(taxAmountValue.toFixed(2));
    };

    // Memoized calculations
    const subtotal = items
        .filter(item => item.checked)
        .reduce((sum, item) => sum + (typeof item.receivedTotal === 'string' ? parseFloat(item.receivedTotal) || 0 : item.receivedTotal), 0);

    const taxAmountNumber = parseFloat(taxAmount) || 0;
    const totalAmount = subtotal + taxAmountNumber;

    const totalVariance = items
        .filter(item => item.checked)
        .reduce((sum, item) => sum + item.priceVariance, 0);

    const variancePercentage = subtotal > 0 ? (totalVariance / subtotal) * 100 : 0;

    const checkedItemsCount = items.filter(item => item.checked).length;
    const totalItemsCount = items.length;

    const checkVarianceAndSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!internalInvoiceNumber || !supplierInvoiceNumber || !supplierId || !purchaseOrderId) {
            toast.error("Please fill in all required fields");
            return;
        }

        const checkedItems = items.filter(item => item.checked);
        if (checkedItems.length === 0) {
            toast.error("Please select at least one item to receive");
            return;
        }

        // Check for variances between Invoice Qty (receivedQuantity) and GR Qty
        // If GR exists, compare with GR. If not, we assume PO Qty is the reference (but usually receiveQuantity defaults to it anyway)
        const variances = checkedItems
            .filter(item => {
                const targetQty = item.grQuantity !== undefined ? item.grQuantity : item.quantity;
                return Math.abs(Number(item.receivedQuantity) - Number(targetQty)) > 0.001;
            })
            .map(item => ({
                productName: item.product?.name || item.description,
                invoiceQty: item.receivedQuantity,
                grQty: item.grQuantity !== undefined ? item.grQuantity : item.quantity,
                isGr: item.grQuantity !== undefined
            }));

        if (variances.length > 0) {
            setVarianceDetails(variances);
            setVarianceDialogOpen(true);
        } else {
            executeSubmit();
        }
    };

    const executeSubmit = async () => {
        const checkedItems = items.filter(item => item.checked);

        try {
            setLoading(true);
            setVarianceDialogOpen(false); // Close dialog if open

            const response = await createSupplierInvoice({
                invoiceNumber: supplierInvoiceNumber,
                invoiceDate: new Date(invoiceDate),
                dueDate: new Date(dueDate),
                supplierId,
                purchaseOrderId,
                subtotal,
                taxAmount: taxAmountNumber,
                totalAmount,
                items: checkedItems.map(item => ({
                    productId: item.productId,
                    productName: item.product?.name || item.description,
                    poLineId: item.id,
                    quantity: item.receivedQuantity,
                    unitPrice: item.receivedPrice,
                    totalPrice: item.receivedTotal,
                    priceVariance: item.priceVariance,
                })),
            });

            if (response.success) {
                toast.success("Supplier invoice created successfully", {
                    icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
                });
                // Determine redirect path based on role
                const basePath = role === "pic" ? "/pic-area" : role === "super" ? "/super-admin-area" : "/admin-area";
                router.push(`${basePath}/accounting/supplier-invoice`);
            } else {
                toast.error(response.message || "Failed to create invoice");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to create invoice");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-6 bg-gray-100 rounded-xl dark:bg-slate-900">
            {/* Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
                        <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Create Supplier Invoice</h1>
                        <p className="text-muted-foreground">Receive and record supplier invoices based on purchase orders</p>
                    </div>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between relative">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -translate-y-1/2 -z-10" />
                {[1, 2, 3].map((stepNum) => (
                    <div key={stepNum} className="flex flex-col items-center">
                        <div className={cn(
                            "h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300",
                            step >= stepNum
                                ? "bg-gradient-to-br from-primary to-primary/90 text-white shadow-lg"
                                : "bg-white border-2 border-gray-200 text-gray-400"
                        )}>
                            {step > stepNum ? (
                                <Check className="h-5 w-5" />
                            ) : stepNum === 1 ? (
                                <FileText className="h-5 w-5" />
                            ) : stepNum === 2 ? (
                                <ClipboardList className="h-5 w-5" />
                            ) : (
                                <Calculator className="h-5 w-5" />
                            )}
                        </div>
                        <span className={cn(
                            "mt-2 text-sm font-medium transition-colors",
                            step >= stepNum ? "text-primary" : "text-gray-400"
                        )}>
                            {stepNum === 1 ? "Basic Info" : stepNum === 2 ? "PO Selection" : "Items & Totals"}
                        </span>
                    </div>
                ))}
            </div>

            {/* Variance Dialog */}
            <AlertDialog open={varianceDialogOpen} onOpenChange={setVarianceDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                            Selisih Jumlah Terdeteksi
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4 pt-2" asChild>
                            <div>
                                <div className="text-muted-foreground font-medium">Item berikut memiliki perbedaan antara Kuantitas PO dan Kuantitas Penerimaan Barang:</div>
                                <div className="bg-gray-50 rounded-lg p-3 space-y-3 max-h-[300px] overflow-y-auto border border-gray-200">
                                    {varianceDetails.map((detail, idx) => (
                                        <div key={idx} className="flex flex-col text-sm border-b border-gray-200 last:border-0 pb-2 last:pb-0">
                                            <span className="font-bold text-gray-900 text-base">{detail.productName}</span>
                                            <div className="flex gap-4 mt-1 text-gray-700 font-semibold">
                                                <span>Qty Inv: <span className="font-bold text-gray-900">{detail.invoiceQty}</span></span>
                                                <span>Qty {detail.isGr ? 'GR' : 'PO'}: <span className="font-bold text-amber-600">{detail.grQty}</span></span>
                                                <span>Selisih: <span className="font-bold text-red-600">{detail.grQty - detail.invoiceQty}</span></span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="font-medium">Apakah Anda ingin melanjutkan pembuatan faktur berdasarkan kuantitas yang disesuaikan (default ke kuantitas GR jika tersedia)?</p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={executeSubmit} className="bg-amber-600 hover:bg-amber-700">
                            Lanjutkan
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <form onSubmit={checkVarianceAndSubmit} className="space-y-6">
                {/* Step 1: Basic Information */}
                <Card className={cn("border-gray-100 shadow-sm transition-all", step >= 1 ? "opacity-100" : "opacity-60")}>
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-50/50 border-b">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 rounded-lg">
                                <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-semibold">Invoice Information</CardTitle>
                                <CardDescription>Enter basic invoice details</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Internal Invoice Number */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                    <div className="p-1.5 bg-gray-100 rounded">
                                        <Hash className="h-3 w-3 text-gray-600" />
                                    </div>
                                    Internal Invoice Number
                                </Label>
                                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-50/50 border border-gray-200 rounded-lg">
                                    <FileText className="h-4 w-4 text-gray-400" />
                                    <span className="font-mono font-semibold text-gray-700">{internalInvoiceNumber}</span>
                                    <BadgeCheck className="h-4 w-4 text-emerald-500 ml-auto" />
                                </div>
                                <p className="text-xs text-gray-500">Auto-generated system reference</p>
                            </div>

                            {/* Supplier Invoice Number */}
                            <div className="space-y-2">
                                <Label htmlFor="supplierInvoiceNumber" className="text-sm font-medium flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-100 rounded">
                                        <Receipt className="h-3 w-3 text-blue-600" />
                                    </div>
                                    Supplier Invoice Number *
                                </Label>
                                <Input
                                    id="supplierInvoiceNumber"
                                    placeholder="Enter supplier invoice number"
                                    value={supplierInvoiceNumber}
                                    onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                                    required
                                    className="h-11 border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                                <p className="text-xs text-gray-500">Invoice number from supplier</p>
                            </div>

                            {/* Supplier Selection */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                    <div className="p-1.5 bg-amber-100 rounded">
                                        <Building className="h-3 w-3 text-amber-600" />
                                    </div>
                                    Supplier *
                                </Label>
                                <Select value={supplierId} onValueChange={setSupplierId} required>
                                    <SelectTrigger className="h-11 border-gray-200">
                                        <SelectValue placeholder="Select supplier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map((supplier) => (
                                            <SelectItem key={supplier.id} value={supplier.id}>
                                                <div className="flex items-center gap-3">
                                                    <div className="p-1.5 bg-amber-50 rounded">
                                                        <Building className="h-3 w-3 text-amber-500" />
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">{supplier.name}</span>
                                                        {supplier.code && (
                                                            <p className="text-xs text-gray-500">Code: {supplier.code}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Invoice Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="invoiceDate" className="text-sm font-medium flex items-center gap-2">
                                        <div className="p-1.5 bg-emerald-100 rounded">
                                            <Calendar className="h-3 w-3 text-emerald-600" />
                                        </div>
                                        Invoice Date *
                                    </Label>
                                    <Input
                                        id="invoiceDate"
                                        type="date"
                                        value={invoiceDate}
                                        onChange={(e) => setInvoiceDate(e.target.value)}
                                        required
                                        className="h-11 border-gray-200"
                                    />
                                </div>

                                {/* Due Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="dueDate" className="text-sm font-medium flex items-center gap-2">
                                        <div className="p-1.5 bg-rose-100 rounded">
                                            <Calendar className="h-3 w-3 text-rose-600" />
                                        </div>
                                        Due Date *
                                    </Label>
                                    <Input
                                        id="dueDate"
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        required
                                        className="h-11 border-gray-200"
                                    />
                                    <p className="text-xs text-gray-500">
                                        {format(new Date(dueDate), "dd MMMM yyyy", { locale: idLocale })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Step 2: PO Selection */}
                <Card className={cn("border-gray-100 shadow-sm transition-all", step >= 2 ? "opacity-100" : "opacity-60")}>
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-50/50 border-b">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-purple-50 rounded-lg">
                                <ShoppingCart className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-semibold">Purchase Order Selection</CardTitle>
                                <CardDescription>Select purchase order to load items</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                    <div className="p-1.5 bg-purple-100 rounded">
                                        <ClipboardList className="h-3 w-3 text-purple-600" />
                                    </div>
                                    Purchase Order *
                                </Label>
                                <Select
                                    value={purchaseOrderId}
                                    onValueChange={handlePOSelect}
                                    disabled={!supplierId || loadingPO}
                                >
                                    <SelectTrigger className="h-11 border-gray-200">
                                        <SelectValue placeholder={supplierId ? "Select PO" : "Select supplier first"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {purchaseOrders.map((po) => (
                                            <SelectItem key={po.id} value={po.id}>
                                                <div className="flex items-center justify-between w-full">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 bg-purple-50 rounded">
                                                            <ClipboardList className="h-3 w-3 text-purple-500" />
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">{po.poNumber}</span>
                                                            <p className="text-xs text-gray-500">{po.supplier?.name}</p>
                                                        </div>
                                                    </div>
                                                    <span className="font-semibold">{formatCurrency(po.totalAmount)}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {loadingPO && (
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading purchase order items...
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Step 3: Items & Totals */}
                {items.length > 0 && (
                    <>
                        <Card className="border-gray-100 shadow-sm">
                            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-50/50 border-b">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-primary/10 rounded-lg">
                                            <Package className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-semibold">Invoice Items</CardTitle>
                                            <CardDescription>
                                                {checkedItemsCount} of {totalItemsCount} items selected • Total: {formatCurrency(subtotal)}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-sm font-medium px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                                            {Math.round((checkedItemsCount / totalItemsCount) * 100)}% Selected
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gradient-to-r from-gray-50 to-gray-50/50">
                                                <TableHead className="w-12">
                                                    <div className="flex items-center justify-center">
                                                        <FileCheck className="h-4 w-4 text-gray-500" />
                                                    </div>
                                                </TableHead>
                                                <TableHead className="font-semibold text-gray-700">Product</TableHead>
                                                <TableHead className="font-semibold text-gray-700 text-right">PO Qty</TableHead>
                                                <TableHead className="font-semibold text-gray-700 text-right">PO Price</TableHead>
                                                <TableHead className="font-semibold text-gray-700 text-right">Invoice Qty</TableHead>
                                                <TableHead className="font-semibold text-gray-700 text-center">Qty GR Match</TableHead>
                                                <TableHead className="font-semibold text-gray-700 text-right">Invoice Price</TableHead>
                                                <TableHead className="font-semibold text-gray-700 text-right">Total</TableHead>
                                                <TableHead className="font-semibold text-gray-700 text-right">Variance</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.map((item, index) => (
                                                <TableRow
                                                    key={item.id}
                                                    className={cn(
                                                        "transition-colors",
                                                        !item.checked && "bg-gray-50/50 opacity-60"
                                                    )}
                                                >
                                                    <TableCell>
                                                        <div className="flex items-center justify-center">
                                                            <Checkbox
                                                                checked={item.checked}
                                                                onCheckedChange={() => toggleItem(index)}
                                                                className={cn(
                                                                    "h-5 w-5 border-2",
                                                                    item.checked
                                                                        ? "border-primary bg-primary text-white"
                                                                        : "border-gray-300"
                                                                )}
                                                            />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <p className="font-medium text-gray-900">
                                                                {item.product?.name || item.description}
                                                            </p>
                                                            {item.product?.id && (
                                                                <p className="text-xs text-gray-500 text-wrap">Desc.: {item.product.description}</p>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="text-gray-600">{item.quantity}</div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="text-gray-600">{formatCurrency(item.unitPrice)}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            step="1"
                                                            min="0"
                                                            value={item.receivedQuantity}
                                                            onChange={(e) => updateReceivedQuantity(index, parseFloat(e.target.value) || 0)}
                                                            disabled={!item.checked}
                                                            className="h-9 text-right border-gray-200"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center justify-center">
                                                            {item.grQuantity !== undefined && (
                                                                item.receivedQuantity === item.grQuantity ? (
                                                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100">
                                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                                        <span className="text-xs font-medium">Match</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-xs text-gray-500 text-center bg-gray-100 px-2 py-1 rounded" title={`GR Quantity: ${item.grQuantity}`}>
                                                                        Qty GR = {item.grQuantity}
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={item.receivedPrice}
                                                            onChange={(e) => updateReceivedPrice(index, parseFloat(e.target.value) || 0)}
                                                            disabled={!item.checked}
                                                            className="h-9 text-right border-gray-200"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className={cn(
                                                            "font-semibold",
                                                            item.checked ? "text-gray-900" : "text-gray-400"
                                                        )}>
                                                            {formatCurrency(item.receivedTotal)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {item.priceVariance !== 0 && (
                                                            <div className="flex items-center justify-end gap-2">
                                                                <span className={cn(
                                                                    "font-medium px-2 py-1 rounded",
                                                                    item.priceVariance > 0
                                                                        ? "bg-rose-50 text-rose-700"
                                                                        : "bg-emerald-50 text-emerald-700"
                                                                )}>
                                                                    {formatCurrency(item.priceVariance)}
                                                                </span>
                                                                {item.variancePercentage !== 0 && (
                                                                    <div className={cn(
                                                                        "text-xs px-1.5 py-0.5 rounded",
                                                                        item.variancePercentage > 0
                                                                            ? "bg-rose-100 text-rose-800"
                                                                            : "bg-emerald-100 text-emerald-800"
                                                                    )}>
                                                                        {item.variancePercentage > 0 ? '+' : ''}{item.variancePercentage.toFixed(1)}%
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {totalVariance !== 0 && (
                                    <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-amber-50/50 border border-amber-200 rounded-xl">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-amber-100 rounded-lg">
                                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium text-amber-900">Price Variance Detected</p>
                                                        <p className="text-sm text-amber-700">
                                                            Total variance from purchase order
                                                        </p>
                                                    </div>
                                                    <div className={cn(
                                                        "text-lg font-bold px-3 py-1 rounded-lg",
                                                        totalVariance > 0
                                                            ? "bg-rose-50 text-rose-700"
                                                            : "bg-emerald-50 text-emerald-700"
                                                    )}>
                                                        {formatCurrency(totalVariance)}
                                                    </div>
                                                </div>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <Progress
                                                        value={Math.abs(variancePercentage)}
                                                        className={cn(
                                                            "h-2",
                                                            totalVariance > 0 ? "bg-rose-100" : "bg-emerald-100"
                                                        )}
                                                    />
                                                    <span className="text-sm text-amber-600">
                                                        {variancePercentage > 0 ? '+' : ''}{variancePercentage.toFixed(1)}% from PO total
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Financial Summary */}
                        <Card className="border-gray-100 shadow-sm">
                            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-50/50 border-b">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg">
                                        <DollarSign className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-semibold">Financial Summary</CardTitle>
                                        <CardDescription>Review invoice totals and tax</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Subtotal */}
                                    <div className="space-y-4 p-5 bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-100 rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-white rounded-lg">
                                                    <Calculator className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <span className="font-medium text-gray-700">Subtotal</span>
                                            </div>
                                            <div className="text-2xl font-bold text-blue-700">
                                                {formatCurrency(subtotal)}
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            Based on {checkedItemsCount} selected items
                                        </p>
                                    </div>

                                    {/* Tax Calculation */}
                                    <div className="space-y-4 p-5 bg-gradient-to-br from-purple-50 to-purple-50/50 border border-purple-100 rounded-xl">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 bg-white rounded-lg">
                                                        <Percent className="h-4 w-4 text-purple-600" />
                                                    </div>
                                                    <span className="font-medium text-gray-700">Tax Rate</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    {[0, 11, 10].map((rate) => (
                                                        <Button
                                                            key={rate}
                                                            type="button"
                                                            variant={taxRate === rate ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => handleTaxRateChange(rate)}
                                                            className={cn(
                                                                "h-8 px-3",
                                                                taxRate === rate && "bg-purple-600 hover:bg-purple-700"
                                                            )}
                                                        >
                                                            {rate}%
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                            <Separator />
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600">Tax Amount</span>
                                                <div className="text-xl font-semibold text-purple-700">
                                                    {formatCurrency(taxAmountNumber)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Total Amount */}
                                    <div className="space-y-4 p-5 bg-gradient-to-br from-emerald-50 to-emerald-50/50 border border-emerald-100 rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-white rounded-lg">
                                                    <DollarSign className="h-4 w-4 text-emerald-600" />
                                                </div>
                                                <span className="font-medium text-gray-700">Total Amount</span>
                                            </div>
                                            <div className="text-3xl font-bold text-emerald-700">
                                                {formatCurrency(totalAmount)}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Subtotal</span>
                                                <span className="font-medium">{formatCurrency(subtotal)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Tax ({taxRate}%)</span>
                                                <span className="font-medium">{formatCurrency(taxAmountNumber)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center pt-6 border-t">
                    <div className="text-sm text-gray-500">
                        {step === 1 && "Step 1: Enter invoice information"}
                        {step === 2 && "Step 2: Select purchase order"}
                        {step === 3 && "Step 3: Review items and totals"}
                    </div>
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push("/admin-area/accounting/supplier-invoice")}
                            disabled={loading}
                            className="h-11 px-6 border-gray-200 hover:border-gray-300"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || items.length === 0 || !supplierInvoiceNumber || !supplierId}
                            className="h-11 px-8 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Create Invoice
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}