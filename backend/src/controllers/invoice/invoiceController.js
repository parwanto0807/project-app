import { PrismaClient } from "../../../prisma/generated/prisma/index.js";
import { validationResult } from "express-validator";

const prisma = new PrismaClient();

// Start of day lokal (misal UTC+7 untuk Jakarta)
export function startOfDayLocal(d, tzOffsetMinutes) {
  d = d || new Date();
  tzOffsetMinutes = tzOffsetMinutes || 0;
  const dt = new Date(d);
  dt.setMinutes(dt.getMinutes() + tzOffsetMinutes);
  dt.setHours(0, 0, 0, 0);
  dt.setMinutes(dt.getMinutes() - tzOffsetMinutes);
  return dt;
}

export function startOfMonthLocal(d, tzOffsetMinutes) {
  d = d || new Date();
  tzOffsetMinutes = tzOffsetMinutes || 0;
  const dt = new Date(d);
  dt.setMinutes(dt.getMinutes() + tzOffsetMinutes);
  dt.setDate(1);
  dt.setHours(0, 0, 0, 0);
  dt.setMinutes(dt.getMinutes() - tzOffsetMinutes);
  return dt;
}

export function startOfYearLocal(d, tzOffsetMinutes) {
  d = d || new Date();
  tzOffsetMinutes = tzOffsetMinutes || 0;
  const dt = new Date(d);
  dt.setMinutes(dt.getMinutes() + tzOffsetMinutes);
  dt.setMonth(0, 1);
  dt.setHours(0, 0, 0, 0);
  dt.setMinutes(dt.getMinutes() - tzOffsetMinutes);
  return dt;
}

export function startOfLastMonthLocal(d, tzOffsetMinutes) {
  d = d || new Date();
  tzOffsetMinutes = tzOffsetMinutes || 0;
  const dt = new Date(d);
  dt.setMonth(dt.getMonth() - 1, 1);
  dt.setHours(0, 0, 0, 0);
  return new Date(dt.getTime() - tzOffsetMinutes * 60000);
}

export function endOfLastMonthLocal(d, tzOffsetMinutes) {
  d = d || new Date();
  tzOffsetMinutes = tzOffsetMinutes || 0;
  const dt = new Date(d);
  dt.setDate(0);
  dt.setHours(23, 59, 59, 999);
  return new Date(dt.getTime() - tzOffsetMinutes * 60000);
}

// Safely convert Prisma Decimal / null / undefined -> number
export function num(x) {
  return x == null ? 0 : Number(x);
}

class InvoiceController {
  constructor() {
    this.createInvoice = this.createInvoice.bind(this);
    this.updateInvoice = this.updateInvoice.bind(this);
    this.generateInvoiceNumber = this.generateInvoiceNumber.bind(this);
  }

  async generateInvoiceNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const romanMonth = this.getRomanMonth(month);

    // Cari invoice terakhir tahun ini
    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: {
          contains: `/${year}`,
        },
      },
      orderBy: {
        invoiceNumber: "desc",
      },
    });

    let sequence = 1;
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const lastNumber = lastInvoice.invoiceNumber.split("/")[0];
      sequence = parseInt(lastNumber) + 1;
    }

    const sequenceStr = sequence.toString().padStart(5, "0");
    return `${sequenceStr}/INV-RYLIF/${romanMonth}/${year}`;
  }

  // Konversi bulan ke angka Romawi
  getRomanMonth(month) {
    const romanNumerals = [
      "I",
      "II",
      "III",
      "IV",
      "V",
      "VI",
      "VII",
      "VIII",
      "IX",
      "X",
      "XI",
      "XII",
    ];
    return romanNumerals[month - 1];
  }

  async updateInvoice(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array(),
        });
      }

      const { id } = req.params; // invoiceId dari URL
      const {
        salesOrderId,
        invoiceDate,
        dueDate,
        currency = "IDR",
        exchangeRate = 1,
        paymentTerm,
        installmentType = "FULL",
        bankAccountId,
        items,
        installments,
        notes,
        internalNotes,
        termsConditions,
        createdById,
        approvedById,
      } = req.body;

      // Hitung ulang total
      const calculatedTotals = this.calculateInvoiceTotals(items);

      const result = await prisma.$transaction(async (tx) => {
        // Update invoice master
        const invoice = await tx.invoice.update({
          where: { id },
          data: {
            invoiceDate: new Date(invoiceDate),
            dueDate: new Date(dueDate),
            salesOrderId: salesOrderId || null,
            currency,
            exchangeRate,
            paymentTerm,
            installmentType,
            bankAccountId,
            ...calculatedTotals,
            notes,
            internalNotes,
            termsConditions,
            createdById,
            approvedById,
          },
        });

        // Hapus items lama & buat ulang
        await tx.invoiceItem.deleteMany({ where: { invoiceId: invoice.id } });
        await tx.invoiceItem.createMany({
          data: items.map((item) => ({
            invoiceId: invoice.id,
            soItemId: item.soItemId,
            itemCode: item.itemCode,
            name: item.name,
            description: item.description,
            uom: item.uom,
            qty: item.qty,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            discountPercent: item.discountPercent || 0,
            taxRate: item.taxRate || 0,
            taxCode: item.taxCode,
            taxable: item.taxable !== false,
            lineTotal: item.lineTotal,
            taxAmount: item.taxAmount,
            netAmount: item.netAmount,
          })),
        });

        // Hapus installments lama & buat ulang jika ada
        await tx.installment.deleteMany({ where: { invoiceId: invoice.id } });
        if (installments && installments.length > 0) {
          await tx.installment.createMany({
            data: installments.map((inst, index) => ({
              invoiceId: invoice.id,
              installmentNumber: index + 1,
              name: inst.name,
              amount: inst.amount,
              percentage: inst.percentage,
              dueDate: new Date(inst.dueDate),
              description: inst.description,
              conditions: inst.conditions,
            })),
          });
        }

        // Update tax summary
        await tx.invoiceTax.deleteMany({ where: { invoiceId: invoice.id } });
        await this.createTaxSummary(tx, invoice.id, items);

        return invoice;
      });

      // Ambil data lengkap setelah update
      const completeInvoice = await prisma.invoice.findUnique({
        where: { id: result.id },
        include: {
          items: true,
          installments: true,
          invoiceTax: true,
          salesOrder: {
            select: {
              id: true,
              soNumber: true,
              customer: { select: { name: true, address: true } },
              spk: { select: { id: true } }, // array
            },
          },
          createdBy: { select: { name: true, email: true } },
        },
      });

      res.status(200).json({
        success: true,
        message: "Invoice updated successfully",
        data: completeInvoice,
      });
    } catch (error) {
      console.error("Update invoice error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update invoice",
        error: error.message,
      });
    }
  }
  // Calculate invoice totals from items
  calculateInvoiceTotals(items) {
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    items.forEach((item) => {
      const lineTotal = item.qty * item.unitPrice;
      const discountAmount =
        lineTotal * (item.discountPercent / 100) + item.discount;
      const taxableAmount = lineTotal - discountAmount;
      const taxAmount = item.taxable ? taxableAmount * (item.taxRate / 100) : 0;

      subtotal += lineTotal;
      discountTotal += discountAmount;
      taxTotal += taxAmount;
    });

    const grandTotal = subtotal - discountTotal + taxTotal;

    return {
      totalAmount: grandTotal,
      subtotal,
      discountTotal,
      taxTotal,
      grandTotal,
      paidTotal: 0,
      balanceDue: grandTotal,
    };
  }
  // Create new invoice
  async createInvoice(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array(),
        });
      }

      const {
        salesOrderId,
        invoiceDate,
        dueDate,
        currency = "IDR",
        exchangeRate = 1,
        paymentTerm,
        installmentType = "FULL",
        bankAccountId,
        items,
        installments,
        notes,
        internalNotes,
        termsConditions,
        createdById, // Get from request body
        approvedById, // Get from request body (can be null if not approved yet)
      } = req.body;

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();

      // Calculate totals from items
      const calculatedTotals = this.calculateInvoiceTotals(items);

      // Start transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create invoice
        const invoice = await tx.invoice.create({
          data: {
            invoiceNumber,
            invoiceDate: new Date(invoiceDate),
            dueDate: new Date(dueDate),
            salesOrderId: salesOrderId || null,
            currency,
            exchangeRate,
            paymentTerm,
            installmentType,
            bankAccountId,
            ...calculatedTotals,
            notes,
            internalNotes,
            termsConditions,
            createdById,
            approvedById,
            items: {
              create: items.map((item) => ({
                soItemId: item.soItemId,
                itemCode: item.itemCode,
                name: item.name,
                description: item.description,
                uom: item.uom,
                qty: item.qty,
                unitPrice: item.unitPrice,
                discount: item.discount || 0,
                discountPercent: item.discountPercent || 0,
                taxRate: item.taxRate || 0,
                taxCode: item.taxCode,
                taxable: item.taxable !== false,
                lineTotal: item.lineTotal,
                taxAmount: item.taxAmount,
                netAmount: item.netAmount,
              })),
            },
          },
          include: {
            items: true,
          },
        });

        // Create installments if provided
        if (installments && installments.length > 0) {
          await tx.installment.createMany({
            data: installments.map((inst, index) => ({
              invoiceId: invoice.id,
              installmentNumber: index + 1,
              name: inst.name,
              amount: inst.amount,
              percentage: inst.percentage,
              dueDate: new Date(inst.dueDate),
              description: inst.description,
              conditions: inst.conditions,
            })),
          });
        }

        // Create tax summary
        await this.createTaxSummary(tx, invoice.id, items);

        return invoice;
      });

      // Get complete invoice data
      const completeInvoice = await prisma.invoice.findUnique({
        where: { id: result.id },
        include: {
          items: true,
          installments: true,
          invoiceTax: true,
          salesOrder: {
            select: {
              id: true,
              soNumber: true,
              customer: { select: { name: true, address: true } },
              spk: { select: { id: true } }, // array
            },
          },
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      //Update Status SPK to True
      if (completeInvoice?.salesOrder?.spk.length) {
        await prisma.sPK.update({
          where: { id: completeInvoice.salesOrder.spk[0].id }, // ambil SPK pertama
          data: { spkStatusClose: true },
        });
      }

      // Update status sales order → "INVOICED"
      if (completeInvoice?.salesOrder?.id) {
        await prisma.salesOrder.update({
          where: { id: completeInvoice.salesOrder.id },
          data: { status: "INVOICED" },
        });
      }
      res.status(201).json({
        success: true,
        message: "Invoice created successfully",
        data: completeInvoice,
      });
    } catch (error) {
      console.error("Create invoice error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create invoice",
        error: error.message,
      });
    }
  }

  async approveInvoice(req, res) {
    try {
      const { id } = req.params;

      console.log("🔄 Approving invoice ID:", id);

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Invoice ID is required",
        });
      }

      // Cari invoice pakai findUnique
      const invoice = await prisma.invoice.findUnique({
        where: { id }, // pastikan kolom primary key di Prisma memang 'id'
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: `Invoice with ID ${id} not found`,
        });
      }

      // Update status invoice
      const updatedInvoice = await prisma.invoice.update({
        where: { id },
        data: {
          approvalStatus: "APPROVED",
          status: "UNPAID",
          approvedAt: new Date(),
        },
      });

      console.log("✅ Invoice approved:", updatedInvoice.invoiceNumber);

      return res.json({
        success: true,
        message: "Invoice approved successfully",
        data: updatedInvoice,
      });
    } catch (error) {
      console.error("❌ Error in approveInvoice:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to approve invoice",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  // Method khusus untuk reject invoice
  async rejectInvoice(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user.id;

      const invoice = await prisma.invoice.update({
        where: { id },
        data: {
          status: "REJECTED",
          approvalStatus: "REJECTED",
          rejectedById: userId,
          rejectedReason: reason,
        },
        include: {
          createdBy: { select: { name: true, email: true } },
          rejectedBy: { select: { name: true } },
        },
      });

      res.json({
        success: true,
        message: "Invoice rejected successfully",
        data: invoice,
      });
    } catch (error) {
      console.error("Reject invoice error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to reject invoice",
        error: error.message,
      });
    }
  }

  // Create tax summary
  async createTaxSummary(tx, invoiceId, items) {
    const taxSummary = {};

    items.forEach((item) => {
      if (item.taxable && item.taxCode) {
        const key = `${item.taxCode}-${item.taxRate}`;
        if (!taxSummary[key]) {
          taxSummary[key] = {
            taxCode: item.taxCode,
            taxRate: item.taxRate,
            taxableAmount: 0,
            taxAmount: 0,
          };
        }

        const lineTotal = item.qty * item.unitPrice;
        const discountAmount =
          lineTotal * (item.discountPercent / 100) + item.discount;
        const taxableAmount = lineTotal - discountAmount;
        const taxAmount = taxableAmount * (item.taxRate / 100);

        taxSummary[key].taxableAmount += taxableAmount;
        taxSummary[key].taxAmount += taxAmount;
      }
    });

    const taxEntries = Object.values(taxSummary);
    if (taxEntries.length > 0) {
      await tx.invoiceTax.createMany({
        data: taxEntries.map((tax) => ({
          invoiceId,
          ...tax,
        })),
      });
    }
  }

  // Get all invoices with pagination
  async getInvoices(req, res) {
    try {
      // ambil query, default string karena dari URL
      const {
        page = "1",
        limit = "10",
        status,
        startDate,
        endDate,
        search,
      } = req.query;

      // pastikan dikonversi ke number
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const skip = (pageNum - 1) * limitNum;

      const where = {};

      // Filter by status
      if (status) {
        where.status = status;
      }

      // Filter by date range
      if (startDate || endDate) {
        where.invoiceDate = {};
        if (startDate) where.invoiceDate.gte = new Date(startDate);
        if (endDate) where.invoiceDate.lte = new Date(endDate);
      }

      // Search by invoice number or customer name
      if (search) {
        where.OR = [
          { invoiceNumber: { contains: search, mode: "insensitive" } },
          {
            salesOrder: {
              customerName: { contains: search, mode: "insensitive" },
            },
          },
        ];
      }

      // query prisma
      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          skip,
          take: limitNum,
          include: {
            items: true,
            installments: true,
            payments: true,
            bankAccount: {
              select: {
                bankName: true,
                accountNumber: true,
                accountHolder: true,
              },
            },
            salesOrder: {
              select: {
                id: true,
                soNumber: true,
                customer: {
                  select: {
                    name: true,
                    address: true,
                    branch: true,
                  },
                },
              },
            },
            createdBy: {
              select: { name: true },
            },
            approvedBy: {
              select: { namaLengkap: true, jabatan: true },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.invoice.count({ where }),
      ]);

      // response
      res.json({
        success: true,
        data: invoices,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error("Get invoices error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch invoices",
        error: error.message,
      });
    }
  }

  // Get invoice by ID
  async getInvoiceById(req, res) {
    try {
      const { id } = req.params;

      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          items: true,
          installments: true,
          payments: true,
          bankAccount: {
            select: {
              bankName: true,
              accountNumber: true,
              accountHolder: true,
            },
          },
          salesOrder: {
            select: {
              soNumber: true,
              customer: {
                select: {
                  name: true,
                  address: true,
                  branch: true,
                },
              },
            },
          },
          createdBy: {
            select: { name: true },
          },
          approvedBy: {
            select: { namaLengkap: true, jabatan: true },
          },
        },
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      res.json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      console.error("Get invoice error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch invoice",
        error: error.message,
      });
    }
  }

  // Update invoice status
  async updateInvoiceStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, rejectedReason } = req.body;

      const updateData = { status };

      // Jika status rejected, simpan alasan
      if (status === "REJECTED" && rejectedReason) {
        updateData.rejectedReason = rejectedReason;
        updateData.rejectedById = req.user.id;
      }

      // Jika status approved, set approvedBy dan approvedAt
      if (status === "APPROVED") {
        updateData.approvedById = req.user.id;
        updateData.approvedAt = new Date();
        updateData.approvalStatus = "APPROVED";
      }

      const invoice = await prisma.invoice.update({
        where: { id },
        data: updateData,
        include: {
          createdBy: {
            select: { name: true },
          },
          approvedBy: {
            select: { name: true },
          },
        },
      });

      res.json({
        success: true,
        message: `Invoice ${status.toLowerCase()} successfully`,
        data: invoice,
      });
    } catch (error) {
      console.error("Update invoice status error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update invoice status",
        error: error.message,
      });
    }
  }

  // Add payment to invoice
  async addPayment(req, res) {
    try {
      const { id } = req.params;
      const {
        payDate,
        amount,
        method,
        bankAccount,
        reference,
        notes,
        installmentId,
        verifiedById,
      } = req.body;

      const result = await prisma.$transaction(async (tx) => {
        // Create payment
        const payment = await tx.payment.create({
          data: {
            invoiceId: id,
            installmentId: installmentId || null,
            payDate: new Date(payDate),
            amount,
            method,
            bankAccount,
            reference,
            notes,
            verifiedById,
          },
        });

        // Update invoice paid total and balance
        await tx.invoice.update({
          where: { id },
          data: {
            paidTotal: { increment: amount },
            balanceDue: { decrement: amount },
            status: "PAID",
          },
        });

        // Update installment if provided
        if (installmentId) {
          await tx.installment.update({
            where: { id: installmentId },
            data: {
              paidAmount: { increment: amount },
              balance: { decrement: amount },
            },
          });
        }

        const completeInvoice = await prisma.invoice.findUnique({
          where: { id },
          include: {
            salesOrder: {
              select: {
                id: true,
              },
            },
          },
        });

        // Update status sales order → "INVOICED"
        if (completeInvoice?.salesOrder?.id) {
          await prisma.salesOrder.update({
            where: { id: completeInvoice.salesOrder.id },
            data: { status: "PAID" },
          });
        }

        return payment;
      });

      res.status(201).json({
        success: true,
        message: "Payment added successfully",
        data: result,
      });
    } catch (error) {
      console.error("Add payment error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add payment",
        error: error.message,
      });
    }
  }

  // Delete invoice
  async deleteInvoice(req, res) {
    try {
      const { id } = req.params;

      await prisma.invoice.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "Invoice deleted successfully",
      });
    } catch (error) {
      console.error("Delete invoice error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete invoice",
        error: error.message,
      });
    }
  }

  // ====== INVOICE STATS ======
  async getInvoiceStats(req, res) {
    try {
      const now = new Date();
      const currentYear = now.getUTCFullYear();
      const currentMonth = now.getUTCMonth();
      const currentDate = now.getUTCDate();

      // Simple UTC date calculations
      const startToday = new Date(
        Date.UTC(currentYear, currentMonth, currentDate, 0, 0, 0, 0)
      );
      const startMonth = new Date(
        Date.UTC(currentYear, currentMonth, 1, 0, 0, 0, 0)
      );
      const startYear = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0, 0));

      // Last month calculations
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const startLastMonth = new Date(
        Date.UTC(prevMonthYear, prevMonth, 1, 0, 0, 0, 0)
      );
      const endLastMonth = new Date(
        Date.UTC(currentYear, currentMonth, 0, 23, 59, 59, 999)
      );

      const [
        todayAgg,
        mtdAgg,
        ytdAgg,
        lastMonthAgg,
        yearSummaryAgg,
        pendingAgg,
        paidAgg,
      ] = await Promise.all([
        prisma.invoice.aggregate({
          _sum: { grandTotal: true },
          where: { invoiceDate: { gte: startToday, lte: now } },
        }),
        prisma.invoice.aggregate({
          _sum: { grandTotal: true },
          where: { invoiceDate: { gte: startMonth, lte: now } },
        }),
        prisma.invoice.aggregate({
          _sum: { grandTotal: true },
          where: { invoiceDate: { gte: startYear, lte: now } },
        }),
        prisma.invoice.aggregate({
          _sum: { grandTotal: true },
          where: { invoiceDate: { gte: startLastMonth, lte: endLastMonth } },
        }),
        prisma.invoice.aggregate({
          _sum: { grandTotal: true },
          where: { invoiceDate: { gte: startYear, lte: now } },
        }),
        prisma.invoice.aggregate({
          _sum: { grandTotal: true },
          where: { status: { in: ["WAITING_APPROVAL", "UNPAID"] } },
        }),
        prisma.invoice.aggregate({
          _sum: { grandTotal: true },
          where: { status: { in: ["PAID", "PARTIALLY_PAID"] } },
        }),
      ]);

      // Handle null results dengan default value 0
      const today = num(todayAgg._sum.grandTotal) || 0;
      const mtd = num(mtdAgg._sum.grandTotal) || 0;
      const ytd = num(ytdAgg._sum.grandTotal) || 0;
      const lastMonthTotal = num(lastMonthAgg._sum.grandTotal) || 0;
      const yearSummary = num(yearSummaryAgg._sum.grandTotal) || 0;
      const pendingInvoices = num(pendingAgg._sum.grandTotal) || 0;
      const paidInvoices = num(paidAgg._sum.grandTotal) || 0;

      // Calculate collection rate dengan handling division by zero
      const totalInvoices = yearSummary || 1; // Avoid division by zero
      const collectionRate = paidInvoices / totalInvoices;

      // Debug log untuk memastikan data benar
      console.log("DEBUG Invoice Stats:", {
        today,
        mtd,
        ytd,
        lastMonth: lastMonthTotal,
        yearSummary,
        pendingInvoices,
        paidInvoices,
        collectionRate,
      });

      res.json({
        today,
        mtd,
        ytd,
        lastMonth: lastMonthTotal,
        yearSummary,
        pendingInvoices,
        paidInvoices,
        collectionRate,
      });
    } catch (err) {
      console.error("[getInvoiceStats] error:", err);
      res.status(500).json({ message: "Gagal mengambil statistik invoice" });
    }
  }

  // ====== INVOICE COUNT ======
  async getInvoiceCount(req, res) {
    try {
      const startOfYear = new Date(new Date().getFullYear(), 0, 1);
      const endOfYear = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59);

      const count = await prisma.invoice.count({
        where: { createdAt: { gte: startOfYear, lte: endOfYear } },
      });

      res.json({ count });
    } catch (err) {
      console.error("[getInvoiceCount] error:", err);
      res
        .status(500)
        .json({ message: "Gagal mengambil jumlah invoice tahun ini" });
    }
  }

  // ====== MONTHLY INVOICE ======
  async getMonthlyInvoice(req, res) {
    try {
      const months = parseInt(req.query.months) || 6;
      const customerId = req.query.customerId;

      const now = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - (months - 1));
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);

      let whereClause = `"i"."invoiceDate" BETWEEN $1 AND $2`;
      const params = [startDate, endDate];

      if (customerId) {
        whereClause += ` AND "so"."customerId" = $${params.length + 1}`;
        params.push(customerId);
      }

      const invoices = await prisma.$queryRawUnsafe(
        `
  SELECT 
    EXTRACT(YEAR FROM "i"."invoiceDate")::integer as year,
    EXTRACT(MONTH FROM "i"."invoiceDate")::integer as month,
    COALESCE(SUM("i"."grandTotal"), 0)::float as total,
    COALESCE(SUM(CASE WHEN "i"."status" IN ('PAID', 'PARTIALLY_PAID') THEN "i"."grandTotal" ELSE 0 END), 0)::float as paid_total
  FROM "Invoice" i
  JOIN "SalesOrder" so ON i."salesOrderId" = so.id
  WHERE ${whereClause}
  GROUP BY year, month
  ORDER BY year, month;
  `,
        ...params
      );

      const monthlyMap = new Map();
      const paidMonthlyMap = new Map();

      invoices.forEach((s) => {
        const key = `${s.year}-${s.month}`;
        monthlyMap.set(key, parseFloat(s.total) || 0);
        paidMonthlyMap.set(key, parseFloat(s.paid_total) || 0);
      });

      const monthlyData = [];
      for (let i = 0; i < months; i++) {
        const date = new Date(startDate);
        date.setMonth(startDate.getMonth() + i);

        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const key = `${year}-${month}`;

        monthlyData.push({
          year,
          month,
          total: monthlyMap.get(key) || 0,
          paid_total: paidMonthlyMap.get(key) || 0,
        });
      }

      res.json({ success: true, data: monthlyData });
    } catch (error) {
      console.error("[getMonthlyInvoice] error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
}

export default new InvoiceController();
