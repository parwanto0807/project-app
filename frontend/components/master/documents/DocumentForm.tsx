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
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
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
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const itemSchema = z.object({
    content: z.string().min(1, "Konten item wajib diisi"),
    itemNumber: z.string().optional(),
    orderIndex: z.number(),
});

const sectionSchema = z.object({
    title: z.string().min(1, "Judul bagian wajib diisi"),
    content: z.string().optional(),
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
            sections: (initialData?.sections as any) || [
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="flex items-center justify-between">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft size={16} /> Kembali
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
                        <Save size={16} /> {isSubmitting ? "Menyimpan..." : "Simpan Dokumen"}
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="shadow-sm border-t-4 border-t-primary">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Info size={20} className="text-primary" />
                                    Informasi Dasar
                                </CardTitle>
                                <CardDescription>
                                    Detail utama dokumen JobDesk atau SOP
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Judul Dokumen</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Contoh: Job Description Staf Sales" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tipe</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Pilih Tipe" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="JOB_DESCRIPTION">Job Description</SelectItem>
                                                        <SelectItem value="SOP">SOP</SelectItem>
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
                                                <FormLabel>Versi</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="1.0" {...field} />
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
                                            <FormLabel>Deskripsi Singkat (Opsional)</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Penjelasan ringkas mengenai dokumen ini..."
                                                    className="min-h-[100px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Layout size={20} className="text-primary" />
                                        Struktur Dokumen (Sections)
                                    </CardTitle>
                                    <CardDescription>
                                        Susun bagian-bagian dokumen Anda
                                    </CardDescription>
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => appendSection({ title: "", orderIndex: sectionFields.length, items: [] })}
                                    className="flex items-center gap-2"
                                >
                                    <Plus size={16} /> Tambah Bagian
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <Accordion type="multiple" className="w-full space-y-4">
                                    {sectionFields.map((section, sectionIndex) => (
                                        <AccordionItem key={section.id} value={section.id} className="border rounded-lg px-4 bg-gray-50/50">
                                            <div className="flex items-center justify-between">
                                                <AccordionTrigger className="hover:no-underline py-4 flex-1">
                                                    <span className="font-semibold text-left">
                                                        {form.watch(`sections.${sectionIndex}.title`) || `Bagian ${sectionIndex + 1}`}
                                                    </span>
                                                </AccordionTrigger>
                                                <div className="flex items-center gap-2 pr-4">
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => moveSection(sectionIndex, sectionIndex - 1)}
                                                        disabled={sectionIndex === 0}
                                                    >
                                                        <MoveUp size={14} />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => moveSection(sectionIndex, sectionIndex + 1)}
                                                        disabled={sectionIndex === sectionFields.length - 1}
                                                    >
                                                        <MoveDown size={14} />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="ghost"
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => removeSection(sectionIndex)}
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </div>
                                            <AccordionContent className="pt-2 pb-6 space-y-4">
                                                <FormField
                                                    control={form.control}
                                                    name={`sections.${sectionIndex}.title`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Judul Bagian</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Misal: Tanggung Jawab Utama" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <div className="space-y-4 mt-6">
                                                    <div className="flex items-center justify-between border-b pb-2">
                                                        <h5 className="text-sm font-medium text-gray-700">Poin Utama / Items</h5>
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
                                                            className="text-primary h-8"
                                                        >
                                                            <Plus size={14} className="mr-1" /> Tambah Poin
                                                        </Button>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <DocumentItems
                                                            sectionIndex={sectionIndex}
                                                            control={form.control}
                                                        />
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                                {sectionFields.length === 0 && (
                                    <div className="text-center py-12 border-2 border-dashed rounded-lg bg-gray-50">
                                        <Layout className="mx-auto h-12 w-12 text-gray-300" />
                                        <p className="mt-2 text-sm text-gray-500 font-medium">Belum ada bagian yang ditambahkan</p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="mt-4"
                                            onClick={() => appendSection({ title: "", orderIndex: 0, items: [] })}
                                        >
                                            Mulai Tambah Bagian
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Card className="shadow-sm h-fit">
                            <CardHeader>
                                <CardTitle className="text-lg">Pengaturan</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status Dokumen</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Pilih Status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="DRAFT">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="bg-gray-100">DRAFT</Badge>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="ACTIVE">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">ACTIVE</Badge>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="RETIRED">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">RETIRED</Badge>
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <FormLabel>Departemen Terkait</FormLabel>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => appendDept({ code: "", isPrimary: false })}
                                            className="text-primary h-8"
                                        >
                                            <Plus size={14} className="mr-1" /> Tambah
                                        </Button>
                                    </div>
                                    {deptFields.map((dept, index) => (
                                        <div key={dept.id} className="flex gap-2 items-end">
                                            <FormField
                                                control={form.control}
                                                name={`departments.${index}.code`}
                                                render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Pilih Departemen" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {departments.map((d) => (
                                                                    <SelectItem key={d.code} value={d.code}>
                                                                        {d.name} ({d.code})
                                                                    </SelectItem>
                                                                ))}
                                                                {departments.length === 0 && (
                                                                    <SelectItem value="COMM" disabled>Belum ada data</SelectItem>
                                                                )}
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
                                                className="text-red-500 h-10 w-10 shrink-0"
                                                onClick={() => removeDept(index)}
                                                disabled={deptFields.length <= 1}
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-4 pt-4 border-t">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <User size={16} className="text-primary" />
                                            <FormLabel>Karyawan Spesifik (Opsional)</FormLabel>
                                        </div>
                                    </div>
                                    <CardDescription className="text-xs">
                                        Pilih jika dokumen ini hanya berlaku untuk orang tertentu
                                    </CardDescription>

                                    <div className="max-h-[200px] overflow-y-auto space-y-2 p-2 border rounded-md bg-gray-50/30">
                                        {employees.map((emp) => (
                                            <div key={emp.id} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={`emp-${emp.id}`}
                                                    checked={form.watch("employeeIds").includes(emp.id)}
                                                    onChange={(e) => {
                                                        const current = form.getValues("employeeIds");
                                                        if (e.target.checked) {
                                                            form.setValue("employeeIds", [...current, emp.id]);
                                                        } else {
                                                            form.setValue("employeeIds", current.filter((id) => id !== emp.id));
                                                        }
                                                    }}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                />
                                                <label
                                                    htmlFor={`emp-${emp.id}`}
                                                    className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                >
                                                    {emp.namaLengkap} <span className="text-gray-400 text-[10px]">({emp.jabatan})</span>
                                                </label>
                                            </div>
                                        ))}
                                        {employees.length === 0 && (
                                            <p className="text-center text-xs text-gray-400 py-4">Memuat data karyawan...</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-primary/5 border-primary/20 shadow-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                                    <Info size={16} /> Tips
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="text-xs space-y-2 text-muted-foreground list-disc pl-4 italic">
                                    <li>Gunakan judul yang spesifik untuk memudahkan pencarian.</li>
                                    <li>SOP biasanya memerlukan langkah-langkah yang lebih detail di bagian konten item.</li>
                                    <li>Anda dapat mengatur urutan bagian menggunakan tombol panah.</li>
                                </ul>
                            </CardContent>
                        </Card>
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
        <div className="space-y-3">
            {fields.map((item, itemIndex) => (
                <div key={item.id} className="flex gap-3 group">
                    <div className="w-12 shrink-0">
                        <FormField
                            control={control}
                            name={`sections.${sectionIndex}.items.${itemIndex}.itemNumber`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input
                                            placeholder="•"
                                            {...field}
                                            className="text-center font-bold bg-white"
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
                                            placeholder="Isi poin detail..."
                                            {...field}
                                            className="min-h-[60px] resize-none bg-white py-2"
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => move(itemIndex, itemIndex - 1)}
                            disabled={itemIndex === 0}
                        >
                            <MoveUp size={12} />
                        </Button>
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-500"
                            onClick={() => remove(itemIndex)}
                        >
                            <Trash2 size={12} />
                        </Button>
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => move(itemIndex, itemIndex + 1)}
                            disabled={itemIndex === fields.length - 1}
                        >
                            <MoveDown size={12} />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}
