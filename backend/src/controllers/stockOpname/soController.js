import ExcelJS from 'exceljs';
import { startOfMonth } from 'date-fns';
import { prisma } from "../../config/db.js";

export const stockOpnameController = {
  // --- CREATE ---
  create: async (req, res) => {
    try {
      const { nomorOpname, type, warehouseId, keterangan, items } = req.body;
      
      const currentUserId = req.user?.id || global.currentUserId; 

      if (!currentUserId) {
        return res.status(401).json({ success: false, message: "User not authenticated" });
      }

      const result = await prisma.$transaction(async (tx) => {
        return await tx.stockOpname.create({
          data: {
            nomorOpname,
            type,
            petugasId: currentUserId,
            warehouseId,
            keterangan,
            status: 'DRAFT',
            items: {
              create: items.map((item) => {
                 const stokFisik = Number(item.stokFisik) || 0;
                 const stokSistem = Number(item.stokSistem) || 0;
                 const hargaSatuan = Number(item.hargaSatuan) || 0;
                 return {
                  productId: item.productId,
                  stokSistem: stokSistem,
                  stokFisik: stokFisik,
                  selisih: stokFisik - stokSistem,
                  hargaSatuan: hargaSatuan,
                  totalNilai: stokFisik * hargaSatuan,
                  catatanItem: item.catatanItem || "",
                };
              }),
            },
          },
          include: { items: true },
        });
      });

      return res.status(201).json({
        success: true,
        data: result,
        message: "Stock Opname created as DRAFT",
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Failed to create", error: error.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      let { search, status, warehouseId, type, startDate, endDate } = req.query;

      // Sanitize params
      if (search === 'undefined') search = undefined;
      if (status === 'undefined') status = undefined;
      if (warehouseId === 'undefined') warehouseId = undefined;
      if (type === 'undefined') type = undefined;
      if (startDate === 'undefined') startDate = undefined;
      if (endDate === 'undefined') endDate = undefined;

      // Build WHERE clause
      const where = {};
      // ... (rest of logic)

      if (search) {
        where.OR = [
          { nomorOpname: { contains: search } }, // Hapus mode: 'insensitive' jika error (MySQL default case insensitive collation biasanya aman)
          { items: { some: { product: { name: { contains: search } } } } }
        ];
      }

      if (status) {
        where.status = status;
      }

      if (type) {
        where.type = type;
      }

      if (warehouseId) {
        where.warehouseId = warehouseId;
      }

      if (startDate || endDate) {
        where.tanggalOpname = {};
        if (startDate) {
          where.tanggalOpname.gte = new Date(startDate);
        }
        if (endDate) {
          // Tambah 1 hari untuk cover sampai akhir hari jika endDate sama dengan startDate atau sekedar tanggal
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); 
          where.tanggalOpname.lte = end;
        }
      }

      const [totalCount, data] = await Promise.all([
        prisma.stockOpname.count({ where }),
        prisma.stockOpname.findMany({
          where,
          skip,
          take: limit,
          include: {
            petugas: { select: { name: true } },
            warehouse: { select: { name: true, code: true } },
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    code: true,
                    storageUnit: true
                  }
                }
              }
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return res.status(200).json({
        success: true,
        data: {
          data: data,
          pagination: {
            totalCount,
            totalPages,
            currentPage: page,
            pageSize: limit,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          }
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  // --- READ (Detail) ---
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const data = await prisma.stockOpname.findUnique({
        where: { id },
        include: {
          items: { include: { product: { select: { name: true, code: true, storageUnit: true } } } },
          petugas: true,
          warehouse: true,
        },
      });

      if (!data) return res.status(404).json({ success: false, message: "Not found" });

      return res.status(200).json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  // --- UPDATE (Only for DRAFT) ---
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { keterangan, items, tanggalOpname, warehouseId, type } = req.body;

      const existing = await prisma.stockOpname.findUnique({ where: { id } });
      if (existing.status !== 'DRAFT') {
        return res.status(400).json({ success: false, message: "Cannot update non-draft opname" });
      }

      const result = await prisma.$transaction(async (tx) => {
        // Hapus items lama, ganti dengan yang baru (Re-sync)
        await tx.stockOpnameItem.deleteMany({ where: { stockOpnameId: id } });

        return await tx.stockOpname.update({
          where: { id },
          data: {
            keterangan,
            tanggalOpname: tanggalOpname ? new Date(tanggalOpname) : undefined,
            warehouseId,
            type,
            items: {
              create: items.map((item) => ({
                productId: item.productId,
                stokSistem: item.stokSistem,
                stokFisik: item.stokFisik,
                selisih: Number(item.stokFisik) - Number(item.stokSistem),
                hargaSatuan: item.hargaSatuan,
                totalNilai: Number(item.hargaSatuan) * Number(item.stokFisik),
                catatanItem: item.catatanItem,
              })),
            },
          },
          include: { items: true },
        });
      });

      return res.status(200).json({ success: true, data: result, message: "Updated successfully" });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  // --- DELETE (Only for DRAFT/CANCELLED) ---
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await prisma.stockOpname.findUnique({ where: { id } });

      if (existing.status === 'ADJUSTED') {
        return res.status(400).json({ success: false, message: "Cannot delete adjusted data" });
      }

      await prisma.stockOpname.delete({ where: { id } });
      return res.status(200).json({ success: true, message: "Deleted successfully" });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  // --- STATUS CHANGE (Finalize/Adjust) ---
  adjust: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await prisma.$transaction(async (tx) => {
        // 1. Ambil data opname beserta itemnya
        const opname = await tx.stockOpname.findUnique({
          where: { id },
          include: { items: true },
        });

        if (!opname || (opname.status !== 'DRAFT' && opname.status !== 'COMPLETED')) {
          throw new Error("Data opname tidak ditemukan atau status bukan DRAFT/COMPLETED");
        }

        // 2. Loop setiap item untuk adjustment
        for (const item of opname.items) {
          const selisih = Number(item.selisih);
          const hargaSatuan = Number(item.hargaSatuan || 0);
          
          if (selisih !== 0) {
            const isAddition = selisih > 0;
            const absSelisih = Math.abs(selisih);

            const currentPeriod = opname.tanggalOpname ? new Date(opname.tanggalOpname) : new Date();
            const startOfPeriod = startOfMonth(currentPeriod);

            // Cari balance untuk periode, produk, dan gudang yang sesuai
            const balance = await tx.stockBalance.findFirst({
              where: {
                productId: item.productId,
                period: startOfPeriod,
                warehouseId: opname.warehouseId
              }
            });

            const stockAwalBeforeAdj = balance ? Number(balance.stockAkhir) : 0;
            const stockAkhirAfterAdj = stockAwalBeforeAdj + selisih;

            // A. Buat Record StockDetail (History Transaksi untuk Audit Trail)
            await tx.stockDetail.create({
              data: {
                productId: item.productId,
                warehouseId: opname.warehouseId,
                transQty: selisih,
                transUnit: 'UNIT', 
                baseQty: absSelisih,
                type: isAddition ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
                source: 'OPNAME',
                referenceNo: opname.nomorOpname,
                notes: `Adjustment from Stock Opname: ${opname.nomorOpname}`,
                pricePerUnit: hargaSatuan,
                residualQty: isAddition ? absSelisih : 0, // Set residualQty for FIFO tracking
                isFullyConsumed: !isAddition, // Only IN transactions have residual stock
                stockAwalSnapshot: stockAwalBeforeAdj,
                stockAkhirSnapshot: stockAkhirAfterAdj,
                createdAt: currentPeriod
              }
            });

            // B. Update/Create StockBalance dengan kolom JustIn/JustOut
            if (balance) {
              // Revaluasi: Total Stok Baru * Harga Satuan saat ini
              const revaluedInventory = stockAkhirAfterAdj * hargaSatuan;

              await tx.stockBalance.update({
                where: { id: balance.id },
                data: {
                  stockAkhir: { increment: selisih },
                  availableStock: { increment: selisih },
                  inventoryValue: revaluedInventory,
                  
                  // Mencatat selisih ke kolom adjustment agar mudah ditelusuri
                  justIn: isAddition ? { increment: absSelisih } : undefined,
                  justOut: !isAddition ? { increment: absSelisih } : undefined,
                }
              });
            } else {
              // Jika record balance belum ada di periode ini
              await tx.stockBalance.create({
                data: {
                  productId: item.productId,
                  warehouseId: opname.warehouseId,
                  period: startOfPeriod,
                  stockAwal: 0,
                  stockAkhir: Number(item.stokFisik),
                  availableStock: Number(item.stokFisik),
                  inventoryValue: Number(item.stokFisik) * hargaSatuan,
                  
                  // Inisialisasi kolom adjustment
                  justIn: isAddition ? absSelisih : 0,
                  justOut: !isAddition ? absSelisih : 0,
                }
              });
            }
          }
        }

        // 3. Update status Opname jadi ADJUSTED
        return await tx.stockOpname.update({
          where: { id },
          data: { status: 'ADJUSTED' },
        });
      });

      return res.status(200).json({ 
        success: true, 
        data: result, 
        message: "Stok berhasil disesuaikan dan dicatat di kolom Adjustment" 
      });
    } catch (error) {
      console.error("Adjustment Error:", error);
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  // --- EXPORT TO EXCEL ---
  exportData: async (req, res) => {
    try {
      let { search, status, warehouseId, type, startDate, endDate } = req.query;

      // Sanitize params
      if (search === 'undefined') search = undefined;
      if (status === 'undefined') status = undefined;
      if (warehouseId === 'undefined') warehouseId = undefined;
      if (type === 'undefined') type = undefined;
      if (startDate === 'undefined') startDate = undefined;
      if (endDate === 'undefined') endDate = undefined;

      // Build WHERE clause (Same as getAll)
      const where = {};

      if (search) {
        where.OR = [
          { nomorOpname: { contains: search } },
          { items: { some: { product: { name: { contains: search } } } } }
        ];
      }

      if (status) {
        where.status = status;
      }

      if (type) {
        where.type = type;
      }

      if (warehouseId) {
        where.warehouseId = warehouseId;
      }

      if (startDate || endDate) {
        where.tanggalOpname = {};
        if (startDate) {
          where.tanggalOpname.gte = new Date(startDate);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); 
          where.tanggalOpname.lte = end;
        }
      }

      const data = await prisma.stockOpname.findMany({
        where,
        include: {
          petugas: { select: { name: true } },
          warehouse: { select: { name: true } },
          items: true
        },
        orderBy: { createdAt: 'desc' },
      });

      // Create Workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Stock Opname');

      // Define Columns
      worksheet.columns = [
        { header: 'No. Opname', key: 'nomorOpname', width: 25 },
        { header: 'Tanggal', key: 'tanggalOpname', width: 15 },
        { header: 'Tipe', key: 'type', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Gudang', key: 'warehouse', width: 20 },
        { header: 'Petugas', key: 'petugas', width: 20 },
        { header: 'Keterangan', key: 'keterangan', width: 30 },
        { header: 'Total Item', key: 'totalItem', width: 15 },
        { header: 'Total Nilai (Rp)', key: 'totalNilai', width: 20 },
      ];

      // Add Data
      data.forEach((so) => {
        const totalItems = so.items.length;
        const totalNilai = so.items.reduce((sum, item) => sum + Number(item.totalNilai || 0), 0);

        worksheet.addRow({
          nomorOpname: so.nomorOpname,
          tanggalOpname: so.tanggalOpname ? new Date(so.tanggalOpname).toISOString().split('T')[0] : '-',
          type: so.type,
          status: so.status,
          warehouse: so.warehouse?.name || '-',
          petugas: so.petugas?.name || '-',
          keterangan: so.keterangan || '-',
          totalItem: totalItems,
          totalNilai: totalNilai
        });
      });

      // Style Header
      worksheet.getRow(1).font = { bold: true };

      // Set Response Headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=stock-opname-${Date.now()}.xlsx`);

      await workbook.xlsx.write(res);
      res.end();

    } catch (error) {
      console.error("Export Error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  // --- STATUS CHANGE (Cancel) ---
  cancel: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await prisma.$transaction(async (tx) => {
        const opname = await tx.stockOpname.findUnique({
          where: { id },
        });

        if (!opname || opname.status !== 'DRAFT') throw new Error("Invalid status or not found");

        return await tx.stockOpname.update({
          where: { id },
          data: { status: 'CANCELLED' },
        });
      });

      return res.status(200).json({ success: true, data: result, message: "Status updated to CANCELLED" });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  // --- STATUS CHANGE (Complete/Lock) ---
  complete: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await prisma.$transaction(async (tx) => {
        const opname = await tx.stockOpname.findUnique({
          where: { id },
        });

        if (!opname || opname.status !== 'DRAFT') throw new Error("Data opname tidak ditemukan atau status sudah bukan DRAFT");

        return await tx.stockOpname.update({
          where: { id },
          data: { status: 'COMPLETED' },
        });
      });

      return res.status(200).json({ success: true, data: result, message: "Status updated to COMPLETED" });
    } catch (error) {
        console.error("Complete Error:", error);
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  // --- STATUS CHANGE (Unlock) ---
  unlock: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await prisma.$transaction(async (tx) => {
        const opname = await tx.stockOpname.findUnique({
          where: { id },
        });

        if (!opname || opname.status !== 'COMPLETED') throw new Error("Data opname tidak ditemukan atau status bukan COMPLETED");

        return await tx.stockOpname.update({
          where: { id },
          data: { status: 'DRAFT' },
        });
      });

      return res.status(200).json({ success: true, data: result, message: "Status updated to DRAFT" });
    } catch (error) {
        console.error("Unlock Error:", error);
      return res.status(400).json({ success: false, message: error.message });
    }
  }
};
