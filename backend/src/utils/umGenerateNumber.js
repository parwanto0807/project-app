import { PrismaClient } from "../../prisma/generated/prisma/index.js";
const prisma = new PrismaClient();

/**
 * Generate nomor uang muka otomatis dengan format: AR-FNC-XXXXX-MM-YYYY
 * - XXXX: 5 digit nomor urut (reset setiap tahun)
 * - MM: Roman numeral bulan
 * - YYYY: Tahun
 */
export async function generateUangMukaNumber() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  
  try {
    // Cari uang muka terakhir di tahun ini
    const lastUangMuka = await prisma.uangMuka.findFirst({
      where: {
        nomor: {
          startsWith: 'RA-FNC-'
        },
        createdAt: {
          gte: new Date(currentYear, 0, 1), // Mulai dari 1 Januari tahun ini
          lt: new Date(currentYear + 1, 0, 1) // Sampai 1 Januari tahun depan
        }
      },
      orderBy: {
        nomor: 'desc'
      },
      select: {
        nomor: true,
        createdAt: true
      }
    });

    let nextNumber = 1;

    if (lastUangMuka) {
      // Extract number dari nomor terakhir: AR-FNC-00001-IX-2025
      const parts = lastUangMuka.nomor.split('-');
      if (parts.length >= 3) {
        const lastSequence = parseInt(parts[2]);
        if (!isNaN(lastSequence)) {
          nextNumber = lastSequence + 1;
        }
      }
    }

    // Konversi bulan ke Roman numeral
    const monthRoman = convertToRoman(currentMonth);
    
    // Format: AR-FNC-XXXXX-MM-YYYY (5 digit dengan leading zeros)
    const formattedNumber = `RA-FNC-${nextNumber.toString().padStart(5, '0')}-${monthRoman}-${currentYear}`;
    
    return formattedNumber;
  } catch (error) {
    console.error('Error generating uang muka number:', error);
    // Fallback: timestamp based
    const timestamp = Date.now().toString().slice(-5);
    const monthRoman = convertToRoman(currentMonth);
    return `AR-FNC-${timestamp}-${monthRoman}-${currentYear}`;
  }
}

/**
 * Convert number to Roman numeral (1-12 for months)
 */
function convertToRoman(num) {
  const romanNumerals = {
    1: 'I',
    2: 'II',
    3: 'III',
    4: 'IV',
    5: 'V',
    6: 'VI',
    7: 'VII',
    8: 'VIII',
    9: 'IX',
    10: 'X',
    11: 'XI',
    12: 'XII'
  };
  
  return romanNumerals[num] || num.toString();
}