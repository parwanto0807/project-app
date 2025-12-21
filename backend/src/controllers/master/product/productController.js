// import { PrismaClient } from "../../../../prisma/generated/prisma/index.js";
// const prisma = new PrismaClient();

import { prisma } from "../../../config/db.js";
import { ProductType } from "../../../../prisma/generated/prisma/index.js";
import { NotificationService } from "../../../utils/firebase/notificationService.js";


export const getAllProductsOpname = async (req, res) => {
  try {
    const {
      activeOnly = "true",
      page,
      limit,
      includePagination = "false",
      forOpname = "false", 
    } = req.query;

    // 1. Filter Dasar
    let filter = {
      ...(activeOnly === "true" ? { isActive: true } : {}),
    };

    // 2. Logic Stock Opname (Fallback jika inventoryAccountId belum konsisten)
    if (forOpname === "true") {
      filter = {
        ...filter,
        isActive: true,
        // Kita gunakan filter TYPE sebagai pertahanan utama
        type: {
          // Hanya ambil tipe yang fisiknya ada di gudang
          in: [
            "Material", 
            "Alat", 
            "FinishedGoods", 
            "SparePart", 
            "Consumable", 
            "Asset", 
            "Packaging", 
            "MRO", 
            "Scrap", 
            "Refurbished", 
            "Return"
          ], 
        },
        // Opsi tambahan: Jika isConsumable=true, hampir pasti itu barang stok
        OR: [
          { isConsumable: true },
          { inventoryAccountId: { not: null } }
        ]
      };
    }

    // --- Eksekusi Query ---
    if (includePagination === "true") {
      const totalCount = await prisma.product.count({ where: filter });
      
      const pageNumber = parseInt(page) || 1;
      const pageSize = parseInt(limit) || 10;
      const skip = (pageNumber - 1) * pageSize;
      const totalPages = Math.ceil(totalCount / pageSize);

      const products = await prisma.product.findMany({
        where: filter,
        include: {
          category: true,
        },
        // Penting: Nama Ascending memudahkan petugas mencocokkan form dengan rak
        orderBy: { name: "asc" }, 
        skip: skip,
        take: pageSize,
      });

      res.json({
        products,
        pagination: {
          totalCount,
          totalPages,
          currentPage: pageNumber,
          pageSize,
          hasNext: pageNumber < totalPages,
          hasPrev: pageNumber > 1,
        },
      });
    } else {
      const products = await prisma.product.findMany({
        where: filter,
        include: {
          category: true,
        },
        orderBy: { name: "asc" },
      });

      res.json(products);
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Gagal mengambil data produk" });
  }
};

// [GET] /products - Ambil semua produk (opsional: hanya aktif)
export const getAllProducts = async (req, res) => {
  try {
    const {
      activeOnly = "true",
      page,
      limit,
      includePagination = "false",
    } = req.query;
    const filter = activeOnly === "false" ? {} : { isActive: true };

    if (includePagination === "true") {
      // Mode dengan pagination
      const totalCount = await prisma.product.count({
        where: filter,
      });

      const pageNumber = parseInt(page) || 1;
      const pageSize = parseInt(limit) || 10;
      const skip = (pageNumber - 1) * pageSize;
      const totalPages = Math.ceil(totalCount / pageSize);

      const products = await prisma.product.findMany({
        where: filter,
        include: {
          category: true,
        },
        orderBy: { createdAt: "desc" },
        skip: skip,
        take: pageSize,
      });

      res.json({
        products,
        pagination: {
          totalCount,
          totalPages,
          currentPage: pageNumber,
          pageSize,
          hasNext: pageNumber < totalPages,
          hasPrev: pageNumber > 1,
        },
      });
    } else {
      // Mode tanpa pagination (backward compatible)
      const products = await prisma.product.findMany({
        where: filter,
        include: {
          category: true,
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(products);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil data produk" });
  }
};

export const getAllProductsByType = async (req, res) => {
  try {
    const { activeOnly = "true" } = req.query;
    const { type } = req.params;

    // safer parsing untuk activeOnly
    const onlyActive = String(activeOnly).toLowerCase() !== "false";

    // build where object secara deklaratif
    const where = {};
    if (onlyActive) where.isActive = true;

    if (type) {
      const t = type.toUpperCase();

      if (t === "SERVICE") {
        where.type = ProductType.Jasa; // hanya Jasa
      } else if (t === "PRODUCT") {
        where.type = { not: ProductType.Jasa }; // semua selain Jasa
      } else if (t === "ALL") {
        // Untuk type ALL, tidak ada filter type
      }
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      // pertimbangkan pagination: take, skip
    });

    res.json({
      success: true,
      message: "Data products berhasil diambil",
      data: products,
      meta: {
        type: type || "ALL",
        activeOnly: onlyActive,
        total: products.length,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data produk",
      error: error.message,
    });
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

    // console.log(`✅ Product created: ${created.code} - ${created.name}`);

    // ✅ KIRIM NOTIFIKASI SETELAH PRODUCT BERHASIL DIBUAT
    try {
      // Dapatkan semua user dengan role admin
      const adminUsers = await prisma.user.findMany({
        where: {
          role: { in: ["admin", "pic"] },
          active: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      // console.log(
      //   `📢 Sending notification to ${adminUsers.length} admin users`
      // );

      // Kirim notifikasi ke setiap admin
      for (const admin of adminUsers) {
        await NotificationService.sendToUser(admin.id, {
          title: "Produk Baru Ditambahkan 🆕",
          body: `Produk "${created.name}" (${created.code}) berhasil ditambahkan ke sistem`,
          data: {
            type: "product_created",
            id: created.id,
            action: `/products/${created.id}`,
            productCode: created.code,
            productName: created.name,
            createdBy: req.user?.email || "System",
            timestamp: new Date().toISOString(),
          },
        });

        console.log(`✅ Notification sent to admin: ${admin.email}`);
      }

      // Juga kirim notifikasi ke user yang membuat product (jika bukan admin)
      if (req.user && req.user.role !== "admin") {
        await NotificationService.sendToUser(req.user.id, {
          title: "Produk Berhasil Ditambahkan ✅",
          body: `Produk "${created.name}" telah berhasil ditambahkan ke inventory`,
          data: {
            type: "product_created",
            id: created.id,
            action: `/products/${created.id}`,
            productCode: created.code,
            productName: created.name,
          },
        });

        console.log(`✅ Notification sent to creator: ${req.user.email}`);
      }
    } catch (notificationError) {
      // Jangan gagalkan create product jika notifikasi gagal
      console.error("❌ Error sending notification:", notificationError);
    }

    res.status(201).json(created);
  } catch (error) {
    console.error("Error creating product:", error);

    // Prisma unique constraint error (duplicate)
    if (error.code === "P2002") {
      return res.status(400).json({
        message: "Kode produk atau barcode sudah digunakan",
      });
    }

    res.status(500).json({
      message: "Gagal menambahkan produk",
    });
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
