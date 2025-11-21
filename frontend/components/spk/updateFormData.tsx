"use client";

import { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { SpkApiPayload, SpkFormSchema, SpkFormValues, SalesOrder } from "@/schemas/index";
import { nanoid } from 'nanoid';

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

interface SpkDetail {
    id: string;
    karyawanId: string | null;
    salesOrderItemId: string | null;
    lokasiUnit: string | null;
}

interface SpkData {
    id: string;
    spkNumber: string;
    spkDate: Date;
    salesOrderId: string | null;
    progress: number;
    teamId: string | null;
    notes: string | null;
    details: SpkDetail[];
    createdById: string;
}

interface FormUpdateSpkProps {
    user: Karyawan[];
    spk: SpkData;
    salesOrders: SalesOrder[];
    teams: Team[];
    isLoading: boolean;
    role: string
}

function getBasePath(role?: string) {
    const paths: Record<string, string> = {
        super: "/super-admin-area/logistic/spk",
        pic: "/pic-area/logistic/spk",
        admin: "/admin-area/logistic/spk",
    }
    return paths[role ?? "admin"] || "/admin-area/sales/salesOrder"
}

export default function FormUpdateSpk({
    user,
    spk,
    salesOrders,
    teams,
    isLoading,
    role,
}: FormUpdateSpkProps) {
    const [selectedSalesOrder, setSelectedSalesOrder] = useState<SalesOrder | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const router = useRouter();
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const searchParams = useSearchParams();
    const returnUrl = searchParams.get("returnUrl") || "";
    const page = Number(searchParams.get("page")) || 1;
    const pageSize = Number(searchParams.get("pageSize")) || 10;
    const highlightId = searchParams.get("highlightId") || "";
    const highlightStatus = searchParams.get("status") || "";
    const searchUrl = searchParams.get("search") || "";
    const urlFilter = searchParams.get("filter") || "all";

    // Prepare all karyawan data from teams
    const allKaryawanRaw: Karyawan[] = teams?.flatMap((team) =>
        (team.karyawan || []).map((anggota) => anggota.karyawan)
    ) || [];

    const allKaryawan: Karyawan[] = allKaryawanRaw.filter(
        (karyawan, index, self) =>
            index === self.findIndex(k => k.id === karyawan.id)
    );

    const form = useForm<SpkFormValues>({
        resolver: zodResolver(SpkFormSchema),
        defaultValues: {
            spkNumber: spk.spkNumber || "",
            spkDate: spk.spkDate ? new Date(spk.spkDate) : new Date(),
            salesOrderId: spk.salesOrderId || "",
            teamId: spk.teamId || "",
            notes: spk.notes || "",
            details: spk.details.map(detail => ({
                id: detail.id || nanoid(),
                karyawanId: detail.karyawanId || "",
                salesOrderItemId: detail.salesOrderItemId || "__all__",
                lokasiUnit: detail.lokasiUnit || "",
            })),
            createdById: spk.createdById || (user.length > 0 ? user[0].id : ""), // ✅ diperbaiki
        },
    });

    // Set initial selected sales order and team
    useEffect(() => {
        if (spk.salesOrderId) {
            const so = salesOrders.find((item) => item.id === spk.salesOrderId);
            setSelectedSalesOrder(so || null);
        }

        if (spk.teamId) {
            const team = teams.find((item) => item.id === spk.teamId);
            setSelectedTeam(team || null);
        }
    }, [spk.salesOrderId, spk.teamId, salesOrders, teams]);

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
            }));
            form.setValue("details", updatedDetails);
        }
    };

    const handleTeamChange = (value: string) => {
        form.setValue("teamId", value);
        const team = teams.find((item) => item.id === value);
        setSelectedTeam(team || null);

        if (team) {
            const defaultLokasi = selectedSalesOrder
                ? `Cabang: ${selectedSalesOrder.customer.branch}`
                : "";

            const teamDetails = team.karyawan.map((anggota) => ({
                id: nanoid(),
                karyawanId: anggota.karyawan.id,
                salesOrderItemId: "__all__",
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
                salesOrderItemId: "__all__",
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
            const spkDateString = data.spkDate.toISOString().split("T")[0];

            const payload: SpkApiPayload = {
                spkNumber: data.spkNumber,
                spkDate: spkDateString,
                salesOrderId: data.salesOrderId,
                teamId: data.teamId || null,
                notes: data.notes || null,
                createdById: data.createdById,
                details: data.details.map((detail) => ({
                    id: detail.id,
                    karyawanId: detail.karyawanId,
                    salesOrderItemId:
                        detail.salesOrderItemId === "__all__"
                            ? null
                            : detail.salesOrderItemId,
                    lokasiUnit: detail.lokasiUnit || null,
                })),
            };

            const res = await updateSpkAction(payload);

            if (res.success) {
                toast.success("SPK berhasil diperbarui");

                const redirectUrl = `${getBasePath(role)}?page=${page}&pageSize=${pageSize}&status=${highlightStatus}&search=${searchUrl}&highlightId=${highlightId}&returnUrl=${returnUrl}&filter=${urlFilter}`;

                router.push(redirectUrl);
            } else {
                toast.error(res.message || "Gagal memperbarui SPK");
            }
        } catch (err) {
            console.error("handleSubmit error:", err);
            toast.error("Terjadi kesalahan saat memperbarui SPK");
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

    const updateSpkAction = async (payload: SpkApiPayload) => {
        try {
            const response = await fetch(`${API_URL}/api/spk/updateSPK/${spk.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Gagal memperbarui SPK");
            }

            return { success: true, message: "SPK berhasil diperbarui" };
        } catch (error: unknown) {
            let errorMessage = "Gagal memperbarui SPK";

            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            } else if (error && typeof error === 'object' && 'message' in error) {
                errorMessage = String(error.message);
            }

            return { success: false, message: errorMessage };
        }
    };

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
                            Edit SPK - {spk.spkNumber}
                        </CardTitle>
                        <CardDescription>
                            Perbarui informasi SPK berikut
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="spkNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center">
                                            <FileText className="h-4 w-4 mr-2 text-blue-600" />
                                            Nomor SPK
                                        </FormLabel>
                                        <FormControl>
                                            <Input {...field} disabled />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                                <FormItem
                                    className={`bg-gradient-to-r from-primary/5 to-blue-100 dark:from-slate-800 dark:to-slate-900 space-y-3 p-2 rounded-xl ${spk.progress > 0 ? "opacity-60" : ""
                                        }`}
                                >
                                    <FormLabel className="flex items-center">
                                        <FileText className="h-4 w-4 mr-2 text-purple-600" />
                                        Sales Order
                                    </FormLabel>

                                    <Select
                                        onValueChange={handleSalesOrderChange}
                                        value={field.value || ""}
                                        disabled={spk.progress > 0}
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
                                                        <span
                                                            className={
                                                                so.status !== "DRAFT"
                                                                    ? "text-amber-700 font-medium"
                                                                    : ""
                                                            }
                                                        >
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

                                    {spk.progress > 0 && (
                                        <p className="text-red-600 text-sm mt-2">
                                            ⚠️ SPK ini sudah ada transaksi laporan, tidak bisa update Sales Order
                                        </p>
                                    )}

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
                                            {teams.map((team) => (
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
                                {!selectedTeam && (
                                    <Button type="button" variant="outline" size="sm" onClick={addDetail}>
                                        <Plus className="h-3.5 w-3.5 mr-1" />
                                        Tambah
                                    </Button>
                                )}
                            </div>

                            {form.watch("details").length === 0 ? (
                                <div className="text-center py-6 border border-dashed rounded-md bg-muted/40">
                                    <User className="h-8 w-8 mx-auto text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground mt-1">Belum ada detail tugas</p>
                                    {!selectedTeam && (
                                        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={addDetail}>
                                            <Plus className="h-3.5 w-3.5 mr-1" />
                                            Tambah Tugas
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="rounded-md border overflow-hidden">
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
                                        <div className="col-span-1"></div>
                                    </div>

                                    <div className="divide-y divide-muted">
                                        {form.watch("details").map((detail, index) => (
                                            <div key={detail.id} className="grid grid-cols-12 items-center px-3 py-2 text-sm hover:bg-muted/50">
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

                                                {selectedSalesOrder && (
                                                    <div className="col-span-4">
                                                        <FormField
                                                            control={form.control}
                                                            name={`details.${index}.salesOrderItemId`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <Select
                                                                        onValueChange={field.onChange}
                                                                        value={field.value || ""}
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
                            name="createdById"
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
                                                .filter(user => user.id)
                                                .map(user => (
                                                    <SelectItem
                                                        key={user.id}
                                                        value={user.id}
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
                                        Memperbarui...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4" />
                                        Update SPK
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