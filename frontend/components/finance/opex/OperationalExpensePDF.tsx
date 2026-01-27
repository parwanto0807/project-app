import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image,
} from '@react-pdf/renderer';
import { OperationalExpense } from "@/types/finance/operationalExpense";
import { formatCurrencyNumber, formatDate } from "@/lib/utils"; // We might need to duplicate formatting logic if utils can't be imported in PDF renderer context sometimes, but let's try importing first.

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        padding: 40,
        fontSize: 10,
        color: '#1e293b',
    },
    headerContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#2563eb', // Blue for Opex
        paddingBottom: 10,
        alignItems: 'flex-start',
    },
    logo: {
        width: 60,
        height: 60,
        marginRight: 15,
        objectFit: 'contain',
    },
    companyInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    companyName: {
        color: '#2563eb',
        fontWeight: 'bold',
        fontSize: 12,
        marginBottom: 2,
    },
    companyAddress: {
        fontSize: 8,
        lineHeight: 1.4,
        color: '#64748b',
    },
    titleContainer: {
        marginBottom: 20,
        textAlign: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        textTransform: 'uppercase',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 10,
        color: '#64748b',
    },
    gridContainer: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    colHalf: {
        width: '50%',
        paddingRight: 10,
    },
    label: {
        fontSize: 8,
        color: '#64748b',
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    value: {
        fontSize: 10,
        fontWeight: 'medium',
        color: '#1e293b',
        marginBottom: 8,
    },
    amountBox: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#eff6ff', // Light blue
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#bfdbfe',
        alignItems: 'center',
        marginBottom: 20,
    },
    amountLabel: {
        fontSize: 10,
        color: '#2563eb',
        fontWeight: 'bold',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    amountValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e40af',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 5,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 8,
        color: '#94a3b8',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 10,
    },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 12,
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 5,
        alignSelf: 'flex-start',
    },
    imageContainer: {
        marginTop: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 10,
    },
    receiptImage: {
        maxWidth: '100%',
        maxHeight: 300,
        objectFit: 'contain',
    },
});

interface Props {
    data: OperationalExpense;
}

const OperationalExpensePDF: React.FC<Props> = ({ data }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount).replace("Rp", "Rp.");
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return '#10b981'; // green
            case 'REJECTED': return '#f43f5e'; // rose
            case 'CANCELLED': return '#f59e0b'; // amber
            default: return '#64748b'; // slate
        }
    };

    const getStatusBg = (status: string) => {
        switch (status) {
            case 'APPROVED': return '#ecfdf5';
            case 'REJECTED': return '#fff1f2';
            case 'CANCELLED': return '#fffbeb';
            default: return '#f1f5f9';
        }
    };

    return (
        <Document title={`Opex-${data.expenseNumber}`}>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.headerContainer}>
                    {/* Placeholder for Logo - You can add logic to pass logoSrc if needed */}
                    <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>PT. RYLIF MIKRO MANDIRI</Text>
                        <Text style={styles.companyAddress}>Jln. Arjuna RT. 04/RW. 36, Kampung Pulo Resident 1 No. 6</Text>
                        <Text style={styles.companyAddress}>Bekasi - 17510, Indonesia</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.title}>VOUCHER PENGELUARAN</Text>
                        <Text style={{ fontSize: 10, color: getStatusColor(data.status) }}>
                            {data.status}
                        </Text>
                    </View>
                </View>

                {/* Main Content Info */}
                <View style={styles.gridContainer}>
                    <View style={styles.colHalf}>
                        <Text style={styles.label}>NOMOR TRANSAKSI</Text>
                        <Text style={styles.value}>{data.expenseNumber}</Text>

                        <Text style={styles.label}>TANGGAL</Text>
                        <Text style={styles.value}>{formatDate(data.date)}</Text>
                    </View>
                    <View style={styles.colHalf}>
                        <Text style={styles.label}>KATEGORI AKUN</Text>
                        <Text style={styles.value}>{data.expenseAccount?.code} - {data.expenseAccount?.name}</Text>

                        {data.paidFromAccount && (
                            <>
                                <Text style={styles.label}>DIBAYAR DARI</Text>
                                <Text style={styles.value}>{data.paidFromAccount.code} - {data.paidFromAccount.name}</Text>
                            </>
                        )}
                    </View>
                </View>

                {/* Amount Box */}
                <View style={styles.amountBox}>
                    <Text style={styles.amountLabel}>TOTAL NOMINAL DISETUJUI</Text>
                    <Text style={styles.amountValue}>{formatCurrency(data.amount)}</Text>
                </View>

                {/* Description */}
                <View style={{ marginBottom: 20 }}>
                    <Text style={styles.label}>DESKRIPSI / KETERANGAN</Text>
                    <Text style={{ ...styles.value, lineHeight: 1.5, borderLeftWidth: 2, borderLeftColor: '#cbd5e1', paddingLeft: 8 }}>
                        {data.description}
                    </Text>
                </View>

                {/* Signatures */}
                <View style={{ flexDirection: 'row', marginTop: 40, justifyContent: 'space-between', paddingHorizontal: 20 }}>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 8, marginBottom: 40 }}>Dibuat Oleh,</Text>
                        <View style={{ width: 100, borderBottomWidth: 1, borderBottomColor: '#000', marginBottom: 5 }} />
                        <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{data.createdBy?.name || 'Staff'}</Text>
                    </View>

                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 8, marginBottom: 40 }}>Disetujui Oleh,</Text>
                        <View style={{ width: 100, borderBottomWidth: 1, borderBottomColor: '#000', marginBottom: 5 }} />
                        <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{data.approvedBy?.name || '(...................)'}</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>Dicetak pada {new Date().toLocaleString('id-ID')} • Sistem ERP Internal</Text>
                </View>
            </Page>
        </Document>
    );
};

export default OperationalExpensePDF;
