import { prisma } from "../config/db.js";

/**
 * Generate quotation number:
 * 00001/QUOT-RYLIF/XI/2025
 */
export const generateQuotationNumber = async (quotationDate = null, tx = prisma) => {
  const date = quotationDate ? new Date(quotationDate) : new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const romanMonth = getRomanMonth(month); // ✅ FIX HERE

  const counterName = `QUOTATION-${year}`;

  const counter = await tx.counter.upsert({
    where: { name: counterName },
    create: { name: counterName, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
    select: { lastNumber: true },
  });

  const sequence = String(counter.lastNumber).padStart(5, "0");

  return `${sequence}/QUOT-RYLIF/${romanMonth}/${year}`;
};

/**
 * Convert month → Roman numeral
 */
export const getRomanMonth = (month) => {
  const roman = [
    "I", "II", "III", "IV", "V", "VI",
    "VII", "VIII", "IX", "X", "XI", "XII",
  ];
  return roman[month - 1] || "I";
};

export default {
  generateQuotationNumber,
};
