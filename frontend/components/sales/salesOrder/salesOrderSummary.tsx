import React from 'react';
import { CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
    BarChart3,
    ChevronUp,
    ChevronDown,
    DollarSign,
    ShoppingCart,
    CreditCard,
    FileText,
    PieChart,
    TrendingUp,
    AlertTriangle,
    AlertCircle,
    CheckCircle,
    Info
} from 'lucide-react';
import Decimal from "decimal.js";

type DecimalType = InstanceType<typeof Decimal>;

interface SummaryTotals {
    totalSales: DecimalType;
    totalPR: DecimalType;
    totalUangMuka: DecimalType;
    totalLPP: DecimalType;
    profit: DecimalType;
    profitMargin: number;
    totalOrders: number;
    validOrdersCount: number;
}

interface SalesOrderSummaryProps {
    role: string;
    summaryExpanded: boolean;
    setSummaryExpanded: (expanded: boolean) => void;
    summaryTotals: SummaryTotals;
}

const formatCurrency = (amount: DecimalType): string => {
    return amount.toNumber().toLocaleString('id-ID');
};

const getAmountColor = (amount: DecimalType, sales: DecimalType): string => {
    if (sales.isZero()) return "text-gray-600 dark:text-gray-400";
    
    if (amount.gt(sales)) {
        return "text-red-600 dark:text-red-400";
    } else if (amount.div(sales).gte(0.8)) {
        return "text-yellow-600 dark:text-yellow-400";
    }
    return "text-green-600 dark:text-green-400";
};

const getProgressBarWidth = (lpp: DecimalType, sales: DecimalType): number => {
    if (sales.isZero()) return 0;
    
    const percentage = lpp.div(sales).times(100).toNumber();
    return Math.max(0, Math.min(100, 100 - percentage));
};

const getPRStatusIcon = (pr: DecimalType, sales: DecimalType) => {
    if (sales.isZero()) return <Info className="h-4 w-4 text-gray-600" />;
    
    if (pr.gt(sales)) {
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    } else if (pr.div(sales).gte(0.8)) {
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-600" />;
};

const getPRStatusText = (pr: DecimalType, sales: DecimalType): string => {
    if (sales.isZero()) return "No sales data";
    
    if (pr.gt(sales)) {
        return "text-red-600";
    } else if (pr.div(sales).gte(0.8)) {
        return "text-yellow-600";
    }
    return "text-green-600";
};

const getPRPercentageText = (pr: DecimalType, sales: DecimalType): string => {
    if (sales.isZero()) return "0%";
    return `${pr.div(sales).times(100).toFixed(1)}% of sales`;
};

export const SalesOrderSummary: React.FC<SalesOrderSummaryProps> = ({
    role,
    summaryExpanded,
    setSummaryExpanded,
    summaryTotals
}) => {
    // Role-based access control
    if (role !== "admin" && role !== "super") {
        return null;
    }

    const handleAccordionChange = (value: string) => {
        setSummaryExpanded(value === "summary");
    };

    return (
        <CardContent className="px-4 pb-4">
            <Accordion
                type="single"
                collapsible
                value={summaryExpanded ? "summary" : ""}
                onValueChange={handleAccordionChange}
            >
                <AccordionItem value="summary" className="border rounded-lg shadow-sm">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center justify-between w-full pr-4 cursor-pointer rounded-lg p-2 bg-gradient-to-r from-gray-200 via-gray-50 to-gray-300 dark:bg-gradient-to-r dark:from-gray-800 dark:via-gray-900 dark:to-black">
                            <div className="flex items-center gap-3">
                                <BarChart3 className="h-5 w-5 text-cyan-600" />
                                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Sales Order Summary
                                </span>
                                <Badge variant="outline" className="ml-2">
                                    {summaryTotals.validOrdersCount} active of {summaryTotals.totalOrders} total orders
                                </Badge>
                            </div>

                            {/* Click to open/close di tengah */}
                            <div className="flex flex-col items-center justify-center absolute left-1/2 transform -translate-x-1/2">
                                <div className="flex flex-col items-center justify-center group cursor-pointer">
                                    <div className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg border border-gray-200 dark:border-gray-600 hover:shadow-xl transition-all duration-300 hover:scale-105">
                                        {summaryExpanded ? (
                                            <ChevronUp className="h-5 w-5 text-cyan-600 dark:text-cyan-400 font-bold" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-cyan-600 dark:text-cyan-400 font-bold" />
                                        )}
                                    </div>
                                    <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-300 mt-2 tracking-wide bg-cyan-50 dark:bg-cyan-900/30 px-2 py-1 rounded-full">
                                        {summaryExpanded ? 'CLOSE' : 'OPEN'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                    <span>Margin : {summaryTotals.profitMargin.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                    </AccordionTrigger>
                    
                    <AccordionContent className="px-6 pb-6">
                        {/* Info tentang scope data */}
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                            <div className="flex items-center gap-2 text-sm font-bold text-blue-700 dark:text-blue-300">
                                <Info className="h-4 w-4" />
                                <span>
                                    Ringkasan hanya mencakup pesanan yang aktif (tidak termasuk status DRAFT dan DIBATALKAN).
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                            {/* Total Sales */}
                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/30">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                        Total Sales
                                    </span>
                                    <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                    Rp {formatCurrency(summaryTotals.totalSales)}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                    <span className="text-xs text-green-600 font-medium">
                                        Active orders revenue
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {summaryTotals.validOrdersCount} active orders
                                </p>
                            </div>

                            {/* Total Purchase Requests */}
                            <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-xl p-4 border border-orange-200/50 dark:border-orange-700/30">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                                        Total PR
                                    </span>
                                    <ShoppingCart className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <p className={`text-2xl font-bold ${getAmountColor(summaryTotals.totalPR, summaryTotals.totalSales)}`}>
                                    Rp {formatCurrency(summaryTotals.totalPR)}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    {getPRStatusIcon(summaryTotals.totalPR, summaryTotals.totalSales)}
                                    <span className={`text-xs font-medium ${getPRStatusText(summaryTotals.totalPR, summaryTotals.totalSales)}`}>
                                        {getPRPercentageText(summaryTotals.totalPR, summaryTotals.totalSales)}
                                    </span>
                                </div>
                            </div>

                            {/* Total Uang Muka */}
                            <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 rounded-xl p-4 border border-purple-200/50 dark:border-purple-700/30">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                        Total ACC Finance
                                    </span>
                                    <CreditCard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                    Rp {formatCurrency(summaryTotals.totalUangMuka)}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <FileText className="h-4 w-4 text-purple-600" />
                                    <span className="text-xs text-purple-600 font-medium">
                                        Advance payments
                                    </span>
                                </div>
                            </div>

                            {/* Total LPP & Profit */}
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl p-4 border border-green-200/50 dark:border-green-700/30">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                                        Realisasi Biaya (LPP)
                                    </span>
                                    <PieChart className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                                <p className={`text-2xl font-bold ${getAmountColor(summaryTotals.totalLPP, summaryTotals.totalSales)}`}>
                                    Rp {formatCurrency(summaryTotals.totalLPP)}
                                </p>
                                <div className="mt-2 space-y-1">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-green-600 font-medium">Margin :</span>
                                        <span className="font-bold text-green-700">
                                            Rp {formatCurrency(summaryTotals.profit)} ({summaryTotals.profitMargin.toFixed(1)}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                                        <div
                                            className="bg-green-600 h-1.5 rounded-full transition-all duration-500"
                                            style={{
                                                width: `${getProgressBarWidth(summaryTotals.totalLPP, summaryTotals.totalSales)}%`
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Summary Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {summaryTotals.totalOrders}
                                </p>
                                <p className="text-sm text-muted-foreground">Total Orders</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {summaryTotals.validOrdersCount}
                                </p>
                                <p className="text-sm text-muted-foreground">Active Orders</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {summaryTotals.totalSales.isZero() ? '0' :
                                        summaryTotals.totalPR.div(summaryTotals.totalSales).times(100).toFixed(1)}%
                                </p>
                                <p className="text-sm text-muted-foreground">PR vs Sales Ratio</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {summaryTotals.profitMargin.toFixed(1)}%
                                </p>
                                <p className="text-sm text-muted-foreground">Profit Margin</p>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </CardContent>
    );
};