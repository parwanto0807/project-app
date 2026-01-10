import { prisma } from "../../config/db.js";

class SystemAccountController {
  // Get all system accounts
  async getAll(req, res) {
    try {
      const accounts = await prisma.systemAccount.findMany({
        include: {
          coa: {
            select: {
              code: true,
              name: true,
              type: true,
              normalBalance: true,
            },
          },
        },
        orderBy: {
          key: "asc",
        },
      });

      res.status(200).json({
        success: true,
        data: accounts,
      });
    } catch (error) {
      console.error("[SystemAccountController.getAll] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch system accounts",
        error: error.message,
      });
    }
  }

  // Get single system account by key
  async getByKey(req, res) {
    try {
      const { key } = req.params;
      const account = await prisma.systemAccount.findUnique({
        where: { key },
        include: {
          coa: true,
        },
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          message: `System account with key '${key}' not found`,
        });
      }

      res.status(200).json({
        success: true,
        data: account,
      });
    } catch (error) {
      console.error("[SystemAccountController.getByKey] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch system account",
        error: error.message,
      });
    }
  }

  // Create or Update system account (Upsert)
  async upsert(req, res) {
    try {
      const { key, description, coaId } = req.body;

      if (!key || !coaId) {
        return res.status(400).json({
          success: false,
          message: "Key and COA ID are required",
        });
      }

      const account = await prisma.systemAccount.upsert({
        where: { key },
        update: {
          description,
          coaId,
          updatedAt: new Date(),
        },
        create: {
          key,
          description,
          coaId,
        },
        include: {
          coa: {
            select: {
              code: true,
              name: true,
              type: true,
              normalBalance: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        message: "System account saved successfully",
        data: account,
      });
    } catch (error) {
      console.error("[SystemAccountController.upsert] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to save system account",
        error: error.message,
      });
    }
  }

  // Update system account
  async update(req, res) {
    try {
      const { id } = req.params;
      const { key, description, coaId } = req.body;

      const account = await prisma.systemAccount.update({
        where: { id },
        data: {
          key,
          description,
          coaId,
          updatedAt: new Date(),
        },
        include: {
          coa: {
            select: {
              code: true,
              name: true,
              type: true,
              normalBalance: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        message: "System account updated successfully",
        data: account,
      });
    } catch (error) {
      console.error("[SystemAccountController.update] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update system account",
        error: error.message,
      });
    }
  }

  // Delete system account
  async delete(req, res) {
    try {
      const { id } = req.params;

      await prisma.systemAccount.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: "System account deleted successfully",
      });
    } catch (error) {
      console.error("[SystemAccountController.delete] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete system account",
        error: error.message,
      });
    }
  }
}

export default new SystemAccountController();
