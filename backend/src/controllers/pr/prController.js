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
import { startOfMonth } from "date-fns";

export class PurchaseRequestController {
  /**
   * Get all Purchase Requests dengan pagination dan filter
   */
  async getAllPurchaseRequests(req, res) {
    try {
      const query = queryParamsSchema.parse(req.query);

      const { page, limit, status, projectId, startDate, endDate, search, type } =
        query;
      const skip = (page - 1) * limit;

      const where = {};

      if (status) where.status = status;
      if (projectId) where.projectId = projectId;

      // Filter berdasarkan type
      if (type === "umum") {
        where.spkId = null;
      } else if (type === "project") {
        where.spkId = { not: null };
      }
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

      const baseWhere = { ...where };
      delete baseWhere.spkId;

      const [purchaseRequests, responseCount, totalAll, totalUmum, totalProject] = await Promise.all([
        prisma.purchaseRequest.findMany({
          where,
          include: {
            project: { select: { id: true, name: true } },
            karyawan: { select: { id: true, namaLengkap: true, jabatan: true } },
            requestedBy: { select: { id: true, namaLengkap: true, jabatan: true } },
            spk: {
              select: {
                id: true,
                spkNumber: true,
                salesOrder: { select: { soNumber: true } },
              },
            },
            parentPr: {
              select: {
                id: true,
                nomorPr: true,
                status: true,
                sisaBudget: true,
                details: { select: { estimasiTotalHarga: true } }
              },
            },
            childPrs: {
              select: {
                id: true,
                nomorPr: true,
                status: true,
                details: { select: { estimasiTotalHarga: true, sourceProduct: true } },
                purchaseOrders: {
                  select: { 
                    id: true, 
                    poNumber: true, 
                    status: true, 
                    totalAmount: true,
                    lines: {
                      select: {
                        quantity: true,
                        qtyActual: true,
                        unitPrice: true,
                        unitPriceActual: true
                      }
                    }
                  }
                }
              },
            },
            details: {
              include: {
                product: { select: { id: true, name: true, code: true, purchaseUnit: true, storageUnit: true, usageUnit: true, conversionToStorage: true, conversionToUsage: true } },
                projectBudget: { select: { id: true, description: true, amount: true } },
              },
            },
            uangMuka: {
              include: {
                pertanggungjawaban: {
                  include: {
                    details: {
                      include: {
                        product: { select: { id: true, name: true, code: true } },
                        fotoBukti: true,
                      },
                    },
                  },
                },
              },
            },
            ...(req.query.includeExistingPOs === 'true' && {
              purchaseOrders: {
                select: { 
                  id: true, 
                  poNumber: true, 
                  status: true, 
                  totalAmount: true, 
                  supplier: { select: { id: true, name: true } },
                  lines: {
                    select: {
                      quantity: true,
                      qtyActual: true,
                      unitPrice: true,
                      unitPriceActual: true
                    }
                  }
                },
              },
            }),
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.purchaseRequest.count({ where }),
        prisma.purchaseRequest.count({ where: baseWhere }),
        prisma.purchaseRequest.count({ where: { ...baseWhere, spkId: null } }),
        prisma.purchaseRequest.count({ where: { ...baseWhere, spkId: { not: null } } }),
      ]);

      res.json({
        success: true,
        data: purchaseRequests,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(responseCount / limit),
          totalCount: responseCount,
          counts: {
            all: totalAll,
            umum: totalUmum,
            project: totalProject,
          }
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
          requestedBy: true,
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
      console.log("📥 [Backend] Received req.body:", req.body);
      const validatedData = createPurchaseRequestSchema.parse(req.body);
      console.log("✅ [Backend] Validated data:", {
        spkId: validatedData.spkId,
        parentPrId: validatedData.parentPrId,
        projectId: validatedData.projectId
      });

      // Generate nomor PR berdasarkan apakah ada SPK atau tidak
      const hasSPK = !!(validatedData.spkId && validatedData.spkId !== "" && validatedData.spkId !== "no-spk" && validatedData.spkId !== "null" && validatedData.spkId !== "undefined");
      console.log("🔍 [Backend] hasSPK (calculated):", hasSPK);

      const nomorPr = await generatePRNumber(hasSPK);

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

      // ✅ PARENT-CHILD PR VALIDATION
      const { 
        validateParentPr, 
        calculatePRBudget, 
        validateChildBudget 
      } = await import("../../utils/prParentChildHelpers.js");

      // 1. Validasi: PR SPK WAJIB memiliki parentPrId
      if (hasSPK && !validatedData.parentPrId) {
        return res.status(400).json({
          success: false,
          message: "PR SPK wajib memiliki Parent PR (PR UM yang sudah APPROVED)",
          error: "PARENT_PR_REQUIRED",
        });
      }

      // 2. Validasi: PR UM tidak boleh memiliki parentPrId
      if (!hasSPK && validatedData.parentPrId) {
        return res.status(400).json({
          success: false,
          message: "PR UM tidak boleh memiliki Parent PR",
          error: "PARENT_PR_NOT_ALLOWED_FOR_UM",
        });
      }

      // 3. Jika PR SPK, validasi parent dan budget
      if (hasSPK && validatedData.parentPrId) {
        // Validasi parent PR (harus PR UM dengan status APPROVED)
        await validateParentPr(validatedData.parentPrId);

        // Hitung total budget PR ini
        const thisPRBudget = calculatePRBudget(detailsWithTotal);

        // Validasi budget tidak melebihi sisa budget parent
        await validateChildBudget(validatedData.parentPrId, thisPRBudget);
      }

      // ✅ PENTING: Handle nullable spkId and requestedById
    console.log("🔍 Backend received validatedData:", {
      karyawanId: validatedData.karyawanId,
      requestedById: validatedData.requestedById,
      hasRequestedById: !!validatedData.requestedById,
      parentPrId: validatedData.parentPrId,
      hasSPK,
    });

    // Hitung total sisaBudget awal jika ini PR Parent (UM)
    let initialSisaBudget = 0;
    if (!hasSPK) {
      initialSisaBudget = calculatePRBudget(detailsWithTotal);
    }

    const prData = {
      ...validatedData,
      nomorPr,
      // Pastikan spkId null jika tidak diisi
      spkId: validatedData.spkId || null,
      // Pastikan parentPrId null jika tidak diisi
      parentPrId: validatedData.parentPrId || null,
      // Default requestedById to karyawanId if not provided
      requestedById: validatedData.requestedById || validatedData.karyawanId,
      // Set initial sisaBudget
      sisaBudget: initialSisaBudget,
      details: {
        create: detailsWithTotal,
      },
    };

    console.log("💾 Backend will save prData:", {
      karyawanId: prData.karyawanId,
      requestedById: prData.requestedById,
      parentPrId: prData.parentPrId,
      willUse: prData.requestedById
    });

    const purchaseRequest = await prisma.purchaseRequest.create({
      data: prData,
      include: {
        project: {
          select: { id: true, name: true },
        },
        karyawan: {
          select: { id: true, namaLengkap: true, jabatan: true },
        },
        requestedBy: {
          select: { id: true, namaLengkap: true, jabatan: true },
        },
        spk: {
          select: { id: true, spkNumber: true, notes: true },
        },
        parentPr: {
          select: { 
            id: true, 
            nomorPr: true, 
            status: true,
            details: true,
          },
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

    // ✅ UPDATE SISA BUDGET PARENT JIKA INI PR CHILD (SPK)
    if (hasSPK && validatedData.parentPrId) {
      const { updateParentRemainingBudget } = await import("../../utils/prParentChildHelpers.js");
      await updateParentRemainingBudget(validatedData.parentPrId);
    }

      // Update Sisa Budget
      const { updatePRRemainingBudget } = await import("../../utils/prParentChildHelpers.js");
      
      // Update sisaBudget untuk PR ini
      await updatePRRemainingBudget(purchaseRequest.id);
      
      // Jika ini child PR, update juga sisaBudget untuk parent-nya
      if (purchaseRequest.parentPrId) {
        await updatePRRemainingBudget(purchaseRequest.parentPrId);
      }

      // ✅ TAMBAHKAN: BROADCAST NOTIFICATION KE ADMIN & PIC
      try {
        // Dapatkan semua user dengan role admin dan pic
        const adminUsers = await prisma.user.findMany({
          where: {
            role: { in: ["admin", "pic"] },
            active: true,
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        });

        console.log(
          `📢 Sending Purchase Request notification to ${adminUsers.length} admin/pic users`
        );

        // Hitung total estimasi budget
        const totalEstimasiBudget = detailsWithTotal.reduce((total, detail) => {
          return total + detail.estimasiTotalHarga;
        }, 0);

        // Format currency untuk display
        const formattedBudget = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
        }).format(totalEstimasiBudget);

        // Dapatkan nama karyawan yang membuat PR
        const karyawanName =
          purchaseRequest.karyawan?.namaLengkap || "Unknown Karyawan";

        // Import NotificationService
        const { NotificationService } = await import(
          "../../utils/firebase/notificationService.js"
        );

        // Tambahkan informasi apakah PR punya SPK atau tidak
        const hasSPK = purchaseRequest.spk !== null;
        const spkInfo = hasSPK
          ? ` untuk SPK: ${purchaseRequest.spk?.spkNumber || "N/A"}`
          : " (Tanpa SPK)";

        // Kirim notifikasi ke setiap admin dan pic
        for (const admin of adminUsers) {
          await NotificationService.sendToUser(admin.id, {
            title: "Purchase Request Baru Dibuat 📝",
            body: `PR ${nomorPr}${spkInfo} dengan total estimasi ${formattedBudget} berhasil dibuat oleh ${karyawanName}`,
            data: {
              type: "purchase_request_created",
              prId: purchaseRequest.id,
              prNumber: nomorPr,
              projectName: purchaseRequest.project?.name || "Unknown Project",
              karyawanName: karyawanName,
              totalItems: detailsWithTotal.length,
              totalBudget: totalEstimasiBudget.toString(),
              hasSPK: hasSPK.toString(),
              spkNumber: purchaseRequest.spk?.spkNumber || "",
              action: `/purchase-requests/${purchaseRequest.id}`,
              timestamp: new Date().toISOString(),
            },
          });

          console.log(
            `✅ Purchase Request notification sent to ${admin.role}: ${admin.email}`
          );
        }
      } catch (notificationError) {
        // Jangan gagalkan create PR jika notifikasi gagal
        console.error(
          "❌ Error sending Purchase Request notification:",
          notificationError
        );
      }

      res.status(201).json({
        success: true,
        message: "Purchase Request created successfully",
        data: purchaseRequest,
        warning: !validatedData.spkId
          ? "Purchase Request dibuat tanpa referensi SPK. Pastikan ini sesuai dengan kebijakan perusahaan."
          : undefined,
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

      // Tambahkan handling untuk error relasional
      if (error.code === "P2003") {
        const field = error.meta?.field_name || "";
        if (field.includes("spkId")) {
          return res.status(400).json({
            success: false,
            message:
              "SPK tidak ditemukan. Pastikan SPK ID valid atau kosongkan field ini.",
          });
        }
        if (field.includes("parentPrId")) {
          return res.status(400).json({
            success: false,
            message: "Parent PR tidak ditemukan. Pastikan Parent PR ID valid.",
            error: "PARENT_PR_NOT_FOUND",
          });
        }
      }

      // ✅ Handle parent-child validation errors
      if (error.message.includes("Parent PR")) {
        return res.status(400).json({
          success: false,
          message: error.message,
          error: "PARENT_PR_VALIDATION_ERROR",
        });
      }

      if (error.message.includes("Budget melebihi")) {
        return res.status(400).json({
          success: false,
          message: error.message,
          error: "BUDGET_EXCEEDED",
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
      if (!["DRAFT", "REVISION_NEEDED", "SUBMITTED"].includes(existingPR.status)) {
        return res.status(400).json({
          success: false,
          message:
            "Only DRAFT, REVISION_NEEDED, or SUBMITTED Purchase Request can be updated",
        });
      }

      const updateData = { ...validatedData };
      delete updateData.details;

      // Debug log
      console.log("🔍 Backend UPDATE received validatedData:", {
        requestedById: validatedData.requestedById,
        hasRequestedById: !!validatedData.requestedById
      });

      // ✅ PENTING: Handle nullable spkId untuk update
      if (updateData.spkId !== undefined) {
        // Jika spkId diubah menjadi string kosong, set null
        updateData.spkId = updateData.spkId || null;
      }

      console.log("💾 Backend will UPDATE with data:", {
        requestedById: updateData.requestedById,
        willSave: updateData.requestedById
      });

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
            requestedBy: true, // ✅ Include requester
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
              requestedBy: true, // ✅ Include requester
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

      // ✅ Kirim notifikasi update jika perlu
      try {
        if (updateData.spkId === null && existingPR.spkId) {
          // Notifikasi jika SPK dihapus
          const { NotificationService } = await import(
            "../../utils/firebase/notificationService.js"
          );

          // Dapatkan admin/pic untuk notifikasi
          const adminUsers = await prisma.user.findMany({
            where: {
              role: { in: ["admin", "pic"] },
              active: true,
            },
            select: { id: true },
          });

          for (const admin of adminUsers) {
            await NotificationService.sendToUser(admin.id, {
              title: "Referensi SPK Dihapus dari PR",
              body: `SPK telah dihapus dari PR ${transaction.nomorPr}`,
              data: {
                type: "purchase_request_spk_removed",
                prId: transaction.id,
                prNumber: transaction.nomorPr,
                action: `/purchase-requests/${transaction.id}`,
                timestamp: new Date().toISOString(),
              },
            });
          }
        }
      } catch (notificationError) {
        console.error("Error sending update notification:", notificationError);
      }

      // ✅ Update Sisa Budget
      const { updatePRRemainingBudget } = await import("../../utils/prParentChildHelpers.js");
      await updatePRRemainingBudget(id);
      if (existingPR.parentPrId) {
        await updatePRRemainingBudget(existingPR.parentPrId);
      }

      res.json({
        success: true,
        message: "Purchase Request updated successfully",
        data: transaction,
        warning:
          updateData.spkId === null && existingPR.spkId
            ? "Referensi SPK telah dihapus dari Purchase Request. Pastikan ini sesuai kebijakan."
            : undefined,
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

      // ✅ Tambahkan handling untuk foreign key error
      if (error.code === "P2003") {
        const field = error.meta?.field_name || "";
        if (field.includes("spkId")) {
          return res.status(400).json({
            success: false,
            message: "SPK tidak ditemukan. Pastikan SPK ID valid.",
          });
        }
      }

      // ✅ Handle custom validation error dari transaction
      if (error.message === "Item dengan tipe JASA memerlukan referensi SPK") {
        return res.status(400).json({
          success: false,
          message: error.message,
          error: "JASA_ITEMS_REQUIRE_SPK",
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
      const { status, catatan, warehouseAllocations } = req.body; // Manual extraction for extra fields

      // Validate status using schema manually or extend schema
      const statusValidation = updateStatusSchema.safeParse({ status, catatan });
      if (!statusValidation.success) {
        throw statusValidation.error;
      }

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
        APPROVED: ["COMPLETED", "SUBMITTED"], // Allow cancel approve (APPROVED → SUBMITTED)
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

      // ✅ PARENT-CHILD STATUS VALIDATION
      // Import helper functions
      const { cascadeStatusToChildren } = await import("../../utils/prParentChildHelpers.js");

      // 1. If this is a child PR being approved, verify parent is still APPROVED
      if (status === "APPROVED" && existingPR.parentPrId) {
        const parentPR = await prisma.purchaseRequest.findUnique({
          where: { id: existingPR.parentPrId },
          select: { status: true, nomorPr: true },
        });

        // Allow APPROVED or COMPLETED (since PR UM might be completed/disbursed)
        if (!parentPR || !["APPROVED", "COMPLETED"].includes(parentPR.status)) {
          return res.status(400).json({
            success: false,
            message: `Cannot approve child PR because parent PR ${parentPR?.nomorPr || ''} is not APPROVED or COMPLETED (current status: ${parentPR?.status || 'NOT FOUND'})`,
            error: "PARENT_PR_NOT_APPROVED",
          });
        }
      }

      // Use transaction to update PR status and allocations
      const updatedPR = await prisma.$transaction(async (tx) => {
        // 1. Update PR Status
        const pr = await tx.purchaseRequest.update({
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
            parentPr: {
              select: { id: true, nomorPr: true, status: true },
            },
            childPrs: {
              select: { id: true, nomorPr: true, status: true },
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

        // 2. Cascade status to children if parent is rejected
        if (status === "REJECTED" && pr.childPrs && pr.childPrs.length > 0) {
          const cascadedCount = await cascadeStatusToChildren(id, status, tx);
          console.log(`✅ Cascaded REJECTED status to ${cascadedCount} child PRs`);
        }

        // 2. Handle Split Items (created when stock is insufficient)
        if (warehouseAllocations && warehouseAllocations['__splitItems__']) {
          const splitItemsData = warehouseAllocations['__splitItems__'];
          
          for (const splitItem of splitItemsData) {
            await tx.purchaseRequestDetail.create({
              data: {
                purchaseRequestId: id,
                productId: splitItem.productId,
                jumlah: splitItem.jumlah,
                satuan: splitItem.satuan,
                sourceProduct: splitItem.sourceProduct,
                estimasiHargaSatuan: splitItem.estimasiHargaSatuan,
                estimasiTotalHarga: splitItem.estimasiTotalHarga,
                catatanItem: splitItem.catatanItem || 'Auto-split from insufficient stock',
              }
            });
          }
          
          // Remove __splitItems__ from warehouseAllocations to avoid processing it as a detail
          delete warehouseAllocations['__splitItems__'];
        }

        // 2b-New. Update quantities for existing details (e.g., when item is split)
        if (warehouseAllocations && warehouseAllocations['__quantityChanges__']) {
          const quantityChanges = warehouseAllocations['__quantityChanges__'][0];
          
          if (quantityChanges && typeof quantityChanges === 'object') {
            for (const [detailId, changes] of Object.entries(quantityChanges)) {
              if (changes && typeof changes === 'object') {
                await tx.purchaseRequestDetail.update({
                  where: { id: detailId },
                  data: { 
                    jumlah: Number(changes.jumlah),
                    estimasiTotalHarga: Number(changes.estimasiTotalHarga)
                  }
                });
              }
            }
           }
           
          // Remove __quantityChanges__ from warehouseAllocations
          delete warehouseAllocations['__quantityChanges__'];
        }

        // 2a. Update stokTersediaSaatIni for each detail (available stock at approval time)
        if (status === 'APPROVED' && warehouseAllocations && warehouseAllocations['__stockAvailability__']) {
          const stockAvailabilityData = warehouseAllocations['__stockAvailability__'][0];
          
          if (stockAvailabilityData && typeof stockAvailabilityData === 'object') {
            // Update each detail with its available stock at approval time
            for (const [detailId, availableStock] of Object.entries(stockAvailabilityData)) {
              await tx.purchaseRequestDetail.update({
                where: { id: detailId },
                data: { stokTersediaSaatIni: Number(availableStock) }
              });
            }
          }
          
          // Remove __stockAvailability__ from warehouseAllocations to avoid processing it as a detail
          delete warehouseAllocations['__stockAvailability__'];
        }

        // 2a-2. Update sourceProduct for details that were changed in UI
        if (status === 'APPROVED' && warehouseAllocations && warehouseAllocations['__sourceProductChanges__']) {
          const sourceProductChanges = warehouseAllocations['__sourceProductChanges__'][0];
          
          if (sourceProductChanges && typeof sourceProductChanges === 'object') {
            // Update each detail's sourceProduct
            for (const [detailId, newSource] of Object.entries(sourceProductChanges)) {
              await tx.purchaseRequestDetail.update({
                where: { id: detailId },
                data: { sourceProduct: newSource }
              });
            }
          }
          
          // Remove __sourceProductChanges__ from warehouseAllocations to avoid processing it as a detail
          delete warehouseAllocations['__sourceProductChanges__'];
        }


        // 2b. Auto-create Material Requisition - MOVED TO AFTER SECTION 3
        // (MR creation now happens after warehouse allocations are saved,
        //  so we can read the correct allocatedQty from warehouseAllocation JSON)

        // 2c. Handle Cancel Approve (APPROVED → SUBMITTED)
        // Validate: Check if any related PO or MR is already approved or beyond
        if (existingPR.status === 'APPROVED' && status === 'SUBMITTED') {
          // Check if any related Purchase Order is APPROVED or higher status
          const approvedPO = await tx.purchaseOrder.findFirst({
            where: {
              purchaseRequestId: id,
              status: {
                in: ['APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED']
              }
            },
            select: {
              poNumber: true,
              status: true
            }
          });

          if (approvedPO) {
            const statusText = approvedPO.status === 'SENT' ? 'sudah dikirim ke supplier' :
                             approvedPO.status === 'PARTIALLY_RECEIVED' ? 'sudah sebagian diterima' :
                             'sudah selesai diterima';
            throw new Error(`Tidak dapat membatalkan approval. Purchase Order ${approvedPO.poNumber} ${statusText}.`);
          }

          // Check if any related Material Requisition is APPROVED or higher status
          const approvedMR = await tx.materialRequisition.findFirst({
            where: {
              items: {
                some: {
                  purchaseRequestDetail: {
                    purchaseRequestId: id
                  }
                }
              },
              status: {
                in: ['APPROVED', 'READY_TO_PICKUP', 'ISSUED']
              }
            },
            select: {
              mrNumber: true,
              status: true
            }
          });

          if (approvedMR) {
            const statusText = approvedMR.status === 'APPROVED' ? 'sudah di-approve' :
                             approvedMR.status === 'READY_TO_PICKUP' ? 'sudah siap diambil' :
                             'sudah dikeluarkan dari gudang';
            throw new Error(`Tidak dapat membatalkan approval. Material Requisition ${approvedMR.mrNumber} ${statusText}.`);
          }

          // Reverse stock balance changes: decrease bookedStock, increase availableStock
          // Get all PR details with warehouse allocations
          const prDetails = await tx.purchaseRequestDetail.findMany({
            where: { 
              purchaseRequestId: id,
              sourceProduct: 'PENGAMBILAN_STOK' // Only process stock withdrawal items
            }
          });

          const period = startOfMonth(new Date());

          for (const detail of prDetails) {
            // Parse warehouse allocations from JSON field
            if (!detail.warehouseAllocation) continue;

            const allocations = typeof detail.warehouseAllocation === 'string' 
              ? JSON.parse(detail.warehouseAllocation) 
              : detail.warehouseAllocation;

            if (!Array.isArray(allocations)) continue;

            // Reverse stock balance for each warehouse allocation
            for (const allocation of allocations) {
              const { warehouseId, allocatedQty } = allocation;
              
              if (!warehouseId || !allocatedQty) continue;

              // Find stock balance
              const stockBalance = await tx.stockBalance.findUnique({
                where: {
                  productId_warehouseId_period: {
                    productId: detail.productId,
                    warehouseId,
                    period
                  }
                }
              });

              if (stockBalance) {
                // Reverse the booking: decrease bookedStock, increase availableStock
                await tx.stockBalance.update({
                  where: {
                    productId_warehouseId_period: {
                      productId: detail.productId,
                      warehouseId,
                      period
                    }
                  },
                  data: {
                    bookedStock: { decrement: allocatedQty },
                    availableStock: { increment: allocatedQty }
                  }
                });
              }
            }
          }

          // Delete auto-split items created during approval
          // Auto-split items have BOTH:
          // 1. sourceProduct = 'PEMBELIAN_BARANG'
          // 2. catatanItem contains "Auto-split"
          await tx.purchaseRequestDetail.deleteMany({
            where: {
              purchaseRequestId: id,
              sourceProduct: 'PEMBELIAN_BARANG',
              catatanItem: {
                contains: 'Auto-split'
              }
            }
          });

          // Reset tracking fields for all PR details
          await tx.purchaseRequestDetail.updateMany({
            where: { purchaseRequestId: id },
            data: {
              stokTersediaSaatIni: 0,
              jumlahDipesan: 0,
              jumlahTerpenuhi: 0
            }
          });

          // Delete Material Requisitions created during approval
          // Only delete if MR is still PENDING and has no issued items
          const relatedMRs = await tx.materialRequisition.findMany({
            where: {
              items: {
                some: {
                  purchaseRequestDetail: {
                    purchaseRequestId: id
                  }
                }
              }
            },
            include: {
              items: true
            }
          });

          for (const mr of relatedMRs) {
            // Check if MR is safe to delete
            const canDelete = mr.status === 'PENDING' && 
                             mr.items.every(item => Number(item.qtyIssued) === 0);

            if (canDelete) {
              // Delete MR items first (foreign key constraint)
              await tx.materialRequisitionItem.deleteMany({
                where: { materialRequisitionId: mr.id }
              });

              // Delete MR
              await tx.materialRequisition.delete({
                where: { id: mr.id }
              });
            } else {
              // Log warning but don't block the cancel approve
              console.warn(
                `Cannot delete MR ${mr.mrNumber} - Status: ${mr.status}, ` +
                `Has issued items: ${mr.items.some(item => Number(item.qtyIssued) > 0)}`
              );
            }
          }

          // Delete Purchase Orders created during approval
          // Only delete if PO is still DRAFT and has no goods receipts or invoices
          const relatedPOs = await tx.purchaseOrder.findMany({
            where: {
              purchaseRequestId: id
            },
            include: {
              lines: true,
              goodsReceipts: true,
              supplierInvoices: true
            }
          });

          for (const po of relatedPOs) {
            // Check if PO is safe to delete
            // Now allows deleting APPROVED status during PR cancellation
            const canDelete = (po.status === 'DRAFT' || po.status === 'APPROVED') && 
                             po.goodsReceipts.length === 0 &&
                             po.supplierInvoices.length === 0;

            if (canDelete) {
              // ✅ Handle StockBalance reversal if PO was APPROVED
              if (po.status === 'APPROVED') {
                const currentPeriod = new Date();
                currentPeriod.setDate(1);
                currentPeriod.setHours(0, 0, 0, 0);

                for (const line of po.lines) {
                  // Skip services or items without product
                  if (line.notGr || !line.productId) continue;

                  const product = await tx.product.findUnique({
                    where: { id: line.productId },
                    select: { conversionToStorage: true }
                  });

                  const conversion = parseFloat(product?.conversionToStorage) || 1;
                  const qtyToReverse = Number(line.quantity) * conversion;

                  const stockBalance = await tx.stockBalance.findFirst({
                    where: {
                      productId: line.productId,
                      warehouseId: po.warehouseId,
                      period: currentPeriod
                    }
                  });

                  if (stockBalance) {
                    const currentOnPR = Number(stockBalance.onPR);
                    await tx.stockBalance.update({
                      where: { id: stockBalance.id },
                      data: { onPR: Math.max(0, currentOnPR - qtyToReverse) }
                    });
                  }
                }
              }

              // Delete PO lines first (foreign key constraint)
              await tx.purchaseOrderLine.deleteMany({
                where: { poId: po.id }
              });

              // Delete PO
              await tx.purchaseOrder.delete({
                where: { id: po.id }
              });

              console.log(`✅ Deleted PO ${po.poNumber} during cancel approve`);
            } else {
              // Log warning but don't block the cancel approve
              console.warn(
                `Cannot delete PO ${po.poNumber} - Status: ${po.status}, ` +
                `Has goods receipts: ${po.goodsReceipts.length > 0}, ` +
                `Has invoices: ${po.supplierInvoices.length > 0}`
              );
            }
          }

          // Delete StockTransfers created during approval (for PR without SPK)
          // Only delete if StockTransfer is still DRAFT
          if (!existingPR.spkId) {
            const relatedTransfers = await tx.stockTransfer.findMany({
              where: {
                notes: {
                  contains: `Auto-created from PR ${existingPR.nomorPr}`
                }
              },
              include: {
                items: true
              }
            });

            for (const transfer of relatedTransfers) {
              // Check if transfer is safe to delete (only DRAFT status)
              if (transfer.status !== 'DRAFT') {
                const statusText = transfer.status === 'PENDING' ? 'sudah dalam status PENDING' :
                                 transfer.status === 'IN_TRANSIT' ? 'sedang dalam perjalanan' :
                                 transfer.status === 'RECEIVED' ? 'sudah diterima' :
                                 'tidak dalam status DRAFT';
                throw new Error(`Tidak dapat membatalkan approval. Stock Transfer ${transfer.transferNumber} ${statusText}.`);
              }

              const transferNumber = transfer.transferNumber;

              // Delete related MaterialRequisitions (auto-generated for transfer)
              const relatedMRs = await tx.materialRequisition.findMany({
                where: {
                  notes: {
                    contains: `Internal Stock Transfer [${transferNumber}]`
                  }
                },
                include: {
                  items: true
                }
              });

              for (const mr of relatedMRs) {
                // Check if MR is safe to delete (only PENDING)
                if (mr.status !== 'PENDING') {
                  const statusText = mr.status === 'APPROVED' ? 'sudah di-approve' :
                                   mr.status === 'READY_TO_PICKUP' ? 'sudah siap diambil' :
                                   mr.status === 'ISSUED' ? 'sudah dikeluarkan' :
                                   'tidak dalam status PENDING';
                  throw new Error(`Tidak dapat membatalkan approval. Material Requisition ${mr.mrNumber} ${statusText}.`);
                }

                // Delete MR items
                await tx.materialRequisitionItem.deleteMany({
                  where: { materialRequisitionId: mr.id }
                });

                // Delete MR
                await tx.materialRequisition.delete({
                  where: { id: mr.id }
                });

                console.log(`✅ Deleted MaterialRequisition ${mr.mrNumber} during cancel approve`);
              }

              // Delete related GoodsReceipts (auto-generated for transfer)
              const relatedGRs = await tx.goodsReceipt.findMany({
                where: {
                  vendorDeliveryNote: transferNumber
                },
                include: {
                  items: true
                }
              });

              for (const gr of relatedGRs) {
                // Check if GR is safe to delete (only DRAFT)
                if (gr.status !== 'DRAFT') {
                  const statusText = gr.status === 'ARRIVED' ? 'sudah tiba' :
                                   gr.status === 'PASSED' ? 'sudah lulus QC' :
                                   gr.status === 'COMPLETED' ? 'sudah selesai' :
                                   'tidak dalam status DRAFT';
                  throw new Error(`Tidak dapat membatalkan approval. Goods Receipt ${gr.grNumber} ${statusText}.`);
                }

                // Delete GR items
                await tx.goodsReceiptItem.deleteMany({
                  where: { goodsReceiptId: gr.id }
                });

                // Delete GR
                await tx.goodsReceipt.delete({
                  where: { id: gr.id }
                });

                console.log(`✅ Deleted GoodsReceipt ${gr.grNumber} during cancel approve`);
              }

              // Delete transfer items first (foreign key constraint)
              await tx.stockTransferItem.deleteMany({
                where: { transferId: transfer.id }
              });

              // Delete transfer
              await tx.stockTransfer.delete({
                where: { id: transfer.id }
              });

              console.log(`✅ Deleted StockTransfer ${transfer.transferNumber} during cancel approve`);
            }
          }

          /* DISABLED: StaffBalance & StaffLedger update logic
          if (existingPR.spkId) {
            // Find StaffLedger entries created for this PR
            const relatedLedgerEntries = await tx.staffLedger.findMany({
              where: {
                purchaseRequestId: id,
                category: 'OPERASIONAL_PROYEK',
                type: 'EXPENSE_REPORT'
              },
              orderBy: { tanggal: 'desc' }
            });

            if (relatedLedgerEntries.length > 0) {
              for (const ledgerEntry of relatedLedgerEntries) {
                const karyawanId = ledgerEntry.karyawanId;
                const originalKredit = Number(ledgerEntry.kredit);

                // Get current balance for this karyawan
                const lastLedger = await tx.staffLedger.findFirst({
                  where: { karyawanId },
                  orderBy: { tanggal: 'desc' }
                });

                const saldoAwal = lastLedger ? Number(lastLedger.saldo) : 0;
                const saldoAkhir = saldoAwal + originalKredit; // DEBIT menambah saldo kembali

                // Create reversal entry (DEBIT = money returned/refunded to staff)
                await tx.staffLedger.create({
                  data: {
                    karyawanId,
                    tanggal: new Date(),
                    keterangan: `REVERSAL - Pembatalan Approval PR ${existingPR.nomorPr}\\n` +
                      `Original: ${ledgerEntry.keterangan}`,
                    saldoAwal: saldoAwal,  // Balance before reversal
                    debit: originalKredit,  // Reverse the original kredit with debit
                    kredit: 0,
                    saldo: saldoAkhir,  // Balance after reversal
                    category: 'OPERASIONAL_PROYEK',
                    type: 'EXPENSE_REPORT',  // Keep same type
                    purchaseRequestId: id,
                    refId: `REV-${existingPR.nomorPr}`,
                    createdBy: existingPR.karyawanId
                  }
                });

                console.log(`✅ Reversed StaffLedger entry for karyawan ${karyawanId}: ` +
                  `SaldoAwal: Rp ${saldoAwal.toLocaleString('id-ID')}, ` +
                  `DEBIT: Rp ${originalKredit.toLocaleString('id-ID')}, ` +
                  `SaldoAkhir: Rp ${saldoAkhir.toLocaleString('id-ID')}`);

                // Update StaffBalance (reverse the totalOut and amount)
                const existingBalance = await tx.staffBalance.findUnique({
                  where: {
                    karyawanId_category: {
                      karyawanId,
                      category: 'OPERASIONAL_PROYEK'
                    }
                  }
                });

                if (existingBalance) {
                  await tx.staffBalance.update({
                    where: {
                      karyawanId_category: {
                        karyawanId,
                        category: 'OPERASIONAL_PROYEK'
                      }
                    },
                    data: {
                      totalOut: {
                        decrement: originalKredit  // Decrease total expenses
                      },
                      amount: saldoAkhir  // Restore balance
                    }
                  });

                  console.log(`✅ Reversed StaffBalance for karyawan ${karyawanId}: ` +
                    `totalOut -Rp ${originalKredit.toLocaleString('id-ID')}, ` +
                    `amount = Rp ${saldoAkhir.toLocaleString('id-ID')}`);
                }
              }
            }
          }
          */
        }

        // 3. Save Warehouse Allocations if provided
        if (warehouseAllocations && (status === 'APPROVED' || status === 'SUBMITTED')) {
          const detailIds = Object.keys(warehouseAllocations);
          
          for (const detailId of detailIds) {
            const requestedAllocations = warehouseAllocations[detailId]; // Candidates: [{ warehouseId, ... }]
            
            // 2a. Verify detail belongs to this PR
            const detail = await tx.purchaseRequestDetail.findFirst({
              where: { id: detailId, purchaseRequestId: id },
              include: { product: true }
            });

            if (!detail) continue;

            const productId = detail.productId;
            let remainingNeeded = Number(detail.jumlah);
            let totalCost = 0;
            let totalAllocatedQty = 0;
            
            // Final allocations to be saved (with specific quantities)
            const finalAllocations = [];

            // 2b. Iterate through requested warehouses (priority order)
            for (const reqAlloc of requestedAllocations) {
              if (remainingNeeded <= 0) break;

              const warehouseId = reqAlloc.warehouseId;

              // Get Current Stock Balance (Start of Month)
              const period = startOfMonth(new Date());
              
              const stockBalance = await tx.stockBalance.findUnique({
                where: {
                  productId_warehouseId_period: {
                    productId,
                    warehouseId,
                    period
                  }
                }
              });

              // Calculate available stock (Available - Booked is handled by availableStock field logic? 
              // Schema says: availableStock = stockAkhir - bookedStock. 
              // We trust availableStock field in DB to be up to date.)
              const availableQty = stockBalance ? Number(stockBalance.availableStock) : 0;
              
              if (availableQty <= 0) continue;

              // Determine how much to take from this warehouse
              const takeQty = Math.min(remainingNeeded, availableQty);
              
              if (takeQty > 0) {
                // --- FIFO PRICING LOGIC ---
                // We need to calculate the cost of 'takeQty' units, 
                // skipping the units that are already booked/consumed.
                // NOTE: 'bookedStock' represents the quantity already promised to other PRs.
                // We assume bookedStock corresponds to the oldest batches.
                
                const currentBooked = stockBalance ? Number(stockBalance.bookedStock) : 0;
                let usageOffset = currentBooked; // Skip this many units (FIFO)
                let qtyToPrice = takeQty;
                let currentBatchCost = 0;

                // Fetch StockDetails (Batches)
                const batches = await tx.stockDetail.findMany({
                  where: {
                    productId,
                    warehouseId,
                    residualQty: { gt: 0 },
                    isFullyConsumed: false
                  },
                  orderBy: { createdAt: 'asc' }
                });

                // ✅ VALIDATION: Check if physical batches are sufficient
                const totalPhysicalStock = batches.reduce((sum, b) => sum + Number(b.residualQty), 0);
                const availablePhysical = totalPhysicalStock - currentBooked;

                if (availablePhysical < takeQty) {
                  // Get product and warehouse names for better error message
                  const product = await tx.product.findUnique({
                    where: { id: productId },
                    select: { name: true, code: true }
                  });
                  
                  const warehouse = await tx.warehouse.findUnique({
                    where: { id: warehouseId },
                    select: { name: true }
                  });

                  throw new Error(
                    `Stok fisik tidak mencukupi untuk produk "${product?.name || productId}" (${product?.code || ''}) ` +
                    `di gudang "${warehouse?.name || warehouseId}". ` +
                    `Dibutuhkan: ${takeQty} unit, ` +
                    `Tersedia di StockBalance: ${availableQty} unit, ` +
                    `Tersedia di batch fisik: ${availablePhysical} unit. ` +
                    `Silakan lakukan Stock Opname untuk menyesuaikan data stok.`
                  );
                }

                for (const batch of batches) {
                   if (qtyToPrice <= 0) break;

                   const batchQty = Number(batch.residualQty);
                   
                   // If we still need to skip units (because they are booked by others)
                   if (usageOffset >= batchQty) {
                     usageOffset -= batchQty;
                     continue; // Skip this batch completely
                   }

                   // If logic reaches here, this batch has available units for US.
                   // Available in this batch = batchQty - usageOffset
                   const availableInBatch = batchQty - usageOffset;
                   
                   // We take what we need, or what's available
                   const takeFromBatch = Math.min(qtyToPrice, availableInBatch);
                   
                   currentBatchCost += takeFromBatch * Number(batch.pricePerUnit);
                   
                   qtyToPrice -= takeFromBatch;
                   usageOffset = 0; // Usage offset is fully consumed by this batch or previous
                }

                // If 'qtyToPrice' is still > 0, it means we ran out of batches (shouldn't happen if availableQty is correct)
                // Fallback: use last batch price or 0
                if (qtyToPrice > 0 && batches.length > 0) {
                    const lastPrice = Number(batches[batches.length - 1].pricePerUnit);
                    currentBatchCost += qtyToPrice * lastPrice;
                }

                totalCost += currentBatchCost;
                totalAllocatedQty += takeQty;
                remainingNeeded -= takeQty;

                // --- UPDATE STOCK BALANCE ---
                // Increase Booked, Decrease Available
                await tx.stockBalance.update({
                  where: { 
                     productId_warehouseId_period: {
                        productId,
                        warehouseId,
                        period
                     }
                  },
                  data: {
                    bookedStock: { increment: takeQty },
                    availableStock: { decrement: takeQty }
                  }
                });

                // Add to final allocations list
                finalAllocations.push({
                   warehouseId,
                   warehouseName: reqAlloc.warehouseName,
                   stock: reqAlloc.stock, // Original snapshot
                   allocatedQty: takeQty,
                   costAttribute: currentBatchCost
                });
              }
            }

            // 2c. Update PR Detail with new Price and Allocations
            // Only update if we actually allocated something
            if (totalAllocatedQty > 0) {
               const newUnitPrice = totalCost / totalAllocatedQty;

               await tx.purchaseRequestDetail.update({
                 where: { id: detailId },
                 data: {
                   estimasiTotalHarga: totalCost,
                   estimasiHargaSatuan: newUnitPrice,
                   warehouseAllocation: finalAllocations
                 }
               });
            } else {
                // If nothing allocated (no stock?), just save the intention? 
                // Currently just saving the raw selection if logic fails or no stock
               if (remainingNeeded === Number(detail.jumlah)) {
                   // No stock found at all
                    await tx.purchaseRequestDetail.update({
                        where: { id: detailId },
                        data: {
                        warehouseAllocation: requestedAllocations
                        }
                    });
               }
            }
          }
        }

        // 4. Create Material Requisitions AFTER warehouse allocations are saved
        // Only for PR with SPK (spkId is not null)
        if (status === 'APPROVED' && pr.spkId) {
          // Get all PR details with warehouse allocations
          const prDetailsWithAllocations = await tx.purchaseRequestDetail.findMany({
            where: {
              purchaseRequestId: id,
              sourceProduct: 'PENGAMBILAN_STOK',
              warehouseAllocation: { not: null }
            },
            include: { product: true }
          });

          // Group by warehouse
          const warehouseGroups = {}; // { warehouseId: [{ detailId, productId, qty, unit }] }

          for (const detail of prDetailsWithAllocations) {
            const allocations = typeof detail.warehouseAllocation === 'string'
              ? JSON.parse(detail.warehouseAllocation)
              : detail.warehouseAllocation;

            if (Array.isArray(allocations)) {
              for (const allocation of allocations) {
                const warehouseId = allocation.warehouseId;
                const allocatedQty = allocation.allocatedQty || 0;

                if (allocatedQty > 0) {
                  if (!warehouseGroups[warehouseId]) {
                    warehouseGroups[warehouseId] = [];
                  }

                  warehouseGroups[warehouseId].push({
                    detailId: detail.id,
                    productId: detail.productId,
                    qty: allocatedQty, // Use the actual allocated quantity
                    unit: detail.satuan,
                  });
                }
              }
            }
          }

          // Create MR for each warehouse
          for (const [warehouseId, items] of Object.entries(warehouseGroups)) {
            if (items.length === 0) continue;

            // Generate MR Number
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');

            // Get last MR number for this month
            const lastMR = await tx.materialRequisition.findFirst({
              where: {
                mrNumber: {
                  startsWith: `MR-${year}${month}-`
                }
              },
              orderBy: { mrNumber: 'desc' }
            });

            let sequence = 1;
            if (lastMR) {
              const lastSequence = parseInt(lastMR.mrNumber.split('-')[2]);
              sequence = lastSequence + 1;
            }

            const mrNumber = `MR-${year}${month}-${String(sequence).padStart(4, '0')}`;

            // Create Material Requisition for this warehouse
            const materialRequisition = await tx.materialRequisition.create({
              data: {
                mrNumber,
                projectId: existingPR.projectId,
                requestedById: existingPR.karyawanId,
                status: 'PENDING',
                warehouseId: warehouseId,
              }
            });

            // Create MR Items for this warehouse
            for (const item of items) {
              await tx.materialRequisitionItem.create({
                data: {
                  materialRequisitionId: materialRequisition.id,
                  productId: item.productId,
                  qtyRequested: item.qty, // Now uses correct allocatedQty
                  qtyIssued: 0,
                  unit: item.unit,
                  purchaseRequestDetailId: item.detailId,
                }
              });
            }
          }
        }

        // 5. Auto-create StockTransfer for PR without SPK with PENGAMBILAN_STOCK items
        if (status === 'APPROVED' && !pr.spkId) {
          // Get all PR details with PENGAMBILAN_STOK and warehouse allocations
          const stockWithdrawalDetails = await tx.purchaseRequestDetail.findMany({
            where: {
              purchaseRequestId: id,
              sourceProduct: 'PENGAMBILAN_STOK',
              warehouseAllocation: { not: null }
            },
            include: { product: true }
          });

          if (stockWithdrawalDetails.length > 0) {
            // Find WIP warehouse
            const wipWarehouse = await tx.warehouse.findFirst({
              where: { isWip: true, isActive: true }
            });

            if (!wipWarehouse) {
              console.warn('⚠️ No WIP warehouse found. Skipping StockTransfer creation.');
            } else if (!pr.karyawanId) {
              console.warn('⚠️ PR has no karyawan. Skipping StockTransfer creation.');
            } else {
              // Generate Transfer Number (Format: TF-YYYYMM-XXXX)
              const now = new Date();
              const year = now.getFullYear();
              const month = String(now.getMonth() + 1).padStart(2, '0');
              const prefix = `TF-${year}${month}`;

              // Find last transfer with this prefix
              const lastTransfer = await tx.stockTransfer.findFirst({
                where: {
                  transferNumber: {
                    startsWith: prefix
                  }
                },
                orderBy: {
                  transferNumber: 'desc'
                }
              });

              let sequence = 1;
              if (lastTransfer) {
                const parts = lastTransfer.transferNumber.split('-');
                if (parts.length === 3) {
                  const lastSeq = parseInt(parts[2]);
                  if (!isNaN(lastSeq)) {
                    sequence = lastSeq + 1;
                  }
                }
              }

              const transferNumber = `${prefix}-${String(sequence).padStart(4, '0')}`;

              // Group items by fromWarehouse
              const warehouseGroups = {};

              for (const detail of stockWithdrawalDetails) {
                const allocations = typeof detail.warehouseAllocation === 'string'
                  ? JSON.parse(detail.warehouseAllocation)
                  : detail.warehouseAllocation;

                if (Array.isArray(allocations)) {
                  for (const allocation of allocations) {
                    const fromWarehouseId = allocation.warehouseId;
                    const allocatedQty = allocation.allocatedQty || 0;

                    if (allocatedQty > 0) {
                      if (!warehouseGroups[fromWarehouseId]) {
                        warehouseGroups[fromWarehouseId] = [];
                      }

                      warehouseGroups[fromWarehouseId].push({
                        productId: detail.productId,
                        quantity: allocatedQty,
                        unit: detail.satuan,
                        cogs: allocation.costAttribute || 0
                      });
                    }
                  }
                }
              }

              // Create StockTransfer for each source warehouse
              for (const [fromWarehouseId, items] of Object.entries(warehouseGroups)) {
                if (items.length === 0) continue;

                // Create StockTransfer
                const stockTransfer = await tx.stockTransfer.create({
                  data: {
                    transferNumber,
                    status: 'DRAFT',
                    fromWarehouseId,
                    toWarehouseId: wipWarehouse.id,
                    senderId: pr.karyawanId,
                    notes: `Auto-created from PR ${pr.nomorPr} (No SPK)`,
                  }
                });

                // Create StockTransferItems
                for (const item of items) {
                  await tx.stockTransferItem.create({
                    data: {
                      transferId: stockTransfer.id,
                      productId: item.productId,
                      quantity: item.quantity,
                      unit: item.unit,
                      cogs: item.cogs
                    }
                  });
                }

                console.log(`✅ Created StockTransfer ${transferNumber} from warehouse ${fromWarehouseId} to WIP warehouse ${wipWarehouse.id}`);

                // 5a. Create MaterialRequisition (MR) for stock withdrawal from source warehouse
                // Generate MR Number
                const lastMR = await tx.materialRequisition.findFirst({
                  where: {
                    mrNumber: {
                      startsWith: `MR-${year}${month}-`
                    }
                  },
                  orderBy: { mrNumber: 'desc' }
                });

                let mrSequence = 1;
                if (lastMR) {
                  const lastMRSequence = parseInt(lastMR.mrNumber.split('-')[2]);
                  mrSequence = lastMRSequence + 1;
                }

                const mrNumber = `MR-${year}${month}-${String(mrSequence).padStart(4, '0')}`;

                // Create MaterialRequisition
                const materialRequisition = await tx.materialRequisition.create({
                  data: {
                    mrNumber,
                    projectId: pr.projectId,
                    requestedById: pr.karyawanId,
                    status: 'PENDING',
                    warehouseId: fromWarehouseId,
                    sourceType: 'TRANSFER',
                    notes: `AUTO-GENERATED-TRANSFER: Internal Stock Transfer [${transferNumber}] to Warehouse ID: ${wipWarehouse.id}`
                  }
                });

                // Create MR Items
                for (const item of items) {
                  await tx.materialRequisitionItem.create({
                    data: {
                      materialRequisitionId: materialRequisition.id,
                      productId: item.productId,
                      qtyRequested: item.quantity,
                      qtyIssued: 0,
                      unit: item.unit,
                    }
                  });
                }

                console.log(`✅ Created MaterialRequisition ${mrNumber} for warehouse ${fromWarehouseId}`);

                // 5b. Create GoodsReceipt (GR) for receiving at WIP warehouse
                // Generate GR Number
                const lastGR = await tx.goodsReceipt.findFirst({
                  where: {
                    grNumber: {
                      startsWith: `GRN/${year}/${month}/`
                    }
                  },
                  orderBy: { grNumber: 'desc' }
                });

                let grSequence = 1;
                if (lastGR) {
                  const parts = lastGR.grNumber.split('/');
                  grSequence = parseInt(parts[3]) + 1;
                }

                const grNumber = `GRN/${year}/${month}/${String(grSequence).padStart(3, '0')}`;

                // Get current user for receivedBy - need to get User ID from Karyawan
                const karyawan = await tx.karyawan.findUnique({
                  where: { id: pr.karyawanId },
                  include: { user: true }
                });

                const receivedByUserId = karyawan?.user?.id || karyawan?.userId;

                if (!receivedByUserId) {
                  console.warn('⚠️ Cannot find user for karyawan. Skipping GoodsReceipt creation.');
                  continue;
                }

                // Create GoodsReceipt
                const goodsReceipt = await tx.goodsReceipt.create({
                  data: {
                    grNumber,
                    receivedDate: new Date(),
                    vendorDeliveryNote: transferNumber, // Use transfer number as delivery note
                    sourceType: 'TRANSFER',
                    warehouseId: wipWarehouse.id,
                    receivedById: receivedByUserId,
                    status: 'DRAFT',
                    notes: `AUTO-GENERATED-TRANSFER: Internal Stock Transfer [${transferNumber}] from Warehouse ID: ${fromWarehouseId}`
                  }
                });

                // Create GR Items
                for (const item of items) {
                  await tx.goodsReceiptItem.create({
                    data: {
                      goodsReceiptId: goodsReceipt.id,
                      productId: item.productId,
                      qtyPlanReceived: item.quantity,
                      qtyReceived: item.quantity,
                      qtyPassed: item.quantity,
                      qtyRejected: 0,
                      unit: item.unit,
                      unitPrice: item.cogs / item.quantity || 0,
                      status: 'RECEIVED',
                      qcStatus: 'PENDING'
                    }
                  });
                }

                console.log(`✅ Created GoodsReceipt ${grNumber} for WIP warehouse ${wipWarehouse.id}`);
              }
            }
          }
        }

        /* DISABLED: StaffLedger entries for OPERATIONAL items
        if (status === 'APPROVED' && pr.spkId) {
          // Get all OPERATIONAL items from this PR
          const operationalItems = await tx.purchaseRequestDetail.findMany({
            where: {
              purchaseRequestId: id,
              sourceProduct: 'OPERATIONAL'
            },
            include: {
              product: {
                select: { name: true, code: true }
              }
            }
          });

          if (operationalItems.length > 0) {
            // Get the requester (karyawan) for this PR
            const requesterId = pr.requestedById || pr.karyawanId;
            
            if (!requesterId) {
              console.warn('⚠️ No karyawan found for PR. Skipping StaffLedger creation.');
            } else {
              // Calculate total operational cost
              let totalOperationalCost = 0;
              const itemDescriptions = [];

              for (const item of operationalItems) {
                const itemCost = Number(item.estimasiTotalHarga || 0);
                totalOperationalCost += itemCost;
                
                const productName = item.product?.name || 'Unknown Product';
                const qty = Number(item.jumlah || 0);
                const unit = item.satuan || 'unit';
                itemDescriptions.push(`${productName} (${qty} ${unit})`);
              }

              // Only create ledger entry if there's actual cost
              if (totalOperationalCost > 0) {
                // Get current balance for this karyawan
                const lastLedger = await tx.staffLedger.findFirst({
                  where: { karyawanId: requesterId },
                  orderBy: { tanggal: 'desc' }
                });

                const saldoAwal = lastLedger ? Number(lastLedger.saldo) : 0;
                const saldoAkhir = saldoAwal - totalOperationalCost; // KREDIT mengurangi saldo

                // Create detailed description
                const description = `Belanja Operasional - PR ${pr.nomorPr} (SPK: ${pr.spk?.spkNumber || pr.spkId})\\n` +
                  `Items: ${itemDescriptions.join(', ')}`;

                // Create StaffLedger entry (KREDIT = money spent by staff, reduces balance)
                await tx.staffLedger.create({
                  data: {
                    karyawanId: requesterId,
                    tanggal: new Date(),
                    keterangan: description,
                    saldoAwal: saldoAwal,  // Balance before transaction
                    debit: 0,
                    kredit: totalOperationalCost,  // Money spent by staff (decreases their balance)
                    saldo: saldoAkhir,  // Balance after transaction
                    category: 'OPERASIONAL_PROYEK',
                    type: 'EXPENSE_REPORT',
                    purchaseRequestId: id,
                    refId: pr.nomorPr,
                    createdBy: pr.karyawanId
                  }
                });

                console.log(`✅ Created StaffLedger entry for karyawan ${requesterId}: ` +
                  `SaldoAwal: Rp ${saldoAwal.toLocaleString('id-ID')}, ` +
                  `KREDIT: Rp ${totalOperationalCost.toLocaleString('id-ID')}, ` +
                  `SaldoAkhir: Rp ${saldoAkhir.toLocaleString('id-ID')} ` +
                  `(${operationalItems.length} operational items)`);

                // Update or Create StaffBalance
                const existingBalance = await tx.staffBalance.findUnique({
                  where: {
                    karyawanId_category: {
                      karyawanId: requesterId,
                      category: 'OPERASIONAL_PROYEK'
                    }
                  }
                });

                if (existingBalance) {
                  // Update existing balance
                  await tx.staffBalance.update({
                    where: {
                      karyawanId_category: {
                        karyawanId: requesterId,
                        category: 'OPERASIONAL_PROYEK'
                      }
                    },
                    data: {
                      totalOut: {
                        increment: totalOperationalCost  // Increase total expenses
                      },
                      amount: saldoAkhir  // Update current balance
                    }
                  });

                  console.log(`✅ Updated StaffBalance for karyawan ${requesterId}: ` +
                    `totalOut +Rp ${totalOperationalCost.toLocaleString('id-ID')}, ` +
                    `amount = Rp ${saldoAkhir.toLocaleString('id-ID')}`);
                } else {
                  // Create new balance record
                  await tx.staffBalance.create({
                    data: {
                      karyawanId: requesterId,
                      category: 'OPERASIONAL_PROYEK',
                      totalIn: 0,
                      totalOut: totalOperationalCost,
                      amount: saldoAkhir
                    }
                  });

                  console.log(`✅ Created StaffBalance for karyawan ${requesterId}: ` +
                    `totalOut = Rp ${totalOperationalCost.toLocaleString('id-ID')}, ` +
                    `amount = Rp ${saldoAkhir.toLocaleString('id-ID')}`);
                }
              }
            }
          }
        }
        */

        // 5. Auto-create Purchase Order if PR contains purchase items
        if (status === 'APPROVED') {
          try {
            // Import PO controller function
            const { createPOFromApprovedPR } = await import('../po/poController.js');
            
            // Create PO (will return null if no purchase items found)
            // Pass tx to make it part of the same transaction
            const createdPO = await createPOFromApprovedPR(id, tx);
            
            if (createdPO) {
              // Check if multiple POs were created
              if (createdPO.multiple && createdPO.pos) {
                // Multiple POs created
                pr.autoCreatedPO = {
                  multiple: true,
                  pos: createdPO.pos.map(po => ({
                    id: po.id,
                    poNumber: po.poNumber
                  })),
                  summary: createdPO.summary,
                  message: `${createdPO.pos.length} Purchase Orders created automatically`
                };
              } else {
                // Single PO created
                pr.autoCreatedPO = {
                  id: createdPO.id,
                  poNumber: createdPO.poNumber,
                  message: 'Purchase Order created automatically for purchase items'
                };
              }
            }
          } catch (poError) {
            // Log error and THROW to roll back the PR status update
            console.error('❌ Failed to auto-create PO from approved PR. Rolling back PR approval:', poError);
            throw new Error(`PR approved successfully, but PO creation failed: ${poError.message}`);
          }
        }

        return pr;
      }, { timeout: 20000 });

      // ✅ Update Sisa Budget after status update
      try {
        const { updatePRRemainingBudget } = await import("../../utils/prParentChildHelpers.js");
        await updatePRRemainingBudget(id);
        if (existingPR.parentPrId) {
          await updatePRRemainingBudget(existingPR.parentPrId);
        }
      } catch (budgetError) {
        console.error("❌ Failed to update budget after status change:", budgetError);
      }

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

      // Hanya PR dengan status DRAFT atau REVISION_NEEDED yang bisa dihapus
      if (existingPR.status !== "DRAFT" && existingPR.status !== "REVISION_NEEDED") {
        return res.status(400).json({
          success: false,
          message: "Only DRAFT or REVISION_NEEDED Purchase Request can be deleted",
        });
      }

      // Update Sisa Budget Parent sebelum atau sesudah delete? 
      // Sebaiknya sesudah, tapi jika record terhapus PR SPK hilang, parent budget harus direcalculate.
      const parentPrId = existingPR.parentPrId;

      await prisma.purchaseRequest.delete({
        where: { id },
      });

      // Update Parent Budget jika ada
      if (parentPrId) {
        const { updatePRRemainingBudget } = await import("../../utils/prParentChildHelpers.js");
        await updatePRRemainingBudget(parentPrId);
      }

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

  async recalculateSisaBudget(req, res) {
    try {
      const { id } = idParamSchema.parse(req.params);

      const { updatePRRemainingBudget } = await import("../../utils/prParentChildHelpers.js");
      await updatePRRemainingBudget(id);

      const updatedPR = await prisma.purchaseRequest.findUnique({
        where: { id },
        select: { sisaBudget: true, nomorPr: true }
      });

      res.json({
        success: true,
        message: `Sisa budget untuk PR ${updatedPR.nomorPr} berhasil dihitung ulang`,
        data: { sisaBudget: updatedPR.sisaBudget }
      });
    } catch (error) {
      console.error("Recalculate PR budget error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to recalculate Purchase Request budget",
        error: error.message,
      });
    }
  }
}

export default new PurchaseRequestController();
