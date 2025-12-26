'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle, AlertCircle, PackageCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { recordQCCheckAction } from '@/lib/action/grInventory/grAction';
import type { GoodsReceipt, QCStatus } from '@/types/grInventoryType';

interface QCCheckDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    gr: GoodsReceipt;
    onSuccess?: () => void;
}

export function QCCheckDialog({
    open,
    onOpenChange,
    gr,
    onSuccess,
}: QCCheckDialogProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Track QC results for each item
    const [itemResults, setItemResults] = useState<Record<string, {
        qtyPassed: number;
        qtyRejected: number;
        qcNotes: string;
    }>>({});

    // Reset/Initialize state when dialog opens
    useEffect(() => {
        if (open && gr.items) {
            setItemResults(
                gr.items.reduce((acc, item) => ({
                    ...acc,
                    [item.id]: {
                        qtyPassed: Number(item.qtyReceived || 0),
                        qtyRejected: 0,
                        qcNotes: ''
                    }
                }), {})
            );
        }
    }, [open, gr.items]);

    const handlePassAll = async () => {
        const newResults: typeof itemResults = {};
        gr.items?.forEach(item => {
            newResults[item.id] = {
                qtyPassed: Number(item.qtyReceived || 0),
                qtyRejected: 0,
                qcNotes: ''
            };
        });
        setItemResults(newResults);

        // Wait for state to update, then auto-submit
        setTimeout(async () => {
            try {
                setIsSubmitting(true);

                // Prepare data with all items passed
                const data = {
                    items: gr.items?.map(item => ({
                        id: item.id,
                        qtyPassed: Number(item.qtyReceived || 0),
                        qtyRejected: 0,
                        qcNotes: undefined
                    })) || []
                };

                const result = await recordQCCheckAction(gr.id, data);

                if (result.success) {
                    toast.success(
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <span className="font-semibold">QC Check Selesai!</span>
                            </div>
                            <div className="text-sm text-slate-600 space-y-1">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    <span>{gr.items?.length || 0} item OK (semua lolos)</span>
                                </div>
                                <p className="font-medium mt-2">Silakan Approve GR untuk update stock.</p>
                            </div>
                        </div>,
                        { duration: 7000 }
                    );

                    onOpenChange(false);
                    if (onSuccess) onSuccess();
                    router.refresh();
                } else {
                    toast.error(result.message || 'Gagal menyimpan hasil QC');
                }
            } catch (error) {
                console.error('Error recording QC:', error);
                toast.error('Terjadi kesalahan saat menyimpan QC');
            } finally {
                setIsSubmitting(false);
            }
        }, 100);
    };

    const handleUpdateItem = (itemId: string, field: 'qtyPassed' | 'qtyRejected' | 'qcNotes', value: string | number) => {
        setItemResults(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                [field]: value
            }
        }));
    };

    const getItemStatus = (itemId: string): { status: QCStatus; color: string; label: string; icon: any } => {
        const result = itemResults[itemId];
        if (!result) return { status: 'PENDING' as QCStatus, color: 'gray', label: 'Pending', icon: AlertCircle };

        const { qtyPassed, qtyRejected } = result;

        if (qtyRejected === 0) {
            return { status: 'PASSED' as QCStatus, color: 'green', label: 'OK - Semua Lolos', icon: CheckCircle2 };
        } else if (qtyPassed === 0) {
            return { status: 'REJECTED' as QCStatus, color: 'red', label: 'Reject - Semua Ditolak', icon: XCircle };
        } else {
            return { status: 'PARTIAL' as QCStatus, color: 'orange', label: 'Partial - Ada yang Reject', icon: AlertCircle };
        }
    };

    const getSummary = () => {
        let allPassed = 0;
        let someRejected = 0;
        let allRejected = 0;

        gr.items?.forEach(item => {
            const result = itemResults[item.id];
            if (result) {
                if (result.qtyRejected === 0) allPassed++;
                else if (result.qtyPassed === 0) allRejected++;
                else someRejected++;
            }
        });

        return { allPassed, someRejected, allRejected, total: gr.items?.length || 0 };
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);

            // Validate quantities
            const item = gr.items?.find(item => {
                const result = itemResults[item.id];
                const total = (result?.qtyPassed || 0) + (result?.qtyRejected || 0);
                const received = Number(item.qtyReceived || 0);
                return Math.abs(total - received) > 0.0001;
            });

            if (item) {
                toast.error(`Item "${item.product.name}": qtyPassed + qtyRejected harus sama dengan qtyReceived`);
                return;
            }

            // Prepare data
            const data = {
                items: gr.items?.map(item => ({
                    id: item.id,
                    qtyPassed: itemResults[item.id]?.qtyPassed || 0,
                    qtyRejected: itemResults[item.id]?.qtyRejected || 0,
                    qcNotes: itemResults[item.id]?.qcNotes || undefined
                })) || []
            };

            const result = await recordQCCheckAction(gr.id, data);

            if (result.success) {
                const summary = getSummary();
                const StatusIcon = summary.allRejected > 0 ? XCircle : summary.someRejected > 0 ? AlertCircle : CheckCircle2;
                const statusColor = summary.allRejected > 0 ? 'red' : summary.someRejected > 0 ? 'orange' : 'green';

                toast.success(
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <StatusIcon className={`h-5 w-5 text-${statusColor}-600`} />
                            <span className="font-semibold">QC Check Selesai!</span>
                        </div>
                        <div className="text-sm text-slate-600 space-y-1">
                            {summary.allPassed > 0 && (
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    <span>{summary.allPassed} item OK (semua lolos)</span>
                                </div>
                            )}
                            {summary.someRejected > 0 && (
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-orange-600" />
                                    <span>{summary.someRejected} item Partial (ada yang reject)</span>
                                </div>
                            )}
                            {summary.allRejected > 0 && (
                                <div className="flex items-center gap-2">
                                    <XCircle className="h-4 w-4 text-red-600" />
                                    <span>{summary.allRejected} item Reject (semua ditolak)</span>
                                </div>
                            )}
                            <p className="font-medium mt-2">Silakan Approve GR untuk update stock.</p>
                        </div>
                    </div>,
                    { duration: 7000 }
                );

                onOpenChange(false);
                if (onSuccess) onSuccess();
                router.refresh();
            } else {
                toast.error(result.message || 'Gagal menyimpan hasil QC');
            }
        } catch (error) {
            console.error('Error recording QC:', error);
            toast.error('Terjadi kesalahan saat menyimpan QC');
        } finally {
            setIsSubmitting(false);
        }
    };

    const summary = getSummary();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <PackageCheck className="h-6 w-6 text-green-600" />
                        QC Check - {gr.grNumber}
                    </DialogTitle>
                    <DialogDescription>
                        Input hasil pemeriksaan kualitas untuk setiap item
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Quick Action */}
                    <div className="flex gap-2 p-4 bg-green-50 rounded-lg border border-green-200">
                        <Button
                            type="button"
                            onClick={handlePassAll}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Semua Item OK (Pass All)
                        </Button>
                    </div>

                    {/* Summary */}
                    {(summary.someRejected > 0 || summary.allRejected > 0) && (
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="font-semibold text-slate-700 mb-2">Ringkasan Hasil QC:</div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    <span>{summary.allPassed} OK</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-orange-600" />
                                    <span>{summary.someRejected} Partial</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <XCircle className="h-4 w-4 text-red-600" />
                                    <span>{summary.allRejected} Reject</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Items QC Form */}
                    <div className="space-y-2">
                        <Label className="text-base font-semibold">Detail QC Per Item</Label>
                        <div className="border rounded-lg divide-y max-h-[500px] overflow-y-auto">
                            {gr.items?.map((item, index) => {
                                const itemStatus = getItemStatus(item.id);
                                const StatusIcon = itemStatus.icon;

                                return (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            "p-4",
                                            index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                                        )}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="font-semibold text-slate-800">
                                                        {item.product.name}
                                                    </div>
                                                    <Badge variant="outline" className={`bg-${itemStatus.color}-50 text-${itemStatus.color}-700 border-${itemStatus.color}-200`}>
                                                        <StatusIcon className="h-3 w-3 mr-1" />
                                                        {itemStatus.label}
                                                    </Badge>
                                                </div>
                                                <div className="text-sm text-slate-500 mb-2">
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-medium mr-2">
                                                        {item.product.code}
                                                    </span>
                                                    Diterima: <span className="font-bold">{Number(item.qtyReceived || 0).toLocaleString()}</span> {item.unit}
                                                </div>

                                                <div className="grid grid-cols-3 gap-2">
                                                    <div>
                                                        <Label htmlFor={`passed-${item.id}`} className="text-xs text-green-700">
                                                            Qty Lolos (Passed)
                                                        </Label>
                                                        <Input
                                                            id={`passed-${item.id}`}
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={itemResults[item.id]?.qtyPassed || 0}
                                                            onChange={(e) => handleUpdateItem(item.id, 'qtyPassed', parseFloat(e.target.value) || 0)}
                                                            className="mt-1 text-right font-semibold border-green-300 focus:border-green-500"
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label htmlFor={`rejected-${item.id}`} className="text-xs text-red-700">
                                                            Qty Ditolak (Rejected)
                                                        </Label>
                                                        <Input
                                                            id={`rejected-${item.id}`}
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={itemResults[item.id]?.qtyRejected || 0}
                                                            onChange={(e) => handleUpdateItem(item.id, 'qtyRejected', parseFloat(e.target.value) || 0)}
                                                            className="mt-1 text-right font-semibold border-red-300 focus:border-red-500"
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label htmlFor={`notes-${item.id}`} className="text-xs text-slate-600">
                                                            Catatan QC
                                                        </Label>
                                                        <Input
                                                            id={`notes-${item.id}`}
                                                            value={itemResults[item.id]?.qcNotes || ''}
                                                            onChange={(e) => handleUpdateItem(item.id, 'qcNotes', e.target.value)}
                                                            placeholder="Alasan reject..."
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
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
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <PackageCheck className="mr-2 h-4 w-4" />
                                Simpan Hasil QC
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
