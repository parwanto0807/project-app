import { financialReportService } from '../../services/accounting/financialReportService.js';

export const financialReportController = {
  getIncomeStatement: async (req, res) => {
    try {
      const { startDate, endDate, salesOrderId } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ 
          success: false, 
          error: "Start Date and End Date are required" 
        });
      }

      const report = await financialReportService.getIncomeStatement({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        salesOrderId: (salesOrderId && salesOrderId !== 'all') ? salesOrderId : undefined
      });

      res.json({
        success: true,
        data: report,
        period: {
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        },
        filters: {
            salesOrderId: salesOrderId || null
        }
      });
    } catch (error) {
      console.error("Error generating Income Statement:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to generate report",
        details: error.message 
      });
    }
  },

  getBalanceSheet: async (req, res) => {
    try {
      const { endDate } = req.query;

      if (!endDate) {
        return res.status(400).json({ 
          success: false, 
          error: "End Date is required" 
        });
      }

      const report = await financialReportService.getBalanceSheet({
        endDate: new Date(endDate)
      });

      res.json({
        success: true,
        data: report,
        snapshotDate: new Date(endDate)
      });
    } catch (error) {
      console.error("Error generating Balance Sheet:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to generate report",
        details: error.message 
      });
    }
  }
};
