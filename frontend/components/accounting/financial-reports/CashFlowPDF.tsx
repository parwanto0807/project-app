import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image,
} from '@react-pdf/renderer';
import { formatCurrency } from '@/lib/utils';

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: '#1e293b',
    },
    header: {
        flexDirection: 'row',
        borderBottom: 2,
        borderBottomColor: '#0891b2',
        paddingBottom: 20,
        marginBottom: 20,
    },
    companyInfo: {
        flex: 1,
    },
    companyName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0891b2',
        marginBottom: 4,
    },
    companyDetail: {
        fontSize: 9,
        color: '#64748b',
        marginBottom: 2,
    },
    titleContainer: {
        textAlign: 'center',
        marginBottom: 25,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 10,
        fontStyle: 'italic',
        color: '#64748b',
        marginTop: 2,
    },
    period: {
        fontSize: 11,
        marginTop: 5,
        color: '#334155',
    },
    section: {
        marginBottom: 15,
    },
    sectionHeader: {
        backgroundColor: '#f8fafc',
        padding: 6,
        fontWeight: 'bold',
        fontSize: 11,
        borderBottom: 1,
        borderBottomColor: '#cbd5e1',
        marginBottom: 5,
    },
    subHeader: {
        fontSize: 9,
        fontWeight: 'bold',
        paddingLeft: 10,
        paddingVertical: 4,
        color: '#475569',
        fontStyle: 'italic',
    },
    row: {
        flexDirection: 'row',
        paddingVertical: 3,
        paddingHorizontal: 20,
        borderBottomWidth: 0.5,
        borderBottomColor: '#e2e8f0',
    },
    colCode: { width: '20%', fontSize: 8, color: '#64748b' },
    colName: { width: '55%' },
    colAmount: { width: '25%', textAlign: 'right' },
    netRow: {
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: '#f1f5f9',
        fontWeight: 'bold',
        marginTop: 5,
        borderTop: 1,
        borderTopColor: '#cbd5e1',
    },
    summarySection: {
        marginTop: 20,
        borderTop: 2,
        borderTopColor: '#1e293b',
    },
    summaryRow: {
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    finalRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 10,
        backgroundColor: '#0891b2',
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
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
    signatureContainer: {
        marginTop: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 40,
    },
    signatureBox: {
        width: 150,
        textAlign: 'center',
    },
    signatureLine: {
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        marginTop: 60,
        marginBottom: 5,
    }
});

interface AccountData {
    code: string;
    name: string;
    amount: number;
}

interface ActivitySection {
    accounts: AccountData[];
    total: number;
}

interface OperatingSection {
    in: ActivitySection;
    out: ActivitySection;
    net: number;
    total: number;
}

export interface CashFlowData {
    operating: OperatingSection;
    investing: ActivitySection;
    financing: ActivitySection;
    beginningBalance: number;
    netChange: number;
    endingBalance: number;
}

interface CashFlowPDFProps {
    data: CashFlowData;
    period: { startDate: string; endDate: string };
    logoSrc?: string;
}

const CashFlowPDF = ({ data, period, logoSrc }: CashFlowPDFProps) => {
    const formatDate = (date: string) => new Date(date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const renderAccounts = (accounts: AccountData[]) => {
        if (accounts.length === 0) return (
            <View style={styles.row}>
                <Text style={{ width: '100%', textAlign: 'center', color: '#94a3b8', fontSize: 8, fontStyle: 'italic', paddingVertical: 10 }}>
                    Tidak ada transaksi untuk kategori ini
                </Text>
            </View>
        );
        return accounts.map((acc, i) => {
            const isOutflow = acc.amount < 0;
            return (
                <View key={i} style={styles.row}>
                    <Text style={styles.colCode}>{acc.code}</Text>
                    <Text style={styles.colName}>{acc.name}</Text>
                    <Text style={[styles.colAmount, isOutflow ? { color: '#b91c1c' } : { color: '#047857' }]}>
                        {isOutflow ? `(${formatCurrency(Math.abs(acc.amount))})` : formatCurrency(acc.amount)}
                    </Text>
                </View>
            );
        });
    };

    return (
        <Document title={`Cash Flow ${period.startDate} - ${period.endDate}`}>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>PT. RYLIF MIKRO MANDIRI</Text>
                        <Text style={styles.companyDetail}>Jln. Arjuna RT. 04/RW. 36, Kampung Pulo Resident 1 No. 6</Text>
                        <Text style={styles.companyDetail}>Bekasi, Indonesia | Phone: 0857-7414-8874</Text>
                    </View>
                    {logoSrc && <Image src={logoSrc} style={{ width: 60, height: 60 }} />}
                </View>

                {/* Title */}
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>LAPORAN ARUS KAS (CASH FLOW)</Text>
                    <Text style={styles.subtitle}>Metode Langsung (Direct Method)</Text>
                    <Text style={styles.period}>{formatDate(period.startDate)} - {formatDate(period.endDate)}</Text>
                </View>

                {/* 1. OPERATING */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>ARUS KAS DARI AKTIVITAS OPERASI</Text>

                    <Text style={styles.subHeader}>Penerimaan Kas (Inflows)</Text>
                    {renderAccounts(data.operating.in.accounts)}
                    <View style={styles.row}>
                        <Text style={{ flex: 1, fontSize: 9, fontStyle: 'italic', color: '#64748b', paddingLeft: 10 }}>Sub-total Penerimaan Operasi</Text>
                        <Text style={[styles.colAmount, { color: '#64748b' }]}>{formatCurrency(data.operating.in.total)}</Text>
                    </View>

                    <Text style={styles.subHeader}>Pengeluaran Kas (Outflows)</Text>
                    {renderAccounts(data.operating.out.accounts)}
                    <View style={styles.row}>
                        <Text style={{ flex: 1, fontSize: 9, fontStyle: 'italic', color: '#64748b', paddingLeft: 10 }}>Sub-total Pengeluaran Operasi</Text>
                        <Text style={[styles.colAmount, { color: '#64748b' }]}>
                            {data.operating.out.total < 0 ? `(${formatCurrency(Math.abs(data.operating.out.total))})` : formatCurrency(data.operating.out.total)}
                        </Text>
                    </View>

                    <View style={styles.netRow}>
                        <Text style={{ flex: 1 }}>Arus Kas Bersih dari Aktivitas Operasi</Text>
                        <Text style={[styles.colAmount, { fontWeight: 'bold' }]}>
                            {data.operating.net < 0 ? `(${formatCurrency(Math.abs(data.operating.net))})` : formatCurrency(data.operating.net)}
                        </Text>
                    </View>
                </View>

                {/* 2. INVESTING */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>ARUS KAS DARI AKTIVITAS INVESTASI</Text>
                    {renderAccounts(data.investing.accounts)}
                    <View style={styles.netRow}>
                        <Text style={{ flex: 1 }}>Arus Kas Bersih dari Aktivitas Investasi</Text>
                        <Text style={[styles.colAmount, { fontWeight: 'bold' }]}>
                            {data.investing.total < 0 ? `(${formatCurrency(Math.abs(data.investing.total))})` : formatCurrency(data.investing.total)}
                        </Text>
                    </View>
                </View>

                {/* 3. FINANCING */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>ARUS KAS DARI AKTIVITAS PENDANAAN</Text>
                    {renderAccounts(data.financing.accounts)}
                    <View style={styles.netRow}>
                        <Text style={{ flex: 1 }}>Arus Kas Bersih dari Aktivitas Pendanaan</Text>
                        <Text style={[styles.colAmount, { fontWeight: 'bold' }]}>
                            {data.financing.total < 0 ? `(${formatCurrency(Math.abs(data.financing.total))})` : formatCurrency(data.financing.total)}
                        </Text>
                    </View>
                </View>

                {/* SUMMARY */}
                <View style={styles.summarySection}>
                    <View style={styles.summaryRow}>
                        <Text style={{ flex: 1, fontWeight: 'bold' }}>Kenaikan/(Penurunan) Kas & Setara Kas</Text>
                        <Text style={[styles.colAmount, { fontWeight: 'bold' }]}>
                            {data.netChange < 0 ? `(${formatCurrency(Math.abs(data.netChange))})` : formatCurrency(data.netChange)}
                        </Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={{ flex: 1 }}>Saldo Awal Kas & Setara Kas</Text>
                        <Text style={styles.colAmount}>{formatCurrency(data.beginningBalance)}</Text>
                    </View>
                    <View style={styles.finalRow}>
                        <Text style={{ flex: 1 }}>SALDO AKHIR KAS & SETARA KAS</Text>
                        <Text style={styles.colAmount}>{formatCurrency(data.endingBalance)}</Text>
                    </View>
                </View>

                {/* Signature */}
                <View style={styles.signatureContainer}>
                    <View style={styles.signatureBox}>
                        <Text>Disiapkan Oleh,</Text>
                        <View style={styles.signatureLine} />
                        <Text>Keuangan</Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <Text>Menyetujui,</Text>
                        <View style={styles.signatureLine} />
                        <Text>Direktur</Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text>Dihasilkan secara otomatis oleh Sistem ERP pada {new Date().toLocaleString('id-ID')}</Text>
                </View>
            </Page>
        </Document>
    );
};

export default CashFlowPDF;
