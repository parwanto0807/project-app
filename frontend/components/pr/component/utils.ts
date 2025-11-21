import { PATH_CONFIG } from "./constants";

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return "-";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "-";

    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(dateObj);
  } catch {
    return "-";
  }
};

export const cleanNumber = (
  value: string | number | null | undefined
): number => {
  if (typeof value === "string") {
    return Number(value.replace(/\D/g, "")) || 0;
  }
  return typeof value === "number" ? value : 0;
};

export const getBasePath = (
  role: string,
  type: keyof (typeof PATH_CONFIG)[keyof typeof PATH_CONFIG]
) =>
  PATH_CONFIG[role as keyof typeof PATH_CONFIG]?.[type] ||
  PATH_CONFIG.admin[type];
