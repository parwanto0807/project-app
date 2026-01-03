'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Activity,
    AlertCircle,
    ArrowRightLeft,
    BarChart3,
    Briefcase,
    Calendar,
    ChartBarIncreasing,
    ChevronRight,
    ClipboardList,
    Clock,
    FileText,
    History,
    Home,
    LayoutDashboard,
    Package,
    Plus,
    RefreshCw,
    Server,
    Settings,
    ShoppingCart,
    Sun,
    Target,
    TrendingUp,
    Truck,
    UserPlus,
    Users,
    Users as UsersIcon,
    Warehouse,
    Zap,
} from 'lucide-react';
import DashboardTeamTable from './teamTableDashboard';
import { DashboardSalesOrderTable } from './tableDataSO';
import { SPK } from '@/types/spkReport';
import DashboardSpkTable from './tableDataSPK';
import { getAllTeam } from "@/lib/action/master/team/getAllTeam";
import { fetchAllSalesOrder } from "@/lib/action/sales/salesOrder";
import { SalesOrder } from '@/lib/validations/sales-order';
import { OrderStatus } from '@/types/salesOrder';
import { cn } from '@/lib/utils';

// Tipe data
interface StatsCard {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    gradient: string;
    description: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

interface Team {
    id: string;
    namaTeam: string;
    deskripsi: string;
    karyawan: TeamKaryawan[];
    createdAt: string;
    updatedAt: string;
}

interface TeamKaryawan {
    id: string;
    karyawanId: string;
    teamId: string;
    karyawan: KaryawanDetail;
}

interface KaryawanDetail {
    id: string;
    namaLengkap: string;
    departemen: string;
}

interface ApiResponse<T> {
    data?: T;
    count?: number;
    success?: boolean;
    message?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const ENDPOINTS = {
    customerCount: `${API_BASE}/api/master/customer/getCustomerCount`,
    customerList: `${API_BASE}/api/master/customer/getAllCustomers`,
    productCount: `${API_BASE}/api/master/product/getProductCount`,
    salesOrderCount: `${API_BASE}/api/salesOrder/getSalesOrderCount`,
    recentSalesOrders: `${API_BASE}/api/salesOrder/getRecentSalesOrders?take=10&order=desc`,
};



const fallbackStatsData: StatsCard[] = [
    {
        title: "Total Produk",
        value: 0,
        icon: <Package className="h-5 w-5" />,
        color: "from-blue-500 to-cyan-500",
        gradient: "bg-gradient-to-br from-blue-500/20 via-blue-400/10 to-transparent",
        description: "Produk aktif di sistem",
        trend: { value: 12, isPositive: true }
    },
    {
        title: "Total Customer",
        value: 0,
        icon: <Users className="h-5 w-5" />,
        color: "from-emerald-500 to-teal-500",
        gradient: "bg-gradient-to-br from-emerald-500/20 via-emerald-400/10 to-transparent",
        description: "Customer terdaftar",
        trend: { value: 5, isPositive: true }
    },
    {
        title: "Total SPK",
        value: 0,
        icon: <FileText className="h-5 w-5" />,
        color: "from-violet-500 to-purple-500",
        gradient: "bg-gradient-to-br from-violet-500/20 via-violet-400/10 to-transparent",
        description: "Surat Perintah Kerja",
        trend: { value: 3, isPositive: false }
    },
    {
        title: "Sales Order",
        value: 0,
        icon: <ShoppingCart className="h-5 w-5" />,
        color: "from-amber-500 to-orange-500",
        gradient: "bg-gradient-to-br from-amber-500/20 via-amber-400/10 to-transparent",
        description: "Order aktif",
        trend: { value: 8, isPositive: true }
    }
];

export default function PICDashboard({ role }: { role: string }) {
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [activeTable, setActiveTable] = useState<'sales' | 'spk'>('sales');
    const [statsData, setStatsData] = useState<StatsCard[]>(fallbackStatsData);
    const [spkData, setSpkData] = useState<SPK[]>([]);
    const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [teamData, setTeamData] = useState<Team[]>([]);
    const [activeMetric, setActiveMetric] = useState('today');

    const metrics = [
        { id: 'today', label: 'Hari Ini', value: '24', change: '+12%', icon: <Sun className="h-4 w-4" /> },
        { id: 'week', label: 'Minggu Ini', value: '156', change: '+8%', icon: <Calendar className="h-4 w-4" /> },
        { id: 'month', label: 'Bulan Ini', value: '892', change: '+23%', icon: <TrendingUp className="h-4 w-4" /> },
        { id: 'quarter', label: 'Kuartal', value: '3,450', change: '+15%', icon: <BarChart3 className="h-4 w-4" /> },
    ];

    const fetchRecentSPK = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/spk/getAllSPK`);
            if (!response.ok) throw new Error('Failed to fetch SPK data');
            const data = await response.json();
            setSpkData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error fetching SPK:', err);
        }
    };

    const fetchTeam = async () => {
        try {
            const resTeam = await getAllTeam();
            if (!resTeam?.success) throw new Error('Failed to fetch team data');
            if (!resTeam.data) throw new Error('No team data received');
            setTeamData(resTeam.data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching team data';
            setError(errorMessage);
            console.error('Error Fetching Team:', err);
        }
    };

    const fetchDashboardData = async () => {
        try {
            const [
                customerCountRes,
                productCountRes,
                salesOrderCountRes,
                recentSalesOrdersRes
            ] = await Promise.all([
                fetch(ENDPOINTS.customerCount),
                fetch(ENDPOINTS.productCount),
                fetch(ENDPOINTS.salesOrderCount),
                fetch(ENDPOINTS.recentSalesOrders)
            ]);

            if (!customerCountRes.ok || !productCountRes.ok || !salesOrderCountRes.ok || !recentSalesOrdersRes.ok) {
                throw new Error('Failed to fetch data from one or more endpoints');
            }

            const customerCountData: ApiResponse<{ count: number }> = await customerCountRes.json();
            const productCountData: ApiResponse<{ count: number }> = await productCountRes.json();
            const salesOrderCountData: ApiResponse<{ count: number }> = await salesOrderCountRes.json();

            const customerCount = customerCountData.count || customerCountData.data?.count || 0;
            const productCount = productCountData.count || productCountData.data?.count || 0;
            const salesOrderCount = salesOrderCountData.count || salesOrderCountData.data?.count || 0;

            const updatedStatsData: StatsCard[] = [
                {
                    title: "Total Produk",
                    value: productCount,
                    icon: <Package className="h-5 w-5" />,
                    color: "from-blue-500 to-cyan-500",
                    gradient: "bg-gradient-to-br from-blue-500/20 via-blue-400/10 to-transparent",
                    description: "Produk aktif di sistem",
                    trend: { value: 12, isPositive: true }
                },
                {
                    title: "Total Customer",
                    value: customerCount,
                    icon: <Users className="h-5 w-5" />,
                    color: "from-emerald-500 to-teal-500",
                    gradient: "bg-gradient-to-br from-emerald-500/20 via-emerald-400/10 to-transparent",
                    description: "Customer terdaftar",
                    trend: { value: 5, isPositive: true }
                },
                {
                    title: "Total SPK",
                    value: 18,
                    icon: <FileText className="h-5 w-5" />,
                    color: "from-violet-500 to-purple-500",
                    gradient: "bg-gradient-to-br from-violet-500/20 via-violet-400/10 to-transparent",
                    description: "Surat Perintah Kerja",
                    trend: { value: 3, isPositive: false }
                },
                {
                    title: "Sales Order",
                    value: salesOrderCount,
                    icon: <ShoppingCart className="h-5 w-5" />,
                    color: "from-amber-500 to-orange-500",
                    gradient: "bg-gradient-to-br from-amber-500/20 via-amber-400/10 to-transparent",
                    description: "Order aktif",
                    trend: { value: 8, isPositive: true }
                },
            ];

            setStatsData(updatedStatsData);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setStatsData(fallbackStatsData);
        }
    };

    useEffect(() => {
        const loadAllData = async () => {
            try {
                setIsInitialLoad(true);
                setIsLoading(true);

                const response = await fetchAllSalesOrder(1, 10, "", "");
                const orders = response.data || [];
                setSalesOrders(orders);

                await Promise.all([
                    fetchDashboardData(),
                    fetchRecentSPK(),
                    fetchTeam()
                ]);

            } catch (error) {
                console.error('Error loading dashboard data:', error);
                setError('Failed to load dashboard data');
            } finally {
                setTimeout(() => {
                    setIsLoading(false);
                    setIsInitialLoad(false);
                }, 500);
            }
        };

        loadAllData();
    }, []);

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50/90 via-gray-100/50 to-blue-50/30 dark:from-gray-900/95 dark:via-gray-800/50 dark:to-blue-900/20 flex items-center justify-center p-4">
                <Card className="max-w-md w-full border-none shadow-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg">
                    <CardContent className="p-8 text-center">
                        <AlertCircle className="h-16 w-16 text-rose-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Terjadi Kesalahan</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                        <Button
                            className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg"
                            onClick={() => window.location.reload()}
                        >
                            <RefreshCw className="h-4 w-4" />
                            Coba Lagi
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const shortcuts = [
        {
            title: "Kelola Produk",
            icon: <Package className="h-5 w-5" />,
            href: "/pic-area/master/products",
            gradient: "bg-gradient-to-br from-blue-500 to-cyan-500",
            iconColor: "text-blue-500",
            iconBg: "from-blue-500/10 to-blue-600/5"
        },
        {
            title: "Kelola Customer",
            icon: <Users className="h-5 w-5" />,
            href: "/pic-area/master/customers",
            gradient: "bg-gradient-to-br from-emerald-500 to-teal-500",
            iconColor: "text-emerald-500",
            iconBg: "from-emerald-500/10 to-emerald-600/5"
        },
        {
            title: "Buat Sales Order",
            icon: <ShoppingCart className="h-5 w-5" />,
            href: "/pic-area/sales/salesOrder",
            gradient: "bg-gradient-to-br from-green-500 to-lime-500",
            iconColor: "text-green-500",
            iconBg: "from-green-500/10 to-green-600/5"
        },
        {
            title: "Buat PR",
            icon: <FileText className="h-5 w-5" />,
            href: "/pic-area/logistic/pr",
            gradient: "bg-gradient-to-br from-violet-500 to-purple-500",
            iconColor: "text-violet-500",
            iconBg: "from-violet-500/10 to-violet-600/5"
        },
        {
            title: "Kelola SPK",
            icon: <Briefcase className="h-5 w-5" />,
            href: "/pic-area/logistic/spk",
            gradient: "bg-gradient-to-br from-amber-500 to-orange-500",
            iconColor: "text-amber-500",
            iconBg: "from-amber-500/10 to-amber-600/5"
        },
        {
            title: "Laporan SPK",
            icon: <ChartBarIncreasing className="h-5 w-5" />,
            href: "/pic-area/logistic/spkReport",
            gradient: "bg-gradient-to-br from-rose-500 to-pink-500",
            iconColor: "text-rose-500",
            iconBg: "from-rose-500/10 to-rose-600/5"
        },
    ];

    const inventoryShortcuts = [
        {
            title: "Inventory",
            icon: <LayoutDashboard className="h-5 w-5" />,
            href: "/pic-area/inventory/dashboard",
            gradient: "bg-gradient-to-br from-indigo-500 to-blue-500",
            iconColor: "text-indigo-500",
            iconBg: "from-indigo-500/10 to-indigo-600/5"
        },
        {
            title: "Stock Opname",
            icon: <ClipboardList className="h-5 w-5" />,
            href: "/pic-area/inventory/stock-opname",
            gradient: "bg-gradient-to-br from-amber-500 to-yellow-500",
            iconColor: "text-amber-500",
            iconBg: "from-amber-500/10 to-amber-600/5"
        },
        {
            title: "Goods Receipt",
            icon: <Truck className="h-5 w-5" />,
            href: "/pic-area/inventory/goods-receipt",
            gradient: "bg-gradient-to-br from-teal-500 to-emerald-500",
            iconColor: "text-teal-500",
            iconBg: "from-teal-500/10 to-teal-600/5"
        },
        {
            title: "Stock Transfer",
            icon: <ArrowRightLeft className="h-5 w-5" />,
            href: "/pic-area/inventory/transfer",
            gradient: "bg-gradient-to-br from-violet-500 to-purple-500",
            iconColor: "text-violet-500",
            iconBg: "from-violet-500/10 to-violet-600/5"
        },
        {
            title: "Warehouse",
            icon: <Warehouse className="h-5 w-5" />,
            href: "/pic-area/inventory/wh",
            gradient: "bg-gradient-to-br from-slate-600 to-gray-600",
            iconColor: "text-slate-600",
            iconBg: "from-slate-500/10 to-slate-600/5"
        },
    ];

    const StatsCardSkeleton = () => (
        <div className="h-full">
            <Card className="relative overflow-hidden bg-gradient-to-br from-white/40 to-white/20 dark:from-gray-900/40 dark:to-gray-800/20 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 shadow-soft group animate-pulse h-full">
                <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                        <Skeleton className="h-8 w-8 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                        <Skeleton className="h-5 w-14 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                    </div>
                    <div className="mt-2">
                        <Skeleton className="h-6 w-20 mb-1 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                        <Skeleton className="h-3 w-28 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const StatsCard = ({ title, value, icon, color, gradient, description, trend }: StatsCard) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="h-full"
        >
            <Card className="relative overflow-hidden bg-gradient-to-br from-white/50 to-white/30 dark:from-gray-900/50 dark:to-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 shadow-soft hover:shadow-xl transition-all duration-300 group h-full">
                {/* Animated gradient background */}
                <div className={`absolute inset-0 ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-700" />

                {/* Animated border */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <CardContent className="relative p-3">
                    <div className="flex items-start justify-between">
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${color} shadow-lg backdrop-blur-sm`}>
                            {icon}
                        </div>
                        {trend && (
                            <Badge
                                variant="outline"
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-lg ${trend.isPositive
                                    ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/10 text-green-700 dark:text-green-300 border-green-500/30'
                                    : 'bg-gradient-to-r from-rose-500/20 to-red-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'}`}
                            >
                                {trend.isPositive ? '↑' : '↓'} {trend.value}%
                            </Badge>
                        )}
                    </div>

                    <div className="mt-2 space-y-1">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                            {value.toLocaleString()}
                        </h3>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{title}</p>
                        <p className="text-[10px] text-gray-600/80 dark:text-gray-400/80 leading-tight">{description}</p>
                    </div>

                    {/* Bottom accent line */}
                    <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-transparent via-gray-300/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </CardContent>
            </Card>
        </motion.div>
    );

    const MetricSelector = () => (
        <div className="flex items-center gap-1 bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl rounded-xl p-1 border border-white/30 dark:border-gray-700/30 shadow-soft">
            {metrics.map((metric) => (
                <button
                    key={metric.id}
                    onClick={() => setActiveMetric(metric.id)}
                    className={cn(
                        "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2",
                        activeMetric === metric.id
                            ? 'bg-white dark:bg-gray-800 shadow-lg text-blue-600 dark:text-blue-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/20 dark:hover:bg-gray-800/20'
                    )}
                >
                    <span className="hidden sm:inline">{metric.icon}</span>
                    <span>{metric.label}</span>
                </button>
            ))}
        </div>
    );

    const ShortcutCard = ({ title, icon, href, gradient, iconColor, iconBg }: any) => (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="relative group"
        >
            <a href={href}>
                <Card className="relative overflow-hidden bg-gradient-to-br from-white/40 to-white/20 dark:from-gray-900/40 dark:to-gray-800/20 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 h-28 hover:shadow-xl transition-all duration-300">
                    {/* Hover gradient overlay */}
                    <div className={`absolute inset-0 ${gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />

                    {/* Corner accent */}
                    <div className={`absolute top-0 right-0 w-6 h-6 ${gradient} opacity-0 group-hover:opacity-30 rounded-bl-2xl transition-all duration-500`} />

                    <CardContent className="relative p-4 h-full flex flex-col items-center justify-center gap-3">
                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${iconBg} shadow-sm`}>
                            <div className={iconColor}>
                                {icon}
                            </div>
                        </div>
                        <span className="font-semibold text-xs text-center text-gray-800 dark:text-gray-200 leading-tight">
                            {title}
                        </span>
                    </CardContent>
                </Card>
            </a>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50/90 via-gray-100/50 to-blue-50/30 dark:from-gray-900/95 dark:via-gray-800/50 dark:to-blue-900/20">
            {/* Animated background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute -bottom-40 left-1/2 transform -translate-x-1/2 w-80 h-80 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl animate-pulse delay-500" />
            </div>

            <main className="relative px-4 sm:px-6 lg:px-8 py-6 w-full max-w-full mx-auto space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-4 sm:p-6 bg-gradient-to-r from-white/40 to-white/20 dark:from-gray-900/40 dark:to-gray-800/20 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-soft"
                >
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                                <Home className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                                    PIC Dashboard
                                </h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Selamat datang! Pantau operasional Anda secara real-time
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="rounded-full px-3 py-1.5 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm border-white/30 dark:border-gray-700/30">
                                <Activity className="h-3 w-3 mr-2 text-green-500" />
                                <span className="text-xs">System Active</span>
                            </Badge>
                            <Badge variant="outline" className="rounded-full px-3 py-1.5 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm border-white/30 dark:border-gray-700/30">
                                <Server className="h-3 w-3 mr-2 text-blue-500" />
                                <span className="text-xs">Sync: 5 min ago</span>
                            </Badge>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 mt-4 lg:mt-0">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 sm:gap-2 rounded-xl bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm border-white/30 dark:border-gray-700/30"
                        >
                            <History className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Activity Log</span>
                        </Button>
                        <Button
                            size="sm"
                            className="gap-1.5 sm:gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg"
                        >
                            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Create Report</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm"
                        >
                            <Settings className="h-4 w-4" />
                        </Button>
                    </div>
                </motion.div>

                {/* Performance Metrics */}
                {/* <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-4 sm:p-6 bg-gradient-to-r from-white/40 to-white/20 dark:from-gray-900/40 dark:to-gray-800/20 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-soft"
                >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5">
                                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Performance Overview</h2>
                        </div>
                        <MetricSelector />
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {metrics.map((metric) => (
                            <Card
                                key={metric.id}
                                className="border-white/30 dark:border-gray-700/30 bg-gradient-to-br from-white/30 to-white/10 dark:from-gray-900/30 dark:to-gray-800/10 backdrop-blur-sm"
                            >
                                <CardContent className="p-3 sm:p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1 rounded-lg bg-white/30 dark:bg-gray-800/30">
                                                {metric.icon}
                                            </div>
                                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{metric.label}</span>
                                        </div>
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${metric.change.startsWith('+')
                                            ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/10 text-green-700 dark:text-green-300'
                                            : 'bg-gradient-to-r from-rose-500/20 to-red-500/10 text-rose-700 dark:text-rose-300'
                                            }`}>
                                            {metric.change}
                                        </span>
                                    </div>
                                    <p className="text-xl sm:text-2xl font-bold mt-2 text-gray-900 dark:text-gray-100">{metric.value}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </motion.div> */}

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {(isLoading && isInitialLoad)
                        ? Array.from({ length: 4 }).map((_, i) => (
                            <StatsCardSkeleton key={i} />
                        ))
                        : statsData.map((stat, i) => (
                            <StatsCard key={i} {...stat} />
                        ))}
                </div>

                {/* Quick Actions Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4 sm:space-y-6"
                >
                    <div className="flex items-center justify-between p-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/5">
                                <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Master & Transaction</h2>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 dark:text-gray-400"
                        >
                            <span className="hidden sm:inline">View All</span>
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                        {shortcuts.map((shortcut, index) => (
                            <ShortcutCard key={index} {...shortcut} />
                        ))}
                    </div>
                </motion.div>

                {/* Inventory Management */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-4 sm:space-y-6"
                >
                    <div className="flex items-center justify-between p-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/10 to-blue-500/5">
                                <Warehouse className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Inventory Management</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                        {inventoryShortcuts.map((shortcut, index) => (
                            <ShortcutCard key={index} {...shortcut} />
                        ))}
                    </div>
                </motion.div>

                {/* Data Monitoring */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-4 sm:space-y-6"
                >
                    <div className="p-4 sm:p-6 bg-gradient-to-r from-white/40 to-white/20 dark:from-gray-900/40 dark:to-gray-800/20 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-soft">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5">
                                    <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Data Monitoring</h2>
                            </div>

                            <Tabs
                                value={activeTable}
                                onValueChange={(value) => setActiveTable(value as 'sales' | 'spk')}
                                className="w-full"
                            >
                                <TabsList className="w-full h-auto bg-gray-100/50 dark:bg-gray-800/50 p-1.5 rounded-2xl grid grid-cols-2 gap-2 border border-gray-200/50 dark:border-gray-700/50">
                                    <TabsTrigger
                                        value="sales"
                                        className={cn(
                                            "relative flex items-center justify-center gap-3 py-3 rounded-xl transition-all duration-300 outline-none ring-0 data-[state=active]:bg-blue-600 data-[state=active]:text-white",
                                            activeTable === 'sales'
                                                ? "shadow-lg shadow-blue-500/25 ring-2 ring-blue-500/20"
                                                : "hover:bg-white/60 dark:hover:bg-gray-700/60 text-gray-500 dark:text-gray-400"
                                        )}
                                    >
                                        <ShoppingCart className={cn("h-5 w-5", activeTable === 'sales' ? "text-white" : "text-current")} />
                                        <div className="flex flex-col items-start text-left">
                                            <span className="text-sm font-bold leading-tight">Sales Order</span>
                                            <span className={cn("text-[10px] font-medium leading-tight mt-0.5", activeTable === 'sales' ? "text-blue-100" : "text-gray-400 dark:text-gray-500")}>
                                                {salesOrders.length} Order Active
                                            </span>
                                        </div>
                                    </TabsTrigger>

                                    <TabsTrigger
                                        value="spk"
                                        className={cn(
                                            "relative flex items-center justify-center gap-3 py-3 rounded-xl transition-all duration-300 outline-none ring-0 data-[state=active]:bg-violet-600 data-[state=active]:text-white",
                                            activeTable === 'spk'
                                                ? "shadow-lg shadow-violet-500/25 ring-2 ring-violet-500/20"
                                                : "hover:bg-white/60 dark:hover:bg-gray-700/60 text-gray-500 dark:text-gray-400"
                                        )}
                                    >
                                        <FileText className={cn("h-5 w-5", activeTable === 'spk' ? "text-white" : "text-current")} />
                                        <div className="flex flex-col items-start text-left">
                                            <span className="text-sm font-bold leading-tight">SPK</span>
                                            <span className={cn("text-[10px] font-medium leading-tight mt-0.5", activeTable === 'spk' ? "text-violet-100" : "text-gray-400 dark:text-gray-500")}>
                                                {spkData.length} Document Active
                                            </span>
                                        </div>
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTable}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/30 dark:border-gray-700/30 overflow-hidden"
                            >
                                {activeTable === 'sales' ? (
                                    <DashboardSalesOrderTable
                                        salesOrders={salesOrders}
                                        isLoading={isLoading}
                                        role="user"
                                        showViewAllButton={true}
                                    />
                                ) : (
                                    <DashboardSpkTable
                                        dataSpk={spkData}
                                        isLoading={isLoading}
                                        isDashboard={true}
                                        role="admin"
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Team Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    className="p-4 sm:p-6 bg-gradient-to-r from-white/40 to-white/20 dark:from-gray-900/40 dark:to-gray-800/20 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-soft"
                >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5">
                                <UsersIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Team & Personnel</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Kelola anggota tim dan penugasan</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 rounded-xl bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm border-white/30 dark:border-gray-700/30"
                        >
                            <UserPlus className="h-4 w-4" />
                            <span className="hidden sm:inline">Add Member</span>
                        </Button>
                    </div>

                    <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/30 dark:border-gray-700/30 overflow-hidden">
                        <DashboardTeamTable
                            teams={teamData}
                            role={role}
                            isLoading={isLoading}
                        />
                    </div>
                </motion.div>

                {/* Footer Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6"
                >
                    <Card className="border-white/30 dark:border-gray-700/30 bg-gradient-to-br from-blue-500/5 via-blue-400/3 to-transparent backdrop-blur-sm">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Projects</p>
                                    <p className="text-xl sm:text-2xl font-bold mt-2 text-gray-900 dark:text-gray-100">12</p>
                                </div>
                                <Target className="h-7 w-7 sm:h-8 sm:w-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-white/30 dark:border-gray-700/30 bg-gradient-to-br from-emerald-500/5 via-emerald-400/3 to-transparent backdrop-blur-sm">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</p>
                                    <p className="text-xl sm:text-2xl font-bold mt-2 text-gray-900 dark:text-gray-100">89%</p>
                                </div>
                                <TrendingUp className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-white/30 dark:border-gray-700/30 bg-gradient-to-br from-amber-500/5 via-amber-400/3 to-transparent backdrop-blur-sm">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Pending Tasks</p>
                                    <p className="text-xl sm:text-2xl font-bold mt-2 text-gray-900 dark:text-gray-100">7</p>
                                </div>
                                <Clock className="h-7 w-7 sm:h-8 sm:w-8 text-amber-500" />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </main>
        </div>
    );
}