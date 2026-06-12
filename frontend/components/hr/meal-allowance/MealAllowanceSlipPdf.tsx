import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image as PdfImage } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

// Create styles
const styles = StyleSheet.create({
    page: {
        padding: 15,
        fontFamily: 'Helvetica',
        fontSize: 8,
        lineHeight: 1.3,
        backgroundColor: '#FFFFFF',
        position: 'relative',
    },
    watermarkContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
        opacity: 0.04,
        flexDirection: 'row',
        flexWrap: 'wrap',
        overflow: 'hidden',
        justifyContent: 'center',
        alignContent: 'center',
    },
    watermarkText: {
        fontSize: 8.5,
        fontWeight: 'bold',
        color: '#000000',
        marginRight: 10,
        marginBottom: 10,
        textAlign: 'center',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
        borderBottomWidth: 1.5,
        borderBottomColor: '#000000',
        paddingBottom: 6,
    },
    logo: {
        width: 70,
        height: 30,
    },
    companyInfo: {
        flex: 1,
        textAlign: 'right',
        fontSize: 6,
    },
    title: {
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
        textDecoration: 'underline',
    },
    infoGrid: {
        flexDirection: 'row',
        marginBottom: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: '#e5e7eb',
        paddingBottom: 6,
    },
    infoColumn: {
        flex: 1,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 2,
    },
    infoLabel: {
        width: 75,
        fontWeight: 'bold',
    },
    infoValue: {
        flex: 1,
    },
    mainContent: {
        flexDirection: 'row',
        gap: 20,
    },
    contentColumn: {
        flex: 1,
        marginBottom: 5,
    },
    sectionTitle: {
        fontSize: 8,
        fontWeight: 'bold',
        backgroundColor: '#f3f4f6',
        padding: 2,
        marginBottom: 3,
        borderRadius: 2,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 2,
        borderBottomWidth: 0.5,
        borderBottomColor: '#f3f4f6',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
        marginTop: 2,
        fontWeight: 'bold',
        borderTopWidth: 1,
        borderTopColor: '#000000',
    },
    grandTotalContainer: {
        marginTop: 6,
        padding: 4,
        backgroundColor: '#fff7ed',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#fed7aa',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    grandTotalLabel: {
        fontSize: 8,
        color: '#9a3412',
        fontWeight: 'bold',
    },
    grandTotalValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#c2410c',
    },
    footer: {
        marginTop: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signatureBox: {
        width: 120,
        textAlign: 'center',
    },
    signatureLine: {
        marginTop: 50,
        borderTopWidth: 1,
        borderTopColor: '#000000',
        paddingTop: 2,
    }
});

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

export default function MealAllowanceSlipPdf({ data }: { data: any }) {
    return (
        <Document>
            <Page size="A4" orientation="portrait" style={styles.page}>
                {/* Watermark */}
                <View style={styles.watermarkContainer} fixed>
                    {Array.from({ length: 400 }).map((_, i) => (
                        <Text key={i} style={styles.watermarkText}>PT. RYLIF MIKRO MANDIRI</Text>
                    ))}
                </View>

                {/* Header */}
                <View style={styles.headerContainer}>
                    <PdfImage style={styles.logo} src="/LogoMd.png" />
                    <View style={styles.companyInfo}>
                        <Text style={{ fontWeight: 'bold', fontSize: 8, marginBottom: 1 }}>PT. RYLIF MIKRO MANDIRI</Text>
                        <Text>Jln. Arjuna RT. 04/RW. 36, Kampung Pulo Resident 1 No. 6</Text>
                        <Text>Sumber Jaya, Bekasi - 17510 | Phone: 0857-7414-8874</Text>
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.title}>SLIP UANG MAKAN</Text>

                {/* Employee Info */}
                <View style={styles.infoGrid}>
                    <View style={styles.infoColumn}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Nama</Text>
                            <Text style={styles.infoValue}>: {data.karyawan?.namaLengkap}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>NIK</Text>
                            <Text style={styles.infoValue}>: {data.karyawan?.nik}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Jabatan</Text>
                            <Text style={styles.infoValue}>: {data.karyawan?.jabatan}</Text>
                        </View>
                    </View>
                    <View style={styles.infoColumn}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Periode Absen</Text>
                            <Text style={styles.infoValue}>
                                : {format(new Date(data.cutOffStart), "dd MMM yyyy", { locale: id })} - {format(new Date(data.cutOffEnd), "dd MMM yyyy", { locale: id })}
                            </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Siklus</Text>
                            <Text style={styles.infoValue}>: Siklus {data.siklus}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Bulan / Tahun</Text>
                            <Text style={styles.infoValue}>: {data.periodeBulan}</Text>
                        </View>
                    </View>
                </View>

                {/* Main Content: 2 Columns */}
                <View style={styles.mainContent}>
                    {/* Kehadiran */}
                    <View style={styles.contentColumn}>
                        <Text style={styles.sectionTitle}>RINCIAN KEHADIRAN</Text>
                        <View style={styles.row}>
                            <Text>Total Hari Hadir ({'>'}4 Jam)</Text>
                            <Text>{data.totalHariHadir} Hari</Text>
                        </View>
                        <View style={styles.row}>
                            <Text>Total Jam Lembur ({'>'}3 Jam)</Text>
                            <Text>{data.totalJamLembur} Jam</Text>
                        </View>
                    </View>

                    {/* Pendapatan */}
                    <View style={styles.contentColumn}>
                        <Text style={styles.sectionTitle}>RINCIAN UANG MAKAN</Text>
                        <View style={styles.row}>
                            <Text>Uang Makan Harian ({data.totalHariHadir} Kali)</Text>
                            <Text>{formatCurrency(data.nominalUangMakan)}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text>Uang Makan Lembur ({data.nominalUangMakanLembur > 0 ? Math.round(data.nominalUangMakanLembur / (data.karyawan?.uangMakanLembur || 30000)) : 0} Kali)</Text>
                            <Text>{formatCurrency(data.nominalUangMakanLembur)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text>Total Pendapatan</Text>
                            <Text>{formatCurrency(data.totalPencairan)}</Text>
                        </View>
                    </View>
                </View>

                {/* Net Pay */}
                <View style={styles.grandTotalContainer}>
                    <Text style={styles.grandTotalLabel}>TOTAL DITERIMA (TAKE HOME PAY)</Text>
                    <Text style={styles.grandTotalValue}>{formatCurrency(data.totalPencairan)}</Text>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={styles.signatureBox}>
                        <Text>Penerima,</Text>
                        <View style={styles.signatureLine} />
                        <Text>{data.karyawan?.namaLengkap}</Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <Text>Personalia / HRD,</Text>
                        <View style={styles.signatureLine} />
                    </View>
                </View>

                <Text style={{ marginTop: 10, fontSize: 6, color: '#9ca3af', textAlign: 'center' }}>
                    Dokumen ini dihasilkan secara otomatis oleh sistem pada {format(new Date(), "dd/MM/yyyy HH:mm")}
                </Text>
            </Page>
        </Document>
    );
}
