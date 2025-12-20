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

  // --- READ (List with Pagination) ---
  getAll: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const [totalCount, data] = await Promise.all([
        prisma.stockOpname.count(),
        prisma.stockOpname.findMany({
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
        const opname = await tx.stockOpname.findUnique({
          where: { id },
          include: { items: true },
        });

        if (!opname || opname.status !== 'DRAFT') throw new Error("Invalid status");

        // Logic update stok di sini (jika ada tabel ProductStock) bisa ditambahkan
        
        return await tx.stockOpname.update({
          where: { id },
          data: { status: 'ADJUSTED' },
        });
      });

      return res.status(200).json({ success: true, data: result, message: "Status updated to ADJUSTED" });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
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
  }
};