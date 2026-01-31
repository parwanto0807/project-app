import React, { useMemo } from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image,
} from '@react-pdf/renderer';
import { Invoice } from '@/schemas/invoice';

// Styles copied exactly from GeneralLedgerSummaryPDF.tsx, adapted for Invoice
const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        padding: 20,
        fontSize: 8,
        color: '#1e293b',
        orientation: 'landscape',
    },
    headerContainer: {
        flexDirection: 'row',
        marginBottom: 10,
        borderBottomWidth: 1.5,
        borderBottomColor: '#008000',
        paddingBottom: 8,
        alignItems: 'flex-start',
    },
    logo: {
        width: 60,
        height: 60,
        marginRight: 15,
        objectFit: 'contain',
    },
    companyInfo: {
        flex: 1,
        justifyContent: 'flex-start',
    },
    companyName: {
        color: '#008000',
        fontWeight: 'bold',
        fontSize: 12,
        marginBottom: 2,
    },
    companyAddress: {
        fontSize: 7,
        lineHeight: 1.2,
        marginBottom: 1,
    },
    companyContact: {
        fontSize: 7,
        lineHeight: 1.2,
        marginTop: 2,
    },
    titleContainer: {
        marginBottom: 8,
        textAlign: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 3,
        color: '#1e293b',
    },
    subtitle: {
        fontSize: 9,
        color: '#64748b',
        marginBottom: 3,
    },
    period: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 10,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc',
        padding: 5,
        borderRadius: 3,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    statBox: {
        alignItems: 'center',
        flex: 1,
        paddingHorizontal: 5,
    },
    statLabel: {
        fontSize: 7,
        color: '#64748b',
        marginBottom: 1,
    },
    statValue: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    // Bank Group Header
    bankGroupHeader: {
        backgroundColor: '#008000',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 6,
        borderRadius: 2,
        marginTop: 6,
        marginBottom: 0,
    },
    bankInfo: {
        flex: 1,
    },
    bankNameText: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    bankDetailsText: {
        fontSize: 6,
        color: '#d1fae5',
        marginTop: 1,
    },
    bankStats: {
        flexDirection: 'row',
    },
    bankStatItem: {
        alignItems: 'flex-end',
        marginLeft: 12,
    },
    bankStatLabel: {
        fontSize: 5,
        color: '#bbf7d0',
    },
    bankStatValue: {
        fontSize: 7,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    // Table Header - copied from GL Summary
    tableHeader: {
        backgroundColor: '#3b82f6',
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#1d4ed8',
        fontWeight: 'bold',
        minHeight: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1d4ed8',
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
    },
    headerCell: {
        paddingVertical: 4,
        paddingHorizontal: 4,
        fontSize: 8,
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#e2e8f0',
        minHeight: 18,
        alignItems: 'center',
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#e2e8f0',
    },
    tableCell: {
        paddingVertical: 3,
        paddingHorizontal: 4,
        fontSize: 7,
    },
    // Column definitions
    colNo: { width: '4%', textAlign: 'center' },
    colInvoice: { width: '12%' },
    colSO: { width: '10%' },
    colCustomer: { width: '15%' },
    colProject: { width: '15%' },
    colDate: { width: '8%', textAlign: 'center' },
    colDueDate: { width: '8%', textAlign: 'center' },
    colAmount: { width: '11%', textAlign: 'right' },
    colBalance: { width: '11%', textAlign: 'right' },
    colStatus: { width: '6%', textAlign: 'center' },
    // Status Badge
    statusBadge: {
        borderRadius: 2,
        paddingHorizontal: 3,
        paddingVertical: 1,
        fontSize: 6,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    // Totals Row - copied from GL Summary
    totalsRow: {
        backgroundColor: '#f1f5f9',
        flexDirection: 'row',
        minHeight: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderTopWidth: 0,
        fontWeight: 'bold',
    },
    totalLabelCell: {
        paddingVertical: 3,
        paddingHorizontal: 4,
        fontSize: 8,
        fontWeight: 'bold',
        color: '#334155',
        width: '72%',
        textAlign: 'right',
    },
    totalValueCell: {
        paddingVertical: 3,
        paddingHorizontal: 4,
        fontSize: 8,
        fontWeight: 'bold',
        color: '#1e293b',
        textAlign: 'right',
        width: '11%',
    },
    // Grand Total - copied from GL Summary balance status
    grandTotalContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ecfdf5',
        padding: 8,
        borderRadius: 3,
        borderWidth: 1,
        borderColor: '#10b981',
        marginTop: 10,
        marginBottom: 15,
    },
    grandTotalText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#065f46',
    },
    // Footer - copied from GL Summary
    footer: {
        position: 'absolute',
        bottom: 15,
        left: 20,
        right: 20,
        textAlign: 'center',
        fontSize: 6,
        color: '#94a3b8',
        borderTopWidth: 0.5,
        borderTopColor: '#e2e8f0',
        paddingTop: 5,
    },
});

interface InvoiceSummaryPDFProps {
    data: Invoice[];
    logoSrc?: string;
    period?: string;
    title?: string;
}

interface GroupedInvoice {
    bankAccountId: string;
    bankName: string;
    accountNumber: string;
    branch?: string;
    invoices: Invoice[];
    subtotal: {
        amount: number;
        balance: number;
        paid: number;
        count: number;
        overdueCount: number;
    };
}

const InvoiceSummaryPDF = ({
    data,
    logoSrc,
    period = "All Periods",
    title = "Invoice Summary Report"
}: InvoiceSummaryPDFProps) => {
    const currentDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return '-';
        }
    };

    const getStatusStyle = (status: string) => {
        const statusUpper = status?.toUpperCase() || '';
        switch (statusUpper) {
            case 'PAID':
                return { backgroundColor: '#d1fae5', color: '#065f46' };
            case 'OVERDUE':
                return { backgroundColor: '#fee2e2', color: '#991b1b' };
            case 'PARTIAL':
                return { backgroundColor: '#fef3c7', color: '#92400e' };
            default:
                return { backgroundColor: '#f3f4f6', color: '#374151' };
        }
    };

    const groupedData = useMemo(() => {
        const groups: Record<string, GroupedInvoice> = {};

        data.forEach(invoice => {
            const bankId = invoice.bankAccountId || 'unknown';
            if (!groups[bankId]) {
                groups[bankId] = {
                    bankAccountId: bankId,
                    bankName: invoice.bankAccount?.bankName || 'Unknown Bank',
                    accountNumber: invoice.bankAccount?.accountNumber || '-',
                    branch: invoice.bankAccount?.branch || '-',
                    invoices: [],
                    subtotal: {
                        amount: 0,
                        balance: 0,
                        paid: 0,
                        count: 0,
                        overdueCount: 0
                    }
                };
            }

            groups[bankId].invoices.push(invoice);
            groups[bankId].subtotal.amount += invoice.totalAmount || 0;
            groups[bankId].subtotal.balance += invoice.balanceDue || 0;
            groups[bankId].subtotal.paid += invoice.amountPaid || 0;
            groups[bankId].subtotal.count += 1;

            if (invoice.status === 'OVERDUE') {
                groups[bankId].subtotal.overdueCount += 1;
            }
        });

        return Object.values(groups).sort((a, b) => a.bankName.localeCompare(b.bankName));
    }, [data]);

    const grandTotals = useMemo(() => {
        const totals = data.reduce((acc, curr) => ({
            amount: acc.amount + (curr.totalAmount || 0),
            balance: acc.balance + (curr.balanceDue || 0),
            paid: acc.paid + (curr.amountPaid || 0),
            count: acc.count + 1,
            overdueCount: acc.overdueCount + (curr.status === 'OVERDUE' ? 1 : 0),
        }), {
            amount: 0,
            balance: 0,
            paid: 0,
            count: 0,
            overdueCount: 0,
        });

        return {
            ...totals,
            bankCount: groupedData.length,
            collectionRate: totals.amount > 0 ? (totals.paid / totals.amount) * 100 : 0
        };
    }, [data, groupedData]);

    return (
        <Document title={title}>
            <Page size="A4" orientation="landscape" style={styles.page}>
                {/* Header Information Section - NO wrap={false} to prevent overlap */}
                {/* Header */}
                <View style={styles.headerContainer}>
                    {logoSrc ? <Image src={logoSrc} style={styles.logo} /> : null}
                    <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>PT. RYLIF MIKRO MANDIRI</Text>
                        <Text style={styles.companyAddress}>Jln. Arjuna RT. 04/RW. 36, Kampung Pulo Resident 1 No. 6</Text>
                        <Text style={styles.companyAddress}>Bekasi - 17510, Indonesia</Text>
                        <Text style={styles.companyContact}>Phone: 0857-7414-8874 | Email: rylifmikromandiri@gmail.com</Text>
                    </View>
                </View>

                {/* Title */}
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>INVOICE SUMMARY REPORT</Text>
                    <Text style={styles.subtitle}>Summary of invoices grouped by bank account</Text>
                    <Text style={styles.period}>Periode: {period} • Printed: {currentDate}</Text>
                </View>

                {/* Stats Summary */}
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Total Invoices</Text>
                        <Text style={styles.statValue}>{grandTotals.count}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Total Amount</Text>
                        <Text style={[styles.statValue, { color: '#008000' }]}>
                            {formatCurrency(grandTotals.amount)}
                        </Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Total Paid</Text>
                        <Text style={[styles.statValue, { color: '#008000' }]}>
                            {formatCurrency(grandTotals.paid)}
                        </Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Collection Rate</Text>
                        <Text style={[styles.statValue, { color: '#008000' }]}>
                            {grandTotals.collectionRate.toFixed(1)}%
                        </Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Outstanding</Text>
                        <Text style={[styles.statValue, { color: '#dc2626' }]}>
                            {formatCurrency(grandTotals.balance)}
                        </Text>
                    </View>
                </View>

                {/* Table Header - Fixed to repeat on each page */}
                <View style={styles.tableHeader} fixed>
                    <Text style={[styles.headerCell, styles.colNo]}>NO</Text>
                    <Text style={[styles.headerCell, styles.colInvoice]}>INVOICE NO</Text>
                    <Text style={[styles.headerCell, styles.colSO]}>SO NO</Text>
                    <Text style={[styles.headerCell, styles.colCustomer]}>CUSTOMER</Text>
                    <Text style={[styles.headerCell, styles.colProject]}>PROJECT</Text>
                    <Text style={[styles.headerCell, styles.colDate]}>DATE</Text>
                    <Text style={[styles.headerCell, styles.colDueDate]}>DUE DATE</Text>
                    <Text style={[styles.headerCell, styles.colAmount]}>AMOUNT</Text>
                    <Text style={[styles.headerCell, styles.colBalance]}>BALANCE</Text>
                    <Text style={[styles.headerCell, styles.colStatus]}>STATUS</Text>
                </View>

                {/* Table Rows Grouped by Bank */}
                {groupedData.map((group) => (
                    <React.Fragment key={group.bankAccountId}>
                        {/* Bank Group Header */}
                        <View style={[styles.tableRow, { backgroundColor: '#d1fae520' }]} wrap={false}>
                            <Text style={[styles.tableCell, {
                                width: '100%',
                                fontWeight: 'bold',
                                color: '#065f46',
                                paddingLeft: 8
                            }]}>
                                BANK: {group.bankName} | Account: {group.accountNumber} | Branch: {group.branch}
                            </Text>
                        </View>

                        {/* Invoice Rows */}
                        {group.invoices.map((item, index) => (
                            <View key={item.id} style={styles.tableRow} wrap={false}>
                                <Text style={[styles.tableCell, styles.colNo]}>{index + 1}</Text>
                                <Text style={[styles.tableCell, styles.colInvoice, { fontWeight: 'bold' }]}>{item.invoiceNumber}</Text>
                                <Text style={[styles.tableCell, styles.colSO]}>{item.salesOrder?.soNumber || '-'}</Text>
                                <Text style={[styles.tableCell, styles.colCustomer]}>{item.salesOrder?.customer?.name || '-'}</Text>
                                <Text style={[styles.tableCell, styles.colProject]}>{item.salesOrder?.project?.name || '-'}</Text>
                                <Text style={[styles.tableCell, styles.colDate]}>{formatDate(item.invoiceDate)}</Text>
                                <Text style={[styles.tableCell, styles.colDueDate]}>{formatDate(item.dueDate)}</Text>
                                <Text style={[styles.tableCell, styles.colAmount]}>{formatCurrency(item.totalAmount)}</Text>
                                <Text style={[styles.tableCell, styles.colBalance, {
                                    color: item.balanceDue > 0 ? '#dc2626' : '#059669',
                                    fontWeight: 'bold'
                                }]}>
                                    {formatCurrency(item.balanceDue)}
                                </Text>
                                <View style={[styles.tableCell, styles.colStatus]}>
                                    <Text style={[styles.statusBadge, getStatusStyle(item.status)]}>
                                        {item.status}
                                    </Text>
                                </View>
                            </View>
                        ))}

                        {/* Bank Subtotal */}
                        <View style={styles.totalsRow} wrap={false}>
                            <Text style={styles.totalLabelCell}>
                                Subtotal {group.bankName}
                            </Text>
                            <Text style={styles.totalValueCell}>
                                {formatCurrency(group.subtotal.amount)}
                            </Text>
                            <Text style={[styles.totalValueCell, {
                                color: group.subtotal.balance > 0 ? '#dc2626' : '#059669'
                            }]}>
                                {formatCurrency(group.subtotal.balance)}
                            </Text>
                            <Text style={{ width: '6%' }}></Text>
                        </View>
                    </React.Fragment>
                ))}

                {/* Grand Total */}
                <View style={styles.grandTotalContainer}>
                    <Text style={styles.grandTotalText}>
                        GRAND TOTAL: {formatCurrency(grandTotals.amount)} | Collected: {formatCurrency(grandTotals.paid)} | Outstanding: {formatCurrency(grandTotals.balance)} | Rate: {grandTotals.collectionRate.toFixed(1)}%
                    </Text>
                </View>

                {/* Footer */}
                <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
                    `Dokumen ini dihasilkan secara otomatis oleh ERP RYLIF MIKRO MANDIRI pada ${currentDate} • Halaman ${pageNumber} dari ${totalPages}`
                )} />
            </Page>
        </Document>
    );
};

export default InvoiceSummaryPDF;