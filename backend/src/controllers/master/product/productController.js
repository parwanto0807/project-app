import { PrismaClient } from '../../../../prisma/generated/prisma/index.js';
const prisma = new PrismaClient();

// [GET] /products - Ambil semua produk (opsional: hanya aktif)
export const getAllProducts = async (req, res) => {
  try {
    const { activeOnly = 'true' } = req.query;
    const filter = activeOnly === 'false' ? {} : { isActive: true };

    const products = await prisma.product.findMany({
      where: filter,
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil data produk' });
  }
};

// [GET] /products/:id - Ambil satu produk berdasarkan ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil data produk' });
  }
};

// [POST] /products - Tambah produk baru
export const createProduct = async (req, res) => {
  try {
    const data = req.body;

    const created = await prisma.product.create({
      data,
    });

    res.status(201).json(created);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Kode produk atau barcode sudah digunakan' });
    }
    res.status(500).json({ message: 'Gagal menambahkan produk' });
  }
};

// [PUT] /products/:id - Update produk
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    const updated = await prisma.product.update({
      where: { id },
      data,
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Kode produk atau barcode sudah digunakan' });
    }
    res.status(500).json({ message: 'Gagal memperbarui produk' });
  }
};

// [DELETE] /products/:id - Soft delete produk
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    const deleted = await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: 'Produk dinonaktifkan', product: deleted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal menghapus produk' });
  }
};
