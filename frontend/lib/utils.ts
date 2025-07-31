import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// /lib/utils/formatDate.ts

export function formatDateToDDMMMYYYY(date: Date | string | number): string {
  const d = new Date(date);
  // Ubah angka jadi dua digit (01-31)
  const day = String(d.getDate()).padStart(2, '0');
  // Ambil short month name (Jan, Feb, ...)
  const month = d.toLocaleString('en-US', { month: 'short' });
  // Ambil tahun
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}
