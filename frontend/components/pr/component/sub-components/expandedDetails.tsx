import { PurchaseRequestWithRelations } from "@/types/pr";
import { formatCurrency } from "../utils";

interface ExpandedDetailsProps {
  details: PurchaseRequestWithRelations['details'];
}

export function ExpandedDetails({ details }: ExpandedDetailsProps) {
  return (
    <div className="mt-0 ml-10">
      <h4 className="font-semibold mb-3 text-sm text-muted-foreground">
        Items ({details?.length || 0})
      </h4>

      <div className="rounded-lg border overflow-hidden">
        <div className="grid grid-cols-5 bg-slate-300 dark:bg-slate-600 text-xs font-semibold px-4 py-2 dark:text-white uppercase">
          <div>No</div>
          <div>Item</div>
          <div className="text-center">Qty</div>
          <div className="text-right">Unit Price</div>
          <div className="text-right">Total</div>
        </div>

        {details && details.length > 0 ? (
          <div className="divide-y max-h-56 overflow-y-auto">
            {details.map((detail, index) => (
              <div key={detail.id} className="grid grid-cols-5 px-4 py-2 text-sm items-center hover:bg-muted/30">
                <div className="text-xs font-medium">{index + 1}</div>
                <div className="truncate">{detail.product?.name || "Unnamed Item"}</div>
                <div className="text-center">{detail.jumlah} {detail.satuan}</div>
                <div className="text-right">{formatCurrency(detail.estimasiHargaSatuan)}</div>
                <div className="text-right font-semibold text-green-600">
                  {formatCurrency(detail.estimasiTotalHarga)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No items available
          </div>
        )}
      </div>
    </div>
  );
}