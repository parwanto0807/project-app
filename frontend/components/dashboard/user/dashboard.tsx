"use client";

import { useEffect, useState, useMemo } from "react";
import {
    FileText,
    BarChart2,
    Loader2,
    ChevronRight,
    Plus,
    BarChart3,
    CheckCircle,
    Clock,
    ShoppingCart,
    CalendarCheck,
    MapPinned,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { fetchSPKReports } from "@/lib/action/master/spk/spkReport";

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
        customer: { name: string; address: string; branch: string };
        project?: { id: string; name: string };
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
        salesOrderItem?: { id: string; name: string; description?: string; qty: number; uom?: string | null };
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
            return {
                id: itemSales.id,
                name: itemSales.name,
                description: itemSales.description || undefined,
                qty: itemSales.qty,
                uom: itemSales.uom || undefined,
                status: itemStatus,
                progress: hasDoneDetail ? 100 : 0,
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

const DashboardUserSPK = ({ dataSpk, role, userId }: FormMonitoringProgressSpkProps) => {
    const [userSpk, setUserSpk] = useState<SPKData[]>([]);
    const [reports, setReports] = useState<ReportHistory[]>([]);
    const [loadingReports, setLoadingReports] = useState(true);
    const router = useRouter();

    const formatDistanceToNow = (date: Date): string => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        const intervals: { [key: string]: number } = {
            tahun: 31536000, bulan: 2592000, minggu: 604800, hari: 86400, jam: 3600, menit: 60, detik: 1
        };
        for (const [unit, secondsPerUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsPerUnit);
            if (interval >= 1) return `${interval} ${unit} lalu`;
        }
        return 'baru saja';
    };

    useEffect(() => {
        if (dataSpk && dataSpk.length > 0) setUserSpk(mapToSPKData(dataSpk));
        else setUserSpk([]);
    }, [dataSpk]);

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

    const stats = useMemo(() => {
        if (!userSpk || userSpk.length === 0) {
            return { active: 0, todayProgress: 0, pendingReview: 0, approved: 0 };
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
                    report.status === 'PENDING' ? 'pending' : 'in-progress',
            }));
    }, [reports]);

    const statsData = [
        { label: "SPK Aktif", value: stats.active.toString(), icon: FileText, tone: "text-indigo-600 bg-indigo-50" },
        { label: "Progress Hari Ini", value: stats.todayProgress.toString(), icon: BarChart3, tone: "text-emerald-600 bg-emerald-50" },
        { label: "Menunggu Review", value: stats.pendingReview.toString(), icon: Clock, tone: "text-amber-600 bg-amber-50" },
        { label: "Disetujui", value: stats.approved.toString(), icon: CheckCircle, tone: "text-sky-600 bg-sky-50" },
    ];

    const quickActions = [
        { label: "Buat Progress", icon: Plus, href: "/user-area/spkReport", tone: "text-indigo-600 bg-indigo-50" },
        { label: "Laporan", icon: BarChart3, href: "/user-area/spkReportDetail", tone: "text-emerald-600 bg-emerald-50" },
        { label: "Belanja", icon: ShoppingCart, href: "/user-area/purchase-execution", tone: "text-amber-600 bg-amber-50" },
        { label: "Absensi", icon: CalendarCheck, href: "/user-area/attendance", tone: "text-violet-600 bg-violet-50" },
        { label: "Kegiatan", icon: MapPinned, href: "/user-area/kegiatan", tone: "text-sky-600 bg-sky-50" },
    ];

    const SectionHeader = ({ title, onViewAll }: { title: string; onViewAll?: () => void }) => (
        <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-bold text-gray-900">{title}</h2>
            {onViewAll && (
                <button onClick={onViewAll} className="flex items-center text-[12px] font-semibold text-indigo-600 active:opacity-60">
                    Lihat semua <ChevronRight className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );

    if (loadingReports) {
        return (
            <div className="w-full max-w-full px-3 py-16 flex flex-col items-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="mt-3 text-sm text-gray-500 font-medium">Memuat dashboard...</p>
            </div>
        );
    }

    const todayLabel = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });

    return (
        <div className="w-full max-w-full px-3 pb-28 pt-2">
            {/* Date */}
            <p className="text-[13px] text-gray-600 font-medium">{todayLabel}</p>

            {/* Stats */}
            <section className="mt-4">
                <div className="rounded-3xl bg-gray-100/90 dark:bg-gray-800/40 p-4">
                    <div className="grid grid-cols-2 gap-3">
                        {statsData.map((stat, index) => (
                            <div key={index} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex items-center gap-3 active:bg-gray-50 dark:active:bg-gray-800/50">
                                <span className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", stat.tone)}>
                                    <stat.icon className="w-5 h-5" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-semibold text-gray-600 truncate">{stat.label}</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Quick actions */}
            <section className="mt-6">
                <SectionHeader title="Menu Cepat" />
                <div className="rounded-3xl bg-gray-100/90 dark:bg-gray-800/40 p-4">
                    <div className="grid grid-cols-5 gap-1">
                        {quickActions.map((action, idx) => (
                            <button
                                key={idx}
                                onClick={() => router.push(action.href)}
                                className="flex flex-col items-center gap-1.5 py-2 active:scale-95 transition-transform"
                            >
                                <span className={cn("w-[52px] h-[52px] rounded-2xl flex items-center justify-center", action.tone)}>
                                    <action.icon className="w-6 h-6" />
                                </span>
                                <span className="text-[11px] font-semibold text-gray-800 dark:text-gray-300 text-center leading-tight">
                                    {action.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Recent activities */}
            <section className="mt-6">
                <SectionHeader title="Aktivitas Terbaru" onViewAll={() => router.push("/user-area/spkReportDetail")} />
                {recentActivities.length > 0 ? (
                    <div className="rounded-3xl bg-gray-100/90 dark:bg-gray-800/40 p-4 space-y-2.5">
                        {recentActivities.map((activity) => (
                            <div key={activity.id} className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-3.5 active:bg-gray-50 dark:active:bg-gray-800/50">
                                <span className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                    activity.status === 'completed' ? "text-emerald-600 bg-emerald-50" :
                                    activity.status === 'pending' ? "text-amber-600 bg-amber-50" : "text-indigo-600 bg-indigo-50"
                                )}>
                                    {activity.status === 'completed' ? <CheckCircle className="w-5 h-5" /> :
                                     activity.status === 'pending' ? <Clock className="w-5 h-5" /> :
                                     <BarChart2 className="w-5 h-5" />}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-[13px] font-bold text-gray-900 dark:text-white truncate">{activity.title}</p>
                                        <span className="text-[10px] font-medium text-gray-500 whitespace-nowrap shrink-0">{activity.time}</span>
                                    </div>
                                    <p className="text-[11px] text-gray-600 truncate mt-0.5">{activity.description}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <div className="h-1 flex-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full rounded-full", activity.status === 'completed' ? "bg-emerald-500" : "bg-indigo-500")}
                                                style={{ width: `${activity.progress}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-600">{activity.progress}%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-6 text-center rounded-3xl bg-gray-100/90 dark:bg-gray-800/40">
                        <p className="text-xs font-semibold text-gray-500">Belum ada aktivitas</p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default DashboardUserSPK;
