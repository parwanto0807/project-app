// import { PrismaClient } from "../../../prisma/generated/prisma/index.js";
// const prisma = new PrismaClient();

import { prisma } from "../../config/db.js";
import {
  createPurchaseRequestSchema,
  updatePurchaseRequestSchema,
  updateStatusSchema,
  idParamSchema,
  queryParamsSchema,
} from "../../validations/prValidations.js";
import { generatePRNumber } from "../../utils/prGenerateNumber.js";

export class PurchaseRequestController {
  /**
   * Get all Purchase Requests dengan pagination dan filter
   */
  async getAllPurchaseRequests(req, res) {
    try {
      const query = queryParamsSchema.parse(req.query);

      const { page, limit, status, projectId, startDate, endDate, search } =
        query;
      const skip = (page - 1) * limit;

      const where = {};

      if (status) where.status = status;
      if (projectId) where.projectId = projectId;
      if (search) {
        where.OR = [
          { nomorPr: { contains: search, mode: "insensitive" } },
          { keterangan: { contains: search, mode: "insensitive" } },
        ];
      }

      if (startDate || endDate) {
        where.tanggalPr = {};
        if (startDate) where.tanggalPr.gte = new Date(startDate);
        if (endDate) where.tanggalPr.lte = new Date(endDate);
      }

      const [purchaseRequests, totalCount] = await Promise.all([
        prisma.purchaseRequest.findMany({
          where,
          include: {
            project: {
              select: { id: true, name: true },
            },
            karyawan: {
              select: { id: true, namaLengkap: true, jabatan: true },
            },
            spk: {
              select: {
                id: true,
                spkNumber: true,
                salesOrder: {
                  select: { soNumber: true },
                },
              },
            },
            details: {
              include: {
                product: {
                  select: { id: true, name: true, code: true },
                },
                projectBudget: {
                  select: { id: true, description: true, amount: true },
                },
              },
            },
            uangMuka: {
              include: {
                pertanggungjawaban: {
                  include: {
                    details: {
                      include: {
                        product: {
                          select: { id: true, name: true, code: true },
                        },
                        fotoBukti: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.purchaseRequest.count({ where }),
      ]);

      res.json({
        success: true,
        data: purchaseRequests,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
        },
      });
    } catch (error) {
      console.error("Get all PR error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async getPurchaseRequestBySpkId(req, res) {
    try {
      const { spkId } = req.body; // atau req.query kalau mau pakai query params

      const purchaseRequests = await prisma.purchaseRequest.findMany({
        where: { spkId },
        include: {
          project: true,
          karyawan: true,
          spk: true,
          details: {
            include: {
              product: true,
              projectBudget: true,
              rincianPertanggungjawaban: true,
            },
          },
          uangMuka: true,
        },
      });

      res.json({
        success: true,
        data: purchaseRequests,
      });
    } catch (error) {
      console.error("Get PR by SpkId error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  /**
   * Get Purchase Request by ID
   */
  async getPurchaseRequestById(req, res) {
    try {
      const validationResult = idParamSchema.safeParse(req.params);

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID format",
          error: validationResult.error.errors,
        });
      }
      const { id } = validationResult.data;
      const purchaseRequest = await prisma.purchaseRequest.findUnique({
        where: { id },
        include: {
          project: true,
          karyawan: true,
          spk: true,
          details: {
            include: {
              product: true,
              projectBudget: true,
              rincianPertanggungjawaban: {
                include: {
                  product: true,
                  fotoBukti: true, // jika ingin foto bukti muncul juga
                },
              },
            },
          },
          uangMuka: {
            include: {
              pertanggungjawaban: {
                include: {
                  details: {
                    include: {
                      product: true,
                      fotoBukti: true, // agar foto bukti rincian muncul juga
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!purchaseRequest) {
        return res.status(404).json({
          success: false,
          message: "Purchase Request not found",
        });
      }
      res.json({
        success: true,
        data: purchaseRequest,
      });
    } catch (error) {
      console.error("Get PR by ID error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  /**
   * Create new Purchase Request
   */
  async createPurchaseRequest(req, res) {
    try {
      const validatedData = createPurchaseRequestSchema.parse(req.body);

      const nomorPr = await generatePRNumber();

      // Hitung total harga untuk setiap detail
      const detailsWithTotal = validatedData.details.map((detail) => ({
        productId: detail.productId,
        projectBudgetId: detail.projectBudgetId,
        jumlah: parseFloat(detail.jumlah),
        satuan: detail.satuan,
        sourceProduct: detail.sourceProduct,
        estimasiHargaSatuan: parseFloat(detail.estimasiHargaSatuan),
        estimasiTotalHarga:
          parseFloat(detail.jumlah) * parseFloat(detail.estimasiHargaSatuan),
        catatanItem: detail.catatanItem,
      }));

      const purchaseRequest = await prisma.purchaseRequest.create({
        data: {
          ...validatedData,
          nomorPr,
          details: {
            create: detailsWithTotal,
          },
        },
        include: {
          project: {
            select: { id: true, name: true },
          },
          karyawan: {
            select: { id: true, namaLengkap: true, jabatan: true },
          },
          spk: {
            select: { id: true, spkNumber: true, notes: true },
          },
          details: {
            include: {
              product: {
                select: { id: true, name: true, description: true },
              },
              projectBudget: {
                select: { id: true, description: true, amount: true },
              },
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: "Purchase Request created successfully",
        data: purchaseRequest,
      });
    } catch (error) {
      console.error("Create PR error:", error);

      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          error: error.errors,
        });
      }

      if (error.code === "P2002") {
        return res.status(400).json({
          success: false,
          message: "Purchase Request number already exists",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to create Purchase Request",
        error: error.message,
      });
    }
  }

  /**
   * Update Purchase Request
   */
  async updatePurchaseRequest(req, res) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const validatedData = updatePurchaseRequestSchema.parse(req.body);

      // Cari PR existing
      const existingPR = await prisma.purchaseRequest.findUnique({
        where: { id },
        include: { details: true },
      });

      if (!existingPR) {
        return res.status(404).json({
          success: false,
          message: "Purchase Request not found",
        });
      }

      // Validasi status untuk update
      if (!["DRAFT", "REVISION_NEEDED"].includes(existingPR.status)) {
        return res.status(400).json({
          success: false,
          message:
            "Only DRAFT or REVISION_NEEDED Purchase Request can be updated",
        });
      }
      const updateData = { ...validatedData };
      delete updateData.details;

      if (existingPR.status === "REVISION_NEEDED") {
        updateData.status = "DRAFT";
      }

      const transaction = await prisma.$transaction(async (tx) => {
        // Update header PR
        const updatedPR = await tx.purchaseRequest.update({
          where: { id },
          data: updateData,
          include: {
            project: true,
            karyawan: true,
            spk: true,
            details: {
              include: {
                product: true,
                projectBudget: true,
              },
            },
          },
        });

        // Update details jika ada
        if (validatedData.details) {
          // Hapus existing details
          await tx.purchaseRequestDetail.deleteMany({
            where: { purchaseRequestId: id },
          });

          // Buat details baru
          const detailsWithTotal = validatedData.details.map((detail) => ({
            purchaseRequestId: id,
            productId: detail.productId,
            projectBudgetId: detail.projectBudgetId,
            jumlah: parseFloat(detail.jumlah),
            sourceProduct: detail.sourceProduct,
            satuan: detail.satuan,
            estimasiHargaSatuan: parseFloat(detail.estimasiHargaSatuan),
            estimasiTotalHarga:
              parseFloat(detail.jumlah) *
              parseFloat(detail.estimasiHargaSatuan),
            catatanItem: detail.catatanItem,
          }));

          await tx.purchaseRequestDetail.createMany({
            data: detailsWithTotal,
          });

          // Get updated PR dengan details baru
          return await tx.purchaseRequest.findUnique({
            where: { id },
            include: {
              project: true,
              karyawan: true,
              spk: true,
              details: {
                include: {
                  product: true,
                  projectBudget: true,
                },
              },
            },
          });
        }

        return updatedPR;
      });

      res.json({
        success: true,
        message: "Purchase Request updated successfully",
        data: transaction,
      });
    } catch (error) {
      console.error("Update PR error:", error);

      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          error: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to update Purchase Request",
        error: error.message,
      });
    }
  }

  /**
   * Update Purchase Request Status
   */
  async updatePurchaseRequestStatus(req, res) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const { status, catatan } = updateStatusSchema.parse(req.body);

      const existingPR = await prisma.purchaseRequest.findUnique({
        where: { id },
      });

      if (!existingPR) {
        return res.status(404).json({
          success: false,
          message: "Purchase Request not found",
        });
      }

      // Validasi transisi status
      const validTransitions = {
        DRAFT: ["SUBMITTED"],
        SUBMITTED: ["APPROVED", "REJECTED", "REVISION_NEEDED"], // REMOVE REVISION_NEEDED sementara
        APPROVED: ["COMPLETED"],
        REJECTED: ["SUBMITTED"],
        REVISION_NEEDED: ["SUBMITTED", "DRAFT"],
        COMPLETED: [],
      };

      if (!validTransitions[existingPR.status].includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition from ${existingPR.status} to ${status}`,
        });
      }

      const updatedPR = await prisma.purchaseRequest.update({
        where: { id },
        data: {
          status,
          ...(catatan && { keterangan: catatan }),
        },
        include: {
          project: {
            select: { id: true, name: true },
          },
          karyawan: {
            select: { id: true, namaLengkap: true, jabatan: true },
          },
          spk: {
            select: { id: true, spkNumber: true, notes: true },
          },
          details: {
            include: {
              product: {
                select: { id: true, name: true, description: true },
              },
              projectBudget: {
                select: { id: true, description: true, amount: true },
              },
            },
          },
        },
      });

      res.json({
        success: true,
        message: `Purchase Request status updated to ${status}`,
        data: updatedPR,
      });
    } catch (error) {
      console.error("Update PR status error:", error);

      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          error: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to update Purchase Request status",
        error: error.message,
      });
    }
  }

  /**
   * Delete Purchase Request
   */
  async deletePurchaseRequest(req, res) {
    try {
      const { id } = idParamSchema.parse(req.params);

      const existingPR = await prisma.purchaseRequest.findUnique({
        where: { id },
      });

      if (!existingPR) {
        return res.status(404).json({
          success: false,
          message: "Purchase Request not found",
        });
      }

      // Hanya PR dengan status DRAFT yang bisa dihapus
      if (existingPR.status !== "DRAFT") {
        return res.status(400).json({
          success: false,
          message: "Only DRAFT Purchase Request can be deleted",
        });
      }

      await prisma.purchaseRequest.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "Purchase Request deleted successfully",
      });
    } catch (error) {
      console.error("Delete PR error:", error);

      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Invalid ID format",
          error: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to delete Purchase Request",
        error: error.message,
      });
    }
  }

  /**
   * Get PR by Project
   */
  async getPurchaseRequestsByProject(req, res) {
    try {
      const { projectId } = idParamSchema
        .pick({ projectId: true })
        .parse(req.params);
      const { status } = req.query;

      const where = { projectId };
      if (status) where.status = status;

      const purchaseRequests = await prisma.purchaseRequest.findMany({
        where,
        include: {
          project: {
            select: { id: true, name: true },
          },
          karyawan: {
            select: { id: true, namaLengkap: true, jabatan: true },
          },
          spk: {
            select: { id: true, spkNumber: true, notes: true },
          },
          details: {
            include: {
              product: {
                select: { id: true, name: true, description: true },
              },
              projectBudget: {
                select: { id: true, description: true, amount: true },
              },
            },
          },
        },
        orderBy: { tanggalPr: "desc" },
      });

      res.json({
        success: true,
        data: purchaseRequests,
      });
    } catch (error) {
      console.error("Get PR by project error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get Purchase Requests",
        error: error.message,
      });
    }
  }
}

export default new PurchaseRequestController();
