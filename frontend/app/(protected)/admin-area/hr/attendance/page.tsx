"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { fetchAllAbsensi, fetchAbsensiStats } from "@/lib/action/hr/absensi";
import { AttendanceStats } from "@/components/hr/attendance/AttendanceStats";
import { AttendanceFilters } from "@/components/hr/attendance/AttendanceFilters";
import { AttendanceTable } from "@/components/hr/attendance/AttendanceTable";
import { AttendanceDetailDialog } from "@/components/hr/attendance/AttendanceDetailDialog";

export default function AttendanceMonitoringPage() {
  const [absensiData, setAbsensiData] = useState([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [groupByTeam, setGroupByTeam] = useState(false);
  const [showInvalidOnly, setShowInvalidOnly] = useState(false);
  const [invalidCount, setInvalidCount] = useState(0);

  const getTodayStr = () => {
    const d = new Date();
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  };

  const getStartDateStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  };

  const [currentFilters, setCurrentFilters] = useState<any>({ startDate: getStartDateStr(), endDate: getTodayStr() });

  const loadData = async (filters: any = {}) => {
    try {
      setIsLoading(true);
      const absensiResult = await fetchAllAbsensi(filters);

      if (absensiResult.absensi) {
        const data = absensiResult.absensi;
        setAbsensiData(data);
        
        let invCount = 0;
        const now = new Date().getTime();
        data.forEach((a: any) => {
          let invalid = false;
          const effectiveKeluar = a.jamKeluarDisetujui || a.jamKeluar;
          
          // 1. Cuti/Izin tapi ada jam masuk/keluar
          if ((a.status === 'CUTI' || a.status === 'IZIN') && (a.jamMasuk || effectiveKeluar)) {
            invalid = true;
          }
          // 2. Jam keluar lebih awal dari jam masuk
          if (a.jamMasuk && effectiveKeluar && new Date(effectiveKeluar) < new Date(a.jamMasuk)) {
            invalid = true;
          }
          // 3. Menggantung (tidak ada jam keluar) dan sudah lewat 24 jam
          if (a.jamMasuk && !effectiveKeluar) {
            const hoursDiff = (now - new Date(a.jamMasuk).getTime()) / (1000 * 60 * 60);
            if (hoursDiff > 24) invalid = true;
          }
          if (invalid) invCount++;
        });
        setInvalidCount(invCount);

        setStats({
          total: data.length,
          hadir: data.filter((a: any) => a.status === "HADIR").length,
          terlambat: data.filter((a: any) => a.status === "TERLAMBAT").length,
          izin: data.filter((a: any) => a.status === "IZIN" || a.status === "SAKIT").length,
          alfa: data.filter((a: any) => a.status === "MANGKIR" || a.status === "ALFA").length,
        });
      }
    } catch (err) {
      console.error("Error loading attendance data:", err);
      setError("Gagal memuat data absensi.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(currentFilters);
  }, []);

  const handleFilter = (filters: any) => {
    if (filters.groupByTeam !== undefined) {
      setGroupByTeam(filters.groupByTeam);
    }
    if (filters.showInvalid !== undefined) {
      setShowInvalidOnly(filters.showInvalid);
    }
    setCurrentFilters(filters);
    loadData(filters);
  };

  const handleReset = () => {
    setGroupByTeam(false);
    setShowInvalidOnly(false);
    const defaultFilters = { startDate: getStartDateStr(), endDate: getTodayStr() };
    setCurrentFilters(defaultFilters);
    loadData(defaultFilters);
  };

  const handleViewDetail = (record: any) => {
    setSelectedRecord(record);
    setIsDialogOpen(true);
  };

  const layoutProps: LayoutProps = {
    title: "Attendance Monitoring",
    role: "admin",
    children: (
      <div className="flex-1 space-y-8 p-4 pt-6 md:p-8 min-h-screen bg-gray-50/50">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Badge variant="outline" className="hover:bg-cyan-50 text-cyan-700 border-cyan-200">
                  <Link href="/admin-area">Dashboard</Link>
                </Badge>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Badge variant="outline" className="text-gray-500 border-gray-200">
                <BreadcrumbPage>HR Management</BreadcrumbPage>
              </Badge>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Badge variant="secondary" className="bg-cyan-500 text-white border-none">
                <BreadcrumbPage>Attendance Monitoring</BreadcrumbPage>
              </Badge>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-gray-900 uppercase">Attendance Monitoring</h1>
            <p className="text-muted-foreground font-medium">Monitor employee presence, clock-in/out locations, and activity in real-time.</p>
          </div>

          <AttendanceStats stats={stats} />
          
          <div className="space-y-4">
            <AttendanceFilters 
              onFilter={handleFilter} 
              onReset={handleReset} 
              invalidCount={invalidCount}
              showInvalidOnly={showInvalidOnly}
            />
            <AttendanceTable 
              data={showInvalidOnly ? absensiData.filter((a: any) => {
                const now = new Date().getTime();
                const effectiveKeluar = a.jamKeluarDisetujui || a.jamKeluar;
                if ((a.status === 'CUTI' || a.status === 'IZIN') && (a.jamMasuk || effectiveKeluar)) return true;
                if (a.jamMasuk && effectiveKeluar && new Date(effectiveKeluar) < new Date(a.jamMasuk)) return true;
                if (a.jamMasuk && !effectiveKeluar && ((now - new Date(a.jamMasuk).getTime()) / (1000 * 60 * 60)) > 24) return true;
                return false;
              }) : absensiData} 
              isLoading={isLoading} 
              onViewDetail={handleViewDetail}
              onRefresh={() => loadData(currentFilters)}
              groupByTeam={groupByTeam}
            />
          </div>
        </div>

        <AttendanceDetailDialog 
          record={selectedRecord} 
          isOpen={isDialogOpen} 
          onClose={() => setIsDialogOpen(false)} 
        />
      </div>
    ),
  };

  return <AdminLayout {...layoutProps} />;
}
