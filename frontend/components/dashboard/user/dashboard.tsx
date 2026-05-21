"use client";

import { useEffect, useState, useMemo } from "react";
import { Easing, motion } from "framer-motion";
import {
    FileText,
    BarChart2,
    Loader2,
    ChevronRight,
    Plus,
    BarChart3,
    Download,
    CheckCircle,
    Clock,
    ShoppingCart,
    CalendarCheck
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// 👇 IMPOR FUNGSI API — SESUAIKAN PATHNYA
import { fetchSPKReports } from "@/lib/action/master/spk/spkReport"; // GANTI DENGAN PATH ANDA

// 👇 TIPE DATA (SALIN DARI KOMPONEN LAMA)
interface SPKDataApi {
    id: string;
    spkNumber: string;
    spkDate: Date;
    salesOrderId: string;
    teamId: string;
    createdById: string;

    createdBy: {
        id: string;
        namaLengkap: string;
        jabatan?: string | null;
        nik?: string | null;
        departemen?: string | null;
    };

    salesOrder: {
        id: string;
        soNumber: string;
        projectName: string;
        customer: {
            name: string;
            address: string;
            branch: string;
        };
        project?: {
            id: string;
            name: string;
        };
        items: {
            id: string;
            lineNo: number;
            itemType: string;
            name: string;
            description?: string | null;
            qty: number;
            uom?: string | null;
            unitPrice: number;
            discount: number;
            taxRate: number;
            lineTotal: number;
        }[];
    };

    team?: {
        id: string;
        namaTeam: string;
        teamKaryawan?: {
            teamId: string;
            karyawan?: {
                namaLengkap: string;
                email: string;
                jabatan: string;
                departemen: string;
            };
        };
    } | null;

    details: {
        id: string;
        karyawan?: {
            id: string;
            namaLengkap: string;
            jabatan: string;
            departemen: string;
            email: string;
            nik: string;
        };
        salesOrderItem?: {
            id: string;
            name: string;
            description?: string;
            qty: number;
            uom?: string | null;
        };
        lokasiUnit?: string | null;
        status?: 'PENDING' | 'DONE';
    }[];

    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface ReportHistory {
    id: string;
    spkNumber: string;
    clientName: string;
    projectName: string;
    type: 'PROGRESS' | 'FINAL';
    note: string | null;
    photos: string[];
    reportedAt: Date;
    itemName: string;
    karyawanName: string;
    soDetailId: string;
    progress: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface SPKData {
    id: string;
    spkNumber: string;
    clientName: string;
    projectName: string;
    status: 'PENDING' | 'PROGRESS' | 'COMPLETED';
    progress: number;
    deadline: string;
    assignedTo: string;
    teamName: string;
    email: string;
    items: {
        id: string;
        name: string;
        description?: string | null;
        qty: number;
        uom?: string | null;
        status: 'PENDING' | 'DONE';
        progress: number;
    }[];
}

interface FormMonitoringProgressSpkProps {
    dataSpk: SPKDataApi[];
    role: string;
    userId: string;
}

// 👇 FUNGSI MAP TO SPKDATA — DIIMPOR DARI KOMPONEN LAMA, DIPINDAHKAN KE SINI
const mapToSPKData = (raw: SPKDataApi[]): SPKData[] => {
    return raw.map(item => {
        const clientName = item.salesOrder?.customer?.name || 'Client Tidak Dikenal';
        const projectName = item.salesOrder?.project?.name || 'Project Tidak Dikenal';
        const assignedTo =
            item.team?.teamKaryawan?.karyawan?.namaLengkap ||
            item.createdBy?.namaLengkap ||
            'Tidak Ditugaskan';

        const totalDetails = item.details?.length || 0;
        const completedDetails = item.details?.filter(d => d.status === 'DONE').length || 0;
        const progress = totalDetails > 0 ? Math.round((completedDetails / totalDetails) * 100) : 0;

        const teamName = item.team?.namaTeam || 'Team belum ditentukan';
        const email = item.team?.teamKaryawan?.karyawan?.email || 'Email belum ditentukan';

        let status: 'PENDING' | 'PROGRESS' | 'COMPLETED';
        if (progress === 100) status = 'COMPLETED';
        else if (progress > 0) status = 'PROGRESS';
        else status = 'PENDING';

        const deadline = new Date(item.spkDate).toISOString();

        const items = item.salesOrder?.items?.map(itemSales => {
            const relatedDetails = item.details?.filter(detail => detail.salesOrderItem?.id === itemSales.id) || [];
            const hasDoneDetail = relatedDetails.some(detail => detail.status === 'DONE');
            const itemStatus: 'PENDING' | 'DONE' = hasDoneDetail ? 'DONE' : 'PENDING';
            const itemProgress = hasDoneDetail ? 100 : 0;

            return {
                id: itemSales.id,
                name: itemSales.name,
                description: itemSales.description || undefined,
                qty: itemSales.qty,
                uom: itemSales.uom || undefined,
                status: itemStatus,
                progress: itemProgress,
            };
        }) || [];

        return {
            id: item.id,
            spkNumber: item.spkNumber,
            clientName,
            projectName,
            email,
            status,
            teamName,
            progress,
            deadline,
            assignedTo,
            items,
        };
    });
};

// 👇 SKELETON LOADING CARD
const SkeletonCard = () => (
    <div className="w-full h-44 bg-gray-200/30 dark:bg-gray-700/30 rounded-2xl animate-pulse shadow-sm backdrop-blur-md"></div>
);

const DashboardUserSPK = ({ dataSpk, role, userId }: FormMonitoringProgressSpkProps) => {
    const [userSpk, setUserSpk] = useState<SPKData[]>([]);
    const [reports, setReports] = useState<ReportHistory[]>([]);
    const [loadingReports, setLoadingReports] = useState(true);
    const router = useRouter();
    const isQuickActionsEnabled = false;

    // Fungsi helper untuk format jarak waktu relatif dalam bahasa Indonesia
    const formatDistanceToNow = (date: Date): string => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

        const intervals: { [key: string]: number } = {
            tahun: 31536000,
            bulan: 2592000,
            minggu: 604800,
            hari: 86400,
            jam: 3600,
            menit: 60,
            detik: 1
        };

        for (const [unit, secondsPerUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsPerUnit);
            if (interval >= 1) {
                return `${interval} ${unit} lalu`;
            }
        }

        return 'baru saja';
    };

    // Map dataSpk ke userSpk
    useEffect(() => {
        if (dataSpk && dataSpk.length > 0) {
            const mapped = mapToSPKData(dataSpk);
            setUserSpk(mapped);
        } else {
            setUserSpk([]);
        }
    }, [dataSpk]);

    // Fetch reports
    useEffect(() => {
        const loadReports = async () => {
            setLoadingReports(true);
            try {
                const fetchedReports = await fetchSPKReports({
                    date: 'all',
                    status: 'all',
                    spkId: '',
                    karyawanId: role === 'admin' || role === 'super' ? '' : userId,
                });
                setReports(fetchedReports);
            } catch (error) {
                console.error("Gagal fetch reports di dashboard:", error);
                toast.error("Gagal memuat data laporan");
            } finally {
                setLoadingReports(false);
            }
        };

        loadReports();
    }, [role, userId]);

    // Hitung statistik
    const stats = useMemo(() => {
        if (!userSpk || userSpk.length === 0) {
            return {
                active: 0,
                todayProgress: 0,
                pendingReview: 0,
                approved: 0,
            };
        }

        const today = new Date().toISOString().split('T')[0];

        const active = userSpk.filter(spk => spk.status !== 'COMPLETED').length;

        const todayProgress = userSpk.filter(spk =>
            spk.items.some(item =>
                reports.some(report =>
                    report.spkNumber === spk.spkNumber &&
                    report.soDetailId === item.id &&
                    new Date(report.reportedAt).toISOString().split('T')[0] === today
                )
            )
        ).length;

        const pendingReview = reports.filter(r => r.status === 'PENDING').length;
        const approved = reports.filter(r => r.status === 'APPROVED').length;

        return { active, todayProgress, pendingReview, approved };
    }, [userSpk, reports]);

    // Format aktivitas terbaru
    const recentActivities = useMemo(() => {
        return [...reports]
            .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())
            .slice(0, 5)
            .map(report => ({
                id: report.id,
                title: report.spkNumber,
                description: report.itemName,
                progress: report.progress,
                time: formatDistanceToNow(new Date(report.reportedAt)) + ' lalu',
                status: report.status === 'APPROVED' ? 'completed' :
                    report.status === 'PENDING' ? 'pending' :
                        'in-progress',
            }));
    }, [reports]);
    (() => {})("Recent", recentActivities);

    // Data statistik untuk UI
    const statsData = [
        { label: "SPK Aktif", value: stats.active.toString(), change: "+0" },
        { label: "Progress Hari Ini", value: stats.todayProgress.toString(), change: "+0" },
        { label: "Menunggu Review", value: stats.pendingReview.toString(), change: "-0" },
        { label: "Disetujui", value: stats.approved.toString(), change: "+0" },
    ];

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

    // Tampilkan skeleton jika masih loading
    if (loadingReports) {
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
        <div className="min-h-screen bg-slate-50/50 dark:bg-gray-950/50 py-4 px-2 transition-colors duration-500 pb-24 relative overflow-hidden">

            {/* Background decorative elements - Premium Glass Look */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]"></div>
                <div className="absolute top-1/4 -right-40 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]"></div>
            </div>

            {/* Premium Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="mb-8 mt-2 px-2 relative z-10"
            >
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 dark:from-white dark:via-indigo-300 dark:to-white bg-clip-text text-transparent leading-tight">
                        Pusat Kendali
                    </h1>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-8 bg-indigo-600 rounded-full"></div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                            Manajemen Operasional
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Stats Section - Floating Glass Cards */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="grid grid-cols-2 gap-3 mb-8 max-w-4xl mx-auto relative z-10"
            >
                {statsData.map((stat, index) => (
                    <motion.div
                        key={index}
                        whileTap={{ scale: 0.98 }}
                        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[2rem] p-5 border border-white dark:border-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            {index === 0 && <FileText size={40} />}
                            {index === 1 && <BarChart3 size={40} />}
                            {index === 2 && <Clock size={40} />}
                            {index === 3 && <CheckCircle size={40} />}
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tighter">{stat.value}</h3>
                            <div className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                stat.change.startsWith('+') ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                            )}>
                                {stat.change}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Navigation Grid - Native App Style */}
            <div className="px-1 space-y-6 relative z-10 max-w-4xl mx-auto">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-400">Akses Cepat</h2>
                    <div className="h-[1px] flex-1 bg-slate-200 dark:bg-gray-800 ml-4"></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Menu Item: Buat Progress */}
                    <motion.div
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.96 }}
                        className="bg-indigo-600 rounded-[2.5rem] p-6 shadow-2xl shadow-indigo-200 dark:shadow-none relative overflow-hidden group flex flex-col items-center text-center"
                        onClick={() => router.push("/user-area/spkReport")}
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl"></div>
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/30">
                            <Plus className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-white font-bold text-lg leading-tight mb-1">Buat<br/>Progress</h3>
                        <p className="text-indigo-100/60 text-[10px] font-bold uppercase tracking-wider">Update Cepat</p>
                    </motion.div>

                    {/* Menu Item: Laporan */}
                    <motion.div
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.96 }}
                        className="bg-emerald-600 rounded-[2.5rem] p-6 shadow-2xl shadow-emerald-200 dark:shadow-none relative overflow-hidden group flex flex-col items-center text-center"
                        onClick={() => router.push("/user-area/spkReportDetail")}
                    >
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-8 -mb-8 blur-2xl"></div>
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/30">
                            <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-white font-bold text-lg leading-tight mb-1">Pantau<br/>Laporan</h3>
                        <p className="text-emerald-100/60 text-[10px] font-bold uppercase tracking-wider">Data Real-time</p>
                    </motion.div>

                    {/* Menu Item: Belanja */}
                    <motion.div
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.96 }}
                        className="bg-amber-500 rounded-[2.5rem] p-6 shadow-2xl shadow-amber-200 dark:shadow-none relative overflow-hidden group flex flex-col items-center text-center"
                        onClick={() => router.push("/user-area/purchase-execution")}
                    >
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/30">
                            <ShoppingCart className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-white font-bold text-lg leading-tight mb-1">Belanja<br/>Material</h3>
                        <p className="text-amber-100/60 text-[10px] font-bold uppercase tracking-wider">Pengadaan</p>
                    </motion.div>

                    {/* Menu Item: Absensi */}
                    <motion.div
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.96 }}
                        className="bg-violet-600 rounded-[2.5rem] p-6 shadow-2xl shadow-violet-200 dark:shadow-none relative overflow-hidden group flex flex-col items-center text-center"
                        onClick={() => router.push("/user-area/attendance")}
                    >
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/10">
                            <CalendarCheck className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-white font-bold text-lg leading-tight mb-1">Absensi<br/>Karyawan</h3>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Kehadiran Digital</p>
                    </motion.div>
                </div>

                {/* Recent Activities - Native List Style */}
                <div className="pt-4">
                    <div className="flex items-center justify-between px-2 mb-4">
                        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-400">Log Aktivitas</h2>
                        <button 
                            className="text-[10px] font-bold uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full"
                            onClick={() => router.push("/user-area/spkReportDetail")}
                        >
                            Lihat Semua
                        </button>
                    </div>

                    <div className="space-y-3">
                        {recentActivities.length > 0 ? (
                            recentActivities.map((activity, idx) => (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * idx }}
                                    key={activity.id} 
                                    className="flex items-center p-4 bg-white dark:bg-gray-900 rounded-[1.5rem] border border-slate-100 dark:border-gray-800 shadow-sm group active:bg-slate-50"
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center mr-4",
                                        activity.status === 'completed' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" :
                                        activity.status === 'pending' ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400" :
                                        "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400"
                                    )}>
                                        {activity.status === 'completed' ? <CheckCircle size={18} /> :
                                         activity.status === 'pending' ? <Clock size={18} /> :
                                         <BarChart2 size={18} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-xs font-bold text-slate-800 dark:text-white truncate uppercase tracking-tight">{activity.title}</h3>
                                            <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap ml-2">{activity.time}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-medium truncate mb-1">{activity.description}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1 flex-1 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                <div 
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-1000",
                                                        activity.status === 'completed' ? "bg-emerald-500" : "bg-indigo-500"
                                                    )}
                                                    style={{ width: `${activity.progress}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400">{activity.progress}%</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="p-8 text-center bg-white/50 dark:bg-gray-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-gray-800">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Belum Ada Aktivitas Terbaru</p>
                            </div>
                        )}
                    </div>
                </div>
                {/* Footer Credits */}
                <div className="pt-8 pb-4 text-center">
                    <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-slate-300 dark:text-gray-700">
                        Sistem Dioptimalkan untuk Pekerja Lapangan
                    </p>
                </div>

                {/* Quick Actions */}
                {!isQuickActionsEnabled && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className={cn(
                            "mt-8 p-6 bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-gray-700/30 shadow-2xl",
                            !isQuickActionsEnabled && "opacity-60 pointer-events-none select-none"
                        )}
                    >
                        <h2 className="text-base font-bold text-gray-800 dark:text-white mb-6">Aksi Cepat (Segera Hadir)</h2>

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
                )}
            </div>
        </div>
    );
};

export default DashboardUserSPK;