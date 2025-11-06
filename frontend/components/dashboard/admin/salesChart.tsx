
"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
    BarChart3,
    //   Search
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const ENDPOINTS = {
    customerList: `${API_BASE}/api/master/customer/getAllCustomers`,
    salesStats: `${API_BASE}/api/salesOrder/getSalesStats`,
    monthlySales: (customerId?: string) =>
        `${API_BASE}/api/salesOrder/getMonthlySales?months=12${customerId ? `&customerId=${customerId}` : ''}`,
};

interface SalesChartProps {
    data: MonthlySalesData[];
    loading: boolean;
    onCustomerChange?: (customerId: string) => void;
}

interface MonthlySalesData {
    year: number;
    month: number;
    total: string;
    orderCount?: number; // opsional jika ada
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

export function SalesChart({ data, loading, onCustomerChange }: SalesChartProps) {
    const [isClient, setIsClient] = useState(false);
    const [chartType, setChartType] = useState<"bar" | "line">("bar");
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [theme, setTheme] = useState<"blue" | "green" | "purple">("blue");
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
                // Handle different response formats
                setCustomers(Array.isArray(data) ? data : data.customers || data.data || []);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setCustomersLoading(false);
        }
    };

    // Handle customer selection change
    const handleCustomerChange = (customerId: string) => {
        setSelectedCustomer(customerId);
        if (onCustomerChange) {
            onCustomerChange(customerId === "all" ? "" : customerId);
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
                <p className="text-sm">Tidak ada data untuk ditampilkan</p>
            </div>
        );
    }

    // Tema warna
    const themeColors = {
        blue: {
            bar: "linear-gradient(to top, #1d4ed8, #3b82f6, #60a5fa)",
            barHover: "linear-gradient(to top, #3b82f6, #60a5fa, #93c5fd)",
            dot: "bg-blue-500 ring-blue-300",
            line: ["#1d4ed8", "#3b82f6", "#60a5fa"],
            text: "text-blue-600 dark:text-blue-400",
        },
        green: {
            bar: "linear-gradient(to top, #166534, #22c55e, #86efac)",
            barHover: "linear-gradient(to top, #22c55e, #4ade80, #86efac)",
            dot: "bg-green-500 ring-green-300",
            line: ["#166534", "#22c55e", "#86efac"],
            text: "text-green-600 dark:text-green-400",
        },
        purple: {
            bar: "linear-gradient(to top, #6d28d9, #9333ea, #c084fc)",
            barHover: "linear-gradient(to top, #9333ea, #c084fc, #e879f9)",
            dot: "bg-purple-500 ring-purple-300",
            line: ["#6d28d9", "#9333ea", "#c084fc"],
            text: "text-purple-600 dark:text-purple-400",
        },
    };

    const labels = displayedData.map(item => {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
        return `${monthNames[item.month - 1]} ${item.year}`;
    });

    const salesData = displayedData.map(item => parseFloat(item.total) || 0);
    const maxSales = Math.max(...salesData);
    const minSales = Math.min(...salesData);
    const normalizedData = salesData.map(value => ((value - minSales) / (maxSales - minSales || 1)) * 100);

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
                    <Select value={selectedCustomer} onValueChange={handleCustomerChange}>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs w-full md:w-auto">
                    <div className="text-center p-2 bg-slate-100 dark:bg-slate-800 rounded-md hover:dark:bg-slate-700">
                        <div className="text-muted-foreground">Rata-rata</div>
                        <div className="font-semibold">
                            {formatIDR(salesData.reduce((sum, val) => sum + val, 0) / salesData.length)}
                        </div>
                    </div>
                    <div className="text-center p-2 bg-slate-100 dark:bg-slate-800 rounded-md hover:dark:bg-slate-700">
                        <div className="text-muted-foreground">Tertinggi</div>
                        <div className="font-semibold">{formatIDR(maxSales)}</div>
                    </div>
                    <div className="text-center p-2 bg-slate-100 dark:bg-slate-800 rounded-md hover:dark:bg-slate-700 col-span-2 sm:col-span-1">
                        <div className="text-muted-foreground">Total</div>
                        <div className="font-semibold">
                            {formatIDR(salesData.reduce((sum, val) => sum + val, 0))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-64 relative" ref={chartRef} onMouseLeave={() => setHoveredIndex(null)}>
                {/* Tooltip */}
                {hoveredIndex !== null && (
                    <div
                        className="absolute text-xs py-2 px-3 rounded-lg shadow-xl z-20 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white backdrop-blur-md transform transition-all duration-300 ease-out animate-in fade-in-0 zoom-in-95"
                        style={{
                            bottom: `calc(${normalizedData[hoveredIndex]}% + 50px)`,
                            ...getTooltipPosition(hoveredIndex),
                        }}
                    >
                        <div className="font-bold text-sm drop-shadow-sm">
                            {formatIDR(salesData[hoveredIndex])}
                        </div>
                        <div className="text-slate-100 opacity-90">
                            {labels[hoveredIndex]}
                        </div>
                    </div>
                )}

                {/* Chart content */}
                <div className="absolute inset-0 flex items-end justify-between px-1 sm:px-2 pb-8">
                    {/* Bar / Line Loop */}
                    {displayedData.map((item, index) => {
                        const height = normalizedData[index];
                        const value = salesData[index];
                        const isHovered = hoveredIndex === index;

                        return (
                            <div
                                key={index}
                                className="flex flex-col items-center h-full relative group"
                                style={{ width: `${100 / displayedData.length}%` }}
                                onMouseEnter={() => setHoveredIndex(index)}
                            >
                                <div className="h-full flex items-end justify-center w-full">
                                    <div
                                        className={`
                w-2/3 sm:w-3/4 flex items-end justify-center relative
                ${chartType === "bar" ? "rounded-t-md transition-all duration-300" : ""}
                ${isHovered ? "scale-110 z-10" : ""}
              `}
                                        style={{
                                            height: `${height}%`,
                                            background:
                                                chartType === "bar"
                                                    ? isHovered
                                                        ? themeColors[theme].barHover
                                                        : themeColors[theme].bar
                                                    : "transparent",
                                        }}
                                    >
                                        {chartType === "line" && (
                                            <div
                                                className={`w-3 h-3 rounded-full transition-all duration-300 ${themeColors[theme].dot} ${isHovered ? "scale-150 ring-4" : ""
                                                    }`}
                                            ></div>
                                        )}
                                    </div>
                                </div>

                                {/* Value label */}
                                <div
                                    className={`mt-1 text-[10px] sm:text-xs text-center font-medium transition-all duration-300 ${isHovered ? "opacity-100 text-blue-600 dark:text-blue-400" : "opacity-0"
                                        }`}
                                >
                                    {formatIDR(value)}
                                </div>
                            </div>
                        );
                    })}

                    {/* Line Chart */}
                    {chartType === "line" && isClient && (
                        <svg
                            className="absolute inset-0 w-full h-full"
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                            style={{ pointerEvents: "none" }}
                        >
                            <polyline
                                fill="none"
                                stroke={`url(#lineGradient-${theme})`}
                                strokeWidth="1"
                                strokeLinecap="round"
                                points={displayedData
                                    .map((_, index) => {
                                        const x = (index / (displayedData.length - 1)) * 100;
                                        const y = 100 - normalizedData[index];
                                        return `${x},${y}`;
                                    })
                                    .join(" ")}
                            />
                            <defs>
                                <linearGradient id={`lineGradient-${theme}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                    {themeColors[theme].line.map((c, i) => (
                                        <stop
                                            key={i}
                                            offset={`${(i / (themeColors[theme].line.length - 1)) * 100}%`}
                                            stopColor={c}
                                        />
                                    ))}
                                </linearGradient>
                            </defs>
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
                        {formatIDR(maxSales)}
                    </span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-500 drop-shadow-sm">
                        {formatIDR(minSales)}
                    </span>
                    <div className="absolute top-0 bottom-5 left-6 sm:left-10 border-l border-dashed border-slate-400 dark:border-slate-600"></div>
                </div>
            </div>

            {/* Nilai setiap bar/grafik di bawah chart */}
            <div className="flex justify-between px-1 sm:px-2 mt-2">
                {displayedData.map((item, index) => {
                    const value = salesData[index];
                    return (
                        <div
                            key={index}
                            className="flex flex-col items-center text-center"
                            style={{ width: `${100 / displayedData.length}%` }}
                        >
                            <div className={`text-[10px] sm:text-xs font-semibold ${themeColors[theme].text}`}>
                                {formatIDR(value)}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Label bulan/tahun */}
            <div className="flex justify-between px-1 sm:px-2 mt-1 text-[10px] sm:text-xs font-medium">
                {labels.map((label, index) => (
                    <div
                        key={index}
                        className="w-full text-center text-transparent bg-clip-text 
          bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 drop-shadow-sm"
                    >
                        {label}
                    </div>
                ))}
            </div>
        </div >
    );
}