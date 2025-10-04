import { PrismaClient } from "../../../prisma/generated/prisma/index.js";
import path from "path";
import fs from "fs";
import { generateQuotationNumber } from "../../utils/generateQuotaion.js";

const prisma = new PrismaClient();

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
      // quotationNumber dihapus dari required field, karena akan auto-generate
      currency = "IDR",
      exchangeRate = 1.0,
      status = "DRAFT",
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

    // Validasi required fields (quotationNumber dihapus)
    if (!customerId) {
      return res.status(400).json({
        error: "customerId diperlukan",
      });
    }

    // Generate quotation number otomatis
    const quotationNumber = await generateQuotationNumber();

    // Check if generated quotation number already exists (safety check)
    const existingQuotation = await prisma.quotation.findUnique({
      where: { quotationNumber },
    });

    if (existingQuotation) {
      // Jika terjadi collision, generate lagi (sangat jarang terjadi)
      quotationNumber = await generateQuotationNumber();

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
      // Create quotation
      const newQuotation = await tx.quotation.create({
        data: {
          customerId,
          quotationNumber, // Gunakan auto-generated number
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
        },
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
    res.status(500).json({
      error: "Gagal membuat quotation",
      details: error.message,
    });
  }
};

// GET All Quotations
export const getQuotations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      customerId,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    if (search) {
      where.OR = [
        { quotationNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Get quotations dengan pagination
    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              code: true,
              email: true, // Tambahkan email
              address: true, // Tambahkan address
            },
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
              product: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
              tax: {
                select: {
                  id: true,
                  name: true,
                  rate: true,
                },
              },
            },
            orderBy: {
              lineNo: "asc",
            },
          },
          _count: {
            select: {
              lines: true,
              attachments: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take,
      }),
      prisma.quotation.count({ where }),
    ]);

    // console.log("Data quotations:", quotations.length, "items");
    // console.log(
    //   "Sample quotation lines:",
    //   quotations[0]?.lines?.length,
    //   "lines"
    // );

    res.json({
      data: quotations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error getting quotations:", error);
    res.status(500).json({
      error: "Gagal mengambil data quotations",
      details: error.message,
    });
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

    res.json({
      data: quotation,
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
      // Update quotation
      const quotation = await tx.quotation.update({
        where: { id },
        data: {
          customerId,
          currency,
          exchangeRate: exchangeRate ? parseFloat(exchangeRate) : undefined,
          status,
          validFrom: validFrom ? new Date(validFrom) : undefined,
          validUntil: validUntil ? new Date(validUntil) : undefined,
          paymentTermId,
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
        },
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
          payload: quotation,
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
