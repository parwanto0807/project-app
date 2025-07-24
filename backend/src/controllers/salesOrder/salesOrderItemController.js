import { PrismaClient } from '../../../prisma/generated/prisma/index.js';
const prisma = new PrismaClient();

// Tambah item ke SO
export const addItem = async (req, res) => {
  try {
    const { id } = req.params; // salesOrderId
    const { productId, description, qty, unitPrice } = req.body;

    const item = await prisma.salesOrderItem.create({
      data: {
        salesOrderId: id,
        productId,
        description,
        qty,
        unitPrice,
      },
    });
    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal menambahkan item' });
  }
};

// Hapus item dari SO
export const removeItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    await prisma.salesOrderItem.delete({
      where: { id: itemId },
    });

    res.json({ message: 'Item berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal menghapus item' });
  }
};

// Update item
export const updateItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { productId, description, qty, unitPrice } = req.body;

    const updated = await prisma.salesOrderItem.update({
      where: { id: itemId },
      data: {
        productId,
        description,
        qty,
        unitPrice,
      },
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal memperbarui item' });
  }
};
