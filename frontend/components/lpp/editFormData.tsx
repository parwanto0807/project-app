// components/lpp/editFormData.tsx
"use client"

import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
} from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Plus,
    Trash2,
    Paperclip,
    Calendar,
    Upload,
    FileText,
    DollarSign,
    Receipt,
    Building,
    FileCheck,
    ArrowLeft,
    X,
    Edit,
    AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { PurchaseRequest } from '@/types/pr';
import Image from 'next/image';
import { UpdateLppForm, ExistingPertanggungjawaban, ExistingPertanggungjawabanDetail, PaymentMethod } from '@/types/types-lpp';
import { updateLppSchema } from '@/schemas/lpp/schemas-lpp';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { makeImageSrc } from '@/utils/makeImageSrc';

// Types untuk state file upload
interface FileWithPreview {
    file: File;
    url?: string;
    previewUrl?: string;
    keterangan?: string;
}

export interface FotoBuktiMap {
    [key: string]: FileWithPreview[];
    [key: number]: FileWithPreview[];
}

// Mapping function untuk konversi data form ke UpdateLppForm (TANPA upload foto)
const mapFormToCreateLpp = (
    formData: UpdateLppForm,
    totalBiaya: number,
    sisaUangDikembalikan: number,
    uangMukaId: string,
): UpdateLppForm => {
    // Hanya mapping data TANPA upload foto dulu
    const detailsWithFotoBukti = (formData.details ?? []).map((rincian) => {
        return {
            id: rincian.id,
            tanggalTransaksi: rincian.tanggalTransaksi
                ? new Date(rincian.tanggalTransaksi)
                : undefined,
            keterangan: rincian.keterangan,
            jumlah: rincian.jumlah,
            nomorBukti: rincian.nomorBukti || '',
            jenisPembayaran: rincian.jenisPembayaran as
                | "CASH"
                | "TRANSFER"
                | "DEBIT"
                | "CREDIT_CARD"
                | "QRIS",
            purchaseRequestDetailId: rincian.purchaseRequestDetailId || undefined,
            productId: rincian.productId,
            // Foto akan diupload setelah detail dibuat
            fotoBukti: undefined,
        };
    });

    return {
        details: detailsWithFotoBukti,
        status: 'PENDING',
        totalBiaya,
        sisaUangDikembalikan,
        uangMukaId,
        keterangan: formData.keterangan,
    };
};

type FormValues = UpdateLppForm;

interface EditLppFormProps {
    purchaseRequest: PurchaseRequest;
    onSubmit: (data: UpdateLppForm, fotoBuktiMap: FotoBuktiMap) => Promise<void>;
    isLoading: boolean;
    onBack?: () => void;
    initialData?: ExistingPertanggungjawaban; // Data LPP yang sudah ada untuk edit
}

const EditLppForm: React.FC<EditLppFormProps> = ({
    purchaseRequest,
    onSubmit,
    isLoading,
    onBack,
    initialData
}) => {
    const [fotoBuktiMap, setFotoBuktiMap] = useState<FotoBuktiMap>({});
    const router = useRouter();
    const PAYMENT_METHODS = ["CASH", "TRANSFER", "DEBIT", "CREDIT_CARD", "QRIS"] as const;

    console.log("DATA RECEIVED FROM PAGE.TSX", initialData)

    // Prepare initial values dari existing data
    const getInitialValues = (): UpdateLppForm => {
        if (initialData && initialData.details) {
            return {
                keterangan: initialData.keterangan || '',
                totalBiaya: Number(initialData.totalBiaya) || 0,
                sisaUangDikembalikan: Number(initialData.sisaUangDikembalikan) || 0,
                details: initialData.details.map((detail: ExistingPertanggungjawabanDetail) => ({
                    id: detail.id, // penting untuk update
                    tanggalTransaksi: detail.tanggalTransaksi
                        ? new Date(detail.tanggalTransaksi)
                        : new Date(),
                    keterangan: detail.keterangan || '',
                    jumlah: Number(detail.jumlah) || 0,
                    nomorBukti: detail.nomorBukti || '',
                    jenisPembayaran: PAYMENT_METHODS.includes(detail.jenisPembayaran as PaymentMethod)
                        ? (detail.jenisPembayaran as typeof PAYMENT_METHODS[number])
                        : "CASH",
                    productId: detail.productId || '',
                    purchaseRequestDetailId: detail.purchaseRequestDetailId || undefined,
                    fotoBukti: (detail.fotoBukti || []).map(f => ({
                        id: f.id,       // id foto
                        url: f.url,     // URL/path foto
                        keterangan: f.keterangan || ''
                    }))
                }))
            };
        }

        // fallback default
        return {
            keterangan: '',
            totalBiaya: 0,
            sisaUangDikembalikan: 0,
            details: [
                {
                    id: undefined, // baru
                    tanggalTransaksi: new Date(),
                    keterangan: '',
                    jumlah: 0,
                    nomorBukti: '',
                    jenisPembayaran: "CASH" as const,
                    productId: '',
                    purchaseRequestDetailId: undefined,
                    fotoBukti: [{ id: undefined, keterangan: '' }]
                }
            ]
        };
    };

    const form = useForm<FormValues>({
        resolver: zodResolver(updateLppSchema),
        defaultValues: getInitialValues()
    });

    // console.log("📋 [EDIT FORM] Data Received:", purchaseRequest);
    // console.log("📋 [EDIT FORM] Initial Data:", initialData);

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'details',
    });

    const watchRincianList = form.watch('details');

    const totalBiaya = (watchRincianList ?? []).reduce(
        (sum, rincian) => sum + (rincian.jumlah ?? 0),
        0
    );

    const uangMuka = purchaseRequest.uangMuka && purchaseRequest.uangMuka.length > 0
        ? purchaseRequest.uangMuka[0]
        : null;

    // Untuk edit, gunakan sisa uang dari existing data atau hitung ulang
    // const existingSisaUang = Number(purchaseRequest?.uangMuka?.[0]?.pertanggungjawaban?.[0].sisaUangDikembalikan) || 0;
    const sisaUangDikembalikan = (Number(uangMuka?.jumlah) || 0) - totalBiaya;

    const totalBudget = purchaseRequest.details.reduce(
        (sum, detail) => sum + Number(detail.estimasiTotalHarga || 0),
        0
    );

    // Load existing foto bukti jika ada
    useEffect(() => {
        if (initialData?.details) {
            const initialFotoMap: FotoBuktiMap = {};
            initialData.details.forEach((detail: ExistingPertanggungjawabanDetail, index: number) => {
                if (detail.fotoBukti && detail.fotoBukti.length > 0) {
                    // Untuk existing files, kita tidak bisa membuat File objects
                    // Jadi kita hanya simpan informasi metadata
                    initialFotoMap[index] = detail.fotoBukti.map((foto) => ({
                        file: new File([], foto.keterangan || 'Existing file'), // Dummy file
                        previewUrl: makeImageSrc(foto.url),
                        keterangan: foto.keterangan
                    }));
                }
            });
            setFotoBuktiMap(initialFotoMap);
        }
    }, [initialData]);

    const handleAddRincian = () => {
        append({
            tanggalTransaksi: new Date(),
            keterangan: '',
            jumlah: 0,
            nomorBukti: '',
            jenisPembayaran: 'CASH',
            productId: '',
            purchaseRequestDetailId: '',
        });
    };

    const handleRemoveRincian = (index: number) => {
        if (fields.length > 1) {
            remove(index);
            // Hapus juga file yang terkait dengan rincian ini
            const newFotoMap = { ...fotoBuktiMap };
            delete newFotoMap[index];
            setFotoBuktiMap(newFotoMap);
        }
    };

    const handleFileUpload = (index: number, files: FileList | null) => {
        if (files) {
            const fileArray = Array.from(files);
            const newFiles: FileWithPreview[] = fileArray.map(file => {
                const fileWithPreview: FileWithPreview = {
                    file,
                    keterangan: `Bukti ${file.name}`,
                    previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : ""
                };
                return fileWithPreview;
            });

            setFotoBuktiMap(prev => ({
                ...prev,
                [index]: [...(prev[index] || []), ...newFiles]
            }));
        }
    };

    const handleRemoveFile = (rincianIndex: number, fileIndex: number) => {
        const newFotoMap = { ...fotoBuktiMap };

        if (newFotoMap[rincianIndex]) {
            // Revoke object URL untuk mencegah memory leaks
            const removedFile = newFotoMap[rincianIndex][fileIndex];
            if (removedFile.previewUrl && removedFile.previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(removedFile.previewUrl);
            }

            newFotoMap[rincianIndex] = newFotoMap[rincianIndex].filter((_, i) => i !== fileIndex);
            if (newFotoMap[rincianIndex].length === 0) {
                delete newFotoMap[rincianIndex];
            }
        }

        setFotoBuktiMap(newFotoMap);
    };

    const handleFileDescriptionChange = (rincianIndex: number, fileIndex: number, keterangan: string) => {
        setFotoBuktiMap(prev => {
            const newMap = { ...prev };
            if (newMap[rincianIndex] && newMap[rincianIndex][fileIndex]) {
                newMap[rincianIndex][fileIndex].keterangan = keterangan;
            }
            return newMap;
        });
    };

    const getAvailableProducts = () => {
        return purchaseRequest.details.map(detail => ({
            id: detail.productId || detail.productId,
            name: detail.catatanItem || detail.catatanItem || 'Product tidak ditemukan',
            prDetailId: detail.id
        }));
    };

    const jenisPembayaranOptions = [
        { value: 'CASH', label: 'Cash', icon: DollarSign, color: 'text-green-600' },
        { value: 'TRANSFER', label: 'Transfer', icon: Receipt, color: 'text-blue-600' },
        { value: 'DEBIT', label: 'Debit', icon: FileText, color: 'text-purple-600' },
        { value: 'CREDIT_CARD', label: 'Credit Card', icon: CreditCardIcon, color: 'text-orange-600' },
        { value: 'QRIS', label: 'QRIS', icon: QrCodeIcon, color: 'text-indigo-600' },
    ];

    const onSubmitForm = async (data: FormValues) => {
        // console.log("📋 DATA SEND", data);
        if (!uangMuka?.id) {
            alert("Purchase Request tidak memiliki Uang Muka yang valid");
            return;
        }

        try {
            // Map data tanpa foto
            const lppData = mapFormToCreateLpp(
                data,
                totalBiaya,
                sisaUangDikembalikan,
                uangMuka.id,
            );

            // console.log("📤 [EDIT FORM] Final LPP Data:", lppData);

            // Kirim data form DAN fotoBuktiMap ke parent component
            await onSubmit(lppData, fotoBuktiMap);
        } catch (error) {
            console.error("❌ [EDIT FORM] Error in form submission:", error);
            alert("Terjadi kesalahan saat menyimpan data. Silakan coba lagi.");
        }
    };

    // Custom icons
    function CreditCardIcon({ className }: { className?: string }) {
        return (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
        );
    }

    function QrCodeIcon({ className }: { className?: string }) {
        return (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-800 py-0 rounded-2xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header dengan Gradient */}
                <div className="relative mb-8">
                    {onBack && (
                        <Button
                            variant="ghost"
                            onClick={onBack}
                            className="absolute left-0 top-1/2 transform -translate-y-1/2 flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Button>
                    )}

                    <div className="text-center pt-0 pb-6">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            <h1 className="text-4xl font-bold mb-4">Edit Laporan Pertanggungjawaban</h1>
                            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                                Perbarui data pertanggungjawaban yang sudah ada
                            </p>
                        </div>
                    </div>

                    {/* Alert untuk Edit Mode */}
                    <Alert className="bg-blue-50 border-blue-200 mb-6">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                            <strong>Mode Edit:</strong> Anda sedang mengedit pertanggungjawaban yang sudah ada.
                            Perubahan akan memperbarui data yang sudah tersimpan.
                        </AlertDescription>
                    </Alert>

                    {/* PR Info Card */}
                    <Card className="max-w-7xl mx-auto shadow-lg border-0 bg-gradient-to-r from-primary/5 to-blue-100 dark:from-slate-800 dark:to-slate-900 backdrop-blur-sm">
                        <CardContent className="px-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="text-center md:text-left">
                                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                                            Nomor PR
                                        </span>
                                    </div>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                                        {purchaseRequest.nomorPr}
                                    </p>
                                </div>

                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <DollarSign className="h-5 w-5 text-green-600" />
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                                            Total Budget
                                        </span>
                                    </div>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                                        Rp {Number(totalBudget).toLocaleString("id-ID")}
                                    </p>
                                </div>

                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <DollarSign className="h-5 w-5 text-green-600" />
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                                            Sisa Budget
                                        </span>
                                    </div>
                                    <p className="text-lg font-bold text-green-700 dark:text-green-500">
                                        Rp {Number(purchaseRequest?.uangMuka?.[0]?.pertanggungjawaban?.[0].sisaUangDikembalikan).toLocaleString("id-ID")}
                                    </p>
                                </div>

                                <div className="text-center md:text-right">
                                    <div className="flex items-center justify-center md:justify-end gap-2 mb-2">
                                        <Building className="h-5 w-5 text-purple-600" />
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                                            Project
                                        </span>
                                    </div>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                                        {purchaseRequest.project?.name || 'Tidak ada project'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Form */}
                <div className="max-w-7xl mx-auto">
                    <Card className="shadow-xl border-0 bg-white dark:bg-slate-800">
                        <CardContent className="py-2">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-8">
                                    {/* Rincian Pengeluaran */}
                                    <div className="space-y-2">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                    <Edit className="h-6 w-6 text-blue-600" />
                                                    Edit Rincian Pengeluaran
                                                </h3>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                                    Perbarui detail pengeluaran untuk setiap transaksi
                                                </p>
                                            </div>
                                        </div>

                                        {fields.map((field, index) => (
                                            <Card key={field.id} className="bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                                <CardContent className="p-6">
                                                    {/* BAGIAN HEADER */}
                                                    <div className="flex justify-between items-center mb-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                                                                <Receipt className="h-5 w-5 text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-slate-800 dark:text-white">
                                                                    Rincian #{index + 1}
                                                                </h4>
                                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                                    Detail transaksi pengeluaran
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {fields.length > 1 && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleRemoveRincian(index)}
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>

                                                    {/* GRID UTAMA */}
                                                    <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
                                                        {/* Tanggal Transaksi */}
                                                        <FormField
                                                            control={form.control}
                                                            name={`details.${index}.tanggalTransaksi`}
                                                            render={({ field }) => (
                                                                <FormItem className="lg:col-span-2 flex flex-col">
                                                                    <FormLabel className="flex items-center gap-2">
                                                                        <Calendar className="h-4 w-4 text-slate-500" />
                                                                        Tanggal Transaksi
                                                                    </FormLabel>
                                                                    <Popover>
                                                                        <PopoverTrigger asChild>
                                                                            <FormControl>
                                                                                <Button
                                                                                    variant={"outline"}
                                                                                    className={cn("w-full pl-3 text-left font-normal border-slate-200 dark:border-slate-600", !field.value && "text-muted-foreground")}
                                                                                >
                                                                                    {field.value ? format(field.value, "dd MMMM yyyy") : <span>Pilih tanggal</span>}
                                                                                    <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                                                                </Button>
                                                                            </FormControl>
                                                                        </PopoverTrigger>
                                                                        <PopoverContent className="w-auto p-0" align="start">
                                                                            <CalendarComponent
                                                                                mode="single"
                                                                                selected={field.value}
                                                                                onSelect={field.onChange}
                                                                                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                                                                initialFocus
                                                                            />
                                                                        </PopoverContent>
                                                                    </Popover>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        {/* Produk/Jasa */}
                                                        <FormField
                                                            control={form.control}
                                                            name={`details.${index}.productId`}
                                                            render={({ field }) => (
                                                                <FormItem className="lg:col-span-2">
                                                                    <FormLabel className="flex items-center gap-2">
                                                                        <Building className="h-4 w-4 text-slate-500" />
                                                                        Produk/Jasa
                                                                    </FormLabel>
                                                                    <Select
                                                                        onValueChange={(value) => {
                                                                            field.onChange(value);
                                                                            const selectedProduct = getAvailableProducts().find(p => p.id === value);
                                                                            if (selectedProduct) {
                                                                                form.setValue(`details.${index}.purchaseRequestDetailId`, selectedProduct.prDetailId);
                                                                            }
                                                                        }}
                                                                        defaultValue={field.value}
                                                                    >
                                                                        <FormControl>
                                                                            <SelectTrigger className="border-slate-200 dark:border-slate-600">
                                                                                <SelectValue placeholder="Pilih Produk" />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            {getAvailableProducts().map(product => (
                                                                                <SelectItem key={product.id} value={product.id}>
                                                                                    {product.name}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        {/* Jenis Pembayaran */}
                                                        <FormField
                                                            control={form.control}
                                                            name={`details.${index}.jenisPembayaran`}
                                                            render={({ field }) => (
                                                                <FormItem className="lg:col-span-2">
                                                                    <FormLabel className="flex items-center gap-2">
                                                                        <Receipt className="h-4 w-4 text-slate-500" />
                                                                        Jenis Pembayaran
                                                                    </FormLabel>
                                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                        <FormControl>
                                                                            <SelectTrigger className="border-slate-200 dark:border-slate-600">
                                                                                <SelectValue placeholder="Pilih jenis pembayaran" />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            {jenisPembayaranOptions.map(option => (
                                                                                <SelectItem key={option.value} value={option.value}>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <option.icon className={`h-4 w-4 ${option.color}`} />
                                                                                        {option.label}
                                                                                    </div>
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        {/* Nomor Bukti */}
                                                        <FormField
                                                            control={form.control}
                                                            name={`details.${index}.nomorBukti`}
                                                            render={({ field }) => (
                                                                <FormItem className="lg:col-span-3">
                                                                    <FormLabel className="flex items-center gap-2">
                                                                        <FileText className="h-4 w-4 text-slate-500" />
                                                                        Nomor Bukti
                                                                    </FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            placeholder="Masukkan nomor nota/kuitansi..."
                                                                            className="border-slate-200 dark:border-slate-600"
                                                                            {...field}
                                                                            value={field.value ?? ""}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        {/* Jumlah */}
                                                        <FormField
                                                            control={form.control}
                                                            name={`details.${index}.jumlah`}
                                                            render={({ field }) => (
                                                                <FormItem className="lg:col-span-3">
                                                                    <FormLabel className="flex items-center gap-2">
                                                                        <DollarSign className="h-4 w-4 text-slate-500" />
                                                                        Jumlah
                                                                    </FormLabel>
                                                                    <FormControl>
                                                                        <div className="relative">
                                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">Rp</span>
                                                                            <Input
                                                                                type="number"
                                                                                placeholder="0"
                                                                                className="pl-10 border-slate-200 dark:border-slate-600"
                                                                                {...field}
                                                                                // pastikan yang dikirim ke form selalu number
                                                                                onChange={(e) => {
                                                                                    const val = e.target.value;
                                                                                    field.onChange(val === "" ? 0 : parseFloat(val)); // tetap number
                                                                                }}
                                                                                value={field.value ?? ""} // jangan gabung "Rp" di valuedi value
                                                                            />

                                                                        </div>
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        {/* Keterangan */}
                                                        <FormField
                                                            control={form.control}
                                                            name={`details.${index}.keterangan`}
                                                            render={({ field }) => (
                                                                <FormItem className="lg:col-span-3">
                                                                    <FormLabel>Keterangan Rincian</FormLabel>
                                                                    <FormControl>
                                                                        <Textarea
                                                                            placeholder="Cth: Pembelian ATK untuk kebutuhan kantor..."
                                                                            className="min-h-[120px] resize-none border-slate-200 dark:border-slate-600"
                                                                            {...field}
                                                                            value={field.value ?? ""}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        {/* File Upload Section */}
                                                        <div className="lg:col-span-3 space-y-4">
                                                            <FormLabel className="flex items-center gap-2">
                                                                <Paperclip className="h-4 w-4 text-slate-500" />
                                                                Foto Bukti
                                                            </FormLabel>

                                                            {/* Tombol Upload */}
                                                            <label htmlFor={`file-upload-${index}`} className="w-full">
                                                                <div className="flex items-center justify-center gap-2 w-full h-10 px-4 py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md text-sm cursor-pointer transition-colors">
                                                                    <Upload className="h-4 w-4" />
                                                                    <span>Upload Foto/Dokumen Baru</span>
                                                                </div>
                                                                <input
                                                                    accept="image/*,.pdf,.doc,.docx"
                                                                    style={{ display: 'none' }}
                                                                    id={`file-upload-${index}`}
                                                                    type="file"
                                                                    multiple
                                                                    onChange={(e) => handleFileUpload(index, e.target.files)}
                                                                />
                                                            </label>

                                                            {/* File Previews */}
                                                            {fotoBuktiMap[index] && fotoBuktiMap[index].length > 0 && (
                                                                <div className="space-y-3">
                                                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                                        File terupload ({fotoBuktiMap[index].length})
                                                                    </p>

                                                                    {fotoBuktiMap[index].map((fileWithPreview, fileIndex) => (
                                                                        <div key={fileIndex} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                                                                            {/* Preview untuk gambar */}
                                                                            {fileWithPreview.previewUrl ? (
                                                                                <div className="flex-shrink-0">
                                                                                    <Image
                                                                                        src={fileWithPreview.previewUrl}
                                                                                        alt={`Preview ${fileIndex + 1}`}
                                                                                        width={60}
                                                                                        height={60}
                                                                                        style={{ objectFit: "contain" }}
                                                                                        className="rounded-md object-cover"
                                                                                    />
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex-shrink-0 w-15 h-15 bg-slate-100 dark:bg-slate-600 rounded-md flex items-center justify-center">
                                                                                    <FileText className="h-6 w-6 text-slate-400" />
                                                                                </div>
                                                                            )}

                                                                            {/* Info file dan input keterangan */}
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-start justify-between mb-2">
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                                                                            {fileWithPreview.file.name}
                                                                                        </p>
                                                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                                            {fileWithPreview.file.size > 0 ?
                                                                                                `${(fileWithPreview.file?.size / 5024).toFixed(1)} KB` :
                                                                                                'Existing file'
                                                                                            }
                                                                                        </p>
                                                                                    </div>
                                                                                    <Button
                                                                                        type="button"
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                                        onClick={() => handleRemoveFile(index, fileIndex)}
                                                                                    >
                                                                                        <X className="h-4 w-4" />
                                                                                    </Button>
                                                                                </div>

                                                                                <Input
                                                                                    type="text"
                                                                                    placeholder="Keterangan file..."
                                                                                    value={fileWithPreview.keterangan}
                                                                                    onChange={(e) => handleFileDescriptionChange(index, fileIndex, e.target.value)}
                                                                                    className="text-sm"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}

                                        {/* Tombol Tambah Rincian */}
                                        <div className="w-full flex justify-end">
                                            <Button
                                                type="button"
                                                onClick={handleAddRincian}
                                                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-lg shadow-blue-600/25"
                                                size="sm"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Tambah Rincian
                                            </Button>
                                        </div>
                                    </div>

                                    <Separator className="my-8" />

                                    {/* Keterangan Umum */}
                                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-6">
                                        <FormField
                                            control={form.control}
                                            name="keterangan"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-lg font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                                        <FileCheck className="h-5 w-5 text-blue-600" />
                                                        Keterangan Umum
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Masukkan keterangan umum pertanggungjawaban..."
                                                            className="min-h-[100px] resize-none border-slate-200 dark:border-slate-600 focus:border-blue-500"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Summary Section */}
                                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
                                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                            <FileCheck className="h-5 w-5 text-blue-600" />
                                            Ringkasan Pertanggungjawaban
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Total Biaya</p>
                                                <p className="text-2xl font-bold text-blue-600">
                                                    Rp {totalBiaya.toLocaleString()}
                                                </p>
                                            </div>

                                            <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Sisa Uang Dikembalikan</p>
                                                <p className={`text-2xl font-bold ${sisaUangDikembalikan >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    Rp {sisaUangDikembalikan.toLocaleString()}
                                                </p>
                                            </div>

                                            <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Status</p>
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 px-3 py-1 text-sm font-medium"
                                                >
                                                    {initialData?.status || 'PENDING'}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Informasi Uang Muka */}
                                        <div className="mt-6 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-600 dark:text-slate-400">Approval Request Total :</span>
                                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                        Rp {Number(uangMuka?.jumlah).toLocaleString("id-ID") || '0'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-600 dark:text-slate-400">Total Pengeluaran:</span>
                                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                        Rp {totalBiaya.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex justify-end pt-6 items-center gap-4">
                                        <button
                                            type="button"
                                            onClick={() => router.back()}
                                            className="flex items-center gap-2 min-w-[120px] bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white shadow-lg shadow-green-500/25 py-1.5 px-2 text-base font-semibold rounded-lg cursor-pointer"
                                        >
                                            <ArrowLeft className="h-4 w-4 text-white" />
                                            Kembali
                                        </button>

                                        <Button
                                            type="submit"
                                            disabled={isLoading || totalBiaya === 0 || sisaUangDikembalikan < 0}
                                            className="min-w-[200px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed py-3 text-base font-semibold cursor-pointer"
                                        >
                                            {isLoading ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    Menyimpan...
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <Edit className="h-5 w-5" />
                                                    Perbarui LPP
                                                </div>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default EditLppForm;