"use client";

import { useEffect, useState } from "react";
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
import { useRouter } from "next/navigation";
import { fetchAllProducts } from "@/lib/action/master/product";
import { AdminLayout } from "@/components/admin-panel/admin-layout";
import { LayoutProps } from "@/types/layout";
import ProductList from "@/components/master/product/tabelData";
import { useCurrentUser } from "@/hooks/use-current-user" // ✅ import hook

export default function ProductPageAdmin() {
  const [product, setProduct] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user, loading } = useCurrentUser(); // ✅ ambil user dari hook

  useEffect(() => {
    if (loading) return; // tunggu data user selesai di-load

    if (user?.role !== "admin") {
      router.push("/unauthorized");
      return;
    }

    const fetchData = async () => {
      if (typeof window === "undefined") return;
      const token = localStorage.getItem("accessToken") || undefined;
      console.log("Token", token);

      const result = await fetchAllProducts();
      setProduct(result.products);
      setIsLoading(result.isLoading);
    };

    fetchData();
  }, [router, user, loading]); // ✅ tambahkan user & loading

  const layoutProps: LayoutProps = {
    title: "Product Management",
    role: user?.role || "guest", // ✅ ambil dari user
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
          <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <ProductList products={product} isLoading={isLoading} role={user?.role || "guest"} />
          </div>
        </div>
      </>
    ),
  };

  return <AdminLayout {...layoutProps} />;
}
