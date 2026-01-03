import { prisma } from '../../config/db.js';

/**
 * Generate next invoice number
 */
export const generateInvoiceNumber = async (req, res) => {
    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const prefix = `INV-SUPP/${year}/${month}/`;
        
        console.log('🔍 Generating invoice number for:', { year, month, prefix });
        
        // Get all invoices from current month (using date range instead of startsWith)
        const startOfMonth = new Date(year, now.getMonth(), 1);
        const endOfMonth = new Date(year, now.getMonth() + 1, 0, 23, 59, 59);
        
        const allInvoices = await prisma.supplierInvoice.findMany({
            where: {
                createdAt: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            },
            select: {
                invoiceNumber: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        console.log('📋 All invoices this month:', allInvoices.length);
        console.log('📋 Invoice numbers:', allInvoices.map(inv => inv.invoiceNumber));

        // Filter only invoices that match our prefix pattern
        const matchingInvoices = allInvoices.filter(inv => 
            inv.invoiceNumber && inv.invoiceNumber.startsWith(prefix)
        );

        console.log('✅ Matching invoices:', matchingInvoices.map(inv => inv.invoiceNumber));

        let nextNumber = 1;
        
        if (matchingInvoices.length > 0) {
            // Extract all numbers and find the maximum
            const numbers = matchingInvoices
                .map(inv => {
                    const match = inv.invoiceNumber.match(/INV-SUPP\/(\d{4})\/(\d{2})\/(\d{4})/);
                    if (match) {
                        console.log(`   Parsing ${inv.invoiceNumber} -> ${match[3]}`);
                        return parseInt(match[3], 10);
                    }
                    return 0;
                })
                .filter(num => num > 0);
            
            console.log('🔢 Extracted numbers:', numbers);
            
            if (numbers.length > 0) {
                const maxNumber = Math.max(...numbers);
                nextNumber = maxNumber + 1;
                console.log(`📊 Max number found: ${maxNumber}, Next: ${nextNumber}`);
            }
        } else {
            // Fallback: If no invoices have the new format, but there ARE invoices in this month,
            // assume they take up slots (e.g. legacy format invoices)
            if (allInvoices.length > 0) {
                nextNumber = allInvoices.length + 1;
                console.log(`⚠️ No matching format found, but ${allInvoices.length} invoices exist. Using count + 1 = ${nextNumber}`);
            }
        }

        const invoiceNumber = `INV-SUPP/${year}/${month}/${String(nextNumber).padStart(4, '0')}`;
        
        console.log('✅ Generated invoice number:', invoiceNumber);

        res.status(200).json({
            success: true,
            data: {
                invoiceNumber,
                year,
                month,
                sequenceNumber: nextNumber
            }
        });
    } catch (error) {
        console.error('❌ Error generating invoice number:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate invoice number',
            error: error.message,
        });
    }
};

/**
 * Get all supplier invoices with pagination and filters
 */
export const getAllSupplierInvoices = async (req, res) => {
    try {
        const {
            page = '1',
            limit = '10',
            search = '',
            status,
            supplierId,
            startDate,
            endDate,
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const where = {
            AND: [
                search
                    ? {
                        OR: [
                            { invoiceNumber: { contains: search, mode: 'insensitive' } },
                            { supplier: { name: { contains: search, mode: 'insensitive' } } },
                        ],
                    }
                    : {},
                status ? { status } : {},
                supplierId ? { supplierId } : {},
                startDate || endDate
                    ? {
                        invoiceDate: {
                            ...(startDate && { gte: new Date(startDate) }),
                            ...(endDate && { lte: new Date(endDate) }),
                        },
                    }
                    : {},
            ],
        };

        const [invoices, total] = await Promise.all([
            prisma.supplierInvoice.findMany({
                where,
                skip,
                take: limitNum,
                include: {
                    supplier: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                    purchaseOrder: {
                        select: {
                            id: true,
                            poNumber: true,
                        },
                    },
                    items: {
                        select: {
                            id: true,
                            productName: true,
                            quantity: true,
                            unitPrice: true,
                            totalPrice: true,
                        },
                    },
                    paymentAllocations: {
                        select: {
                            id: true,
                            amount: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.supplierInvoice.count({ where }),
        ]);

        res.status(200).json({
            success: true,
            data: invoices,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.error('Error fetching supplier invoices:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch supplier invoices',
            error: error.message,
        });
    }
};

/**
 * Get single supplier invoice by ID
 */
export const getSupplierInvoiceById = async (req, res) => {
    try {
        const { id } = req.params;

        const invoice = await prisma.supplierInvoice.findUnique({
            where: { id },
            include: {
                supplier: true,
                purchaseOrder: {
                    include: {
                        lines: true,
                    },
                },
                items: {
                    orderBy: { createdAt: 'asc' },
                },
                paymentAllocations: {
                    include: {
                        supplierPayment: true,
                        paymentVoucher: true,
                    },
                },
                journalEntry: true,
            },
        });

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Supplier invoice not found',
            });
        }

        res.status(200).json({
            success: true,
            data: invoice,
        });
    } catch (error) {
        console.error('Error fetching supplier invoice:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch supplier invoice',
            error: error.message,
        });
    }
};

/**
 * Create new supplier invoice
 */
export const createSupplierInvoice = async (req, res) => {
    try {
        const {
            invoiceNumber,
            invoiceDate,
            dueDate,
            supplierId,
            purchaseOrderId,
            subtotal,
            taxAmount,
            totalAmount,
            items,
        } = req.body;

        // Validate required fields
        if (!invoiceNumber || !invoiceDate || !dueDate || !supplierId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
            });
        }

        // Check if invoice number already exists for this supplier
        const existingInvoice = await prisma.supplierInvoice.findUnique({
            where: {
                supplierId_invoiceNumber: {
                    supplierId,
                    invoiceNumber,
                },
            },
        });

        if (existingInvoice) {
            return res.status(400).json({
                success: false,
                message: 'Invoice number already exists for this supplier',
            });
        }

        // Create invoice with items
        const invoice = await prisma.supplierInvoice.create({
            data: {
                invoiceNumber,
                invoiceDate: new Date(invoiceDate),
                dueDate: new Date(dueDate),
                supplierId,
                purchaseOrderId: purchaseOrderId || null,
                subtotal: Number(subtotal),
                taxAmount: Number(taxAmount || 0),
                totalAmount: Number(totalAmount),
                status: 'DRAFT',
                items: items
                    ? {
                        create: items.map((item) => ({
                            productId: item.productId,
                            productName: item.productName,
                            poLineId: item.poLineId || null,
                            goodsReceivedItemId: item.goodsReceivedItemId || null,
                            quantity: Number(item.quantity),
                            unitPrice: Number(item.unitPrice),
                            totalPrice: Number(item.totalPrice),
                            priceVariance: Number(item.priceVariance || 0),
                        })),
                    }
                    : undefined,
            },
            include: {
                supplier: true,
                items: true,
            },
        });

        res.status(201).json({
            success: true,
            message: 'Supplier invoice created successfully',
            data: invoice,
        });
    } catch (error) {
        console.error('Error creating supplier invoice:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create supplier invoice',
            error: error.message,
        });
    }
};

/**
 * Update supplier invoice
 */
export const updateSupplierInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            invoiceNumber,
            invoiceDate,
            dueDate,
            status,
            subtotal,
            taxAmount,
            totalAmount,
        } = req.body;

        // Check if invoice exists
        const existingInvoice = await prisma.supplierInvoice.findUnique({
            where: { id },
        });

        if (!existingInvoice) {
            return res.status(404).json({
                success: false,
                message: 'Supplier invoice not found',
            });
        }

        // Update invoice
        const invoice = await prisma.supplierInvoice.update({
            where: { id },
            data: {
                ...(invoiceNumber && { invoiceNumber }),
                ...(invoiceDate && { invoiceDate: new Date(invoiceDate) }),
                ...(dueDate && { dueDate: new Date(dueDate) }),
                ...(status && { status }),
                ...(subtotal !== undefined && { subtotal: Number(subtotal) }),
                ...(taxAmount !== undefined && { taxAmount: Number(taxAmount) }),
                ...(totalAmount !== undefined && { totalAmount: Number(totalAmount) }),
            },
            include: {
                supplier: true,
                items: true,
            },
        });

        res.status(200).json({
            success: true,
            message: 'Supplier invoice updated successfully',
            data: invoice,
        });
    } catch (error) {
        console.error('Error updating supplier invoice:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update supplier invoice',
            error: error.message,
        });
    }
};

/**
 * Update supplier invoice status
 */
export const updateSupplierInvoiceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required',
            });
        }

        const invoice = await prisma.supplierInvoice.update({
            where: { id },
            data: { status },
            include: {
                supplier: true,
                items: true,
            },
        });

        res.status(200).json({
            success: true,
            message: 'Invoice status updated successfully',
            data: invoice,
        });
    } catch (error) {
        console.error('Error updating invoice status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update invoice status',
            error: error.message,
        });
    }
};

/**
 * Delete supplier invoice
 */
export const deleteSupplierInvoice = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if invoice has payments
        const invoice = await prisma.supplierInvoice.findUnique({
            where: { id },
            include: {
                paymentAllocations: true,
            },
        });

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Supplier invoice not found',
            });
        }

        if (invoice.paymentAllocations.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete invoice with existing payments',
            });
        }

        await prisma.supplierInvoice.delete({
            where: { id },
        });

        res.status(200).json({
            success: true,
            message: 'Supplier invoice deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting supplier invoice:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete supplier invoice',
            error: error.message,
        });
    }
};
