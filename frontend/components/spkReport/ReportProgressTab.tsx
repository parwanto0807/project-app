"use client";
// import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Camera, CheckCircle, X, Sparkles, FileText, ClipboardList, MessageSquare, Target, Send, ArrowLeft, AlertTriangle, AlertCircle, ImageIcon, TrendingUp, Clock, ZoomIn } from 'lucide-react';
import Image from 'next/image';
import { createReportFormData, createSpkFieldReport } from '@/lib/action/master/spk/spkReport';
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { SPKDataApi } from './tableData';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../ui/dialog';
import { AlertDialogHeader } from '../ui/alert-dialog';
import { getImageUrl } from '@/lib/getImageUrl';

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

// interface SPKDataApi {
//   id: string;
//   // ... (sama seperti di file utama)
// }

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

interface ReportProgressTabProps {
    selectedSpk: SPKData | null;
    formData: ProgressFormData;
    setFormData: (data: ProgressFormData | ((prev: ProgressFormData) => ProgressFormData)) => void;
    uploading: boolean;
    setUploading: (uploading: boolean) => void;
    setActiveTab: (tab: 'list' | 'report' | 'history') => void;
    reports: ReportHistory[];
    userEmail: string;
    userId: string;
    dataSpk: SPKDataApi[];
    fetchReports: () => void;
}

// Helper untuk resize image
// Helper untuk resize image
// Helper untuk resize image
async function resizeImage(
    file: File,
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.75   // 0.75 JPEG kualitasnya sudah sangat setara dengan 0.80 WebP
): Promise<File> {
    return new Promise((resolve, reject) => {
        const img = document.createElement("img")
        const reader = new FileReader()

        reader.onload = (e) => {
            img.src = e.target?.result as string
        }

        img.onload = () => {
            const canvas = document.createElement("canvas")
            let { width, height } = img

            // ... (Logika perhitungan width/height Biarkan Saja, Tidak Berubah) ...
            if (width > maxWidth || height > maxHeight) {
                const aspect = width / height
                if (width > height) {
                    width = maxWidth
                    height = Math.round(maxWidth / aspect)
                } else {
                    height = maxHeight
                    width = Math.round(maxHeight * aspect)
                }
            }

            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext("2d")

            if (ctx) {
                // Background Putih (PENTING untuk JPEG)
                // Karena JPEG tidak support transparan, kita harus kasih background putih
                // agar bagian kosong tidak jadi hitam otomatis.
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0, 0, width, height);

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'medium';
                ctx.drawImage(img, 0, 0, width, height)
            }

            // --- BAGIAN PERUBAHAN ---
            canvas.toBlob(
                (blob) => {
                    if (!blob) return reject(new Error("Resize gagal"))

                    // 1. Ubah ekstensi nama file jadi .jpg
                    const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpg"

                    // 2. Ubah mimeType jadi 'image/jpeg'
                    resolve(new File([blob], newName, { type: "image/jpeg" }))
                },
                "image/jpeg", // <--- Ganti 'image/webp' jadi ini
                quality
            )
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

const ReportProgressTab = ({
    selectedSpk,
    formData,
    setFormData,
    uploading,
    setUploading,
    setActiveTab,
    reports,
    userEmail,
    userId,
    dataSpk,
    fetchReports
}: ReportProgressTabProps) => {
    // Hapus foto berdasarkan index
    const removePhoto = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            photos: prev.photos.filter((_, i) => i !== index),
        }))
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const { files } = e.target;
        if (!files || files.length === 0) return;

        // Set uploading state agar UI tidak freeze jika memproses banyak foto
        setUploading(true);

        const currentCategory = formData.photoCategory;
        const processedPhotos: PhotoWithCategory[] = [];

        try {
            for (const [index, file] of Array.from(files).entries()) {
                if (!file.type.startsWith("image/")) continue;

                let processedFile = file;

                // Selalu lakukan resize tanpa cek ukuran file asli
                // Ini menjamin semua output adalah WebP, 800px, dan size kecil
                try {
                    const resized = await resizeImage(file);
                    processedFile = resized;
                } catch (err) {
                    console.error("Gagal resize, menggunakan file asli:", err);
                    // Fallback ke file asli jika resize gagal (jarang terjadi)
                }

                // Penamaan file (dilakukan setelah resize agar ekstensi .webp konsisten)
                const extension = processedFile.name.split('.').pop() || 'jpg';
                const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, ""); // Pakai nama asli file input
                const newFileName = `${currentCategory}-${nameWithoutExtension || `Foto${formData.photos.length + index + 1}`}.${extension}`;

                // Re-create file object dengan nama baru yang benar
                processedFile = new File([processedFile], newFileName, {
                    type: processedFile.type,
                    lastModified: new Date().getTime()
                });

                processedPhotos.push({
                    file: processedFile,
                    category: currentCategory
                });
            }

            setFormData((prev) => ({
                ...prev,
                photos: [...prev.photos, ...processedPhotos],
            }));
        } finally {
            setUploading(false); // Kembalikan state uploading
            e.target.value = "";
        }
    };

    const handleChangeItem = (itemId: string | null) => {
        if (!itemId) {
            setFormData({
                ...formData,
                items: null,
                progress: 0,
                minProgress: 0,
                previousProgress: 0,
                type: 'PROGRESS'
            });
            return;
        }

        // Cari laporan terbaru untuk item yang dipilih
        const latestReport = reports
            ?.filter(report => String(report.soDetailId) === String(itemId))
            ?.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())[0];

        const previousProgress = latestReport?.progress ?? 0;

        setFormData({
            ...formData,
            items: itemId,
            progress: previousProgress, // Set progress ke nilai terakhir
            minProgress: previousProgress, // Set minProgress ke progress terakhir
            previousProgress: previousProgress, // Simpan progress terakhir
            type: previousProgress === 100 ? 'FINAL' : 'PROGRESS'
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (uploading) return;
        setUploading(true);

        try {
            // Validasi dasar
            if (!formData.note) {
                toast.error("Catatan harus diisi", { description: "Silakan isi catatan progress sebelum mengirim laporan." });
                setUploading(false);
                return;
            }

            if (!selectedSpk) {
                toast.error("SPK tidak ditemukan", { description: "Silakan pilih SPK terlebih dahulu." });
                setUploading(false);
                return;
            }

            const isValidItem = selectedSpk.items.some(item => item.id === formData.items);
            if (!formData.items || !isValidItem) {
                toast.error("Item yang dipilih tidak valid untuk SPK ini", { description: "Silakan pilih item dari daftar yang tersedia." });
                setUploading(false);
                return;
            }

            if (formData.progress === (formData.previousProgress ?? 0)) {
                toast.error("Progress belum berubah", {
                    description: "Mohon ubah progress sebelum mengirim laporan."
                });
                setUploading(false);
                return;
            }

            if (formData.type === 'PROGRESS' && formData.progress <= 0) {
                toast.error("Progress harus diisi", { description: "Silakan atur progress menggunakan slider sebelum mengirim laporan." });
                setUploading(false);
                return;
            }

            if (formData.photos.length > 10) {
                toast.error("Terlalu banyak foto", { description: "Maksimal 10 foto yang dapat diupload." });
                setUploading(false);
                return;
            }

            const originalSpkData = dataSpk.find(spk => spk.id === selectedSpk.id);

            if (!originalSpkData) {
                toast.error("Data SPK tidak valid", { description: "Tidak dapat menemukan data SPK asli." });
                setUploading(false);
                return;
            }

            const isUserInDetails = originalSpkData.details?.some(detail =>
                detail.karyawan?.email === userEmail
            );

            if (!isUserInDetails) {
                toast.error("Akses Ditolak", {
                    description: "Anda tidak memiliki akses untuk melaporkan progress SPK ini. Email Anda tidak terdaftar sebagai karyawan yang ditugaskan."
                });
                setUploading(false);
                return;
            }

            // console.log('Files to be submitted:',
            //     formData.photos.map(photo => ({
            //         name: photo.file.name,
            //         category: photo.category,
            //         size: photo.file.size
            //     }))
            // );

            const reportData = createReportFormData({
                spkId: selectedSpk.id,
                karyawanId: userId,
                type: formData.type,
                progress: formData.progress,
                note: formData.note,
                photos: formData.photos.map(photo => photo.file),
                soDetailId: formData.items,
            });

            await createSpkFieldReport(reportData);

            toast.success("Laporan berhasil dikirim", {
                description: "Progress telah berhasil dicatat dan dilaporkan.",
            });

            // Reset form
            setFormData(prev => ({
                ...prev,
                spkId: '',
                note: '',
                progress: 0,
                minProgress: 0,
                type: 'PROGRESS',
                photos: [],
                items: null,
                photoCategory: 'SEBELUM'
            }));

            setActiveTab('list');
            fetchReports();

        } catch (error) {
            console.error('❌ Gagal mengirim laporan:', error);
            if (error instanceof Error) {
                toast.error("Gagal mengirim laporan", { description: error.message || "Terjadi kesalahan saat mengirim laporan progress." });
            } else {
                toast.error("Gagal mengirim laporan", { description: "Terjadi kesalahan tak terduga." });
            }
        } finally {
            setUploading(false);
        }
    };

    if (!selectedSpk) return null;

    return (
        <Card className="border-border/40 bg-card/90 backdrop-blur-sm shadow-lg rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl">
            <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/20 border-b border-border/40">
                <CardTitle className="text-lg font-bold flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                        <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex flex-col">
                        <span>Laporkan Progress</span>
                        <CardDescription className="text-sm font-semibold mt-1">
                            {selectedSpk.spkNumber} - {selectedSpk.clientName}
                        </CardDescription>
                    </div>
                </CardTitle>
            </CardHeader>

            <CardContent className="pt-0">
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Kolom Kiri - Input Data */}
                        <div className="space-y-5">
                            {/* Item Pekerjaan */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                    Item Pekerjaan
                                </Label>
                                <Select
                                    value={formData.items || ""}
                                    onValueChange={(value) => handleChangeItem(value || null)}
                                    disabled={!selectedSpk}
                                >
                                    <SelectTrigger className="h-11 text-sm border-2 border-purple-600 dark:border-purple-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:focus:ring-purple-400 dark:focus:border-purple-400 transition-colors">
                                        <SelectValue placeholder="Pilih item pekerjaan..." />
                                    </SelectTrigger>
                                    <div className="max-w-full overflow-x-auto">
                                        <SelectContent className="min-w-max text-sm border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg">
                                            {selectedSpk?.items.map((item) => {
                                                const relatedReports = reports
                                                    ?.filter((r) => String(r.soDetailId) === String(item.id))
                                                    .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());

                                                const latestReport = relatedReports?.[0];
                                                const previousProgress = latestReport?.progress ?? item.progress ?? 0;

                                                let icon = "📈";
                                                if (previousProgress === 100) icon = "💹";
                                                else if (previousProgress < 30) icon = "📉";

                                                return (
                                                    <SelectItem
                                                        key={item.id}
                                                        value={String(item.id)}
                                                        className="text-sm focus:bg-blue-100 dark:focus:bg-blue-900 focus:text-blue-900 dark:focus:text-blue-100"
                                                    >
                                                        {icon}: {previousProgress}% 📌 {item.name}
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </div>

                                </Select>

                                {formData.items && selectedSpk && (
                                    <div className="space-y-2">
                                        {/* <div className="text-xs text-gray-700 dark:text-gray-300 p-3 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-600">
                                            <span className="font-semibold">📊 Progress untuk:</span>{" "}
                                            <strong className="text-blue-600 dark:text-blue-400">
                                                {selectedSpk.items.find((i) => i.id === formData.items)?.name ?? "-"}
                                            </strong>
                                            {formData.minProgress && formData.minProgress > 0 && (
                                                <span className="block mt-1 text-amber-600 dark:text-amber-400 font-medium">
                                                    ⚠️ Progress minimal: {formData.minProgress}%
                                                </span>
                                            )}
                                        </div> */}

                                        {/* Progress Terakhir */}
                                        {(() => {
                                            // Cari laporan terbaru untuk item ini berdasarkan reportedAt
                                            const latestReport = reports
                                                ?.filter(report => String(report.soDetailId) === String(formData.items))
                                                ?.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())[0];

                                            if (latestReport) {
                                                return (
                                                    <div className="text-xs text-gray-700 dark:text-gray-300 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-700">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-3 w-3 text-green-600 dark:text-green-400" />
                                                            <span className="font-semibold">Progress Terakhir:</span>
                                                            <span className="text-green-600 dark:text-green-400 font-bold">
                                                                {latestReport.progress}%
                                                            </span>
                                                        </div>
                                                        <div className="text-gray-600 dark:text-gray-400 mt-1">
                                                            Dilaporkan: {new Date(latestReport.reportedAt).toLocaleDateString('id-ID', {
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </div>
                                                        {latestReport.note && (
                                                            <div className="mt-1 text-gray-600 dark:text-gray-400">
                                                                <span className="font-medium">Catatan:</span> {latestReport.note}
                                                            </div>
                                                        )}

                                                        {/* Foto dari Laporan Terakhir */}
                                                        {latestReport.photos && latestReport.photos.length > 0 ? (
                                                            <div className="mt-3">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Dialog>
                                                                        <DialogTrigger asChild>
                                                                            <div className="flex items-center gap-1 cursor-pointer hover:opacity-80">
                                                                                <div className="relative">
                                                                                    <Camera className="w-3.5 h-3.5 text-blue-500" />
                                                                                    {latestReport.photos.length > 1 && (
                                                                                        <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[8px] rounded-full w-3 h-3 flex items-center justify-center">
                                                                                            {latestReport.photos.length}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <span className="text-xs text-muted-foreground">{latestReport.photos.length} foto</span>
                                                                            </div>
                                                                        </DialogTrigger>
                                                                        <DialogContent className="max-w-4xl p-4 border-cyan-300">
                                                                            <AlertDialogHeader>
                                                                                <DialogTitle>Foto Bukti Laporan Terakhir</DialogTitle>
                                                                            </AlertDialogHeader>
                                                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                                                                {latestReport.photos.map((photo: string, idx: number) => {
                                                                                    const photoUrl = getImageUrl(photo);

                                                                                    return (
                                                                                        <div
                                                                                            key={idx}
                                                                                            className="group relative aspect-square rounded-xl overflow-hidden border border-border/40 bg-muted/30 cursor-pointer"
                                                                                            onClick={() => window.open(photoUrl, "_blank")}
                                                                                        >
                                                                                            <Image
                                                                                                src={photoUrl}
                                                                                                alt={`bukti-${idx + 1}`}
                                                                                                fill
                                                                                                className="object-cover transition-transform duration-300 group-hover:scale-110"
                                                                                                sizes="(max-width: 768px) 50vw, 25vw"
                                                                                                onError={(e) => {
                                                                                                    e.currentTarget.src = "/images/placeholder-image.svg";
                                                                                                }}
                                                                                            />
                                                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                                                <ZoomIn className="h-6 w-6 text-white drop-shadow" />
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </DialogContent>
                                                                    </Dialog>
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                                                                    {/* <span className="text-xs text-gray-500 dark:text-gray-400">
                {latestReport.photos[0]?.category || 'Dokumentasi'}
            </span> */}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="mt-2 flex items-center gap-1">
                                                                <Camera className="w-3.5 h-3.5 text-gray-400" />
                                                                <span className="text-xs text-muted-foreground/70">Tidak ada foto</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                )}

                                {!formData.items && (
                                    <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg border-1 border-amber-200 dark:border-amber-800">
                                        <AlertCircle className="h-3 w-3" />
                                        Harap pilih satu item pekerjaan
                                    </div>
                                )}
                            </div>

                            {/* Jenis Laporan */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold flex items-center gap-2">
                                    <ClipboardList className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                    Jenis Laporan
                                </Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value: 'PROGRESS' | 'FINAL') =>
                                        setFormData((prev) => {
                                            // Cari progress terakhir berdasarkan reportedAt dan soDetailId
                                            const latestReport = reports
                                                ?.filter(report => String(report.soDetailId) === String(prev.items))
                                                ?.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())[0];

                                            const latestProgress = latestReport?.progress ?? 0;
                                            const selectedItem = selectedSpk?.items.find((i) => i.id === prev.items);
                                            const itemName = selectedItem?.name ?? "-";

                                            const newProgress = value === "FINAL" ? 100 : latestProgress;
                                            const note = value === "FINAL" ? `${itemName} - Selesai 100%` : "";

                                            return {
                                                ...prev,
                                                type: value,
                                                progress: newProgress,
                                                minProgress: latestProgress, // Set minProgress ke progress terakhir
                                                previousProgress: latestProgress, // Simpan progress terakhir
                                                note,
                                            };
                                        })
                                    }
                                >
                                    <SelectTrigger className="text-sm h-11 border-2 border-purple-600 dark:border-purple-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:focus:ring-purple-400 dark:focus:border-purple-400 transition-colors">
                                        <SelectValue placeholder="Pilih jenis laporan" />
                                    </SelectTrigger>
                                    <SelectContent className="text-sm border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg">
                                        <SelectItem
                                            value="PROGRESS"
                                            className="flex items-center gap-2 focus:bg-blue-100 dark:focus:bg-blue-900 focus:text-blue-900 dark:focus:text-blue-100"
                                        >
                                            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            Progress Pekerjaan
                                        </SelectItem>
                                        <SelectItem
                                            value="FINAL"
                                            className="flex items-center gap-2 focus:bg-green-100 dark:focus:bg-green-900 focus:text-green-900 dark:focus:text-green-100"
                                        >
                                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            Selesai / Final
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                <div className="text-xs text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                                    {formData.type === "FINAL" ?
                                        "✅ Laporan final akan menyelesaikan item menjadi 100%" :
                                        `📊 Laporan progress untuk update perkembangan pekerjaan (Progress terakhir: ${(() => {
                                            const latestReport = reports
                                                ?.filter(report => String(report.soDetailId) === String(formData.items))
                                                ?.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())[0];
                                            return latestReport?.progress ?? 0;
                                        })()
                                        }%)`}
                                </div>
                            </div>

                            {/* Catatan */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                    Catatan Progress
                                </Label>
                                <Textarea
                                    placeholder={`Jelaskan detail progress, pencapaian, kendala, atau informasi penting lainnya...${formData.type === "FINAL" ? " (Wajib diisi untuk laporan final)" : ""}`}
                                    value={formData.note}
                                    onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                                    rows={4}
                                    className="text-sm resize-none border-2 border-purple-600 dark:border-purple-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:focus:ring-orange-400 dark:focus:border-orange-400 transition-colors placeholder-gray-500 dark:placeholder-gray-400"
                                    required
                                />
                            </div>
                        </div>

                        {/* Kolom Kanan - Progress & Dokumentasi */}
                        <div className="space-y-5">
                            {/* Progress Tracking */}
                            <div className="space-y-4 p-4 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/30 rounded-xl border-2 border-gray-200 dark:border-gray-600 shadow-sm">
                                <Label className="text-sm font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                                    <Target className="h-4 w-4 text-red-600 dark:text-red-400" />
                                    Tracking Progress Item
                                </Label>

                                {/* Progress Indicator */}
                                <div className="flex items-center justify-between mb-4">
                                    <motion.span
                                        key={formData.progress}
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                        className={cn(
                                            "text-sm font-bold px-4 py-2 rounded-lg shadow-sm border-2 transition-all duration-300",
                                            formData.progress === 100
                                                ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white border-green-700 shadow-lg shadow-green-200/50 dark:shadow-green-800/30"
                                                : formData.progress >= 70
                                                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-blue-600 shadow-lg shadow-blue-200/50 dark:shadow-blue-800/30"
                                                    : formData.progress >= 40
                                                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-600 shadow-lg shadow-amber-200/50 dark:shadow-amber-800/30"
                                                        : "bg-gradient-to-r from-red-500 to-pink-500 text-white border-red-600 shadow-lg shadow-red-200/50 dark:shadow-red-800/30"
                                        )}
                                    >
                                        {formData.progress}% Complete
                                    </motion.span>

                                    <div className={cn(
                                        "px-3 py-1 rounded-full text-xs font-bold border-2 transition-all duration-300",
                                        formData.progress === 100
                                            ? "bg-green-100 text-green-800 border-green-400 dark:bg-green-900 dark:text-green-100 dark:border-green-600"
                                            : "bg-blue-100 text-blue-800 border-blue-400 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-600"
                                    )}>
                                        {formData.progress === 100 ? "✅ DONE" : "🔄 IN PROGRESS"}
                                    </div>
                                </div>

                                {/* Progress Slider */}
                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs text-gray-700 dark:text-gray-300">
                                        <span className="font-medium">Min: {formData.minProgress ?? 0}%</span>
                                        <span className="font-semibold text-blue-600 dark:text-blue-400">Progress Saat Ini: {formData.progress}%</span>
                                        <span className="font-medium">Max: 100%</span>
                                    </div>

                                    <div className="relative py-4">
                                        <div className="absolute top-1/2 left-0 right-0 h-3 bg-gray-200 dark:bg-gray-700 rounded-full transform -translate-y-1/2 z-0"></div>
                                        <div
                                            className="absolute top-1/2 left-0 h-3 bg-gradient-to-r from-green-400 to-green-600 rounded-full transform -translate-y-1/2 transition-all duration-300 z-10"
                                            style={{ width: `${formData.progress}%` }}
                                        ></div>

                                        {/* Gunakan variant green-gradient dari komponen Slider yang sudah diupdate */}
                                        <Slider
                                            value={[formData.progress]}
                                            onValueChange={(value) => {
                                                const newProgress = Math.max(value[0], formData.minProgress ?? 0);
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    progress: newProgress,
                                                    type: newProgress === 100 ? "FINAL" : "PROGRESS",
                                                }));
                                            }}
                                            disabled={formData.type === "FINAL" || !formData.items}
                                            min={formData.minProgress ?? 0}
                                            max={100}
                                            step={5}
                                            variant="green-gradient"
                                            size="lg"
                                            showTooltip
                                            className="relative z-20"
                                        />
                                    </div>

                                    <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {(() => {
                                            const minProgress = formData.minProgress ?? 0;
                                            const steps = [0, 25, 50, 75, 100];

                                            // Filter steps yang >= minProgress dan sesuaikan step pertama dengan minProgress
                                            const filteredSteps = steps.filter(step => step >= minProgress);

                                            // Jika tidak ada steps yang valid, tampilkan minProgress dan 100
                                            if (filteredSteps.length === 0) {
                                                return (
                                                    <>
                                                        <div className="text-center">{minProgress}%</div>
                                                        <div className="text-center col-span-5"></div>
                                                        <div className="text-center">100%</div>
                                                    </>
                                                );
                                            }

                                            // Ganti step pertama dengan minProgress jika minProgress > 0 dan tidak sama dengan step pertama
                                            const adjustedSteps = [...filteredSteps];
                                            if (minProgress > 0 && adjustedSteps[0] !== minProgress) {
                                                adjustedSteps[0] = minProgress;
                                            }

                                            return adjustedSteps.map((step, index) => {
                                                // Hitung grid column position
                                                const totalSteps = adjustedSteps.length;
                                                let gridColumn;

                                                if (totalSteps === 1) {
                                                    gridColumn = '4'; // tengah jika hanya satu
                                                } else if (totalSteps === 2) {
                                                    gridColumn = index === 0 ? '2' : '6'; // kiri dan kanan
                                                } else if (totalSteps === 3) {
                                                    gridColumn = index === 0 ? '1' : index === 1 ? '4' : '7'; // kiri, tengah, kanan
                                                } else if (totalSteps === 4) {
                                                    gridColumn = index === 0 ? '1' : index === 1 ? '3' : index === 2 ? '5' : '7'; // distribusi merata
                                                } else {
                                                    gridColumn = index === 0 ? '1' : index === totalSteps - 1 ? '7' : `${2 + (index - 1) * 1}`;
                                                }

                                                return (
                                                    <div
                                                        key={index}
                                                        className="text-center"
                                                        style={{ gridColumn }}
                                                    >
                                                        <span className={
                                                            step === minProgress && minProgress > 0
                                                                ? "font-bold text-amber-600 dark:text-amber-400"
                                                                : "text-gray-500 dark:text-gray-400"
                                                        }>
                                                            {step}%
                                                        </span>
                                                        {step === minProgress && minProgress > 0 && (
                                                            <div className="text-[10px] text-amber-500 dark:text-amber-400">min</div>
                                                        )}
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>

                                {formData.items && selectedSpk && (
                                    <div className="space-y-2">
                                        <div className="text-xs text-gray-700 dark:text-gray-300 p-3 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-600">
                                            <span className="font-semibold">📊 Progress untuk:</span>{" "}
                                            <strong className="text-blue-600 dark:text-blue-400">
                                                {selectedSpk.items.find((i) => i.id === formData.items)?.name ?? "-"}
                                            </strong>
                                            {formData.minProgress && formData.minProgress > 0 && (
                                                <span className="block mt-1 text-amber-600 dark:text-amber-400 font-medium">
                                                    ⚠️ Progress minimal: {formData.minProgress}%
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Dokumentasi Foto */}
                            <div className="space-y-4">
                                {/* Dropdown Kategori */}
                                <div className="flex items-center gap-3 mb-4">
                                    <Label htmlFor="photo-category" className="text-sm font-medium whitespace-nowrap">
                                        Kategori Foto:
                                    </Label>
                                    <select
                                        id="photo-category"
                                        value={formData.photoCategory}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            photoCategory: e.target.value as "SEBELUM" | "PROSES" | "SESUDAH"
                                        })}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                    >
                                        <option value="SEBELUM">SEBELUM</option>
                                        <option value="PROSES">PROSES</option>
                                        <option value="SESUDAH">SESUDAH</option>
                                    </select>
                                </div>

                                {/* Grid Foto */}
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {formData.photos.map((photo, index) => (
                                        <div
                                            key={index}
                                            className="relative group transform transition-all duration-300 hover:scale-105"
                                        >
                                            <div className="relative h-28 w-full overflow-hidden rounded-xl border-2 border-border/60 group-hover:border-indigo-300 transition-colors">
                                                <Image
                                                    src={URL.createObjectURL(photo.file)}
                                                    alt={`${photo.category} - ${photo.file.name || `Dokumentasi ${index + 1}`}`}
                                                    fill
                                                    className="object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => removePhoto(index)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg hover:bg-red-600 z-10"
                                                aria-label="Hapus foto"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>

                                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                {photo.category} - {photo.file.name || `Foto ${index + 1}`}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Tombol Upload */}
                                    {formData.photos.length < 10 && (
                                        <div className="flex flex-col gap-2">
                                            <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-border/60 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all duration-300 group">
                                                <Camera className="w-6 h-6 mb-2 text-muted-foreground group-hover:text-indigo-600 transition-colors" />
                                                <span className="text-xs font-medium text-muted-foreground group-hover:text-indigo-600 transition-colors">Kamera</span>
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    capture="environment"
                                                    className="hidden"
                                                    onChange={handleFileUpload}
                                                    disabled={uploading}
                                                />
                                            </label>

                                            <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-border/60 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300 group">
                                                <ImageIcon className="w-6 h-6 mb-2 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                                                <span className="text-xs font-medium text-muted-foreground group-hover:text-blue-600 transition-colors">Galeri</span>
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    className="hidden"
                                                    onChange={handleFileUpload}
                                                    disabled={uploading}
                                                />
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Validasi Progress */}
                    {formData.items && (
                        <div className={cn(
                            "p-4 rounded-xl border transition-all duration-300",
                            formData.progress === (formData.previousProgress ?? 0)
                                ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
                                : "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                        )}>
                            <div className="flex items-center gap-3">
                                {formData.progress === (formData.previousProgress ?? 0) ? (
                                    <>
                                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                                                Progress Belum Berubah
                                            </p>
                                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                                Silakan ubah nilai progress atau tambahkan catatan untuk mengirim laporan
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                                                Progress Berubah ({formData.previousProgress ?? 0}% → {formData.progress}%)
                                            </p>
                                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                                Siap untuk mengirim laporan progress
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-border/40">
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={() => setActiveTab("list")}
                            disabled={uploading}
                            className="text-sm w-full sm:w-auto gap-2 border-border/60 hover:bg-muted/50 transition-all duration-300"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Kembali ke Daftar
                        </Button>

                        <div className="flex-1" />

                        <Button
                            type="submit"
                            disabled={
                                uploading ||
                                !formData.note ||
                                !formData.items ||
                                formData.progress === (formData.previousProgress ?? 0)
                            }
                            size="lg"
                            className={cn(
                                "text-sm w-full sm:w-auto gap-2 text-white shadow-lg transition-all duration-300 transform hover:-translate-y-0.5",
                                formData.progress === (formData.previousProgress ?? 0)
                                    ? "bg-gray-400 cursor-not-allowed hover:bg-gray-400"
                                    : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                            )}
                        >
                            {uploading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Mengirim Laporan...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    {formData.type === "FINAL" ? "Kirim Laporan Final" : "Kirim Progress"}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default ReportProgressTab;