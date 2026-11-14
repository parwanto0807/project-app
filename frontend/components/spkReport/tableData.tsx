"use client";
// import { Fragment } from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Archive, FileText, Sparkles, TrendingUp, Clock } from 'lucide-react';
import { fetchSPKReports } from '@/lib/action/master/spk/spkReport';

// Import komponen terpisah — dimuat lazy agar bundle awal lebih ringan
import SPKListTab from './SPKListTab';

const TabLoading = () => (
  <div className="flex items-center justify-center py-16">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-indigo-600" />
  </div>
);

const ReportProgressTab = dynamic(() => import('./ReportProgressTab'), {
  ssr: false,
  loading: TabLoading,
});
const ReportHistoryTab = dynamic(() => import('./ReportHistoryTab'), {
  ssr: false,
  loading: TabLoading,
});

// 👇 DEFINSI TIPE DATA API (TETAP UTUH)
export interface SPKDataApi {
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

interface PhotoWithCategory {
  file: File;
  category: "SEBELUM" | "PROSES" | "SESUDAH";
  latitude?: number;
  longitude?: number;
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
  photos: PhotoWithCategory[];
}

interface FormMonitoringProgressSpkProps {
  dataSpk: SPKDataApi[];
  isLoading: boolean;
  userEmail: string;
  role: string;
  userId: string;
}

type ItemProgress = Record<string, number>;
type SPKItemProgressMap = Record<string, ItemProgress>;
type TabType = 'list' | 'report' | 'history';

const EMPTY_FILTERS = {
  date: 'all' as const,
  status: 'all' as const,
  spkId: '',
  karyawanId: '',
};

// 👇 MAP KE SPKData - FIXED PROGRESS CALCULATION (pure, di luar komponen)
const mapToSPKData = (raw: SPKDataApi[]): SPKData[] => {
  return raw.map(item => {
    const clientName = item.salesOrder?.customer?.name || 'Client Tidak Dikenal';
    const projectName = item.salesOrder?.project?.name || 'Project Tidak Dikenal';
    const assignedTo = item.team?.teamKaryawan?.karyawan?.namaLengkap || item.createdBy?.namaLengkap || 'Tidak Ditugaskan';
    const teamName = item.team?.namaTeam || 'Team belum ditentukan';
    const email = item.team?.teamKaryawan?.karyawan?.email || 'Email belum ditentukan';
    const deadline = item.spkDate ? new Date(item.spkDate).toISOString() : new Date().toISOString();

    // Group detail per sales order item sekali (O(n) total), bukan filter
    // berulang untuk setiap item (O(n²)).
    const detailsByItem = new Map<string, SPKDataApi['details']>();
    for (const detail of item.details ?? []) {
      const itemId = detail.salesOrderItem?.id;
      if (!itemId) continue;
      const grouped = detailsByItem.get(itemId);
      if (grouped) grouped.push(detail);
      else detailsByItem.set(itemId, [detail]);
    }

    const items = (item.salesOrder?.items ?? []).map(itemSales => {
      const relatedDetails = detailsByItem.get(itemSales.id) ?? [];
      const hasDoneDetail = relatedDetails.some(detail => detail.status === 'DONE');

      return {
        id: itemSales.id,
        name: itemSales.name,
        description: itemSales.description || undefined,
        qty: itemSales.qty,
        uom: itemSales.uom || undefined,
        status: (hasDoneDetail ? 'DONE' : 'PENDING') as 'PENDING' | 'DONE',
        progress: hasDoneDetail ? 100 : 0,
      };
    });

    const totalItems = items.length;
    const totalProgress = items.reduce((sum, item) => sum + item.progress, 0);
    const progress = totalItems > 0 ? Math.round(totalProgress / totalItems) : 0;

    let status: 'PENDING' | 'PROGRESS' | 'COMPLETED';
    if (progress === 100) status = 'COMPLETED';
    else if (progress > 0) status = 'PROGRESS';
    else status = 'PENDING';

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
    photoCategory: "SEBELUM",
  });
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [reports, setReports] = useState<ReportHistory[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [filters, setFilters] = useState({
    date: 'all' as 'all' | 'today' | 'thisWeek' | 'thisMonth',
    status: 'all' as 'all' | 'PENDING' | 'APPROVED' | 'REJECTED',
    spkId: '',
    karyawanId: '',
  });
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 👇 FETCH RIWAYAT LAPORAN
  const fetchReports = useCallback(async (signal?: AbortSignal) => {
    setLoadingReports(true);
    try {
      const data = await fetchSPKReports({ ...filters, openOnly: true }, { signal });
      if (signal?.aborted) return;

      const sorted = [...data].sort((a, b) => {
        const spkCompare = a.spkNumber.localeCompare(b.spkNumber, undefined, {
          numeric: true,
          sensitivity: 'base',
        });
        if (spkCompare === 0) {
          return a.itemName.localeCompare(b.itemName, undefined, {
            sensitivity: 'base',
          });
        }
        return spkCompare;
      });
      setReports(sorted);
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') return;
      console.error('Error fetching reports:', error);
      toast.error('Gagal memuat riwayat laporan');
    } finally {
      if (!signal?.aborted) setLoadingReports(false);
    }
  }, [filters]);

  // DERIVED: data SPK (tanpa effect + state perantara)
  const userSpk = useMemo(() => mapToSPKData(dataSpk ?? []), [dataSpk]);

  // DERIVED: progress tertinggi per item
  const spkItemProgress = useMemo(() => {
    const map: SPKItemProgressMap = {};
    for (const report of reports) {
      const { spkNumber, soDetailId, progress } = report;
      const itemMap = (map[spkNumber] ??= {});
      itemMap[soDetailId] = Math.max(itemMap[soDetailId] ?? 0, progress ?? 0);
    }
    return map;
  }, [reports]);

  // EFFECT: Fetch reports saat filter berubah (batalkan request lama)
  useEffect(() => {
    const controller = new AbortController();
    void fetchReports(controller.signal);
    return () => controller.abort();
  }, [fetchReports]);

  const filteredUserSpk = useMemo(() => {
    if (role === 'admin' || role === 'super' || role === 'pic' || role === 'user') return userSpk;
    return userSpk.filter(spk => spk.email === userEmail);
  }, [userSpk, role, userEmail]);

  const getSPKFieldProgress = useCallback((spk: SPKData): number => {
    const itemProgressMap = spkItemProgress[spk.spkNumber];
    if (!itemProgressMap || spk.items.length === 0) return 0;
    const totalProgress = spk.items.reduce(
      (sum, item) => sum + (itemProgressMap[item.id] ?? 0),
      0
    );
    return Math.round(totalProgress / spk.items.length);
  }, [spkItemProgress]);

  // Statistik dihitung sekali per perubahan data, bukan setiap render.
  const completedCount = useMemo(
    () => filteredUserSpk.reduce(
      (count, spk) => count + (getSPKFieldProgress(spk) === 100 ? 1 : 0),
      0
    ),
    [filteredUserSpk, getSPKFieldProgress]
  );

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
                    {completedCount}
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
              // Hanya reset jika memang ada filter aktif — menghindari refetch
              // laporan setiap kali tab berpindah.
              setFilters(prev =>
                prev.date === 'all' && prev.status === 'all' && !prev.spkId && !prev.karyawanId
                  ? prev
                  : EMPTY_FILTERS
              );
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
              <SPKListTab
                filteredUserSpk={filteredUserSpk}
                selectedSpk={selectedSpk}
                setSelectedSpk={setSelectedSpk}
                setActiveTab={setActiveTab}
                getSPKFieldProgress={getSPKFieldProgress}
                role={role}
                userEmail={userEmail}
              />
            </TabsContent>

            {/* TAB 2: FORM LAPOR PROGRESS */}
            <TabsContent value="report" className="animate-fade-in">
              <ReportProgressTab
                selectedSpk={selectedSpk}
                formData={formData}
                setFormData={setFormData}
                uploading={uploading}
                setUploading={setUploading}
                setActiveTab={setActiveTab}
                reports={reports}
                userEmail={userEmail}
                userId={userId}
                dataSpk={dataSpk}
                fetchReports={fetchReports}
              />
            </TabsContent>

            {/* TAB 3: RIWAYAT LAPORAN */}
            <TabsContent value="history" className="animate-fade-in">
              <ReportHistoryTab
                reports={reports}
                loadingReports={loadingReports}
                filters={filters}
                setFilters={setFilters}
                filteredUserSpk={filteredUserSpk}
                userSpk={userSpk}
                role={role}
                fetchReports={fetchReports}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

// 👇 SKELETON LOADER
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