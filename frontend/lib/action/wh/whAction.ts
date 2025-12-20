import { Warehouse } from "@/types/whType";
import { ApiResponse, ListResponse } from "@/types/api";
import {
  CreateWarehouseInput,
  UpdateWarehouseInput,
} from "@/schemas/wh/whSchema";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const ENDPOINT = `${BASE_URL}/api/warehouse`;

export const generateSimpleCode = (name?: string): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 900) + 100; // 100-999

  let initials = "DEF";
  if (name && name.length > 0) {
    initials = name
      .toUpperCase()
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 3)
      .padEnd(3, 'X');
  }

  // Gunakan 3 digit terakhir timestamp + random
  const lastThreeDigits = timestamp.toString().slice(-3);
  const sequence = (parseInt(lastThreeDigits) + random) % 1000;

  return `WH-${initials}-${sequence.toString().padStart(3, '0')}`;
};


export async function createWarehouse(
  payload: CreateWarehouseInput
): Promise<ApiResponse<Warehouse>> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Gagal membuat warehouse");
  }

  return res.json();
}

export async function getWarehouses(): Promise<ApiResponse<ListResponse<Warehouse>>> {
  const res = await fetch(ENDPOINT, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Gagal mengambil data warehouse");
  }

  return res.json();
}


export async function getWarehouseById(
  id: string
): Promise<ApiResponse<Warehouse>> {
  const res = await fetch(`${ENDPOINT}/${id}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Warehouse tidak ditemukan");
  }

  return res.json();
}


export async function updateWarehouse(
  id: string,
  payload: UpdateWarehouseInput
): Promise<ApiResponse<Warehouse>> {
  const res = await fetch(`${ENDPOINT}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Gagal update warehouse");
  }

  return res.json();
}


export async function deleteWarehouse(
  id: string
): Promise<ApiResponse<null>> {
  const res = await fetch(`${ENDPOINT}/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Gagal menghapus warehouse");
  }

  return res.json();
}
