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

/**
 * Ambil daftar projects dari backend
 * GET /api/master/project/list?customerId=&q=&take=&skip=
 */
export async function fetchAllProjects(params: FetchAllProjectsParams = {}) {
  const { customerId, q, take = 100, skip = 0 } = params;
  try {
    const base = process.env.NEXT_PUBLIC_API_URL || "";
    const qs = new URLSearchParams();
    if (customerId) qs.set("customerId", customerId);
    if (q) qs.set("q", q);
    qs.set("take", String(take));
    qs.set("skip", String(skip));

    const res = await fetch(`${base}/api/salesOrder/project/getListProjects?${qs.toString()}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Gagal fetch proyek: ${res.status}`);
    }

    const data = await res.json(); // { projects, total }
    const parsed = ApiProjectArraySchema.safeParse(data?.projects ?? data);

    if (!parsed.success) {
      console.error("[fetchAllProjects] invalid payload:", parsed.error);
      return { projects: [], total: 0, isLoading: false };
    }

    return {
      projects: parsed.data,                // sesuai ApiProjectSchema
      total: Number(data?.total ?? parsed.data.length),
      isLoading: false,
    };
  } catch (error) {
    console.error("[fetchAllProjects]", error);
    return {
      projects: [],
      total: 0,
      isLoading: false,
    };
  }
}
