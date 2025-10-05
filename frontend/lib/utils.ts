import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// /lib/utils/formatDate.ts

export function formatDateToDDMMMYYYY(date: Date | string | number): string {
  const d = new Date(date);
  // Ubah angka jadi dua digit (01-31)
  const day = String(d.getDate()).padStart(2, "0");
  // Ambil short month name (Jan, Feb, ...)
  const month = d.toLocaleString("en-US", { month: "short" });
  // Ambil tahun
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

// lib/utils.ts
export const getFullImageUrl = (path: string | undefined): string => {
  if (!path) return "/placeholder-image.jpg"; // fallback image

  // Jika sudah full URL (http://...), biarkan
  if (path.startsWith("http")) return path;

  // Jika path relatif (misal: /images/spk/xxx.jpg), prefix dengan base URL
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
};

export function formatCurrencyNumber(value: number, currency = "IDR") {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export const formatIndoDate = (dateString?: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};
