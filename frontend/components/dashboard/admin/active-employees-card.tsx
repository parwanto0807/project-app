"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { fetchAllAbsensi } from "@/lib/action/hr/absensi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CheckCircle2, UserCheck, Clock, Users, ShieldCheck, MapPin, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ActiveEmployee {
  id: string;
  namaLengkap: string;
  team: string;
  jamMasuk: string;
  avatar?: string;
  status: string;
  latMasuk?: number;
  longMasuk?: number;
  attendanceLocation?: {
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
  };
}

export function ActiveEmployeesCard() {
  const [loading, setLoading] = useState(true);
  const [activeEmployees, setActiveEmployees] = useState<Record<string, ActiveEmployee[]>>({});
  const [totalActive, setTotalActive] = useState(0);

  useEffect(() => {
    let mounted = true;
    
    const loadActiveEmployees = async () => {
      try {
        setLoading(true);
        const today = new Date();
        const todayStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        
        // Also fetch yesterday to catch night shifts (e.g. clocked in at 17:00 yesterday, not clocked out yet)
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = new Date(yesterday.getTime() - (yesterday.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        
        const { absensi } = await fetchAllAbsensi({ startDate: yesterdayStr, endDate: todayStr });
        
        if (!mounted) return;

        // Filter: only those who have clocked in, but haven't clocked out, and are not missing
        const active = absensi.filter((record: any) => 
          !record.isMissing && 
          record.jamMasuk && 
          !record.jamKeluar && 
          !record.jamKeluarDisetujui &&
          (record.status === "HADIR" || record.status === "TERLAMBAT")
        );

        const grouped: Record<string, ActiveEmployee[]> = {};
        
        active.forEach((record: any) => {
          // Relasi di database adalah melalui tabel perantara teamKaryawan
          const tkList = record.karyawan?.teamKaryawan || [];
          const teamName = tkList.length > 0 && tkList[0].team?.namaTeam 
            ? tkList[0].team.namaTeam 
            : "Tanpa Team";
            
          if (!grouped[teamName]) {
            grouped[teamName] = [];
          }
          
          grouped[teamName].push({
            id: record.karyawanId,
            namaLengkap: record.karyawan?.namaLengkap || "Unknown",
            team: teamName,
            jamMasuk: record.jamMasuk,
            avatar: record.karyawan?.photoUrl,
            status: record.status,
            latMasuk: record.latMasuk,
            longMasuk: record.longMasuk,
            attendanceLocation: record.karyawan?.attendanceLocation,
          });
        });

        setActiveEmployees(grouped);
        setTotalActive(active.length);
      } catch (error) {
        console.error("Failed to load active employees:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadActiveEmployees();
    
    // Optional: Refresh every 60 seconds
    const interval = setInterval(loadActiveEmployees, 60000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const formatJam = (iso: string) => {
    return format(new Date(iso), "dd MMM HH:mm", { locale: id });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  if (loading) {
    return (
      <Card className="shadow-sm border border-cyan-100 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse" />
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Jika tidak ada karyawan yang masih aktif (semua sudah pulang atau tidak ada absen masuk)
  if (totalActive === 0) {
    return (
      <Card className="shadow-sm border border-emerald-100 overflow-hidden bg-gradient-to-b from-emerald-50/50 to-white">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-gray-800">Semua Karyawan Telah Absen Pulang</h3>
          <p className="text-xs text-muted-foreground">
            Tidak ada karyawan yang terdeteksi sedang berada di kantor/lapangan saat ini.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md border border-cyan-200 overflow-hidden relative bg-gradient-to-b from-cyan-50/30 to-white backdrop-blur-sm">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-[length:200%_100%] animate-[gradient_3s_linear_infinite]" />
      <CardHeader className="pb-3 pt-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base md:text-lg flex items-center gap-2 text-gray-800">
            <UserCheck className="h-5 w-5 text-cyan-600" />
            Kehadiran Aktif
          </CardTitle>
          <Badge className="bg-cyan-100 text-cyan-700 border-cyan-200 font-black animate-pulse">
            {totalActive} ON SITE
          </Badge>
        </div>
        <CardDescription className="text-xs md:text-sm">
          Karyawan yang sudah absen masuk dan belum absen keluar hari ini.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(activeEmployees).map(([team, employees]) => (
          <div key={team} className="space-y-2">
            <div className="flex items-center gap-2 mb-1.5">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {team} ({employees.length})
              </h4>
              <div className="h-px bg-gray-100 flex-1 ml-2" />
            </div>
            
            <div className="grid gap-2">
              {employees.map((emp) => (
                <div 
                  key={emp.id} 
                  className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-100 shadow-sm transition-all hover:border-cyan-200 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 ring-2 ring-cyan-50 ring-offset-1">
                      <AvatarImage src={emp.avatar} alt={emp.namaLengkap} />
                      <AvatarFallback className="bg-gradient-to-br from-cyan-100 to-blue-100 text-cyan-700 text-[10px] font-bold">
                        {getInitials(emp.namaLengkap)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-700 leading-none mb-1">
                        {emp.namaLengkap}
                      </span>
                      {emp.status === "TERLAMBAT" && (
                        <span className="text-[9px] text-amber-600 font-semibold bg-amber-50 w-max px-1.5 rounded">
                          Terlambat
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                      <span className="text-[9px] font-black tracking-widest text-emerald-600 bg-emerald-100 px-1 py-0.5 rounded uppercase">IN</span>
                      <Clock className="h-3 w-3 text-cyan-600" />
                      <span className="text-xs font-bold text-cyan-700">
                        {formatJam(emp.jamMasuk)}
                      </span>
                    </div>

                    {emp.attendanceLocation ? (
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                        <MapPin className="h-3 w-3" />
                        {emp.attendanceLocation.name}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                        <MapPin className="h-3 w-3" />
                        Fleksibel / Lapangan
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
