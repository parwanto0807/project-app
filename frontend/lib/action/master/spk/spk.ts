import { SpkApiPayload } from "@/schemas/index";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ✅ Ambil semua SPK
export async function fetchAllSpk() {
  try {
    const res = await fetch(`${API_URL}/api/spk/getAllSPK`, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Gagal fetch SPK");
    }

    return await res.json();
  } catch (error) {
    console.error("fetchAllSpk error:", error);
    throw error;
  }
}

// ✅ Ambil SPK by ID
export async function fetchSpkById(id: string) {
  console.log("SPK ID", id);
  try {
    const res = await fetch(`${API_URL}/api/spk/getSPKById/${id}`, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Gagal fetch SPK by ID");
    }

    return await res.json();
  } catch (error) {
    console.error("fetchSpkById error:", error);
    throw error;
  }
}

// (Bonus) ✅ Create SPK
export async function createSpk(data: SpkApiPayload) {
  try {
    const res = await fetch(`${API_URL}/api/spk/createSPK`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Gagal membuat SPK: ${errorText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("createSpk error:", error);
    throw error;
  }
}

// (Bonus) ✅ Update SPK
export async function updateSpk(id: string, data: SpkApiPayload) {
  try {
    const res = await fetch(`${API_URL}/api/spk/updateSPK${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error("Gagal update SPK");
    }

    return await res.json();
  } catch (error) {
    console.error("updateSpk error:", error);
    throw error;
  }
}

// (Bonus) ✅ Delete SPK
export async function deleteSpk(
  id: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/spk/deleteSPK/${id}`, {
      method: "DELETE",
    });

    const responseData = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: responseData.message || "Gagal delete SPK",
      };
    }

    return {
      success: true,
      message: responseData.message || "SPK berhasil dihapus",
    };
  } catch (error) {
    console.error("deleteSpk error:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menghapus SPK",
    };
  }
}
