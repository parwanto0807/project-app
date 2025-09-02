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
    role: string
}

export function UpdateProductForm({ productId, accessToken, role }: UpdateProductFormProps) {
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

            // Tambahkan semua field form kecuali image
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

            // Tambahkan image jika ada
            if (values.image instanceof File) {
                formData.append("image", values.image); // ⬅️ image baru dari input file
            } else if (typeof values.image === "string") {
                formData.append("image", values.image); // ⬅️ image lama (string path dari database)
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/master/product/updateProduct/${productId}`,
                {
                    method: "PUT",
                    body: formData,
                    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
                    credentials: "include", // agar cookie/token ikut terkirim
                    // ❌ JANGAN set headers Content-Type → browser akan otomatis handle multipart/form-data
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update product");
            }

            toast.success("Product updated successfully!", {
                description: `${values.name} has been updated.`,
                action: {
                    label: "View Products",
                    onClick: () => router.push("/super-admin-area/master/products"),
                },
            });

            router.refresh();
            const basePath = getBasePath(role)
            router.push(basePath)
        } catch (error) {
            toast.error("Failed to update product", {
                description:
                    error instanceof Error
                        ? error.message
                        : "An unknown error occurred",
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
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Package className="w-6 h-6 text-primary" />
                    <span>Update Product</span>
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
                                            <Select onValueChange={field.onChange} value={field.value}>
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
                                {!isLoadingCategories ? (
                                    <FormField
                                        control={form.control}
                                        name="categoryId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <List className="w-4 h-4" />
                                                    Category
                                                </FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
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
                                                <FormLabel>Product Image</FormLabel>
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
                                                            <p className="text-sm text-muted-foreground mb-2">Image Preview:</p>
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
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    "Update Product"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}