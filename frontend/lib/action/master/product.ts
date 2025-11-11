"use server";

import { randomUUID } from "crypto";
import { apiFetch } from "@/lib/apiFetch";

export async function generateProductCode() {
  const shortId = randomUUID().slice(0, 8).toUpperCase();
  return `PRD-${shortId}`;
}

export async function fetchAllProducts() {
  try {
    const data = await apiFetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/master/product/getAllProducts`,
      {
        method: "GET",
      }
    );

    return {
      products: Array.isArray(data) ? data : data.products || [],
      isLoading: false,
    };
  } catch (error) {
    console.error("[fetchAllProducts]", error);
    return { products: [], isLoading: false };
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
