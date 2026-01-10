// import { PrismaClient } from "../../../prisma/generated/prisma/index.js";
import { prisma } from "../../config/db.js";
import { validationResult } from "express-validator";

// const prisma = new PrismaClient();

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
    this.updateInvoice = this.updateInvoice.bind(this);
    this.getNextInvoiceCode = this.getNextInvoiceCode.bind(this);
    this.postToJournal = this.postToJournal.bind(this);
  }

  async getNextInvoiceCode(tx = prisma) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const romanMonth = this.getRomanMonth(month); // ✅ pakai this.

    // Nama counter unik per tahun, misalnya: INVOICE-2025
    const counterName = `INVOICE-${year}`;

    // Gunakan upsert untuk ambil & tambah counter
    const counter = await tx.counter.upsert({
      where: { name: counterName },
      create: { name: counterName, lastNumber: 1 },
      update: { lastNumber: { increment: 1 } },
      select: { lastNumber: true },
    });

    const sequenceStr = String(counter.lastNumber).padStart(5, "0");
    return `${sequenceStr}/INV-RYLIF/${romanMonth}/${year}`;
  }

  getRomanMonth = (month) => {
    const roman = [
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
    return roman[month - 1] || "I";
  };

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

      const { id } = req.params;
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

      console.log("SalesOrderId from request:", salesOrderId);
      console.log("Items to update:", items);

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

        // Create new invoice items
        const newInvoiceItems = await tx.invoiceItem.createMany({
          data: items.map((item) => ({
            invoiceId: invoice.id,
            soItemId: item.soItemId,
            itemCode: item.itemCode, // itemCode adalah productId
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

        // UPDATE SALES ORDER ITEMS - menggunakan itemCode sebagai productId
        let updatedSalesOrderItemsCount = 0;

        for (const item of items) {
          console.log("Processing item:", {
            soItemId: item.soItemId,
            productId: item.itemCode, // itemCode adalah productId
            salesOrderId: salesOrderId,
            hasSoItemId: !!item.soItemId,
            hasProductId: !!item.itemCode,
            hasSalesOrderId: !!salesOrderId,
          });

          // Gunakan itemCode sebagai productId
          if (item.soItemId && item.itemCode && salesOrderId) {
            try {
              // OPTION 1: Update menggunakan soItemId, salesOrderId, dan productId (itemCode)
              const updateResult = await tx.salesOrderItem.updateMany({
                where: {
                  id: item.soItemId,
                  salesOrderId: salesOrderId,
                  productId: item.itemCode, // itemCode adalah productId
                },
                data: {
                  qty: item.qty,
                  unitPrice: item.unitPrice,
                  discount: item.discount || 0,
                  taxRate: item.taxRate || 0,
                  lineTotal: item.lineTotal,
                },
              });

              console.log(
                `Update result for item ${item.soItemId}:`,
                updateResult
              );
              updatedSalesOrderItemsCount += updateResult.count;

              // Jika tidak ada yang terupdate, coba alternatif
              if (updateResult.count === 0) {
                console.log(
                  `No records updated with productId, trying with soItemId only...`
                );

                // OPTION 2: Fallback - update hanya dengan soItemId
                const fallbackResult = await tx.salesOrderItem.update({
                  where: {
                    id: item.soItemId,
                  },
                  data: {
                    qty: item.qty,
                    unitPrice: item.unitPrice,
                    discount: item.discount || 0,
                    taxRate: item.taxRate || 0,
                    lineTotal: item.lineTotal,
                  },
                });
                console.log(`Fallback update successful:`, fallbackResult);
                updatedSalesOrderItemsCount++;
              }
            } catch (error) {
              console.error(
                `Error updating SalesOrderItem ${item.soItemId}:`,
                error
              );

              // OPTION 3: Last resort - update hanya dengan soItemId
              try {
                const lastResortResult = await tx.salesOrderItem.update({
                  where: {
                    id: item.soItemId,
                  },
                  data: {
                    qty: item.qty,
                    unitPrice: item.unitPrice,
                    discount: item.discount || 0,
                    taxRate: item.taxRate || 0,
                    lineTotal: item.lineTotal,
                  },
                });
                console.log(`Last resort update successful:`, lastResortResult);
                updatedSalesOrderItemsCount++;
              } catch (lastError) {
                console.error(
                  `All update attempts failed for item ${item.soItemId}:`,
                  lastError
                );
              }
            }
          } else {
            console.log("Skipping item - missing required fields:", {
              soItemId: item.soItemId,
              productId: item.itemCode,
              salesOrderId: salesOrderId,
            });
          }
        }

        console.log(
          `Total SalesOrderItems updated: ${updatedSalesOrderItemsCount}`
        );

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
              spk: { select: { id: true } },
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
      const invoiceNumber = await this.getNextInvoiceCode();

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

        // UPDATE SALES ORDER ITEMS - menggunakan itemCode sebagai productId
        let updatedSalesOrderItemsCount = 0;

        for (const item of items) {
          console.log("Processing item:", {
            soItemId: item.soItemId,
            productId: item.itemCode, // itemCode adalah productId
            salesOrderId: salesOrderId,
            hasSoItemId: !!item.soItemId,
            hasProductId: !!item.itemCode,
            hasSalesOrderId: !!salesOrderId,
          });

          // Gunakan itemCode sebagai productId
          if (item.soItemId && item.itemCode && salesOrderId) {
            try {
              // OPTION 1: Update menggunakan soItemId, salesOrderId, dan productId (itemCode)
              const updateResult = await tx.salesOrderItem.updateMany({
                where: {
                  id: item.soItemId,
                  salesOrderId: salesOrderId,
                  productId: item.itemCode, // itemCode adalah productId
                },
                data: {
                  qty: item.qty,
                  unitPrice: item.unitPrice,
                  discount: item.discount || 0,
                  taxRate: item.taxRate || 0,
                  lineTotal: item.lineTotal,
                },
              });

              // console.log(
              //   `Update result for item ${item.soItemId}:`,
              //   updateResult
              // );
              updatedSalesOrderItemsCount += updateResult.count;

              // Jika tidak ada yang terupdate, coba alternatif
              if (updateResult.count === 0) {
                console.log(
                  `No records updated with productId, trying with soItemId only...`
                );

                // OPTION 2: Fallback - update hanya dengan soItemId
                const fallbackResult = await tx.salesOrderItem.update({
                  where: {
                    id: item.soItemId,
                  },
                  data: {
                    qty: item.qty,
                    unitPrice: item.unitPrice,
                    discount: item.discount || 0,
                    taxRate: item.taxRate || 0,
                    lineTotal: item.lineTotal,
                  },
                });
                // console.log(`Fallback update successful:`, fallbackResult);
                updatedSalesOrderItemsCount++;
              }
            } catch (error) {
              console.error(
                `Error updating SalesOrderItem ${item.soItemId}:`,
                error
              );

              // OPTION 3: Last resort - update hanya dengan soItemId
              try {
                const lastResortResult = await tx.salesOrderItem.update({
                  where: {
                    id: item.soItemId,
                  },
                  data: {
                    qty: item.qty,
                    unitPrice: item.unitPrice,
                    discount: item.discount || 0,
                    taxRate: item.taxRate || 0,
                    lineTotal: item.lineTotal,
                  },
                });
                // console.log(`Last resort update successful:`, lastResortResult);
                updatedSalesOrderItemsCount++;
              } catch (lastError) {
                console.error(
                  `All update attempts failed for item ${item.soItemId}:`,
                  lastError
                );
              }
            }
          } else {
            console.log("Skipping item - missing required fields:", {
              soItemId: item.soItemId,
              productId: item.itemCode,
              salesOrderId: salesOrderId,
            });
          }
        }

        // console.log(
        //   `Total SalesOrderItems updated: ${updatedSalesOrderItemsCount}`
        // );

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

      // ✅ TAMBAHKAN: BROADCAST NOTIFICATION HANYA KE ADMIN SAJA
      try {
        // Dapatkan semua user dengan role admin saja (tidak termasuk pic)
        const adminUsers = await prisma.user.findMany({
          where: {
            role: "admin", // Hanya admin saja
            active: true,
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        });

        // console.log(
        //   `📢 Sending Invoice notification to ${adminUsers.length} admin users`
        // );

        // Dapatkan informasi user yang membuat invoice
        const creatorUser = await prisma.user.findUnique({
          where: { id: createdById },
          select: { name: true, email: true },
        });

        const creatorName =
          creatorUser?.name || creatorUser?.email || "Unknown User";

        // Import NotificationService
        const { NotificationService } = await import(
          "../../utils/firebase/notificationService.js"
        );

        // Format amount untuk display
        const formattedAmount = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: currency || "IDR",
        }).format(calculatedTotals.grandTotal || 0);

        // Kirim notifikasi ke setiap admin
        for (const admin of adminUsers) {
          await NotificationService.sendToUser(admin.id, {
            title: "Invoice Baru Dibuat 🧾",
            body: `Invoice ${invoiceNumber} senilai ${formattedAmount} berhasil dibuat oleh ${creatorName}`,
            data: {
              type: "invoice_created",
              invoiceId: completeInvoice.id,
              invoiceNumber: invoiceNumber,
              salesOrderId: salesOrderId,
              soNumber: completeInvoice.salesOrder?.soNumber || "Unknown SO",
              customerName:
                completeInvoice.salesOrder?.customer?.name ||
                "Unknown Customer",
              amount: calculatedTotals.grandTotal?.toString() || "0",
              currency: currency,
              createdBy: creatorName,
              action: `/invoices/${completeInvoice.id}`,
              timestamp: new Date().toISOString(),
            },
          });

          // console.log(`✅ Invoice notification sent to admin: ${admin.email}`);
        }
      } catch (notificationError) {
        // Jangan gagalkan create invoice jika notifikasi gagal
        console.error(
          "❌ Error sending Invoice notification:",
          notificationError
        );
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

      // console.log("🔄 Approving invoice ID:", id);

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

      // console.log("✅ Invoice approved:", updatedInvoice.invoiceNumber);

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
      const {
        page = "1",
        limit = "10",
        status,
        date,
        startDate,
        endDate,
        search,
        customerId,
        sortBy = "createdAt",
        sortOrder = "desc",
        filter,
      } = req.query;

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
      const skip = (pageNum - 1) * limitNum;

      const where = {};

      // Handle date filter parameter (prioritas utama)
      if (date && date !== "all") {
        const today = new Date();

        switch (date) {
          case "today":
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            const endOfToday = new Date();
            endOfToday.setHours(23, 59, 59, 999);
            where.invoiceDate = {
              gte: startOfToday,
              lte: endOfToday,
            };
            break;

          case "this_week":
            const startOfWeek = new Date();
            startOfWeek.setDate(today.getDate() - today.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            const endOfWeek = new Date();
            endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
            endOfWeek.setHours(23, 59, 59, 999);
            where.invoiceDate = {
              gte: startOfWeek,
              lte: endOfWeek,
            };
            break;

          case "this_month":
            const startOfMonth = new Date(
              today.getFullYear(),
              today.getMonth(),
              1
            );
            const endOfMonth = new Date(
              today.getFullYear(),
              today.getMonth() + 1,
              0
            );
            endOfMonth.setHours(23, 59, 59, 999);
            where.invoiceDate = {
              gte: startOfMonth,
              lte: endOfMonth,
            };
            break;

          case "last_7_days":
            const last7Days = new Date();
            last7Days.setDate(today.getDate() - 7);
            last7Days.setHours(0, 0, 0, 0);
            where.invoiceDate = {
              gte: last7Days,
            };
            break;

          case "last_30_days":
            const last30Days = new Date();
            last30Days.setDate(today.getDate() - 30);
            last30Days.setHours(0, 0, 0, 0);
            where.invoiceDate = {
              gte: last30Days,
            };
            break;

          default:
            // Jika ada value date lain, ignore
            break;
        }
      }

      // Handle filter parameter (untuk kompatibilitas dengan filter lama)
      if (filter && filter !== "all") {
        // Jika filter mengandung :, itu adalah filter tanggal format lama
        if (filter.includes(":")) {
          const [type, startDateFilter, endDateFilter] = filter.split(":");

          if (startDateFilter && endDateFilter) {
            where.invoiceDate = {
              gte: new Date(startDateFilter),
              lte: new Date(endDateFilter),
            };
          }
        }
        // Handle filter khusus lainnya
        else if (filter === "overdue") {
          where.status = "OVERDUE";
        } else if (filter === "due_soon") {
          const today = new Date();
          const nextWeek = new Date();
          nextWeek.setDate(today.getDate() + 7);
          where.dueDate = {
            gte: today,
            lte: nextWeek,
          };
          where.status = "UNPAID";
        } else if (filter === "unpaid") {
          where.status = "UNPAID";
        }
        // Jika bukan filter khusus, anggap sebagai status normal
        else if (filter !== "all") {
          where.status = filter;
        }
      }

      // Filter by status (untuk filter status sederhana)
      if (status && status !== "all") {
        where.status = status;
      }

      // Filter by customer
      if (customerId) {
        where.salesOrder = {
          customerId: customerId,
        };
      }

      // Filter by date range (untuk filter manual)
      if (startDate || endDate) {
        where.invoiceDate = {};
        if (startDate) {
          const start = new Date(startDate);
          if (!isNaN(start.getTime())) {
            where.invoiceDate.gte = start;
          }
        }
        if (endDate) {
          const end = new Date(endDate);
          if (!isNaN(end.getTime())) {
            where.invoiceDate.lte = end;
          }
        }
      }

      // Filter by due date range
      if (req.query.dueStartDate || req.query.dueEndDate) {
        where.dueDate = {};
        if (req.query.dueStartDate) {
          const dueStart = new Date(req.query.dueStartDate);
          if (!isNaN(dueStart.getTime())) {
            where.dueDate.gte = dueStart;
          }
        }
        if (req.query.dueEndDate) {
          const dueEnd = new Date(req.query.dueEndDate);
          if (!isNaN(dueEnd.getTime())) {
            where.dueDate.lte = dueEnd;
          }
        }
      }

      // Search functionality
      if (search && search.trim() !== "") {
        const searchTerm = search.trim();
        where.OR = [
          { invoiceNumber: { contains: searchTerm, mode: "insensitive" } },
          {
            salesOrder: {
              customer: {
                name: { contains: searchTerm, mode: "insensitive" },
              },
            },
          },
          {
            salesOrder: {
              soNumber: { contains: searchTerm, mode: "insensitive" },
            },
          },
          {
            notes: { contains: searchTerm, mode: "insensitive" },
          },
          {
            internalNotes: { contains: searchTerm, mode: "insensitive" },
          },
        ];
      }

      // Validate sort parameters
      // Validate sort parameters
      const allowedSortFields = [
        "createdAt",
        "updatedAt",
        "invoiceDate",
        "dueDate",
        "totalAmount",
        "grandTotal",
        "balanceDue",
        "invoiceNumber",
        "status",
        "approvalStatus",
      ];
      const sortField = allowedSortFields.includes(sortBy)
        ? sortBy
        : "createdAt";
      const order = sortOrder.toLowerCase() === "asc" ? "asc" : "desc";

      // Query invoices dengan Prisma - SESUAIKAN DENGAN MODEL
      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          skip,
          take: limitNum,
          include: {
            // Items - sesuai model
            items: {
              select: {
                id: true,
                description: true,
                qty: true, // Ganti qty -> quantity
                unitPrice: true,
                name: true,
                uom: true,
                // total: true, // Tambahkan total
                // uom: true, // Tambahkan uom
              },
            },
            // Installments - sesuai model
            installments: {
              select: {
                id: true,
                dueDate: true,
                amount: true,
                status: true,
                // notes: true, // Tambahkan notes
                installmentNumber: true,
              },
              orderBy: { dueDate: "asc" },
            },
            // Payments - sesuai model
            payments: {
              select: {
                id: true,
                payDate: true, // Ganti payDate -> paymentDate
                amount: true,
                method: true, // Ganti method -> paymentMethod
                reference: true, // Ganti reference -> referenceNumber
                status: true,
                notes: true,
              },
              orderBy: { payDate: "desc" }, // Ganti payDate -> paymentDate
            },
            // Bank account - sesuai model
            bankAccount: {
              select: {
                id: true,
                bankName: true,
                accountNumber: true,
                accountHolder: true,
                branch: true,
              },
            },
            // Sales order dengan relasi lengkap
            salesOrder: {
              select: {
                id: true,
                soNumber: true,
                customer: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                    branch: true,
                    contactPerson: true,
                    phone: true,
                  },
                },
                project: {
                  select: {
                    id: true,
                    name: true,
                    location: true,
                  },
                },
              },
            },
            // Created by user - sesuai model
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            // Approved by karyawan - sesuai model
            approvedBy: {
              select: {
                id: true,
                namaLengkap: true,
                jabatan: true,
                email: true,
              },
            },
            // Invoice taxes - sesuai model
            invoiceTax: {
              select: {
                id: true,
                taxCode: true, // Ganti taxCode -> taxName
                taxRate: true,
                taxAmount: true,
              },
            },
          },
          orderBy: { [sortField]: order },
        }),
        prisma.invoice.count({ where }),
      ]);

      // Transform data untuk memastikan field amount sesuai dengan model
      const transformedInvoices = invoices.map((invoice) => {        
        return {
        ...invoice,
        // Pastikan semua field financial ada dan dalam format yang benar
        subtotal: invoice.subtotal
          ? parseFloat(invoice.subtotal.toString())
          : 0,
        discountTotal: invoice.discountTotal
          ? parseFloat(invoice.discountTotal.toString())
          : 0,
        taxTotal: invoice.taxTotal
          ? parseFloat(invoice.taxTotal.toString())
          : 0,
        grandTotal: invoice.grandTotal
          ? parseFloat(invoice.grandTotal.toString())
          : 0,
        paidTotal: invoice.paidTotal
          ? parseFloat(invoice.paidTotal.toString())
          : 0,
        balanceDue: invoice.balanceDue
          ? parseFloat(invoice.balanceDue.toString())
          : 0,
        totalAmount: invoice.totalAmount
          ? parseFloat(invoice.totalAmount.toString())
          : 0,
        // Currency dan exchange rate
        currency: invoice.currency || "IDR",
        exchangeRate: invoice.exchangeRate
          ? parseFloat(invoice.exchangeRate.toString())
          : 1,
        // Payment term dan installment type
        paymentTerm: invoice.paymentTerm || null,
        installmentType: invoice.installmentType || "FULL",
        // Status fields
        status: invoice.status || "DRAFT",
        approvalStatus: invoice.approvalStatus || "PENDING",
      }});

      const totalPages = Math.ceil(total / limitNum);
      const hasNextPage = pageNum < totalPages;
      const hasPrevPage = pageNum > 1;

      res.json({
        success: true,
        data: transformedInvoices, // ✅ FIXED - gunakan transformedInvoices
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: totalPages,
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? pageNum + 1 : null,
          prevPage: hasPrevPage ? pageNum - 1 : null,
        },
        meta: {
          sortBy: sortField,
          sortOrder: order,
          search: search || null,
          date: date || null,
          status: status || null,
          filters: {
            status: status || null,
            date: date || null,
            startDate: startDate || null,
            endDate: endDate || null,
            customerId: customerId || null,
          },
        },
      });
    } catch (error) {
      console.error("Get invoices error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch invoices",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
        code: "INVOICE_FETCH_ERROR",
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
      // const now = new Date();
      // const currentYear = now.getUTCFullYear();
      // const currentMonth = now.getUTCMonth();
      // const currentDate = now.getUTCDate();

      // // Simple UTC date calculations
      // const startToday = new Date(
      //   Date.UTC(currentYear, currentMonth, currentDate, 0, 0, 0, 0)
      // );
      // const startMonth = new Date(
      //   Date.UTC(currentYear, currentMonth, 1, 0, 0, 0, 0)
      // );
      // const startYear = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0, 0));

      // // Last month calculations
      // const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      // const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      // const startLastMonth = new Date(
      //   Date.UTC(prevMonthYear, prevMonth, 1, 0, 0, 0, 0)
      // );
      // const endLastMonth = new Date(
      //   Date.UTC(currentYear, currentMonth, 0, 23, 59, 59, 999)
      // );
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0–11
      const currentDate = now.getDate();

      const startToday = new Date(
        currentYear,
        currentMonth,
        currentDate,
        0,
        0,
        0,
        0
      );
      const startMonth = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
      const startYear = new Date(currentYear, 0, 1, 0, 0, 0, 0);

      // Bulan lalu (lokal)
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const startLastMonth = new Date(prevMonthYear, prevMonth, 1, 0, 0, 0, 0);
      const endLastMonth = new Date(
        currentYear,
        currentMonth,
        0,
        23,
        59,
        59,
        999
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
      // Collection rate = (Total Paid / Total All Invoices) * 100
      // Total All Invoices = Paid + Pending
      const totalAllInvoices = paidInvoices + pendingInvoices;
      const collectionRate = totalAllInvoices > 0 ? paidInvoices / totalAllInvoices : 0;

      // Debug log untuk memastikan data benar
      console.log("DEBUG Invoice Stats:", {
        today,
        mtd,
        ytd,
        lastMonth: lastMonthTotal,
        yearSummary,
        pendingInvoices,
        paidInvoices,
        totalAllInvoices,
        collectionRate: (collectionRate * 100).toFixed(2) + '%',
      });

      res.json({
        today,
        mtd,
        totalThisMonth: mtd, // Alias untuk frontend
        ytd,
        totalThisYear: ytd, // Alias untuk frontend
        lastMonth: lastMonthTotal,
        totalLastMonth: lastMonthTotal, // Alias untuk frontend
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

  // ====== POSTING TO JOURNAL ======
  async postToJournal(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userName = req.user?.name || "System";

      if (!id) return res.status(400).json({ success: false, message: "Invoice ID required" });

      // 1. Validasi Invoice
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          items: true,
          salesOrder: {
            include: { customer: true }
          },
          invoiceTax: true // Assuming this exists for tax breakdown
        }
      });

      if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });
      
      if (invoice.approvalStatus !== 'APPROVED') {
        return res.status(400).json({ success: false, message: "Only APPROVED invoices can be posted" });
      }

      // Check if already posted
      const existingLedger = await prisma.ledger.findFirst({
        where: {
          referenceNumber: invoice.invoiceNumber,
          referenceType: 'JOURNAL',
          status: { not: 'VOID' }
        }
      });

      if (existingLedger) {
        return res.status(400).json({ success: false, message: "Invoice already posted to Journal" });
      }

      // 2. Cek Periode Akuntansi
      const period = await prisma.accountingPeriod.findFirst({
        where: {
          startDate: { lte: invoice.invoiceDate },
          endDate: { gte: invoice.invoiceDate },
          isClosed: false
        }
      });

      if (!period) {
        // Fallback: Check if period exists but closed? Or just no period.
        return res.status(400).json({ success: false, message: `No open accounting period found for date ${invoice.invoiceDate.toISOString().slice(0, 10)}` });
      }

      // 3. Tentukan COA (Updated based on Provided Data)
      // AR = Piutang Usaha (1-10101)
      // Sales = Pendapatan Jasa Konstruksi (4-10101)
      // Tax = PPN (Belum ada di data, cari by Name)

      // Helper function to get COA by System Key or fallback
      const getCoaBySystemKey = async (key, fallbackCode, fallbackNameSearch) => {
          // 1. Try SystemAccount mapping
          if (prisma.systemAccount) {
             try {
                const systemMap = await prisma.systemAccount.findUnique({
                    where: { key: key },
                    include: { coa: true }
                });
                if (systemMap && systemMap.coa) return systemMap.coa;
             } catch (e) {
                console.warn(`[SystemAccount] Lookup failed for ${key}, using fallback. Error: ${e.message}`);
             }
          }

          // 2. Fallback by Code
          if (fallbackCode) {
              const byCode = await prisma.chartOfAccounts.findUnique({ where: { code: fallbackCode } });
              if (byCode) return byCode;
          }

          // 3. Fallback by Name Search (last resort)
          if (fallbackNameSearch) {
              return await prisma.chartOfAccounts.findFirst({
                  where: {
                      OR: fallbackNameSearch.map(n => ({ name: { contains: n, mode: 'insensitive' } }))
                  }
              });
          }
          return null;
      };

      // AR Account (Piutang Usaha)
      const arAccount = await getCoaBySystemKey('ACCOUNTS_RECEIVABLE', '1-10101', ['Piutang Usaha']);
      
      // Sales Account (Pendapatan Jasa Konstruksi)
      const salesAccountDefault = await getCoaBySystemKey('SALES_REVENUE', '4-10101', ['Pendapatan Jasa', 'Sales']);

      // VAT Out Account (PPN Keluaran)
      const vatOutAccount = await getCoaBySystemKey('VAT_OUT', null, ['PPN Keluaran', 'Utang Pajak', 'VAT Out']);

      if (!arAccount) return res.status(500).json({ success: false, message: "System Error: Mapping for 'ACCOUNTS_RECEIVABLE' not found. Please configure it in System Account Mapping." });
      if (!salesAccountDefault) return res.status(500).json({ success: false, message: "System Error: Mapping for 'SALES_REVENUE' not found. Please configure it in System Account Mapping." });

      // 4. Proses Transaksi Ledger
      const ledgerResult = await prisma.$transaction(async (tx) => {
        // Generate Ledger Number: JV-SI (Journal Voucher - Sales Invoice)
        const ledgerNumber = `JV-SI-${invoice.invoiceNumber.replace(/\//g, '-')}`; 

        // A. Header
        const ledger = await tx.ledger.create({
          data: {
            ledgerNumber: ledgerNumber,
            referenceNumber: invoice.invoiceNumber,
            referenceType: 'JOURNAL', // Type JOURNAL for Sales Invoice
            transactionDate: invoice.invoiceDate,
            postingDate: new Date(),
            description: `Posting Invoice #${invoice.invoiceNumber} - ${invoice.salesOrder?.customer?.name || 'No Customer'}`,
            periodId: period.id,
            status: 'POSTED',
            currency: invoice.currency,
            exchangeRate: invoice.exchangeRate,
            createdBy: userId || 'System',
            postedBy: userId || 'System',
            postedAt: new Date(),
          }
        });

        // B. Debit AR (Total Tagihan)
        // AR harus mencatat total piutang (grandTotal)
        console.log(`[POSTING] Creating AR Debit Entry: ${invoice.grandTotal}`);
        const arLine = await tx.ledgerLine.create({
          data: {
            ledgerId: ledger.id,
            coaId: arAccount.id,
            lineNumber: 1,
            description: `Piutang Usaha - ${invoice.invoiceNumber}`,
            debitAmount: invoice.grandTotal,
            creditAmount: 0,
            // localAmount untuk debit = positif (debit side)
            localAmount: invoice.grandTotal * invoice.exchangeRate,
            currency: invoice.currency,
            exchangeRate: invoice.exchangeRate,
            customerId: invoice.salesOrder?.customer?.id
          }
        });
        console.log(`[POSTING] AR Line Created: ID=${arLine.id}, Debit=${arLine.debitAmount}`);

        // C. Credit Sales Revenue (Per Lines)
        // Setiap item invoice dicatat sebagai revenue
        let lineSeq = 2;
        let totalRevenue = 0;
        console.log(`[POSTING] Creating ${invoice.items.length} Revenue Lines`);
        
        for (const item of invoice.items) {
           // Find Product Specific COA if needed. For now use Default.
           const revenueCoaId = salesAccountDefault.id;

           // Convert Decimal to Number to prevent string concatenation
           let itemAmount = parseFloat(item.lineTotal) || 0;
           
           // FALLBACK: If lineTotal is 0, calculate from item details
           if (itemAmount === 0) {
             const qty = parseFloat(item.qty) || 0;
             const unitPrice = parseFloat(item.unitPrice) || 0;
             const discountFixed = parseFloat(item.discount) || 0;
             const discountPercent = parseFloat(item.discountPercent) || 0;
             const taxRate = parseFloat(item.taxRate) || 0;
             
             // Step 1: Calculate subtotal
             const subtotal = qty * unitPrice;
             
             // Step 2: Calculate discount amount
             let discountAmount = 0;
             if (discountPercent > 0) {
               // Percentage discount takes priority
               discountAmount = subtotal * (discountPercent / 100);
             } else if (discountFixed > 0) {
               // Fixed discount
               discountAmount = discountFixed;
             }
             
             // Step 3: Amount after discount (this is the lineTotal - revenue before tax)
             const amountAfterDiscount = subtotal - discountAmount;
             
             // Step 4: Calculate tax (for information, but not included in lineTotal for revenue)
             const taxAmount = amountAfterDiscount * (taxRate / 100);
             
             // Step 5: lineTotal = amount after discount (revenue portion, excluding tax)
             itemAmount = amountAfterDiscount;
             
             console.log(`[POSTING] ⚠️  LineTotal was 0, calculated:`);
             console.log(`           Qty: ${qty} × UnitPrice: ${unitPrice} = Subtotal: ${subtotal}`);
             console.log(`           Discount: ${discountAmount} (${discountPercent > 0 ? discountPercent + '%' : 'Fixed ' + discountFixed})`);
             console.log(`           After Discount: ${amountAfterDiscount}`);
             console.log(`           Tax (${taxRate}%): ${taxAmount}`);
             console.log(`           → Revenue (lineTotal): ${itemAmount}`);
           }
           
           console.log(`[POSTING] Item ${lineSeq - 1}: ${item.name}, Amount: ${itemAmount}`);
           
           const revenueLine = await tx.ledgerLine.create({
             data: {
               ledgerId: ledger.id,
               coaId: revenueCoaId,
               lineNumber: lineSeq,
               description: `Revenue: ${item.name}`,
               debitAmount: 0,
               creditAmount: itemAmount,
               // localAmount untuk credit = negatif (credit side) 
               localAmount: -(itemAmount * parseFloat(invoice.exchangeRate)),
               currency: invoice.currency,
               exchangeRate: parseFloat(invoice.exchangeRate),
             }
           });
           
           console.log(`[POSTING] Revenue Line Created: ID=${revenueLine.id}, Line=${lineSeq}, Credit=${revenueLine.creditAmount}`);
           totalRevenue += itemAmount;
           lineSeq++;
        }

        // D. Credit Tax (PPN)
        let taxLine = null;
        const taxAmount = parseFloat(invoice.taxTotal) || 0;
        
        if (taxAmount > 0) {
           if (!vatOutAccount) throw new Error("VAT Account (PPN Keluaran) not found");
           
           console.log(`[POSTING] Creating Tax Entry: ${taxAmount}`);
           taxLine = await tx.ledgerLine.create({
             data: {
                ledgerId: ledger.id,
                coaId: vatOutAccount.id,
                lineNumber: lineSeq,
                description: `PPN Keluaran - ${invoice.invoiceNumber}`,
                debitAmount: 0,
                creditAmount: taxAmount,
                // localAmount untuk credit = negatif (credit side)
                localAmount: -(taxAmount * parseFloat(invoice.exchangeRate)),
                currency: invoice.currency,
                exchangeRate: parseFloat(invoice.exchangeRate)
             }
           });
           console.log(`[POSTING] Tax Line Created: ID=${taxLine.id}, Credit=${taxLine.creditAmount}`);
           lineSeq++;
        }

        // E. Validation - Check Balance
        const totalCredit = totalRevenue + taxAmount;
        const debitAmount = parseFloat(invoice.grandTotal);
        
        console.log(`[POSTING] Validation:`);
        console.log(`  - Total Debit (AR): ${debitAmount}`);
        console.log(`  - Total Credit (Revenue + Tax): ${totalCredit}`);
        console.log(`  - Revenue: ${totalRevenue}, Tax: ${taxAmount}`);
        console.log(`  - Balance: ${debitAmount - totalCredit}`);
        
        // Check if all items have zero amount
        if (totalRevenue === 0 && invoice.items.length > 0) {
          throw new Error(`All invoice items have zero amount! Please check invoice calculation. Invoice has ${invoice.items.length} items but total revenue is 0.`);
        }
        
        if (Math.abs(debitAmount - totalCredit) > 0.01) {
          throw new Error(`Journal entry not balanced! Debit: ${debitAmount}, Credit: ${totalCredit} (Revenue: ${totalRevenue} + Tax: ${taxAmount})`);
        }

        console.log(`[POSTING] Journal Entry Complete. Total Lines: ${lineSeq - 1}`);
        
        // F. Update Related Models
        console.log(`[POSTING] Updating related accounting models...`);
        
        // F1. Update Invoice ApprovalStatus to POSTED
        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            approvalStatus: 'POSTED',
            notes: invoice.notes ? `${invoice.notes}\n[Posted to Journal: ${ledger.ledgerNumber}]` : `Posted to Journal: ${ledger.ledgerNumber}`
          }
        });
        console.log(`[POSTING] ✓ Invoice approvalStatus updated to POSTED`);
        
        // F2. Update Trial Balance for all affected COAs
        const affectedCOAs = new Map(); // coaId -> {debit, credit}
        
        // Collect all COA impacts from ledger lines
        const allLines = await tx.ledgerLine.findMany({
          where: { ledgerId: ledger.id },
          select: { coaId: true, debitAmount: true, creditAmount: true }
        });
        
        for (const line of allLines) {
          if (!affectedCOAs.has(line.coaId)) {
            affectedCOAs.set(line.coaId, { debit: 0, credit: 0 });
          }
          const coa = affectedCOAs.get(line.coaId);
          coa.debit += line.debitAmount;
          coa.credit += line.creditAmount;
        }
        
        // Update or create TrialBalance for each COA
        for (const [coaId, amounts] of affectedCOAs) {
          const existing = await tx.trialBalance.findUnique({
            where: {
              periodId_coaId: {
                periodId: period.id,
                coaId: coaId
              }
            }
          });
          
          if (existing) {
            // Update existing
            await tx.trialBalance.update({
              where: { id: existing.id },
              data: {
                periodDebit: existing.periodDebit + amounts.debit,
                periodCredit: existing.periodCredit + amounts.credit,
                endingDebit: existing.endingDebit + amounts.debit,
                endingCredit: existing.endingCredit + amounts.credit,
                ytdDebit: existing.ytdDebit + amounts.debit,
                ytdCredit: existing.ytdCredit + amounts.credit,
                calculatedAt: new Date()
              }
            });
          } else {
            // Create new
            await tx.trialBalance.create({
              data: {
                periodId: period.id,
                coaId: coaId,
                openingDebit: 0,
                openingCredit: 0,
                periodDebit: amounts.debit,
                periodCredit: amounts.credit,
                endingDebit: amounts.debit,
                endingCredit: amounts.credit,
                ytdDebit: amounts.debit,
                ytdCredit: amounts.credit,
                calculatedAt: new Date()
              }
            });
          }
        }
        console.log(`[POSTING] ✓ Trial Balance updated for ${affectedCOAs.size} COAs`);
        
        // F3. Update General Ledger Summary (Daily)
        const transactionDate = new Date(invoice.invoiceDate);
        transactionDate.setHours(0, 0, 0, 0); // Normalize to start of day
        
        for (const [coaId, amounts] of affectedCOAs) {
          const existingSummary = await tx.generalLedgerSummary.findUnique({
            where: {
              coaId_periodId_date: {
                coaId: coaId,
                periodId: period.id,
                date: transactionDate
              }
            }
          });
          
          const netChange = amounts.debit - amounts.credit;
          
          if (existingSummary) {
            await tx.generalLedgerSummary.update({
              where: { id: existingSummary.id },
              data: {
                debitTotal: existingSummary.debitTotal + amounts.debit,
                creditTotal: existingSummary.creditTotal + amounts.credit,
                closingBalance: existingSummary.closingBalance + netChange,
                transactionCount: existingSummary.transactionCount + 1
              }
            });
          } else {
            // Get opening balance from previous day
            const previousSummary = await tx.generalLedgerSummary.findFirst({
              where: {
                coaId: coaId,
                periodId: period.id,
                date: { lt: transactionDate }
              },
              orderBy: { date: 'desc' }
            });

            const openingBalance = previousSummary ? Number(previousSummary.closingBalance) : 0;
            const closingBalance = openingBalance + netChange;

            await tx.generalLedgerSummary.create({
              data: {
                coaId: coaId,
                periodId: period.id,
                date: transactionDate,
                openingBalance: openingBalance,
                debitTotal: amounts.debit,
                creditTotal: amounts.credit,
                closingBalance: closingBalance,
                transactionCount: 1
              }
            });

            // Update all future dates' balances
            const futureSummaries = await tx.generalLedgerSummary.findMany({
              where: {
                coaId: coaId,
                periodId: period.id,
                date: { gt: transactionDate }
              },
              orderBy: { date: 'asc' }
            });

            let runningBalance = closingBalance;
            for (const futureSummary of futureSummaries) {
              const newOpening = runningBalance;
              const newClosing = newOpening + Number(futureSummary.debitTotal) - Number(futureSummary.creditTotal);
              
              await tx.generalLedgerSummary.update({
                where: { id: futureSummary.id },
                data: {
                  openingBalance: newOpening,
                  closingBalance: newClosing
                }
              });

              runningBalance = newClosing;
            }
          }
        }
        console.log(`[POSTING] ✓ General Ledger Summary updated for ${transactionDate.toISOString().split('T')[0]}`);
        
        return ledger;
      });

      return res.status(200).json({
        success: true,
        message: "Invoice successfully posted to Journal",
        data: ledgerResult
      });

    } catch (error) {
      console.error("Post Journal Error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new InvoiceController();
