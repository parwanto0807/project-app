import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image,
} from '@react-pdf/renderer';
import { TrialBalance, TrialBalanceTotals } from '@/schemas/accounting/trialBalance';

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
    numberCell: { width: '4%', textAlign: 'center' },
    codeCell: { width: '10%' },
    nameCell: { width: '30%' },
    typeCell: { width: '12%' },
    openingDebitCell: { width: '10%', textAlign: 'right' },
    openingCreditCell: { width: '10%', textAlign: 'right' },
    movementDebitCell: { width: '10%', textAlign: 'right' },
    movementCreditCell: { width: '10%', textAlign: 'right' },
    endingDebitCell: { width: '10%', textAlign: 'right' },
    endingCreditCell: { width: '10%', textAlign: 'right' },
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
        width: '46%',
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
        fontSize: 9,
        fontWeight: 'bold',
        color: 'white',
        paddingLeft: 6,
        width: '46%',
    },
    grandTotalValue: {
        fontSize: 9,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'right',
        paddingRight: 6,
        width: '10%',
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
    sectionHeader: {
        backgroundColor: '#f1f5f9',
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#cbd5e1',
        fontWeight: 'bold',
        fontSize: 8,
        color: '#334155',
    },
});

interface TrialBalancePDFProps {
    data: TrialBalance[];
    totals?: TrialBalanceTotals;
    logoSrc?: string;
    currentPage?: number;
    totalPages?: number;
    period?: string;
    date?: string;
}

const TrialBalancePDF = ({
    data,
    totals,
    logoSrc,
    currentPage = 1,
    totalPages = 1,
    period = "January 2026 (01-2026)",
    date
}: TrialBalancePDFProps) => {
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

    // Calculate totals if not provided
    const calculatedTotals = totals || data.reduce((acc, item) => ({
        openingDebit: acc.openingDebit + item.openingDebit,
        openingCredit: acc.openingCredit + item.openingCredit,
        periodDebit: acc.periodDebit + (item.periodDebit || 0),
        periodCredit: acc.periodCredit + (item.periodCredit || 0),
        endingDebit: acc.endingDebit + item.endingDebit,
        endingCredit: acc.endingCredit + item.endingCredit,
        ytdDebit: (acc.ytdDebit || 0) + (item.ytdDebit || 0),
        ytdCredit: (acc.ytdCredit || 0) + (item.ytdCredit || 0),
    }), {
        openingDebit: 0,
        openingCredit: 0,
        periodDebit: 0,
        periodCredit: 0,
        endingDebit: 0,
        endingCredit: 0,
        ytdDebit: 0,
        ytdCredit: 0,
    } as TrialBalanceTotals);

    // Check if trial balance is balanced
    const isBalanced =
        Math.abs(calculatedTotals.endingDebit - calculatedTotals.endingCredit) < 0.01 &&
        Math.abs(calculatedTotals.periodDebit - calculatedTotals.periodCredit) < 0.01;

    const endingDifference = Math.abs(calculatedTotals.endingDebit - calculatedTotals.endingCredit);
    const movementDifference = Math.abs(calculatedTotals.periodDebit - calculatedTotals.periodCredit);

    // Format date
    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
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

    // Get account type color
    const getAccountTypeColor = (type: string) => {
        switch (type.toUpperCase()) {
            case "ASET":
                return { bg: '#d1fae5', text: '#065f46', border: '#10b981' };
            case "LIABILITAS":
                return { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' };
            case "EKUITAS":
                return { bg: '#e0e7ff', text: '#3730a3', border: '#4f46e5' };
            case "PENDAPATAN":
                return { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' };
            case "HPP":
                return { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' };
            case "BEBAN":
                return { bg: '#ffe4e6', text: '#be123c', border: '#f43f5e' };
            default:
                return { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' };
        }
    };

    // Get account type icon
    const getAccountTypeIcon = (type: string) => {
        switch (type.toUpperCase()) {
            case "ASET": return "📊";
            case "LIABILITAS": return "📝";
            case "EKUITAS": return "🏛️";
            case "PENDAPATAN": return "💰";
            case "HPP": return "📦";
            case "BEBAN": return "📉";
            default: return "📋";
        }
    };

    // Group data by account type
    const groupedByType = data.reduce((groups, item) => {
        const type = item.coa?.type || 'LAINNYA';
        if (!groups[type]) groups[type] = [];
        groups[type].push(item);
        return groups;
    }, {} as Record<string, TrialBalance[]>);

    // Order of account types
    const accountTypeOrder = ['ASET', 'LIABILITAS', 'EKUITAS', 'PENDAPATAN', 'HPP', 'BEBAN', 'LAINNYA'];

    // Calculate type totals
    const calculateTypeTotals = (items: TrialBalance[]) => {
        return items.reduce((sum, item) => ({
            openingDebit: sum.openingDebit + item.openingDebit,
            openingCredit: sum.openingCredit + item.openingCredit,
            periodDebit: sum.periodDebit + (item.periodDebit || 0),
            periodCredit: sum.periodCredit + (item.periodCredit || 0),
            endingDebit: sum.endingDebit + item.endingDebit,
            endingCredit: sum.endingCredit + item.endingCredit,
        }), {
            openingDebit: 0,
            openingCredit: 0,
            periodDebit: 0,
            periodCredit: 0,
            endingDebit: 0,
            endingCredit: 0,
        });
    };

    return (
        <Document title={`Trial Balance - ${period}`}>
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
                    <Text style={styles.title}>NERACA PERCOBAAN (TRIAL BALANCE)</Text>
                    <Text style={styles.subtitle}>Rekapitulasi saldo akun sebelum penyesuaian</Text>
                    <Text style={styles.period}>Periode: {period} • {date ? `Per Tanggal: ${formatDate(date)}` : ''}</Text>
                </View>

                {/* Stats Summary */}
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Total Accounts</Text>
                        <Text style={styles.statValue}>{data.length}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Opening Balance</Text>
                        <Text style={[styles.statValue, { color: '#008000' }]}>
                            {formatCurrency(calculatedTotals.openingDebit + calculatedTotals.openingCredit)}
                        </Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Movement Debit</Text>
                        <Text style={[styles.statValue, { color: '#059669' }]}>
                            {formatCurrency(calculatedTotals.periodDebit)}
                        </Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Movement Credit</Text>
                        <Text style={[styles.statValue, { color: '#dc2626' }]}>
                            {formatCurrency(calculatedTotals.periodCredit)}
                        </Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Ending Debit</Text>
                        <Text style={[styles.statValue, { color: '#059669' }]}>
                            {formatCurrency(calculatedTotals.endingDebit)}
                        </Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Ending Credit</Text>
                        <Text style={[styles.statValue, { color: '#dc2626' }]}>
                            {formatCurrency(calculatedTotals.endingCredit)}
                        </Text>
                    </View>
                </View>

                {/* Table Header */}
                <View style={styles.tableHeader} fixed>
                    <Text style={[styles.headerCell, styles.numberCell]}>NO</Text>
                    <Text style={[styles.headerCell, styles.codeCell]}>KODE</Text>
                    <Text style={[styles.headerCell, styles.nameCell]}>NAMA AKUN</Text>
                    <Text style={[styles.headerCell, styles.typeCell]}>JENIS</Text>
                    <Text style={[styles.headerCell, styles.openingDebitCell]}>SALDO AWAL DEBIT</Text>
                    <Text style={[styles.headerCell, styles.openingCreditCell]}>SALDO AWAL KREDIT</Text>
                    <Text style={[styles.headerCell, styles.movementDebitCell]}>MUTASI DEBIT</Text>
                    <Text style={[styles.headerCell, styles.movementCreditCell]}>MUTASI KREDIT</Text>
                    <Text style={[styles.headerCell, styles.endingDebitCell]}>SALDO AKHIR DEBIT</Text>
                    <Text style={[styles.headerCell, styles.endingCreditCell]}>SALDO AKHIR KREDIT</Text>
                </View>

                {/* Table Rows Grouped by Type */}
                {accountTypeOrder.map((type, typeIndex) => {
                    const items = groupedByType[type];
                    if (!items || items.length === 0) return null;

                    const typeColor = getAccountTypeColor(type);
                    const typeTotals = calculateTypeTotals(items);

                    return (
                        <View key={type}>
                            {/* Type Header */}
                            <View style={[styles.sectionHeader, { backgroundColor: typeColor.bg + '80' }]}>
                                <Text style={{ color: typeColor.text }}>
                                    {type.toUpperCase()}
                                </Text>
                            </View>

                            {/* Account Rows */}
                            {items.map((item, index) => (
                                <View key={item.coa?.id || index} style={styles.tableRow}>
                                    <Text style={[styles.tableCell, styles.numberCell]}>
                                        {index + 1}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.codeCell, { fontWeight: 'bold', fontFamily: 'Helvetica-Bold' }]}>
                                        {item.coa?.code || '-'}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.nameCell]}>
                                        {item.coa?.name || '-'}
                                    </Text>
                                    <View style={[styles.tableCell, styles.typeCell]}>
                                        <Text style={{
                                            ...styles.accountTypeBadge,
                                            backgroundColor: typeColor.bg,
                                            color: typeColor.text,
                                            borderWidth: 1,
                                            borderColor: typeColor.border,
                                        }}>
                                            {item.coa?.type || type}
                                        </Text>
                                    </View>
                                    <Text style={[styles.tableCell, styles.openingDebitCell]}>
                                        {item.openingDebit > 0 ? formatCurrency(item.openingDebit) : '-'}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.openingCreditCell]}>
                                        {item.openingCredit > 0 ? formatCurrency(item.openingCredit) : '-'}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.movementDebitCell, { color: '#059669' }]}>
                                        {item.periodDebit > 0 ? formatCurrency(item.periodDebit) : '-'}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.movementCreditCell, { color: '#dc2626' }]}>
                                        {item.periodCredit > 0 ? formatCurrency(item.periodCredit) : '-'}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.endingDebitCell, {
                                        color: item.endingDebit > 0 ? '#059669' : '#6b7280',
                                        fontWeight: 'bold'
                                    }]}>
                                        {item.endingDebit > 0 ? formatCurrency(item.endingDebit) : '-'}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.endingCreditCell, {
                                        color: item.endingCredit > 0 ? '#dc2626' : '#6b7280',
                                        fontWeight: 'bold'
                                    }]}>
                                        {item.endingCredit > 0 ? formatCurrency(item.endingCredit) : '-'}
                                    </Text>
                                </View>
                            ))}

                            {/* Type Subtotal */}
                            <View style={[styles.totalsRow, { backgroundColor: typeColor.bg + '40' }]}>
                                <Text style={[styles.totalLabelCell, {
                                    width: '46%',
                                    color: typeColor.text,
                                    paddingRight: 8
                                }]}>
                                    Subtotal {type}
                                </Text>
                                <Text style={[styles.totalValueCell, styles.openingDebitCell, { color: typeColor.text }]}>
                                    {typeTotals.openingDebit > 0 ? formatCurrency(typeTotals.openingDebit) : '-'}
                                </Text>
                                <Text style={[styles.totalValueCell, styles.openingCreditCell, { color: typeColor.text }]}>
                                    {typeTotals.openingCredit > 0 ? formatCurrency(typeTotals.openingCredit) : '-'}
                                </Text>
                                <Text style={[styles.totalValueCell, styles.movementDebitCell, { color: typeColor.text }]}>
                                    {typeTotals.periodDebit > 0 ? formatCurrency(typeTotals.periodDebit) : '-'}
                                </Text>
                                <Text style={[styles.totalValueCell, styles.movementCreditCell, { color: typeColor.text }]}>
                                    {typeTotals.periodCredit > 0 ? formatCurrency(typeTotals.periodCredit) : '-'}
                                </Text>
                                <Text style={[styles.totalValueCell, styles.endingDebitCell, {
                                    color: typeColor.text,
                                    fontWeight: 'bold'
                                }]}>
                                    {typeTotals.endingDebit > 0 ? formatCurrency(typeTotals.endingDebit) : '-'}
                                </Text>
                                <Text style={[styles.totalValueCell, styles.endingCreditCell, {
                                    color: typeColor.text,
                                    fontWeight: 'bold'
                                }]}>
                                    {typeTotals.endingCredit > 0 ? formatCurrency(typeTotals.endingCredit) : '-'}
                                </Text>
                            </View>
                        </View>
                    );
                })}

                {/* Grand Totals */}
                <View style={styles.grandTotalRow} wrap={false}>
                    <Text style={styles.grandTotalLabel}>
                        GRAND TOTAL • {data.length} Akun
                    </Text>
                    <Text style={[styles.grandTotalValue, styles.openingDebitCell]}>
                        {formatCurrency(calculatedTotals.openingDebit)}
                    </Text>
                    <Text style={[styles.grandTotalValue, styles.openingCreditCell]}>
                        {formatCurrency(calculatedTotals.openingCredit)}
                    </Text>
                    <Text style={[styles.grandTotalValue, styles.movementDebitCell]}>
                        {formatCurrency(calculatedTotals.periodDebit)}
                    </Text>
                    <Text style={[styles.grandTotalValue, styles.movementCreditCell]}>
                        {formatCurrency(calculatedTotals.periodCredit)}
                    </Text>
                    <Text style={[styles.grandTotalValue, styles.endingDebitCell]}>
                        {formatCurrency(calculatedTotals.endingDebit)}
                    </Text>
                    <Text style={[styles.grandTotalValue, styles.endingCreditCell]}>
                        {formatCurrency(calculatedTotals.endingCredit)}
                    </Text>
                </View>

                {/* Balance Status */}
                <View style={isBalanced ? styles.balanceStatus : styles.unbalancedStatus} wrap={false}>
                    <Text style={isBalanced ? styles.balanceText : styles.unbalancedText}>
                        {isBalanced
                            ? '✓ TRIAL BALANCE SEIMBANG'
                            : `✗ TRIAL BALANCE TIDAK SEIMBANG • Selisih Saldo Akhir: ${formatCurrency(endingDifference)} • Selisih Mutasi: ${formatCurrency(movementDifference)}`
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
                <View style={styles.footer}>
                    <Text>Dokumen ini dihasilkan secara otomatis oleh ERP RYLIF MIKRO MANDIRI pada {currentDate}</Text>
                    <Text style={{ marginTop: 1 }}>Halaman {currentPage} dari {totalPages}</Text>
                </View>
            </Page>
        </Document>
    );
};

export default TrialBalancePDF;