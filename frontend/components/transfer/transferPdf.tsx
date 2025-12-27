import { StockTransfer } from '@/types/tfType';
import { Document, Page, Text, View, StyleSheet, Image as PdfImage } from '@react-pdf/renderer';

// Professional color palette for Stock Transfer
const colors = {
    primary: '#4f46e5',      // Indigo
    secondary: '#7c3aed',    // Violet
    accent: '#8b5cf6',       // Light violet
    success: '#10b981',      // Emerald
    warning: '#f59e0b',      // Amber
    danger: '#ef4444',       // Red
    info: '#0ea5e9',         // Sky blue
    dark: '#1f2937',         // Gray-800
    medium: '#6b7280',       // Gray-500
    light: '#e5e7eb',        // Gray-200
    border: '#d1d5db',       // Gray-300
    background: '#f9fafb',   // Gray-50
    white: '#ffffff',
};

// Status-specific colors
const statusColors = {
    DRAFT: '#6b7280',       // Gray
    PENDING: '#f59e0b',     // Amber
    IN_TRANSIT: '#0ea5e9',  // Sky blue
    RECEIVED: '#10b981',    // Emerald
    CANCELLED: '#ef4444',   // Red
};

// Premium styles for Transfer Pick List
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
        width: '63%',
        alignItems: 'flex-end',
    },
    documentTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.primary,
        letterSpacing: 2,
        marginBottom: 6,
    },
    transferNumberBox: {
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 3,
    },
    transferNumberText: {
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

    // ============ TRANSFER DETAILS ============
    detailsSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
        gap: 12,
    },
    detailsBox: {
        width: '48%',
        backgroundColor: colors.background,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 10,
    },
    detailsBoxHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        borderBottomStyle: 'solid',
    },
    detailsBoxTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        color: colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailsRow: {
        flexDirection: 'row',
        marginBottom: 3,
    },
    detailsLabel: {
        width: '45%',
        fontSize: 8,
        color: colors.dark,
        fontWeight: 'bold',
    },
    detailsValue: {
        width: '55%',
        fontSize: 8,
        color: colors.dark,
    },
    detailsValueBold: {
        fontWeight: 'bold',
        color: colors.primary,
    },
    warehouseName: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 2,
    },
    warehouseAddress: {
        fontSize: 7,
        color: colors.medium,
        marginBottom: 1,
    },
    warehouseContact: {
        fontSize: 7,
        color: colors.medium,
        fontStyle: 'italic',
    },

    // ============ PICKING INSTRUCTIONS ============
    instructionsSection: {
        backgroundColor: '#fef3c7', // Amber-50
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#fbbf24', // Amber-400
        padding: 10,
        marginBottom: 15,
    },
    instructionsTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#92400e', // Amber-900
        marginBottom: 5,
        textTransform: 'uppercase',
    },
    instructionsText: {
        fontSize: 8,
        color: '#78350f', // Amber-800
        marginBottom: 2,
        lineHeight: 1.5,
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
    // Column widths for picking list
    colNo: { width: '5%', textAlign: 'center' },
    colSku: { width: '15%' },
    colProduct: { width: '35%' },
    colUom: { width: '10%', textAlign: 'center' },
    colQty: { width: '10%', textAlign: 'center' },
    colLocation: { width: '15%' },
    colChecked: { width: '10%', textAlign: 'center' },

    // ============ SIGNATURE SECTION ============
    signatureSection: {
        marginTop: 20,
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
        marginBottom: 55,
    },
    signatureLine: {
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: colors.dark,
        borderBottomStyle: 'dotted',
        marginBottom: 6,
    },
    signatureName: {
        fontSize: 9,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 2,
    },
    signaturePosition: {
        fontSize: 7,
        color: colors.medium,
        fontWeight: 'bold',
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
        color: 'rgba(79, 70, 229, 0.06)',
        fontWeight: 'bold',
        letterSpacing: 8,
    },

    // ============ SUMMARY SECTION ============
    summaryBox: {
        backgroundColor: colors.background,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 10,
        marginBottom: 15,
    },
    summaryTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 2,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        borderBottomStyle: 'solid',
    },
    summaryLabel: {
        fontSize: 8,
        color: colors.dark,
        fontWeight: 'bold',
    },
    summaryValue: {
        fontSize: 8,
        color: colors.dark,
        fontWeight: 'bold',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 4,
        marginTop: 2,
        borderTopWidth: 2,
        borderTopColor: colors.primary,
        borderTopStyle: 'solid',
    },
    totalLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        color: colors.primary,
    },
    totalValue: {
        fontSize: 9,
        fontWeight: 'bold',
        color: colors.primary,
    },

    // ============ NOTES SECTION ============
    notesSection: {
        backgroundColor: '#f0f9ff', // Blue-50
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.info,
        padding: 8,
        marginBottom: 15,
    },
    notesTitle: {
        fontSize: 8,
        fontWeight: 'bold',
        color: colors.info,
        marginBottom: 4,
    },
    notesText: {
        fontSize: 7,
        color: colors.dark,
        lineHeight: 1.4,
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

// Get status text
const getStatusText = (status: string) => {
    switch (status) {
        case 'DRAFT': return 'DRAFT';
        case 'PENDING': return 'PENDING';
        case 'IN_TRANSIT': return 'IN TRANSIT';
        case 'RECEIVED': return 'RECEIVED';
        case 'CANCELLED': return 'CANCELLED';
        default: return status;
    }
};

// Get status color
const getStatusColor = (status: string) => {
    // @ts-ignore
    return statusColors[status] || colors.medium;
};

// Stock Transfer Pick List PDF Component
const StockTransferPickListPdfDocument = ({ transfer }: { transfer: StockTransfer }) => {
    const logoPath = '/LogoMd.png';
    const {
        transferNumber,
        transferDate,
        status,
        fromWarehouse,
        toWarehouse,
        items,
        notes,
        createdAt,
        updatedAt,
        sender,
        receiver
    } = transfer;

    // Calculate totals
    const totalItems = items?.length || 0;
    const totalQuantity = items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0;

    // Sort items by name (since location not available in type)
    const sortedItems = [...(items || [])].sort((a, b) => {
        const nameA = a.product?.name || '';
        const nameB = b.product?.name || '';
        return nameA.localeCompare(nameB);
    });

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Watermark for draft/pending */}
                {(status === 'DRAFT' || status === 'PENDING') && (
                    <View style={styles.watermark} fixed>
                        <Text>PICK LIST</Text>
                    </View>
                )}

                {/* ========== HEADER ========== */}
                <View style={styles.headerContainer}>
                    <View style={styles.logoSection}>
                        <PdfImage style={styles.logo} src={logoPath} />
                    </View>
                    <View style={styles.documentInfo}>
                        <Text style={styles.documentTitle}>PERINTAH PENGAMBILAN BARANG</Text>
                        <View style={styles.transferNumberBox}>
                            <Text style={styles.transferNumberText}>{transferNumber}</Text>
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

                    {/* Status Badge */}
                    <View style={[styles.statusBadge, {
                        backgroundColor: colors.primary + '15',
                        borderWidth: 1,
                        borderColor: colors.primary
                    }]}>
                        <Text style={{ color: colors.primary }}>
                            TRANSFER STOCK
                        </Text>
                    </View>
                </View>

                {/* ========== PICKING INSTRUCTIONS & QR ========== */}
                <View style={[styles.instructionsSection, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }]}>
                    <View style={{ width: '80%' }}>
                        <Text style={styles.instructionsTitle}>Instruksi Pengambilan Barang</Text>
                        <Text style={styles.instructionsText}>1. Ambil barang sesuai daftar di bawah ini dari gudang asal</Text>
                        <Text style={styles.instructionsText}>2. Periksa kondisi dan kuantitas barang sebelum pengambilan</Text>
                        <Text style={styles.instructionsText}>3. Tandai kolom "✓" setelah barang diambil</Text>
                        <Text style={styles.instructionsText}>4. Serahkan barang ke petugas pengiriman/penerima</Text>
                        <Text style={styles.instructionsText}>5. Dokumen ini harus ditandatangani oleh petugas yang mengambil barang</Text>
                    </View>

                    {transfer.qrToken && (
                        <View style={{ width: '18%', alignItems: 'center', justifyContent: 'center' }}>
                            <PdfImage
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(transfer.qrToken)}`}
                                style={{ width: 60, height: 60 }} // Adjust size as needed
                            />
                            <Text style={{ fontSize: 6, marginTop: 4, color: '#555' }}>
                                SCAN ME
                            </Text>
                        </View>
                    )}
                </View>

                {/* ========== TRANSFER DETAILS ========== */}
                <View style={styles.detailsSection}>
                    {/* Gudang Asal */}
                    <View style={styles.detailsBox}>
                        <View style={styles.detailsBoxHeader}>
                            <Text style={styles.detailsBoxTitle}>Gudang Asal</Text>
                        </View>
                        <Text style={styles.warehouseName}>
                            {fromWarehouse?.name || 'Nama Gudang'}
                        </Text>
                        <Text style={styles.warehouseAddress}>
                            {fromWarehouse?.address || 'Alamat gudang belum ditentukan'}
                        </Text>

                        <View style={[styles.summaryRow, { marginTop: 8 }]}>
                            <Text style={styles.summaryLabel}>Tanggal Pengambilan:</Text>
                            <Text style={[styles.summaryValue, styles.detailsValueBold]}>
                                {formatDate(transferDate)}
                            </Text>
                        </View>
                    </View>

                    {/* Gudang Tujuan */}
                    <View style={styles.detailsBox}>
                        <View style={styles.detailsBoxHeader}>
                            <Text style={styles.detailsBoxTitle}>Gudang Tujuan</Text>
                        </View>
                        <Text style={styles.warehouseName}>
                            {toWarehouse?.name || 'Nama Gudang'}
                        </Text>
                        <Text style={styles.warehouseAddress}>
                            {toWarehouse?.address || 'Alamat gudang belum ditentukan'}
                        </Text>
                    </View>
                </View>

                {/* ========== SUMMARY ========== */}
                {/* <View style={styles.summaryBox}>
                    <Text style={styles.summaryTitle}>Ringkasan Pengambilan</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Jumlah Jenis Barang:</Text>
                        <Text style={styles.summaryValue}>{totalItems} jenis</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total Kuantitas:</Text>
                        <Text style={styles.summaryValue}>{totalQuantity} unit</Text>
                    </View>
                </View> */}

                {/* ========== NOTES ========== */}
                {notes && (
                    <View style={styles.notesSection}>
                        <Text style={styles.notesTitle}>Catatan Khusus:</Text>
                        <Text style={styles.notesText}>{notes}</Text>
                    </View>
                )}

                {/* ========== TABEL PENGAMBILAN BARANG ========== */}
                <View style={styles.tableContainer}>
                    <Text style={styles.tableTitle}>Daftar Barang yang Diambil</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeaderCell, styles.colNo]}>#</Text>
                            <Text style={[styles.tableHeaderCell, styles.colSku]}>SKU</Text>
                            <Text style={[styles.tableHeaderCell, styles.colProduct]}>NAMA BARANG</Text>
                            <Text style={[styles.tableHeaderCell, styles.colUom]}>SATUAN</Text>
                            <Text style={[styles.tableHeaderCell, styles.colQty]}>QTY</Text>
                            <Text style={[styles.tableHeaderCell, styles.colLocation]}>LOKASI</Text>
                            <Text style={[styles.tableHeaderCell, styles.colChecked]}>✓</Text>
                        </View>
                        {sortedItems.map((item, index) => (
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
                                <Text style={[styles.tableCell, styles.colUom]}>
                                    {item.product?.unit || item.unit || 'PCS'}
                                </Text>
                                <Text style={[styles.tableCell, styles.colQty]}>{item.quantity || 0}</Text>
                                <Text style={[styles.tableCell, styles.colLocation]}>
                                    {fromWarehouse?.name || 'Nama Gudang'}
                                </Text>
                                <Text style={[styles.tableCell, styles.colChecked]}></Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* ========== TANDA TANGAN ========== */}
                <View style={styles.signatureSection}>
                    <Text style={styles.signatureTitle}>Verifikasi dan Tanda Tangan</Text>
                    <View style={styles.signatureGrid}>
                        <View style={styles.signatureBox}>
                            <Text style={styles.signatureLabel}>Dibuat Oleh</Text>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureName}>
                                {sender?.name || sender?.user?.name || '________________'}
                            </Text>
                            <Text style={styles.signaturePosition}>Staff Gudang (Pengirim)</Text>
                        </View>
                        <View style={styles.signatureBox}>
                            <Text style={styles.signatureLabel}>Diambil Oleh</Text>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureName}>________________</Text>
                            <Text style={styles.signaturePosition}>Petugas Pengambil</Text>
                        </View>
                        <View style={styles.signatureBox}>
                            <Text style={styles.signatureLabel}>Diterima Oleh</Text>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureName}>
                                {receiver?.name || receiver?.user?.name || '________________'}
                            </Text>
                            <Text style={styles.signaturePosition}>Kepala Gudang (Penerima)</Text>
                        </View>
                    </View>
                </View>

                {/* ========== FOOTER ========== */}
                <View style={styles.footer} fixed>
                    <Text style={styles.footerLeft}>
                        Dokumen dibuat: {formatDateShort(createdAt)}
                    </Text>
                    <Text style={styles.footerCenter}>
                        Perintah pengambilan barang ini berlaku untuk sekali pengambilan
                    </Text>
                    <Text style={styles.footerRight}>
                        {transferNumber} | Hal 1/1
                    </Text>
                </View>
            </Page>
        </Document>
    );
};

export default StockTransferPickListPdfDocument;