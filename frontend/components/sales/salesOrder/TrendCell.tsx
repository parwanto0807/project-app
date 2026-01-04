
import * as React from "react";
import Decimal from "decimal.js";
import {
    BarChart2,
    TrendingDown,
    TrendingUp,
} from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { SalesOrder } from "@/types/salesOrder";


export function TrendCell({ order }: { order: SalesOrder }) {
    const [isOpen, setIsOpen] = React.useState(false);

    // Ambil semua details dari semua purchaseRequest di semua SPK (sama seperti Total PR)
    const allDetails = order.spk?.flatMap(spk =>
        spk.purchaseRequest?.flatMap(pr => pr.details ?? []) ?? []
    ) ?? [];

    if (allDetails.length === 0) return null;

    // Hitung total biaya dari PR details
    const totalBiaya = allDetails.reduce((sum, detail) => {
        const detailJumlah = new Decimal(detail.estimasiTotalHarga ?? 0);
        return sum.plus(detailJumlah);
    }, new Decimal(0));

    const totalSales = (order.items ?? []).reduce(
        (sum, item) => sum.plus(new Decimal(item.qty ?? 0).times(new Decimal(item.unitPrice ?? 0))),
        new Decimal(0)
    );

    const ratio = totalBiaya.div(totalSales);
    const ratioPercent = ratio.times(100).toFixed(1);

    let IconComponent = TrendingUp;
    let colorClass = "text-green-600";
    let statusText = "Sehat";
    let statusBg = "bg-green-50";
    let statusBorder = "border-green-200";

    if (ratio.gt(1)) {
        IconComponent = TrendingDown;
        colorClass = "text-red-600";
        statusText = "Overbudget";
        statusBg = "bg-red-50";
        statusBorder = "border-red-200";
    } else if (ratio.gte(0.8)) {
        IconComponent = BarChart2;
        colorClass = "text-yellow-600";
        statusText = "Warning";
        statusBg = "bg-yellow-50";
        statusBorder = "border-yellow-200";
    }

    const formattedBiaya = new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(totalBiaya.toNumber());

    const formattedSales = new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(totalSales.toNumber());

    return (
        <div className="flex justify-center">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <button
                        className="hover:scale-110 transition-transform cursor-pointer"
                        onMouseEnter={() => setIsOpen(true)}
                        onMouseLeave={() => setIsOpen(false)}
                    >
                        <IconComponent size={24} className={colorClass} />
                    </button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-80"
                    align="center"
                    onMouseEnter={() => setIsOpen(true)}
                    onMouseLeave={() => setIsOpen(false)}
                >
                    <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-center gap-2 pb-2 border-b">
                            <IconComponent size={20} className={colorClass} />
                            <h4 className="font-semibold text-sm">Trend Biaya Project</h4>
                        </div>

                        {/* Status Badge */}
                        <div className={`${statusBg} ${statusBorder} border rounded-lg p-2 text-center`}>
                            <p className={`font-bold ${colorClass}`}>{statusText}</p>
                            <p className="text-xs text-gray-600 mt-1">Ratio: {ratioPercent}%</p>
                        </div>

                        {/* Calculation Details */}
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Total PR (Biaya):</span>
                                <span className="font-semibold">Rp {formattedBiaya}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Total Sales Order:</span>
                                <span className="font-semibold">Rp {formattedSales}</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between items-center">
                                <span className="text-gray-600">Ratio Biaya/Sales:</span>
                                <span className={`font-bold ${colorClass}`}>{ratioPercent}%</span>
                            </div>
                        </div>

                        {/* Interpretation Guide */}
                        <div className="bg-gray-50 rounded-lg p-2 space-y-1 text-xs">
                            <p className="font-semibold text-gray-700 mb-1">Interpretasi:</p>
                            <div className="flex items-center gap-2">
                                <TrendingUp size={14} className="text-green-600" />
                                <span className="text-gray-600">0-80%: Sehat (Margin baik)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <BarChart2 size={14} className="text-yellow-600" />
                                <span className="text-gray-600">80-100%: Warning (Margin tipis)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <TrendingDown size={14} className="text-red-600" />
                                <span className="text-gray-600">&gt;100%: Overbudget (Rugi)</span>
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="text-xs text-gray-500 italic border-t pt-2">
                            <p>💡 Trend ini dihitung dari total estimasi biaya PR dibanding nilai Sales Order</p>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
