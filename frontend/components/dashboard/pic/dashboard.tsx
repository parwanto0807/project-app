'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
    Package,
    Users,
    FileText,
    ShoppingCart,
    Plus,
    ChevronRight,
    ChartBarIncreasingIcon,
} from 'lucide-react';
import DashboardTeamTable from './teamTableDashboard';
import { DashboardSalesOrderTable } from './tableDataSO';
import { SPK } from '@/types/spkReport';
import DashboardSpkTable from './tableDataSPK';
import { getAllTeam } from "@/lib/action/master/team/getAllTeam";
import { SalesOrder } from '@/lib/validations/sales-order';
import { OrderStatus } from '@/types/salesOrder';

// Tipe data
interface StatsCard {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
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

const getSalesOrders = async (): Promise<SalesOrder[]> => {
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/salesOrder/sales-orders`,
            {
                credentials: "include",
                cache: "no-store",
            }
        );

        if (!res.ok) throw new Error("Failed to fetch sales orders");

        const data = await res.json();
        const allowedStatuses: OrderStatus[] = [
            "DRAFT",
            "CONFIRMED",
            "IN_PROGRESS_SPK",
            "FULFILLED",
            "BAST",
        ];

        const orders: SalesOrder[] = Array.isArray(data) ? data : data.salesOrders ?? [];
        const filteredOrders = orders.filter((order: SalesOrder) =>
            allowedStatuses.includes(order.status)
        );

        return filteredOrders;
    } catch (error) {
        console.error("Error fetching sales orders:", error);
        return [];
    }
};

// Data fallback untuk stats
const fallbackStatsData: StatsCard[] = [
    {
        title: "Total Produk",
        value: 0,
        icon: <Package className="h-5 w-5" />,
        color: "from-blue-500 to-blue-600",
        description: "Produk aktif",
        trend: { value: 0, isPositive: true }
    },
    {
        title: "Total Customer",
        value: 0,
        icon: <Users className="h-5 w-5" />,
        color: "from-green-500 to-green-600",
        description: "Customer terdaftar",
        trend: { value: 0, isPositive: true }
    },
    {
        title: "Total SPK",
        value: 0,
        icon: <FileText className="h-5 w-5" />,
        color: "from-purple-500 to-purple-600",
        description: "Surat Perintah Kerja",
        trend: { value: 0, isPositive: false }
    },
    {
        title: "Sales Order",
        value: 0,
        icon: <ShoppingCart className="h-5 w-5" />,
        color: "from-orange-500 to-orange-600",
        description: "Order aktif",
        trend: { value: 0, isPositive: true }
    }
];

export default function PICDashboard({ role }: { role: string }) {
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialLoad, setIsInitialLoad] = useState(true); // Tambahkan state untuk initial load
    const [activeTable, setActiveTable] = useState<'sales' | 'spk'>('sales');
    const [statsData, setStatsData] = useState<StatsCard[]>([]);
    const [spkData, setSpkData] = useState<SPK[]>([]);
    const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]); // Pindah ke state
    const [error, setError] = useState<string | null>(null);
    const [teamData, setTeamData] = useState<Team[]>([]);
    const user = { role };

    // Inisialisasi data stats dari awal untuk menghindari flash
    useEffect(() => {
        setStatsData(fallbackStatsData);
    }, []);

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
                    color: "from-blue-500 to-blue-600",
                    description: "Produk aktif",
                    trend: { value: 12, isPositive: true }
                },
                {
                    title: "Total Customer",
                    value: customerCount,
                    icon: <Users className="h-5 w-5" />,
                    color: "from-green-500 to-green-600",
                    description: "Customer terdaftar",
                    trend: { value: 5, isPositive: true }
                },
                {
                    title: "Total SPK",
                    value: 18,
                    icon: <FileText className="h-5 w-5" />,
                    color: "from-purple-500 to-purple-600",
                    description: "Surat Perintah Kerja",
                    trend: { value: 3, isPositive: false }
                },
                {
                    title: "Sales Order",
                    value: salesOrderCount,
                    icon: <ShoppingCart className="h-5 w-5" />,
                    color: "from-orange-500 to-orange-600",
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

    // Load semua data sekaligus
    useEffect(() => {
        const loadAllData = async () => {
            try {
                setIsInitialLoad(true);
                setIsLoading(true);

                // Load sales orders terlebih dahulu
                const orders = await getSalesOrders();
                setSalesOrders(orders);

                // Kemudian load data lainnya secara paralel
                await Promise.all([
                    fetchDashboardData(),
                    fetchRecentSPK(),
                    fetchTeam()
                ]);

            } catch (error) {
                console.error('Error loading dashboard data:', error);
                setError('Failed to load dashboard data');
            } finally {
                // Tambahkan delay minimal untuk menghindari flash
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
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-red-600">Error: {error}</div>
            </div>
        );
    }

    const shortcuts = [
        {
            title: "Kelola Produk",
            icon: <Package className="h-5 w-5" />,
            href: "/pic-area/master/products",
            color: "from-blue-500 to-cyan-600",
            bgColor: "bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-950/20 dark:to-cyan-950/20"
        },
        {
            title: "Kelola Customer",
            icon: <Users className="h-5 w-5" />,
            href: "/pic-area/master/customers",
            color: "from-orange-500 to-amber-600",
            bgColor: "bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950/20 dark:to-amber-950/20"
        },
        {
            title: "Kelola Sales Order",
            icon: <Plus className="h-5 w-5" />,
            href: "/pic-area/sales/salesOrder",
            color: "from-green-500 to-emerald-600",
            bgColor: "bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/20 dark:to-emerald-950/20"
        },
        {
            title: "Kelola Purchase Request",
            icon: <Plus className="h-5 w-5" />,
            href: "/pic-area/logistic/pr",
            color: "from-yellow-500 to-green-600",
            bgColor: "bg-gradient-to-br from-yellow-50 to-green-100 dark:from-yellow-950/20 dark:to-green-950/20"
        },
        {
            title: "Kelola SPK",
            icon: <FileText className="h-5 w-5" />,
            href: "/pic-area/logistic/spk",
            color: "from-purple-500 to-indigo-600",
            bgColor: "bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-950/20 dark:to-indigo-950/20"
        },
        {
            title: "Progress SPK",
            icon: <ChartBarIncreasingIcon className="h-5 w-5" />,
            href: "/pic-area/logistic/spkReport",
            color: "from-yellow-500 to-red-600",
            bgColor: "bg-gradient-to-br from-red-50 to-brown-100 dark:from-red-950/20 dark:to-blue-950/20"
        },
    ];

    // Komponen skeleton yang lebih smooth
    const StatsCardSkeleton = () => (
        <div className="w-full h-[150px] sm:h-[160px]">
            <Card className="overflow-hidden relative bg-gradient-to-br from-muted/50 to-muted/30 border-0 shadow-lg w-full h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                    <div className="flex flex-col h-[80px] sm:h-[70px] justify-between">
                        <div>
                            <Skeleton className="h-6 w-16 mb-2" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-3 w-3 rounded-full" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    // Komponen StatsCard dengan animasi yang lebih konsisten
    const StatsCard = ({ title, value, icon, color, description, trend }: StatsCard) => (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                duration: 0.5,
                type: "spring",
                stiffness: 100
            }}
            whileHover={{
                y: -4,
                scale: 1.01,
                transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer w-full h-[150px] sm:h-[160px]"
        >
            <Card className="overflow-hidden relative border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 group w-full h-full flex flex-col">
                <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 px-4 pt-0">
                    <motion.div
                        className={`p-2 rounded-xl bg-gradient-to-br ${color} text-white shadow-md`}
                        whileHover={{ rotate: 5, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        {icon}
                    </motion.div>

                    {trend && (
                        <Badge
                            variant={trend.isPositive ? "default" : "destructive"}
                            className="text-xs font-medium px-2 py-0.5 h-auto"
                        >
                            {trend.isPositive ? '+' : ''}{trend.value}%
                        </Badge>
                    )}
                </CardHeader>

                <CardContent className="px-4 pb-0 pt-0 flex-grow flex flex-col justify-between">
                    <div className='flex flex-row gap-4'>
                        <motion.div
                            className="text-xl font-bold tabular-nums text-foreground leading-tight"
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            {value.toLocaleString()}
                        </motion.div>
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-tight">
                            {description}
                        </p>
                    </div>

                    <motion.div
                        className="flex items-center justify-between mt-1 pt-0 border-t border-border/30"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <span className="text-xs font-semibold text-foreground truncate">
                            {title}
                        </span>
                        <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-0.5 transition-all duration-300" />
                    </motion.div>
                </CardContent>
            </Card>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 w-full">
            <main className="w-full px-2 sm:px-4 py-4">
                {/* Stats Cards */}
                <motion.div
                    layout
                    className="w-full mb-6"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
                        {(isLoading && isInitialLoad)
                            ? Array.from({ length: 4 }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="w-full"
                                >
                                    <StatsCardSkeleton />
                                </motion.div>
                            ))
                            : statsData.map((stat, i) => (
                                <motion.div
                                    key={i}
                                    className="w-full"
                                >
                                    <StatsCard {...stat} />
                                </motion.div>
                            ))}
                    </div>
                </motion.div>

                {/* Shortcuts Grid */}
                <motion.div
                    layout
                    className="grid grid-cols-2 md:grid-cols-6 gap-3 sm:gap-4 mb-8 w-full"
                >
                    {shortcuts.map((shortcut, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{
                                delay: 0.3 + index * 0.1,
                                type: "spring",
                                stiffness: 100
                            }}
                            whileHover={{
                                y: -6,
                                scale: 1.05,
                                transition: { type: "spring", stiffness: 400 }
                            }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full"
                        >
                            <Button
                                variant="outline"
                                className={`h-24 flex flex-col gap-3 ${shortcut.bgColor} border-0 shadow-lg hover:shadow-xl relative overflow-hidden group w-full`}
                                asChild
                            >
                                <a href={shortcut.href}>
                                    <div className={`absolute inset-0 bg-gradient-to-br ${shortcut.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                                    <motion.div
                                        className={`p-3 rounded-xl bg-gradient-to-br ${shortcut.color} text-white shadow-lg relative z-10`}
                                        whileHover={{ rotate: 12, scale: 1.1 }}
                                        transition={{ type: "spring", stiffness: 300 }}
                                    >
                                        {shortcut.icon}
                                    </motion.div>
                                    <span className="font-semibold text-sm relative z-10">{shortcut.title}</span>

                                    <ChevronRight className="h-4 w-4 absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-0 -translate-x-1 transition-all duration-300" />
                                </a>
                            </Button>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Main Content */}
                <div className="space-y-6 w-full">
                    {/* Table Tabs */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                            delay: 0.4,
                            duration: 0.5
                        }}
                        className="w-full flex justify-center"
                    >
                        <div className="inline-flex rounded-2xl bg-muted/50 p-1 border border-border/50 shadow-lg">
                            <motion.button
                                className={`px-6 sm:px-8 py-3 not-[]:rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${activeTable === 'sales'
                                    ? 'bg-cyan-300 dark:bg-cyan-800 rounded-lg shadow-lg text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                onClick={() => setActiveTable('sales')}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <ShoppingCart className="h-4 w-4" />
                                Sales Order
                            </motion.button>
                            <motion.button
                                className={`px-6 sm:px-8 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${activeTable === 'spk'
                                    ? 'bg-cyan-300 dark:bg-cyan-800 rounded-lg shadow-lg text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                onClick={() => setActiveTable('spk')}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <FileText className="h-4 w-4" />
                                SPK
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Animated Table Container */}
                    <motion.div
                        key={activeTable}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                            duration: 0.4,
                            type: "spring",
                            stiffness: 200
                        }}
                        className="w-full"
                    >
                        <AnimatePresence mode="wait">
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
                        </AnimatePresence>
                    </motion.div>

                    {/* Team Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                            delay: 0.6,
                            duration: 0.5
                        }}
                        className="w-full"
                    >
                        <DashboardTeamTable
                            teams={teamData}
                            role={user.role}
                            isLoading={isLoading}
                        />
                    </motion.div>
                </div>
            </main>
        </div>
    );
}