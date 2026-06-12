"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const c = await cookies();
  const cookieHeader = c.toString();
  const res = await fetch(`${API_URL}/api${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`[fetchAPI] Error from ${endpoint}:`, res.status, data);
    throw new Error(data.message || data.error || "Failed to fetch");
  }
  return data;
}

export async function getAllDisbursements(periodeBulan?: string, siklus?: number) {
  try {
    let url = "/payroll/meal-allowance";
    const params = new URLSearchParams();
    if (periodeBulan) params.append("periodeBulan", periodeBulan);
    if (siklus) params.append("siklus", siklus.toString());
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetchAPI(url);
    return { data: res.data };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getPreviewMealAllowance(karyawanId: string, periodeBulan: string, siklus: number) {
  try {
    const res = await fetchAPI(`/payroll/meal-allowance/preview/${karyawanId}?periodeBulan=${periodeBulan}&siklus=${siklus}`);
    return res;
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function createDisbursement(data: { karyawanId: string, periodeBulan: string, siklus: number }) {
  try {
    const res = await fetchAPI("/payroll/meal-allowance", {
      method: "POST",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin-area/hr/meal-allowance");
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function postDisbursement(id: string) {
  try {
    const res = await fetchAPI(`/payroll/meal-allowance/${id}/post`, { method: "POST" });
    revalidatePath("/admin-area/hr/meal-allowance");
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function voidDisbursement(id: string) {
  try {
    const res = await fetchAPI(`/payroll/meal-allowance/${id}/void`, { method: "POST" });
    revalidatePath("/admin-area/hr/meal-allowance");
    return { success: true, message: res.message };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteDisbursement(id: string) {
  try {
    const res = await fetchAPI(`/payroll/meal-allowance/${id}`, { method: "DELETE" });
    revalidatePath("/admin-area/hr/meal-allowance");
    return { success: true, message: res.message };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
