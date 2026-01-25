import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image,
} from '@react-pdf/renderer';
import { Ledger, LedgerLine } from '@/schemas/accounting/ledger';

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        padding: 20,
        fontSize: 8,
        color: '#1e293b',
        orientation: 'landscape',
    },
    headerContainer: {
        flexDirection: 'row',
        marginBottom: 8,
        borderBottomWidth: 1.5,
        borderBottomColor: '#008000',
        paddingBottom: 6,
        alignItems: 'flex-start',
    },
    logo: {
        width: 60,
        height: 60,
        marginRight: 15,
        objectFit: 'contain',
        marginTop: -25,
    },
    companyInfo: {
        flex: 1,
        justifyContent: 'flex-start',
    },
    companyName: {
        color: '#008000',
        fontWeight: 'bold',
        fontSize: 10,
        marginBottom: 1,
    },
    companyAddress: {
        fontSize: 7,
        lineHeight: 1.2,
        marginBottom: 1,
    },
    companyContact: {
        fontSize: 7,
        lineHeight: 1.2,
        marginTop: 2,
    },
    titleContainer: {
        marginBottom: 10,
        textAlign: 'center',
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 2,
        color: '#1e293b',
    },
    subtitle: {
        fontSize: 9,
        color: '#64748b',
        marginBottom: 3,
    },
    period: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 10,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc',
        padding: 4,
        borderRadius: 3,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    statBox: {
        alignItems: 'center',
        flex: 1,
        paddingHorizontal: 5,
    },
    statLabel: {
        fontSize: 7,
        color: '#64748b',
        marginBottom: 1,
    },
    statValue: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    transactionHeader: {
        backgroundColor: '#f8fafc',
        padding: 4,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 2,
        marginBottom: 6,
        marginTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    transactionInfo: {
        flexDirection: 'column',
    },
    transactionCode: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    transactionDate: {
        fontSize: 7,
        color: '#64748b',
    },
    transactionAmount: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#008000',
    },
    tableHeader: {
        backgroundColor: '#f1f5f9',
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#cbd5e1',
        fontWeight: 'bold',
        minHeight: 18,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#cbd5e1',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#e2e8f0',
        minHeight: 16,
        alignItems: 'center',
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#e2e8f0',
    },
    tableCell: {
        paddingVertical: 2,
        paddingHorizontal: 4,
        fontSize: 7,
    },
    descCell: { width: '35%' },
    accountCell: { width: '20%' },
    refCell: { width: '15%' },
    debitCell: { width: '15%', textAlign: 'right' },
    creditCell: { width: '15%', textAlign: 'right' },
    totalsRow: {
        backgroundColor: '#f8fafc',
        flexDirection: 'row',
        minHeight: 18,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderTopWidth: 0,
        marginBottom: 6,
    },
    totalLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#334155',
        paddingLeft: 4,
        width: '65%',
    },
    totalValue: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#1e293b',
        textAlign: 'right',
        paddingRight: 4,
        width: '17.5%',
    },
    grandTotalRow: {
        backgroundColor: '#3b82f6',
        flexDirection: 'row',
        minHeight: 22,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1d4ed8',
        marginTop: 5,
        marginBottom: 8,
    },
    grandTotalLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: 'white',
        paddingLeft: 6,
        width: '65%',
    },
    grandTotalValue: {
        fontSize: 10,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'right',
        paddingRight: 6,
        width: '17.5%',
    },
    balanceStatus: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ecfdf5',
        padding: 4,
        borderRadius: 2,
        borderWidth: 1,
        borderColor: '#10b981',
        marginBottom: 15,
    },
    balanceText: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#065f46',
    },
    footer: {
        position: 'absolute',
        bottom: 15,
        left: 20,
        right: 20,
        textAlign: 'center',
        fontSize: 6,
        color: '#94a3b8',
        borderTopWidth: 0.5,
        borderTopColor: '#e2e8f0',
        paddingTop: 5,
    },
    signatureContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        paddingHorizontal: 40,
    },
    signatureBox: {
        alignItems: 'center',
        width: '40%',
    },
    signatureLine: {
        width: '80%',
        height: 0.5,
        backgroundColor: '#000',
        marginTop: 30,
        marginBottom: 2,
    },
});

interface LedgerGroup {
    ledgerNumber: string;
    transactionDate: Date;
    referenceType: string;
    description: string;
    lines: LedgerLine[];
    totalDebit: number;
    totalCredit: number;
}

interface GeneralLedgerPDFProps {
    data: Ledger[];
    logoSrc?: string;
    currentPage?: number;
    totalPages?: number;
    period?: string;
    globalStats?: {
        totalTransactions: number;
        totalDebit: number;
        totalCredit: number;
        balancedCount: number;
    };
}

const GeneralLedgerPDF = ({
    data,
    logoSrc,
    currentPage = 1,
    totalPages = 1,
    period = "January 2026 (01-2026)",
    globalStats
}: GeneralLedgerPDFProps) => {
    const currentDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Format currency standar untuk PDF
    const formatCurrency = (amount: number) => {
        if (amount === 0) return '-';
        const formatted = new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);

        // Mengubah "Rp " atau "Rp" menjadi "Rp." sesuai permintaan user
        return formatted.replace(/Rp\s?/, 'Rp.');
    };

    // Kelompokkan data ledger
    const groupedData: LedgerGroup[] = data.map(ledger => {
        const lines = ledger.ledgerLines || [];
        return {
            ledgerNumber: ledger.ledgerNumber,
            transactionDate: new Date(ledger.transactionDate),
            referenceType: ledger.referenceType,
            description: ledger.description,
            lines: lines,
            totalDebit: lines.reduce((sum, line) => sum + (line.debitAmount || 0), 0),
            totalCredit: lines.reduce((sum, line) => sum + (line.creditAmount || 0), 0)
        };
    });

    // Hitung totals
    const totalDebit = groupedData.reduce((sum, g) => sum + g.totalDebit, 0);
    const totalCredit = groupedData.reduce((sum, g) => sum + g.totalCredit, 0);
    const totalTransactions = globalStats?.totalTransactions || data.length;
    const balancedTransactions = groupedData.filter(g => Math.abs(g.totalDebit - g.totalCredit) < 0.01).length;
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
    const totalEntries = data.reduce((sum, l) => sum + (l.ledgerLines?.length || 0), 0);

    // Format date
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const truncateText = (text: string, maxLength: number) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    const renderTransactionGroup = (group: LedgerGroup, index: number) => {
        return (
            <View key={`${group.ledgerNumber}-${index}`} style={{ marginBottom: 8 }}>
                {/* Transaction Header - Compact */}
                <View style={styles.transactionHeader}>
                    <View style={styles.transactionInfo}>
                        <Text style={styles.transactionCode}>{group.ledgerNumber}</Text>
                        <Text style={styles.transactionDate}>
                            {formatDate(group.transactionDate)} • {group.referenceType}
                        </Text>
                    </View>
                    <Text style={styles.transactionAmount}>
                        D: {formatCurrency(group.totalDebit)} / K: {formatCurrency(group.totalCredit)}
                    </Text>
                </View>

                {/* Table */}
                <View>
                    <View style={styles.tableHeader} fixed>
                        <Text style={[styles.tableCell, styles.descCell]}>DESKRIPSI</Text>
                        <Text style={[styles.tableCell, styles.accountCell]}>AKUN</Text>
                        <Text style={[styles.tableCell, styles.refCell]}>REFERENSI</Text>
                        <Text style={[styles.tableCell, styles.debitCell]}>DEBIT</Text>
                        <Text style={[styles.tableCell, styles.creditCell]}>KREDIT</Text>
                    </View>

                    {group.lines.map((line, idx) => (
                        <View key={line.id || idx} style={styles.tableRow}>
                            <Text style={[styles.tableCell, styles.descCell]}>
                                {truncateText(line.description || group.description, 60)}
                            </Text>
                            <Text style={[styles.tableCell, styles.accountCell]}>
                                {line.coa?.code ? `${line.coa.code}` : 'N/A'}
                            </Text>
                            <Text style={[styles.tableCell, styles.refCell]}>
                                {line.reference || '-'}
                            </Text>
                            <Text style={[styles.tableCell, styles.debitCell]}>
                                {line.debitAmount > 0 ? formatCurrency(line.debitAmount) : '-'}
                            </Text>
                            <Text style={[styles.tableCell, styles.creditCell]}>
                                {line.creditAmount > 0 ? formatCurrency(line.creditAmount) : '-'}
                            </Text>
                        </View>
                    ))}

                    {/* Group Totals */}
                    <View style={styles.totalsRow}>
                        <Text style={styles.totalLabel}>
                            Total {group.ledgerNumber} • {group.lines.length} entri
                        </Text>
                        <Text style={styles.totalValue}>
                            {group.totalDebit > 0 ? formatCurrency(group.totalDebit) : '-'}
                        </Text>
                        <Text style={styles.totalValue}>
                            {group.totalCredit > 0 ? formatCurrency(group.totalCredit) : '-'}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <Document title={`General Ledger - ${period}`}>
            <Page size="A4" orientation="landscape" style={styles.page}>
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
                    <Text style={styles.title}>GENERAL LEDGER (BUKU BESAR)</Text>
                    <Text style={styles.subtitle}>Detailed transaction history by account</Text>
                    <Text style={styles.period}>Periode Akuntansi: {period}</Text>
                </View>

                {/* Stats Summary - Horizontal */}
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Total Transaksi</Text>
                        <Text style={styles.statValue}>{totalTransactions}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Total Entri</Text>
                        <Text style={styles.statValue}>{totalEntries}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Seimbang</Text>
                        <Text style={styles.statValue}>{balancedTransactions}/{groupedData.length}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Total Debit</Text>
                        <Text style={[styles.statValue, { color: '#008000' }]}>
                            {formatCurrency(totalDebit)}
                        </Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Total Kredit</Text>
                        <Text style={[styles.statValue, { color: '#008000' }]}>
                            {formatCurrency(totalCredit)}
                        </Text>
                    </View>
                </View>

                {/* Transaction Groups */}
                {groupedData.map((group, index) =>
                    renderTransactionGroup(group, index)
                )}

                {/* Grand Totals */}
                <View style={styles.grandTotalRow} wrap={false}>
                    <Text style={styles.grandTotalLabel}>
                        GRAND TOTAL • {groupedData.length} transaksi • {totalEntries} entri
                    </Text>
                    <Text style={styles.grandTotalValue}>
                        {formatCurrency(totalDebit)}
                    </Text>
                    <Text style={styles.grandTotalValue}>
                        {formatCurrency(totalCredit)}
                    </Text>
                </View>

                <View
                    style={[
                        styles.balanceStatus,
                        !isBalanced ? {
                            backgroundColor: '#fef2f2',
                            borderColor: '#ef4444'
                        } : {}
                    ]}
                    wrap={false}
                >
                    <Text style={[
                        styles.balanceText,
                        !isBalanced ? { color: '#991b1b' } : {}
                    ]}>
                        {isBalanced ? '✓ LEDGER SEIMBANG' : `✗ LEDGER TIDAK SEIMBANG • Selisih: ${formatCurrency(Math.abs(totalDebit - totalCredit))}`}
                    </Text>
                </View>

                <View style={styles.signatureContainer} wrap={false}>
                    <View style={styles.signatureBox}>
                        <View style={styles.signatureLine} />
                        <Text style={{ fontSize: 7, fontWeight: 'bold' }}>Direktur Utama</Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <View style={styles.signatureLine} />
                        <Text style={{ fontSize: 7, fontWeight: 'bold' }}>Manager Akuntansi</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>Dokumen ini dihasilkan secara otomatis oleh ERP RYLIF MIKRO MANDIRI pada {currentDate}</Text>
                    <Text style={{ marginTop: 1 }}>Halaman {currentPage} dari {totalPages}</Text>
                </View>
            </Page>
        </Document>
    );
};

export default GeneralLedgerPDF;