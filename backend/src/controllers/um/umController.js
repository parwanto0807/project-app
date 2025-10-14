import { PrismaClient } from "../../../prisma/generated/prisma/index.js";
import { generateUangMukaNumber } from "../../utils/umGenerateNumber.js";
import { UangMukaStatus } from "../../../prisma/generated/prisma/client.js";
import {
  createUangMukaValidation,
  updateUangMukaValidation,
  updateStatusValidation,
  uangMukaIdValidation,
  uangMukaQueryValidation,
} from "../../validations/umValidation.js";
import fs from "fs";
import { deleteFinanceFile } from "../../utils/deleteFileImage.js";

const prisma = new PrismaClient();

export const uangMukaController = {
  async getAllUangMuka(req, res, next) {
    try {
      // Validasi query parameters dengan Zod
      const validationResult = uangMukaQueryValidation.safeParse(req.query);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: validationResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      const {
        page,
        limit,
        search,
        status,
        metodePencairan,
        karyawanId,
        spkId,
        startDate,
        endDate,
      } = validationResult.data;

      const skip = (page - 1) * limit;

      // Build where clause
      const where = {};

      if (search) {
        where.OR = [
          { nomor: { contains: search, mode: "insensitive" } },
          { keterangan: { contains: search, mode: "insensitive" } },
          {
            karyawan: {
              namaLengkap: { contains: search, mode: "insensitive" },
            },
          },
        ];
      }

      if (status) {
        where.status = status;
      }

      if (metodePencairan) {
        where.metodePencairan = metodePencairan;
      }

      if (karyawanId) {
        where.karyawanId = karyawanId;
      }

      if (spkId) {
        where.spkId = spkId;
      }

      if (startDate || endDate) {
        where.tanggalPengajuan = {};
        if (startDate) {
          where.tanggalPengajuan.gte = new Date(startDate);
        }
        if (endDate) {
          where.tanggalPengajuan.lte = new Date(endDate);
        }
      }

      // Get uang muka dengan relations
      const [uangMukaList, totalCount] = await Promise.all([
        prisma.uangMuka.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            karyawan: {
              select: {
                id: true,
                namaLengkap: true,
              },
            },
            spk: {
              select: {
                id: true,
                spkNumber: true,
                salesOrder: {
                  select: {
                    id: true,
                    soNumber: true,
                    project: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
            purchaseRequest: {
              select: {
                id: true,
                nomorPr: true,
                keterangan: true,
              },
            },
            pertanggungjawaban: {
              select: {
                id: true,
                nomor: true,
              },
            },
          },
        }),
        prisma.uangMuka.count({ where }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        data: uangMukaList,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getUangMukaById(req, res, next) {
    try {
      // Validasi params dengan Zod
      const validationResult = uangMukaIdValidation.safeParse(req.params);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: validationResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      const { id } = validationResult.data;

      const uangMuka = await prisma.uangMuka.findUnique({
        where: { id },
        include: {
          karyawan: {
            select: {
              id: true,
              namaLengkap: true,
              department: true,
              position: true,
            },
          },
          spk: {
            select: {
              id: true,
              spkNumber: true,
              project: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          purchaseRequest: {
            select: {
              id: true,
              nomorPr: true,
              keterangan: true,
              status: true,
              details: {
                select: {
                  id: true,
                  catatanItem: true,
                  jumlah: true,
                  satuan: true,
                  estimasiHargaSatuan: true,
                  estimasiTotalHarga: true,
                },
              },
            },
          },
          pertanggungjawaban: {
            select: {
              id: true,
              nomor: true,
              status: true,
              tanggalPengajuan: true,
              totalBiaya: true,
            },
          },
        },
      });

      if (!uangMuka) {
        return res.status(404).json({
          success: false,
          message: "Uang muka tidak ditemukan",
        });
      }

      res.json({
        success: true,
        data: uangMuka,
      });
    } catch (error) {
      next(error);
    }
  },

async createUangMuka(req, res, next) {
    try {
      // Handle file upload jika ada
      let buktiPencairanUrl = null;
      if (req.file) {
        const baseUrl = process.env.BASE_URL || "http://localhost:3000";
        buktiPencairanUrl = `/images/finance/${req.file.filename}`;
      }

      if (req.body.jumlah) {
        req.body.jumlah = Number(req.body.jumlah);
      }
      // Validasi body dengan Zod (gabungkan dengan file URL)
      const validationResult = createUangMukaValidation.safeParse({
        ...req.body,
        buktiPencairanUrl: buktiPencairanUrl || undefined,
      });

      if (!validationResult.success) {
        // Delete uploaded file jika validasi gagal
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: validationResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      const {
        tanggalPengajuan,
        tanggalPencairan,
        jumlah,
        keterangan,
        purchaseRequestId,
        karyawanId,
        spkId,
        metodePencairan,
        namaBankTujuan,
        nomorRekeningTujuan,
        namaEwalletTujuan,
      } = validationResult.data;

      // Validasi relasi
      const [karyawan, spk, existingPR] = await Promise.all([
        prisma.karyawan.findUnique({ where: { id: karyawanId } }),
        prisma.sPK.findUnique({ where: { id: spkId } }),
        purchaseRequestId
          ? prisma.purchaseRequest.findUnique({
              where: { id: purchaseRequestId },
              include: { uangMuka: true },
            })
          : Promise.resolve(null),
      ]);

      if (!karyawan) {
        // Delete uploaded file jika validasi relasi gagal
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: "Karyawan tidak ditemukan",
        });
      }

      if (!spk) {
        // Delete uploaded file jika validasi relasi gagal
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: "SPK tidak ditemukan",
        });
      }

      // Cek jika PR sudah memiliki uang muka
      if (existingPR && existingPR.uangMuka.length > 0) {
        // Delete uploaded file jika validasi relasi gagal
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: "Purchase request ini sudah memiliki uang muka",
        });
      }

      // Generate nomor uang muka
      const nomor = await generateUangMukaNumber();

      // Tentukan status berdasarkan apakah langsung dicairkan
      const status = tanggalPencairan
        ? UangMukaStatus.DISBURSED
        : UangMukaStatus.PENDING;

      // Gunakan transaction untuk memastikan konsistensi data
      const result = await prisma.$transaction(async (prisma) => {
        // Create uang muka
        const uangMuka = await prisma.uangMuka.create({
          data: {
            nomor,
            tanggalPengajuan: tanggalPengajuan || new Date(),
            tanggalPencairan,
            jumlah,
            keterangan,
            buktiPencairanUrl,
            status,
            purchaseRequestId: purchaseRequestId || null,
            karyawanId,
            spkId,
            metodePencairan,
            namaBankTujuan,
            nomorRekeningTujuan,
            namaEwalletTujuan,
          },
          include: {
            karyawan: {
              select: {
                id: true,
                namaLengkap: true,
              },
            },
            spk: {
              select: {
                id: true,
                spkNumber: true,
                project: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            purchaseRequest: {
              select: {
                id: true,
                nomorPr: true,
              },
            },
          },
        });

        // Update purchase request status jika status uang muka = DISBURSED
        if (status === UangMukaStatus.DISBURSED && purchaseRequestId) {
          await prisma.purchaseRequest.update({
            where: { id: purchaseRequestId },
            data: { status: "COMPLETED" },
          });
        }

        return uangMuka;
      });

      res.status(201).json({
        success: true,
        message: "Uang muka berhasil dibuat",
        data: result,
      });
    } catch (error) {
      // Delete uploaded file jika ada error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  },

  async updateUangMuka(req, res, next) {
    try {
      // Validasi params dengan Zod
      const paramsValidation = uangMukaIdValidation.safeParse(req.params);
      if (!paramsValidation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: paramsValidation.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      // Validasi body dengan Zod
      const bodyValidation = updateUangMukaValidation.safeParse(req.body);
      if (!bodyValidation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: bodyValidation.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      const { id } = paramsValidation.data;
      const updateData = bodyValidation.data;

      // Cek apakah uang muka exists
      const existingUangMuka = await prisma.uangMuka.findUnique({
        where: { id },
      });

      if (!existingUangMuka) {
        return res.status(404).json({
          success: false,
          message: "Uang muka tidak ditemukan",
        });
      }

      // Validasi relasi jika diupdate
      if (updateData.karyawanId) {
        const karyawan = await prisma.karyawan.findUnique({
          where: { id: updateData.karyawanId },
        });
        if (!karyawan) {
          return res.status(400).json({
            success: false,
            message: "Karyawan tidak ditemukan",
          });
        }
      }

      if (updateData.spkId) {
        const spk = await prisma.sPK.findUnique({
          where: { id: updateData.spkId },
        });
        if (!spk) {
          return res.status(400).json({
            success: false,
            message: "SPK tidak ditemukan",
          });
        }
      }

      if (updateData.purchaseRequestId) {
        const existingPR = await prisma.purchaseRequest.findUnique({
          where: { id: updateData.purchaseRequestId },
          include: { uangMuka: true },
        });

        if (!existingPR) {
          return res.status(400).json({
            success: false,
            message: "Purchase request tidak ditemukan",
          });
        }

        // Cek jika PR sudah memiliki uang muka lain
        if (existingPR.uangMuka && existingPR.uangMuka.id !== id) {
          return res.status(400).json({
            success: false,
            message: "Purchase request ini sudah memiliki uang muka",
          });
        }
      }

      // Handle status dan tanggal pencairan
      if (
        updateData.status === UangMukaStatus.DISBURSED &&
        !updateData.tanggalPencairan
      ) {
        updateData.tanggalPencairan = new Date();
      }

      const uangMuka = await prisma.uangMuka.update({
        where: { id },
        data: updateData,
        include: {
          karyawan: {
            select: {
              id: true,
              namaLengkap: true,
            },
          },
          spk: {
            select: {
              id: true,
              spkNumber: true,
              project: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          purchaseRequest: {
            select: {
              id: true,
              nomorPr: true,
            },
          },
        },
      });

      res.json({
        success: true,
        message: "Uang muka berhasil diupdate",
        data: uangMuka,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateUangMukaStatus(req, res, next) {
    console.log("Data Received", req.body);

    try {
      // Validasi params dengan Zod
      const paramsValidation = uangMukaIdValidation.safeParse(req.params);
      if (!paramsValidation.success) {
        // Delete uploaded file jika validasi gagal
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: paramsValidation.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      // Validasi body dengan Zod
      const bodyValidation = updateStatusValidation.safeParse({
        ...req.body,
        buktiPencairanUrl: req.file
          ? `/images/finance/${req.file.filename}`
          : undefined,
      });

      if (!bodyValidation.success) {
        // Delete uploaded file jika validasi gagal
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: bodyValidation.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      const { id } = paramsValidation.data;
      const {
        status,
        tanggalPencairan,
        buktiPencairanUrl,
        metodePencairan,
        namaBankTujuan,
        nomorRekeningTujuan,
        namaEwalletTujuan,
      } = bodyValidation.data;

      const existingUangMuka = await prisma.uangMuka.findUnique({
        where: { id },
        include: {
          purchaseRequest: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });

      if (!existingUangMuka) {
        // Delete uploaded file jika uang muka tidak ditemukan
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({
          success: false,
          message: "Uang muka tidak ditemukan",
        });
      }

      // Build update data
      const updateData = {
        status,
        metodePencairan,
        namaBankTujuan,
        nomorRekeningTujuan,
        namaEwalletTujuan,
        ...(status === UangMukaStatus.DISBURSED && {
          tanggalPencairan: tanggalPencairan || new Date(),
        }),
        ...(buktiPencairanUrl && { buktiPencairanUrl }),
      };

      // Start transaction untuk update uang muka dan purchase request
      const [uangMuka] = await prisma.$transaction([
        // Update uang muka
        prisma.uangMuka.update({
          where: { id },
          data: updateData,
          include: {
            karyawan: {
              select: {
                id: true,
                namaLengkap: true,
              },
            },
            spk: {
              select: {
                id: true,
                spkNumber: true,
                project: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        }),

        // Update purchase request status jika status uang muka = DISBURSED
        ...(status === UangMukaStatus.DISBURSED &&
        existingUangMuka.purchaseRequest
          ? [
              prisma.purchaseRequest.update({
                where: { id: existingUangMuka.purchaseRequest.id },
                data: { status: "COMPLETED" },
              }),
            ]
          : []),
      ]);

      res.json({
        success: true,
        message: `Status uang muka berhasil diupdate menjadi ${status}`,
        data: uangMuka,
      });
    } catch (error) {
      // Delete uploaded file jika ada error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  },

  async deleteUangMuka(req, res, next) {
    try {
      // Validasi params dengan Zod
      const validationResult = uangMukaIdValidation.safeParse(req.params);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: validationResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      const { id } = validationResult.data;

      const existingUangMuka = await prisma.uangMuka.findUnique({
        where: { id },
        include: {
          pertanggungjawaban: true,
        },
      });

      if (!existingUangMuka) {
        return res.status(404).json({
          success: false,
          message: "Uang muka tidak ditemukan",
        });
      }

      // Cek jika sudah ada pertanggungjawaban
      if (existingUangMuka.pertanggungjawaban) {
        return res.status(400).json({
          success: false,
          message:
            "Tidak dapat menghapus uang muka yang sudah memiliki pertanggungjawaban",
        });
      }

      // Hapus file image jika ada
      if (existingUangMuka.buktiPencairanUrl) {
        await deleteFinanceFile(existingUangMuka.buktiPencairanUrl);
      }

      // Hapus data dari database
      await prisma.uangMuka.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "Uang muka dan file berhasil dihapus",
      });
    } catch (error) {
      console.error("Error deleting uang muka:", error);
      next(error);
    }
  },

  async getUangMukaByKaryawan(req, res, next) {
    try {
      // Validasi params dengan Zod
      const paramsValidation = uangMukaIdValidation.safeParse(req.params);
      if (!paramsValidation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: paramsValidation.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      // Validasi query dengan Zod
      const queryValidation = uangMukaQueryValidation.safeParse(req.query);
      if (!queryValidation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: queryValidation.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      const { id: karyawanId } = paramsValidation.data;
      const { page, limit, status, metodePencairan } = queryValidation.data;

      const skip = (page - 1) * limit;

      const where = { karyawanId };
      if (status) {
        where.status = status;
      }
      if (metodePencairan) {
        where.metodePencairan = metodePencairan;
      }

      const [uangMukaList, totalCount] = await Promise.all([
        prisma.uangMuka.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            spk: {
              select: {
                id: true,
                spkNumber: true,
                project: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            purchaseRequest: {
              select: {
                id: true,
                nomorPr: true,
              },
            },
            pertanggungjawaban: {
              select: {
                id: true,
                nomor: true,
                status: true,
              },
            },
          },
        }),
        prisma.uangMuka.count({ where }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        data: uangMukaList,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
