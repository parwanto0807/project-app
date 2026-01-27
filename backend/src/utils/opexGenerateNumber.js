import { prisma } from '../config/db.js';

/**
 * Generate nomor biaya operasional otomatis dengan format: OPEX-XXXXX-MM-YYYY
 * - XXXXX: 5 digit nomor urut (reset setiap tahun)
 * - MM: Roman numeral bulan
 * - YYYY: Tahun
 */
export async function generateOpExNumber() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  
  try {
    // Cari biaya operasional terakhir di tahun ini
    const lastOpEx = await prisma.operationalExpense.findFirst({
      where: {
        expenseNumber: {
          startsWith: 'OPEX-'
        },
        createdAt: {
          gte: new Date(currentYear, 0, 1),
          lt: new Date(currentYear + 1, 0, 1)
        }
      },
      orderBy: {
        expenseNumber: 'desc'
      },
      select: {
        expenseNumber: true
      }
    });

    let nextNumber = 1;

    if (lastOpEx) {
      // Extract number dari nomor terakhir: OPEX-00001-IX-2026
      const parts = lastOpEx.expenseNumber.split('-');
      if (parts.length >= 2) {
        const lastSequence = parseInt(parts[1]);
        if (!isNaN(lastSequence)) {
          nextNumber = lastSequence + 1;
        }
      }
    }

    // Konversi bulan ke Roman numeral
    const monthRoman = convertToRoman(currentMonth);
    
    // Format: OPEX-XXXXX-MM-YYYY (5 digit dengan leading zeros)
    const formattedNumber = `OPEX-${nextNumber.toString().padStart(5, '0')}-${monthRoman}-${currentYear}`;
    
    return formattedNumber;
  } catch (error) {
    console.error('Error generating opex number:', error);
    const timestamp = Date.now().toString().slice(-5);
    const monthRoman = convertToRoman(currentMonth);
    return `OPEX-${timestamp}-${monthRoman}-${currentYear}`;
  }
}

function convertToRoman(num) {
  const romanNumerals = {
    1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI',
    7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X', 11: 'XI', 12: 'XII'
  };
  return romanNumerals[num] || num.toString();
}
