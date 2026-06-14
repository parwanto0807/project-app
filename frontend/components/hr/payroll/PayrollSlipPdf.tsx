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
        width: 60,
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
        backgroundColor: '#f0fdf4',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#bbf7d0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    grandTotalLabel: {
        fontSize: 8,
        color: '#166534',
        fontWeight: 'bold',
    },
    grandTotalValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#15803d',
    },
    footer: {
        marginTop: 20,
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

interface PayrollSlipPdfProps {
    gaji: any;
}

const PayrollSlipPdf: React.FC<PayrollSlipPdfProps> = ({ gaji }) => {
    const totalPotongan = 
        (gaji.potongan || 0) + 
        (gaji.pajak || 0) + 
        (gaji.potonganPinjaman || 0) + 
        (gaji.potonganKasbon || 0) + 
        (gaji.potonganDpGaji || 0) +
        (gaji.potonganTerlambat || 0);

    const totalPendapatan = 
        (gaji.gajiPokok || 0) + 
        (gaji.tunjangan || 0) + 
        (gaji.upahLembur || 0);

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
                <Text style={styles.title}>SLIP GAJI KARYAWAN</Text>

                {/* Employee Info */}
                <View style={styles.infoGrid}>
                    <View style={styles.infoColumn}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Nama</Text>
                            <Text style={styles.infoValue}>: {gaji.karyawan?.namaLengkap}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>NIK</Text>
                            <Text style={styles.infoValue}>: {gaji.karyawan?.nik}</Text>
                        </View>
                    </View>
                    <View style={styles.infoColumn}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Jabatan</Text>
                            <Text style={styles.infoValue}>: {gaji.karyawan?.jabatan}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Periode</Text>
                            <Text style={styles.infoValue}>: {format(new Date(gaji.periode), "MMMM yyyy", { locale: id })}</Text>
                        </View>
                    </View>
                </View>

                {/* Main Content: 2 Columns */}
                <View style={styles.mainContent}>
                    {/* Earnings */}
                    <View style={styles.contentColumn}>
                        <Text style={styles.sectionTitle}>PENDAPATAN</Text>
                        <View style={styles.row}>
                            <Text>Gaji Pokok / Kerja</Text>
                            <Text>{formatCurrency(gaji.gajiPokok)}</Text>
                        </View>
                        {gaji.tunjanganJabatan > 0 && (
                            <View style={styles.row}>
                                <Text>Tunjangan Jabatan</Text>
                                <Text>{formatCurrency(gaji.tunjanganJabatan)}</Text>
                            </View>
                        )}
                        {gaji.tunjanganKeluarga > 0 && (
                            <View style={styles.row}>
                                <Text>Tunjangan Keluarga</Text>
                                <Text>{formatCurrency(gaji.tunjanganKeluarga)}</Text>
                            </View>
                        )}
                        {gaji.tunjanganMakan > 0 && (
                            <View style={styles.row}>
                                <Text>Tunjangan Makan</Text>
                                <Text>{formatCurrency(gaji.tunjanganMakan)}</Text>
                            </View>
                        )}
                        {gaji.tunjanganTransport > 0 && (
                            <View style={styles.row}>
                                <Text>Tunjangan Transport</Text>
                                <Text>{formatCurrency(gaji.tunjanganTransport)}</Text>
                            </View>
                        )}
                        {gaji.tunjanganKehadiran > 0 && (
                            <View style={styles.row}>
                                <Text>
                                  Premi Hadir 
                                  {gaji.karyawan?.tunjanganKehadiran ? ` (${Math.round(gaji.tunjanganKehadiran / gaji.karyawan.tunjanganKehadiran)} hari)` : ''}
                                </Text>
                                <Text>{formatCurrency(gaji.tunjanganKehadiran)}</Text>
                            </View>
                        )}
                        {gaji.tunjanganShift > 0 && (
                            <View style={styles.row}>
                                <Text>Tunjangan Shift</Text>
                                <Text>{formatCurrency(gaji.tunjanganShift)}</Text>
                            </View>
                        )}
                        {gaji.tunjangan > ((gaji.tunjanganJabatan||0) + (gaji.tunjanganKeluarga||0) + (gaji.tunjanganMakan||0) + (gaji.tunjanganTransport||0) + (gaji.tunjanganKehadiran||0) + (gaji.tunjanganShift||0)) && (
                            <View style={styles.row}>
                                <Text>Tunjangan Lainnya</Text>
                                <Text>{formatCurrency(gaji.tunjangan - ((gaji.tunjanganJabatan||0) + (gaji.tunjanganKeluarga||0) + (gaji.tunjanganMakan||0) + (gaji.tunjanganTransport||0) + (gaji.tunjanganKehadiran||0) + (gaji.tunjanganShift||0)))}</Text>
                            </View>
                        )}
                        {gaji.upahLembur > 0 && (
                            <View style={styles.row}>
                                <Text>Upah Lembur ({gaji.totalJamLembur} jam)</Text>
                                <Text>{formatCurrency(gaji.upahLembur)}</Text>
                            </View>
                        )}
                        <View style={styles.totalRow}>
                            <Text>Total Pendapatan</Text>
                            <Text>{formatCurrency(totalPendapatan)}</Text>
                        </View>
                    </View>

                    {/* Deductions */}
                    <View style={styles.contentColumn}>
                        <Text style={styles.sectionTitle}>POTONGAN</Text>
                        {gaji.potongan > 0 && (
                            <View style={styles.row}>
                                <Text>Potongan Lain</Text>
                                <Text>-{formatCurrency(gaji.potongan)}</Text>
                            </View>
                        )}
                        {gaji.potonganPinjaman > 0 && (
                            <View style={styles.row}>
                                <Text>Pinjaman</Text>
                                <Text>-{formatCurrency(gaji.potonganPinjaman)}</Text>
                            </View>
                        )}
                        {gaji.potonganKasbon > 0 && (
                            <View style={styles.row}>
                                <Text>Kasbon</Text>
                                <Text>-{formatCurrency(gaji.potonganKasbon)}</Text>
                            </View>
                        )}
                        {gaji.potonganDpGaji > 0 && (
                            <View style={styles.row}>
                                <Text>DP Gaji</Text>
                                <Text>-{formatCurrency(gaji.potonganDpGaji)}</Text>
                            </View>
                        )}
                        {gaji.potonganTerlambat > 0 && (
                            <View style={styles.row}>
                                <Text>Keterlambatan</Text>
                                <Text>-{formatCurrency(gaji.potonganTerlambat)}</Text>
                            </View>
                        )}
                        <View style={styles.totalRow}>
                            <Text>Total Potongan</Text>
                            <Text>-{formatCurrency(totalPotongan)}</Text>
                        </View>
                    </View>
                </View>

                {/* Net Pay */}
                <View style={styles.grandTotalContainer}>
                    <Text style={styles.grandTotalLabel}>GAJI BERSIH DITERIMA (TAKE HOME PAY)</Text>
                    <Text style={styles.grandTotalValue}>{formatCurrency(gaji.total)}</Text>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={styles.signatureBox}>
                        <Text>Penerima,</Text>
                        <View style={styles.signatureLine} />
                        <Text>{gaji.karyawan?.namaLengkap}</Text>
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
};

export default PayrollSlipPdf;
