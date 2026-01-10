// import { PrismaClient } from "../../../prisma/generated/prisma/index.js";
import { prisma } from "../../config/db.js";
import { validationResult } from "express-validator";

// const prisma = new PrismaClient();

// ENUM Definitions (sesuai dengan model Prisma)
const CoaType = {
  ASET: "ASET",
  LIABILITAS: "LIABILITAS",
  EKUITAS: "EKUITAS",
  PENDAPATAN: "PENDAPATAN",
  HPP: "HPP",
  BEBAN: "BEBAN",
};

const CoaNormalBalance = {
  DEBIT: "DEBIT",
  CREDIT: "CREDIT",
};

const CoaPostingType = {
  HEADER: "HEADER",
  POSTING: "POSTING",
};

const CoaCashflowType = {
  OPERATING: "OPERATING",
  INVESTING: "INVESTING",
  FINANCING: "FINANCING",
  NONE: "NONE",
};

const CoaStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  LOCKED: "LOCKED",
};

export const coaController = {
  // GET ALL COA
  async getAllCOA(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        type,
        status = "ACTIVE",
        postingType,
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const where = {
        status: status || "ACTIVE",
      };

      // Filter by search term
      if (search) {
        where.OR = [
          { code: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      // Filter by type
      if (type && Object.values(CoaType).includes(type)) {
        where.type = type;
      }

      // Filter by posting type
      if (postingType && Object.values(CoaPostingType).includes(postingType)) {
        where.postingType = postingType;
      }

      const [coas, total] = await Promise.all([
        prisma.chartOfAccounts.findMany({
          where,
          include: {
            parent: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            children: {
              select: {
                id: true,
                code: true,
                name: true,
                type: true,
              },
            },
            taxRate: {
              select: {
                id: true,
                name: true,
                rate: true,
              },
            },
            bankAccount: {
              select: {
                id: true,
                bankName: true,
                accountNumber: true,
              },
            },
          },
          orderBy: [{ code: "asc" }],
          skip,
          take: parseInt(limit),
        }),
        prisma.chartOfAccounts.count({ where }),
      ]);

      res.json({
        success: true,
        data: coas,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Get All COA Error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  // GET COA BY ID
  async getCOAById(req, res) {
    try {
      const { id } = req.params;

      const coa = await prisma.chartOfAccounts.findUnique({
        where: { id },
        include: {
          parent: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
            },
          },
          children: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
              status: true,
            },
          },
          taxRate: {
            select: {
              id: true,
              name: true,
              rate: true,
              isActive: true,
            },
          },
        },
      });

      if (!coa) {
        return res.status(404).json({
          success: false,
          message: "COA not found",
        });
      }

      res.json({
        success: true,
        data: coa,
      });
    } catch (error) {
      console.error("Get COA By ID Error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  // CREATE COA
  async createCOA(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("Validation Errors:", JSON.stringify(errors.array(), null, 2));
        console.log("Request Body:", req.body);
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const {
        code,
        name,
        description,
        type,
        normalBalance,
        postingType = "POSTING",
        cashflowType = "NONE",
        status = "ACTIVE",
        isReconcilable = false,
        defaultCurrency = "IDR",
        parentId,
        taxRateId,
      } = req.body;

      // Check if code already exists
      const existingCode = await prisma.chartOfAccounts.findUnique({
        where: { code },
      });

      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: "COA code already exists",
        });
      }

      // Validate parent if provided
      if (parentId) {
        const parent = await prisma.chartOfAccounts.findUnique({
          where: { id: parentId },
        });

        if (!parent) {
          return res.status(400).json({
            success: false,
            message: "Parent COA not found",
          });
        }

        // Validate that parent is a HEADER type
        if (parent.postingType !== "HEADER") {
          return res.status(400).json({
            success: false,
            message: "Parent COA must be of HEADER type",
          });
        }
      }

      // Validate tax rate if provided
      if (taxRateId) {
        const taxRate = await prisma.taxRate.findUnique({
          where: { id: taxRateId },
        });

        if (!taxRate) {
          return res.status(400).json({
            success: false,
            message: "Tax rate not found",
          });
        }
      }

      const coa = await prisma.chartOfAccounts.create({
        data: {
          code,
          name,
          description,
          type,
          normalBalance,
          postingType,
          cashflowType,
          status,
          isReconcilable,
          defaultCurrency,
          parentId,
          taxRateId,
        },
        include: {
          parent: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          taxRate: {
            select: {
              id: true,
              name: true,
              rate: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: "COA created successfully",
        data: coa,
      });
    } catch (error) {
      console.error("Create COA Error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  // UPDATE COA
  async updateCOA(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      // Check if COA exists
      const existingCOA = await prisma.chartOfAccounts.findUnique({
        where: { id },
      });

      if (!existingCOA) {
        return res.status(404).json({
          success: false,
          message: "COA not found",
        });
      }

      // Prevent updating code if it's being changed and already exists
      if (updateData.code && updateData.code !== existingCOA.code) {
        const codeExists = await prisma.chartOfAccounts.findUnique({
          where: { code: updateData.code },
        });

        if (codeExists) {
          return res.status(400).json({
            success: false,
            message: "COA code already exists",
          });
        }
      }

      // Validate parent if provided
      if (updateData.parentId) {
        const parent = await prisma.chartOfAccounts.findUnique({
          where: { id: updateData.parentId },
        });

        if (!parent) {
          return res.status(400).json({
            success: false,
            message: "Parent COA not found",
          });
        }

        // Prevent circular reference
        if (updateData.parentId === id) {
          return res.status(400).json({
            success: false,
            message: "COA cannot be its own parent",
          });
        }

        // Check if parent is HEADER type
        if (parent.postingType !== "HEADER") {
          return res.status(400).json({
            success: false,
            message: "Parent COA must be of HEADER type",
          });
        }
      }

      // Validate tax rate if provided
      if (updateData.taxRateId) {
        const taxRate = await prisma.taxRate.findUnique({
          where: { id: updateData.taxRateId },
        });

        if (!taxRate) {
          return res.status(400).json({
            success: false,
            message: "Tax rate not found",
          });
        }
      }

      const updatedCOA = await prisma.chartOfAccounts.update({
        where: { id },
        data: updateData,
        include: {
          parent: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          taxRate: {
            select: {
              id: true,
              name: true,
              rate: true,
            },
          },
        },
      });

      res.json({
        success: true,
        message: "COA updated successfully",
        data: updatedCOA,
      });
    } catch (error) {
      console.error("Update COA Error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  // DELETE COA (Soft delete by setting status to INACTIVE)
  async deleteCOA(req, res) {
    try {
      const { id } = req.params;

      // Check if COA exists
      const existingCOA = await prisma.chartOfAccounts.findUnique({
        where: { id },
        include: {
          children: true,
          journalLines: true,
        },
      });

      if (!existingCOA) {
        return res.status(404).json({
          success: false,
          message: "COA not found",
        });
      }

      // Check if COA has children
      if (existingCOA.children.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete COA that has child accounts",
        });
      }

      // Check if COA has journal entries
      if (existingCOA.journalLines.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete COA that has journal entries",
        });
      }

      // Hard delete only if no dependencies
      await prisma.chartOfAccounts.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "COA deleted successfully",
      });
    } catch (error) {
      console.error("Delete COA Error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  // DEACTIVATE COA
  async deactivateCOA(req, res) {
    try {
      const { id } = req.params;

      const updatedCOA = await prisma.chartOfAccounts.update({
        where: { id },
        data: { status: "INACTIVE" },
      });

      res.json({
        success: true,
        message: "COA deactivated successfully",
        data: updatedCOA,
      });
    } catch (error) {
      console.error("Deactivate COA Error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  // ACTIVATE COA
  async activateCOA(req, res) {
    try {
      const { id } = req.params;

      const updatedCOA = await prisma.chartOfAccounts.update({
        where: { id },
        data: { status: "ACTIVE" },
      });

      res.json({
        success: true,
        message: "COA activated successfully",
        data: updatedCOA,
      });
    } catch (error) {
      console.error("Activate COA Error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  // GET COA HIERARCHY
  async getCOAHierarchy(req, res) {
    try {
      const { type } = req.query;

      const where = {
        status: "ACTIVE",
        parentId: null, // Only get root level accounts
      };

      if (type && Object.values(CoaType).includes(type)) {
        where.type = type;
      }

      const hierarchy = await prisma.chartOfAccounts.findMany({
        where,
        include: {
          children: {
            where: { status: "ACTIVE" },
            include: {
              children: {
                where: { status: "ACTIVE" },
                include: {
                  children: {
                    where: { status: "ACTIVE" },
                  },
                },
              },
            },
          },
        },
        orderBy: { code: "asc" },
      });

      res.json({
        success: true,
        data: hierarchy,
      });
    } catch (error) {
      console.error("Get COA Hierarchy Error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },
};
