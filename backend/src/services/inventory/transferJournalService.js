import { prisma } from '../../config/db.js';
import { createLedgerEntry } from '../../utils/journalHelper.js';

/**
 * Service to handle journaling for stock transfers
 */
class TransferJournalService {
  /**
   * Create a mutation journal for a completed Goods Receipt of type TRANSFER
   * @param {string} grId - Goods Receipt ID
   * @param {Object} tx - Prisma transaction context
   * @returns {Promise<{success: boolean, ledger?: Object, error?: string}>}
   */
  async createMutationJournal(grId, tx) {
    const prismaClient = tx || prisma;

    try {
      // 1. Fetch the Goods Receipt with all necessary relations
      const gr = await prismaClient.goodsReceipt.findUnique({
        where: { id: grId },
        include: {
          items: {
            include: {
              product: true,
            }
          },
          Warehouse: true,
        }
      });

      if (!gr) {
        throw new Error(`Goods Receipt [${grId}] not found`);
      }

      if (gr.sourceType !== 'TRANSFER') {
        throw new Error(`Goods Receipt [${gr.grNumber}] is not a TRANSFER. Current source: ${gr.sourceType}`);
      }

      // 2. Resolve the Source Warehouse and Transfer
      const transferNumber = gr.vendorDeliveryNote;
      if (!transferNumber) {
        throw new Error(`Transfer number (vendorDeliveryNote) is missing in GR [${gr.grNumber}]`);
      }

      const stockTransfer = await prismaClient.stockTransfer.findFirst({
        where: { transferNumber },
        include: {
          fromWarehouse: true,
        }
      });

      if (!stockTransfer) {
        throw new Error(`Source Stock Transfer [${transferNumber}] not found for GR [${gr.grNumber}]`);
      }

      const fromWarehouse = stockTransfer.fromWarehouse;
      const toWarehouse = gr.Warehouse;

      if (!toWarehouse) {
        throw new Error(`Destination warehouse is missing in GR [${gr.grNumber}]`);
      }

      // 3. Determine Accounts
      const debitAccountId = toWarehouse.inventoryAccountId;
      const creditAccountId = fromWarehouse.inventoryAccountId;

      // Validation: Ensure accounts are set
      if (!debitAccountId) {
        throw new Error(`Inventory account is not configured for destination warehouse: ${toWarehouse.name} (${toWarehouse.code})`);
      }
      if (!creditAccountId) {
        throw new Error(`Inventory account is not configured for source warehouse: ${fromWarehouse.name} (${fromWarehouse.code})`);
      }

      // 4. Calculate Total Value based on Transfer Costs
      // Cost Strategy: Use the COGS/PriceUnit already recorded during the MR Issue phase.
      let totalValue = 0;
      for (const item of gr.items) {
        const qty = Number(item.qtyPassed || 0);
        if (qty <= 0) {
          console.log(`[TransferJournalService] Skipping item ${item.productId}: qtyPassed is 0`);
          continue;
        }

        // Try to find the cost from the MaterialRequisition (the most reliable source for FIFO cost)
        const mr = await prismaClient.materialRequisition.findFirst({
          where: {
            notes: { contains: `[${transferNumber}]` }
          },
          include: {
            items: {
              where: { productId: item.productId },
              select: { priceUnit: true }
            }
          }
        });

        let unitCost = 0;
        if (mr && mr.items.length > 0) {
          unitCost = Number(mr.items[0].priceUnit || 0);
          console.log(`[TransferJournalService] Found cost from MR for product ${item.productId}: ${unitCost}`);
        } else {
          // Fallback to StockTransferItem cost
          const tfItem = await prismaClient.stockTransferItem.findFirst({
            where: {
              transferId: stockTransfer.id,
              productId: item.productId
            },
            select: { cogs: true, quantity: true }
          });
          if (tfItem && Number(tfItem.quantity) > 0) {
            unitCost = Number(tfItem.cogs || 0) / Number(tfItem.quantity);
            console.log(`[TransferJournalService] Found cost from TF Item for product ${item.productId}: ${unitCost}`);
          } else {
            console.warn(`[TransferJournalService] No cost found for product ${item.productId} in MR or TF`);
          }
        }

        totalValue += unitCost * qty;
      }

      if (totalValue <= 0) {
        console.warn(`[TransferJournalService] Skipping journal for GR ${gr.grNumber}: Total value is 0`);
        return { success: true, message: 'Zero value transfer, no journal needed' };
      }

      // 5. Create Ledger Entry
      console.log(`[TransferJournalService] Creating ledger entry for GR ${gr.grNumber}. Total Value: ${totalValue}`);
      
      const ledger = await createLedgerEntry({
        referenceType: 'GOODS_RECEIPT', // Must be a valid LedgerEntryType
        referenceId: gr.id,
        referenceNumber: gr.grNumber,
        tanggal: gr.receivedDate || new Date(),
        keterangan: `Stock Mutation: ${transferNumber} from ${fromWarehouse.name} to ${toWarehouse.name}`,
        createdById: gr.receivedById,
        tx: prismaClient,
        entries: [
          {
            coaId: debitAccountId,
            debit: totalValue,
            credit: 0,
            keterangan: `Stock In (Transfer): ${gr.grNumber}`
          },
          {
            coaId: creditAccountId,
            debit: 0,
            credit: totalValue,
            keterangan: `Stock Out (Transfer): ${gr.grNumber}`
          }
        ]
      });

      // 6. Audit Trail
      await prismaClient.auditLog.create({
        data: {
          model: 'Ledger',
          action: 'CREATE',
          userId: gr.receivedById,
          data: JSON.stringify({
            message: 'Stock Mutation Journal Created',
            grNumber: gr.grNumber,
            transferNumber: transferNumber,
            totalValue: totalValue,
            ledgerId: ledger.id
          }),
          after: { ledgerId: ledger.id, totalValue }
        }
      });

      return { success: true, ledger };

    } catch (error) {
      console.error(`[TransferJournalService] Error creating mutation journal:`, error);
      
      // Log error to AuditLog for traceability
      await prismaClient.auditLog.create({
        data: {
          model: 'StockTransfer',
          action: 'JOURNAL_ERROR',
          userId: 'SYSTEM',
          data: JSON.stringify({
            grId: grId,
            error: error.message,
            stack: error.stack
          }),
          timestamp: new Date()
        }
      }).catch(err => console.error('Failed to log archival error:', err));

      return { success: false, error: error.message };
    }
  }
}

export default new TransferJournalService();
