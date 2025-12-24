import { PurchaseOrder } from '@/types/poType';
import { Document, Page, Text, View, StyleSheet, Image as PdfImage } from '@react-pdf/renderer';
import path from 'path';

// Professional ERP-style color palette - Smooth & Modern
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
    // Additional smooth colors for status
    info: '#29b6f6',         // Light blue
    pending: '#ffb74d',      // Soft amber
    draft: '#90a4ae',        // Cool gray
    partial: '#42a5f5',      // Sky blue
};

// Premium styles
const styles = StyleSheet.create({
    page: {
        padding: 25,
        fontFamily: 'Helvetica',
        fontSize: 9,
        lineHeight: 1.4,
        backgroundColor: colors.white,
        position: 'relative',
    },

    // ============ HEADER SECTION ============
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 12,
        borderBottomWidth: 3,
        borderBottomColor: colors.primary,
        borderBottomStyle: 'solid',
    },
    logoSection: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '55%',
    },
    logo: {
        width: 70,
        height: 35,
        marginRight: 12,
    },
    companyDetails: {
        flex: 1,
    },
    companyName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 2,
    },
    companyAddress: {
        fontSize: 7,
        color: colors.medium,
        lineHeight: 1.3,
    },
    documentInfo: {
        width: '43%',
        alignItems: 'flex-end',
    },
    documentTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
        letterSpacing: 2,
        marginBottom: 6,
    },
    poNumberBox: {
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 3,
    },
    poNumberText: {
        color: colors.white,
        fontSize: 10,
        fontWeight: 'bold',
    },

    // ============ STATUS BADGE ============
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    statusBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        fontSize: 10,
        fontWeight: 'bold',
        minWidth: 120,
        textAlign: 'center',
    },

    // ============ INFO SECTION ============
    infoSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
        gap: 12,
    },
    infoBox: {
        width: '32%',
        backgroundColor: colors.background,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 10,
    },
    infoBoxWide: {
        width: '48%',
        backgroundColor: colors.background,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 10,
    },
    infoBoxHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        borderBottomStyle: 'solid',
    },
    infoBoxTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        color: colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 3,
    },
    infoLabel: {
        width: '45%',
        fontSize: 8,
        color: '#455a64',  // Darker blue-gray for labels
        fontWeight: 'bold',
    },
    infoValue: {
        width: '55%',
        fontSize: 8,
        color: '#263238',  // Very dark blue-gray for values
    },
    infoValueBold: {
        fontWeight: 'bold',
        color: '#1a237e',  // Primary dark blue for emphasis
    },

    // ============ TABLE SECTION ============
    tableContainer: {
        marginBottom: 15,
    },
    tableTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    table: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 4,
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 6,
    },
    tableHeaderCell: {
        color: colors.white,
        fontSize: 8,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 6,
        paddingHorizontal: 6,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        borderBottomStyle: 'solid',
    },
    tableRowAlt: {
        backgroundColor: '#f5f7fa',
    },
    tableCell: {
        fontSize: 8,
        color: colors.dark,
    },
    // Column widths for items table
    colNo: { width: '5%', textAlign: 'center' },
    colSku: { width: '12%' },
    colProduct: { width: '18%' },
    colDesc: { width: '22%' },
    colQty: { width: '8%', textAlign: 'center' },
    colUnit: { width: '12%', textAlign: 'right' },
    colTotal: { width: '13%', textAlign: 'right' },
    colStatus: { width: '10%', textAlign: 'center' },

    // ============ SUMMARY SECTION ============
    summarySection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
        gap: 12,
    },
    termsBox: {
        width: '58%',
        backgroundColor: colors.background,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 10,
    },
    termsHeader: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1a237e',  // Dark primary blue
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    termsText: {
        fontSize: 7,
        color: '#37474f',  // Dark gray for better readability
        marginBottom: 2,
        lineHeight: 1.5,
    },
    totalsBox: {
        width: '38%',
        backgroundColor: colors.background,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    totalsHeader: {
        backgroundColor: colors.secondary,
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    totalsHeaderText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: colors.white,
        textTransform: 'uppercase',
        textAlign: 'center',
    },
    totalsBody: {
        padding: 10,
    },
    totalsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    totalsLabel: {
        fontSize: 8,
        color: '#37474f',  // Dark gray for labels
        fontWeight: 'bold',
    },
    totalsValue: {
        fontSize: 8,
        color: '#263238',  // Very dark for values
        fontWeight: 'bold',
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 8,
        marginTop: 4,
        borderTopWidth: 2,
        borderTopColor: colors.primary,
        borderTopStyle: 'solid',
    },
    grandTotalLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: colors.primary,
    },
    grandTotalValue: {
        fontSize: 11,
        fontWeight: 'bold',
        color: colors.primary,
    },

    // ============ SIGNATURE SECTION ============
    signatureSection: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        borderTopStyle: 'solid',
    },
    signatureTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.primary,
        textAlign: 'center',
        marginBottom: 15,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    signatureGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signatureBox: {
        width: '30%',
        alignItems: 'center',
        padding: 8,
    },
    signatureLabel: {
        fontSize: 8,
        color: '#37474f',  // Dark gray
        fontWeight: 'bold',
        marginBottom: 55,
    },
    signatureLine: {
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: '#263238',  // Darker line
        borderBottomStyle: 'dotted',
        marginBottom: 6,
    },
    signatureName: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1a237e',  // Primary dark blue
        marginBottom: 2,
    },
    signaturePosition: {
        fontSize: 7,
        color: '#455a64',  // Dark blue-gray
        fontWeight: 'bold',
    },

    // ============ FOOTER ============
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 25,
        right: 25,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        borderTopStyle: 'solid',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footerLeft: {
        fontSize: 7,
        color: colors.light,
    },
    footerCenter: {
        fontSize: 7,
        color: colors.light,
        textAlign: 'center',
    },
    footerRight: {
        fontSize: 7,
        color: colors.light,
        textAlign: 'right',
    },

    // ============ WATERMARK ============
    watermark: {
        position: 'absolute',
        top: '45%',
        left: '25%',
        transform: 'rotate(-35deg)',
        fontSize: 60,
        color: 'rgba(26, 35, 126, 0.06)',
        fontWeight: 'bold',
        letterSpacing: 8,
    },

    // ============ RECEIPT STATS ============
    receiptStats: {
        marginTop: 8,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        borderTopStyle: 'solid',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    statsLabel: {
        fontSize: 7,
        color: '#37474f',  // Dark gray
        fontWeight: 'bold',
    },
    statsValue: {
        fontSize: 7,
        fontWeight: 'bold',
        color: '#263238',  // Very dark
    },
});

// Format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

// Format date
const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return '-';
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

// Format date short
const formatDateShort = (dateString: string | Date | null | undefined) => {
    if (!dateString) return '-';
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

// Get status color - Smooth modern colors
const getStatusColor = (status: string) => {
    switch (status) {
        case 'APPROVED':
            return colors.success;
        case 'FULLY_RECEIVED':
            return '#66bb6a';        // Light green
        case 'SENT':
            return colors.info;       // Light blue
        case 'PENDING_APPROVAL':
            return colors.pending;    // Soft amber
        case 'DRAFT':
            return colors.draft;      // Cool gray
        case 'REJECTED':
            return colors.danger;     // Soft red
        case 'CANCELLED':
            return '#78909c';         // Blue gray
        case 'PARTIALLY_RECEIVED':
            return colors.partial;    // Sky blue
        default:
            return colors.medium;
    }
};

// Get status text
const getStatusText = (status: string) => {
    switch (status) {
        case 'DRAFT': return 'DRAFT';
        case 'PENDING_APPROVAL': return 'PENDING APPROVAL';
        case 'APPROVED': return 'APPROVED';
        case 'REJECTED': return 'REJECTED';
        case 'SENT': return 'SENT TO SUPPLIER';
        case 'PARTIALLY_RECEIVED': return 'PARTIAL RECEIVED';
        case 'FULLY_RECEIVED': return 'FULLY RECEIVED';
        case 'CANCELLED': return 'CANCELLED';
        default: return status;
    }
};

// Get payment term text
const getPaymentTermText = (term: string) => {
    switch (term) {
        case 'CASH': return 'Cash';
        case 'COD': return 'Cash on Delivery';
        case 'NET_7': return 'Net 7 Days';
        case 'NET_14': return 'Net 14 Days';
        case 'NET_30': return 'Net 30 Days';
        case 'DP_PERCENTAGE': return 'Down Payment';
        default: return term || '-';
    }
};

// Purchase Order PDF Component
const PurchaseOrderPdfDocument = ({ purchaseOrder }: { purchaseOrder: PurchaseOrder }) => {
    const logoPath = path.resolve('/LogoMd.png');
    const {
        poNumber,
        orderDate,
        expectedDeliveryDate,
        status,
        warehouse,
        supplier,
        project,
        orderedBy,
        paymentTerm,
        subtotal,
        taxAmount,
        totalAmount,
        lines,
        PurchaseRequest,
        SPK,
        createdAt,
        updatedAt
    } = purchaseOrder;

    // Calculate totals
    const totalOrdered = lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
    const totalReceived = lines.reduce((sum, line) => sum + Number(line.receivedQuantity || 0), 0);
    const completionPercent = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Watermark for draft */}
                {status === 'DRAFT' && (
                    <View style={styles.watermark} fixed>
                        <Text>DRAFT</Text>
                    </View>
                )}

                {/* ========== HEADER ========== */}
                <View style={styles.headerContainer}>
                    <View style={styles.logoSection}>
                        <PdfImage style={styles.logo} src={logoPath} />
                    </View>
                    <View style={styles.documentInfo}>
                        <Text style={styles.documentTitle}>PURCHASE ORDER</Text>
                        <View style={styles.poNumberBox}>
                            <Text style={styles.poNumberText}>{poNumber}</Text>
                        </View>
                    </View>
                </View>

                {/* ========== STATUS ========== */}
                <View style={styles.statusRow}>
                    <View style={styles.companyDetails}>
                        <Text style={styles.companyName}>PT. RYLIF MIKRO MANDIRI</Text>
                        <Text style={styles.companyAddress}>
                            Jln. Arjuna RT. 04/RW. 36, Kampung Pulo Resident 1 No. 6{'\n'}
                            Kampung Pulo Warung Asem, Sumber Jaya, Bekasi{'\n'}
                            Tel: 0852-1929-6841 / 1857-7441-8078 | rylifmikromandiri@gmail.com
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, {
                        backgroundColor: getStatusColor(status) + '15',
                        borderWidth: 1,
                        borderColor: getStatusColor(status)
                    }]}>
                        <Text style={{ color: getStatusColor(status) }}>
                            {getStatusText(status)}
                        </Text>
                    </View>
                </View>

                {/* ========== INFO BOXES ========== */}
                <View style={styles.infoSection}>
                    {/* PO Details */}
                    <View style={styles.infoBox}>
                        <View style={styles.infoBoxHeader}>
                            <Text style={styles.infoBoxTitle}>Informasi Pesanan</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Tanggal Order</Text>
                            <Text style={[styles.infoValue, styles.infoValueBold]}>{formatDate(orderDate)}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Tanggal Kirim</Text>
                            <Text style={styles.infoValue}>{formatDate(expectedDeliveryDate)}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Termin Bayar</Text>
                            <Text style={styles.infoValue}>{getPaymentTermText(paymentTerm)}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>No. PR</Text>
                            <Text style={styles.infoValue}>{PurchaseRequest?.nomorPr || '-'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>SPK</Text>
                            <Text style={[styles.infoValue, { fontSize: 7, marginBottom: 3 }]}>{SPK?.spkNumber || '-'}</Text>
                        </View>
                    </View>

                    {/* Supplier */}
                    <View style={styles.infoBox}>
                        <View style={styles.infoBoxHeader}>
                            <Text style={styles.infoBoxTitle}>Supplier</Text>
                        </View>
                        <Text style={[styles.infoValue, styles.infoValueBold, { marginBottom: 3 }]}>
                            {supplier?.name || 'Supplier Name'}
                        </Text>
                        <Text style={[styles.infoValue, { fontSize: 7, color: colors.medium }]}>
                            {supplier?.billingAddress || supplier?.shippingAddress || '-'}
                        </Text>
                        {(supplier?.phone || supplier?.email) && (
                            <Text style={[styles.infoValue, { fontSize: 7, marginTop: 3 }]}>
                                {supplier?.phone || supplier?.email}
                            </Text>
                        )}
                    </View>

                    {/* Pengiriman */}
                    <View style={styles.infoBox}>
                        <View style={styles.infoBoxHeader}>
                            <Text style={styles.infoBoxTitle}>Pengiriman Ke</Text>
                        </View>
                        <Text style={[styles.infoValue, styles.infoValueBold, { marginBottom: 3 }]}>
                            {warehouse?.name || 'Nama Gudang'}
                        </Text>
                        <Text style={[styles.infoValue, { fontSize: 7, color: colors.medium }]}>
                            {warehouse?.address || '-'}
                        </Text>
                    </View>
                </View>

                {/* ========== TABEL ITEM ========== */}
                <View style={styles.tableContainer}>
                    <Text style={styles.tableTitle}>Daftar Barang</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeaderCell, styles.colNo]}>#</Text>
                            <Text style={[styles.tableHeaderCell, styles.colSku]}>SKU</Text>
                            <Text style={[styles.tableHeaderCell, styles.colProduct]}>Produk</Text>
                            <Text style={[styles.tableHeaderCell, styles.colDesc]}>Keterangan</Text>
                            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
                            <Text style={[styles.tableHeaderCell, styles.colUnit]}>Harga Satuan</Text>
                            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Jumlah</Text>
                            <Text style={[styles.tableHeaderCell, styles.colStatus]}>Diterima</Text>
                        </View>
                        {lines.map((line, index) => (
                            <View
                                key={line.id}
                                style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}
                            >
                                <Text style={[styles.tableCell, styles.colNo]}>{index + 1}</Text>
                                <Text style={[styles.tableCell, styles.colSku]}>{line.product?.sku || '-'}</Text>
                                <Text style={[styles.tableCell, styles.colProduct]}>{line.product?.name || '-'}</Text>
                                <Text style={[styles.tableCell, styles.colDesc]}>{line.description || '-'}</Text>
                                <Text style={[styles.tableCell, styles.colQty]}>{line.quantity}-{line.product?.purchaseUnit || '-'}</Text>
                                <Text style={[styles.tableCell, styles.colUnit]}>{formatCurrency(line.unitPrice)}</Text>
                                <Text style={[styles.tableCell, styles.colTotal]}>{formatCurrency(line.totalAmount)}</Text>
                                <Text style={[styles.tableCell, styles.colStatus, {
                                    color: line.receivedQuantity === line.quantity ? colors.success :
                                        (line.receivedQuantity || 0) > 0 ? colors.warning : colors.medium
                                }]}>
                                    {line.receivedQuantity || 0}/{line.quantity}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* ========== SUMMARY SECTION ========== */}
                <View style={styles.summarySection}>
                    {/* Syarat & Ketentuan */}
                    <View style={styles.termsBox}>
                        <Text style={styles.termsHeader}>Syarat & Ketentuan</Text>
                        <Text style={styles.termsText}>1. Barang harus sesuai dengan standar kualitas dan spesifikasi yang ditentukan.</Text>
                        <Text style={styles.termsText}>2. Pengiriman harus dilakukan sesuai tanggal yang disepakati.</Text>
                        <Text style={styles.termsText}>3. Invoice harus mencantumkan nomor PO ini untuk proses pembayaran.</Text>
                        <Text style={styles.termsText}>4. Termin pembayaran: {getPaymentTermText(paymentTerm)}.</Text>
                        <Text style={styles.termsText}>5. PO ini hanya berlaku dengan tanda tangan yang sah.</Text>
                        <Text style={styles.termsText}>6. Garansi sesuai dengan ketentuan garansi standar produk.</Text>

                        <View style={styles.receiptStats}>
                            <Text style={[styles.termsHeader, { marginBottom: 4 }]}>Status Penerimaan</Text>
                            <View style={styles.statsRow}>
                                <Text style={styles.statsLabel}>Barang Dipesan:</Text>
                                <Text style={styles.statsValue}>{totalOrdered} unit</Text>
                            </View>
                            <View style={styles.statsRow}>
                                <Text style={styles.statsLabel}>Barang Diterima:</Text>
                                <Text style={[styles.statsValue, {
                                    color: totalReceived === totalOrdered ? colors.success :
                                        totalReceived > 0 ? colors.warning : colors.medium
                                }]}>{totalReceived} unit</Text>
                            </View>
                            <View style={styles.statsRow}>
                                <Text style={styles.statsLabel}>Penyelesaian:</Text>
                                <Text style={[styles.statsValue, {
                                    color: completionPercent === 100 ? colors.success :
                                        completionPercent > 0 ? colors.warning : colors.medium
                                }]}>{completionPercent}%</Text>
                            </View>
                        </View>
                    </View>

                    {/* Ringkasan */}
                    <View style={styles.totalsBox}>
                        <View style={styles.totalsHeader}>
                            <Text style={styles.totalsHeaderText}>Ringkasan Pesanan</Text>
                        </View>
                        <View style={styles.totalsBody}>
                            <View style={styles.totalsRow}>
                                <Text style={styles.totalsLabel}>Subtotal</Text>
                                <Text style={styles.totalsValue}>{formatCurrency(subtotal)}</Text>
                            </View>
                            <View style={styles.totalsRow}>
                                <Text style={styles.totalsLabel}>Pajak (PPN 11%)</Text>
                                <Text style={styles.totalsValue}>{formatCurrency(taxAmount)}</Text>
                            </View>
                            <View style={styles.totalsRow}>
                                <Text style={styles.totalsLabel}>Diskon</Text>
                                <Text style={styles.totalsValue}>Rp0</Text>
                            </View>
                            <View style={styles.grandTotalRow}>
                                <Text style={styles.grandTotalLabel}>TOTAL</Text>
                                <Text style={styles.grandTotalValue}>{formatCurrency(totalAmount)}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ========== TANDA TANGAN ========== */}
                <View style={styles.signatureSection} wrap={false}>
                    <Text style={styles.signatureTitle}>Otorisasi</Text>
                    <View style={styles.signatureGrid}>
                        <View style={styles.signatureBox}>
                            <Text style={styles.signatureLabel}>Dibuat Oleh</Text>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureName}>{orderedBy?.namaLengkap || '________________'}</Text>
                            <Text style={styles.signaturePosition}>{orderedBy?.jabatan || 'Staff'}</Text>
                        </View>
                        <View style={styles.signatureBox}>
                            <Text style={styles.signatureLabel}>Disetujui Oleh</Text>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureName}>
                                {status === 'APPROVED' || status === 'SENT' ? 'Manager' : '________________'}
                            </Text>
                            <Text style={styles.signaturePosition}>Manajer Pengadaan</Text>
                        </View>
                        <View style={styles.signatureBox}>
                            <Text style={styles.signatureLabel}>Diterima Supplier</Text>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureName}>________________</Text>
                            <Text style={styles.signaturePosition}>Perwakilan Supplier</Text>
                        </View>
                    </View>
                </View>

                {/* ========== FOOTER ========== */}
                <View style={styles.footer} fixed>
                    <Text style={styles.footerLeft}>
                        Dibuat: {formatDateShort(createdAt)} | Diperbarui: {formatDateShort(updatedAt)}
                    </Text>
                    <Text style={styles.footerCenter}>
                        PO ini berlaku 30 hari sejak tanggal order
                    </Text>
                    <Text style={styles.footerRight}>
                        {poNumber}
                    </Text>
                </View>
            </Page>
        </Document>
    );
};

export default PurchaseOrderPdfDocument;