"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
    CalendarIcon,
    FileText,
    Users,
    User,
    Package,
    MapPin,
    Plus,
    X,
    Check,
    ArrowLeft,
    Calendar,
    FileDigit,
    Tag,
    List,
    Hash,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { createSpk } from "@/lib/action/master/spk/spk";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { SpkApiPayload, SpkFormSchema, SpkFormValues } from "@/schemas/index";
import { nanoid } from 'nanoid';

interface SalesOrder {
    id: string;
    soNumber: string;
    customer: { id: string, name: string, branch: string }
    project: { id: string, name: string }
    items: {
        id: string;
        product: { name: string };
        qty: number;
        uom: string;
    }[];
    status: "DRAFT" |
    "CONFIRMED" |
    "IN_PROGRESS_SPK" |
    "FULFILLED" |
    "PARTIALLY_INVOICED" |
    "INVOICED" |
    "PARTIALLY_PAID" |
    "PAID" |
    "CANCELLED";
}

interface Karyawan {
    id: string;
    namaLengkap: string;
}

interface TeamKaryawan {
    id: string;
    karyawan: Karyawan;
}

interface Team {
    id: string;
    namaTeam: string;
    deskripsi: string;
    karyawan: TeamKaryawan[];
}

interface CreateFormSPKProps {
    salesOrders: SalesOrder[];
    teamData: Team[];
    isLoading: boolean;
    role: string;
    user: Karyawan[];
}

export default function CreateFormSPK({
    salesOrders,
    teamData,
    isLoading,
    role,
    user
}: CreateFormSPKProps) {
    const [selectedSalesOrder, setSelectedSalesOrder] = useState<SalesOrder | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const router = useRouter();

    console.log("Role", role);
    
    const allKaryawanRaw: Karyawan[] = teamData?.flatMap((team) =>
        team.karyawan?.map((anggota) => anggota.karyawan) || []
    ) || [];

    const allKaryawan: Karyawan[] = allKaryawanRaw.filter(
        (karyawan, index, self) =>
            index === self.findIndex(k => k.id === karyawan.id)
    );

    const form = useForm<SpkFormValues>({
        resolver: zodResolver(SpkFormSchema),
        defaultValues: {
            spkDate: new Date(),
            salesOrderId: "",
            teamId: "",
            notes: "",
            details: [],
            createdById: "",
        },
    });

    const handleSalesOrderChange = (value: string) => {
        form.setValue("salesOrderId", value);
        const so = salesOrders.find((item) => item.id === value);
        setSelectedSalesOrder(so || null);

        if (so) {
            // Update lokasi di semua detail yang sudah ada
            const currentDetails = form.getValues("details") || [];
            const updatedDetails = currentDetails.map(detail => ({
                ...detail,
                lokasiUnit: `Cabang: ${so.customer.branch}`,
                // Jangan reset salesOrderItemId agar tidak mengganggu pilihan user
            }));
            form.setValue("details", updatedDetails);
            form.setValue("notes", `Dibuat dari SO: ${so.soNumber || so.id} - Pelanggan: ${so.customer.name || 'N/A'} - Cabang: ${so.customer.branch || 'N/A'} - Project: ${so.project.name || 'N/A'}`);
        }
    };

    const handleTeamChange = (value: string) => {
        form.setValue("teamId", value);
        const team = teamData.find((item) => item.id === value);
        setSelectedTeam(team || null);

        if (team) {
            const defaultLokasi = selectedSalesOrder
                ? `Cabang: ${selectedSalesOrder.customer.branch}`
                : "";

            const teamDetails = team.karyawan.map((anggota) => ({
                id: nanoid(),
                karyawanId: anggota.karyawan.id,
                salesOrderItemId: "__all__", // ✅
                lokasiUnit: defaultLokasi,
            }));
            form.setValue("details", teamDetails);
        } else {
            form.setValue("details", []);
        }
    };
    const addDetail = () => {
        const currentDetails = form.getValues("details") || [];
        const defaultLokasi = selectedSalesOrder
            ? `Cabang: ${selectedSalesOrder.customer.branch}`
            : "";

        form.setValue("details", [
            ...currentDetails,
            {
                id: nanoid(),
                karyawanId: "",
                salesOrderItemId: "__all__", // ✅ BUKAN string kosong!
                lokasiUnit: defaultLokasi,
            },
        ]);
    };

    const removeDetail = (idToRemove: string) => {
        const currentDetails = form.getValues("details") || [];
        const newDetails = currentDetails.filter(detail => detail.id !== idToRemove);
        form.setValue("details", newDetails);
    };

    const handleSubmit = async (data: SpkFormValues) => {
        try {
            // Konversi tanggal ke string (YYYY-MM-DD)
            const spkDateString = data.spkDate.toISOString().split('T')[0];

            // Siapkan payload sesuai SpkApiPayload
            const payload: SpkApiPayload = {
                spkDate: spkDateString, // ✅ string
                salesOrderId: data.salesOrderId,
                teamId: data.teamId || null,
                notes: data.notes || null,
                createdById: data.createdById,
                details: data.details.map(detail => ({
                    id: detail.id,
                    karyawanId: detail.karyawanId,
                    salesOrderItemId: detail.salesOrderItemId === "__all__" ? null : detail.salesOrderItemId,
                    lokasiUnit: detail.lokasiUnit || null,
                })),
            };

            console.log("Payload dikirim:", payload); // Untuk debug

            const res = await createSpk(payload);

            if (res.success) {
                toast.success("SPK berhasil dibuat");
                router.push("/admin-area/logistic/spk");
            } else {
                toast.error(res.message || "Gagal membuat SPK");
            }
        } catch (err) {
            console.error("handleSubmit error:", err);
            toast.error("Terjadi kesalahan saat membuat SPK");
        }
    };

    const handleCancel = () => {
        router.back();
    };

    if (isLoading) {
        return (
            <Card className="w-full max-w-6xl mx-auto">
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-32 w-full" />
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-6xl mx-auto">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-blue-100 dark:from-slate-800 dark:to-slate-900">
                <div className="flex items-center space-x-3">
                    <Button variant="outline" size="icon" onClick={handleCancel} className="rounded-full">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <CardTitle className="text-xl flex items-center">
                            <FileDigit className="h-6 w-6 mr-2 text-primary" />
                            Buat SPK Baru
                        </CardTitle>
                        <CardDescription>
                            Isi formulir berikut untuk membuat Surat Perintah Kerja baru
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormItem>
                                <FormLabel className="flex items-center">
                                    <FileText className="h-4 w-4 mr-2 text-blue-600" />
                                    Nomor SPK
                                </FormLabel>
                                <FormControl>
                                    <Input placeholder="Akan dibuat otomatis oleh sistem" disabled />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            <FormField
                                control={form.control}
                                name="spkDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="flex items-center">
                                            <Calendar className="h-4 w-4 mr-2 text-green-600" />
                                            Tanggal SPK
                                        </FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            new Intl.DateTimeFormat("id-ID", {
                                                                year: "numeric",
                                                                month: "long",
                                                                day: "numeric",
                                                            }).format(field.value)
                                                        ) : (
                                                            <span>Pilih tanggal</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <CalendarComponent
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="salesOrderId"
                            render={({ field }) => (
                                <FormItem className="bg-gradient-to-r from-primary/5 to-blue-100 dark:from-slate-800 dark:to-slate-900 space-y-3 p-2 rounded-xl">
                                    <FormLabel className="flex items-center">
                                        <FileText className="h-4 w-4 mr-2 text-purple-600" />
                                        Sales Order
                                    </FormLabel>
                                    <Select
                                        onValueChange={handleSalesOrderChange}
                                        value={field.value || ""}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Sales Order" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {salesOrders.map((so) => (
                                                <SelectItem key={so.id} value={so.id}>
                                                    <div className="flex items-center gap-2">
                                                        {so.status !== "DRAFT" && (
                                                            <span className="text-amber-600 text-xs font-bold">✅</span>
                                                        )}
                                                        <span className={so.status !== "DRAFT" ? "text-amber-700 font-medium" : ""}>
                                                            {so.soNumber} - {so.customer.name}
                                                        </span>
                                                        <span className="text-muted-foreground text-xs">
                                                            {so.customer.branch}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {selectedSalesOrder && (
                            <div className="bg-muted/30 p-4 rounded-md border border-muted">
                                <h4 className="font-medium mb-4 flex items-center text-lg">
                                    <Package className="h-5 w-5 mr-2 text-amber-600" />
                                    Detail Sales Order - {selectedSalesOrder.project.name}
                                </h4>

                                {/* Informasi Umum */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-amber-600">
                                            <Hash className="h-4 w-4" />
                                        </span>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Nomor SO</p>
                                            <p className="font-medium">{selectedSalesOrder.soNumber}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-blue-600">
                                            <User className="h-4 w-4" />
                                        </span>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Customer</p>
                                            <p className="font-medium">{selectedSalesOrder.customer.name}</p>
                                            <p className="text-sm text-muted-foreground">Cabang : {selectedSalesOrder?.customer.branch}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Tabel Items */}
                                <div>
                                    <div className="flex items-center space-x-2 mb-2">
                                        <span className="text-green-600">
                                            <List className="h-4 w-4" />
                                        </span>
                                        <h5 className="text-sm font-medium text-muted-foreground">Items</h5>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-muted">
                                                    <th className="text-left py-2 px-1 font-medium text-muted-foreground">No</th>
                                                    <th className="text-left py-2 px-1 font-medium text-muted-foreground">Produk</th>
                                                    <th className="text-center py-2 px-1 font-medium text-muted-foreground">Qty</th>
                                                    <th className="text-right py-2 px-1 font-medium text-muted-foreground">Satuan</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedSalesOrder.items.map((item, index) => (
                                                    <tr key={item.id} className="border-b border-muted/50 last:border-0">
                                                        <td className="py-1 px-1 text-center font-medium w-8">
                                                            {index + 1}
                                                        </td>
                                                        <td className="py-1 px-1 flex items-center">
                                                            <Tag className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                                                            {item.product.name}
                                                        </td>
                                                        <td className="py-1 px-1 text-center font-medium">{item.qty}</td>
                                                        <td className="py-1 px-1 text-right font-medium">{item.uom}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="teamId"
                            render={({ field }) => (
                                <FormItem className="bg-gradient-to-r from-primary/5 to-blue-100 dark:from-slate-800 dark:to-slate-900 space-y-3 p-2 rounded-xl">
                                    <FormLabel className="flex items-center">
                                        <Users className="h-4 w-4 mr-2 text-blue-600" />
                                        Tim (Opsional)
                                    </FormLabel>
                                    <Select
                                        onValueChange={handleTeamChange}
                                        value={field.value || ""}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Tim (opsional)" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {teamData.map((team) => (
                                                <SelectItem key={team.id} value={team.id}>
                                                    {team.namaTeam}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <FormDescription>
                                        Memilih tim akan otomatis menambahkan semua anggota tim ke detail SPK
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <FormLabel className="flex items-center text-sm font-medium">
                                    <User className="h-4 w-4 mr-2 text-green-600" />
                                    Detail Tugas
                                </FormLabel>
                                {/* {!selectedTeam && ( */}
                                    <Button type="button" variant="outline" size="sm" onClick={addDetail}>
                                        <Plus className="h-3.5 w-3.5 mr-1" />
                                        Tambah
                                    </Button>
                                {/* // )} */}
                            </div>

                            {form.watch("details").length === 0 ? (
                                <div className="text-center py-6 border border-dashed rounded-md bg-muted/40">
                                    <User className="h-8 w-8 mx-auto text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground mt-1">Belum ada detail tugas</p>
                                  {/* //  {!selectedTeam && ( */}
                                        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={addDetail}>
                                            <Plus className="h-3.5 w-3.5 mr-1" />
                                            Tambah Tugas
                                        </Button>
                                  {/* //  )} */}
                                </div>
                            ) : (
                                <div className="rounded-md border overflow-hidden">
                                    {/* Header Tabel */}
                                    <div className="grid grid-cols-12 bg-muted/70 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                                        <div className="col-span-4 flex items-center">
                                            <User className="h-3 w-3 mr-2 text-green-600" />
                                            Karyawan
                                        </div>
                                        <div className="col-span-3 flex items-center">
                                            <MapPin className="h-3 w-3 mr-2 text-amber-600" />
                                            Lokasi
                                        </div>
                                        {selectedSalesOrder && (
                                            <div className="col-span-4 flex items-center">
                                                <Package className="h-3 w-3 mr-2 text-blue-600" />
                                                Item SO
                                            </div>
                                        )}
                                        <div className="col-span-1"></div> {/* Aksi */}
                                    </div>

                                    {/* Body Tabel */}
                                    <div className="divide-y divide-muted">
                                        {form.watch("details").map((detail, index) => (
                                            <div key={detail.id} className="grid grid-cols-12 items-center px-3 py-2 text-sm hover:bg-muted/50">
                                                {/* Karyawan */}
                                                <div className="col-span-4">
                                                    <FormField
                                                        control={form.control}
                                                        name={`details.${index}.karyawanId`}
                                                        render={({ field }) => (
                                                            <FormItem className="w-full">
                                                                <Select
                                                                    onValueChange={field.onChange}
                                                                    value={field.value || ""}
                                                                >
                                                                    <SelectTrigger className="w-full h-8 text-xs">
                                                                        <SelectValue placeholder="Pilih..." />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {allKaryawan.map((karyawan) => (
                                                                            <SelectItem key={karyawan.id} value={karyawan.id} className="text-xs">
                                                                                {karyawan.namaLengkap}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage className="text-[10px]" />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                {/* Lokasi */}
                                                <div className="col-span-3">
                                                    <FormField
                                                        control={form.control}
                                                        name={`details.${index}.lokasiUnit`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="Lokasi..."
                                                                        {...field}
                                                                        value={field.value || ""}
                                                                        className="h-8 text-xs px-2"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage className="text-[10px]" />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                {/* Item SO (jika ada) */}
                                                {selectedSalesOrder && (
                                                    <div className="col-span-4">
                                                        <FormField
                                                            control={form.control}
                                                            name={`details.${index}.salesOrderItemId`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <Select
                                                                        onValueChange={field.onChange}
                                                                        value={field.value || ""} // <-- "" = "All Item"
                                                                    >
                                                                        <SelectTrigger className="w-full h-8 text-xs">
                                                                            {field.value === "__all__" ? (
                                                                                <span className="text-blue-600 font-medium truncate">
                                                                                    📦 All Item Sales Order
                                                                                </span>
                                                                            ) : (
                                                                                <SelectValue placeholder="Pilih item SO..." />
                                                                            )}
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {/* Opsi "All Item" — GUNAKAN VALUE KHUSUS, BUKAN STRING KOSONG */}
                                                                            <SelectItem value="__all__" className="text-xs font-medium text-blue-600">
                                                                                📦 All Item Sales Order
                                                                            </SelectItem>
                                                                            {selectedSalesOrder.items.map((item) => (
                                                                                <SelectItem key={item.id} value={item.id} className="text-xs">
                                                                                    {item.product.name} ({item.qty} {item.uom})
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage className="text-[10px]" />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                )}

                                                {/* Tombol Hapus */}
                                                <div className="col-span-1 flex justify-end">
                                                    {!selectedTeam && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                                                            onClick={() => removeDetail(detail.id)}
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <FormField
                            control={form.control}
                            name="createdById" // <-- sesuai field di Prisma: SPK.createdById
                            render={({ field }) => (
                                <FormItem className="bg-gradient-to-r from-primary/5 to-blue-100 dark:from-slate-800 dark:to-slate-900 space-y-3 p-2 rounded-xl">
                                    <FormLabel className="flex items-center">
                                        <User className="h-4 w-4 mr-2 text-purple-600" />
                                        User Created
                                    </FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value || ""}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih User yang Membuat SPK" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {user
                                                .filter(user => user.id) // Hanya tampilkan user yang punya karyawan
                                                .map(user => (
                                                    <SelectItem
                                                        key={user.id}
                                                        value={user.id} // Simpan Karyawan.id
                                                    >
                                                        {user.namaLengkap}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Catatan (Opsional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Tambahkan catatan atau instruksi khusus..."
                                            className="resize-none"
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2 sticky bottom-4 bg-cyan-100 dark:bg-cyan-950 p-4 rounded-lg border shadow-sm">
                            <Button type="button" variant="outline" onClick={handleCancel}>
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={form.formState.isSubmitting}
                                className="gap-2"
                            >
                                {form.formState.isSubmitting ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4" />
                                        Simpan SPK
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}