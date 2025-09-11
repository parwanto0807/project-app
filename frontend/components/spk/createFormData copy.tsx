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
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { createSpk } from "@/lib/action/master/spk/spk";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { SpkFormSchema, SpkFormValues, formToPayload } from "@/schemas/index";

interface SalesOrder {
    id: string;
    soNumber: string;
    name: string;
    items: {
        id: string;
        product: { name: string };
        quantity: number;
    }[];
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
}

export default function CreateFormSPK({
    salesOrders,
    teamData,
    isLoading,
    role,
}: CreateFormSPKProps) {
    const [selectedSalesOrder, setSelectedSalesOrder] = useState<SalesOrder | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const router = useRouter();
    
    console.log("Role", role);
    console.log("teamData On Create", teamData);

    // Extract all karyawan from teams
    const allKaryawan: Karyawan[] = teamData?.flatMap((team) =>
        team.karyawan?.map((anggota) => anggota.karyawan) || []
    ) || [];

    const form = useForm<SpkFormValues>({
        resolver: zodResolver(SpkFormSchema),
        defaultValues: {
            spkNumber: "",
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
    };

    const handleTeamChange = (value: string) => {
        form.setValue("teamId", value);
        const team = teamData.find((item) => item.id === value);
        setSelectedTeam(team || null);

        if (team) {
            const teamDetails = team.karyawan.map((anggota) => ({
                karyawanId: anggota.karyawan.id,
                salesOrderItemId: "",
                lokasiUnit: "",
            }));
            form.setValue("details", teamDetails);
        } else {
            form.setValue("details", []);
        }
    };

    const addDetail = () => {
        const currentDetails = form.getValues("details");
        form.setValue("details", [
            ...currentDetails,
            { karyawanId: "", salesOrderItemId: "", lokasiUnit: "" },
        ]);
    };

    const removeDetail = (index: number) => {
        const currentDetails = form.getValues("details");
        const newDetails = currentDetails.filter((_, i) => i !== index);
        form.setValue("details", newDetails);
    };

    const handleSubmit = async (data: SpkFormValues) => {
        try {
            const payload = formToPayload(data);
            const res = await createSpk(payload);

            if (res.success) {
                toast.success("SPK berhasil dibuat");
                router.push("/super-admin-area/spk");
            } else {
                toast.error(res.message || "Gagal membuat SPK");
            }
        } catch (err) {
            console.error(err);
            toast.error("Terjadi kesalahan saat membuat SPK");
        }
    };

    const handleCancel = () => {
        router.back();
    };

    // Helper function to convert null to undefined for Select values
    // const getSelectValue = (value: string | null | undefined): string | undefined => {
    //     return value || undefined;
    // };

    if (isLoading) {
        return (
            <Card className="w-full max-w-4xl mx-auto">
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
        <Card className="w-full max-w-4xl mx-auto">
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
                                            <Input placeholder="SPK-001" {...field} />
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
                                <FormItem>
                                    <FormLabel className="flex items-center">
                                        <FileText className="h-4 w-4 mr-2 text-purple-600" />
                                        Sales Order
                                    </FormLabel>
                                    <Select
                                        onValueChange={handleSalesOrderChange}
                                        value={field.value || undefined}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Sales Order" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {salesOrders.map((so) => (
                                                <SelectItem key={so.id} value={so.id}>
                                                    {so.soNumber} - {so.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {selectedSalesOrder && (
                            <div className="bg-muted/30 p-4 rounded-md">
                                <h4 className="font-medium mb-2 flex items-center">
                                    <Package className="h-4 w-4 mr-2 text-amber-600" />
                                    Detail Sales Order
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <div>
                                        <span className="text-sm text-muted-foreground">Nomor SO:</span>
                                        <p className="font-medium">{selectedSalesOrder.soNumber}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-muted-foreground">Customer:</span>
                                        <p className="font-medium">{selectedSalesOrder.name}</p>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <span className="text-sm text-muted-foreground">Items:</span>
                                    <div className="mt-1 space-y-1">
                                        {selectedSalesOrder.items.map((item) => (
                                            <div key={item.id} className="flex justify-between text-sm">
                                                <span>{item.product.name}</span>
                                                <span className="font-medium">{item.quantity} pcs</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="teamId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center">
                                        <Users className="h-4 w-4 mr-2 text-blue-600" />
                                        Tim (Opsional)
                                    </FormLabel>
                                    <Select
                                        onValueChange={handleTeamChange}
                                        value={field.value || undefined}
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
                                <FormLabel className="flex items-center">
                                    <User className="h-4 w-4 mr-2 text-green-600" />
                                    Detail Tugas
                                </FormLabel>
                                {!selectedTeam && (
                                    <Button type="button" variant="outline" size="sm" onClick={addDetail}>
                                        <Plus className="h-4 w-4 mr-1" />
                                        Tambah Tugas
                                    </Button>
                                )}
                            </div>

                            {form.watch("details").length === 0 ? (
                                <div className="text-center py-8 border border-dashed rounded-md">
                                    <User className="h-10 w-10 mx-auto text-muted-foreground" />
                                    <p className="text-muted-foreground mt-2">Belum ada detail tugas</p>
                                    {!selectedTeam && (
                                        <Button type="button" variant="outline" className="mt-4" onClick={addDetail}>
                                            <Plus className="h-4 w-4 mr-1" />
                                            Tambah Tugas
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {form.watch("details").map((_, index) => (
                                        <Card key={index} className="relative">
                                            <CardContent className="pt-6">
                                                {!selectedTeam && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute top-2 right-2 h-8 w-8"
                                                        onClick={() => removeDetail(index)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                )}

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <FormField
                                                        control={form.control}
                                                        name={`details.${index}.karyawanId`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Karyawan</FormLabel>
                                                                <Select
                                                                    onValueChange={field.onChange}
                                                                    value={field.value || undefined}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Pilih Karyawan" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {allKaryawan.map((karyawan) => (
                                                                            <SelectItem key={karyawan.id} value={karyawan.id}>
                                                                                {karyawan.namaLengkap}
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
                                                        name={`details.${index}.lokasiUnit`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="flex items-center">
                                                                    <MapPin className="h-4 w-4 mr-1 text-amber-600" />
                                                                    Lokasi/Unit (Opsional)
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="Lokasi pengerjaan"
                                                                        {...field}
                                                                        value={field.value || ""}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                {selectedSalesOrder && (
                                                    <FormField
                                                        control={form.control}
                                                        name={`details.${index}.salesOrderItemId`}
                                                        render={({ field }) => (
                                                            <FormItem className="mt-4">
                                                                <FormLabel>Item SO (Opsional)</FormLabel>
                                                                <Select
                                                                    onValueChange={field.onChange}
                                                                    value={field.value || undefined}
                                                                >
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Pilih Item SO" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        {selectedSalesOrder.items.map((item) => (
                                                                            <SelectItem key={item.id} value={item.id}>
                                                                                {item.product.name} - {item.quantity} pcs
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>

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

                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
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