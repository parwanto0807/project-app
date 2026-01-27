import { prisma } from "../../config/db.js";
import { generateOpExNumber } from "../../utils/opexGenerateNumber.js";
import { createLedgerEntry, getSystemAccount } from "../../utils/journalHelper.js";

// Helper to resolve ID from ID or Key
async function resolveCoaId(idOrKey, tx) {
  if (!idOrKey) return null;
  // If it's a UUID (roughly), assume it's an ID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(idOrKey)) {
    return idOrKey;
  }
  // Otherwise, try to resolve as system account key
  try {
    const sysAcc = await getSystemAccount(idOrKey, tx);
    return sysAcc.coaId;
  } catch (error) {
    console.error(`Failed to resolve system account key: ${idOrKey}`, error);
    return null;
  }
}

export const operationalExpenseController = {
  // Get all operational expenses
  getAll: async (req, res) => {
    try {
      const { status, startDate, endDate } = req.query;
      
      const where = {};
      if (status) where.status = status;
      if (startDate && endDate) {
        where.date = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }

      const expenses = await prisma.operationalExpense.findMany({
        where,
        include: {
          createdBy: { select: { name: true } },
          approvedBy: { select: { name: true } },
          expenseAccount: { select: { code: true, name: true } },
          paidFromAccount: { select: { code: true, name: true } }
        },
        orderBy: { date: 'desc' }
      });

      res.json(expenses);
    } catch (error) {
      console.error("Error fetching operational expenses:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Get single expense
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const expense = await prisma.operationalExpense.findUnique({
        where: { id },
        include: {
          createdBy: { select: { name: true } },
          approvedBy: { select: { name: true } },
          expenseAccount: { select: { code: true, name: true } },
          paidFromAccount: { select: { code: true, name: true } },
          journalEntry: { include: { lines: true } }
        }
      });

      if (!expense) return res.status(404).json({ error: "Expense not found" });
      res.json(expense);
    } catch (error) {
      console.error("Error fetching expense:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Create new expense
  create: async (req, res) => {
    try {
      const { 
        date, 
        description, 
        amount, 
        expenseAccountId,  // Can be ID or SystemAccount Key
        paidFromAccountId, // Can be ID or SystemAccount Key
        receiptUrl 
      } = req.body;

      if (!description || !amount || (!expenseAccountId && !req.body.expenseAccountKey)) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Resolve IDs
      const resolvedExpenseId = await resolveCoaId(expenseAccountId || req.body.expenseAccountKey);
      const resolvedPaidFromId = await resolveCoaId(paidFromAccountId || req.body.paidFromAccountKey);

      if (!resolvedExpenseId) {
        return res.status(400).json({ error: "Invalid expense account or system account key" });
      }

      const expenseNumber = await generateOpExNumber();
      const createdById = req.user.id;
      
      // Get receipt path from multer if file was uploaded
      let finalReceiptUrl = receiptUrl;
      if (req.file) {
        finalReceiptUrl = `/images/operational/${req.file.filename}`;
      }

      const expense = await prisma.operationalExpense.create({
        data: {
          expenseNumber,
          date: new Date(date),
          description,
          amount: parseFloat(amount),
          expenseAccountId: resolvedExpenseId,
          paidFromAccountId: resolvedPaidFromId,
          receiptUrl: finalReceiptUrl,
          createdById,
          status: 'DRAFT'
        }
      });

      res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating operational expense:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Update expense
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        date, 
        description, 
        amount, 
        expenseAccountId,
        paidFromAccountId,
        receiptUrl 
      } = req.body;

      const resolvedExpenseId = await resolveCoaId(expenseAccountId || req.body.expenseAccountKey);
      const resolvedPaidFromId = await resolveCoaId(paidFromAccountId || req.body.paidFromAccountKey);

      // Validate that accounts are not HEADER accounts (Optional but good practice)
      if (resolvedExpenseId) {
        const coa = await prisma.chartOfAccounts.findUnique({ where: { id: resolvedExpenseId } });
        if (coa && coa.postingType !== 'POSTING') {
            return res.status(400).json({ error: `Account ${coa.code} is a HEADER account and cannot be used.` });
        }
      }
      if (resolvedPaidFromId) {
        const coa = await prisma.chartOfAccounts.findUnique({ where: { id: resolvedPaidFromId } });
        if (coa && coa.postingType !== 'POSTING') {
            return res.status(400).json({ error: `Account ${coa.code} is a HEADER account and cannot be used.` });
        }
      }

      const existing = await prisma.operationalExpense.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: "Expense not found" });
      
      if (existing.status !== 'DRAFT' && existing.status !== 'REJECTED') {
        return res.status(400).json({ error: "Only Draft or Rejected expenses can be edited" });
      }

      // Update receipt path if new file uploaded
      let finalReceiptUrl = receiptUrl;
      if (req.file) {
        finalReceiptUrl = `/images/operational/${req.file.filename}`;
      }

      const expense = await prisma.operationalExpense.update({
        where: { id },
        data: {
          date: date ? new Date(date) : undefined,
          description,
          amount: amount ? parseFloat(amount) : undefined,
          expenseAccountId: resolvedExpenseId || undefined,
          paidFromAccountId: resolvedPaidFromId || undefined,
          receiptUrl: finalReceiptUrl
        }
      });

      res.json(expense);
    } catch (error) {
      console.error("Error updating operational expense:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Update status (Approve/Reject/Pay)
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const userId = req.user.id;

      const expense = await prisma.operationalExpense.findUnique({
        where: { id },
        include: { expenseAccount: true, paidFromAccount: true }
      });

      if (!expense) return res.status(404).json({ error: "Expense not found" });

      // Action: APPROVED -> Triggers Journaling
      if (status === 'APPROVED') {
        if (!expense.paidFromAccountId) {
          return res.status(400).json({ error: "Paid from account must be set before approval" });
        }

        const result = await prisma.$transaction(async (tx) => {
          // 1. Create Ledger Entry
          const ledger = await createLedgerEntry({
            referenceType: 'JOURNAL',
            referenceId: expense.id,
            referenceNumber: expense.expenseNumber,
            tanggal: expense.date,
            keterangan: `[OPEX] ${expense.description}`,
            createdById: userId,
            entries: [
              {
                coaId: expense.expenseAccountId,
                debit: expense.amount,
                credit: 0,
                keterangan: expense.description
              },
              {
                coaId: expense.paidFromAccountId,
                debit: 0,
                credit: expense.amount,
                keterangan: expense.description
              }
            ],
            tx
          });

          // 2. Update Expense status
          return await tx.operationalExpense.update({
            where: { id },
            data: {
              status: 'APPROVED',
              approvedById: userId,
              journalEntryId: ledger.journalEntryId
            }
          });
        });

        return res.json(result);
      }

      // Other status updates (REJECTED, CANCELLED)
      const updated = await prisma.operationalExpense.update({
        where: { id },
        data: { 
          status,
          approvedById: status === 'REJECTED' ? userId : undefined
        }
      });

      res.json(updated);
    } catch (error) {
      console.error("Error updating operational expense status:", error);
      res.status(500).json({ 
        error: "Internal Server Error", 
        message: error.message 
      });
    }
  },

  // Delete expense
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await prisma.operationalExpense.findUnique({ where: { id } });
      
      if (!existing) return res.status(404).json({ error: "Expense not found" });
      if (existing.status !== 'DRAFT') {
        return res.status(400).json({ error: "Only Draft expenses can be deleted" });
      }

      await prisma.operationalExpense.delete({ where: { id } });
      res.json({ message: "Expense deleted successfully" });
    } catch (error) {
      console.error("Error deleting operational expense:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};
