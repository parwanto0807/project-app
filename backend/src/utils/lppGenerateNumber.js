// import { PrismaClient } from "../../prisma/generated/prisma/index.js";
// const prisma = new PrismaClient();

import { prisma} from '../config/db.js';
/**
 * Generate nomor LPP otomatis dengan format: PJ-YYYY-XXX
 */
export const generateNomorLpp = async () => {
  const currentYear = new Date().getFullYear();

  try {
    // Cari LPP terakhir di tahun ini
    const lastLpp = await prisma.pertanggungjawaban.findFirst({
      where: {
        nomor: {
          startsWith: `PJ-${currentYear}-`,
        },
      },
      orderBy: {
        nomor: "desc",
      },
    });

    let nextNumber = 1;

    if (lastLpp && lastLpp.nomor) {
      const lastNumber = parseInt(lastLpp.nomor.split("-")[2]);
      nextNumber = lastNumber + 1;
    }

    return `PJ-${currentYear}-${nextNumber.toString().padStart(3, "0")}`;
  } catch (error) {
    console.error("Error generating LPP number:", error);
    // Fallback number
    return `PJ-${currentYear}-001`;
  }
};
