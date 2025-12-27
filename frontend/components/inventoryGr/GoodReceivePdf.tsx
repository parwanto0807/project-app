import { GoodsReceipt } from '@/types/grInventoryType';
import { Document, Page, Text, View, StyleSheet, Image as PdfImage } from '@react-pdf/renderer';


// Professional color palette for Goods Receipt
const colors = {
    primary: '#1d4ed8',      // Blue-700
    secondary: '#2563eb',    // Blue-600
    accent: '#3b82f6',       // Blue-500
    success: '#059669',      // Emerald-600
    warning: '#d97706',      // Amber-600
    danger: '#dc2626',       // Red-600
    info: '#0ea5e9',         // Sky-500
    dark: '#1f2937',         // Gray-800
    medium: '#6b7280',       // Gray-500
    light: '#e5e7eb',        // Gray-200
    border: '#d1d5db',       // Gray-300
    background: '#f9fafb',   // Gray-50
    white: '#ffffff',
};

// Status colors
const statusColors = {
    DRAFT: '#6b7280',
    ARRIVED: '#3b82f6',      // Blue
    PASSED: '#10b981',       // Emerald
    COMPLETED: '#059669',    // Dark Emerald
    CANCELLED: '#dc2626',    // Red
};

// QC Status colors
const qcStatusColors = {
    PENDING: '#f59e0b',      // Amber
    ARRIVED: '#3b82f6',      // Blue
    PASSED: '#10b981',       // Emerald
    REJECTED: '#ef4444',     // Red
    PARTIAL: '#8b5cf6',      // Violet
};

// Premium styles for GR Document
const styles = StyleSheet.create({
    page: {
        padding: 25,
        paddingBottom: 65,
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
        flexDirection: 'column',
        alignItems: 'flex-start',
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
        width: '40%',
        alignItems: 'flex-end',
    },
    documentTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.primary,
        letterSpacing: 2,
        marginBottom: 6,
    },
    docNumberBox: {
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 3,
    },
    docNumberText: {
        color: colors.white,
        fontSize: 10,
        fontWeight: 'bold',
    },

    // ============ STATUS BADGE ============
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        backgroundColor: colors.background,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 12,
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

    // ============ DELIVERY INFO ============
    deliverySection: {
        backgroundColor: '#eff6ff', // Blue-50
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.info,
        padding: 12,
        marginBottom: 15,
    },
    deliveryHeader: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.info,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    deliveryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 15,
    },
    deliveryBox: {
        flex: 1,
    },
    deliveryLabel: {
        fontSize: 8,
        color: colors.dark,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    deliveryValue: {
        fontSize: 8,
        color: colors.dark,
        marginBottom: 4,
    },
    deliveryValueBold: {
        fontSize: 9,
        fontWeight: 'bold',
        color: colors.primary,
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
        color: colors.dark,
        fontWeight: 'bold',
    },
    infoValue: {
        width: '55%',
        fontSize: 8,
        color: colors.dark,
    },
    infoValueBold: {
        fontWeight: 'bold',
        color: colors.primary,
    },
    infoValueFull: {
        width: '100%',
        fontSize: 8,
        color: colors.dark,
    },

    // ============ QC STATUS SECTION ============
    qcSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
        gap: 8,
    },
    qcBox: {
        width: '19%',
        backgroundColor: colors.background,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 8,
        alignItems: 'center',
    },
    qcCount: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    qcLabel: {
        fontSize: 7,
        textAlign: 'center',
        color: colors.medium,
    },

    // ============ ITEMS TABLE ============
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
    // Column widths for GR document
    colNo: { width: '4%', textAlign: 'center' },
    colSku: { width: '15%' },
    colProduct: { width: '25%' },
    colUnit: { width: '8%', textAlign: 'center' },
    colPlan: { width: '12%', textAlign: 'center' },
    colReceived: { width: '12%', textAlign: 'center' },
    colPassed: { width: '12%', textAlign: 'center' },
    colRejected: { width: '12%', textAlign: 'center' },
    colStatus: { width: '8%', textAlign: 'center' },

    // ============ NOTES SECTION ============
    notesSection: {
        marginBottom: 15,
    },
    notesBox: {
        backgroundColor: colors.background,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 10,
    },
    notesHeader: {
        fontSize: 9,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    notesText: {
        fontSize: 8,
        color: colors.dark,
        lineHeight: 1.5,
    },

    // ============ SUMMARY SECTION ============
    summarySection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 12,
    },
    summaryBox: {
        width: '58%',
        backgroundColor: colors.background,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 10,
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
        paddingVertical: 3,
    },
    totalsLabel: {
        fontSize: 8,
        color: colors.dark,
        fontWeight: 'bold',
    },
    totalsValue: {
        fontSize: 8,
        color: colors.dark,
        fontWeight: 'bold',
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 6,
        marginTop: 3,
        borderTopWidth: 2,
        borderTopColor: colors.primary,
        borderTopStyle: 'solid',
    },
    grandTotalLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        color: colors.primary,
    },
    grandTotalValue: {
        fontSize: 9,
        fontWeight: 'bold',
        color: colors.primary,
    },

    // ============ SIGNATURE SECTION ============
    signatureSection: {
        marginTop: 10,
        marginBottom: 80,
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
        color: colors.dark,
        fontWeight: 'bold',
        marginBottom: 45,
    },
    signatureLine: {
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: colors.dark,
        borderBottomStyle: 'dotted',
        marginBottom: 6,
    },
    signatureName: {
        fontSize: 8,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 2,
        textAlign: 'center',
    },
    signaturePosition: {
        fontSize: 7,
        color: colors.medium,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    signatureDate: {
        fontSize: 6,
        color: colors.medium,
        textAlign: 'center',
        marginTop: 2,
    },

    // ============ FOOTER ============
    footer: {
        position: 'absolute',
        bottom: 25,
        left: 25,
        right: 25,
        height: 20,
        paddingTop: 5,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        borderTopStyle: 'solid',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.white,
    },
    footerLeft: {
        width: '35%',
        fontSize: 7,
        color: colors.medium,
    },
    footerCenter: {
        width: '30%',
        fontSize: 7,
        color: colors.medium,
        textAlign: 'center',
    },
    footerRight: {
        width: '35%',
        fontSize: 7,
        color: colors.medium,
        textAlign: 'right',
    },

    // ============ WATERMARK ============
    watermark: {
        position: 'absolute',
        top: '45%',
        left: '25%',
        transform: 'rotate(-35deg)',
        fontSize: 60,
        color: 'rgba(29, 78, 216, 0.06)',
        fontWeight: 'bold',
        letterSpacing: 8,
    },

    // ============ QC BADGE ============
    qcBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 3,
        fontSize: 7,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

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

// Format date with time
const formatDateTime = (dateString: string | Date | null | undefined) => {
    if (!dateString) return '-';
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

// Format decimal
const formatDecimal = (value: any) => {
    const num = parseFloat(value) || 0;
    return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(num);
};

// Get status text
const getStatusText = (status: string) => {
    switch (status) {
        case 'DRAFT': return 'DRAFT';
        case 'ARRIVED': return 'TELAH TIBA';
        case 'PASSED': return 'LULUS QC';
        case 'COMPLETED': return 'SELESAI';
        case 'CANCELLED': return 'DIBATALKAN';
        default: return status;
    }
};

// Get status color
const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || colors.medium;
};

// Get QC status text
const getQcStatusText = (status: string) => {
    switch (status) {
        case 'PENDING': return 'PENDING';
        case 'ARRIVED': return 'TIBA';
        case 'PASSED': return 'LULUS';
        case 'REJECTED': return 'TOLAK';
        case 'PARTIAL': return 'SEBAGIAN';
        default: return status;
    }
};

// Get QC status color
const getQcStatusColor = (status: string) => {
    return qcStatusColors[status as keyof typeof qcStatusColors] || colors.medium;
};

// Goods Receipt PDF Document Component
const GoodsReceiptPdfDocument = ({ goodsReceipt }: { goodsReceipt: GoodsReceipt }) => {
    const logoPath = '/LogoMd.png';
    const {
        grNumber,
        receivedDate,
        expectedDate,
        vendorDeliveryNote,
        vehicleNumber,
        driverName,
        purchaseOrder,
        sourceType,
        items,
        receivedBy,
        status,
        notes,
        warehouse,
        createdAt,
    } = goodsReceipt;

    // Calculate totals
    const totalItems = items?.length || 0;
    const totalPlan = items?.reduce((sum, item) => sum + (item.qtyPlanReceived || 0), 0) || 0;
    const totalReceived = items?.reduce((sum, item) => sum + (item.qtyReceived || 0), 0) || 0;
    const totalPassed = items?.reduce((sum, item) => sum + (item.qtyPassed || 0), 0) || 0;
    const totalRejected = items?.reduce((sum, item) => sum + (item.qtyRejected || 0), 0) || 0;
    const totalValue = items?.reduce((sum, item) => {
        const passed = item.qtyPassed || 0;
        const price = item.purchaseOrderLine?.unitPrice || 0;
        return sum + (passed * price);
    }, 0) || 0;

    // // QC Statistics
    // const passedItems = items?.filter(item => item.qcStatus === 'PASSED').length || 0;
    // const pendingItems = items?.filter(item => item.qcStatus === 'PENDING').length || 0;
    // const rejectedItems = items?.filter(item => item.qcStatus === 'REJECTED').length || 0;
    // const partialItems = items?.filter(item => item.qcStatus === 'PARTIAL').length || 0;
    // const arrivedItems = items?.filter(item => item.qcStatus === 'ARRIVED').length || 0;

    // Calculate completion percentage
    const completionPercent = totalPlan > 0
        ? Math.round((totalPassed / totalPlan) * 100)
        : 0;

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
                        <Text style={styles.companyName}>PT. RYLIF MIKRO MANDIRI</Text>
                        <Text style={styles.companyAddress}>
                            Jln. Arjuna RT. 04/RW. 36, Kampung Pulo Resident 1 No. 6{'\n'}
                            Kampung Pulo Warung Asem, Sumber Jaya, Bekasi{'\n'}
                            Tel: 0852-1929-6841 / 1857-7441-8078 | rylifmikromandiri@gmail.com
                        </Text>
                    </View>
                    <View style={styles.documentInfo}>
                        <Text style={styles.documentTitle}>GOODS RECEIPT NOTE</Text>
                        <Text style={{ fontSize: 11, color: colors.medium, marginBottom: 2 }}>
                            Berita Acara Penerimaan Barang
                        </Text>
                        <View style={styles.docNumberBox}>
                            <Text style={styles.docNumberText}>{grNumber}</Text>
                        </View>
                    </View>
                </View>

                {/* ========== STATUS ========== */}
                {/* <View style={styles.statusRow}>
                    {/* <View style={styles.companyDetails}>
                        <Text style={styles.companyName}>PT. RYLIF MIKRO MANDIRI</Text>
                        <Text style={styles.companyAddress}>
                            Jln. Arjuna RT. 04/RW. 36, Kampung Pulo Resident 1 No. 6{'\n'}
                            Kampung Pulo Warung Asem, Sumber Jaya, Bekasi{'\n'}
                            Tel: 0852-1929-6841 / 1857-7441-8078 | rylifmikromandiri@gmail.com
                        </Text>
                    </View> */}

                {/* Status Badge */}
                {/* <View style={[styles.statusBadge, {
                        backgroundColor: getStatusColor(status) + '15',
                        borderWidth: 1,
                        borderColor: getStatusColor(status)
                    }]}>
                        <Text style={{ color: getStatusColor(status) }}>
                            {getStatusText(status)}
                        </Text>
                    </View> 
                </View> */}

                {/* ========== DELIVERY INFO ========== */}
                <View style={styles.deliverySection}>
                    <Text style={styles.deliveryHeader}>Informasi Pengiriman</Text>
                    <View style={styles.deliveryGrid}>
                        <View style={styles.deliveryBox}>
                            <Text style={styles.deliveryLabel}>Surat Jalan Vendor:</Text>
                            <Text style={styles.deliveryValueBold}>{vendorDeliveryNote}</Text>

                            <Text style={styles.deliveryLabel}>No. Kendaraan:</Text>
                            <Text style={styles.deliveryValue}>{vehicleNumber || '-'}</Text>

                            <Text style={styles.deliveryLabel}>Nama Supir:</Text>
                            <Text style={styles.deliveryValue}>{driverName || '-'}</Text>
                        </View>

                        <View style={styles.deliveryBox}>
                            <Text style={styles.deliveryLabel}>Diterima di Gudang:</Text>
                            <Text style={styles.deliveryValueBold}>{warehouse?.name || '-'}</Text>
                            <Text style={[styles.deliveryValue, { fontSize: 7 }]}>
                                {warehouse?.address || ''}
                            </Text>

                            <Text style={styles.deliveryLabel}>Diterima Oleh:</Text>
                            <Text style={styles.deliveryValue}>{receivedBy?.name || '-'}</Text>
                        </View>

                        <View style={styles.deliveryBox}>
                            <Text style={styles.deliveryLabel}>Tanggal Diharapkan:</Text>
                            <Text style={styles.deliveryValue}>{formatDate(expectedDate)}</Text>

                            <Text style={styles.deliveryLabel}>Tanggal Diterima:</Text>
                            <Text style={styles.deliveryValueBold}>{formatDateTime(receivedDate)}</Text>

                            <Text style={styles.deliveryLabel}>Referensi PO:</Text>
                            <Text style={styles.deliveryValue}>{purchaseOrder?.poNumber || '-'}</Text>
                        </View>
                    </View>
                </View>

                {/* ========== TABEL BARANG ========== */}
                <View style={styles.tableContainer}>
                    <Text style={styles.tableTitle}>Detail Penerimaan Barang</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeaderCell, styles.colNo]}>#</Text>
                            <Text style={[styles.tableHeaderCell, styles.colSku]}>SKU</Text>
                            <Text style={[styles.tableHeaderCell, styles.colProduct]}>NAMA BARANG</Text>
                            <Text style={[styles.tableHeaderCell, styles.colUnit]}>SAT</Text>
                            <Text style={[styles.tableHeaderCell, styles.colPlan]}>RENCANA</Text>
                            <Text style={[styles.tableHeaderCell, styles.colReceived]}>DITERIMA</Text>
                            <Text style={[styles.tableHeaderCell, styles.colPassed]}>LULUS</Text>
                            <Text style={[styles.tableHeaderCell, styles.colRejected]}>TOLAK</Text>
                            <Text style={[styles.tableHeaderCell, styles.colStatus]}>QC</Text>
                        </View>
                        {items && Array.isArray(items) && items.length > 0 ? items.map((item, index) => {
                            const plan = item.qtyPlanReceived || 0;
                            const received = item.qtyReceived || 0;
                            const passed = item.qtyPassed || 0;
                            const rejected = item.qtyRejected || 0;
                            const price = item.purchaseOrderLine?.unitPrice || 0;
                            const total = passed * price;
                            const qcStatus = item.qcStatus;
                            const qcColor = getQcStatusColor(qcStatus);

                            return (
                                <View
                                    key={item.id}
                                    style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}
                                >
                                    <Text style={[styles.tableCell, styles.colNo]}>{index + 1}</Text>
                                    <Text style={[styles.tableCell, styles.colSku]}>
                                        {item.product?.code || '-'}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.colProduct]}>
                                        {item.product?.name || '-'}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.colUnit]}>
                                        {item.unit || item.product?.unit || 'PCS'}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.colPlan]}>
                                        {formatDecimal(plan)}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.colReceived]}>
                                        {formatDecimal(received)}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.colPassed]}>
                                        {formatDecimal(passed)}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.colRejected]}>
                                        {formatDecimal(rejected)}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.colStatus]}>
                                        <View style={[styles.qcBadge, { backgroundColor: qcColor + '20', borderWidth: 1, borderColor: qcColor }]}>
                                            <Text style={{ color: qcColor }}>
                                                {getQcStatusText(qcStatus)}
                                            </Text>
                                        </View>
                                    </Text>
                                </View>
                            );
                        }) : (
                            <View style={styles.tableRow}>
                                <Text style={[styles.tableCell, { textAlign: 'center', flex: 1 }]}>
                                    Tidak ada data item
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* ========== NOTES SECTION ========== */}
                <View style={styles.notesSection}>
                    <View style={styles.notesBox}>
                        <Text style={styles.notesHeader}>Catatan QC dan Penerimaan</Text>
                        {items && Array.isArray(items) && items.some(item => item.qcNotes) ? (
                            items.map((item, index) => {
                                if (!item.qcNotes) return null;
                                return (
                                    <View key={item.id} style={{ marginBottom: 4 }}>
                                        <Text style={[styles.notesText, { fontWeight: 'bold' }]}>
                                            {index + 1}. {item.product?.name}:
                                        </Text>
                                        <Text style={[styles.notesText, { marginLeft: 10, color: getQcStatusColor(item.qcStatus) }]}>
                                            {item.qcNotes}
                                        </Text>
                                    </View>
                                );
                            })
                        ) : (
                            <Text style={[styles.notesText, { color: colors.medium }]}>
                                {notes || 'Tidak ada catatan khusus untuk QC'}
                            </Text>
                        )}
                    </View>
                </View>

                {/* ========== SUMMARY SECTION ========== */}
                <View style={styles.summarySection}>
                    {/* Receipt Summary */}
                    <View style={styles.summaryBox}>
                        <Text style={styles.notesHeader}>Ringkasan Penerimaan</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                            <View>
                                <Text style={[styles.totalsLabel, { fontSize: 7 }]}>Total Item:</Text>
                                <Text style={[styles.totalsValue, { fontSize: 9, color: colors.primary }]}>
                                    {totalItems} jenis
                                </Text>
                            </View>
                            <View>
                                <Text style={[styles.totalsLabel, { fontSize: 7 }]}>Rencana Terima:</Text>
                                <Text style={[styles.totalsValue, { fontSize: 9 }]}>
                                    {formatDecimal(totalPlan)} {items?.[0]?.unit || 'PCS'}
                                </Text>
                            </View>
                            <View>
                                <Text style={[styles.totalsLabel, { fontSize: 7 }]}>Benar2 Diterima:</Text>
                                <Text style={[styles.totalsValue, { fontSize: 9 }]}>
                                    {formatDecimal(totalReceived)} {items?.[0]?.unit || 'PCS'}
                                </Text>
                            </View>
                            <View>
                                <Text style={[styles.totalsLabel, { fontSize: 7 }]}>Persentase:</Text>
                                <Text style={[styles.totalsValue, {
                                    fontSize: 9, color:
                                        completionPercent === 100 ? colors.success :
                                            completionPercent >= 80 ? colors.warning :
                                                colors.danger
                                }]}>
                                    {completionPercent}%
                                </Text>
                            </View>
                        </View>

                        {/* QC Summary */}
                        <View style={{ marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border }}>
                            <Text style={[styles.notesHeader, { fontSize: 8 }]}>Hasil QC:</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View>
                                    <Text style={[styles.totalsLabel, { fontSize: 7, color: getQcStatusColor('PASSED') }]}>
                                        ✓ Lulus: {formatDecimal(totalPassed)} {items?.[0]?.unit || 'PCS'}
                                    </Text>
                                </View>
                                <View>
                                    <Text style={[styles.totalsLabel, { fontSize: 7, color: getQcStatusColor('REJECTED') }]}>
                                        ✗ Ditolak: {formatDecimal(totalRejected)} {items?.[0]?.unit || 'PCS'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Totals Box */}
                    <View style={styles.totalsBox}>
                        <View style={styles.totalsHeader}>
                            <Text style={styles.totalsHeaderText}>Nilai Penerimaan</Text>
                        </View>
                        <View style={styles.totalsBody}>
                            <View style={styles.totalsRow}>
                                <Text style={styles.totalsLabel}>Total Diterima:</Text>
                                <Text style={styles.totalsValue}>{formatDecimal(totalReceived)} {items?.[0]?.unit || 'PCS'}</Text>
                            </View>
                            <View style={styles.totalsRow}>
                                <Text style={styles.totalsLabel}>Total Lulus QC:</Text>
                                <Text style={styles.totalsValue}>{formatDecimal(totalPassed)} {items?.[0]?.unit || 'PCS'}</Text>
                            </View>
                            <View style={styles.totalsRow}>
                                <Text style={styles.totalsLabel}>Total Ditolak:</Text>
                                <Text style={styles.totalsValue}>{formatDecimal(totalRejected)} {items?.[0]?.unit || 'PCS'}</Text>
                            </View>
                            <View style={styles.totalsRow}>
                                <Text style={styles.totalsLabel}>Persentase Lulus:</Text>
                                <Text style={[styles.totalsValue, {
                                    color: (totalPassed / totalReceived * 100) >= 95 ? colors.success :
                                        (totalPassed / totalReceived * 100) >= 80 ? colors.warning : colors.danger
                                }]}>
                                    {totalReceived > 0 ? Math.round((totalPassed / totalReceived) * 100) : 0}%
                                </Text>
                            </View>
                            <View style={styles.grandTotalRow}>
                                <Text style={styles.grandTotalLabel}>NILAI MASUK STOK</Text>
                                <Text style={styles.grandTotalValue}>{formatCurrency(totalValue)}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ========== SIGNATURE SECTION ========== */}
                <View style={styles.signatureSection}>
                    <Text style={styles.signatureTitle}>Verifikasi dan Tanda Tangan</Text>
                    <View style={styles.signatureGrid}>
                        <View style={styles.signatureBox}>
                            <Text style={styles.signatureLabel}>Penerima Barang</Text>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureName}>
                                {receivedBy?.name || '________________'}
                            </Text>
                            <Text style={styles.signaturePosition}>Staff Gudang</Text>
                            <Text style={styles.signatureDate}>
                                {formatDateTime(receivedDate)}
                            </Text>
                        </View>
                        <View style={styles.signatureBox}>
                            <Text style={styles.signatureLabel}>Quality Control</Text>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureName}>________________</Text>
                            <Text style={styles.signaturePosition}>Petugas QC</Text>
                            <Text style={styles.signatureDate}>Tanggal: _______________</Text>
                        </View>
                        <View style={styles.signatureBox}>
                            <Text style={styles.signatureLabel}>Kepala Gudang</Text>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureName}>________________</Text>
                            <Text style={styles.signaturePosition}>Kepala Gudang</Text>
                            <Text style={styles.signatureDate}>Tanggal: _______________</Text>
                        </View>
                    </View>
                </View>

                {/* ========== FOOTER ========== */}
                <View style={styles.footer} fixed>
                    <Text style={styles.footerLeft}>
                        Dokumen dibuat: {formatDateTime(createdAt)}
                    </Text>
                    <Text style={styles.footerCenter}>
                        Dokumen ini sebagai bukti penerimaan barang yang sah
                    </Text>
                    <Text style={styles.footerRight}>
                        {grNumber} | Hal 1/1
                    </Text>
                </View>
            </Page>
        </Document>
    );
};

export default GoodsReceiptPdfDocument;