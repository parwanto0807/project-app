'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, ThumbsUp, CheckCircle2, AlertTriangle, Package } from 'lucide-react';
import { approveGRAction } from '@/lib/action/grInventory/grAction';
import type { GoodsReceipt } from '@/types/grInventoryType';

interface ApproveGRDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    gr: GoodsReceipt;
    onSuccess?: () => void;
}

export function ApproveGRDialog({
    open,
    onOpenChange,
    gr,
    onSuccess,
}: ApproveGRDialogProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notes, setNotes] = useState('');

    // Calculate summary
    const summary = {
        totalItems: gr.items?.length || 0,
        totalPassed: gr.items?.reduce((sum, item) => sum + Number(item.qtyPassed || 0), 0) || 0,
        totalRejected: gr.items?.reduce((sum, item) => sum + Number(item.qtyRejected || 0), 0) || 0,
        passedItems: gr.items?.filter(item => item.qcStatus === 'PASSED').length || 0,
        partialItems: gr.items?.filter(item => item.qcStatus === 'PARTIAL').length || 0,
        rejectedItems: gr.items?.filter(item => item.qcStatus === 'REJECTED').length || 0,
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);

            const result = await approveGRAction(gr.id, { notes: notes || undefined });

            if (result.success) {
                const hasAutoGR = result.data?.autoCreatedGR;

                toast.success(
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <span className="font-semibold">GR Berhasil Di-Approve!</span>
                        </div>
                        <div className="text-sm text-slate-600 space-y-1">
                            <p>✓ Status GR: <span className="font-bold">COMPLETED</span></p>
                            <p>✓ Stock Balance: <span className="font-bold">Updated</span></p>
                            <p>✓ Qty masuk stock: <span className="font-bold">{summary.totalPassed.toLocaleString()}</span></p>
                            {hasAutoGR && (
                                <>
                                    <div className="mt-2 pt-2 border-t border-green-300">
                                        <p className="flex items-center gap-1 text-blue-700 font-semibold">
                                            <Package className="h-4 w-4" />
                                            GR Baru Dibuat Otomatis
                                        </p>
                                        <p className="mt-1">
                                            📋 <span className="font-bold">{hasAutoGR.grNumber}</span>
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {hasAutoGR.itemCount} item dengan qty tersisa
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>,
                    { duration: hasAutoGR ? 10000 : 7000 }
                );

                onOpenChange(false);
                if (onSuccess) onSuccess();
                router.refresh();
            } else {
                toast.error(result.message || 'Gagal approve GR');
            }
        } catch (error) {
            console.error('Error approving GR:', error);
            toast.error('Terjadi kesalahan saat approve GR');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <ThumbsUp className="h-6 w-6 text-emerald-600" />
                        Approve Goods Receipt
                    </DialogTitle>
                    <DialogDescription>
                        Konfirmasi approval dan update stock balance
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Warning */}
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800">
                            <p className="font-semibold mb-1">Perhatian!</p>
                            <p>Setelah di-approve, GR tidak bisa diubah lagi dan stock balance akan otomatis terupdate.</p>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold">Ringkasan GR</Label>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="text-xs text-slate-600 mb-1">GR Number</div>
                                <div className="font-bold text-slate-800">{gr.grNumber}</div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="text-xs text-slate-600 mb-1">Total Items</div>
                                <div className="font-bold text-slate-800">{summary.totalItems} items</div>
                            </div>
                        </div>

                        <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2">
                            <div className="text-sm font-semibold text-slate-700 mb-3">Hasil QC:</div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    <span className="text-sm text-slate-600">Items Passed (OK)</span>
                                </div>
                                <Badge className="bg-green-50 text-green-700 border-green-200">
                                    {summary.passedItems} items
                                </Badge>
                            </div>

                            {summary.partialItems > 0 && (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                                        <span className="text-sm text-slate-600">Items Partial</span>
                                    </div>
                                    <Badge className="bg-orange-50 text-orange-700 border-orange-200">
                                        {summary.partialItems} items
                                    </Badge>
                                </div>
                            )}

                            {summary.rejectedItems > 0 && (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4 text-red-600" />
                                        <span className="text-sm text-slate-600">Items Rejected</span>
                                    </div>
                                    <Badge className="bg-red-50 text-red-700 border-red-200">
                                        {summary.rejectedItems} items
                                    </Badge>
                                </div>
                            )}

                            <div className="pt-3 mt-3 border-t border-slate-200">
                                <div className="flex items-center justify-between bg-green-100 p-3 rounded-lg border border-green-300 shadow-sm">
                                    <span className="text-sm font-bold text-green-900 uppercase tracking-wide">Qty Masuk Stock:</span>
                                    <span className="text-2xl font-extrabold text-green-700">
                                        {summary.totalPassed.toLocaleString()}
                                    </span>
                                </div>
                                {summary.totalRejected > 0 && (
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-sm text-slate-600">Qty Rejected:</span>
                                        <span className="text-sm font-semibold text-red-600">
                                            {summary.totalRejected.toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Catatan (Opsional)</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Tambahkan catatan approval..."
                            rows={3}
                        />
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
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <ThumbsUp className="mr-2 h-4 w-4" />
                                Approve & Update Stock
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
