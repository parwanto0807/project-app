"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
    BarChart3,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const ENDPOINTS = {
    customerList: `${API_BASE}/api/master/customer/getAllCustomers`,
    invoiceStats: `${API_BASE}/api/invoice/getInvoiceStats`,
    monthlyInvoice: (customerId?: string) =>
        `${API_BASE}/api/invoice/getMonthlyInvoice?months=12${customerId ? `&customerId=${customerId}` : ''}`,
};

interface InvoiceChartProps {
    data: MonthlyInvoiceData[];
    loading: boolean;
    onCustomerInvoiceChange?: (customerId: string) => void;
}

interface MonthlyInvoiceData {
    year: number;
    month: number;
    total: string;
    paid_total: string;
    orderCount?: number;
    customerId?: string;
    customerName?: string;
}

interface Customer {
    id: string;
    name: string;
    code: string;
    branch: string;
}

function formatIDR(value: string | number) {
    const n = typeof value === "string" ? Number(value) : value;
    if (Number.isNaN(n)) return value;
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

export function InvoiceChart({ data, loading, onCustomerInvoiceChange }: InvoiceChartProps) {
    const [isClient, setIsClient] = useState(false);
    const [chartType, setChartType] = useState<"bar" | "line">("bar");
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [hoveredBar, setHoveredBar] = useState<"total" | "paid_total" | null>(null);
    const [theme, setTheme] = useState<"blue" | "green" | "purple">("green");
    const [selectedCustomer, setSelectedCustomer] = useState<string>("all");
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [customersLoading, setCustomersLoading] = useState(true);
    const chartRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsClient(true);
        fetchCustomers();
    }, []);

    // Fetch customer list from API
    const fetchCustomers = async () => {
        try {
            setCustomersLoading(true);
            const response = await fetch(ENDPOINTS.customerList, { credentials: "include" });
            if (response.ok) {
                const data = await response.json();
                setCustomers(Array.isArray(data) ? data : data.customers || data.data || []);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setCustomersLoading(false);
        }
    };

    // Handle customer selection change
    const handleCustomerInvoiceChange = (customerId: string) => {
        setSelectedCustomer(customerId);
        if (onCustomerInvoiceChange) {
            onCustomerInvoiceChange(customerId === "all" ? "" : customerId);
        }
    };

    // Selalu ambil 6 bulan terakhir
    const displayedData = data.slice(-6);

    if (loading || customersLoading) {
        return (
            <div className="h-80 w-full flex items-center justify-center">
                <div className="text-center">
                    <Skeleton className="h-64 w-full mb-2" />
                    <Skeleton className="h-4 w-32 mx-auto" />
                </div>
            </div>
        );
    }

    if (!displayedData || displayedData.length === 0) {
        return (
            <div className="h-80 w-full flex flex-col items-center justify-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm">Tidak ada data invoice untuk ditampilkan</p>
            </div>
        );
    }

    // Tema warna untuk dua data
    const themeColors = {
        blue: {
            total: {
                bar: "linear-gradient(to top, #1e40af, #3b82f6, #60a5fa)",
                barHover: "linear-gradient(to top, #3b82f6, #60a5fa, #93c5fd)",
                text: "text-blue-600 dark:text-blue-400",
                dot: "bg-blue-500",
            },
            paid_total: {
                bar: "linear-gradient(to top, #0369a1, #0ea5e9, #7dd3fc)",
                barHover: "linear-gradient(to top, #0ea5e9, #38bdf8, #7dd3fc)",
                text: "text-sky-600 dark:text-sky-400",
                dot: "bg-sky-500",
            }
        },
        green: {
            total: {
                bar: "linear-gradient(to top, #166534, #22c55e, #86efac)",
                barHover: "linear-gradient(to top, #22c55e, #4ade80, #86efac)",
                text: "text-green-600 dark:text-green-400",
                dot: "bg-green-500",
            },
            paid_total: {
                bar: "linear-gradient(to top, #0f766e, #14b8a6, #5eead4)",
                barHover: "linear-gradient(to top, #14b8a6, #2dd4bf, #5eead4)",
                text: "text-teal-600 dark:text-teal-400",
                dot: "bg-teal-500",
            }
        },
        purple: {
            total: {
                bar: "linear-gradient(to top, #6d28d9, #9333ea, #c084fc)",
                barHover: "linear-gradient(to top, #9333ea, #c084fc, #e879f9)",
                text: "text-purple-600 dark:text-purple-400",
                dot: "bg-purple-500",
            },
            paid_total: {
                bar: "linear-gradient(to top, #a855f7, #c084fc, #d8b4fe)",
                barHover: "linear-gradient(to top, #c084fc, #d8b4fe, #e9d5ff)",
                text: "text-fuchsia-600 dark:text-fuchsia-400",
                dot: "bg-fuchsia-500",
            }
        },
    };

    // Prepare data untuk chart
    const labels = displayedData.map(item => {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
        return `${monthNames[item.month - 1]} ${item.year}`;
    });

    const totalData = displayedData.map(item => parseFloat(item.total) || 0);
    const paidTotalData = displayedData.map(item => parseFloat(item.paid_total) || 0);

    // Gabungkan semua data untuk normalisasi
    const allValues = [...totalData, ...paidTotalData];
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);

    // Normalisasi data
    const normalizedTotalData = totalData.map(value =>
        ((value - minValue) / (maxValue - minValue || 1)) * 100
    );
    const normalizedPaidTotalData = paidTotalData.map(value =>
        ((value - minValue) / (maxValue - minValue || 1)) * 100
    );

    const getTooltipPosition = (index: number) => {
        if (!chartRef.current) return {};
        const chartWidth = chartRef.current.offsetWidth;
        const itemWidth = chartWidth / displayedData.length;
        const leftPosition = index * itemWidth + itemWidth / 2;
        return { left: `${leftPosition}px`, transform: "translateX(-50%)" };
    };

    return (
        <div className="w-full bg-white dark:bg-slate-900 rounded-lg shadow-md p-0 md:p-6 relative">
            {/* Atas: controls + summary */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                {/* Kiri: Select + Button */}
                <div className="flex flex-wrap gap-2 items-center">
                    {/* Customer Select */}
                    <Select value={selectedCustomer} onValueChange={handleCustomerInvoiceChange}>
                        <SelectTrigger className="h-8 w-80 text-xs">
                            <SelectValue placeholder="Pilih Customer" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Customer</SelectItem>
                            {customers.map(customer => (
                                <SelectItem key={customer.id} value={customer.id}>
                                    <span className="hidden md:inline">
                                        {customer.name} - {customer.branch}
                                    </span>
                                    <span className="md:hidden">
                                        {customer.branch}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={theme} onValueChange={(v: "blue" | "green" | "purple") => setTheme(v)}>
                        <SelectTrigger className="h-8 w-28 text-xs">
                            <SelectValue placeholder="Theme" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="blue">Blue</SelectItem>
                            <SelectItem value="green">Green</SelectItem>
                            <SelectItem value="purple">Purple</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant={chartType === "bar" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setChartType("bar")}
                        className="h-8 text-xs"
                    >
                        Bar
                    </Button>
                    <Button
                        variant={chartType === "line" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setChartType("line")}
                        className="h-8 text-xs"
                    >
                        Line
                    </Button>
                </div>

                {/* Kanan: Summary stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs w-full md:w-auto">
                    <div className="text-center p-2 bg-slate-100 dark:bg-slate-800 rounded-md">
                        <div className="text-muted-foreground">Avg Total</div>
                        <div className="font-semibold">
                            {formatIDR(totalData.reduce((sum, val) => sum + val, 0) / totalData.length)}
                        </div>
                    </div>
                    <div className="text-center p-2 bg-slate-100 dark:bg-slate-800 rounded-md">
                        <div className="text-muted-foreground">Avg Paid</div>
                        <div className="font-semibold">
                            {formatIDR(paidTotalData.reduce((sum, val) => sum + val, 0) / paidTotalData.length)}
                        </div>
                    </div>
                    <div className="text-center p-2 bg-slate-100 dark:bg-slate-800 rounded-md">
                        <div className="text-muted-foreground">Total</div>
                        <div className="font-semibold">
                            {formatIDR(totalData.reduce((sum, val) => sum + val, 0))}
                        </div>
                    </div>
                    <div className="text-center p-2 bg-slate-100 dark:bg-slate-800 rounded-md">
                        <div className="text-muted-foreground">Total Paid</div>
                        <div className="font-semibold">
                            {formatIDR(paidTotalData.reduce((sum, val) => sum + val, 0))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-sm"
                        style={{ background: themeColors[theme].total.bar }}
                    ></div>
                    <span className="text-xs font-medium">Total Invoice</span>
                </div>
                <div className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-sm"
                        style={{ background: themeColors[theme].paid_total.bar }}
                    ></div>
                    <span className="text-xs font-medium">Total Paid</span>
                </div>
            </div>

            <div className="h-64 relative" ref={chartRef} onMouseLeave={() => {
                setHoveredIndex(null);
                setHoveredBar(null);
            }}>
                {/* Tooltip */}
                {hoveredIndex !== null && hoveredBar && (
                    <div
                        className="absolute text-xs py-2 px-3 rounded-lg shadow-xl z-20 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white backdrop-blur-md transform transition-all duration-300 ease-out animate-in fade-in-0 zoom-in-95"
                        style={{
                            bottom: `calc(${hoveredBar === 'total' ? normalizedTotalData[hoveredIndex] : normalizedPaidTotalData[hoveredIndex]}% + 50px)`,
                            ...getTooltipPosition(hoveredIndex),
                        }}
                    >
                        <div className="font-bold text-sm drop-shadow-sm">
                            {formatIDR(hoveredBar === 'total' ? totalData[hoveredIndex] : paidTotalData[hoveredIndex])}
                        </div>
                        <div className="text-slate-100 opacity-90">
                            {hoveredBar === 'total' ? 'Total Invoice' : 'Total Paid'} - {labels[hoveredIndex]}
                        </div>
                    </div>
                )}

                {/* Chart content */}
                <div className="absolute inset-0 flex items-end justify-between px-1 sm:px-2 pb-8">
                    {/* Bar / Line Loop */}
                    {displayedData.map((item, index) => {
                        const totalHeight = normalizedTotalData[index];
                        const paidHeight = normalizedPaidTotalData[index];
                        const isHovered = hoveredIndex === index;

                        return (
                            <div
                                key={index}
                                className="flex flex-col items-center h-full relative group"
                                style={{ width: `${100 / displayedData.length}%` }}
                            >
                                <div className="h-full flex items-end justify-center w-full gap-1">
                                    {/* Total Bar */}
                                    <div
                                        className="w-2/5 flex items-end justify-center relative transition-all duration-300 rounded-t-md"
                                        style={{
                                            height: `${totalHeight}%`,
                                            background: isHovered && hoveredBar === 'total'
                                                ? themeColors[theme].total.barHover
                                                : themeColors[theme].total.bar,
                                        }}
                                        onMouseEnter={() => {
                                            setHoveredIndex(index);
                                            setHoveredBar('total');
                                        }}
                                    >
                                        {chartType === "line" && (
                                            <div
                                                className={`w-3 h-3 rounded-full transition-all duration-300 ${themeColors[theme].total.dot} ${isHovered && hoveredBar === 'total' ? "scale-150 ring-4" : ""
                                                    }`}
                                            ></div>
                                        )}
                                    </div>

                                    {/* Paid Total Bar */}
                                    <div
                                        className="w-2/5 flex items-end justify-center relative transition-all duration-300 rounded-t-md"
                                        style={{
                                            height: `${paidHeight}%`,
                                            background: isHovered && hoveredBar === 'paid_total'
                                                ? themeColors[theme].paid_total.barHover
                                                : themeColors[theme].paid_total.bar,
                                        }}
                                        onMouseEnter={() => {
                                            setHoveredIndex(index);
                                            setHoveredBar('paid_total');
                                        }}
                                    >
                                        {chartType === "line" && (
                                            <div
                                                className={`w-3 h-3 rounded-full transition-all duration-300 ${themeColors[theme].paid_total.dot} ${isHovered && hoveredBar === 'paid_total' ? "scale-150 ring-4" : ""
                                                    }`}
                                            ></div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Line Chart untuk dua data */}
                    {chartType === "line" && isClient && (
                        <svg
                            className="absolute inset-0 w-full h-full"
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                            style={{ pointerEvents: "none" }}
                        >
                            {/* Line untuk Total */}
                            <polyline
                                fill="none"
                                stroke={themeColors[theme].total.bar.split(', ')[1]} // Ambil warna tengah dari gradient
                                strokeWidth="1"
                                strokeLinecap="round"
                                points={displayedData
                                    .map((_, index) => {
                                        const x = (index / (displayedData.length - 1)) * 100;
                                        const y = 100 - normalizedTotalData[index];
                                        return `${x},${y}`;
                                    })
                                    .join(" ")}
                            />
                            {/* Line untuk Paid Total */}
                            <polyline
                                fill="none"
                                stroke={themeColors[theme].paid_total.bar.split(', ')[1]} // Ambil warna tengah dari gradient
                                strokeWidth="1"
                                strokeLinecap="round"
                                points={displayedData
                                    .map((_, index) => {
                                        const x = (index / (displayedData.length - 1)) * 100;
                                        const y = 100 - normalizedPaidTotalData[index];
                                        return `${x},${y}`;
                                    })
                                    .join(" ")}
                            />
                        </svg>
                    )}
                </div>

                {/* X-axis labels */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 sm:px-2 text-[10px] sm:text-xs font-medium">
                    {labels.map((label, index) => (
                        <div
                            key={index}
                            className="w-full text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 drop-shadow-sm"
                        >
                        </div>
                    ))}
                    <div className="absolute bottom-5 left-6 sm:left-10 right-0 border-t border-dashed border-slate-400 dark:border-slate-600"></div>
                </div>

                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-2 text-[10px] sm:text-xs font-bold">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500 drop-shadow-sm">
                        {formatIDR(maxValue)}
                    </span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-500 drop-shadow-sm">
                        {formatIDR(minValue)}
                    </span>
                    <div className="absolute top-0 bottom-5 left-6 sm:left-10 border-l border-dashed border-slate-400 dark:border-slate-600"></div>
                </div>
            </div>

            {/* Nilai setiap bar/grafik di bawah chart - HIDDEN ON MOBILE */}
            <div className="hidden md:flex justify-between px-1 sm:px-2 mt-2">
                {displayedData.map((item, index) => {
                    const totalValue = totalData[index];
                    const paidValue = paidTotalData[index];

                    return (
                        <div
                            key={index}
                            className="flex flex-col items-center text-center gap-1"
                            style={{ width: `${100 / displayedData.length}%` }}
                        >
                            <div className={`text-xs font-semibold ${themeColors[theme].total.text}`}>
                                {formatIDR(totalValue)}
                            </div>
                            <div className={`text-xs font-semibold ${themeColors[theme].paid_total.text}`}>
                                {formatIDR(paidValue)}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Label bulan/tahun - RESPONSIVE */}
            <div className="flex justify-between px-1 sm:px-2 mt-1 md:mt-2">
                {labels.map((label, index) => (
                    <div
                        key={index}
                        className="w-full text-center text-transparent bg-clip-text 
          bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 drop-shadow-sm
          text-[8px] sm:text-[10px] md:text-xs font-medium"
                    >
                        {label}
                    </div>
                ))}
            </div>
        </div>
    );
}