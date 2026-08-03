"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { UserLayout } from "@/components/admin-panel/user-layout";
import {
  Camera, MapPin, Clock, CheckCircle2, AlertTriangle, RefreshCcw,
  ShieldCheck, ShieldAlert, UserCheck, Loader2, LogOut, LogIn,
  MapPinned, FileText, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useSession } from "@/components/clientSessionProvider";

const scanAnimation = `
@keyframes scan {
  0% { top: 0; }
  50% { top: 100%; }
  100% { top: 0; }
}
`;

type Jenis = "SURVEY" | "DINAS" | "RAPAT_LUAR" | "KEGIATAN_LAIN";
const JENIS_OPTIONS: { value: Jenis; label: string }[] = [
  { value: "SURVEY", label: "Survey / Tinjauan Lokasi" },
  { value: "DINAS", label: "Dinas / Kunjungan" },
  { value: "RAPAT_LUAR", label: "Rapat di Luar Kantor" },
  { value: "KEGIATAN_LAIN", label: "Kegiatan Lain" },
];
type Mode = "in-face" | "report" | "out-face";

export default function KegiatanPage() {
  const { user } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [active, setActive] = useState<any>(null);
  const [mode, setMode] = useState<Mode>("in-face");
  const [jenis, setJenis] = useState<Jenis>("SURVEY");
  const [keterangan, setKeterangan] = useState("");
  const [history, setHistory] = useState<any[]>([]);

  // GPS
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [isMocked, setIsMocked] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Kamera + face detection
  const [cameraActive, setCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [capturedFace, setCapturedFace] = useState<string | null>(null);
  const [capturedReport, setCapturedReport] = useState<string | null>(null);
  const [captureMode, setCaptureMode] = useState<"face" | "report">("face");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isCapturingRef = useRef(false);
  const detectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const faceapiRef = useRef<any>(null);
  const consecutiveRef = useRef(0);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const faceapi = await import("face-api.js");
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        faceapiRef.current = faceapi;
        setModelsLoaded(true);
      } catch (err) {
        console.error("Failed to load face models:", err);
        toast.error("Gagal memuat model deteksi wajah");
      }
    };
    loadModels();
  }, []);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kegiatan-absensi/my?limit=20`, {
        cache: "no-store",
        credentials: "include",
      });
      const json = await res.json();
      const data = json?.data || [];
      setHistory(data);
      const aktif = data.find((k: any) => k.status === "BERJALAN") || null;
      setActive(aktif);
      setMode(aktif ? "report" : "in-face");
    } catch (error) {
      console.error("Error fetching kegiatan:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { if (user?.id) fetchData(); }, [user?.id, fetchData]);

  // Anti fake gps
  useEffect(() => {
    if (typeof window === "undefined") return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        // @ts-ignore
        const mocked = pos.mocked || (accuracy < 1 && accuracy > 0);
        setIsMocked(!!mocked);
        setLocation({ lat: latitude, lon: longitude });
        setLocationError(null);
      },
      (err) => setLocationError("Gagal mendapatkan lokasi. Pastikan GPS aktif."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // ── Face detection capture (IN/OUT absensi) ──
  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      setCapturedFace(dataUrl);
      stopCamera();
      toast.success("Wajah Terverifikasi!", { description: "Identitas terkunci." });
    }
  }, []);

  const startDetection = useCallback(() => {
    if (!faceapiRef.current || !videoRef.current) return;
    const faceapi = faceapiRef.current;
    consecutiveRef.current = 0;
    const detect = async () => {
      if (!videoRef.current || isCapturingRef.current) return;
      try {
        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.3 })
        );
        if (detections.length > 0) {
          consecutiveRef.current = Math.min(consecutiveRef.current + 2, 6);
          setFaceDetected(true);
          if (consecutiveRef.current >= 6) {
            isCapturingRef.current = true;
            toast.dismiss("face-scan");
            capturePhoto();
            return;
          }
        } else {
          consecutiveRef.current = Math.max(consecutiveRef.current - 1, 0);
          if (consecutiveRef.current === 0) setFaceDetected(false);
        }
      } catch (e) { /* transient */ }
      if (!isCapturingRef.current) {
        detectionTimerRef.current = setTimeout(detect, 250);
      }
    };
    detect();
  }, [capturePhoto]);

  const startFaceCamera = async () => {
    if (!modelsLoaded) { toast.error("Model deteksi wajah belum siap."); return; }
    setCapturedFace(null);
    setCaptureMode("face");
    setCameraActive(true);
    setIsScanning(true);
    isCapturingRef.current = false;
    consecutiveRef.current = 0;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = () => startDetection();
      }
    } catch (err) {
      toast.error("Gagal mengakses kamera.");
      setCameraActive(false);
    }
  };

  // ── Manual capture (foto laporan kegiatan) ──
  const startReportCamera = async () => {
    setCapturedReport(null);
    setCaptureMode("report");
    setCameraActive(true);
    setIsScanning(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 } } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = () => videoRef.current?.play();
      }
    } catch (err) {
      toast.error("Gagal mengakses kamera.");
      setCameraActive(false);
    }
  };

  const captureReportPhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
      setCapturedReport(canvas.toDataURL("image/jpeg", 0.8));
      stopCamera();
      toast.success("Foto kegiatan diambil!");
    }
  };

  const stopCamera = () => {
    if (detectionTimerRef.current) { clearTimeout(detectionTimerRef.current); detectionTimerRef.current = null; }
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsScanning(false);
    setFaceDetected(false);
    isCapturingRef.current = false;
  };

  const dataUrlToBlob = async (dataUrl: string) => (await fetch(dataUrl)).blob();

  // ── Absensi IN (mulai kegiatan) ──
  const handleIn = async () => {
    if (!capturedFace || !location) return;
    if (isMocked) { toast.error("Terdeteksi GPS Palsu! Ditolak."); return; }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("latitude", location.lat.toString());
      formData.append("longitude", location.lon.toString());
      formData.append("isMocked", isMocked.toString());
      formData.append("deviceType", navigator.userAgent);
      formData.append("jenis", jenis);
      if (keterangan) formData.append("keterangan", keterangan);
      formData.append("foto", await dataUrlToBlob(capturedFace), "kegiatan_in.jpg");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kegiatan-absensi/start`, {
        method: "POST", body: formData, credentials: "include",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Gagal absen masuk kegiatan");

      toast.success(result.message);
      setCapturedFace(null);
      setMode("report");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Simpan laporan (foto + keterangan) ──
  const handleSaveReport = async () => {
    if (!active) return;
    if (!capturedReport && !keterangan) { toast.error("Isi foto atau keterangan kegiatan dulu."); return; }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (keterangan) formData.append("keterangan", keterangan);
      if (capturedReport) formData.append("foto", await dataUrlToBlob(capturedReport), "kegiatan_report.jpg");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kegiatan-absensi/${active.id}/detail`, {
        method: "POST", body: formData, credentials: "include",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Gagal menyimpan laporan");
      toast.success(result.message);
      setCapturedReport(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Absensi OUT (selesai kegiatan) ──
  const handleOut = async () => {
    if (!capturedFace || !location || !active) return;
    if (isMocked) { toast.error("Terdeteksi GPS Palsu! Ditolak."); return; }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("latitude", location.lat.toString());
      formData.append("longitude", location.lon.toString());
      formData.append("isMocked", isMocked.toString());
      formData.append("deviceType", navigator.userAgent);
      if (keterangan) formData.append("keterangan", keterangan);
      formData.append("foto", await dataUrlToBlob(capturedFace), "kegiatan_out.jpg");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kegiatan-absensi/${active.id}/end`, {
        method: "POST", body: formData, credentials: "include",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Gagal absen keluar kegiatan");

      toast.success(result.message);
      setCapturedFace(null);
      setKeterangan("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <UserLayout title="Kegiatan Lapangan" role="user">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
        </div>
      </UserLayout>
    );
  }

  const step = (num: number, label: string) => (
    <div className="flex items-center gap-2">
      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black",
        (mode === "in-face" && num === 1) ? "bg-sky-500 text-white" : mode === "report" && num <= 2 ? "bg-emerald-500 text-white" : mode === "out-face" ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500")}>
        {num}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
    </div>
  );

  return (
    <UserLayout title="Kegiatan Lapangan" role="user">
      <style dangerouslySetInnerHTML={{ __html: scanAnimation }} />
      <div className="max-w-2xl mx-auto space-y-4 px-2 pb-10 md:px-0">

        {!modelsLoaded && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-700 animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs font-semibold">Inisialisasi sistem deteksi wajah...</span>
          </div>
        )}

        {/* Info */}
        <div className="p-3.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 rounded-2xl flex items-start gap-2.5">
          <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 mt-0.5 shrink-0" />
          <p className="text-[12px] leading-relaxed text-sky-900 dark:text-sky-100">
            Modul absensi ini untuk kegiatan di luar Absensi Regular, contoh: Survey, Dinas Luar, Rapat Luar, dan lain-lain. Jika kurang jelas, silakan tanyakan ke admin.
          </p>
        </div>

        {/* Status */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="bg-gradient-to-br from-sky-600 to-blue-600 text-white border-none p-3 relative overflow-hidden">
            <p className="text-[10px] font-bold uppercase opacity-80">Absen In</p>
            <p className="text-lg font-black">
              {active?.jamMulai ? new Date(active.jamMulai).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
            </p>
            <LogIn className="absolute -right-2 -bottom-2 w-12 h-12 opacity-20" />
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none p-3 relative overflow-hidden">
            <p className="text-[10px] font-bold uppercase opacity-80">Absen Out</p>
            <p className="text-lg font-black">
              {active?.jamSelesai ? new Date(active.jamSelesai).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
            </p>
            <LogOut className="absolute -right-2 -bottom-2 w-12 h-12 opacity-20" />
          </Card>
          <Card className={cn("text-white border-none p-3 relative overflow-hidden",
            isMocked ? "bg-gradient-to-br from-rose-500 to-red-600" : "bg-gradient-to-br from-violet-500 to-purple-600")}>
            <p className="text-[10px] font-bold uppercase opacity-80">GPS</p>
            <div className="flex items-center gap-1 mt-0.5">
              {isMocked ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              <p className="text-sm font-black">{isMocked ? "Fake" : "Verified"}</p>
            </div>
            <MapPin className="absolute -right-2 -bottom-2 w-12 h-12 opacity-20" />
          </Card>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between px-2">
          {step(1, "Absen In")}
          <div className="flex-1 h-px bg-slate-200 mx-2" />
          {step(2, "Laporan")}
          <div className="flex-1 h-px bg-slate-200 mx-2" />
          {step(3, "Absen Out")}
        </div>

        {/* Camera area */}
        <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-slate-50">
          <div className="p-3">
            <div className="relative aspect-[4/3] w-full mx-auto bg-slate-950 rounded-[2rem] overflow-hidden shadow-lg">
              {cameraActive ? (
                <>
                  <video ref={videoRef} autoPlay playsInline className={cn("w-full h-full object-cover", captureMode === "face" && "mirror transform scale-x-[-1]")} />
                  {captureMode === "face" && isScanning && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-[40%] bg-gradient-to-b from-sky-500/20 to-transparent animate-[scan_3s_ease-in-out_infinite] opacity-50"></div>
                      <div className="absolute top-0 left-0 w-full h-0.5 bg-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.8)] animate-[scan_3s_ease-in-out_infinite]"></div>
                    </div>
                  )}
                  {captureMode === "face" ? (
                    <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center px-6">
                      {faceDetected ? (
                        <div className="px-5 py-2.5 bg-emerald-500/90 text-white text-[11px] font-black rounded-2xl flex items-center gap-2 shadow-xl">
                          <UserCheck size={16} /> WAJAH TERDETEKSI — TAHAN...
                        </div>
                      ) : (
                        <div className="px-5 py-2.5 bg-white/10 text-white/90 text-[11px] font-bold rounded-2xl border border-white/20 flex items-center gap-3">
                          <RefreshCcw size={14} className="animate-spin text-sky-400" /> ARAHKAN WAJAH KE KAMERA
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button type="button" onClick={captureReportPhoto} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-slate-900 font-bold px-6 rounded-full shadow-xl">
                      <Camera className="mr-2 h-4 w-4" /> Ambil Foto
                    </Button>
                  )}
                </>
              ) : capturedFace && mode !== "report" ? (
                <>
                  <Image src={capturedFace} alt="face" fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                      <ShieldCheck size={26} className="text-white" />
                    </div>
                    <span className="mt-2 text-white text-[10px] font-black bg-emerald-600/80 px-4 py-1 rounded-full">IDENTITAS TERKUNCI</span>
                  </div>
                  <Button type="button" variant="secondary" size="sm" onClick={startFaceCamera}
                    className="absolute bottom-3 right-3 bg-white/20 backdrop-blur-md text-white border border-white/30 text-[10px] font-bold rounded-full">
                    <RefreshCcw size={12} className="mr-1" /> Scan Ulang
                  </Button>
                </>
              ) : capturedReport ? (
                <>
                  <Image src={capturedReport} alt="report" fill className="object-cover" />
                  <Button type="button" variant="secondary" size="sm" onClick={startReportCamera}
                    className="absolute bottom-3 right-3 bg-white/20 backdrop-blur-md text-white border border-white/30 text-[10px] font-bold rounded-full">
                    <RefreshCcw size={12} className="mr-1" /> Ulangi
                  </Button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
                  <div className="w-16 h-16 rounded-3xl bg-slate-900 border-2 border-slate-800 flex items-center justify-center">
                    {mode === "report" ? <FileText className="text-emerald-400" size={32} /> : <Camera className="text-sky-400" size={32} />}
                  </div>
                  <p className="text-white font-black text-lg tracking-tight text-center">
                    {mode === "in-face" ? "Absen Masuk Kegiatan" : mode === "out-face" ? "Absen Keluar Kegiatan" : "Foto Laporan Kegiatan"}
                  </p>
                  <Button onClick={mode === "report" ? startReportCamera : startFaceCamera} disabled={!modelsLoaded}
                    className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-8 py-3 rounded-2xl shadow-xl border-b-4 border-sky-800">
                    {modelsLoaded ? (mode === "report" ? "Mulai Foto Laporan" : "Mulai Verifikasi Wajah") : "Memuat..."}
                  </Button>
                </div>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Form & action */}
          <div className="px-3 pb-4 space-y-3">
            {(mode === "in-face" || mode === "report") && (
              <div className="grid grid-cols-1 gap-2">
                {mode === "in-face" && (
                  <select value={jenis} onChange={(e) => setJenis(e.target.value as Jenis)}
                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900">
                    {JENIS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                )}
                <textarea value={keterangan} onChange={(e) => setKeterangan(e.target.value)}
                  placeholder={mode === "report" ? "Tulis hasil survey / laporan kegiatan..." : "Keterangan awal kegiatan (opsional)..."}
                  rows={2} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900" />
              </div>
            )}

            {mode === "in-face" && (
              <Button onClick={handleIn} disabled={!capturedFace || !location || isMocked || isSubmitting}
                className="w-full h-14 text-base font-black bg-sky-600 hover:bg-sky-700 rounded-3xl disabled:opacity-40">
                {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <LogIn className="mr-2" />}
                ABSEN MASUK & MULAI KEGIATAN
              </Button>
            )}

            {mode === "report" && (
              <>
                {active?.fotoKegiatan && (
                  <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold">
                    <CheckCircle2 className="h-4 w-4" /> Laporan sudah tersimpan
                  </div>
                )}
                <Button onClick={handleSaveReport} disabled={(!capturedReport && !keterangan) || isSubmitting}
                  variant="outline" className="w-full h-12 font-bold rounded-2xl border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                  {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                  SIMPAN LAPORAN KEGIATAN
                </Button>
                <Button onClick={() => { setMode("out-face"); setCapturedFace(null); }} disabled={isSubmitting}
                  className="w-full h-14 text-base font-black bg-emerald-600 hover:bg-emerald-700 rounded-3xl">
                  <LogOut className="mr-2" /> SELESAI KEGIATAN & ABSEN KELUAR
                </Button>
              </>
            )}

            {mode === "out-face" && (
              <>
                <Button onClick={startFaceCamera} variant="secondary" className="w-full h-12 font-bold rounded-2xl">
                  <Camera className="mr-2 h-4 w-4" /> Verifikasi Wajah
                </Button>
                <Button onClick={handleOut} disabled={!capturedFace || !location || isMocked || isSubmitting}
                  className="w-full h-14 text-base font-black bg-emerald-600 hover:bg-emerald-700 rounded-3xl disabled:opacity-40">
                  {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <LogOut className="mr-2" />}
                  ABSEN KELUAR & CLOSING KEGIATAN
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setMode("report")} className="w-full text-[10px] font-bold uppercase text-slate-400">
                  Kembali ke Laporan
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* Riwayat */}
        {history.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1 flex items-center gap-1">
              <MapPinned className="h-3 w-3" /> Riwayat Kegiatan
            </p>
            {history.slice(0, 10).map((k) => (
              <div key={k.id} className="bg-white rounded-2xl border border-slate-100 p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-black truncate text-slate-900">{k.jenis}</p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(k.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })} •{" "}
                    {k.jamMulai ? new Date(k.jamMulai).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : ""} —{" "}
                    {k.jamSelesai ? new Date(k.jamSelesai).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "berjalan"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {k.fotoKegiatan && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  <Badge variant={k.status === "SELESAI" ? "secondary" : "default"} className="text-[10px]">
                    {k.status === "SELESAI" ? `${k.durasiJam} jam` : "Berjalan"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
}