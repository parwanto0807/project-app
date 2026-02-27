import { prisma } from "../../config/db.js";

export const createDocument = async (req, res) => {
  try {
    const {
      title,
      type,
      status,
      version,
      content,
      sections,
      departments,
      employeeIds,
    } = req.body;

    const document = await prisma.document.create({
      data: {
        title,
        type,
        status,
        version,
        content,
        createdById: req.user.id,
        sections: {
          create: sections?.map((section) => ({
            title: section.title,
            orderIndex: section.orderIndex,
            content: section.content,
            items: {
              create: section.items?.map((item) => ({
                content: item.content,
                itemNumber: item.itemNumber,
                orderIndex: item.orderIndex,
              })) || [],
            },
          })) || [],
        },
        departments: {
          create: departments?.map((dept) => ({
            department: {
              connectOrCreate: {
                where: { code: dept.code },
                create: { code: dept.code, name: dept.name || dept.code },
              },
            },
            isPrimary: dept.isPrimary || false,
          })) || [],
        },
        employees: {
          create: employeeIds?.map((empId) => ({
            karyawan: { connect: { id: empId } },
          })) || [],
        },
      },
      include: {
        sections: {
          include: { items: true },
        },
        departments: {
          include: { department: true },
        },
        employees: {
          include: { karyawan: true },
        },
      },
    });

    res.status(201).json(document);
  } catch (error) {
    console.error("[createDocument] error:", error);
    res.status(500).json({ 
      message: "Gagal membuat dokumen", 
      detail: error.message,
      error: error.code // Prisma error code
    });
  }
};

export const getAllDocuments = async (req, res) => {
  try {
    const { type, departmentCode } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (departmentCode) {
      filter.departments = {
        some: {
          department: { code: departmentCode },
        },
      };
    }

    const { employeeId } = req.query;
    if (employeeId) {
      // If employeeId is provided, we might want to override or add to the filter
      // For now, let's allow finding documents specifically assigned to this employee
      // OR documents assigned to their department if departmentCode is also provided
      if (departmentCode) {
        filter.OR = [
          { departments: { some: { department: { code: departmentCode } } } },
          { employees: { some: { karyawanId: employeeId } } }
        ];
        delete filter.departments; // Clean up
      } else {
        filter.employees = {
          some: { karyawanId: employeeId },
        };
      }
    }

    const documents = await prisma.document.findMany({
      where: filter,
      include: {
        departments: { include: { department: true } },
        employees: { include: { karyawan: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(documents);
  } catch (error) {
    console.error("[getAllDocuments] error:", error);
    res.status(500).json({ message: "Gagal mengambil data dokumen" });
  }
};

export const getDocumentById = async (req, res) => {
  const { id } = req.params;
  try {
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        sections: {
          include: { items: true },
          orderBy: { orderIndex: "asc" },
        },
        departments: {
          include: { department: true },
        },
        employees: {
          include: { karyawan: true },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ message: "Dokumen tidak ditemukan" });
    }

    res.json(document);
  } catch (error) {
    console.error("[getDocumentById] error:", error);
    res.status(500).json({ message: "Gagal mengambil detail dokumen" });
  }
};

export const deleteDocument = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.document.delete({ where: { id } });
    res.json({ message: "Dokumen berhasil dihapus" });
  } catch (error) {
    console.error("[deleteDocument] error:", error);
    res.status(500).json({ message: "Gagal menghapus dokumen" });
  }
};

export const getAllDepartments = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
    });
    res.json(departments);
  } catch (error) {
    console.error("[getAllDepartments] error:", error);
    res.status(500).json({ message: "Gagal mengambil data departemen" });
  }
};
export const getAllEmployees = async (req, res) => {
  try {
    const employees = await prisma.karyawan.findMany({
      select: {
        id: true,
        namaLengkap: true,
        nik: true,
        jabatan: true,
        departemen: true,
      },
      orderBy: { namaLengkap: "asc" },
    });
    res.json(employees);
  } catch (error) {
    console.error("[getAllEmployees] error:", error);
    res.status(500).json({ message: "Gagal mengambil data karyawan" });
  }
};

export const updateDocument = async (req, res) => {
  const { id } = req.params;
  try {
    const {
      title,
      type,
      status,
      version,
      content,
      sections,
      departments,
      employeeIds,
    } = req.body;

    // Use transaction for consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update basic fields
      const updatedDoc = await tx.document.update({
        where: { id },
        data: {
          title,
          type,
          status,
          version,
          content,
        },
      });

      // 2. Handle Departments (delete and recreate for simplicity)
      await tx.documentDepartment.deleteMany({ where: { documentId: id } });
      if (departments?.length > 0) {
        for (const dept of departments) {
          await tx.documentDepartment.create({
            data: {
              document: { connect: { id } },
              department: {
                connectOrCreate: {
                  where: { code: dept.code },
                  create: { code: dept.code, name: dept.name || dept.code },
                },
              },
              isPrimary: dept.isPrimary || false,
            },
          });
        }
      }

      // 3. Handle Employees
      await tx.documentKaryawan.deleteMany({ where: { documentId: id } });
      if (employeeIds?.length > 0) {
        await tx.documentKaryawan.createMany({
          data: employeeIds.map((empId) => ({
            documentId: id,
            karyawanId: empId,
          })),
        });
      }

      // 4. Handle Sections and Items (delete and recreate is cleanest for nested data)
      await tx.documentSection.deleteMany({ where: { documentId: id } });
      if (sections?.length > 0) {
        for (const section of sections) {
          await tx.documentSection.create({
            data: {
              documentId: id,
              title: section.title,
              content: section.content,
              orderIndex: section.orderIndex,
              items: {
                create: section.items?.map((item) => ({
                  content: item.content,
                  itemNumber: item.itemNumber,
                  orderIndex: item.orderIndex,
                })) || [],
              },
            },
          });
        }
      }

      return updatedDoc;
    });

    res.json(result);
  } catch (error) {
    console.error("[updateDocument] error:", error);
    res.status(500).json({ message: "Gagal memperbarui dokumen", detail: error.message });
  }
};
