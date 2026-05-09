// Updated at: 2026-05-09 21:26
"use server";

import { revalidatePath } from "next/cache";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchAllLoans(filters: {
  status?: string;
  karyawanId?: string;
} = {}) {
  try {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append("status", filters.status);
    if (filters.karyawanId) queryParams.append("karyawanId", filters.karyawanId);

    const res = await fetch(
      `${API_URL}/api/loans/pinjaman?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!res.ok) throw new Error(`Gagal fetch pinjaman: ${res.status}`);

    const data = await res.json();
    return { loans: data || [], isLoading: false };
  } catch (error) {
    console.error("[fetchAllLoans]", error);
    return { loans: [], isLoading: false, error: (error as Error).message };
  }
}

export async function createLoan(formData: any) {
  try {
    const res = await fetch(`${API_URL}/api/loans/pinjaman`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Gagal membuat pinjaman");
    }

    revalidatePath("/admin-area/hr/loans");
    return { success: true };
  } catch (error) {
    console.error("[createLoan]", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function postLoan(loanId: string) {
  try {
    const res = await fetch(`${API_URL}/api/loans/pinjaman/${loanId}/post`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Gagal posting pinjaman");
    }

    revalidatePath("/admin-area/hr/loans");
    return { success: true };
  } catch (error) {
    console.error("[postLoan]", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function updateLoan(loanId: string, formData: any) {
  try {
    const res = await fetch(`${API_URL}/api/loans/pinjaman/${loanId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Gagal mengupdate pinjaman");
    }

    revalidatePath("/admin-area/hr/loans");
    return { success: true };
  } catch (error) {
    console.error("[updateLoan]", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteLoan(loanId: string) {
  try {
    const res = await fetch(`${API_URL}/api/loans/pinjaman/${loanId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Gagal menghapus pinjaman");
    }

    revalidatePath("/admin-area/hr/loans");
    return { success: true };
  } catch (error) {
    console.error("[deleteLoan]", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function recordRepayment(detailId: string, formData: any) {
  try {
    const res = await fetch(`${API_URL}/api/loans/pinjaman/repayment/${detailId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Gagal mencatat pembayaran");
    }

    revalidatePath("/admin-area/hr/loans");
    return { success: true };
  } catch (error) {
    console.error("[recordRepayment]", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function fetchAllEmployees() {
  try {
    const res = await fetch(`${API_URL}/api/karyawan/getAllKaryawan`, {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Gagal fetch karyawan");
    return await res.json();
  } catch (error) {
    console.error("[fetchAllEmployees]", error);
    return [];
  }
}

export async function fetchBankAccounts() {
  try {
    const res = await fetch(`${API_URL}/api/master/banks/getAllBankAccounts`, {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Gagal fetch bank accounts");
    const result = await res.json();
    return result.data || [];
  } catch (error) {
    console.error("[fetchBankAccounts]", error);
    return [];
  }
}
