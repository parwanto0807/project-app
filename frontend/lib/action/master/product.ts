"use server";

import { randomUUID } from "crypto";
import { apiFetch } from "@/lib/apiFetch";

export async function generateProductCode() {
  const shortId = randomUUID().slice(0, 8).toUpperCase();
  return `PRD-${shortId}`;
}

export async function fetchAllProducts(options?: {
  page?: number;
  limit?: number;
  isActive?: boolean;
}) {
  try {
    let url = `${process.env.NEXT_PUBLIC_API_URL}/api/master/product/getAllProducts?includePagination=false`;

    const data = await apiFetch(url, {
      method: "GET",
    });

    let products = [];
    // Jika backend mengembalikan array langsung
    if (Array.isArray(data)) {
      products = data;
    } else {
      products = data?.products || [];
    }

    // Client-side filtering if options provided (temporary solution until backend supports params)
    if (options?.isActive !== undefined) {
      products = products.filter((p: any) => p.isActive === options.isActive);
    }

    return {
      products: products,
      isLoading: false,
      // Additional properties for compatibility with Stock Opname page
      success: true,
      data: { data: products },
    };
  } catch (error) {
    console.error("[fetchAllProducts]", error);
    return {
      products: [],
      isLoading: false,
      success: false,
      data: { data: [] },
    };
  }
}

const typeMapping: Record<
  "PRODUCT" | "SERVICE" | "CUSTOM",
  "PRODUCT" | "SERVICE" | "CUSTOM"
> = {
  PRODUCT: "PRODUCT", // backend balikin semua selain Jasa
  SERVICE: "SERVICE", // backend balikin hanya Jasa
  CUSTOM: "CUSTOM", // backend balikin hanya Alat (jika ada)
};

// Definisikan tipe untuk product
// interface Product {
//   id: string;
//   name: string;
//   type: "Material" | "Jasa" | "Alat";
//   usageUnit: string;
//   description: string;
//   // contoh: price: number; description: string; dll.
// }

export async function fetchAllProductsByType(
  _accessToken?: string,
  type?: "PRODUCT" | "SERVICE" | "CUSTOM" | "ALL"
) {
  try {
    const url =
      type && type !== "ALL"
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/master/product/getAllProductsByType/${typeMapping[type]}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/master/product/getAllProducts`;

    const response = await apiFetch(url, { method: "GET" });

    // Handle berbagai format response
    const data = Array.isArray(response)
      ? response
      : response?.data || response?.products || [];

    return {
      success: true,
      message: "Products fetched successfully",
      data,
      isLoading: false,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch products",
      data: [],
      isLoading: false,
    };
  }
}

export async function fetchProductById(id: string) {
  try {
    return await apiFetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/master/product/getProductById/${id}`,
      { method: "GET" }
    );
  } catch (error) {
    console.error("[fetchProductById]", error);
    throw error;
  }
}
