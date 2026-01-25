import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image,
} from '@react-pdf/renderer';
import { GeneralLedgerSummary } from '@/types/glSummary';

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
        marginBottom: 10,
        borderBottomWidth: 1.5,
        borderBottomColor: '#008000',
        paddingBottom: 8,
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
        fontSize: 12,
        marginBottom: 2,
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
        marginBottom: 8,
        textAlign: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 3,
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
        padding: 5,
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
    tableHeader: {
        backgroundColor: '#3b82f6',
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#1d4ed8',
        fontWeight: 'bold',
        minHeight: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1d4ed8',
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
    },
    headerCell: {
        paddingVertical: 4,
        paddingHorizontal: 4,
        fontSize: 8,
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#e2e8f0',
        minHeight: 18,
        alignItems: 'center',
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#e2e8f0',
    },
    tableCell: {
        paddingVertical: 3,
        paddingHorizontal: 4,
        fontSize: 7,
    },
    dateCell: { width: '8%', textAlign: 'center' },
    codeCell: { width: '10%' },
    nameCell: { width: '20%' },
    typeCell: { width: '12%' },
    openingCell: { width: '12%', textAlign: 'right' },
    debitCell: { width: '10%', textAlign: 'right' },
    creditCell: { width: '10%', textAlign: 'right' },
    closingCell: { width: '12%', textAlign: 'right' },
    transactionCell: { width: '6%', textAlign: 'center' },
    totalsRow: {
        backgroundColor: '#f1f5f9',
        flexDirection: 'row',
        minHeight: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderTopWidth: 0,
        fontWeight: 'bold',
    },
    totalLabelCell: {
        paddingVertical: 3,
        paddingHorizontal: 4,
        fontSize: 8,
        fontWeight: 'bold',
        color: '#334155',
        width: '52%',
        textAlign: 'right',
    },
    totalValueCell: {
        paddingVertical: 3,
        paddingHorizontal: 4,
        fontSize: 8,
        fontWeight: 'bold',
        color: '#1e293b',
        textAlign: 'right',
    },
    balanceStatus: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ecfdf5',
        padding: 5,
        borderRadius: 3,
        borderWidth: 1,
        borderColor: '#10b981',
        marginTop: 10,
        marginBottom: 15,
    },
    unbalancedStatus: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        padding: 5,
        borderRadius: 3,
        borderWidth: 1,
        borderColor: '#ef4444',
        marginTop: 10,
        marginBottom: 15,
    },
    balanceText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#065f46',
    },
    unbalancedText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#991b1b',
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
    accountTypeBadge: {
        borderRadius: 2,
        paddingHorizontal: 3,
        paddingVertical: 1,
        fontSize: 6,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

interface GeneralLedgerSummaryPDFProps {
    data: GeneralLedgerSummary[];
    logoSrc?: string;
    currentPage?: number;
    totalPages?: number;
    period?: string;
    date?: string;
}

// Interface untuk data yang sudah dikelompokkan
interface AccountGroup {
    type: string;
    accounts: GeneralLedgerSummary[];
    subtotal: {
        opening: number;
        debit: number;
        credit: number;
        closing: number;
    };
}

const GeneralLedgerSummaryPDF = ({
    data,
    logoSrc,
    currentPage = 1,
    totalPages = 1,
    period = "January 2026 (01-2026)",
    date
}: GeneralLedgerSummaryPDFProps) => {
    const currentDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Format currency
    const formatCurrency = (amount: number) => {
        if (amount === 0) return 'Rp 0';
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    // Get account type color berdasarkan kode akun
    const getAccountTypeInfo = (accountCode: string) => {
        if (!accountCode) return {
            type: 'LAINNYA',
            bg: '#f1f5f9',
            text: '#334155',
            border: '#cbd5e1'
        };

        if (accountCode.startsWith('1')) {
            return {
                type: 'ASET',
                bg: '#d1fae5',
                text: '#065f46',
                border: '#10b981'
            };
        } else if (accountCode.startsWith('2')) {
            return {
                type: 'LIABILITAS',
                bg: '#fef3c7',
                text: '#92400e',
                border: '#f59e0b'
            };
        } else if (accountCode.startsWith('3')) {
            return {
                type: 'EKUITAS',
                bg: '#e0e7ff',
                text: '#3730a3',
                border: '#4f46e5'
            };
        } else if (accountCode.startsWith('4')) {
            return {
                type: 'PENDAPATAN',
                bg: '#dbeafe',
                text: '#1e40af',
                border: '#3b82f6'
            };
        } else if (accountCode.startsWith('5') || accountCode.startsWith('6')) {
            return {
                type: 'BEBAN',
                bg: '#ffe4e6',
                text: '#be123c',
                border: '#f43f5e'
            };
        } else {
            return {
                type: 'LAINNYA',
                bg: '#f1f5f9',
                text: '#334155',
                border: '#cbd5e1'
            };
        }
    };

    // Kelompokkan data berdasarkan tipe akun (berdasarkan kode akun)
    const groupedAccounts: AccountGroup[] = React.useMemo(() => {
        const groups: Record<string, AccountGroup> = {
            'ASET': { type: 'ASET', accounts: [], subtotal: { opening: 0, debit: 0, credit: 0, closing: 0 } },
            'LIABILITAS': { type: 'LIABILITAS', accounts: [], subtotal: { opening: 0, debit: 0, credit: 0, closing: 0 } },
            'EKUITAS': { type: 'EKUITAS', accounts: [], subtotal: { opening: 0, debit: 0, credit: 0, closing: 0 } },
            'PENDAPATAN': { type: 'PENDAPATAN', accounts: [], subtotal: { opening: 0, debit: 0, credit: 0, closing: 0 } },
            'BEBAN': { type: 'BEBAN', accounts: [], subtotal: { opening: 0, debit: 0, credit: 0, closing: 0 } },
        };

        // Kelompokkan setiap akun berdasarkan kodenya
        data.forEach(item => {
            const typeInfo = getAccountTypeInfo(item.coa?.code || '');
            const groupType = typeInfo.type;

            if (!groups[groupType]) {
                groups[groupType] = {
                    type: groupType,
                    accounts: [],
                    subtotal: { opening: 0, debit: 0, credit: 0, closing: 0 }
                };
            }

            groups[groupType].accounts.push(item);

            // Hitung subtotal
            groups[groupType].subtotal.opening += item.openingBalance || 0;
            groups[groupType].subtotal.debit += item.debitTotal || 0;
            groups[groupType].subtotal.credit += item.creditTotal || 0;
            groups[groupType].subtotal.closing += item.closingBalance || 0;
        });

        // Hanya kembalikan grup yang memiliki data
        return Object.values(groups).filter(group => group.accounts.length > 0);
    }, [data]);

    // Hitung total keseluruhan
    const grandTotals = React.useMemo(() => {
        return groupedAccounts.reduce((totals, group) => ({
            opening: totals.opening + group.subtotal.opening,
            debit: totals.debit + group.subtotal.debit,
            credit: totals.credit + group.subtotal.credit,
            closing: totals.closing + group.subtotal.closing,
        }), { opening: 0, debit: 0, credit: 0, closing: 0 });
    }, [groupedAccounts]);

    // Hitung total transaksi
    const totalTransactions = React.useMemo(() => {
        return data.reduce((sum, item) => sum + (item.transactionCount || 0), 0);
    }, [data]);

    // Hitung opening balance ekuitas
    const equityOpeningBalance = React.useMemo(() => {
        return data
            .filter(item => item.coa?.code?.startsWith('3'))
            .reduce((sum, item) => sum + Math.abs(item.closingBalance || 0), 0);
    }, [data]);

    // Cek keseimbangan
    const isBalanced = Math.abs(grandTotals.debit - grandTotals.credit) < 0.01;
    const balanceDifference = Math.abs(grandTotals.debit - grandTotals.credit);

    return (
        <Document title={`General Ledger Summary - ${period}`}>
            <Page size="A4" orientation="landscape" style={styles.page}>
                {/* Header Information Section */}
                <View wrap={false}>
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
                        <Text style={styles.title}>GENERAL LEDGER SUMMARY</Text>
                        <Text style={styles.subtitle}>Summary of ledger transactions by account</Text>
                        <Text style={styles.period}>Periode: {period} • {date ? `Per Tanggal: ${formatDate(date)}` : ''}</Text>
                    </View>

                    {/* Stats Summary */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Total Accounts</Text>
                            <Text style={styles.statValue}>{data.length}</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Total Transactions</Text>
                            <Text style={styles.statValue}>
                                {totalTransactions}
                            </Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Opening Balance</Text>
                            <Text style={[styles.statValue, { color: '#008000' }]}>
                                {formatCurrency(equityOpeningBalance)}
                            </Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Total Debit</Text>
                            <Text style={[styles.statValue, { color: '#008000' }]}>
                                {formatCurrency(grandTotals.debit)}
                            </Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Total Credit</Text>
                            <Text style={[styles.statValue, { color: '#008000' }]}>
                                {formatCurrency(grandTotals.credit)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Table Header */}
                <View style={styles.tableHeader} fixed>
                    <Text style={[styles.headerCell, styles.dateCell]}>DATE</Text>
                    <Text style={[styles.headerCell, styles.codeCell]}>ACCOUNT CODE</Text>
                    <Text style={[styles.headerCell, styles.nameCell]}>ACCOUNT NAME</Text>
                    <Text style={[styles.headerCell, styles.typeCell]}>TYPE</Text>
                    <Text style={[styles.headerCell, styles.openingCell]}>OPENING BALANCE</Text>
                    <Text style={[styles.headerCell, styles.debitCell]}>DEBIT</Text>
                    <Text style={[styles.headerCell, styles.creditCell]}>CREDIT</Text>
                    <Text style={[styles.headerCell, styles.closingCell]}>CLOSING BALANCE</Text>
                    <Text style={[styles.headerCell, styles.transactionCell]}>TXNS</Text>
                </View>

                {/* Table Rows Grouped by Type */}
                {groupedAccounts.map((group) => {
                    const typeInfo = getAccountTypeInfo(group.type === 'EKUITAS' ? '3-10101' : group.accounts[0]?.coa?.code || '');

                    return (
                        <React.Fragment key={group.type}>
                            {/* Type Header */}
                            <View style={[styles.tableRow, { backgroundColor: typeInfo.bg + '20' }]}>
                                <Text style={[styles.tableCell, {
                                    width: '100%',
                                    fontWeight: 'bold',
                                    color: typeInfo.text,
                                    paddingLeft: 8
                                }]}>
                                    {group.type.toUpperCase()}
                                </Text>
                            </View>

                            {/* Account Rows */}
                            {group.accounts.map((item, index) => (
                                <View key={`${item.coaId || index}-${item.date}`} style={styles.tableRow}>
                                    <Text style={[styles.tableCell, styles.dateCell]}>
                                        {formatDate(item.date)}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.codeCell, { fontWeight: 'bold' }]}>
                                        {item.coa?.code || '-'}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.nameCell]}>
                                        {item.coa?.name || '-'}
                                    </Text>
                                    <View style={[styles.tableCell, styles.typeCell]}>
                                        <Text style={{
                                            ...styles.accountTypeBadge,
                                            backgroundColor: typeInfo.bg,
                                            color: typeInfo.text,
                                            borderWidth: 1,
                                            borderColor: typeInfo.border,
                                        }}>
                                            {typeInfo.type}
                                        </Text>
                                    </View>
                                    <Text style={[styles.tableCell, styles.openingCell]}>
                                        {formatCurrency(item.openingBalance || 0)}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.debitCell, { color: '#059669' }]}>
                                        {(item.debitTotal || 0) > 0 ? formatCurrency(item.debitTotal || 0) : '-'}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.creditCell, { color: '#dc2626' }]}>
                                        {(item.creditTotal || 0) > 0 ? formatCurrency(item.creditTotal || 0) : '-'}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.closingCell, {
                                        color: (item.closingBalance || 0) >= 0 ? '#059669' : '#dc2626',
                                        fontWeight: 'bold'
                                    }]}>
                                        {formatCurrency(item.closingBalance || 0)}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.transactionCell]}>
                                        {item.transactionCount || 0}
                                    </Text>
                                </View>
                            ))}

                            {/* Type Subtotal */}
                            <View style={[styles.totalsRow, { backgroundColor: typeInfo.bg + '40' }]}>
                                <Text style={[styles.totalLabelCell, {
                                    width: '62%',
                                    color: typeInfo.text,
                                    paddingRight: 8
                                }]}>
                                    Subtotal {group.type}
                                </Text>
                                <Text style={[styles.totalValueCell, styles.openingCell, { color: typeInfo.text }]}>
                                    {formatCurrency(group.subtotal.opening)}
                                </Text>
                                <Text style={[styles.totalValueCell, styles.debitCell, { color: typeInfo.text }]}>
                                    {formatCurrency(group.subtotal.debit)}
                                </Text>
                                <Text style={[styles.totalValueCell, styles.creditCell, { color: typeInfo.text }]}>
                                    {formatCurrency(group.subtotal.credit)}
                                </Text>
                                <Text style={[styles.totalValueCell, styles.closingCell, {
                                    color: typeInfo.text,
                                    fontWeight: 'bold'
                                }]}>
                                    {formatCurrency(group.subtotal.closing)}
                                </Text>
                                <Text style={[styles.totalValueCell, styles.transactionCell, { color: typeInfo.text }]}>
                                    {group.accounts.reduce((sum, item) => sum + (item.transactionCount || 0), 0)}
                                </Text>
                            </View>
                        </React.Fragment>
                    );
                })}

                {/* Grand Totals */}
                <View style={[styles.totalsRow, { backgroundColor: '#3b82f6', marginTop: 5 }]} wrap={false}>
                    <Text style={[styles.totalLabelCell, {
                        width: '62%',
                        color: 'white',
                        paddingRight: 8
                    }]}>
                        GRAND TOTAL • {data.length} Accounts
                    </Text>
                    <Text style={[styles.totalValueCell, styles.openingCell, { color: 'white' }]}>
                        {formatCurrency(grandTotals.opening)}
                    </Text>
                    <Text style={[styles.totalValueCell, styles.debitCell, { color: 'white' }]}>
                        {formatCurrency(grandTotals.debit)}
                    </Text>
                    <Text style={[styles.totalValueCell, styles.creditCell, { color: 'white' }]}>
                        {formatCurrency(grandTotals.credit)}
                    </Text>
                    <Text style={[styles.totalValueCell, styles.closingCell, {
                        color: 'white',
                        fontWeight: 'bold'
                    }]}>
                        {formatCurrency(grandTotals.closing)}
                    </Text>
                    <Text style={[styles.totalValueCell, styles.transactionCell, { color: 'white' }]}>
                        {totalTransactions}
                    </Text>
                </View>

                {/* Balance Status */}
                <View style={isBalanced ? styles.balanceStatus : styles.unbalancedStatus} wrap={false}>
                    <Text style={isBalanced ? styles.balanceText : styles.unbalancedText}>
                        {isBalanced
                            ? '✓ LEDGER SUMMARY SEIMBANG'
                            : `✗ LEDGER SUMMARY TIDAK SEIMBANG • Selisih: ${formatCurrency(balanceDifference)}`
                        }
                    </Text>
                </View>

                {/* Signatures */}
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
                <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
                    <>
                        <Text>Dokumen ini dihasilkan secara otomatis oleh ERP RYLIF MIKRO MANDIRI pada {currentDate}</Text>
                        <Text style={{ marginTop: 1 }}>Halaman {pageNumber} dari {totalPages}</Text>
                    </>
                )} />
            </Page>
        </Document>
    );
};

export default GeneralLedgerSummaryPDF;