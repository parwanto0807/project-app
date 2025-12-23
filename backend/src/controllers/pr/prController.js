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

      // ✅ PENTING: Handle nullable spkId
      const prData = {
        ...validatedData,
        nomorPr,
        // Pastikan spkId null jika tidak diisi
        spkId: validatedData.spkId || null,
        details: {
          create: detailsWithTotal,
        },
      };

      const purchaseRequest = await prisma.purchaseRequest.create({
        data: prData,
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

      // ✅ PENTING: Handle nullable spkId untuk update
      if (updateData.spkId !== undefined) {
        // Jika spkId diubah menjadi string kosong, set null
        updateData.spkId = updateData.spkId || null;
      }

      if (existingPR.status === "REVISION_NEEDED") {
        updateData.status = "DRAFT";
      }

      // ✅ VALIDASI BISNIS TAMBAHAN untuk update
      // Jika menghapus SPK (mengubah dari ada ke null)
      if (updateData.spkId === null && existingPR.spkId) {
        // Cek apakah ada keterangan yang cukup
        if (
          !updateData.keterangan &&
          (!existingPR.keterangan || existingPR.keterangan.trim().length < 10)
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Untuk menghapus referensi SPK, wajib memberikan keterangan minimal 10 karakter",
            error: "INSUFFICIENT_DESCRIPTION_FOR_SPK_REMOVAL",
          });
        }

        // Cek apakah ada item dengan tipe JASA
        const existingJasaItems = existingPR.details.filter(
          (detail) =>
            detail.sourceProduct === "JASA_PEMBELIAN" ||
            detail.sourceProduct === "JASA_INTERNAL"
        );

        if (existingJasaItems.length > 0 && validatedData.details) {
          // Cek jika ada item JASA di update baru
          const newJasaItems = validatedData.details.filter(
            (detail) =>
              detail.sourceProduct === "JASA_PEMBELIAN" ||
              detail.sourceProduct === "JASA_INTERNAL"
          );

          if (newJasaItems.length > 0) {
            return res.status(400).json({
              success: false,
              message:
                "Tidak dapat menghapus SPK karena terdapat item dengan tipe JASA",
              error: "JASA_ITEMS_REQUIRE_SPK",
            });
          }
        }
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

          // ✅ VALIDASI: Jika tanpa SPK, cek details yang diupdate
          if (
            (updateData.spkId === null || existingPR.spkId === null) &&
            !updateData.keterangan
          ) {
            // Cek apakah semua item valid tanpa SPK
            const invalidDetails = validatedData.details.filter(
              (detail) =>
                detail.sourceProduct === "JASA_PEMBELIAN" ||
                detail.sourceProduct === "JASA_INTERNAL"
            );

            if (invalidDetails.length > 0) {
              throw new Error("Item dengan tipe JASA memerlukan referensi SPK");
            }
          }

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

        // 2b. Auto-create Material Requisition if PR is APPROVED and has PENGAMBILAN_STOK items
        if (status === 'APPROVED' && warehouseAllocations) {
          // Group items by warehouse from warehouseAllocations
          const warehouseGroups = {}; // { warehouseId: [{ detailId, productId, qty, unit, allocations }] }

          // Get all PR details
          const prDetails = await tx.purchaseRequestDetail.findMany({
            where: { purchaseRequestId: id },
            include: { product: true }
          });

          // Process warehouse allocations to group by warehouse
          Object.entries(warehouseAllocations).forEach(([detailId, allocations]) => {
            const detail = prDetails.find(d => d.id === detailId);
            
            if (detail && detail.sourceProduct === 'PENGAMBILAN_STOK' && allocations && allocations.length > 0) {
              allocations.forEach(allocation => {
                const warehouseId = allocation.warehouseId;
                
                if (!warehouseGroups[warehouseId]) {
                  warehouseGroups[warehouseId] = [];
                }
                
                warehouseGroups[warehouseId].push({
                  detailId: detail.id,
                  productId: detail.productId,
                  qty: allocation.stock, // Quantity allocated from this warehouse
                  unit: detail.satuan,
                });
              });
            }
          });

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
                warehouseId: warehouseId, // Set warehouse ID
              }
            });

            // Create MR Items for this warehouse
            for (const item of items) {
              await tx.materialRequisitionItem.create({
                data: {
                  materialRequisitionId: materialRequisition.id,
                  productId: item.productId,
                  qtyRequested: item.qty,
                  qtyIssued: 0, // Will be updated when items are actually issued
                  unit: item.unit,
                  purchaseRequestDetailId: item.detailId,
                }
              });
            }
          }
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

        return pr;
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
