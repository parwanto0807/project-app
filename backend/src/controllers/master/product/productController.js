import { PrismaClient } from "../../../../prisma/generated/prisma/index.js";
const prisma = new PrismaClient();

// [GET] /products - Ambil semua produk (opsional: hanya aktif)
export const getAllProducts = async (req, res) => {
  try {
    const { activeOnly = "true" } = req.query;
    const filter = activeOnly === "false" ? {} : { isActive: true };

    const products = await prisma.product.findMany({
      where: filter,
      include: {
        category: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil data produk" });
  }
};

export const getAllProductsByType = async (req, res) => {
  try {
    const { activeOnly = "true" } = req.query;
    const { type } = req.params; // ✅ ambil dari params

    const filter = activeOnly === "false" ? {} : { isActive: true };

    if (type) {
      filter.type = type;
    }

    const products = await prisma.product.findMany({
      where: filter,
      include: {
        category: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil data produk" });
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
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil data produk" });
  }
};

// [POST] /products - Tambah produk baru
export const createProduct = async (req, res) => {
  try {
    // Semua field selain image diakses via req.body (otomatis String)
    const {
      code,
      name,
      description,
      type,
      purchaseUnit,
      storageUnit,
      usageUnit,
      conversionToStorage,
      conversionToUsage,
      barcode,
      isConsumable,
      isActive,
      categoryId,
    } = req.body;

    // Path gambar dari Multer (jika ada file di-upload)
    let image = null;
    if (req.file) {
      image = `/images/${req.file.filename}`; // path statis dari root public
    }

    // Pastikan konversi tipe data sesuai schema Prisma
    const productData = {
      code,
      name,
      description,
      type,
      purchaseUnit,
      storageUnit,
      usageUnit,
      conversionToStorage: conversionToStorage
        ? Number(conversionToStorage)
        : undefined,
      conversionToUsage: conversionToUsage
        ? Number(conversionToUsage)
        : undefined,
      barcode,
      isConsumable: isConsumable === "true" || isConsumable === true,
      isActive: isActive === "true" || isActive === true,
      image,
      categoryId: categoryId || null,
    };

    // Buat produk baru di database
    const created = await prisma.product.create({
      data: productData,
    });

    res.status(201).json(created);
  } catch (error) {
    console.error(error);
    // Prisma unique constraint error (duplicate)
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ message: "Kode produk atau barcode sudah digunakan" });
    }
    res.status(500).json({ message: "Gagal menambahkan produk" });
  }
};

// [PUT] /products/:id - Update produk
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      code,
      name,
      description,
      type,
      purchaseUnit,
      storageUnit,
      usageUnit,
      conversionToStorage,
      conversionToUsage,
      isConsumable,
      isActive,
      barcode,
      categoryId,
    } = req.body;

    // Cari produk lama
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    // Tentukan imagePath
    let imagePath = null;

    // Jika ada upload file baru
    if (req.file) {
      imagePath = `/images/${req.file.filename}`;
    }
    // Jika dari frontend tetap kirim image lama
    else if (req.body.image && typeof req.body.image === "string") {
      imagePath = req.body.image;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        code,
        name,
        description,
        type,
        purchaseUnit,
        storageUnit,
        usageUnit,
        conversionToStorage: Number(conversionToStorage),
        conversionToUsage: Number(conversionToUsage),
        isConsumable: isConsumable === "true" || isConsumable === true,
        isActive: isActive === "true" || isActive === true,
        barcode,
        categoryId,
        image: imagePath,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("[updateProduct ERROR]", error);
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ message: "Kode produk atau barcode sudah digunakan" });
    }
    res.status(500).json({ message: "Gagal memperbarui produk" });
  }
};

// [DELETE] /products/:id - Soft delete produk
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    const deleted = await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: "Produk dinonaktifkan", product: deleted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal menghapus produk" });
  }
};

export async function getProductCount(req, res) {
  try {
    const { activeOnly = "true" } = req.query;
    const filter = activeOnly === "false" ? {} : { isActive: true };

    const count = await prisma.product.count({
      where: filter,
    });
    res.json({ count });
  } catch (err) {
    console.error("[getProductCount] error:", err);
    res.status(500).json({ message: "Gagal mengambil jumlah product" });
  }
}
