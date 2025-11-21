"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchAllProducts } from "@/lib/action/master/product";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";
import ProductList from "@/components/master/product/tabelData";
import { useSession } from "@/components/clientSessionProvider";
import Pagination from "@/components/ui/paginationNew";
import CreateProductButton from "@/components/master/product/create-product-button";
import HeaderCard from "@/components/ui/header-card";
import { Package } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import SearchInput from "@/components/shared/SearchInput";

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
  category?: { id: string; name: string } | null;
}

export default function ProductPageAdmin() {
  const [product, setProduct] = useState<Product[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Ambil search term dari URL params
  const urlSearchTerm = searchParams.get("search") || "";
  const currentPage = Number(searchParams.get("page")) || 1;
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const highlightId = searchParams.get("highlightId") || null;
  const { user, isLoading } = useSession();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // State untuk trigger manual re-fetch
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // useEffect dengan refreshTrigger
  useEffect(() => {
    if (isLoading) return;

    if (user?.role !== "admin") {
      router.push("/unauthorized");
      return;
    }

    const fetchData = async () => {
      try {
        const result = await fetchAllProducts();

        const productsData = result.products || [];
        setProduct(productsData);
      } catch (error) {
        console.error("❌ Error fetching products:", error);
        setProduct([]);
      }
    };

    fetchData();
  }, [router, user, isLoading, refreshTrigger]);

  // Filter products berdasarkan search term dari URL
  const filteredProducts = useMemo(() => {
    if (!urlSearchTerm) return product;

    const filtered = product.filter((productItem) =>
      `${productItem.code} ${productItem.name} ${productItem.category?.name || ""} ${productItem.storageUnit}`
        .toLowerCase()
        .includes(urlSearchTerm.toLowerCase())
    );
    return filtered;
  }, [product, urlSearchTerm]);

  // Hitung pagination metadata
  const paginationMeta = useMemo(() => {
    const totalItems = filteredProducts.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

    return {
      currentPage,
      itemsPerPage,
      totalPages,
      startIndex,
      endIndex,
      totalItems
    };
  }, [filteredProducts.length, currentPage, itemsPerPage]);

  // Potong data untuk halaman saat ini
  const paginatedProducts = useMemo(() => {
    const { startIndex, endIndex } = paginationMeta;
    const sliced = filteredProducts.slice(startIndex, endIndex);
    return sliced;
  }, [filteredProducts, paginationMeta]);

  const handleSearch = useCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }
    
    // Reset ke page 1 ketika search berubah
    params.set("page", "1");
    
    router.push(`?${params.toString()}`);
  }, [searchParams, router]);

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    // Reset ke halaman pertama ketika items per page berubah
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  // Handle success create product
  const handleCreateSuccess = useCallback(() => {
    // Trigger refresh data
    setRefreshTrigger(prev => prev + 1);
    
    // Optional: Show success message or other actions
    console.log("Product created successfully, refreshing data...");
  }, []);

  // Key untuk memaksa re-render ProductList
  const productListKey = useMemo(() =>
    `product-list-${currentPage}-${itemsPerPage}-${paginatedProducts.length}-${refreshTrigger}-${urlSearchTerm}`,
    [currentPage, itemsPerPage, paginatedProducts.length, refreshTrigger, urlSearchTerm]);

  const layoutProps: LayoutProps = {
    title: "Product Management",
    role: user?.role || "guest",
    children: (
      <>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Badge variant="outline">
                  <Link href="/admin-area">Dashboard</Link>
                </Badge>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Badge variant="outline">
                  <BreadcrumbPage>Master Data</BreadcrumbPage>
                </Badge>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Badge variant="outline">
                <BreadcrumbPage>Product List</BreadcrumbPage>
              </Badge>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="h-full w-full">
          <div className="flex-1 space-y-4 py-2 pt-4 md:p-8">
            
            {/* Header Card di Page Level */}
            <HeaderCard
              title={isMobile ? "Products" : "Product Management"}
              description={isMobile ? "Manage inventory" : "Manage and track all products in your inventory"}
              icon={<Package className={isMobile ? "h-5 w-5" : "h-7 w-7"} />}
              variant={isMobile ? "compact" : "default"}
              gradientFrom="from-cyan-600"
              gradientTo="to-purple-600"
              showActionArea={true}
              actionArea={
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <SearchInput 
                    onSearch={handleSearch}
                    placeholder="Search products..."
                    className="w-full sm:w-64"
                    disabled={isLoading}
                    initialValue={urlSearchTerm}
                  />
                  <CreateProductButton 
                    role={user?.role || "admin"}
                    onSuccess={handleCreateSuccess}
                    variant="default"
                    size={isMobile ? "sm" : "default"}
                  />
                </div>
              }
            />

            {/* Menampilkan search term dan result count */}
            {urlSearchTerm && (
              <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Showing results for: <span className="font-semibold">&ldquo;{urlSearchTerm}&rdquo;</span>
                  {filteredProducts.length > 0 && (
                    <span className="ml-2">({filteredProducts.length} products found)</span>
                  )}
                </p>
              </div>
            )}

            {/* Product List tanpa header */}
            <ProductList
              key={productListKey}
              products={paginatedProducts}
              isLoading={isLoading}
              role={user?.role || "guest"}
              currentPage={currentPage}
              highlightId={highlightId}
            />

            {/* Info showing items */}
            {paginationMeta.totalItems > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-1 mt-3 border-t pt-3 text-xs md:text-sm">
                {/* Items per page selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                    Items per page
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="w-20 h-8 px-2 border rounded-md text-xs md:text-sm bg-background"
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="30">30</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>

                {/* Total info */}
                <div className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                  Showing {paginationMeta.startIndex + 1}-{paginationMeta.endIndex} of {paginationMeta.totalItems}
                  {urlSearchTerm && ` (filtered from ${product.length} total)`}
                </div>
              </div>
            )}

            {/* Gunakan komponen Pagination baru */}
            {paginationMeta.totalPages > 1 && (
              <div className="flex justify-center mt-1">
                <Pagination totalPages={paginationMeta.totalPages} />
              </div>
            )}

          </div>
        </div>
      </>
    ),
  };

  return <AdminLayout {...layoutProps} />;
}