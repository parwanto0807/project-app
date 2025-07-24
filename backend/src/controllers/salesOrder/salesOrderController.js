import { PrismaClient } from '../../../prisma/generated/prisma/index.js';
const prisma = new PrismaClient();

// Ambil semua sales order
export const getAll = async (req, res) => {
  try {
    const salesOrders = await prisma.salesOrder.findMany({
      include: {
        customer: true,
        project: true,
        user: true,
        items: true,
        document: true,
      },
      orderBy: { soDate: 'desc' },
    });
    res.json(salesOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil data Sales Order' });
  }
};

// Ambil 1 sales order by ID
export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const salesOrder = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        project: true,
        user: true,
        items: true,
        document: true,
      },
    });
    if (!salesOrder) {
      return res.status(404).json({ message: 'Sales Order tidak ditemukan' });
    }
    res.json(salesOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil data Sales Order' });
  }
};

// Buat Sales Order baru
export const create = async (req, res) => {
  try {
    const { soNumber, soDate, customerId, projectId, userId, poNumber, type, items } = req.body;

    const salesOrder = await prisma.salesOrder.create({
      data: {
        soNumber,
        soDate: new Date(soDate),
        customerId,
        projectId,
        userId,
        poNumber,
        type,
        items: {
          create: items,
        },
        document: {
          create: {},
        },
      },
    });
    res.status(201).json(salesOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal membuat Sales Order' });
  }
};

// Update Sales Order (tanpa ubah items/document)
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const updated = await prisma.salesOrder.update({
      where: { id },
      data,
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal memperbarui Sales Order' });
  }
};

// Hapus Sales Order
export const remove = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.salesOrder.delete({ where: { id } });
    res.json({ message: 'Sales Order berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal menghapus Sales Order' });
  }
};
