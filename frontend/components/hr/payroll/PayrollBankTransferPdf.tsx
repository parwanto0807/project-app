import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image as PdfImage } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

// Create styles
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 8,
        fontFamily: 'Helvetica',
        backgroundColor: '#FFFFFF',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 15,
        borderBottomWidth: 2,
        borderBottomColor: '#000000',
        paddingBottom: 10,
    },
    logo: {
        width: 80,
        height: 35,
    },
    companyInfo: {
        flex: 1,
        textAlign: 'right',
        fontSize: 7,
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 5,
        textDecoration: 'underline',
    },
    subtitle: {
        fontSize: 10,
        textAlign: 'center',
        marginBottom: 20,
    },
    table: {
        display: 'flex',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginTop: 10,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        minHeight: 25,
        alignItems: 'center',
    },
    tableHeader: {
        backgroundColor: '#f9fafb',
        fontWeight: 'bold',
    },
    tableCell: {
        padding: 5,
    },
    // Column widths
    colNo: { width: '5%', textAlign: 'center', borderRightWidth: 1, borderRightColor: '#e5e7eb' },
    colNama: { width: '25%', borderRightWidth: 1, borderRightColor: '#e5e7eb' },
    colBank: { width: '12%', borderRightWidth: 1, borderRightColor: '#e5e7eb', textAlign: 'center' },
    colRekening: { width: '18%', borderRightWidth: 1, borderRightColor: '#e5e7eb', textAlign: 'center' },
    colNamaRek: { width: '25%', borderRightWidth: 1, borderRightColor: '#e5e7eb' },
    colJumlah: { width: '15%', textAlign: 'right' },
    
    totalRow: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
        fontWeight: 'bold',
        minHeight: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1d5db',
        marginTop: -1,
    },
    totalLabel: {
        width: '85%',
        textAlign: 'right',
        paddingRight: 10,
        fontSize: 9,
        fontWeight: 'bold',
    },
    totalValue: {
        width: '15%',
        textAlign: 'right',
        paddingRight: 5,
        fontSize: 9,
        fontWeight: 'bold',
    },
    
    footer: {
        marginTop: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signatureBox: {
        width: 150,
        textAlign: 'center',
    },
    signatureLine: {
        marginTop: 50,
        borderTopWidth: 1,
        borderTopColor: '#000000',
        paddingTop: 5,
    },
    stamp: {
        fontSize: 7,
        color: '#9ca3af',
        textAlign: 'center',
        marginTop: 30,
    }
});

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

interface Props {
    gajiList: any[];
    periode: string;
}

const PayrollBankTransferPdf: React.FC<Props> = ({ gajiList, periode }) => {
    const totalTransfer = gajiList.reduce((sum, g) => sum + (g.total || 0), 0);
    const dateStr = format(new Date(periode), "MMMM yyyy", { locale: id });

    return (
        <Document title={`Summary_Bank_Transfer_${dateStr}`}>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.headerContainer}>
                    <PdfImage style={styles.logo} src="/LogoMd.png" />
                    <View style={styles.companyInfo}>
                        <Text style={{ fontWeight: 'bold', fontSize: 10, marginBottom: 2 }}>PT. RYLIF MIKRO MANDIRI</Text>
                        <Text>Jln. Arjuna RT. 04/RW. 36, Kampung Pulo Resident 1 No. 6</Text>
                        <Text>Sumber Jaya, Bekasi - 17510 | Phone: 0857-7414-8874</Text>
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.title}>SUMMARY PENGAJUAN PEMBAYARAN GAJI</Text>
                <Text style={styles.subtitle}>Periode Penggajian: {dateStr}</Text>

                {/* Table */}
                <View style={styles.table}>
                    {/* Header Row */}
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <View style={styles.colNo}><Text style={{ fontWeight: 'bold' }}>No</Text></View>
                        <View style={styles.colNama}><Text style={{ fontWeight: 'bold' }}>Nama Karyawan</Text></View>
                        <View style={styles.colBank}><Text style={{ fontWeight: 'bold' }}>Bank</Text></View>
                        <View style={styles.colRekening}><Text style={{ fontWeight: 'bold' }}>No. Rekening</Text></View>
                        <View style={styles.colNamaRek}><Text style={{ fontWeight: 'bold' }}>Nama Rekening</Text></View>
                        <View style={styles.colJumlah}><Text style={{ fontWeight: 'bold' }}>Total Bersih</Text></View>
                    </View>

                    {/* Data Rows */}
                    {gajiList.map((g, index) => (
                        <View key={g.id} style={styles.tableRow}>
                            <View style={styles.colNo}><Text>{index + 1}</Text></View>
                            <View style={styles.colNama}><Text>{g.karyawan?.namaLengkap}</Text></View>
                            <View style={styles.colBank}><Text>{g.karyawan?.namaBank || '-'}</Text></View>
                            <View style={styles.colRekening}><Text>{g.karyawan?.nomorRekening || '-'}</Text></View>
                            <View style={styles.colNamaRek}><Text>{g.karyawan?.namaRekening || '-'}</Text></View>
                            <View style={styles.colJumlah}><Text style={{ paddingRight: 5 }}>{formatCurrency(g.total)}</Text></View>
                        </View>
                    ))}
                </View>

                {/* Total Row */}
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>TOTAL KESELURUHAN</Text>
                    <Text style={styles.totalValue}>{formatCurrency(totalTransfer)}</Text>
                </View>

                {/* Footer / Signatures */}
                <View style={styles.footer}>
                    <View style={styles.signatureBox}>
                        <Text>Dibuat Oleh,</Text>
                        <View style={styles.signatureLine} />
                        <Text>Admin HRD / Payroll</Text>
                    </View>
                    
                    <View style={styles.signatureBox}>
                        <Text>Disetujui Oleh,</Text>
                        <View style={styles.signatureLine} />
                        <Text>Manajemen / Direksi</Text>
                    </View>
                </View>

                <Text style={styles.stamp}>
                    Dicetak secara otomatis melalui sistem pada {format(new Date(), "dd/MM/yyyy HH:mm:ss")}
                </Text>
            </Page>
        </Document>
    );
};

export default PayrollBankTransferPdf;
