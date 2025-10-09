// D:\Project WebApp\project-app\frontend\lib\action\master\project.ts
import { z } from "zod";
import { ApiProjectSchema } from "@/schemas";

const ApiProjectArraySchema = z.array(ApiProjectSchema);

type FetchAllProjectsParams = {
  customerId?: string;
  q?: string;
  take?: number; // default 100
  skip?: number; // default 0
};

export async function fetchAllProjects(params: FetchAllProjectsParams = {}) {
  const { customerId, q, take = 100, skip = 0 } = params;
  try {
    const base = process.env.NEXT_PUBLIC_API_URL || "";
    const qs = new URLSearchParams();
    if (customerId) qs.set("customerId", customerId);
    if (q) qs.set("q", q);
    qs.set("take", String(take));
    qs.set("skip", String(skip));

    const res = await fetch(
      `${base}/api/salesOrder/project/getListProjects?${qs.toString()}`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error(`Gagal fetch proyek: ${res.status}`);
    }

    const response = await res.json(); // Format baru: { success, message, data, total }

    // Cek success flag dari response baru
    if (!response.success) {
      throw new Error(response.message || "Failed to fetch projects");
    }

    // Parse data dengan schema yang sesuai
    const parsed = ApiProjectArraySchema.safeParse(response.data ?? []);

    if (!parsed.success) {
      console.error("[fetchAllProjects] invalid payload:", parsed.error);
      return {
        success: false,
        message: "Invalid project data format",
        data: [],
        total: 0,
        isLoading: false,
      };
    }

    return {
      success: true,
      message: response.message || "Projects fetched successfully",
      data: parsed.data, // sesuai ApiProjectSchema
      total: Number(response.total ?? response.data?.length ?? 0),
      isLoading: false,
    };
  } catch (error) {
    console.error("[fetchAllProjects]", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch projects",
      data: [],
      total: 0,
      isLoading: false,
    };
  }
}
