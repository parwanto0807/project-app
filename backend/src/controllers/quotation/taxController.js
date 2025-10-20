// import { PrismaClient } from "../../../prisma/generated/prisma/index.js";
// const prisma = new PrismaClient();

import { prisma } from "../../config/db.js";

export async function createTax(req, res) {
  try {
    const { code, name, description, rate, isInclusive, isActive } = req.body;
    if (!code || !name || rate === undefined) {
      return res.status(400).json({ message: "Data tax tidak lengkap" });
    }

    const tax = await prisma.tax.create({
      data: { code, name, description, rate, isInclusive, isActive },
    });

    res.status(201).json(tax);
  } catch (err) {
    console.error("[createTax]", err);
    res.status(500).json({ message: "Gagal membuat tax", error: err.message });
  }
}

// Get all Tax
export async function getTaxes(req, res) {
  try {
    const taxes = await prisma.tax.findMany();
    res.json(taxes);
  } catch (err) {
    console.error("[getTaxes]", err);
    res.status(500).json({ message: "Gagal fetch tax", error: err.message });
  }
}

// Get Tax by ID
export async function getTaxById(req, res) {
  const { id } = req.params;
  try {
    const tax = await prisma.tax.findUnique({ where: { id } });
    if (!tax) return res.status(404).json({ message: "Tax tidak ditemukan" });
    res.json(tax);
  } catch (err) {
    console.error("[getTaxById]", err);
    res.status(500).json({ message: "Gagal fetch tax", error: err.message });
  }
}

// Update Tax
export async function updateTax(req, res) {
  const { id } = req.params;
  const { code, name, description, rate, isInclusive, isActive } = req.body;
  try {
    const tax = await prisma.tax.update({
      where: { id },
      data: { code, name, description, rate, isInclusive, isActive },
    });
    res.json(tax);
  } catch (err) {
    console.error("[updateTax]", err);
    res.status(500).json({ message: "Gagal update tax", error: err.message });
  }
}

// Delete Tax
export async function deleteTax(req, res) {
  const { id } = req.params;
  try {
    await prisma.tax.delete({ where: { id } });
    res.json({ message: "Tax berhasil dihapus" });
  } catch (err) {
    console.error("[deleteTax]", err);
    res.status(500).json({ message: "Gagal hapus tax", error: err.message });
  }
}

export default {
  createTax,
  getTaxes,
  getTaxById,
  updateTax,
  deleteTax,
};
