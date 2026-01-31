
import { prisma } from "../../config/db.js";
import { validationResult } from "express-validator";
import ClosingService from "../../services/accounting/closingService.js";

class PeriodController {
  constructor() {
    this.createPeriod = this.createPeriod.bind(this);
    this.updatePeriod = this.updatePeriod.bind(this);
    this.getPeriods = this.getPeriods.bind(this);
    this.getPeriodById = this.getPeriodById.bind(this);
    this.closePeriod = this.closePeriod.bind(this);
    this.reopenPeriod = this.reopenPeriod.bind(this);
  }

  // Get All Periods
  async getPeriods(req, res) {
    try {
      const { year, status, search, page = 1, limit = 10 } = req.query;
      
      const where = {};
      
      if (year) where.fiscalYear = parseInt(year);
      if (status === 'OPEN') where.isClosed = false;
      if (status === 'CLOSED') where.isClosed = true;
      if (search) {
        where.OR = [
            { periodCode: { contains: search, mode: 'insensitive' } },
            { periodName: { contains: search, mode: 'insensitive' } }
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [data, total] = await Promise.all([
        prisma.accountingPeriod.findMany({
            where,
            skip,
            take: parseInt(limit),
            orderBy: { startDate: 'desc' }
        }),
        prisma.accountingPeriod.count({ where })
      ]);

      res.status(200).json({
        success: true,
        data,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error("Get Periods Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get By ID
  async getPeriodById(req, res) {
    try {
        const { id } = req.params;
        const period = await prisma.accountingPeriod.findUnique({ where: { id } });
        if(!period) return res.status(404).json({ success: false, message: "Accounting Period not found" });
        res.status(200).json({ success: true, data: period });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
  }

  // Create Period
  async createPeriod(req, res) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const { periodCode, periodName, startDate, endDate } = req.body;

        const start = new Date(startDate);
        const end = new Date(new Date(endDate).setHours(23, 59, 59, 999));

        // Simple validation
        if (start > end) return res.status(400).json({ success: false, message: "Start Date must be before End Date" });

        // Calculate Fiscal Year and Quarter
        const fiscalYear = start.getFullYear();
        const month = start.getMonth() + 1; // 1-12
        const quarter = Math.ceil(month / 3);

        const period = await prisma.accountingPeriod.create({
            data: {
                periodCode,
                periodName,
                startDate: start,
                endDate: end,
                fiscalYear,
                periodMonth: month,
                quarter,
                isClosed: false
            }
        });

        res.status(201).json({ success: true, message: "Accounting Period created", data: period });

    } catch (error) {
        if (error.code === 'P2002') {
            const target = error.meta?.target || [];
            if (target.includes('periodMonth')) {
                return res.status(400).json({ success: false, message: "Accounting period for this month and year already exists across any codes." });
            }
            return res.status(400).json({ success: false, message: "Period Code already exists" });
        }
        console.error("Create Period Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
  }

  // Update Period
  async updatePeriod(req, res) {
      try {
        const { id } = req.params;
        const { periodName, startDate, endDate } = req.body;

        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : undefined;
        
        // Prepare update data
        const data = {};
        if (periodName) data.periodName = periodName;
        if (start) data.startDate = start;
        if (end) data.endDate = end;

        if (start && end && start > end) return res.status(400).json({ success: false, message: "Start Date must be before End Date" });
        
        // If dates changed, update fiscal year? Assuming yes.
        if (start) {
            data.fiscalYear = start.getFullYear();
            data.periodMonth = start.getMonth() + 1;
            data.quarter = Math.ceil((start.getMonth() + 1) / 3);
        }

        const period = await prisma.accountingPeriod.update({
            where: { id },
            data
        });

        res.status(200).json({ success: true, message: "Accounting Period updated", data: period });

      } catch (error) {
        console.error("Update Period Error:", error);
        res.status(500).json({ success: false, message: error.message });
      }
  }

  // Get Closing Validation
  async getClosingValidation(req, res) {
      try {
          const { id } = req.params;
          const result = await ClosingService.validatePreClosing(id);
          res.status(200).json(result);
      } catch (error) {
          res.status(500).json({ success: false, message: error.message });
      }
  }

  // Close Period
  async closePeriod(req, res) {
      try {
          const { id } = req.params;
          const { autoCreateNext } = req.body;
          const userId = req.user?.id;
          
          const period = await ClosingService.performClosing(id, userId, autoCreateNext);

          res.status(200).json({ success: true, message: "Accounting Period closed successfully and balances rolled over.", data: period });
      } catch (error) {
          console.error("Close Period Error:", error);
          res.status(500).json({ success: false, message: error.message });
      }
  }

    // Reopen Period
    async reopenPeriod(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const userId = req.user?.id;
  
            const period = await prisma.accountingPeriod.update({
                where: { id },
                data: {
                    isClosed: false,
                    reopenAt: new Date(),
                    reopenBy: userId || 'System',
                    reopenReason: reason
                }
            });
             res.status(200).json({ success: true, message: "Accounting Period reopened", data: period });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

export default new PeriodController();
