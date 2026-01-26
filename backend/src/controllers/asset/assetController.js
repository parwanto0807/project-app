import { prisma } from "../../config/db.js";
import { createLedgerEntry } from "../../utils/journalHelper.js";

export const assetController = {
  // Get all fixed assets
  getAll: async (req, res) => {
    try {
      const { search, categoryId, status } = req.query;
      const where = {};

      if (categoryId) where.categoryId = categoryId;
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { assetCode: { contains: search, mode: 'insensitive' } },
        ];
      }

      const assets = await prisma.fixedAsset.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: { assetCode: 'asc' },
      });

      res.status(200).json({ success: true, data: assets });
    } catch (error) {
      console.error('Error fetching assets:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get single asset by ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const asset = await prisma.fixedAsset.findUnique({
        where: { id },
        include: {
          category: true,
          depreciations: {
            orderBy: { depreciationDate: 'desc' },
          },
          maintenances: {
            include: { supplier: true },
            orderBy: { maintenanceDate: 'desc' },
          }
        },
      });

      if (!asset) {
        return res.status(404).json({ success: false, message: 'Asset not found' });
      }

      res.status(200).json({ success: true, data: asset });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Create new fixed asset
  create: async (req, res) => {
    try {
      const {
        assetCode,
        name,
        description,
        categoryId,
        acquisitionDate,
        acquisitionCost,
        salvageValue,
        usefulLife,
        location,
        department,
      } = req.body;

      // Check if assetCode already exists
      const existing = await prisma.fixedAsset.findUnique({ where: { assetCode } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Asset code already exists' });
      }

      const asset = await prisma.fixedAsset.create({
        data: {
          assetCode,
          name,
          description,
          categoryId,
          acquisitionDate: new Date(acquisitionDate),
          acquisitionCost: parseFloat(acquisitionCost),
          salvageValue: parseFloat(salvageValue || 0),
          usefulLife: parseInt(usefulLife),
          location,
          department,
          bookValue: parseFloat(acquisitionCost),
        },
      });

      res.status(201).json({ success: true, data: asset });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Update fixed asset
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;

      // Prevent updating sensitive financial data directly if needed
      // but for now allow general updates
      const asset = await prisma.fixedAsset.update({
        where: { id },
        data: {
          ...data,
          acquisitionDate: data.acquisitionDate ? new Date(data.acquisitionDate) : undefined,
          acquisitionCost: data.acquisitionCost ? parseFloat(data.acquisitionCost) : undefined,
          salvageValue: data.salvageValue ? parseFloat(data.salvageValue) : undefined,
          usefulLife: data.usefulLife ? parseInt(data.usefulLife) : undefined,
        },
      });

      res.status(200).json({ success: true, data: asset });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Delete fixed asset
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.fixedAsset.delete({ where: { id } });
      res.status(200).json({ success: true, message: 'Asset deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Calculate and Post Depreciation (Simplified Straight Line)
  postDepreciation: async (req, res) => {
    try {
      const { id } = req.params;
      const { periodId, date } = req.body;

      const asset = await prisma.fixedAsset.findUnique({
        where: { id },
        include: { category: true },
      });

      if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
      if (asset.status !== 'ACTIVE') return res.status(400).json({ success: false, message: 'Asset is not active' });

      // Calculate monthly depreciation
      const usefulLifeMonths = (asset.usefulLife || asset.category.usefulLife) * 12;
      const depreciableAmount = parseFloat(asset.acquisitionCost) - parseFloat(asset.salvageValue);
      const monthlyDepreciation = depreciableAmount / usefulLifeMonths;

      // Update asset totals
      const newTotalDepreciation = parseFloat(asset.totalDepreciation) + monthlyDepreciation;
      const newBookValue = parseFloat(asset.acquisitionCost) - newTotalDepreciation;

      const result = await prisma.$transaction(async (tx) => {
        // 1. Create Depreciation Record
        const depRecord = await tx.assetDepreciation.create({
          data: {
            assetId: id,
            depreciationDate: new Date(date),
            amount: monthlyDepreciation,
            periodId,
          },
        });

        // 2. Create Journal Entry (Ledger)
        const journalEntries = [
          {
            coaId: asset.category.deprecExpenseAccountId,
            debit: monthlyDepreciation,
            credit: 0,
            keterangan: `Penyusutan ${asset.name} - ${asset.assetCode}`,
          },
          {
            coaId: asset.category.accumDeprecAccountId,
            debit: 0,
            credit: monthlyDepreciation,
            keterangan: `Penyusutan ${asset.name} - ${asset.assetCode}`,
          }
        ];

        const ledger = await createLedgerEntry({
          referenceType: 'DEPRECIATION',
          referenceId: depRecord.id,
          referenceNumber: asset.assetCode,
          tanggal: new Date(date),
          keterangan: `Penyusutan Aset: ${asset.name} (${asset.assetCode})`,
          entries: journalEntries,
          createdById: req.user?.id || 'SYSTEM',
          tx,
        });

        // 3. Update Asset
        await tx.fixedAsset.update({
          where: { id },
          data: {
            totalDepreciation: newTotalDepreciation,
            bookValue: newBookValue,
            lastDepreciationDate: new Date(date),
          },
        });

        // 4. Update Deprec Record with Ledger reference
        await tx.assetDepreciation.update({
          where: { id: depRecord.id },
          data: { ledgerId: ledger.id }
        });

        return depRecord;
      });

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      console.error('Depreciation error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Bulk Create Assets
  bulkCreate: async (req, res) => {
    try {
      const { assets } = req.body; // Array of asset objects
      
      if (!Array.isArray(assets) || assets.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid or empty assets array' });
      }

      const result = await prisma.$transaction(async (tx) => {
        const createdAssets = [];
        
        for (const assetData of assets) {
          const {
            name,
            categoryId,
            acquisitionDate,
            acquisitionCost,
            salvageValue,
            usefulLife,
            description,
            location,
            serialNumber,
          } = assetData;

          // Generate Asset Code (Simple version for bulk)
          const now = new Date();
          const year = now.getFullYear().toString().slice(-2);
          const count = await tx.fixedAsset.count();
          const assetCode = `AST-${year}${String(count + createdAssets.length + 1).padStart(4, '0')}`;

          const asset = await tx.fixedAsset.create({
            data: {
              assetCode,
              name,
              categoryId,
              acquisitionDate: new Date(acquisitionDate),
              acquisitionCost: parseFloat(acquisitionCost),
              salvageValue: parseFloat(salvageValue || 0),
              usefulLife: parseInt(usefulLife),
              bookValue: parseFloat(acquisitionCost),
              description,
              location,
              serialNumber,
              status: 'ACTIVE',
            },
          });
          createdAssets.push(asset);
        }
        return createdAssets;
      });

      res.status(201).json({ success: true, data: result, count: result.length });
    } catch (error) {
      console.error('Bulk upload error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Dispose an asset (Sale or Retirement)
  dispose: async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        disposalDate, 
        disposalType, // 'SOLD', 'WRITTEN_OFF'
        proceeds, 
        periodId,
        remarks,
        cashBankAccountId // For 'SOLD' type
      } = req.body;

      const asset = await prisma.fixedAsset.findUnique({
        where: { id },
        include: { category: true },
      });

      if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
      if (asset.status !== 'ACTIVE') return res.status(400).json({ success: false, message: 'Only active assets can be disposed' });

      const acquisitionCost = parseFloat(asset.acquisitionCost);
      const totalDeprec = parseFloat(asset.totalDepreciation);
      const bookValue = parseFloat(asset.bookValue);
      const disposalProceeds = parseFloat(proceeds || 0);
      const gainLoss = disposalProceeds - bookValue;

      const result = await prisma.$transaction(async (tx) => {
        // 1. Prepare Journal Entries
        const journalEntries = [
          // Remove Accumulated Depreciation (Debit)
          {
            coaId: asset.category.accumDeprecAccountId,
            debit: totalDeprec,
            credit: 0,
            keterangan: `Penutupan Akumulasi Penyusutan: ${asset.name} (${asset.assetCode})`,
          },
          // Remove Asset Cost (Credit)
          {
            coaId: asset.category.assetAccountId,
            debit: 0,
            credit: acquisitionCost,
            keterangan: `Pelepasan Aset Tetap: ${asset.name} (${asset.assetCode})`,
          }
        ];

        // Add Proceeds (Cash/Bank) if sold
        if (disposalType === 'SOLD' && disposalProceeds > 0 && cashBankAccountId) {
          journalEntries.push({
            coaId: cashBankAccountId,
            debit: disposalProceeds,
            credit: 0,
            keterangan: `Penerimaan Penjualan Aset: ${asset.name} (${asset.assetCode})`,
          });
        }

        // Handle Gain or Loss
        if (gainLoss > 0) {
          // GAIN (Credit) - Need a system account or passed COA for Gain on Disposal
          // For now, assume a Gain on Asset Disposal account might be needed.
          // In a real system, we'd lookup a system account 'GAIN_DISPOSAL_ASSET'
          // We will use a fallback or require the user to provide it? 
          // Let's assume we use the deprecExpenseAccountId as a placeholder or a dedicated one if we had it.
          // Better: require gainLossAccountId in request for now if not defined in category.
          const gainCoaId = req.body.gainLossAccountId || asset.category.deprecExpenseAccountId;
          journalEntries.push({
            coaId: gainCoaId,
            debit: 0,
            credit: Math.abs(gainLoss),
            keterangan: `Keuntungan Penjualan Aset: ${asset.name}`,
          });
        } else if (gainLoss < 0) {
          // LOSS (Debit)
          const lossCoaId = req.body.gainLossAccountId || asset.category.deprecExpenseAccountId;
          journalEntries.push({
            coaId: lossCoaId,
            debit: Math.abs(gainLoss),
            credit: 0,
            keterangan: `Kerugian Pelepasan Aset: ${asset.name}`,
          });
        }

        // 2. Create Ledger Entry
        const ledger = await createLedgerEntry({
          referenceType: 'ASSET_DISPOSAL',
          referenceId: asset.id,
          referenceNumber: asset.assetCode,
          tanggal: new Date(disposalDate),
          keterangan: `Pelepasan Aset (${disposalType}): ${asset.name}. Notes: ${remarks || '-'}`,
          entries: journalEntries,
          createdById: req.user?.id || 'SYSTEM',
          tx,
        });

        // 3. Update Asset Status
        const updatedAsset = await tx.fixedAsset.update({
          where: { id },
          data: {
            status: disposalType === 'SOLD' ? 'SOLD' : 'DISPOSED',
            bookValue: 0,
            // We might want to keep the final depreciation or zero it out for book value purposes
          },
        });

        return { updatedAsset, ledgerId: ledger.id };
      });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('Disposal error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
