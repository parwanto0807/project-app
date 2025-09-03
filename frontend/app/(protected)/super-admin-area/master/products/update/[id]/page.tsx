"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SuperLayout } from "@/components/admin-panel/super-layout";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";
import { UpdateProductForm } from "@/components/master/product/updateFormData";
import { fetchProductById } from "@/lib/action/master/product";
import { ProductUpdateSchema } from "@/schemas";
import { z } from "zod";
import Link from "next/link";
import { Loader2 } from "lucide-react"; // Import the spinner icon

type Product = z.infer<typeof ProductUpdateSchema>;

export default function UpdateProductPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();
  const { user, loading } = useCurrentUser();

  const [data, setData] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [role, setRole] = useState<"super">("super");
  const [loadingData, setLoadingData] = useState(false);
  const [accessToken, setAccessToken] = useState<string | undefined>(undefined);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    } else if (!loading && user) {
      setRole(user.role as typeof role);
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken") || undefined;
      setAccessToken(token);
      // console.log("Access Token:", token);
    }
  }, []);

  useEffect(() => {
    if (!id) return;

    setLoadingData(true);
    const fetchData = async () => {
      try {
        const productData = await fetchProductById(id);
        if (!productData) throw new Error("Data tidak ditemukan.");
        setData(productData);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        toast.error("Gagal memuat data", {
          description: err instanceof Error ? err.message : "Silakan coba lagi",
        });
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [id]);

  return (
    <SuperLayout title="Update Data" role={role}>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/super-admin-area/master/products">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/super-admin-area/master/products">Product List</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Update</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {loading || loadingData ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative">
            {/* Spinner with pulse animation */}
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-4 border-primary/10 animate-pulse"></div>
          </div>
          <p className="mt-4 text-lg font-medium text-gray-600">
            Loading product data...
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Please wait while we prepare your product details
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="bg-red-100 p-4 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-center text-red-500 text-lg font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : data ? (
        <UpdateProductForm productId={data.id} accessToken={accessToken} role={role} />
      ) : (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="bg-yellow-100 p-4 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-yellow-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-center text-yellow-600 text-lg font-medium">
            Data tidak ditemukan. {id ? `(ID: ${id})` : ''}
          </p>
          <button
            onClick={() => router.push("/super-admin-area/master/products")}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            Back to Product List
          </button>
        </div>
      )}
    </SuperLayout>
  );
}