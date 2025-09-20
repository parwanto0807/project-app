"use client";
import { Fragment } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Camera, CheckCircle, Clock, X, Archive, TrendingUp, FileText, Eye, Loader2, Download, ZoomIn, ChevronRight, ChevronLeft, Calendar, ChevronsRight, PackageOpenIcon, MoveRight, Wrench, PenTool, FileSignature, ShieldCheck, Trash2, UserCheck2Icon, Filter } from 'lucide-react';
import Image from 'next/image';
import { deleteReport, fetchSPKReports } from '@/lib/action/master/spk/spkReport';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { updateReportStatus } from '@/lib/action/master/spk/spkReport';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { ScrollArea } from '../ui/scroll-area';
import { DialogTrigger } from '@radix-ui/react-dialog';
import PreviewPdf from './previewPdfSpk';


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
    dataSpk: SPKDataApi[];
    isLoading: boolean;
    userEmail: string;
    role: string;
    userId: string;
}

type ItemProgress = Record<string, number>; // key: soDetailId, value: progress
type SPKItemProgressMap = Record<string, ItemProgress>; // key: spkNumber


const FormMonitoringProgressSpk = ({ dataSpk, isLoading, userEmail, role, userId }: FormMonitoringProgressSpkProps) => {
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
        status: 'all' as 'all' | 'PENDING' | 'APPROVED' | 'REJECTED', // ✅ BENAR!
        spkId: '',
        karyawanId: '',
    });

    const [selectedReport, setSelectedReport] = useState<ReportHistory | null>(null);
    const [modalType, setModalType] = useState<'view' | 'approve' | 'reject' | null>(null);
    const [userSpk, setUserSpk] = useState<SPKData[]>([]);
    const [spkItemProgress, setSpkItemProgress] = useState<SPKItemProgressMap>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [previewSpk, setPreviewSpk] = useState<string | undefined>(undefined);


    console.log("User", userId, spkItemProgress)
    // console.log("Data SPK", dataSpk);
    // console.log("Data SO Item", selectedSpk);
    // console.log("User SPK", userSpk);
    // console.log("Report", reports);
    // console.log("Total Progress", summaryProgress);

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

    // 👇 MAP KE SPKData (DIBENARKAN)
    const mapToSPKData = (raw: SPKDataApi[]): SPKData[] => {
        return raw.map(item => {
            // 1. Ambil clientName dari salesOrder.customer.name
            const clientName = item.salesOrder?.customer?.name || 'Client Tidak Dikenal';
            const projectName = item.salesOrder?.project?.name || 'Project Tidak Dikenal';
            const assignedTo =
                item.team?.teamKaryawan?.karyawan?.namaLengkap ||
                item.createdBy?.namaLengkap ||
                'Tidak Ditugaskan';

            // 4. Hitung progress total SPK: berdasarkan jumlah detail yang DONE
            const totalDetails = item.details?.length || 0;
            const completedDetails = item.details?.filter(d => d.status === 'DONE').length || 0;
            const progress = totalDetails > 0 ? Math.round((completedDetails / totalDetails) * 100) : 0;
            const teamName = item.team?.namaTeam || 'Team belum ditentukan'
            const email = item.team?.teamKaryawan?.karyawan?.email || ' Email belum ditentukan'

            // 5. Tentukan status SPK berdasarkan progress — SESUAI DENGAN INTERFACE SPKData
            let status: 'PENDING' | 'PROGRESS' | 'COMPLETED';
            if (progress === 100) status = 'COMPLETED';
            else if (progress > 0) status = 'PROGRESS';
            else status = 'PENDING';

            // 6. Deadline: gunakan spkDate sebagai deadline
            const deadline = new Date(item.spkDate).toISOString();

            // 👇 NEW: Mapping items dari salesOrder + hitung progress per item
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
                    clientName: clientName,
                    projectName: projectName,
                };
            }) || []; // Jika salesOrder.items tidak ada, kembalikan array kosong

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
                items, // 👈 Tambahkan field items ini
            };
        });
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
        if (dataSpk && dataSpk.length > 0) {
            const mapped = mapToSPKData(dataSpk);
            setUserSpk(mapped);
        } else {
            setUserSpk([]);
        }
    }, [dataSpk]);


    const filteredUserSpk = userSpk.filter(spk => {
        if (role === 'admin' || role === 'super' || role === 'user') return true;
        return spk.email === userEmail;
    });

    // 👇 FETCH RIWAYAT LAPORAN DARI BACKEND
    const fetchReports = useCallback(async () => {
        setLoadingReports(true);
        try {
            let reports = await fetchSPKReports(filters);

            // ✅ FILTER di frontend sesuai userEmail (kecuali admin/super)
            if (role !== "admin" && role !== "super") {
                reports = reports.filter(r => r.email === userEmail);
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
    }, [filters, userEmail, role]);


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


    // 👇 DOWNLOAD PDF
    const downloadPDF = () => {
        if (!filters.spkId) {
            toast.error("Anda harus memilih SPK terlebih dahulu");
            return;
        }

        // Cari spkNumber dari list
        const selectedSpk = filteredUserSpk.find(spk => spk.id === filters.spkId);
        // console.log("Selected SPK for PDF:", selectedSpk);
        if (!selectedSpk) {
            toast.error("SPK tidak ditemukan");
            return;
        }

        // Set spkNumber, bukan spkId
        setPreviewSpk(selectedSpk.spkNumber);
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
                    {role === 'admin' || role === 'super'
                        ? 'Belum ada SPK yang terdaftar.'
                        : `Tidak ada SPK yang ditugaskan ke ${userEmail}.`}
                </p>
            </div>
        );
    }

    return (
        <div className="h-full w-full p-1 md:p-2">
            <div className="flex flex-col gap-4">
                {/* Header */}
                <div className="flex flex-col gap-1 bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-lg text-white shadow-lg transform transition-all duration-300 hover:shadow-xl">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 md:h-7 md:w-7" />
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Laporan Progress SPK</h1>
                    </div>
                    <p className="text-xs md:text-sm text-blue-100 opacity-90">
                        {role === 'admin' || role === 'super'
                            ? 'Monitor semua SPK yang sedang berjalan'
                            : `Laporkan progress pekerjaan untuk SPK yang ditugaskan kepada Anda`}
                    </p>
                </div>

                <Card className="border-border/40 bg-card/90 backdrop-blur-sm shadow-md rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg">
                    {/* Header Card — Judul + Filter */}
                    <CardHeader className="pb-4 pt-3 bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/30 dark:to-gray-800 sticky top-0 z-10">
                        <div className="flex flex-col md:grid md:grid-cols-10 gap-4">
                            {/* Judul - Mobile Layout */}
                            <div className='flex md:col-span-1 md:col-start-1 justify-between items-center md:block'>
                                <div className='flex flex-col'>
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <Archive className="h-4 w-4 text-purple-600" />
                                        <span className="hidden md:inline">Riwayat Laporan</span>
                                        <span className="md:hidden">Laporan</span>
                                    </CardTitle>
                                    <CardDescription className="text-xs">Riwayat laporan SPK Anda</CardDescription>
                                </div>

                                {/* Mobile Filter Button & Items Per Page - Now in the same row */}
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
                                                    <div>
                                                        <Label className="text-xs font-medium mb-2">SPK</Label>
                                                        <Select value={filters.spkId} onValueChange={(v) => setFilters({ ...filters, spkId: v })}>
                                                            <SelectTrigger className="h-10 text-xs border-border/60">
                                                                <SelectValue placeholder="Semua SPK" />
                                                            </SelectTrigger>
                                                            <SelectContent className="text-xs max-h-48 overflow-y-auto">
                                                                {filteredUserSpk.map(spk => (
                                                                    <SelectItem key={spk.id} value={spk.id}>
                                                                        {spk.spkNumber} - {spk.clientName}
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

                            {/* Desktop Filters */}
                            <div className="hidden md:flex md:col-span-1 md:col-start-3">
                                <div className='flex gap-4'>
                                    <Label className="text-xs font-medium">SPK</Label>
                                    <Select value={filters.spkId} onValueChange={(v) => setFilters({ ...filters, spkId: v })}>
                                        <SelectTrigger className="h-10 text-xs border-border/60 mt-3">
                                            <SelectValue placeholder="Semua SPK" />
                                        </SelectTrigger>
                                        <SelectContent className="text-xs max-h-48 overflow-y-auto">
                                            {filteredUserSpk.map(spk => (
                                                <SelectItem key={spk.id} value={spk.id}>
                                                    {spk.spkNumber} - {spk.clientName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="hidden md:flex md:col-span-2 md:col-start-8 md:pt-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-10 w-full text-xs"
                                    onClick={() => setFilters({ date: 'all', status: 'all', spkId: '', karyawanId: '' })}
                                >
                                    Reset Filter
                                </Button>
                            </div>

                            <div className="hidden md:flex md:col-span-2 md:col-start-10 gap-2 items-center">
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
                                                <TableRow className="[&>th]:py-0 [&>th]:px-2 [&>th]:text-xs [&>th]:font-semibold">
                                                    <TableHead className="w-[40px]">SPK Number, Pelanggan, Project Name </TableHead>
                                                    <TableHead className="w-[40px]"></TableHead>
                                                    <TableHead className="w-[100px]">Team Lead. Lapangan</TableHead>
                                                    <TableHead className="w-[100px]">Progress</TableHead>
                                                    <TableHead className="w-[50px]">Approve Admin</TableHead>
                                                    <TableHead className="w-[80px]">Foto</TableHead>
                                                    {role === 'admin' && (
                                                        <TableHead className="w-[110px] sticky right-0 bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/30 dark:to-gray-800 z-10">
                                                            Aksi
                                                        </TableHead>
                                                    )}
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
                                                            <TableRow className="bg-purple-50 dark:bg-purple-900/20 [&>td]:py-4 [&>td]:px-2 [&>td]:text-sm [&>td]:font-bold">
                                                                <TableCell colSpan={role === 'admin' ? 7 : 6} className="sticky left-0 z-10 bg-purple-50 dark:bg-purple-900/20">
                                                                    <div className="flex items-center gap-2 py-2">
                                                                        <Archive className="h-4 w-4 text-purple-600" />
                                                                        <span>SPK: {spkNumber}</span>
                                                                        {spk && (
                                                                            <>
                                                                                <span className="text-muted-foreground">—</span>
                                                                                <span className="text-muted-foreground">{spk.clientName}</span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex text-muted-foreground line-clamp-1 ml-6 gap-2">
                                                                        <PackageOpenIcon className="h-4 w-4 text-purple-600 mt-0.5" />
                                                                        {userSpk.find((i) => i.spkNumber === spk?.spkNumber)?.projectName ?? "-"}
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
                                                                        <TableRow className="bg-blue-50/50 dark:bg-blue-900/10 [&>td]:py-2 [&>td]:px-0 [&>td]:text-xs [&>td]:font-medium">
                                                                            <TableCell colSpan={role === 'admin' ? 7 : 6} className="pl-4 border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-900/10">
                                                                                <div className="flex items-center gap-0">
                                                                                    {/* ✅ Render ChevronsRight 10x */}
                                                                                    {Array(2)
                                                                                        .fill(null)
                                                                                        .map((_, index) => (
                                                                                            <ChevronsRight key={index} className="h-4.5 w-4.5 text-purple-600" />
                                                                                        ))}

                                                                                    <span className="text-sm font-semibold mx-2">{itemName}</span>
                                                                                    <span className="text-muted-foreground/70">
                                                                                        ({itemGroups[itemName].length} laporan)
                                                                                    </span>
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
                                                                                {/* Tanggal */}
                                                                                <TableCell>
                                                                                    <div className="flex text-xs text-muted-foreground ml-4 pr-4">
                                                                                        <MoveRight className="h-4.5 w-4.5 text-purple-600 mr-2" />
                                                                                        {new Date(report.reportedAt).toLocaleDateString('id-ID', {
                                                                                            day: 'numeric',
                                                                                            month: 'short',
                                                                                            year: 'numeric',
                                                                                        })}
                                                                                        {' '} {/* 👈 Tambahkan ini: spasi literal */}
                                                                                        {new Date(report.reportedAt).toLocaleTimeString('id-ID', {
                                                                                            hour: '2-digit',
                                                                                            minute: '2-digit',
                                                                                        })}
                                                                                    </div>
                                                                                </TableCell>

                                                                                {/* Catatan */}
                                                                                <TableCell className="max-w-[120px]">
                                                                                    {report.note ? (
                                                                                        <div className="flex items-start gap-1">
                                                                                            <FileText className="w-3 h-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                                                                                            <span className="text-xs text-muted-foreground line-clamp-2">{report.note}</span>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <span className="text-xs text-muted-foreground/70">-</span>
                                                                                    )}
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                    <div className="flex items-start gap-1">
                                                                                        <UserCheck2Icon className="w-4 h-4 mt-0.5 text-orange-700 flex-shrink-0" />
                                                                                        <span className="text-xs text-muted-foreground line-clamp-2">{report.karyawanName}</span>
                                                                                    </div>
                                                                                </TableCell>
                                                                                {/* Status */}
                                                                                <TableCell className="sticky left-0 bg-card z-10">
                                                                                    <div className="flex flex-col gap-1">
                                                                                        {report.type === 'PROGRESS' ? (
                                                                                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                                                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                                                                                                <span className="text-xs">Progress - {report.progress}%</span>
                                                                                            </div>
                                                                                        ) : report.type === 'FINAL' ? (
                                                                                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                                                                <CheckCircle className="w-3 h-3" />
                                                                                                <span className="text-xs">Selesai - {report.progress}% </span>
                                                                                            </div>
                                                                                        ) : (
                                                                                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                                                                <Clock className="w-3 h-3" />
                                                                                                <span className="text-xs">Menunggu</span>
                                                                                            </div>
                                                                                        )}

                                                                                    </div>
                                                                                </TableCell>
                                                                                <TableCell className="sticky left-0 bg-card z-10">
                                                                                    <div className="flex flex-col gap-1">

                                                                                        {report.status === 'PENDING' ? (
                                                                                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                                                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                                                                                                <span className="text-xs">Menunggu ⏳</span>
                                                                                            </div>
                                                                                        ) : report.status === 'APPROVED' ? (
                                                                                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                                                                <CheckCircle className="w-3 h-3" />
                                                                                                <span className="text-xs">Disetujui ✅</span>
                                                                                            </div>
                                                                                        ) : (
                                                                                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                                                                                <X className="w-3 h-3" />
                                                                                                <span className="text-xs">Ditolak ❌</span>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </TableCell>
                                                                                {/* Foto */}
                                                                                <TableCell>
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

                                                                                {/* Aksi (Admin Only) */}
                                                                                {role === 'admin' && (
                                                                                    <TableCell className="sticky right-0 bg-card z-10">
                                                                                        <div className="flex items-center gap-1">
                                                                                            <Button
                                                                                                variant="outline"
                                                                                                size="sm"
                                                                                                className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    setSelectedReport(report);
                                                                                                    setModalType('view');
                                                                                                }}
                                                                                            >
                                                                                                <Eye className="h-3.5 w-3.5" />
                                                                                            </Button>
                                                                                            <Button
                                                                                                variant="outline"
                                                                                                size="sm"
                                                                                                className="h-7 w-7 p-0 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
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
                                                                                                className="h-7 w-7 p-0 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    setSelectedReport(report);
                                                                                                    setModalType('reject');
                                                                                                }}
                                                                                            >
                                                                                                <X className="h-3.5 w-3.5" />
                                                                                            </Button>
                                                                                        </div>
                                                                                    </TableCell>
                                                                                )}
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
                                    <Button variant="outline" size="sm" onClick={exportToCSV} className="text-xs h-7">
                                        <Download className="h-3 w-3 mr-1" />
                                        Ekspor CSV
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={downloadPDF} // ← Panggil fungsi yang membuka modal
                                        // disabled={!selectedReport}
                                        className="text-xs h-7"
                                    >
                                        <Download className="h-3 w-3 mr-1" />
                                        Unduh PDF
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
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background text-foreground border border-border/60 p-6 rounded-2xl shadow-2xl backdrop-blur-sm animate-in fade-in-90 slide-in-from-bottom-10">
                            <DialogHeader className="mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <FileText className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                                            Detail Laporan Lapangan
                                        </DialogTitle>
                                        <DialogDescription className="text-muted-foreground mt-1">
                                            Informasi lengkap dan bukti pelaksanaan pekerjaan
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="space-y-2">
                                {/* Status & Timestamp */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/30 rounded-xl border border-border/40">
                                    <Badge
                                        variant={selectedReport.type === 'PROGRESS' ? 'secondary' : 'default'}
                                        className="px-4 py-2 text-sm font-medium"
                                    >
                                        {selectedReport.type === 'PROGRESS' ? (
                                            <>
                                                <Clock className="h-4 w-4 mr-1.5 inline" />
                                                Progress Pekerjaan
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="h-4 w-4 mr-1.5 inline text-green-500" />
                                                Laporan Selesai
                                            </>
                                        )}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        {new Date(selectedReport.reportedAt).toLocaleString('id-ID', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </div>

                                {/* Info SPK & Item */}
                                {/* Info SPK & Item — Ringkas tanpa Card */}
                                <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">

                                    {/* Informasi SPK */}
                                    <div className="bg-muted/30 border border-border/40 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <FileSignature className="h-4 w-4 text-muted-foreground" />
                                            <h5 className="text-sm font-medium text-muted-foreground">Informasi SPK</h5>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Nomor SPK</p>
                                                <p className="font-semibold text-lg">{selectedReport.spkNumber}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Item Pekerjaan */}
                                    <div className="bg-muted/30 border border-border/40 rounded-xl p-4 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Wrench className="h-4 w-4 text-muted-foreground" />
                                            <h5 className="text-sm font-medium text-muted-foreground">Item Pekerjaan</h5>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Nama Item</p>
                                                <p className="font-semibold text-lg">{selectedReport.itemName}</p>
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-muted-foreground">Progress</span>
                                                    <span className="text-sm font-medium">{selectedReport.progress}%</span>
                                                </div>
                                                <div className="w-full bg-border/40 rounded-full h-2 mt-1.5">
                                                    <div
                                                        className={`h-2 rounded-full transition-all duration-500 ${selectedReport.progress === 100
                                                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                                            : 'bg-gradient-to-r from-blue-500 to-primary'
                                                            }`}
                                                        style={{ width: `${selectedReport.progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                {/* Catatan */}
                                {selectedReport.note && (
                                    <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                <PenTool className="h-4 w-4 text-blue-500" />
                                                Catatan Lapangan
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="bg-muted/40 p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap border-l-4 border-blue-500/50">
                                                {selectedReport.note}
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Foto Bukti */}
                                {selectedReport.photos.length > 0 && (
                                    <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                <Camera className="h-4 w-4 text-emerald-500" />
                                                Foto Bukti ({selectedReport.photos.length})
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
                                                            className="group relative aspect-square rounded-xl overflow-hidden border border-border/40 bg-muted/30 hover:scale-105 transition-all duration-300 cursor-pointer"
                                                            onClick={() => window.open(photoUrl, '_blank')}
                                                        >
                                                            <Image
                                                                src={photoUrl}
                                                                alt={`bukti-${idx + 1}`}
                                                                fill
                                                                className="object-cover transition-transform duration-300 group-hover:scale-110"
                                                                sizes="(max-width: 768px) 50vw, 25vw"
                                                                onError={(e) => {
                                                                    e.currentTarget.src = '/images/placeholder-image.svg';
                                                                }}
                                                            />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                <ZoomIn className="h-6 w-6 text-white drop-shadow" />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Aksi Admin */}
                                {role === 'admin' && (
                                    <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                <ShieldCheck className="h-4 w-4 text-blue-500" />
                                                Tindakan Admin
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-col sm:flex-row gap-4">
                                                {/* Tombol Hapus (Kiri) */}
                                                <Button
                                                    variant="destructive"
                                                    size="lg"
                                                    className="flex-1 flex items-center justify-center gap-2 text-base font-medium transition-transform hover:scale-105 active:scale-95"
                                                    onClick={async () => {
                                                        try {
                                                            setIsDeleting(true);
                                                            await handleRejectReport(selectedReport.id); // ✅ pastikan ini fungsi HAPUS
                                                            toast.success("Laporan berhasil dihapus");
                                                            setSelectedReport(null);
                                                            setModalType(null);
                                                        } catch (error) {
                                                            console.error("Error saat hapus laporan:", error); // 👈 gunakan error
                                                            toast.error("Gagal menghapus laporan");
                                                        } finally {
                                                            setIsDeleting(false);
                                                        }
                                                    }}
                                                    disabled={isDeleting}
                                                >
                                                    {isLoading ? (
                                                        <>
                                                            <Loader2 className="h-5 w-5 animate-spin" />
                                                            Menghapus...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Trash2 className="h-5 w-5" />
                                                            Hapus Laporan
                                                        </>
                                                    )}
                                                </Button>

                                                {/* Tombol Setujui (Kanan) */}
                                                <Button
                                                    variant="default"
                                                    size="lg"
                                                    className="flex-1 flex items-center justify-center gap-2 text-base font-medium bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 transition-all hover:shadow-lg active:scale-95"
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
                                                    {isLoading ? (
                                                        <>
                                                            <Loader2 className="h-5 w-5 animate-spin" />
                                                            Menyimpan...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle className="h-5 w-5" />
                                                            Setujui Laporan
                                                        </>
                                                    )}
                                                </Button>
                                            </div>

                                            {/* Status Approval */}
                                            {selectedReport.status !== 'PENDING' && (
                                                <div className="mt-6 p-4 bg-muted/30 rounded-xl border border-border/40">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-medium text-muted-foreground">Status Persetujuan:</span>
                                                        <Badge
                                                            variant={selectedReport.status === 'APPROVED' ? 'success' : 'destructive'}
                                                            className="px-4 py-2 text-sm font-medium"
                                                        >
                                                            {selectedReport.status === 'APPROVED' ? (
                                                                <>
                                                                    <CheckCircle className="h-4 w-4 mr-1.5 inline" />
                                                                    Disetujui
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <X className="h-4 w-4 mr-1.5 inline" />
                                                                    Ditolak
                                                                </>
                                                            )}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            <DialogFooter className="pt-6 mt-6 border-t border-border/40">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedReport(null);
                                        setModalType(null);
                                    }}
                                    className="w-full sm:w-auto transition-transform hover:scale-105 active:scale-95"
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
        <div className="h-full w-full p-3 md:p-4">
            <div className="flex flex-col gap-4">
                <div className="bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 p-4 rounded-lg animate-pulse h-20"></div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mb-3 h-10 bg-muted/30 rounded-lg p-1"></div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map(item => (
                        <div key={item} className="rounded-xl border bg-card/50 p-3 shadow-sm animate-pulse">
                            <div className="flex justify-between items-start mb-3">
                                <div className="h-4 w-20 bg-muted rounded"></div>
                                <div className="h-5 w-16 bg-muted rounded-full"></div>
                            </div>
                            <div className="h-3 w-32 bg-muted rounded mb-2"></div>
                            <div className="h-2 w-full bg-muted rounded mb-3"></div>
                            <div className="flex items-center gap-1 mb-2">
                                <div className="h-3 w-3 bg-muted rounded"></div>
                                <div className="h-3 w-16 bg-muted rounded"></div>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="h-3 w-3 bg-muted rounded"></div>
                                <div className="h-3 w-24 bg-muted rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FormMonitoringProgressSpk;