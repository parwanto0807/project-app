import { PrismaClient } from '../../../prisma/generated/prisma/index.js';
const prisma = new PrismaClient();

// Ambil dokumen Sales Order
export const getBySOId = async (req, res) => {
  try {
    const { id } = req.params; // salesOrderId

    const document = await prisma.salesOrderDocument.findUnique({
      where: { salesOrderId: id },
    });

    if (!document) {
      return res.status(404).json({ message: 'Dokumen tidak ditemukan' });
    }

    res.json(document);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil dokumen' });
  }
};

// Update status dokumen (flag: isOffer, isPo, dll)
export const updateFlags = async (req, res) => {
  try {
    const { id } = req.params; // salesOrderId
    const data = req.body; // bisa isi: { isOffer: true, isInvoice: true }

    const updated = await prisma.salesOrderDocument.update({
      where: { salesOrderId: id },
      data,
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal memperbarui dokumen' });
  }
};
