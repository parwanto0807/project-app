import { Page, Text, View, Document, StyleSheet, Font, Image as PdfImage } from '@react-pdf/renderer';
import { PurchaseRequest } from '@/types/pr';

// Register font jika diperlukan
Font.register({
    family: 'Helvetica',
    fonts: [
        { src: '/path/to/helvetica-regular.ttf' },
        { src: '/path/to/helvetica-bold.ttf', fontWeight: 'bold' },
    ],
});

// Create styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: 'Helvetica',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
        borderBottomWidth: 3,
        borderBottomColor: '#1e4a5f',
        borderBottomStyle: 'solid',
        paddingBottom: 10,
    },
    logo: {
        width: 120,
        height: 35,
    },
    companyInfo: {
        flex: 1,
        textAlign: 'right',
        fontSize: 9,
        lineHeight: 1.3,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#1e4a5f',
    },
    section: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        backgroundColor: '#f0f0f0',
        padding: 5,
        color: '#1e4a5f',
    },
    row: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    label: {
        width: '30%',
        fontSize: 10,
        fontWeight: 'bold',
    },
    value: {
        width: '70%',
        fontSize: 10,
    },
    table: {
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#1e4a5f',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#008000',
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
        padding: 5,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#1e4a5f',
        padding: 5,
        fontSize: 9,
    },
    colNo: {
        width: '5%',
        textAlign: 'center',
    },
    colProduct: {
        width: '40%',
    },
    colQty: {
        width: '10%',
        textAlign: 'center',
    },
    colUnit: {
        width: '10%',
        textAlign: 'center',
    },
    colPrice: {
        width: '15%',
        textAlign: 'right',
    },
    colTotal: {
        width: '20%',
        textAlign: 'right',
    },
    footer: {
        marginTop: 20,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#1e4a5f',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signature: {
        width: '45%',
        textAlign: 'center',
        fontSize: 10,
    },
    totalSection: {
        marginTop: 10,
        marginRight: 5,
        alignItems: 'flex-end',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '30%',
        marginBottom: 3,
        fontSize: 10,
    },
    totalLabel: {
        fontWeight: 'bold',
    },
    statusBadge: {
        padding: 3,
        borderRadius: 3,
        justifyContent: 'flex-end',
        fontSize: 8,
        fontWeight: 'bold',
        textAlign: 'right',
    },
});

// Status color mapping
const getStatusColor = (status: string) => {
    switch (status) {
        case 'DRAFT':
            return '#6c757d';
        case 'SUBMITTED':
            return '#007bff';
        case 'UNDER_REVIEW':
            return '#ffc107';
        case 'APPROVED':
            return '#28a745';
        case 'REJECTED':
            return '#dc3545';
        case 'CANCELLED':
            return '#6c757d';
        default:
            return '#6c757d';
    }
};

// Format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

// Format date
const formatDate = (date: Date | string): string => {
    if (!date) return "-";
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, "0");

    const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
        "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
    ];
    const month = monthNames[d.getMonth()];

    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
};

interface PreviewPdfProps {
    data: PurchaseRequest;
}

const PurchaseRequestPdfPreview = ({ data }: PreviewPdfProps) => {
    const totalEstimasi: number = (data.details ?? []).reduce(
        (sum, item) => sum + Number(item.estimasiTotalHarga || 0),
        0
    );
    const formattedTotal = formatCurrency(totalEstimasi);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.headerContainer}>
                    <View style={styles.logo}>
                        <PdfImage style={styles.logo} src="/Logo.png" />
                    </View>
                    <View style={styles.companyInfo}>
                        <Text style={{ color: '#1e4a5f', fontWeight: 'bold', fontSize: 13, marginBottom: 2 }}>
                            PT. RYLIF MIKRO MANDIRI
                        </Text>
                        <Text>Office: Jl. Anyar RT. 01/RW. 01, Kampung Pulo, No. 5</Text>
                        <Text>Kemang Pratama, Bekasi Barat, Bekasi - 17144, Indonesia</Text>
                        <Text>Phone: 0857-7414-8874 | Email: rylifmikromandiri@gmail.com</Text>
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.title}>PURCHASE REQUEST</Text>

                {/* PR Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informasi Purchase Request</Text>
                    <View style={styles.row}>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(data.status) }]}>
                            <Text style={{ color: '#FFFFFF' }}>{data.status}</Text>
                        </View>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Nomor PR</Text>
                        <Text style={styles.value}>: {data.nomorPr}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Tanggal PR</Text>
                        <Text style={styles.value}>: {formatDate(data.tanggalPr)}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Project</Text>
                        <Text style={styles.value}>: {data.project?.name || '-'}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Nomor SPK</Text>
                        <Text style={styles.value}>: {data.spk?.spkNumber || '-'}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Requested By</Text>
                        <Text style={styles.value}>: {data.karyawan?.namaLengkap || '-'}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Keterangan</Text>
                        <Text style={styles.value}>: {data.keterangan || '-'}</Text>
                    </View>
                </View>

                {/* Items Table */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Detail Items</Text>

                    <View style={styles.table}>
                        {/* Table Header */}
                        <View style={styles.tableHeader}>
                            <Text style={styles.colNo}>No</Text>
                            <Text style={styles.colProduct}>Description</Text>
                            <Text style={styles.colQty}>Qty</Text>
                            <Text style={styles.colUnit}>Satuan</Text>
                            <Text style={styles.colPrice}>Estimasi Harga</Text>
                            <Text style={styles.colTotal}>Total</Text>
                        </View>

                        {/* Table Rows */}
                        {data.details.map((item, index) => (
                            <View key={item.id || index} style={styles.tableRow}>
                                <Text style={styles.colNo}>{index + 1}</Text>
                                <Text style={styles.colProduct}>{item.catatanItem}</Text>
                                <Text style={styles.colQty}>{item.jumlah}</Text>
                                <Text style={styles.colUnit}>{item.satuan}</Text>
                                <Text style={styles.colPrice}>{formatCurrency(item.estimasiHargaSatuan)}</Text>
                                <Text style={styles.colTotal}>{formatCurrency(item.estimasiTotalHarga)}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Total Section */}
                    <View style={styles.totalSection}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total Estimasi:</Text>
                            <Text>{formattedTotal}</Text>
                        </View>
                    </View>
                </View>

                {/* === UANG MUKA === */}
                {data.uangMuka && data.uangMuka.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Aprroval Purchase Request</Text>
                        {data.uangMuka.map((um, idx) => (
                            <View key={um.id || idx} wrap={false} style={{ marginBottom: 8 }}>
                                <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 3 }}>
                                    {um.nomor} ({formatDate(um.tanggalPengajuan)})
                                </Text>
                                <Text style={{ fontSize: 9 }}>
                                    Jumlah: {formatCurrency(um.jumlah)} | Status: {um.status}
                                </Text>
                                <Text style={{ fontSize: 9 }}>
                                    Metode: {um.metodePencairan} {um.namaBankTujuan ? `- ${um.namaBankTujuan}/${um.nomorRekeningTujuan}` : ""}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* === PERTANGGUNGJAWABAN === */}
                {/* Section Pertanggungjawaban */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Laporan Pengeluaran Perjalanan</Text>

                    {data.uangMuka?.some(um => um.pertanggungjawaban && um.pertanggungjawaban.length > 0) ? (
                        data.uangMuka.flatMap(um => um.pertanggungjawaban || []).map((ptj, idx) => (
                            <View key={ptj.id || idx} style={{ marginBottom: 10 }}>
                                <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 3 }}>
                                    {ptj.nomor} ({formatDate(ptj.tanggal)})
                                </Text>
                                <Text style={{ fontSize: 9 }}>
                                    Total Biaya: {formatCurrency(ptj.totalBiaya)} | Sisa: {formatCurrency(ptj.sisaUangDikembalikan)}
                                </Text>
                                <Text style={{ fontSize: 9 }}>Status: {ptj.status}</Text>
                                {ptj.keterangan && <Text style={{ fontSize: 9 }}>Keterangan: {ptj.keterangan}</Text>}

                                {/* Detail Rincian */}
                                {ptj.details && ptj.details.length > 0 && (
                                    <View style={[styles.table, { marginTop: 5 }]}>
                                        <View style={styles.tableHeader}>
                                            <Text style={styles.colNo}>No</Text>
                                            <Text style={styles.colProduct}>Keterangan</Text>
                                            <Text style={styles.colQty}>Tanggal</Text>
                                            <Text style={styles.colUnit}>Jenis</Text>
                                            <Text style={styles.colTotal}>No. Bukti</Text>
                                            <Text style={styles.colPrice}>Total</Text>
                                        </View>
                                        {ptj.details.map((d, i) => (
                                            <View key={d.id || i} style={styles.tableRow}>
                                                <Text style={styles.colNo}>{i + 1}</Text>
                                                <Text style={styles.colProduct}>{d.keterangan}</Text>
                                                <Text style={styles.colQty}>{formatDate(d.tanggalTransaksi)}</Text>
                                                <Text style={styles.colUnit}>{d.jenisPembayaran}</Text>
                                                <Text style={styles.colTotal}>{d.nomorBukti || "-"}</Text>
                                                <Text style={styles.colPrice}>{formatCurrency(d.jumlah)}</Text>
                                            </View>
                                        ))}
                                        <View style={styles.totalSection}>
                                            <View style={styles.totalRow}>
                                                <Text style={styles.totalLabel}>Total Realisasi LPP:</Text>
                                                <Text>{formatCurrency(ptj.totalBiaya)}</Text>
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </View>
                        ))
                    ) : (
                        <Text style={{ fontSize: 9, fontStyle: "italic", marginTop: 5, color: "#555" }}>
                            Belum ada Laporan Pengeluaran Perjalanan
                        </Text>
                    )}
                </View>


                {/* Footer - Signatures */}
                <View style={styles.footer}>
                    <View style={styles.signature}>
                        <Text>Requested By,</Text>
                        <Text style={{ marginTop: 50 }}>{data.karyawan?.namaLengkap || '-'}</Text>
                    </View>

                    <View style={styles.signature}>
                        <Text>Approved By,</Text>
                        <Text style={{ marginTop: 50 }}>___________________</Text>
                    </View>
                </View>

                {/* Page Number */}
                <Text
                    style={{
                        position: 'absolute',
                        bottom: 30,
                        left: 0,
                        right: 0,
                        textAlign: 'center',
                        fontSize: 10,
                        color: '#666',
                    }}
                    render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
                    fixed
                />
            </Page>
        </Document>
    );
};

export default PurchaseRequestPdfPreview;
