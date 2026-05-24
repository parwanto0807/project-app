"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AlertCircle,
    Building2,
    FilePlus2,
    Package,
    Users2,
    ArrowUpRight,
    ArrowDownRight,
    TrendingUp,
    CreditCard,
    Calendar,
    Download,
    // MoreHorizontal,
    EyeOff,
    Eye,
    BarChart3,
    FileText,
    Receipt,
    ChevronLeft,
    ChevronRight,
    ImageIcon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SalesChart } from "./salesChart";
import { InvoiceChart } from "./invoiceChart";
import { MobileShortcut } from "@/components/mobile-shortcut";
import { ActiveEmployeesCard } from "./active-employees-card";
import { makeImageSrc } from "@/utils/makeImageSrc";

// =============================
// KONFIGURASI API BACKEND
// =============================
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

const ENDPOINTS = {
    customerCount: `${API_BASE}/api/master/customer/getCustomerCount`,
    customerList: `${API_BASE}/api/master/customer/getAllCustomers`,
    productCount: `${API_BASE}/api/master/product/getProductCount`,
    salesOrderCount: `${API_BASE}/api/salesOrder/getSalesOrderCount`,
    recentSalesOrders: `${API_BASE}/api/salesOrder/getRecentSalesOrders?take=5&order=desc`,
    salesStats: `${API_BASE}/api/salesOrder/getSalesStats`,
    monthlySales: (customerId?: string) =>
        `${API_BASE}/api/salesOrder/getMonthlySales?months=12${customerId ? `&customerId=${customerId}` : ''}`,
    invoiceStats: `${API_BASE}/api/invoice/getInvoiceStats`,
    monthlyInvoice: (customerId?: string) =>
        `${API_BASE}/api/invoice/getMonthlyInvoice?months=12${customerId ? `&customerId=${customerId}` : ''}`,
    recentSPK: `${API_BASE}/api/spk/getRecentSPK?take=5`,
};

// =============================
// TIPE DATA
// =============================
interface CountResponse { count: number }
interface CustomerMini { id: string; name: string }
interface ProjectMini { id: string; name: string }

type OrderStatus =
    | "DRAFT" | "CONFIRMED" | "IN_PROGRESS_SPK" | "FULFILLED" | "BAST"
    | "PARTIALLY_INVOICED" | "INVOICED" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";

interface SalesOrderMini {
    id: string;
    soNumber: string;
    soDate: string;
    status: OrderStatus;
    grandTotal: string | number;
    customer?: CustomerMini | null;
    project?: ProjectMini | null;
}

interface SPKMini {
    id: string;
    spkNumber: string;
    spkDate: string;
    progress: number;
    progressComment: string | null;
    updatedAt: string;
    lastCommentAt: string | null;
    spkStatusClose: boolean;
    salesOrder: {
        soNumber: string;
        customer: {
            name: string;
            branch: string | null;
        } | null;
        project?: {
            id: string;
            name: string;
        } | null;
    } | null;
    team: {
        namaTeam: string;
    } | null;
    spkFieldReport?: Array<{
        id: string;
        reportedAt: string;
        photos: Array<{
            id: string;
            imageUrl: string;
        }>;
    }>;
}

interface SalesStats {
    totalThisMonth: number;
    totalLastMonth: number;
    pendingOrders: number;
    conversionRate: number;
    totalThisYear: number;
}

interface InvoiceStats {
    totalThisMonth: number;
    totalLastMonth: number;
    pendingInvoices: number;
    paidInvoices: number;
    totalThisYear: number;
    collectionRate: number;
}

interface MonthlySalesData {
    year: number;
    month: number;
    total: string;
    orderCount?: number;
    customerId?: string;
    customerName?: string;
}

interface MonthlyInvoiceData {
    year: number;
    month: number;
    total: string;
    paid_total: string;
    invoiceCount?: number;
    paidAmount?: string;
    customerId?: string;
    customerName?: string;
}

const toNumber = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : parseFloat(String(v)) || 0);

async function loadSalesStats(): Promise<SalesStats> {
    const res = await fetch(ENDPOINTS.salesStats, { credentials: "include" });
    if (!res.ok) {
        return { totalThisMonth: 0, totalLastMonth: 0, pendingOrders: 0, conversionRate: 0, totalThisYear: 0 };
    }
    const json = await res.json();

    // Map field names dari backend ke frontend
    const totalThisMonth = toNumber(json.mtd ?? 0);
    const totalLastMonth = toNumber(json.lastMonth ?? 0);
    const totalThisYear = toNumber(json.ytd ?? 0);

    // Field ini tidak ada di backend, default ke 0
    const pendingOrders = toNumber(json.pendingOrders ?? 0);
    const conversionRate = toNumber(json.conversionRate ?? 0);

    return { totalThisMonth, totalLastMonth, pendingOrders, conversionRate, totalThisYear };
}

async function loadInvoiceStats(): Promise<InvoiceStats> {
    const res = await fetch(ENDPOINTS.invoiceStats, { credentials: "include" });
    if (!res.ok) {
        return {
            totalThisMonth: 0,
            totalLastMonth: 0,
            pendingInvoices: 0,
            paidInvoices: 0,
            totalThisYear: 0,
            collectionRate: 0
        };
    }
    const json = await res.json();

    const totalThisMonth = toNumber(json.totalThisMonth ?? json.mtd ?? 0);
    const totalLastMonth = toNumber(json.totalLastMonth ?? json.lastMonth ?? 0);
    const pendingInvoices = toNumber(json.pendingInvoices ?? json.pending ?? 0);
    const paidInvoices = toNumber(json.paidInvoices ?? json.paid ?? 0);
    const totalThisYear = toNumber(json.totalThisYear ?? json.yearSummary ?? 0);

    // Collection Rate: Persentase invoice yang sudah dibayar dari total semua invoice
    // Formula: (Paid Invoices / (Paid + Pending)) * 100
    // Nilai dari backend sudah dalam bentuk desimal (0-1), akan dikali 100 saat display
    const collectionRate = toNumber(json.collectionRate ?? json.rate ?? 0);

    return { totalThisMonth, totalLastMonth, pendingInvoices, paidInvoices, totalThisYear, collectionRate };
}

// =============================
// UTIL
// =============================
function formatIDR(value: string | number) {
    const n = typeof value === "string" ? Number(value) : value;
    if (Number.isNaN(n)) return value;
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status: OrderStatus }) {
    const color: Record<OrderStatus, { label: string; className: string }> = {
        DRAFT: {
            label: "Draft",
            className: "bg-red-400 text-gray-700 border-gray-200",
        },
        CONFIRMED: {
            label: "Confirmed",
            className: "bg-indigo-300 text-indigo-800 border-indigo-200",
        },
        IN_PROGRESS_SPK: {
            label: "In Progress SPK",
            className: "bg-orange-300 text-orange-800 border-orange-200",
        },
        FULFILLED: {
            label: "SPK Closing",
            className: "bg-blue-500 text-white border-purple-200",
        },
        BAST: {
            label: "BAST",
            className: "bg-purple-300 text-purple-800 border-purple-200",
        },
        PARTIALLY_INVOICED: {
            label: "Partially Invoiced",
            className: "bg-cyan-300 text-cyan-800 border-cyan-200",
        },
        INVOICED: {
            label: "Invoiced",
            className: "bg-blue-300 text-blue-800 border-blue-200",
        },
        PARTIALLY_PAID: {
            label: "Partially Paid",
            className: "bg-teal-300 text-teal-800 border-teal-200",
        },
        PAID: {
            label: "Paid",
            className: "bg-green-300 text-green-800 border-green-200",
        },
        CANCELLED: {
            label: "Cancelled",
            className: "bg-red-300 text-red-800 border-red-200",
        },
    };

    const icon: Record<OrderStatus, string> = {
        DRAFT: "📝",
        CONFIRMED: "✅",
        IN_PROGRESS_SPK: "🪒",
        FULFILLED: "🟢",
        BAST: "📃",
        PARTIALLY_INVOICED: "↔️",
        INVOICED: "🧾",
        PARTIALLY_PAID: "💰",
        PAID: "💸",
        CANCELLED: "❌",
    };

    return (
        <Badge
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${color[status].className}`}
        >
            <span className="text-xs">{icon[status]}</span>
            {color[status].label}
        </Badge>
    );
}


// =============================
// KOMPONEN HALAMAN DASHBOARD - YANG DIPERBAIKI
// =============================
export default function DashboardAwalSalesOrder() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("logistic");

    const [customerCount, setCustomerCount] = useState<number | null>(null);
    const [productCount, setProductCount] = useState<number | null>(null);
    const [salesOrderCount, setSalesOrderCount] = useState<number | null>(null);
    const [recentOrders, setRecentOrders] = useState<SalesOrderMini[]>([]);
    const [recentSpk, setRecentSpk] = useState<SPKMini[]>([]);
    const [salesStats, setSalesStats] = useState<SalesStats | null>(null);
    const [invoiceStats, setInvoiceStats] = useState<InvoiceStats | null>(null);

    // STATE YANG DIPERBAIKI: Pisahkan data untuk masing-masing chart
    const [monthlySalesAll, setMonthlySalesAll] = useState<MonthlySalesData[]>([]);
    const [monthlySalesFiltered, setMonthlySalesFiltered] = useState<MonthlySalesData[]>([]);
    const [monthlyInvoiceAll, setMonthlyInvoiceAll] = useState<MonthlyInvoiceData[]>([]);
    const [monthlyInvoiceFiltered, setMonthlyInvoiceFiltered] = useState<MonthlyInvoiceData[]>([]);

    const basePath = "/admin-area";
    const now = new Date()
    const monthName = now.toLocaleString("id-ID", { month: "long" })
    // const year = now.getFullYear()
    const [hidden, setHidden] = useState(true);
    const toggleHidden = () => setHidden(!hidden);

    const bulanIndo = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ]

    function formatBulanTahun(date: Date): string {
        const bulan = bulanIndo[date.getMonth()]
        const tahun = date.getFullYear()
        return `${bulan} ${tahun}`
    }
    // ;(() => {})("Data Sales Stats", salesStats);

    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const formattedLastMonth = formatBulanTahun(lastMonth)
    const currentYear = new Date().getFullYear();

    const maskValue = (val: number) =>
        val ? "XXX.XXX.XXX.XXX" : "XXX.XXX.XXX.XXX";

    // Load initial data
    useEffect(() => {
        let cancelled = false;

        async function loadInitialData() {
            setLoading(true);
            setError(null);
            try {
                const monthlySalesUrl = ENDPOINTS.monthlySales();
                const monthlyInvoiceUrl = ENDPOINTS.monthlyInvoice();

                const fetchJson = async (url: string) => {
                    const res = await fetch(url, { credentials: "include" });
                    if (!res.ok) throw new Error(`Gagal fetch ${url}`);
                    return res.json();
                };

                const [
                    cstJson, prdJson, soJson, listJsonRaw, monthlyJson, monthlyInvJson, spkRecentJson, statsJson, invoiceStatsJson
                ] = await Promise.all([
                    fetchJson(ENDPOINTS.customerCount),
                    fetchJson(ENDPOINTS.productCount),
                    fetchJson(ENDPOINTS.salesOrderCount),
                    fetchJson(ENDPOINTS.recentSalesOrders),
                    fetchJson(monthlySalesUrl),
                    fetchJson(monthlyInvoiceUrl),
                    fetchJson(ENDPOINTS.recentSPK),
                    loadSalesStats(),
                    loadInvoiceStats()
                ]);

                if (cancelled) return;

                setCustomerCount(cstJson.count);
                setProductCount(prdJson.count);
                setSalesOrderCount(soJson.count);
                setRecentOrders(Array.isArray(listJsonRaw) ? listJsonRaw : listJsonRaw.data);
                setRecentSpk(spkRecentJson.data);
                setSalesStats(statsJson);
                setInvoiceStats(invoiceStatsJson);

                // Handle monthly sales data
                let monthlyData: MonthlySalesData[] = [];
                if (Array.isArray(monthlyJson)) {
                    monthlyData = monthlyJson;
                } else if (monthlyJson && typeof monthlyJson === 'object' && 'data' in monthlyJson) {
                    monthlyData = (monthlyJson as { data: MonthlySalesData[] }).data;
                }
                // ;(() => {})("monthlyData",monthlyData)

                setMonthlySalesAll(monthlyData);
                setMonthlySalesFiltered(monthlyData);

                // Handle monthly invoice data
                let monthlyInvoiceData: MonthlyInvoiceData[] = [];
                if (Array.isArray(monthlyInvJson)) {
                    monthlyInvoiceData = monthlyInvJson;
                } else if (monthlyInvJson && typeof monthlyInvJson === 'object' && 'data' in monthlyInvJson) {
                    monthlyInvoiceData = (monthlyInvJson as { data: MonthlyInvoiceData[] }).data;
                }
                setMonthlyInvoiceAll(monthlyInvoiceData);
                setMonthlyInvoiceFiltered(monthlyInvoiceData);

            } catch (e: unknown) {
                if (cancelled) return;
                console.error(e);
                setError(e instanceof Error ? e.message : "Terjadi kesalahan tak terduga");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadInitialData();
        return () => { cancelled = true; };
    }, []);

    // Fetch filtered sales data when customer changes - DIPERBAIKI
    const fetchMonthlySales = async (customerId?: string) => {
        try {
            setLoading(true);
            const monthlySalesUrl = ENDPOINTS.monthlySales(customerId);
            const response = await fetch(monthlySalesUrl, { credentials: "include" });

            if (!response.ok) {
                throw new Error("Gagal memuat data penjualan bulanan");
            }

            const data = await response.json();
            const monthlyData = Array.isArray(data) ? data : data.data || data.monthlySales || [];

            setMonthlySalesFiltered(monthlyData);
        } catch (error) {
            console.error("Error fetching monthly sales:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch filtered invoice data when customer changes - DIPERBAIKI
    const fetchMonthlyInvoice = async (customerId?: string) => {
        try {
            setLoading(true);
            const monthlyInvoiceUrl = ENDPOINTS.monthlyInvoice(customerId);
            const response = await fetch(monthlyInvoiceUrl, { credentials: "include" });

            if (!response.ok) {
                throw new Error("Gagal memuat data invoice bulanan");
            }

            const data = await response.json();
            const monthlyData = Array.isArray(data) ? data : data.data || data.monthlyInvoice || [];

            setMonthlyInvoiceFiltered(monthlyData);
        } catch (error) {
            console.error("Error fetching monthly invoice:", error);
        } finally {
            setLoading(false);
        }
    };

    // Handle customer change from SalesChart - DIPERBAIKI: tanpa state yang tidak perlu
    const handleCustomerChange = (customerId: string) => {
        if (customerId === "") {
            setMonthlySalesFiltered(monthlySalesAll);
        } else {
            fetchMonthlySales(customerId);
        }
    };

    // Handle customer change from InvoiceChart - DIPERBAIKI: tanpa state yang tidak perlu
    const handleCustomerInvoiceChange = (customerId: string) => {
        if (customerId === "") {
            setMonthlyInvoiceFiltered(monthlyInvoiceAll);
        } else {
            fetchMonthlyInvoice(customerId);
        }
    };
    const calculateTrend = (): number => {
        if (!salesStats) return 0;

        const thisMonth = Number(salesStats.totalThisMonth ?? 0);
        const lastMonth = Number(salesStats.totalLastMonth ?? 0);

        // Validasi input
        if (!isFinite(thisMonth) || !isFinite(lastMonth)) return 0;

        // Handle berbagai scenario
        if (lastMonth === 0) {
            if (thisMonth > 0) return 100;     // Dari 0 ke positif = +100%
            if (thisMonth < 0) return -100;    // Dari 0 ke negatif = -100%
            return 0;                          // Tetap 0 = 0%
        }

        if (thisMonth === 0) {
            return -100; // Dari positif/negatif ke 0 = -100%
        }

        // Normal calculation
        return ((thisMonth - lastMonth) / lastMonth) * 100;
    };

    const calculateTrendInvoice = (): number => {
        if (!invoiceStats) return 0;

        const thisMonth = Number(invoiceStats.totalThisMonth ?? 0);
        const lastMonth = Number(invoiceStats.totalLastMonth ?? 0);

        // Validasi input
        if (!isFinite(thisMonth) || !isFinite(lastMonth)) return 0;

        // Handle berbagai scenario ketika lastMonth = 0
        if (lastMonth === 0) {
            if (thisMonth > 0) return 100;     // Dari 0 ke positif = +100%
            if (thisMonth < 0) return -100;    // Dari 0 ke negatif = -100%
            return 0;                          // Tetap 0 = 0%
        }

        if (thisMonth === 0) {
            return -100; // Dari positif/negatif ke 0 = -100%
        }

        // Normal calculation
        return ((thisMonth - lastMonth) / lastMonth) * 100;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-8 lg:p-10 font-sans selection:bg-blue-100 selection:text-blue-900 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-emerald-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            {/* Header with Glassmorphism */}
            <div className="relative mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent">
                            Dashboard Overview
                        </h1>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 ml-4 text-sm md:text-base font-medium flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Welcome back. Here's what's happening today.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button asChild className="gap-2 bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 text-white rounded-2xl h-12 px-6 shadow-lg shadow-slate-900/20 text-sm font-bold transition-all hover:scale-105 hover:shadow-xl">
                        <Link href="/admin-area/sales/salesOrder/create">
                            <FilePlus2 className="h-4 w-4" />
                            Buat Sales Order
                        </Link>
                    </Button>
                    <Button variant="outline" className="gap-2 rounded-2xl h-12 px-6 text-sm font-bold border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-105 backdrop-blur-sm bg-white/50 dark:bg-slate-900/50">
                        <Download className="h-4 w-4" />
                        Export Laporan
                    </Button>
                </div>
            </div>
            {/* Stats Grid - Enhanced with better spacing and animations */}
            <div className="relative grid grid-cols-2 gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <StatCard
                    title="Total Pelanggan"
                    value={customerCount}
                    loading={loading}
                    icon={<Users2 className="h-5 w-5 md:h-6 md:w-6" />}
                    trend={salesStats ? Math.round((customerCount || 0) / 10) : 0}
                    href="/admin-area/master/customers"
                    colorScheme="blue"
                    alwaysShow={true}
                />
                <StatCard
                    title="Produk"
                    value={productCount}
                    loading={loading}
                    icon={<Package className="h-5 w-5 md:h-6 md:w-6" />}
                    trend={salesStats ? Math.round((productCount || 0) / 5) : 0}
                    href="/admin-area/master/products"
                    colorScheme="purple"
                    alwaysShow={true}
                />
                <StatCard
                    title={`Sales ${monthName}`}
                    value={salesStats ? salesStats.totalThisMonth : null}
                    loading={loading}
                    formatted
                    icon={<CreditCard className="h-5 w-5 md:h-6 md:w-6" />}
                    trend={calculateTrend()}
                    href="#"
                    colorScheme="amber"
                />
                <StatCard
                    title={`Invoice ${monthName}`}
                    value={invoiceStats ? invoiceStats.totalThisMonth : null}
                    loading={loading}
                    formatted
                    icon={<Building2 className="h-5 w-5 md:h-6 md:w-6" />}
                    trend={calculateTrendInvoice()}
                    href="/admin-area/finance/invoice"
                    colorScheme="emerald"
                />
            </div>

            <MobileShortcut basePath={basePath} />

            {/* Main Content with Tabs - Enhanced Design */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 relative">
                <div className="flex justify-start mb-4">
                    <TabsList className="inline-flex w-full lg:w-auto bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-2 rounded-3xl h-auto border-2 border-slate-200/50 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50">
                        <TabsTrigger
                            value="sales-order"
                            className="flex-1 lg:w-[200px] flex items-center justify-center gap-2 rounded-2xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 dark:data-[state=active]:from-blue-600 dark:data-[state=active]:to-blue-700 data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/30 data-[state=active]:text-white text-slate-600 dark:text-slate-400 px-5 py-3.5 transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 font-bold"
                        >
                            <FileText className="h-5 w-5 shrink-0" />
                            <span className="text-sm truncate">Sales Order</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="logistic"
                            className="flex-1 lg:w-[200px] flex items-center justify-center gap-2 rounded-2xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 dark:data-[state=active]:from-orange-600 dark:data-[state=active]:to-orange-700 data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/30 data-[state=active]:text-white text-slate-600 dark:text-slate-400 px-5 py-3.5 transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 font-bold"
                        >
                            <Package className="h-5 w-5 shrink-0" />
                            <span className="text-sm truncate">Logistic</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="invoicing"
                            className="flex-1 lg:w-[200px] flex items-center justify-center gap-2 rounded-2xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 dark:data-[state=active]:from-purple-600 dark:data-[state=active]:to-purple-700 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/30 data-[state=active]:text-white text-slate-600 dark:text-slate-400 px-5 py-3.5 transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 font-bold"
                        >
                            <Receipt className="h-5 w-5 shrink-0" />
                            <span className="text-sm truncate">Invoicing</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Sales Order Tab - Enhanced Cards */}
                <TabsContent value="sales-order" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        {/* Recent Sales Orders - Enhanced Card */}
                        <Card className="lg:col-span-2 border-0 shadow-2xl shadow-blue-500/5 dark:shadow-blue-500/10 rounded-[32px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden">
                            <CardHeader className="pb-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 border-b border-slate-100 dark:border-slate-800">
                                <CardTitle className="text-lg md:text-xl flex items-center gap-3 font-bold text-slate-800 dark:text-white">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/30">
                                        <BarChart3 className="h-5 w-5 text-white" />
                                    </div>
                                    Grafik Sales Order 6 Bulan Terakhir
                                </CardTitle>
                                <CardDescription className="text-xs md:text-sm ml-14">
                                    Trend nilai sales order dalam 6 bulan terakhir
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <SalesChart
                                    data={monthlySalesFiltered}
                                    loading={loading}
                                    onCustomerChange={handleCustomerChange}
                                />
                            </CardContent>

                            <Separator className="bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

                            <CardHeader className="pb-4 bg-gradient-to-r from-slate-50/50 to-blue-50/50 dark:from-slate-800/50 dark:to-blue-900/10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base md:text-xl flex items-center gap-3 font-bold text-slate-800 dark:text-white">
                                            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/30">
                                                <Calendar className="h-5 w-5 text-white" />
                                            </div>
                                            Sales Order Terbaru
                                        </CardTitle>
                                        <CardDescription className="text-xs md:text-sm ml-14 mt-1">
                                            5 sales order terbaru yang dibuat, dari <span className="font-bold text-blue-600 dark:text-blue-400">{salesOrderCount}</span> Sales Order yang di buat.
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" asChild className="h-9 text-xs md:text-sm font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl">
                                            <Link href="/admin-area/sales/salesOrder">
                                                Lihat semua →
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pb-0">
                                {loading ? (
                                    <RecentTableSkeleton />
                                ) : error ? (
                                    <div className="flex items-center gap-2 p-6 text-sm text-red-600 dark:text-red-400">
                                        <AlertCircle className="h-4 w-4" /> {error}
                                    </div>
                                ) : recentOrders.length === 0 ? (
                                    <div className="p-6 text-sm text-muted-foreground text-center">
                                        Belum ada data sales order.
                                    </div>
                                ) : (
                                    <div className="rounded-b-lg overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-slate-100 dark:bg-slate-800">
                                                <TableRow>
                                                    <TableHead className="w-[140px] text-xs md:text-sm">Nomor SO</TableHead>
                                                    <TableHead className="w-[100px] text-xs md:text-sm">Tanggal</TableHead>
                                                    <TableHead className="text-xs md:text-sm">Customer</TableHead>
                                                    <TableHead className="text-right text-xs md:text-sm">Total</TableHead>
                                                    <TableHead className="w-[120px] text-xs md:text-sm">Status</TableHead>
                                                    <TableHead className="w-[60px] text-xs md:text-sm"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {recentOrders.map((o) => (
                                                    <TableRow key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                        <TableCell className="font-medium text-xs md:text-sm">
                                                            {o.soNumber}
                                                        </TableCell>
                                                        <TableCell className="text-xs md:text-sm">{formatDate(o.soDate)}</TableCell>
                                                        <TableCell className="text-xs md:text-sm">{o.customer?.name ?? "-"}</TableCell>
                                                        <TableCell className="text-right font-medium text-xs md:text-sm">{formatIDR(o.grandTotal)}</TableCell>
                                                        <TableCell>
                                                            <StatusBadge status={o.status} />
                                                        </TableCell>
                                                        {/* <TableCell>
                                                            <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                                                                <Link href="#">
                                                                    <MoreHorizontal className="h-3 w-3 md:h-4 md:w-4" />
                                                                </Link>
                                                            </Button>
                                                        </TableCell> */}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Sidebar - Quick Actions & Stats - Enhanced */}
                        <div className="space-y-6">
                            {/* Active Employees Today */}
                            <ActiveEmployeesCard />

                            {/* Quick Actions - Enhanced */}
                            <Card className="border-0 shadow-2xl shadow-slate-500/5 dark:shadow-slate-500/10 rounded-[32px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden">
                                <CardHeader className="pb-4 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10">
                                    <CardTitle className="text-base md:text-lg flex items-center gap-3 font-bold text-slate-800 dark:text-white">
                                        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl shadow-lg shadow-blue-500/30">
                                            <FilePlus2 className="h-5 w-5 text-white" />
                                        </div>
                                        Aksi Cepat
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 p-6">
                                    <Button className="w-full justify-start gap-3 h-14 text-sm font-bold rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 text-white shadow-lg shadow-slate-900/20 transition-all hover:scale-105" asChild>
                                        <Link href="/admin-area/sales/salesOrder/create">
                                            <div className="p-1.5 bg-white/20 rounded-lg">
                                                <FilePlus2 className="h-4 w-4" />
                                            </div>
                                            Buat Sales Order Baru
                                        </Link>
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start gap-3 h-14 text-sm font-bold rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:scale-105" asChild>
                                        <Link href="/admin-area/master/customers/create">
                                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                <Users2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            Tambah Pelanggan Baru
                                        </Link>
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start gap-3 h-14 text-sm font-bold rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:scale-105" asChild>
                                        <Link href="/admin-area/master/products/create">
                                            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                                <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            Tambah Produk Baru
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Sales Stats - Enhanced */}
                            <Card className="border-0 shadow-2xl shadow-green-500/5 dark:shadow-green-500/10 rounded-[32px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden">
                                <CardHeader className="bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-900/10">
                                    <CardTitle className="text-base md:text-lg flex items-center gap-3 font-bold text-slate-800 dark:text-white">
                                        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-lg shadow-green-500/30">
                                            <TrendingUp className="h-5 w-5 text-white" />
                                        </div>
                                        Performa Penjualan
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {loading ? (
                                        <div className="space-y-3">
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-full" />
                                        </div>
                                    ) : salesStats ? (
                                        <>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs md:text-sm text-muted-foreground">Pending Orders</span>
                                                <span className="font-semibold text-xs md:text-sm">{salesStats.pendingOrders}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs md:text-sm text-muted-foreground">Conversion Rate</span>
                                                <span className="font-semibold text-xs md:text-sm">{salesStats.conversionRate}%</span>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs md:text-sm text-muted-foreground">
                                                        Sales Order {formattedLastMonth}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-xs md:text-sm">
                                                            {hidden ? maskValue(salesStats.totalLastMonth) : formatIDR(salesStats.totalLastMonth)}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={toggleHidden}
                                                            className="text-muted-foreground hover:text-foreground"
                                                        >
                                                            {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4  text-green-500" />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs md:text-sm text-muted-foreground">
                                                        Sales Order Tahun {currentYear}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-xs md:text-sm">
                                                            {hidden ? maskValue(salesStats.totalThisYear) : formatIDR(salesStats.totalThisYear)}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={toggleHidden}
                                                            className="text-muted-foreground hover:text-foreground"
                                                        >
                                                            {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-green-500" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-xs md:text-sm text-muted-foreground">Data tidak tersedia</div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* System Status - Enhanced */}
                            <Card className="border-0 shadow-2xl shadow-slate-500/5 dark:shadow-slate-500/10 rounded-[32px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden">
                                <CardHeader className="pb-4 bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50">
                                    <CardTitle className="text-base md:text-lg flex items-center gap-3 font-bold text-slate-800 dark:text-white">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />
                                            <div className="relative h-3 w-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
                                        </div>
                                        Status Sistem
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 p-6">
                                    <div className="flex justify-between items-center p-3 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20">
                                        <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-200">API Connection</span>
                                        <Badge variant="outline" className="bg-green-500 text-white border-0 shadow-lg shadow-green-500/30 font-bold">Active</Badge>
                                    </div>
                                    <div className="flex justify-between items-center p-3 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20">
                                        <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-200">Database</span>
                                        <Badge variant="outline" className="bg-green-500 text-white border-0 shadow-lg shadow-green-500/30 font-bold">Online</Badge>
                                    </div>
                                    <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                        <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-200">Last Backup</span>
                                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">12 Jam Lalu</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* Logistic & SPK Tab */}
                <TabsContent value="logistic" className="space-y-6 mt-4">
                    <div className="grid grid-cols-1 gap-8">
                        <Card className="border-0 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] rounded-[24px] overflow-hidden">
                            <CardHeader className="pb-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-xl md:text-2xl flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                                            <Package className="h-5 w-5" />
                                            5 SPK Terakhir Diupdate
                                        </CardTitle>
                                        <CardDescription className="text-xs md:text-sm">
                                            Aktivitas monitoring dan progres logistik terbaru
                                        </CardDescription>
                                    </div>
                                    <Button variant="ghost" size="sm" asChild className="h-8 text-xs md:text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/20">
                                        <Link href="/admin-area/logistic/spk">
                                            Lihat Semua SPK
                                        </Link>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {loading ? (
                                    <RecentTableSkeleton />
                                ) : recentSpk.length === 0 ? (
                                    <div className="p-12 text-sm text-muted-foreground text-center">
                                        Belum ada aktivitas SPK terbaru.
                                    </div>
                                ) : (
                                        <SPKCarousel recentSpk={recentSpk} />
                                )}
                            </CardContent>
                        </Card>

                        {/* Sidebar Logistic */}
                        <div className="space-y-6">
                            <Card className="border-0 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] rounded-[24px]">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base md:text-lg flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                                        <TrendingUp className="h-5 w-5" />
                                        Metrik Logistik
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 border border-orange-100 dark:border-orange-900/20">
                                        <div className="text-xs text-muted-foreground mb-1">Rata-rata Progres</div>
                                        <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                                            {recentSpk.length > 0 
                                                ? Math.round(recentSpk.reduce((acc, curr) => acc + (curr.progress || 0), 0) / recentSpk.length)
                                                : 0}%
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20">
                                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold tracking-wider">Selesai</div>
                                            <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                                                {recentSpk.filter(s => s.spkStatusClose).length}
                                            </div>
                                        </div>
                                        <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20">
                                            <div className="text-[10px] text-orange-600 dark:text-orange-400 uppercase font-bold tracking-wider">Berjalan</div>
                                            <div className="text-lg font-bold text-orange-700 dark:text-orange-300">
                                                {recentSpk.filter(s => !s.spkStatusClose).length}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2" asChild>
                                        <Link href="/admin-area/logistic/spk">
                                            Buka Monitoring SPK
                                            <ArrowUpRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* Invoicing Tab */}
                <TabsContent value="invoicing" className="space-y-6 mt-4">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        {/* Invoice Chart */}
                        <Card className="lg:col-span-2 border-0 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] rounded-[24px]">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base md:text-lg flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                                    <BarChart3 className="h-5 w-5 text-purple-600" />
                                    Grafik Invoice 6 Bulan Terakhir
                                </CardTitle>
                                <CardDescription className="text-xs md:text-sm">
                                    Trend nilai invoice dalam 6 bulan terakhir
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <InvoiceChart
                                    data={monthlyInvoiceFiltered}
                                    loading={loading}
                                    onCustomerInvoiceChange={handleCustomerInvoiceChange}
                                />
                            </CardContent>
                        </Card>

                        {/* Invoice Stats */}
                        <div className="space-y-6">
                            <Card className="border-0 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] rounded-[24px]">
                                <CardHeader>
                                    <CardTitle className="text-base md:text-lg flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                                        <Receipt className="h-5 w-5 text-purple-600" />
                                        Statistik Invoice
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {loading ? (
                                        <div className="space-y-3">
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-full" />
                                        </div>
                                    ) : invoiceStats ? (
                                        <>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs md:text-sm text-muted-foreground">Pending Invoices</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-xs md:text-sm">
                                                        {hidden ? maskValue(invoiceStats.pendingInvoices) : formatIDR(invoiceStats.pendingInvoices)}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={toggleHidden}
                                                        className="text-muted-foreground hover:text-foreground"
                                                    >
                                                        {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-green-500" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs md:text-sm text-muted-foreground">Paid Invoices</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-xs md:text-sm">
                                                        {hidden ? maskValue(invoiceStats.paidInvoices) : formatIDR(invoiceStats.paidInvoices)}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={toggleHidden}
                                                        className="text-muted-foreground hover:text-foreground"
                                                    >
                                                        {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-green-500" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center pt-2 border-t">
                                                <div className="flex flex-col">
                                                    <span className="text-xs md:text-sm text-muted-foreground">Collection Rate</span>
                                                    <span className="text-[10px] text-muted-foreground/70">Paid / (Paid + Pending)</span>
                                                </div>
                                                {(() => {
                                                    const rate = invoiceStats.collectionRate * 100
                                                    let badgeColor = "bg-red-500 text-white"

                                                    if (rate >= 80) {
                                                        badgeColor = "bg-green-500 text-white"
                                                    } else if (rate >= 50) {
                                                        badgeColor = "bg-yellow-500 text-black"
                                                    }

                                                    return (
                                                        <Badge className={`${badgeColor} font-semibold text-xs md:text-sm`}>
                                                            {rate.toFixed(2)} %
                                                        </Badge>
                                                    )
                                                })()}
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs md:text-sm text-muted-foreground">
                                                        Invoice {formattedLastMonth}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-xs md:text-sm">
                                                            {hidden ? maskValue(invoiceStats.totalLastMonth) : formatIDR(invoiceStats.totalLastMonth)}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={toggleHidden}
                                                            className="text-muted-foreground hover:text-foreground"
                                                        >
                                                            {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-green-500" />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs md:text-sm text-muted-foreground">
                                                        Invoice Tahun {currentYear}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-xs md:text-sm">
                                                            {hidden ? maskValue(invoiceStats.totalThisYear) : formatIDR(invoiceStats.totalThisYear)}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={toggleHidden}
                                                            className="text-muted-foreground hover:text-foreground"
                                                        >
                                                            {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-green-500" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-xs md:text-sm text-muted-foreground">Data tidak tersedia</div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Quick Actions for Invoicing */}
                            <Card className="border-0 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] rounded-[24px]">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base md:text-lg flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                                        <FilePlus2 className="h-5 w-5 text-purple-600" />
                                        Aksi Cepat Invoice
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button className="w-full justify-start gap-2 h-11 text-xs md:text-sm bg-purple-600 hover:bg-purple-700" asChild>
                                        <Link href="/admin-area/finance/invoice/create">
                                            <FilePlus2 className="h-4 w-4" />
                                            Buat Invoice Baru
                                        </Link>
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start gap-2 h-11 text-xs md:text-sm" asChild>
                                        <Link href="/admin-area/finance/invoice">
                                            <Receipt className="h-4 w-4" />
                                            Lihat Semua Invoice
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

// ... (StatCard dan RecentTableSkeleton diperbarui)
function StatCard({
    title,
    value,
    loading,
    icon,
    trend,
    href,
    formatted = false,
    colorScheme = "blue",
    alwaysShow = false
}: {
    title: string;
    value: number | null;
    loading?: boolean;
    icon?: React.ReactNode;
    trend?: number;
    href?: string;
    formatted?: boolean;
    colorScheme?: "blue" | "purple" | "amber" | "emerald";
    alwaysShow?: boolean;
}) {
    const [showValue, setShowValue] = useState(alwaysShow ? true : false) // Default false untuk menyembunyikan nilai (XX.XXX.XXX), kecuali alwaysShow = true
    const [isMobile, setIsMobile] = useState(false)
    const isPositive = trend && trend >= 0;

    // Detect mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024)
        }
        
        checkMobile()
        window.addEventListener('resize', checkMobile)
        
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const colors = {
        blue: {
            bg: "bg-blue-50/50 dark:bg-blue-900/10",
            border: "border-blue-100 dark:border-blue-800/50",
            iconBg: "bg-blue-100 dark:bg-blue-900/40",
            iconColor: "text-blue-600 dark:text-blue-400",
            textHover: "group-hover:text-blue-600 dark:group-hover:text-blue-400"
        },
        purple: {
            bg: "bg-purple-50/50 dark:bg-purple-900/10",
            border: "border-purple-100 dark:border-purple-800/50",
            iconBg: "bg-purple-100 dark:bg-purple-900/40",
            iconColor: "text-purple-600 dark:text-purple-400",
            textHover: "group-hover:text-purple-600 dark:group-hover:text-purple-400"
        },
        amber: {
            bg: "bg-amber-50/50 dark:bg-amber-900/10",
            border: "border-amber-100 dark:border-amber-800/50",
            iconBg: "bg-amber-100 dark:bg-amber-900/40",
            iconColor: "text-amber-600 dark:text-amber-400",
            textHover: "group-hover:text-amber-600 dark:group-hover:text-amber-400"
        },
        emerald: {
            bg: "bg-emerald-50/50 dark:bg-emerald-900/10",
            border: "border-emerald-100 dark:border-emerald-800/50",
            iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
            iconColor: "text-emerald-600 dark:text-emerald-400",
            textHover: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
        }
    };

    const scheme = colors[colorScheme];

    return (
        <Card className={`group relative overflow-hidden bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-800/50 border-0 shadow-2xl shadow-${colorScheme}-500/5 dark:shadow-${colorScheme}-500/10 rounded-[28px] transition-all duration-500 hover:shadow-2xl hover:shadow-${colorScheme}-500/20 hover:-translate-y-2 backdrop-blur-xl`}>
            {/* Animated gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${scheme.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            
            <CardHeader className="relative p-6 pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-[10px] md:text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    {title}
                </CardTitle>
                <div className={`h-10 w-10 md:h-14 md:w-14 rounded-[16px] md:rounded-[20px] ${scheme.iconBg} ${scheme.iconColor} flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-lg ${scheme.iconColor.replace('text-', 'shadow-')}/30`}>
                    {icon}
                </div>
            </CardHeader>

            <CardContent className="relative px-6 py-4">
                {loading ? (
                    <Skeleton className="h-8 w-32 mt-1" />
                ) : (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center">
                            <span className={`text-xl md:text-4xl font-black tracking-tight bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-105`}>
                                {/* Di mode mobile, selalu tampilkan nilai asli */}
                                {isMobile ? (
                                    value !== null
                                        ? formatted
                                            ? `Rp ${value.toLocaleString("id-ID")}`
                                            : value.toLocaleString("id-ID")
                                        : "-"
                                ) : (
                                    /* Di desktop, ikuti setting showValue */
                                    showValue
                                        ? value !== null
                                            ? formatted
                                                ? `Rp ${value.toLocaleString("id-ID")}`
                                                : value.toLocaleString("id-ID")
                                            : "-"
                                        : "XXX.XXX.XXX"
                                )}
                            </span>

                            {/* Tombol Eye hanya tampil di desktop dan untuk formatted values dan bukan alwaysShow */}
                            {formatted && !isMobile && !alwaysShow && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setShowValue((prev) => !prev)
                                    }}
                                    className="ml-3 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all duration-300 hover:scale-110 z-20 relative"
                                >
                                    {showValue ? (
                                        <Eye className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <EyeOff className="h-5 w-5" />
                                    )}
                                </button>
                            )}
                        </div>

                        {trend !== undefined && !loading && (
                            <div
                                className={`flex items-center text-[10px] md:text-xs mt-1 transition-all duration-300 ${isPositive
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-rose-600 dark:text-rose-400"
                                    }`}
                            >
                                <span className={`flex items-center justify-center rounded-full p-0.5 md:p-1 mr-1 md:mr-2 ${isPositive ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-rose-100 dark:bg-rose-900/30'}`}>
                                    {isPositive ? (
                                        <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4" />
                                    ) : (
                                        <ArrowDownRight className="h-3 w-3 md:h-4 md:w-4" />
                                    )}
                                </span>
                                <span className="font-bold text-xs md:text-sm">{Math.abs(trend).toFixed(1)}%</span>
                                <span className="text-slate-500 dark:text-slate-400 ml-1 md:ml-2 font-semibold hidden sm:inline">vs last month</span>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
            {href && (
                <Link href={href} className="absolute inset-0 z-10">
                    <span className="sr-only">View Details</span>
                </Link>
            )}
        </Card>
    );
}

function RecentTableSkeleton() {
    return (
        <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-6 w-[100px]" />
                    <Skeleton className="h-8 w-[80px]" />
                </div>
            ))}
        </div>
    );
}

function SPKCarousel({ recentSpk }: { recentSpk: SPKMini[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Ambil semua foto (tidak dibatasi)
    const spksWithPhotos = recentSpk.map((spk) => {
        const latestReport = spk.spkFieldReport?.[0];
        // Tampilkan semua foto yang ada
        const photos = latestReport?.photos || [];
        return { ...spk, photos };
    });

    const handleNext = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex((prev) => (prev + 1) % spksWithPhotos.length);
        setTimeout(() => setIsTransitioning(false), 600);
    };

    const handlePrev = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex((prev) => (prev - 1 + spksWithPhotos.length) % spksWithPhotos.length);
        setTimeout(() => setIsTransitioning(false), 600);
    };

    const goToSlide = (index: number) => {
        if (isTransitioning || index === currentIndex) return;
        setIsTransitioning(true);
        setCurrentIndex(index);
        setTimeout(() => setIsTransitioning(false), 600);
    };

    // Auto-slide setiap 5 detik - DIPERBAIKI
    useEffect(() => {
        if (spksWithPhotos.length <= 1) return;
        
        // Jangan auto-slide saat hover atau sedang transisi
        if (isHovered || isTransitioning) return;

        const interval = setInterval(() => {
            handleNext();
        }, 5000);

        return () => clearInterval(interval);
    }, [spksWithPhotos.length, isHovered, isTransitioning, currentIndex]);

    if (spksWithPhotos.length === 0) {
        return (
            <div className="p-12 text-sm text-muted-foreground text-center">
                Belum ada aktivitas SPK terbaru.
            </div>
        );
    }

    const currentSpk = spksWithPhotos[currentIndex];
    const hasPhotos = currentSpk?.photos?.length > 0;

    // Layout Grid Sempurna (Tidak ada ruang kosong)
    const getPerfectGridClass = (total: number, index: number) => {
        if (total === 1) return "col-span-12 row-span-12";
        if (total === 2) return "col-span-6 row-span-12";
        if (total === 3) {
            if (index === 0) return "col-span-8 row-span-12";
            return "col-span-4 row-span-6";
        }
        if (total === 4) {
            if (index === 0) return "col-span-8 row-span-12";
            return "col-span-4 row-span-4";
        }
        if (total === 5) {
            if (index === 0) return "col-span-6 row-span-12";
            return "col-span-3 row-span-6";
        }
        if (total === 6) {
            if (index === 0) return "col-span-8 row-span-8";
            return "col-span-4 row-span-4";
        }
        return "col-span-4 row-span-4";
    };

    return (
        <div 
            className="relative w-full overflow-hidden rounded-[24px] group bg-slate-900 aspect-[4/3] md:aspect-[21/9] shadow-[0_2px_40px_-12px_rgba(0,0,0,0.1)]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <style>{`
                @keyframes slideFadeIn {
                    0% { 
                        opacity: 0; 
                        transform: translateX(100%) scale(0.95);
                    }
                    100% { 
                        opacity: 1; 
                        transform: translateX(0) scale(1);
                    }
                }
                
                @keyframes slideFadeOut {
                    0% { 
                        opacity: 1; 
                        transform: translateX(0) scale(1);
                    }
                    100% { 
                        opacity: 0; 
                        transform: translateX(-100%) scale(0.95);
                    }
                }
                
                .animate-slide-fade-in {
                    animation: slideFadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
                
                .animate-slide-fade-out {
                    animation: slideFadeOut 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
                
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0,0,0,0.1);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.2);
                    border-radius: 4px;
                }
                
                /* Progress bar animation */
                @keyframes progressBar {
                    0% { width: 0%; }
                    100% { width: 100%; }
                }
                
                .progress-bar {
                    animation: progressBar 5s linear;
                }
                
                .progress-bar.paused {
                    animation-play-state: paused;
                }
            `}</style>

            {hasPhotos ? (
                <div 
                    key={`${currentSpk.id}-${currentIndex}`} 
                    className="absolute inset-0 p-1 md:p-2 bg-slate-950 animate-slide-fade-in overflow-y-auto custom-scrollbar"
                >
                    {currentSpk.photos.length <= 6 ? (
                        // Perfect packed grid untuk 1-6 foto (100% full, tidak ada kosong)
                        <div className="grid grid-cols-12 grid-rows-12 gap-1 md:gap-2 h-full w-full">
                            {currentSpk.photos.map((photo: any, idx: number) => (
                                <div key={photo.id || idx} className={`relative overflow-hidden rounded-xl shadow-sm bg-slate-800 ${getPerfectGridClass(currentSpk.photos.length, idx)}`}>
                                    <div className="absolute inset-0 bg-slate-800 animate-pulse" />
                                    <img 
                                        src={(() => {
                                            const src = makeImageSrc(photo.imageUrl);
                                            return src;
                                        })()} 
                                        alt={`SPK ${currentSpk.spkNumber} - Photo ${idx + 1}`}
                                        loading="lazy"
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 hover:opacity-100"
                                        onError={(e) => {
                                            const target = e.currentTarget as HTMLImageElement;
                                            const originalSrc = target.src;
                                            if (originalSrc.includes('localhost:5000') || originalSrc.includes('localhost:3000')) {
                                                const newSrc = originalSrc.replace(/http:\/\/localhost:(5000|3000)/, 'https://api.rylif-app.com');
                                                if (target.getAttribute('data-tried-vps') !== 'true') {
                                                    target.setAttribute('data-tried-vps', 'true');
                                                    target.src = newSrc;
                                                    return;
                                                }
                                            }
                                            target.style.display = 'none';
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        // Masonry flex-grow layout untuk foto > 6 (Otomatis mengisi baris sampai penuh)
                        <div className="flex flex-wrap gap-1 md:gap-2 w-full content-start">
                            {currentSpk.photos.map((photo: any, idx: number) => {
                                const growFactors = [1, 2, 1.5, 3, 1.2];
                                return (
                                    <div 
                                        key={photo.id || idx} 
                                        className="relative overflow-hidden rounded-xl shadow-sm bg-slate-800 h-[100px] md:h-[150px]"
                                        style={{ flexGrow: growFactors[idx % growFactors.length], flexBasis: "20%" }}
                                    >
                                        <div className="absolute inset-0 bg-slate-800 animate-pulse" />
                                        <img 
                                            src={(() => {
                                                const src = makeImageSrc(photo.imageUrl);
                                                return src;
                                            })()} 
                                            alt={`SPK ${currentSpk.spkNumber} - Photo ${idx + 1}`}
                                            loading="lazy"
                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 hover:opacity-100"
                                            onError={(e) => {
                                                const target = e.currentTarget as HTMLImageElement;
                                                const originalSrc = target.src;
                                                if (originalSrc.includes('localhost:5000') || originalSrc.includes('localhost:3000')) {
                                                    const newSrc = originalSrc.replace(/http:\/\/localhost:(5000|3000)/, 'https://api.rylif-app.com');
                                                    if (target.getAttribute('data-tried-vps') !== 'true') {
                                                        target.setAttribute('data-tried-vps', 'true');
                                                        target.src = newSrc;
                                                        return;
                                                    }
                                                }
                                                target.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-800">
                    <ImageIcon className="w-12 h-12 mb-3 opacity-20" />
                    <span className="font-medium text-sm">No documentation available</span>
                </div>
            )}

            {/* Ultra Premium Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/40 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 via-transparent to-transparent pointer-events-none" />

            {/* Content Layer */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white pointer-events-auto flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div className="flex-1 max-w-3xl">
                        <div className="flex items-center gap-3 mb-2">
                            <Badge className={`px-2.5 py-1 text-[10px] md:text-xs font-bold tracking-wider ${
                                currentSpk.spkStatusClose 
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-0' 
                                : 'bg-orange-500 hover:bg-orange-600 text-white border-0'
                            }`}>
                                {currentSpk.spkStatusClose ? 'CLOSED' : 'IN PROGRESS'}
                            </Badge>
                            <span className="text-slate-300 text-xs font-medium flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                {currentSpk.team?.namaTeam || "Tim Tidak Ditentukan"}
                            </span>
                        </div>

                        <Link href={`/admin-area/logistic/spk?search=${currentSpk.spkNumber}`} className="text-2xl md:text-3xl font-bold text-white hover:text-orange-400 transition-colors inline-block tracking-tight drop-shadow-sm mb-1">
                            {currentSpk.spkNumber}
                        </Link>
                        
                        <div className="text-sm md:text-lg text-slate-200 font-medium leading-relaxed drop-shadow-sm line-clamp-2 mb-3">
                            {currentSpk.salesOrder?.project?.name || "Nama Project Tidak Tersedia"}
                        </div>
                        
                        {/* Info Pills */}
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 text-xs text-slate-100 font-medium">
                                <Building2 className="w-3.5 h-3.5 text-blue-300" />
                                <span className="truncate max-w-[150px] md:max-w-[200px]">
                                    {currentSpk.salesOrder?.customer?.name || "-"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 text-xs text-slate-100 font-medium">
                                <FileText className="w-3.5 h-3.5 text-emerald-300" />
                                {currentSpk.salesOrder?.soNumber || "-"}
                            </div>
                        </div>
                    </div>
                    
                    {/* Circular Progress */}
                    <div className="hidden md:flex flex-col items-center bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10 min-w-[120px]">
                        <div className="text-3xl font-bold text-white tracking-tighter mb-1">
                            {currentSpk.progress}<span className="text-lg text-slate-400">%</span>
                        </div>
                        <div className="text-[10px] text-slate-300 uppercase tracking-widest font-semibold">Progress</div>
                    </div>
                </div>

                {/* Mobile Progress Bar (Hidden on Desktop since we have circular progress) */}
                <div className="md:hidden mt-2">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="font-bold text-white tracking-wide">{currentSpk.progress}% PROGRESS</span>
                        <span className="text-slate-300 truncate max-w-[150px]">
                            {currentSpk.progressComment || ""}
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                currentSpk.progress >= 100 ? 'bg-emerald-400' : 
                                currentSpk.progress >= 50 ? 'bg-blue-400' : 
                                currentSpk.progress > 0 ? 'bg-orange-400' : 'bg-slate-400'
                            }`}
                            style={{ width: `${currentSpk.progress}%` }}
                        />
                    </div>
                </div>
                
                {/* Desktop Comment */}
                <div className="hidden md:block text-sm text-slate-300 italic border-l-2 border-white/20 pl-3 py-0.5 mt-2 max-w-2xl">
                    "{currentSpk.progressComment || "Tidak ada catatan progres tambahan."}"
                </div>
            </div>

            {/* Navigation Buttons - Enhanced */}
            {spksWithPhotos.length > 1 && (
                <>
                    <button 
                        onClick={handlePrev}
                        disabled={isTransitioning}
                        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-3 md:p-4 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-orange-500 hover:scale-110 transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-orange-500/50 z-30"
                        aria-label="Previous SPK"
                    >
                        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <button 
                        onClick={handleNext}
                        disabled={isTransitioning}
                        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-3 md:p-4 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-orange-500 hover:scale-110 transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-orange-500/50 z-30"
                        aria-label="Next SPK"
                    >
                        <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                    </button>

                    {/* Dots Indicator with Progress Bar */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2 z-30">
                        <div className="flex gap-1.5 bg-black/30 backdrop-blur-md rounded-full p-2">
                            {spksWithPhotos.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => goToSlide(idx)}
                                    disabled={isTransitioning}
                                    className={`relative h-2 rounded-full transition-all duration-300 overflow-hidden ${
                                        idx === currentIndex 
                                            ? 'w-8 bg-orange-400 shadow-lg shadow-orange-400/50' 
                                            : 'w-2 bg-white/40 hover:bg-white/70 hover:w-4'
                                    } disabled:cursor-not-allowed`}
                                    aria-label={`Go to slide ${idx + 1}`}
                                >
                                    {/* Progress bar untuk slide aktif */}
                                    {idx === currentIndex && !isHovered && (
                                        <div 
                                            className="absolute inset-0 bg-orange-300 progress-bar"
                                            style={{ 
                                                animationPlayState: isHovered ? 'paused' : 'running'
                                            }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                        
                        {/* Counter */}
                        <div className="text-white text-xs font-bold bg-black/40 backdrop-blur-md rounded-full px-3 py-1 text-center">
                            {currentIndex + 1} / {spksWithPhotos.length}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
