"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Camera, Upload, CheckCircle, Clock, X, Archive, Sparkles, TrendingUp, FileText, Eye, Loader2, Download, ZoomIn, ChevronRight, ChevronLeft, User, Calendar, Users2Icon } from 'lucide-react';
import Image from 'next/image';
import { createReportFormData, createSpkFieldReport, fetchSPKReports } from '@/lib/action/master/spk/spkReport';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
// import { fetchAllKaryawan } from '@/lib/action/master/karyawan';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Slider } from '../ui/slider';
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { updateReportStatus } from '@/lib/action/master/spk/spkReport';


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

// interface Karyawan {
//   id: string;
//   namaLengkap: string;
//   departemen?: string | null;
//   isLoading: boolean;
// }

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

// interface Karyawan {
//   id: string;
//   namaLengkap: string;
//   departemen?: string | null;
// }

// 👇 PERBAIKI: HAPUS 'success' dan 'message', karena API tidak kirim
// interface KaryawanResponse {
//   karyawan: Karyawan[];
//   isLoading: boolean;
// }

type ItemProgress = Record<string, number>; // key: soDetailId, value: progress
type SPKItemProgressMap = Record<string, ItemProgress>; // key: spkNumber

type TabType = 'list' | 'report' | 'history';

const FormMonitoringProgressSpk = ({ dataSpk, isLoading, userEmail, role, userId }: FormMonitoringProgressSpkProps) => {
  const [selectedSpk, setSelectedSpk] = useState<SPKData | null>(null);
  const [formData, setFormData] = useState<ProgressFormData>({
    spkId: '',
    note: '',
    type: 'PROGRESS',
    progress: 0,
    minProgress: 0,
    photos: [],
    items: null,
  });
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('list');
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
  // const [karyawans, setKaryawans] = useState<Karyawan[]>([]);
  const [userSpk, setUserSpk] = useState<SPKData[]>([]);
  // const [loadingKaryawans, setLoadingKaryawans] = useState(false);
  const [spkItemProgress, setSpkItemProgress] = useState<SPKItemProgressMap>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // console.log("Data SPK", dataSpk);
  // console.log("Data SO Item", selectedSpk);
  console.log("User SPK", userSpk);
  // console.log("Report", reports);
  // console.log("Total Progress", summaryProgress);

  const totalPages = Math.ceil(reports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentReports = reports.slice(startIndex, startIndex + itemsPerPage);

  // Handler ganti halaman
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getSPKFieldProgress = (spk: SPKData): number => {
    const itemProgressMap = spkItemProgress[spk.spkNumber];
    if (!itemProgressMap) return 0;

    const reportedProgresses = spk.items.map(item => itemProgressMap[item.id] ?? 0);
    const totalProgress = reportedProgresses.reduce((sum, p) => sum + p, 0);
    return Math.round(totalProgress / spk.items.length);
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
        };
      }) || []; // Jika salesOrder.items tidak ada, kembalikan array kosong

      return {
        id: item.id,
        spkNumber: item.spkNumber,
        clientName,
        projectName,
        status,
        teamName,
        progress,
        deadline,
        assignedTo,
        items, // 👈 Tambahkan field items ini
      };
    });
  };

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
    if (role === 'admin' || role === 'super') return true;
    return spk.assignedTo === userEmail;
  });

  // 👇 FETCH RIWAYAT LAPORAN DARI BACKEND
  const fetchReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const reports = await fetchSPKReports(filters);
      setReports(reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Gagal memuat riwayat laporan');
    } finally {
      setLoadingReports(false);
    }
  }, [filters]);



  // 👇 FETCH DAFTAR KARYAWAN UNTUK FILTER ADMIN
  // useEffect(() => {
  //   if (role === 'admin') {
  //     const fetchKaryawans = async () => {
  //       setLoadingKaryawans(true);
  //       try {
  //         const response: KaryawanResponse = await fetchAllKaryawan(); // ✅ Sekarang valid!

  //         setKaryawans(response.karyawan); // ✅ Langsung assign array
  //       } catch (error) {
  //         console.error('Error fetching karyawans:', error);
  //         toast.error('Gagal memuat daftar karyawan');
  //       } finally {
  //         setLoadingKaryawans(false);
  //       }
  //     };

  //     fetchKaryawans();
  //   }
  // }, [role]);

  // 👇 EFFECT: Fetch riwayat saat filter berubah
  useEffect(() => {
    fetchReports();
  }, [filters, fetchReports]);

  // 👇 HANDLE UPLOAD FOTO
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPhotos = Array.from(files);
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos],
    }));
    e.target.value = ''; // Reset input
  }

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  // 👇 SUBMIT LAPORAN
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      if (!formData.note) {
        toast.error("Catatan harus diisi", { description: "Silakan isi catatan progress sebelum mengirim laporan." });
        setUploading(false);
        return;
      }

      if (!selectedSpk) {
        toast.error("SPK tidak ditemukan", { description: "Silakan pilih SPK terlebih dahulu." });
        setUploading(false);
        return;
      }

      const isValidItem = selectedSpk.items.some(item => item.id === formData.items);
      if (!formData.items || !isValidItem) {
        toast.error("Item yang dipilih tidak valid untuk SPK ini", { description: "Silakan pilih item dari daftar yang tersedia." });
        setUploading(false);
        return;
      }

      // 👇 VALIDASI PROGRESS — WAJIB DIISI (kecuali FINAL)
      if (formData.type === 'PROGRESS' && formData.progress <= 0) {
        toast.error("Progress harus diisi", { description: "Silakan atur progress menggunakan slider sebelum mengirim laporan." });
        setUploading(false);
        return;
      }

      const reportData = createReportFormData({
        spkId: selectedSpk.id,
        karyawanId: userId,
        type: formData.type,
        progress: formData.progress,
        note: formData.note,
        photos: formData.photos,
        soDetailId: formData.items, // ✅ Ini adalah SPKDetail.id — sesuai model Prisma
      });

      await createSpkFieldReport(reportData); // 👈 Tidak perlu simpan ke variabel kalau tidak dipakai

      toast.success("Laporan berhasil dikirim", {
        description: "Progress telah berhasil dicatat dan dilaporkan.",
      });

      // Reset form dan refresh riwayat
      setFormData({
        spkId: '',
        note: '',
        progress: 0,
        minProgress: 0,
        type: 'PROGRESS',
        photos: [],
        items: null,
      });
      setActiveTab('list');
      setSelectedSpk(null);
      fetchReports(); // Refresh riwayat

    } catch (error) {
      console.error('❌ Gagal mengirim laporan:', error);
      if (error instanceof Error) {
        toast.error("Gagal mengirim laporan", { description: error.message || "Terjadi kesalahan saat mengirim laporan progress." });
      } else {
        toast.error("Gagal mengirim laporan", { description: "Terjadi kesalahan tak terduga." });
      }
    } finally {
      setUploading(false);
    }
  };

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
      const res = await fetch(`/api/reports/${reportId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectedBy: userId }),
      });

      if (!res.ok) throw new Error('Gagal menolak laporan');

      toast.success("Laporan ditolak");
      fetchReports();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menolak laporan");
    }
  };


  // 👇 DOWNLOAD PDF
  const downloadPDF = (report: ReportHistory) => {
    toast.info("Mengunduh PDF...", { duration: 2000 });
    // Implementasi PDF generator (misal: react-to-pdf atau server-side)
    // Contoh sederhana:
    window.open(`/api/reports/${report.id}/pdf`, '_blank');
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

  // Fungsi handleChangeItem
  const handleChangeItem = (itemId: string | null) => {
    if (!selectedSpk) {
      console.warn("Data SPK belum tersedia");
      return;
    }

    if (!itemId) {
      setFormData(prev => ({
        ...prev,
        items: null,
        progress: 0,
        minProgress: 0, // tambahkan state ini
      }));
      return;
    }

    // ✅ Cari item dari selectedSpk
    const selectedItem = selectedSpk.items.find(item => item.id === itemId);

    if (selectedItem) {
      // ✅ Cari progress dari reports berdasarkan item.id
      const relatedReport = reports?.find(report => report.soDetailId === selectedItem.id);
      const prevProgress = relatedReport?.progress ?? 0;

      setFormData(prev => ({
        ...prev,
        items: itemId,
        progress: prevProgress,   // posisi awal = progress terakhir
        minProgress: prevProgress // simpan batas minimal
      }));
    }
  };


  return (
    <div className="h-full w-full p-1 md:p-2">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col gap-1 bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-lg text-white shadow-lg transform transition-all duration-300 hover:shadow-xl">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 md:h-7 md:w-7" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Monitoring Progress SPK</h1>
          </div>
          <p className="text-xs md:text-sm text-blue-100 opacity-90">
            {role === 'admin' || role === 'super'
              ? 'Monitor semua SPK yang sedang berjalan'
              : `Laporkan progress pekerjaan untuk SPK yang ditugaskan kepada Anda`}
          </p>
        </div>

        <Tabs defaultValue="list" value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="w-full border-1 rounded-xl">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 mb-3 h-10 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger
              value="list"
              className="shadow-cyan-400 cursor-pointer text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 rounded-md flex items-center gap-1"
            >
              <FileText className="h-3 w-3 md:h-4 md:w-4" />
              Daftar SPK
            </TabsTrigger>
            <TabsTrigger
              value="report"
              disabled={!selectedSpk}
              className="shadow-cyan-400 cursor-pointer text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 rounded-md flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
              Lapor Progress
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="shadow-cyan-400 cursor-pointer hidden lg:flex text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 rounded-md items-center gap-1"
            >
              <Archive className="h-3 w-3 md:h-4 md:w-4" />
              Riwayat
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: DAFTAR SPK */}
          <TabsContent value="list" className="animate-fade-in">
            <Card className="border border-gray-200/60 dark:border-gray-700/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md">
              <CardHeader className="pb-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-gray-800 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg md:text-xl font-semibold flex items-center gap-2 text-gray-800 dark:text-white">
                      <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      {role === 'admin' || role === 'super' ? 'Semua SPK' : 'SPK Saya'}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {role === 'admin' || role === 'super'
                        ? 'Klik SPK untuk memulai pelaporan'
                        : 'Pilih SPK yang ditugaskan kepada Anda'}
                    </CardDescription>
                  </div>
                  {filteredUserSpk.length > 0 && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                      {filteredUserSpk.length} SPK
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-5">
                {filteredUserSpk.length === 0 ? (
                  <div className="text-center py-10 px-4 animate-fade-in">
                    <div className="mx-auto w-16 h-16 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                      <Clock className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Tidak ada SPK</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                      {role === 'admin' || role === 'super'
                        ? 'Tidak ada SPK yang terdaftar dalam sistem'
                        : `Belum ada SPK yang ditugaskan untuk ${userEmail}`}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {filteredUserSpk.map((spk, index) => {
                      const progress = getSPKFieldProgress(spk);
                      const status = progress === 100 ? 'COMPLETED' : 'PROGRESS';
                      const statusColor = status === 'COMPLETED'
                        ? 'bg-green-500'
                        : progress > 75
                          ? 'bg-blue-500'
                          : progress > 50
                            ? 'bg-indigo-500'
                            : progress > 25
                              ? 'bg-amber-500'
                              : 'bg-rose-500';

                      return (
                        <div
                          key={spk.id}
                          className="transform transition-all duration-300 hover:scale-[1.02]"
                          style={{ animationDelay: `${index * 75}ms` }}
                        >
                          <div
                            onClick={() => {
                              setSelectedSpk(spk);
                              setActiveTab('report');
                            }}
                            className={`cursor-pointer transition-all duration-300 h-full rounded-xl overflow-hidden group border ${selectedSpk?.id === spk.id
                              ? 'border-indigo-500 shadow-md bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 ring-2 ring-indigo-500/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md'
                              }`}
                          >
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-400 to-blue-400 opacity-90"></div>

                            <div className="p-5 pl-6">
                              <div className="flex justify-between items-start mb-4">
                                <div className="min-w-0 flex-1 pr-2">
                                  <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate mb-1">
                                    {spk.spkNumber}
                                  </h3>
                                  <p className="text-sm text-wrap text-gray-700 dark:text-gray-300 font-medium truncate mb-1">{spk.clientName}</p>
                                  <p className="text-xs text-wrap text-gray-500 dark:text-gray-400 truncate">{spk.projectName}</p>
                                </div>
                                <div className="ml-2 flex-shrink-0">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status === 'COMPLETED'
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                      }`}
                                  >
                                    {status === 'COMPLETED' ? (
                                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                    ) : (
                                      <Clock className="w-3.5 h-3.5 mr-1" />
                                    )}
                                    {status === 'COMPLETED' ? 'Selesai' : 'Progress'}
                                  </span>
                                </div>
                              </div>

                              <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Progress</span>
                                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{progress}%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${statusColor}`}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-rose-500" />
                                  <span className="truncate">
                                    {new Date(spk.deadline).toLocaleDateString('id-ID', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                  </span>
                                </div>
                                <div className='flex items-center justify-center gap-1'>
                                  <Users2Icon className='h-3.5 w-3.5 flex-shrink-0 text-indigo-500' />
                                  <span className="truncate max-w-[80px] md:max-w-[100px]">
                                    {spk.teamName?.split('@')[0] || 'Team Belum ditentukan'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <User className="h-3.5 w-3.5 flex-shrink-0 text-indigo-500" />
                                  <span className="truncate max-w-[80px] md:max-w-[100px]">
                                    {spk.assignedTo?.split('@')[0] || 'Tidak ditugaskan'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: FORM LAPOR PROGRESS */}
          <TabsContent value="report" className="animate-fade-in">
            {selectedSpk && (
              <Card className="border-border/40 bg-card/90 backdrop-blur-sm shadow-md rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg">
                <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-white dark:from-green-900/30 dark:to-gray-800">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-green-600" />
                    Laporkan Progress
                  </CardTitle>
                  <CardDescription className="text-xs font-bold">
                    {selectedSpk.spkNumber} - {selectedSpk.clientName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Item Pekerjaan</Label>
                        <Select
                          value={formData.items || ""}
                          onValueChange={(value) => handleChangeItem(value || null)}
                          disabled={!selectedSpk}
                        >
                          <SelectTrigger className="h-10 w-full text-xs border-border/60">
                            <SelectValue placeholder="Pilih item pekerjaan..." />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedSpk?.items.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>


                        {formData.items && selectedSpk && (
                          <div className="mt-1 text-xs text-gray-600">
                            ✅ Item dipilih: {selectedSpk.items.find((i) => i.id === formData.items)?.name}
                          </div>
                        )}

                        {!formData.items && (
                          <p className="text-xs text-red-500 mt-1">* Harap pilih satu item pekerjaan.</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Jenis Laporan</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value: 'PROGRESS' | 'FINAL') =>
                            setFormData(prev => ({
                              ...prev,
                              type: value,
                              progress: value === 'FINAL' ? 100 : prev.progress, // ✅ kalau pilih FINAL → progress 100
                            }))
                          }
                        >
                          <SelectTrigger className="text-xs h-10 border-border/60 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors">
                            <SelectValue placeholder="Pilih jenis" />
                          </SelectTrigger>
                          <SelectContent className="text-xs border-border/60">
                            <SelectItem
                              value="PROGRESS"
                              className="focus:bg-green-50 focus:text-green-700"
                            >
                              Progress Pekerjaan
                            </SelectItem>
                            <SelectItem
                              value="FINAL"
                              className="focus:bg-blue-50 focus:text-blue-700"
                            >
                              Selesai
                            </SelectItem>
                          </SelectContent>
                        </Select>

                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Atur Progress Item</Label>

                        {/* Persentase + Status */}
                        <div className="flex flex-row md:flex-row items-center justify-between gap-2 md:gap-4">
                          {/* Persentase */}
                          <motion.span
                            key={formData.progress}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className={cn(
                              "text-xs font-bold min-w-[3rem] text-center px-3 py-1 rounded-md shadow-sm border",
                              formData.progress === 100
                                ? "bg-green-600 text-white"
                                : formData.progress >= 50
                                  ? "bg-yellow-500 text-white"
                                  : "bg-red-500 text-white"
                            )}
                          >
                            Latest Progress - {formData.progress}%
                          </motion.span>

                          {/* Status */}
                          <span
                            className={cn(
                              "text-xs font-semibold px-2 py-1 rounded-full",
                              formData.progress === 100
                                ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-100"
                            )}
                          >
                            {formData.progress === 100 ? "DONE" : "IN PROGRESS"}
                          </span>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center gap-4 bg-muted/30 p-4 rounded-2xl shadow-sm border">
                          {/* Slider */}
                          <Slider
                            value={[formData.progress]}
                            onValueChange={(value) => {
                              const newProgress = Math.max(value[0], formData.minProgress ?? 0);

                              setFormData((prev) => ({
                                ...prev,
                                progress: newProgress,
                                type: newProgress === 100 ? "FINAL" : prev.type, // ✅ kalau 100 otomatis FINAL
                              }));
                            }}
                            disabled={formData.type === "FINAL" || !formData.items}
                            min={formData.minProgress ?? 0}
                            max={100}
                            step={5}
                            className="flex-1"
                          />
                        </div>


                        {formData.items && selectedSpk && (
                          <div className="text-xs text-muted-foreground mt-1">
                            ⚙️ Atur progress untuk:{" "}
                            <strong>
                              {selectedSpk.items.find((i) => i.id === formData.items)?.name ?? "-"}
                            </strong>
                          </div>
                        )}
                      </div>

                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Catatan</Label>
                      <Textarea
                        placeholder="Jelaskan progress, kendala, atau detail penting..."
                        value={formData.note}
                        onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                        rows={3}
                        className="text-xs resize-none border-border/60 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Dokumentasi Foto</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer border-muted/40 hover:border-green-400 hover:bg-green-50/50 transition-all duration-300 group">
                          <Camera className="w-5 h-5 mb-1 text-muted-foreground group-hover:text-green-600 transition-colors" />
                          <span className="text-xs text-muted-foreground group-hover:text-green-600 transition-colors">Tambah Foto</span>
                          <Input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={uploading}
                          />
                        </label>
                        {formData.photos.map((file, index) => (
                          <div key={index} className="relative group transform transition-all duration-300 hover:scale-105">
                            <div className="relative h-24 w-full overflow-hidden rounded-lg border border-border/60">
                              <Image
                                src={URL.createObjectURL(file)}
                                alt={`Dokumentasi ${index + 1}`}
                                fill
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300"></div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-md hover:bg-red-600 z-10"
                              aria-label="Hapus foto"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-border/40">
                      {/* Tombol Kembali */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab("list")}
                        disabled={uploading}
                        className="text-xs w-full sm:w-auto gap-1 border-border/60 hover:bg-muted/50 transition-all"
                      >
                        <X className="h-3 w-3" />
                        Kembali
                      </Button>

                      {/* Tombol Kirim */}
                      <Button
                        type="submit"
                        disabled={uploading || !formData.note}
                        size="sm"
                        className="text-xs w-full sm:w-auto gap-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                      >
                        {uploading ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            Mengirim...
                          </>
                        ) : (
                          <>
                            <Upload className="h-3 w-3" />
                            Kirim Laporan
                          </>
                        )}
                      </Button>
                    </div>

                  </form>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB 3: RIWAYAT LAPORAN — LENGKAP DENGAN FILTER & ACTIONS */}
          <TabsContent value="history" className="animate-fade-in">
            <Card className="border-border/40 bg-card/90 backdrop-blur-sm shadow-md rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg">
              {/* Header Card — Judul + Filter */}
              <CardHeader className="pb-4 pt-3 bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/30 dark:to-gray-800 sticky top-0 z-10">
                <div className="grid grid-cols-10 gap-4">
                  {/* Judul */}
                  <div className='col-span-1 col-start-1'>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Archive className="h-4 w-4 text-purple-600" />
                      Riwayat Laporan
                    </CardTitle>
                    <CardDescription className="text-xs">Riwayat laporan SPK Anda</CardDescription>
                  </div>
                  <div className="col-span-1 col-start-5">
                    <Label className="text-xs font-medium">SPK</Label>
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

                  {/* Reset Filter — sejajar kanan */}
                  <div className="col-span-2 col-start-9 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 w-full text-xs"
                      onClick={() => setFilters({ date: 'all', status: 'all', spkId: '', karyawanId: '' })}
                    >
                      Reset Filter
                    </Button>
                  </div>
                  {/* </div> */}
                </div>

                <div className="col-span-1 col-start-10">
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
                            <TableRow className="[&>th]:py-2 [&>th]:px-2 [&>th]:text-xs [&>th]:font-semibold">
                              <TableHead className="w-[120px] sticky left-0 bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/30 dark:to-gray-800 z-10">Status</TableHead>
                              <TableHead className="min-w-[140px]">SPK & Item</TableHead>
                              <TableHead className="min-w-[140px]">Klien & Proyek</TableHead>
                              <TableHead className="min-w-[120px]">Catatan</TableHead>
                              <TableHead className="w-[80px]">Foto</TableHead>
                              <TableHead className="w-[100px]">Tanggal</TableHead>
                              {role === 'admin' && (
                                <TableHead className="w-[110px] sticky right-0 bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/30 dark:to-gray-800 z-10">
                                  Aksi
                                </TableHead>
                              )}
                            </TableRow>
                          </TableHeader>

                          {/* Scrollable Table Body */}
                          <TableBody
                            className="divide-y divide-border/40 overflow-y-auto"
                            style={{ maxHeight: 'calc(50vh - 200px)' }} // Sesuaikan tinggi sesuai kebutuhan
                          >
                            {currentReports.map((report) => (
                              <TableRow
                                key={report.id}
                                className="hover:bg-muted/30 transition-colors cursor-pointer [&>td]:py-2 [&>td]:px-2"
                                onClick={() => setSelectedReport(report)}
                              >
                                {/* Status */}
                                <TableCell className="sticky left-0 bg-card z-10">
                                  <div className="flex flex-col gap-1">
                                    {report.type === 'PROGRESS' ? (
                                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                                        <span className="text-xs">Progress</span>
                                      </div>
                                    ) : report.type === 'FINAL' ? (
                                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                        <CheckCircle className="w-3 h-3" />
                                        <span className="text-xs">Selesai</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                        <Clock className="w-3 h-3" />
                                        <span className="text-xs">Menunggu</span>
                                      </div>
                                    )}

                                    {report.status === 'PENDING' ? (
                                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                                        <span className="text-xs">Menunggu</span>
                                      </div>
                                    ) : report.status === 'APPROVED' ? (
                                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                        <CheckCircle className="w-3 h-3" />
                                        <span className="text-xs">Disetujui</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                        <X className="w-3 h-3" />
                                        <span className="text-xs">Ditolak</span>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>

                                {/* SPK & Item */}
                                <TableCell>
                                  <div className="space-y-0.5">
                                    <div className="font-medium text-foreground text-xs">{report.spkNumber}</div>
                                    <div className="text-xs text-muted-foreground line-clamp-1">{report.itemName}</div>
                                  </div>
                                </TableCell>

                                {/* Klien & Proyek */}
                                <TableCell>
                                  <div className="space-y-0.5">
                                    <div className="text-xs font-medium text-foreground line-clamp-1">{report.clientName}</div>
                                    <div className="text-xs text-muted-foreground line-clamp-1">{report.projectName}</div>
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

                                {/* Foto */}
                                <TableCell>
                                  {report.photos.length > 0 ? (
                                    <div className="flex items-center gap-1">
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
                                  ) : (
                                    <span className="text-xs text-muted-foreground/70">-</span>
                                  )}
                                </TableCell>

                                {/* Tanggal */}
                                <TableCell>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(report.reportedAt).toLocaleDateString('id-ID', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground/70">
                                    {new Date(report.reportedAt).toLocaleTimeString('id-ID', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </div>
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
                          </TableBody>
                        </Table>
                        {/* ✅ Pagination Controls */}
                        {reports.length > 0 && totalPages > 1 && (
                          <div className="flex items-center justify-between mt-3 px-1">
                            <div className="text-xs text-muted-foreground">
                              Menampilkan {startIndex + 1}–{Math.min(startIndex + itemsPerPage, reports.length)} dari {reports.length} laporan
                            </div>

                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="h-7 px-2 text-xs"
                              >
                                <ChevronLeft className="h-3.5 w-3.5" />
                              </Button>

                              {/* Tombol nomor halaman — maks 5 tombol ditampilkan */}
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
                                      className={`h-7 w-7 p-0 text-xs ${currentPage === i ? 'bg-purple-600 text-white hover:bg-purple-700' : ''}`}
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
                        onClick={() => downloadPDF(selectedReport!)}
                        disabled={!selectedReport}
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal Detail Laporan */}
      {selectedReport && modalType && (
        <Dialog open={true} onOpenChange={() => {
          setSelectedReport(null);
          setModalType(null);
        }}>
          <DialogContent className="max-w-3xl max-h-screen overflow-y-auto bg-background text-foreground border-border p-6 rounded-xl shadow-2xl">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                <DialogTitle className="text-2xl font-bold">Detail Laporan SPK</DialogTitle>
              </div>
              <DialogDescription className="text-muted-foreground">
                Informasi lengkap laporan lapangan
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Badge variant={selectedReport.type === 'PROGRESS' ? 'secondary' : 'default'}>
                  {selectedReport.type === 'PROGRESS' ? 'Progress Pekerjaan' : 'Laporan Selesai'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(selectedReport.reportedAt).toLocaleString('id-ID')}
                </span>
              </div>

              {/* Info SPK & Item */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* SPK Info */}
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-muted-foreground">SPK</h5>
                  <div className="flex flex-col">
                    <p className="text-lg font-semibold">{selectedReport.spkNumber}</p>
                    <p className="text-sm text-muted-foreground">{selectedReport.clientName}</p>
                    <p className="text-sm text-muted-foreground">{selectedReport.projectName}</p>
                  </div>
                </div>

                {/* Item Pekerjaan */}
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-muted-foreground">Item Pekerjaan</h5>
                  <div className="flex flex-col">
                    <p className="text-lg font-semibold">{selectedReport.itemName}</p>
                    <p className="text-sm text-muted-foreground">
                      Progress: <span className="font-medium">{selectedReport.progress}%</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Catatan */}
              {selectedReport.note && (
                <div className="border-l-4 border-blue-500 pl-4">
                  <h5 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Eye className="h-4 w-4 text-blue-500" />
                    Catatan
                  </h5>
                  <p className="bg-muted/50 p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedReport.note}
                  </p>
                </div>
              )}

              {/* Foto */}
              {selectedReport.photos.length > 0 && (
                <>
                  <h5 className="text-sm font-medium text-muted-foreground">Foto Bukti ({selectedReport.photos.length})</h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {selectedReport.photos.map((photo, idx) => {
                      // Konversi path relatif ke URL yang dapat diakses
                      const getPhotoUrl = (path: string) => {
                        if (path.startsWith('http')) {
                          return path;
                        }

                        // Jika menggunakan path relatif, sesuaikan dengan base URL backend
                        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

                        // Pastikan path diawali dengan slash
                        const normalizedPath = path.startsWith('/') ? path : `/${path}`;

                        return `${baseUrl}${normalizedPath}`;
                      };

                      const photoUrl = getPhotoUrl(photo);

                      return (
                        <div key={idx} className="relative group">
                          <Image
                            src={photoUrl}
                            alt={`bukti-${idx}`}
                            width={120}
                            height={120}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              // Fallback jika gambar gagal dimuat
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkeT0iLjM1ZW0iIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiPkdhZ2FsIGRpbHVhciBkaW11YXQ8L3RleHQ+PC9zdmc+';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-white"
                              onClick={() => window.open(photoUrl, '_blank')}
                            >
                              <ZoomIn className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Status Persetujuan (Hanya Admin) */}
              {role === 'admin' && (
                <div className="border-t pt-6 border-border">
                  <h5 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    Status Persetujuan
                  </h5>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-1 flex items-center justify-center gap-2 text-base font-medium"
                      onClick={() => handleApproveReport(selectedReport.id)}
                      disabled={selectedReport.status === 'APPROVED'}
                    >
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Setujui
                    </Button>
                    <Button
                      variant="destructive"
                      size="lg"
                      className="flex-1 flex items-center justify-center gap-2 text-base font-medium"
                      onClick={() => handleRejectReport(selectedReport.id)}
                      disabled={selectedReport.status === 'REJECTED'}
                    >
                      <X className="h-5 w-5" />
                      Tolak
                    </Button>
                  </div>

                  {selectedReport.status !== 'PENDING' && (
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Status:</span>
                      <Badge
                        variant={selectedReport.status === 'APPROVED' ? 'success' : 'destructive'}
                        className="px-4 py-2 text-sm font-medium"
                      >
                        {selectedReport.status === 'APPROVED' ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1 inline" />
                            Disetujui
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-1 inline" />
                            Ditolak
                          </>
                        )}
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedReport(null);
                  setModalType(null);
                }}
                className="w-full sm:w-auto"
              >
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
    </div>
  );
};

// 👇 STATUS BADGE — TETAP UTUH
// const StatusBadge = ({ status }: { status: string }) => {
//   const getIcon = () => {
//     switch (status) {
//       case 'COMPLETED': return <CheckCircle className="h-3 w-3" />;
//       case 'PROGRESS': return <Clock className="h-3 w-3" />;
//       case 'PENDING': return <Clock className="h-3 w-3" />;
//       default: return <Clock className="h-3 w-3" />;
//     }
//   };
//   const getColorClass = () => {
//     switch (status) {
//       case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
//       case 'PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
//       case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
//       default: return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
//     }
//   };
//   const getStatusText = () => {
//     switch (status) {
//       case 'PENDING': return 'Menunggu';
//       case 'COMPLETED': return 'Selesai';
//       case 'PROGRESS': return 'Berjalan';
//       default: return status;
//     }
//   };
//   return (
//     <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getColorClass()} transition-all duration-300`}>
//       {getIcon()}
//       {getStatusText()}
//     </div>
//   );
// };

// 👇 SKELETON LOADER — TETAP UTUH
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