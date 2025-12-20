import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
    Building2,
    MapPin,
    Star,
    CheckCircle,
    ArrowLeft,
    Loader2,
    Package,
    Calendar,
    AlertCircle
} from "lucide-react";

// Shadcn components
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

// Schemas
import { UpdateWarehouseSchema, type UpdateWarehouseInput } from "@/schemas/wh/whSchema";
import { getWarehouseById, updateWarehouse } from "@/lib/action/wh/whAction";
import { Warehouse } from "@/types/whType";


interface UpdateWhFormProps {
    defaultValues: Warehouse | null;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function UpdateWhForm({
    defaultValues,
    onSuccess,
    onCancel
}: UpdateWhFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string>("");

    // Initialize form
    const form = useForm<UpdateWarehouseInput>({
        resolver: zodResolver(UpdateWarehouseSchema),
        defaultValues: {
            code: "",
            name: "",
            address: "",
            isMain: false,
            isActive: true,
        },
    });

    // Update form when defaultValues changes
    useEffect(() => {
        if (defaultValues) {
            form.reset({
                code: defaultValues.code,
                name: defaultValues.name,
                address: defaultValues.address || "",
                isMain: defaultValues.isMain,
                isActive: defaultValues.isActive,
            });

            // Format last updated date
            if (defaultValues.updatedAt) {
                const date = new Date(defaultValues.updatedAt);
                setLastUpdated(date.toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }));
            }
        }
    }, [defaultValues, form]);

    // Handle form submission
    const onSubmit = async (data: UpdateWarehouseInput) => {
        setIsLoading(true);

        try {
            if (!defaultValues?.id) {
                toast.error("Error: Warehouse ID is missing");
                return;
            }

            const response = await updateWarehouse(defaultValues.id, data);

            if (!response.success) {
                throw new Error(response.error || response.message || "Gagal memperbarui gudang");
            }

            if (!response.data) {
                throw new Error("Data gudang tidak diterima dari server");
            }

            toast.success("Gudang berhasil diperbarui", {
                description: `Perubahan pada gudang "${response.data.name}" telah disimpan`,
                action: {
                    label: "Lihat",
                    onClick: () => router.push(`/warehouse/${response.data?.id}`),
                },
            });

            if (onSuccess) {
                onSuccess();
            } else {
                router.push("/admin/warehouse");
                router.refresh();
            }
        } catch (error) {
            console.error("Error updating warehouse:", error);

            let errorMessage = "Terjadi kesalahan saat memperbarui gudang";

            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'object' && error !== null) {
                // Handle API response errors
                if ('error' in error && typeof error.error === 'string') {
                    errorMessage = error.error;
                } else if ('message' in error && typeof error.message === 'string') {
                    errorMessage = error.message;
                }
            }

            toast.error("Gagal memperbarui gudang", {
                description: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle cancel
    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            router.back();
        }
    };

    return (
        <div className="container mx-auto px-4 py-6 max-w-4xl">
            {/* Header dengan gradient design 2025 */}
            <div className="relative mb-8 overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-background p-6 border shadow-sm">
                <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-blue-500/10 p-2 dark:bg-blue-500/20">
                            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Edit Data Gudang
                            </h1>
                            <p className="text-sm md:text-base text-muted-foreground mt-1">
                                Perbarui informasi gudang untuk sistem inventaris
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        className="text-[11px] md:text-sm"
                    >
                        <ArrowLeft className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                        Kembali
                    </Button>
                </div>
            </div>

            {/* Warehouse Info Card */}
            {defaultValues && (
                <Alert className="mb-6 bg-muted/50 border-l-4 border-l-blue-500">
                    <AlertCircle className="h-4 w-4 text-blue-500" />
                    <AlertDescription className="text-[11px] md:text-sm">
                        <div className="flex flex-wrap items-center gap-4">
                            <span className="font-medium">ID: {defaultValues.id.substring(0, 8)}...</span>
                            {defaultValues.isMain && (
                                <Badge variant="default" className="text-[10px]">
                                    <Star className="mr-1 h-3 w-3" />
                                    Gudang Utama
                                </Badge>
                            )}
                            {defaultValues.isActive ? (
                                <Badge variant="success" className="text-[10px]">
                                    Aktif
                                </Badge>
                            ) : (
                                <Badge variant="destructive" className="text-[10px]">
                                    Nonaktif
                                </Badge>
                            )}
                            {lastUpdated && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    <span className="text-[10px]">Terakhir diupdate: {lastUpdated}</span>
                                </div>
                            )}
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            <Card className="shadow-lg">
                <CardContent className="pt-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Kode Gudang */}
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center gap-2">
                                            <FormLabel className="flex items-center gap-2 text-[11px] md:text-sm">
                                                <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
                                                Kode Gudang
                                            </FormLabel>
                                        </div>
                                        <FormControl>
                                            <div className="relative">
                                                <Building2 className="absolute left-3 top-1/2 h-3 w-3 md:h-4 md:w-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    placeholder="Masukkan kode unik gudang"
                                                    className="pl-9 text-[11px] md:text-sm h-9 md:h-10"
                                                    disabled={true}
                                                    {...field}
                                                    onChange={(e) => {
                                                        const value = e.target.value.toUpperCase();
                                                        field.onChange(value);
                                                    }}
                                                    value={field.value || ""}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormDescription className="text-[10px] md:text-xs">
                                            Kode unik untuk identifikasi gudang
                                        </FormDescription>
                                        <FormMessage className="text-[10px] md:text-xs" />
                                    </FormItem>
                                )}
                            />

                            <Separator />

                            {/* Nama Gudang */}
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[11px] md:text-sm">
                                            Nama Gudang
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Contoh: Gudang Utama, Gudang Proyek A"
                                                className="text-[11px] md:text-sm h-9 md:h-10"
                                                {...field}
                                                value={field.value || ""}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-[10px] md:text-xs">
                                            Nama lengkap gudang
                                        </FormDescription>
                                        <FormMessage className="text-[10px] md:text-xs" />
                                    </FormItem>
                                )}
                            />

                            {/* Alamat */}
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center gap-2">
                                            <FormLabel className="flex items-center gap-2 text-[11px] md:text-sm">
                                                <MapPin className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
                                                Alamat Gudang
                                            </FormLabel>
                                            <span className="text-[10px] md:text-xs text-muted-foreground">
                                                (Opsional)
                                            </span>
                                        </div>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Masukkan alamat lengkap gudang"
                                                className="text-[11px] md:text-sm min-h-[80px] resize-none"
                                                {...field}
                                                value={field.value || ""}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-[10px] md:text-xs">
                                            Lokasi fisik gudang
                                        </FormDescription>
                                        <FormMessage className="text-[10px] md:text-xs" />
                                    </FormItem>
                                )}
                            />

                            <Separator />

                            {/* Switch Settings */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="isMain"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="flex items-center gap-2 text-[11px] md:text-sm">
                                                    <Star className="h-3 w-3 md:h-4 md:w-4 text-yellow-500" />
                                                    Gudang Utama
                                                </FormLabel>
                                                <FormDescription className="text-[10px] md:text-xs">
                                                    Hanya satu gudang yang dapat menjadi utama
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="isActive"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-[11px] md:text-sm">
                                                    Status Aktif
                                                </FormLabel>
                                                <FormDescription className="text-[10px] md:text-xs">
                                                    Nonaktifkan untuk menyembunyikan gudang
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Danger Zone */}
                            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                    <h3 className="text-sm font-semibold text-destructive">
                                        Zona Bahaya
                                    </h3>
                                </div>
                                <p className="text-[10px] md:text-xs text-muted-foreground mb-4">
                                    Menonaktifkan gudang akan menyembunyikannya dari daftar tetapi data tetap tersimpan.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col-reverse md:flex-row justify-between gap-3 pt-6 border-t">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Package className="h-4 w-4" />
                                    <span className="text-[10px] md:text-xs">
                                        ID: {defaultValues?.id?.substring(0, 12) || "N/A"}...
                                    </span>
                                </div>
                                <div className="flex flex-col md:flex-row gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCancel}
                                        className="text-[11px] md:text-sm h-9 md:h-10"
                                        disabled={isLoading}
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="text-[11px] md:text-sm h-9 md:h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
                                                Memperbarui...
                                            </>
                                        ) : (
                                            "Simpan Perubahan"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {/* CSS untuk gradient pattern */}
            <style jsx global>{`
            .bg-grid-pattern {
              background-image: linear-gradient(to right, #8882 1px, transparent 1px),
                linear-gradient(to bottom, #8882 1px, transparent 1px);
              background-size: 20px 20px;
            }
            
            @media (max-width: 640px) {
              .bg-grid-pattern {
                background-size: 16px 16px;
              }
            }
            
            .dark .bg-grid-pattern {
              background-image: linear-gradient(to right, #fff2 1px, transparent 1px),
                linear-gradient(to bottom, #fff2 1px, transparent 1px);
            }
    
            .bg-gradient-to-br {
              background-size: 200% 200%;
              animation: gradientShift 8s ease infinite;
            }
    
            @keyframes gradientShift {
              0% {
                background-position: 0% 50%;
              }
              50% {
                background-position: 100% 50%;
              }
              100% {
                background-position: 0% 50%;
              }
            }
          `}</style>
        </div>
    );
}