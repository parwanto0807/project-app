"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Smartphone, AlertCircle, Camera, User } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface DetailProps {
  record: any;
  isOpen: boolean;
  onClose: () => void;
}

export function AttendanceDetailDialog({ record, isOpen, onClose }: DetailProps) {
  if (!record) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-white/95 backdrop-blur-xl border-none shadow-2xl rounded-3xl overflow-hidden p-0">
        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-6 text-white">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                  <User size={28} />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black">{record.karyawan?.namaLengkap}</DialogTitle>
                  <p className="text-white/80 font-bold uppercase tracking-widest text-[10px]">{record.karyawan?.nik} • {record.karyawan?.jabatan}</p>
                </div>
              </div>
              <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/40 px-4 py-1.5 rounded-full font-black text-xs uppercase">
                {record.status}
              </Badge>
            </div>
          </DialogHeader>
        </div>

        <div className="p-8 grid md:grid-cols-2 gap-8">
          {/* Left Column: Clock In */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Clock className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="font-black text-gray-800 uppercase tracking-wider text-sm">Clock In Details</h3>
            </div>

            <div className="grid gap-6">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-inner group">
                {record.fotoMasuk ? (
                  <img 
                    src={`${process.env.NEXT_PUBLIC_API_URL}${record.fotoMasuk}`} 
                    alt="Clock In" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                    <Camera size={40} className="opacity-20" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">No Photo Available</span>
                  </div>
                )}
                <div className="absolute bottom-4 left-4">
                   <Badge className="bg-black/50 backdrop-blur-md text-white border-none font-black text-[10px]">
                     {record.jamMasuk ? format(new Date(record.jamMasuk), "HH:mm:ss") : "--:--:--"}
                   </Badge>
                </div>
              </div>

              <div className="space-y-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Coordinates</span>
                   <span className="text-xs font-black text-gray-700">{record.latMasuk}, {record.longMasuk}</span>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Device</span>
                   <span className="text-xs font-black text-gray-700 flex items-center gap-1.5">
                     <Smartphone size={14} className="text-blue-500" />
                     {record.deviceMasuk || "Unknown"}
                   </span>
                </div>
                {record.isMockedMasuk && (
                  <div className="flex items-center gap-2 p-2 bg-rose-50 rounded-lg text-rose-600 border border-rose-100">
                    <AlertCircle size={14} />
                    <span className="text-[10px] font-black uppercase">Fake GPS Detected</span>
                  </div>
                )}
                {record.latMasuk && record.longMasuk && (
                  <a 
                    href={`https://www.google.com/maps?q=${record.latMasuk},${record.longMasuk}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full mt-2 p-2 bg-white hover:bg-cyan-500 hover:text-white text-cyan-600 border border-cyan-100 rounded-xl transition-all shadow-sm font-bold text-xs uppercase"
                  >
                    <MapPin size={14} />
                    View on Google Maps
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Clock Out */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-black text-gray-800 uppercase tracking-wider text-sm">Clock Out Details</h3>
            </div>

            <div className="grid gap-6">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-inner group">
                {record.fotoKeluar ? (
                  <img 
                    src={`${process.env.NEXT_PUBLIC_API_URL}${record.fotoKeluar}`} 
                    alt="Clock Out" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                    <Camera size={40} className="opacity-20" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">No Photo Available</span>
                  </div>
                )}
                <div className="absolute bottom-4 left-4">
                   <Badge className="bg-black/50 backdrop-blur-md text-white border-none font-black text-[10px]">
                     {record.jamKeluar ? format(new Date(record.jamKeluar), "HH:mm:ss") : "--:--:--"}
                   </Badge>
                </div>
              </div>

              <div className="space-y-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Coordinates</span>
                   <span className="text-xs font-black text-gray-700">{record.latKeluar || "--"}, {record.longKeluar || "--"}</span>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Device</span>
                   <span className="text-xs font-black text-gray-700 flex items-center gap-1.5">
                     <Smartphone size={14} className="text-blue-500" />
                     {record.deviceKeluar || "Unknown"}
                   </span>
                </div>
                {record.isMockedKeluar && (
                  <div className="flex items-center gap-2 p-2 bg-rose-50 rounded-lg text-rose-600 border border-rose-100">
                    <AlertCircle size={14} />
                    <span className="text-[10px] font-black uppercase">Fake GPS Detected</span>
                  </div>
                )}
                {record.latKeluar && record.longKeluar && (
                  <a 
                    href={`https://www.google.com/maps?q=${record.latKeluar},${record.longKeluar}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full mt-2 p-2 bg-white hover:bg-blue-500 hover:text-white text-blue-600 border border-blue-100 rounded-xl transition-all shadow-sm font-bold text-xs uppercase"
                  >
                    <MapPin size={14} />
                    View on Google Maps
                  </a>
                )}
              </div>
                {record.first_seen_at && (
                  <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-100 space-y-2">
                    <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      Deteksi Kehadiran Kantor ("Mata-mata")
                    </div>
                    <div className="space-y-1.5 text-xs text-amber-900 font-medium">
                      <div className="flex justify-between">
                        <span className="text-amber-700">Jam Keluar (Klik Manual):</span>
                        <span className="font-bold">{record.jamKeluar ? format(new Date(record.jamKeluar), "HH:mm:ss") : "--:--:--"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-amber-700">Terdeteksi Sampai Kantor:</span>
                        <span className="font-bold">{format(new Date(record.first_seen_at), "HH:mm:ss")}</span>
                      </div>
                      {(() => {
                        const outTime = new Date(record.jamKeluar).getTime();
                        const seenTime = new Date(record.first_seen_at).getTime();
                        const diffMs = outTime - seenTime;
                        if (diffMs > 15 * 60 * 1000) {
                          const h = Math.floor(diffMs / 3600000);
                          const m = Math.floor((diffMs % 3600000) / 60000);
                          const durationStr = h > 0 ? `${h} Jam ${m} Menit` : `${m} Menit`;
                          return (
                            <div className="flex justify-between text-rose-600 font-bold pt-1.5 border-t border-amber-200/50 mt-1.5 items-center">
                              <span>Selisih Mengulur Waktu:</span>
                              <span className="bg-rose-50 px-2 py-0.5 rounded border border-rose-100 text-[10px] animate-pulse">
                                {durationStr} (Indikasi Mengulur Waktu)
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>

        <div className="px-8 pb-8">
           <div className="bg-cyan-50 p-4 rounded-2xl border border-cyan-100">
              <h4 className="text-[10px] font-black text-cyan-700 uppercase tracking-widest mb-1">Remarks / Notes</h4>
              <p className="text-sm text-cyan-800 font-medium">{record.keterangan || "No additional remarks provided."}</p>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
