import { PrismaClient } from "../../../../prisma/generated/prisma/index.js";
import { getNextCustomerCode } from "../../../utils/generateCode.js";
const prisma = new PrismaClient();

const trimOrNull = (v) => (v && v.trim() !== "" ? v.trim() : null);

export const createCustomer = async (req, res) => {
  try {
    const body = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const code = await getNextCustomerCode(tx);
      const data = {
        code,
        name: body.name,
        email: trimOrNull(body.email),
        phone: trimOrNull(body.phone),
        address: trimOrNull(body.address),
        branch: trimOrNull(body.branch),
        city: trimOrNull(body.city),
        province: trimOrNull(body.province),
        postalCode: trimOrNull(body.postalCode),
        taxNumber: trimOrNull(body.taxNumber),
        companyType: trimOrNull(body.companyType),
        contactPerson: trimOrNull(body.contactPerson),
        picPhone: trimOrNull(body.picPhone),
        picEmail: trimOrNull(body.picEmail),
        notes: trimOrNull(body.notes),
      };

      return tx.customer.create({
        data,
        select: {
          id: true,
          code: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
        },
      });
    });

    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = error.meta?.target;
      return res
        .status(400)
        .json({ message: `Duplicate value pada field: ${target}` });
    }
    res.status(500).json({ message: "Gagal membuat customer" });
  }
};

// GET /customers - list customer (semua atau hanya yang aktif)
export const getAllCustomers = async (req, res) => {
  try {
    const { activeOnly = "true" } = req.query;
    const filter = activeOnly === "false" ? {} : { isActive: true };
    const customers = await prisma.customer.findMany({
      where: filter,
      orderBy: { createdAt: "desc" },
    });
    res.json(customers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil data customer" });
  }
};

// GET /customers/:id - ambil satu customer berdasarkan id
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({ message: "Customer tidak ditemukan" });
    }
    res.json(customer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil data customer" });
  }
};

// PUT /customers/:id - update customer
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Customer tidak ditemukan" });
    }

    const updated = await prisma.customer.update({
      where: { id },
      data,
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    if (error.code === "P2002") {
      const target = error.meta.target;
      return res
        .status(400)
        .json({ message: `Duplicate pada field: ${target}` });
    }
    res.status(500).json({ message: "Gagal memperbarui customer" });
  }
};

// DELETE /customers/:id - soft delete (isActive = false)
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Customer tidak ditemukan" });
    }
    const deleted = await prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });
    res.json({ message: "Customer dinonaktifkan", customer: deleted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal menghapus customer" });
  }
};

export async function getCustomerCount(req, res) {
  try {
    const count = await prisma.customer.count();
    res.json({ count });
  } catch (err) {
    console.error("[getCustomerCount] error:", err);
    res.status(500).json({ message: "Gagal mengambil jumlah customer" });
  }
}