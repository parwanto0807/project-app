"use server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchPayrollConfigs() {
  try {
    const res = await fetch(`${API_URL}/api/payroll/config`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`Gagal fetch: ${res.status}`);

    const data = await res.json();
    return { success: true, data };
  } catch (error: any) {
    console.error("[fetchPayrollConfigs]", error);
    return { success: false, error: error.message };
  }
}

export async function createPayrollConfig(data: any) {
  try {
    const res = await fetch(`${API_URL}/api/payroll/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });

    if (!res.ok) throw new Error(`Gagal create: ${res.status}`);

    const result = await res.json();
    return { success: true, data: result };
  } catch (error: any) {
    console.error("[createPayrollConfig]", error);
    return { success: false, error: error.message };
  }
}

export async function updatePayrollConfig(id: string, data: any) {
  try {
    const res = await fetch(`${API_URL}/api/payroll/config/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });

    if (!res.ok) throw new Error(`Gagal update: ${res.status}`);

    const result = await res.json();
    return { success: true, data: result };
  } catch (error: any) {
    console.error("[updatePayrollConfig]", error);
    return { success: false, error: error.message };
  }
}
