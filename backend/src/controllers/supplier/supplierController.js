import { prisma } from "../../config/db.js";

// Generate Supplier Code: SUP-<UnixTimestamp>
export const generateSupplierCode = async (req, res) => {
  try {
    // Cari code terakhir dari database
    const lastSupplier = await prisma.supplier.findFirst({
      orderBy: { createdAt: "desc" },
      select: { code: true },
    });

    let nextCode = "SUP0001"; // Default

    if (lastSupplier?.code) {
      // Extract number from code (SUP0001, SUP-001, dll)
      const match = lastSupplier.code.match(/\d+/g);
      if (match && match.length > 0) {
        const lastNumber = parseInt(match[match.length - 1]);
        nextCode = `SUP${(lastNumber + 1).toString().padStart(4, "0")}`;
      }
    }

    // Atau jika mau format timestamp yang lebih aman:
    // const timestamp = Date.now();
    // const random = Math.floor(Math.random() * 1000);
    // const nextCode = `SUP-${timestamp}-${random.toString().padStart(3, '0')}`;

    res.json({
      success: true,
      code: nextCode,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating supplier code:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate code",
      message: error.message,
    });
  }
};

// ==========================================
// CREATE SUPPLIER
// ==========================================
export const createSupplier = async (req, res) => {
  try {
    const data = req.body;

    // ⭐ REMOVE/HANDLE EXTRA FIELDS yang tidak ada di model
    const {
      currency, // ⭐ Hapus currency karena tidak ada di model
      ...validData
    } = data;

    // Generate code otomatis di backend
    const lastSupplier = await prisma.supplier.findFirst({
      orderBy: { createdAt: "desc" },
      select: { code: true },
    });

    let nextCode = "SUP0001";
    if (lastSupplier?.code) {
      const match = lastSupplier.code.match(/SUP(\d+)/);
      if (match) {
        const lastNumber = parseInt(match[1]);
        nextCode = `SUP${(lastNumber + 1).toString().padStart(4, "0")}`;
      }
    }

    // ⭐ HAPUS code dari frontend, gunakan yang di-generate backend
    const supplierData = {
      ...validData,
      code: nextCode,
      status: "ACTIVE",
    };

    // Cek duplikasi NPWP (jika ada)
    if (supplierData.npwp) {
      const existingNpwp = await prisma.supplier.findUnique({
        where: { npwp: supplierData.npwp },
      });
      if (existingNpwp) {
        return res.status(400).json({
          success: false,
          message: "NPWP sudah terdaftar",
        });
      }
    }

    const newSupplier = await prisma.supplier.create({
      data: {
        ...supplierData,
        contacts: supplierData.contacts
          ? { create: supplierData.contacts }
          : undefined,
        bankAccounts: supplierData.bankAccounts
          ? { create: supplierData.bankAccounts }
          : undefined,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Supplier berhasil dibuat",
      data: newSupplier,
    });
  } catch (error) {
    console.error("Create supplier error:", error);

    // Handle specific Prisma errors
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0];
      return res.status(400).json({
        success: false,
        message:
          field === "code"
            ? "Kode supplier sudah digunakan"
            : field === "email"
            ? "Email sudah terdaftar"
            : "Data duplicate ditemukan",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET ALL SUPPLIERS (With Pagination & Filter)
// ==========================================
export const getSuppliers = async (req, res) => {
  try {
    const {
      activeOnly = "true",
      page = "1",
      limit = "10",
      includePagination = "false",
      search = "",
    } = req.query;

    // Convert to number safely
    const pageInt = Math.max(1, parseInt(page));
    const limitInt = Math.max(1, parseInt(limit));
    const skip = (pageInt - 1) * limitInt;

    // Construct where condition
    const where = {};

    if (activeOnly === "true") {
      where.status = "ACTIVE";
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    const baseQuery = {
      where,
      include: {
        termOfPayment: true,
        supplierCategory: true,
        _count: {
          select: { contacts: true, bankAccounts: true },
        },
      },
      orderBy: { createdAt: "desc" },
    };

    // Pagination Mode
    if (includePagination === "true") {
      const [suppliers, totalRecords] = await Promise.all([
        prisma.supplier.findMany({
          ...baseQuery,
          skip,
          take: limitInt,
        }),
        prisma.supplier.count({ where }),
      ]);

      const totalPages = Math.max(1, Math.ceil(totalRecords / limitInt));

      return res.status(200).json({
        success: true,
        data: suppliers,
        pagination: {
          page: pageInt,
          limit: limitInt,
          totalRecords,
          totalPages,
        },
      });
    }

    // No Pagination Mode (for dropdowns)
    const suppliers = await prisma.supplier.findMany(baseQuery);

    return res.status(200).json({
      success: true,
      data: suppliers,
    });
  } catch (error) {
    console.error("Error getSuppliers:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// ==========================================
// GET SUPPLIER BY ID (Detail)
// ==========================================
export const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        termOfPayment: true,
        supplierCategory: true,
        contacts: true, // Ambil detail kontak
        bankAccounts: true, // Ambil detail bank
      },
    });

    if (!supplier) {
      return res
        .status(404)
        .json({ success: false, message: "Supplier tidak ditemukan" });
    }

    return res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// UPDATE SUPPLIER
// ==========================================
export const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Hapus field yang tidak boleh diupdate langsung di root level (seperti contacts array)
    // Update contacts biasanya lewat endpoint terpisah atau logic khusus
    const { contacts, bankAccounts, ...updateData } = data;

    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: "Supplier berhasil diperbarui",
      data: updatedSupplier,
    });
  } catch (error) {
    // Handle error prisma record not found
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Supplier tidak ditemukan" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// DELETE SUPPLIER (Soft Delete / Status Change)
// ==========================================
export const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    // Kita ubah status jadi INACTIVE (atau BLACKLISTED) alih-alih delete permanen
    // Jika Anda menambahkan kolom `deletedAt` di schema, gunakan itu.
    const deletedSupplier = await prisma.supplier.update({
      where: { id },
      data: {
        status: "INACTIVE",
        // deletedAt: new Date() // Uncomment jika sudah menambahkan field deletedAt
      },
    });

    return res.status(200).json({
      success: true,
      message: "Supplier dinonaktifkan (Soft Delete)",
      data: deletedSupplier,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * CREATE category
 */
export const createSupplierCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const exists = await prisma.supplierCategory.findUnique({
      where: { name },
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Category name already exists",
      });
    }

    const newCategory = await prisma.supplierCategory.create({
      data: {
        name,
        description: description || null,
      },
    });

    res.status(201).json({
      success: true,
      message: "Category created",
      data: newCategory,
    });
  } catch (error) {
    console.error("❌ Create category error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create category",
      error: error.message,
    });
  }
};

/**
 * GET all categories
 */
export const getSupplierCategories = async (req, res) => {
  try {
    const categories = await prisma.supplierCategory.findMany({
      orderBy: { name: "asc" },
    });

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("❌ Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
};

/**
 * GET category by ID
 */
export const getSupplierCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.supplierCategory.findUnique({
      where: { id },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("❌ Get category by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category",
      error: error.message,
    });
  }
};

/**
 * UPDATE category by ID
 */
export const updateSupplierCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const updated = await prisma.supplierCategory.update({
      where: { id },
      data: {
        name,
        description,
      },
    });

    res.status(200).json({
      success: true,
      message: "Category updated",
      data: updated,
    });
  } catch (error) {
    console.error("❌ Update category error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update category",
      error: error.message,
    });
  }
};

/**
 * DELETE category by ID
 */
export const deleteSupplierCategory = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.supplierCategory.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Category deleted",
    });
  } catch (error) {
    console.error("❌ Delete category error:", error);

    // Jika kategori ada relasi supplier, Prisma akan error
    if (error.code === "P2003") {
      return res.status(409).json({
        success: false,
        message: "Cannot delete category because it is used by suppliers",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete category",
      error: error.message,
    });
  }
};

// GET ALL TERM OF PAYMENTS
export const getAllTermOfPayments = async (req, res) => {
  try {
    const termOfPayments = await prisma.termOfPayment.findMany({
      orderBy: { name: "asc" },
    });

    res.json({
      success: true,
      data: termOfPayments,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch term of payments",
    });
  }
};

// GET SINGLE TERM OF PAYMENT
export const getTermOfPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const termOfPayment = await prisma.termOfPayment.findUnique({
      where: { id },
    });

    if (!termOfPayment) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    res.json({
      success: true,
      data: termOfPayment,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch term of payment",
    });
  }
};

// CREATE TERM OF PAYMENT
export const createTermOfPayment = async (req, res) => {
  try {
    const { name, days = 0, description } = req.body;

    // Simple validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    const newTermOfPayment = await prisma.termOfPayment.create({
      data: { name, days, description },
    });

    res.status(201).json({
      success: true,
      message: "Created successfully",
      data: newTermOfPayment,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create term of payment",
    });
  }
};

// UPDATE TERM OF PAYMENT
export const updateTermOfPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const updatedTermOfPayment = await prisma.termOfPayment.update({
      where: { id },
      data,
    });

    res.json({
      success: true,
      message: "Updated successfully",
      data: updatedTermOfPayment,
    });
  } catch (error) {
    console.error("Error:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update",
    });
  }
};

// DELETE TERM OF PAYMENT
export const deleteTermOfPayment = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.termOfPayment.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    console.error("Error:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete",
    });
  }
};
