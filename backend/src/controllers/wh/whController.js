import { prisma } from "../../config/db.js";
import { warehouseSchema } from "../../validations/warehouseValidator.js";

/**
 * Helper response
 */
const successResponse = (res, data, message, status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data
  });
};

const errorResponse = (res, status, error, message, details) => {
  return res.status(status).json({
    success: false,
    error,
    message,
    details
  });
};

/**
 * CREATE Warehouse
 * Jika isMain = true → reset gudang utama lain
 */
export const createWarehouse = async (req, res) => {
  try {
    const validated = warehouseSchema.parse(req.body);

    if (validated.isMain === true) {
      await prisma.warehouse.updateMany({
        where: { isMain: true },
        data: { isMain: false }
      });
    }

    const warehouse = await prisma.warehouse.create({
      data: validated
    });

    return successResponse(
      res,
      warehouse,
      "Warehouse berhasil dibuat",
      201
    );
  } catch (error) {
    return errorResponse(
      res,
      400,
      "WAREHOUSE_CREATE_FAILED",
      error.message,
      error.errors
    );
  }
};

/**
 * GET Warehouses (Pagination + Search)
 * ?page=1&limit=10&search=jkt
 */
export const getWarehouses = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search || "";

    const where = {
      OR: [
        { code: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } }
      ]
    };

    const [data, total] = await Promise.all([
      prisma.warehouse.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { inventoryAccount: true }
      }),
      prisma.warehouse.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return successResponse(res, {
      data,
      pagination: {
        totalCount: total,
        totalPages,
        currentPage: page,
        pageSize: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    return errorResponse(
      res,
      500,
      "WAREHOUSE_FETCH_FAILED",
      "Gagal mengambil data warehouse",
      error.message
    );
  }
};

/**
 * GET Warehouse by ID
 */
export const getWarehouseById = async (req, res) => {
  try {
    const { id } = req.params;

    const warehouse = await prisma.warehouse.findFirst({
      where: {
        id
      },
      include: { inventoryAccount: true }
    });

    if (!warehouse) {
      return errorResponse(
        res,
        404,
        "WAREHOUSE_NOT_FOUND",
        "Warehouse tidak ditemukan atau sudah nonaktif"
      );
    }

    return successResponse(res, warehouse);
  } catch (error) {
    return errorResponse(
      res,
      500,
      "WAREHOUSE_FETCH_FAILED",
      error.message
    );
  }
};

/**
 * UPDATE Warehouse
 */
export const updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const validated = warehouseSchema.partial().parse(req.body);

    if (validated.isMain === true) {
      await prisma.warehouse.updateMany({
        where: { isMain: true },
        data: { isMain: false }
      });
    }

    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: validated,
      include: { inventoryAccount: true }
    });

    return successResponse(
      res,
      warehouse,
      "Warehouse berhasil diperbarui"
    );
  } catch (error) {
    return errorResponse(
      res,
      400,
      "WAREHOUSE_UPDATE_FAILED",
      error.message,
      error.errors
    );
  }
};

/**
 * SOFT DELETE Warehouse (isActive = false)
 */
export const deleteWarehouse = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.warehouse.update({
      where: { id },
      data: { isActive: false }
    });

    return successResponse(
      res,
      null,
      "Warehouse berhasil dinonaktifkan"
    );
  } catch (error) {
    return errorResponse(
      res,
      400,
      "WAREHOUSE_DELETE_FAILED",
      error.message
    );
  }
};
