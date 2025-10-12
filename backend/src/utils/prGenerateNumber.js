// src/utils/prGenerateNumber.js
import { prisma } from "../config/db.js";

/**
 * Generate nomor PR dengan format: 00001/PR-RYLIF/X/2025
 * Format: NNNNN/PR-RYLIF/BULANROM/TAHUN
 */
export const generatePRNumber = async () => {
  try {
    const now = new Date();
    const year = now.getFullYear();

    // Konversi bulan ke angka romawi
    const bulanRomawi = convertToRoman(now.getMonth() + 1);

    // Cari PR terakhir di tahun ini untuk menentukan sequence
    const startOfYear = new Date(year, 0, 1); // 1 Januari tahun ini
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999); // 31 Desember tahun ini

    const lastPR = await prisma.purchaseRequest.findFirst({
      where: {
        tanggalPr: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
      orderBy: {
        nomorPr: "desc",
      },
    });

    let sequence = 1;
    if (lastPR && lastPR.nomorPr) {
      // Extract sequence number dari format: 00001/PR-RYLIF/X/2025
      const matches = lastPR.nomorPr.match(/^(\d+)\//);
      if (matches && matches[1]) {
        sequence = parseInt(matches[1]) + 1;
      }
    }

    const sequenceFormatted = String(sequence).padStart(5, "0");
    return `${sequenceFormatted}/PR-RYLIF/${bulanRomawi}/${year}`;
  } catch (error) {
    console.error("Error generating PR number:", error);
    throw new Error("Failed to generate PR number");
  }
};

/**
 * Convert angka ke angka romawi (1-12)
 */
const convertToRoman = (num) => {
  if (num < 1 || num > 12) {
    throw new Error("Month must be between 1 and 12");
  }

  const romanMap = {
    1: "I",
    2: "II", 
    3: "III",
    4: "IV",
    5: "V",
    6: "VI",
    7: "VII",
    8: "VIII",
    9: "IX",
    10: "X",
    11: "XI",
    12: "XII"
  };

  return romanMap[num];
};

/**
 * Validasi apakah nomor PR sudah ada
 */
export const isPRNumberExists = async (nomorPr) => {
  try {
    const existingPR = await prisma.purchaseRequest.findUnique({
      where: { nomorPr },
    });
    return !!existingPR;
  } catch (error) {
    console.error("Error checking PR number existence:", error);
    throw new Error("Failed to check PR number existence");
  }
};

/**
 * Get current sequence number untuk tahun ini
 */
export const getCurrentSequence = async () => {
  try {
    const now = new Date();
    const year = now.getFullYear();

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    const lastPR = await prisma.purchaseRequest.findFirst({
      where: {
        tanggalPr: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
      orderBy: {
        nomorPr: "desc",
      },
    });

    if (lastPR && lastPR.nomorPr) {
      const matches = lastPR.nomorPr.match(/^(\d+)\//);
      if (matches && matches[1]) {
        return parseInt(matches[1]);
      }
    }

    return 0;
  } catch (error) {
    console.error("Error getting current sequence:", error);
    throw new Error("Failed to get current sequence");
  }
};