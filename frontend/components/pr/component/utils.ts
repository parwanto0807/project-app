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
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;

  // 1. Try standard JS number parsing first
  const asNum = Number(value);
  if (!isNaN(asNum)) return asNum;

  const strVal = String(value).trim();

  // 2. Handle Indonesian/EU format (dots=thousands, comma=decimal)
  // "1.000,50" -> 1000.50
  if (strVal.includes(",") && strVal.includes(".")) {
    if (strVal.lastIndexOf(",") > strVal.lastIndexOf(".")) {
      return Number(strVal.replace(/\./g, "").replace(",", ".")) || 0;
    }
  }

  // 3. Handle simple comma decimal "10,50" -> 10.50
  if (strVal.includes(",") && !strVal.includes(".")) {
    return Number(strVal.replace(",", ".")) || 0;
  }

  // Fallback: This strips everything except digits, dots, and minus, then standardizes
  return Number(strVal.replace(/[^\d.-]/g, "")) || 0;
};

export const getBasePath = (
  role: string,
  type: keyof (typeof PATH_CONFIG)[keyof typeof PATH_CONFIG]
) =>
  PATH_CONFIG[role as keyof typeof PATH_CONFIG]?.[type] ||
  PATH_CONFIG.admin[type];
