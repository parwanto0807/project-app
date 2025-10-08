"use server";

import { revalidateTag } from "next/cache";
import {
  RABCreateInput,
  RABUpdateInput,
  RABStatusUpdate,
  RABListResponse,
  RABResponse,
} from "@/types/rab";

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5000";
  const url = `${baseURL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  return response;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");

  if (!contentType || !contentType.includes("application/json")) {
    const textResponse = await response.text();
    throw new Error(
      `Server returned non-JSON response: ${textResponse.substring(0, 100)}`
    );
  }

  const result = await response.json();

  if (!response.ok) {
    console.error("API Error:", result);
    throw new Error(result.message || `HTTP error! status: ${response.status}`);
  }

  return result;
}

// ========================= CRUD ========================= //

// Get all RABs with optional filtering
export async function getRABs(filters?: {
  projectId?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<RABListResponse> {
  const params = new URLSearchParams();

  if (filters?.projectId) params.append("projectId", filters.projectId);
  if (filters?.status) params.append("status", filters.status);
  if (filters?.page) params.append("page", filters.page.toString());
  if (filters?.limit) params.append("limit", filters.limit.toString());

  const queryString = params.toString();
  const endpoint = `/api/rabs${queryString ? `?${queryString}` : ""}`;

  const response = await fetchAPI(endpoint);
  return handleResponse<RABListResponse>(response);
}

// Get RAB by ID
export async function getRAB(id: string): Promise<RABResponse> {
  const response = await fetchAPI(`/api/rabs/${id}`);
  return handleResponse<RABResponse>(response);
}

// Get RABs by Project ID
export async function getRABsByProject(
  projectId: string
): Promise<RABListResponse> {
  const response = await fetchAPI(`/api/rabs/project/${projectId}`);
  return handleResponse<RABListResponse>(response);
}

// Create new RAB
export async function createRAB(data: RABCreateInput): Promise<RABResponse> {
  try {
    const response = await fetchAPI("/api/rabs", {
      method: "POST",
      body: JSON.stringify(data),
    });

    const result = await handleResponse<RABResponse>(response);
    revalidateTag("rabs");

    return result;
  } catch (error) {
    console.error("Create RAB error:", error);
    throw error;
  }
}

// Update RAB
export async function updateRAB(data: RABUpdateInput): Promise<RABResponse> {
  const { id, ...updateData } = data;
  const response = await fetchAPI(`/api/rabs/${id}`, {
    method: "PUT",
    body: JSON.stringify(updateData),
    credentials:'include',
  });

  const result = await handleResponse<RABResponse>(response);

  revalidateTag("rabs");
  revalidateTag(`rab-${id}`);
  return result;
}

// Update RAB status
export async function updateRABStatus(
  id: string,
  status: RABStatusUpdate
): Promise<RABResponse> {
  const response = await fetchAPI(`/api/rabs/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(status),
  });

  const result = await handleResponse<RABResponse>(response);

  revalidateTag("rabs");
  revalidateTag(`rab-${id}`);
  return result;
}

// Delete RAB
export async function deleteRAB(
  id: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetchAPI(`/api/rabs/${id}`, {
    method: "DELETE",
  });

  const result = await handleResponse<{ success: boolean; message: string }>(
    response
  );

  revalidateTag("rabs");
  return result;
}
