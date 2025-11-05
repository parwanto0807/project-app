// import { PrismaClient } from "../../prisma/generated/prisma/index.js";
// const prisma = new PrismaClient();
import { prisma} from '../config/db.js';

/**
 * Generate quotation number dengan format: 00001/QUOT-RYLIF/X/2025
 * - 00001: Sequence number (reset setiap tahun)
 * - QUOT-RYLIF: Kode tetap
 * - X: Roman numeral untuk bulan dari quotationDate
 * - 2025: Tahun dari quotationDate
 */
export const generateQuotationNumber = async (quotationDate = null) => {
  const date = quotationDate ? new Date(quotationDate) : new Date();
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth() + 1; // 1-12

  // Convert month to Roman numeral
  const monthRoman = convertToRoman(currentMonth);

  // Get the last quotation number for current year
  const lastQuotation = await prisma.quotation.findFirst({
    where: {
      quotationNumber: {
        contains: `/${currentYear}`,
      },
    },
    orderBy: {
      quotationNumber: "desc",
    },
    select: {
      quotationNumber: true,
    },
  });

  let sequence = 1;

  if (lastQuotation) {
    // Extract sequence number from last quotation number
    const lastNumber = lastQuotation.quotationNumber;
    const sequenceMatch = lastNumber.match(/^(\d+)/);

    if (sequenceMatch) {
      sequence = parseInt(sequenceMatch[1]) + 1;
    }
  }

  // Format sequence number dengan leading zeros (5 digit)
  const formattedSequence = sequence.toString().padStart(5, "0");

  // Construct quotation number
  const quotationNumber = `${formattedSequence}/QUOT-RYLIF/${monthRoman}/${currentYear}`;

  return quotationNumber;
};

/**
 * Convert number to Roman numeral (1-12)
 */
const convertToRoman = (num) => {
  const romanNumerals = [
    "",
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
    "XII",
  ];
  return romanNumerals[num];
};

export default {
  generateQuotationNumber,
};