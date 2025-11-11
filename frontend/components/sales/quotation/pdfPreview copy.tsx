import { QuotationLine, QuotationSummary } from "@/types/quotation";
import { Document, Page, Text, View, StyleSheet, Image as PdfImage } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
    page: {
        padding: 25, // Sedikit lebih besar padding untuk ukuran Legal
        fontFamily: 'Helvetica',
        fontSize: 10,
        lineHeight: 1.3,
        backgroundColor: '#FFFFFF',
        position: 'relative',
    },
    // Header
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 15,
        borderBottomWidth: 2,
        borderBottomColor: '#000000',
        borderBottomStyle: 'solid',
        paddingBottom: 15,
    },
    logo: {
        width: 90,
        height: 40,
        marginRight: 15,
    },
    companyInfo: {
        flex: 1,
        textAlign: 'right',
        fontSize: 8,
        lineHeight: 1.2,
    },
    quotationTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#008000',
        textAlign: 'center',
        marginBottom: 15,
    },
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    leftColumn: {
        width: '48%',
    },
    rightColumn: {
        width: '48%',
    },
    section: {
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#008000',
        marginBottom: 4,
        backgroundColor: '#f5f5f5',
        padding: 3,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 3,
    },
    label: {
        fontWeight: 'bold',
        width: '40%',
    },
    value: {
        width: '58%',
    },
    table: {
        width: '100%',
        marginBottom: 15,
    },
    textHeader: {
        marginBottom: 12,
        fontSize: 10,
        textAlign: 'justify',
        width: '100%',
    },
    textHeaderDH: {
        marginBottom: 4,
        fontSize: 10,
        textAlign: 'justify',
        width: '100%',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#008000',
        color: '#FFFFFF',
        padding: 8,
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        padding: 4,
        borderBottom: '1pt solid #e0e0e0',
    },
    colNo: { width: '8%' },
    colDesc: { width: '42%' },
    colQty: { width: '10%', textAlign: 'right' },
    colUom: { width: '8%', textAlign: 'center' },
    colUnitPrice: { width: '15%', textAlign: 'right' },
    colDiscount: { width: '12%', textAlign: 'right' },
    colTotal: { width: '15%', textAlign: 'right' },
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    notesContainer: {
        width: '55%',
        padding: 8,
        borderRadius: 4,
        position: 'relative',
        zIndex: 1,
    },
    notesLabel: {
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#008000',
    },
    notesText: {
        fontSize: 9,
        lineHeight: 1.4,
    },
    summaryTable: {
        width: '40%',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 5,
    },
    summaryLabel: {
        fontWeight: 'bold',
    },
    grandTotal: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#008000',
        borderTop: '1pt solid #008000',
        paddingTop: 5,
    },
    footer: {
        marginTop: 30,
        paddingTop: 10,
        borderTop: '1pt solid #e0e0e0',
        fontSize: 9,
        color: '#666666',
    },
    approvalSection: {
        marginTop: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    approvalBox: {
        width: '30%',
        textAlign: 'center',
    },
    approvalLine: {
        marginTop: 60,
        borderTop: '1pt solid #000000',
        paddingTop: 5,
    },
    // Watermark styles - disesuaikan untuk ukuran Legal
    watermark: {
        position: 'absolute',
        top: '50%', // Posisi tengah vertikal
        left: '50%', // Posisi tengah horizontal
        transform: 'translate(-50%, -50%) rotate(-35deg)',
        fontSize: 80, // Lebih besar untuk ukuran Legal
        color: 'rgba(0, 128, 0, 0.2)',
        fontWeight: 'bold',
        zIndex: 9999,
        pointerEvents: 'none',
    },
    statusBadge: {
        padding: 4,
        borderRadius: 3,
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 8,
        marginTop: 2,
    }
});

// Format currency
const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(numAmount);
};

// Format date
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
};

// Format discount
const formatDiscount = (line: QuotationLine) => {
    if (line.lineDiscountType === 'PERCENT') {
        return `${line.lineDiscountValue}%`;
    } else if (line.lineDiscountType === 'AMOUNT') {
        return formatCurrency(line.lineDiscountValue);
    }
    return '-';
};

// Quotation PDF Component dengan ukuran Legal
const QuotationPdfDocument = ({ quotation }: { quotation: QuotationSummary }) => {
    const logoPath = '/LogoMd.png';

    const {
        quotationNumber,
        version,
        customer,
        status,
        validFrom,
        validUntil,
        subtotal,
        taxTotal,
        total,
        notes,
        quotationDate,
        updatedAt,
        lines = []
    } = quotation;

    return (
        <Document>
            {/* Ukuran Legal: 8.5 x 14 inci atau 215.9 x 355.6 mm */}
            <Page 
                size="LEGAL" 
                style={styles.page}
                orientation="portrait" // Portrait orientation untuk Legal
            >
                {/* Watermark untuk status tertentu */}
                {status === 'EXPIRED' && (
                    <View style={styles.watermark} fixed>
                        <Text>KADALUARSA</Text>
                    </View>
                )}

                {/* Header dengan logo dan info perusahaan */}
                <View style={styles.headerContainer}>
                    {logoPath && (
                        <PdfImage
                            style={styles.logo}
                            src={logoPath}
                        />
                    )}
                    <View style={styles.companyInfo}>
                        <Text style={{ color: '#008000', fontWeight: 'bold', fontSize: 12, marginBottom: 5 }}>
                            PT. RYLIF MIKRO MANDIRI
                        </Text>
                        <Text>Office: Jl. Anyar RT. 01/RW. 01, Kampung Pulo, No. 5</Text>
                        <Text>Kemang Pratama, Bekasi Barat, Bekasi - 17144, Indonesia</Text>
                        <Text>Phone: 0857-7414-8874 | Email: rylifmikromandiri@gmail.com</Text>
                    </View>
                </View>

                {/* Judul Quotation */}
                <Text style={styles.quotationTitle}>QUOTATION</Text>

                {/* Informasi Quotation dan Customer */}
                <View style={styles.infoContainer}>
                    <View style={styles.leftColumn}>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>QUOTATION DETAILS</Text>
                            <View style={styles.row}>
                                <Text style={styles.label}>Quotation Number:</Text>
                                <Text style={[styles.value, { fontWeight: 'bold' }]}>
                                    {quotationNumber}
                                </Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Quotation Date:</Text>
                                <Text style={styles.value}>{formatDate(quotationDate)}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Revisi:</Text>
                                <View style={styles.value}>
                                    <Text style={[styles.value, { color: 'grey' }]}>
                                        {version && version > 1 ? `(Rev. ${version})` : ''}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.rightColumn}>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>QUOTE TO</Text>
                            <Text style={{ fontWeight: 'bold', marginBottom: 3 }}>
                                {customer?.name || '-'}
                            </Text>
                            <Text>{customer?.address || '-'}</Text>
                            <Text>Kantor Cabang - {customer?.branch || '-'}</Text>
                        </View>
                    </View>
                </View>

                {/* Pembukaan Surat - FULL WIDTH */}
                <View style={styles.textHeaderDH}>
                    <Text>
                        Dengan hormat,
                    </Text>
                </View>
                <View style={styles.textHeader}>
                    <Text>
                        {'\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'}
                        Menindaklanjuti pembahasan sebelumnya, bersama ini kami sampaikan penawaran harga untuk produk/jasa yang dimaksud. Kami berharap penawaran ini dapat memenuhi kebutuhan Bpk./Ibu di {customer?.name || 'perusahaan Anda'}.
                    </Text>
                </View>

                {/* Tabel Items */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ITEMS DETAIL</Text>
                    <View style={styles.table}>
                        {/* Table Header */}
                        <View style={styles.tableHeader}>
                            <Text style={styles.colNo}>No</Text>
                            <Text style={styles.colDesc}>Description</Text>
                            <Text style={styles.colQty}>Qty</Text>
                            <Text style={styles.colUom}>UoM</Text>
                            <Text style={styles.colUnitPrice}>Unit Price</Text>
                            <Text style={styles.colDiscount}>Discount</Text>
                            <Text style={styles.colTotal}>Total</Text>
                        </View>

                        {/* Table Rows */}
                        {lines.map((line, index) => (
                            <View key={line.id || index} style={styles.tableRow}>
                                <Text style={styles.colNo}>{line.lineNo || index + 1}</Text>
                                <Text style={styles.colDesc}>
                                    {line.description || 'Product Description'}
                                </Text>
                                <Text style={styles.colQty}>{line.qty}</Text>
                                <Text style={styles.colUom}>{line.uom || '-'}</Text>
                                <Text style={styles.colUnitPrice}>{formatCurrency(line.unitPrice)}</Text>
                                <Text style={styles.colDiscount}>{formatDiscount(line)}</Text>
                                <Text style={styles.colTotal}>{formatCurrency(line.lineTotal)}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Summary dengan Notes */}
                <View style={styles.summaryContainer}>
                    {/* Container Notes di kiri */}
                    <View style={styles.notesContainer}>
                        <Text style={styles.notesLabel}>Catatan:</Text>
                        <Text style={styles.notesText}>{notes || 'Tidak ada catatan'}</Text>

                        {/* Informasi tambahan */}
                        <View style={{ marginTop: 15 }}>
                            {(validFrom || validUntil) && (
                                <View style={{ marginTop: 8 }}>
                                    <Text style={styles.notesText}>
                                        • Quotation ini berlaku sesuai dengan masa berlaku :
                                    </Text>
                                    <Text style={[styles.notesText, { paddingLeft: 6 }]}>
                                        <Text style={styles.value}>
                                            Mulai: {validFrom ? formatDate(validFrom) : '-'}{'  '}
                                        </Text>
                                        <Text style={styles.value}>
                                            Berakhir: {validUntil ? formatDate(validUntil) : '-'}
                                        </Text>
                                    </Text>
                                </View>
                            )}
                            <Text style={styles.notesText}>
                                • Harga belum termasuk PPN kecuali disebutkan lain
                            </Text>
                            <Text style={styles.notesText}>
                                • Syarat dan ketentuan berlaku
                            </Text>
                        </View>
                    </View>

                    {/* Tabel Summary di kanan */}
                    <View style={styles.summaryTable}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal:</Text>
                            <Text>{formatCurrency(subtotal)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Pajak (PPN):</Text>
                            <Text>{formatCurrency(taxTotal)}</Text>
                        </View>
                        <View style={[styles.summaryRow, { borderTop: '1pt solid #e0e0e0', marginTop: 5 }]}>
                            <Text style={[styles.summaryLabel, styles.grandTotal]}>Total:</Text>
                            <Text style={styles.grandTotal}>{formatCurrency(total)}</Text>
                        </View>
                    </View>
                </View>

                {/* Approval Section - lebih banyak ruang untuk Legal */}
                <View style={styles.approvalSection}>
                    <View style={styles.approvalBox}>
                        <Text>Disiapkan Oleh,</Text>
                        <View style={styles.approvalLine} />
                        <Text>Sales Representative</Text>
                        <Text>PT. RYLIF MIKRO MANDIRI</Text>
                    </View>
                    <View style={styles.approvalBox}>
                        <Text>Disetujui Oleh,</Text>
                        <View style={styles.approvalLine} />
                        <Text>Management</Text>
                        <Text>PT. RYLIF MIKRO MANDIRI</Text>
                    </View>
                    <View style={styles.approvalBox}>
                        <Text>Diterima Oleh,</Text>
                        <View style={styles.approvalLine} />
                        <Text>Customer</Text>
                        <Text>{customer?.name || 'Customer'}</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>Quotation generated on: {formatDate(new Date().toISOString())}</Text>
                    <Text>Terakhir diperbarui: {formatDate(updatedAt)}</Text>
                    <Text>This is a computer generated quotation.</Text>
                </View>
            </Page>
        </Document>
    );
};

export default QuotationPdfDocument;