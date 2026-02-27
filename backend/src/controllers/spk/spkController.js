// import { PrismaClient } from "@prisma/client";
import { prisma } from "../../config/db.js";
import { getNextSpkCode } from "../../utils/generateCode.js";

// const prisma = new PrismaClient();

export const getSpkByEmail = async (req, res) => {
  const { email } = req.query;

  // Validasi: email wajib ada
  if (!email || typeof email !== "string") {
    return res.status(400).json({
      error: "Parameter 'email' diperlukan dan harus berupa string",
    });
  }

  try {
    // Cari semua SPK yang memiliki setidaknya satu detail dengan karyawan.email = email
    const spkList = await prisma.sPK.findMany({
      where: {
        spkStatus: false,
        details: {
          some: {
            karyawan: {
              email: email, // ← ini yang dicari!
            },
          },
        },
      },
      include: {
        createdBy: true,
        salesOrder: {
          include: {
            customer: {
              select: {
                name: true,
                address: true,
                branch: true,
              },
            },
            project: {
              select: {
                id: true,
                name: true,
              },
            },
            items: true,
          },
        },
        team: true,
        details: {
          include: {
            karyawan: true,
            salesOrderItem: true,
          },
        },
      },
      orderBy: [{ spkNumber: "desc" }, { createdAt: "desc" }],
    });

    // Kirim response — bisa kosong jika tidak ada SPK
    res.json(spkList);
  } catch (error) {
    console.error("Error getSpkByEmail:", error);
    res
      .status(500)
      .json({ error: "Gagal mengambil daftar SPK berdasarkan email karyawan" });
  }
};

export const createSPK = async (req, res) => {
  try {
    const spkCodeNumber = await getNextSpkCode();
    const {
      spkNumber,
      spkDate,
      createdById,
      salesOrderId,
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
            status: "IN_PROGRESS_SPK",
          },
        });
      }

      return spk;
    });

    // ✅ BROADCAST NOTIFICATION KE ADMIN, PIC, DAN TEAM MEMBERS
    try {
      // Dapatkan semua user dengan role admin dan pic
      const adminUsers = await prisma.user.findMany({
        where: {
          role: { in: ["admin", "pic"] },
          active: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      // Dapatkan informasi user yang membuat SPK
      const creatorUser = await prisma.karyawan.findUnique({
        where: { id: createdById },
        select: {
          namaLengkap: true,
          email: true,
          user: {
            select: {
              role: true,
            },
          },
        },
      });

      const creatorName =
        creatorUser?.namaLengkap || creatorUser?.email || "Unknown User";

      // Dapatkan informasi Sales Order terkait
      const salesOrderInfo = await prisma.salesOrder.findUnique({
        where: { id: salesOrderId },
        select: {
          soNumber: true,
          customer: { select: { branch: true } },
        },
      });

      const soNumber = salesOrderInfo?.soNumber || "Unknown SO";
      const customerName =
        salesOrderInfo?.customer?.branch || "Unknown Customer";

      // Import NotificationService
      const { NotificationService } = await import(
        "../../utils/firebase/notificationService.js"
      );

      // ✅ BROADCAST NOTIFICATION KE ADMIN & PIC
      console.log(
        `📢 Sending SPK notification to ${adminUsers.length} admin/pic users`
      );

      for (const admin of adminUsers) {
        await NotificationService.sendToUser(admin.id, {
          title: "SPK Baru Dibuat 🛠️",
          body: `SPK ${newSPK.spkNumber} berhasil dibuat oleh ${creatorName} untuk SO ${soNumber} - Customer: ${customerName}`,
          data: {
            type: "spk_created",
            spkId: newSPK.id,
            spkNumber: newSPK.spkNumber,
            salesOrderId: salesOrderId,
            soNumber: soNumber,
            customerName: customerName,
            createdBy: creatorName,
            action: `/spk/${newSPK.id}`,
            timestamp: new Date().toISOString(),
          },
        });

        // console.log(
        //   `✅ SPK notification sent to ${admin.role}: ${admin.email}`
        // );
      }

      // ✅ BROADCAST NOTIFICATION KE TEAM MEMBERS DENGAN ROLE = USER
      if (teamId) {
        try {
          await NotificationService.broadcastToTeamMembers(teamId, {
            title: "Anda Ditugaskan di SPK Baru 📋",
            body: `Anda termasuk dalam team SPK ${newSPK.spkNumber} untuk SO ${soNumber} - Customer: ${customerName}`,
            data: {
              type: "spk_assignment",
              spkId: newSPK.id,
              spkNumber: newSPK.spkNumber,
              soNumber: soNumber,
              customerName: customerName,
              createdBy: creatorName,
              teamId: teamId,
              action: `/spk/${newSPK.id}`,
              timestamp: new Date().toISOString(),
            },
          });
        } catch (teamNotifyError) {
          console.error(
            "❌ Error sending team notifications:",
            teamNotifyError
          );
        }
      }

      // ✅ NOTIFIKASI KE CREATOR SPK (jika bukan admin/pic)
      if (
        creatorUser &&
        creatorUser.user &&
        !["admin", "pic"].includes(creatorUser.user.role)
      ) {
        await NotificationService.sendToUser(createdById, {
          title: "SPK Berhasil Dibuat ✅",
          body: `SPK ${newSPK.spkNumber} telah berhasil dibuat untuk SO ${soNumber}`,
          data: {
            type: "spk_created",
            spkId: newSPK.id,
            spkNumber: newSPK.spkNumber,
            soNumber: soNumber,
            customerName: customerName,
            action: `/spk/${newSPK.id}`,
          },
        });

        console.log(
          `✅ SPK notification sent to creator: ${creatorUser.email}`
        );
      }
    } catch (notificationError) {
      // Jangan gagalkan create SPK jika notifikasi gagal
      console.error("❌ Error sending SPK notification:", notificationError);
    }

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

export const getAllSPKAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;

    // PERBAIKAN: Decode URL parameters
    let search = req.query.search?.trim() || "";
    if (search) {
      try {
        search = decodeURIComponent(search);
      } catch (e) {
        console.warn("URL decode failed for search, using original:", search);
      }
    }

    const filterBy = req.query.filterBy?.trim() || "";

    const skip = (page - 1) * pageSize;

    // console.log("📥 Received parameters:", {
    //   page,
    //   pageSize,
    //   search,
    //   filterBy,
    // });

    // ============================
    // BUILD WHERE CLAUSE DENGAN SEARCH DAN FILTER
    // ============================
    let whereClause = {};

    // Filter conditions - DIPISAH dari search
    if (filterBy) {
      // console.log("🔍 Applying filter:", filterBy);

      switch (filterBy) {
        case "open":
          whereClause.spkStatusClose = false;
          break;
        case "closed":
          whereClause.spkStatusClose = true;
          break;
        case "on-progress":
          // ⬅️ INI TAMBAHAN BARU
          whereClause.spkStatusClose = false;
          break;
        case "progress-0":
          whereClause.progress = 0;
          break;

        case "progress-1-49":
          whereClause.progress = { gte: 1, lte: 49 };
          break;

        case "progress-50-99":
          whereClause.progress = { gte: 50, lte: 99 };
          break;

        case "progress-100":
          whereClause.progress = 100;
          break;
        case "all":
          // Tampilkan semua data, tidak perlu filter tambahan
          break;
        default:
          // Filter by team name
          if (filterBy.startsWith("team-")) {
            const teamName = filterBy.replace("team-", "");
            whereClause.team = {
              namaTeam: {
                equals: teamName,
                mode: "insensitive",
              },
            };
          } else {
            // Jika filter bukan team-*, anggap sebagai nama team langsung
            whereClause.team = {
              namaTeam: {
                equals: filterBy,
                mode: "insensitive",
              },
            };
          }
          break;
      }
    }

    // PERBAIKAN: Multi-keyword search dengan AND condition
    if (search) {
      const words = search.split(" ").filter(Boolean);

      if (words.length === 1) {
        // Single word search
        whereClause.AND = [
          ...(whereClause.AND || []),
          {
            OR: [
              { spkNumber: { contains: words[0], mode: "insensitive" } },
              {
                salesOrder: {
                  soNumber: { contains: words[0], mode: "insensitive" },
                },
              },
              {
                createdBy: {
                  namaLengkap: { contains: words[0], mode: "insensitive" },
                },
              },
              {
                team: { namaTeam: { contains: words[0], mode: "insensitive" } },
              },
              {
                salesOrder: {
                  customer: {
                    OR: [
                      { name: { contains: words[0], mode: "insensitive" } },
                      { branch: { contains: words[0], mode: "insensitive" } },
                    ],
                  },
                },
              },
              {
                salesOrder: {
                  project: {
                    name: { contains: words[0], mode: "insensitive" },
                  },
                },
              },
            ],
          },
        ];
      } else {
        // Multiple words search - cari yang mengandung semua kata
        const searchConditions = words.map((word) => ({
          OR: [
            { spkNumber: { contains: word, mode: "insensitive" } },
            {
              salesOrder: {
                soNumber: { contains: word, mode: "insensitive" },
              },
            },
            {
              createdBy: {
                namaLengkap: { contains: word, mode: "insensitive" },
              },
            },
            { team: { namaTeam: { contains: word, mode: "insensitive" } } },
            {
              salesOrder: {
                customer: {
                  OR: [
                    { name: { contains: word, mode: "insensitive" } },
                    { branch: { contains: word, mode: "insensitive" } },
                  ],
                },
              },
            },
            {
              salesOrder: {
                project: { name: { contains: word, mode: "insensitive" } },
              },
            },
          ],
        }));

        whereClause.AND = [...(whereClause.AND || []), ...searchConditions];
      }
    }

    // console.log("🔍 Final where clause:", JSON.stringify(whereClause, null, 2));

    // ============================
    // COUNT TOTAL DATA DENGAN SEARCH DAN FILTER
    // ============================
    const totalCount = await prisma.sPK.count({ where: whereClause });

    // ============================
    // FETCH DATA DENGAN PAGINATION
    // ============================
    const spkList = await prisma.sPK.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      include: {
        createdBy: {
          select: {
            id: true,
            namaLengkap: true,
            email: true,
          },
        },
        salesOrder: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                address: true,
                branch: true,
              },
            },
            project: {
              select: {
                id: true,
                name: true,
              },
            },
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
        },
        team: {
          include: {
            karyawan: {
              include: {
                karyawan: {
                  select: {
                    id: true,
                    namaLengkap: true,
                    nik: true,
                  },
                },
              },
            },
          },
        },
        details: {
          include: {
            karyawan: {
              select: {
                id: true,
                namaLengkap: true,
                nik: true,
              },
            },
            salesOrderItem: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
        },
        spkFieldReport: {
          include: {
            soDetail: true,
          },
          orderBy: {
            reportedAt: "desc", // atau createdAt: 'desc'
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // console.log("✅ Query results:", {
    //   dataCount: spkList.length,
    //   totalCount,
    //   filterApplied: filterBy,
    //   hasData: spkList.length > 0,
    // });

    // ============================
    // SORTING
    // ============================
    const spkListSorted = spkList.map((spk) => {
      const sortedDetails = spk.details
        ?.slice()
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      const sortedItems = spk.salesOrder?.items
        ?.slice()
        .sort((a, b) => (a.lineNo || 0) - (b.lineNo || 0));

      return {
        ...spk,
        details: sortedDetails,
        salesOrder: {
          ...spk.salesOrder,
          items: sortedItems,
        },
      };
    });

    // ============================
    // PAGINATION META
    // ============================
    const totalPages = Math.ceil(totalCount / pageSize);

    return res.json({
      data: spkListSorted,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        pageSize,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error getAllSPKAdmin:", error);
    res.status(500).json({
      error: "Failed to fetch SPK list",
      details: error.message,
    });
  }
};

export const getAllSPK = async (req, res) => {
  try {
    const spkList = await prisma.sPK.findMany({
      where: {
        spkStatusClose: false,
      },
      include: {
        createdBy: true,
        salesOrder: {
          include: {
            customer: {
              select: {
                name: true,
                address: true,
                branch: true,
              },
            },
            project: {
              select: {
                id: true,
                name: true,
              },
            },
            items: true,
          },
        },
        team: true,
        details: {
          include: {
            karyawan: true,
            salesOrderItem: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(spkList);
  } catch (error) {
    console.error("Error getAllSPK:", error);
    res.status(500).json({ error: "Failed to fetch SPK list" });
  }
};

export const getAllSPKPr = async (req, res) => {
  try {
    const spkList = await prisma.sPK.findMany({
      // where: {
      // where: {
      //   // spkStatusClose: false, // Commented out to show ALL SPKs
      // },
      // },
      include: {
        createdBy: true,
        salesOrder: {
          include: {
            customer: {
              select: {
                name: true,
                address: true,
                branch: true,
              },
            },
            project: {
              select: {
                id: true,
                name: true,
              },
            },
            items: true,
          },
        },
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

export const getSPKById = async (req, res) => {
  try {
    const { id } = req.params;

    let spk = await prisma.sPK.findUnique({
      where: { id },
      include: {
        createdBy: true,
        salesOrder: {
          include: {
            customer: { select: { name: true, address: true, branch: true } },
            project: { select: { id: true, name: true } },
            items: true, // ambil semua items dulu
          },
        },
        team: true,
        details: {
          include: { karyawan: true, salesOrderItem: true },
        },
        spkFieldReport: {  // ✅ TAMBAHAN: Include field reports untuk progress tracking
          select: {
            id: true,
            soDetailId: true,
            progress: true,
            status: true,
            reportedAt: true,
            createdAt: true,
          },
          orderBy: {
            reportedAt: 'desc',
          },
        },
      },
    });

    if (!spk) return res.status(404).json({ error: "SPK not found" });

    // ✅ Sort salesOrder.items berdasarkan lineNo ascending
    if (spk.salesOrder?.items) {
      spk.salesOrder.items = spk.salesOrder.items
        .slice()
        .sort((a, b) => (a.lineNo || 0) - (b.lineNo || 0));
    }

    res.json(spk);
  } catch (error) {
    console.error("Error getSPKById:", error);
    res.status(500).json({ error: "Failed to fetch SPK" });
  }
};

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

export const deleteSPK = async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Cari SPK dulu agar bisa ambil salesOrderId
    const spk = await prisma.sPK.findUnique({
      where: { id },
      select: { salesOrderId: true },
    });

    if (!spk) {
      return res.status(404).json({ error: "SPK not found" });
    }

    // 2️⃣ Hapus SPK
    await prisma.sPK.delete({
      where: { id },
    });

    // 3️⃣ Update Sales Order kembali ke status DRAFT
    await prisma.salesOrder.update({
      where: { id: spk.salesOrderId },
      data: {
        status: "DRAFT",
      },
    });

    res.json({
      message: "SPK deleted successfully and Sales Order reverted to DRAFT",
    });
  } catch (error) {
    console.error("Error deleteSPK:", error);
    res.status(500).json({ error: "Failed to delete SPK" });
  }
};

// ✅ NEW: Update SPK Progress based on field reports
export const updateSPKProgress = async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Fetch SPK with field reports
    const spk = await prisma.sPK.findUnique({
      where: { id },
      include: {
        salesOrder: {
          include: {
            items: true,
          },
        },
        spkFieldReport: {
          select: {
            soDetailId: true,
            progress: true,
            reportedAt: true,
          },
          orderBy: {
            reportedAt: 'desc',
          },
        },
      },
    });

    if (!spk) {
      return res.status(404).json({ error: "SPK not found" });
    }

    // 2️⃣ Calculate progress based on items
    const items = spk.salesOrder?.items || [];
    let totalProgress = 0;

    items.forEach((item) => {
      // Find latest field report for this item
      const latestReport = spk.spkFieldReport?.find(
        (report) => report.soDetailId === item.id
      );
      
      const itemProgress = latestReport?.progress || 0;
      totalProgress += itemProgress;
    });

    // Calculate weighted average
    const avgProgress = items.length > 0 
      ? Math.round(totalProgress / items.length) 
      : 0;

    // ✅ Check if progress is 100%
    const isCompleted = avgProgress === 100;

    // 3️⃣ Update SPK progress in database
    await prisma.sPK.update({
      where: { id },
      data: {
        progress: avgProgress,
        spkStatusClose: isCompleted,  // ✅ Set to true if 100%
        updatedAt: new Date(),
      },
    });

    // 4️⃣ If completed, update SalesOrder status to FULFILLED
    if (isCompleted && spk.salesOrderId) {
      await prisma.salesOrder.update({
        where: { id: spk.salesOrderId },
        data: {
          status: "FULFILLED",  // ✅ Mark as fulfilled
        },
      });
    }

    res.json({
      success: true,
      message: isCompleted 
        ? "SPK completed! Progress 100%, SPK closed, and Sales Order marked as FULFILLED" 
        : "SPK progress updated successfully",
      data: {
        spkId: id,
        totalItems: items.length,
        totalProgress: totalProgress,
        averageProgress: avgProgress,
        spkStatusClose: isCompleted,
        salesOrderStatus: isCompleted ? "FULFILLED" : spk.salesOrder?.status,
      },
    });
  } catch (error) {
    console.error("Error updateSPKProgress:", error);
    res.status(500).json({ 
      error: "Failed to update SPK progress",
      details: error.message 
    });
  }
};
