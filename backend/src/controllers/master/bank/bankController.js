// backend/src/controllers/bankController.js

// import { PrismaClient } from "../../../../prisma/generated/prisma/index.js";
import { prisma } from "../../../config/db.js";
import { validationResult } from "express-validator";

// const prisma = new PrismaClient();

export const bankController = {
  // Create
  async createBankAccount(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { bankName, accountNumber, accountHolder, branch, isActive } =
        req.body;

      const bankAccount = await prisma.bankAccount.create({
        data: {
          bankName,
          accountNumber,
          accountHolder,
          branch,
          isActive,
        },
      });

      return res.status(201).json({
        success: true,
        message: "Bank account created successfully",
        data: bankAccount,
      });
    } catch (error) {
      console.error("❌ Error createBankAccount:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create bank account",
        error: error.message,
      });
    }
  },

  // Read All
  async getAllBankAccounts(req, res) {
    try {
      const accounts = await prisma.bankAccount.findMany({
        orderBy: { createdAt: "desc" },
      });

      return res.json({
        success: true,
        data: accounts,
      });
    } catch (error) {
      console.error("❌ Error getAllBankAccounts:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch bank accounts",
        error: error.message,
      });
    }
  },

  // Read by ID
  async getBankAccountById(req, res) {
    try {
      const { id } = req.params;

      const account = await prisma.bankAccount.findUnique({
        where: { id },
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          message: `Bank account with ID ${id} not found`,
        });
      }

      return res.json({
        success: true,
        data: account,
      });
    } catch (error) {
      console.error("❌ Error getBankAccountById:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch bank account",
        error: error.message,
      });
    }
  },

  // Update
  async updateBankAccount(req, res) {
    try {
      const { id } = req.params;
      const { bankName, accountNumber, accountHolder, branch, isActive } =
        req.body;

      const account = await prisma.bankAccount.findUnique({ where: { id } });
      if (!account) {
        return res.status(404).json({
          success: false,
          message: `Bank account with ID ${id} not found`,
        });
      }

      const updated = await prisma.bankAccount.update({
        where: { id },
        data: { bankName, accountNumber, accountHolder, branch, isActive },
      });

      return res.json({
        success: true,
        message: "Bank account updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("❌ Error updateBankAccount:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update bank account",
        error: error.message,
      });
    }
  },

  // Delete
  async deleteBankAccount(req, res) {
    try {
      const { id } = req.params;

      const account = await prisma.bankAccount.findUnique({ where: { id } });
      if (!account) {
        return res.status(404).json({
          success: false,
          message: `Bank account with ID ${id} not found`,
        });
      }

      await prisma.bankAccount.delete({ where: { id } });

      return res.json({
        success: true,
        message: "Bank account deleted successfully",
      });
    } catch (error) {
      console.error("❌ Error deleteBankAccount:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete bank account",
        error: error.message,
      });
    }
  },
};
