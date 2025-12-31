import { prisma } from "../../config/db.js";
import QRCode from "qrcode";

/**
 * Helper function to convert month number to Roman numerals
 */
const monthToRoman = (month) => {
  const romanNumerals = {
    1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI',
    7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X', 11: 'XI', 12: 'XII'
  };
  return romanNumerals[month] || 'I';
};

/**
 * Generate PO Number with format: 000001/PO-RYLIF/XII/2025
 * Sequential number resets every year
 */
const generatePONumber = async (db) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  const romanMonth = monthToRoman(month);

  // Get the start and end of the current year
  const startOfYear = new Date(year, 0, 1); // January 1st
  const endOfYear = new Date(year, 11, 31, 23, 59, 59); // December 31st

  // Count POs created in current year
  const countThisYear = await db.purchaseOrder.count({
    where: {
      orderDate: {
        gte: startOfYear,
        lte: endOfYear
      }
    }
  });

  // Sequential number (6 digits, padded with zeros)
  const sequentialNumber = (countThisYear + 1).toString().padStart(6, '0');

  // Format: 000001/PO-RYLIF/XII/2025
  return `${sequentialNumber}/PO-RYLIF/${romanMonth}/${year}`;
};

/**
 * @desc Toggle checkPurchaseExecution for a PO Line
 * @route PATCH /api/po/line/:poLineId/verify
 * @access Private
 */
export const togglePOLineVerification = async (req, res) => {
  try {
    const { poLineId } = req.params;
    const { checked } = req.body;

    if (typeof checked !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'checked field must be a boolean'
      });
    }

    // Update the PO Line
    const updatedLine = await prisma.purchaseOrderLine.update({
      where: { id: poLineId },
      data: { checkPurchaseExecution: checked }
    });

    return res.status(200).json({
      success: true,
      message: `PO Line ${checked ? 'verified' : 'unverified'} successfully`,
      data: updatedLine
    });

  } catch (error) {
    console.error('Error toggling PO line verification:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update verification status',
      details: error.message
    });
  }
};
