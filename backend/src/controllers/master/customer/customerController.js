import { PrismaClient } from '../../../../prisma/generated/prisma/index.js';
const prisma = new PrismaClient();

// GET /customers - list customer (semua atau hanya yang aktif)
export const getAllCustomers = async (req, res) => {
  try {
    const { activeOnly = 'true' } = req.query;
    const filter = activeOnly === 'false' ? {} : { isActive: true };
    const customers = await prisma.customer.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
    });
    res.json(customers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil data customer' });
  }
};

// GET /customers/:id - ambil satu customer berdasarkan id
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({ message: 'Customer tidak ditemukan' });
    }
    res.json(customer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil data customer' });
  }
};

// POST /customers - buat customer baru
export const createCustomer = async (req, res) => {
  try {
    const data = req.body;
    console.log("Received:", req.body);
    const newCustomer = await prisma.customer.create({ data });
    res.status(201).json(newCustomer);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      const target = error.meta.target;
      return res.status(400).json({ message: `Duplicate value pada field: ${target}` });
    }
    res.status(500).json({ message: 'Gagal membuat customer' });
  }
};

// PUT /customers/:id - update customer
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Customer tidak ditemukan' });
    }

    const updated = await prisma.customer.update({
      where: { id },
      data,
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      const target = error.meta.target;
      return res.status(400).json({ message: `Duplicate pada field: ${target}` });
    }
    res.status(500).json({ message: 'Gagal memperbarui customer' });
  }
};

// DELETE /customers/:id - soft delete (isActive = false)
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Customer tidak ditemukan' });
    }
    const deleted = await prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });
    res.json({ message: 'Customer dinonaktifkan', customer: deleted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal menghapus customer' });
  }
};
