"use server";

import { serverFetch } from "@/lib/server-fetch";
export async function fetchAllCustomers() {
  try {
    const res = await serverFetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/master/customer/getAllCustomers`,
      {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error(`Gagal fetch: ${res.status}`);
    }

    const data = await res.json();
    return {
      customers: data || [], // ✅ langsung pakai data
      isLoading: false,
    };
  } catch (error) {
    console.error("[fetchAllCustomers]", error);
    return {
      customers: [],
      isLoading: false,
    };
  }
}

export async function fetchCustomerById(id: string) {
  try {
    const res = await serverFetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/master/customer/getCustomerById/${id}`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error(`Gagal fetch customer by ID: ${res.status}`);
    }

    const data = await res.json();
    return {
      customer: data || null,
      isLoading: false,
    };
  } catch (error) {
    console.error("[fetchCustomerById]", error);
    return {
      customer: null,
      isLoading: false,
    };
  }
}
