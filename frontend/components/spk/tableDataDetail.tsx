"use client";
import { Fragment } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Camera, CheckCircle, Clock, X, Archive, TrendingUp, FileText, Eye, Loader2, Download, ZoomIn, ChevronRight, ChevronLeft, Calendar, ChevronsRight, PackageOpenIcon, Wrench, PenTool, FileSignature, ShieldCheck, Trash2, UserCheck2Icon, Filter, ArrowLeft, FileDown } from 'lucide-react';
import Image from 'next/image';
import { deleteReport, fetchSPKReports } from '@/lib/action/master/spk/spkReport';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { updateReportStatus } from '@/lib/action/master/spk/spkReport';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { ScrollArea } from '../ui/scroll-area';
import { DialogTrigger } from '@radix-ui/react-dialog';
import PreviewPdf from '../spkReport/previewPdfSpk';
import PreviewPdfDetail from '../spkReport/previewPdfSpkDetail';

// 👇 DEFINSI TIPE DATA API (TETAP UTUH)
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

// 👇 INTERFACE YANG DIGUNAKAN OLEH UI
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
    email: string;
    soDetailId: string;
    progress: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface ProgressFormData {
    spkId: string;
    note: string;
    type: 'PROGRESS' | 'FINAL';
    progress: number;
    minProgress: number;
    photos: File[];
    items: string | null; // ID dari SPKDetail
}

interface FormMonitoringProgressSpkProps {
    dataSpk: SPKDataApi | null; // Ubah ke single object
    isLoading: boolean;
    role: string;
    userId: string;
}

type ItemProgress = Record<string, number>; // key: soDetailId, value: progress
type SPKItemProgressMap = Record<string, ItemProgress>; // key: spkNumber

const FormMonitoringProgressSpkByID = ({ dataSpk, isLoading, role, userId }: FormMonitoringProgressSpkProps) => {
    const [formData, setFormData] = useState<ProgressFormData>({
        spkId: '',
        note: '',
        type: 'PROGRESS',
        progress: 0,
        minProgress: 0,
        photos: [],
        items: null,
    });
    const [reports, setReports] = useState<ReportHistory[]>([]);
    const [loadingReports, setLoadingReports] = useState(false);
    const [filters, setFilters] = useState({
        date: 'all' as 'all' | 'today' | 'thisWeek' | 'thisMonth',
        status: 'all' as 'all' | 'PENDING' | 'APPROVED' | 'REJECTED',
        spkId: '',
        karyawanId: '',
        itemId: 'all' as string, // Tambahkan filter item
    });

    const [selectedReport, setSelectedReport] = useState<ReportHistory | null>(null);
    const [modalType, setModalType] = useState<'view' | 'approve' | 'reject' | null>(null);
    const [userSpk, setUserSpk] = useState<SPKData[]>([]);
    const [spkItemProgress, setSpkItemProgress] = useState<SPKItemProgressMap>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [previewSpk, setPreviewSpk] = useState<string | undefined>(undefined);
    const [previewPdfOpen, setPreviewPdfOpen] = useState(false);
    const [selectedItemForPdf, setSelectedItemForPdf] = useState<string>('');

    console.log("User", userId, role, spkItemProgress);


    const totalPages = Math.ceil(reports.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentReports = reports.slice(startIndex, startIndex + itemsPerPage);

    // Kelompokkan laporan berdasarkan spkNumber
    const groupedReports = currentReports.reduce<Record<string, typeof currentReports>>(
        (acc, report) => {
            const key = report.spkNumber;
            if (!acc[key]) acc[key] = [];
            acc[key].push(report);
            return acc;
        },
        {}
    );

    // Dapatkan array key untuk iterasi
    const spkGroups = Object.keys(groupedReports);

    // Handler ganti halaman
    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // Handler untuk kembali ke halaman sebelumnya
    const handleBack = () => {
        window.history.back();
    };

    // 👇 MAP KE SPKData (DIBENARKAN)
    const mapToSPKData = (raw: SPKDataApi | null): SPKData[] => {
        if (!raw) return [];

        const clientName = raw.salesOrder?.customer?.name || 'Client Tidak Dikenal';
        const projectName = raw.salesOrder?.project?.name || 'Project Tidak Dikenal';
        const assignedTo =
            raw.team?.teamKaryawan?.karyawan?.namaLengkap ||
            raw.createdBy?.namaLengkap ||
            'Tidak Ditugaskan';

        const totalDetails = raw.details?.length || 0;
        const completedDetails = raw.details?.filter(d => d.status === 'DONE').length || 0;
        const progress = totalDetails > 0 ? Math.round((completedDetails / totalDetails) * 100) : 0;
        const teamName = raw.team?.namaTeam || 'Team belum ditentukan'
        const email = raw.team?.teamKaryawan?.karyawan?.email || ' Email belum ditentukan'

        let status: 'PENDING' | 'PROGRESS' | 'COMPLETED';
        if (progress === 100) status = 'COMPLETED';
        else if (progress > 0) status = 'PROGRESS';
        else status = 'PENDING';

        const deadline = new Date(raw.spkDate).toISOString();

        const items = raw.salesOrder?.items?.map(itemSales => {
            const relatedDetails = raw.details?.filter(detail => detail.salesOrderItem?.id === itemSales.id) || [];
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
                clientName: clientName,
                projectName: projectName,
            };
        }) || [];

        return [{
            id: raw.id,
            spkNumber: raw.spkNumber,
            clientName,
            projectName,
            email,
            status,
            teamName,
            progress,
            deadline,
            assignedTo,
            items,
        }];
    };

    useEffect(() => {
        if (formData.items) {
            setFormData((prev) => ({
                ...prev,
                type: 'PROGRESS',
            }));
        }
    }, [formData.items]);

    // ✅ Hitung spkItemProgress hanya saat reports berubah
    useEffect(() => {
        const newSpkItemProgress: SPKItemProgressMap = {};

        for (const report of reports) {
            const { spkNumber, soDetailId, progress } = report;

            if (!newSpkItemProgress[spkNumber]) {
                newSpkItemProgress[spkNumber] = {};
            }

            const currentProgress = newSpkItemProgress[spkNumber][soDetailId] ?? 0;
            newSpkItemProgress[spkNumber][soDetailId] = Math.max(currentProgress, progress ?? 0);
        }

        setSpkItemProgress(newSpkItemProgress);
    }, [reports]);

    useEffect(() => {
        if (formData.type === 'FINAL') {
            setFormData(prev => ({ ...prev, progress: 100 }));
        }
    }, [formData.type]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    useEffect(() => {
        if (dataSpk) {
            const mapped = mapToSPKData(dataSpk);
            setUserSpk(mapped);
        } else {
            setUserSpk([]);
        }
    }, [dataSpk]);

    const filteredUserSpk = userSpk.filter(spk => {
        if (role === 'admin' || role === 'super' || role === 'pic') return true;
        return spk.id === userId;
    });

    // 👇 DAPATKAN ITEMS UNTUK FILTER
    const getFilterItems = () => {
        if (!dataSpk || !dataSpk.salesOrder?.items) return [];

        return dataSpk.salesOrder.items.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description
        }));
    };

    const filterItems = getFilterItems();

    // 👇 FETCH RIWAYAT LAPORAN DARI BACKEND - DIPERBAIKI
    const fetchReports = useCallback(async () => {
        setLoadingReports(true);
        try {
            let reports = await fetchSPKReports(filters);

            // ✅ FILTER HANYA UNTUK SPK YANG SEDANG DILIHAT
            if (dataSpk && dataSpk.spkNumber) {
                const currentSpkNumber = dataSpk.spkNumber;
                reports = reports.filter(r => r.spkNumber === currentSpkNumber);
            }

            // ✅ FILTER BERDASARKAN ITEM JIKA DIPILIH
            if (filters.itemId !== 'all') {
                reports = reports.filter(r => r.soDetailId === filters.itemId);
            }

            // ✅ FILTER di frontend sesuai userEmail (kecuali admin/super)
            if (role !== "admin" && role !== "super" && role !== "pic") {
                reports = reports.filter(r => r.email === userId);
            }

            // ✅ SORT
            reports = [...reports].sort((a, b) => {
                const spkCompare = a.spkNumber.localeCompare(b.spkNumber, undefined, {
                    numeric: true,
                    sensitivity: "base",
                });
                return spkCompare === 0
                    ? a.itemName.localeCompare(b.itemName, undefined, { sensitivity: "base" })
                    : spkCompare;
            });

            setReports(reports);
        } catch (error) {
            console.error("Error fetching reports:", error);
            toast.error("Gagal memuat riwayat laporan");
        } finally {
            setLoadingReports(false);
        }
    }, [filters, userId, role, dataSpk]);

    useEffect(() => {
        fetchReports();
    }, [filters, fetchReports]);

    // 👇 APPROVE / REJECT LAPORAN (ADMIN)
    const handleApproveReport = async (reportId: string) => {
        try {
            const result = await updateReportStatus(reportId, "APPROVED");

            if (!result.success) {
                throw new Error(result.message || "Gagal menyetujui laporan");
            }

            toast.success("Laporan disetujui");
            fetchReports();
        } catch (error) {
            console.error("Error handleApproveReport:", error);
            toast.error("Gagal menyetujui laporan");
        }
    };

    const handleRejectReport = async (reportId: string) => {
        try {
            const res = await deleteReport(reportId);

            if (!res.success) throw new Error(res.message || 'Gagal menolak laporan');

            toast.success("Laporan ditolak");
            fetchReports();
        } catch (error) {
            console.error(error);
            toast.error("Gagal menolak laporan");
        }
    };


    // 👇 DOWNLOAD PDF UNTUK ITEM TERTENTU
    const handleDownloadItemPdf = (itemName: string) => {
        setSelectedItemForPdf(itemName);
        setPreviewPdfOpen(true);
    };

    // 👇 DOWNLOAD PDF
    const downloadPDF = () => {
        if (!dataSpk) {
            toast.error("Data SPK tidak tersedia");
            return;
        }

        setPreviewSpk(dataSpk.spkNumber);
        toast.success(`Mempersiapkan PDF untuk ${dataSpk.spkNumber}`);
    };

    // 👇 EXPORT CSV
    const exportToCSV = () => {
        const headers = ['No', 'SPK', 'Client', 'Item', 'Jenis', 'Catatan', 'Tanggal', 'Status', 'Foto', 'Karyawan'];
        const rows = reports.map((r, i) => [
            i + 1,
            r.spkNumber,
            r.clientName,
            r.itemName,
            r.type,
            r.note || '-',
            new Date(r.reportedAt).toLocaleString('id-ID'),
            r.status,
            r.photos.length,
            r.karyawanName,
        ]);

        const csvContent =
            [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `laporan-spk-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) return <SkeletonLoader />;

    if (filteredUserSpk.length === 0) {
        return (
            <div className="h-full w-full p-3 md:p-4 flex flex-col items-center justify-center text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                <h3 className="text-lg font-medium text-muted-foreground">Tidak ada SPK</h3>
                <p className="text-sm text-muted-foreground/70 mt-1">
                    {role === 'admin' || role === 'super' || role === 'pic'
                        ? 'Belum ada SPK yang terdaftar.'
                        : `Tidak ada SPK yang ditugaskan ke ${userId}.`}
                </p>
            </div>
        );
    }

    return (
        <div className="h-full w-full p-1 md:p-2">
            <div className="flex flex-col gap-4">
                {/* Header dengan Back Button dan SPK Badge */}
                <div className="flex flex-col gap-2 bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-lg text-white shadow-lg">
                    {/* Bar Atas */}
                    <div className="flex items-center justify-between">
                        {/* Back Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBack}
                            className="text-white hover:bg-white/20 h-8 w-8 p-0 rounded-full"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>

                        {/* Badge - selalu di center */}
                        <div className="flex-1 flex justify-center">
                            <Badge
                                variant="secondary"
                                className="px-3 ml-12 py-1 text-sm font-semibold md:px-5 md:py-2 md:text-base bg-white/20 backdrop-blur-sm border-white/30 text-white"
                            >
                                {filteredUserSpk[0]?.spkNumber || 'SPK'}
                            </Badge>
                        </div>

                        {/* Kosong untuk keseimbangan layout di desktop, tapi kecil */}
                        <div className="w-6 sm:w-20"></div>
                    </div>

                    {/* Judul */}
                    <div className="flex items-center gap-2 justify-center">
                        <TrendingUp className="h-5 w-5 md:h-6 md:w-6" />
                        <h1 className="text-lg md:text-2xl font-bold tracking-tight text-center">
                            Laporan Progress SPK
                        </h1>
                    </div>

                    {/* Subtext */}
                    <p className="text-[10px] md:text-sm text-blue-100 opacity-90 text-center leading-tight">
                        {role === 'admin' || role === 'super' || role === 'pic'
                            ? 'Monitor semua SPK yang sedang berjalan'
                            : 'Laporkan progress pekerjaan untuk SPK Anda'}
                    </p>
                </div>

                <Card className="border-border/40 bg-card/90 backdrop-blur-sm shadow-md rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg">
                    {/* Header Card — Judul + Filter */}
                    <CardHeader className="pb-4 pt-3 bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/30 dark:to-gray-800 sticky top-0 z-10">
                        <div className="flex flex-col md:grid md:grid-cols-12 gap-4">
                            {/* Judul - Mobile Layout */}
                            <div className='flex md:col-span-4 justify-between items-center md:block'>
                                <div className='flex flex-col'>
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <Archive className="h-4 w-4 text-purple-600" />
                                        <span className="hidden md:inline">Riwayat Laporan</span>
                                        <span className="md:hidden">Laporan</span>
                                    </CardTitle>
                                    <CardDescription className="text-xs">Riwayat laporan SPK Anda</CardDescription>
                                </div>

                                {/* Mobile Filter Button & Items Per Page */}
                                <div className="flex items-center gap-2 md:hidden">
                                    <div className="flex items-center gap-1">
                                        <Label className="text-xs font-medium hidden xs:inline">Item:</Label>
                                        <select
                                            value={itemsPerPage}
                                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                            className="h-7 w-12 text-xs border rounded-md bg-background flex items-center justify-center text-center"
                                        >
                                            <option value="5">5</option>
                                            <option value="10">10</option>
                                            <option value="20">20</option>
                                        </select>
                                    </div>

                                    <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
                                        <SheetTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-10 text-xs">
                                                <Filter className="h-4 w-4 mr-1" />
                                                Filter
                                            </Button>
                                        </SheetTrigger>
                                        <SheetContent side="bottom" className="h-3/4">
                                            <SheetHeader>
                                                <SheetTitle>Filter Laporan</SheetTitle>
                                            </SheetHeader>
                                            <ScrollArea className="h-full mt-4">
                                                <div className="space-y-4 px-6">
                                                    {/* Filter Item - Mobile */}
                                                    <div>
                                                        <Label className="text-xs font-medium mb-2">Item</Label>
                                                        <Select
                                                            value={filters.itemId}
                                                            onValueChange={(v: string) =>
                                                                setFilters({ ...filters, itemId: v })
                                                            }
                                                        >
                                                            <SelectTrigger className="h-10 text-xs border-border/60">
                                                                <SelectValue placeholder="Semua Item" />
                                                            </SelectTrigger>
                                                            <SelectContent className="text-xs">
                                                                <SelectItem value="all">Semua Item</SelectItem>
                                                                {filterItems.map(item => (
                                                                    <SelectItem key={item.id} value={item.id}>
                                                                        {item.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div>
                                                        <Label className="text-xs font-medium mb-2">Status</Label>
                                                        <Select
                                                            value={filters.status}
                                                            onValueChange={(v: 'all' | 'PENDING' | 'APPROVED' | 'REJECTED') =>
                                                                setFilters({ ...filters, status: v })
                                                            }
                                                        >
                                                            <SelectTrigger className="h-10 text-xs border-border/60">
                                                                <SelectValue placeholder="Semua Status" />
                                                            </SelectTrigger>
                                                            <SelectContent className="text-xs">
                                                                <SelectItem value="all">Semua Status</SelectItem>
                                                                <SelectItem value="PENDING">Menunggu</SelectItem>
                                                                <SelectItem value="APPROVED">Disetujui</SelectItem>
                                                                <SelectItem value="REJECTED">Ditolak</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div>
                                                        <Label className="text-xs font-medium mb-2">Periode</Label>
                                                        <Select value={filters.date} onValueChange={(v: 'all' | 'today' | 'thisWeek' | 'thisMonth') =>
                                                            setFilters({ ...filters, date: v })}>
                                                            <SelectTrigger className="h-10 text-xs border-border/60">
                                                                <SelectValue placeholder="Semua Periode" />
                                                            </SelectTrigger>
                                                            <SelectContent className="text-xs">
                                                                <SelectItem value="all">Semua Periode</SelectItem>
                                                                <SelectItem value="today">Hari Ini</SelectItem>
                                                                <SelectItem value="thisWeek">Minggu Ini</SelectItem>
                                                                <SelectItem value="thisMonth">Bulan Ini</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="flex gap-2 pt-4">
                                                        <Button
                                                            variant="outline"
                                                            className="flex-1"
                                                            onClick={() => setIsMobileFilterOpen(false)}
                                                        >
                                                            Batal
                                                        </Button>
                                                        <Button
                                                            className="flex-1"
                                                            onClick={() => setIsMobileFilterOpen(false)}
                                                        >
                                                            Terapkan
                                                        </Button>
                                                    </div>
                                                </div>
                                            </ScrollArea>
                                        </SheetContent>
                                    </Sheet>
                                </div>
                            </div>

                            {/* Desktop Filters - Status, Periode, dan Item */}
                            <div className="hidden md:flex md:col-span-8 gap-4 items-center justify-end">
                                {/* Filter Item */}
                                <div className='flex gap-2 items-center'>
                                    <Label className="text-xs font-medium">Item</Label>
                                    <Select
                                        value={filters.itemId}
                                        onValueChange={(v: string) =>
                                            setFilters({ ...filters, itemId: v })
                                        }
                                    >
                                        <SelectTrigger className="h-10 text-xs border-border/60 w-40">
                                            <SelectValue placeholder="Semua Item" />
                                        </SelectTrigger>
                                        <SelectContent className="text-xs">
                                            <SelectItem value="all">Semua Item</SelectItem>
                                            {filterItems.map(item => (
                                                <SelectItem key={item.id} value={item.id}>
                                                    {item.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Filter Status */}
                                <div className='flex gap-2 items-center'>
                                    <Label className="text-xs font-medium">Status</Label>
                                    <Select
                                        value={filters.status}
                                        onValueChange={(v: 'all' | 'PENDING' | 'APPROVED' | 'REJECTED') =>
                                            setFilters({ ...filters, status: v })
                                        }
                                    >
                                        <SelectTrigger className="h-10 text-xs border-border/60 w-32">
                                            <SelectValue placeholder="Semua Status" />
                                        </SelectTrigger>
                                        <SelectContent className="text-xs">
                                            <SelectItem value="all">Semua Status</SelectItem>
                                            <SelectItem value="PENDING">Menunggu</SelectItem>
                                            <SelectItem value="APPROVED">Disetujui</SelectItem>
                                            <SelectItem value="REJECTED">Ditolak</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Filter Periode */}
                                <div className='flex gap-2 items-center'>
                                    <Label className="text-xs font-medium">Periode</Label>
                                    <Select value={filters.date} onValueChange={(v: 'all' | 'today' | 'thisWeek' | 'thisMonth') =>
                                        setFilters({ ...filters, date: v })}>
                                        <SelectTrigger className="h-10 text-xs border-border/60 w-32">
                                            <SelectValue placeholder="Semua Periode" />
                                        </SelectTrigger>
                                        <SelectContent className="text-xs">
                                            <SelectItem value="all">Semua Periode</SelectItem>
                                            <SelectItem value="today">Hari Ini</SelectItem>
                                            <SelectItem value="thisWeek">Minggu Ini</SelectItem>
                                            <SelectItem value="thisMonth">Bulan Ini</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Items Per Page */}
                                <div className="flex gap-2 items-center">
                                    <Label className="text-xs font-medium">Item Per Page</Label>
                                    <Select value={String(itemsPerPage)} onValueChange={(v) => setItemsPerPage(Number(v))}>
                                        <SelectTrigger className="h-7 w-20 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="5">5</SelectItem>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="20">20</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    {/* Body Card — Konten Tabel */}
                    <CardContent className="pt-0 px-3 pb-2 flex flex-col h-full">
                        {loadingReports ? (
                            <div className="flex justify-center py-6">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : reports.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground">
                                <Archive className="mx-auto h-10 w-10 opacity-30" />
                                <p className="text-sm mt-2">Belum ada laporan</p>
                                <p className="text-xs mt-1 text-muted-foreground/70">Lakukan pelaporan pertama Anda.</p>
                            </div>
                        ) : (
                            <>
                                {/* Container tabel dengan tinggi maksimal dan overflow terkontrol */}
                                <div className="rounded-md border border-border/40 overflow-hidden flex-1 flex flex-col min-h-0">
                                    <div className="overflow-y-auto">
                                        <Table>
                                            {/* Table Header — tetap sticky */}
                                            <TableHeader className="bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/30 dark:to-gray-800 sticky top-0 z-10">
                                                {/* Desktop Header */}
                                                <TableRow className="[&>th]:py-0 [&>th]:px-2 [&>th]:text-xs [&>th]:font-semibold hidden md:table-row">
                                                    <TableHead className="min-w-[200px]">SPK Number, Pelanggan, Project Name</TableHead>
                                                    <TableHead className="min-w-[150px]">Team Lead Lapangan</TableHead>
                                                    <TableHead className="min-w-[120px]">Progress</TableHead>
                                                    <TableHead className="min-w-[100px]">Approve Admin</TableHead>
                                                    <TableHead className="min-w-[80px]">Foto</TableHead>
                                                    {role === 'admin' || role === 'pic' && (
                                                        <TableHead className="min-w-[100px] sticky right-0 bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/30 dark:to-gray-800 z-10">
                                                            Aksi
                                                        </TableHead>
                                                    )}
                                                </TableRow>

                                                {/* Mobile Header */}
                                                <TableRow className="[&>th]:py-0 [&>th]:px-2 [&>th]:text-xs [&>th]:font-semibold md:hidden">
                                                    <TableHead className="min-w-[100px]">Tanggal</TableHead>
                                                    <TableHead className="min-w-[110px]">Progress</TableHead>
                                                    <TableHead className="min-w-[90px]">Status</TableHead>
                                                    <TableHead className="min-w-[50px]">Aksi</TableHead>
                                                </TableRow>
                                            </TableHeader>

                                            {/* Scrollable Table Body */}
                                            <TableBody className="divide-y divide-border/40">
                                                {spkGroups.map((spkNumber) => {
                                                    const reportsInGroup = groupedReports[spkNumber];
                                                    const spk = userSpk.find((i) => i.spkNumber === spkNumber);

                                                    return (
                                                        <Fragment key={spkNumber}>
                                                            {/* Header Grup SPK */}
                                                            <TableRow className="bg-purple-50 dark:bg-purple-900/20 [&>td]:py-2 [&>td]:px-2 md:[&>td]:py-4">
                                                                <TableCell colSpan={role === 'admin' || role === 'pic' ? 7 : 6} className="sticky left-0 z-10 bg-purple-50 dark:bg-purple-900/20">
                                                                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 py-1 md:py-2">
                                                                        {/* Baris 1: SPK Info */}
                                                                        <div className="flex items-center gap-2">
                                                                            <Archive className="h-3.5 w-3.5 md:h-4 md:w-4 text-purple-600 flex-shrink-0" />
                                                                            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                                                                                <span className="text-xs md:text-sm font-bold">SPK: {spkNumber}</span>
                                                                                {spk && (
                                                                                    <>
                                                                                        <span className="hidden md:inline text-muted-foreground">—</span>
                                                                                        <span className="text-xs md:text-sm text-muted-foreground max-w-[120px] md:max-w-none">
                                                                                            {spk.clientName}
                                                                                        </span>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* Baris 2: Project Info */}
                                                                        <div className="flex items-center gap-2 ml-5 md:ml-6">
                                                                            <PackageOpenIcon className="h-3 w-3 md:h-4 md:w-4 text-purple-600 flex-shrink-0" />
                                                                            <span className="text-xs text-muted-foreground text-wrap max-w-[300px] md:max-w-none">
                                                                                {userSpk.find((i) => i.spkNumber === spk?.spkNumber)?.projectName ?? "-"}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>

                                                            {/* ✅ Kelompokkan laporan dalam grup ini berdasarkan itemName */}
                                                            {(() => {
                                                                // Group by itemName
                                                                const itemGroups = reportsInGroup.reduce<Record<string, typeof reportsInGroup>>(
                                                                    (acc, report) => {
                                                                        const key = report.itemName;
                                                                        if (!acc[key]) acc[key] = [];
                                                                        acc[key].push(report);
                                                                        return acc;
                                                                    },
                                                                    {}
                                                                );

                                                                const itemNames = Object.keys(itemGroups);

                                                                return itemNames.map((itemName) => (
                                                                    <Fragment key={itemName}>
                                                                        {/* ➡️ Header Subgrup Item */}
                                                                        <TableRow
                                                                            className="bg-blue-50/50 dark:bg-blue-900/10 [&>td]:py-2 [&>td]:px-0 [&>td]:text-xs [&>td]:font-medium"
                                                                        >
                                                                            <TableCell
                                                                                colSpan={role === 'admin' || role === 'pic' ? 6 : 5}
                                                                                className="pl-4 border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-900/10"
                                                                            >
                                                                                <div className="flex flex-col md:flex-row md:items-center md:justify-between">

                                                                                    {/* --- TITLE / ITEM NAME --- */}
                                                                                    <div className="flex items-center gap-0">
                                                                                        {Array(2)
                                                                                            .fill(null)
                                                                                            .map((_, index) => (
                                                                                                <ChevronsRight
                                                                                                    key={index}
                                                                                                    className="h-4.5 w-4.5 text-purple-600"
                                                                                                />
                                                                                            ))}

                                                                                        <span className="text-xs md:text-sm font-semibold mx-2">
                                                                                            {itemName}
                                                                                        </span>

                                                                                        <span className="text-muted-foreground/70">
                                                                                            ({itemGroups[itemName].length} laporan)
                                                                                        </span>
                                                                                    </div>

                                                                                    {/* --- BUTTON (LEFT on mobile, RIGHT on desktop) --- */}
                                                                                    <div className="mt-2 md:mt-0 flex justify-start md:justify-end">
                                                                                        <Button
                                                                                            onClick={() => handleDownloadItemPdf(itemName)}
                                                                                            size="sm"
                                                                                            className="h-8 px-4 text-xs font-semibold bg-gradient-to-r from-slate-100 to-slate-50
          dark:from-slate-900 dark:to-slate-800 text-black
          border border-slate-300 dark:border-slate-700
          rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)]
          hover:shadow-[0_2px_10px_rgba(0,0,0,0.12)]
          hover:border-red-400 hover:text-red-600 
          dark:text-white dark:hover:text-red-400 dark:hover:border-red-500
          transition-all duration-200 active:scale-95"
                                                                                        >
                                                                                            <FileDown className="h-4 w-4 mr-2" />
                                                                                            Preview PDF
                                                                                        </Button>
                                                                                    </div>
                                                                                </div>
                                                                            </TableCell>
                                                                        </TableRow>


                                                                        {/* ➡️ Daftar Laporan dalam Subgrup Item */}
                                                                        {itemGroups[itemName].map((report) => (
                                                                            <TableRow
                                                                                key={report.id}
                                                                                className="hover:bg-muted/30 transition-colors cursor-pointer [&>td]:py-2 [&>td]:px-2"
                                                                                onClick={() => setSelectedReport(report)}
                                                                            >
                                                                                {/* Tanggal - Tampil di semua layar */}
                                                                                <TableCell className="sticky left-0 bg-card z-30 min-w-[100px] max-w-[100px] border-r border-border">
                                                                                    <div className="flex items-center text-xs text-muted-foreground">
                                                                                        <Calendar className="h-3.5 w-3.5 text-purple-600 mr-1 flex-shrink-0" />
                                                                                        <div className="flex flex-row">
                                                                                            <span className="text-[10px] font-medium whitespace-nowrap">
                                                                                                {new Date(report.reportedAt).toLocaleDateString('id-ID', {
                                                                                                    day: 'numeric',
                                                                                                    month: 'short',
                                                                                                })}
                                                                                            </span>
                                                                                            <span className="text-[9px] text-muted-foreground/70 whitespace-nowrap">
                                                                                                {new Date(report.reportedAt).toLocaleTimeString('id-ID', {
                                                                                                    hour: '2-digit',
                                                                                                    minute: '2-digit',
                                                                                                })}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                </TableCell>

                                                                                {/* Status Progress - Tampil di semua layar */}
                                                                                <TableCell className="sticky left-[100px] bg-card z-20 min-w-[110px] max-w-[110px] border-r border-border">
                                                                                    <div className="flex flex-col gap-1">
                                                                                        {report.type === 'PROGRESS' ? (
                                                                                            <div className="flex items-center gap-1 px-1 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                                                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse flex-shrink-0"></div>
                                                                                                <span className="text-[10px] whitespace-nowrap truncate">Progress {report.progress}%</span>
                                                                                            </div>
                                                                                        ) : report.type === 'FINAL' ? (
                                                                                            <div className="flex items-center gap-1 px-1 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                                                                <CheckCircle className="w-2.5 h-2.5 flex-shrink-0" />
                                                                                                <span className="text-[10px] whitespace-nowrap truncate">Selesai {report.progress}%</span>
                                                                                            </div>
                                                                                        ) : (
                                                                                            <div className="flex items-center gap-1 px-1 py-0.5 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                                                                <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                                                                                                <span className="text-[10px] whitespace-nowrap truncate">Menunggu</span>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </TableCell>

                                                                                {/* Status Approval - Tampil di semua layar */}
                                                                                <TableCell className="sticky left-[210px] bg-card z-10 min-w-[90px] max-w-[90px]">
                                                                                    <div className="flex flex-col gap-1">
                                                                                        {report.status === 'PENDING' ? (
                                                                                            <div className="flex items-center gap-1 px-1 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                                                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse flex-shrink-0"></div>
                                                                                                <span className="text-[10px] whitespace-nowrap">Menunggu</span>
                                                                                            </div>
                                                                                        ) : report.status === 'APPROVED' ? (
                                                                                            <div className="flex items-center gap-1 px-1 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                                                                <CheckCircle className="w-2.5 h-2.5 flex-shrink-0" />
                                                                                                <span className="text-[10px] whitespace-nowrap">Disetujui</span>
                                                                                            </div>
                                                                                        ) : (
                                                                                            <div className="flex items-center gap-1 px-1 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                                                                                <X className="w-2.5 h-2.5 flex-shrink-0" />
                                                                                                <span className="text-[10px] whitespace-nowrap">Ditolak</span>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </TableCell>

                                                                                {/* Catatan - Hanya desktop */}
                                                                                <TableCell className="hidden sm:table-cell max-w-[120px]">
                                                                                    {report.note ? (
                                                                                        <div className="flex items-start gap-1">
                                                                                            <FileText className="w-3 h-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                                                                                            <span className="text-xs text-muted-foreground line-clamp-2">
                                                                                                {report.note}
                                                                                            </span>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <span className="text-xs text-muted-foreground/70">-</span>
                                                                                    )}
                                                                                </TableCell>

                                                                                {/* Karyawan - Hanya desktop */}
                                                                                <TableCell className="hidden sm:table-cell">
                                                                                    <div className="flex items-start gap-1">
                                                                                        <UserCheck2Icon className="w-4 h-4 mt-0.5 text-orange-700 flex-shrink-0" />
                                                                                        <span className="text-xs text-muted-foreground line-clamp-2">
                                                                                            {report.karyawanName}
                                                                                        </span>
                                                                                    </div>
                                                                                </TableCell>

                                                                                {/* Foto - Hanya desktop */}
                                                                                <TableCell className="hidden sm:table-cell">
                                                                                    {report.photos.length > 0 ? (
                                                                                        <Dialog>
                                                                                            <DialogTrigger asChild>
                                                                                                <div className="flex items-center gap-1 cursor-pointer hover:opacity-80">
                                                                                                    <div className="relative">
                                                                                                        <Camera className="w-3.5 h-3.5 text-blue-500" />
                                                                                                        {report.photos.length > 1 && (
                                                                                                            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[8px] rounded-full w-3 h-3 flex items-center justify-center">
                                                                                                                {report.photos.length}
                                                                                                            </span>
                                                                                                        )}
                                                                                                    </div>
                                                                                                    <span className="text-xs text-muted-foreground">{report.photos.length}</span>
                                                                                                </div>
                                                                                            </DialogTrigger>
                                                                                            <DialogContent className="max-w-4xl p-4 border-cyan-300">
                                                                                                <DialogHeader>
                                                                                                    <DialogTitle>Foto Bukti</DialogTitle>
                                                                                                </DialogHeader>
                                                                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                                                                                    {report.photos.map((photo: string, idx: number) => {
                                                                                                        const getPhotoUrl = (path: string) => {
                                                                                                            if (path.startsWith("http")) return path;
                                                                                                            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
                                                                                                            const normalizedPath = path.startsWith("/") ? path : `/${path}`;
                                                                                                            return `${baseUrl}${normalizedPath}`;
                                                                                                        };
                                                                                                        const photoUrl = getPhotoUrl(photo);

                                                                                                        return (
                                                                                                            <div
                                                                                                                key={idx}
                                                                                                                className="group relative aspect-square rounded-xl overflow-hidden border border-border/40 bg-muted/30 cursor-pointer"
                                                                                                                onClick={() => window.open(photoUrl, "_blank")}
                                                                                                            >
                                                                                                                <Image
                                                                                                                    src={photoUrl}
                                                                                                                    alt={`bukti-${idx + 1}`}
                                                                                                                    fill
                                                                                                                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                                                                                                                    sizes="(max-width: 768px) 50vw, 25vw"
                                                                                                                    onError={(e) => {
                                                                                                                        e.currentTarget.src = "/images/placeholder-image.svg";
                                                                                                                    }}
                                                                                                                />
                                                                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                                                                    <ZoomIn className="h-6 w-6 text-white drop-shadow" />
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        );
                                                                                                    })}
                                                                                                </div>
                                                                                            </DialogContent>
                                                                                        </Dialog>
                                                                                    ) : (
                                                                                        <span className="text-xs text-muted-foreground/70">-</span>
                                                                                    )}
                                                                                </TableCell>

                                                                                {/* Aksi - Tampil di semua layar */}
                                                                                <TableCell className="sticky right-0 z-40 bg-card border-l border-border min-w-[50px] max-w-[50px]">
                                                                                    <div className="flex items-center justify-end">
                                                                                        <Button
                                                                                            variant="outline"
                                                                                            size="sm"
                                                                                            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                setSelectedReport(report);
                                                                                                setModalType('view');
                                                                                            }}
                                                                                        >
                                                                                            <Eye className="h-3 w-3" />
                                                                                        </Button>

                                                                                        {/* Tombol Approve/Reject hanya untuk admin dan hanya di desktop */}
                                                                                        {['admin', 'pic'].includes(role) && (
                                                                                            <>
                                                                                                <Button
                                                                                                    variant="outline"
                                                                                                    size="sm"
                                                                                                    className="hidden sm:flex h-7 w-7 p-0 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 ml-1"
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        setSelectedReport(report);
                                                                                                        setModalType('approve');
                                                                                                    }}
                                                                                                >
                                                                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                                                                </Button>

                                                                                                <Button
                                                                                                    variant="outline"
                                                                                                    size="sm"
                                                                                                    className="hidden sm:flex h-7 w-7 p-0 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 ml-1"
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        setSelectedReport(report);
                                                                                                        setModalType('reject');
                                                                                                    }}
                                                                                                >
                                                                                                    <X className="h-3.5 w-3.5" />
                                                                                                </Button>
                                                                                            </>
                                                                                        )}

                                                                                    </div>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </Fragment>
                                                                ));
                                                            })()}
                                                        </Fragment>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                        {/* ✅ Pagination Controls */}
                                        {reports.length > 0 && totalPages > 1 && (
                                            <div className="flex flex-col mt-4 space-y-2 px-1">
                                                {/* Info jumlah data */}
                                                <div className="text-xs text-muted-foreground">
                                                    Menampilkan {startIndex + 1}–{Math.min(startIndex + itemsPerPage, reports.length)} dari {reports.length} laporan
                                                </div>

                                                {/* Pagination buttons */}
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => goToPage(currentPage - 1)}
                                                        disabled={currentPage === 1}
                                                        className="h-7 px-2 text-xs"
                                                    >
                                                        <ChevronLeft className="h-3.5 w-3.5" />
                                                    </Button>

                                                    {/* Tombol nomor halaman */}
                                                    {(() => {
                                                        const pages = [];
                                                        const maxVisible = 5;
                                                        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                                                        const endPage = Math.min(totalPages, startPage + maxVisible - 1);

                                                        if (endPage - startPage + 1 < maxVisible) {
                                                            startPage = Math.max(1, endPage - maxVisible + 1);
                                                        }

                                                        for (let i = startPage; i <= endPage; i++) {
                                                            pages.push(
                                                                <Button
                                                                    key={i}
                                                                    variant={currentPage === i ? "default" : "outline"}
                                                                    size="sm"
                                                                    onClick={() => goToPage(i)}
                                                                    className={`h-7 w-7 p-0 text-xs ${currentPage === i ? "bg-purple-600 text-white hover:bg-purple-700" : ""
                                                                        }`}
                                                                >
                                                                    {i}
                                                                </Button>
                                                            );
                                                        }
                                                        return pages;
                                                    })()}

                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => goToPage(currentPage + 1)}
                                                        disabled={currentPage === totalPages}
                                                        className="h-7 px-2 text-xs"
                                                    >
                                                        <ChevronRight className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                </div>

                                {/* ✅ Action Bar — DIPISAHKAN dari scroll area, sticky di bottom card */}
                                <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-end bg-cyan-800 py-2 px-3 rounded-b-lg border-t border-border/40">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleBack}
                                        className="
    hidden sm:flex
    text-white hover:bg-white/20 transition-colors
    bg-transparent h-7
  "
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Kembali
                                    </Button>

                                    <Button variant="outline" size="sm" onClick={exportToCSV} className="text-xs h-7">
                                        <Download className="h-3 w-3 mr-1" />
                                        Ekspor CSV
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={downloadPDF}
                                        className="text-xs h-7"
                                    >
                                        <Download className="h-3 w-3 mr-1" />
                                        Preview PDF
                                    </Button>
                                    {/* Tombol Kembali - hidden di mobile */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleBack}
                                        className="sm:flex text-white bg-transparent hover:bg-white/20 transition-colors"
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-1" />
                                        Kembali ke SPK LIst
                                    </Button>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div >

            {/* Modal Detail Laporan */}
            {
                selectedReport && modalType && (
                    <Dialog
                        open={true}
                        onOpenChange={() => {
                            setSelectedReport(null);
                            setModalType(null);
                        }}
                    >
                        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto bg-background text-foreground border border-border/60 p-4 md:p-6 rounded-xl md:rounded-2xl shadow-2xl backdrop-blur-sm animate-in fade-in-90 slide-in-from-bottom-10 w-[95vw] mx-auto">
                            {/* Header Compact untuk Mobile */}
                            <DialogHeader className="mb-4 md:mb-6">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                                        <FileText className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <DialogTitle className="text-lg md:text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent line-clamp-2">
                                            Detail Laporan Lapangan
                                        </DialogTitle>
                                        <DialogDescription className="text-muted-foreground mt-1 text-xs md:text-sm">
                                            Informasi lengkap dan bukti pelaksanaan pekerjaan
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="space-y-3 md:space-y-4">
                                {/* Status & Timestamp - Compact Mobile */}
                                <div className="flex flex-col gap-3 p-3 md:p-4 bg-muted/30 rounded-lg md:rounded-xl border border-border/40">
                                    <div className="flex items-center justify-between">
                                        <Badge
                                            variant={selectedReport.type === 'PROGRESS' ? 'secondary' : 'default'}
                                            className="px-3 py-1.5 text-xs md:text-sm font-medium"
                                        >
                                            {selectedReport.type === 'PROGRESS' ? (
                                                <>
                                                    <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 inline" />
                                                    Progress
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 inline text-green-500" />
                                                    Selesai
                                                </>
                                            )}
                                        </Badge>

                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Calendar className="h-3.5 w-3.5" />
                                            <span>
                                                {new Date(selectedReport.reportedAt).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Waktu detail di baris terpisah */}
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(selectedReport.reportedAt).toLocaleTimeString('id-ID', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                        {' • '}
                                        {new Date(selectedReport.reportedAt).toLocaleDateString('id-ID', {
                                            weekday: 'short',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </div>
                                </div>

                                {/* Info SPK & Item - Grid Mobile */}
                                <div className="grid grid-cols-1 gap-3 md:gap-4">
                                    {/* Informasi SPK */}
                                    <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
                                        <CardHeader className="pb-2 md:pb-3">
                                            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                <FileSignature className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                                                Informasi SPK
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2 md:space-y-3">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Nomor SPK</p>
                                                <p className="font-semibold text-base md:text-lg truncate">{selectedReport.spkNumber}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Pelanggan</p>
                                                <p className="font-medium text-sm text-foreground truncate">{selectedReport.clientName}</p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Item Pekerjaan */}
                                    <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
                                        <CardHeader className="pb-2 md:pb-3">
                                            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                <Wrench className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                                                Item Pekerjaan
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Nama Item</p>
                                                <p className="font-semibold text-sm md:text-base leading-relaxed">
                                                    {selectedReport.itemName}
                                                </p>
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs text-muted-foreground">Progress Pekerjaan</span>
                                                    <span className="text-sm font-bold text-blue-600">{selectedReport.progress}%</span>
                                                </div>
                                                <div className="w-full bg-border/40 rounded-full h-2.5">
                                                    <div
                                                        className={`h-2.5 rounded-full transition-all duration-500 ${selectedReport.progress === 100
                                                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                                            : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                                                            }`}
                                                        style={{ width: `${selectedReport.progress}%` }}
                                                    ></div>
                                                </div>
                                                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                                                    <span>0%</span>
                                                    <span>50%</span>
                                                    <span>100%</span>
                                                </div>
                                            </div>

                                            {/* Info Pelapor */}
                                            <div className="pt-2 border-t border-border/40">
                                                <p className="text-xs text-muted-foreground mb-1">Pelapor</p>
                                                <div className="flex items-center gap-2">
                                                    <UserCheck2Icon className="h-3.5 w-3.5 text-orange-600" />
                                                    <span className="text-sm font-medium text-foreground">{selectedReport.karyawanName}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Catatan */}
                                {selectedReport.note && (
                                    <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
                                        <CardHeader className="pb-2 md:pb-3">
                                            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                <PenTool className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-500" />
                                                Catatan Lapangan
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="bg-muted/40 p-3 md:p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap border-l-4 border-blue-500/50 max-h-[200px] overflow-y-auto">
                                                {selectedReport.note}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Foto Bukti */}
                                {selectedReport.photos.length > 0 && (
                                    <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
                                        <CardHeader className="pb-2 md:pb-3">
                                            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                <Camera className="h-3.5 w-3.5 md:h-4 md:w-4 text-emerald-500" />
                                                Dokumentasi ({selectedReport.photos.length} foto)
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
                                                {selectedReport.photos.map((photo, idx) => {
                                                    const getPhotoUrl = (path: string) => {
                                                        if (path.startsWith('http')) return path;
                                                        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
                                                        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
                                                        return `${baseUrl}${normalizedPath}`;
                                                    };

                                                    const photoUrl = getPhotoUrl(photo);

                                                    return (
                                                        <div
                                                            key={idx}
                                                            className="group relative aspect-square rounded-lg md:rounded-xl overflow-hidden border border-border/40 bg-muted/30 hover:scale-105 transition-all duration-300 cursor-pointer"
                                                            onClick={() => window.open(photoUrl, '_blank')}
                                                        >
                                                            <Image
                                                                src={photoUrl}
                                                                alt={`Dokumentasi ${idx + 1}`}
                                                                fill
                                                                className="object-cover transition-transform duration-300 group-hover:scale-110"
                                                                sizes="(max-width: 768px) 50vw, 25vw"
                                                                onError={(e) => {
                                                                    e.currentTarget.src = '/images/placeholder-image.svg';
                                                                }}
                                                            />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                <ZoomIn className="h-5 w-5 md:h-6 md:w-6 text-white drop-shadow" />
                                                            </div>
                                                            <div className="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                                                {idx + 1}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Aksi Admin */}
                                {/* {role === 'admin' || role === 'pic' && ( */}
                                    <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
                                        <CardHeader className="pb-2 md:pb-3">
                                            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                <ShieldCheck className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-500" />
                                                Tindakan Admin
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                {/* Tombol Setujui */}
                                                <Button
                                                    variant="default"
                                                    size="lg"
                                                    className="flex-1 flex items-center justify-center gap-2 text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 transition-all hover:shadow-lg active:scale-95 h-12"
                                                    onClick={async () => {
                                                        try {
                                                            setIsApproving(true);
                                                            await handleApproveReport(selectedReport.id);
                                                            toast.success("Laporan disetujui");
                                                            setSelectedReport(null);
                                                            setModalType(null);
                                                        } catch (error) {
                                                            console.error("Gagal menyetujui laporan", error);
                                                            toast.error("Gagal menyetujui laporan");
                                                        } finally {
                                                            setIsApproving(false);
                                                        }
                                                    }}
                                                    disabled={selectedReport.status === 'APPROVED' || isApproving}
                                                >
                                                    {isApproving ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 animate-spin py-4" />
                                                            Menyimpan...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle className="h-4 w-4 py-4" />
                                                            Setujui
                                                        </>
                                                    )}
                                                </Button>

                                                {/* Tombol Hapus */}
                                                <Button
                                                    variant="destructive"
                                                    size="lg"
                                                    className="flex-1 flex items-center justify-center gap-2 text-sm font-medium transition-transform hover:scale-105 active:scale-95 h-12"
                                                    onClick={async (e) => {
                                                        e.stopPropagation();

                                                        // Prompt konfirmasi sebelum menghapus
                                                        const confirmed = await new Promise((resolve) => {
                                                            const confirmed = window.confirm(
                                                                "Apakah Anda yakin ingin menghapus laporan ini?\n\n" +
                                                                "Tindakan ini tidak dapat dibatalkan dan semua data laporan akan dihapus permanen."
                                                            );
                                                            resolve(confirmed);
                                                        });

                                                        if (!confirmed) return;

                                                        try {
                                                            setIsDeleting(true);
                                                            await handleRejectReport(selectedReport.id);
                                                            toast.success("Laporan berhasil dihapus");
                                                            setSelectedReport(null);
                                                            setModalType(null);
                                                        } catch (error) {
                                                            console.error("Error saat hapus laporan:", error);
                                                            toast.error("Gagal menghapus laporan");
                                                        } finally {
                                                            setIsDeleting(false);
                                                        }
                                                    }}
                                                    disabled={isDeleting}
                                                >
                                                    {isDeleting ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            Menghapus...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Trash2 className="h-4 w-4" />
                                                            Hapus
                                                        </>
                                                    )}
                                                </Button>
                                            </div>

                                            {/* Status Approval */}
                                            {selectedReport.status !== 'PENDING' && (
                                                <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border/40">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-muted-foreground">Status:</span>
                                                        <Badge
                                                            variant={selectedReport.status === 'APPROVED' ? 'success' : 'destructive'}
                                                            className="text-xs font-medium"
                                                        >
                                                            {selectedReport.status === 'APPROVED' ? (
                                                                <>
                                                                    <CheckCircle className="h-3 w-3 mr-1 inline" />
                                                                    Disetujui
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <X className="h-3 w-3 inline py-4" />
                                                                    Ditolak
                                                                </>
                                                            )}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                {/* )} */}
                            </div>

                            <DialogFooter className="pt-2 mt-1 border-t border-border/40">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedReport(null);
                                        setModalType(null);
                                    }}
                                    className="w-full sm:w-auto transition-transform hover:scale-105 active:scale-95 h-10"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Tutup
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )
            }

            {previewSpk && reports && (
                <PreviewPdf
                    reports={reports}
                    initialSpk={previewSpk}
                    open={!!previewSpk}
                    onOpenChange={(open) => !open && setPreviewSpk(undefined)}
                />
            )}

            {/* Preview PDF Dialog */}
            <PreviewPdfDetail
                reports={reports}
                initialSpk={dataSpk?.spkNumber || ''}
                initialItemGroup={selectedItemForPdf}
                open={previewPdfOpen}
                onOpenChange={setPreviewPdfOpen}
            />

            {/* Style Animasi */}
            <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
        </div >
    );
};

const SkeletonLoader = () => {
    return (
        <div className="h-full w-full p-3">
            <div className="flex flex-col gap-3">
                {/* Header Skeleton */}
                <div className="bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 p-4 rounded-lg animate-pulse h-16"></div>

                {/* Filter Skeleton */}
                <div className="bg-muted/30 rounded-lg p-3 animate-pulse">
                    <div className="flex justify-between items-center mb-3">
                        <div>
                            <div className="h-4 w-24 bg-muted rounded mb-1"></div>
                            <div className="h-3 w-32 bg-muted rounded"></div>
                        </div>
                        <div className="flex gap-2">
                            <div className="h-7 w-14 bg-muted rounded"></div>
                            <div className="h-7 w-16 bg-muted rounded"></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-muted rounded-lg p-2 animate-pulse">
                                <div className="h-3 w-12 bg-muted-foreground/20 rounded mb-1"></div>
                                <div className="h-4 w-8 bg-muted-foreground/30 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Skeleton */}
                <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-card border border-border/40 rounded-lg p-3 animate-pulse">
                            <div className="flex justify-between items-start mb-2">
                                <div className="space-y-1 flex-1">
                                    <div className="h-3 w-20 bg-muted rounded"></div>
                                    <div className="h-3 w-32 bg-muted rounded"></div>
                                </div>
                                <div className="space-y-1">
                                    <div className="h-4 w-12 bg-muted rounded"></div>
                                    <div className="h-4 w-8 bg-muted rounded"></div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <div className="space-y-1">
                                    <div className="h-2 w-12 bg-muted rounded"></div>
                                    <div className="h-3 w-16 bg-muted rounded"></div>
                                </div>
                                <div className="space-y-1">
                                    <div className="h-2 w-12 bg-muted rounded"></div>
                                    <div className="h-3 w-14 bg-muted rounded"></div>
                                </div>
                            </div>
                            <div className="mb-2">
                                <div className="flex justify-between mb-1">
                                    <div className="h-2 w-10 bg-muted rounded"></div>
                                    <div className="h-2 w-6 bg-muted rounded"></div>
                                </div>
                                <div className="w-full bg-muted rounded-full h-1.5"></div>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="h-2 w-16 bg-muted rounded"></div>
                                <div className="flex gap-1">
                                    <div className="h-6 w-6 bg-muted rounded"></div>
                                    <div className="h-6 w-6 bg-muted rounded"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FormMonitoringProgressSpkByID;