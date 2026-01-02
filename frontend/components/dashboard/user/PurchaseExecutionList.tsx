"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/clientSessionProvider";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShoppingBag,
    Calendar,
    Truck,
    ChevronRight,
    Search,
    Building2,
    FileText,
    ClipboardCheck,
    ArrowRightCircle,
    Package,
    RotateCw,
} from "lucide-react";
import { toast } from "sonner";
import { PurchaseOrder } from "@/types/poExecution";

// Sub-komponen Skeleton untuk Loading State yang lebih menarik
const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse">
        <div className="flex justify-between mb-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
            <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-3/4 mb-4"></div>
        <div className="space-y-3">
            <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
    </div>
);

export default function PurchaseExecutionList() {
    const [pos, setPos] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const router = useRouter();
    const { user } = useSession();

    const fetchPOs = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/po/execution-list`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // DEBUG: Check data received
                    if (data.data.length > 0) {
                        console.log('Frontend received PO[0]:', data.data[0]);
                        console.log('Frontend received PR data:', data.data[0].PurchaseRequest);
                    }
                    setPos(data.data);
                    toast.success("Data berhasil diperbarui");
                } else {
                    toast.error(data.error || "Gagal memuat data PO");
                }
            }
        } catch (error) {
            console.error("Error fetching execution POs:", error);
            toast.error("Terjadi kesalahan koneksi");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPOs();
    }, [fetchPOs]);

    const filteredPOs = pos.filter(po =>
        po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.project?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen pb-10">
            {/* HEADER SECTION WITH GRADIENT */}
            <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/5 border border-amber-200/20 p-6 md:p-8 mb-8">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-500 rounded-2xl shadow-lg shadow-amber-500/20 text-white">
                            <ShoppingBag className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                Belanja Material
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Eksekusi pembelian berdasarkan PO Admin
                            </p>
                        </div>
                    </div>

                    {/* STATS MINI CARD */}
                    <div className="flex gap-3 bg-white/50 dark:bg-gray-900/50 p-3 rounded-2xl backdrop-blur-md border border-white/50 dark:border-gray-700">
                        <div className="text-center px-4 border-r border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Total PO</p>
                            <p className="text-xl font-bold text-amber-600">{pos.length}</p>
                        </div>
                        <div className="text-center px-4">
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Aktif</p>
                            <p className="text-xl font-bold text-green-600">
                                {pos.filter(p => p.status === 'APPROVED').length}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* SEARCH & FILTER AREA */}
            <div className="sticky top-4 z-20 mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Cari nomor PO, nama proyek, atau supplier..."
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-gray-800 border-none shadow-sm focus:ring-2 focus:ring-amber-500 transition-all dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <button
                    onClick={fetchPOs}
                    disabled={loading}
                    title="Perbarui Data"
                    className={`
        relative flex items-center justify-center p-4 rounded-2xl transition-all duration-300 group
        ${loading
                            ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-70'
                            : 'bg-white dark:bg-gray-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-gray-100 dark:border-gray-700 hover:border-amber-200 dark:hover:border-amber-800 shadow-sm hover:shadow-lg hover:shadow-amber-500/10'
                        }
    `}
                >
                    {/* Glow Effect saat Hover (Hanya muncul jika tidak loading) */}
                    {!loading && (
                        <div className="absolute inset-0 rounded-2xl bg-amber-500/0 group-hover:bg-amber-500/5 transition-all duration-300" />
                    )}

                    <div className="relative flex items-center gap-2">
                        <RotateCw
                            className={`
                w-5 h-5 transition-all duration-500
                ${loading
                                    ? 'animate-spin text-amber-600'
                                    : 'text-gray-500 dark:text-gray-400 group-hover:text-amber-600 group-hover:rotate-180'
                                }
            `}
                        />

                        {/* Teks Label (Opsional, muncul di layar yang lebih besar/tablet) */}
                        <span className={`
            text-sm font-bold overflow-hidden transition-all duration-300
            ${loading ? 'max-w-[100px] text-amber-600' : 'max-w-0 group-hover:max-w-[100px] text-amber-600'}
        `}>
                            {loading ? 'Sinkron...' : 'Refresh'}
                        </span>
                    </div>

                    {/* Indikator Titik Kecil jika ada update (Opsional secara Visual) */}
                    {!loading && (
                        <span className="absolute top-2 right-2 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-40"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500/20"></span>
                        </span>
                    )}
                </button>
            </div>

            {/* MAIN CONTENT */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
                </div>
            ) : (
                <motion.div
                    layout
                    className="flex flex-col gap-3"
                >
                    <AnimatePresence mode="popLayout">
                        {filteredPOs.length > 0 ? (
                            filteredPOs.map((po) => (
                                <motion.div
                                    key={po.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        // Prioritaskan requestedBy HANYA jika memiliki userId, jika tidak, gunakan karyawan
                                        const reqUser = (po.PurchaseRequest?.requestedBy && po.PurchaseRequest.requestedBy.userId)
                                            ? po.PurchaseRequest.requestedBy
                                            : po.PurchaseRequest?.karyawan;

                                        if (reqUser?.userId && user?.id && reqUser.userId !== user.id) {
                                            toast.warning("Sepertinya PO ini bukan untuk anda", {
                                                position: 'top-center',
                                            });
                                            return;
                                        }
                                        router.push(`/user-area/purchase-execution/${po.id}`);
                                    }}
                                    className="group bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 cursor-pointer relative overflow-hidden"
                                >
                                    <div className="relative z-10 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            {/* Icon Box */}
                                            <div className="flex-shrink-0 p-2.5 bg-amber-500 dark:bg-amber-900/20 rounded-xl text-white group-hover:bg-amber-600 group-hover:text-yellow-300 transition-colors duration-300">
                                                <Package className="w-5 h-5" />
                                            </div>

                                            {/* Text Content */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                                                    <h3 className="font-bold text-[13px] text-gray-900 dark:text-white group-hover:text-amber-600 transition-colors truncate">
                                                        {po.poNumber}
                                                    </h3>

                                                    <div className="flex items-center gap-1">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${po.status === 'APPROVED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                            po.status === 'FULLY_RECEIVED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                                            }`}>
                                                            {po.status}
                                                        </span>

                                                        {/* Execution Status Badge */}
                                                        {po.PurchaseExecution && po.PurchaseExecution.length > 0 && (
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${po.PurchaseExecution[0].status === 'COMPLETED' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' :
                                                                po.PurchaseExecution[0].status === 'IN_PROGRESS' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                                                    po.PurchaseExecution[0].status === 'CANCELLED' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                                                        'bg-gray-100 text-gray-700'
                                                                }`}>
                                                                {po.PurchaseExecution[0].status.replace('_', ' ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* PR & Requester Info */}
                                                {(po.PurchaseRequest?.nomorPr || po.PurchaseRequest?.requestedBy?.namaLengkap || po.PurchaseRequest?.karyawan?.namaLengkap) && (
                                                    <div className="flex flex-wrap items-center text-[10px] text-gray-500 dark:text-gray-400 mb-1.5 gap-x-3 gap-y-1">
                                                        {po.PurchaseRequest?.nomorPr && (
                                                            <span className="font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/10 px-1.5 rounded border border-amber-100 dark:border-amber-800/30">
                                                                {po.PurchaseRequest.nomorPr}
                                                            </span>
                                                        )}
                                                        {(po.PurchaseRequest?.requestedBy?.namaLengkap || po.PurchaseRequest?.karyawan?.namaLengkap) && (
                                                            <span className="flex items-center">
                                                                <span className="text-gray-400 mr-1">REQ :</span>
                                                                <span className="font-bold text-gray-700 dark:text-gray-300 uppercase">
                                                                    {po.PurchaseRequest?.requestedBy?.namaLengkap || po.PurchaseRequest?.karyawan?.namaLengkap}
                                                                </span>
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex flex-wrap items-center text-[11px] text-gray-500 dark:text-gray-400 gap-y-0.5">
                                                    <div className="flex items-center mr-3">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        <span className="truncate">
                                                            {new Date(po.orderDate).toLocaleDateString("id-ID", {
                                                                day: '2-digit', month: 'short', year: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center max-w-full">
                                                        <span className="mr-1.5 hidden sm:inline">•</span>
                                                        <span className="truncate max-w-[150px]">{po.supplier?.name || "No Supplier"}</span>
                                                    </div>
                                                </div>

                                                {/* Product List Preview */}
                                                <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5">
                                                    {po.lines?.slice(0, 2).map((line, idx) => (
                                                        <span key={idx} className="text-[10px] italic text-gray-400 dark:text-gray-500 flex items-center">
                                                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 mr-1.5"></span>
                                                            {line.product?.name || 'Item'}
                                                        </span>
                                                    ))}
                                                    {po.lines?.length > 2 && (
                                                        <span className="text-[10px] italic text-gray-400 dark:text-gray-500 px-1">
                                                            +{po.lines.length - 2} lagi
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Arrow */}
                                        <div className="flex-shrink-0 flex items-center text-amber-600">
                                            <span className="text-[10px] font-bold mr-2 hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity">
                                                Eksekusi
                                            </span>
                                            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/10 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all">
                                                <ArrowRightCircle className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="col-span-full py-20 flex flex-col items-center bg-white/30 dark:bg-gray-800/30 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-700"
                            >
                                <div className="p-5 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                                    <ClipboardCheck className="w-12 h-12 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Tidak Ada Tugas</h3>
                                <p className="text-gray-500 mt-2">Semua Purchase Order telah selesai atau belum tersedia.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
}