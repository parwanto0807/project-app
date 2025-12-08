import { api } from "@/lib/http";
import { SupplierCategory, SupplierCategoryInput } from "@/types/supplierType";

/**
 * ✅ Get all Supplier Categories
 */
export async function fetchSupplierCategories(): Promise<SupplierCategory[]> {
  try {
    const response = await api.get("/api/supplier-categories");
    
    // Response format: { success: true, data: [...] }
    if (response.data?.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    // Jika format berbeda
    console.warn('Unexpected response format:', response.data);
    return [];
    
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

/**
 * ✅ Get category by ID
 */
export async function fetchSupplierCategoryById(
  id: string
): Promise<SupplierCategory> {
  const response = await api.get<SupplierCategory>(
    `/api/supplier-categories/${id}`
  );
  return response.data;
}

/**
 * ✅ Create new category
 */
export async function createSupplierCategory(
  data: SupplierCategoryInput
): Promise<SupplierCategory> {
  const response = await api.post<SupplierCategory>(
    "/api/supplier-categories",
    data
  );
  return response.data;
}

/**
 * ✅ Update category by ID
 */
export async function updateSupplierCategory(
  id: string,
  data: SupplierCategoryInput
): Promise<SupplierCategory> {
  const response = await api.put<SupplierCategory>(
    `/api/supplier-categories/${id}`,
    data
  );
  return response.data;
}

/**
 * ❌ Soft / Hard delete category
 */
export async function deleteSupplierCategory(
  id: string
): Promise<{ success: boolean }> {
  const response = await api.delete<{ success: boolean }>(
    `/api/supplier-categories/${id}`
  );
  return response.data;
}
