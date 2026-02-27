"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Trash2,
    MoveUp,
    MoveDown,
    FileText,
    Save,
    ArrowLeft,
    Layout,
    Info,
    User,
    Users,
    Check,
    FileCheck,
    HelpCircle,
    ChevronDown,
    Menu,
    PlusCircle,
    Settings,
    Activity,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { cn } from "@/lib/utils";

const itemSchema = z.object({
    content: z.string().min(1, "Konten item wajib diisi"),
    itemNumber: z.string().optional(),
    orderIndex: z.number(),
});

const sectionSchema = z.object({
    title: z.string().min(1, "Judul bagian wajib diisi"),
    content: z.string().nullable().optional().or(z.literal("")),
    orderIndex: z.number(),
    items: z.array(itemSchema),
});

const formSchema = z.object({
    title: z.string().min(1, "Judul dokumen wajib diisi"),
    type: z.enum(["JOB_DESCRIPTION", "SOP"]),
    status: z.enum(["DRAFT", "ACTIVE", "RETIRED"]),
    version: z.string().min(1, "Versi wajib diisi"),
    content: z.string().optional(),
    departments: z.array(
        z.object({
            code: z.string().min(1, "Departement wajib dipilih"),
            isPrimary: z.boolean(),
        })
    ),
    employeeIds: z.array(z.string()),
    sections: z.array(sectionSchema),
});

type FormValues = z.infer<typeof formSchema>;

export default function DocumentForm({
    initialData,
    role,
}: {
    initialData?: any;
    role: string;
}) {
    const router = useRouter();
    const [departments, setDepartments] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: initialData?.title || "",
            type: initialData?.type || "JOB_DESCRIPTION",
            status: (initialData?.status as any) || "DRAFT",
            version: initialData?.version || "1.0",
            content: initialData?.content || "",
            departments: initialData?.departments?.map((d: any) => ({
                code: d.department?.code || d.code || "",
                isPrimary: d.isPrimary
            })) || [{ code: "", isPrimary: true }],
            employeeIds: initialData?.employees?.map((e: any) => e.karyawanId) || [],
            sections: (initialData?.sections as any)?.map((s: any) => ({
                title: s.title || "",
                content: s.content || "",
                orderIndex: s.orderIndex || 0,
                items: s.items?.map((item: any) => ({
                    content: item.content || "",
                    itemNumber: item.itemNumber || "•",
                    orderIndex: item.orderIndex || 0,
                })) || []
            })) || [
                    {
                        title: "Identifikasi Jabatan",
                        orderIndex: 0,
                        items: [{ content: "", itemNumber: "•", orderIndex: 0 }],
                    },
                ],
        } as FormValues,
    });

    const {
        fields: sectionFields,
        append: appendSection,
        remove: removeSection,
        move: moveSection,
    } = useFieldArray({
        control: form.control,
        name: "sections",
    });

    const {
        fields: deptFields,
        append: appendDept,
        remove: removeDept,
    } = useFieldArray({
        control: form.control,
        name: "departments",
    });

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/master/documents/departments`,
                    { withCredentials: true }
                );
                setDepartments(response.data);
            } catch (error) {
                console.error("Gagal mengambil departemen:", error);
            }
        };
        const fetchEmployees = async () => {
            try {
                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/master/documents/employees`,
                    { withCredentials: true }
                );
                setEmployees(response.data);
            } catch (error) {
                console.error("Gagal mengambil karyawan:", error);
            }
        };
        fetchDepartments();
        fetchEmployees();
    }, []);

    const onSubmit = async (values: FormValues) => {
        setIsSubmitting(true);
        try {
            const url = initialData
                ? `${process.env.NEXT_PUBLIC_API_URL}/api/master/documents/${initialData.id}`
                : `${process.env.NEXT_PUBLIC_API_URL}/api/master/documents`;

            const method = initialData ? "put" : "post";

            await axios[method](url, values as any, { withCredentials: true });

            toast.success(initialData ? "Dokumen berhasil diperbarui" : "Dokumen berhasil dibuat");
            router.push(role === "super" ? "/super-admin-area/master/documents" : "/admin-area/master/documents");
        } catch (error: any) {
            console.error("Submission error:", error);
            toast.error(error.response?.data?.message || "Terjadi kesalahan saat menyimpan dokumen");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                            {initialData ? "Edit Dokumen" : "Buat Dokumen Baru"}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Kelola Job Description dan SOP perusahaan secara profesional.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl px-4"
                        >
                            <ArrowLeft size={18} /> Kembali
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 border-none px-6 h-11 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isSubmitting ? (
                                <Activity className="animate-spin h-5 w-5" />
                            ) : (
                                <Save size={18} />
                            )}
                            <span className="font-semibold">{isSubmitting ? "Menyimpan..." : "Simpan Dokumen"}</span>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-2xl overflow-hidden">
                            <CardHeader className="bg-gray-50/50 border-b border-gray-100/80 px-8 py-6">
                                <CardTitle className="flex items-center gap-3 text-lg font-bold">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                                        <Info size={20} />
                                    </div>
                                    Informasi Dasar Dokumen
                                </CardTitle>
                                <CardDescription className="pl-11">
                                    Berikan identitas utama untuk dokumen ini.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Judul Dokumen</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Contoh: SOP Pengajuan Cuti Karyawan"
                                                    className="h-12 bg-gray-50/30 border-gray-200 focus-visible:ring-blue-500/30 rounded-xl"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Tipe Dokumen</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-12 bg-gray-50/30 border-gray-200 focus:ring-blue-500/30 rounded-xl">
                                                            <SelectValue placeholder="Pilih Tipe" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                                        <SelectItem value="JOB_DESCRIPTION" className="py-3 rounded-lg">Job Description</SelectItem>
                                                        <SelectItem value="SOP" className="py-3 rounded-lg">Standard Operating Procedure (SOP)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="version"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Nomor Versi / No. Form</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Contoh: v1.0 atau No.001/SOP/HR"
                                                        className="h-12 bg-gray-50/30 border-gray-200 focus-visible:ring-blue-500/30 rounded-xl"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="content"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Ringkasan / Tujuan (Opsional)</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Jelaskan secara singkat tujuan dari dokumen ini..."
                                                    className="min-h-[120px] bg-gray-50/30 border-gray-200 focus-visible:ring-blue-500/30 rounded-xl resize-none py-4"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Layout size={20} className="text-blue-500" />
                                    Struktur & Konten
                                </h3>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => appendSection({ title: "", orderIndex: sectionFields.length, items: [] })}
                                    className="border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl px-4 flex items-center gap-2 h-9"
                                >
                                    <PlusCircle size={16} /> Tambah Bagian Baru
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {sectionFields.map((section, sectionIndex) => (
                                    <Card key={section.id} className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-2xl overflow-hidden group/section">
                                        <div className="bg-gray-50/80 px-6 py-4 flex items-center justify-between border-b border-gray-100">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="h-8 w-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center font-bold text-gray-400 text-sm">
                                                    {sectionIndex + 1}
                                                </div>
                                                <div className="flex-1 max-w-md">
                                                    <FormField
                                                        control={form.control}
                                                        name={`sections.${sectionIndex}.title`}
                                                        render={({ field }) => (
                                                            <Input
                                                                placeholder="Judul Bagian (Contoh: Kualifikasi Dasar)"
                                                                className="h-9 bg-transparent border-none focus-visible:ring-0 font-bold p-0 text-gray-900"
                                                                {...field}
                                                            />
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 rounded-lg"
                                                    onClick={() => moveSection(sectionIndex, sectionIndex - 1)}
                                                    disabled={sectionIndex === 0}
                                                >
                                                    <MoveUp size={14} className="text-gray-400" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 rounded-lg"
                                                    onClick={() => moveSection(sectionIndex, sectionIndex + 1)}
                                                    disabled={sectionIndex === sectionFields.length - 1}
                                                >
                                                    <MoveDown size={14} className="text-gray-400" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                                                    onClick={() => removeSection(sectionIndex)}
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </div>
                                        <CardContent className="p-6">
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Poin Utama / Detail Item</span>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            const currentItems = form.getValues(`sections.${sectionIndex}.items`) || [];
                                                            form.setValue(`sections.${sectionIndex}.items`, [
                                                                ...currentItems,
                                                                { content: "", itemNumber: "•", orderIndex: currentItems.length }
                                                            ]);
                                                        }}
                                                        className="text-blue-500 hover:bg-blue-50 h-8 rounded-lg text-xs"
                                                    >
                                                        <Plus size={14} className="mr-1" /> Tambah Poin
                                                    </Button>
                                                </div>

                                                <DocumentItems
                                                    sectionIndex={sectionIndex}
                                                    control={form.control}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {sectionFields.length === 0 && (
                                <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                                    <div className="bg-white h-16 w-16 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                        <Layout className="h-8 w-8 text-gray-300" />
                                    </div>
                                    <p className="text-gray-500 font-bold">Struktur Kosong</p>
                                    <p className="text-xs text-gray-400 mt-1 mb-6">Mulai tambahkan bagian dokumen Anda untuk memudahkan pembaca.</p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => appendSection({ title: "", orderIndex: 0, items: [] })}
                                        className="rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50"
                                    >
                                        Tambah Bagian Pertama
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Settings */}
                    <div className="space-y-8">
                        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-2xl overflow-hidden h-fit">
                            <CardHeader className="bg-gray-50/50 border-b border-gray-100 px-6 py-5">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Settings size={18} className="text-gray-400" />
                                    Pengaturan Terbit
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-8">
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Status Publikasi</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11 bg-gray-50/30 border-gray-200 focus:ring-blue-500/30 rounded-xl">
                                                        <SelectValue placeholder="Pilih Status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                                    <SelectItem value="DRAFT" className="py-2.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-2 rounded-full bg-gray-400" />
                                                            <span className="font-medium">SIMPAN DRAFT</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="ACTIVE" className="py-2.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                                            <span className="font-medium">PUBLIKASIKAN (ACTIVE)</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="RETIRED" className="py-2.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-2 rounded-full bg-rose-500" />
                                                            <span className="font-medium">ARSIPKAN (RETIRED)</span>
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                            <Users size={14} /> Departemen Terkait
                                        </FormLabel>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => appendDept({ code: "", isPrimary: false })}
                                            className="text-blue-500 hover:bg-blue-50 h-7 rounded-lg text-[10px] font-bold"
                                        >
                                            <Plus size={12} className="mr-1" /> TAMBAH
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {deptFields.map((dept, index) => (
                                            <div key={dept.id} className="flex gap-2 group/dept animate-in fade-in slide-in-from-right-2">
                                                <FormField
                                                    control={form.control}
                                                    name={`departments.${index}.code`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex-1">
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger className="h-10 bg-gray-50/50 border-gray-100 focus:ring-blue-500/30 rounded-lg text-sm">
                                                                        <SelectValue placeholder="Pilih..." />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent className="rounded-xl border-gray-100 shadow-xl max-h-[300px]">
                                                                    {departments.map((d) => (
                                                                        <SelectItem key={d.code} value={d.code} className="py-2">
                                                                            <span className="font-medium">{d.code}</span> - <span className="text-xs text-gray-500">{d.name}</span>
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-10 w-10 shrink-0 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                                    onClick={() => removeDept(index)}
                                                    disabled={deptFields.length <= 1}
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-gray-50">
                                    <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                            <User size={14} /> Karyawan Spesifik
                                        </FormLabel>
                                        <div className="h-4 w-4 rounded-full bg-blue-50 flex items-center justify-center text-[8px] font-bold text-blue-500">
                                            {form.watch("employeeIds").length}
                                        </div>
                                    </div>
                                    <CardDescription className="text-[10px] leading-relaxed italic">
                                        Kosongkan jika berlaku untuk seluruh departemen yang dipilih.
                                    </CardDescription>

                                    <div className="max-h-[250px] overflow-y-auto space-y-1.5 p-3 border border-gray-100 rounded-xl bg-gray-50/50 scrollbar-thin scrollbar-thumb-gray-200">
                                        {employees.length > 0 ? employees.map((emp) => (
                                            <label
                                                key={emp.id}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all",
                                                    form.watch("employeeIds").includes(emp.id)
                                                        ? "bg-blue-600 shadow-md shadow-blue-500/20"
                                                        : "hover:bg-white border border-transparent hover:border-gray-200"
                                                )}
                                            >
                                                <div className="relative flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={form.watch("employeeIds").includes(emp.id)}
                                                        onChange={(e) => {
                                                            const current = form.getValues("employeeIds");
                                                            if (e.target.checked) {
                                                                form.setValue("employeeIds", [...current, emp.id]);
                                                            } else {
                                                                form.setValue("employeeIds", current.filter((id) => id !== emp.id));
                                                            }
                                                        }}
                                                        className="hidden"
                                                    />
                                                    <div className={cn(
                                                        "h-4 w-4 rounded flex items-center justify-center border transition-all",
                                                        form.watch("employeeIds").includes(emp.id)
                                                            ? "bg-white border-white"
                                                            : "bg-white border-gray-200 shadow-inner"
                                                    )}>
                                                        {form.watch("employeeIds").includes(emp.id) && <Check size={12} className="text-blue-600" />}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={cn(
                                                        "text-[11px] font-bold transition-colors",
                                                        form.watch("employeeIds").includes(emp.id) ? "text-white" : "text-gray-900"
                                                    )}>
                                                        {emp.namaLengkap}
                                                    </span>
                                                    <span className={cn(
                                                        "text-[9px] uppercase tracking-wider font-semibold opacity-70",
                                                        form.watch("employeeIds").includes(emp.id) ? "text-blue-50" : "text-gray-400"
                                                    )}>
                                                        {emp.jabatan || "Karyawan"}
                                                    </span>
                                                </div>
                                            </label>
                                        )) : (
                                            <div className="py-8 text-center animate-pulse">
                                                <Activity className="h-6 w-6 text-gray-200 mx-auto mb-2" />
                                                <p className="text-[10px] text-gray-400">Memuat data...</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="bg-gradient-to-br from-indigo-500/10 to-blue-500/5 border border-indigo-100 p-6 rounded-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 -mr-6 -mt-6 h-24 w-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-700" />
                            <h4 className="flex items-center gap-2 text-indigo-700 font-bold text-sm mb-3">
                                <HelpCircle size={16} />
                                Panduan Singkat
                            </h4>
                            <ul className="space-y-3">
                                <li className="flex gap-2 text-[11px] text-indigo-600/80 leading-relaxed">
                                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1 shrink-0" />
                                    <span>Gunakan <span className="font-bold underline decoration-indigo-200">No. Form</span> yang konsisten untuk sistem pengarsipan.</span>
                                </li>
                                <li className="flex gap-2 text-[11px] text-indigo-600/80 leading-relaxed">
                                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1 shrink-0" />
                                    <span>Posisikan <span className="font-bold underline decoration-indigo-200">Tujuan Jabatan</span> di bagian paling atas.</span>
                                </li>
                                <li className="flex gap-2 text-[11px] text-indigo-600/80 leading-relaxed">
                                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1 shrink-0" />
                                    <span>Status <span className="font-bold">ACTIVE</span> akan langsung memberitahukan karyawan terkait.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </form>
        </Form>
    );
}

function DocumentItems({ sectionIndex, control }: { sectionIndex: number; control: any }) {
    const { fields, remove, move } = useFieldArray({
        control,
        name: `sections.${sectionIndex}.items`,
    });

    return (
        <div className="space-y-4">
            {fields.map((item, itemIndex) => (
                <div key={item.id} className="flex gap-4 group/item items-start animate-in fade-in slide-in-from-left-2">
                    <div className="w-14 shrink-0 mt-1">
                        <FormField
                            control={control}
                            name={`sections.${sectionIndex}.items.${itemIndex}.itemNumber`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input
                                            placeholder="•"
                                            {...field}
                                            className="h-10 text-center font-bold bg-gray-50/50 border-gray-100 group-hover/item:border-blue-200 focus-visible:ring-blue-500/20 rounded-lg"
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="flex-1">
                        <FormField
                            control={control}
                            name={`sections.${sectionIndex}.items.${itemIndex}.content`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Tulis detail deskripsi pekerjaan atau standar prosedur..."
                                            {...field}
                                            className="min-h-[80px] bg-white border-gray-200 group-hover/item:border-blue-200 focus-visible:ring-blue-500/20 rounded-xl py-3 px-4 shadow-sm transition-all"
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover/item:opacity-100 transition-all duration-200 translate-x-2 group-hover/item:translate-x-0 pt-2">
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-md hover:bg-gray-100"
                            onClick={() => move(itemIndex, itemIndex - 1)}
                            disabled={itemIndex === 0}
                        >
                            <MoveUp size={14} className="text-gray-400" />
                        </Button>
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-md hover:bg-rose-50 text-rose-300 hover:text-rose-500"
                            onClick={() => remove(itemIndex)}
                        >
                            <Trash2 size={14} />
                        </Button>
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-md hover:bg-gray-100"
                            onClick={() => move(itemIndex, itemIndex + 1)}
                            disabled={itemIndex === fields.length - 1}
                        >
                            <MoveDown size={14} className="text-gray-400" />
                        </Button>
                    </div>
                </div>
            ))}

            {fields.length === 0 && (
                <div className="text-center py-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-100">
                    <p className="text-[10px] text-gray-400 italic">Belum ada poin detail. Klik tambah poin.</p>
                </div>
            )}
        </div>
    );
}
