import { Invoice } from '@/schemas/invoice';
import { Document, Page, Text, View, StyleSheet, Image as PdfImage } from '@react-pdf/renderer';
import path from 'path';

// Create styles
const styles = StyleSheet.create({
    page: {
        padding: 20,
        fontFamily: 'Helvetica',
        fontSize: 10,
        lineHeight: 1.3,
        backgroundColor: '#FFFFFF',
        position: 'relative', // Ditambahkan untuk positioning watermark
    },
    //Header
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
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

    invoiceTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#008000',
        textAlign: 'center',
        marginBottom: 20,
    },
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    leftColumn: {
        width: '48%',
    },
    rightColumn: {
        width: '48%',
    },
    section: {
        marginBottom: 5,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#008000',
        marginBottom: 2,
        // backgroundColor: '#f5f5f5',
        padding: 0,
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
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        color: '#000000',
        padding: 8,
        fontWeight: 'bold',
        borderTopWidth: 1,       // garis atas
        borderBottomWidth: 1,    // garis bawah
        borderLeftWidth: 0,      // hilangkan garis kiri
        borderRightWidth: 0,     // hilangkan garis kanan
        borderColor: '#000000',
        borderStyle: 'solid',
    },
    tableRow: {
        flexDirection: 'row',
        padding: 4,
        borderBottom: '1pt solid #e0e0e0',
    },
    colNo: { width: '8%' },
    colDesc: { width: '42%' },
    colQty: { width: '15%', textAlign: 'right' },
    colPrice: { width: '17%', textAlign: 'right' },
    colTotal: { width: '18%', textAlign: 'right' },
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        zIndex: 1,
    },
    terbilangContainer: {
        width: '55%',
        padding: 8,
        // backgroundColor: '#f9f9f9',
        // border: '1pt solid #e0e0e0',
        borderRadius: 4,
        position: 'relative',   // kalau memang perlu
        zIndex: 1,
    },
    terbilangLabel: {
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#008000',
    },
    terbilangText: {
        fontStyle: 'italic',
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
    notesSection: {
        marginBottom: 20,
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
    approvalRek: {
        width: '40%',
        textAlign: 'left',
        fontWeight: 'bold',
    },
    approvalLine: {
        marginTop: 60,
        borderTop: '1pt solid #000000',
        paddingTop: 5,
    },
    // Watermark styles
    watermark: {
        position: 'absolute',
        top: '65%',
        left: '70%',
        transform: 'translate(-50%, -50%) rotate(-35deg)',
        fontSize: 60,
        color: 'rgba(0, 128, 0, 0.2)',
        fontWeight: 'bold',
        zIndex: 9999,
        pointerEvents: 'none', // Agar tidak mengganggu interaksi
    }
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
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
};

// Fungsi terbilang yang diperbaiki
const convertToTerbilang = (angka: number): string => {
    if (angka === 0) return 'Nol Rupiah';

    const bilangan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

    const convert = (num: number): string => {
        if (num < 12) {
            return bilangan[num];
        } else if (num < 20) {
            return convert(num - 10) + ' Belas';
        } else if (num < 100) {
            const puluh = Math.floor(num / 10);
            const sisa = num % 10;
            return bilangan[puluh] + ' Puluh' + (sisa > 0 ? ' ' + convert(sisa) : '');
        } else if (num < 200) {
            return 'Seratus' + (num - 100 > 0 ? ' ' + convert(num - 100) : '');
        } else if (num < 1000) {
            const ratus = Math.floor(num / 100);
            const sisa = num % 100;
            return bilangan[ratus] + ' Ratus' + (sisa > 0 ? ' ' + convert(sisa) : '');
        } else if (num < 2000) {
            return 'Seribu' + (num - 1000 > 0 ? ' ' + convert(num - 1000) : '');
        } else if (num < 1000000) {
            const ribu = Math.floor(num / 1000);
            const sisa = num % 1000;
            return convert(ribu) + ' Ribu' + (sisa > 0 ? ' ' + convert(sisa) : '');
        } else if (num < 1000000000) {
            const juta = Math.floor(num / 1000000);
            const sisa = num % 1000000;
            return convert(juta) + ' Juta' + (sisa > 0 ? ' ' + convert(sisa) : '');
        } else if (num < 1000000000000) {
            const milyar = Math.floor(num / 1000000000);
            const sisa = num % 1000000000;
            return convert(milyar) + ' Milyar' + (sisa > 0 ? ' ' + convert(sisa) : '');
        } else {
            return 'Angka terlalu besar';
        }
    };

    const result = convert(angka);

    // Bersihkan spasi ganda dan trim, lalu tambahkan "Rupiah"
    return result.replace(/\s+/g, ' ').trim() + ' Rupiah';
};

// Invoice PDF Component
const InvoicePdfDocument = ({ invoice }: { invoice: Invoice }) => {
    const logoPath = path.resolve('/LogoMd.png');
    const {
        invoiceNumber,
        invoiceDate,
        dueDate,
        salesOrder,
        notes,
        // internalNotes,
        // termsConditions,
        installmentType,
        installments,
        bankAccount,
        items,
        subtotal,
        taxTotal,
        discountTotal,
        grandTotal,
        // balanceDue,
        approvalStatus,
        approvedBy,
        status // Ditambahkan untuk status invoice
    } = invoice;

    const terbilangText = convertToTerbilang(grandTotal);
    console.log('Invoice', invoice);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Watermark LUNAS */}
                {status === 'PAID' && (
                    <View style={styles.watermark} fixed>
                        <Text>LUNAS</Text>
                    </View>
                )}

                {/* Header dengan logo dan info perusahaan */}
                <View style={styles.headerContainer}>
                    <PdfImage style={styles.logo} src={logoPath} />
                    <View style={styles.companyInfo}>
                        <Text style={{ color: '#008000', fontWeight: 'bold', fontSize: 12, marginBottom: 5 }}>
                            PT. RYLIF MIKRO MANDIRI
                        </Text>
                        <Text>Office: Jl. Anyar RT. 01/RW. 01, Kampung Pulo, No. 5</Text>
                        <Text>Kemang Pratama, Bekasi Barat, Bekasi - 17144, Indonesia</Text>
                        <Text>Phone: 0857-7414-8874 | Email: rylifmikromandiri@gmail.com</Text>
                    </View>
                </View>

                {/* Judul Invoice */}
                <Text style={styles.invoiceTitle}>INVOICE</Text>

                {/* Informasi Invoice dan Customer */}
                <View style={styles.infoContainer}>
                    <View style={styles.leftColumn}>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>INVOICE DETAILS</Text>
                            <View style={styles.row}>
                                <Text style={styles.label}>Invoice Number:</Text>
                                <Text style={[styles.value, { fontWeight: 'bold' }]}>{invoiceNumber}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Invoice Date:</Text>
                                <Text style={styles.value}>{formatDate(invoiceDate)}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Due Date:</Text>
                                <Text style={styles.value}>{formatDate(dueDate)}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>SO Number:</Text>
                                <Text style={styles.value}>{salesOrder?.soNumber}</Text>
                            </View>
                            {/* Menampilkan status invoice */}
                            {/* <View style={styles.row}>
                                <Text style={styles.label}>Status:</Text>
                                <Text style={[styles.value, {
                                    color: status === 'PAID' ? '#008000' : '#ff0000',
                                    fontWeight: 'bold'
                                }]}>
                                    {status === 'PAID' ? 'LUNAS' : 'BELUM LUNAS'}
                                </Text>
                            </View> */}
                        </View>
                    </View>

                    <View style={styles.rightColumn}>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>BILL TO</Text>
                            <Text style={{ fontWeight: 'bold', marginBottom: 1 }}>
                                {salesOrder?.customer?.name || 'Customer Name'}
                            </Text>
                            <Text style={{ fontWeight: 'bold', marginBottom: 3 }} >
                                {`Kantor Cabang - ${salesOrder?.customer?.branch}` || 'Customer Cabang'}</Text>
                            <Text>{salesOrder?.customer?.address || 'Customer Address'}</Text>
                        </View>
                    </View>
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
                            <Text style={styles.colPrice}>Unit Price</Text>
                            <Text style={styles.colTotal}>Total</Text>
                        </View>

                        {/* Table Rows */}
                        {items.map((item, index) => (
                            <View key={index} style={styles.tableRow}>
                                <Text style={styles.colNo}>{index + 1}</Text>
                                <Text style={styles.colDesc}>{item.name}</Text>
                                <Text style={styles.colQty}>{item.qty} - {item.uom}</Text>
                                <Text style={styles.colPrice}>{formatCurrency((item.unitPrice))}</Text>
                                <Text style={styles.colTotal}>{formatCurrency((item.qty ?? 0) * (item.unitPrice ?? 0))}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Summary dengan Terbilang */}
                <View style={styles.summaryContainer}>
                    {/* Container Terbilang di kiri */}
                    <View style={styles.terbilangContainer}>
                        <Text style={styles.terbilangLabel}>Terbilang:</Text>
                        <Text style={styles.terbilangText}>
                            {formatCurrency(grandTotal)} ({terbilangText})
                        </Text>

                        <View style={{ width: '100%', marginTop: 10 }}>
                            <Text style={styles.sectionTitle}>Customer Notes</Text>
                            <Text style={styles.terbilangText}>{notes || '-'}</Text>

                            <Text style={styles.sectionTitle}>Terms & Conditions</Text>
                            <Text style={styles.terbilangText}>Payment : {installmentType || '-'}</Text>

                            {installmentType !== "FULL" && installments?.length > 0 && (
                                <View style={{ marginTop: 8 }}>
                                    {installments.map((inst, index) => (
                                        <View
                                            key={inst.id}
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                marginBottom: 4,
                                            }}
                                        >
                                            <Text style={styles.terbilangText}>
                                                {index + 1}. {inst.name} ({inst.percentage ? `${inst.percentage}%` : "-"})
                                            </Text>
                                            <Text style={styles.terbilangText}>
                                                {Number(inst.amount).toLocaleString("id-ID", {
                                                    style: "currency",
                                                    currency: "IDR",
                                                })}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Tabel Summary di kanan */}
                    <View style={styles.summaryTable}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal:</Text>
                            <Text>{formatCurrency((subtotal))}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Tax:</Text>
                            <Text>{formatCurrency((taxTotal))}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Discount:</Text>
                            <Text>{formatCurrency((discountTotal))}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, styles.grandTotal]}>Grand Total:</Text>
                            <Text style={styles.grandTotal}>{formatCurrency((grandTotal))}</Text>
                        </View>
                        {/* <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Balance Due:</Text>
                            <Text style={{
                                fontWeight: 'bold',
                                color: status === 'PAID' ? '#008000' : '#ff0000' // Hijau jika LUNAS, merah jika belum
                            }}>
                                {formatCurrency((balanceDue))}
                            </Text>
                        </View> */}
                    </View>
                </View>

                {/* Approval Section */}
                {approvalStatus === 'APPROVED' && approvedBy && (
                    <View style={styles.approvalSection}>
                        <View style={styles.approvalRek}>
                            <Text>Pembayaran Invoice di Transfer ke Rekening: ,</Text>
                            <Text>{bankAccount.bankName}</Text>
                            <Text>{bankAccount.accountNumber}</Text>
                            <Text>{bankAccount.accountHolder}</Text>
                        </View>
                        <View style={styles.approvalBox}>
                            <Text>Hormat Kami,</Text>
                            <View style={styles.approvalLine} />
                            <Text>{approvedBy.namaLengkap}</Text>
                        </View>
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>Invoice generated on: {formatDate(new Date().toISOString())}</Text>
                    <Text>This is a computer generated document, no signature required.</Text>
                </View>
            </Page>
        </Document>
    );
};

export default InvoicePdfDocument;