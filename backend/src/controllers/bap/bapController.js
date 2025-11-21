import { prisma } from "../../config/db.js";
import { getRomanMonth } from "../../utils/generateCode.js";

// Generate BAP number (contoh: 00001/BAP-RYLIF/IX/2025)
export const generateBAPNumber = async (tx = prisma) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const romanMonth = getRomanMonth(month);

  // Nama counter unik per tahun
  const counterName = `BAP-${year}`;

  // Upsert counter (buat baru kalau belum ada, tambah 1 kalau sudah ada)
  const counter = await tx.counter.upsert({
    where: { name: counterName },
    create: { name: counterName, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
    select: { lastNumber: true },
  });

  const sequence = String(counter.lastNumber).padStart(5, "0");
  return `${sequence}/BAP-RYLIF/${romanMonth}/${year}`;
};

// Get all BAPs
export const getAllBAP = async (req, res) => {
  try {
    const pageNum = parseInt(req.query.page) || 1;
    const limitNum = parseInt(req.query.limit) || 50;
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.search) {
      where.OR = [
        { bapNumber: { contains: req.query.search, mode: "insensitive" } },
        {
          workDescription: { contains: req.query.search, mode: "insensitive" },
        },
        { location: { contains: req.query.search, mode: "insensitive" } },
      ];
    }

    const baps = await prisma.bAP.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        salesOrder: {
          select: {
            soNumber: true,
            spk: {
              select: {
                spkNumber: true,
                spkDate: true,
              },
              take: 1, // *pastikan ambil 1 SPK jika relasi 1-many
            },
            customer: {
              select: {
                name: true,
                contactPerson: true,
                branch: true,
                address: true,
              },
            },
            project: { select: { name: true, location: true } },
            items: true,
          },
        },
        createdBy: { select: { id: true, name: true } }, // relasi ke User
        user: { select: { id: true, namaLengkap: true } }, // relasi ke Karyawan
        photos: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.bAP.count({ where });
    res.json({
      data: baps,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get BAP by ID
export const getBAPById = async (req, res) => {
  try {
    const { id } = req.params;

    const bap = await prisma.bAP.findUnique({
      where: { id },
      include: {
        salesOrder: {
          include: {
            customer: true,
            project: true,
            items: true,
          },
        },
        createdBy: { select: { id: true, name: true, email: true } },
        user: { select: { id: true, namaLengkap: true, email: true } },
        photos: true,
      },
    });

    if (!bap) {
      return res.status(404).json({ error: "BAP not found" });
    }

    res.json(bap);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new BAP
// Create BAP
export const createBAP = async (req, res) => {
  try {
    const {
      bapDate,
      salesOrderId,
      projectId,
      userId,
      createdById,
      workDescription,
      location,
      notes,
      photos, // ✅ untuk mode JSON (full SPK)
    } = req.body;

    let allPhotos = [];

    // --- 1. Handle JSON mode (Full SPK) ---
    if (photos && Array.isArray(photos)) {
      allPhotos = photos.map((photo) => ({
        photoUrl: photo.photoUrl,
        caption: photo.caption || null,
        category: photo.category || "BEFORE",
        source: "spk",
      }));
    }

    // --- 2. Manual Upload (via multer) ---
    let uploadedPhotos = [];
    if (req.files && req.files.length > 0) {
      uploadedPhotos = req.files.map((file, idx) => {
        // ✅ FIX: Handle array structure dari frontend
        let caption, category, source;

        // Coba baca sebagai array structure [index]
        if (req.body[`captions[${idx}]`] !== undefined) {
          caption = req.body[`captions[${idx}]`] || null;
          category = req.body[`categories[${idx}]`] || "BEFORE";
          source = req.body[`sources[${idx}]`] || "manual";
        } else {
          // Fallback ke cara lama
          caption = Array.isArray(req.body.captions)
            ? req.body.captions[idx] || null
            : req.body.captions || null;
          category = Array.isArray(req.body.categories)
            ? req.body.categories[idx] || "BEFORE"
            : req.body.categories || "BEFORE";
          source = "manual";
        }

        return {
          photoUrl: `/images/spk/${file.filename}`,
          caption,
          category,
          source,
        };
      });
    }

    // --- 3. Foto dari SPK (FormData mode) ---
    let spkPhotos = [];
    if (req.body.photoPaths && !photos) {
      const photoPaths = Array.isArray(req.body.photoPaths)
        ? req.body.photoPaths
        : [req.body.photoPaths];

      spkPhotos = photoPaths.map((path, idx) => {
        // ✅ FIX: Handle array structure
        let caption, category, source;

        if (req.body[`captions[${idx}]`] !== undefined) {
          caption = req.body[`captions[${idx}]`] || null;
          category = req.body[`categories[${idx}]`] || "BEFORE";
          source = req.body[`sources[${idx}]`] || "spk";
        } else {
          const captions = Array.isArray(req.body.captions)
            ? req.body.captions
            : req.body.captions
            ? [req.body.captions]
            : [];
          const categories = Array.isArray(req.body.categories)
            ? req.body.categories
            : req.body.categories
            ? [req.body.categories]
            : [];
          const sources = Array.isArray(req.body.sources)
            ? req.body.sources
            : req.body.sources
            ? [req.body.sources]
            : [];

          caption = captions[idx] || null;
          category = categories[idx] || "BEFORE";
          source = sources[idx] || "spk";
        }

        return {
          photoUrl: path,
          caption,
          category,
          source,
        };
      });
    }

    // --- 4. Gabungkan semua photos ---
    allPhotos = [...allPhotos, ...uploadedPhotos, ...spkPhotos];

    // ... rest of your code
    const salesOrder = await prisma.salesOrder.findUnique({
      where: { id: salesOrderId },
      include: { project: true },
    });

    if (salesOrder?.id) {
      await prisma.salesOrder.update({
        where: { id: salesOrder.id },
        data: { status: "BAST" },
      });
    }

    if (!salesOrder) {
      return res.status(404).json({ error: "Sales Order not found" });
    }

    const bapNumber = await generateBAPNumber();

    const bap = await prisma.bAP.create({
      data: {
        bapNumber,
        bapDate: new Date(bapDate),
        salesOrderId,
        projectId: projectId || salesOrder.projectId,
        createdById,
        userId,
        workDescription,
        location,
        notes,
        photos: {
          create: allPhotos,
        },
      },
      include: {
        salesOrder: {
          select: {
            soNumber: true,
            customer: { select: { name: true } },
            spk: { select: { id: true } },
          },
        },
        photos: true,
      },
    });

    if (bap?.salesOrder?.spk?.length) {
      await prisma.sPKFieldReport.updateMany({
        where: { spkId: { in: bap.salesOrder.spk.map((spk) => spk.id) } },
        data: { status: "APPROVED" },
      });
    }

    res.status(201).json(bap);
  } catch (error) {
    console.error("❌ Error createBAP:", error);
    res.status(400).json({ error: error.message });
  }
};

// Update BAP
export const updateBAP = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      userId,
      bapDate,
      workDescription,
      location,
      status,
      isApproved,
      notes,
      photos,
    } = req.body;

    const bap = await prisma.bAP.findUnique({
      where: { id },
      include: { photos: true },
    });

    if (!bap) {
      return res.status(404).json({ error: "BAP not found" });
    }

    // Handle approval
    let approvedAt = bap.approvedAt;
    if (isApproved && !bap.isApproved) {
      approvedAt = new Date();
    } else if (!isApproved && bap.isApproved) {
      approvedAt = null;
    }

    const updatedBAP = await prisma.bAP.update({
      where: { id },
      data: {
        userId,
        bapDate,
        workDescription,
        location,
        status,
        isApproved,
        approvedAt,
        notes,
        photos: photos
          ? {
              deleteMany: {}, // hapus semua foto lama
              create: photos.map((photo) => ({
                photoUrl: photo.photoUrl,
                caption: photo.caption,
                category: photo.category || "BEFORE", // simpan kategori juga
              })),
            }
          : undefined,
      },
      include: {
        salesOrder: {
          select: {
            soNumber: true,
            customer: { select: { name: true } },
          },
        },
        photos: true,
      },
    });

    res.json(updatedBAP);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete BAP
export const deleteBAP = async (req, res) => {
  try {
    const { id } = req.params;

    const bap = await prisma.bAP.findUnique({
      where: { id },
      select: {
        id: true,
        isApproved: true,
        salesOrderId: true, // ✅ ambil relasi sales order
      },
    });

    if (!bap) {
      return res.status(404).json({ error: "BAP not found" });
    }

    // ✅ Tidak boleh hapus jika sudah approved
    if (bap.isApproved) {
      return res.status(400).json({ error: "Cannot delete approved BAP" });
    }

    // ✅ Hapus BAP
    await prisma.bAP.delete({
      where: { id },
    });

    // ✅ Update SalesOrder → status menjadi FULFILLED
    if (bap.salesOrderId) {
      await prisma.salesOrder.update({
        where: { id: bap.salesOrderId },
        data: {
          status: "FULFILLED",
        },
      });
    }

    res.json({ message: "BAP deleted & SalesOrder updated to FULFILLED" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Approve BAP
export const approveBAP = async (req, res) => {
  try {
    const { id } = req.params;

    const bap = await prisma.bAP.findUnique({
      where: { id },
    });

    if (!bap) {
      return res.status(404).json({ error: "BAP not found" });
    }

    const updatedBAP = await prisma.bAP.update({
      where: { id },
      data: {
        isApproved: true,
        approvedAt: new Date(),
        status: "APPROVED",
      },
      include: {
        salesOrder: {
          select: {
            soNumber: true,
            customer: { select: { name: true } },
          },
        },
      },
    });

    res.json(updatedBAP);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const uploadBAPPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Buat URL relative untuk disimpan di DB
    const photoUrl = `/images/spk/${req.file.filename}`;

    res.json({
      success: true,
      url: photoUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload photo" });
  }
};
