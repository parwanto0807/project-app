import { fundTransferService } from '../../services/finance/fundTransferService.js';
import { prisma } from '../../config/db.js';

class FundTransferController {
    // Get all transfers with pagination
    async getTransfers(req, res) {
        try {
            const { page = 1, limit = 10, search = '' } = req.query;
            const skip = (page - 1) * limit;

            const where = search ? {
                OR: [
                    { transferNo: { contains: search, mode: 'insensitive' } },
                    { referenceNo: { contains: search, mode: 'insensitive' } },
                    { notes: { contains: search, mode: 'insensitive' } }
                ]
            } : {};

            const [data, total] = await Promise.all([
                prisma.fundTransfer.findMany({
                    where,
                    skip: Number(skip),
                    take: Number(limit),
                    orderBy: { createdAt: 'desc' },
                    include: {
                        fromAccount: true,
                        toAccount: true,
                        feeAccount: true,
                        createdBy: { select: { name: true } }
                    }
                }),
                prisma.fundTransfer.count({ where })
            ]);

            res.json({
                success: true,
                data,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Get Single
    async getTransferById(req, res) {
        try {
            const { id } = req.params;
            const data = await prisma.fundTransfer.findUnique({
                where: { id },
                include: {
                    fromAccount: true,
                    toAccount: true,
                    feeAccount: true,
                    ledger: { include: { ledgerLines: true } }
                }
            });

            if (!data) return res.status(404).json({ success: false, message: "Transfer not found" });
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Create Transfer
    async createTransfer(req, res) {
        try {
            const result = await fundTransferService.createTransfer(req.body, req.user.id);
            res.status(201).json({
                success: true,
                message: "Fund transfer saved as DRAFT",
                data: result
            });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    // Update Transfer
    async updateTransfer(req, res) {
        try {
            const { id } = req.params;
            const result = await fundTransferService.updateTransfer(id, req.body, req.user.id);
            res.json({
                success: true,
                message: "Fund transfer updated successfully",
                data: result
            });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    // Delete Transfer
    async deleteTransfer(req, res) {
        try {
            const { id } = req.params;
            await fundTransferService.deleteTransfer(id);
            res.json({
                success: true,
                message: "Fund transfer deleted successfully"
            });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    // Post Transfer
    async postTransfer(req, res) {
        try {
            const { id } = req.params;
            const result = await fundTransferService.postTransfer(id, req.user.id);
            res.json({
                success: true,
                message: "Fund transfer posted to ledger successfully",
                data: result
            });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    // Void Transfer (Ganti Delete dengan Void agar audit trail terjaga)
    async voidTransfer(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            // Logika Void (Bisa dikembangkan lebih lanjut untuk reversal jurnal)
            const result = await prisma.fundTransfer.update({
                where: { id },
                data: {
                    status: 'VOIDED',
                    voidedById: req.user.id,
                    voidedAt: new Date(),
                    voidReason: reason
                }
            });

            res.json({ success: true, message: "Transfer voided successfully", data: result });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

export default new FundTransferController();
