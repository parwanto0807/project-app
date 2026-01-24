import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
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
        alignItems: 'flex-start', // Logo rata atas (Top Alignment)
    },
    logo: {
        width: 80,
        height: 80,
        marginRight: 20,
        objectFit: 'contain',
        marginTop: -30, // Adjust vertical position upwards
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
    tableContainer: {
        marginVertical: 10,
    },
    table: {
        width: '100%',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        minHeight: 24,
        alignItems: 'center',
    },
    tableHeader: {
        backgroundColor: '#f1f5f9',
        borderBottomWidth: 2,
        borderBottomColor: '#cbd5e1',
        fontWeight: 'bold',
    },
    tableCell: {
        paddingVertical: 6,
        paddingHorizontal: 8,
        fontSize: 9,
        flexDirection: 'column',
        justifyContent: 'center',
    },
    codeCell: {
        width: '15%',
    },
    nameCell: {
        width: '55%',
    },
    amountCell: {
        width: '30%',
        textAlign: 'right', // Revert to textAlign for text alignment
        flexGrow: 1,
    },
    sectionHeader: {
        backgroundColor: '#f8fafc',
        fontWeight: 'bold',
        fontSize: 10,
        color: '#334155',
        paddingVertical: 8,
    },
    subtotalRow: {
        backgroundColor: '#f1f5f9',
        fontWeight: 'bold',
        borderTopWidth: 1,
        borderTopColor: '#cbd5e1',
    },
    profitRow: {
        backgroundColor: '#10b981',
        color: 'white',
        fontWeight: 'bold',
        fontSize: 11,
        marginTop: 10,
    },
    grossProfitRow: {
        backgroundColor: '#3b82f6',
        color: 'white',
        fontWeight: 'bold',
        fontSize: 11,
        marginTop: 10,
    },
    separator: {
        height: 20,
    },
    summaryContainer: {
        marginTop: 30,
        padding: 15,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 4,
    },
    summaryTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#334155',
    },
    summaryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    summaryItem: {
        flex: 1,
        paddingHorizontal: 10,
    },
    summaryLabel: {
        fontSize: 9,
        color: '#64748b',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    signatureContainer: {
        marginTop: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 50,
    },
    signatureBox: {
        alignItems: 'center',
        width: '45%',
    },
    signatureLine: {
        width: '100%',
        height: 1,
        backgroundColor: '#000',
        marginTop: 60,
        marginBottom: 8,
    },
    signatureName: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    signatureTitle: {
        fontSize: 9,
        color: '#64748b',
        marginTop: 2,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 9,
        color: '#94a3b8',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 10,
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

export interface IncomeStatementData {
    revenue: ReportSection;
    cogs: ReportSection;
    grossProfit: number;
    expenses: ReportSection;
    netProfit: number;
}

interface IncomeStatementPDFProps {
    data: IncomeStatementData;
    period: {
        startDate: string;
        endDate: string;
    };
    logoSrc?: string;
    salesOrderName?: string;
}

const PdfImage = ({ src, style }: { src?: string; style?: any }) => {
    if (!src) {
        return (
            <View style={[styles.logo, style, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#008000', fontSize: 12, textAlign: 'center' }}>
                    LOGO
                </Text>
            </View>
        );
    }
    return <Image src={src} style={style} />;
};

const TableRow = ({ children, style }: { children: React.ReactNode; style?: any }) => (
    <View style={[styles.tableRow, style]}>{children}</View>
);

const TableCell = ({ children, style }: { children?: React.ReactNode; style?: any }) => (
    <View style={[styles.tableCell, style]}>
        {typeof children === 'string' || typeof children === 'number' ? (
            <Text style={{ width: '100%' }}>{children}</Text>
        ) : (
            children || null
        )}
    </View>
);

const IncomeStatementPDF = ({ data, period, logoSrc, salesOrderName }: IncomeStatementPDFProps) => {
    const currentDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const startDate = new Date(period.startDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const endDate = new Date(period.endDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const isProfitable = data.netProfit > 0;
    const grossMargin = data.revenue.total > 0 ? (data.grossProfit / data.revenue.total) * 100 : 0;
    const netMargin = data.revenue.total > 0 ? (data.netProfit / data.revenue.total) * 100 : 0;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Watermark */}
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: -1,
                }}>
                    <Text style={{
                        fontSize: 60,
                        color: 'rgba(0, 128, 0, 0.1)',
                        fontWeight: 'bold',
                        transform: 'rotate(-45deg)',
                    }}>
                        CONFIDENTIAL
                    </Text>
                </View>

                {/* Header dengan Logo dan Info Perusahaan */}
                <View style={styles.headerContainer}>
                    <PdfImage style={styles.logo} src={logoSrc} />
                    <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>PT. RYLIF MIKRO MANDIRI</Text>
                        <Text style={styles.companyAddress}>
                            Jln. Arjuna RT. 04/RW. 36, Kampung Pulo Resident 1 No. 6
                        </Text>
                        <Text style={styles.companyAddress}>
                            Kampung Pulo Warung Asem, Sumber Jaya, Bekasi - 17510, Indonesia
                        </Text>
                        <Text style={styles.companyContact}>
                            Phone: 0857-7414-8874 | Email: rylifmikromandiri@gmail.com
                        </Text>
                    </View>
                </View>

                {/* Judul dan Periode */}
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>INCOME STATEMENT</Text>
                    {salesOrderName ? (
                        <Text style={{ fontSize: 10, color: '#3b82f6', marginBottom: 4, fontWeight: 'bold' }}>
                            Project: {salesOrderName}
                        </Text>
                    ) : null}
                    <Text style={styles.period}>
                        Periode: {startDate} - {endDate}
                    </Text>
                    <Text style={{ fontSize: 9, color: '#64748b' }}>
                        Dicetak pada: {currentDate}
                    </Text>
                </View>

                {/* Tabel Income Statement */}
                <View style={styles.tableContainer}>
                    {/* Header Tabel */}
                    <TableRow style={styles.tableHeader}>
                        <TableCell style={[styles.tableCell, styles.codeCell]}>
                            <Text>Kode</Text>
                            <Text style={{ fontSize: 8, color: '#64748b', fontStyle: 'italic' }}>Code</Text>
                        </TableCell>
                        <TableCell style={[styles.tableCell, styles.nameCell]}>
                            <Text>Nama Akun</Text>
                            <Text style={{ fontSize: 8, color: '#64748b', fontStyle: 'italic' }}>Account Name</Text>
                        </TableCell>
                        <TableCell style={[styles.tableCell, styles.amountCell]}>
                            <Text>Jumlah</Text>
                            <Text style={{ fontSize: 8, color: '#64748b', fontStyle: 'italic' }}>Amount</Text>
                        </TableCell>
                    </TableRow>

                    {/* REVENUE SECTION */}
                    <TableRow style={styles.sectionHeader}>
                        <TableCell style={[styles.tableCell, { width: '100%' }]}>
                            <Text>PENDAPATAN</Text>
                            <Text style={{ fontSize: 8, color: '#64748b', fontStyle: 'italic' }}>REVENUE</Text>
                        </TableCell>
                    </TableRow>

                    {data.revenue.accounts.map((account: AccountData) => (
                        <TableRow key={account.id}>
                            <TableCell style={[styles.tableCell, styles.codeCell]}>{account.code}</TableCell>
                            <TableCell style={[styles.tableCell, styles.nameCell]}>{account.name}</TableCell>
                            <TableCell style={[styles.tableCell, styles.amountCell]}>
                                {/* FIX: Gunakan formatCurrency dengan argumen number */}
                                {formatCurrency(account.amount)}
                            </TableCell>
                        </TableRow>
                    ))}

                    <TableRow style={styles.subtotalRow}>
                        <TableCell style={[styles.tableCell, styles.codeCell]}></TableCell>
                        <TableCell style={[styles.tableCell, styles.nameCell]}>
                            <Text>Total Pendapatan</Text>
                            <Text style={{ fontSize: 8, color: '#64748b', fontStyle: 'italic' }}>Total Revenue</Text>
                        </TableCell>
                        <TableCell style={[styles.tableCell, styles.amountCell]}>
                            {formatCurrency(data.revenue.total)}
                        </TableCell>
                    </TableRow>

                    {/* COGS SECTION */}
                    <View style={styles.separator} />

                    <TableRow style={styles.sectionHeader}>
                        <TableCell style={[styles.tableCell, { width: '100%' }]}>
                            <Text>BEBAN POKOK</Text>
                            <Text style={{ fontSize: 8, color: '#64748b', fontStyle: 'italic' }}>COST OF GOODS SOLD</Text>
                        </TableCell>
                    </TableRow>

                    {data.cogs.accounts.map((account: AccountData) => (
                        <TableRow key={account.id}>
                            <TableCell style={[styles.tableCell, styles.codeCell]}>{account.code}</TableCell>
                            <TableCell style={[styles.tableCell, styles.nameCell]}>{account.name}</TableCell>
                            <TableCell style={[styles.tableCell, styles.amountCell]}>
                                {formatCurrency(account.amount)}
                            </TableCell>
                        </TableRow>
                    ))}

                    <TableRow style={styles.subtotalRow}>
                        <TableCell style={[styles.tableCell, styles.codeCell]}></TableCell>
                        <TableCell style={[styles.tableCell, styles.nameCell]}>
                            <Text>Total Beban Pokok Penjualan</Text>
                            <Text style={{ fontSize: 8, color: '#64748b', fontStyle: 'italic' }}>Total COGS</Text>
                        </TableCell>
                        <TableCell style={[styles.tableCell, styles.amountCell]}>
                            {formatCurrency(data.cogs.total)}
                        </TableCell>
                    </TableRow>

                    {/* GROSS PROFIT */}
                    <TableRow style={styles.grossProfitRow}>
                        <TableCell style={[styles.tableCell, styles.codeCell]}></TableCell>
                        <TableCell style={[styles.tableCell, styles.nameCell]}>
                            <Text>LABA KOTOR</Text>
                            <Text style={{ fontSize: 9, color: '#e2e8f0', fontStyle: 'italic' }}>GROSS PROFIT</Text>
                        </TableCell>
                        <TableCell style={[styles.tableCell, styles.amountCell]}>
                            {formatCurrency(data.grossProfit)}
                        </TableCell>
                    </TableRow>

                    {/* EXPENSES SECTION */}
                    <View style={styles.separator} />

                    <TableRow style={styles.sectionHeader}>
                        <TableCell style={[styles.tableCell, { width: '100%' }]}>
                            <Text>BEBAN OPERASIONAL</Text>
                            <Text style={{ fontSize: 8, color: '#64748b', fontStyle: 'italic' }}>OPERATING EXPENSES</Text>
                        </TableCell>
                    </TableRow>

                    {data.expenses.accounts.map((account: AccountData) => (
                        <TableRow key={account.id}>
                            <TableCell style={[styles.tableCell, styles.codeCell]}>{account.code}</TableCell>
                            <TableCell style={[styles.tableCell, styles.nameCell]}>{account.name}</TableCell>
                            <TableCell style={[styles.tableCell, styles.amountCell]}>
                                {formatCurrency(account.amount)}
                            </TableCell>
                        </TableRow>
                    ))}

                    <TableRow style={styles.subtotalRow}>
                        <TableCell style={[styles.tableCell, styles.codeCell]}></TableCell>
                        <TableCell style={[styles.tableCell, styles.nameCell]}>
                            <Text>Total Beban Operasional</Text>
                            <Text style={{ fontSize: 8, color: '#64748b', fontStyle: 'italic' }}>Total Expenses</Text>
                        </TableCell>
                        <TableCell style={[styles.tableCell, styles.amountCell]}>
                            {formatCurrency(data.expenses.total)}
                        </TableCell>
                    </TableRow>

                    {/* NET PROFIT */}
                    <TableRow style={[styles.profitRow, { backgroundColor: isProfitable ? '#10b981' : '#ef4444' }]}>
                        <TableCell style={[styles.tableCell, styles.codeCell]}></TableCell>
                        <TableCell style={[styles.tableCell, styles.nameCell]}>
                            <Text>{isProfitable ? 'LABA BERSIH' : 'RUGI BERSIH'}</Text>
                            <Text style={{ fontSize: 9, color: '#e2e8f0', fontStyle: 'italic' }}>NET {isProfitable ? 'PROFIT' : 'LOSS'}</Text>
                        </TableCell>
                        <TableCell style={[styles.tableCell, styles.amountCell]}>
                            {formatCurrency(data.netProfit)}
                        </TableCell>
                    </TableRow>
                </View>

                {/* Summary Metrics */}
                <View style={styles.summaryContainer}>
                    <Text style={styles.summaryTitle}>RINGKASAN FINANSIAL</Text>
                    <View style={styles.summaryGrid}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Margin Kotor (Gross Margin)</Text>
                            <Text style={styles.summaryValue}>{grossMargin.toFixed(1)}%</Text>
                            <Text style={{ fontSize: 8, color: '#64748b' }}>
                                {formatCurrency(data.grossProfit)}
                            </Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Margin Bersih (Net Margin)</Text>
                            <Text style={styles.summaryValue}>{netMargin.toFixed(1)}%</Text>
                            <Text style={{ fontSize: 8, color: '#64748b' }}>
                                {formatCurrency(data.netProfit)}
                            </Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Status</Text>
                            <Text style={[styles.summaryValue, { color: isProfitable ? '#10b981' : '#ef4444' }]}>
                                {isProfitable ? 'UNTUNG (PROFIT)' : 'RUGI (LOSS)'}
                            </Text>
                            <Text style={{ fontSize: 8, color: '#64748b' }}>
                                {currentDate}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Tanda Tangan */}
                <View style={styles.signatureContainer}>
                    <View style={styles.signatureBox}>
                        <View style={styles.signatureLine} />
                        {/* <Text style={styles.signatureName}>( ........................... )</Text> */}
                        <Text style={styles.signatureTitle}>Finance Manager</Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <View style={styles.signatureLine} />
                        {/* <Text style={styles.signatureName}>( ........................... )</Text> */}
                        <Text style={styles.signatureTitle}>Accounting Supervisor</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>Dokumen ini dibuat secara otomatis oleh sistem RYLIF MIKRO MANDIRI</Text>
                    <Text>Halaman 1 dari 1</Text>
                </View>
            </Page>
        </Document>
    );
};

export default IncomeStatementPDF;