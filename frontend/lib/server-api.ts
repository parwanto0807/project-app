// lib/server-api.ts
import { cookies } from "next/headers";
import { api } from "@/lib/http";
import { AxiosRequestConfig } from "axios";

export const serverApi = {
  // GET tidak punya body, aman
  get: async <T>(url: string, config: AxiosRequestConfig = {}) => {
    const cookieStore = await cookies();
    
    return api.get<T>(url, {
      ...config,
      headers: {
        ...config.headers,
        Cookie: cookieStore.toString(),
      },
    });
  },

  // POST: Ubah 'any' menjadi 'unknown' (atau Generic D)
  post: async <T>(url: string, data: unknown, config: AxiosRequestConfig = {}) => {
    const cookieStore = await cookies();
    
    return api.post<T>(url, data, {
      ...config,
      headers: {
        ...config.headers,
        Cookie: cookieStore.toString(),
      },
    });
  },

  // PUT: Ubah 'any' menjadi 'unknown'
  put: async <T>(url: string, data: unknown, config: AxiosRequestConfig = {}) => {
    const cookieStore = await cookies();
    
    return api.put<T>(url, data, {
      ...config,
      headers: {
        ...config.headers,
        Cookie: cookieStore.toString(),
      },
    });
  },

  // DELETE
  delete: async <T>(url: string, config: AxiosRequestConfig = {}) => {
    const cookieStore = await cookies();
    
    return api.delete<T>(url, {
      ...config,
      headers: {
        ...config.headers,
        Cookie: cookieStore.toString(),
      },
    });
  },
};