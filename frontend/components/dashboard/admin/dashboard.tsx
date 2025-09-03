"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
// import { Progress } from "@/components/ui/progress";
// import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    //   Eye,
    //   Plus,
    Download,
    Filter,
    MoreHorizontal,
    EyeOff,
    Eye,
    //   Search
} from "lucide-react";


// =============================
// KONFIGURASI API BACKEND
// =============================
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

const ENDPOINTS = {
    customerCount: `${API_BASE}/api/master/customer/getCustomerCount`,
    productCount: `${API_BASE}/api/master/product/getProductCount`,
    salesOrderCount: `${API_BASE}/api/salesOrder/getSalesOrderCount`,
    recentSalesOrders: `${API_BASE}/api/salesOrder/getRecentSalesOrders?take=5&order=desc`,
    salesStats: `${API_BASE}/api/salesOrder/getSalesStats`,
};

// =============================
// TIPE DATA
// =============================
interface CountResponse { count: number }

interface CustomerMini { id: string; name: string }
interface ProjectMini { id: string; name: string }

type OrderStatus =
    | "DRAFT"
    | "CONFIRMED"
    | "APPROVED"
    | "REJECTED"
    | "INVOICED"
    | "PARTIALLY_INVOICED"
    | "CLOSED";

interface SalesOrderMini {
    id: string;
    soNumber: string;
    soDate: string;
    status: OrderStatus;
    grandTotal: string | number;
    customer?: CustomerMini | null;
    project?: ProjectMini | null;
}

interface SalesStats {
    totalThisMonth: number;
    totalLastMonth: number;
    pendingOrders: number;
    conversionRate: number;
    totalThisYear: number;
}

const toNumber = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : parseFloat(String(v)) || 0);

async function loadSalesStats(): Promise<SalesStats> {
    const res = await fetch(ENDPOINTS.salesStats, { credentials: "include" });
    if (!res.ok) {
        return { totalThisMonth: 0, totalLastMonth: 0, pendingOrders: 0, conversionRate: 0, totalThisYear: 0 };
    }
    const json = await res.json();

    const totalThisMonth = toNumber(json.totalThisMonth ?? json.mtd);
    const totalLastMonth = toNumber(json.totalLastMonth ?? json.lastMonth ?? 0);
    const pendingOrders = toNumber(json.pendingOrders ?? json.pending ?? 0);
    const conversionRate = toNumber(json.conversionRate ?? 0);
    const totalThisYear = toNumber(json.totalThisYear ?? json.yearSummary ?? 0)

    return { totalThisMonth, totalLastMonth, pendingOrders, conversionRate, totalThisYear };
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
    const color: Record<OrderStatus, string> = {
        DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
        CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
        REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        INVOICED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
        PARTIALLY_INVOICED: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
        CLOSED: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
    };

    const icon: Record<OrderStatus, string> = {
        DRAFT: "📝",
        CONFIRMED: "✅",
        APPROVED: "👍",
        REJECTED: "❌",
        INVOICED: "🧾",
        PARTIALLY_INVOICED: "↔️",
        CLOSED: "🔒",
    };

    return (
        <Badge className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${color[status]}`}>
            <span className="text-xs">{icon[status]}</span>
            {status.replace("_", " ")}
        </Badge>
    );
}

// =============================
// KOMPONEN HALAMAN DASHBOARD
// =============================
export default function DashboardAwalSalesOrder() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    //   const [activeTab, setActiveTab] = useState("overview");

    const [customerCount, setCustomerCount] = useState<number | null>(null);
    const [productCount, setProductCount] = useState<number | null>(null);
    const [salesOrderCount, setSalesOrderCount] = useState<number | null>(null);
    const [recentOrders, setRecentOrders] = useState<SalesOrderMini[]>([]);
    const [salesStats, setSalesStats] = useState<SalesStats | null>(null);

    const now = new Date()
    const monthName = now.toLocaleString("id-ID", { month: "long" }) // contoh: September
    const year = now.getFullYear()
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

    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const formattedLastMonth = formatBulanTahun(lastMonth)

    const currentYear = new Date().getFullYear();

    const maskValue = (val: number) =>
        val ? "XXX.XXX.XXX.XXX" : "XXX.XXX.XXX.XXX";

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError(null);
            try {
                const [cst, prd, so, list] = await Promise.all([
                    fetch(ENDPOINTS.customerCount, { credentials: "include" }),
                    fetch(ENDPOINTS.productCount, { credentials: "include" }),
                    fetch(ENDPOINTS.salesOrderCount, { credentials: "include" }),
                    fetch(ENDPOINTS.recentSalesOrders, { credentials: "include" }),
                ]);

                if (!cst.ok || !prd.ok || !so.ok || !list.ok) {
                    throw new Error("Gagal memuat data dashboard. Periksa endpoint backend.");
                }

                const [cstJson, prdJson, soJson, listJsonRaw] = await Promise.all([
                    cst.json() as Promise<CountResponse>,
                    prd.json() as Promise<CountResponse>,
                    so.json() as Promise<CountResponse>,
                    list.json() as Promise<{ data: SalesOrderMini[] } | SalesOrderMini[]>,
                ]);

                const statsJson = await loadSalesStats();

                if (cancelled) return;

                setCustomerCount(cstJson.count);
                setProductCount(prdJson.count);
                setSalesOrderCount(soJson.count);
                setRecentOrders(Array.isArray(listJsonRaw) ? listJsonRaw : listJsonRaw.data);
                setSalesStats(statsJson);
            } catch (e: unknown) {
                if (cancelled) return;
                console.error(e);
                setError(e instanceof Error ? e.message : "Terjadi kesalahan tak terduga");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, []);

    const calculateTrend = (): number => {
        if (!salesStats) return 0;

        const thisMonth = Number(salesStats.totalThisMonth ?? 0);
        const lastMonth = Number(salesStats.totalLastMonth ?? 0);

        if (!isFinite(thisMonth) || !isFinite(lastMonth) || lastMonth <= 0) return 0;
        return ((thisMonth - lastMonth) / lastMonth) * 100;
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8 dark:bg-slate-900">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Dashboard Sales Admin
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

            {/* Tabs Navigation */}
            {/* <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 max-w-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
      </Tabs> */}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <StatCard
                    title="Total Pelanggan"
                    value={customerCount}
                    loading={loading}
                    icon={<Users2 className="h-5 w-5 text-blue-600" />}
                    trend={salesStats ? Math.round((customerCount || 0) / 10) : 0}
                    href="/admin-area/master/customers"
                />
                <StatCard
                    title="Produk"
                    value={productCount}
                    loading={loading}
                    icon={<Package className="h-5 w-5 text-purple-600" />}
                    trend={salesStats ? Math.round((productCount || 0) / 5) : 0}
                    href="/admin-area/master/products"
                />
                <StatCard
                    title={`Sales Order Tahun ${new Date().getFullYear()}`}
                    value={salesOrderCount}
                    loading={loading}
                    icon={<Building2 className="h-5 w-5 text-green-600" />}
                    trend={salesStats ? Math.round((salesOrderCount || 0) / 20) : 0}
                    href="/admin-area/sales/salesOrder"
                />
                <StatCard
                    title={`Nilai Sales Order ${monthName} ${year}`}
                    value={salesStats ? salesStats.totalThisMonth : null}
                    loading={loading}
                    formatted
                    icon={<CreditCard className="h-5 w-5 text-amber-600" />}
                    trend={calculateTrend()}
                    href="#"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Recent Sales Orders */}
                <Card className="lg:col-span-2 shadow-sm border">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-blue-600" />
                                    Sales Order Terbaru
                                </CardTitle>
                                <CardDescription className="text-xs md:text-sm">
                                    5 sales order terbaru yang dibuat
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="h-8 gap-1">
                                    <Filter className="h-3.5 w-3.5" />
                                    Filter
                                </Button>
                                <Button variant="ghost" size="sm" asChild className="h-8 text-xs md:text-sm">
                                    <Link href="/admin-area/sales/salesOrder" className="text-blue-600 hover:text-blue-800">
                                        Lihat semua
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
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
                                                    <Link
                                                        href="#"
                                                        className="underline-offset-4 hover:underline text-blue-600 hover:text-blue-800"
                                                    >
                                                        {o.soNumber}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="text-xs md:text-sm">{formatDate(o.soDate)}</TableCell>
                                                <TableCell className="text-xs md:text-sm">{o.customer?.name ?? "-"}</TableCell>
                                                <TableCell className="text-right font-medium text-xs md:text-sm">{formatIDR(o.grandTotal)}</TableCell>
                                                <TableCell>
                                                    <StatusBadge status={o.status} />
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                                                        <Link href="#">
                                                            <MoreHorizontal className="h-3 w-3 md:h-4 md:w-4" />
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-between border-t p-3">
                        <div className="text-xs text-muted-foreground">
                            Menampilkan {recentOrders.length} dari {salesOrderCount} orders
                        </div>
                        <Button variant="outline" size="sm" className="text-xs">
                            Lihat Semua Order
                        </Button>
                    </CardFooter>
                </Card>

                {/* Sidebar - Quick Actions & Stats */}
                <div className="space-y-6">
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
                                    {/* <div className="pt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground">Target Penjualan</span>
                      <span className="text-xs font-semibold">75%</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div> */}
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
        </div>
    );
}

// =============================
// SUB-KOMPONEN
// =============================
function StatCard({
    title,
    value,
    loading,
    icon,
    trend,
    href,
    formatted = false
}: {
    title: string;
    value: number | null;
    loading?: boolean;
    icon?: React.ReactNode;
    trend?: number;
    href?: string;
    formatted?: boolean;
}) {
    const [showValue, setShowValue] = useState(!formatted)
    const isPositive = trend && trend >= 0;

    return (
        <Card className="min-h-40 overflow-hidden border shadow-sm transition-all hover:shadow-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                    {icon}
                </div>
            </CardHeader>

            <CardContent>
                {loading ? (
                    <Skeleton className="h-7 w-20 mt-1" />
                ) : (
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">
                            {showValue
                                ? value !== null
                                    ? formatted
                                        ? `Rp ${value.toLocaleString("id-ID")}` // ✅ tambah Rp
                                        : value
                                    : "-"
                                : "XXX.XXX.XXX"}
                        </span>

                        {formatted && (
                            <button
                                type="button"
                                onClick={() => setShowValue((prev) => !prev)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                {showValue ? (
                                    <Eye className="h-6 w-6 ml-2 text-green-500" />
                                ) : (
                                    <EyeOff className="h-6 w-6 ml-2" />
                                )}
                            </button>
                        )}
                    </div>
                )}

                {trend !== undefined && !loading && (
                    <div
                        className={`flex items-center text-xs mt-2 ${isPositive ? "text-green-600" : "text-red-600"
                            }`}
                    >
                        {isPositive ? (
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                        ) : (
                            <ArrowDownRight className="h-3 w-3 mr-1" />
                        )}
                        {Math.abs(trend).toFixed(1)}%{" "}
                        {isPositive ? "peningkatan" : "penurunan"} dari bulan lalu
                    </div>
                )}
            </CardContent>

            <CardFooter className="pt-0">
                {href && (
                    <Button
                        variant="link"
                        className="px-0 text-blue-600 hover:text-blue-800 text-xs md:text-sm h-8"
                        asChild
                    >
                        <Link href={href}>
                            Lihat detail <ArrowUpRight className="h-3 w-3 ml-1" />
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