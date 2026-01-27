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
import { formatDate } from "@/lib/utils";

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        padding: 30,
        fontSize: 10,
        color: '#1e293b',
        orientation: 'landscape',
    },
    headerContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#2563eb',
        paddingBottom: 10,
        alignItems: 'center',
    },
    companyInfo: {
        flex: 1,
    },
    companyName: {
        color: '#2563eb',
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 2,
    },
    companyAddress: {
        fontSize: 8,
        color: '#64748b',
    },
    titleContainer: {
        textAlign: 'right',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 9,
        color: '#64748b',
    },
    table: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderBottomWidth: 1,
        borderBottomColor: '#cbd5e1',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingVertical: 6,
        paddingHorizontal: 4,
    },
    colNo: { width: '12%' },
    colDate: { width: '12%' },
    colCategory: { width: '20%' },
    colDesc: { width: '30%' },
    colAmount: { width: '15%', textAlign: 'right' },
    colStatus: { width: '11%', textAlign: 'center' },

    headerCell: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#475569',
    },
    cell: {
        fontSize: 9,
        color: '#334155',
    },
    bold: { fontWeight: 'bold' },

    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    summaryBox: {
        width: '30%',
        backgroundColor: '#f8fafc',
        padding: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 4,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    summaryLabel: { fontSize: 9, color: '#64748b' },
    summaryValue: { fontSize: 9, fontWeight: 'bold' },

    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        fontSize: 8,
        color: '#94a3b8',
        textAlign: 'center',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 10,
    }
});

interface Props {
    data: OperationalExpense[];
    period?: string;
}

const OperationalExpenseListPDF: React.FC<Props> = ({ data, period = "Semua Periode" }) => {

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount).replace("Rp", "Rp.");
    };

    const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
    const approvedCount = data.filter(item => item.status === 'APPROVED').length;

    return (
        <Document title="Laporan Pengeluaran Operasional">
            <Page size="A4" orientation="landscape" style={styles.page}>
                {/* Header */}
                <View style={styles.headerContainer}>
                    <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>PT. RYLIF MIKRO MANDIRI</Text>
                        <Text style={styles.companyAddress}>ERP System Report</Text>
                    </View>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>Laporan Pengeluaran Operasional</Text>
                        <Text style={styles.subtitle}>Periode: {period}</Text>
                    </View>
                </View>

                {/* Table */}
                <View style={styles.table}>
                    {/* Header Row */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.headerCell, styles.colNo]}>NOMOR OPEX</Text>
                        <Text style={[styles.headerCell, styles.colDate]}>TANGGAL</Text>
                        <Text style={[styles.headerCell, styles.colCategory]}>KATEGORI</Text>
                        <Text style={[styles.headerCell, styles.colDesc]}>DESKRIPSI</Text>
                        <Text style={[styles.headerCell, styles.colAmount]}>NOMINAL</Text>
                        <Text style={[styles.headerCell, styles.colStatus]}>STATUS</Text>
                    </View>

                    {/* Data Rows */}
                    {data.map((item, index) => (
                        <View key={item.id} style={[styles.tableRow, index % 2 === 1 ? { backgroundColor: '#fdfdfd' } : {}]}>
                            <Text style={[styles.cell, styles.colNo]}>{item.expenseNumber}</Text>
                            <Text style={[styles.cell, styles.colDate]}>{formatDate(item.date)}</Text>
                            <Text style={[styles.cell, styles.colCategory]}>
                                {item.expenseAccount.code} - {item.expenseAccount.name}
                            </Text>
                            <Text style={[styles.cell, styles.colDesc]}>
                                {item.description.length > 50 ? item.description.substring(0, 50) + '...' : item.description}
                            </Text>
                            <Text style={[styles.cell, styles.colAmount, styles.bold]}>
                                {formatCurrency(item.amount)}
                            </Text>
                            <Text style={[styles.cell, styles.colStatus, {
                                color: item.status === 'APPROVED' ? '#059669' :
                                    item.status === 'REJECTED' ? '#e11d48' : '#475569'
                            }]}>
                                {item.status}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Summary */}
                <View style={styles.summaryContainer}>
                    <View style={styles.summaryBox}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Total Transaksi</Text>
                            <Text style={styles.summaryValue}>{data.length} Transaksi</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Total Disetujui</Text>
                            <Text style={styles.summaryValue}>{approvedCount} Transaksi</Text>
                        </View>
                        <View style={{ ...styles.summaryRow, marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#e2e8f0' }}>
                            <Text style={{ ...styles.summaryLabel, color: '#1e293b', fontWeight: 'bold' }}>Total Nominal</Text>
                            <Text style={{ ...styles.summaryValue, fontSize: 11, color: '#2563eb' }}>{formatCurrency(totalAmount)}</Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>Dicetak pada {new Date().toLocaleString('id-ID')} • Halaman 1</Text>
                </View>
            </Page>
        </Document>
    );
};

export default OperationalExpenseListPDF;
