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

  const loadData = async (filters: any = {}) => {
    try {
      setIsLoading(true);
      const [absensiResult, statsResult] = await Promise.all([
        fetchAllAbsensi(filters),
        fetchAbsensiStats()
      ]);

      if (absensiResult.absensi) {
        setAbsensiData(absensiResult.absensi);
      }
      if (statsResult) {
        setStats(statsResult);
      }
    } catch (err) {
      console.error("Error loading attendance data:", err);
      setError("Gagal memuat data absensi.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFilter = (filters: any) => {
    loadData(filters);
  };

  const handleReset = () => {
    loadData();
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
            <AttendanceFilters onFilter={handleFilter} onReset={handleReset} />
            <AttendanceTable 
              data={absensiData} 
              isLoading={isLoading} 
              onViewDetail={handleViewDetail}
              onRefresh={() => loadData()}
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
