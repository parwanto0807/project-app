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
    Clock
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
    console.log("email");

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
    console.log("Recent", recentActivities);

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
        <div className="min-h-screen bg-gradient-to-br from-blue-50/70 via-indigo-50/70 to-purple-50/70 dark:from-gray-900 dark:via-gray-900 dark:to-gray-850 py-5 px-1 transition-colors duration-500 pb-24 relative overflow-hidden">

            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl"></div>
                <div className="absolute top-1/3 -right-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl"></div>
            </div>

            {/* Header Dashboard */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-center mb-6 mt-2 relative z-10"
            >
                <h1 className="text-1xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Dashboard Monitoring SPK
                </h1>
                <p className="mt-3 text-xs md:text-base text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
                    Kelola dan pantau progress Surat Perintah Kerja Anda secara real-time
                </p>
            </motion.div>

            {/* Stats Cards */}
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

            {/* Menu Cards */}
            <div className="grid grid-cols-2 md:grid-cols-2 gap-6 w-full max-w-6xl mx-auto relative z-10 mb-8">
                {/* Kartu 1: Buat Progress SPK */}
                <motion.div
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    className="group bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-3xl p-2 cursor-pointer border border-white/30 dark:border-gray-700/30 shadow-2xl transition-all duration-300 overflow-hidden relative"
                    onClick={() => router.push("/user-area/spkReport")}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-100/40 to-indigo-100/40 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl -z-10"></div>
                    <div className="flex flex-col items-center text-center relative z-10">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500/90 to-blue-600/90 dark:from-blue-600/90 dark:to-blue-700/90 rounded-2xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300 backdrop-blur-md border border-white/20">
                            <Plus className="w-9 h-9 text-white" />
                        </div>
                        <h2 className="text-base font-bold text-gray-800 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            Buat Progress
                        </h2>
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
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
                    className="group bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-3xl p-2 cursor-pointer border border-white/30 dark:border-gray-700/30 shadow-2xl transition-all duration-300 overflow-hidden relative"
                    onClick={() => router.push("/user-area/spkReportDetail")}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-green-100/40 to-emerald-100/40 dark:from-green-900/20 dark:to-emerald-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl -z-10"></div>
                    <div className="flex flex-col items-center text-center relative z-10">
                        <div className="w-16 h-16 bg-gradient-to-r from-green-500/90 to-emerald-600/90 dark:from-green-600/90 dark:to-emerald-700/90 rounded-2xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300 backdrop-blur-md border border-white/20">
                            <BarChart3 className="w-9 h-9 text-white" />
                        </div>
                        <h2 className="text-base font-bold text-gray-800 dark:text-white mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                            Laporan Progress
                        </h2>
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
                            Pantau, analisis, dan ekspor laporan SPK
                        </p>
                        <div className="flex items-center text-green-600 dark:text-green-400 text-sm font-medium mt-2">
                            <span>Lihat laporan</span>
                            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Recent Activities */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-3xl p-4 border border-white/30 dark:border-gray-700/30 shadow-2xl max-w-6xl mx-auto mb-8 relative z-10"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-base font-bold text-gray-800 dark:text-white">5 Aktivitas Terbaru</h2>
                    <button
                        className="text-sm text-blue-600 dark:text-blue-400 font-medium flex items-center cursor-pointer"
                        onClick={() => router.push("/user-area/spkReportDetail")}
                    >
                        Lihat semua <ChevronRight className="w-4 h-4 ml-1 " />
                    </button>
                </div>

                <div className="space-y-4">
                    {recentActivities.length > 0 ? (
                        recentActivities.map((activity) => (
                            <div key={activity.id} className="flex items-start p-2 bg-white/50 dark:bg-gray-700/50 rounded-2xl border border-white/30 dark:border-gray-600/30">
                                <div className={`rounded-full p-2 mr-4 ${activity.status === 'completed' ? 'bg-green-100/50 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                                    activity.status === 'pending' ? 'bg-amber-100/50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                                        'bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                    }`}>
                                    {activity.status === 'completed' ? <FileText className="w-4 h-4" /> :
                                        activity.status === 'pending' ? <Loader2 className="w-4 h-4" /> :
                                            <BarChart2 className="w-4 h-4" />}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xs font-semibold text-gray-800 dark:text-white">{activity.title}</h3>
                                    <p className="text-xs text-gray-600 dark:text-gray-300">{activity.description}</p>
                                    <div className="flex flex-col gap-1 mt-1">
                                        {activity.status === 'pending' ? (
                                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                                                <span className="text-xs">Progress - {activity.progress}%</span>
                                            </div>
                                        ) : activity.status === 'completed' ? (
                                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                <CheckCircle className="w-3 h-3" />
                                                <span className="text-xs">Selesai - {activity.progress}% </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                <Clock className="w-3 h-3" />
                                                <span className="text-xs">Menunggu Approve Aadmin - {activity.progress}%</span>
                                            </div>
                                        )}

                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.time}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-4">Belum ada aktivitas</p>
                    )}
                </div>
            </motion.div>

            {/* Quick Actions */}
            {!isQuickActionsEnabled && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    // className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-3xl p-6 border border-white/30 dark:border-gray-700/30 shadow-2xl max-w-6xl mx-auto relative z-10"
                    className={`... ${isQuickActionsEnabled ? '' : 'opacity-60 pointer-events-none select-none'}`}
                >
                    {/* <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Aksi Cepat</h2> */}
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
    );
};

export default DashboardUserSPK;