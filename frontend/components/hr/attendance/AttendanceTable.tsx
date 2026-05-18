"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Eye, MapPin, Smartphone, AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Fragment, useState } from "react";
import ValidateAttendanceDialog from "./ValidateAttendanceDialog";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface TableProps {
  data: any[];
  isLoading: boolean;
  onViewDetail: (record: any) => void;
  onRefresh?: () => void;
}

const JAM_STANDAR_KELUAR = "17:00";

function isSuspicious(jamMasuk: string | null, jamKeluar: string | null): boolean {
  if (!jamMasuk || !jamKeluar) return false;
  const keluarDate = new Date(jamKeluar);
  const standar = new Date(keluarDate);
  const [h, m] = JAM_STANDAR_KELUAR.split(":").map(Number);
  standar.setHours(h, m, 0, 0);
  return keluarDate.getTime() - standar.getTime() > 30 * 60 * 1000;
}

function getDiscrepancyInfo(jamKeluar: string | null, firstSeen: string | null) {
  if (!jamKeluar || !firstSeen) return null;
  const outTime = new Date(jamKeluar).getTime();
  const seenTime = new Date(firstSeen).getTime();
  const diffMs = outTime - seenTime;
  if (diffMs <= 15 * 60 * 1000) return null; // Only flag if > 15 minutes
  const h = Math.floor(diffMs / 3600000);
  const m = Math.floor((diffMs % 3600000) / 60000);
  const durationStr = h > 0 ? `${h} jam ${m}m` : `${m}m`;
  return `${durationStr} (Indikasi Mengulur Waktu)`;
}

export function AttendanceTable({ data, isLoading, onViewDetail, onRefresh }: TableProps) {
  const [validateRecord, setValidateRecord] = useState<any | null>(null);

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

  const formatJakarta = (dateInput: string | Date | null, showDate = false) => {
    if (!dateInput) return "--:--";
    try {
      const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
      if (showDate) {
        return new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Jakarta",
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(date);
      }
      return new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(date);
    } catch { return "--:--"; }
  };


  const calculateDuration = (inTime: string | null, outTime: string | null) => {
    if (!inTime || !outTime) return "--";
    const diffMs = new Date(outTime).getTime() - new Date(inTime).getTime();
    if (diffMs <= 0) return "--";
    const h = Math.floor(diffMs / 3600000);
    const m = Math.floor((diffMs % 3600000) / 60000);
    return `${h}j ${m}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
      </div>
    );
  }

  return (
    <>
      <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/20 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Karyawan</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Tanggal</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Masuk</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Keluar</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Deteksi Kantor</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Durasi</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Lembur</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Status</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Validasi</TableHead>
              <TableHead className="text-right font-bold uppercase text-[10px] tracking-[0.1em]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center text-muted-foreground font-medium">
                  Tidak ada data absensi.
                </TableCell>
              </TableRow>
            ) : (
              (() => {
                const groupedData: Record<string, any[]> = {};
                data.forEach((row) => {
                  const dateKey = row.tanggal.split('T')[0];
                  if (!groupedData[dateKey]) groupedData[dateKey] = [];
                  groupedData[dateKey].push(row);
                });

                const sortedDates = Object.keys(groupedData).sort((a, b) => b.localeCompare(a));

                return sortedDates.map((date) => (
                  <Fragment key={date}>
                    <TableRow className="bg-gray-50/80">
                      <TableCell colSpan={10} className="py-2.5 px-6">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-cyan-500" />
                          <span className="font-black text-[11px] uppercase tracking-widest text-gray-500">
                            {format(new Date(date), "EEEE, dd MMMM yyyy", { locale: id })}
                          </span>
                          <Badge variant="outline" className="ml-auto text-[9px] font-bold border-gray-200 text-gray-400">
                            {groupedData[date].length} ABSENSI
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                    {groupedData[date].map((row) => {
                      const suspicious = isSuspicious(row.jamMasuk, row.jamKeluar);
                      const validated = row.isValidated;
                      const needsValidation = row.jamKeluar && !validated;

                      return (
                        <TableRow
                          key={row.id}
                          className={`hover:bg-white/60 transition-colors group ${suspicious && !validated ? "bg-red-50/30" : ""}`}
                        >
                          {/* Karyawan */}
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

                          {/* Tanggal */}
                          <TableCell className="font-bold text-gray-600 text-xs text-center">
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] text-gray-400 uppercase tracking-tighter">{format(new Date(row.tanggal), "EEE", { locale: id })}</span>
                              <span className="leading-none">{format(new Date(row.tanggal), "dd", { locale: id })}</span>
                            </div>
                          </TableCell>

                    {/* Jam Masuk */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-black text-cyan-600 text-[11px]">
                          {row.jamMasuk ? formatJakarta(row.jamMasuk, true) : "--:--"}
                        </div>
                      </div>
                    </TableCell>

                    {/* Jam Keluar — tampilkan jam disetujui jika ada */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className={`font-black text-[11px] ${suspicious && !validated ? "text-red-600" : "text-blue-600"}`}>
                          <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-tighter">Manual:</span>
                          {row.jamKeluar ? formatJakarta(row.jamKeluar, true) : "--:--"}
                          {suspicious && !validated && (
                            <AlertTriangle className="inline h-3 w-3 ml-1 text-red-500" />
                          )}
                        </div>
                        {validated && row.jamKeluarDisetujui && (
                          <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            {formatJakarta(row.jamKeluarDisetujui, true)}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Deteksi Kantor (first_seen_at) */}
                    <TableCell>
                      {row.first_seen_at ? (
                        <div className="space-y-1">
                          <div className="text-[9px] text-amber-800 bg-amber-50 border border-amber-100 p-1.5 rounded-lg space-y-0.5 max-w-[170px] leading-tight font-medium shadow-sm">
                            <span className="text-[8px] text-amber-600 font-black block uppercase tracking-tighter">Terdeteksi:</span>
                            <span className="font-bold text-[10px] text-amber-900">{formatJakarta(row.first_seen_at, true)}</span>
                            {(() => {
                              const discStr = getDiscrepancyInfo(row.jamKeluar, row.first_seen_at);
                              if (discStr) {
                                return (
                                  <span className="text-[8px] text-red-600 font-black block leading-tight mt-0.5 uppercase tracking-tighter">
                                    Selisih: {discStr}
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </TableCell>

                    {/* Durasi — pakai jam disetujui jika ada */}
                    <TableCell className="font-bold text-gray-700 text-xs">
                      <div className="space-y-0.5">
                        <div>{calculateDuration(row.jamMasuk, row.jamKeluar)}</div>
                        {validated && row.jamKeluarDisetujui && row.jamKeluarDisetujui !== row.jamKeluar && (
                          <div className="text-[10px] text-emerald-600 font-semibold">
                            ✓ {calculateDuration(row.jamMasuk, row.jamKeluarDisetujui)}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Lembur */}
                    <TableCell>
                      {row.jamLembur > 0 ? (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none px-2 py-0.5 rounded-full font-bold text-[10px] whitespace-nowrap">
                          {row.jamLembur} JAM
                        </Badge>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>{getStatusBadge(row.status)}</TableCell>

                    {/* Validasi column */}
                    <TableCell>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* GPS & device */}
                        {row.latMasuk && (
                          <span title="GPS Valid">
                            <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                          </span>
                        )}
                        {row.deviceMasuk && (
                          <span title={row.deviceMasuk}>
                            <Smartphone className="h-3.5 w-3.5 text-blue-500" />
                          </span>
                        )}
                        {(row.isMockedMasuk || row.isMockedKeluar) && (
                          <span title="Mock GPS!">
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
                          </span>
                        )}
                        {/* Validation badge */}
                        {validated ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border text-[9px] px-1.5 py-0">
                            <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />Valid
                          </Badge>
                        ) : suspicious ? (
                          <Badge className="bg-red-50 text-red-600 border-red-200 border text-[9px] px-1.5 py-0 animate-pulse">
                            <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />Perlu Cek
                          </Badge>
                        ) : needsValidation ? (
                          <Badge className="bg-amber-50 text-amber-600 border-amber-200 border text-[9px] px-1.5 py-0">
                            Belum Valid
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Validate button — tampil jika: belum divalidasi (manual out), ada jam keluar, atau sudah divalidasi (re-validasi) */}
                        {(row.jamKeluar || row.jamKeluarDisetujui || !row.isValidated) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`rounded-lg transition-all text-xs ${
                              suspicious && !validated
                                ? "text-red-600 hover:bg-red-50 hover:text-red-700"
                                : validated
                                ? "text-emerald-600 hover:bg-emerald-50"
                                : "text-blue-600 hover:bg-blue-50"
                            }`}
                            onClick={() => setValidateRecord(row)}
                          >
                            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                            {validated ? "Re-Validasi" : (row.jamKeluar ? "Validasi" : "Manual Out")}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-cyan-500 hover:text-white rounded-lg transition-all"
                          onClick={() => onViewDetail(row)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          <span className="text-xs font-bold uppercase">Detail</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                      );
                    })}
                  </Fragment>
                ));
              })()
            )}
          </TableBody>
        </Table>
      </div>

      {/* Validate Dialog */}
      {validateRecord && (
        <ValidateAttendanceDialog
          record={validateRecord}
          open={!!validateRecord}
          onClose={() => setValidateRecord(null)}
          onSuccess={() => {
            setValidateRecord(null);
            onRefresh?.();
          }}
        />
      )}
    </>
  );
}
