import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
    ChevronDown,
    ChevronRight,
    Edit,
    Box,
    Package,
    Hammer,
    Tag,
    Circle,
    ArrowUpDown,
    MoreVertical,
    Image as ImageIcon,
    Barcode,
    Ruler,
    Layers,
    ShoppingCart,
    Warehouse,
    Gauge,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import DeleteProductAlert from "./alert-delete";
import { Card, CardContent } from "@/components/ui/card";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePathname, useSearchParams } from "next/navigation";

interface ProductCategory {
    id: string;
    name: string;
    products?: Product[];
}

interface Product {
    id: string;
    code: string;
    name: string;
    description: string | null;
    type: string | null;
    purchaseUnit: string;
    storageUnit: string;
    usageUnit: string;
    conversionToStorage: number | string;
    conversionToUsage: number | string;
    isConsumable: boolean;
    isActive: boolean;
    image: string | null;
    barcode: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    categoryId: string | null;
    category?: ProductCategory | null;
    salesOrderItems?: string[];
}

interface ProductListProps {
    products: Product[];
    isLoading: boolean;
    role: string;
    currentPage: number;
    highlightId: string | null;
}

function getBasePath(role?: string) {
    const paths: Record<string, string> = {
        super: "/super-admin-area/master/products",
        pic: "/pic-area/master/products",
        admin: "/admin-area/master/products",
    }
    return paths[role ?? "admin"] || "/admin-area/master/products"
}

// Utility function untuk membuat image source
const makeImageSrc = (imagePath: string | null) => {
    if (!imagePath) return null;
    // Jika imagePath sudah full URL, return langsung
    if (imagePath.startsWith('http')) return imagePath;
    // Jika relative path, tambahkan base URL
    return `${process.env.NEXT_PUBLIC_API_URL || ''}${imagePath}`;
};

const ProductList = ({
    products,
    isLoading,
    role,
    currentPage,
    highlightId,
}: ProductListProps) => {
    const [expandedProducts, setExpandedProducts] = useState<Set<string>>(
        new Set()
    );
    const basePath = getBasePath(role)
    const isMobile = useMediaQuery("(max-width: 768px)");
    const rowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // clone dan bersihkan highlightId lama
    const params = new URLSearchParams(searchParams.toString());
    params.delete("highlightId");

    // buat URL bersih
    const fullUrl = `${pathname}?${params.toString()}`;

    useEffect(() => {
        if (!highlightId) return;

        const highlightElement = rowRefs.current[highlightId];
        if (!highlightElement) return;

        // Konfigurasi animasi
        const SCROLL_DELAY = 300;
        const HIGHLIGHT_DURATION = 5000;
        const ANIMATION_CLASSES = [
            "bg-yellow-200",
            "dark:bg-yellow-900",
            "animate-pulse",
            "ring-2",
            "ring-yellow-400",
            "ring-offset-2",
            "transition-all",
            "duration-500"
        ];

        // Scroll ke elemen dengan sedikit delay
        const scrollTimer = setTimeout(() => {
            highlightElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "nearest"
            });
        }, SCROLL_DELAY);

        // Terapkan highlight
        highlightElement.classList.add(...ANIMATION_CLASSES);

        // Hapus highlight setelah HIGHLIGHT_DURATION
        const cleanupTimer = setTimeout(() => {
            highlightElement.classList.remove(...ANIMATION_CLASSES);
            highlightElement.classList.add("transition-colors", "duration-300");

            // 🔥 Hapus highlightId dari URL setelah animasi selesai
            const params = new URLSearchParams(window.location.search);
            params.delete("highlightId");
            const newUrl = `${window.location.pathname}?${params.toString()}`;
            window.history.replaceState({}, "", newUrl);

        }, HIGHLIGHT_DURATION);

        // Cleanup function
        return () => {
            clearTimeout(scrollTimer);
            clearTimeout(cleanupTimer);
            highlightElement.classList.remove(...ANIMATION_CLASSES);
        };
    }, [highlightId]);


    const toggleExpand = (productId: string) => {
        setExpandedProducts((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) {
                newSet.delete(productId);
            } else {
                newSet.add(productId);
            }
            return newSet;
        });
    };

    const handleRowClick = (e: React.MouseEvent, productId: string) => {
        // Prevent toggle if clicking on dropdown menu or buttons
        const target = e.target as HTMLElement;
        if (
            target.closest('button') ||
            target.closest('.dropdown-menu') ||
            target.closest('a')
        ) {
            return;
        }
        toggleExpand(productId);
    };

    const getProductIcon = (type: string | null) => {
        switch (type?.toLowerCase()) {
            case "material":
                return <Package className="h-4 w-4 text-blue-500" />;
            case "jasa":
                return <Hammer className="h-4 w-4 text-green-500" />;
            case "alat":
                return <Hammer className="h-4 w-4 text-purple-500" />;
            default:
                return <Box className="h-4 w-4 text-orange-500" />;
        }
    };

    const getProductTypeColor = (type: string | null) => {
        switch (type?.toLowerCase()) {
            case "material":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
            case "jasa":
                return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
            case "alat":
                return "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
        }
    };

    // Tentukan jumlah kolom berdasarkan device
    const getColumnCount = () => {
        if (isMobile) return 4; // Image, Product Info, Status, Actions
        return 8; // Image, Code, Name, Type, Category, Units, Status, Actions
    };

    const columnCount = getColumnCount();

    return (
        <Card className="rounded-2xl border-0 shadow-lg overflow-hidden">
            <CardContent className="p-0">
                <div className="bg-white dark:bg-gray-800">
                    <div className="rounded-md border">
                        <Table className="min-w-full">
                            <TableHeader className="bg-gray-50 dark:bg-gray-700">
                                <TableRow>
                                    {/* Kolom Gambar */}
                                    <TableHead className="text-gray-900 dark:text-white font-semibold py-3 px-2 text-xs uppercase w-12">
                                        <div className="flex items-center gap-1">
                                            <div className="p-1 bg-pink-100 dark:bg-pink-900 rounded">
                                                <ImageIcon className="h-3 w-3 text-pink-600 dark:text-pink-400" />
                                            </div>
                                        </div>
                                    </TableHead>

                                    {/* Kolom Kode Produk */}
                                    <TableHead className="hidden md:table-cell text-gray-900 dark:text-white font-semibold py-3 px-2 text-xs uppercase w-20">
                                        <div className="flex items-center gap-1">
                                            <div className="p-1 bg-cyan-100 dark:bg-cyan-900 rounded">
                                                <Barcode className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                                            </div>
                                            <span>Code</span>
                                        </div>
                                    </TableHead>

                                    {/* Kolom Nama Produk */}
                                    <TableHead className="text-gray-900 dark:text-white font-semibold py-3 px-2 text-xs uppercase">
                                        <div className="flex items-center gap-1">
                                            <div className="p-1 bg-blue-100 dark:bg-blue-900 rounded">
                                                <Package className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <span>Product Name</span>
                                        </div>
                                    </TableHead>

                                    {/* Kolom Tipe Produk */}
                                    <TableHead className="hidden md:table-cell text-gray-900 dark:text-white font-semibold py-3 px-2 text-xs uppercase w-24">
                                        <div className="flex items-center gap-1">
                                            <div className="p-1 bg-purple-100 dark:bg-purple-900 rounded">
                                                <Layers className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <span>Type</span>
                                        </div>
                                    </TableHead>

                                    {/* Kolom Kategori */}
                                    <TableHead className="hidden md:table-cell text-gray-900 dark:text-white font-semibold py-3 px-2 text-xs uppercase">
                                        <div className="flex items-center gap-1">
                                            <div className="p-1 bg-green-100 dark:bg-green-900 rounded">
                                                <Tag className="h-3 w-3 text-green-600 dark:text-green-400" />
                                            </div>
                                            <span>Category</span>
                                        </div>
                                    </TableHead>

                                    {/* Kolom Units & Conversion */}
                                    <TableHead className="hidden md:table-cell text-gray-900 dark:text-white font-semibold py-3 px-2 text-xs uppercase">
                                        <div className="flex items-center gap-1">
                                            <div className="p-1 bg-orange-100 dark:bg-orange-900 rounded">
                                                <Ruler className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <span>Units</span>
                                        </div>
                                    </TableHead>

                                    {/* Kolom Status */}
                                    <TableHead className="text-gray-900 dark:text-white font-semibold py-3 px-2 text-xs uppercase w-20">
                                        <div className="flex items-center gap-1">
                                            <div className="p-1 bg-yellow-100 dark:bg-yellow-900 rounded">
                                                <Circle className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                                            </div>
                                            <span>Status</span>
                                        </div>
                                    </TableHead>

                                    {/* Kolom Actions */}
                                    <TableHead className="text-gray-900 dark:text-white font-semibold py-3 px-2 text-xs uppercase text-right w-16">
                                        <div className="flex items-center justify-end gap-1">
                                            <div className="p-1 bg-gray-100 dark:bg-gray-600 rounded">
                                                <ArrowUpDown className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                                            </div>
                                        </div>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {isLoading ? (
                                    // ✅ State loading → skeleton
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            {Array.from({ length: columnCount }).map((_, cellIndex) => (
                                                <TableCell key={cellIndex} className="px-2 py-2">
                                                    <Skeleton className="h-4 w-full" />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : products.length === 0 ? (
                                    // ✅ State kosong → tampilkan pesan
                                    <TableRow>
                                        <TableCell colSpan={columnCount} className="px-4 py-8 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                                <Package className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
                                                <p className="text-base font-medium">No products found</p>
                                                <p className="text-sm mt-1">Get started by adding your first product</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    // ✅ State ada data → render daftar produk
                                    products.map((product) => (
                                        <React.Fragment key={product.id}>
                                            <TableRow
                                                ref={(el) => {
                                                    rowRefs.current[product.id] = el;
                                                }}
                                                className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50
        ${product.id === highlightId ? "bg-yellow-200 dark:bg-yellow-900 animate-pulse" : ""}
    `}
                                                onClick={(e) => handleRowClick(e, product.id)}
                                            >

                                                {/* Kolom Gambar */}
                                                <TableCell className="px-2 py-2">
                                                    <div className="flex items-center justify-center">
                                                        {product.image ? (
                                                            <div className="relative h-8 w-8 rounded overflow-hidden border border-gray-200 dark:border-gray-600">
                                                                <Image
                                                                    src={makeImageSrc(product.image) || "/placeholder-image.png"}
                                                                    alt={product.name}
                                                                    fill
                                                                    className="object-cover"
                                                                    sizes="32px"
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement;
                                                                        target.src = "/placeholder-image.png";
                                                                    }}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="h-8 w-8 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-600">
                                                                <ImageIcon className="h-3 w-3 text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* Kolom Kode Produk */}
                                                <TableCell className="hidden md:table-cell px-2 py-2">
                                                    <div className="flex flex-col">
                                                        <span className="font-mono text-xs font-semibold text-gray-900 dark:text-white">
                                                            {product.code}
                                                        </span>
                                                        {product.barcode && (
                                                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                                                                {product.barcode}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* Kolom Nama Produk */}
                                                <TableCell className="px-2 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-shrink-0">
                                                            {getProductIcon(product.type)}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <span className="font-medium text-xs md:text-sm text-gray-900 dark:text-white text-wrap">
                                                                {product.name}
                                                            </span>
                                                            {product.description && (
                                                                <span className="text-xs md:text-sm text-muted-foreground text-wrap">
                                                                    {product.description}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Kolom Tipe Produk */}
                                                <TableCell className="hidden md:table-cell px-2 py-2">
                                                    <Badge
                                                        variant="secondary"
                                                        className={`text-xs ${getProductTypeColor(product.type)}`}
                                                    >
                                                        {product.type || "Unknown"}
                                                    </Badge>
                                                </TableCell>

                                                {/* Kolom Kategori */}
                                                <TableCell className="hidden md:table-cell px-2 py-2">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                                        {product.category?.name || "-"}
                                                    </span>
                                                </TableCell>

                                                {/* Kolom Units & Conversion */}
                                                <TableCell className="hidden md:table-cell px-2 py-2">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1 text-xs">
                                                            <ShoppingCart className="h-3 w-3 text-blue-500" />
                                                            <span className="font-medium">{product.purchaseUnit}</span>
                                                            <span className="text-gray-400">→</span>
                                                            <Warehouse className="h-3 w-3 text-green-500" />
                                                            <span className="font-medium">{product.storageUnit}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                            <Gauge className="h-3 w-3" />
                                                            <span>Ratio: {product.conversionToStorage}:1</span>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Kolom Status */}
                                                <TableCell className="px-2 py-2">
                                                    <div className="flex flex-col gap-1">
                                                        <Badge
                                                            variant={product.isActive ? "default" : "secondary"}
                                                            className={`text-xs h-5 ${product.isActive
                                                                ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400"
                                                                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                                                                }`}
                                                        >
                                                            {product.isActive ? "Active" : "Inactive"}
                                                        </Badge>
                                                        <Badge
                                                            variant={product.isConsumable ? "default" : "secondary"}
                                                            className="text-xs h-4 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400"
                                                        >
                                                            {product.isConsumable ? "Consumable" : "Non-Consumable"}
                                                        </Badge>
                                                    </div>
                                                </TableCell>

                                                {/* Kolom Actions */}
                                                <TableCell className="px-2 py-2 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleExpand(product.id);
                                                            }}
                                                        >
                                                            {expandedProducts.has(product.id) ? (
                                                                <ChevronDown className="h-3 w-3" />
                                                            ) : (
                                                                <ChevronRight className="h-3 w-3" />
                                                            )}
                                                        </Button>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 w-6 p-0"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <MoreVertical className="h-3 w-3" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-40">
                                                                <DropdownMenuItem asChild>
                                                                    <Link
                                                                        href={`${basePath}/update/${product.id}?returnUrl=${encodeURIComponent(
                                                                            `${fullUrl}&highlightId=${product.id}`
                                                                        )}`}
                                                                        className="flex w-24 items-center gap-2 px-2 py-1.5 border border-green-200 text-green-600 rounded-md text-xs hover:bg-green-50 dark:hover:bg-green-900/20 transition"
                                                                    >
                                                                        <Edit className="h-3 w-3" />
                                                                        Edit
                                                                    </Link>

                                                                </DropdownMenuItem>

                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="gap-2 text-xs focus:text-red-600 p-0"
                                                                    onSelect={(e) => e.preventDefault()}
                                                                >
                                                                    <DeleteProductAlert
                                                                        id={product.id}
                                                                        onDelete={() => { }}
                                                                    />
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </TableCell>
                                            </TableRow>

                                            {/* Expanded Row Details - BEDA MOBILE & DESKTOP */}
                                            {expandedProducts.has(product.id) && (
                                                <TableRow className="bg-blue-50/50 dark:bg-blue-900/20">
                                                    <TableCell colSpan={columnCount} className="px-2 py-2">
                                                        {isMobile ? (
                                                            // MOBILE EXPAND - SUPER COMPACT (tetap sama)
                                                            <div className="p-2 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-800 space-y-3">
                                                                {/* Foto Produk */}
                                                                <div className="flex justify-center">
                                                                    {product.image ? (
                                                                        <div className="relative h-16 w-16 rounded overflow-hidden border border-gray-200 dark:border-gray-600">
                                                                            <Image
                                                                                src={makeImageSrc(product.image) || "/placeholder-image.png"}
                                                                                alt={product.name}
                                                                                fill
                                                                                className="object-cover"
                                                                                sizes="64px"
                                                                                onError={(e) => {
                                                                                    const target = e.target as HTMLImageElement;
                                                                                    target.src = "/placeholder-image.png";
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="h-16 w-16 rounded bg-gray-100 dark:bg-gray-700 flex flex-col items-center justify-center border border-dashed border-gray-300 dark:border-gray-600">
                                                                            <ImageIcon className="h-4 w-4 text-gray-400" />
                                                                            <p className="text-[8px] text-gray-500 mt-1">No image</p>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Detail Grid - Vertical */}
                                                                <div className="space-y-2">
                                                                    <div className="flex justify-between items-center text-xs">
                                                                        <span className="text-muted-foreground">Type:</span>
                                                                        <Badge
                                                                            variant="secondary"
                                                                            className={`text-[10px] h-4 ${getProductTypeColor(product.type)}`}
                                                                        >
                                                                            {product.type || "Unknown"}
                                                                        </Badge>
                                                                    </div>

                                                                    <div className="flex justify-between items-center text-xs">
                                                                        <span className="text-muted-foreground">Consumable:</span>
                                                                        <Badge variant={product.isConsumable ? "default" : "secondary"} className="text-[10px] h-4">
                                                                            {product.isConsumable ? "Yes" : "No"}
                                                                        </Badge>
                                                                    </div>

                                                                    {product.category && (
                                                                        <div className="flex justify-between items-center text-xs">
                                                                            <span className="text-muted-foreground">Category:</span>
                                                                            <span className="font-medium text-right text-xs">{product.category.name}</span>
                                                                        </div>
                                                                    )}

                                                                    <div className="flex justify-between items-center text-xs">
                                                                        <span className="text-muted-foreground">Units:</span>
                                                                        <span className="font-medium text-xs">{product.purchaseUnit} → {product.storageUnit}</span>
                                                                    </div>

                                                                    <div className="flex justify-between items-center text-xs">
                                                                        <span className="text-muted-foreground">Conversion:</span>
                                                                        <span className="font-medium text-xs">{product.conversionToStorage}:1</span>
                                                                    </div>

                                                                    {product.barcode && (
                                                                        <div className="flex justify-between items-center text-xs">
                                                                            <span className="text-muted-foreground">Barcode:</span>
                                                                            <span className="font-medium font-mono text-[10px]">{product.barcode}</span>
                                                                        </div>
                                                                    )}

                                                                    <div className="flex justify-between items-center text-xs">
                                                                        <span className="text-muted-foreground">Created:</span>
                                                                        <span className="font-medium text-[10px]">
                                                                            {new Date(product.createdAt).toLocaleDateString("id-ID")}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Description */}
                                                                <div className="space-y-1">
                                                                    <h4 className="font-semibold text-xs flex items-center gap-1">
                                                                        <Tag className="h-3 w-3 text-orange-500" />
                                                                        Description
                                                                    </h4>
                                                                    <p className="text-[10px] text-muted-foreground bg-gray-50 dark:bg-gray-700/40 rounded p-2 max-h-16 overflow-y-auto">
                                                                        {product.description || "No description available"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            // DESKTOP EXPAND - LENGKAP & PROFESIONAL
                                                            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
                                                                <div className="grid grid-cols-12 gap-6">
                                                                    {/* Gambar Produk - Kiri */}
                                                                    <div className="col-span-2">
                                                                        <div className="flex flex-col items-center space-y-3">
                                                                            {product.image ? (
                                                                                <div className="relative h-24 w-24 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 shadow-sm">
                                                                                    <Image
                                                                                        src={makeImageSrc(product.image) || "/placeholder-image.png"}
                                                                                        alt={product.name}
                                                                                        fill
                                                                                        className="object-cover"
                                                                                        sizes="96px"
                                                                                        onError={(e) => {
                                                                                            const target = e.target as HTMLImageElement;
                                                                                            target.src = "/placeholder-image.png";
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            ) : (
                                                                                <div className="h-24 w-24 rounded-lg bg-gray-100 dark:bg-gray-700 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                                                                                    <ImageIcon className="h-6 w-6 text-gray-400 mb-1" />
                                                                                    <p className="text-xs text-gray-500 text-center">No image</p>
                                                                                </div>
                                                                            )}
                                                                            <div className="text-center">
                                                                                <Badge
                                                                                    variant={product.isActive ? "default" : "secondary"}
                                                                                    className={`text-xs ${product.isActive
                                                                                        ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400"
                                                                                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                                                                                        }`}
                                                                                >
                                                                                    {product.isActive ? "Active" : "Inactive"}
                                                                                </Badge>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Informasi Utama - Tengah */}
                                                                    <div className="col-span-5">
                                                                        <div className="space-y-4">
                                                                            <div>
                                                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                                                    {getProductIcon(product.type)}
                                                                                    {product.name}
                                                                                </h3>
                                                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                                                    {product.code}
                                                                                </p>
                                                                            </div>
                                                                            <div className="grid grid-cols-2 gap-4">
                                                                                <div className="space-y-3">
                                                                                    <div>
                                                                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                                                            Product Type
                                                                                        </label>
                                                                                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                                                                                            <Badge
                                                                                                variant="secondary"
                                                                                                className={`text-xs ${getProductTypeColor(product.type)}`}
                                                                                            >
                                                                                                {product.type || "Unknown"}
                                                                                            </Badge>
                                                                                        </p>
                                                                                    </div>

                                                                                    <div>
                                                                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                                                            Category
                                                                                        </label>
                                                                                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                                                                                            {product.category?.name || "No category"}
                                                                                        </p>
                                                                                    </div>

                                                                                    <div>
                                                                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                                                            Consumable
                                                                                        </label>
                                                                                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                                                                                            <Badge variant={product.isConsumable ? "default" : "secondary"} className="text-xs">
                                                                                                {product.isConsumable ? "Yes" : "No"}
                                                                                            </Badge>
                                                                                        </p>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="space-y-3">
                                                                                    <div>
                                                                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                                                            Purchase Unit
                                                                                        </label>
                                                                                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                                                                                            {product.purchaseUnit}
                                                                                        </p>
                                                                                    </div>

                                                                                    <div>
                                                                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                                                            Storage Unit
                                                                                        </label>
                                                                                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                                                                                            {product.storageUnit}
                                                                                        </p>
                                                                                    </div>

                                                                                    <div>
                                                                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                                                            Conversion Ratio
                                                                                        </label>
                                                                                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                                                                                            {product.conversionToStorage}:1
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Informasi Tambahan - Kanan */}
                                                                    <div className="col-span-5">
                                                                        <div className="space-y-4">
                                                                            {product.barcode && (
                                                                                <div>
                                                                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
                                                                                        <Barcode className="h-3 w-3" />
                                                                                        Barcode
                                                                                    </label>
                                                                                    <p className="text-sm font-mono font-medium text-gray-900 dark:text-white mt-1 bg-gray-50 dark:bg-gray-700/50 p-2 rounded border">
                                                                                        {product.barcode}
                                                                                    </p>
                                                                                </div>
                                                                            )}

                                                                            <div className="grid grid-cols-2 gap-4">
                                                                                <div>
                                                                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                                                        Created Date
                                                                                    </label>
                                                                                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                                                                                        {new Date(product.createdAt).toLocaleDateString("id-ID", {
                                                                                            weekday: 'long',
                                                                                            year: 'numeric',
                                                                                            month: 'long',
                                                                                            day: 'numeric'
                                                                                        })}
                                                                                    </p>
                                                                                </div>

                                                                                <div>
                                                                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                                                        Last Updated
                                                                                    </label>
                                                                                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                                                                                        {new Date(product.updatedAt).toLocaleDateString("id-ID", {
                                                                                            year: 'numeric',
                                                                                            month: 'short',
                                                                                            day: 'numeric'
                                                                                        })}
                                                                                    </p>
                                                                                </div>
                                                                            </div>

                                                                            <div>
                                                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
                                                                                    <Tag className="h-3 w-3 text-orange-500" />
                                                                                    Description
                                                                                </label>
                                                                                <div className="mt-2">
                                                                                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 max-h-32 overflow-y-auto border">
                                                                                        {product.description || "No description available for this product."}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Action Buttons - Bottom */}
                                                                <div className="flex justify-right space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        asChild
                                                                        className="gap-2"
                                                                    >
                                                                        <Link
                                                                            href={`${basePath}/update/${product.id}?returnUrl=${encodeURIComponent(
                                                                                `${basePath}?page=${currentPage}&highlightId=${product.id}`
                                                                            )}`}
                                                                        >
                                                                            <Edit className="h-4 w-4" />
                                                                            Edit Product
                                                                        </Link>
                                                                    </Button>
                                                                    <DeleteProductAlert
                                                                        id={product.id}
                                                                        onDelete={() => { }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ProductList;