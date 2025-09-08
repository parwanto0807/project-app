import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { User, Briefcase, ShieldCheck, Loader2, Camera, Upload, X, ArrowLeft } from 'lucide-react';
import { employeeFormSchema, type EmployeeFormValues } from '@/schemas';
import Image from 'next/image';
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from 'sonner';
import { fetchKaryawanById } from '@/lib/action/master/karyawan';
import { makeImageSrc } from '@/utils/makeImageSrc';

function getBasePath(role?: string) {
    return role === "super"
        ? "/super-admin-area/master/karyawan"
        : "/admin-area/master/karyawan"
}

export default function UpdateEmployeeForm({ employee, role, id }: { employee: string; role: string; id: string }) {
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();
    const fromPage = searchParams.get('from') || 'list';

    const form = useForm({
        resolver: zodResolver(employeeFormSchema),
        defaultValues: {
            nik: "",
            namaLengkap: "",
            email: "",
            nomorTelepon: "",
            alamat: "",
            jabatan: "",
            departemen: "",
            statusKerja: "",
            tipeKontrak: "",
            userId: undefined,
            gajiPokok: 0,
            tunjangan: 0,
            potongan: 0,
            isActive: true,
            tanggalLahir: undefined,
            tanggalMasuk: undefined,
            tanggalKeluar: undefined,
            foto: undefined,
            teamIds: [],
        },
    });

    // Fetch data karyawan saat komponen mount
    useEffect(() => {
        const fetchEmployeeData = async () => {
            try {
                setIsDataLoading(true);

                const res = await fetchKaryawanById(employee);
                const employeeData = res.karyawan;

                form.reset({
                    ...employeeData,
                    tanggalLahir: employeeData.tanggalLahir ? new Date(employeeData.tanggalLahir) : undefined,
                    tanggalMasuk: employeeData.tanggalMasuk ? new Date(employeeData.tanggalMasuk) : undefined,
                    tanggalKeluar: employeeData.tanggalKeluar ? new Date(employeeData.tanggalKeluar) : undefined,
                });

                // kalau ada foto, set ke state
                if (employeeData.foto) {
                    setFilePreview(employeeData.foto);
                }
            } catch (error) {
                console.error("Error fetching employee data:", error);
                toast.error(error instanceof Error ? error.message : "Failed to fetch employee.");
                router.back();
            } finally {
                setIsDataLoading(false);
            }
        };

        fetchEmployeeData();
    }, [id, form, router, employee]);

    console.log("data image", filePreview)

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        onChange: (value: File | undefined) => void
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        onChange(file);

        // Buat preview
        const reader = new FileReader();
        reader.onload = () => setFilePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    async function onSubmit(values: EmployeeFormValues) {
        setIsLoading(true);

        const formData = new FormData();

        // Serialize semua field ke FormData
        Object.entries(values).forEach(([key, value]) => {
            if (value === undefined || value === null) return;

            if (value instanceof Date) {
                formData.append(key, value.toISOString());
            } else if (key === "foto" && value instanceof File) {
                formData.append("foto", value, value.name);
            } else if (Array.isArray(value)) {
                value.forEach((v) => formData.append(`${key}[]`, v));
            } else {
                formData.append(key, value.toString());
            }
        });

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/karyawan/updateKaryawan/${id}`, {
                method: "PUT",
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Gagal memperbarui karyawan");
            }

            // Tampilkan toast notification
            toast.success("Employee created successfully ✨");
            // Redirect sesuai halaman asal
            const basePath = getBasePath(role);
            if (fromPage === 'detail') {
                router.push(`${basePath}/${id}`);
            } else {
                router.push(basePath);
            }
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : "Failed to create employee.");
        } finally {
            setIsLoading(false);
        }
    }

    if (isDataLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Memuat data karyawan...</p>
                </div>
            </div>
        );
    }

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <Button
                            variant="ghost"
                            className="mb-2"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Button>
                        <CardTitle>Form Update Karyawan</CardTitle>
                        <CardDescription>Perbarui detail karyawan di bawah ini.</CardDescription>
                    </div>
                    <div className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                        Mode Edit
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                        {/* --- Group: Informasi Pribadi --- */}
                        <div className="space-y-4 p-4 border rounded-lg">
                            <h3 className="text-lg font-semibold flex items-center text-blue-600">
                                <User className="mr-2 h-5 w-5" />
                                Informasi Pribadi
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField name="nik" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel>NIK</FormLabel><FormControl><Input placeholder="Contoh: 11223344" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField name="namaLengkap" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel>Nama Lengkap</FormLabel><FormControl><Input placeholder="Contoh: Budi Santoso" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField name="email" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="contoh@perusahaan.com" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField name="nomorTelepon" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel>Nomor Telepon</FormLabel><FormControl><Input placeholder="Contoh: 08123456789" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField
                                    name="tanggalLahir"
                                    control={form.control}
                                    render={({ field }) => {
                                        const parseDateFromInput = (value: string): Date | undefined => {
                                            const date = new Date(value);
                                            if (isNaN(date.getTime())) return undefined;
                                            return date;
                                        };
                                        const formatDateForInput = (date?: Date | null): string => {
                                            if (!date || date === null) return "";
                                            const year = date.getFullYear();
                                            const month = String(date.getMonth() + 1).padStart(2, "0");
                                            const day = String(date.getDate()).padStart(2, "0");
                                            return `${year}-${month}-${day}`;
                                        };

                                        return (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Tanggal Lahir</FormLabel>
                                                <FormDescription className='text-teal-600 text-xs'>Tahun Bulan Hari</FormDescription>
                                                <Input
                                                    type="date"
                                                    className="mt-2 border px-3 py-2 rounded-md text-sm"
                                                    value={formatDateForInput(field.value)}
                                                    onChange={(e) => {
                                                        const date = parseDateFromInput(e.target.value);
                                                        if (
                                                            date &&
                                                            date <= new Date() &&
                                                            date >= new Date("1930-01-01")
                                                        ) {
                                                            field.onChange(date);
                                                        } else {
                                                            field.onChange(undefined);
                                                        }
                                                    }}
                                                />

                                                <FormMessage />
                                            </FormItem>
                                        );
                                    }}
                                />
                                <FormField name="alamat" control={form.control} render={({ field }) => (
                                    <FormItem className="md:col-span-2"><FormLabel>Alamat</FormLabel><FormControl><Textarea placeholder="Masukkan alamat lengkap..." {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                        </div>

                        {/* --- Group: Informasi Pekerjaan --- */}
                        <div className="space-y-4 p-4 border rounded-lg">
                            <h3 className="text-lg font-semibold flex items-center text-green-600">
                                <Briefcase className="mr-2 h-5 w-5" />
                                Informasi Pekerjaan
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField name="jabatan" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel>Jabatan</FormLabel><FormControl><Input placeholder="Contoh: Software Engineer" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField name="departemen" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel>Departemen</FormLabel><FormControl><Input placeholder="Contoh: Teknologi Informasi" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField
                                    name="tanggalMasuk"
                                    control={form.control}
                                    render={({ field }) => {
                                        const parseDateFromInput = (value: string): Date | undefined => {
                                            const date = new Date(value);
                                            return isNaN(date.getTime()) ? undefined : date;
                                        };

                                        const formatDateForInput = (date?: Date): string => {
                                            if (!date) return "";
                                            const year = date.getFullYear();
                                            const month = String(date.getMonth() + 1).padStart(2, "0");
                                            const day = String(date.getDate()).padStart(2, "0");
                                            return `${year}-${month}-${day}`;
                                        };

                                        return (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Tanggal Masuk</FormLabel>
                                                <Input
                                                    type="date"
                                                    min="1930-01-01"
                                                    max={formatDateForInput(new Date())}
                                                    className="mt-2 border px-3 py-2 rounded-md text-sm"
                                                    value={formatDateForInput(field.value)}
                                                    onChange={(e) => {
                                                        const date = parseDateFromInput(e.target.value);
                                                        if (date) {
                                                            field.onChange(date);
                                                        } else {
                                                            field.onChange(undefined);
                                                        }
                                                    }}
                                                />
                                                <FormMessage />
                                            </FormItem>
                                        );
                                    }}
                                />

                                <FormField name="statusKerja" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel>Status Kerja</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Pilih status" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="aktif">Aktif</SelectItem>
                                                <SelectItem value="non-aktif">Non-Aktif</SelectItem>
                                                <SelectItem value="cuti">Cuti</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage /></FormItem>
                                )} />
                            </div>
                        </div>

                        {/* --- Group: Informasi HR & Akun --- */}
                        <div className="space-y-4 p-4 border rounded-lg">
                            <h3 className="text-lg font-semibold flex items-center text-purple-600">
                                <ShieldCheck className="mr-2 h-5 w-5" />
                                Informasi HR & Akun
                            </h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <FormField name="tipeKontrak" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel>Tipe Kontrak</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Pilih tipe kontrak" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="tetap">Karyawan Tetap</SelectItem>
                                                <SelectItem value="kontrak">Kontrak</SelectItem>
                                                <SelectItem value="magang">Magang</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage /></FormItem>
                                )} />
                                <FormField name="gajiPokok" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel>Gaji Pokok</FormLabel><FormControl><Input type="number" placeholder="Contoh: 5000000" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField name="tunjangan" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel>Tunjangan</FormLabel><FormControl><Input type="number" placeholder="Contoh: 1000000" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField name="potongan" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel>Potongan</FormLabel><FormControl><Input type="number" placeholder="Contoh: 100000" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField name="userId" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel>User ID (untuk login)</FormLabel><FormControl><Input placeholder="ID unik pengguna" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField name="isActive" control={form.control} render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 mt-4 md:mt-0">
                                        <div className="space-y-0.5"><FormLabel>Akun Aktif</FormLabel><FormDescription>Non-aktifkan jika karyawan belum bisa login.</FormDescription></div>
                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    </FormItem>
                                )} />
                            </div>
                        </div>

                        {/* --- Group: Foto Karyawan --- */}
                        <div className="space-y-4 p-4 border rounded-lg">
                            <h3 className="text-lg font-semibold flex items-center text-orange-600">
                                <Camera className="mr-2 h-5 w-5" />
                                Foto Karyawan
                            </h3>
                            <FormField
                                control={form.control}
                                name="foto"
                                render={({ field: { value, onChange, ...fieldProps } }) => (
                                    <FormItem>
                                        <FormLabel>Upload Foto</FormLabel>
                                        <FormControl>
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                                {/* Preview Area */}
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center overflow-hidden bg-gray-100">
                                                        {filePreview ? (
                                                            <div className="relative w-full h-full">
                                                                <Image
                                                                    src={makeImageSrc(filePreview)}
                                                                    alt="Preview foto karyawan"
                                                                    fill
                                                                    className="object-cover"
                                                                    unoptimized
                                                                    onError={() => {
                                                                        console.error("Gagal load:", filePreview);
                                                                    }}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                                <Camera className="h-8 w-8 mb-1" />
                                                                <span className="text-xs">No Image</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {value instanceof File && (
                                                        <span className="text-sm text-muted-foreground text-center max-w-32 truncate">
                                                            {value.name}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Upload Controls */}
                                                <div className="flex flex-col gap-3">
                                                    <label
                                                        htmlFor="file-upload"
                                                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90 transition-colors"
                                                    >
                                                        <Upload className="h-4 w-4" />
                                                        <span>{filePreview ? 'Ganti Foto' : 'Pilih Foto'}</span>
                                                        <Input
                                                            id="file-upload"
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={(e) => handleFileChange(e, onChange)}
                                                            {...fieldProps}
                                                        />
                                                    </label>

                                                    {filePreview && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                onChange(undefined); // Gunakan undefined bukan null
                                                                setFilePreview(null);
                                                            }}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <X className="h-4 w-4" />
                                                            Hapus Foto
                                                        </Button>
                                                    )}

                                                    <p className="text-xs text-muted-foreground max-w-64">
                                                        Format: JPG, PNG, atau GIF. Maksimal 2MB.
                                                        Disarankan foto persegi untuk hasil terbaik.
                                                    </p>
                                                </div>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 p-0 pt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                className="w-full sm:w-auto"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Batal
                            </Button>
                            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                                {isLoading ? (
                                    <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memperbarui... </>
                                ) : ("Perbarui Karyawan")}
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}