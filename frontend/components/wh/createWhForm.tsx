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
  Settings2,
  Database
} from "lucide-react";
import { coaApi } from "@/lib/action/coa/coa";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
import { toast } from "sonner";

// Schemas
import { CreateWarehouseSchema, type CreateWarehouseInput } from "@/schemas/wh/whSchema";
import { createWarehouse } from "@/lib/action/wh/whAction";

interface CreateWarehouseFormProps {
  generateCode?: (name?: string) => string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CreateWarehouseForm({
  generateCode,
  onSuccess,
  onCancel
}: CreateWarehouseFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSkeleton, setIsSkeleton] = useState(true);
  const [coaList, setCoaList] = useState<any[]>([]);
  const [isLoadingCoa, setIsLoadingCoa] = useState(false);

  // Initialize form
  const form = useForm<CreateWarehouseInput>({
    resolver: zodResolver(CreateWarehouseSchema) as any,
    defaultValues: {
      code: generateCode ? generateCode() : "",
      name: "",
      address: "",
      isMain: false,
      isActive: true,
      isWip: false,
      inventoryAccountId: "",
    },
  });

  const fetchCoa = async () => {
    setIsLoadingCoa(true);
    try {
      const data = await coaApi.getCOAs({
        limit: 1000,
        status: "ACTIVE" as any,
        postingType: "POSTING" as any
      });
      setCoaList(data.data || []);
    } catch (error) {
      toast.error("Gagal memuat daftar akun");
    } finally {
      setIsLoadingCoa(false);
    }
  };

  useEffect(() => {
    fetchCoa();
  }, []);

  // Simulate skeleton loading on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsSkeleton(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Handle form submission
  const onSubmit = async (data: CreateWarehouseInput) => {
    setIsLoading(true);

    try {
      const response = await createWarehouse(data);

      if (!response.success) {
        throw new Error(response.error || response.message || "Gagal membuat gudang");
      }

      if (!response.data) {
        throw new Error("Data gudang tidak diterima dari server");
      }

      toast.success("Gudang berhasil dibuat", {
        description: `Gudang "${response.data.name}" telah ditambahkan ke sistem`,
        action: {
          label: "Lihat",
          onClick: () => router.push(`/warehouse/${response.data?.id}`),
        },
      });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/warehouse");
        router.refresh();
      }
    } catch (error) {
      console.error("Error creating warehouse:", error);

      let errorMessage = "Terjadi kesalahan saat membuat gudang";

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

      toast.error("Gagal membuat gudang", {
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

  // Generate warehouse code suggestion
  const generateCodeSuggestion = () => {
    const name = form.getValues("name");
    if (!name) return "";

    const prefix = "WH-";
    const initials = name
      .split(" ")
      .map(word => word.charAt(0).toUpperCase())
      .join("")
      .substring(0, 3);

    const randomNum = Math.floor(Math.random() * 90) + 10;
    return `${prefix}${initials}-${randomNum}`;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;

    // Auto-generate code from name if code is empty
    const currentCode = form.getValues("code");
    if (!currentCode && name.length >= 2) {
      const suggestedCode = generateCodeSuggestion();
      form.setValue("code", suggestedCode, { shouldValidate: true });
    }
  };

  if (isSkeleton) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
              <div className="flex justify-end space-x-2 pt-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header dengan gradient design 2025 */}
      <div className="relative mb-8 overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 border shadow-sm">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2 dark:bg-primary/20">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Tambah Gudang Baru
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                Isi informasi lengkap gudang untuk sistem inventaris
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
                        <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                        Kode Gudang
                      </FormLabel>
                      <span className="text-[10px] md:text-xs text-muted-foreground">
                        ({generateCode ? generateCode() : "WH-..."} Automatic Generate By System)
                      </span>
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
                        onChange={(e) => {
                          field.onChange(e);
                          handleNameChange(e);
                        }}
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
                        <MapPin className="h-3 w-3 md:h-4 md:w-4 text-primary" />
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
                          Jadikan sebagai gudang utama sistem
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

                <FormField
                  control={form.control}
                  name="isWip"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="flex items-center gap-2 text-[11px] md:text-sm">
                          <Settings2 className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
                          Gudang WIP
                        </FormLabel>
                        <FormDescription className="text-[10px] md:text-xs">
                          Tandai jika gudang digunakan untuk barang setengah jadi
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

              <Separator />

              {/* Accounting Integration */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-[11px] md:text-sm font-semibold">
                  <Database className="h-4 w-4 text-indigo-500" />
                  Integrasi Akuntansi
                </h3>

                <FormField
                  control={form.control}
                  name="inventoryAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] md:text-sm">Akun Persediaan (COA)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || ""}
                        disabled={isLoading || isLoadingCoa}
                      >
                        <FormControl>
                          <SelectTrigger className="text-[11px] md:text-sm h-9 md:h-10">
                            <SelectValue placeholder={isLoadingCoa ? "Memuat akun..." : "Pilih Akun Persediaan..."} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {coaList.map((coa) => (
                            <SelectItem key={coa.id} value={coa.id} className="text-[11px] md:text-sm">
                              <span className="font-mono text-blue-600 mr-2">{coa.code}</span>
                              {coa.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-[10px] md:text-xs">
                        Akun Chart of Account yang digunakan untuk mencatat persediaan di gudang ini
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse md:flex-row justify-end gap-3 pt-6 border-t">
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
                  className="text-[11px] md:text-sm h-9 md:h-10 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Gudang"
                  )}
                </Button>
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
      `}</style>
    </div>
  );
}