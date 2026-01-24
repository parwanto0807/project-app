import { prisma } from "../config/db.js";

/**
 * Calculate total estimated budget from PR details
 * @param {Array} details - PR detail items
 * @returns {number} Total estimated budget
 */
export const calculatePRBudget = (details) => {
  if (!details || details.length === 0) return 0;
  
  // Define types that consume money (cash-consuming)
  const cashConsumingTypes = ['PEMBELIAN_BARANG', 'OPERATIONAL', 'JASA_PEMBELIAN'];
  
  return details.reduce((total, detail) => {
    // If sourceProduct is specified and it's NOT a cash-consuming type, exclude it from budget
    if (detail.sourceProduct && !cashConsumingTypes.includes(detail.sourceProduct)) {
      return total;
    }

    const qty = parseFloat(detail.jumlah) || 0;
    const price = parseFloat(detail.estimasiHargaSatuan) || 0;
    return total + (qty * price);
  }, 0);
};

/**
 * Calculate total budget allocated to children PRs
 * @param {string} parentPrId - Parent PR ID
 * @param {string} excludePrId - PR ID to exclude from calculation (for update scenarios)
 * @returns {Promise<number>} Total budget allocated to children
 */
export const calculateChildrenBudget = async (parentPrId, excludePrId = null) => {
  try {
    const childPRs = await prisma.purchaseRequest.findMany({
      where: {
        parentPrId,
        status: { not: 'REJECTED' },
        ...(excludePrId && { id: { not: excludePrId } }),
      },
      include: {
        details: true,
      },
    });

    let totalChildrenBudget = 0;
    
    for (const childPR of childPRs) {
      totalChildrenBudget += calculatePRBudget(childPR.details);
    }

    return totalChildrenBudget;
  } catch (error) {
    console.error("Error calculating children budget:", error);
    throw new Error("Failed to calculate children budget");
  }
};

/**
 * Validate parent PR eligibility
 * @param {string} parentPrId - Parent PR ID to validate
 * @returns {Promise<Object>} Parent PR data if valid
 * @throws {Error} If parent PR is invalid
 */
export const validateParentPr = async (parentPrId) => {
  if (!parentPrId) {
    throw new Error("Parent PR ID is required for PR SPK");
  }

  const parentPR = await prisma.purchaseRequest.findUnique({
    where: { id: parentPrId },
    include: {
      details: true,
    },
  });

  if (!parentPR) {
    throw new Error("Parent PR not found");
  }

  // Parent PR must be PR UM (spkId = null)
  if (parentPR.spkId !== null) {
    throw new Error("Parent PR must be PR UM (without SPK reference)");
  }

  // Parent PR must be COMPLETED
  if (parentPR.status !== "COMPLETED") {
    throw new Error(`Parent PR must be COMPLETED. Current status: ${parentPR.status}`);
  }

  return parentPR;
};

/**
 * Get remaining budget from parent PR
 * @param {string} parentPrId - Parent PR ID
 * @param {string} excludePrId - PR ID to exclude from calculation
 * @returns {Promise<Object>} Object containing parent budget, allocated budget, and remaining budget
 */
export const getRemainingParentBudget = async (parentPrId, excludePrId = null) => {
  try {
    const parentPR = await prisma.purchaseRequest.findUnique({
      where: { id: parentPrId },
      include: {
        details: true,
      },
    });

    if (!parentPR) {
      throw new Error("Parent PR not found");
    }

    const parentBudget = calculatePRBudget(parentPR.details);
    const allocatedBudget = await calculateChildrenBudget(parentPrId, excludePrId);
    const remainingBudget = parentBudget - allocatedBudget;

    return {
      parentBudget,
      allocatedBudget,
      remainingBudget,
    };
  } catch (error) {
    console.error("Error getting remaining parent budget:", error);
    throw error;
  }
};

/**
 * Cascade status changes to children PRs
 * @param {string} parentPrId - Parent PR ID
 * @param {string} newStatus - New status to cascade
 * @param {Object} transaction - Prisma transaction object
 * @returns {Promise<number>} Number of children updated
 */
export const cascadeStatusToChildren = async (parentPrId, newStatus, transaction) => {
  try {
    // Only cascade REJECTED status for now
    if (newStatus !== "REJECTED") {
      return 0;
    }

    const result = await transaction.purchaseRequest.updateMany({
      where: {
        parentPrId,
        status: { not: "REJECTED" }, // Only update non-rejected children
      },
      data: {
        status: newStatus,
        keterangan: `Otomatis di-reject karena Parent PR di-reject`,
      },
    });

    return result.count;
  } catch (error) {
    console.error("Error cascading status to children:", error);
    throw new Error("Failed to cascade status to children");
  }
};

/**
 * Validate budget allocation for child PR
 * @param {string} parentPrId - Parent PR ID
 * @param {number} childBudget - Budget for the child PR
 * @param {string} excludePrId - PR ID to exclude (for update scenarios)
 * @returns {Promise<boolean>} True if budget is valid
 * @throws {Error} If budget validation fails
 */
export const validateChildBudget = async (parentPrId, childBudget, excludePrId = null) => {
  const budgetInfo = await getRemainingParentBudget(parentPrId, excludePrId);
  
  if (childBudget > budgetInfo.remainingBudget) {
    throw new Error(
      `Budget melebihi sisa budget Parent PR. ` +
      `Parent Budget: ${budgetInfo.parentBudget.toLocaleString('id-ID')}, ` +
      `Sudah dialokasikan: ${budgetInfo.allocatedBudget.toLocaleString('id-ID')}, ` +
      `Sisa: ${budgetInfo.remainingBudget.toLocaleString('id-ID')}, ` +
      `Diminta: ${childBudget.toLocaleString('id-ID')}`
    );
  }

  return true;
};

/**
 * Update the sisaBudget field of a PR (usually a Parent PR UM)
 * Logic: totalAmount - (totalPO + totalPrSpkOperational)
 * @param {string} prId - PR ID to update
 * @param {Object} transaction - Optional Prisma transaction
 */
export const updatePRRemainingBudget = async (prId, transaction = null) => {
  const db = transaction || prisma;
  
  // Get PR with its own POs and its child PRs
  const pr = await db.purchaseRequest.findUnique({
    where: { id: prId },
    include: { 
      details: true,
      purchaseOrders: {
        where: { status: { notIn: ['CANCELLED', 'REJECTED'] } }
      },
      childPrs: {
        where: { status: { notIn: ['REJECTED'] } },
        include: { details: true }
      }
    }
  });

  if (!pr) return;

  const totalPR = calculatePRBudget(pr.details);
  
  // 1. Total dari PO yang sudah dibuat untuk PR ini
  const totalPO = pr.purchaseOrders.reduce((sum, po) => sum + (Number(po.totalAmount) || 0), 0);
  
  // 2. Total dari PR Child (PR SPK) yang merujuk ke PR ini
  let totalPrSpk = 0;
  for (const child of pr.childPrs) {
    totalPrSpk += calculatePRBudget(child.details);
  }

  const newSisaBudget = totalPR - (totalPO + totalPrSpk);

  await db.purchaseRequest.update({
    where: { id: prId },
    data: { sisaBudget: newSisaBudget }
  });

  console.log(`📊 Updated PR ${pr.nomorPr} sisaBudget: ${newSisaBudget}`);
};

/**
 * Legacy alias for updatePRRemainingBudget
 */
export const updateParentRemainingBudget = updatePRRemainingBudget;
