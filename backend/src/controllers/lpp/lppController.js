// import { PrismaClient } from "../../../prisma/generated/prisma/index.js";
import { prisma } from "../../config/db.js";
import path from "path";
import fs from "fs/promises";
import { generateNomorLpp } from "../../utils/lppGenerateNumber.js";
import {
  createLppValidation,
  updateLppValidation,
  addDetailValidation,
  updateDetailValidation,
  lppIdValidation,
  detailIdValidation,
  updateStatusValidation,
  lppQueryValidation,
  fotoIdValidation,
  batchUpdateDetailsValidation,
  createLppDetailValidation,
  updateFotoKeteranganValidation,
  duplicateLppValidation,
} from "../../validations/lppValidation.js";

// const prisma = new PrismaClient();

// Helper function untuk validasi dengan Zod
const validateWithZod = (schema, data) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errorMessage = result.error.errors
      .map((err) => {
        const field = err.path.length ? err.path.join(".") : "<root>";
        return `${field}: ${err.message}`;
      })
      .join(", ");
    throw new Error(errorMessage);
  }
  return result.data;
};

// Helper function untuk handle error
const handleError = (error, res) => {
  console.error("Error:", error);

  if (error.message.includes("not found")) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }

  if (error.message.includes("already exists")) {
    return res.status(409).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(400).json({
    success: false,
    message: error.message || "Bad Request",
  });
};

export const lppController = {
  // CREATE - Membuat LPP baru
  createLpp: async (req, res) => {
    try {
      // Parse payload JSON
      const payload = req.body.data ? JSON.parse(req.body.data) : req.body;
      console.log("📦 Data Received:", payload);

      const {
        uangMukaId,
        totalBiaya,
        sisaUangDikembalikan,
        keterangan,
        details,
      } = payload;

      // Parse details jika masih berupa string
      let detailsArray = [];
      if (details) {
        if (typeof details === "string") {
          try {
            detailsArray = JSON.parse(details);
          } catch (e) {
            return res
              .status(400)
              .json({ success: false, message: "Invalid details JSON" });
          }
        } else if (Array.isArray(details)) {
          detailsArray = details;
        } else {
          return res
            .status(400)
            .json({ success: false, message: "details harus berupa array" });
        }
      }

      // Pastikan totalBiaya & sisaUangDikembalikan sebagai number
      const totalBiayaNum = Number(totalBiaya) || 0;
      const sisaUangNum = Number(sisaUangDikembalikan) || 0;

      // Cek uang muka exist
      const uangMuka = await prisma.uangMuka.findUnique({
        where: { id: uangMukaId },
      });
      if (!uangMuka) {
        return res
          .status(404)
          .json({ success: false, message: "Uang muka tidak ditemukan" });
      }

      // Generate nomor LPP
      const nomor = await generateNomorLpp();

      // Transaction
      const result = await prisma.$transaction(async (tx) => {
        const lpp = await tx.pertanggungjawaban.create({
          data: {
            nomor,
            totalBiaya: totalBiayaNum,
            sisaUangDikembalikan: sisaUangNum,
            keterangan,
            uangMukaId,
            details: {
              create: detailsArray.map((detail) => ({
                tanggalTransaksi: new Date(detail.tanggalTransaksi),
                keterangan: detail.keterangan,
                jumlah: detail.jumlah,
                nomorBukti: detail.nomorBukti,
                jenisPembayaran: detail.jenisPembayaran,
                productId: detail.productId,
                purchaseRequestDetailId: detail.purchaseRequestDetailId,
                fotoBukti: {
                  create: Array.isArray(detail.fotoBukti)
                    ? detail.fotoBukti.map((foto) => ({
                        url: `/images/lpp/${foto.url.split("/").pop()}`,
                        keterangan:
                          foto.keterangan || `Bukti ${detail.nomorBukti || ""}`,
                      }))
                    : [],
                },
              })),
            },
          },
          include: {
            details: { include: { fotoBukti: true } },
            uangMuka: true,
          },
        });
        return lpp;
      });

      res.status(201).json({
        success: true,
        message: "LPP berhasil dibuat",
        data: result,
      });
    } catch (error) {
      console.error("❌ Error createLpp:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 🆕 CREATE LPP DETAIL - Menambah detail baru ke LPP yang sudah ada
  createLppDetail: async (req, res) => {
    try {
      const { id } = validateWithZod(lppIdValidation, req.params);

      // Parse payload
      const payload = req.body.data ? JSON.parse(req.body.data) : req.body;
      const validatedData = validateWithZod(createLppDetailValidation, payload);

      // Cek apakah LPP exists
      const existingLpp = await prisma.pertanggungjawaban.findUnique({
        where: { id },
        include: { details: true },
      });

      if (!existingLpp) {
        return res.status(404).json({
          success: false,
          message: "LPP tidak ditemukan",
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        // Create detail
        const detail = await tx.rincianPertanggungjawaban.create({
          data: {
            ...validatedData,
            tanggalTransaksi: new Date(validatedData.tanggalTransaksi),
            pertanggungjawabanId: id,
          },
        });

        // Handle file uploads jika ada
        if (req.files && req.files.length > 0) {
          const fotoBuktiData = req.files.map((file) => ({
            rincianPjId: detail.id,
            url: `/images/lpp/${file.filename}`,
            keterangan:
              req.body.keterangan || `Foto bukti ${file.originalname}`,
          }));

          await tx.fotoBuktiPertanggungjawaban.createMany({
            data: fotoBuktiData,
          });
        }

        // Update total biaya LPP
        const totalBiayaBaru = existingLpp.totalBiaya + validatedData.jumlah;
        const sisaUangBaru =
          existingLpp.sisaUangDikembalikan - validatedData.jumlah;

        await tx.pertanggungjawaban.update({
          where: { id },
          data: {
            totalBiaya: totalBiayaBaru,
            sisaUangDikembalikan: sisaUangBaru,
          },
        });

        // Get complete detail dengan foto
        const completeDetail = await tx.rincianPertanggungjawaban.findUnique({
          where: { id: detail.id },
          include: {
            product: true,
            fotoBukti: true,
          },
        });

        return completeDetail;
      });

      res.status(201).json({
        success: true,
        message: "Detail LPP berhasil ditambahkan",
        data: result,
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  // 🆕 UPDATE LPP DETAIL - Mengupdate detail LPP yang sudah ada
  updateLppDetail: async (req, res) => {
    try {
      const { detailId } = validateWithZod(detailIdValidation, req.params);

      // Parse payload
      const payload = req.body.data ? JSON.parse(req.body.data) : req.body;
      const validatedData = validateWithZod(updateDetailValidation, payload);

      // Cek apakah detail exists dan ambil data lama
      const existingDetail = await prisma.rincianPertanggungjawaban.findUnique({
        where: { id: detailId },
        include: {
          pertanggungjawaban: true,
        },
      });

      if (!existingDetail) {
        return res.status(404).json({
          success: false,
          message: "Detail LPP tidak ditemukan",
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        // Update detail
        const updatedDetail = await tx.rincianPertanggungjawaban.update({
          where: { id: detailId },
          data: {
            ...validatedData,
            ...(validatedData.tanggalTransaksi && {
              tanggalTransaksi: new Date(validatedData.tanggalTransaksi),
            }),
          },
        });

        // Handle file uploads baru jika ada
        if (req.files && req.files.length > 0) {
          const fotoBuktiData = req.files.map((file) => ({
            rincianPjId: detailId,
            url: `/images/lpp/${file.filename}`,
            keterangan:
              req.body.keterangan || `Foto bukti ${file.originalname}`,
          }));

          await tx.fotoBuktiPertanggungjawaban.createMany({
            data: fotoBuktiData,
          });
        }

        // Update total biaya LPP jika jumlah berubah
        if (
          validatedData.jumlah &&
          validatedData.jumlah !== existingDetail.jumlah
        ) {
          const selisih = validatedData.jumlah - existingDetail.jumlah;
          const totalBiayaBaru =
            existingDetail.pertanggungjawaban.totalBiaya + selisih;
          const sisaUangBaru =
            existingDetail.pertanggungjawaban.sisaUangDikembalikan - selisih;

          await tx.pertanggungjawaban.update({
            where: { id: existingDetail.pertanggungjawabanId },
            data: {
              totalBiaya: totalBiayaBaru,
              sisaUangDikembalikan: sisaUangBaru,
            },
          });
        }

        // Get complete updated detail
        const completeDetail = await tx.rincianPertanggungjawaban.findUnique({
          where: { id: detailId },
          include: {
            product: true,
            fotoBukti: true,
          },
        });

        return completeDetail;
      });

      res.json({
        success: true,
        message: "Detail LPP berhasil diupdate",
        data: result,
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  // 🆕 BATCH UPDATE DETAILS - Update multiple details sekaligus (Create, Update, Delete)
  batchUpdateDetails: async (req, res) => {
    try {
      const { id } = validateWithZod(lppIdValidation, req.params);
      const validatedData = validateWithZod(
        batchUpdateDetailsValidation,
        req.body
      );

      const {
        create = [],
        update = [],
        delete: deleteIds = [],
      } = validatedData;

      // Cek apakah LPP exists
      const existingLpp = await prisma.pertanggungjawaban.findUnique({
        where: { id },
        include: { details: true },
      });

      if (!existingLpp) {
        return res.status(404).json({
          success: false,
          message: "LPP tidak ditemukan",
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        let totalBiayaPerubahan = 0;

        // 1. Process DELETE operations first
        if (deleteIds.length > 0) {
          // Hitung total yang akan dihapus
          const detailsToDelete = await tx.rincianPertanggungjawaban.findMany({
            where: { id: { in: deleteIds } },
          });

          totalBiayaPerubahan -= detailsToDelete.reduce(
            (sum, detail) => sum + detail.jumlah,
            0
          );

          await tx.rincianPertanggungjawaban.deleteMany({
            where: { id: { in: deleteIds } },
          });
        }

        // 2. Process UPDATE operations
        if (update.length > 0) {
          for (const detailUpdate of update) {
            const existingDetail =
              await tx.rincianPertanggungjawaban.findUnique({
                where: { id: detailUpdate.id },
              });

            if (existingDetail) {
              const selisih = detailUpdate.jumlah - existingDetail.jumlah;
              totalBiayaPerubahan += selisih;

              await tx.rincianPertanggungjawaban.update({
                where: { id: detailUpdate.id },
                data: {
                  ...detailUpdate,
                  tanggalTransaksi: new Date(detailUpdate.tanggalTransaksi),
                },
              });
            }
          }
        }

        // 3. Process CREATE operations
        if (create.length > 0) {
          const createdDetails = await tx.rincianPertanggungjawaban.createMany({
            data: create.map((detail) => ({
              ...detail,
              tanggalTransaksi: new Date(detail.tanggalTransaksi),
              pertanggungjawabanId: id,
            })),
          });

          totalBiayaPerubahan += create.reduce(
            (sum, detail) => sum + detail.jumlah,
            0
          );
        }

        // 4. Update LPP header dengan perubahan total
        const totalBiayaBaru = existingLpp.totalBiaya + totalBiayaPerubahan;
        const sisaUangBaru =
          existingLpp.sisaUangDikembalikan - totalBiayaPerubahan;

        const updatedLpp = await tx.pertanggungjawaban.update({
          where: { id },
          data: {
            totalBiaya: totalBiayaBaru,
            sisaUangDikembalikan: sisaUangBaru,
          },
          include: {
            details: {
              include: {
                product: true,
                fotoBukti: true,
              },
              orderBy: {
                tanggalTransaksi: "asc",
              },
            },
            uangMuka: true,
          },
        });

        return updatedLpp;
      });

      res.json({
        success: true,
        message: "Batch update details berhasil",
        data: result,
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  // 🆕 UPDATE FOTO KETERANGAN - Update keterangan foto bukti
  updateFotoKeterangan: async (req, res) => {
    try {
      const { fotoId } = validateWithZod(fotoIdValidation, req.params);
      const validatedData = validateWithZod(
        updateFotoKeteranganValidation,
        req.body
      );

      // Cek apakah foto exists
      const existingFoto = await prisma.fotoBuktiPertanggungjawaban.findUnique({
        where: { id: fotoId },
      });

      if (!existingFoto) {
        return res.status(404).json({
          success: false,
          message: "Foto bukti tidak ditemukan",
        });
      }

      const updatedFoto = await prisma.fotoBuktiPertanggungjawaban.update({
        where: { id: fotoId },
        data: validatedData,
      });

      res.json({
        success: true,
        message: "Keterangan foto berhasil diupdate",
        data: updatedFoto,
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  // 🆕 GET LPP BY PURCHASE REQUEST ID
  getLppByPurchaseRequestId: async (req, res) => {
    try {
      const { purchaseRequestId } = req.params;

      const lpp = await prisma.pertanggungjawaban.findFirst({
        where: {
          uangMuka: {
            purchaseRequestId: purchaseRequestId,
          },
        },
        include: {
          uangMuka: {
            include: {
              purchaseRequest: true,
            },
          },
          details: {
            include: {
              product: true,
              fotoBukti: true,
              purchaseRequestDetail: {
                include: {
                  product: true,
                },
              },
            },
            orderBy: {
              tanggalTransaksi: "asc",
            },
          },
        },
      });

      if (!lpp) {
        return res.status(404).json({
          success: false,
          message: "LPP tidak ditemukan untuk Purchase Request ini",
        });
      }

      res.json({
        success: true,
        data: lpp,
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  // 🆕 DUPLICATE LPP - Membuat salinan LPP
  duplicateLpp: async (req, res) => {
    try {
      const { id } = validateWithZod(lppIdValidation, req.params);
      const validatedData = validateWithZod(duplicateLppValidation, req.body);

      const { keterangan } = validatedData;

      // Get original LPP
      const originalLpp = await prisma.pertanggungjawaban.findUnique({
        where: { id },
        include: {
          details: {
            include: {
              fotoBukti: true,
            },
          },
        },
      });

      if (!originalLpp) {
        return res.status(404).json({
          success: false,
          message: "LPP tidak ditemukan",
        });
      }

      // Generate nomor LPP baru
      const nomorBaru = await generateNomorLpp();

      const duplicatedLpp = await prisma.$transaction(async (tx) => {
        // Create new LPP
        const newLpp = await tx.pertanggungjawaban.create({
          data: {
            nomor: nomorBaru,
            totalBiaya: originalLpp.totalBiaya,
            sisaUangDikembalikan: originalLpp.sisaUangDikembalikan,
            keterangan: keterangan || `Duplikat dari ${originalLpp.nomor}`,
            uangMukaId: originalLpp.uangMukaId,
            status: "PENDING",
            details: {
              create: originalLpp.details.map((detail) => ({
                tanggalTransaksi: detail.tanggalTransaksi,
                keterangan: detail.keterangan,
                jumlah: detail.jumlah,
                nomorBukti: detail.nomorBukti,
                jenisPembayaran: detail.jenisPembayaran,
                productId: detail.productId,
                purchaseRequestDetailId: detail.purchaseRequestDetailId,
                // Note: Foto tidak diduplikasi, hanya data detail saja
              })),
            },
          },
          include: {
            details: {
              include: {
                product: true,
                fotoBukti: true,
              },
            },
            uangMuka: true,
          },
        });

        return newLpp;
      });

      res.status(201).json({
        success: true,
        message: "LPP berhasil diduplikasi",
        data: duplicatedLpp,
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  // 🆕 EXPORT LPP TO PDF (Placeholder)
  exportLppToPdf: async (req, res) => {
    try {
      const { id } = validateWithZod(lppIdValidation, req.params);

      // Get LPP data
      const lpp = await prisma.pertanggungjawaban.findUnique({
        where: { id },
        include: {
          uangMuka: {
            include: {
              purchaseRequest: true,
            },
          },
          details: {
            include: {
              product: true,
              fotoBukti: true,
            },
          },
        },
      });

      if (!lpp) {
        return res.status(404).json({
          success: false,
          message: "LPP tidak ditemukan",
        });
      }

      // TODO: Implement PDF generation logic
      // Untuk sekarang return data yang akan di-export
      res.json({
        success: true,
        message: "PDF export functionality coming soon",
        data: lpp,
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  // 🆕 EXPORT LPP TO EXCEL (Placeholder)
  exportLppToExcel: async (req, res) => {
    try {
      const { id } = validateWithZod(lppIdValidation, req.params);

      // Get LPP data
      const lpp = await prisma.pertanggungjawaban.findUnique({
        where: { id },
        include: {
          uangMuka: {
            include: {
              purchaseRequest: true,
            },
          },
          details: {
            include: {
              product: true,
              fotoBukti: true,
            },
          },
        },
      });

      if (!lpp) {
        return res.status(404).json({
          success: false,
          message: "LPP tidak ditemukan",
        });
      }

      // TODO: Implement Excel generation logic
      res.json({
        success: true,
        message: "Excel export functionality coming soon",
        data: lpp,
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  // 🆕 GET LPP STATISTICS
  getLppStatistics: async (req, res) => {
    try {
      const statistics = await prisma.$transaction(async (tx) => {
        const totalLpp = await tx.pertanggungjawaban.count();
        const totalBiaya = await tx.pertanggungjawaban.aggregate({
          _sum: { totalBiaya: true },
        });
        const statusCounts = await tx.pertanggungjawaban.groupBy({
          by: ["status"],
          _count: { id: true },
        });

        const monthlyStats = await tx.pertanggungjawaban.groupBy({
          by: ["createdAt"],
          _sum: { totalBiaya: true },
          _count: { id: true },
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        });

        return {
          totalLpp,
          totalBiaya: totalBiaya._sum.totalBiaya || 0,
          statusCounts,
          monthlyStats,
        };
      });

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  // READ - Mendapatkan semua LPP (existing)
  getAllLpp: async (req, res) => {
    try {
      // Validasi query parameters
      const validatedQuery = validateWithZod(lppQueryValidation, req.query);

      const { page, limit, status, search } = validatedQuery;
      const skip = (page - 1) * limit;

      const where = {};

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { nomor: { contains: search, mode: "insensitive" } },
          { keterangan: { contains: search, mode: "insensitive" } },
        ];
      }

      const [lppList, total] = await Promise.all([
        prisma.pertanggungjawaban.findMany({
          where,
          include: {
            uangMuka: true,
            details: {
              include: {
                product: true,
                fotoBukti: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: {
            createdAt: "desc",
          },
        }),
        prisma.pertanggungjawaban.count({ where }),
      ]);

      res.json({
        success: true,
        data: lppList,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  // READ - Mendapatkan LPP by ID (existing)
  getLppById: async (req, res) => {
    try {
      const { id } = validateWithZod(lppIdValidation, req.params);

      const lpp = await prisma.pertanggungjawaban.findUnique({
        where: { id },
        include: {
          uangMuka: {
            include: {
              purchaseRequest: true,
            },
          },
          details: {
            include: {
              product: true,
              fotoBukti: true,
              purchaseRequestDetail: {
                include: {
                  product: true,
                },
              },
            },
            orderBy: {
              tanggalTransaksi: "asc",
            },
          },
        },
      });

      if (!lpp) {
        return res.status(404).json({
          success: false,
          message: "LPP tidak ditemukan",
        });
      }

      res.json({
        success: true,
        data: lpp,
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  // UPDATE - Mengupdate LPP (existing)
  updateLpp: async (req, res) => {
    console.log("=== DATA YANG DITERIMA ===", req.body);
    try {
      const { id } = validateWithZod(lppIdValidation, req.params);
      const validatedData = validateWithZod(updateLppValidation, req.body);

      // Cek apakah LPP exists
      const existingLpp = await prisma.pertanggungjawaban.findUnique({
        where: { id },
        include: { details: true },
      });

      if (!existingLpp) {
        return res.status(404).json({
          success: false,
          message: "LPP tidak ditemukan",
        });
      }

      // Pisahkan header & details
      const { details, ...headerData } = validatedData;

      // Update header dulu
      const updatedLpp = await prisma.pertanggungjawaban.update({
        where: { id },
        data: {
          totalBiaya: validatedData.totalBiaya,
          sisaUangDikembalikan: validatedData.sisaUangDikembalikan,
          keterangan: validatedData.keterangan,
          status: validatedData.status,
          uangMukaId: validatedData.uangMukaId,
          details: {
            upsert: validatedData.details.map((d) => ({
              where: { id: d.id ?? "" }, // kalau ada id → update
              update: {
                tanggalTransaksi: new Date(d.tanggalTransaksi),
                keterangan: d.keterangan,
                jumlah: d.jumlah,
                nomorBukti: d.nomorBukti,
                jenisPembayaran: d.jenisPembayaran,
                purchaseRequestDetailId: d.purchaseRequestDetailId,
                productId: d.productId,
              },
              create: {
                tanggalTransaksi: new Date(d.tanggalTransaksi),
                keterangan: d.keterangan,
                jumlah: d.jumlah,
                nomorBukti: d.nomorBukti,
                jenisPembayaran: d.jenisPembayaran,
                purchaseRequestDetailId: d.purchaseRequestDetailId,
                productId: d.productId,
              },
            })),
          },
        },
        include: {
          uangMuka: true,
          details: {
            include: {
              product: true,
              fotoBukti: true,
            },
          },
        },
      });

      res.json({
        success: true,
        message: "LPP berhasil diupdate",
        data: updatedLpp,
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  // DELETE - Menghapus LPP (existing)
  deleteLpp: async (req, res) => {
    try {
      const { id } = validateWithZod(lppIdValidation, req.params);

      // Cek apakah LPP exists
      const existingLpp = await prisma.pertanggungjawaban.findUnique({
        where: { id },
      });

      if (!existingLpp) {
        return res.status(404).json({
          success: false,
          message: "LPP tidak ditemukan",
        });
      }

      await prisma.pertanggungjawaban.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "LPP berhasil dihapus",
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  // UPLOAD - Upload foto bukti untuk detail LPP (existing)
  uploadFotoBukti: async (req, res) => {
    try {
      const { detailId } = validateWithZod(detailIdValidation, req.params);

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Tidak ada file yang diupload",
        });
      }

      // Cek apakah detail exists
      const existingDetail = await prisma.rincianPertanggungjawaban.findUnique({
        where: { id: detailId },
      });

      if (!existingDetail) {
        return res.status(404).json({
          success: false,
          message: "Detail LPP tidak ditemukan",
        });
      }

      const fotoBuktiData = req.files.map((file) => ({
        rincianPjId: detailId,
        url: `/images/lpp/${file.filename}`,
        keterangan:
          req.body.keterangan ||
          `Foto bukti untuk ${existingDetail.keterangan}`,
      }));

      const createdFotoBukti =
        await prisma.fotoBuktiPertanggungjawaban.createMany({
          data: fotoBuktiData,
        });

      // Get the created records with their IDs
      const fotoBuktiList = await prisma.fotoBuktiPertanggungjawaban.findMany({
        where: {
          rincianPjId: detailId,
          url: {
            in: fotoBuktiData.map((foto) => foto.url),
          },
        },
      });

      res.status(201).json({
        success: true,
        message: "Foto bukti berhasil diupload",
        data: fotoBuktiList,
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  // DELETE - Menghapus foto bukti (existing)
  deleteFotoBukti: async (req, res) => {
    try {
      const { fotoId } = validateWithZod(fotoIdValidation, req.params);

      // Cek apakah foto exists
      const existingFoto = await prisma.fotoBuktiPertanggungjawaban.findUnique({
        where: { id: fotoId },
      });

      if (!existingFoto) {
        return res.status(404).json({
          success: false,
          message: "Foto bukti tidak ditemukan",
        });
      }

      // Hapus file dari sistem
      try {
        const filePath = path.join(process.cwd(), "public", existingFoto.url);
        await fs.unlink(filePath);
      } catch (fileError) {
        console.warn(
          "File tidak ditemukan, melanjutkan penghapusan dari database:",
          fileError
        );
      }

      await prisma.fotoBuktiPertanggungjawaban.delete({
        where: { id: fotoId },
      });

      res.json({
        success: true,
        message: "Foto bukti berhasil dihapus",
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  // Tambahkan function ini di lppController.js, sebelum export

  // 🆕 DELETE LPP DETAIL - Menghapus detail LPP
  deleteLppDetail: async (req, res) => {
    try {
      const { detailId } = validateWithZod(detailIdValidation, req.params);

      // Cek apakah detail exists dan ambil data untuk kalkulasi ulang total
      const existingDetail = await prisma.rincianPertanggungjawaban.findUnique({
        where: { id: detailId },
        include: {
          pertanggungjawaban: true,
        },
      });

      if (!existingDetail) {
        return res.status(404).json({
          success: false,
          message: "Detail LPP tidak ditemukan",
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        // 1. Hapus foto bukti terkait terlebih dahulu (jika ada)
        await tx.fotoBuktiPertanggungjawaban.deleteMany({
          where: { rincianPjId: detailId },
        });

        // 2. Hapus detail
        await tx.rincianPertanggungjawaban.delete({
          where: { id: detailId },
        });

        // 3. Update total biaya LPP
        const totalBiayaBaru =
          existingDetail.pertanggungjawaban.totalBiaya - existingDetail.jumlah;
        const sisaUangBaru =
          existingDetail.pertanggungjawaban.sisaUangDikembalikan +
          existingDetail.jumlah;

        const updatedLpp = await tx.pertanggungjawaban.update({
          where: { id: existingDetail.pertanggungjawabanId },
          data: {
            totalBiaya: totalBiayaBaru,
            sisaUangDikembalikan: sisaUangBaru,
          },
          include: {
            details: {
              include: {
                product: true,
                fotoBukti: true,
              },
            },
            uangMuka: true,
          },
        });

        return updatedLpp;
      });

      res.json({
        success: true,
        message: "Detail LPP berhasil dihapus",
        data: {
          deletedDetailId: detailId,
          updatedLpp: result,
        },
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  // UPDATE - Update status LPP (existing)
  updateStatus: async (req, res) => {
    try {
      const { id } = validateWithZod(lppIdValidation, req.params);
      const { status, catatan } = validateWithZod(
        updateStatusValidation,
        req.body
      );

      // Cek apakah LPP exists
      const existingLpp = await prisma.pertanggungjawaban.findUnique({
        where: { id },
      });

      if (!existingLpp) {
        return res.status(404).json({
          success: false,
          message: "LPP tidak ditemukan",
        });
      }

      const updatedLpp = await prisma.pertanggungjawaban.update({
        where: { id },
        data: {
          status,
          keterangan: catatan
            ? `${existingLpp.keterangan || ""}\nCatatan: ${catatan}`.trim()
            : existingLpp.keterangan,
        },
        include: {
          uangMuka: true,
          details: {
            include: {
              product: true,
              fotoBukti: true,
            },
          },
        },
      });

      res.json({
        success: true,
        message: `Status LPP berhasil diupdate menjadi ${status}`,
        data: updatedLpp,
      });
    } catch (error) {
      handleError(error, res);
    }
  },
};
