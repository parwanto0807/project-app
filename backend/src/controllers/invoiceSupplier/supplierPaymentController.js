import { prisma } from '../../config/db.js';

/**
 * Get all supplier payments with pagination
 */
export const getAllSupplierPayments = async (req, res) => {
    try {
        const {
            page = '1',
            limit = '10',
            search = '',
            startDate,
            endDate,
            paymentMethod,
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const where = {
            AND: [
                search
                    ? {
                        OR: [
                            { paymentNumber: { contains: search, mode: 'insensitive' } },
                            { notes: { contains: search, mode: 'insensitive' } },
                        ],
                    }
                    : {},
                paymentMethod ? { paymentMethod } : {},
                startDate || endDate
                    ? {
                        paymentDate: {
                            ...(startDate && { gte: new Date(startDate) }),
                            ...(endDate && { lte: new Date(endDate) }),
                        },
                    }
                    : {},
            ],
        };

        const [payments, total] = await Promise.all([
            prisma.supplierPayment.findMany({
                where,
                skip,
                take: limitNum,
                include: {
                    allocations: {
                        include: {
                            supplierInvoice: {
                                include: {
                                    supplier: {
                                        select: {
                                            id: true,
                                            name: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.supplierPayment.count({ where }),
        ]);

        res.status(200).json({
            success: true,
            data: payments,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.error('Error fetching supplier payments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch supplier payments',
            error: error.message,
        });
    }
};

/**
 * Get single supplier payment by ID
 */
export const getSupplierPaymentById = async (req, res) => {
    try {
        const { id } = req.params;

        const payment = await prisma.supplierPayment.findUnique({
            where: { id },
            include: {
                allocations: {
                    include: {
                        supplierInvoice: {
                            include: {
                                supplier: true,
                            },
                        },
                        paymentVoucher: true,
                    },
                },
            },
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Supplier payment not found',
            });
        }

        res.status(200).json({
            success: true,
            data: payment,
        });
    } catch (error) {
        console.error('Error fetching supplier payment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch supplier payment',
            error: error.message,
        });
    }
};

/**
 * Create new supplier payment with allocations
 */
export const createSupplierPayment = async (req, res) => {
    try {
        const {
            paymentNumber,
            paymentDate,
            amount,
            paymentMethod,
            bankAccountId,
            notes,
            allocations,
        } = req.body;

        // Validate required fields
        if (!paymentNumber || !amount || !paymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
            });
        }

        // Check if payment number already exists
        const existingPayment = await prisma.supplierPayment.findUnique({
            where: { paymentNumber },
        });

        if (existingPayment) {
            return res.status(400).json({
                success: false,
                message: 'Payment number already exists',
            });
        }

        // Validate allocations sum equals payment amount
        if (allocations && allocations.length > 0) {
            const totalAllocated = allocations.reduce(
                (sum, alloc) => sum + parseFloat(alloc.amount),
                0
            );
            if (Math.abs(totalAllocated - parseFloat(amount)) > 0.01) {
                return res.status(400).json({
                    success: false,
                    message: 'Total allocated amount must equal payment amount',
                });
            }
        }

        // Create payment with allocations
        const payment = await prisma.supplierPayment.create({
            data: {
                paymentNumber,
                paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
                amount: Number(amount),
                paymentMethod,
                bankAccountId: bankAccountId || null,
                notes: notes || null,
                allocations: allocations
                    ? {
                        create: allocations.map((alloc) => ({
                            amount: Number(alloc.amount),
                            supplierInvoiceId: alloc.supplierInvoiceId,
                            paymentVoucherId: alloc.paymentVoucherId,
                        })),
                    }
                    : undefined,
            },
            include: {
                allocations: {
                    include: {
                        supplierInvoice: {
                            include: {
                                supplier: true,
                            },
                        },
                    },
                },
            },
        });

        // Update invoice amountPaid
        if (allocations && allocations.length > 0) {
            for (const alloc of allocations) {
                await prisma.supplierInvoice.update({
                    where: { id: alloc.supplierInvoiceId },
                    data: {
                        amountPaid: {
                            increment: Number(alloc.amount),
                        },
                    },
                });

                // Update status if fully paid
                const invoice = await prisma.supplierInvoice.findUnique({
                    where: { id: alloc.supplierInvoiceId },
                });
                if (invoice) {
                    const newAmountPaid = Number(invoice.amountPaid) + Number(alloc.amount);
                    if (newAmountPaid >= Number(invoice.totalAmount)) {
                        await prisma.supplierInvoice.update({
                            where: { id: alloc.supplierInvoiceId },
                            data: { status: 'PAID' },
                        });
                    } else if (newAmountPaid > 0) {
                        await prisma.supplierInvoice.update({
                            where: { id: alloc.supplierInvoiceId },
                            data: { status: 'PARTIALLY_PAID' },
                        });
                    }
                }
            }
        }

        res.status(201).json({
            success: true,
            message: 'Supplier payment created successfully',
            data: payment,
        });
    } catch (error) {
        console.error('Error creating supplier payment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create supplier payment',
            error: error.message,
        });
    }
};

/**
 * Update supplier payment
 */
export const updateSupplierPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentDate, paymentMethod, bankAccountId, notes } = req.body;

        const payment = await prisma.supplierPayment.update({
            where: { id },
            data: {
                ...(paymentDate && { paymentDate: new Date(paymentDate) }),
                ...(paymentMethod && { paymentMethod }),
                ...(bankAccountId !== undefined && { bankAccountId }),
                ...(notes !== undefined && { notes }),
            },
            include: {
                allocations: {
                    include: {
                        supplierInvoice: {
                            include: {
                                supplier: true,
                            },
                        },
                    },
                },
            },
        });

        res.status(200).json({
            success: true,
            message: 'Supplier payment updated successfully',
            data: payment,
        });
    } catch (error) {
        console.error('Error updating supplier payment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update supplier payment',
            error: error.message,
        });
    }
};

/**
 * Delete supplier payment
 */
export const deleteSupplierPayment = async (req, res) => {
    try {
        const { id } = req.params;

        // Get payment with allocations
        const payment = await prisma.supplierPayment.findUnique({
            where: { id },
            include: {
                allocations: true,
            },
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Supplier payment not found',
            });
        }

        // Reverse invoice amountPaid
        for (const alloc of payment.allocations) {
            await prisma.supplierInvoice.update({
                where: { id: alloc.supplierInvoiceId },
                data: {
                    amountPaid: {
                        decrement: Number(alloc.amount),
                    },
                    status: 'APPROVED', // Reset to approved
                },
            });
        }

        // Delete payment (cascades to allocations)
        await prisma.supplierPayment.delete({
            where: { id },
        });

        res.status(200).json({
            success: true,
            message: 'Supplier payment deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting supplier payment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete supplier payment',
            error: error.message,
        });
    }
};

/**
 * Generate next payment number
 */
export const generatePaymentNumber = async (req, res) => {
    try {
        const year = new Date().getFullYear();
        const prefix = `PYMT/${year}/`;

        const lastPayment = await prisma.supplierPayment.findFirst({
            where: {
                paymentNumber: {
                    startsWith: prefix,
                },
            },
            orderBy: {
                paymentNumber: 'desc',
            },
        });

        let nextNumber = 1;
        if (lastPayment) {
            const lastNumber = parseInt(lastPayment.paymentNumber.split('/').pop() || '0');
            nextNumber = lastNumber + 1;
        }

        const paymentNumber = `${prefix}${nextNumber.toString().padStart(4, '0')}`;

        res.status(200).json({
            success: true,
            data: { paymentNumber },
        });
    } catch (error) {
        console.error('Error generating payment number:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate payment number',
            error: error.message,
        });
    }
};
