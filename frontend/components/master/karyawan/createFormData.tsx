import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { User, Briefcase, ShieldCheck, CalendarIcon, Loader2, Camera, Upload, X } from 'lucide-react';
import { employeeFormSchema, type EmployeeFormValues } from '@/schemas';
import Image from 'next/image';

export default function CreateEmployeeForm({ role }: { role: string }) {
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{ success: boolean; message: string }>({ success: false, message: '' });

    console.log("Role", role)
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
            userId: "",
            gajiPokok: 0,
            tunjangan: 0,
            potongan: 0,
            isActive: true,       // ✅ boolean harus fix, bukan undefined
            tanggalLahir: undefined,
            tanggalMasuk: undefined,
            tanggalKeluar: undefined,
            foto: undefined,
            teamIds: [],
        },
    });

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        onChange: (value: File | undefined) => void
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        onChange(file); // simpan file di react-hook-form

        // Buat preview
        const reader = new FileReader();
        reader.onload = () => setFilePreview(reader.result as string);
        reader.readAsDataURL(file);
    };


    async function onSubmit(values: EmployeeFormValues) {
        setIsLoading(true);
        setSubmitStatus({ success: false, message: '' });

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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/karyawan/createKaryawan`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Gagal menyimpan karyawan");
            }

            setSubmitStatus({ success: true, message: "Karyawan berhasil dibuat!" });
            form.reset();
            setFilePreview(null);
        } catch (err) {
            console.error(err);
            setSubmitStatus({
                success: false,
                message: err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan data"
            });
        } finally {
            setIsLoading(false);
        }
    }


    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Form Tambah Karyawan Baru</CardTitle>
                <CardDescription>Isi detail di bawah ini untuk mendaftarkan karyawan baru.</CardDescription>
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
                                <FormField name="tanggalLahir" control={form.control} render={({ field }) => (
                                    <FormItem className="flex flex-col"><FormLabel>Tanggal Lahir</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                        {field.value ? (
                                                            new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(field.value)
                                                        ) : (
                                                            <span>Pilih tanggal</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1930-01-01")} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage /></FormItem>
                                )} />
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
                                <FormField name="tanggalMasuk" control={form.control} render={({ field }) => (
                                    <FormItem className="flex flex-col"><FormLabel>Tanggal Masuk</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                        {field.value ? (
                                                            new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(field.value)
                                                        ) : (
                                                            <span>Pilih tanggal</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                                        </Popover>
                                        <FormMessage /></FormItem>
                                )} />
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
                                    <FormItem><FormLabel>User ID (untuk login)</FormLabel><FormControl><Input placeholder="ID unik pengguna" {...field} /></FormControl><FormMessage /></FormItem>
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
                                                            <Image
                                                                src={filePreview}
                                                                alt="Preview foto karyawan"
                                                                fill
                                                                className="object-cover"
                                                            />
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
                                                                onChange(null);
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

                        <CardFooter className="flex justify-end p-0 pt-6">
                            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                                {isLoading ? (
                                    <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mohon Tunggu... </>
                                ) : ("Simpan Karyawan")}
                            </Button>
                        </CardFooter>

                        {submitStatus.message && (
                            <div className={`mt-4 text-sm p-3 rounded-md ${submitStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {submitStatus.message}
                            </div>
                        )}
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}