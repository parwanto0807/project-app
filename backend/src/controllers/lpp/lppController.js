import { PrismaClient } from "../../../prisma/generated/prisma/index.js";
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
} from "../../validations/lppValidation.js";

const prisma = new PrismaClient();

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
    let detailsArray=[];
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
                      keterangan: foto.keterangan || `Bukti ${detail.nomorBukti || ""}`,
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

  // READ - Mendapatkan semua LPP
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

  // READ - Mendapatkan LPP by ID
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

  // UPDATE - Mengupdate LPP
  updateLpp: async (req, res) => {
    try {
      const { id } = validateWithZod(lppIdValidation, req.params);
      const validatedData = validateWithZod(updateLppValidation, req.body);

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
        data: validatedData,
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

  // DELETE - Menghapus LPP
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

  // CREATE - Menambah detail ke LPP
  addDetail: async (req, res) => {
    try {
      const { id } = validateWithZod(lppIdValidation, req.params);
      const validatedData = validateWithZod(addDetailValidation, req.body);

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

      const detail = await prisma.rincianPertanggungjawaban.create({
        data: {
          ...validatedData,
          pertanggungjawabanId: id,
        },
        include: {
          product: true,
          fotoBukti: true,
        },
      });

      res.status(201).json({
        success: true,
        message: "Detail berhasil ditambahkan",
        data: detail,
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  // UPDATE - Mengupdate detail LPP
  updateDetail: async (req, res) => {
    try {
      const { detailId } = validateWithZod(detailIdValidation, req.params);
      const validatedData = validateWithZod(updateDetailValidation, req.body);

      const updatedDetail = await prisma.rincianPertanggungjawaban.update({
        where: { id: detailId },
        data: validatedData,
        include: {
          product: true,
          fotoBukti: true,
        },
      });

      res.json({
        success: true,
        message: "Detail berhasil diupdate",
        data: updatedDetail,
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  // DELETE - Menghapus detail LPP
  deleteDetail: async (req, res) => {
    try {
      const { detailId } = validateWithZod(detailIdValidation, req.params);

      await prisma.rincianPertanggungjawaban.delete({
        where: { id: detailId },
      });

      res.json({
        success: true,
        message: "Detail berhasil dihapus",
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  // UPLOAD - Upload foto bukti untuk detail LPP
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

  // DELETE - Menghapus foto bukti
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

  // UPDATE - Update status LPP
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
