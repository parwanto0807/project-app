// lib/action/master/product.ts
export async function fetchAllProducts() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/master/product/getAllProducts`,
      {
        method: "GET",
        // headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        cache: "no-store",
        credentials: "include"
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
