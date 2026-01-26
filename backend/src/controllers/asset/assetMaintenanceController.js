import { prisma } from "../../config/db.js";
import { createLedgerEntry } from "../../utils/journalHelper.js";

export const assetMaintenanceController = {
  // Get maintenances for an asset
  getByAssetId: async (req, res) => {
    try {
      const { assetId } = req.params;
      const maintenances = await prisma.assetMaintenance.findMany({
        where: { assetId },
        include: { supplier: true },
        orderBy: { maintenanceDate: 'desc' },
      });
      res.status(200).json({ success: true, data: maintenances });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Record a maintenance
  create: async (req, res) => {
    try {
      const {
        assetId,
        maintenanceDate,
        type,
        description,
        cost,
        performedBy,
        nextSchedule,
        status,
        supplierId,
        periodId, // Optional for journaling
        isJournaled // Toggle to create journal entry
      } = req.body;

      const result = await prisma.$transaction(async (tx) => {
        const maintenance = await tx.assetMaintenance.create({
          data: {
            assetId,
            maintenanceDate: new Date(maintenanceDate),
            type,
            description,
            cost: parseFloat(cost),
            performedBy,
            supplierId,
            nextSchedule: nextSchedule ? new Date(nextSchedule) : null,
            status: status || 'COMPLETED',
          },
        });

        // Optional: Create Journal Entry if it's a significant cost
        if (isJournaled && parseFloat(cost) > 0 && periodId) {
          const asset = await tx.fixedAsset.findUnique({
            where: { id: assetId },
            include: { category: true }
          });

          const ledger = await createLedgerEntry({
            referenceType: 'ASSET_MAINTENANCE',
            referenceId: maintenance.id,
            referenceNumber: asset.assetCode,
            tanggal: new Date(maintenanceDate),
            keterangan: `Pemeliharaan Aset: ${asset.name} - ${description}`,
            entries: [
              {
                coaId: asset.category.deprecExpenseAccountId, // Usually maintenance expense, using dep expense as proxy or system account
                debit: parseFloat(cost),
                credit: 0
              },
              {
                systemAccountKey: 'CASH_BANK', // Placeholder or use passed cashBankAccountId
                debit: 0,
                credit: parseFloat(cost)
              }
            ],
            createdById: req.user?.id || 'SYSTEM',
            tx
          });

          await tx.assetMaintenance.update({
            where: { id: maintenance.id },
            data: { ledgerId: ledger.id }
          });
        }

        return maintenance;
      });

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      console.error('Maintenance create error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Update maintenance
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      if (data.maintenanceDate) data.maintenanceDate = new Date(data.maintenanceDate);
      if (data.nextSchedule) data.nextSchedule = new Date(data.nextSchedule);
      if (data.cost) data.cost = parseFloat(data.cost);

      const maintenance = await prisma.assetMaintenance.update({
        where: { id },
        data,
      });
      res.status(200).json({ success: true, data: maintenance });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Delete maintenance
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.assetMaintenance.delete({ where: { id } });
      res.status(200).json({ success: true, message: 'Maintenance record deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
