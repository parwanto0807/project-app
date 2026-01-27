import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image,
} from '@react-pdf/renderer';
import { ChartOfAccountsWithRelations, CoaPostingType } from '@/types/coa';

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        padding: 30,
        fontSize: 8,
        color: '#1e293b',
    },
    headerContainer: {
        flexDirection: 'row',
        marginBottom: 10,
        borderBottomWidth: 1.5,
        borderBottomColor: '#3b82f6',
        paddingBottom: 8,
        alignItems: 'flex-start',
    },
    logo: {
        width: 50,
        height: 50,
        marginRight: 15,
        objectFit: 'contain',
    },
    companyInfo: {
        flex: 1,
    },
    companyName: {
        color: '#1e3a8a',
        fontWeight: 'bold',
        fontSize: 11,
        marginBottom: 2,
    },
    companyAddress: {
        fontSize: 7,
        lineHeight: 1.3,
        color: '#64748b',
    },
    titleContainer: {
        marginBottom: 15,
        textAlign: 'center',
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0f172a',
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 9,
        color: '#64748b',
        marginTop: 2,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: '#cbd5e1',
        fontWeight: 'bold',
        minHeight: 20,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#cbd5e1',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#e2e8f0',
        minHeight: 20,
        alignItems: 'center',
    },
    headerRow: {
        backgroundColor: '#eff6ff',
    },
    cell: {
        paddingHorizontal: 4,
        fontSize: 7,
    },
    codeCell: { width: '15%' },
    nameCell: { width: '35%' },
    typeCell: { width: '12%' },
    statusCell: { width: '10%' },
    balanceCell: { width: '13%' },
    postingCell: { width: '15%' },

    // Hierarchy styling
    indentGuide: {
        borderLeftWidth: 0.5,
        borderLeftColor: '#cbd5e1',
        height: '100%',
        marginLeft: 8,
    },
    textHeader: {
        fontWeight: 'bold',
        color: '#1e3a8a',
    },
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 6,
        color: '#94a3b8',
        borderTopWidth: 0.5,
        borderTopColor: '#e2e8f0',
        paddingTop: 5,
    },
    metaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        fontSize: 7,
        color: '#475569',
    }
});

interface ChartOfAccountsPDFProps {
    data: ChartOfAccountsWithRelations[];
    logoSrc?: string;
}

const ChartOfAccountsPDF = ({ data, logoSrc }: ChartOfAccountsPDFProps) => {
    const currentDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const getIndentLevel = (coa: ChartOfAccountsWithRelations, allCoas: ChartOfAccountsWithRelations[]) => {
        let level = 0;
        let currentParentId = coa.parentId;
        while (currentParentId) {
            level++;
            if (level > 10) break;
            const parent = allCoas.find(c => c.id === currentParentId);
            if (parent) {
                currentParentId = parent.parentId;
            } else {
                break;
            }
        }
        return level;
    };

    return (
        <Document title="Chart of Accounts Report">
            <Page size="A4" style={styles.page}>
                {/* Header matching GeneralLedgerPDF */}
                <View style={styles.headerContainer}>
                    {logoSrc && <Image src={logoSrc} style={styles.logo} />}
                    <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>PT. RYLIF MIKRO MANDIRI</Text>
                        <Text style={styles.companyAddress}>Jln. Arjuna RT. 04/RW. 36, Kampung Pulo Resident 1 No. 6</Text>
                        <Text style={styles.companyAddress}>Bekasi - 17510, Indonesia</Text>
                        <Text style={styles.companyAddress}>Phone: 0857-7414-8874 | Email: rylifmikromandiri@gmail.com</Text>
                    </View>
                </View>

                {/* Title */}
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>DAFTAR AKUN (CHART OF ACCOUNTS)</Text>
                    <Text style={styles.subtitle}>Ringkasan struktur akun keuangan perusahaan</Text>
                </View>

                {/* Metadata */}
                <View style={styles.metaContainer}>
                    <Text>Dicetak pada: {currentDate}</Text>
                    <Text>Total Akun: {data.length}</Text>
                </View>

                {/* Table Header */}
                <View style={styles.tableHeader}>
                    <Text style={[styles.cell, styles.codeCell]}>KODE</Text>
                    <Text style={[styles.cell, styles.nameCell]}>NAMA AKUN</Text>
                    <Text style={[styles.cell, styles.typeCell]}>TIPE</Text>
                    <Text style={[styles.cell, styles.statusCell]}>STATUS</Text>
                    <Text style={[styles.cell, styles.balanceCell]}>BALANS</Text>
                    <Text style={[styles.cell, styles.postingCell]}>POSTING</Text>
                </View>

                {/* Table Body */}
                {data.map((coa, index) => {
                    const indentLevel = getIndentLevel(coa, data);
                    const isHeader = coa.postingType === CoaPostingType.HEADER;

                    return (
                        <View
                            key={coa.id || index}
                            style={[
                                styles.tableRow,
                                isHeader ? styles.headerRow : {}
                            ]}
                        >
                            <Text style={[styles.cell, styles.codeCell, isHeader ? styles.textHeader : {}]}>
                                {coa.code}
                            </Text>

                            <View style={[styles.cell, styles.nameCell, { flexDirection: 'row', alignItems: 'center' }]}>
                                {Array.from({ length: indentLevel }).map((_, i) => (
                                    <View key={i} style={{ width: 12, height: '100%', borderLeftWidth: 0.5, borderLeftColor: '#cbd5e1', marginLeft: 4 }} />
                                ))}
                                <Text style={[
                                    { marginLeft: indentLevel > 0 ? 4 : 0 },
                                    isHeader ? styles.textHeader : {}
                                ]}>
                                    {coa.name}
                                </Text>
                            </View>

                            <Text style={[styles.cell, styles.typeCell]}>{coa.type}</Text>
                            <Text style={[styles.cell, styles.statusCell]}>{coa.status}</Text>
                            <Text style={[styles.cell, styles.balanceCell]}>{coa.normalBalance}</Text>
                            <Text style={[styles.cell, styles.postingCell]}>{coa.postingType}</Text>
                        </View>
                    );
                })}

                {/* Footer */}
                <View style={styles.footer} fixed>
                    <Text>Dokumen ini dihasilkan secara otomatis oleh ERP RYLIF MIKRO MANDIRI</Text>
                    <Text
                        style={{ marginTop: 2 }}
                        render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} dari ${totalPages}`}
                    />
                </View>
            </Page>
        </Document>
    );
};

export default ChartOfAccountsPDF;
