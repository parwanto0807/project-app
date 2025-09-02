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
    ShoppingCart,
    Barcode,
    Search,
    Plus,
    ChevronLeft,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import React, { useEffect, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { formatDateToDDMMMYYYY } from "@/lib/utils";
import Image from "next/image";
import { makeImageSrc } from "@/utils/makeImageSrc";
import DeleteProductAlert from "./alert-delete";

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
    itemsPerPage?: number;
    role: string
}

function getBasePath(role?: string) {
  return role === "super"
    ? "/super-admin-area/master/products"
    : "/admin-area/master/products"
}

const ProductList = ({
    products,
    isLoading,
    onSearch,
    currentPage = 1,
    totalPages = 1,
    onPageChange,
    itemsPerPage = 10,
    role,
}: ProductListProps) => {
    const [expandedProducts, setExpandedProducts] = useState<Set<string>>(
        new Set()
    );
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [internalCurrentPage, setInternalCurrentPage] = useState(currentPage);
    const basePath = getBasePath(role)

    // Update internal current page when prop changes
    useEffect(() => {
        setInternalCurrentPage(currentPage);
    }, [currentPage]);

    // Debounce search term to avoid too many API calls
    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);

        return () => {
            clearTimeout(timerId);
        };
    }, [searchTerm]);

    // Handle search with debounced term
    useEffect(() => {
        if (onSearch) {
            onSearch(debouncedSearchTerm);
            setInternalCurrentPage(1); // Reset to first page on search
            if (onPageChange) {
                onPageChange(1);
            }
        } else {
            // Client-side filtering as fallback
            const filtered = products.filter((product) =>
                `${product.code} ${product.name} ${product.category?.name || ""} ${product.storageUnit}`
                    .toLowerCase()
                    .includes(debouncedSearchTerm.toLowerCase())
            );
            setFilteredProducts(filtered);
            setInternalCurrentPage(1); // Reset to first page on search
        }
    }, [debouncedSearchTerm, products, onSearch, onPageChange]);

    // Update filtered products when products prop changes
    useEffect(() => {
        if (!onSearch) {
            setFilteredProducts(products);
        }
    }, [products, onSearch]);

    // Calculate pagination
    const paginatedProducts = useMemo(() => {
        if (onSearch) {
            // If using server-side search/pagination, use the products as-is
            return products;
        } else {
            // Client-side pagination
            const startIndex = (internalCurrentPage - 1) * itemsPerPage;
            return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
        }
    }, [products, filteredProducts, internalCurrentPage, itemsPerPage, onSearch]);

    // Calculate total pages for client-side pagination
    const calculatedTotalPages = onSearch ? totalPages : Math.ceil(filteredProducts.length / itemsPerPage);

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

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
    };

    const handlePageChange = (page: number) => {
        setInternalCurrentPage(page);
        if (onPageChange) {
            onPageChange(page);
        }
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

    // Determine which products to display
    const displayProducts = paginatedProducts;

    return (
        <div className="rounded-t-2xl border bg-white dark:bg-gray-800 shadow-sm dark:border-gray-700">
            {/* Search and Create Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 md:p-6 border-b dark:border-gray-700">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search products..."
                        className="pl-10 w-full rounded-lg border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </div>
                <Button asChild className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg shadow-sm">
                    <Link href={`${basePath}/create`} className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Product
                    </Link>
                </Button>
            </div>

            <div className="rounded-md border">
                <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <TableHeader className="bg-gray-50 dark:bg-gray-700">
                        <TableRow>
                            <TableHead className="uppercase">Code</TableHead>
                            <TableHead className="uppercase">Name</TableHead>
                            <TableHead className="hidden md:table-cell uppercase">Type</TableHead>
                            <TableHead className="hidden lg:table-cell uppercase">Units</TableHead>
                            <TableHead className="hidden sm:table-cell uppercase">Status</TableHead>
                            <TableHead className="text-right uppercase">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {isLoading ? (
                            // ✅ State loading → skeleton
                            Array.from({ length: 5 }).map((_, i) => (
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
                        ) : displayProducts.length === 0 ? (
                            // ✅ State kosong → tampilkan pesan
                            <TableRow>
                                <TableCell colSpan={6} className="px-4 py-8 text-center">
                                    <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                        <Search className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-4" />
                                        <p className="text-lg font-medium">No products found</p>
                                        <p className="text-sm">Try adjusting your search query</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            // ✅ State ada data → render daftar produk
                            displayProducts.map((product) => (
                                <React.Fragment key={product.id}>
                                    <TableRow
                                        className="cursor-pointer transition-colors hover:bg-muted/50 dark:hover:bg-gray-700"
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
                                            <div className="flex items-center justify-end gap-1">
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
                                                            <Link href={`${basePath}/update/${product.id}`}>
                                                                <Edit className="h-4 w-4 text-green-500 dark:text-green-400" />
                                                                Edit
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="border-t border-gray-200 dark:border-gray-600" />
                                                        <DropdownMenuItem
                                                            className="gap-2 focus:text-red-600  dark:focus:text-red-400 p-0"
                                                            onSelect={(e) => e.preventDefault()}
                                                        >
                                                            <DeleteProductAlert
                                                                id={product.id}
                                                                onDelete={() => {
                                                                    if (!onSearch) {
                                                                        setFilteredProducts(prev => prev.filter(p => p.id !== product.id));
                                                                    }
                                                                }}
                                                            />
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
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
                                                                <div className="pl-2 text-wrap">{product.description || "No description"}</div>
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
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            {/* Pagination */}
            {calculatedTotalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t dark:border-gray-700">
                    <div className="text-sm text-muted-foreground">
                        Showing {displayProducts.length} of {onSearch ? "many" : filteredProducts.length} products
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(1)}
                            disabled={internalCurrentPage <= 1}
                            className="hidden sm:flex"
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(internalCurrentPage - 1)}
                            disabled={internalCurrentPage <= 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="ml-1 hidden sm:inline">Previous</span>
                        </Button>
                        <div className="text-sm text-muted-foreground mx-2">
                            Page {internalCurrentPage} of {calculatedTotalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(internalCurrentPage + 1)}
                            disabled={internalCurrentPage >= calculatedTotalPages}
                        >
                            <span className="mr-1 hidden sm:inline">Next</span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(calculatedTotalPages)}
                            disabled={internalCurrentPage >= calculatedTotalPages}
                            className="hidden sm:flex"
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductList;