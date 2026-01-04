
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image as PdfImage } from '@react-pdf/renderer';
import { SupplierInvoice } from '@/types/supplierInvoice';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

// Professional ERP-style color palette - Matching PO PDF
const colors = {
    primary: '#3949ab',      // Soft indigo blue
    secondary: '#5c6bc0',    // Light indigo
    accent: '#7986cb',       // Lavender blue
    success: '#43a047',      // Soft green
    warning: '#fb8c00',      // Soft orange
    danger: '#e53935',       // Soft red
    dark: '#37474f',         // Soft dark gray
    medium: '#78909c',       // Blue gray
    light: '#b0bec5',        // Light blue gray
    border: '#eceff1',       // Soft border
    background: '#fafafa',   // Light background
    white: '#ffffff',
};

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: colors.dark,
        backgroundColor: colors.white,
    },
    // Header
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 3,
        borderBottomColor: colors.primary,
        borderBottomStyle: 'solid',
    },
    logoSection: {
        width: '50%',
    },
    logo: {
        width: 80,
        height: 40,
        marginBottom: 5,
    },
    companyName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.primary,
    },
    companyAddress: {
        fontSize: 8,
        color: colors.medium,
        marginTop: 3,
        lineHeight: 1.3,
    },
    documentInfo: {
        width: '50%',
        alignItems: 'flex-end',
    },
    documentTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    receiptNumber: {
        fontSize: 10,
        color: colors.medium,
        marginTop: 5,
    },

    // Supplier Info
    supplierSection: {
        marginBottom: 20,
        padding: 10,
        backgroundColor: colors.background,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.border,
    },
    supplierLabel: {
        fontSize: 8,
        color: colors.medium,
        fontWeight: 'bold',
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    supplierName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.dark,
        marginBottom: 2,
    },
    supplierDetails: {
        fontSize: 9,
        color: colors.dark,
    },

    // Table
    tableContainer: {
        marginTop: 10,
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 4,
        alignItems: 'center',
    },
    tableHeaderCell: {
        color: colors.white,
        fontSize: 9,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingVertical: 8,
        paddingHorizontal: 4,
        alignItems: 'center',
    },
    tableRowAlt: {
        backgroundColor: '#f5f7fa',
    },
    tableCell: {
        fontSize: 9,
        color: colors.dark,
    },
    // Column Widths
    colNo: { width: '5%', textAlign: 'center' },
    colDate: { width: '15%' },
    colInvNo: { width: '25%' },
    colPoNo: { width: '20%' },
    colDueDate: { width: '15%' },
    colAmount: { width: '20%', textAlign: 'right' },

    // Footer / Totals
    totalSection: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    totalBox: {
        width: '40%',
        backgroundColor: colors.background,
        padding: 10,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.border,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    totalLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.medium,
    },
    totalValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.primary,
    },

    // Signatures
    signatureSection: {
        marginTop: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    signatureBox: {
        width: '35%',
        alignItems: 'center',
    },
    signatureTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.dark,
        marginBottom: 50,
        textAlign: 'center',
    },
    signatureLine: {
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: colors.dark,
        borderBottomStyle: 'solid',
        marginBottom: 4,
    },
    signatureName: {
        fontSize: 9,
        color: colors.dark,
        textAlign: 'center',
    }
});

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const formatDate = (dateString: string | Date) => {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: idLocale });
};

interface SupplierInvoicePdfProps {
    invoices: SupplierInvoice[];
}

export const SupplierInvoicePdf = ({ invoices }: SupplierInvoicePdfProps) => {
    const logoPath = '/LogoMd.png'; // Ensure this layout matches your project setup

    // Assumes all invoices are from the same supplier (validated in UI)
    const supplier = invoices[0]?.supplier;
    const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const currentDate = format(new Date(), 'dd MMMM yyyy', { locale: idLocale });

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.headerContainer}>
                    <View style={styles.logoSection}>
                        <PdfImage style={styles.logo} src={logoPath} />
                        <Text style={styles.companyName}>PT. RYLIF MIKRO MANDIRI</Text>
                        <Text style={styles.companyAddress}>
                            Jln. Arjuna RT. 04/RW. 36, Kampung Pulo Resident 1 No. 6{'\n'}
                            Kampung Pulo Warung Asem, Sumber Jaya, Bekasi{'\n'}
                            Tel: 0852-1929-6841 / 0857-7441-8078
                        </Text>
                    </View>
                    <View style={styles.documentInfo}>
                        <Text style={styles.documentTitle}>TANDA TERIMA INVOICE</Text>
                        <Text style={styles.receiptNumber}>Tanggal Cetak: {currentDate}</Text>
                    </View>
                </View>

                {/* Supplier Info */}
                <View style={styles.supplierSection}>
                    <Text style={styles.supplierLabel}>Diterima Dari Supplier:</Text>
                    <Text style={styles.supplierName}>{supplier?.name || '-'}</Text>
                    <Text style={styles.supplierDetails}>{supplier?.address || '-'}</Text>
                    <Text style={styles.supplierDetails}>{supplier?.phone || supplier?.email || '-'}</Text>
                </View>

                {/* Table */}
                <View style={styles.tableContainer}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, styles.colNo]}>No</Text>
                        <Text style={[styles.tableHeaderCell, styles.colDate]}>Tanggal</Text>
                        <Text style={[styles.tableHeaderCell, styles.colInvNo]}>No. Invoice</Text>
                        <Text style={[styles.tableHeaderCell, styles.colPoNo]}>No. PO</Text>
                        <Text style={[styles.tableHeaderCell, styles.colDueDate]}>Jatuh Tempo</Text>
                        <Text style={[styles.tableHeaderCell, styles.colAmount]}>Total Tagihan</Text>
                    </View>

                    {invoices.map((inv, index) => (
                        <View key={inv.id} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
                            <Text style={[styles.tableCell, styles.colNo]}>{index + 1}</Text>
                            <Text style={[styles.tableCell, styles.colDate]}>{formatDate(inv.invoiceDate)}</Text>
                            <Text style={[styles.tableCell, styles.colInvNo]}>{inv.invoiceNumber}</Text>
                            <Text style={[styles.tableCell, styles.colPoNo]}>{inv.purchaseOrder?.poNumber || '-'}</Text>
                            <Text style={[styles.tableCell, styles.colDueDate]}>{formatDate(inv.dueDate)}</Text>
                            <Text style={[styles.tableCell, styles.colAmount]}>{formatCurrency(inv.totalAmount)}</Text>
                        </View>
                    ))}
                </View>

                {/* Total */}
                <View style={styles.totalSection}>
                    <View style={styles.totalBox}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>TOTAL DITERIMA:</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
                        </View>
                    </View>
                </View>

                {/* Signatures */}
                <View style={styles.signatureSection}>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureTitle}>Diserahkan Oleh,</Text>
                        <View style={{ height: 40 }} />
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureName}>{supplier?.name || 'Supplier'}</Text>
                    </View>

                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureTitle}>Diterima Oleh,</Text>
                        <View style={{ height: 40 }} />
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureName}>Admin Finance</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};
