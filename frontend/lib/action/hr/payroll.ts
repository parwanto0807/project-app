"use server";

import { revalidatePath } from "next/cache";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ─── GAJI ────────────────────────────────────────────────────────────────────

export async function fetchAllGaji(filters: { periode?: string; karyawanId?: string } = {}) {
  try {
    const q = new URLSearchParams();
    if (filters.periode) q.append("periode", filters.periode);
    if (filters.karyawanId) q.append("karyawanId", filters.karyawanId);
    const res = await fetch(`${API_URL}/api/payroll/gaji?${q}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Gagal fetch gaji: ${res.status}`);
    return { gaji: await res.json(), error: null };
  } catch (error) {
    return { gaji: [], error: (error as Error).message };
  }
}

export async function fetchPayrollSummary(periode: string) {
  try {
    const res = await fetch(`${API_URL}/api/payroll/summary?periode=${periode}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Gagal fetch summary: ${res.status}`);
    return { data: await res.json(), error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}

export async function fetchPayrollPreview(
  karyawanId: string, 
  periode: string,
  params: { pajak?: number; potonganDpGaji?: number; potonganLain?: number; manualPinjaman?: number; manualKasbon?: number } = {}
) {
  try {
    const q = new URLSearchParams();
    q.append("periode", periode);
    if (params.pajak) q.append("pajak", params.pajak.toString());
    if (params.potonganDpGaji) q.append("potonganDpGaji", params.potonganDpGaji.toString());
    if (params.potonganLain) q.append("potonganLain", params.potonganLain.toString());
    if (params.manualPinjaman !== undefined) q.append("manualPinjaman", params.manualPinjaman.toString());
    if (params.manualKasbon !== undefined) q.append("manualKasbon", params.manualKasbon.toString());

    const res = await fetch(
      `${API_URL}/api/payroll/preview/${karyawanId}?${q}`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Gagal fetch preview");
    }
    return { data: await res.json(), error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}

export async function createGaji(formData: {
  karyawanId: string;
  periode: string;
  pajak?: number;
  potonganDpGaji?: number;
  potonganLain?: number;
  manualPinjaman?: number;
  manualKasbon?: number;
}) {
  try {
    const res = await fetch(`${API_URL}/api/payroll/gaji`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Gagal membuat slip gaji");
    }
    revalidatePath("/admin-area/hr/payroll");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteGaji(id: string) {
  try {
    const res = await fetch(`${API_URL}/api/payroll/gaji/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Gagal menghapus slip gaji");
    }
    revalidatePath("/admin-area/hr/payroll");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function fetchBulkPayrollPreview(periode: string) {
  try {
    const res = await fetch(
      `${API_URL}/api/payroll/bulk-preview?periode=${periode}`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Gagal fetch bulk preview");
    }
    return { data: await res.json(), error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}

export async function processBulkPayroll(periode: string) {
  try {
    const res = await fetch(`${API_URL}/api/payroll/bulk-process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ periode }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Gagal proses gaji massal");
    }
    const data = await res.json();
    revalidatePath("/admin-area/hr/payroll");
    return { success: true, data };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function postGaji(id: string) {
  try {
    const res = await fetch(`${API_URL}/api/payroll/gaji/${id}/post`, {
      method: "POST",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Gagal posting gaji");
    }
    revalidatePath("/admin-area/hr/payroll");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function postBulkPayroll(periode: string) {
  try {
    const res = await fetch(`${API_URL}/api/payroll/bulk-post`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ periode }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Gagal posting gaji massal");
    }
    revalidatePath("/admin-area/hr/payroll");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function voidGaji(id: string, reason: string = "Pembatalan Payroll") {
  try {
    const res = await fetch(`${API_URL}/api/payroll/gaji/${id}/void`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Gagal membatalkan posting gaji");
    }
    revalidatePath("/admin-area/hr/payroll");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updateGaji(id: string, data: any) {
  try {
    const res = await fetch(`${API_URL}/api/payroll/gaji/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.message };
    revalidatePath("/admin-area/hr/payroll");
    return { success: true, data: json.data };
  } catch (err) {
    console.error("Error updateGaji:", err);
    return { success: false, error: "Gagal mengupdate slip gaji" };
  }
}

export async function publishGaji(id: string) {
  try {
    const res = await fetch(`${API_URL}/api/payroll/gaji/${id}/publish`, {
      method: "PATCH",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Gagal publikasi gaji");
    }
    revalidatePath("/admin-area/hr/payroll");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function publishBulkPayroll(periode: string) {
  try {
    const res = await fetch(`${API_URL}/api/payroll/bulk-publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ periode }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Gagal publikasi gaji massal");
    }
    revalidatePath("/admin-area/hr/payroll");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// ─── PAYROLL CONFIG ───────────────────────────────────────────────────────────

export async function fetchPayrollConfigs() {
  try {
    const res = await fetch(`${API_URL}/api/payroll/config`, { cache: "no-store" });
    if (!res.ok) throw new Error("Gagal fetch config");
    return { data: await res.json(), error: null };
  } catch (error) {
    return { data: [], error: (error as Error).message };
  }
}

export async function createPayrollConfig(data: { name: string; gajiPerHari: number; lemburPerJam: number }) {
  try {
    const res = await fetch(`${API_URL}/api/payroll/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Gagal membuat config");
    revalidatePath("/admin-area/hr/payroll");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updatePayrollConfig(id: string, data: any) {
  try {
    const res = await fetch(`${API_URL}/api/payroll/config/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Gagal update config");
    revalidatePath("/admin-area/hr/payroll");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
