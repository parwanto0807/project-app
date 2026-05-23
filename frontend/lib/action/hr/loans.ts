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

// ─── KASBON SEMENTARA ────────────────────────────────────────────────────────

export async function fetchAllKasbon(filters: {
  status?: string;
  karyawanId?: string;
} = {}) {
  try {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append("status", filters.status);
    if (filters.karyawanId) queryParams.append("karyawanId", filters.karyawanId);

    const res = await fetch(
      `${API_URL}/api/loans/kasbon?${queryParams.toString()}`,
      { method: "GET", cache: "no-store" }
    );
    if (!res.ok) throw new Error(`Gagal fetch kasbon: ${res.status}`);
    const data = await res.json();
    return { kasbon: data || [], error: null };
  } catch (error) {
    console.error("[fetchAllKasbon]", error);
    return { kasbon: [], error: (error as Error).message };
  }
}

export async function createKasbon(formData: {
  karyawanId: string;
  jumlah: string | number;
  keperluan?: string;
  bulanPotong?: string;
  tanggal?: string;
  catatan?: string;
}) {
  try {
    const res = await fetch(`${API_URL}/api/loans/kasbon`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Gagal membuat kasbon");
    }
    const data = await res.json();
    revalidatePath("/admin-area/hr/loans");
    return { success: true, warning: data.warning || null };
  } catch (error) {
    console.error("[createKasbon]", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function approveKasbon(id: string, approvedBy?: string) {
  try {
    const res = await fetch(`${API_URL}/api/loans/kasbon/${id}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approvedBy: approvedBy || "Admin" }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Gagal menyetujui kasbon");
    }
    revalidatePath("/admin-area/hr/loans");
    return { success: true };
  } catch (error) {
    console.error("[approveKasbon]", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function postKasbon(id: string, cashAccountKey?: string) {
  try {
    const res = await fetch(`${API_URL}/api/loans/kasbon/${id}/post`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cashAccountKey: cashAccountKey || "PETTY_CASH" }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Gagal posting kasbon ke jurnal");
    }
    revalidatePath("/admin-area/hr/loans");
    return { success: true };
  } catch (error) {
    console.error("[postKasbon]", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function rejectKasbon(id: string, rejectedReason: string) {
  try {
    const res = await fetch(`${API_URL}/api/loans/kasbon/${id}/reject`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rejectedReason }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Gagal menolak kasbon");
    }
    revalidatePath("/admin-area/hr/loans");
    return { success: true };
  } catch (error) {
    console.error("[rejectKasbon]", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function settleKasbon(id: string) {
  try {
    const res = await fetch(`${API_URL}/api/loans/kasbon/${id}/settle`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Gagal menyelesaikan kasbon");
    }
    revalidatePath("/admin-area/hr/loans");
    return { success: true };
  } catch (error) {
    console.error("[settleKasbon]", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteKasbon(id: string) {
  try {
    const res = await fetch(`${API_URL}/api/loans/kasbon/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Gagal menghapus kasbon");
    }
    revalidatePath("/admin-area/hr/loans");
    return { success: true };
  } catch (error) {
    console.error("[deleteKasbon]", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function updateKasbon(
  id: string,
  formData: {
    jumlah?: string | number;
    keperluan?: string;
    bulanPotong?: string;
    catatan?: string;
  }
) {
  try {
    const res = await fetch(`${API_URL}/api/loans/kasbon/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Gagal mengupdate kasbon");
    }
    const data = await res.json();
    revalidatePath("/admin-area/hr/loans");
    return { success: true, warning: data.warning || null };
  } catch (error) {
    console.error("[updateKasbon]", error);
    return { success: false, error: (error as Error).message };
  }
}
