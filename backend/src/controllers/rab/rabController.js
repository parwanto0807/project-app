// import { PrismaClient } from "../../../prisma/generated/prisma/index.js";
// const prisma = new PrismaClient();


import { prisma } from "../../config/db.js";
import { parseRabData } from "../../validations/rabValidation.js";

export const getAllRabs = async (req, res) => {
  try {
    const { projectId, status, page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const where = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const [rabs, total] = await Promise.all([
      prisma.rAB.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              customer: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              rabDetails: true,
            },
          },
          rabDetails: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: parseInt(limit),
      }),
      prisma.rAB.count({ where }),
    ]);

    res.json({
      success: true,
      data: rabs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get all RABs error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Get RAB by ID with details
 */
export const getRabById = async (req, res) => {
  try {
    const { id } = req.params;

    const rab = await prisma.rAB.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            customer: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        rabDetails: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
          orderBy: {
            costType: "asc",
          },
        },
      },
    });

    if (!rab) {
      return res.status(404).json({
        success: false,
        message: "RAB not found",
      });
    }

    res.json({
      success: true,
      data: rab,
    });
  } catch (error) {
    console.error("Get RAB by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Create new RAB
 */
// Di backend controller (rabController.js)
export const createRab = async (req, res) => {
  try {
    console.log("Raw request body:", req.body);
    console.log("Received createdById:", req.body.createdById);

    const validation = parseRabData(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    const { projectId, name, description, rabDetails, createdById } =
      validation.data;

    // DEBUG: Log parsed data
    console.log("Parsed createdById from validation:", createdById);

    // ⚠️ HAPUS SEMUA HARDCODED 'temp-user-id' DI SINI!
    // Gunakan createdById yang diterima dari frontend
    const finalCreatedById = createdById; // Jangan diubah!

    console.log("Final createdById to use:", finalCreatedById);

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { id: finalCreatedById },
    });

    if (!user) {
      console.log(`User with ID ${finalCreatedById} not found`);
      return res.status(404).json({
        success: false,
        message: "User not found in database",
        error: `User with ID ${finalCreatedById} does not exist`,
      });
    }

    console.log("User found:", user.id, user.name);

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Calculate total from details
    const total = rabDetails.reduce((sum, detail) => {
      return sum + detail.qty * detail.price;
    }, 0);

    console.log("Creating RAB with createdById:", finalCreatedById);

    const rab = await prisma.rAB.create({
      data: {
        projectId,
        name,
        description,
        total,
        createdById: finalCreatedById, // Gunakan yang dari frontend
        rabDetails: {
          create: rabDetails.map((detail) => ({
            productId: detail.productId || null,
            description: detail.description,
            categoryRab: detail.categoryRab,
            qty: detail.qty,
            unit: detail.unit,
            price: detail.price,
            subtotal: detail.qty * detail.price,
            costType: detail.costType,
            notes: detail.notes,
          })),
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        rabDetails: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    console.log("RAB created successfully:", rab.id);

    res.status(201).json({
      success: true,
      message: "RAB created successfully",
      data: rab,
    });
  } catch (error) {
    console.error("Create RAB error:", error);

    if (error.code === "P2003") {
      return res.status(400).json({
        success: false,
        message: "Foreign key constraint violated",
        error: `Check if user with ID ${req.body.createdById} exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Update RAB
 */
export const updateRab = async (req, res) => {
  try {
    const { id } = req.params;
    // Untuk update, gunakan isUpdate = true
    const validation = parseRabData(req.body, true);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }
    // Check if RAB exists
    const existingRab = await prisma.rAB.findUnique({
      where: { id },
      include: { rabDetails: true },
    });

    if (!existingRab) {
      return res.status(404).json({
        success: false,
        message: "RAB not found",
      });
    }

    const { projectId, name, description, rabDetails } = validation.data;

    // Calculate total from details
    const total = rabDetails.reduce((sum, detail) => {
      return sum + parseFloat(detail.qty) * parseFloat(detail.price);
    }, 0);

    // Use transaction to update RAB and details
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing details
      await tx.rABDetail.deleteMany({
        where: { rabId: id },
      });

      // Update RAB and create new details
      const updatedRab = await tx.rAB.update({
        where: { id },
        data: {
          projectId,
          name,
          description,
          total,
          rabDetails: {
            create: rabDetails.map((detail) => ({
              productId: detail.productId || null,
              description: detail.description,
              categoryRab: detail.categoryRab,
              qty: detail.qty,
              unit: detail.unit,
              price: detail.price,
              subtotal: parseFloat(detail.qty) * parseFloat(detail.price),
              costType: detail.costType,
              notes: detail.notes,
            })),
          },
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          rabDetails: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return updatedRab;
    });

    res.json({
      success: true,
      message: "RAB updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Update RAB error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Update RAB status
 */
export const updateRabStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["DRAFT", "APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status is required: DRAFT, APPROVED, or REJECTED",
      });
    }

    const rab = await prisma.rAB.findUnique({
      where: { id },
    });

    if (!rab) {
      return res.status(404).json({
        success: false,
        message: "RAB not found",
      });
    }

    const updatedRab = await prisma.rAB.update({
      where: { id },
      data: { status },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: `RAB status updated to ${status}`,
      data: updatedRab,
    });
  } catch (error) {
    console.error("Update RAB status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Delete RAB
 */
export const deleteRab = async (req, res) => {
  try {
    const { id } = req.params;

    const rab = await prisma.rAB.findUnique({
      where: { id },
    });

    if (!rab) {
      return res.status(404).json({
        success: false,
        message: "RAB not found",
      });
    }

    // Use transaction to delete RAB and its details
    await prisma.$transaction(async (tx) => {
      // Delete details first
      await tx.rABDetail.deleteMany({
        where: { rabId: id },
      });

      // Delete RAB
      await tx.rAB.delete({
        where: { id },
      });
    });

    res.json({
      success: true,
      message: "RAB deleted successfully",
    });
  } catch (error) {
    console.error("Delete RAB error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Get RABs by Project ID
 */
export const getRabsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.query;

    const where = { projectId };
    if (status) where.status = status;

    const rabs = await prisma.rAB.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        rabDetails: {
          select: {
            id: true,
            costType: true,
            subtotal: true,
          },
        },
        _count: {
          select: {
            rabDetails: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      data: rabs,
    });
  } catch (error) {
    console.error("Get RABs by project error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
