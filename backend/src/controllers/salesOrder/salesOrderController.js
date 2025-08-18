import { PrismaClient } from "../../../prisma/generated/prisma/index.js";
const prisma = new PrismaClient();

// Ambil semua sales order
export const getAll = async (req, res) => {
  try {
    const salesOrders = await prisma.salesOrder.findMany({
      include: {
        customer: true,
        project: true,
        user: true,
        items: true,
        document: true,
      },
      orderBy: { soDate: "desc" },
    });
    res.json(salesOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil data Sales Order" });
  }
};

export const getLastSalesOrder = async (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11 (Januari = 0)

    // Tentukan rentang tanggal untuk bulan ini
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0); // Hari terakhir di bulan ini

    // Cari SO terakhir di database
    const lastSalesOrder = await prisma.salesOrder.findFirst({
      where: {
        soDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        soNumber: "desc",
      },
      select: {
        soNumber: true, // Hanya ambil field yang dibutuhkan
      },
    });

    // Jika tidak ditemukan, kembalikan null. Jika ditemukan, kembalikan datanya.
    res.status(200).json(lastSalesOrder);
  } catch (error) {
    console.error("Error fetching last sales order:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Ambil 1 sales order by ID
export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const salesOrder = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        project: true,
        user: true,
        items: true,
        document: true,
      },
    });
    if (!salesOrder) {
      return res.status(404).json({ message: "Sales Order tidak ditemukan" });
    }
    res.json(salesOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil data Sales Order" });
  }
};

// Buat Sales Order baru
export const create = async (req, res) => {
  // Asumsi: Middleware otentikasi Anda menambahkan 'user' ke object 'req'
  // Jika tidak ada user, berarti tidak terotentikasi
  console.log("[CREATE SALES ORDER] User:", req.user);

  if (!req.user || !req.user.userId) {
    return res.status(401).json({ message: "Akses tidak sah. Silakan login." });
  }

  const userId = req.user.userId; // Ambil ID user dari request
  const { soNumber, soDate, customerId, projectId, poNumber, type, items } =
    req.body;

  if (!soNumber || !soDate || !customerId || !items || !items.length) {
    return res
      .status(400)
      .json({ message: "Data yang dikirim tidak lengkap." });
  }

  try {
    const newSalesOrder = await prisma.salesOrder.create({
      data: {
        soNumber,
        soDate: new Date(soDate),
        poNumber: poNumber || null,
        type,
        customer: {
          connect: {
            id: customerId,
          },
        },
        ...(projectId && {
          project: {
            connect: {
              id: projectId,
            },
          },
        }),
        // === PERUBAHAN DI SINI ===
        // Hubungkan relasi ke user yang sedang login
        user: {
          connect: {
            id: userId,
          },
        },
        items: {
          create: items.map((item) => ({
            description: item.description,
            qty: item.qty,
            unitPrice: item.unitPrice,
          })),
        },
      },
    });

    res.status(201).json(newSalesOrder);
  } catch (error) {
    console.error("Error creating sales order in backend:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update Sales Order (tanpa ubah items/document)
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const updated = await prisma.salesOrder.update({
      where: { id },
      data,
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal memperbarui Sales Order" });
  }
};

// Hapus Sales Order
export const remove = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.salesOrder.delete({ where: { id } });
    res.json({ message: "Sales Order berhasil dihapus" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal menghapus Sales Order" });
  }
};
