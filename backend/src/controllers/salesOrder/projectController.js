// src/controllers/master/project/projectController.js
import { PrismaClient } from "../../../prisma/generated/prisma/index.js";
const prisma = new PrismaClient();

const trimOrNull = (v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);

/**
 * Body yang diterima:
 * {
 *   "customerId": "uuid",   // wajib
 *   "name": "Proyek A",     // wajib
 *   "location": "Bandung"   // opsional
 * }
 */
export const createProject = async (req, res) => {
  try {
    const { customerId, name, location } = req.body;


    // Validasi dasar
    if (!customerId || !name?.trim()) {
      return res.status(400).json({ message: "customerId dan name wajib diisi." });
    }

    // Cek FK agar error lebih ramah
    const customerExists = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    });
    if (!customerExists) {
      return res.status(404).json({ message: "Customer tidak ditemukan." });
    }

    // Create project
    const created = await prisma.project.create({
      data: {
        customerId,
        name: name.trim(),
        location: trimOrNull(location),
      },
      select: {
        id: true,
        customerId: true,
        name: true,
        location: true,
        createdAt: true,
      },
    });

    return res.status(201).json(created);
  } catch (error) {
    console.error("[createProject] error:", error);

    // FK constraint (customerId tidak valid)
    if (error?.code === "P2003") {
      return res.status(400).json({ message: "customerId tidak valid (foreign key)." });
    }

    return res.status(500).json({ message: "Gagal membuat project" });
  }
};

/**
 * GET /api/master/project/list?customerId=...&q=...&take=50&skip=0
 * - customerId (opsional) → filter per customer
 * - q (opsional) → search by name (contains, insensitive)
 * - take/skip (opsional) → pagination sederhana
 */
export const getListProjects = async (req, res) => {
  try {
    const { customerId, q } = req.query;
    const take = Math.min(parseInt(req.query.take ?? "50", 10) || 50, 200);
    const skip = parseInt(req.query.skip ?? "0", 10) || 0;

    const where = {
      ...(customerId ? { customerId } : {}),
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          customerId: true,
          name: true,
          location: true,
          createdAt: true,
          customer: { // Tambahkan customer data untuk frontend
            select: {
              id: true,
              name: true,
            }
          }
        },
        take,
        skip,
      }),
      prisma.project.count({ where }),
    ]);

    res.json({ 
      success: true,
      message: "Data projects berhasil diambil",
      data: projects, 
      total,
      pagination: {
        take,
        skip,
        total
      }
    });
  } catch (error) {
    console.error("[listProjects] error:", error);
    res.status(500).json({ 
      success: false,
      message: "Gagal mengambil data project",
      error: error.message 
    });
  }
};

