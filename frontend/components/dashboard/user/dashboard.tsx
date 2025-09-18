"use client";

import { useEffect, useState } from "react";
import { Easing, motion } from "framer-motion";
import {
    FileText,
    BarChart2,
    Loader2,
    // Home,
    // User,
    // Settings,
    Briefcase,
    ChevronRight,
    Plus,
    BarChart3,
    Download,
    Eye
} from "lucide-react";
import { useRouter } from "next/navigation";
import BottomNavigation from "@/components/admin-panel/bottom-mobile";

const DashboardUserSPK = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [activeMenu, setActiveMenu] = useState("home");
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1200);
        return () => clearTimeout(timer);
    }, []);

    // Animasi Card
    const cardVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                ease: "easeOut" as Easing
            }
        },
        hover: {
            scale: 1.03,
            transition: { duration: 0.2, ease: "easeOut" as Easing }
        }
    };

    // Data dummy untuk statistik
    const statsData = [
        { label: "SPK Aktif", value: "12", change: "+2" },
        { label: "Progress Hari Ini", value: "8", change: "+3" },
        { label: "Menunggu Review", value: "4", change: "-1" },
        { label: "Disetujui", value: "24", change: "+5" },
    ];

    // Data dummy untuk aktivitas terbaru
    const recentActivities = [
        { id: 1, title: "SPK-2023-0012", description: "Progress instalasi tahap 3", time: "2 jam lalu", status: "completed" },
        { id: 2, title: "SPK-2023-0008", description: "Menunggu persetujuan material", time: "5 jam lalu", status: "pending" },
        { id: 3, title: "SPK-2023-0015", description: "Progress pemeliharaan mingguan", time: "1 hari lalu", status: "in-progress" },
    ];

    // Skeleton Loading
    const SkeletonCard = () => (
        <div className="w-full h-44 bg-gray-200/30 dark:bg-gray-700/30 rounded-2xl animate-pulse shadow-sm backdrop-blur-md"></div>
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50/70 via-indigo-50/70 to-purple-50/70 dark:from-gray-900 dark:via-gray-900 dark:to-gray-850 p-6 flex flex-col items-center justify-center space-y-6">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto backdrop-blur-lg">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                    <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium text-lg">Memuat Dashboard...</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50/70 via-indigo-50/70 to-purple-50/70 dark:from-gray-900 dark:via-gray-900 dark:to-gray-850 p-5 transition-colors duration-500 pb-24 relative overflow-hidden">

            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl"></div>
                <div className="absolute top-1/3 -right-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl"></div>
            </div>

            {/* Header Dashboard — Elegant & Centered dengan Glass Effect */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-center mb-12 mt-6 relative z-10"
            >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500/90 to-purple-600/90 rounded-2xl mb-4 backdrop-blur-md border border-white/20 shadow-2xl">
                    <Briefcase className="w-9 h-9 text-white" />
                </div>
                <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Dashboard Monitoring SPK
                </h1>
                <p className="mt-3 text-sm md:text-base text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
                    Kelola dan pantau progress Surat Perintah Kerja Anda secara real-time
                </p>
            </motion.div>

            {/* Stats Cards dengan Glass Effect */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 max-w-6xl mx-auto relative z-10"
            >
                {statsData.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl p-4 border border-white/30 dark:border-gray-700/30 shadow-lg"
                    >
                        <p className="text-xs text-gray-600 dark:text-gray-300">{stat.label}</p>
                        <div className="flex items-end justify-between mt-2">
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</h3>
                            <span className={`text-xs font-semibold ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                                {stat.change}
                            </span>
                        </div>
                    </div>
                ))}
            </motion.div>

            {/* Konten Utama: Kartu Menu — Premium Glass Effect */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-6xl mx-auto relative z-10 mb-8">

                {/* Kartu 1: Buat Progress SPK */}
                <motion.div
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    className="group bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-3xl p-6 cursor-pointer border border-white/30 dark:border-gray-700/30 shadow-2xl transition-all duration-300 overflow-hidden relative"
                    onClick={() => router.push("/user-area/spkReport")}
                >
                    {/* Background accent saat hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-100/40 to-indigo-100/40 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl -z-10"></div>

                    <div className="flex flex-col items-center text-center relative z-10">
                        <div className="w-20 h-20 bg-gradient-to-r from-blue-500/90 to-blue-600/90 dark:from-blue-600/90 dark:to-blue-700/90 rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300 backdrop-blur-md border border-white/20">
                            <Plus className="w-9 h-9 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            Buat Progress
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                            Update kemajuan pekerjaan SPK secara instan
                        </p>
                        <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium mt-2">
                            <span>Mulai sekarang</span>
                            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </motion.div>

                {/* Kartu 2: Laporan Progress SPK */}
                <motion.div
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.1 }}
                    whileHover="hover"
                    className="group bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-3xl p-6 cursor-pointer border border-white/30 dark:border-gray-700/30 shadow-2xl transition-all duration-300 overflow-hidden relative"
                    onClick={() => router.push("/user-area/spkReport/progress")}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-green-100/40 to-emerald-100/40 dark:from-green-900/20 dark:to-emerald-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl -z-10"></div>

                    <div className="flex flex-col items-center text-center relative z-10">
                        <div className="w-20 h-20 bg-gradient-to-r from-green-500/90 to-emerald-600/90 dark:from-green-600/90 dark:to-emerald-700/90 rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300 backdrop-blur-md border border-white/20">
                            <BarChart3 className="w-9 h-9 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                            Laporan Progress
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                            Pantau, analisis, dan ekspor laporan SPK
                        </p>
                        <div className="flex items-center text-green-600 dark:text-green-400 text-sm font-medium mt-2">
                            <span>Lihat laporan</span>
                            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Recent Activities Section dengan Glass Effect */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-3xl p-6 border border-white/30 dark:border-gray-700/30 shadow-2xl max-w-6xl mx-auto mb-8 relative z-10"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Aktivitas Terbaru</h2>
                    <button className="text-sm text-blue-600 dark:text-blue-400 font-medium flex items-center">
                        Lihat semua <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                </div>

                <div className="space-y-4">
                    {recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-start p-4 bg-white/50 dark:bg-gray-700/50 rounded-2xl border border-white/30 dark:border-gray-600/30">
                            <div className={`rounded-full p-2 mr-4 ${activity.status === 'completed' ? 'bg-green-100/50 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                                activity.status === 'pending' ? 'bg-amber-100/50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                                    'bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                }`}>
                                {activity.status === 'completed' ? <FileText className="w-4 h-4" /> :
                                    activity.status === 'pending' ? <Loader2 className="w-4 h-4" /> :
                                        <BarChart2 className="w-4 h-4" />}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-800 dark:text-white">{activity.title}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{activity.description}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.time}</p>
                            </div>
                            <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-2">
                                <Eye className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Quick Actions dengan Glass Effect */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-3xl p-6 border border-white/30 dark:border-gray-700/30 shadow-2xl max-w-6xl mx-auto relative z-10"
            >
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Aksi Cepat</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="bg-white/70 dark:bg-gray-700/70 hover:bg-white dark:hover:bg-gray-600/70 backdrop-blur-md rounded-2xl p-4 border border-white/30 dark:border-gray-600/30 shadow-sm transition-all duration-300 group">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100/50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200/50 dark:group-hover:bg-blue-800/30 transition-colors">
                                <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-sm font-medium text-gray-800 dark:text-white">Ekspor Laporan</span>
                        </div>
                    </button>

                    <button className="bg-white/70 dark:bg-gray-700/70 hover:bg-white dark:hover:bg-gray-600/70 backdrop-blur-md rounded-2xl p-4 border border-white/30 dark:border-gray-600/30 shadow-sm transition-all duration-300 group">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-green-100/50 dark:bg-green-900/30 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-200/50 dark:group-hover:bg-green-800/30 transition-colors">
                                <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="text-sm font-medium text-gray-800 dark:text-white">Template SPK</span>
                        </div>
                    </button>

                    <button className="bg-white/70 dark:bg-gray-700/70 hover:bg-white dark:hover:bg-gray-600/70 backdrop-blur-md rounded-2xl p-4 border border-white/30 dark:border-gray-600/30 shadow-sm transition-all duration-300 group">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-purple-100/50 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mr-3 group-hover:bg-purple-200/50 dark:group-hover:bg-purple-800/30 transition-colors">
                                <BarChart2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="text-sm font-medium text-gray-800 dark:text-white">Statistik</span>
                        </div>
                    </button>
                </div>
            </motion.div>

            {/* Navigasi Bawah — Mobile Only, Stylish & Interaktif dengan Glass Effect */}
            <BottomNavigation
                activeMenu={activeMenu}
                onMenuChange={setActiveMenu}
            />

        </div>
    );
};

export default DashboardUserSPK;