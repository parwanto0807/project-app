// /lib/actions/tax.ts
import { Tax } from "@/types/quotation";

export async function fetchTaxes(): Promise<{ taxes: Tax[] }> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/master/tax/getTaxes`);
  if (!res.ok) throw new Error("Gagal fetch taxes");
  const taxes = await res.json();
  return { taxes };
}

export async function fetchTaxById(id: string): Promise<Tax> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/master/tax/${id}`);
  if (!res.ok) throw new Error("Gagal fetch tax");
  return res.json();
}

export async function createTax(data: Partial<Tax>): Promise<Tax> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/master/tax`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Gagal create tax");
  return res.json();
}

export async function updateTax(id: string, data: Partial<Tax>): Promise<Tax> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/master/tax/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Gagal update tax");
  return res.json();
}

export async function deleteTax(id: string): Promise<{ message: string }> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/master/tax/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Gagal delete tax");
  return res.json();
}
