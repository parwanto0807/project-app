import { PrismaClient } from '../../../../prisma/generated/prisma/index.js';
const prisma = new PrismaClient();

// [GET] /categories - Ambil semua kategori
export const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.productCategory.findMany({
      include: {
        products: true, // jika ingin lihat juga daftar produk di setiap kategori
      },
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil data kategori' });
  }
};

// [GET] /categories/:id - Ambil satu kategori berdasarkan ID
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.productCategory.findUnique({
      where: { id },
      include: { products: true },
    });

    if (!category) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    }

    res.json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil kategori' });
  }
};

// [POST] /categories - Tambah kategori baru
export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    const created = await prisma.productCategory.create({
      data: { name },
    });

    res.status(201).json(created);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Nama kategori sudah digunakan' });
    }
    res.status(500).json({ message: 'Gagal menambahkan kategori' });
  }
};

// [PUT] /categories/:id - Update kategori
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const existing = await prisma.productCategory.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    }

    const updated = await prisma.productCategory.update({
      where: { id },
      data: { name },
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Nama kategori sudah digunakan' });
    }
    res.status(500).json({ message: 'Gagal memperbarui kategori' });
  }
};

// [DELETE] /categories/:id - Hapus kategori
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Pastikan kategori tidak dipakai oleh produk manapun
    const relatedProducts = await prisma.product.findMany({
      where: { categoryId: id },
    });

    if (relatedProducts.length > 0) {
      return res.status(400).json({ message: 'Kategori tidak bisa dihapus karena masih digunakan oleh produk' });
    }

    await prisma.productCategory.delete({ where: { id } });
    res.json({ message: 'Kategori berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal menghapus kategori' });
  }
};
