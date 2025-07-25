"use server";

export async function fetchAllProducts() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/master/product/getAllProducts`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error(`Gagal fetch produk: ${res.status}`);
    }

    const data = await res.json();
    return {
      products: data || [],
      isLoading: false,
    };
  } catch (error) {
    console.error("[fetchAllProducts]", error);
    return {
      products: [],
      isLoading: false,
    };
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
      throw new Error(`Gagal fetch product by ID: ${res.status}`);
    }

    const data = await res.json();
    return {
      product: data || null,
      isLoading: false,
    };
  } catch (error) {
    console.error("[fetchProductById]", error);
    return {
      product: null,
      isLoading: false,
    };
  }
}
