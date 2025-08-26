"use client";

import React, { useState } from "react";
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
    X
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

type ProductSchema = z.infer<typeof ProductRegisterSchema>;

export function CreateProductForm() {
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
                action: {
                    label: "View",
                    onClick: () => router.push(`/products/${data.id}`),
                },
            });

            form.reset();
            router.refresh();
            router.push("/super-admin-area/master/products");
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


    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Package className="w-6 h-6 text-primary" />
                    <span>Add New Product</span>
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
                                    Basic Information
                                </h3>
                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Barcode className="w-4 h-4" />
                                                Product Code
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="PRD-001" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Unique identifier/SKU for the product
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
                                            <FormLabel>Product Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Premium Steel Pipe" {...field} />
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
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Product description..."
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
                                                Product Type
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select product type" />
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
                                {!isLoadingCategories && (
                                    <FormField
                                        control={form.control}
                                        name="categoryId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <List className="w-4 h-4" />
                                                    Category
                                                </FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a category" />
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
                                    Units & Conversions
                                </h3>
                                <FormField
                                    control={form.control}
                                    name="purchaseUnit"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <ShoppingCart className="w-4 h-4" />
                                                Purchase Unit
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., carton, box" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Unit when purchasing (e.g., carton, box)
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
                                                Storage Unit
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., roll, piece" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Unit for inventory storage
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
                                                Usage Unit
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., meter, kg" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Unit when using the product
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
                                            <FormLabel>Purchase → Storage Conversion</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0.01"
                                                    placeholder="e.g., 10 (1 carton = 10 rolls)"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="conversionToUsage"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Storage → Usage Conversion</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0.01"
                                                    placeholder="e.g., 100 (1 roll = 100 meters)"
                                                    {...field}
                                                />
                                            </FormControl>
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
                                    Media & Identification
                                </h3>
                                <FormField
                                    control={form.control}
                                    name="image"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Upload Image</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="file"
                                                    accept="image/*"
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
                                            </FormControl>
                                            {previewUrl && (
                                                <div className="mt-4">
                                                    <Image
                                                        src={previewUrl}
                                                        alt="Preview"
                                                        width={300}
                                                        height={300}
                                                        className="object-cover"
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
                                                <Input placeholder="Optional barcode identifier" {...field} />
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
                                    Status Flags
                                </h3>
                                <FormField
                                    control={form.control}
                                    name="isConsumable"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Consumable</FormLabel>
                                                <FormDescription>
                                                    Does this product get used up/depleted?
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
                                                <FormLabel className="text-base">Active</FormLabel>
                                                <FormDescription>
                                                    Is this product currently available?
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
                                Cancel
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
                                        Creating...
                                    </>
                                ) : (
                                    "Create Product"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}