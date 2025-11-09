"use client";
import { Fragment } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Camera, CheckCircle, Clock, X, Archive, Sparkles, TrendingUp, FileText, Eye, Loader2, Download, ZoomIn, ChevronRight, ChevronLeft, User, Calendar, Users2Icon, ChevronsRight, PackageOpenIcon, MoveRight, Wrench, PenTool, FileSignature, ShieldCheck, Trash2, UserCheck2Icon, ImageIcon, Send, ArrowLeft, AlertTriangle, Target, MessageSquare, ClipboardList, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { createReportFormData, createSpkFieldReport, deleteReport, fetchSPKReports } from '@/lib/action/master/spk/spkReport';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Slider } from '../ui/slider';
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { updateReportStatus } from '@/lib/action/master/spk/spkReport';
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

interface PhotoWithCategory {
  file: File;
  category: "SEBELUM" | "PROSES" | "SESUDAH";
}

interface ProgressFormData {
  spkId: string;
  note: string;
  type: "PROGRESS" | "FINAL";
  progress: number;
  minProgress: number;
  items: string | null;
  previousProgress?: number;
  photoCategory: "SEBELUM" | "PROSES" | "SESUDAH";
  photos: PhotoWithCategory[]; // Ubah dari File[] ke PhotoWithCategory[]
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
    photoCategory: "SEBELUM", // nilai default
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [previewSpk, setPreviewSpk] = useState<string | undefined>(undefined);


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
    if (role === 'admin' || role === 'super' || role === 'pic' || role === 'user') return true;
    return spk.email === userEmail;
  });

  // 👇 FETCH RIWAYAT LAPORAN DARI BACKEND
  const fetchReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      let reports = await fetchSPKReports(filters);

      // ✅ SORT: Pertama berdasarkan spkNumber, lalu itemName (keduanya string)
      reports = [...reports].sort((a, b) => {
        // Bandingkan spkNumber dulu
        const spkCompare = a.spkNumber.localeCompare(b.spkNumber, undefined, {
          numeric: true,
          sensitivity: 'base',
        });

        // Jika spkNumber sama, bandingkan itemName
        if (spkCompare === 0) {
          return a.itemName.localeCompare(b.itemName, undefined, {
            sensitivity: 'base', // case-insensitive
          });
        }

        return spkCompare;
      });

      setReports(reports); // Simpan yang sudah terurut
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Gagal memuat riwayat laporan');
    } finally {
      setLoadingReports(false);
    }
  }, [filters]);


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

  // 👇 EFFECT: Fetch riwayat saat filter berubah
  useEffect(() => {
    fetchReports();
  }, [filters, fetchReports]);

  // 👇 HANDLE UPLOAD FOTO
  // Helper untuk resize image
  async function resizeImage(
    file: File,
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.8
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = document.createElement("img") as HTMLImageElement
      const reader = new FileReader()

      reader.onload = (e) => {
        img.src = e.target?.result as string
      }

      img.onload = () => {
        const canvas = document.createElement("canvas")
        let { width, height } = img

        if (width > maxWidth || height > maxHeight) {
          const aspect = width / height
          if (width > height) {
            width = maxWidth
            height = Math.round(maxWidth / aspect)
          } else {
            height = maxHeight
            width = Math.round(maxHeight * aspect)
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Resize gagal"))
            resolve(new File([blob], file.name, { type: "image/jpeg" }))
          },
          "image/jpeg",
          quality
        )
      }

      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Hapus foto berdasarkan index
  function removePhoto(index: number) {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }))
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const { files } = e.target;
    if (!files || files.length === 0) return;

    const currentCategory = formData.photoCategory;
    const processedPhotos: PhotoWithCategory[] = [];

    for (const [index, file] of Array.from(files).entries()) {
      if (!file.type.startsWith("image/")) continue;

      let processedFile = file;

      // 🔧 PERBAIKI: Handle extension yang mungkin undefined
      const extension = file.name.split('.').pop() || 'jpg'; // Default ke jpg
      const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
      const newFileName = `${currentCategory}-${nameWithoutExtension || `Foto${formData.photos.length + index + 1}`}.${extension}`;

      processedFile = new File([file], newFileName, {
        type: file.type,
        lastModified: file.lastModified
      });

      // 🔧 PERBAIKI: Cek size file yang sudah dimodifikasi
      if (processedFile.size > 2 * 1024 * 1024) {
        try {
          const resized = await resizeImage(processedFile);
          processedFile = resized;
        } catch (err) {
          console.error("Gagal resize:", err);
          continue;
        }
      }

      processedPhotos.push({
        file: processedFile,
        category: currentCategory
      });
    }

    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, ...processedPhotos],
    }));

    e.target.value = "";
  }

  // 👇 SUBMIT LAPORAN - TAMBAH VALIDASI FOTO
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ CEGAH DOUBLE SUBMIT
    if (uploading) return;
    setUploading(true);

    try {
      // Validasi dasar
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

      if (formData.progress === (formData.previousProgress ?? 0)) {
        toast.error("Progress belum berubah", {
          description: "Mohon ubah progress sebelum mengirim laporan."
        });
        setUploading(false);
        return;
      }

      // 👇 VALIDASI PROGRESS — WAJIB DIISI (kecuali FINAL)
      if (formData.type === 'PROGRESS' && formData.progress <= 0) {
        toast.error("Progress harus diisi", { description: "Silakan atur progress menggunakan slider sebelum mengirim laporan." });
        setUploading(false);
        return;
      }

      // 🔧 TAMBAH: Validasi foto maksimal 10
      if (formData.photos.length > 10) {
        toast.error("Terlalu banyak foto", { description: "Maksimal 10 foto yang dapat diupload." });
        setUploading(false);
        return;
      }

      const originalSpkData = dataSpk.find(spk => spk.id === selectedSpk.id);

      if (!originalSpkData) {
        toast.error("Data SPK tidak valid", { description: "Tidak dapat menemukan data SPK asli." });
        setUploading(false);
        return;
      }

      // Cek apakah user adalah salah satu karyawan di details
      const isUserInDetails = originalSpkData.details?.some(detail =>
        detail.karyawan?.email === userEmail
      );

      // Validasi: User harus merupakan karyawan yang ditugaskan di details
      if (!isUserInDetails) {
        toast.error("Akses Ditolak", {
          description: "Anda tidak memiliki akses untuk melaporkan progress SPK ini. Email Anda tidak terdaftar sebagai karyawan yang ditugaskan."
        });
        setUploading(false);
        return;
      }

      // 🔧 DEBUG: Cek nama file sebelum submit
      console.log('Files to be submitted:',
        formData.photos.map(photo => ({
          name: photo.file.name,
          category: photo.category,
          size: photo.file.size
        }))
      );

      const reportData = createReportFormData({
        spkId: selectedSpk.id,
        karyawanId: userId,
        type: formData.type,
        progress: formData.progress,
        note: formData.note,
        photos: formData.photos.map(photo => photo.file),
        soDetailId: formData.items,
      });

      await createSpkFieldReport(reportData);

      toast.success("Laporan berhasil dikirim", {
        description: "Progress telah berhasil dicatat dan dilaporkan.",
      });

      // Reset form
      setFormData(prev => ({
        ...prev,
        spkId: '',
        note: '',
        progress: 0,
        minProgress: 0,
        type: 'PROGRESS',
        photos: [],
        items: null,
        photoCategory: 'SEBELUM'
      }));

      setActiveTab('list');
      setSelectedSpk(null);
      fetchReports();

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
      const res = await deleteReport(reportId);

      if (!res.success) throw new Error(res.message || 'Gagal menolak laporan');

      toast.success("Laporan ditolak");
      fetchReports();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menolak laporan");
    }
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
          {role === 'admin' || role === 'super' || role === 'pic' || role === 'user'
            ? 'Belum ada SPK yang terdaftar.'
            : `Tidak ada SPK yang ditugaskan ke ${userEmail}.`}
        </p>
      </div>
    );
  }

  // Fungsi handleChangeItem
  const handleChangeItem = (itemId: string | null) => {
    if (!selectedSpk) return;

    // ✅ Keep itemId as string
    const selectedItem = itemId
      ? selectedSpk.items.find(item => String(item.id) === itemId)
      : null;

    if (!itemId) {
      setFormData(prev => ({
        ...prev,
        items: null,
        progress: 0,
        minProgress: 0,
        previousProgress: 0,
        type: 'PROGRESS',
        note: ''
      }));
      return;
    }

    const relatedReport = reports?.find(
      report => String(report.soDetailId) === itemId
    );

    const prevProgress = relatedReport?.progress ?? selectedItem?.progress ?? 0;

    setFormData(prev => ({
      ...prev,
      items: itemId,                               // ✅ tetap string
      progress: prevProgress,
      minProgress: prevProgress,
      previousProgress: prevProgress,
      type: prevProgress === 100 ? "FINAL" : "PROGRESS",
      note: prev.items !== itemId ? "" : prev.note  // ✅ tidak error
    }));
  };

  return (
    <div className="h-full w-full p-1 md:p-2">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/60 dark:border-gray-700/50 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <div className="flex items-center gap-3 mb-4 sm:mb-0">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Progress Monitoring SPK
                  </h1>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {role === 'admin' || role === 'super' || role === 'pic'
                      ? 'Monitor dan kelola semua SPK yang sedang berjalan'
                      : 'Laporkan progress pekerjaan untuk SPK yang ditugaskan kepada Anda'}
                  </p>
                </div>
              </div>

              {/* Stats Overview */}
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {filteredUserSpk.length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total SPK</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {filteredUserSpk.filter(spk => spk.status === 'COMPLETED').length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Selesai</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-gray-700/50 shadow-sm overflow-hidden">
          <Tabs
            defaultValue="list"
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v as TabType);
              setFilters({ date: 'all', status: 'all', spkId: '', karyawanId: '' });
            }}
            className="w-full"
          >
            <div className="border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <div className="px-6">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 h-12 bg-transparent p-1 gap-2">
                  <TabsTrigger
                    value="list"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-gray-200 data-[state=active]:dark:bg-gray-700 data-[state=active]:dark:border-gray-600 transition-all duration-300 rounded-xl flex items-center gap-2 font-medium"
                  >
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span>Daftar SPK</span>
                    {filteredUserSpk.length > 0 && (
                      <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs">
                        {filteredUserSpk.length}
                      </span>
                    )}
                  </TabsTrigger>

                  <TabsTrigger
                    value="report"
                    disabled={!selectedSpk}
                    className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-gray-200 data-[state=active]:dark:bg-gray-700 data-[state=active]:dark:border-gray-600 transition-all duration-300 rounded-xl flex items-center gap-2 font-medium"
                  >
                    <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span>Lapor Progress</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="history"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-gray-200 data-[state=active]:dark:bg-gray-700 data-[state=active]:dark:border-gray-600 transition-all duration-300 rounded-xl flex items-center gap-2 font-medium"
                  >
                    <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Archive className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span>Riwayat</span>
                    {reports.length > 0 && (
                      <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-2 py-0.5 rounded-full text-xs">
                        {reports.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            {/* TAB 1: DAFTAR SPK */}
            <TabsContent value="list" className="animate-fade-in">
              <Card className="border px-0 md:px-4 border-gray-200/60 dark:border-gray-700/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md">
                <CardHeader className="pb-0 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-gray-800 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg md:text-xl font-semibold flex items-center gap-2 rounded-xl text-gray-800 dark:text-white ">
                        <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400 items-center justify-center" />
                        {role === 'admin' || role === 'super' || role === 'pic' || role === 'user' ? 'Semua SPK' : 'SPK List'}
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-500 dark:text-gray-400 mt-0 rounded-xl">
                        {role === 'admin' || role === 'super' || role === 'pic' || role === 'user'
                          ? 'Klik SPK untuk memulai pelaporan'
                          : 'Pilih SPK yang ditugaskan kepada Anda'}
                      </CardDescription>
                    </div>
                    {filteredUserSpk.length > 0 && (
                      <span className="inline-flex items-center px-1 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                        {filteredUserSpk.length} SPK
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-2">
                  {filteredUserSpk.length === 0 ? (
                    <div className="text-center py-10 px-4 animate-fade-in">
                      <div className="mx-auto w-16 h-16 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                        <Clock className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Tidak ada SPK</h3>
                      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                        {role === 'admin' || role === 'super' || role === 'pic' || role === 'user'
                          ? 'Tidak ada SPK yang terdaftar dalam sistem'
                          : `Belum ada SPK yang ditugaskan untuk ${userEmail}`}
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {filteredUserSpk.map((spk, index) => {
                        const progress = getSPKFieldProgress(spk);
                        const status = progress === 100 ? 'COMPLETED' : progress > 0 ? 'PROGRESS' : 'PENDING';

                        const statusConfig = {
                          COMPLETED: {
                            color: 'from-emerald-500 to-green-600',
                            badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                            gradient: 'from-emerald-50/80 via-white to-green-50/60 dark:from-emerald-900/20 dark:via-gray-800 dark:to-green-900/10',
                            icon: CheckCircle,
                            text: 'Selesai'
                          },
                          PROGRESS: {
                            color: progress > 75 ? 'from-blue-500 to-indigo-600' :
                              progress > 50 ? 'from-indigo-500 to-purple-600' :
                                progress > 25 ? 'from-amber-500 to-orange-600' : 'from-rose-500 to-pink-600',
                            badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
                            gradient: 'from-blue-50/80 via-white to-indigo-50/60 dark:from-blue-900/20 dark:via-gray-800 dark:to-indigo-900/10',
                            icon: Clock,
                            text: 'Progress'
                          },
                          PENDING: {
                            color: 'from-gray-400 to-gray-600',
                            badge: 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800',
                            gradient: 'from-gray-50/80 via-white to-slate-50/60 dark:from-gray-900/20 dark:via-gray-800 dark:to-slate-900/10',
                            icon: Clock,
                            text: 'Pending'
                          }
                        };

                        const config = statusConfig[status];

                        return (
                          <motion.div
                            key={spk.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{
                              duration: 0.4,
                              delay: index * 0.1,
                              ease: "easeOut"
                            }}
                            whileHover={{
                              y: -4,
                              transition: { duration: 0.2 }
                            }}
                            className="relative"
                          >
                            <div
                              onClick={() => {
                                if (progress === 100) {
                                  toast.info("SPK sudah selesai, tidak dapat membuat laporan baru");
                                  return;
                                }
                                setSelectedSpk(spk);
                                setActiveTab("report");
                              }}
                              className={cn(
                                "relative cursor-pointer transition-all duration-500 h-full rounded-2xl overflow-hidden group",
                                "border backdrop-blur-sm transform-gpu shadow-sm",
                                "hover:shadow-2xl hover:border-opacity-80",

                                // Selected state
                                selectedSpk?.id === spk.id && cn(
                                  "border-indigo-500/80 dark:border-indigo-400/80 border-2",
                                  "bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/90",
                                  "dark:from-indigo-900/40 dark:via-gray-800 dark:to-blue-900/30",
                                  "shadow-xl shadow-indigo-500/20 dark:shadow-indigo-400/10",
                                  "ring-2 ring-indigo-500/20 dark:ring-indigo-400/20"
                                ),

                                // Normal state
                                selectedSpk?.id !== spk.id && cn(
                                  "border-gray-200/60 dark:border-gray-600/60",
                                  "bg-gradient-to-br from-white via-gray-50/50 to-white",
                                  "dark:from-gray-800 dark:via-gray-800/90 dark:to-gray-800",
                                  "hover:bg-gradient-to-br hover:from-blue-50/30 hover:via-white hover:to-indigo-50/30",
                                  "dark:hover:from-blue-900/10 dark:hover:via-gray-800 dark:hover:to-indigo-900/10",
                                  "hover:border-indigo-300/50 dark:hover:border-indigo-500/40"
                                ),

                                // Completed state styling
                                status === 'COMPLETED' && cn(
                                  "border-emerald-200/60 dark:border-emerald-700/60",
                                  "bg-gradient-to-br from-emerald-50/80 via-white to-green-50/80",
                                  "dark:from-emerald-900/20 dark:via-gray-800 dark:to-green-900/10"
                                )
                              )}
                            >
                              {/* Animated Border Gradient */}
                              <div className={cn(
                                "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 transition-opacity duration-500",
                                config.color,
                                "group-hover:opacity-5"
                              )} />

                              {/* Status Indicator Bar */}
                              <div className={cn(
                                "absolute top-0 left-0 w-1 h-full bg-gradient-to-b opacity-80",
                                config.color
                              )} />

                              {/* Content Container */}
                              <div className="relative p-5 space-y-4">
                                {/* Header Section */}
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0 space-y-2">
                                    {/* SPK Number */}
                                    <h3 className="text-xs md:text-lg font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                                      {spk.spkNumber}
                                    </h3>

                                    {/* Client Name */}
                                    <p className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-200 leading-tight">
                                      {spk.clientName}
                                    </p>

                                    {/* Project Name */}
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight line-clamp-2">
                                      {spk.projectName}
                                    </p>
                                  </div>

                                  {/* Status Badge */}
                                  <div className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-300",
                                    config.badge,
                                    "group-hover:scale-105"
                                  )}>
                                    <config.icon className="w-3.5 h-3.5" />
                                    <span className="text-xs font-semibold whitespace-nowrap">
                                      {config.text}
                                    </span>
                                  </div>
                                </div>

                                {/* Progress Section */}
                                <div className="space-y-3">
                                  {/* Progress Info Row */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                                        <Users2Icon className="w-3.5 h-3.5 text-indigo-500" />
                                        <span className="font-medium max-w-[100px] truncate">
                                          {spk.teamName?.split('@')[0] || 'Team'}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Progress
                                      </span>
                                      <span className={cn(
                                        "text-sm font-bold px-2 py-1 rounded-full",
                                        progress === 100
                                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                          : progress >= 75
                                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                            : progress >= 50
                                              ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                                              : progress >= 25
                                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                                : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                                      )}>
                                        {progress}%
                                      </span>
                                    </div>
                                  </div>

                                  {/* Progress Bar */}
                                  <div className="relative">
                                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 1, delay: index * 0.1 + 0.3, ease: "easeOut" }}
                                        className={cn(
                                          "h-full rounded-full bg-gradient-to-r shadow-inner",
                                          config.color
                                        )}
                                      />
                                    </div>

                                    {/* Progress Steps */}
                                    <div className="flex justify-between mt-1">
                                      {[0, 25, 50, 75, 100].map((step) => (
                                        <div
                                          key={step}
                                          className={cn(
                                            "w-1 h-1 rounded-full transition-all duration-300",
                                            progress >= step
                                              ? cn(
                                                "bg-gradient-to-r shadow-sm",
                                                config.color
                                              )
                                              : "bg-gray-300 dark:bg-gray-600"
                                          )}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Footer Info */}
                                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center gap-1.5">
                                      <Calendar className="w-3.5 h-3.5 text-rose-500" />
                                      <span className="font-medium">
                                        {new Date(spk.deadline).toLocaleDateString('id-ID', {
                                          day: 'numeric',
                                          month: 'short'
                                        })}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                    <User className="w-3.5 h-3.5 text-indigo-500" />
                                    <span className="font-medium max-w-[80px] truncate">
                                      {spk.assignedTo?.split('@')[0] || 'Unassigned'}
                                    </span>
                                  </div>
                                </div>

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-transparent to-blue-500/0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-2xl" />

                                {/* Click Ripple Effect (Optional) */}
                                <div className="absolute inset-0 rounded-2xl opacity-0 group-active:opacity-100 group-active:bg-white/10 transition-opacity duration-200" />
                              </div>
                            </div>
                          </motion.div>
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
                <Card className="border-border/40 bg-card/90 backdrop-blur-sm shadow-lg rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl">
                  <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/20 border-b border-border/40">
                    <CardTitle className="text-lg font-bold flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                        <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex flex-col">
                        <span>Laporkan Progress</span>
                        <CardDescription className="text-sm font-semibold mt-1">
                          {selectedSpk.spkNumber} - {selectedSpk.clientName}
                        </CardDescription>
                      </div>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Grid Form Utama */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Kolom Kiri - Input Data */}
                        <div className="space-y-5">

                          {/* Item Pekerjaan */}
                          <div className="space-y-3">
                            <Label className="text-sm font-semibold flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              Item Pekerjaan
                            </Label>
                            <Select
                              value={formData.items || ""}
                              onValueChange={(value) => handleChangeItem(value || null)}
                              disabled={!selectedSpk}
                            >
                              <SelectTrigger className="h-11 text-sm border-border/60 focus:ring-2 focus:ring-blue-500/20">
                                <SelectValue placeholder="Pilih item pekerjaan..." />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedSpk?.items.map((item) => {
                                  // cari progress terakhir dari reports
                                  const relatedReport = reports?.find(
                                    (r) => String(r.soDetailId) === String(item.id)
                                  );

                                  const previousProgress = relatedReport?.progress ?? item.progress ?? 0;

                                  let icon = "📈";
                                  if (previousProgress === 100) icon = "💹";
                                  else if (previousProgress < 30) icon = "📉";

                                  return (
                                    <SelectItem key={item.id} value={String(item.id)} className="text-sm">
                                      {item.name} - {icon}: {previousProgress}%
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>


                            </Select>

                            {formData.items && selectedSpk && (
                              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                                  Item dipilih: {selectedSpk.items.find((i) => i.id === formData.items)?.name}
                                </span>
                              </div>
                            )}

                            {!formData.items && (
                              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
                                <AlertCircle className="h-3 w-3" />
                                Harap pilih satu item pekerjaan
                              </div>
                            )}
                          </div>

                          {/* Jenis Laporan */}
                          <div className="space-y-3">
                            <Label className="text-sm font-semibold flex items-center gap-2">
                              <ClipboardList className="h-4 w-4 text-purple-600" />
                              Jenis Laporan
                            </Label>
                            <Select
                              value={formData.type}
                              onValueChange={(value: 'PROGRESS' | 'FINAL') =>
                                setFormData((prev) => {
                                  const selectedItem = selectedSpk?.items.find((i) => i.id === prev.items);
                                  const itemName = selectedItem?.name ?? "-";

                                  // Reset progress jika pindah dari FINAL ke PROGRESS
                                  const newProgress = value === "FINAL" ? 100 :
                                    (prev.progress === 100 ? (prev.minProgress ?? 0) : prev.progress);

                                  const note =
                                    value === "FINAL"
                                      ? `${itemName} - Selesai 100%`
                                      : "";


                                  return {
                                    ...prev,
                                    type: value,
                                    progress: newProgress,
                                    note,
                                  };
                                })
                              }
                            >
                              <SelectTrigger className="text-sm h-11 border-border/60 focus:ring-2 focus:ring-purple-500/20">
                                <SelectValue placeholder="Pilih jenis laporan" />
                              </SelectTrigger>
                              <SelectContent className="text-sm border-border/60">
                                <SelectItem value="PROGRESS" className="flex items-center gap-2 focus:bg-blue-50 focus:text-black">
                                  <TrendingUp className="h-4 w-4 text-blue-600" />
                                  Progress Pekerjaan
                                </SelectItem>
                                <SelectItem value="FINAL" className="flex items-center gap-2 focus:bg-green-50 focus:text-black">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  Selesai / Final
                                </SelectItem>
                              </SelectContent>
                            </Select>

                            <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded-lg">
                              {formData.type === "FINAL" ?
                                "✅ Laporan final akan menyelesaikan item menjadi 100%" :
                                "📊 Laporan progress untuk update perkembangan pekerjaan"}
                            </div>
                          </div>

                          {/* Catatan */}
                          <div className="space-y-3">
                            <Label className="text-sm font-semibold flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-orange-600" />
                              Catatan Progress
                            </Label>
                            <Textarea
                              placeholder={`Jelaskan detail progress, pencapaian, kendala, atau informasi penting lainnya...${formData.type === "FINAL" ? " (Wajib diisi untuk laporan final)" : ""}`}
                              value={formData.note}
                              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                              rows={4}
                              className="text-sm resize-none border-border/60 focus:ring-2 focus:ring-orange-500/20 transition-colors"
                              required
                            />
                          </div>
                        </div>

                        {/* Kolom Kanan - Progress & Dokumentasi */}
                        <div className="space-y-5">

                          {/* Progress Tracking */}
                          <div className="space-y-4 p-4 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/20 rounded-xl border border-border/60">
                            <Label className="text-sm font-semibold flex items-center gap-2">
                              <Target className="h-4 w-4 text-red-600" />
                              Tracking Progress Item
                            </Label>

                            {/* Progress Indicator */}
                            <div className="flex items-center justify-between mb-4">
                              <motion.span
                                key={formData.progress}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className={cn(
                                  "text-sm font-bold px-4 py-2 rounded-lg shadow-sm border transition-all duration-300",
                                  formData.progress === 100
                                    ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-green-200"
                                    : formData.progress >= 70
                                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-blue-200"
                                      : formData.progress >= 40
                                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-200"
                                        : "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-red-200"
                                )}
                              >
                                {formData.progress}% Complete
                              </motion.span>

                              <div className={cn(
                                "px-3 py-1 rounded-full text-xs font-bold border transition-all duration-300",
                                formData.progress === 100
                                  ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-800 dark:text-green-100"
                                  : "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-800 dark:text-blue-100"
                              )}>
                                {formData.progress === 100 ? "✅ DONE" : "🔄 IN PROGRESS"}
                              </div>
                            </div>

                            {/* Progress Slider */}
                            <div className="space-y-3">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Min: {formData.minProgress ?? 0}%</span>
                                <span className="font-medium">Progress Saat Ini: {formData.progress}%</span>
                                <span>Max: 100%</span>
                              </div>

                              <Slider
                                value={[formData.progress]}
                                onValueChange={(value) => {
                                  const newProgress = Math.max(value[0], formData.minProgress ?? 0);
                                  setFormData((prev) => ({
                                    ...prev,
                                    progress: newProgress,
                                    type: newProgress === 100 ? "FINAL" : "PROGRESS",
                                  }));
                                }}
                                disabled={formData.type === "FINAL" || !formData.items}
                                min={formData.minProgress ?? 0}
                                max={100}
                                step={5}
                                className="py-3"
                              />

                              <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground mt-1">
                                <span className="text-center">🔸</span>
                                <span className="text-center">🔸</span>
                                <span className="text-center">🔸</span>
                                <span className="text-center">🔸</span>
                                <span className="text-center">🔸</span>
                                <span className="text-center">🔸</span>
                                <span className="text-center">🔸</span>
                              </div>
                            </div>

                            {formData.items && selectedSpk && (
                              <div className="text-xs text-muted-foreground p-2 bg-white dark:bg-slate-700 rounded-lg border">
                                <span className="font-medium">📊 Progress untuk:</span>{" "}
                                <strong>{selectedSpk.items.find((i) => i.id === formData.items)?.name ?? "-"}</strong>
                                {formData.minProgress && (
                                  <span className="block mt-1 text-amber-600">
                                    ⚠️ Progress minimal: {formData.minProgress}%
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Dokumentasi Foto */}
                          <div className="space-y-4">
                            {/* Dropdown Kategori */}
                            <div className="flex items-center gap-3 mb-4">
                              <Label htmlFor="photo-category" className="text-sm font-medium whitespace-nowrap">
                                Kategori Foto:
                              </Label>
                              <select
                                id="photo-category"
                                value={formData.photoCategory}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  photoCategory: e.target.value as "SEBELUM" | "PROSES" | "SESUDAH"
                                })}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                              >
                                <option value="SEBELUM">SEBELUM</option>
                                <option value="PROSES">PROSES</option>
                                <option value="SESUDAH">SESUDAH</option>
                              </select>
                            </div>

                            {/* Grid Foto */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                              {formData.photos.map((photo, index) => (
                                <div
                                  key={index}
                                  className="relative group transform transition-all duration-300 hover:scale-105"
                                >
                                  <div className="relative h-28 w-full overflow-hidden rounded-xl border-2 border-border/60 group-hover:border-indigo-300 transition-colors">
                                    <Image
                                      src={URL.createObjectURL(photo.file)}
                                      alt={`${photo.category} - ${photo.file.name || `Dokumentasi ${index + 1}`}`}
                                      fill
                                      className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => removePhoto(index)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg hover:bg-red-600 z-10"
                                    aria-label="Hapus foto"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>

                                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    {photo.category} - {photo.file.name || `Foto ${index + 1}`}
                                  </div>
                                </div>
                              ))}

                              {/* Tombol Upload */}
                              {formData.photos.length < 10 && (
                                <div className="flex flex-col gap-2">
                                  <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-border/60 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all duration-300 group">
                                    <Camera className="w-6 h-6 mb-2 text-muted-foreground group-hover:text-indigo-600 transition-colors" />
                                    <span className="text-xs font-medium text-muted-foreground group-hover:text-indigo-600 transition-colors">Kamera</span>
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      capture="environment"
                                      className="hidden"
                                      onChange={handleFileUpload}
                                      disabled={uploading}
                                    />
                                  </label>

                                  <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-border/60 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300 group">
                                    <ImageIcon className="w-6 h-6 mb-2 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                                    <span className="text-xs font-medium text-muted-foreground group-hover:text-blue-600 transition-colors">Galeri</span>
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      className="hidden"
                                      onChange={handleFileUpload}
                                      disabled={uploading}
                                    />
                                  </label>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Validasi Progress */}
                      {formData.items && (
                        <div className={cn(
                          "p-4 rounded-xl border transition-all duration-300",
                          formData.progress === (formData.previousProgress ?? 0)
                            ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
                            : "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                        )}>
                          <div className="flex items-center gap-3">
                            {formData.progress === (formData.previousProgress ?? 0) ? (
                              <>
                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                                    Progress Belum Berubah
                                  </p>
                                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                    Silakan ubah nilai progress atau tambahkan catatan untuk mengirim laporan
                                  </p>
                                </div>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                                    Progress Berubah ({formData.previousProgress ?? 0}% → {formData.progress}%)
                                  </p>
                                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                    Siap untuk mengirim laporan progress
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-border/40">
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          onClick={() => setActiveTab("list")}
                          disabled={uploading}
                          className="text-sm w-full sm:w-auto gap-2 border-border/60 hover:bg-muted/50 transition-all duration-300"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Kembali ke Daftar
                        </Button>

                        <div className="flex-1" />

                        <Button
                          type="submit"
                          disabled={
                            uploading ||
                            !formData.note ||
                            !formData.items ||
                            formData.progress === (formData.previousProgress ?? 0)
                          }
                          size="lg"
                          className={cn(
                            "text-sm w-full sm:w-auto gap-2 text-white shadow-lg transition-all duration-300 transform hover:-translate-y-0.5",
                            formData.progress === (formData.previousProgress ?? 0)
                              ? "bg-gray-400 cursor-not-allowed hover:bg-gray-400"
                              : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                          )}
                        >
                          {uploading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Mengirim Laporan...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              {formData.type === "FINAL" ? "Kirim Laporan Final" : "Kirim Progress"}
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
                    <div className='col-span-2 col-start-1'>
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Archive className="h-4 w-4 text-purple-600" />
                        Riwayat Laporan
                      </CardTitle>
                      <CardDescription className="text-xs">Riwayat laporan SPK Anda</CardDescription>
                    </div>
                    <div className="col-span-1 col-start-5 items-center justify-center hidden lg:flex gap-2">
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
                    <div className="col-span-2 col-start-9">
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

                  <div className="col-span-1 col-start-10 items-center justify-center hidden lg:flex gap-2">
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
                              <TableRow className="[&>th]:py-0 [&>th]:px-2 [&>th]:text-xs [&>th]:font-semibold">
                                <TableHead className="w-[40px]">SPK Number, Pelanggan, Project Name </TableHead>
                                <TableHead></TableHead>
                                <TableHead className="w-[180px]">Team Lead. Lapangan</TableHead>
                                <TableHead className="w-[180px]">Progress</TableHead>
                                <TableHead className="w-[50px]">Approve Admin</TableHead>
                                <TableHead className="w-[80px]">Foto</TableHead>
                                {(role === 'admin' || role === 'super' || role === 'pic') && (
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
                                      <TableCell colSpan={(role === 'admin' || role === 'super' || role === 'pic') ? 7 : 6} className="sticky left-0 z-10 bg-purple-50 dark:bg-purple-900/20">
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
                                            <TableCell colSpan={(role === 'admin' || role === 'super' || role === 'pic') ? 7 : 6} className="pl-8 border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-900/10">
                                              <div className="flex items-center gap-0">
                                                {/* ✅ Render ChevronsRight 10x */}
                                                {Array(5)
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
                                                <div className="flex text-xs text-muted-foreground ml-24 pr-4">
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

                                              {/* Aksi (Admin Only) */}
                                              {(role === 'admin' || role === 'super' || role === 'pic') && (
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
                          onClick={downloadPDF} // ← Panggil fungsi yang membuka modal
                          // disabled={!selectedReport}
                          className="text-xs h-7"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Preview PDF
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modal Detail Laporan */}
      {selectedReport && modalType && (
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
              {(role === 'admin' || role === 'super' || role === 'pic') && (
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
      )}

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
    </div>
  );
};

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