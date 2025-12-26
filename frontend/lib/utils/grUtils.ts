import { GoodsReceiptItem } from '@/schemas/wh/grInventorySchema';
import { QCStatus as QCStatusType } from '@/types/grInventoryType';

/**
 * Calculate QC summary for a Goods Receipt
 */
export function calculateQCSummary(items: GoodsReceiptItem[]): {
    totalItems: number;
    totalReceived: number;
    totalPassed: number;
    totalRejected: number;
    passingRate: number;
    qcStatusCounts: Record<QCStatusType, number>;
} {
    const summary = {
        totalItems: items.length,
        totalReceived: 0,
        totalPassed: 0,
        totalRejected: 0,
        passingRate: 0,
        qcStatusCounts: {
            [QCStatusType.PENDING]: 0,
            [QCStatusType.PASSED]: 0,
            [QCStatusType.REJECTED]: 0,
            [QCStatusType.PARTIAL]: 0
        } as Record<QCStatusType, number>
    };

    items.forEach(item => {
        summary.totalReceived += item.qtyReceived;
        summary.totalPassed += item.qtyPassed;
        summary.totalRejected += item.qtyRejected;
        summary.qcStatusCounts[item.qcStatus]++;
    });

    summary.passingRate = summary.totalReceived > 0
        ? (summary.totalPassed / summary.totalReceived) * 100
        : 0;

    return summary;
}

/**
 * Validate if Goods Receipt can be completed
 */
export function validateGoodsReceiptCompletion(items: GoodsReceiptItem[]): {
    canComplete: boolean;
    pendingItems: number;
    message?: string;
} {
    const pendingItems = items.filter(item => item.qcStatus === QCStatusType.PENDING).length;

    if (pendingItems > 0) {
        return {
            canComplete: false,
            pendingItems,
            message: `Cannot complete goods receipt with ${pendingItems} pending QC items`
        };
    }

    return {
        canComplete: true,
        pendingItems: 0
    };
}
