"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
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
    UploadCloudIcon
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
import { useCategories } from "@/hooks/use-categories";
import * as z from "zod";
import { ProductRegisterSchema } from "@/schemas";
import Image from "next/image";
import { ensureFreshToken } from "@/lib/http";
import { ProductType } from "@/constans/product-type";

type ProductSchema = z.infer<typeof ProductRegisterSchema>;
function getBasePath(role?: string) {
    return role === "super"
        ? "/super-admin-area/master/products"
        : "/admin-area/master/products"
}

export function CreateProductForm({ role, code }: { role: string; code: string }) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { categories, loading: isLoadingCategories } = useCategories();
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
            isConsumable: true,   // HARUS boolean, TIDAK undefined
            isActive: true,       // HARUS boolean, TIDAK undefined
            image: undefined,
            barcode: "",
            categoryId: undefined,
        }
    });

    function formatLabel(value: string) {
        return value.replace(/([A-Z])/g, " $1").trim();
    }
    async function onSubmit(values: z.infer<typeof ProductRegisterSchema>) {
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            // Tambahkan semua value field biasa (selain file)
            Object.entries(values).forEach(([key, value]) => {
                // Jangan masukkan image di sini (khusus file di bawah)
                if (key !== "image") formData.append(key, value as string);
            });
            // Tambahkan file
            if (values.image) formData.append("image", values.image);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/master/product/createProduct`, {
                method: "POST",
                body: formData,
                credentials: "include",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to create product");
            }

            toast.success("Product created successfully!", {
                description: `${values.name} has been added to your products.`,
            });

            form.reset();
            router.refresh();

            const basePath = getBasePath(role);
            router.push(`${basePath}?highlightId=${data.id}`);
        } catch (error) {
            toast.error("Failed to create product", {
                description: error instanceof Error ? error.message : "An unknown error occurred",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    React.useEffect(() => {
        const onFocus = () => { ensureFreshToken(); };
        const onVis = () => { if (!document.hidden) ensureFreshToken(); };

        window.addEventListener("focus", onFocus);
        document.addEventListener("visibilitychange", onVis);

        const id = setInterval(onFocus, 60_000); // tiap 60s cek ringan (opsional)

        return () => {
            window.removeEventListener("focus", onFocus);
            document.removeEventListener("visibilitychange", onVis);
            clearInterval(id);
        };
    }, []);

    // set code awal dari prop
    useEffect(() => {
        if (code) {
            form.setValue("code", code);
            form.setValue("barcode", code); // otomatis set barcode juga
        }
    }, [code, form]);

    // watch code supaya setiap kali berubah, barcode ikut update
    const watchedCode = useWatch({ control: form.control, name: "code" });
    useEffect(() => {
        if (watchedCode) {
            form.setValue("barcode", watchedCode);
        }
    }, [watchedCode, form]);

    // 🔍 watch purchaseUnit
    const purchaseUnitValue = useWatch({ control: form.control, name: "purchaseUnit" });

    // 🪄 setiap purchaseUnit berubah → set storageUnit & usageUnit sama
    useEffect(() => {
        if (purchaseUnitValue) {
            form.setValue("storageUnit", purchaseUnitValue);
            form.setValue("usageUnit", purchaseUnitValue);
        }
    }, [purchaseUnitValue, form]);

    return (
        <Card className="max-w-7xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Package className="w-6 h-6 text-primary" />
                    <span>Tambah Produk Baru</span>
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
                                                    {Object.values(ProductType).map((type) => (
                                                        <SelectItem key={type} value={type}>
                                                            {formatLabel(type)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {!isLoadingCategories && (
                                    <FormField
                                        control={form.control}
                                        name="categoryId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <List className="w-4 h-4" />
                                                    Kategori
                                                </FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Upload Gambar</FormLabel>
                                            <FormControl>
                                                <div>
                                                    {/* hidden input */}
                                                    <input
                                                        id="file-upload"
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0] || null;
                                                            field.onChange(file);
                                                            if (file) {
                                                                const url = URL.createObjectURL(file);
                                                                setPreviewUrl(url);
                                                            } else {
                                                                setPreviewUrl(null);
                                                            }
                                                        }}
                                                    />

                                                    {/* styled button with colored icon */}
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => document.getElementById("file-upload")?.click()}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <UploadCloudIcon size={30} color="#2563eb" /> {/* biru elegan */}
                                                        Pilih File
                                                    </Button>
                                                </div>
                                            </FormControl>

                                            {previewUrl && (
                                                <div className="mt-4">
                                                    <Image
                                                        src={previewUrl}
                                                        alt="Preview"
                                                        width={300}
                                                        height={300}
                                                        className="object-cover rounded-lg border"
                                                        onLoad={() => URL.revokeObjectURL(previewUrl)}
                                                    />
                                                </div>
                                            )}

                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="barcode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Barcode/QR Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Kode barcode opsional" {...field} />
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
                                        <svg
                                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Membuat...
                                    </>
                                ) : (
                                    "Buat Produk"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}