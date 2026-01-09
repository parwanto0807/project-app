
import { prisma } from "../../config/db.js";
import { validationResult } from "express-validator";

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
        const end = new Date(endDate);

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
                quarter,
                isClosed: false
            }
        });

        res.status(201).json({ success: true, message: "Accounting Period created", data: period });

    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ success: false, message: "Period Code already exists" });
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
        const end = endDate ? new Date(endDate) : undefined;
        
        // Prepare update data
        const data = {};
        if (periodName) data.periodName = periodName;
        if (start) data.startDate = start;
        if (end) data.endDate = end;

        if (start && end && start > end) return res.status(400).json({ success: false, message: "Start Date must be before End Date" });
        
        // If dates changed, update fiscal year? Assuming yes.
        if (start) {
            data.fiscalYear = start.getFullYear();
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

  // Close Period
  async closePeriod(req, res) {
      try {
          const { id } = req.params;
          const userId = req.user?.id;
          
          // Logic: Check if all transactions are posted? (Optional, based on requirement)
          // For now just toggle status.

          const period = await prisma.accountingPeriod.update({
              where: { id },
              data: {
                  isClosed: true,
                  closedAt: new Date(),
                  closedBy: userId || 'System'
              }
          });
           res.status(200).json({ success: true, message: "Accounting Period closed", data: period });
      } catch (error) {
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
