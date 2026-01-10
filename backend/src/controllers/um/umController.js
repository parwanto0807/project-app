// import { PrismaClient } from "../../../prisma/generated/prisma/index.js";
import { prisma } from "../../config/db.js";
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

// const prisma = new PrismaClient();

export const uangMukaController = {
  async getAllUangMuka(req, res, next) {
    try {
      // Validasi query parameters
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

      if (status) where.status = status;
      if (metodePencairan) where.metodePencairan = metodePencairan;
      if (karyawanId) where.karyawanId = karyawanId;
      if (spkId) where.spkId = spkId;

      if (startDate || endDate) {
        where.tanggalPengajuan = {};
        if (startDate) where.tanggalPengajuan.gte = new Date(startDate);
        if (endDate) where.tanggalPengajuan.lte = new Date(endDate);
      }

      // Query database
      const [uangMukaList, totalCount] = await Promise.all([
        prisma.uangMuka.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            karyawan: { select: { id: true, namaLengkap: true } },
            spk: {
              select: {
                id: true,
                spkNumber: true,
                salesOrder: {
                  select: {
                    id: true,
                    soNumber: true,
                    project: { select: { id: true, name: true } },
                  },
                },
              },
            },
            purchaseRequest: {
              select: { id: true, nomorPr: true, keterangan: true },
            },
            pertanggungjawaban: {
              select: { id: true, nomor: true },
            },
          },
        }),
        prisma.uangMuka.count({ where }),
      ]);

      // 🔥 Aman untuk semua jenis data
      const formattedList = uangMukaList.map((item) => {
        let bukti = [];

        try {
          if (item.buktiPencairanUrl) {
            // Jika JSON Valid → parse
            if (
              item.buktiPencairanUrl.trim().startsWith("[") &&
              item.buktiPencairanUrl.trim().endsWith("]")
            ) {
              bukti = JSON.parse(item.buktiPencairanUrl);
            }
            // Jika multi string dipisah koma
            else if (item.buktiPencairanUrl.includes(",")) {
              bukti = item.buktiPencairanUrl.split(",").map((v) => v.trim());
            }
            // Jika single string
            else {
              bukti = [item.buktiPencairanUrl.trim()];
            }
          }
        } catch (err) {
          // Jika parsing gagal → fallback string tunggal
          bukti = [item.buktiPencairanUrl];
        }

        return {
          ...item,
          buktiPencairanUrl: bukti,
        };
      });

      res.json({
        success: true,
        data: formattedList,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
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

      // 🟣 Parse buktiPencairanUrl dari JSON string → array
      let buktiPencairanUrl = [];
      if (uangMuka.buktiPencairanUrl) {
        try {
          buktiPencairanUrl = JSON.parse(uangMuka.buktiPencairanUrl);
        } catch {
          buktiPencairanUrl = [];
        }
      }

      res.json({
        success: true,
        data: {
          ...uangMuka,
          buktiPencairanUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async createUangMuka(req, res, next) {
    try {
      // -----------------------------
      // HANDLE UPLOAD (multi/single)
      // -----------------------------
      let buktiPencairanArray = [];

      // Jika multiple upload: req.files (multer.array)
      if (req.files && req.files.length > 0) {
        const baseUrl = process.env.BASE_URL || "http://localhost:3000";
        buktiPencairanArray = req.files.map(
          (file) => `/images/finance/${file.filename}`
        );
      }

      // Jika masih pakai single upload
      if (req.file) {
        const baseUrl = process.env.BASE_URL || "http://localhost:3000";
        buktiPencairanArray.push(`/images/finance/${req.file.filename}`);
      }

      // Ubah ke JSON string agar bisa disimpan di 1 field String
      const buktiPencairanUrl =
        buktiPencairanArray.length > 0
          ? JSON.stringify(buktiPencairanArray)
          : null;

      // -----------------------------
      // NORMALISASI BODY
      // -----------------------------
      if (req.body.jumlah) {
        req.body.jumlah = Number(req.body.jumlah);
      }

      // -----------------------------
      // VALIDASI BODY + FILE
      // -----------------------------
      const validationResult = createUangMukaValidation.safeParse({
        ...req.body,
        buktiPencairanUrl:
          buktiPencairanArray.length > 0 ? buktiPencairanArray : undefined,
      });

      if (!validationResult.success) {
        // Hapus file ketika gagal
        if (req.files) {
          req.files.forEach((f) => fs.unlinkSync(f.path));
        }
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
        accountPencairanId,
      } = validationResult.data;

      // -----------------------------
      // CEK RELASI
      // -----------------------------
      const [karyawan, spk, existingPR] = await Promise.all([
        prisma.karyawan.findUnique({ where: { id: karyawanId } }),
        spkId ? prisma.sPK.findUnique({ where: { id: spkId } }) : Promise.resolve(null),
        purchaseRequestId
          ? prisma.purchaseRequest.findUnique({
              where: { id: purchaseRequestId },
              include: { uangMuka: true },
            })
          : Promise.resolve(null),
      ]);

      if (!karyawan) {
        if (req.files) req.files.forEach((f) => fs.unlinkSync(f.path));
        if (req.file) fs.unlinkSync(req.file.path);
        return res
          .status(400)
          .json({ success: false, message: "Karyawan tidak ditemukan" });
      }

      // Only check SPK if spkId is provided
      if (spkId && !spk) {
        if (req.files) req.files.forEach((f) => fs.unlinkSync(f.path));
        if (req.file) fs.unlinkSync(req.file.path);
        return res
          .status(400)
          .json({ success: false, message: "SPK tidak ditemukan" });
      }

      // Cek jika PR sudah ada uang mukanya
      if (existingPR && existingPR.uangMuka.length > 0) {
        if (req.files) req.files.forEach((f) => fs.unlinkSync(f.path));
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: "Biaya Purchase request ini sudah diajukan",
        });
      }

      // -----------------------------
      // GENERATE NOMOR
      // -----------------------------
      const nomor = await generateUangMukaNumber();

      // Set status to DISBURSED if spkId exists, otherwise check tanggalPencairan
      const status = spkId 
        ? UangMukaStatus.DISBURSED
        : (tanggalPencairan ? UangMukaStatus.DISBURSED : UangMukaStatus.PENDING);

      // -----------------------------
      // CREATE (TRANSACTION)
      // -----------------------------
      const result = await prisma.$transaction(async (prismaTx) => {
        const uangMuka = await prismaTx.uangMuka.create({
          data: {
            nomor,
            tanggalPengajuan: tanggalPengajuan || new Date(),
            tanggalPencairan,
            jumlah,
            keterangan,
            buktiPencairanUrl, // <-- JSON string!!
            status,
            purchaseRequestId: purchaseRequestId || null,
            karyawanId,
            spkId: spkId || null,
            metodePencairan,
            namaBankTujuan,
            nomorRekeningTujuan,
            namaEwalletTujuan,
            accountPencairanId: accountPencairanId || null,
          },
          include: {
            karyawan: { select: { id: true, namaLengkap: true } },
            spk: {
              select: {
                id: true,
                spkNumber: true,
                project: { select: { id: true, name: true } },
              },
            },
            purchaseRequest: { select: { id: true, nomorPr: true } },
          },
        });

        // Jika langsung cair → PR completed
        if (status === UangMukaStatus.DISBURSED && purchaseRequestId) {
          await prismaTx.purchaseRequest.update({
            where: { id: purchaseRequestId },
            data: { status: "COMPLETED" },
          });
        }

        // ✅ LOGIKA BARU: Jika spkId = null/kosong DAN status = DISBURSED
        // Maka tambahkan record di StaffBalance dan StaffLedger
        if (!spkId && status === UangMukaStatus.DISBURSED) {
          // 1. Cari atau buat StaffBalance untuk kategori OPERASIONAL_PROYEK
          const existingBalance = await prismaTx.staffBalance.findUnique({
            where: {
              karyawanId_category: {
                karyawanId,
                category: "OPERASIONAL_PROYEK",
              },
            },
          });

          const currentBalance = existingBalance ? Number(existingBalance.amount) : 0;
          const currentTotalIn = existingBalance ? Number(existingBalance.totalIn) : 0;
          const currentTotalOut = existingBalance ? Number(existingBalance.totalOut) : 0;
          
          const newBalance = currentBalance + Number(jumlah);
          const newTotalIn = currentTotalIn + Number(jumlah);

          // Upsert StaffBalance (update jika ada, create jika tidak)
          await prismaTx.staffBalance.upsert({
            where: {
              karyawanId_category: {
                karyawanId,
                category: "OPERASIONAL_PROYEK",
              },
            },
            update: {
              amount: newBalance,
              totalIn: newTotalIn,
            },
            create: {
              karyawanId,
              category: "OPERASIONAL_PROYEK",
              amount: jumlah,
              totalIn: jumlah,
              totalOut: 0,
            },
          });

          // 2. Tambahkan record di StaffLedger
          await prismaTx.staffLedger.create({
            data: {
              karyawanId,
              tanggal: tanggalPencairan || new Date(),
              keterangan: keterangan || `Pencairan uang muka ${nomor}`,
              saldoAwal: currentBalance, // Saldo sebelum transaksi
              debit: jumlah, // Uang bertambah bagi karyawan
              kredit: 0,
              saldo: newBalance, // Running balance setelah transaksi
              category: "OPERASIONAL_PROYEK",
              type: "CASH_ADVANCE",
              purchaseRequestId: purchaseRequestId || null,
              refId: uangMuka.id, // ID UangMuka sebagai referensi
              createdBy: req.user?.id || "SYSTEM", // Ambil dari user yang login
            },
          });
        }

        return uangMuka;
      });

      res.status(201).json({
        success: true,
        message: "Uang muka berhasil dibuat",
        data: {
          ...result,
          buktiPencairanUrl: buktiPencairanArray, // kirim array, bukan JSON string
        },
      });
    } catch (error) {
      // Hapus file jika terjadi error besar
      if (req.files) req.files.forEach((f) => fs.unlinkSync(f.path));
      if (req.file) fs.unlinkSync(req.file.path);

      next(error);
    }
  },

  async updateUangMuka(req, res, next) {
    try {
      // Validasi params
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

      // Handle upload gambar baru (opsional)
      let uploadedImages = null;
      if (req.files && req.files.length > 0) {
        const baseUrl = process.env.BASE_URL || "http://localhost:3000";
        uploadedImages = req.files.map(
          (file) => `/images/finance/${file.filename}`
        );
      }

      // body validation dulu
      const bodyValidation = updateUangMukaValidation.safeParse({
        ...req.body,
        buktiPencairanUrl: req.body.buktiPencairanUrl || undefined,
      });

      if (!bodyValidation.success) {
        // Hapus file jika upload gagal validasi
        if (req.files) {
          req.files.forEach((file) => fs.unlinkSync(file.path));
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
      let updateData = bodyValidation.data;

      // Ambil data existing
      const existingUangMuka = await prisma.uangMuka.findUnique({
        where: { id },
      });

      if (!existingUangMuka) {
        return res.status(404).json({
          success: false,
          message: "Uang muka tidak ditemukan",
        });
      }

      // Jika ada upload baru → gabungkan atau timpa total
      if (uploadedImages) {
        // Jika user mengirim "replace": true → timpa semua gambar
        if (req.body.replace === "true") {
          updateData.buktiPencairanUrl = JSON.stringify(uploadedImages);
        } else {
          // Jika tidak → tambahkan ke list lama
          const oldImages = existingUangMuka.buktiPencairanUrl
            ? JSON.parse(existingUangMuka.buktiPencairanUrl)
            : [];

          const merged = [...oldImages, ...uploadedImages];
          updateData.buktiPencairanUrl = JSON.stringify(merged);
        }
      } else if (updateData.buktiPencairanUrl) {
        // Jika hanya diupdate tanpa upload → pastikan tetap JSON string
        updateData.buktiPencairanUrl = JSON.stringify(
          JSON.parse(updateData.buktiPencairanUrl)
        );
      }

      // Atur tanggal otomatis saat status DISBURSED
      if (
        updateData.status === UangMukaStatus.DISBURSED &&
        !updateData.tanggalPencairan
      ) {
        updateData.tanggalPencairan = new Date();
      }

      // Update database
      const uangMuka = await prisma.uangMuka.update({
        where: { id },
        data: updateData,
        include: {
          karyawan: { select: { id: true, namaLengkap: true } },
          spk: {
            select: {
              id: true,
              spkNumber: true,
              project: { select: { id: true, name: true } },
            },
          },
          purchaseRequest: { select: { id: true, nomorPr: true } },
        },
      });

      return res.json({
        success: true,
        message: "Uang muka berhasil diupdate",
        data: uangMuka,
      });
    } catch (error) {
      // jika error → hapus file
      if (req.files) {
        req.files.forEach((file) => fs.unlinkSync(file.path));
      }
      next(error);
    }
  },

  async updateUangMukaStatus(req, res, next) {
    console.log("Data Received", req.body);

    try {
      // 1. Validasi params
      const paramsValidation = uangMukaIdValidation.safeParse(req.params);
      if (!paramsValidation.success) {
        if (req.files) req.files.forEach((f) => fs.unlinkSync(f.path));
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: paramsValidation.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      // 2. Kumpulkan gambar upload (support multiple)
      let uploadedImages = null;
      if (req.files && req.files.length > 0) {
        uploadedImages = req.files.map(
          (file) => `/images/finance/${file.filename}`
        );
      }

      // 3. Validasi body Zod
      const bodyValidation = updateStatusValidation.safeParse({
        ...req.body,
        buktiPencairanUrl: req.body.buktiPencairanUrl || undefined,
      });

      if (!bodyValidation.success) {
        if (req.files) req.files.forEach((f) => fs.unlinkSync(f.path));
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
        replaceImages, // opsional: true | false
        accountPencairanId,
      } = bodyValidation.data;

      // 4. Ambil data existing
      const existingUangMuka = await prisma.uangMuka.findUnique({
        where: { id },
        include: {
          purchaseRequest: { select: { id: true, status: true } },
        },
      });

      if (!existingUangMuka) {
        if (req.files) req.files.forEach((f) => fs.unlinkSync(f.path));
        return res.status(404).json({
          success: false,
          message: "Uang muka tidak ditemukan",
        });
      }

      // 5. Build updateData
      let finalImages = null;

      // Jika ada upload baru
      if (uploadedImages) {
        if (replaceImages === "true") {
          finalImages = uploadedImages; // timpa total
        } else {
          // merge dengan lama
          const oldList = existingUangMuka.buktiPencairanUrl
            ? JSON.parse(existingUangMuka.buktiPencairanUrl)
            : [];
          finalImages = [...oldList, ...uploadedImages];
        }
      } else if (buktiPencairanUrl) {
        // raw string from form → convert ke array
        finalImages = JSON.parse(buktiPencairanUrl);
      }

      const updateData = {
        status,
        metodePencairan,
        namaBankTujuan,
        nomorRekeningTujuan,
        namaEwalletTujuan,
        ...(status === UangMukaStatus.DISBURSED && {
          tanggalPencairan: tanggalPencairan || new Date(),
        }),
        ...(finalImages && {
          buktiPencairanUrl: JSON.stringify(finalImages),
        }),
        accountPencairanId: accountPencairanId || null,
      };

      // 6. Transaction update
      const result = await prisma.$transaction(async (prismaTx) => {
        const uangMuka = await prismaTx.uangMuka.update({
          where: { id },
          data: updateData,
          include: {
            karyawan: { select: { id: true, namaLengkap: true } },
            spk: {
              select: {
                id: true,
                spkNumber: true,
                project: { select: { id: true, name: true } },
              },
            },
          },
        });

        // Update PR status jika ada
        if (status === UangMukaStatus.DISBURSED && existingUangMuka.purchaseRequest) {
          await prismaTx.purchaseRequest.update({
            where: { id: existingUangMuka.purchaseRequest.id },
            data: { 
              status: "COMPLETED",
              accountPencairanId: accountPencairanId || null
            },
          });
        }

        // ✅ LOGIKA BARU: Jika spkId = null/kosong DAN status berubah menjadi DISBURSED
        // DAN sebelumnya belum DISBURSED (untuk menghindari duplikasi)
        if (
          !existingUangMuka.spkId &&
          status === UangMukaStatus.DISBURSED &&
          existingUangMuka.status !== UangMukaStatus.DISBURSED
        ) {
          // 1. Cari atau buat StaffBalance untuk kategori OPERASIONAL_PROYEK
          const existingBalance = await prismaTx.staffBalance.findUnique({
            where: {
              karyawanId_category: {
                karyawanId: existingUangMuka.karyawanId,
                category: "OPERASIONAL_PROYEK",
              },
            },
          });

          const currentBalance = existingBalance ? Number(existingBalance.amount) : 0;
          const currentTotalIn = existingBalance ? Number(existingBalance.totalIn) : 0;
          const currentTotalOut = existingBalance ? Number(existingBalance.totalOut) : 0;
          
          const newBalance = currentBalance + Number(existingUangMuka.jumlah);
          const newTotalIn = currentTotalIn + Number(existingUangMuka.jumlah);

          // Upsert StaffBalance (update jika ada, create jika tidak)
          await prismaTx.staffBalance.upsert({
            where: {
              karyawanId_category: {
                karyawanId: existingUangMuka.karyawanId,
                category: "OPERASIONAL_PROYEK",
              },
            },
            update: {
              amount: newBalance,
              totalIn: newTotalIn,
            },
            create: {
              karyawanId: existingUangMuka.karyawanId,
              category: "OPERASIONAL_PROYEK",
              amount: existingUangMuka.jumlah,
              totalIn: existingUangMuka.jumlah,
              totalOut: 0,
            },
          });

          // 2. Tambahkan record di StaffLedger
          await prismaTx.staffLedger.create({
            data: {
              karyawanId: existingUangMuka.karyawanId,
              tanggal: tanggalPencairan || new Date(),
              keterangan: existingUangMuka.keterangan || `Pencairan uang muka ${existingUangMuka.nomor}`,
              saldoAwal: currentBalance, // Saldo sebelum transaksi
              debit: existingUangMuka.jumlah, // Uang bertambah bagi karyawan
              kredit: 0,
              saldo: newBalance, // Running balance setelah transaksi
              category: "OPERASIONAL_PROYEK",
              type: "CASH_ADVANCE",
              purchaseRequestId: existingUangMuka.purchaseRequestId || null,
              refId: existingUangMuka.id, // ID UangMuka sebagai referensi
              createdBy: req.user?.id || "SYSTEM", // Ambil dari user yang login
            },
          });

          // 3. LOGIKA AKUNTANSI: Generate Jurnal Otomatis
          const effectiveDate = tanggalPencairan || new Date();
          
          // A. Dapatkan Periode Akuntansi yang Terbuka
          const period = await prismaTx.accountingPeriod.findFirst({
            where: {
              startDate: { lte: effectiveDate },
              endDate: { gte: effectiveDate },
              isClosed: false
            }
          });

          if (!period) {
            throw new Error(`Tidak ada periode akuntansi terbuka untuk tanggal ${effectiveDate.toISOString().split('T')[0]}`);
          }

          // B. Dapatkan Akun STAFF_ADVANCE (Uang Muka Kerja Staff) dari System Account
          const staffAdvanceAccount = await prismaTx.systemAccount.findUnique({
            where: { key: 'STAFF_ADVANCE' },
            include: { coa: true }
          });

          if (!staffAdvanceAccount || !staffAdvanceAccount.coa) {
            throw new Error("Pemetaan akun sistem 'STAFF_ADVANCE' tidak ditemukan. Mohon konfigurasi di Mapping Akun Sistem.");
          }

          // C. Tentukan Akun Kas/Bank (Kredit)
          const targetCoaId = accountPencairanId || existingUangMuka.accountPencairanId;
          if (!targetCoaId) {
            throw new Error("Akun sumber pencairan (Kas/Bank) harus ditentukan untuk mencatat jurnal.");
          }

          // C2. VALIDASI SALDO: Cek apakah saldo Kas/Bank mencukupi
          const disbursementAmount = Number(existingUangMuka.jumlah);
          const sourceAccount = await prismaTx.chartOfAccounts.findUnique({
            where: { id: targetCoaId },
            include: {
              TrialBalance: {
                where: { periodId: period.id }
              }
            }
          });

          if (sourceAccount && sourceAccount.TrialBalance.length > 0) {
            const tb = sourceAccount.TrialBalance[0];
            const currentBalance = Number(tb.endingDebit) - Number(tb.endingCredit);

            if (currentBalance < disbursementAmount) {
              const formattedBalance = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(currentBalance);
              const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(disbursementAmount);
              throw new Error(`Saldo tidak mencukupi pada akun ${sourceAccount.name}. Saldo saat ini: ${formattedBalance}, Jumlah pencairan: ${formattedAmount}`);
            }
          } else {
            // Jika belum ada TrialBalance, berarti saldo masih 0
            throw new Error(`Tidak dapat mencairkan dana. Akun ${sourceAccount?.name || 'Kas/Bank'} belum memiliki saldo awal atau transaksi di periode ini.`);
          }

          // D. Buat Ledger Header
          const ledgerNumber = `JV-UM-${existingUangMuka.nomor.replace(/\//g, '-')}`;
          const ledger = await prismaTx.ledger.create({
            data: {
              ledgerNumber,
              referenceNumber: existingUangMuka.nomor,
              referenceType: 'PAYMENT',
              transactionDate: effectiveDate,
              postingDate: new Date(),
              description: `Pencairan Uang Muka #${existingUangMuka.nomor} - ${existingUangMuka.karyawan?.namaLengkap || 'Staff'}`,
              periodId: period.id,
              status: 'POSTED',
              currency: 'IDR',
              exchangeRate: 1.0,
              createdBy: req.user?.id || 'SYSTEM',
              postedBy: req.user?.id || 'SYSTEM',
              postedAt: new Date(),
            }
          });

          // E. Buat Ledger Lines
          const amount = Number(existingUangMuka.jumlah);

          // E1. Debit: Uang Muka Kerja (Staff)
          await prismaTx.ledgerLine.create({
            data: {
              ledgerId: ledger.id,
              coaId: staffAdvanceAccount.coa.id,
              lineNumber: 1,
              description: `Debit Uang Muka Kerja - ${existingUangMuka.nomor}`,
              debitAmount: amount,
              creditAmount: 0,
              localAmount: amount,
              karyawanId: existingUangMuka.karyawanId
            }
          });

          // E2. Kredit: Kas/Bank
          await prismaTx.ledgerLine.create({
            data: {
              ledgerId: ledger.id,
              coaId: targetCoaId,
              lineNumber: 2,
              description: `Kredit Kas/Bank - ${existingUangMuka.nomor}`,
              debitAmount: 0,
              creditAmount: amount,
              localAmount: -amount,
            }
          });

          // F. Update Trial Balance & GL Summary
          const affectedCoas = [
            { id: staffAdvanceAccount.coa.id, debit: amount, credit: 0 },
            { id: targetCoaId, debit: 0, credit: amount }
          ];

          for (const item of affectedCoas) {
            // F1. Update Trial Balance
            const tb = await prismaTx.trialBalance.findUnique({
              where: {
                periodId_coaId: {
                  periodId: period.id,
                  coaId: item.id
                }
              }
            });

            if (tb) {
              await prismaTx.trialBalance.update({
                where: { id: tb.id },
                data: {
                  periodDebit: { increment: item.debit },
                  periodCredit: { increment: item.credit },
                  endingDebit: { increment: item.debit },
                  endingCredit: { increment: item.credit },
                  ytdDebit: { increment: item.debit },
                  ytdCredit: { increment: item.credit },
                  calculatedAt: new Date()
                }
              });
            } else {
              await prismaTx.trialBalance.create({
                data: {
                  periodId: period.id,
                  coaId: item.id,
                  openingDebit: 0,
                  openingCredit: 0,
                  periodDebit: item.debit,
                  periodCredit: item.credit,
                  endingDebit: item.debit,
                  endingCredit: item.credit,
                  ytdDebit: item.debit,
                  ytdCredit: item.credit,
                  calculatedAt: new Date()
                }
              });
            }

            // F2. Update GL Summary
            const dayDate = new Date(effectiveDate);
            dayDate.setHours(0, 0, 0, 0);

            const summary = await prismaTx.generalLedgerSummary.findUnique({
              where: {
                coaId_periodId_date: {
                  coaId: item.id,
                  periodId: period.id,
                  date: dayDate
                }
              }
            });

            if (summary) {
              // Update existing summary
              await prismaTx.generalLedgerSummary.update({
                where: { id: summary.id },
                data: {
                  debitTotal: { increment: item.debit },
                  creditTotal: { increment: item.credit },
                  closingBalance: { increment: item.debit - item.credit },
                  transactionCount: { increment: 1 }
                }
              });
            } else {
              // Create new summary - need to get opening balance from previous day
              // Find the most recent GL Summary before this date for this COA
              const previousSummary = await prismaTx.generalLedgerSummary.findFirst({
                where: {
                  coaId: item.id,
                  periodId: period.id,
                  date: { lt: dayDate }
                },
                orderBy: { date: 'desc' }
              });

              // Opening balance = previous day's closing balance
              const openingBalance = previousSummary ? Number(previousSummary.closingBalance) : 0;
              
              // Closing balance = opening + debit - credit
              const closingBalance = openingBalance + item.debit - item.credit;

              await prismaTx.generalLedgerSummary.create({
                data: {
                  coaId: item.id,
                  periodId: period.id,
                  date: dayDate,
                  openingBalance: openingBalance,
                  debitTotal: item.debit,
                  creditTotal: item.credit,
                  closingBalance: closingBalance,
                  transactionCount: 1
                }
              });

              // IMPORTANT: Update all future dates' opening and closing balances
              // This ensures the carry-forward effect
              const futureSummaries = await prismaTx.generalLedgerSummary.findMany({
                where: {
                  coaId: item.id,
                  periodId: period.id,
                  date: { gt: dayDate }
                },
                orderBy: { date: 'asc' }
              });

              // Cascade update for all future dates
              let runningBalance = closingBalance;
              for (const futureSummary of futureSummaries) {
                const newOpening = runningBalance;
                const newClosing = newOpening + Number(futureSummary.debitTotal) - Number(futureSummary.creditTotal);
                
                await prismaTx.generalLedgerSummary.update({
                  where: { id: futureSummary.id },
                  data: {
                    openingBalance: newOpening,
                    closingBalance: newClosing
                  }
                });

                runningBalance = newClosing;
              }
            }
          }
        }

        return uangMuka;
      });

      res.json({
        success: true,
        message: `Status uang muka berhasil diupdate menjadi ${status}`,
        data: result,
      });
    } catch (error) {
      if (req.files) req.files.forEach((f) => fs.unlinkSync(f.path));
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
