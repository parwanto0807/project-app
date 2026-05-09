"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Eye, MapPin, Smartphone, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface TableProps {
  data: any[];
  isLoading: boolean;
  onViewDetail: (record: any) => void;
}

export function AttendanceTable({ data, isLoading, onViewDetail }: TableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "HADIR":
        return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none px-3 py-1 rounded-full font-bold text-[10px]">HADIR</Badge>;
      case "TERLAMBAT":
        return <Badge className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-none px-3 py-1 rounded-full font-bold text-[10px]">TERLAMBAT</Badge>;
      case "IZIN":
      case "SAKIT":
        return <Badge className="bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border-none px-3 py-1 rounded-full font-bold text-[10px]">IZIN / SAKIT</Badge>;
      case "ALFA":
        return <Badge className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-none px-3 py-1 rounded-full font-bold text-[10px]">ALFA</Badge>;
      default:
        return <Badge variant="outline" className="px-3 py-1 rounded-full font-bold text-[10px]">{status}</Badge>;
    }
  };

  const calculateDuration = (inTime: string | null, outTime: string | null) => {
    if (!inTime || !outTime) return "--";
    const start = new Date(inTime);
    const end = new Date(outTime);
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return "--";
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}j ${minutes}m`;
  };

  const formatJakarta = (dateInput: string | Date | null) => {
    if (!dateInput) return "--:--";
    try {
      const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      const formatted = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: '2-digit',
        month: 'short',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(date);
      
      // Intl id-ID output often uses dots for time separators, convert to colon
      return formatted.replace(/\./g, ':');
    } catch (e) {
      return "--:--";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
      </div>
    );
  }

  return (
    <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/20 shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Employee</TableHead>
            <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Date</TableHead>
            <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Clock In</TableHead>
            <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Clock Out</TableHead>
            <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Duration</TableHead>
            <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Status</TableHead>
            <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Validation</TableHead>
            <TableHead className="text-right font-bold uppercase text-[10px] tracking-[0.1em]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center text-muted-foreground font-medium">
                No attendance records found.
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow key={row.id} className="hover:bg-white/60 transition-colors group">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                      <AvatarImage src={row.karyawan?.foto ? `${process.env.NEXT_PUBLIC_API_URL}${row.karyawan.foto}` : undefined} />
                      <AvatarFallback className="bg-cyan-100 text-cyan-700 font-black text-xs">
                        {row.karyawan?.namaLengkap?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-black text-sm text-gray-800">{row.karyawan?.namaLengkap}</div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{row.karyawan?.nik}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-bold text-gray-600 text-xs">
                  {formatJakarta(row.tanggal).split(' ')[0] + ' ' + formatJakarta(row.tanggal).split(' ')[1] + ' ' + formatJakarta(row.tanggal).split(' ')[2]}
                </TableCell>
                <TableCell className="font-black text-cyan-600 text-[11px]">
                  {row.jamMasuk ? formatJakarta(row.jamMasuk) : "--:--"}
                </TableCell>
                <TableCell className="font-black text-blue-600 text-[11px]">
                  {row.jamKeluar ? formatJakarta(row.jamKeluar) : "--:--"}
                </TableCell>
                <TableCell className="font-bold text-gray-700 text-xs">
                  {calculateDuration(row.jamMasuk, row.jamKeluar)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(row.status)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {row.latMasuk && (
                      <MapPin className="h-4 w-4 text-emerald-500" title="GPS Valid" />
                    )}
                    {row.deviceMasuk && (
                      <Smartphone className="h-4 w-4 text-blue-500" title={row.deviceMasuk} />
                    )}
                    {(row.isMockedMasuk || row.isMockedKeluar) && (
                      <AlertTriangle className="h-4 w-4 text-rose-500 animate-pulse" title="Mock Location Detected!" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="hover:bg-cyan-500 hover:text-white rounded-lg transition-all"
                    onClick={() => onViewDetail(row)}
                  >
                    <Eye className="h-4 w-4 mr-1.5" />
                    <span className="text-xs font-bold uppercase">Detail</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
