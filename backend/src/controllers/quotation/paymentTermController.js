// import { PrismaClient } from "../../../prisma/generated/prisma/index.js";
// const prisma = new PrismaClient();
import { prisma } from "../../config/db.js";

// Create PaymentTerm
export async function createPaymentTerm(req, res) {
  try {
    const { code, name, description, dueDays, isActive } = req.body;
    if (!code || !name || dueDays === undefined) {
      return res
        .status(400)
        .json({ message: "Data payment term tidak lengkap" });
    }

    const paymentTerm = await prisma.paymentTerm.create({
      data: { code, name, description, dueDays, isActive },
    });

    res.status(201).json(paymentTerm);
  } catch (err) {
    console.error("[createPaymentTerm]", err);
    res
      .status(500)
      .json({ message: "Gagal membuat payment term", error: err.message });
  }
}

// Get all PaymentTerm
export async function getPaymentTerms(req, res) {
  try {
    const terms = await prisma.paymentTerm.findMany();
    res.json(terms);
  } catch (err) {
    console.error("[getPaymentTerms]", err);
    res
      .status(500)
      .json({ message: "Gagal fetch payment term", error: err.message });
  }
}

// Get PaymentTerm by ID
export async function getPaymentTermById(req, res) {
  const { id } = req.params;
  try {
    const term = await prisma.paymentTerm.findUnique({ where: { id } });
    if (!term)
      return res.status(404).json({ message: "Payment term tidak ditemukan" });
    res.json(term);
  } catch (err) {
    console.error("[getPaymentTermById]", err);
    res
      .status(500)
      .json({ message: "Gagal fetch payment term", error: err.message });
  }
}

// Update PaymentTerm
export async function updatePaymentTerm(req, res) {
  const { id } = req.params;
  const { code, name, description, dueDays, isActive } = req.body;
  try {
    const term = await prisma.paymentTerm.update({
      where: { id },
      data: { code, name, description, dueDays, isActive },
    });
    res.json(term);
  } catch (err) {
    console.error("[updatePaymentTerm]", err);
    res
      .status(500)
      .json({ message: "Gagal update payment term", error: err.message });
  }
}

// Delete PaymentTerm
export async function deletePaymentTerm(req, res) {
  const { id } = req.params;
  try {
    await prisma.paymentTerm.delete({ where: { id } });
    res.json({ message: "Payment term berhasil dihapus" });
  } catch (err) {
    console.error("[deletePaymentTerm]", err);
    res
      .status(500)
      .json({ message: "Gagal hapus payment term", error: err.message });
  }
}

export default {
  createPaymentTerm,
  getPaymentTerms,
  getPaymentTermById,
  updatePaymentTerm,
  deletePaymentTerm,
};
