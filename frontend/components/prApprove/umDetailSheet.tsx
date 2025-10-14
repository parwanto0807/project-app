// components/UMDetailSheet.tsx
"use client";

import { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { UangMukaDetail, CairkanUangMukaData } from "@/types/typesUm";
import {
    Calendar,
    Eye,
    FileText,
    Building,
    User,
    CreditCard,
    Banknote,
    Wallet,
    Upload,
    X,
    ClipboardList,
    FileDigit,
    BadgeDollarSign,
    CalendarDays,
    MessageSquareText,
} from "lucide-react";
import Image from "next/image";

interface UMDetailSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: UangMukaDetail | null;
    onCairkan: (data: CairkanUangMukaData) => Promise<void>;
    isSubmitting?: boolean;
}

export function UMDetailSheet({
    open,
    onOpenChange,
    data,
    onCairkan,
    isSubmitting = false,
}: UMDetailSheetProps) {
    const [tanggalPencairan, setTanggalPencairan] = useState<string>(
        new Date().toISOString().split("T")[0]
    );
    const [buktiTransaksi, setBuktiTransaksi] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validasi tipe file
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            toast.error("Format file tidak didukung. Gunakan JPG, PNG, WebP, atau PDF.");
            return;
        }

        // Validasi ukuran file (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            toast.error("Ukuran file terlalu besar. Maksimal 5MB.");
            return;
        }

        setBuktiTransaksi(file);

        // Generate preview untuk gambar
        if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        } else {
            setPreviewUrl(null);
        }
    };

    const handleRemoveFile = () => {
        setBuktiTransaksi(null);
        setPreviewUrl(null);
    };

    const handlePreview = () => {
        if (previewUrl) {
            window.open(previewUrl, '_blank');
        } else if (data?.buktiPencairanUrl) {
            // Jika path sudah absolute
            if (data.buktiPencairanUrl.startsWith('http')) {
                window.open(data.buktiPencairanUrl, '_blank');
            } else {
                // Jika path relatif, tambahkan base URL
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                const fullUrl = `${baseUrl}${data.buktiPencairanUrl.startsWith('/') ? '' : '/'}${data.buktiPencairanUrl}`;
                window.open(fullUrl, '_blank');
            }
        }
    };

    const handleCairkan = async () => {
        if (!data) return;

        try {
            // Buat existingData dari data yang ada
            const existingData = {
                metodePencairan: data.metodePencairan,
                namaBankTujuan: data.namaBankTujuan,
                nomorRekeningTujuan: data.nomorRekeningTujuan,
                namaEwalletTujuan: data.namaEwalletTujuan
            };

            console.log('📋 Data yang dikirim:', {
                id: data.id,
                tanggalPencairan: new Date(tanggalPencairan),
                hasBukti: !!buktiTransaksi,
                existingData: existingData
            });

            // Validasi metodePencairan
            if (!data.metodePencairan) {
                toast.error("Metode pencairan tidak ditemukan");
                return;
            }

            // Validasi bukti transaksi
            if (!buktiTransaksi) {
                toast.error("Bukti transaksi wajib diupload");
                return;
            }

            await onCairkan({
                id: data.id,
                tanggalPencairan: new Date(tanggalPencairan),
                buktiTransaksi: buktiTransaksi,
                existingData: existingData // Tambahkan existingData
            });

            // Reset form setelah success
            setBuktiTransaksi(null);
            setPreviewUrl(null);
            onOpenChange(false);
        } catch (error) {
            console.error("Error proses pencairan:", error);
        }
    };
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DISBURSED':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'SETTLED':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'REJECTED':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'PENDING':
            default:
                return 'bg-amber-50 text-amber-700 border-amber-200';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'PENDING':
                return 'Menunggu Pencairan';
            case 'DISBURSED':
                return 'Dana Telah Dicairkan';
            case 'SETTLED':
                return 'Telah Dipertanggungjawabkan';
            case 'REJECTED':
                return 'Pengajuan Ditolak';
            default:
                return 'Menunggu Pencairan';
        }
    };

    const getMetodePembayaranIcon = (metode: string) => {
        switch (metode) {
            case 'BANK_TRANSFER':
                return { icon: Banknote, color: 'text-blue-600' };
            case 'E_WALLET':
                return { icon: Wallet, color: 'text-purple-600' };
            default:
                return { icon: CreditCard, color: 'text-green-600' };
        }
    };

    if (!data) return null;

    const MetodeData = getMetodePembayaranIcon(data.metodePencairan);
    const MetodeIcon = MetodeData.icon;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="overflow-y-auto sm:max-w-4xl lg:max-w-5xl ml-auto rounded-t-2xl rounded-b-none sm:mb-4 w-full sm:w-auto sm:mr-36 dark:bg-slate-800 md:px-2 max-h-[95vh]" side="bottom">
                <SheetHeader className="text-left pb-4 border-b">
                    <SheetTitle className="flex items-center gap-2 text-xl">
                        <BadgeDollarSign className="h-6 w-6 text-blue-600" />
                        Detail Request Approval / Pencairan Biaya
                    </SheetTitle>
                    <SheetDescription>
                        Informasi lengkap pengajuan biaya dan proses pencairan
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6 pb-6">
                    {/* Status & Summary Card */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-5 border border-blue-100 dark:border-blue-800">
                        <div className="flex justify-between items-start">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-blue-900 rounded-lg shadow-sm">
                                        <CreditCard className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-2xl text-blue-900 dark:text-blue-100">
                                            {formatCurrency(data.jumlah)}
                                        </h3>
                                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border mt-2 ${getStatusColor(data.status)}`}>
                                            {getStatusText(data.status)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right space-y-2">
                                <div className="flex items-center justify-end space-x-2 text-sm">
                                    <div className="p-2 bg-white dark:bg-blue-900 rounded-lg shadow-sm">
                                        <MetodeIcon className={`h-4 w-4 ${MetodeData.color}`} />
                                    </div>
                                    <span className="font-medium capitalize text-blue-900 dark:text-blue-100">
                                        {data.metodePencairan.toLowerCase().replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="flex items-center justify-end space-x-2 text-xs text-blue-700 dark:text-blue-300">
                                    <CalendarDays className="h-3 w-3" />
                                    <span>Diajukan: {formatDate(data.tanggalPengajuan)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Informasi Dokumen */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                <ClipboardList className="h-5 w-5 text-blue-600" />
                            </div>
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                                Informasi Dokumen
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-gray-500" />
                                    Purchase Request
                                </Label>
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                                    <span className="text-sm font-medium">{data.purchaseRequest?.nomorPr || '-'}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                    <FileDigit className="h-4 w-4 text-gray-500" />
                                    SPK
                                </Label>
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                                    <span className="text-sm font-medium">{data.spk?.spkNumber || '-'}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                    <Building className="h-4 w-4 text-gray-500" />
                                    Project
                                </Label>
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                                    <span className="text-sm font-medium">{data.purchaseRequest?.project?.name || '-'}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-500" />
                                    Pengaju
                                </Label>
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                                    <span className="text-sm font-medium">{data.karyawan?.namaLengkap || '-'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Informasi Pembayaran */}
                    {(data.metodePencairan === "BANK_TRANSFER" || data.metodePencairan === "E_WALLET") && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                                    <CreditCard className="h-5 w-5 text-green-600" />
                                </div>
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                                    Informasi Pembayaran
                                </h3>
                            </div>

                            {data.metodePencairan === "BANK_TRANSFER" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-gray-500">Nama Bank</Label>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                                            <span className="text-sm font-medium">{data.namaBankTujuan || '-'}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-gray-500">Nomor Rekening</Label>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                                            <span className="text-sm font-medium">{data.nomorRekeningTujuan || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {data.metodePencairan === "E_WALLET" && (
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-gray-500">Nama E-Wallet</Label>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                                        <span className="text-sm font-medium">{data.namaEwalletTujuan || '-'}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Keterangan */}
                    {data.keterangan && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                                    <MessageSquareText className="h-5 w-5 text-purple-600" />
                                </div>
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                                    Keterangan
                                </h3>
                            </div>
                            <Textarea
                                value={data.keterangan}
                                readOnly
                                className="resize-none bg-gray-50 dark:bg-gray-700/50 border-gray-100 dark:border-gray-600 min-h-[100px]"
                            />
                        </div>
                    )}

                    {/* Bukti Pencairan Existing */}
                    {data.buktiPencairanUrl && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                                    <FileText className="h-5 w-5 text-orange-600" />
                                </div>
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                                    Bukti Pencairan
                                </h3>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                                <div className="flex items-center space-x-3">
                                    <FileText className="h-10 w-10 text-orange-500" />
                                    <div>
                                        <p className="text-sm font-medium">File terupload</p>
                                        <p className="text-xs text-gray-500">
                                            {data.buktiPencairanUrl.split('/').pop()}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePreview}
                                    className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                                >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Lihat
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Form Pencairan - Hanya tampil jika status APPROVED */}
                    {data.status === "PENDING" && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                                    <CreditCard className="h-5 w-5 text-emerald-600" />
                                </div>
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                                    Proses Pencairan
                                </h3>
                            </div>

                            <div className="space-y-5">
                                {/* Tanggal Pencairan */}
                                <div className="space-y-3">
                                    <Label htmlFor="tanggalPencairan" className="text-sm font-medium flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-500" />
                                        Tanggal Pencairan
                                    </Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <Input
                                            id="tanggalPencairan"
                                            type="date"
                                            value={tanggalPencairan}
                                            onChange={(e) => setTanggalPencairan(e.target.value)}
                                            className="pl-12 h-12 border-gray-200 dark:border-gray-600 focus:border-emerald-500"
                                        />
                                    </div>
                                </div>

                                {/* Upload Bukti Transaksi */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium flex items-center gap-2">
                                        <Upload className="h-4 w-4 text-gray-500" />
                                        Bukti Transaksi {!data.buktiPencairanUrl && '(Wajib)'}
                                    </Label>

                                    {!buktiTransaksi ? (
                                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-emerald-500 transition-colors cursor-pointer bg-gray-50/50 dark:bg-gray-700/20">
                                            <input
                                                type="file"
                                                onChange={handleFileSelect}
                                                accept=".jpg,.jpeg,.png,.webp,.pdf"
                                                className="hidden"
                                                id="buktiTransaksi"
                                            />
                                            <label
                                                htmlFor="buktiTransaksi"
                                                className="flex flex-col items-center space-y-3 cursor-pointer"
                                            >
                                                <Upload className="h-10 w-10 text-gray-400" />
                                                <div className="space-y-1">
                                                    <p className="text-emerald-600 font-medium text-sm">
                                                        Klik untuk upload bukti transaksi
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        PNG, JPG, WebP, PDF (max. 5MB)
                                                    </p>
                                                </div>
                                            </label>
                                        </div>
                                    ) : (
                                        <div className="border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 bg-emerald-50/50 dark:bg-emerald-900/20">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                    {previewUrl ? (
                                                        <Image
                                                            src={previewUrl}
                                                            alt="Preview"
                                                            width={48}
                                                            height={48}
                                                            className="object-cover rounded-lg"
                                                        />
                                                    ) : (
                                                        <FileText className="h-12 w-12 text-emerald-500" />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate text-emerald-900 dark:text-emerald-100">
                                                            {buktiTransaksi.name}
                                                        </p>
                                                        <p className="text-xs text-emerald-700 dark:text-emerald-300">
                                                            {(buktiTransaksi.size / 1024 / 1024).toFixed(2)} MB
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {previewUrl && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={handlePreview}
                                                            className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                                        >
                                                            <Eye className="h-3 w-3 mr-1" />
                                                            Preview
                                                        </Button>
                                                    )}
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleRemoveFile}
                                                        className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Button Cairkan */}
                                <Button
                                    onClick={handleCairkan}
                                    disabled={isSubmitting || (!data.buktiPencairanUrl && !buktiTransaksi)}
                                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                                            Memproses Pencairan...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard className="h-5 w-5 mr-2" />
                                            Cairkan Uang Muka
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}