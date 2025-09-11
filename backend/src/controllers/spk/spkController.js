import { PrismaClient } from "../../../prisma/generated/prisma/index.js";
import { getNextSpkCode } from "../../utils/generateCode.js";

const prisma = new PrismaClient();

// ✅ CREATE SPK
export const createSPK = async (req, res) => {
  try {
    const spkCodeNumber = await getNextSpkCode();
    const {
      spkNumber,
      spkDate,
      createdById,
      salesOrderId, // 👈 kita akan pakai ini untuk update SalesOrder
      teamId,
      notes,
      details,
    } = req.body;

    // Gunakan transaksi agar aman
    const newSPK = await prisma.$transaction(async (tx) => {
      // Buat SPK
      const spk = await tx.sPK.create({
        data: {
          spkNumber: spkCodeNumber || spkNumber,
          spkDate: spkDate ? new Date(spkDate) : undefined,
          createdById,
          salesOrderId,
          teamId,
          notes,
          details: {
            create: details?.map((d) => ({
              karyawanId: d.karyawanId,
              salesOrderItemId: d.salesOrderItemId,
              lokasiUnit: d.lokasiUnit,
            })),
          },
        },
        include: {
          createdBy: true,
          salesOrder: true,
          team: true,
          details: {
            include: {
              karyawan: true,
              salesOrderItem: true,
            },
          },
        },
      });

      // Jika salesOrderId diberikan, update SalesOrder.type menjadi "IN_PROGRESS_SPK"
      if (salesOrderId) {
        await tx.salesOrder.update({
          where: { id: salesOrderId },
          data: {
            status: "IN_PROGRESS_SPK", // 👈 sesuaikan dengan enum value di schema Anda
          },
        });
      }

      return spk;
    });

    // ✅ Kembalikan respons sukses
    res.status(201).json({
      success: true,
      data: newSPK,
      message:
        "SPK berhasil dibuat, dan Sales Order diperbarui menjadi IN_PROGRESS_SPK",
    });
  } catch (error) {
    console.error("Error createSPK:", error);
    res.status(500).json({
      success: false,
      message: "Gagal membuat SPK",
      error: error.message,
    });
  }
};

// ✅ GET ALL SPK
export const getAllSPK = async (req, res) => {
  try {
    const spkList = await prisma.sPK.findMany({
      include: {
        createdBy: true,
        salesOrder: true,
        team: true,
        details: {
          include: {
            karyawan: true,
            salesOrderItem: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(spkList);
  } catch (error) {
    console.error("Error getAllSPK:", error);
    res.status(500).json({ error: "Failed to fetch SPK list" });
  }
};

// ✅ GET SPK BY ID
export const getSPKById = async (req, res) => {
  try {
    const { id } = req.params;

    const spk = await prisma.sPK.findUnique({
      where: { id },
      include: {
        createdBy: true,
        salesOrder: true,
        team: true,
        details: {
          include: {
            karyawan: true,
            salesOrderItem: true,
          },
        },
      },
    });

    if (!spk) return res.status(404).json({ error: "SPK not found" });
    res.json(spk);
  } catch (error) {
    console.error("Error getSPKById:", error);
    res.status(500).json({ error: "Failed to fetch SPK" });
  }
};

// ✅ UPDATE SPK
export const updateSPK = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      spkNumber,
      spkDate,
      createdById,
      salesOrderId,
      teamId,
      notes,
      details,
    } = req.body;

    const updatedSPK = await prisma.sPK.update({
      where: { id },
      data: {
        spkNumber,
        spkDate: spkDate ? new Date(spkDate) : undefined,
        createdById,
        salesOrderId,
        teamId,
        notes,
        updatedAt: new Date(),
        details: {
          deleteMany: { spkId: id }, // hapus detail lama
          create: details?.map((d) => ({
            karyawanId: d.karyawanId,
            salesOrderItemId: d.salesOrderItemId,
            lokasiUnit: d.lokasiUnit,
          })),
        },
      },
      include: {
        createdBy: true,
        salesOrder: true,
        team: true,
        details: {
          include: {
            karyawan: true,
            salesOrderItem: true,
          },
        },
      },
    });

    res.json(updatedSPK);
  } catch (error) {
    console.error("Error updateSPK:", error);
    res.status(500).json({ error: "Failed to update SPK" });
  }
};

// ✅ DELETE SPK
export const deleteSPK = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.sPK.delete({
      where: { id },
    });

    res.json({ message: "SPK deleted successfully" });
  } catch (error) {
    console.error("Error deleteSPK:", error);
    res.status(500).json({ error: "Failed to delete SPK" });
  }
};
