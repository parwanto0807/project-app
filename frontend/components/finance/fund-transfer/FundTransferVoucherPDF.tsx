import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { FundTransfer } from '@/types/finance/fundTransfer';

// Register Fonts - Gunakan font yang lebih kecil
Font.register({
    family: 'Helvetica',
    src: '',
});

const styles = StyleSheet.create({
    page: {
        padding: 25,
        fontFamily: 'Helvetica',
        fontSize: 8, // Lebih kecil dari sebelumnya
        color: '#1e293b',
        width: '100%',
        height: '14.85cm', // 1/2 A4 height (A4: 29.7cm)
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1.5,
        borderBottomColor: '#6366f1',
        paddingBottom: 12,
        marginBottom: 15,
    },
    titleContainer: {
        flexDirection: 'column',
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#6366f1',
    },
    subtitle: {
        fontSize: 6,
        textTransform: 'uppercase',
        color: '#64748b',
        marginTop: 2,
    },
    headerRight: {
        textAlign: 'right',
        alignItems: 'flex-end',
    },
    label: {
        fontSize: 5.5,
        textTransform: 'uppercase',
        color: '#94a3b8',
        marginBottom: 2,
    },
    value: {
        fontSize: 9,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    infoSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 10,
    },
    infoBox: {
        width: '48%',
    },
    accountBox: {
        backgroundColor: '#f1f5f9',
        padding: 8,
        borderRadius: 4,
        marginBottom: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#6366f1',
    },
    accountLabel: {
        fontSize: 6,
        color: '#64748b',
        marginBottom: 2,
    },
    accountName: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    accountCode: {
        fontSize: 7,
        color: '#475569',
        fontFamily: 'Courier',
    },
    amountSection: {
        backgroundColor: '#f8fafc',
        borderRadius: 6,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    amountRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    amountLabel: {
        fontSize: 9,
        color: '#475569',
    },
    amountValue: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#475569',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 8,
        marginTop: 8,
        borderTopWidth: 2,
        borderTopColor: '#cbd5e1',
    },
    totalLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    totalValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#6366f1',
    },
    notesBox: {
        backgroundColor: '#fff',
        padding: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 4,
        marginBottom: 20,
        borderLeftWidth: 3,
        borderLeftColor: '#94a3b8',
    },
    signatureSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 25,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    signatureBox: {
        width: '30%',
        textAlign: 'center',
    },
    signatureLine: {
        borderTopWidth: 1,
        borderTopColor: '#cbd5e1',
        marginTop: 25,
        marginBottom: 6,
    },
    signatureText: {
        fontSize: 8,
        color: '#64748b',
        marginTop: 4,
    },
    footer: {
        position: 'absolute',
        bottom: 15,
        left: 25,
        right: 25,
        textAlign: 'center',
        fontSize: 6,
        color: '#94a3b8',
        borderTopWidth: 0.5,
        borderTopColor: '#e2e8f0',
        paddingTop: 6,
    },
});

interface Props {
    data: FundTransfer;
}

const FundTransferVoucherPDF = ({ data }: Props) => {
    const formatIDR = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>VOUCHER TRANSFER</Text>
                        <Text style={styles.subtitle}>Bukti Mutasi Kas/Bank Internal</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <Text style={styles.label}>No. Transaksi</Text>
                        <Text style={[styles.value, { color: '#6366f1' }]}>{data.transferNo}</Text>
                        <Text style={styles.label}>Tanggal</Text>
                        <Text style={styles.value}>{format(new Date(data.transferDate), 'dd/MM/yyyy')}</Text>
                    </View>
                </View>

                {/* Account Information */}
                <View style={styles.infoSection}>
                    <View style={styles.infoBox}>
                        <Text style={[styles.label, { marginBottom: 6 }]}>DARI AKUN</Text>
                        <View style={styles.accountBox}>
                            <Text style={styles.accountLabel}>Withdrawal</Text>
                            <Text style={styles.accountName}>{data.fromAccount?.name}</Text>
                            <Text style={styles.accountCode}>{data.fromAccount?.code}</Text>
                        </View>
                    </View>
                    <View style={styles.infoBox}>
                        <Text style={[styles.label, { marginBottom: 6 }]}>KE AKUN</Text>
                        <View style={[styles.accountBox, { borderLeftColor: '#10b981' }]}>
                            <Text style={styles.accountLabel}>Deposit</Text>
                            <Text style={styles.accountName}>{data.toAccount?.name}</Text>
                            <Text style={styles.accountCode}>{data.toAccount?.code}</Text>
                        </View>
                    </View>
                </View>

                {/* Reference */}
                {data.referenceNo && (
                    <View style={{ marginBottom: 15 }}>
                        <Text style={styles.label}>Referensi</Text>
                        <Text style={[styles.value, { fontSize: 8, color: '#475569' }]}>{data.referenceNo}</Text>
                    </View>
                )}

                {/* Amount Details */}
                <View style={styles.amountSection}>
                    <View style={styles.amountRow}>
                        <Text style={styles.amountLabel}>Nominal Transfer</Text>
                        <Text style={styles.amountValue}>{formatIDR(Number(data.amount))}</Text>
                    </View>

                    {Number(data.feeAmount) > 0 && (
                        <View style={styles.amountRow}>
                            <Text style={styles.amountLabel}>Biaya Admin</Text>
                            <Text style={styles.amountValue}>{formatIDR(Number(data.feeAmount))}</Text>
                        </View>
                    )}

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>TOTAL MUTASI</Text>
                        <Text style={styles.totalValue}>{formatIDR(Number(data.totalAmount))}</Text>
                    </View>
                </View>

                {/* Notes */}
                {data.notes && (
                    <View style={styles.notesBox}>
                        <Text style={styles.label}>KETERANGAN</Text>
                        <Text style={{ fontSize: 8, lineHeight: 1.3, marginTop: 4 }}>{data.notes}</Text>
                    </View>
                )}

                {/* Signatures */}
                <View style={styles.signatureSection}>
                    <View style={styles.signatureBox}>
                        <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{data.createdBy?.name || 'Admin'}</Text>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureText}>Disiapkan Oleh</Text>
                    </View>

                    <View style={styles.signatureBox}>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureText}>Penerima / Checker</Text>
                    </View>

                    <View style={styles.signatureBox}>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureText}>Disetujui Oleh</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>Dokumen ini dicetak secara elektronik - Valid tanpa tanda tangan basah</Text>
                </View>
            </Page>
        </Document>
    );
};

export default FundTransferVoucherPDF;