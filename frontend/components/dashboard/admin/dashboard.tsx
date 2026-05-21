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
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SalesChart } from "./salesChart";
import { InvoiceChart } from "./invoiceChart";
import { MobileShortcut } from "@/components/mobile-shortcut";
import { ActiveEmployeesCard } from "./active-employees-card";

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
    } | null;
    team: {
        namaTeam: string;
    } | null;
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
    const [activeTab, setActiveTab] = useState("sales-order");

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
    // (() => {})("Data Sales Stats", salesStats);

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
                // (() => {})("monthlyData",monthlyData)

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
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8 dark:bg-slate-900">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Dashboard Preview Admin
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm md:text-base">
                        Ringkasan performa penjualan dan aktivitas terkini
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button asChild className="gap-2 bg-blue-600 hover:bg-blue-700 text-xs md:text-sm">
                        <Link href="/admin-area/sales/salesOrder/create">
                            <FilePlus2 className="h-4 w-4" />
                            Buat Sales Order
                        </Link>
                    </Button>
                    <Button variant="outline" className="gap-2 text-xs md:text-sm">
                        <Download className="h-4 w-4" />
                        Export Laporan
                    </Button>
                </div>
            </div>
            {/* Stats Grid - MODIFIED FOR MOBILE: 2 columns on mobile, 4 columns on desktop */}
            <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <StatCard
                    title="Total Pelanggan"
                    value={customerCount}
                    loading={loading}
                    icon={<Users2 className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />}
                    trend={salesStats ? Math.round((customerCount || 0) / 10) : 0}
                    href="/admin-area/master/customers"
                    gradient="from-blue-100 to-blue-200 dark:from-blue-700 dark:to-blue-800"
                />
                <StatCard
                    title="Produk"
                    value={productCount}
                    loading={loading}
                    icon={<Package className="h-4 w-4 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />}
                    trend={salesStats ? Math.round((productCount || 0) / 5) : 0}
                    href="/admin-area/master/products"
                    gradient="from-purple-100 to-purple-200 dark:from-purple-700 dark:to-purple-800"
                />
                <StatCard
                    title={`Sales ${monthName}`}
                    value={salesStats ? salesStats.totalThisMonth : null}
                    loading={loading}
                    formatted
                    icon={<CreditCard className="h-4 w-4 md:h-5 md:w-5 text-amber-600 dark:text-amber-400" />}
                    trend={calculateTrend()}
                    href="#"
                    gradient="from-amber-100 to-amber-200 dark:from-amber-700 dark:to-amber-800"
                />
                <StatCard
                    title={`Invoice ${monthName}`}
                    value={invoiceStats ? invoiceStats.totalThisMonth : null}
                    loading={loading}
                    formatted
                    icon={<Building2 className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />}
                    trend={calculateTrendInvoice()}
                    href="/admin-area/finance/invoice"
                    gradient="from-green-100 to-green-200 dark:from-green-700 dark:to-green-800"
                />
            </div>

            <MobileShortcut basePath={basePath} />

            {/* Main Content with Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-[600px] bg-slate-100 dark:bg-slate-800 p-1 rounded-lg h-auto">
                    <TabsTrigger
                        value="sales-order"
                        className="flex items-center justify-center gap-1.5 md:gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 px-2 py-2.5"
                    >
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="text-[10px] sm:text-xs md:text-sm font-medium truncate">Sales Order</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="logistic"
                        className="flex items-center justify-center gap-1.5 md:gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-orange-600 px-2 py-2.5"
                    >
                        <Package className="h-4 w-4 shrink-0" />
                        <span className="text-[10px] sm:text-xs md:text-sm font-medium truncate">Logistic</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="invoicing"
                        className="flex items-center justify-center gap-1.5 md:gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-600 px-2 py-2.5"
                    >
                        <Receipt className="h-4 w-4 shrink-0" />
                        <span className="text-[10px] sm:text-xs md:text-sm font-medium truncate">Invoicing</span>
                    </TabsTrigger>
                </TabsList>

                {/* Sales Order Tab */}
                <TabsContent value="sales-order" className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 bg-gradient-to-br from-blue/80 to-purple-50/50 dark:from-slate-900/90 dark:to-slate-800/80 backdrop-blur-sm">
                        {/* Recent Sales Orders */}
                        <Card className="lg:col-span-2 shadow-sm border">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-blue-600" />
                                    Grafik Sales Order 6 Bulan Terakhir
                                </CardTitle>
                                <CardDescription className="text-xs md:text-sm">
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

                            <Separator />

                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xs md:text-lg flex items-center gap-2">
                                            <Calendar className="h-5 w-5 text-blue-600" />
                                            Sales Order Terbaru
                                        </CardTitle>
                                        <CardDescription className="text-xs md:text-sm">
                                            5 sales order terbaru yang dibuat, dari  {salesOrderCount} Sales Order yang di buat.
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" asChild className="h-8 text-xs md:text-sm">
                                            <Link href="/admin-area/sales/salesOrder" className="text-blue-600 hover:text-blue-800">
                                                Lihat semua
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

                        {/* Sidebar - Quick Actions & Stats */}
                        <div className="space-y-6">
                            {/* Active Employees Today */}
                            <ActiveEmployeesCard />

                            {/* Quick Actions */}
                            <Card className="shadow-sm border">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base md:text-lg flex items-center gap-2">
                                        <FilePlus2 className="h-5 w-5 text-blue-600" />
                                        Aksi Cepat
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button className="w-full justify-start gap-2 h-11 text-xs md:text-sm" asChild>
                                        <Link href="/admin-area/sales/salesOrder/create">
                                            <FilePlus2 className="h-4 w-4" />
                                            Buat Sales Order Baru
                                        </Link>
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start gap-2 h-11 text-xs md:text-sm" asChild>
                                        <Link href="/admin-area/master/customers/create">
                                            <Users2 className="h-4 w-4" />
                                            Tambah Pelanggan Baru
                                        </Link>
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start gap-2 h-11 text-xs md:text-sm" asChild>
                                        <Link href="/admin-area/master/products/create">
                                            <Package className="h-4 w-4" />
                                            Tambah Produk Baru
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Sales Stats */}
                            <Card className="shadow-sm border">
                                <CardHeader>
                                    <CardTitle className="text-base md:text-lg flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-green-600" />
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

                            {/* System Status */}
                            <Card className="shadow-sm border">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base md:text-lg flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                        Status Sistem
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs md:text-sm">API Connection</span>
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs md:text-sm">Database</span>
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Online</Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs md:text-sm">Last Backup</span>
                                        <span className="text-xs text-muted-foreground">12 Jam Lalu</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* Logistic & SPK Tab */}
                <TabsContent value="logistic" className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <Card className="lg:col-span-2 shadow-sm border overflow-hidden">
                            <CardHeader className="pb-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base md:text-lg flex items-center gap-2 text-orange-700 dark:text-orange-400">
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
                                    <>
                                        {/* Desktop View Table */}
                                        <div className="hidden md:block overflow-x-auto">
                                            <Table>
                                                <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                                                    <TableRow>
                                                        <TableHead className="w-[150px] text-xs font-bold">Nomor SPK</TableHead>
                                                        <TableHead className="text-xs font-bold">Customer / SO</TableHead>
                                                        <TableHead className="w-[180px] text-xs font-bold">Progress</TableHead>
                                                        <TableHead className="w-[100px] text-xs font-bold">Status</TableHead>
                                                        <TableHead className="w-[140px] text-xs font-bold text-right">Update Terakhir</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {recentSpk.map((s) => (
                                                        <TableRow key={s.id} className="hover:bg-orange-50/30 dark:hover:bg-orange-900/5 transition-colors group">
                                                            <TableCell className="font-bold text-xs md:text-sm text-orange-600 dark:text-orange-400">
                                                                {s.spkNumber}
                                                                <div className="text-[10px] text-muted-foreground font-normal mt-0.5">
                                                                    Team: {s.team?.namaTeam || "-"}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="text-xs md:text-sm font-medium">
                                                                    {s.salesOrder?.customer?.name || "-"}
                                                                </div>
                                                                <div className="text-[10px] text-muted-foreground">
                                                                    SO: {s.salesOrder?.soNumber || "-"}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="space-y-1.5">
                                                                    <div className="flex justify-between items-center text-[10px]">
                                                                        <span className="font-medium">{s.progress}%</span>
                                                                        <span className="text-muted-foreground truncate max-w-[100px]">
                                                                            {s.progressComment || "No comment"}
                                                                        </span>
                                                                    </div>
                                                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                        <div 
                                                                            className={`h-full rounded-full transition-all duration-500 ${
                                                                                s.progress >= 100 ? 'bg-emerald-500' : 
                                                                                s.progress >= 50 ? 'bg-sky-500' : 
                                                                                s.progress > 0 ? 'bg-amber-500' : 'bg-slate-300'
                                                                            }`}
                                                                            style={{ width: `${s.progress}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge className={`text-[10px] px-2 py-0.5 rounded-full ${
                                                                    s.spkStatusClose 
                                                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400' 
                                                                    : 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400'
                                                                }`}>
                                                                    {s.spkStatusClose ? 'CLOSED' : 'OPEN'}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="text-[10px] md:text-xs text-muted-foreground font-medium">
                                                                    {new Date(s.updatedAt).toLocaleDateString('id-ID', {
                                                                        day: '2-digit',
                                                                        month: 'short',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {/* Mobile View Card List */}
                                        <div className="md:hidden divide-y">
                                            {recentSpk.map((s) => (
                                                <div key={s.id} className="p-4 space-y-3 hover:bg-orange-50/30 transition-colors">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-tight">
                                                                {s.spkNumber}
                                                            </div>
                                                            <div className="text-sm font-semibold mt-0.5 leading-tight">
                                                                {s.salesOrder?.customer?.name || "-"}
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground">
                                                                SO: {s.salesOrder?.soNumber || "-"} | Team: {s.team?.namaTeam || "-"}
                                                            </div>
                                                        </div>
                                                        <Badge className={`text-[9px] px-1.5 py-0 rounded-full ${
                                                            s.spkStatusClose 
                                                            ? 'bg-emerald-100 text-emerald-700' 
                                                            : 'bg-orange-100 text-orange-700'
                                                        }`}>
                                                            {s.spkStatusClose ? 'CLOSED' : 'OPEN'}
                                                        </Badge>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <div className="flex justify-between items-center text-[10px]">
                                                            <span className="font-bold">{s.progress}% Progress</span>
                                                            <span className="text-muted-foreground italic truncate max-w-[150px]">
                                                                "{s.progressComment || "No comment"}"
                                                            </span>
                                                        </div>
                                                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                            <div 
                                                                className={`h-full rounded-full ${
                                                                    s.progress >= 100 ? 'bg-emerald-500' : 
                                                                    s.progress >= 50 ? 'bg-sky-500' : 
                                                                    s.progress > 0 ? 'bg-amber-500' : 'bg-slate-300'
                                                                }`}
                                                                style={{ width: `${s.progress}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between items-center pt-1">
                                                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {new Date(s.updatedAt).toLocaleDateString('id-ID', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </div>
                                                        <Button variant="link" size="sm" className="h-auto p-0 text-[10px] text-orange-600" asChild>
                                                            <Link href={`/admin-area/logistic/spk?search=${s.spkNumber}`}>
                                                                Detail <ArrowUpRight className="h-2 w-2 ml-0.5" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Sidebar Logistic */}
                        <div className="space-y-6">
                            <Card className="shadow-sm border border-orange-100 dark:border-orange-900/20">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base md:text-lg flex items-center gap-2 text-orange-700 dark:text-orange-400">
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
                <TabsContent value="invoicing" className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Invoice Chart */}
                        <Card className="lg:col-span-2 shadow-lg border-0 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-slate-900/90 dark:to-slate-800/80 backdrop-blur-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base md:text-lg flex items-center gap-2">
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
                            <Card className="shadow-sm border">
                                <CardHeader>
                                    <CardTitle className="text-base md:text-lg flex items-center gap-2">
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
                            <Card className="shadow-sm border">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base md:text-lg flex items-center gap-2">
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

// ... (StatCard dan RecentTableSkeleton tetap sama)
function StatCard({
    title,
    value,
    loading,
    icon,
    trend,
    href,
    formatted = false,
    gradient = "from-blue-500 to-blue-600"
}: {
    title: string;
    value: number | null;
    loading?: boolean;
    icon?: React.ReactNode;
    trend?: number;
    href?: string;
    formatted?: boolean;
    gradient?: string;
}) {
    const [showValue, setShowValue] = useState(!formatted)
    const isPositive = trend && trend >= 0;

    return (
        <Card className={`group relative overflow-hidden border-0 bg-gradient-to-br ${gradient} text-gray-900 dark:text-gray-100 shadow-lg transition-all duration-500 hover:shadow-xl hover:scale-105`}>
            <CardHeader className="p-2 pb-0 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs px-4 md:text-lg md:font-bold font-medium text-gray-600 dark:text-gray-400 transition-colors duration-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">
                    {title}
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-white/30 dark:bg-white/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-white/50 dark:group-hover:bg-white/20 group-hover:rotate-6">
                    {icon}
                </div>
            </CardHeader>

            <CardContent className="px-4 py-0">
                {loading ? (
                    <Skeleton className="h-2 w-16 mt-1 px-4" />
                ) : (
                    <div className="flex items-center gap-1 px-3">
                        <span className="text-sm font-bold transition-all duration-300 group-hover:text-gray-800 dark:group-hover:text-gray-100">
                            {/* Di mode mobile, selalu tampilkan nilai asli */}
                            {typeof window !== 'undefined' && window.innerWidth < 1024 ? (
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

                        {/* Tombol Eye hanya tampil di desktop */}
                        {formatted && typeof window !== 'undefined' && window.innerWidth >= 1024 && (
                            <button
                                type="button"
                                onClick={() => setShowValue((prev) => !prev)}
                                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-300"
                            >
                                {showValue ? (
                                    <Eye className="h-3 w-3 ml-1 text-green-500 dark:text-green-400 transition-transform duration-300 group-hover:scale-110" />
                                ) : (
                                    <EyeOff className="h-3 w-3 ml-1 transition-transform duration-300 group-hover:scale-110" />
                                )}
                            </button>
                        )}
                    </div>
                )}

                {trend !== undefined && !loading && (
                    <div
                        className={`flex items-center text-[10px] mt-0 transition-all duration-300 ${isPositive
                            ? "text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300"
                            : "text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300"
                            }`}
                    >
                        {isPositive ? (
                            <ArrowUpRight className="h-2.5 w-2.5 mr-0.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        ) : (
                            <ArrowDownRight className="h-2.5 w-2.5 mr-0.5 transition-transform duration-300 group-hover:translate-y-0.5 group-hover:translate-x-0.5" />
                        )}
                        {Math.abs(trend).toFixed(1)}% {isPositive ? "naik" : "turun"} dari bulan lalu
                    </div>
                )}
            </CardContent>

            <CardFooter className="p-0 pt-0">
                {href && (
                    <Button
                        variant="link"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs h-2 transition-all duration-300 group-hover:translate-x-1"
                        asChild
                    >
                        <Link href={href} className="ml-4">
                            Lihat detail <ArrowUpRight className="h-2.5 w-2.5 ml-0.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </Link>
                    </Button>
                )}
            </CardFooter>
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