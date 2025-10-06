"use server";

import { randomUUID } from "crypto";

export async function generateProductCode() {
  const shortId = randomUUID().slice(0, 8).toUpperCase();
  return `PRD-${shortId}`;
}

export async function fetchAllProducts() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/master/product/getAllProducts`,
      {
        method: "GET",
        credentials: "include", // 👉 penting biar cookie ikut terkirim
        cache: "no-store",
      }
    );

    if (!res.ok) throw new Error(`Gagal fetch produk: ${res.status}`);

    const data = await res.json();
    return { products: data || [], isLoading: false };
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
interface Product {
  id: string;
  name: string;
  type: "Material" | "Jasa" | "Alat";
  usageUnit: string;
  description: string;
  // contoh: price: number; description: string; dll.
}

export async function fetchAllProductsByType(
  accessToken?: string,
  type?: "PRODUCT" | "SERVICE" | "CUSTOM"
) {
  try {
    let url: string;

    if (type) {
      const backendType = typeMapping[type];
      url = `${process.env.NEXT_PUBLIC_API_URL}/api/master/product/getAllProductsByType/${backendType}`;
    } else {
      url = `${process.env.NEXT_PUBLIC_API_URL}/api/master/product/getAllProducts`;
    }

    const res = await fetch(url, {
      method: "GET",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      cache: "no-store",
      credentials: "include",
    });

    if (!res.ok) throw new Error(`Gagal fetch produk: ${res.status}`);

    const data: Product[] = await res.json();

    return { products: data || [], isLoading: false };
  } catch (error) {
    console.error("[fetchAllProductsByType]", error);
    return { products: [], isLoading: false };
  }
}

export async function fetchProductById(id: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/master/product/getProductById/${id}`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch product: ${res.status}`);
    }

    return await res.json(); // Return the product data directly
  } catch (error) {
    console.error("[fetchProductById]", error);
    throw error; // Re-throw to handle in component
  }
}

// export async function fetchProductById(id: string) {
//   try {
//     const res = await fetch(
//       `${process.env.NEXT_PUBLIC_API_URL}/api/master/product/getProductById/${id}`,
//       {
//         method: "GET",
//         credentials: "include",
//         cache: "no-store",
//       }
//     );

//     if (!res.ok) {
//       throw new Error(`Failed to fetch product by ID: ${res.status}`);
//     }

//     const data = await res.json();

//     // Transform the data to match form expectations
//     return {
//       ...data,
//       conversionToStorage: String(data.conversionToStorage || '1'),
//       conversionToUsage: String(data.conversionToUsage || '1'),
//       isConsumable: Boolean(data.isConsumable),
//       isActive: Boolean(data.isActive),
//     };
//   } catch (error) {
//     console.error("[fetchProductById]", error);
//     throw error; // Re-throw to handle in component
//   }
// }
