"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { UserLayout } from "@/components/admin-panel/user-layout";

const scanAnimation = `
@keyframes scan {
  0% { top: 0; }
  50% { top: 100%; }
  100% { top: 0; }
}
`;

import { useSession } from "@/components/clientSessionProvider";
import { 
    Camera, 
    MapPin, 
    Clock, 
    CheckCircle2, 
    AlertTriangle, 
    RefreshCcw, 
    ShieldCheck, 
    ShieldAlert,
    UserCheck,
    Loader2,
    LogOut,
    LogIn
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function AttendancePage() {
    const { user } = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState<any>(null);
    const [location, setLocation] = useState<{lat: number, lon: number} | null>(null);
    const [isNearLocation, setIsNearLocation] = useState<boolean | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [isMocked, setIsMocked] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isCapturingRef = useRef(false);
    const detectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const faceapiRef = useRef<any>(null);
    const consecutiveRef = useRef(0);

    // Load face-api.js models on mount
    useEffect(() => {
        const loadModels = async () => {
            try {
                const faceapi = await import("face-api.js");
                await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
                faceapiRef.current = faceapi;
                setModelsLoaded(true);
                console.log("✅ Face detection models loaded");
            } catch (err) {
                console.error("❌ Failed to load face models:", err);
                toast.error("Gagal memuat model deteksi wajah");
            }
        };
        loadModels();
    }, []);

    // Fetch status absen hari ini
    const fetchStatus = async () => {
        if (!user?.id) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/absensi/today-status/${user.id}`, {
                cache: 'no-store'
            });
            const data = await res.json();
            setStatus(data);
        } catch (error) {
            console.error("Error fetching status:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchStatus();
        }
    }, [user?.id]);

    // Handle Geolocation
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

                if (status?.location) {
                    const dist = calculateDistance(
                        latitude,
                        longitude,
                        status.location.latitude,
                        status.location.longitude
                    );
                    setDistance(Math.round(dist));
                    setIsNearLocation(dist <= status.location.radius);
                }
            },
            (err) => {
                console.error("Location error:", err);
                setLocationError("Gagal mendapatkan lokasi. Pastikan GPS aktif dan izin diberikan.");
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [status?.location]);

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3;
        const p1 = (lat1 * Math.PI) / 180;
        const p2 = (lat2 * Math.PI) / 180;
        const dp = ((lat2 - lat1) * Math.PI) / 180;
        const dl = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const capturePhoto = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
                setCapturedImage(dataUrl);
                stopCamera();
                toast.success("Wajah Berhasil Terverifikasi!", {
                    description: "Data identitas telah dikunci.",
                    icon: <ShieldCheck className="text-emerald-500" />,
                });
            }
        }
    }, []);

    const startDetection = useCallback(() => {
        if (!faceapiRef.current || !videoRef.current) {
            console.warn("Face API or video not ready");
            return;
        }
        const faceapi = faceapiRef.current;
        consecutiveRef.current = 0;

        const detect = async () => {
            if (!videoRef.current || isCapturingRef.current) return;
            try {
                const detections = await faceapi.detectAllFaces(
                    videoRef.current,
                    new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
                );
                
                if (detections.length > 0) {
                    consecutiveRef.current++;
                    setFaceDetected(true);
                    
                    // Show stabilizing message after 3 frames (~0.6s at 200ms interval)
                    if (consecutiveRef.current === 3) {
                        toast.loading("Wajah Terdeteksi! Menstabilkan...", { id: "face-scan" });
                    }
                    
                    // Capture after 10 consecutive frames (~2s total)
                    if (consecutiveRef.current >= 10) {
                        isCapturingRef.current = true;
                        toast.dismiss("face-scan");
                        capturePhoto();
                        return; // Stop detection loop after capture
                    }
                } else {
                    // Reset if face is lost
                    if (consecutiveRef.current >= 3) {
                        toast.error("Verifikasi Gagal: Wajah keluar dari frame", { 
                            id: "face-scan",
                            description: "Silakan posisikan wajah Anda kembali di tengah frame.",
                            duration: 3000 
                        });
                    }
                    consecutiveRef.current = 0;
                    setFaceDetected(false);
                }
            } catch (e) {
                // ignore transient detection errors
            }
            
            // Continue detection if not captured
            if (!isCapturingRef.current) {
                detectionTimerRef.current = setTimeout(detect, 200);
            }
        };
        detect();
    }, [capturePhoto]);

    const startCamera = async () => {
        if (!modelsLoaded) {
            toast.error("Model deteksi wajah belum siap. Tunggu sebentar...");
            return;
        }
        setCapturedImage(null);
        setFaceDetected(false);
        setCameraActive(true);
        setIsScanning(true);
        isCapturingRef.current = false;
        consecutiveRef.current = 0;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } } 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadeddata = () => {
                    startDetection();
                };
            }
        } catch (err) {
            console.error("Camera error:", err);
            toast.error("Gagal mengakses kamera.");
            setCameraActive(false);
        }
    };

    const stopCamera = () => {
        if (detectionTimerRef.current) {
            clearTimeout(detectionTimerRef.current);
            detectionTimerRef.current = null;
        }
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setCameraActive(false);
        setIsScanning(false);
        setFaceDetected(false);
        isCapturingRef.current = false;
    };

    const handleSubmit = async (type: 'in' | 'out') => {
        if (!capturedImage || !location || !user?.id) return;
        
        if (isMocked) {
            toast.error("Terdeteksi penggunaan GPS Palsu! Absensi ditolak.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(capturedImage);
            const blob = await response.blob();
            
            const formData = new FormData();
            formData.append("userId", user.id);
            formData.append("latitude", location.lat.toString());
            formData.append("longitude", location.lon.toString());
            formData.append("isMocked", isMocked.toString());
            formData.append("deviceDetails", navigator.userAgent);
            formData.append("foto", blob, `attendance_${type}.jpg`);

            const endpoint = type === 'in' ? 'submit-clock-in' : 'submit-clock-out';
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/absensi/${endpoint}`, {
                method: 'POST',
                body: formData
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.message || "Gagal melakukan absensi");

            toast.success(result.message);
            setCapturedImage(null);
            fetchStatus();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <UserLayout title="Absensi Digital" role="user">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            </UserLayout>
        );
    }

    return (
        <UserLayout title="Absensi Digital" role="user">
            <style dangerouslySetInnerHTML={{ __html: scanAnimation }} />
            <div className="max-w-2xl mx-auto space-y-4 px-2 pb-10 md:px-0">
                
                {/* Model Loading Banner */}
                {!modelsLoaded && (
                    <div className="p-3 bg-amber-50/80 backdrop-blur-sm border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-700 animate-pulse">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-xs font-semibold">Inisialisasi sistem deteksi wajah...</span>
                    </div>
                )}

                {/* --- Status Card Grid (Compact for Mobile) --- */}
                <div className="grid grid-cols-3 gap-2">
                    <Card className="bg-gradient-to-br from-indigo-600 to-blue-600 text-white border-none shadow-md overflow-hidden relative p-3">
                        <div className="relative z-10">
                            <p className="text-[10px] font-bold opacity-80 uppercase tracking-tighter">Masuk</p>
                            <div className="text-lg font-black mt-0.5">
                                {status?.absensi?.jamMasuk ? new Date(status.absensi.jamMasuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                            </div>
                        </div>
                        <Clock className="absolute -right-2 -bottom-2 w-12 h-12 opacity-20 rotate-12" />
                    </Card>

                    <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none shadow-md overflow-hidden relative p-3">
                        <div className="relative z-10">
                            <p className="text-[10px] font-bold opacity-80 uppercase tracking-tighter">Keluar</p>
                            <div className="text-lg font-black mt-0.5">
                                {status?.absensi?.jamKeluar ? new Date(status.absensi.jamKeluar).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                            </div>
                        </div>
                        <LogOut className="absolute -right-2 -bottom-2 w-12 h-12 opacity-20 -rotate-12" />
                    </Card>

                    <Card className={cn(
                        "text-white border-none shadow-md overflow-hidden relative p-3 transition-all duration-700",
                        isNearLocation ? "bg-gradient-to-br from-blue-500 to-cyan-500" : "bg-gradient-to-br from-rose-500 to-orange-500"
                    )}>
                        <div className="relative z-10">
                            <p className="text-[10px] font-bold opacity-80 uppercase tracking-tighter">Lokasi</p>
                            <div className="flex items-center gap-1 mt-0.5">
                                <div className="text-sm font-black truncate leading-tight">
                                    {isNearLocation ? "Ready" : "Luar Area"}
                                </div>
                            </div>
                        </div>
                        <MapPin className="absolute -right-2 -bottom-2 w-12 h-12 opacity-20" />
                    </Card>
                </div>

                <div className="space-y-4">
                    {/* --- Camera Area (Premium Compact Design) --- */}
                    <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-slate-50 relative">
                        <div className="absolute top-4 left-0 right-0 z-20 px-6 flex justify-between items-center">
                            <Badge variant="secondary" className="bg-white/90 backdrop-blur-md text-[10px] font-bold py-1 px-3 rounded-full border-none shadow-sm">
                                {cameraActive ? "🔴 LIVE SCANNING" : "📷 CAMERA IDLE"}
                            </Badge>
                            {distance !== null && (
                                <Badge variant="outline" className={cn(
                                    "backdrop-blur-md text-[10px] font-bold py-1 px-3 rounded-full border-none shadow-sm",
                                    isNearLocation ? "bg-emerald-500/90 text-white" : "bg-rose-500/90 text-white"
                                )}>
                                    {distance}m
                                </Badge>
                            )}
                        </div>

                        <div className="p-3">
                            <div className="relative aspect-[4/5] w-full mx-auto bg-slate-950 rounded-[2rem] overflow-hidden shadow-2xl flex items-center justify-center group">
                                {cameraActive ? (
                                    <>
                                        <video 
                                            ref={videoRef} 
                                            autoPlay 
                                            playsInline 
                                            className="w-full h-full object-cover mirror transform scale-x-[-1]" 
                                        />
                                        
                                        {/* --- Modern Scanning Frame --- */}
                                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                            <div className="w-[85%] h-[75%] border-[1px] border-white/20 rounded-[3rem] relative">
                                                {/* Corner Accents */}
                                                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-2xl"></div>
                                                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-2xl"></div>
                                                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-2xl"></div>
                                                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-2xl"></div>
                                                
                                                <div className="absolute inset-0 bg-blue-500/5 rounded-[3rem]"></div>
                                            </div>
                                        </div>

                                        {/* --- Modern Laser Scanner --- */}
                                        {isScanning && (
                                            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2rem]">
                                                <div className="absolute top-0 left-0 w-full h-[40%] bg-gradient-to-b from-blue-500/20 to-transparent animate-[scan_3s_ease-in-out_infinite] opacity-50"></div>
                                                <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-[scan_3s_ease-in-out_infinite]"></div>
                                            </div>
                                        )}

                                        {/* --- Real-time Feedback UI --- */}
                                        <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center px-6">
                                            {faceDetected ? (
                                                <div className="flex flex-col items-center gap-2 animate-in zoom-in-95 duration-300">
                                                    <div className="px-5 py-2.5 bg-emerald-500/90 backdrop-blur-md text-white text-[11px] font-black tracking-widest rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-400/50">
                                                        <UserCheck size={16} />
                                                        FACE RECOGNIZED
                                                    </div>
                                                    <div className="w-32 h-1 bg-white/20 rounded-full overflow-hidden mt-1">
                                                        <div className="h-full bg-emerald-400 animate-[progress_1.5s_linear]"></div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="px-5 py-2.5 bg-white/10 backdrop-blur-md text-white/90 text-[11px] font-bold tracking-widest rounded-2xl border border-white/20 flex items-center gap-3">
                                                    <div className="relative">
                                                        <RefreshCcw size={14} className="animate-spin text-blue-400" />
                                                        <div className="absolute inset-0 bg-blue-400/20 blur-sm rounded-full animate-pulse"></div>
                                                    </div>
                                                    SCANNING FACE...
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : capturedImage ? (
                                    <>
                                        <Image src={capturedImage} alt="Captured" fill className="object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                                            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.6)] border-4 border-white animate-in zoom-in-50">
                                                <ShieldCheck size={32} className="text-white" />
                                            </div>
                                            <span className="mt-4 text-white text-[10px] font-black tracking-[0.2em] bg-emerald-600/80 backdrop-blur-sm px-4 py-1.5 rounded-full">SECURE ID LOCKED</span>
                                        </div>
                                        <Button 
                                            variant="secondary" 
                                            size="sm" 
                                            onClick={startCamera}
                                            className="absolute bottom-6 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white border border-white/30 text-[10px] font-bold h-9 px-4 rounded-full transition-all active:scale-95"
                                        >
                                            <RefreshCcw size={14} className="mr-2" /> RE-SCAN FACE
                                        </Button>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-6 p-8">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse"></div>
                                            <div className="w-24 h-24 rounded-[2.5rem] bg-slate-900 border-2 border-slate-800 flex items-center justify-center shadow-2xl relative z-10 rotate-3">
                                                <Camera size={44} className="text-blue-500 -rotate-3" />
                                            </div>
                                        </div>
                                        <div className="text-center space-y-2 relative z-10">
                                            <h3 className="text-white font-black text-xl tracking-tight">Siap Absen?</h3>
                                            <p className="text-slate-400 text-xs font-medium max-w-[180px]">Verifikasi wajah diperlukan untuk keamanan data.</p>
                                        </div>
                                        <Button 
                                            onClick={startCamera} 
                                            disabled={!modelsLoaded} 
                                            className="mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-6 rounded-2xl shadow-xl shadow-blue-900/40 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all"
                                        >
                                            {modelsLoaded ? (
                                                <span className="flex items-center gap-2">Mulai Verifikasi <LogIn size={18} /></span>
                                            ) : (
                                                <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Memuat...</span>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                    </Card>

                    {/* --- Action & Verification Area (Unified & Compact) --- */}
                    <div className="px-2 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Area Kerja</p>
                                <p className="text-xs font-black text-slate-800 truncate">{status?.location?.name || "..."}</p>
                            </div>
                            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">GPS Secure</p>
                                    <p className={cn("text-xs font-black", isMocked ? "text-rose-600" : "text-emerald-600")}>
                                        {isMocked ? "Bypass Detected" : "Verified"}
                                    </p>
                                </div>
                                {isMocked ? <ShieldAlert className="text-rose-500" size={16} /> : <ShieldCheck className="text-emerald-500" size={16} />}
                            </div>
                        </div>

                        {!status?.hasClockedIn ? (
                            <Button 
                                onClick={() => handleSubmit('in')}
                                disabled={!capturedImage || !isNearLocation || isSubmitting || isMocked}
                                className="w-full h-16 text-lg font-black bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 rounded-3xl transition-all disabled:opacity-40 disabled:grayscale relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <div className="p-2 bg-white/20 rounded-xl mr-3"><LogIn size={20} /></div>}
                                ABSEN MASUK
                            </Button>
                        ) : !status?.hasClockedOut ? (
                            <Button 
                                onClick={() => handleSubmit('out')}
                                disabled={!capturedImage || !isNearLocation || isSubmitting || isMocked}
                                className="w-full h-16 text-lg font-black bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-100 rounded-3xl transition-all disabled:opacity-40 disabled:grayscale relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <div className="p-2 bg-white/20 rounded-xl mr-3"><LogOut size={20} /></div>}
                                ABSEN PULANG
                            </Button>
                        ) : (
                            <div className="w-full p-6 bg-slate-900 text-white rounded-[2rem] flex flex-col items-center justify-center gap-2 shadow-2xl relative overflow-hidden">
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full"></div>
                                <CheckCircle2 size={32} className="text-emerald-400 animate-bounce" />
                                <div className="text-center">
                                    <p className="text-lg font-black">Tugas Selesai!</p>
                                    <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase">Sampai Jumpa Besok</p>
                                </div>
                            </div>
                        )}
                        
                        {capturedImage && isNearLocation && !isMocked && (
                            <div className="flex items-center justify-center gap-2 py-1">
                                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping"></div>
                                <p className="text-[10px] text-emerald-600 font-black tracking-tight italic">
                                    AUTHENTICATION SUCCESSFUL. READY TO SUBMIT.
                                </p>
                            </div>
                        )}

                        {!isNearLocation && !status?.hasClockedOut && (
                            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3">
                                <AlertTriangle size={18} className="shrink-0" />
                                <p className="text-[10px] font-black leading-tight uppercase">
                                    Luar Jangkauan: Silakan mendekat ke lokasi kantor untuk melanjutkan.
                                </p>
                            </div>
                        )}

                        {/* --- App Info Footer --- */}
                        <div className="pt-4 flex justify-between items-center opacity-40">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black uppercase tracking-tighter">Secure Terminal</span>
                                <span className="text-[8px] font-medium">v4.0.2-prod</span>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                                <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
