"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Eye, MapPin, Smartphone, AlertTriangle, ShieldCheck, CheckCircle2, PlusCircle, Trash2, Loader2, Fingerprint, CornerDownRight } from "lucide-react";
import { Fragment, useState, useEffect } from "react";
import ValidateAttendanceDialog from "./ValidateAttendanceDialog";
import { ManualAttendanceDialog } from "./ManualAttendanceDialog";
import { EditAttendanceDialog } from "./EditAttendanceDialog";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import { deleteAbsensi } from "@/lib/action/hr/absensi";
import { useSession } from "@/components/clientSessionProvider";

interface TableProps {
  data: any[];
  isLoading: boolean;
  onViewDetail: (record: any) => void;
  onRefresh?: () => void;
  groupByTeam?: boolean;
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

export function AttendanceTable({ data, isLoading, onViewDetail, onRefresh, groupByTeam }: TableProps) {
  const [validateRecord, setValidateRecord] = useState<any | null>(null);
  const [manualRecord, setManualRecord] = useState<any | null>(null);
  const [editRecord, setEditRecord] = useState<any | null>(null);
  const { user, isLoading: isSessionLoading } = useSession();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (absensiId: string) => {
    if (!confirm("Yakin ingin menghapus data absensi ini?")) return;
    setIsDeleting(absensiId);
    try {
      const res = await deleteAbsensi(absensiId);
      if (res.success) {
        toast.success("Berhasil menghapus data absensi");
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.error || "Gagal menghapus");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsDeleting(null);
    }
  };

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
      case "MANGKIR":
        return <Badge className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-none px-3 py-1 rounded-full font-bold text-[10px]">{status}</Badge>;
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
              <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Lokasi Absen</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Tanggal</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Masuk</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Keluar</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Deteksi Kantor</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Durasi</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Lembur</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Status</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Keterangan</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-[0.1em]">Validasi</TableHead>
              <TableHead className="text-right font-bold uppercase text-[10px] tracking-[0.1em]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="h-32 text-center text-muted-foreground font-medium">
                  Tidak ada data absensi.
                </TableCell>
              </TableRow>
            ) : (
              (() => {
                const getJakartaDateString = (dateInput: string) => {
                  try {
                    const d = new Date(dateInput);
                    // use sv-SE for YYYY-MM-DD
                    return new Intl.DateTimeFormat('sv-SE', {
                      timeZone: 'Asia/Jakarta',
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    }).format(d);
                  } catch {
                    return dateInput.split('T')[0];
                  }
                };

                const renderRow = (row: any, isSubGrouped: boolean = false) => {
                  const suspicious = isSuspicious(row.jamMasuk, row.jamKeluar);
                  const validated = row.isValidated;
                  const needsValidation = row.jamKeluar && !validated;

                  return (
                    <TableRow
                      key={row.id}
                      className={`hover:bg-white/60 transition-colors group ${suspicious && !validated ? "bg-red-50/30" : ""}`}
                    >
                      {/* Karyawan */}
                      <TableCell className={isSubGrouped ? "pl-14 border-l-2 border-indigo-100" : ""}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 border border-white shadow-sm">
                            <AvatarImage src={row.karyawan?.foto ? `${process.env.NEXT_PUBLIC_API_URL}${row.karyawan.foto}` : undefined} />
                            <AvatarFallback className="bg-cyan-100 text-cyan-700 font-black text-[10px]">
                              {row.karyawan?.namaLengkap?.substring(0, 2)?.toUpperCase() || "NA"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-xs text-gray-800 uppercase leading-none">{row.karyawan?.namaLengkap}</span>
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              <span className="text-[10px] font-medium text-muted-foreground uppercase leading-none">{row.karyawan?.nik}</span>
                              {row.karyawan?.teamKaryawan?.[0]?.team && (
                                <>
                                  <span className="text-gray-300 text-[10px] leading-none">•</span>
                                  <span className="text-[9px] font-bold text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-100 uppercase">
                                    {row.karyawan.teamKaryawan[0].team.namaTeam}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Lokasi Absen */}
                      <TableCell className="font-medium text-[10px] text-gray-600">
                        {row.karyawan?.attendanceLocation?.name || "Global"}
                      </TableCell>

                      {/* Tanggal */}
                      <TableCell className="font-medium text-gray-600 text-xs whitespace-nowrap">
                        {(() => {
                          const [y, m, d] = getJakartaDateString(row.tanggal).split('-');
                          return format(new Date(Number(y), Number(m) - 1, Number(d)), "dd MMM yyyy", { locale: id });
                        })()}
                      </TableCell>

                      {/* Jam Masuk */}
                      <TableCell>
                        <span className="font-bold text-cyan-600 text-xs whitespace-nowrap">
                          {row.jamMasuk ? formatJakarta(row.jamMasuk, true) : "--:--"}
                        </span>
                      </TableCell>

                      {/* Jam Keluar */}
                      <TableCell>
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span className={`font-bold text-xs ${suspicious && !validated ? "text-red-600" : "text-blue-600"}`}>
                            {row.jamKeluar ? formatJakarta(row.jamKeluar, true) : "--:--"}
                          </span>
                          {suspicious && !validated && <AlertTriangle className="h-3 w-3 text-red-500" />}
                          {validated && row.jamKeluarDisetujui && row.jamKeluarDisetujui !== row.jamKeluar && (
                            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5" title="Disetujui">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              {formatJakarta(row.jamKeluarDisetujui, true)}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Deteksi Kantor (first_seen_at) */}
                      <TableCell>
                        {row.first_seen_at ? (
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <span className="font-bold text-xs text-amber-700">{formatJakarta(row.first_seen_at, true)}</span>
                            {(() => {
                              const discStr = getDiscrepancyInfo(row.jamKeluar, row.first_seen_at);
                              if (discStr) {
                                return (
                                  <span className="text-[9px] text-red-600 font-bold bg-red-50 px-1 py-0.5 rounded border border-red-100">
                                    Selisih: {discStr}
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </TableCell>

                      {/* Durasi */}
                      <TableCell className="font-bold text-gray-700 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{calculateDuration(row.jamMasuk, row.jamKeluar)}</span>
                          {validated && row.jamKeluarDisetujui && row.jamKeluarDisetujui !== row.jamKeluar && (
                            <span className="text-[10px] text-emerald-600 font-semibold" title="Durasi Disetujui">
                              (✓ {calculateDuration(row.jamMasuk, row.jamKeluarDisetujui)})
                            </span>
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
                      <TableCell>
                        <div className="flex flex-row gap-1.5 items-center whitespace-nowrap">
                          {getStatusBadge(row.status)}
                          {row.isMissing && (
                            <div title="Wajib Absen tapi tidak ada data" className="flex items-center gap-1 text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 shadow-sm animate-pulse">
                              <AlertTriangle className="h-3 w-3" />
                              <span className="text-[9px] font-bold tracking-tight">TIDAK ABSEN</span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Keterangan */}
                      <TableCell>
                        <span 
                          className="text-xs text-gray-600 max-w-[120px] truncate block" 
                          title={row.keterangan || "-"}
                        >
                          {row.keterangan || "-"}
                        </span>
                      </TableCell>

                      {/* Validasi column */}
                      <TableCell>
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          {/* GPS & device */}
                          {row.latMasuk && (
                            <span title="GPS Valid">
                              <MapPin className="h-3 w-3 text-emerald-500" />
                            </span>
                          )}
                          {row.deviceMasuk && (
                            <span title={`Masuk: ${row.deviceMasuk}`}>
                              {row.deviceMasuk.includes("Fingerprint") ? (
                                <Fingerprint className="h-3 w-3 text-indigo-500" />
                              ) : (
                                <Smartphone className="h-3 w-3 text-blue-500" />
                              )}
                            </span>
                          )}
                          {row.deviceKeluar && row.deviceKeluar !== row.deviceMasuk && (
                            <span title={`Keluar: ${row.deviceKeluar}`}>
                              {row.deviceKeluar.includes("Fingerprint") ? (
                                <Fingerprint className="h-3 w-3 text-indigo-500" />
                              ) : (
                                <Smartphone className="h-3 w-3 text-blue-500" />
                              )}
                            </span>
                          )}
                          {(row.isMockedMasuk || row.isMockedKeluar) && (
                            <span title="Mock GPS!">
                              <AlertTriangle className="h-3 w-3 text-rose-500 animate-pulse" />
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
                          {(user?.role === "admin" || user?.role === "super") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all h-7 px-2"
                              onClick={() => handleDelete(row.id)}
                              disabled={isDeleting === row.id}
                            >
                              {isDeleting === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </Button>
                          )}
                          {row.isMissing && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-amber-600 hover:bg-amber-50 rounded-lg transition-all h-7 px-2 text-[10px] uppercase font-bold"
                              onClick={() => setManualRecord(row)}
                            >
                              Input Manual
                            </Button>
                          )}
                          {!row.isMissing && (row.jamKeluar || row.jamKeluarDisetujui || !row.isValidated) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`rounded-lg transition-all h-7 px-2 text-[10px] uppercase font-bold ${
                                suspicious && !validated
                                  ? "text-red-600 hover:bg-red-50 hover:text-red-700"
                                  : validated
                                  ? "text-emerald-600 hover:bg-emerald-50"
                                  : "text-blue-600 hover:bg-blue-50"
                              }`}
                              onClick={() => setValidateRecord(row)}
                            >
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              {validated ? "Re-Validasi" : (row.jamKeluar ? "Validasi" : "Manual Out")}
                            </Button>
                          )}
                          {!row.isMissing && (user?.role === "admin" || user?.role === "super") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-all h-7 px-2"
                              onClick={() => setEditRecord(row)}
                            >
                              Edit
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-cyan-500 hover:text-white rounded-lg transition-all h-7 px-2"
                            onClick={() => onViewDetail(row)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                };

                const groupedDataByDate: Record<string, any[]> = {};
                data.forEach((row) => {
                  const dateKey = getJakartaDateString(row.tanggal);
                  if (!groupedDataByDate[dateKey]) groupedDataByDate[dateKey] = [];
                  groupedDataByDate[dateKey].push(row);
                });

                const sortedDates = Object.keys(groupedDataByDate).sort((a, b) => b.localeCompare(a));

                return sortedDates.map((dateKey) => {
                  const rowsForDate = groupedDataByDate[dateKey];
                  
                  return (
                    <Fragment key={dateKey}>
                      <TableRow className="bg-slate-200 hover:bg-slate-300 transition-colors shadow-sm">
                        <TableCell colSpan={12} className="py-2 border-l-4 border-cyan-500">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full bg-cyan-600 shadow-sm" />
                            <span className="font-black text-[12px] uppercase tracking-widest text-slate-800">
                              {(() => {
                                const [y, m, d] = dateKey.split('-');
                                return format(new Date(Number(y), Number(m) - 1, Number(d)), "EEEE, dd MMMM yyyy", { locale: id });
                              })()}
                            </span>
                            <Badge variant="outline" className="ml-auto text-[10px] font-bold border-slate-300 text-slate-600 bg-white">
                              {rowsForDate.length} ABSENSI
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {!groupByTeam ? (
                        rowsForDate.map(row => renderRow(row))
                      ) : (
                        (() => {
                          const groupedByTeam: Record<string, any[]> = {};
                          rowsForDate.forEach((row) => {
                            const teams = row.karyawan?.teamKaryawan;
                            let teamName = "Tanpa Team";
                            if (teams && teams.length > 0 && teams[0].team) {
                              teamName = teams[0].team.namaTeam || "Unknown Team";
                            }
                            if (!groupedByTeam[teamName]) groupedByTeam[teamName] = [];
                            groupedByTeam[teamName].push(row);
                          });

                          const sortedTeams = Object.keys(groupedByTeam).sort((a, b) => {
                            if (a === "Tanpa Team") return 1;
                            if (b === "Tanpa Team") return -1;
                            return a.localeCompare(b);
                          });

                          return sortedTeams.map(teamName => (
                            <Fragment key={`${dateKey}-${teamName}`}>
                              <TableRow className="border-none hover:bg-transparent">
                                <TableCell colSpan={12} className="py-1.5 pl-6 pr-2">
                                  <div className="flex items-center gap-2 py-2 px-4 bg-indigo-50/80 border-l-2 border-indigo-400 rounded-r-lg shadow-sm">
                                    <CornerDownRight className="h-3.5 w-3.5 text-indigo-500" />
                                    <span className="font-bold text-[10px] uppercase tracking-wider text-indigo-700">
                                      TEAM: {teamName}
                                    </span>
                                    <Badge variant="outline" className="ml-auto text-[8px] font-bold border-indigo-200 text-indigo-600 bg-white">
                                      {groupedByTeam[teamName].length}
                                    </Badge>
                                  </div>
                                </TableCell>
                              </TableRow>
                              {groupedByTeam[teamName].map(row => renderRow(row, true))}
                            </Fragment>
                          ));
                        })()
                      )}
                    </Fragment>
                  );
                });
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

      {/* Manual Input Dialog */}
      {manualRecord && (
        <ManualAttendanceDialog
          record={manualRecord}
          open={!!manualRecord}
          onClose={() => setManualRecord(null)}
          onSuccess={() => {
            setManualRecord(null);
            onRefresh?.();
          }}
        />
      )}

      {/* Edit Dialog */}
      {editRecord && (
        <EditAttendanceDialog
          record={editRecord}
          open={!!editRecord}
          onClose={() => setEditRecord(null)}
          onSuccess={() => {
            setEditRecord(null);
            onRefresh?.();
          }}
        />
      )}
    </>
  );
}
