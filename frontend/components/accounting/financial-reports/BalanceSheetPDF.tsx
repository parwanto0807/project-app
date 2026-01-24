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
        fontFamily: 'Helvetica',
        padding: 30,
        fontSize: 10,
        color: '#1e293b',
    },
    headerContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#008000',
        paddingBottom: 15,
        alignItems: 'flex-start',
    },
    logo: {
        width: 80,
        height: 80,
        marginRight: 20,
        objectFit: 'contain',
        marginTop: -30,
    },
    companyInfo: {
        flex: 1,
        justifyContent: 'flex-start',
    },
    companyName: {
        color: '#008000',
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 4,
    },
    companyAddress: {
        fontSize: 9,
        lineHeight: 1.3,
        marginBottom: 2,
    },
    companyContact: {
        fontSize: 9,
        lineHeight: 1.3,
        marginTop: 4,
    },
    titleContainer: {
        marginBottom: 20,
        textAlign: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#1e293b',
    },
    period: {
        fontSize: 11,
        color: '#64748b',
        marginBottom: 15,
    },
    tableHeader: {
        backgroundColor: '#f1f5f9',
        flexDirection: 'row',
        borderBottomWidth: 2,
        borderBottomColor: '#cbd5e1',
        fontWeight: 'bold',
        minHeight: 25,
        alignItems: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        minHeight: 24,
        alignItems: 'center',
    },
    tableCell: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        fontSize: 9,
    },
    codeCell: { width: '15%', fontFamily: 'Helvetica-Bold' },
    nameCell: { width: '55%' },
    amountCell: { width: '30%', textAlign: 'right' },
    sectionHeader: {
        backgroundColor: '#f8fafc',
        fontWeight: 'bold',
        fontSize: 10,
        color: '#334155',
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#cbd5e1',
        marginTop: 10,
    },
    subCategoryHeader: {
        backgroundColor: '#f1f5f9',
        fontSize: 9,
        fontStyle: 'italic',
        paddingVertical: 4,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    subtotalRow: {
        backgroundColor: '#f8fafc',
        fontWeight: 'bold',
        borderTopWidth: 1,
        borderTopColor: '#cbd5e1',
        flexDirection: 'row',
        minHeight: 25,
        alignItems: 'center',
    },
    mainTotalRow: {
        backgroundColor: '#3b82f6',
        color: 'white',
        fontWeight: 'bold',
        fontSize: 11,
        flexDirection: 'row',
        minHeight: 30,
        alignItems: 'center',
        marginTop: 5,
    },
    validationRow: {
        marginTop: 10,
        flexDirection: 'row',
        minHeight: 25,
        alignItems: 'center',
        borderTopWidth: 2,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 8,
        color: '#94a3b8',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 10,
    },
    signatureContainer: {
        marginTop: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 50,
    },
    signatureBox: {
        alignItems: 'center',
        width: '40%',
    },
    signatureLine: {
        width: '100%',
        height: 1,
        backgroundColor: '#000',
        marginTop: 50,
        marginBottom: 5,
    },
});

interface AccountData {
    id: string;
    code: string;
    name: string;
    amount: number;
}

interface ReportSection {
    accounts: AccountData[];
    total: number;
}

interface AssetSection {
    currentAssets: ReportSection;
    fixedAssets: ReportSection;
    total: number;
}

interface LiabilitySection {
    currentLiabilities: ReportSection;
    longTermLiabilities: ReportSection;
    total: number;
}

interface EquitySection extends ReportSection {
    currentYearEarnings: number;
    retainedEarnings: number;
    totalEquity: number;
}

export interface BalanceSheetData {
    assets: AssetSection;
    liabilities: LiabilitySection;
    equity: EquitySection;
    totalLiabilitiesAndEquity: number;
    checks: {
        isBalanced: boolean;
        difference: number;
    };
}

interface BalanceSheetPDFProps {
    data: BalanceSheetData;
    snapshotDate: string;
    logoSrc?: string;
}

const BalanceSheetPDF = ({ data, snapshotDate, logoSrc }: BalanceSheetPDFProps) => {
    const reportDateStr = snapshotDate ? new Date(snapshotDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }) : "";

    const currentDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const renderAccountRows = (accounts: AccountData[]) => {
        if (!accounts || accounts.length === 0) return null;
        return accounts.map(acc => (
            <View key={acc.id || Math.random()} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.codeCell]}>{acc.code || ""}</Text>
                <Text style={[styles.tableCell, styles.nameCell]}>{acc.name || ""}</Text>
                <Text style={[styles.tableCell, styles.amountCell]}>{formatCurrency(acc.amount || 0)}</Text>
            </View>
        ));
    };

    const isBalanced = data && data.checks ? data.checks.isBalanced : true;
    const difference = data && data.checks ? data.checks.difference : 0;

    return (
        <Document title={`Neraca per ${reportDateStr}`}>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.headerContainer}>
                    {logoSrc ? <Image src={logoSrc} style={styles.logo} /> : null}
                    <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>PT. RYLIF MIKRO MANDIRI</Text>
                        <Text style={styles.companyAddress}>Jln. Arjuna RT. 04/RW. 36, Kampung Pulo Resident 1 No. 6</Text>
                        <Text style={styles.companyAddress}>Bekasi - 17510, Indonesia</Text>
                        <Text style={styles.companyContact}>Phone: 0857-7414-8874 | Email: rylifmikromandiri@gmail.com</Text>
                    </View>
                </View>

                {/* Title */}
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>LAPORAN NERACA (BALANCE SHEET)</Text>
                    <Text style={styles.period}>Per Tanggal: {reportDateStr}</Text>
                </View>

                <View style={styles.tableHeader}>
                    <Text style={[styles.tableCell, styles.codeCell]}>Kode</Text>
                    <Text style={[styles.tableCell, styles.nameCell]}>Keterangan / Account Name</Text>
                    <Text style={[styles.tableCell, styles.amountCell]}>Saldo (IDR)</Text>
                </View>

                {/* --- ASSETS --- */}
                <View style={styles.sectionHeader}>
                    <Text>ASET (ASSETS)</Text>
                </View>

                <View style={styles.subCategoryHeader}>
                    <Text>Aset Lancar (Current Assets)</Text>
                </View>
                {renderAccountRows(data?.assets?.currentAssets?.accounts)}
                <View style={styles.subtotalRow}>
                    <Text style={[styles.tableCell, styles.codeCell]}></Text>
                    <Text style={[styles.tableCell, styles.nameCell, { fontFamily: 'Helvetica-Bold' }]}>Total Aset Lancar</Text>
                    <Text style={[styles.tableCell, styles.amountCell]}>{formatCurrency(data?.assets?.currentAssets?.total || 0)}</Text>
                </View>

                <View style={styles.subCategoryHeader}>
                    <Text>Aset Tetap (Fixed Assets)</Text>
                </View>
                {renderAccountRows(data?.assets?.fixedAssets?.accounts)}
                <View style={styles.subtotalRow}>
                    <Text style={[styles.tableCell, styles.codeCell]}></Text>
                    <Text style={[styles.tableCell, styles.nameCell, { fontFamily: 'Helvetica-Bold' }]}>Total Aset Tetap</Text>
                    <Text style={[styles.tableCell, styles.amountCell]}>{formatCurrency(data?.assets?.fixedAssets?.total || 0)}</Text>
                </View>

                <View style={styles.mainTotalRow}>
                    <Text style={[styles.tableCell, styles.codeCell]}></Text>
                    <Text style={[styles.tableCell, styles.nameCell]}>TOTAL ASET</Text>
                    <Text style={[styles.tableCell, styles.amountCell]}>{formatCurrency(data?.assets?.total || 0)}</Text>
                </View>

                {/* --- LIABILITIES --- */}
                <View style={styles.sectionHeader}>
                    <Text>KEWAJIBAN & EKUITAS (LIABILITIES & EQUITY)</Text>
                </View>

                <View style={styles.subCategoryHeader}>
                    <Text>Kewajiban Lancar (Current Liabilities)</Text>
                </View>
                {renderAccountRows(data?.liabilities?.currentLiabilities?.accounts)}
                <View style={styles.subtotalRow}>
                    <Text style={[styles.tableCell, styles.codeCell]}></Text>
                    <Text style={[styles.tableCell, styles.nameCell, { fontFamily: 'Helvetica-Bold' }]}>Total Kewajiban Lancar</Text>
                    <Text style={[styles.tableCell, styles.amountCell]}>{formatCurrency(data?.liabilities?.currentLiabilities?.total || 0)}</Text>
                </View>

                <View style={styles.subCategoryHeader}>
                    <Text>Kewajiban Jangka Panjang (Long-term Liabilities)</Text>
                </View>
                {renderAccountRows(data?.liabilities?.longTermLiabilities?.accounts)}
                <View style={styles.subtotalRow}>
                    <Text style={[styles.tableCell, styles.codeCell]}></Text>
                    <Text style={[styles.tableCell, styles.nameCell, { fontFamily: 'Helvetica-Bold' }]}>Total Kewajiban Jangka Panjang</Text>
                    <Text style={[styles.tableCell, styles.amountCell]}>{formatCurrency(data?.liabilities?.longTermLiabilities?.total || 0)}</Text>
                </View>

                <View style={styles.subtotalRow}>
                    <Text style={[styles.tableCell, styles.codeCell]}></Text>
                    <Text style={[styles.tableCell, styles.nameCell, { fontFamily: 'Helvetica-Bold' }]}>Total Kewajiban</Text>
                    <Text style={[styles.tableCell, styles.amountCell]}>{formatCurrency(data?.liabilities?.total || 0)}</Text>
                </View>

                {/* --- EQUITY --- */}
                <View style={styles.subCategoryHeader}>
                    <Text>Ekuitas (Equity)</Text>
                </View>
                {renderAccountRows(data?.equity?.accounts)}
                <View style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.codeCell]}></Text>
                    <Text style={[styles.tableCell, styles.nameCell, { fontStyle: 'italic' }]}>Laba Ditahan (Retained Earnings)</Text>
                    <Text style={[styles.tableCell, styles.amountCell]}>{formatCurrency(data?.equity?.retainedEarnings || 0)}</Text>
                </View>
                <View style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.codeCell]}></Text>
                    <Text style={[styles.tableCell, styles.nameCell, { fontStyle: 'italic' }]}>Laba Tahun Berjalan (Current Year Earnings)</Text>
                    <Text style={[styles.tableCell, styles.amountCell]}>{formatCurrency(data?.equity?.currentYearEarnings || 0)}</Text>
                </View>
                <View style={styles.subtotalRow}>
                    <Text style={[styles.tableCell, styles.codeCell]}></Text>
                    <Text style={[styles.tableCell, styles.nameCell, { fontFamily: 'Helvetica-Bold' }]}>Total Ekuitas</Text>
                    <Text style={[styles.tableCell, styles.amountCell]}>{formatCurrency(data?.equity?.totalEquity || 0)}</Text>
                </View>

                <View style={styles.mainTotalRow}>
                    <Text style={[styles.tableCell, styles.codeCell]}></Text>
                    <Text style={[styles.tableCell, styles.nameCell]}>TOTAL LIABILITAS & EKUITAS</Text>
                    <Text style={[styles.tableCell, styles.amountCell]}>{formatCurrency(data?.totalLiabilitiesAndEquity || 0)}</Text>
                </View>

                {/* VALIDATION CHECK */}
                <View style={[styles.validationRow, {
                    backgroundColor: isBalanced ? '#ecfdf5' : '#fef2f2',
                    borderTopColor: isBalanced ? '#10b981' : '#ef4444'
                }]}>
                    <Text style={[styles.tableCell, styles.codeCell]}></Text>
                    <Text style={[styles.tableCell, styles.nameCell, {
                        fontFamily: 'Helvetica-Bold',
                        color: isBalanced ? '#065f46' : '#991b1b'
                    }]}>SELISIH (BALANCE CHECK)</Text>
                    <Text style={[styles.tableCell, styles.amountCell, {
                        color: isBalanced ? '#065f46' : '#991b1b'
                    }]}>{formatCurrency(difference)}</Text>
                </View>

                {/* Signatures */}
                <View style={styles.signatureContainer}>
                    <View style={styles.signatureBox}>
                        <View style={styles.signatureLine} />
                        <Text style={{ fontSize: 10, fontWeight: 'bold' }}>Direktur Utama</Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <View style={styles.signatureLine} />
                        <Text style={{ fontSize: 10, fontWeight: 'bold' }}>Manager Keuangan</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>Dokumen ini dihasilkan secara otomatis oleh ERP RYLIF MIKRO MANDIRI pada {currentDate}</Text>
                    <Text style={{ marginTop: 2 }}>Halaman 1 dari 1</Text>
                </View>
            </Page>
        </Document>
    );
};

export default BalanceSheetPDF;