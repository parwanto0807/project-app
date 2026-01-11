import { prisma } from '../../config/db.js';

/**
 * Service untuk Payment Processing dengan Ledger Integration
 * Standar ERP Akuntansi dengan Kode Jurnal JV-PAY-xxx
 */

/**
 * Helper: Get System Account by Key
 */
async function getSystemAccount(key) {
  const systemAccount = await prisma.systemAccount.findUnique({
    where: { key },
    include: { coa: true }
  });

  if (!systemAccount || !systemAccount.coa) {
    throw new Error(`System account mapping '${key}' not found. Please configure in System Account Mapping.`);
  }

  return systemAccount.coa;
}

/**
 * Helper: Get Active Accounting Period
 */
async function getActivePeriod(transactionDate) {
  const period = await prisma.accountingPeriod.findFirst({
    where: {
      startDate: { lte: transactionDate },
      endDate: { gte: transactionDate },
      isClosed: false
    }
  });

  if (!period) {
    throw new Error(`No open accounting period found for date ${transactionDate.toISOString().slice(0, 10)}`);
  }

  return period;
}

/**
 * Helper: Generate Payment Ledger Number
 * Format: JV-PAY-YYYYMMDD-XXXX
 */
async function generatePaymentLedgerNumber(paymentDate) {
  const dateStr = paymentDate.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Count payments today
  const startOfDay = new Date(paymentDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(paymentDate);
  endOfDay.setHours(23, 59, 59, 999);

  const count = await prisma.ledger.count({
    where: {
      ledgerNumber: { startsWith: `JV-PAY-${dateStr}` },
      transactionDate: { gte: startOfDay, lte: endOfDay }
    }
  });

  const sequence = String(count + 1).padStart(4, '0');
  return `JV-PAY-${dateStr}-${sequence}`;
}

/**
 * Main Function: Process Invoice Payment with Ledger
 * 
 * @param {Object} paymentData - Payment data from frontend
 * @param {string} paymentData.invoiceId - Invoice ID
 * @param {number} paymentData.amount - Payment amount (excluding admin fee)
 * @param {number} paymentData.adminFee - Bank admin fee (ditanggung perusahaan)
 * @param {string} paymentData.method - Payment method (TRANSFER, CASH, VA, etc)
 * @param {string} paymentData.bankAccountId - Selected bank account ID
 * @param {string} paymentData.reference - Payment reference number
 * @param {string} paymentData.notes - Payment notes
 * @param {string} paymentData.payDate - Payment date (ISO string)
 * @param {string} paymentData.verifiedById - User ID who verified
 * @param {string} paymentData.installmentId - Optional installment ID
 * @param {string} paymentData.accountCOAId - Optional COA ID from bank account
 * @param {string} paymentData.paymentType - FULL or PARTIAL
 * 
 * @returns {Object} - Created payment and ledger
 */
export async function processInvoicePayment(paymentData) {
  const {
    invoiceId,
    amount,
    adminFee = 0,
    method,
    bankAccountId,
    reference,
    notes,
    payDate,
    verifiedById,
    installmentId,
    accountCOAId,
    paymentType
  } = paymentData;

  return await prisma.$transaction(async (tx) => {
    // ========================================
    // 1. VALIDASI INVOICE
    // ========================================
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        salesOrder: {
          include: {
            customer: true,
            project: true
          }
        },
        payments: true
      }
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.approvalStatus !== 'POSTED') {
      throw new Error('Only POSTED invoices can receive payment');
    }

    if (invoice.balanceDue <= 0) {
      throw new Error('Invoice already fully paid');
    }

    if (amount > invoice.balanceDue) {
      throw new Error(`Payment amount (${amount}) exceeds balance due (${invoice.balanceDue})`);
    }

    // ========================================
    // 2. VALIDASI BANK ACCOUNT
    // ========================================
    const bankAccount = await tx.bankAccount.findUnique({
      where: { id: bankAccountId },
      include: { accountCOA: true }
    });

    if (!bankAccount) {
      throw new Error('Bank account not found');
    }

    if (!bankAccount.isActive) {
      throw new Error('Bank account is not active');
    }

    if (!bankAccount.accountCOA) {
      throw new Error('Bank account COA mapping not found. Please configure bank account COA.');
    }

    // ========================================
    // 3. GET SYSTEM ACCOUNTS
    // ========================================
    const receivableAccount = await getSystemAccount('PAYMENT_RECEIVABLE_ACCOUNT');
    const bankChargeAccount = adminFee > 0 
      ? await getSystemAccount('PAYMENT_BANK_CHARGE_EXPENSE') 
      : null;

    // ========================================
    // 4. GET ACCOUNTING PERIOD
    // ========================================
    const paymentDate = new Date(payDate);
    const period = await getActivePeriod(paymentDate);

    // ========================================
    // 5. GENERATE LEDGER NUMBER
    // ========================================
    const ledgerNumber = await generatePaymentLedgerNumber(paymentDate);

    // ========================================
    // 6. CALCULATE AMOUNTS
    // ========================================
    const totalCharged = amount + adminFee; // Total yang dicharge ke Invoice & Payment
    const netAmount = amount; // Amount yang masuk ke bank (Pay Amount)

    // ========================================
    // 7. CREATE PAYMENT RECORD
    // ========================================
    const payment = await tx.payment.create({
      data: {
        invoiceId: invoiceId,
        installmentId: installmentId || null,
        payDate: paymentDate,
        amount: totalCharged, // Menggunakan Total Charged (Amount + Admin Fee)
        method: method,
        bankAccountId: bankAccountId, 
        reference: reference,
        notes: notes,
        verifiedById: verifiedById,
        status: 'COMPLETED' // Payment completed
      }
    });

    // ========================================
    // 8. CREATE LEDGER ENTRY
    // ========================================
    const customerName = invoice.salesOrder?.customer?.name || 'Unknown Customer';
    const projectName = invoice.salesOrder?.project?.name || '';
    
    const ledgerDescription = `Payment for Invoice #${invoice.invoiceNumber} - ${customerName}${projectName ? ` (${projectName})` : ''}`;

    const ledger = await tx.ledger.create({
      data: {
        ledgerNumber: ledgerNumber,
        referenceNumber: invoice.invoiceNumber,
        referenceType: 'PAYMENT',
        transactionDate: paymentDate,
        postingDate: new Date(),
        description: ledgerDescription,
        notes: notes || `Payment via ${method} - Ref: ${reference}`,
        periodId: period.id,
        status: 'POSTED',
        currency: invoice.currency || 'IDR',
        exchangeRate: invoice.exchangeRate || 1.0,
        createdBy: verifiedById,
        postedBy: verifiedById,
        postedAt: new Date()
      }
    });

    // ========================================
    // 9. CREATE LEDGER LINES
    // ========================================
    const ledgerLines = [];

    // Line 1: DEBIT Bank Account (uang masuk)
    ledgerLines.push({
      ledgerId: ledger.id,
      coaId: bankAccount.accountCOA.id,
      debitAmount: netAmount,
      creditAmount: 0,
      currency: invoice.currency || 'IDR',
      localAmount: netAmount * (invoice.exchangeRate || 1.0),
      description: `Payment received via ${method}`,
      reference: reference,
      lineNumber: 1,
      projectId: invoice.salesOrder?.projectId || null,
      customerId: invoice.salesOrder?.customerId || null
    });

    // Line 2: DEBIT Beban Admin Bank (jika ada)
    if (adminFee > 0 && bankChargeAccount) {
      ledgerLines.push({
        ledgerId: ledger.id,
        coaId: bankChargeAccount.id,
        debitAmount: adminFee,
        creditAmount: 0,
        currency: invoice.currency || 'IDR',
        localAmount: adminFee * (invoice.exchangeRate || 1.0),
        description: 'Bank admin fee',
        reference: reference,
        lineNumber: 2,
        projectId: invoice.salesOrder?.projectId || null,
        customerId: invoice.salesOrder?.customerId || null
      });
    }

    // Line 3: CREDIT Piutang Usaha (piutang berkurang)
    ledgerLines.push({
      ledgerId: ledger.id,
      coaId: receivableAccount.id,
      debitAmount: 0,
      creditAmount: totalCharged, // Piutang berkurang sebesar Total Charged
      currency: invoice.currency || 'IDR',
      localAmount: totalCharged * (invoice.exchangeRate || 1.0),
      description: 'Receivable reduction',
      reference: invoice.invoiceNumber,
      lineNumber: adminFee > 0 ? 3 : 2,
      projectId: invoice.salesOrder?.projectId || null,
      customerId: invoice.salesOrder?.customerId || null
    });

    // Create all ledger lines
    await tx.ledgerLine.createMany({
      data: ledgerLines
    });

    // ========================================
    // 9B. UPDATE FINANCIAL SUMMARIES
    // ========================================
    // Import financial summary service
    const { updateTrialBalance, updateGeneralLedgerSummary } = await import('../accounting/financialSummaryService.js');

    // Update Trial Balance and GL Summary for each ledger line
    for (const line of ledgerLines) {
      // Update Trial Balance
      await updateTrialBalance({
        periodId: period.id,
        coaId: line.coaId,
        debitAmount: line.debitAmount,
        creditAmount: line.creditAmount,
        tx
      });

      // Update General Ledger Summary
      await updateGeneralLedgerSummary({
        coaId: line.coaId,
        periodId: period.id,
        date: paymentDate,
        debitAmount: line.debitAmount,
        creditAmount: line.creditAmount,
        tx
      });
    }

    // ========================================
    // 10. UPDATE INVOICE BALANCE
    // ========================================
    const newPaidTotal = invoice.paidTotal + totalCharged;
    const newBalanceDue = invoice.balanceDue - totalCharged;
    
    let newStatus = invoice.status;
    if (paymentType === 'FULL') {
      newStatus = 'PAID';
    } else if (paymentType === 'PARTIAL') {
      newStatus = 'PARTIALLY_PAID';
    } else {
      // Fallback logic if paymentType is not provided
      if (newBalanceDue <= 0) {
        newStatus = 'PAID';
      } else if (newPaidTotal > 0) {
        newStatus = 'PARTIALLY_PAID';
      }
    }

    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        paidTotal: newPaidTotal,
        balanceDue: newBalanceDue,
        status: newStatus
      }
    });

    // ========================================
    // 11. UPDATE INSTALLMENT (if applicable)
    // ========================================
    if (installmentId) {
      const installment = await tx.installment.findUnique({
        where: { id: installmentId }
      });

      if (installment) {
        const newInstallmentPaid = installment.paidAmount + totalCharged;
        const newInstallmentBalance = installment.balance - totalCharged;

        await tx.installment.update({
          where: { id: installmentId },
          data: {
            paidAmount: newInstallmentPaid,
            balance: newInstallmentBalance,
            status: newInstallmentBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID'
          }
        });
      }
    }

    // ========================================
    // 12. BANK BALANCE (Tracked via GL)
    // ========================================
    // Note: Bank balance is tracked via General Ledger, not in BankAccount model
    // The ledger entry for bank account already created in step 9
    // Balance can be calculated from GL Summary for the bank account's COA

    // ========================================
    // 13. UPDATE SALES ORDER STATUS (if fully paid)
    // ========================================
    if (newStatus === 'PAID' && invoice.salesOrder) {
      await tx.salesOrder.update({
        where: { id: invoice.salesOrder.id },
        data: { status: 'PAID' }
      });
    }

    // ========================================
    // 14. RETURN RESULT
    // ========================================
    return {
      payment,
      ledger: {
        ...ledger,
        lines: ledgerLines
      },
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        balanceDue: newBalanceDue,
        paidTotal: newPaidTotal,
        status: newStatus
      },
      bankAccount: {
        id: bankAccount.id,
        accountNumber: bankAccount.accountNumber,
        bankName: bankAccount.bankName
        // Note: Balance tracked in General Ledger, not in BankAccount model
      }
    };
  });
}

/**
 * Get Payment Details with Ledger
 */
export async function getPaymentWithLedger(paymentId) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      invoice: {
        include: {
          salesOrder: {
            include: {
              customer: true,
              project: true
            }
          }
        }
      },
      verifiedBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!payment) {
    return null;
  }

  // Find related ledger
  const ledger = await prisma.ledger.findFirst({
    where: {
      referenceNumber: payment.invoice.invoiceNumber,
      referenceType: 'PAYMENT',
      status: { not: 'VOID' }
    },
    include: {
      ledgerLines: {
        include: {
          coa: true
        },
        orderBy: {
          lineNumber: 'asc'
        }
      }
    }
  });

  return {
    payment,
    ledger
  };
}

export default {
  processInvoicePayment,
  getPaymentWithLedger
};
