'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, CalendarIcon, CheckCircle2, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { markGoodsArrivedAction } from '@/lib/action/grInventory/grAction';
import type { GoodsReceipt } from '@/types/grInventoryType';

interface MarkAsArrivedDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    gr: GoodsReceipt;
    onSuccess?: () => void;
    onOpenQCDialog?: () => void; // Callback to open QC dialog after successful submission
}

export function MarkAsArrivedDialog({
    open,
    onOpenChange,
    gr,
    onSuccess,
    onOpenQCDialog,
}: MarkAsArrivedDialogProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [receivedDate, setReceivedDate] = useState<Date>(new Date());
    const [vendorDeliveryNote, setVendorDeliveryNote] = useState(gr.vendorDeliveryNote || '');
    const [vehicleNumber, setVehicleNumber] = useState(gr.vehicleNumber || '');
    const [driverName, setDriverName] = useState(gr.driverName || '');
    const [receiveMode, setReceiveMode] = useState<'all' | 'partial'>('all');

    // Track quantities for each item
    const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});

    // Sync state with props when dialog opens or GR changes
    useEffect(() => {
        if (open && gr) {
            setVendorDeliveryNote(gr.vendorDeliveryNote || '');
            setVehicleNumber(gr.vehicleNumber || '');
            setDriverName(gr.driverName || '');
            setReceivedDate(new Date());
            setReceiveMode('all');

            // Initialize quantities
            const quantities: Record<string, number> = {};
            gr.items?.forEach(item => {
                const plannedQty = item.qtyPlanReceived
                    ? Number(item.qtyPlanReceived)
                    : (item.purchaseOrderLine?.quantity ? Number(item.purchaseOrderLine.quantity) : 0);
                quantities[item.id] = plannedQty;
            });
            setItemQuantities(quantities);
        }
    }, [open, gr]);

    const handleReceiveModeChange = (mode: 'all' | 'partial') => {
        setReceiveMode(mode);

        if (mode === 'all') {
            // Auto-fill all with planned quantities
            const newQuantities: Record<string, number> = {};
            gr.items?.forEach(item => {
                const plannedQty = item.qtyPlanReceived
                    ? Number(item.qtyPlanReceived)
                    : (item.purchaseOrderLine?.quantity ? Number(item.purchaseOrderLine.quantity) : 0);

                newQuantities[item.id] = plannedQty;
            });
            setItemQuantities(newQuantities);
            toast.success('Semua item diisi dengan quantity yang direncanakan');
        } else {
            // Clear all to 0 for manual input
            const newQuantities: Record<string, number> = {};
            gr.items?.forEach(item => {
                newQuantities[item.id] = 0;
            });
            setItemQuantities(newQuantities);
            toast.info('Silakan input quantity yang diterima untuk setiap item');
        }
    };

    const handleReceiveAll = () => {
        const newQuantities: Record<string, number> = {};
        gr.items?.forEach(item => {
            // Try qtyPlanReceived first, fallback to purchaseOrderLine quantity
            const plannedQty = item.qtyPlanReceived
                ? Number(item.qtyPlanReceived)
                : (item.purchaseOrderLine?.quantity ? Number(item.purchaseOrderLine.quantity) : 0);

            newQuantities[item.id] = plannedQty;
        });
        setItemQuantities(newQuantities);
        toast.success('Semua item diisi dengan quantity yang direncanakan');
    };

    const handleReceivePartial = () => {
        // Just clear all to 0, user will input manually
        const newQuantities: Record<string, number> = {};
        gr.items?.forEach(item => {
            newQuantities[item.id] = 0;
        });
        setItemQuantities(newQuantities);
        toast.info('Silakan input quantity yang diterima untuk setiap item');
    };

    const handleQuantityChange = (itemId: string, value: string) => {
        const numValue = parseFloat(value) || 0;
        setItemQuantities(prev => ({
            ...prev,
            [itemId]: numValue
        }));
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);

            // Validate at least one item has quantity > 0
            const hasQuantity = Object.values(itemQuantities).some(qty => qty > 0);
            if (!hasQuantity) {
                toast.error('Minimal satu item harus memiliki quantity > 0');
                return;
            }

            // Prepare data
            const data = {
                receivedDate,
                vendorDeliveryNote: vendorDeliveryNote || undefined,
                vehicleNumber: vehicleNumber || undefined,
                driverName: driverName || undefined,
                items: gr.items?.map(item => ({
                    id: item.id,
                    qtyReceived: itemQuantities[item.id] || 0
                })) || []
            };

            const result = await markGoodsArrivedAction(gr.id, data);

            if (result.success) {
                toast.success(
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <span className="font-semibold">Barang Berhasil Diterima!</span>
                        </div>
                        <p className="text-sm text-slate-600">
                            Status berubah menjadi ARRIVED. Silakan lanjut ke proses QC Check.
                        </p>
                    </div>,
                    { duration: 5000 }
                );

                onOpenChange(false);
                if (onSuccess) onSuccess();
                router.refresh();

                // Auto-open QC dialog after 1.5 seconds
                // Auto-open QC dialog logic disabled
                /* 
                if (onOpenQCDialog) {
                    setTimeout(() => {
                        onOpenQCDialog();
                    }, 1500);
                }
                */
            } else {
                toast.error(result.message || 'Gagal menerima barang');
            }
        } catch (error) {
            console.error('Error marking as arrived:', error);
            toast.error('Terjadi kesalahan saat menerima barang');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Package className="h-6 w-6 text-blue-600" />
                        Penerimaan Barang - {gr.grNumber}
                    </DialogTitle>
                    <DialogDescription>
                        Input informasi penerimaan barang dari supplier
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4 overflow-y-auto flex-1">
                    {/* Delivery Information */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="receivedDate">Tanggal Diterima *</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !receivedDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {receivedDate ? (
                                            format(receivedDate, "PPP", { locale: localeId })
                                        ) : (
                                            <span>Pilih tanggal</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={receivedDate}
                                        onSelect={(date) => date && setReceivedDate(date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="vendorDeliveryNote">Nomor Surat Jalan</Label>
                            <Input
                                id="vendorDeliveryNote"
                                value={vendorDeliveryNote}
                                onChange={(e) => setVendorDeliveryNote(e.target.value)}
                                placeholder="DN-12345"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="vehicleNumber">Nomor Kendaraan</Label>
                            <Input
                                id="vehicleNumber"
                                value={vehicleNumber}
                                onChange={(e) => setVehicleNumber(e.target.value)}
                                placeholder="B 1234 XYZ"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="driverName">Nama Supir</Label>
                            <Input
                                id="driverName"
                                value={driverName}
                                onChange={(e) => setDriverName(e.target.value)}
                                placeholder="John Doe"
                            />
                        </div>
                    </div>

                    {/* Receive Mode Tabs */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700">Mode Penerimaan</Label>
                        <Tabs value={receiveMode} onValueChange={(value) => handleReceiveModeChange(value as 'all' | 'partial')}>
                            <TabsList className="grid w-full grid-cols-2 bg-blue-50 border border-blue-200 h-12">
                                <TabsTrigger
                                    value="all"
                                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Terima Semua
                                </TabsTrigger>
                                <TabsTrigger
                                    value="partial"
                                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                                >
                                    <Package className="mr-2 h-4 w-4" />
                                    Terima Partial
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* Items Checklist */}
                    <div className="space-y-2">
                        <Label className="text-base font-semibold">Checklist Barang Diterima</Label>
                        <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
                            {gr.items?.map((item, index) => (
                                <div
                                    key={item.id}
                                    className={cn(
                                        "p-4 hover:bg-slate-50 transition-colors",
                                        index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                                    )}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex-1">
                                            <div className="font-semibold text-slate-800">
                                                {item.product.name}
                                            </div>
                                            <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                                <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-medium">
                                                    {item.product.code}
                                                </span>
                                                <span>•</span>
                                                <span>Unit: {item.unit}</span>
                                            </div>
                                            <div className="text-sm text-blue-600 mt-1">
                                                Rencana barang diterima : <span className="font-bold">
                                                    {(item.qtyPlanReceived
                                                        ? Number(item.qtyPlanReceived)
                                                        : (item.purchaseOrderLine?.quantity ? Number(item.purchaseOrderLine.quantity) : 0)
                                                    ).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="w-32">
                                            <Label htmlFor={`qty-${item.id}`} className="text-xs text-slate-600">
                                                Qty Diterima
                                            </Label>
                                            <Input
                                                id={`qty-${item.id}`}
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={itemQuantities[item.id] || 0}
                                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                className="mt-1 text-right font-semibold"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Konfirmasi Penerimaan
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
