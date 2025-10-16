"use client";

import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createUangMukaSchema } from "@/schemas/um";
import { useState, useMemo, useRef, useEffect } from "react";
import {
    Loader2,
    ChevronDown,
    FileText,
    Calendar,
    Building,
    CreditCard,
    Wallet,
    Banknote,
    Upload,
    X,
    Eye,
    ImageIcon
} from "lucide-react";
import { PurchaseRequest } from "@/types/pr";
import Image from "next/image";
import { CreateUangMukaInput } from "@/types/typesUm";
import { useRouter } from "next/navigation";

interface BackendValidationError {
    field?: string;    // Backend mungkin menggunakan 'field'
    path?: string;     // Atau 'path' 
    message: string;
}

interface BackendErrorResponse {
    success: boolean;
    message: string;
    errors: BackendValidationError[];
}

type UangMukaFormData = {
    jumlah: number;
    metodePencairan: "CASH" | "BANK_TRANSFER" | "E_WALLET";
    keterangan?: string;
    namaBankTujuan?: string;
    nomorRekeningTujuan?: string;
    namaEwalletTujuan?: string;
    purchaseRequestId?: string | null;
    karyawanId?: string | null;
    spkId?: string | null;
    tanggalPengajuan: Date; // Pastikan ini required
    tanggalPencairan?: Date | null;
    buktiPencairanUrl?: string;
};


type MetodePembayaran = "CASH" | "BANK_TRANSFER" | "E_WALLET";

interface SubmitDataWithFile {
    data: CreateUangMukaInput;
    file?: File
}

// Props
interface PrCreateFormProps {
    onSubmit?: (submitData: SubmitDataWithFile) => Promise<void>;
    approvedPurchaseRequests?: PurchaseRequest[];
    isSubmitting?: boolean;
    idFromUrl?: string;
}

export function PrCreateFormFrVerify({
    onSubmit,
    approvedPurchaseRequests = [],
    isSubmitting = false,
    idFromUrl,
}: PrCreateFormProps) {
    const [selectedPurchaseRequest, setSelectedPurchaseRequest] = useState<string>("");
    const [selectedMetodePembayaran, setSelectedMetodePembayaran] = useState<MetodePembayaran>("CASH");
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [backendErrors, setBackendErrors] = useState<Record<string, string>>({});
    const router = useRouter();

    const form = useForm<CreateUangMukaInput>({
        resolver: zodResolver(createUangMukaSchema),
        defaultValues: {
            jumlah: 0,
            keterangan: "",
            metodePencairan: "CASH",
            tanggalPengajuan: new Date(), // Pastikan selalu ada nilai default
            tanggalPencairan: null,
            namaBankTujuan: "",
            nomorRekeningTujuan: "",
            namaEwalletTujuan: "",
            purchaseRequestId: "",
            karyawanId: "",
            spkId: "",
            buktiPencairanUrl: "",
        },
    });

    // 1️⃣ Set selectedPurchaseRequest saat mount
    useEffect(() => {
        if (idFromUrl) {
            setSelectedPurchaseRequest(idFromUrl);

            // 2️⃣ Otomatis update form fields sesuai PR
            const selectedPR = approvedPurchaseRequests.find(pr => pr.id === idFromUrl);
            if (selectedPR) {
                form.setValue("purchaseRequestId", idFromUrl);
                form.setValue("spkId", selectedPR.spk?.id || "");
                form.setValue("karyawanId", selectedPR.karyawan?.id || "");
                form.setValue("jumlah", calculateTotalAmount(selectedPR) || 0);

                const currentKeterangan = form.getValues("keterangan") || "";
                if (!currentKeterangan || currentKeterangan === "") {
                    form.setValue(
                        "keterangan",
                        `Uang muka untuk ${selectedPR.nomorPr} - ${selectedPR.keterangan || ""}`
                    );
                }
            }
        }
    }, [idFromUrl, approvedPurchaseRequests, form]);

    // Get selected PR data untuk auto-fill
    const selectedPRData = useMemo(() => {
        return approvedPurchaseRequests.find(pr => pr.id === selectedPurchaseRequest);
    }, [selectedPurchaseRequest, approvedPurchaseRequests]);

    // Calculate total amount helper function
    const calculateTotalAmount = (pr: PurchaseRequest): number => {
        if (!pr.details) return 0;
        return pr.details.reduce((sum, detail) => {
            return sum + Number(detail.estimasiTotalHarga || 0);
        }, 0);
    };

    // Handle PR selection change
    const handlePurchaseRequestChange = (prId: string) => {
        setSelectedPurchaseRequest(prId);

        const selectedPR = approvedPurchaseRequests.find(pr => pr.id === prId);
        if (selectedPR) {
            form.setValue("purchaseRequestId", prId);
            form.setValue("spkId", selectedPR.spk?.id || "");
            form.setValue("karyawanId", selectedPR.karyawan?.id || "");
            form.setValue("jumlah", calculateTotalAmount(selectedPR) || 0);

            const currentKeterangan = form.getValues("keterangan") || "";
            if (!currentKeterangan || currentKeterangan === "") {
                form.setValue(
                    "keterangan",
                    `Uang muka untuk ${selectedPR.nomorPr} - ${selectedPR.keterangan || ""}`
                );
            }
        }
    };

    // Handle metode pembayaran change
    const handleMetodePembayaranChange = (metode: MetodePembayaran) => {
        setSelectedMetodePembayaran(metode);
        form.setValue("metodePencairan", metode);

        // Reset fields ketika metode berubah
        if (metode !== "BANK_TRANSFER") {
            form.setValue("namaBankTujuan", "");
            form.setValue("nomorRekeningTujuan", "");
        }
        if (metode !== "E_WALLET") {
            form.setValue("namaEwalletTujuan", "");
        }
    };

    // Handle file selection (HANYA memilih file, tidak upload)
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

        setSelectedFile(file);

        // Generate preview untuk gambar
        if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        } else {
            setPreviewUrl(null);
        }

        // Hanya set nama file ke form, tidak upload
        form.setValue("buktiPencairanUrl", file.name);

        toast.success("File berhasil dipilih. File akan diupload saat form disubmit.");
    };

    // Handle remove file
    const handleRemoveFile = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        form.setValue("buktiPencairanUrl", "");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        toast.info("File dihapus");
    };

    // Handle preview
    const handlePreview = () => {
        if (previewUrl) {
            window.open(previewUrl, '_blank');
        } else if (selectedFile) {
            // Untuk file non-gambar, beri informasi
            toast.info(`File: ${selectedFile.name} (${selectedFile.type})`);
        }
    };

    // useEffect(() => {
    //     if (Object.keys(form.formState.errors).length > 0) {
    //         console.log("Validation Errors:", form.formState.errors);
    //     }
    // }, [form.formState.errors]);


    const onSubmitForm: SubmitHandler<UangMukaFormData> = async (values) => {
        try {
            setBackendErrors({});
            setIsUploading(true);

            // Pastikan tanggalPengajuan selalu ada nilai
            const tanggalPengajuan = values.tanggalPengajuan || new Date();
            const jumlah = Number(values.jumlah);
            // Konversi ke tipe yang diharapkan oleh schema
            const submitData: CreateUangMukaInput = {
                jumlah: jumlah,
                metodePencairan: values.metodePencairan,
                keterangan: values.keterangan || "",
                namaBankTujuan: values.namaBankTujuan || undefined,
                nomorRekeningTujuan: values.nomorRekeningTujuan || undefined,
                namaEwalletTujuan: values.namaEwalletTujuan || undefined,
                purchaseRequestId: values.purchaseRequestId || null,
                karyawanId: values.karyawanId || "",
                spkId: values.spkId || "",
                tanggalPengajuan: tanggalPengajuan,
                tanggalPencairan: values.tanggalPencairan || null,
                buktiPencairanUrl: values.buktiPencairanUrl || undefined,
            };

            if (onSubmit) {
                // Kirim dalam format SubmitDataWithFile
                await onSubmit({
                    data: submitData,
                    file: selectedFile || undefined
                });
            } else {
                toast.error("Submit handler tidak tersedia");
            }
        } catch (err: unknown) {
            console.error("❌ Error dalam onSubmitForm:", err);

            // Handle validation errors dari backend
            if (err && typeof err === 'object' && 'message' in err) {
                const error = err as Error;
                try {
                    const errorResponse: BackendErrorResponse = JSON.parse(error.message);
                    if (errorResponse.errors && Array.isArray(errorResponse.errors)) {
                        const errors: Record<string, string> = {};
                        errorResponse.errors.forEach((validationError: BackendValidationError) => {
                            if (validationError.field && validationError.message) {
                                const fieldName = mapBackendFieldToFormField(validationError.field);
                                errors[fieldName] = validationError.message;
                            }
                        });
                        setBackendErrors(errors);
                        toast.error("Terdapat error validasi. Silakan periksa form.");
                    } else {
                        toast.error(errorResponse.message || "Gagal Approval Request");
                    }
                } catch {
                    toast.error(error.message || "Gagal Approval Request");
                }
            } else {
                toast.error("Terjadi error yang tidak diketahui");
            }
        } finally {
            setIsUploading(false);
        }
    };

    // Helper function untuk mapping field names dari backend ke form
    const mapBackendFieldToFormField = (backendField: string): string => {
        const fieldMap: Record<string, string> = {
            'jumlah': 'jumlah',
            'metodePencairan': 'metodePencairan',
            'keterangan': 'keterangan',
            'namaBankTujuan': 'namaBankTujuan',
            'nomorRekeningTujuan': 'nomorRekeningTujuan',
            'namaEwalletTujuan': 'namaEwalletTujuan',
            'purchaseRequestId': 'purchaseRequestId',
            'karyawanId': 'karyawanId',
            'spkId': 'spkId',
            'tanggalPengajuan': 'tanggalPengajuan',
            'tanggalPencairan': 'tanggalPencairan',
            'buktiPencairanUrl': 'buktiPencairanUrl',
            'buktiPencairan': 'buktiPencairan', // Field untuk file upload
        };

        return fieldMap[backendField] || backendField;
    };
    // Format currency untuk mobile
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Metode pembayaran options
    const metodePembayaranOptions = [
        {
            value: "CASH" as MetodePembayaran,
            label: "Tunai",
            icon: CreditCard,
            description: "Pembayaran secara tunai"
        },
        {
            value: "BANK_TRANSFER" as MetodePembayaran,
            label: "Transfer Bank",
            icon: Banknote,
            description: "Transfer melalui bank"
        },
        {
            value: "E_WALLET" as MetodePembayaran,
            label: "E-Wallet",
            icon: Wallet,
            description: "Pembayaran digital"
        }
    ];

    const hasBuktiPencairan = form.watch("buktiPencairanUrl") || selectedFile;

    return (
        <div className="min-h-screen pb-8 bg-slate-50 dark:bg-slate-900">
            {/* Header Mobile Optimized */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-4 md:p-6 rounded-lg md:rounded-lg mb-4 md:mb-6 shadow-lg">
                <div className="flex flex-col space-y-3">
                    <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 md:h-6 md:w-6 text-blue-200" />
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Request Approval</h1>
                    </div>
                    <p className="text-blue-100 text-sm md:text-base leading-relaxed">
                        Buat pengajuan uang muka untuk kebutuhan project
                    </p>
                </div>
            </div>

            {Object.keys(backendErrors).length > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <h4 className="font-semibold text-red-900 dark:text-red-100 text-sm mb-2 flex items-center space-x-2">
                        <span>⚠️ Error Validasi dari Server</span>
                    </h4>
                    <ul className="text-xs text-red-800 dark:text-red-200 space-y-1">
                        {Object.entries(backendErrors).map(([field, message]) => (
                            <li key={field}>• {message}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="px-0 md:px-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-4 md:space-y-6">
                        {/* Pilih Purchase Request - Mobile Optimized */}
                        <FormField
                            control={form.control}
                            name="purchaseRequestId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium flex items-center space-x-2 pb-4">
                                        <FileText className="h-4 w-4" />
                                        <span>Purchase Request</span>
                                    </FormLabel>
                                    <Select
                                        onValueChange={(value: string) => {
                                            field.onChange(value);
                                            handlePurchaseRequestChange(value);
                                        }}
                                        value={field.value || idFromUrl || ""} // <-- gunakan idFromUrl sebagai default
                                    >
                                        <FormControl>
                                            <SelectTrigger className="h-12 text-base md:text-sm text-left">
                                                <SelectValue placeholder="Pilih Purchase Request" />
                                                <ChevronDown className="h-4 w-4 opacity-50 ml-auto" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="max-h-60 w-full">
                                            {/* Tambahkan opsi idFromUrl jika belum ada di list */}
                                            {idFromUrl && !approvedPurchaseRequests.find(pr => pr.id === idFromUrl) && (
                                                <SelectItem value={idFromUrl} className="py-3 pr-4">
                                                    <div className="flex flex-col space-y-1 w-full">
                                                        <span className="font-medium text-sm truncate">PR ID: {idFromUrl}</span>
                                                        <div className="text-xs text-muted-foreground space-y-0.5">
                                                            <div className="flex items-center space-x-1 min-w-0">
                                                                <Building className="h-3 w-3 flex-shrink-0" />
                                                                <span className="truncate">N/A</span>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <span>Total:</span>
                                                                <span className="font-medium truncate">N/A</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            )}

                                            {approvedPurchaseRequests.map((pr) => (
                                                <SelectItem key={pr.id} value={pr.id} className="py-3 pr-4">
                                                    <div className="flex flex-col space-y-1 w-full">
                                                        <span className="font-medium text-sm truncate">{pr.nomorPr}</span>
                                                        <div className="text-xs text-muted-foreground space-y-0.5">
                                                            <div className="flex items-center space-x-1 min-w-0">
                                                                <Building className="h-3 w-3 flex-shrink-0" />
                                                                <span className="truncate">{pr.project?.name || 'N/A'}</span>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <span>Total:</span>
                                                                <span className="font-medium truncate">
                                                                    {formatCurrency(calculateTotalAmount(pr))}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            ))}

                                            {approvedPurchaseRequests.length === 0 && !idFromUrl && (
                                                <div className="p-3 text-center text-muted-foreground text-sm">
                                                    Tidak ada purchase request yang tersedia
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="text-xs" />
                                </FormItem>

                            )}
                        />

                        {/* Preview Selected PR Details - Mobile Compact */}
                        {selectedPRData && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2 flex items-center space-x-2">
                                    <FileText className="h-4 w-4" />
                                    <span>Detail Purchase Request</span>
                                </h4>
                                <div className="space-y-2 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-gray-600">Project:</span>
                                        <span>{selectedPRData.project?.name || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-gray-600">SPK:</span>
                                        <span>{selectedPRData.spk?.spkNumber || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-gray-600">Diajukan Oleh:</span>
                                        <span>{selectedPRData.karyawan?.namaLengkap || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-1 border-t border-blue-200">
                                        <span className="font-bold ">Total Amount:</span>
                                        <span className="font-bold">
                                            {formatCurrency(calculateTotalAmount(selectedPRData))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Jumlah Uang Muka */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Jumlah Uang Muka */}
                            <FormField
                                control={form.control}
                                name="jumlah"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-medium">Jumlah Uang Muka</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                                    Rp
                                                </span>
                                                <Input
                                                    type="number"
                                                    placeholder="0"
                                                    value={field.value || 0}
                                                    onChange={(e) => {
                                                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                                        field.onChange(isNaN(value) ? 0 : value);
                                                    }}
                                                    min="0"
                                                    step="0.01"
                                                    className="h-12 text-base pl-10 pr-4"
                                                />
                                            </div>
                                        </FormControl>
                                        <div className="text-sm text-green-500 mt-1 ml-3">
                                            {field.value ? formatCurrency(Number(field.value)) : 'Rp 0'}
                                        </div>
                                        <FormMessage className="text-sm font-semibold" />
                                    </FormItem>
                                )}
                            />

                            {/* Metode Pencairan */}
                            <FormField
                                control={form.control}
                                name="metodePencairan"
                                render={({ field }) => {
                                    const selectedOption = metodePembayaranOptions.find(opt => opt.value === field.value);
                                    return (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium flex items-center space-x-2">
                                                <CreditCard className="h-4 w-4" />
                                                <span>Metode Pencairan</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Select
                                                    onValueChange={(value: MetodePembayaran) => {
                                                        field.onChange(value);
                                                        handleMetodePembayaranChange(value);
                                                    }}
                                                    value={field.value}
                                                >
                                                    <SelectTrigger className="h-12 text-base md:text-sm">
                                                        <SelectValue placeholder="Pilih Metode Pencairan" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {metodePembayaranOptions.map((option) => {
                                                            const Icon = option.icon;
                                                            return (
                                                                <SelectItem key={option.value} value={option.value} className="py-3">
                                                                    <div className="flex items-center space-x-3">
                                                                        <Icon className="h-4 w-4 text-blue-600" />
                                                                        <div className="flex flex-col">
                                                                            <span className="font-medium text-sm">{option.label}</span>
                                                                            <span className="text-xs text-muted-foreground">
                                                                                {option.description}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </SelectItem>
                                                            );
                                                        })}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <div className="text-xs text-green-500 mt-1 ml-3">
                                                Memilih metode pencairan dana dengan {selectedOption?.label || "–"}
                                            </div>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    );
                                }}
                            />

                        </div>

                        {/* Bank Transfer Fields */}
                        {selectedMetodePembayaran === "BANK_TRANSFER" && (
                            <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm flex items-center space-x-2">
                                    <Banknote className="h-4 w-4" />
                                    <span>Informasi Bank Tujuan</span>
                                </h4>

                                <FormField
                                    control={form.control}
                                    name="namaBankTujuan"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">
                                                Nama Bank
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Contoh: BCA, Mandiri, BNI, dll."
                                                    className="h-12 text-base"
                                                    {...field}
                                                    disabled={form.watch("metodePencairan") !== "BANK_TRANSFER"}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="nomorRekeningTujuan"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">
                                                Nomor Rekening
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Masukkan nomor rekening"
                                                    className="h-12 text-base"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        {/* E-Wallet Fields */}
                        {selectedMetodePembayaran === "E_WALLET" && (
                            <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <h4 className="font-semibold text-green-900 dark:text-green-100 text-sm flex items-center space-x-2">
                                    <Wallet className="h-4 w-4" />
                                    <span>Informasi E-Wallet</span>
                                </h4>

                                <FormField
                                    control={form.control}
                                    name="namaEwalletTujuan"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">
                                                Nama E-Wallet / No. Telepon
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Contoh: GoPay, OVO, Dana, atau nomor telepon"
                                                    className="h-12 text-base"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        {/* Upload Bukti Pencairan */}
                        <FormField
                            control={form.control}
                            name="buktiPencairanUrl"
                            render={() => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium flex items-center space-x-2">
                                        <Upload className="h-4 w-4" />
                                        <span>Bukti Pencairan (Opsional)</span>
                                    </FormLabel>

                                    {/* Upload Area */}
                                    <div className="space-y-3">
                                        {!hasBuktiPencairan ? (
                                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    onChange={handleFileSelect} // Ganti ke handleFileSelect
                                                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                                                    className="hidden"
                                                />
                                                <div
                                                    className="flex flex-col items-center space-y-2"
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <ImageIcon className="h-8 w-8 text-gray-400" />
                                                    <div className="text-sm">
                                                        <span className="text-blue-600 font-medium">Klik untuk memilih file</span>
                                                        <span className="text-gray-500"> atau drag and drop</span>
                                                    </div>
                                                    <p className="text-xs text-gray-400">
                                                        PNG, JPG, WebP, PDF (max. 5MB)
                                                    </p>
                                                    <p className="text-xs text-blue-400 mt-1">
                                                        File akan diupload bersamaan dengan form
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                        {previewUrl ? (
                                                            <Image
                                                                src={previewUrl}
                                                                alt="Preview"
                                                                width={40}
                                                                height={40}
                                                                className="object-cover rounded"
                                                            />
                                                        ) : (
                                                            <FileText className="h-10 w-10 text-gray-400" />
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">
                                                                {selectedFile?.name || 'File dipilih'}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'File siap diupload'}
                                                            </p>
                                                            <p className="text-xs text-green-600 mt-1">
                                                                ✓ File siap diupload bersamaan dengan form
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
                                                                className="h-8"
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
                                                            disabled={isUploading}
                                                            className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />

                        {/* Tanggal Pencairan (Opsional) */}
                        <FormField
                            control={form.control}
                            name="tanggalPencairan"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium flex items-center space-x-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>Tanggal Pencairan (Opsional)</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="date"
                                            value={field.value ? new Date(field.value).toISOString().split("T")[0] : ""}
                                            onChange={(e) => {
                                                const date = e.target.value ? new Date(e.target.value) : null;
                                                field.onChange(date);
                                            }}
                                            className="h-12 text-base"
                                        />
                                    </FormControl>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Kosongkan jika belum tahu tanggal pencairan
                                    </div>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />

                        {/* Keterangan */}
                        <FormField
                            control={form.control}
                            name="keterangan"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium ">
                                        Keterangan
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Tambahkan keterangan pengajuan uang muka..."
                                            className="resize-none text-sm min-h-[100px] md:min-h-[120px]"
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />

                        {/* Tanggal Pengajuan */}
                        <FormField
                            control={form.control}
                            name="tanggalPengajuan"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium  flex items-center space-x-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>Tanggal Pengajuan</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="date"
                                            value={
                                                field.value
                                                    ? new Date(field.value).toISOString().split("T")[0]
                                                    : new Date().toISOString().split("T")[0]
                                            }
                                            onChange={(e) => {
                                                const date = e.target.value ? new Date(e.target.value) : new Date();
                                                field.onChange(date);
                                            }}
                                            className="h-12 text-base"
                                        />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />

                        {/* Hidden fields */}
                        <FormField
                            control={form.control}
                            name="spkId"
                            render={({ field }) => (
                                <FormItem className="hidden">
                                    <FormControl>
                                        <Input
                                            type="hidden"
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="karyawanId"
                            render={({ field }) => (
                                <FormItem className="hidden">
                                    <FormControl>
                                        <Input
                                            type="hidden"
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        {/* Validation Summary */}
                        {!selectedPurchaseRequest && (
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <p className="text-amber-800 dark:text-amber-200 text-xs leading-relaxed">
                                    ⓘ Silakan pilih Purchase Request terlebih dahulu untuk melanjutkan
                                </p>
                            </div>
                        )}

                        {/* Action Buttons - Mobile Bottom Friendly */}
                        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 md:static md:bg-transparent md:p-0 md:flex md:justify-end md:gap-4 md:pt-6 md:border-t">
                            <div className="grid grid-cols-2 gap-3 md:flex md:gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                     onClick={() => router.back()} 
                                    disabled={isSubmitting || isUploading}
                                    className="h-12 text-sm md:h-10"
                                    size="sm"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || !selectedPurchaseRequest || isUploading}
                                    className="h-12 text-sm bg-blue-600 hover:bg-blue-700 md:h-10 text-white"
                                    size="sm"
                                >
                                    {(isSubmitting || isUploading) ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            {isUploading ? "Mengupload..." : "Membuat..."}
                                        </>
                                    ) : (
                                        "Approval Request"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </div>

            {/* Bottom spacing untuk mobile */}
            <div className="h-20 md:h-0"></div>
        </div>
    );
}