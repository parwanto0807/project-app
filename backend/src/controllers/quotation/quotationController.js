// import { PrismaClient } from "../../../prisma/generated/prisma/index.js";
// import path from "path";
import { prisma } from "../../config/db.js";
import fs from "fs";
import { generateQuotationNumber } from "../../utils/generateQuotaion.js";

// Helper function untuk menghitung total quotation
const calculateQuotationTotals = (
  lines,
  discountType,
  discountValue,
  taxInclusive,
  otherCharges = 0
) => {
  let subtotal = 0;

  // Hitung subtotal dari semua lines
  lines.forEach((line) => {
    let lineTotal = line.qty * line.unitPrice;

    // Apply line discount
    if (line.lineDiscountType === "PERCENT") {
      lineTotal -= lineTotal * (line.lineDiscountValue / 100);
    } else {
      lineTotal -= line.lineDiscountValue;
    }

    // Add tax if applicable
    if (line.tax) {
      if (line.tax.isInclusive) {
        // Tax sudah termasuk dalam harga
        line.taxAmount = lineTotal - lineTotal / (1 + line.tax.rate / 100);
      } else {
        // Tax ditambahkan ke harga
        line.taxAmount = lineTotal * (line.tax.rate / 100);
        lineTotal += line.taxAmount;
      }
    }

    line.lineSubtotal = line.qty * line.unitPrice;
    line.lineTotal = lineTotal;
    subtotal += line.lineSubtotal;
  });

  // Apply global discount
  let totalAfterDiscount = subtotal;
  if (discountType === "PERCENT") {
    totalAfterDiscount = subtotal - subtotal * (discountValue / 100);
  } else {
    totalAfterDiscount = subtotal - discountValue;
  }

  // Calculate tax total
  const taxTotal = lines.reduce((sum, line) => sum + (line.taxAmount || 0), 0);

  let total = totalAfterDiscount + otherCharges;
  if (!taxInclusive) {
    total += taxTotal;
  }

  return {
    subtotal,
    taxTotal,
    total,
    lines,
  };
};

// CREATE Quotation
export const createQuotation = async (req, res) => {
  try {
    const {
      customerId,
      currency = "IDR",
      exchangeRate = 1.0,
      quotationDate,
      status = "DRAFT",
      salesOrderId, // Ini yang menyebabkan error
      validFrom,
      validUntil,
      paymentTermId,
      discountType = "PERCENT",
      discountValue = 0,
      taxInclusive = false,
      otherCharges = 0,
      notes,
      preparedBy,
      lines = [],
    } = req.body;

    if (!customerId) {
      return res.status(400).json({
        error: "customerId diperlukan",
      });
    }

    // Validasi quotationDate
    if (!quotationDate) {
      return res.status(400).json({
        error: "quotationDate diperlukan",
      });
    }

    // VALIDASI: Cek jika salesOrderId diberikan, pastikan SalesOrder exists
    if (salesOrderId) {
      const existingSalesOrder = await prisma.salesOrder.findUnique({
        where: { id: salesOrderId },
      });

      if (!existingSalesOrder) {
        return res.status(400).json({
          error: "Sales Order tidak ditemukan",
        });
      }
    }

    // Generate quotation number otomatis BERDASARKAN quotationDate
    const quotationNumber = await generateQuotationNumber(quotationDate);

    // Check if generated quotation number already exists (safety check)
    const existingQuotation = await prisma.quotation.findUnique({
      where: { quotationNumber },
    });

    if (existingQuotation) {
      // Jika terjadi collision, generate lagi (sangat jarang terjadi)
      quotationNumber = await generateQuotationNumber(quotationDate);

      // Double check
      const existingQuotation2 = await prisma.quotation.findUnique({
        where: { quotationNumber },
      });

      if (existingQuotation2) {
        return res.status(500).json({
          error: "Gagal generate nomor quotation unik",
        });
      }
    }

    // Calculate totals
    const calculatedTotals = calculateQuotationTotals(
      lines,
      discountType,
      parseFloat(discountValue),
      taxInclusive,
      parseFloat(otherCharges)
    );

    // Create quotation dengan transaction
    const quotation = await prisma.$transaction(async (tx) => {
      // Prepare data untuk create quotation
      const quotationData = {
        customerId,
        quotationNumber,
        quotationDate: new Date(quotationDate),
        currency,
        exchangeRate: parseFloat(exchangeRate),
        status,
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        paymentTermId: paymentTermId || null,
        discountType,
        discountValue: parseFloat(discountValue),
        taxInclusive,
        otherCharges: parseFloat(otherCharges),
        notes,
        preparedBy,
        subtotal: calculatedTotals.subtotal,
        taxTotal: calculatedTotals.taxTotal,
        total: calculatedTotals.total,
      };

      // Hanya tambahkan salesOrderId jika ada dan valid
      if (salesOrderId) {
        quotationData.salesOrderId = salesOrderId;
      }

      // Create quotation
      const newQuotation = await tx.quotation.create({
        data: quotationData,
      });

      // Create quotation lines
      if (lines && lines.length > 0) {
        await tx.quotationLine.createMany({
          data: lines.map((line, index) => ({
            quotationId: newQuotation.id,
            lineNo: index + 1,
            lineType: line.lineType || "PRODUCT",
            productId: line.productId || null,
            description: line.description,
            qty: parseFloat(line.qty) || 1,
            uom: line.uom,
            unitPrice: parseFloat(line.unitPrice) || 0,
            lineDiscountType: line.lineDiscountType || "PERCENT",
            lineDiscountValue: parseFloat(line.lineDiscountValue) || 0,
            lineSubtotal: line.lineSubtotal || 0,
            taxId: line.taxId || null,
            taxAmount: line.taxAmount || 0,
            lineTotal: line.lineTotal || 0,
          })),
        });
      }

      // Create history record
      await tx.quotationHistory.create({
        data: {
          quotationId: newQuotation.id,
          version: 1,
          changedBy: preparedBy,
          changeNote: `Quotation created with number: ${quotationNumber}`,
          payload: newQuotation,
        },
      });

      return newQuotation;
    });

    // Get complete quotation data
    const completeQuotation = await prisma.quotation.findUnique({
      where: { id: quotation.id },
      include: {
        customer: true,
        paymentTerm: true,
        lines: {
          include: {
            product: true,
            tax: true,
          },
          orderBy: { lineNo: "asc" },
        },
        attachments: true,
        comments: true,
        histories: {
          orderBy: { changeAt: "desc" },
        },
      },
    });

    res.status(201).json({
      message: "Quotation berhasil dibuat",
      data: completeQuotation,
    });
  } catch (error) {
    console.error("Error creating quotation:", error);

    // Handle specific error messages
    if (error.code === "P2003") {
      return res.status(400).json({
        error: "Data referensi tidak valid",
        details: "Sales Order atau Customer tidak ditemukan",
      });
    }

    res.status(500).json({
      error: "Gagal membuat quotation",
      details: error.message,
    });
  }
};


export const getQuotations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const searchTerm = req.query.searchTerm?.trim() || "";
    const statusFilter = req.query.statusFilter?.trim() || "";
    const customerId = req.query.customerId?.trim() || "";

    const skip = (page - 1) * pageSize;

    // =============================
    //     BUILD WHERE CLAUSE
    // =============================
    const where = {};

    // Search filter
    if (searchTerm) {
      where.OR = [
        { quotationNumber: { contains: searchTerm, mode: "insensitive" } },
        { customer: { name: { contains: searchTerm, mode: "insensitive" } } },
        { customer: { branch: { contains: searchTerm, mode: "insensitive" } } },
        { customer: { email: { contains: searchTerm, mode: "insensitive" } } },
      ];
    }

    // Status filter
    if (statusFilter && statusFilter !== "ALL") {
      where.status = statusFilter;
    }

    // Customer filter
    if (customerId) {
      where.customerId = customerId;
    }

    // =============================
    //     HITUNG TOTAL SESUAI FILTER
    // =============================
    const totalCount = await prisma.quotation.count({ where });
    const totalPages = Math.ceil(totalCount / pageSize);

    // =============================
    //     QUERY DATA QUOTATION
    // =============================
    const quotations = await prisma.quotation.findMany({
      where,
      include: {
        customer: {
          select: { id: true, name: true, code: true, email: true, address: true, branch: true },
        },
        paymentTerm: true,
        lines: {
          select: {
            id: true,
            lineNo: true,
            lineType: true,
            productId: true,
            description: true,
            qty: true,
            uom: true,
            unitPrice: true,
            lineDiscountType: true,
            lineDiscountValue: true,
            lineSubtotal: true,
            taxId: true,
            taxAmount: true,
            lineTotal: true,
            product: { select: { id: true, name: true, code: true } },
            tax: { select: { id: true, name: true, rate: true } },
          },
          orderBy: { lineNo: "asc" },
        },
        _count: { select: { lines: true, attachments: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    });

    // =============================
    //          RESPONSE
    // =============================
    res.json({
      data: quotations,
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
    console.error("GET ALL QUOTATIONS ERROR:", error);
    res.status(500).json({ message: "Gagal mengambil data Quotation", details: error.message });
  }
};


// GET Quotation by ID
export const getQuotationById = async (req, res) => {
  try {
    const { id } = req.params;

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        paymentTerm: true,
        lines: {
          include: {
            product: true,
            tax: true,
          },
          orderBy: { lineNo: "asc" },
        },
        attachments: true,
        comments: {
          orderBy: { createdAt: "desc" },
        },
        salesOrder: true,
        histories: {
          orderBy: { changeAt: "desc" },
        },
        approvals: {
          orderBy: { sequence: "asc" },
        },
      },
    });

    if (!quotation) {
      return res.status(404).json({
        error: "Quotation tidak ditemukan",
      });
    }

    // Pastikan quotationDate ada dalam response
    const quotationWithDate = {
      ...quotation,
      quotationDate: quotation.quotationDate, // Explicitly include quotationDate
    };

    res.json({
      data: quotationWithDate,
    });
  } catch (error) {
    console.error("Error getting quotation:", error);
    res.status(500).json({
      error: "Gagal mengambil data quotation",
      details: error.message,
    });
  }
};

// UPDATE Quotation
export const updateQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customerId,
      quotationDate,
      currency,
      exchangeRate,
      status,
      validFrom,
      validUntil,
      paymentTermId,
      discountType,
      discountValue,
      taxInclusive,
      otherCharges,
      notes,
      preparedBy,
      lines,
    } = req.body;

    // Check if quotation exists
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id },
      include: { lines: true },
    });

    if (!existingQuotation) {
      return res.status(404).json({
        error: "Quotation tidak ditemukan",
      });
    }

    // Calculate new totals if lines are provided
    let calculatedTotals = {};
    if (lines) {
      calculatedTotals = calculateQuotationTotals(
        lines,
        discountType || existingQuotation.discountType,
        parseFloat(discountValue || existingQuotation.discountValue),
        taxInclusive !== undefined
          ? taxInclusive
          : existingQuotation.taxInclusive,
        parseFloat(otherCharges || existingQuotation.otherCharges)
      );
    }

    // Update quotation dengan transaction
    const updatedQuotation = await prisma.$transaction(async (tx) => {
      // Prepare update data - HAPUS customerId dari sini
      const updateData = {
        quotationDate: quotationDate ? new Date(quotationDate) : undefined,
        currency,
        exchangeRate: exchangeRate ? parseFloat(exchangeRate) : undefined,
        status,
        validFrom: validFrom ? new Date(validFrom) : undefined,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        discountType,
        discountValue: discountValue ? parseFloat(discountValue) : undefined,
        taxInclusive,
        otherCharges: otherCharges ? parseFloat(otherCharges) : undefined,
        notes,
        preparedBy,
        ...(lines && {
          subtotal: calculatedTotals.subtotal,
          taxTotal: calculatedTotals.taxTotal,
          total: calculatedTotals.total,
        }),
        version: existingQuotation.version + 1,
      };

      // Tambahkan customer relation JIKA customerId diberikan
      if (customerId) {
        updateData.customer = {
          connect: { id: customerId },
        };
      }

      // Tambahkan paymentTerm relation JIKA paymentTermId diberikan
      if (paymentTermId) {
        updateData.paymentTerm = {
          connect: { id: paymentTermId },
        };
      } else if (paymentTermId === null) {
        // Jika ingin menghapus paymentTerm
        updateData.paymentTerm = {
          disconnect: true,
        };
      }

      // Update quotation dengan data yang sudah disiapkan
      const quotation = await tx.quotation.update({
        where: { id },
        data: updateData,
      });

      // Update lines if provided
      if (lines) {
        // Delete existing lines
        await tx.quotationLine.deleteMany({
          where: { quotationId: id },
        });

        // Create new lines
        if (lines.length > 0) {
          await tx.quotationLine.createMany({
            data: lines.map((line, index) => ({
              quotationId: id,
              lineNo: index + 1,
              lineType: line.lineType || "PRODUCT",
              productId: line.productId || null,
              description: line.description,
              qty: parseFloat(line.qty) || 1,
              uom: line.uom,
              unitPrice: parseFloat(line.unitPrice) || 0,
              lineDiscountType: line.lineDiscountType || "PERCENT",
              lineDiscountValue: parseFloat(line.lineDiscountValue) || 0,
              lineSubtotal: calculatedTotals.lines[index]?.lineSubtotal || 0,
              taxId: line.taxId || null,
              taxAmount: calculatedTotals.lines[index]?.taxAmount || 0,
              lineTotal: calculatedTotals.lines[index]?.lineTotal || 0,
            })),
          });
        }
      }

      // Create history record
      await tx.quotationHistory.create({
        data: {
          quotationId: id,
          version: quotation.version,
          changedBy: preparedBy,
          changeNote: "Quotation updated",
          payload: JSON.parse(JSON.stringify(quotation)),
        },
      });

      return quotation;
    });

    // Get complete updated quotation
    const completeQuotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        paymentTerm: true,
        lines: {
          include: {
            product: true,
            tax: true,
          },
          orderBy: { lineNo: "asc" },
        },
        attachments: true,
        comments: true,
        histories: {
          orderBy: { changeAt: "desc" },
        },
      },
    });

    res.json({
      message: "Quotation berhasil diupdate",
      data: completeQuotation,
    });
  } catch (error) {
    console.error("Error updating quotation:", error);
    res.status(500).json({
      error: "Gagal mengupdate quotation",
      details: error.message,
    });
  }
};

// DELETE Quotation
export const deleteQuotation = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if quotation exists
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id },
    });

    if (!existingQuotation) {
      return res.status(404).json({
        error: "Quotation tidak ditemukan",
      });
    }

    // Delete quotation dengan transaction
    await prisma.$transaction(async (tx) => {
      // Delete related records first
      await tx.quotationLine.deleteMany({
        where: { quotationId: id },
      });

      await tx.quotationHistory.deleteMany({
        where: { quotationId: id },
      });

      await tx.quotationApproval.deleteMany({
        where: { quotationId: id },
      });

      await tx.quotationComment.deleteMany({
        where: { quotationId: id },
      });

      // Delete attachments files
      const attachments = await tx.quotationAttachment.findMany({
        where: { quotationId: id },
      });

      // Delete physical files
      attachments.forEach((attachment) => {
        const filePath = attachment.filePath;
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });

      await tx.quotationAttachment.deleteMany({
        where: { quotationId: id },
      });

      // Finally delete quotation
      await tx.quotation.delete({
        where: { id },
      });
    });

    res.json({
      message: "Quotation berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting quotation:", error);
    res.status(500).json({
      error: "Gagal menghapus quotation",
      details: error.message,
    });
  }
};

// UPDATE Quotation Status
export const updateQuotationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, actedBy } = req.body;

    // Check if quotation exists
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id },
    });

    if (!existingQuotation) {
      return res.status(404).json({
        error: "Quotation tidak ditemukan",
      });
    }

    const updatedQuotation = await prisma.$transaction(async (tx) => {
      // Update quotation status
      const quotation = await tx.quotation.update({
        where: { id },
        data: {
          status,
          ...(status === "APPROVED" && {
            approvedBy: actedBy,
            approvedAt: new Date(),
          }),
        },
      });

      // Create history record
      await tx.quotationHistory.create({
        data: {
          quotationId: id,
          version: quotation.version,
          changedBy: actedBy,
          changeNote: `Status changed to ${status}`,
          payload: quotation,
        },
      });

      // Update or create approval record if status is REVIEW/APPROVED/REJECTED
      if (["REVIEW", "APPROVED", "REJECTED"].includes(status)) {
        const existingApproval = await tx.quotationApproval.findFirst({
          where: { quotationId: id },
        });

        if (existingApproval) {
          await tx.quotationApproval.update({
            where: { id: existingApproval.id },
            data: {
              status,
              notes,
              actedAt: new Date(),
            },
          });
        } else {
          await tx.quotationApproval.create({
            data: {
              quotationId: id,
              approverId: actedBy,
              status,
              notes,
              actedAt: new Date(),
            },
          });
        }
      }

      return quotation;
    });

    res.json({
      message: `Status quotation berhasil diubah menjadi ${status}`,
      data: updatedQuotation,
    });
  } catch (error) {
    console.error("Error updating quotation status:", error);
    res.status(500).json({
      error: "Gagal mengupdate status quotation",
      details: error.message,
    });
  }
};

// UPLOAD Attachment
export const uploadAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    const { uploadedBy } = req.body;

    if (!req.file) {
      return res.status(400).json({
        error: "File tidak ditemukan",
      });
    }

    // Check if quotation exists
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id },
    });

    if (!existingQuotation) {
      // Delete uploaded file if quotation doesn't exist
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        error: "Quotation tidak ditemukan",
      });
    }

    const attachment = await prisma.quotationAttachment.create({
      data: {
        quotationId: id,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        uploadedBy,
      },
    });

    res.status(201).json({
      message: "File berhasil diupload",
      data: attachment,
    });
  } catch (error) {
    console.error("Error uploading attachment:", error);

    // Delete uploaded file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: "Gagal mengupload file",
      details: error.message,
    });
  }
};

// DELETE Attachment
export const deleteAttachment = async (req, res) => {
  try {
    const { id, attachmentId } = req.params;

    // Check if quotation and attachment exist
    const attachment = await prisma.quotationAttachment.findFirst({
      where: {
        id: attachmentId,
        quotationId: id,
      },
    });

    if (!attachment) {
      return res.status(404).json({
        error: "Attachment tidak ditemukan",
      });
    }

    // Delete physical file
    if (fs.existsSync(attachment.filePath)) {
      fs.unlinkSync(attachment.filePath);
    }

    // Delete database record
    await prisma.quotationAttachment.delete({
      where: { id: attachmentId },
    });

    res.json({
      message: "Attachment berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    res.status(500).json({
      error: "Gagal menghapus attachment",
      details: error.message,
    });
  }
};

// ADD Comment
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, commentedBy } = req.body;

    if (!comment || !commentedBy) {
      return res.status(400).json({
        error: "comment dan commentedBy diperlukan",
      });
    }

    // Check if quotation exists
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id },
    });

    if (!existingQuotation) {
      return res.status(404).json({
        error: "Quotation tidak ditemukan",
      });
    }

    const newComment = await prisma.quotationComment.create({
      data: {
        quotationId: id,
        comment,
        commentedBy,
      },
    });

    res.status(201).json({
      message: "Komentar berhasil ditambahkan",
      data: newComment,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({
      error: "Gagal menambahkan komentar",
      details: error.message,
    });
  }
};

export default {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
  updateQuotationStatus,
  uploadAttachment,
  deleteAttachment,
  addComment,
};
