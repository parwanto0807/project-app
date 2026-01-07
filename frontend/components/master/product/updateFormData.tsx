"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
    Box,
    Package,
    Ruler,
    ShoppingCart,
    Warehouse,
    Wrench,
    Image as ImageIcon,
    Barcode,
    Type,
    List,
    Check,
    X,
    Loader2
} from "lucide-react";

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "@/hooks/use-categories";
import * as z from "zod";
import { ProductRegisterSchema } from "@/schemas";
import { fetchProductById } from "@/lib/action/master/product";
import Image from "next/image";
import { makeImageSrc } from "@/utils/makeImageSrc";

type ProductSchema = z.infer<typeof ProductRegisterSchema>;

function getBasePath(role?: string) {
    return role === "super"
        ? "/super-admin-area/master/products"
        : "/admin-area/master/products"
}

interface UpdateProductFormProps {
    productId: string;
    accessToken?: string;
    role: string;
    returnUrl: string;
}

export function UpdateProductForm({ productId, accessToken, role, returnUrl }: UpdateProductFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { categories, loading: isLoadingCategories } = useCategories();

    const form = useForm<ProductSchema>({
        resolver: zodResolver(ProductRegisterSchema),
        defaultValues: {
            code: "",
            name: "",
            description: "",
            type: undefined,
            purchaseUnit: "",
            storageUnit: "",
            usageUnit: "",
            conversionToStorage: 1,
            conversionToUsage: 1,
            isConsumable: true,
            isActive: true,
            image: "",
            barcode: "",
            categoryId: "",
        }
    });

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const productData = await fetchProductById(productId);
                form.reset(productData);
            } catch (error) {
                toast.error("Failed to load product", {
                    description: error instanceof Error ? error.message : "An unknown error occurred",
                });
                router.push("/products");
            } finally {
                setIsLoading(false);
            }
        };

        if (productId) {
            fetchProduct();
        }
    }, [productId, form, router]);

    async function onSubmit(values: z.infer<typeof ProductRegisterSchema>) {
        setIsSubmitting(true);

        try {
            const formData = new FormData();

            formData.append("code", values.code);
            formData.append("name", values.name);
            formData.append("description", values.description || "");
            formData.append("type", values.type ?? "");
            formData.append("purchaseUnit", values.purchaseUnit);
            formData.append("storageUnit", values.storageUnit);
            formData.append("usageUnit", values.usageUnit);
            formData.append("conversionToStorage", String(values.conversionToStorage));
            formData.append("conversionToUsage", String(values.conversionToUsage));
            formData.append("isConsumable", String(values.isConsumable));
            formData.append("isActive", String(values.isActive));
            formData.append("barcode", values.barcode || "");
            formData.append("categoryId", values.categoryId ?? "");

            if (values.image instanceof File) {
                formData.append("image", values.image);
            } else if (typeof values.image === "string") {
                formData.append("image", values.image);
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/master/product/updateProduct/${productId}`,
                {
                    method: "PUT",
                    body: formData,
                    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update product");
            }

            toast.success("Product updated successfully!", {
                description: `${values.name} has been updated.`,
            });

            router.refresh();

            // 🔥 KEMBALIKAN KE PAGE SEBELUMNYA
            if (returnUrl) {
                router.push(decodeURIComponent(returnUrl));
                return;
            }

            // fallback
            const basePath = getBasePath(role);
            router.push(basePath);
        } catch (error) {
            toast.error("Failed to update product", {
                description: error instanceof Error ? error.message : "An unknown error occurred",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return (
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-6 w-48" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Basic Information Skeleton */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-5" />
                                <Skeleton className="h-5 w-32" />
                            </div>
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-4 w-48" />
                                </div>
                            ))}
                        </div>

                        {/* Units and Conversions Skeleton */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-5" />
                                <Skeleton className="h-5 w-32" />
                            </div>
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-4 w-48" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* Additional Information Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-5" />
                                <Skeleton className="h-5 w-32" />
                            </div>
                            {[...Array(2)].map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-5" />
                                <Skeleton className="h-5 w-32" />
                            </div>
                            {[...Array(2)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-24" />
                                        <Skeleton className="h-4 w-48" />
                                    </div>
                                    <Skeleton className="h-6 w-11 rounded-full" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="max-w-7xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Package className="w-6 h-6 text-primary" />
                    <span>Perbarui Produk</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basic Information */}
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 text-lg font-medium">
                                    <Type className="w-5 h-5" />
                                    Informasi Dasar
                                </h3>
                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Barcode className="w-4 h-4" />
                                                Kode Produk
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="PRD-001" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Kode unik/SKU untuk produk ini
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nama Produk</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Contoh: Besi Beton 10mm" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Deskripsi</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Deskripsi produk..."
                                                    className="min-h-[100px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Wrench className="w-4 h-4" />
                                                Tipe Produk
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Pilih tipe produk" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Material">Material</SelectItem>
                                                    <SelectItem value="Jasa">Jasa</SelectItem>
                                                    <SelectItem value="Alat">Alat</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {!isLoadingCategories ? (
                                    <FormField
                                        control={form.control}
                                        name="categoryId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <List className="w-4 h-4" />
                                                    Kategori
                                                </FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Pilih kategori" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {categories.map((category) => (
                                                            <SelectItem key={category.id} value={category.id}>
                                                                {category.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ) : (
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                )}
                            </div>

                            {/* Units and Conversions */}
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 text-lg font-medium">
                                    <Ruler className="w-5 h-5" />
                                    Satuan & Konversi
                                </h3>
                                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
                                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">💡 Panduan Konversi:</p>
                                    <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                                        <li><strong>Satuan Beli:</strong> Satuan saat membeli dari supplier (Contoh: Batang, Karton, Roll)</li>
                                        <li><strong>Satuan Simpan:</strong> Satuan saat disimpan di gudang (Contoh: Meter, Pcs, Sak)</li>
                                        <li><strong>Satuan Pakai:</strong> Satuan saat digunakan untuk proyek (Contoh: Meter, Kg, Liter)</li>
                                        <li><strong>Konversi Beli → Simpan:</strong> Berapa banyak satuan simpan dalam 1 satuan beli</li>
                                        <li><strong>Konversi Simpan → Pakai:</strong> Berapa banyak satuan pakai dalam 1 satuan simpan</li>
                                    </ul>
                                    <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                                        <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">📝 Contoh:</p>
                                        <div className="bg-white dark:bg-blue-900/20 rounded p-2 text-xs space-y-1">
                                            <p className="font-mono">• Besi Beton: 1 Batang = 3 Meter → Konversi = 3</p>
                                            <p className="font-mono">• Kabel: 1 Roll = 100 Meter → Konversi = 100</p>
                                            <p className="font-mono">• Semen: 1 Karton = 10 Sak → Konversi = 10</p>
                                        </div>
                                    </div>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="purchaseUnit"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <ShoppingCart className="w-4 h-4" />
                                                Satuan Beli (Purchase Unit)
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Contoh: Batang, Karton, Roll, Dus" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Satuan yang digunakan saat membeli dari supplier
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="storageUnit"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Warehouse className="w-4 h-4" />
                                                Satuan Simpan (Storage Unit)
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Contoh: Meter, Pcs, Sak, Liter" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Satuan yang digunakan untuk menyimpan di gudang
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="usageUnit"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Box className="w-4 h-4" />
                                                Satuan Pakai (Usage Unit)
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Contoh: Meter, Kg, Liter, M²" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Satuan yang digunakan saat memakai produk untuk proyek
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="conversionToStorage"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-semibold">Konversi: Beli → Simpan</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0.01"
                                                    placeholder="Contoh: 3 (artinya 1 Batang = 3 Meter)"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription className="text-xs bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded p-2 mt-2">
                                                <strong className="text-amber-900 dark:text-amber-100">Rumus:</strong> Berapa banyak <strong>Satuan Simpan</strong> yang didapat dari <strong>1 Satuan Beli</strong>?<br />
                                                <span className="text-amber-800 dark:text-amber-200">Contoh: Jika 1 Batang = 3 Meter, maka isi <strong>3</strong></span>
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="conversionToUsage"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-semibold">Konversi: Simpan → Pakai</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0.01"
                                                    placeholder="Contoh: 1 (artinya 1 Meter simpan = 1 Meter pakai)"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription className="text-xs bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded p-2 mt-2">
                                                <strong className="text-green-900 dark:text-green-100">Rumus:</strong> Berapa banyak <strong>Satuan Pakai</strong> yang didapat dari <strong>1 Satuan Simpan</strong>?<br />
                                                <span className="text-green-800 dark:text-green-200">Contoh: Jika 1 Meter = 1 Meter, maka isi <strong>1</strong></span>
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Additional Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 text-lg font-medium">
                                    <ImageIcon className="w-5 h-5" />
                                    Media & Identifikasi
                                </h3>
                                <FormField
                                    control={form.control}
                                    name="image"
                                    render={({ field }) => {
                                        const value = field.value;

                                        const previewUrl =
                                            value instanceof File
                                                ? URL.createObjectURL(value)
                                                : value
                                                    ? makeImageSrc(value)
                                                    : null;

                                        return (
                                            <FormItem>
                                                <FormLabel>Gambar Produk</FormLabel>
                                                <div className="space-y-3">
                                                    {/* Input File */}
                                                    <FormControl>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="block w-full text-sm text-muted-foreground
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-md file:border-0
                         file:text-sm file:font-semibold
                         file:bg-primary file:text-primary-foreground
                         hover:file:bg-primary/90"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                form.setValue('image', file ?? null);
                                                            }}
                                                        />
                                                    </FormControl>

                                                    {/* Nama File */}
                                                    {value instanceof File && (
                                                        <p className="text-sm text-muted-foreground">File selected: {value.name}</p>
                                                    )}

                                                    {/* Preview Gambar */}
                                                    {previewUrl && (
                                                        <div className="mt-2">
                                                            <p className="text-sm text-muted-foreground mb-2">Preview Gambar:</p>
                                                            <div className="w-full max-w-xs aspect-square border rounded-md overflow-hidden bg-muted flex items-center justify-center">
                                                                <Image
                                                                    src={previewUrl}
                                                                    alt="Preview Gambar Produk"
                                                                    width={300}
                                                                    height={300}
                                                                    className="object-contain w-full h-full"
                                                                    priority
                                                                    quality={80}
                                                                    sizes="(max-width: 600px) 100vw, 600px"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        );
                                    }}
                                />


                                <FormField
                                    control={form.control}
                                    name="barcode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Barcode/QR Code</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    value={field.value ?? ""}                // fix utama
                                                    onChange={(e) => field.onChange(e.target.value)}
                                                    placeholder="Kode barcode opsional"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                            </div>

                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 text-lg font-medium">
                                    <Check className="w-5 h-5 text-green-500" />
                                    <X className="w-5 h-5 text-red-500" />
                                    Status Produk
                                </h3>
                                <FormField
                                    control={form.control}
                                    name="isConsumable"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Habis Pakai (Consumable)</FormLabel>
                                                <FormDescription>
                                                    Apakah produk ini habis dipakai/berkurang?
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
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
                                                <FormLabel className="text-base">Aktif</FormLabel>
                                                <FormDescription>
                                                    Apakah produk ini tersedia saat ini?
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={isSubmitting}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Memperbarui...
                                    </>
                                ) : (
                                    "Perbarui Produk"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}