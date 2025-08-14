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
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
    ChevronDown,
    ChevronRight,
    Edit,
    Trash,
    Box,
    Package,
    Hammer,
    ShoppingCart,
    Barcode,
    Search,
    Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { formatDateToDDMMMYYYY } from "@/lib/utils";
import Image from "next/image";
import { makeImageSrc } from "@/utils/makeImageSrc";

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
    onSearch?: (searchTerm: string) => void;
    onCreate?: () => void;
    currentPage?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
}

const ProductList = ({
    products,
    isLoading,
    onSearch,
    currentPage = 1,
    totalPages = 1,
    onPageChange,
}: ProductListProps) => {
    const [expandedProducts, setExpandedProducts] = useState<Set<string>>(
        new Set()
    );
    const [searchTerm, setSearchTerm] = useState("");

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (onSearch) {
            onSearch(value);
        }
    };

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
                return <Package className="h-5 w-5 text-blue-500" />;
            case "jasa":
                return <Hammer className="h-5 w-5 text-green-500" />;
            case "alat":
                return <Hammer className="h-5 w-5 text-purple-500" />;
            default:
                return <Box className="h-5 w-5 text-orange-500" />;
        }
    };

    return (
        <div className="space-y-4">
            {/* Search and Create Header */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search products..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                </div>
                <Button asChild className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg shadow-sm">
                    <Link href="/super-admin-area/master/products/create" className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Product
                    </Link>
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="uppercase">Code</TableHead>
                            <TableHead className="uppercase">Name</TableHead>
                            <TableHead className="hidden md:table-cell uppercase">Type</TableHead>
                            <TableHead className="hidden lg:table-cell uppercase">Units</TableHead>
                            <TableHead className="hidden sm:table-cell uppercase">Status</TableHead>
                            <TableHead className="text-right uppercase">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading
                            ? Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell>
                                        <Skeleton className="h-4 w-4 rounded-full" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-20" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-32" />
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <Skeleton className="h-4 w-24" />
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell">
                                        <Skeleton className="h-4 w-36" />
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        <Skeleton className="h-4 w-16" />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Skeleton className="h-8 w-8 ml-auto" />
                                    </TableCell>
                                </TableRow>
                            ))
                            : products.map((product) => (
                                <React.Fragment key={product.id}>
                                    <TableRow
                                        className="hover:bg-muted/50 cursor-pointer"
                                        onClick={(e) => handleRowClick(e, product.id)}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getProductIcon(product.type)}
                                                <span className="font-medium">{product.code}</span>
                                                {product.barcode && (
                                                    <Barcode
                                                        className="h-4 w-4 text-muted-foreground hidden sm:inline"
                                                        strokeWidth={1.5}
                                                    />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-wrap">{product.name}</div>
                                            <div className="text-sm text-muted-foreground md:hidden">
                                                {product.type}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            {product.type || "Unknown"}
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            <div className="flex gap-1 text-sm text-muted-foreground">
                                                <span>
                                                    {product.purchaseUnit} → {product.storageUnit} (
                                                    {product.conversionToStorage.toString()})
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <Badge
                                                variant={product.isActive ? "default" : "secondary"}
                                                className={
                                                    product.isActive
                                                        ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400"
                                                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                                                }
                                            >
                                                {product.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleExpand(product.id);
                                                }}
                                            >
                                                {expandedProducts.has(product.id) ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <span className="sr-only">Open menu</span>
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            width="16"
                                                            height="16"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            className="lucide lucide-ellipsis-vertical"
                                                        >
                                                            <circle cx="12" cy="12" r="1" />
                                                            <circle cx="12" cy="5" r="1" />
                                                            <circle cx="12" cy="19" r="1" />
                                                        </svg>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="dropdown-menu">
                                                    <DropdownMenuItem asChild className="gap-2">
                                                        <Link href={`/super-admin-area/master/products/update/${product.id}`}>
                                                            <Edit className="h-4 w-4" />
                                                            Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400">
                                                        <Trash className="h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                    {expandedProducts.has(product.id) && (
                                        <TableRow className="bg-blue-50 dark:bg-gray-700">
                                            <TableCell colSpan={6} className="px-6 py-4">
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">

                                                    {/* Product Details */}
                                                    <div className="space-y-3">
                                                        <h4 className="font-semibold text-blue-600 dark:text-blue-400 text-base flex items-center gap-2">
                                                            <Box className="h-4 w-4" /> Product Details
                                                        </h4>
                                                        <div className="text-sm space-y-1">
                                                            <div>
                                                                <span className="text-muted-foreground">Description:</span>
                                                                <div className="pl-2">{product.description || "No description"}</div>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">Consumable:</span>
                                                                <div className="pl-2">{product.isConsumable ? "Yes" : "No"}</div>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">Category:</span>
                                                                <div className="pl-2">{product.category?.name || product.categoryId || "Uncategorized"}</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Unit Conversions */}
                                                    <div className="space-y-3">
                                                        <h4 className="font-semibold text-blue-600 dark:text-blue-400 text-base flex items-center gap-2">
                                                            <ShoppingCart className="h-4 w-4" /> Unit Conversions
                                                        </h4>
                                                        <div className="text-sm space-y-1">
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Purchase Unit:</span>
                                                                <span>{product.purchaseUnit}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Storage Unit:</span>
                                                                <span>{product.storageUnit}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Usage Unit:</span>
                                                                <span>{product.usageUnit}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Storage Conversion:</span>
                                                                <span>1 {product.purchaseUnit} = {product.conversionToStorage} {product.storageUnit}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Usage Conversion:</span>
                                                                <span>1 {product.storageUnit} = {product.conversionToUsage} {product.usageUnit}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Additional Info */}
                                                    <div className="space-y-3">
                                                        <h4 className="font-semibold text-blue-600 dark:text-blue-400 text-base flex items-center gap-2">
                                                            <Barcode className="h-4 w-4" /> Additional Info
                                                        </h4>
                                                        <div className="text-sm space-y-1">
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Created At:</span>
                                                                <span>{formatDateToDDMMMYYYY(product.createdAt)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Updated At:</span>
                                                                <span>{formatDateToDDMMMYYYY(product.updatedAt)}</span>
                                                            </div>
                                                            {product.barcode && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-muted-foreground">Barcode:</span>
                                                                    <span>{product.barcode}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Product Image */}
                                                    <div className="space-y-3">
                                                        <h4 className="font-semibold text-blue-600 dark:text-blue-400 text-base">
                                                            Product Image
                                                        </h4>
                                                        <div className="w-full aspect-square max-w-[180px] mx-auto border rounded-lg overflow-hidden bg-muted shadow-md flex items-center justify-center">
                                                            {product.image ? (
                                                                <Image
                                                                    src={makeImageSrc(product.image)}
                                                                    alt="Product Image"
                                                                    width={180}
                                                                    height={180}
                                                                    className="object-cover w-full h-full"
                                                                />
                                                            ) : (
                                                                <span className="text-sm text-muted-foreground">No image</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}

                                </React.Fragment>
                            ))}
                    </TableBody>
                </Table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <div className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange?.(currentPage - 1)}
                            disabled={currentPage <= 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange?.(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductList;